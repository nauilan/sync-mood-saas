import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── POST /api/obras/importar-cwr ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }

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
    const { data: rows } = await sb.from('tenants').select('id').limit(1)
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
    const codigosNoCwr = todosTitulares
      .map((t: Record<string, unknown>) =>
        String(t.codigo_interno_legado ?? t.codigo_sequence_cwr ?? '').trim()
      )
      .filter(Boolean)

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

    const novos = todosTitulares.filter((t: Record<string, unknown>) => {
      const cod = String(t.codigo_interno_legado ?? t.codigo_sequence_cwr ?? '').trim()
      return !cod || !jaExistemCodigos.has(cod)
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
          .select('codigo_publisher_cwr')
          .eq('tenant_id', tenantId)
          .in('codigo_publisher_cwr', codigosEd)
        jaExistemEd = new Set(
          (existentesEd ?? []).map((e: any) => e.codigo_publisher_cwr?.trim()).filter(Boolean)
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
        const edPayload = novasEditoras.map((t: Record<string, unknown>) => {
          const papel = String(t.papel ?? '').trim().toUpperCase()
          return {
            tenant_id:            tenantId,
            razao_social:         String(t.nome ?? '').trim(),
            nome_fantasia:        String(t.nome ?? '').trim(),
            status:               'ativo',
            codigo_ipi:           t.ipi ?? null,
            codigo_publisher_cwr: String(t.codigo_interno_legado ?? '').trim() || null,
            tipo_editora:         papel === 'AM' ? 'master' : 'administrada',
            controlada:           papel === 'AM',
            origem_importacao:    'cwr',
          }
        })

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
