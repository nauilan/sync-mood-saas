/**
 * POST /api/contratos/:id/enviar-assinatura
 *
 * Fluxo:
 *  1. Valida autenticação e busca contrato
 *  2. Verifica pré-requisitos (4 assinantes, todos com email, status=rascunho)
 *  3. Gera PDF do contrato
 *  4. Faz upload para D4Sign (cofre configurado)
 *  5. Adiciona os 4 signatários
 *  6. Envia para assinatura
 *  7. Atualiza contrato: status→aguardando_assinatura, d4sign_uuid, d4sign_status
 *  8. Registra audit log
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAudit }                  from '@/lib/audit'
import {
  uploadDocument,
  addSigners,
  sendDocument,
  papelToAct,
  type D4SignSigner,
} from '@/lib/d4sign'
import { generateContractPDF }       from '@/lib/pdf-generator'
import type { ContratoV2, AssinanteD4Sign } from '@/lib/types-contratos-v2'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Validação dos pré-requisitos ─────────────────────────────────────────────

function validarAssinantes(assinantes: AssinanteD4Sign[]): string | null {
  if (assinantes.length < 4) {
    return `São necessários 4 assinantes (cedente, responsável editora, testemunha 1, testemunha 2). Encontrados: ${assinantes.length}.`
  }
  const papeis = ['cedente', 'responsavel_editora', 'testemunha_1', 'testemunha_2']
  for (const papel of papeis) {
    const ass = assinantes.find(a => a.papel === papel)
    if (!ass) return `Assinante com papel "${papel}" não encontrado.`
    if (!ass.email?.trim()) return `Assinante "${ass.nome ?? papel}" não tem e-mail cadastrado.`
    if (!ass.cpf?.trim())   return `Assinante "${ass.nome ?? papel}" não tem CPF cadastrado.`
  }
  return null
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contratoId } = await params

  // ── 1. Autenticação ──────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? ''
  const accessToken = authHeader.replace('Bearer ', '').trim()

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Configuração Supabase ausente' }, { status: 500 })
  }

  const sbUser = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth:   { persistSession: false },
  })
  const { data: { user } } = await sbUser.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Admin client indisponível' }, { status: 500 })

  // ── 2. Buscar contrato ────────────────────────────────────────────────────
  const { data: raw, error: fetchErr } = await sb
    .from('contratos')
    .select('*')
    .eq('id', contratoId)
    .is('deleted_at', null)
    .single()

  if (fetchErr || !raw) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  const contrato = raw as ContratoV2 & { tenant_id: string }

  // ── 3. Validações ─────────────────────────────────────────────────────────
  if (contrato.status !== 'rascunho') {
    return NextResponse.json(
      { error: `Contrato não está em rascunho (status atual: ${contrato.status})` },
      { status: 422 }
    )
  }

  const assinantes: AssinanteD4Sign[] = Array.isArray(contrato.assinantes_d4sign)
    ? contrato.assinantes_d4sign
    : []

  const validErr = validarAssinantes(assinantes)
  if (validErr) {
    return NextResponse.json({ error: validErr }, { status: 422 })
  }

  if (!process.env.D4SIGN_TOKEN_API || !process.env.D4SIGN_CRYPT_KEY || !process.env.D4SIGN_SAFE_UUID) {
    return NextResponse.json(
      { error: 'Credenciais D4Sign não configuradas. Defina D4SIGN_TOKEN_API, D4SIGN_CRYPT_KEY e D4SIGN_SAFE_UUID.' },
      { status: 503 }
    )
  }

  // ── 4. Gerar PDF ──────────────────────────────────────────────────────────
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateContractPDF(contrato as ContratoV2)
  } catch (err) {
    console.error('[enviar-assinatura] PDF generation error:', err)
    return NextResponse.json(
      { error: `Falha ao gerar PDF: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
      { status: 500 }
    )
  }

  // ── 5. Upload para D4Sign ──────────────────────────────────────────────────
  let d4signUuid: string
  try {
    const filename = `${contrato.numero.replace(/[^a-z0-9]/gi, '_')}.pdf`
    d4signUuid = await uploadDocument(pdfBuffer, filename)
  } catch (err) {
    console.error('[enviar-assinatura] D4Sign upload error:', err)
    return NextResponse.json(
      { error: `Falha ao enviar para D4Sign: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
      { status: 502 }
    )
  }

  // ── 6. Adicionar signatários ───────────────────────────────────────────────
  try {
    const signers: D4SignSigner[] = assinantes.map(ass => ({
      email: ass.email!,
      act:   papelToAct(ass.papel),
      nome:  ass.nome,
    }))
    await addSigners(d4signUuid, signers)
  } catch (err) {
    console.error('[enviar-assinatura] D4Sign addSigners error:', err)
    return NextResponse.json(
      { error: `Falha ao adicionar signatários: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
      { status: 502 }
    )
  }

  // ── 7. Enviar para assinatura ──────────────────────────────────────────────
  try {
    const mensagem = `Prezado(a), solicitamos sua assinatura no contrato ${contrato.numero}. Acesse o link abaixo para assinar digitalmente.`
    await sendDocument(d4signUuid, mensagem)
  } catch (err) {
    console.error('[enviar-assinatura] D4Sign send error:', err)
    return NextResponse.json(
      { error: `Falha ao enviar para assinatura: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
      { status: 502 }
    )
  }

  // ── 8. Atualizar contrato no banco ─────────────────────────────────────────
  const { error: updErr } = await sb
    .from('contratos')
    .update({
      status:          'aguardando_assinatura',
      d4sign_uuid:     d4signUuid,
      d4sign_status:   'aguardando_assinaturas',
      provedor_assinatura: 'd4sign',
      updated_at:      new Date().toISOString(),
    })
    .eq('id', contratoId)

  if (updErr) {
    console.error('[enviar-assinatura] DB update error:', updErr)
    // Contrato foi enviado mas não atualizamos o banco — log de aviso
    console.warn(`[enviar-assinatura] Contrato ${contratoId} enviado (D4Sign ${d4signUuid}) mas falhou ao atualizar status no banco.`)
  }

  // ── 9. Audit log ───────────────────────────────────────────────────────────
  await logAudit({
    tenant_id:        contrato.tenant_id,
    usuario_id:       user.id,
    origem_execucao:  'usuario',
    acao:             'enviar_assinatura',
    modulo:           'contratos',
    tabela_afetada:   'contratos',
    registro_id:      contratoId,
    dados_anteriores: { status: 'rascunho' },
    dados_novos:      {
      status:        'aguardando_assinatura',
      d4sign_uuid:   d4signUuid,
      assinantes:    assinantes.map(a => ({ nome: a.nome, papel: a.papel, email: a.email })),
    },
  })

  return NextResponse.json({
    ok:           true,
    d4sign_uuid:  d4signUuid,
    status:       'aguardando_assinatura',
    message:      `Contrato enviado para assinatura. ${assinantes.length} signatários notificados.`,
  })
}
