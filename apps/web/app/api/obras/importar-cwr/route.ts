import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

function getAuthToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookies = req.cookies.getAll()
  for (const cookie of cookies) {
    if (cookie.name.includes('auth-token') && !cookie.name.includes('.')) {
      try {
        const p = JSON.parse(decodeURIComponent(cookie.value))
        return p?.access_token ?? null
      } catch { /* ignorar */ }
    }
  }
  return null
}

async function sbFetch(path: string, opts: RequestInit, token: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers as Record<string, string> ?? {}),
    },
  })
}

// ── POST /api/obras/importar-cwr ────────────────────────────────
export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }

  const token = getAuthToken(req) ?? ANON_KEY

  let body: {
    obras: Array<Record<string, unknown>>
    titulares: Array<Record<string, unknown>>
    tenant_id?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  let tenantId = body.tenant_id ?? null

  // Resolver tenant_id pelo JWT
  if (!tenantId && token !== ANON_KEY) {
    try {
      const userInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      const userId = userInfo.sub
      if (userId) {
        const r = await sbFetch(
          `usuarios?auth_user_id=eq.${userId}&select=tenant_id&limit=1`,
          { method: 'GET' }, token
        )
        const rows = await r.json()
        tenantId = rows?.[0]?.tenant_id ?? null
      }
    } catch { /* ignorar */ }
  }

  // Fallback: primeiro tenant
  if (!tenantId) {
    try {
      const r = await sbFetch(`tenants?select=id&limit=1`, { method: 'GET' }, token)
      const rows = await r.json()
      tenantId = rows?.[0]?.id ?? null
    } catch { /* ignorar */ }
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })
  }

  const result = {
    obras_saved: 0,
    titulares_pf_saved: 0,
    titulares_pj_saved: 0,
    editoras_precadastro: 0,
    errors: [] as string[],
  }

  // ── 1. Separar PF (autores SWR) e PJ (editoras SPU) ─────────────────────────
  const titularesPF = (body.titulares ?? []).filter(
    (t: Record<string, unknown>) => t.tipo !== 'pessoa_juridica'
  )
  const titularesPJ = (body.titulares ?? []).filter(
    (t: Record<string, unknown>) => t.tipo === 'pessoa_juridica'
  )

  // ── 2. Upsert autores (PF) na tabela titulares ───────────────────────────────
  if (titularesPF.length > 0) {
    const pfData = titularesPF.map((t: Record<string, unknown>) => ({
      tenant_id:             tenantId,
      tipo:                  'autor',
      pessoa:                'PF',
      nome_completo:         t.nome,
      ipi:                   t.ipi ?? null,
      codigo_ipi:            t.ipi ?? null,
      status:                'pre_cadastro',
      codigo_interno_legado: t.codigo_interno_legado ?? t.sequence_code ?? null,
      codigo_sequence_cwr:   t.codigo_sequence_cwr ?? t.sequence_code ?? null,
      origem_importacao:     'cwr',
    }))

    const r = await sbFetch(`titulares`, {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,count=exact' },
      body: JSON.stringify(pfData),
    }, token)

    if (!r.ok) {
      const err = await r.json()
      result.errors.push(`Titulares PF: ${JSON.stringify(err)}`)
    } else {
      result.titulares_pf_saved = pfData.length
    }
  }

  // ── 3. Upsert editoras (PJ) na tabela titulares (pessoa=PJ) ─────────────────
  if (titularesPJ.length > 0) {
    const pjData = titularesPJ.map((t: Record<string, unknown>) => ({
      tenant_id:             tenantId,
      tipo:                  'editora',
      pessoa:                'PJ',
      nome_completo:         t.nome,
      ipi:                   t.ipi ?? null,
      codigo_ipi:            t.ipi ?? null,
      status:                'pre_cadastro',
      codigo_interno_legado: t.codigo_interno_legado ?? t.sequence_code ?? null,
      codigo_sequence_cwr:   t.codigo_sequence_cwr ?? t.sequence_code ?? null,
      origem_importacao:     'cwr',
    }))

    const r = await sbFetch(`titulares`, {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,count=exact' },
      body: JSON.stringify(pjData),
    }, token)

    if (!r.ok) {
      const err = await r.json()
      result.errors.push(`Titulares PJ: ${JSON.stringify(err)}`)
    } else {
      result.titulares_pj_saved = pjData.length
    }
  }

  // ── 4. Pré-cadastro de editoras na tabela `editoras` ────────────────────────
  // Cada SPU do CWR gera um registro em `editoras` para aparecer nos dropdowns
  // (Negócios entre Editoras, Contratos, etc.)
  if (titularesPJ.length > 0) {
    // Buscar editoras já existentes por nome para evitar duplicatas
    const nomesBusca = titularesPJ.map((t: Record<string, unknown>) =>
      String(t.nome ?? '').trim()
    ).filter(Boolean)

    let existentes: Array<{ id: string; nome_fantasia: string }> = []
    try {
      const nomesFiltro = nomesBusca.map(n => `nome_fantasia.ilike.${encodeURIComponent(n)}`).join(',')
      const r = await sbFetch(
        `editoras?select=id,nome_fantasia&or=(${nomesFiltro})&tenant_id=eq.${tenantId}`,
        { method: 'GET' }, token
      )
      if (r.ok) existentes = await r.json()
    } catch { /* ignorar */ }

    const existentesNomes = new Set(existentes.map(e => e.nome_fantasia.trim().toUpperCase()))

    const novasEditoras = titularesPJ
      .filter((t: Record<string, unknown>) => {
        const nome = String(t.nome ?? '').trim().toUpperCase()
        return nome && !existentesNomes.has(nome)
      })
      .map((t: Record<string, unknown>) => ({
        tenant_id:                  tenantId,
        razao_social:               String(t.nome ?? '').trim(),
        nome_fantasia:              String(t.nome ?? '').trim(),
        status:                     'ativo',
        codigo_ipi:                 t.ipi ?? null,
        // Campos de rastreabilidade CWR
        codigo_publisher_cwr:       t.codigo_interno_legado ?? t.sequence_code ?? null,
        tipo_editora:               (String(t.papel ?? '')).toUpperCase() === 'AM'
                                      ? 'master'
                                      : 'administrada',
        controlada:                 (String(t.papel ?? '')).toUpperCase() === 'AM',
        origem_importacao:          'cwr',
      }))

    if (novasEditoras.length > 0) {
      const r = await sbFetch(`editoras`, {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,count=exact' },
        body: JSON.stringify(novasEditoras),
      }, token)

      if (!r.ok) {
        const err = await r.json()
        result.errors.push(`Editoras pré-cadastro: ${JSON.stringify(err)}`)
      } else {
        result.editoras_precadastro = novasEditoras.length
      }
    }
  }

  // ── 5. Upsert obras ──────────────────────────────────────────────────────────
  if (body.obras?.length > 0) {
    const obrasData = body.obras.map((o: Record<string, unknown>) => ({
      tenant_id:                tenantId,
      titulo:                   o.titulo,
      titulo_alternativo:       o.titulo_original ?? null,
      iswc:                     o.iswc ?? null,
      idioma:                   o.idioma ?? 'PT',
      status:                   'ativa',
      codigo_obra:              o.codigo,
      origem_cadastro:          'migracao',
      status_iswc:              o.iswc ? 'recebido' : 'pendente',
      codigo_interno_legado:    o.codigo_interno_legado ?? o.codigo ?? null,
      codigo_obra_cwr_original: o.codigo_obra_cwr_original ?? o.codigo ?? null,
      backoffice_status:        'nao_enviada',
      origem_importacao:        'cwr',
    }))

    const r = await sbFetch(`obras`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(obrasData),
    }, token)

    const oData = await r.json()
    if (!r.ok) {
      result.errors.push(`Obras: ${JSON.stringify(oData)}`)
    } else {
      result.obras_saved = Array.isArray(oData) ? oData.length : obrasData.length
    }
  }

  return NextResponse.json(result, {
    status: result.errors.length === 0 ? 200 : 207,
  })
}
