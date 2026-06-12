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

// Estender timeout da Vercel para 60s (PDF generation + D4Sign calls)
export const maxDuration = 60

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

  // ── 2. Buscar contrato ───────────────────────────────────────────────────
  const { data: raw, error: fetchErr } = await sb
    .from('contratos')
    .select('*')
    .eq('id', contratoId)
    .is('deleted_at', null)
    .single()

  if (fetchErr || !raw) {
    console.error('[enviar-assinatura] fetchErr:', fetchErr?.message, '| raw:', raw)
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  // Resolve editora_nome: busca nome_fantasia (ou nome) da editora
  let editoraNome: string = raw.editora_nome ?? 'Editora'
  if (raw.editora_id) {
    const { data: editoraRow } = await sb
      .from('editoras')
      .select('nome_fantasia, nome')
      .eq('id', raw.editora_id)
      .single()
    if (editoraRow) {
      editoraNome = editoraRow.nome_fantasia || editoraRow.nome || editoraNome
    }
    console.log(`[enviar-assinatura] editora_id=${raw.editora_id} → nome=${editoraNome}`)
  } else {
    console.warn('[enviar-assinatura] editora_id é null — usando fallback "Editora"')
  }

  const contrato = {
    ...raw,
    editora_nome: editoraNome,
  } as ContratoV2 & { tenant_id: string; editora_nome: string }

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
  // (sempre gerar para ter o buffer atualizado, mesmo se reutilizando UUID)
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

  // ── 5. Upload para D4Sign (ou reutilizar UUID existente) ──────────────────
  // Se d4sign_uuid já está preenchido, o PDF foi enviado anteriormente mas
  // os signatários podem não ter sido adicionados (falha de endpoint anterior).
  // Nesse caso, reutilizamos o UUID para evitar duplicidade e rate-limit.
  let d4signUuid: string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingUuid = (contrato as any).d4sign_uuid as string | null
  if (existingUuid) {
    d4signUuid = existingUuid
    console.log(`[enviar-assinatura] reutilizando d4sign_uuid=${d4signUuid} — pulando upload`)
  } else {
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
  }
  // Suprimir warning de variável não-usada quando UUID é reutilizado
  void pdfBuffer

  // ── 6. Adicionar signatários ───────────────────────────────────────────────
  // act="1" (Assinar) para todos.
  // Cedente recebe videoselfie="1" (autenticação por vídeo selfie + reconhecimento facial).
  const signers: D4SignSigner[] = assinantes.map(ass => ({
    email:       ass.email!,
    act:         papelToAct(ass.papel),
    nome:        ass.nome,
    videoselfie: ass.papel === 'cedente' ? '1' : '0',
  }))
  try {
    await addSigners(d4signUuid, signers)
  } catch (err) {
    console.error('[enviar-assinatura] D4Sign addSigners error:', err)
    return NextResponse.json(
      { error: `Falha ao adicionar signatários: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
      { status: 502 }
    )
  }

  // ── 6b. (verificação removida — addSigners já lança exceção por signatário) ──

  // ── 7. Enviar para assinatura ──────────────────────────────────────────────
  try {
    const mensagem = `Prezado(a), solicitamos sua assinatura no contrato ${contrato.numero}. Acesse o link abaixo para assinar digitalmente.`
    const webhookUrl = process.env.D4SIGN_WEBHOOK_URL ?? process.env.URL_DO_WEBHOOK_D4SIGN ?? ''
    await sendDocument(d4signUuid, mensagem, webhookUrl || undefined)
  } catch (err) {
    console.error('[enviar-assinatura] D4Sign send error:', err)
    return NextResponse.json(
      { error: `Falha ao enviar para assinatura: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
      { status: 502 }
    )
  }

  // ── 8. Atualizar contrato no banco ─────────────────────────────────────────
  // Tenta status 'aguardando_assinatura' (migration 049); fallback para 'ativo'
  let updErr
  for (const novoStatus of ['aguardando_assinatura', 'ativo']) {
    const { error } = await sb
      .from('contratos')
      .update({
        status:              novoStatus,
        d4sign_uuid:         d4signUuid,
        d4sign_status:       'aguardando_assinaturas',
        provedor_assinatura: 'd4sign',
      })
      .eq('id', contratoId)
    updErr = error
    if (!error) break
    console.warn(`[enviar-assinatura] status='${novoStatus}' falhou:`, error.message)
  }

  if (updErr) {
    console.error('[enviar-assinatura] DB update error após fallbacks:', updErr)
    // Documento já foi enviado ao D4Sign — retorna aviso em vez de sucesso silencioso
    return NextResponse.json({
      ok:          true,
      d4sign_uuid: d4signUuid,
      status:      'aguardando_assinatura',
      message:     'Contrato enviado para D4Sign mas status não foi atualizado no banco. Atualize manualmente ou entre em contato com o suporte.',
      db_warning:  updErr.message,
    })
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
