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
 *
 * Fluxo de status do contrato:
 *   rascunho → aguardando_assinatura → assinado → validado_administrada
 *   → aguardando_validacao_admin → aprovado_admin | rejeitado_admin
 *
 * IMPORTANTE: signed_all → status = 'assinado' (não 'em_vigor')
 * Contrato assinado ≠ obra ativa. A obra só entra no catálogo após aprovação
 * explícita do administrador e pré-cadastro manual.
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
  | 'signed_all'   // todos assinaram → contrato assinado, inicia fluxo de aprovação
  | 'signed'       // um signatário assinou
  | 'unsigned'     // signatário recusou
  | 'cancel'       // documento cancelado
  | 'addSigners'   // signatários adicionados
  | string

interface D4SignWebhookPayload {
  type_post?: D4SignEvent
  uuid?: string
  [key: string]: unknown
}

// ── Buscar URL de download do PDF assinado ───────────────────────────────────
async function fetchD4SignPdfUrl(uuid: string): Promise<string | null> {
  try {
    const token    = (process.env.D4SIGN_API_TOKEN  ?? '').trim()
    const cryptKey = (process.env.D4SIGN_CRYPT_KEY  ?? '').trim()
    const baseUrl  = (process.env.D4SIGN_BASE_URL   ?? 'https://secure.d4sign.com.br/api/v1').trim()
    if (!token) return null

    const params = new URLSearchParams({ tokenAPI: token })
    if (cryptKey) params.set('cryptKey', cryptKey)

    const res = await fetch(
      `${baseUrl}/documents/${uuid}/download?${params}`,
      { method: 'GET', headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return null
    const json = await res.json() as { url?: string; download_url?: string }
    return json.url ?? json.download_url ?? null
  } catch {
    return null
  }
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
  let dataSig: string | null = null
  let pdfUrl: string | null = null

  switch (type_post) {
    case 'signed_all':
      // Todos assinaram → contrato passa para 'assinado'
      // REGRA: assinado ≠ ativo. Obra só entra no catálogo após aprovação do Admin.
      if (contrato.status !== 'assinado') {
        novoStatus       = 'assinado'
        novoD4signStatus = 'finalizado'
        acao             = 'assinatura_concluida'
        dataSig          = new Date().toISOString()

        // Tentar obter URL do PDF assinado (não-bloqueante)
        pdfUrl = await fetchD4SignPdfUrl(d4signUuid)
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
  if (novoStatus !== null || novoD4signStatus !== null || dataSig !== null) {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (novoStatus       !== null) updates.status         = novoStatus
    if (novoD4signStatus !== null) updates.d4sign_status  = novoD4signStatus
    if (dataSig          !== null) updates.data_assinatura = dataSig
    if (pdfUrl           !== null) updates.d4sign_pdf_url  = pdfUrl

    const { error: updErr } = await sb
      .from('contratos')
      .update(updates)
      .eq('id', contrato.id)

    if (updErr) {
      console.error('[d4sign/webhook] Falha ao atualizar contrato:', updErr)
    } else {
      console.log(
        `[d4sign/webhook] Contrato ${contrato.numero}` +
        ` → status: ${novoStatus ?? '(sem alteração)'}` +
        (dataSig ? ` | data_assinatura: ${dataSig}` : '') +
        (pdfUrl  ? ' | pdf_url: salvo'              : '')
      )
    }
  }

  // Audit log
  await logAudit({
    tenant_id:        contrato.tenant_id,
    usuario_id:       null,
    origem_execucao:  'api',
    acao,
    modulo:           'contratos',
    tabela_afetada:   'contratos',
    registro_id:      contrato.id,
    dados_anteriores: { status: contrato.status },
    dados_novos: {
      type_post,
      d4sign_uuid:    d4signUuid,
      novo_status:    novoStatus,
      d4sign_status:  novoD4signStatus,
      data_assinatura: dataSig,
      d4sign_pdf_url: pdfUrl,
    },
  })

  // D4Sign espera status 200 para não reenviar o webhook
  return NextResponse.json({ ok: true })
}
