import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)
const SERVICE_KEY  = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY)

function getAuthToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.includes('auth-token') && !cookie.name.includes('.')) {
      try {
        const p = JSON.parse(decodeURIComponent(cookie.value))
        return p?.access_token ?? null
      } catch { /* ignorar */ }
    }
  }
  return null
}

async function sbGet(path: string, adminKey: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}` },
  })
  return r.ok ? r.json() : []
}

async function sbPost(path: string, body: unknown, adminKey: string, prefer = 'resolution=ignore-duplicates') {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: adminKey,
      Authorization: `Bearer ${adminKey}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: JSON.stringify(body),
  })
}

// ── POST /api/obras/importar-cwr ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }

  // Usa service role para garantir acesso mesmo sem auth cookie
  const adminKey = SERVICE_KEY || getAuthToken(req) || ANON_KEY

  let body: {
    obras: Array<Record<string, unknown>>
    titulares: Array<Record<string, unknown>>
    tenant_id?: string
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  // ── Resolver tenant_id ──────────────────────────────────────────────────────
  let tenantId = body.tenant_id ?? null

  if (!tenantId) {
    const token = getAuthToken(req)
    if (token && token !== ANON_KEY) {
      try {
        const userId = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub
        if (userId) {
          const rows = await sbGet(`usuarios?auth_user_id=eq.${userId}&select=tenant_id&limit=1`, adminKey)
          tenantId = rows?.[0]?.tenant_id ?? null
        }
      } catch { /* ignorar */ }
    }
  }

  if (!tenantId) {
    const rows = await sbGet(`tenants?select=id&limit=1`, adminKey)
    tenantId = rows?.[0]?.id ?? null
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })
  }

  const result = {
    obras_saved: 0,
    titulares_criados: 0,
    titulares_ja_existiam: 0,
    editoras_criadas: 0,
    editoras_ja_existiam: 0,
    errors: [] as string[],
  }

  // ── 1. Processar TODOS os titulares do CWR (autores + editoras) ─────────────
  const todosTitulares = body.titulares ?? []

  if (todosTitulares.length > 0) {
    // Coletar todos os codigos_internos que vêm no CWR
    const codigosNoCwr = todosTitulares
      .map((t: Record<string, unknown>) =>
        String(t.codigo_interno_legado ?? t.sequence_code ?? t.codigo_sequence_cwr ?? '').trim()
      )
      .filter(Boolean)

    // Buscar quais já existem no banco por codigo_interno_legado
    let jaExistemCodigos = new Set<string>()
    if (codigosNoCwr.length > 0) {
      try {
        const filtro = codigosNoCwr.map(c => `codigo_interno_legado.eq.${encodeURIComponent(c)}`).join(',')
        const existentes: Array<{ codigo_interno_legado: string }> = await sbGet(
          `titulares?tenant_id=eq.${tenantId}&select=codigo_interno_legado&or=(${filtro})`,
          adminKey
        )
        jaExistemCodigos = new Set(existentes.map(e => e.codigo_interno_legado?.trim()).filter(Boolean))
      } catch { /* ignorar — insere tudo e ignora duplicatas */ }
    }

    // Separar quem já existe e quem é novo
    const novos = todosTitulares.filter((t: Record<string, unknown>) => {
      const cod = String(t.codigo_interno_legado ?? t.sequence_code ?? t.codigo_sequence_cwr ?? '').trim()
      return !cod || !jaExistemCodigos.has(cod) // sem código = inserir tbm
    })

    result.titulares_ja_existiam = todosTitulares.length - novos.length

    if (novos.length > 0) {
      const payload = novos.map((t: Record<string, unknown>) => {
        const isPJ = String(t.tipo ?? '').includes('juridica') ||
                     ['E', 'AM', 'AQ', 'SE', 'ES'].includes(String(t.papel ?? '').trim().toUpperCase())
        const codigoCwr = String(t.codigo_interno_legado ?? t.sequence_code ?? t.codigo_sequence_cwr ?? '').trim()
        const codigoTitular = codigoCwr || `CWR-${Date.now().toString(36).slice(-4).toUpperCase()}`
        return {
          tenant_id:             tenantId,
          codigo_titular:        codigoTitular,
          tipo:                  isPJ ? 'editora' : 'autor',
          pessoa:                isPJ ? 'PJ' : 'PF',
          nome_completo:         String(t.nome ?? '').trim(),
          ipi:                   t.ipi ?? null,
          codigo_ipi:            t.ipi ?? null,
          status:                'ativo',
          codigo_interno_legado: codigoCwr || null,
          codigo_sequence_cwr:   String(t.codigo_sequence_cwr ?? t.sequence_code ?? '').trim() || null,
          origem_importacao:     'cwr',
        }
      })

      const r = await sbPost(`titulares`, payload, adminKey, 'resolution=ignore-duplicates,count=exact')
      if (!r.ok) {
        const err = await r.json()
        result.errors.push(`Titulares: ${JSON.stringify(err)}`)
      } else {
        result.titulares_criados = novos.length
      }
    }

    // ── 2. Pré-cadastrar editoras (PJ) também na tabela `editoras` ─────────────
    const editolasCwr = todosTitulares.filter((t: Record<string, unknown>) => {
      const papel = String(t.papel ?? '').trim().toUpperCase()
      const isPJ = String(t.tipo ?? '').includes('juridica') || ['E', 'AM', 'AQ', 'SE', 'ES'].includes(papel)
      return isPJ
    })

    if (editolasCwr.length > 0) {
      // Buscar editoras já existentes por codigo_publisher_cwr
      const codigosEd = editolasCwr
        .map((t: Record<string, unknown>) =>
          String(t.codigo_interno_legado ?? t.sequence_code ?? '').trim()
        )
        .filter(Boolean)

      let jaExistemEd = new Set<string>()
      if (codigosEd.length > 0) {
        try {
          const filtroEd = codigosEd.map(c => `codigo_publisher_cwr.eq.${encodeURIComponent(c)}`).join(',')
          const existentesEd: Array<{ codigo_publisher_cwr: string }> = await sbGet(
            `editoras?tenant_id=eq.${tenantId}&select=codigo_publisher_cwr&or=(${filtroEd})`,
            adminKey
          )
          // Também verificar por nome
          const nomesEd = editolasCwr.map((t: Record<string, unknown>) => String(t.nome ?? '').trim().toUpperCase())
          const filtroNome = nomesEd.map(n => `nome_fantasia.ilike.${encodeURIComponent(n)}`).join(',')
          const existentesNome: Array<{ nome_fantasia: string }> = await sbGet(
            `editoras?tenant_id=eq.${tenantId}&select=nome_fantasia&or=(${filtroNome})`,
            adminKey
          )
          jaExistemEd = new Set([
            ...existentesEd.map(e => e.codigo_publisher_cwr?.trim()).filter(Boolean),
          ])
          const jaExistemNomes = new Set(existentesNome.map(e => e.nome_fantasia?.trim().toUpperCase()).filter(Boolean))

          // Filtrar novas editoras
          const novasEditoras = editolasCwr.filter((t: Record<string, unknown>) => {
            const cod  = String(t.codigo_interno_legado ?? t.sequence_code ?? '').trim()
            const nome = String(t.nome ?? '').trim().toUpperCase()
            return (!cod || !jaExistemEd.has(cod)) && (!nome || !jaExistemNomes.has(nome))
          })

          result.editoras_ja_existiam = editolasCwr.length - novasEditoras.length

          if (novasEditoras.length > 0) {
            const edPayload = novasEditoras.map((t: Record<string, unknown>) => {
              const papel = String(t.papel ?? '').trim().toUpperCase()
              return {
                tenant_id:            tenantId,
                razao_social:         String(t.nome ?? '').trim(),
                nome_fantasia:        String(t.nome ?? '').trim(),
                status:               'ativo',
                codigo_ipi:           t.ipi ?? null,
                codigo_publisher_cwr: String(t.codigo_interno_legado ?? t.sequence_code ?? '').trim() || null,
                tipo_editora:         papel === 'AM' ? 'master' : 'administrada',
                controlada:           papel === 'AM',
                origem_importacao:    'cwr',
              }
            })

            const rEd = await sbPost(`editoras`, edPayload, adminKey, 'resolution=ignore-duplicates,count=exact')
            if (!rEd.ok) {
              const err = await rEd.json()
              result.errors.push(`Editoras: ${JSON.stringify(err)}`)
            } else {
              result.editoras_criadas = novasEditoras.length
            }
          }
        } catch (e) {
          result.errors.push(`Editoras check: ${String(e)}`)
        }
      }
    }
  }

  // ── 3. Upsert obras ──────────────────────────────────────────────────────────
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

    const r = await sbPost(`obras`, obrasData, adminKey, 'resolution=merge-duplicates,return=representation')
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
