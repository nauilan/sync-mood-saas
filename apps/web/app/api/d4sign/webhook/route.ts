/**
 * POST /api/d4sign/webhook
 *
 * Recebe eventos de status do D4Sign e atualiza o contrato correspondente.
 *
 * Configurar no D4Sign:
 *   Dashboard → Configurações → Webhooks → URL de Callback:
 *   https://sync-mood-saas.vercel.app/api/d4sign/webhook
 *
 * Payload enviado pelo D4Sign:
 *   type_post  — evento: 'signed_all' | 'signed' | 'unsigned' | 'cancel' | 'addSigners' | ...
 *   uuid       — UUID do documento D4Sign
 *   ...        — demais campos variáveis por evento
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAudit }                  from '@/lib/audit'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Mapeamento de eventos D4Sign ─────────────────────────────────────────────

type D4SignEvent =
  | 'signed_all'     // todos assinaram → contrato em vigor
  | 'signed'         // um signatário assinou
  | 'unsigned'       // signatário recusou
  | 'cancel'         // documento cancelado
  | 'addSigners'     // signatários adicionados
  | string

interface D4SignWebhookPayload {
  type_post?: D4SignEvent
  uuid?: string
  [key: string]: unknown
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let payload: D4SignWebhookPayload
  try {
    // D4Sign pode enviar form-urlencoded ou JSON dependendo da versão
    const contentType = req.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      payload = await req.json()
    } else {
      const text = await req.text()
      const params = new URLSearchParams(text)
      payload = Object.fromEntries(params.entries())
    }
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { type_post, uuid: d4signUuid } = payload

  if (!d4signUuid) {
    console.warn('[d4sign/webhook] Payload sem uuid:', payload)
    return NextResponse.json({ ok: true }) // aceitar para não gerar retries
  }

  console.log(`[d4sign/webhook] Evento: ${type_post} | Doc: ${d4signUuid}`)

  const sb = getAdminClient()
  if (!sb) {
    console.error('[d4sign/webhook] Admin client indisponível')
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }

  // Buscar contrato pelo d4sign_uuid
  const { data: contrato, error: findErr } = await sb
    .from('contratos')
    .select('id, status, tenant_id, numero')
    .eq('d4sign_uuid', d4signUuid)
    .is('deleted_at', null)
    .maybeSingle()

  if (findErr || !contrato) {
    console.warn(`[d4sign/webhook] Contrato não encontrado para d4sign_uuid=${d4signUuid}`)
    return NextResponse.json({ ok: true }) // aceitar silenciosamente
  }

  // Determinar novo status baseado no evento
  let novoStatus: string | null = null
  let novoD4signStatus: string | null = null
  let acao = 'd4sign_evento'

  switch (type_post) {
    case 'signed_all':
      // Todos assinaram → contrato em vigor
      if (contrato.status !== 'em_vigor') {
        novoStatus      = 'em_vigor'
        novoD4signStatus = 'finalizado'
        acao             = 'assinatura_concluida'
      }
      break

    case 'signed':
      // Um signatário assinou — manter aguardando_assinatura
      novoD4signStatus = 'aguardando_assinaturas'
      acao             = 'assinatura_parcial'
      break

    case 'unsigned':
      // Recusa — manter status mas registrar no audit
      acao = 'assinatura_recusada'
      break

    case 'cancel':
      // Cancelado no D4Sign — voltar para rascunho
      if (contrato.status === 'aguardando_assinatura') {
        novoStatus       = 'rascunho'
        novoD4signStatus = 'cancelado'
        acao             = 'assinatura_cancelada'
      }
      break

    default:
      acao = `d4sign_${type_post ?? 'evento_desconhecido'}`
  }

  // Atualizar contrato se necessário
  if (novoStatus !== null || novoD4signStatus !== null) {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (novoStatus      !== null) updates.status         = novoStatus
    if (novoD4signStatus !== null) updates.d4sign_status  = novoD4signStatus

    const { error: updErr } = await sb
      .from('contratos')
      .update(updates)
      .eq('id', contrato.id)

    if (updErr) {
      console.error('[d4sign/webhook] Falha ao atualizar contrato:', updErr)
    } else {
      console.log(`[d4sign/webhook] Contrato ${contrato.numero} → status: ${novoStatus ?? '(sem alteração)'}`)
    }
  }

  // Audit log
  await logAudit({
    tenant_id:       contrato.tenant_id,
    usuario_id:      null,
    origem_execucao: 'api',
    acao,
    modulo:          'contratos',
    tabela_afetada:  'contratos',
    registro_id:     contrato.id,
    dados_anteriores:{ status: contrato.status },
    dados_novos:     {
      type_post,
      d4sign_uuid:   d4signUuid,
      novo_status:   novoStatus,
      d4sign_status: novoD4signStatus,
    },
  })

  // D4Sign espera status 200 para não reenviar o webhook
  return NextResponse.json({ ok: true })
}
