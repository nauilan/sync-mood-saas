/**
 * POST /api/contratos/:id/sincronizar
 *
 * Consulta o status do documento no D4Sign e atualiza o contrato
 * quando o webhook não foi recebido (fallback manual).
 *
 * statusId D4Sign:
 *   4 = Finalizado (todos assinaram) → status = 'assinado'
 *   6 = Cancelado                    → status = 'rascunho'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'
import { getDocumentStatus } from '@/lib/d4sign'

export const maxDuration = 30

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contratoId } = await params

  // Autenticação
  const authHeader = req.headers.get('authorization') ?? ''
  const accessToken = authHeader.replace('Bearer ', '').trim()
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Configuração Supabase ausente' }, { status: 500 })
  }
  const sbUser = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  })
  const { data: { user } } = await sbUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Admin client indisponível' }, { status: 500 })

  // Buscar contrato
  const { data: contrato, error: fetchErr } = await sb
    .from('contratos')
    .select('id, status, tenant_id, numero, d4sign_uuid')
    .eq('id', contratoId)
    .is('deleted_at', null)
    .single()

  if (fetchErr || !contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  const d4signUuid = (contrato as Record<string, string>).d4sign_uuid
  if (!d4signUuid) {
    return NextResponse.json({ error: 'Contrato não tem d4sign_uuid — nunca foi enviado para assinatura.' }, { status: 422 })
  }

  // Consultar D4Sign
  let doc: Awaited<ReturnType<typeof getDocumentStatus>>
  try {
    doc = await getDocumentStatus(d4signUuid)
  } catch (err) {
    return NextResponse.json(
      { error: `Falha ao consultar D4Sign: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
      { status: 502 }
    )
  }

  // D4Sign statusId: 4=Finalizado, 6=Cancelado
  // Comparar como número e string para garantir compatibilidade com variações de resposta da API
  const sid = doc.statusId
  const isFinalizado = sid === 4 || (sid as unknown as string) === '4'
    || (doc.statusName ?? '').toLowerCase().includes('finalizado')
  const isCancelado  = sid === 6 || (sid as unknown as string) === '6'
    || (doc.statusName ?? '').toLowerCase().includes('cancelado')

  let novoStatus: string | null = null
  if (isFinalizado && contrato.status !== 'assinado') {
    novoStatus = 'assinado'
  } else if (isCancelado && contrato.status === 'aguardando_assinatura') {
    novoStatus = 'rascunho'
  }

  if (!novoStatus) {
    return NextResponse.json({
      ok: true,
      sincronizado: false,
      d4sign_status_id: doc.statusId,
      d4sign_status_name: doc.statusName,
      contrato_status: contrato.status,
      message: `D4Sign: ${doc.statusName ?? '?'} (id=${doc.statusId}). Nenhuma alteração necessária.`,
    })
  }

  const { error: updErr } = await sb
    .from('contratos')
    .update({
      status: novoStatus,
      d4sign_status: doc.statusId === 4 ? 'finalizado' : 'cancelado',
      data_assinatura: doc.statusId === 4 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contratoId)

  if (updErr) {
    return NextResponse.json({ error: `Erro ao atualizar contrato: ${updErr.message}` }, { status: 500 })
  }

  await logAudit({
    tenant_id: contrato.tenant_id,
    usuario_id: user.id,
    origem_execucao: 'usuario',
    acao: 'sincronizar_d4sign',
    modulo: 'contratos',
    tabela_afetada: 'contratos',
    registro_id: contratoId,
    dados_anteriores: { status: contrato.status },
    dados_novos: { status: novoStatus, d4sign_status_id: doc.statusId },
  })

  return NextResponse.json({
    ok: true,
    sincronizado: true,
    status_anterior: contrato.status,
    status_novo: novoStatus,
    d4sign_status_id: doc.statusId,
    d4sign_status_name: doc.statusName,
    message: novoStatus === 'assinado'
      ? 'Contrato marcado como assinado. Prossiga com a validação.'
      : 'Contrato cancelado no D4Sign. Status voltou para rascunho.',
  })
}
