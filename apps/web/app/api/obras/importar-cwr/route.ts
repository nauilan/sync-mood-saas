import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── POST /api/obras/importar-cwr ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) {
    return NextResponse.json({ error: 'Supabase não configurado (service_role ausente)' }, { status: 503 })
  }

  // ── Autenticar usuário via JWT ──────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
  }
  const { data: usuario } = await sb.from('usuarios')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) {
    return NextResponse.json({ error: 'Usuário não encontrado no sistema' }, { status: 403 })
  }
  if (!['master', 'admin', 'editora_administrada', 'atendimento'].includes(usuario.role)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }
  const tenantId: string = usuario.tenant_id

  let body: {
    obras: Array<Record<string, unknown>>
    titulares: Array<Record<string, unknown>>
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const result = {
    obras_saved: 0,
    titulares_criados: 0,
    titulares_ja_existiam: 0,
    editoras_criadas: 0,
    editoras_ja_existiam: 0,
    errors: [] as string[],
  }

  // ── 1. Processar TODOS os titulares do CWR (autores + editoras) ─────────────
  // Matching em 2 camadas: (1) codigo_interno_legado, (2) IPI/codigo_ipi
  const todosTitulares = body.titulares ?? []

  if (todosTitulares.length > 0) {
    const codigosNoCwr = todosTitulares
      .map((t: Record<string, unknown>) =>
        String(t.codigo_interno_legado ?? t.codigo_sequence_cwr ?? '').trim()
      )
      .filter(Boolean)

    const ipisNoCwr = todosTitulares
      .map((t: Record<string, unknown>) => String(t.ipi ?? '').trim())
      .filter(c => c && /\d{4,}/.test(c))

    // Layer 1: lookup por codigo_interno_legado
    let jaExistemCodigos = new Set<string>()
    if (codigosNoCwr.length > 0) {
      const { data: existentes } = await sb
        .from('titulares')
        .select('codigo_interno_legado')
        .eq('tenant_id', tenantId)
        .in('codigo_interno_legado', codigosNoCwr)
      jaExistemCodigos = new Set(
        (existentes ?? []).map((e: any) => e.codigo_interno_legado?.trim()).filter(Boolean)
      )
    }

    // Layer 2: lookup por IPI — evita duplicar titulares reais já cadastrados
    let jaExistemIpis = new Set<string>()
    if (ipisNoCwr.length > 0) {
      const { data: existentesPorIpi } = await sb
        .from('titulares')
        .select('codigo_ipi')
        .eq('tenant_id', tenantId)
        .in('codigo_ipi', ipisNoCwr)
      jaExistemIpis = new Set(
        (existentesPorIpi ?? []).map((e: any) => e.codigo_ipi?.trim()).filter(Boolean)
      )
      const { data: existentesPorIpiLegado } = await sb
        .from('titulares')
        .select('ipi')
        .eq('tenant_id', tenantId)
        .in('ipi', ipisNoCwr)
      for (const e of (existentesPorIpiLegado ?? []) as any[]) {
        if (e.ipi?.trim()) jaExistemIpis.add(e.ipi.trim())
      }
    }

    const novos = todosTitulares.filter((t: Record<string, unknown>) => {
      const cod = String(t.codigo_interno_legado ?? t.codigo_sequence_cwr ?? '').trim()
      const ipi = String(t.ipi ?? '').trim()
      if (cod && jaExistemCodigos.has(cod)) return false
      if (ipi && jaExistemIpis.has(ipi)) return false
      return true
    })

    result.titulares_ja_existiam = todosTitulares.length - novos.length

    if (novos.length > 0) {
      const payload = novos.map((t: Record<string, unknown>, idx: number) => {
        const isPJ = String(t.tipo ?? '').includes('juridica') ||
                     ['E', 'AM', 'AQ', 'SE', 'ES'].includes(String(t.papel ?? '').trim().toUpperCase())
        const codigoCwr = String(t.codigo_interno_legado ?? t.codigo_sequence_cwr ?? '').trim()
        const codigoTitular = codigoCwr || `CWR-${Date.now().toString(36).slice(-4).toUpperCase()}-${idx}`
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
          codigo_sequence_cwr:   String(t.codigo_sequence_cwr ?? '').trim() || null,
          origem_importacao:     'cwr',
        }
      })

      const { error: tErr } = await sb
        .from('titulares')
        .upsert(payload as any, { onConflict: 'tenant_id,codigo_titular', ignoreDuplicates: true })
      if (tErr) result.errors.push(`Titulares: ${tErr.message}`)
      else result.titulares_criados = novos.length
    }

    // ── 2. Pré-cadastrar editoras (PJ) também na tabela `editoras` ─────────────
    const editolasCwr = todosTitulares.filter((t: Record<string, unknown>) => {
      const papel = String(t.papel ?? '').trim().toUpperCase()
      const isPJ = String(t.tipo ?? '').includes('juridica') || ['E', 'AM', 'AQ', 'SE', 'ES'].includes(papel)
      return isPJ
    })

    if (editolasCwr.length > 0) {
      const codigosEd = editolasCwr
        .map((t: Record<string, unknown>) =>
          String(t.codigo_interno_legado ?? '').trim()
        )
        .filter(Boolean)

      let jaExistemEd = new Set<string>()
      if (codigosEd.length > 0) {
        const { data: existentesEd } = await sb
          .from('editoras')
          .select('codigo_interno')
          .eq('tenant_id', tenantId)
          .in('codigo_interno', codigosEd)
        jaExistemEd = new Set(
          (existentesEd ?? []).map((e: any) => e.codigo_interno?.trim()).filter(Boolean)
        )
      }

      const nomesEd = editolasCwr.map((t: Record<string, unknown>) => String(t.nome ?? '').trim().toUpperCase())
      let jaExistemNomes = new Set<string>()
      if (nomesEd.length > 0) {
        const { data: existentesNome } = await sb
          .from('editoras')
          .select('nome_fantasia')
          .eq('tenant_id', tenantId)
          .in('nome_fantasia', nomesEd)
        jaExistemNomes = new Set(
          (existentesNome ?? []).map((e: any) => e.nome_fantasia?.trim().toUpperCase()).filter(Boolean)
        )
      }

      const novasEditoras = editolasCwr.filter((t: Record<string, unknown>) => {
        const cod  = String(t.codigo_interno_legado ?? '').trim()
        const nome = String(t.nome ?? '').trim().toUpperCase()
        return (!cod || !jaExistemEd.has(cod)) && (!nome || !jaExistemNomes.has(nome))
      })

      result.editoras_ja_existiam = editolasCwr.length - novasEditoras.length

      if (novasEditoras.length > 0) {
        const edPayload = novasEditoras.map((t: Record<string, unknown>) => ({
            tenant_id:            tenantId,
            razao_social:         String(t.nome ?? '').trim(),
            nome_fantasia:        String(t.nome ?? '').trim(),
            status:               'ativo',
            codigo_ipi:           t.ipi ?? null,
            codigo_interno:       String(t.codigo_interno_legado ?? '').trim() || null,
            // ATENÇÃO — compatibilidade temporária:
            // tipo_editora não representa papel editorial (E, AM, SE).
            // O papel é definido em obras_participantes, não no cadastro da editora.
            // Qualquer editora criada via CWR é classificada como 'administrada'
            // apenas para compatibilidade com o campo atual.
            // TODO: migrar tipo_editora → categoria_cadastro ou perfil_operacional
            //       antes de habilitar regras de negócio baseadas neste campo.
            tipo_editora:         'administrada',
            controlada:           true,
            origem_importacao:    'cwr',
        }))

        const { error: eErr } = await sb
          .from('editoras')
          .upsert(edPayload as any, { ignoreDuplicates: true })
        if (eErr) result.errors.push(`Editoras: ${eErr.message}`)
        else result.editoras_criadas = novasEditoras.length
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

    const { data: oData, error: oErr } = await sb
      .from('obras')
      .upsert(obrasData as any, { onConflict: 'tenant_id,codigo_obra', ignoreDuplicates: false })
      .select('id')
    if (oErr) result.errors.push(`Obras: ${oErr.message}`)
    else result.obras_saved = (oData ?? []).length
  }

  return NextResponse.json(result, {
    status: result.errors.length === 0 ? 200 : 207,
  })
}
