/**
 * POST /api/obras/[id]/amarrar-contrato
 *
 * Amarração automática contrato → obra → titulares.
 * Dado o contrato_origem_id da obra, preenche automaticamente:
 *   - contrato_id em obras_links_titulares (para titulares que coincidem)
 *   - controlado = true para esses titulares
 *   - editora_administradora_id = editora do contrato (se não definida)
 *   - status_contrato na obra
 *
 * Body (opcional):
 *   { contrato_id?: string }   → override do contrato a usar
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
  try {
    const body = await req.json()
    bodyContratoId = body?.contrato_id
  } catch { /* body vazio é ok */ }

  // 1. Buscar a obra
  const { data: obra } = await sb.from('obras')
    .select('id, contrato_origem_id, status_contrato, titulo')
    .eq('id', obraId)
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .single()

  if (!obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const contratoId = bodyContratoId ?? (obra as Record<string, unknown>).contrato_origem_id as string | null
  if (!contratoId) {
    return NextResponse.json({
      error: 'Obra sem contrato vinculado. Vincule um contrato à obra antes de amarrar.',
    }, { status: 422 })
  }

  // 2. Buscar o contrato (deve pertencer ao mesmo tenant)
  const { data: contrato } = await sb.from('contratos')
    .select('id, titular_id, editora_id, status_contrato, numero')
    .eq('id', contratoId)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (!contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado ou não pertence a este tenant' }, { status: 404 })
  }

  const ctr = contrato as Record<string, unknown>
  const titularIdContrato  = ctr.titular_id  as string | null
  const editoraIdContrato  = ctr.editora_id  as string | null

  // 3. Buscar titulares da obra
  const { data: titulares } = await sb.from('obras_links_titulares')
    .select('id, link_id, titular_id, controlado, contrato_id, editora_administradora_id')
    .eq('obra_id', obraId)
    .eq('tenant_id', usuario.tenant_id)

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
      }
      // Só define editora_administradora_id se ainda não estiver definida
      if (!t.editora_administradora_id && editoraIdContrato) {
        patch.editora_administradora_id = editoraIdContrato
      }
      atualizacoes.push({ id: t.id as string, patch })
    }
  }

  for (const { id, patch } of atualizacoes) {
    await sb.from('obras_links_titulares')
      .update(patch)
      .eq('id', id)
      .eq('tenant_id', usuario.tenant_id)
    amarrados++
  }

  // 5. Atualizar status_contrato da obra se o contrato estiver ativo
  const statusCtr = (ctr.status_contrato as string) ?? ''
  const contratoAtivo = ['ativo','assinado','vigente','aprovado','aprovado_admin'].includes(statusCtr)
  if (amarrados > 0 && contratoAtivo) {
    await sb.from('obras').update({ status_contrato: 'valido' })
      .eq('id', obraId).eq('tenant_id', usuario.tenant_id)
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
