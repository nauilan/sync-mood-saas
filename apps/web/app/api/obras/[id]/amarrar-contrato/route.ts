/**
 * POST /api/obras/[id]/amarrar-contrato
 *
 * Amarração automática contrato → obra → titulares.
 * Dado o contrato_origem_id da obra, preenche automaticamente:
 *   - contrato_id em obras_links_titulares (para titulares que coincidem)
 *   - controlado = true para esses titulares
 *   - status_controle = controlado
 *   - editora_original_id / editora_administradora_id
 *   - percentuais Brasil/Exterior, data e metadados do contrato
 *   - status_contrato na obra
 *
 * Body (opcional):
 *   { contrato_id?: string, validacao_declaratoria?: boolean, referencia_documental?: string, observacao_validacao?: string }   → override do contrato a usar
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function getToken(req: NextRequest): string {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const chunks: string[] = []
  for (const c of req.cookies.getAll()) {
    const m = c.name.match(/auth-token\.(\d+)$/)
    if (m) { chunks[parseInt(m[1])] = c.value; continue }
    if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) { chunks[0] = c.value }
  }
  const joined = chunks.filter(Boolean).join('')
  if (joined) {
    try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) return p.access_token } catch { /* */ }
    try { const p = JSON.parse(joined); if (p?.access_token) return p.access_token } catch { /* */ }
  }
  return ''
}

async function fetchObraCompat(sb: any, obraId: string, tenantId: string) {
  const tentativaNova = await sb.from('obras')
    .select('id, contrato_origem_id, status_contrato, titulo')
    .eq('id', obraId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  if (!tentativaNova.error && tentativaNova.data) return tentativaNova.data

  const tentativaLegada = await sb.from('obras')
    .select('id, contrato_origem_id, titulo')
    .eq('id', obraId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  return tentativaLegada.data ?? null
}

async function fetchContratoCompat(sb: any, contratoId: string, tenantId: string) {
  const tentativaNova = await sb.from('contratos')
    .select('id, titular_id, editora_id, status_contrato, numero, data_inicio, tipo, territorio, prazo')
    .eq('id', contratoId)
    .eq('tenant_id', tenantId)
    .single()

  if (!tentativaNova.error && tentativaNova.data) return tentativaNova.data

  const tentativaLegada = await sb.from('contratos')
    .select('id, titular_id, editora_id, status, numero, data_inicio, tipo, territorio')
    .eq('id', contratoId)
    .eq('tenant_id', tenantId)
    .single()

  if (!tentativaLegada.data) return null

  return {
    ...tentativaLegada.data,
    status_contrato: (tentativaLegada.data as any).status ?? null,
    prazo: null,
  }
}

async function fetchTitularesCompat(sb: any, obraId: string, tenantId: string) {
  const tentativaNova = await sb.from('obras_links_titulares')
    .select('id, link_id, titular_id, controlado, contrato_id, editora_original_id, editora_administradora_id, percentual, percentual_exec_publica')
    .eq('obra_id', obraId)
    .eq('tenant_id', tenantId)

  if (!tentativaNova.error && (tentativaNova.data?.length ?? 0) > 0) return tentativaNova.data ?? []

  const tentativaLegada = await sb.from('obras_links_titulares')
    .select('id, obra_link_id, titular_id, controlado, contrato_id, editora_id, editora_original_id, editora_administradora_id, status_controle, percentual_exec_publica')
    .eq('obra_id', obraId)
    .eq('tenant_id', tenantId)

  return ((tentativaLegada.data ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: item.id,
    link_id: item.obra_link_id,
    titular_id: item.titular_id,
    controlado: item.controlado,
    contrato_id: item.contrato_id ?? null,
    editora_original_id: item.editora_original_id ?? item.editora_id ?? null,
    editora_administradora_id: item.editora_administradora_id,
    status_controle: item.status_controle ?? null,
    percentual: item.percentual_exec_publica ?? null,
    percentual_exec_publica: item.percentual_exec_publica ?? null,
  }))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  if (!usuario?.tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: obraId } = await params

  let bodyContratoId: string | undefined
  let validacaoDeclaratoria = false
  let referenciaDocumental: string | null = null
  let observacaoValidacao: string | null = null
  try {
    const body = await req.json()
    bodyContratoId = body?.contrato_id
    validacaoDeclaratoria = body?.validacao_declaratoria === true
    referenciaDocumental = body?.referencia_documental ?? null
    observacaoValidacao = body?.observacao_validacao ?? null
  } catch { /* body vazio é ok */ }

  // 1. Buscar a obra
  const obra = await fetchObraCompat(sb, obraId, usuario.tenant_id)

  if (!obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const contratoId = bodyContratoId ?? (obra as Record<string, unknown>).contrato_origem_id as string | null
  if (!contratoId) {
    return NextResponse.json({
      error: 'Obra sem contrato vinculado. Vincule um contrato à obra antes de amarrar.',
    }, { status: 422 })
  }

  // 2. Buscar o contrato (deve pertencer ao mesmo tenant)
  const contrato = await fetchContratoCompat(sb, contratoId, usuario.tenant_id)

  if (!contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado ou não pertence a este tenant' }, { status: 404 })
  }

  const ctr = contrato as Record<string, unknown>
  const titularIdContrato  = ctr.titular_id  as string | null
  const editoraIdContrato  = ctr.editora_id  as string | null

  // 3. Buscar titulares da obra
  const titulares = await fetchTitularesCompat(sb, obraId, usuario.tenant_id)

  if (!titulares || titulares.length === 0) {
    return NextResponse.json({
      error: 'Obra sem titulares cadastrados nos links. Cadastre as formações primeiro.',
    }, { status: 422 })
  }

  // 4. Amarrar: atualizar titulares que correspondem ao titular do contrato
  //    (ou todos, se não houver titular específico no contrato)
  let amarrados = 0
  const atualizacoes: Array<{ id: string; patch: Record<string, unknown> }> = []

  for (const t of titulares as Array<Record<string, unknown>>) {
    const corresponde = !titularIdContrato || t.titular_id === titularIdContrato

    if (corresponde) {
      const patch: Record<string, unknown> = {
        contrato_id: contratoId,
        controlado:  true,
        status_controle: 'controlado',
        editora_original_id: editoraIdContrato ?? null,
        percentual_controle_brasil: t.percentual_exec_publica ?? t.percentual ?? null,
        percentual_controle_exterior: t.percentual_exec_publica ?? t.percentual ?? null,
        data_contrato: ctr.data_inicio ?? null,
        tipo_contrato: ctr.tipo ?? null,
        territorio_contrato: ctr.territorio ?? null,
        prazo_contrato: ctr.prazo ?? null,
        validacao_contratual_origem: validacaoDeclaratoria ? 'declaratoria' : 'contrato',
        validado_por_usuario_id: usuario.id,
        validado_em: new Date().toISOString(),
        referencia_documental: referenciaDocumental,
        observacao_validacao: observacaoValidacao,
      }
      // Só define editora_administradora_id se ainda não estiver definida
      if (!t.editora_administradora_id && editoraIdContrato) {
        patch.editora_administradora_id = editoraIdContrato
      }
      atualizacoes.push({ id: t.id as string, patch })
    }
  }

  for (const { id, patch } of atualizacoes) {
    let atualizado = await sb.from('obras_links_titulares')
      .update(patch)
      .eq('id', id)
      .eq('tenant_id', usuario.tenant_id)
    if (atualizado.error) {
      const patchLegado: Record<string, unknown> = {
        contrato_id: patch.contrato_id ?? null,
        controlado: patch.controlado,
        status_controle: patch.status_controle ?? null,
        editora_original_id: patch.editora_original_id ?? null,
        editora_administradora_id: patch.editora_administradora_id ?? patch.editora_original_id ?? null,
      }
      atualizado = await sb.from('obras_links_titulares')
        .update(patchLegado)
        .eq('id', id)
        .eq('tenant_id', usuario.tenant_id)
    }
    amarrados++
  }

  // 5. Atualizar status_contrato da obra se o contrato estiver ativo
  const statusCtr = (ctr.status_contrato as string) ?? ''
  const contratoAtivo = ['ativo','assinado','vigente','aprovado','aprovado_admin'].includes(statusCtr)
  if (amarrados > 0 && contratoAtivo) {
    const tentativaNova = await sb.from('obras').update({
      status_contrato: 'valido',
      validacao_editorial_origem: validacaoDeclaratoria ? 'declaratoria' : 'contrato',
      validacao_editorial_referencia: referenciaDocumental,
      validacao_editorial_usuario_id: usuario.id,
      validacao_editorial_em: new Date().toISOString(),
    })
      .eq('id', obraId).eq('tenant_id', usuario.tenant_id)

    if (tentativaNova.error) {
      await sb.from('obras').update({
        contrato_origem_id: contratoId,
      }).eq('id', obraId).eq('tenant_id', usuario.tenant_id)
    }
  }

  // 6. Vincular na tabela obras_contratos (evitar duplicata)
  const { count: jaVinculado } = await sb.from('obras_contratos')
    .select('*', { count: 'exact', head: true })
    .eq('obra_id', obraId)
    .eq('contrato_id', contratoId)
  if (!jaVinculado || jaVinculado === 0) {
    await sb.from('obras_contratos').insert({
      obra_id:    obraId,
      tenant_id:  usuario.tenant_id,
      contrato_id: contratoId,
      tipo:       'sistema',
      vigente:    true,
    })
  }

  await logAudit({
    tenant_id:       usuario.tenant_id,
    usuario_id:      usuario.id,
    acao:            'amarrar_contrato',
    modulo:          'obras',
    tabela_afetada:  'obras_links_titulares',
    registro_id:     obraId,
    dados_novos:     { contrato_id: contratoId, titulares_amarrados: amarrados },
    origem_execucao: 'usuario',
  })

  return NextResponse.json({
    data: {
      ok: true,
      obra_id:             obraId,
      contrato_id:         contratoId,
      contrato_numero:     ctr.numero,
      titulares_amarrados: amarrados,
      status_contrato_atualizado: amarrados > 0 && contratoAtivo ? 'valido' : null,
    }
  })
}
