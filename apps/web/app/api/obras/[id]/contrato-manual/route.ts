import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extrairLetraDaLegal, validarArquivoContrato } from '@/lib/contrato-integridade'
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
    try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) return p.access_token } catch { /**/ }
    try { const p = JSON.parse(joined); if (p?.access_token) return p.access_token } catch { /**/ }
  }
  return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autenticar(req: NextRequest, sb: any) {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  return data as { id: string; tenant_id: string; role: string } | null
}

// Extrai texto bruto de um buffer PDF usando pdf-parse
async function extrairTextoPDF(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const result = await pdfParse(buffer)
    return result.text ?? ''
  } catch {
    return ''
  }
}

// ── POST /api/obras/[id]/contrato-manual ────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: obraId } = await params

  // Verificar que a obra pertence ao tenant
  const { data: obra } = await sb
    .from('obras')
    .select('id, titulo, status_contrato, tenant_id')
    .eq('id', obraId)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (!obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  // Parsear multipart/form-data
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Multipart inválido' }, { status: 400 })
  }

  const arquivo = formData.get('arquivo') as File | null
  const extrairLetra = formData.get('extrair_letra') === 'true'
  const substituirVigente = formData.get('substituir_vigente') === 'true'

  if (!arquivo) return NextResponse.json({ error: 'Campo "arquivo" obrigatório' }, { status: 400 })

  // Validar tipo e tamanho
  const validacao = validarArquivoContrato(arquivo.type, arquivo.size)
  if (!validacao.ok) {
    return NextResponse.json({ error: validacao.erro }, { status: validacao.status })
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer())
  const timestamp = Date.now()
  const nomeArquivo = `${timestamp}-${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storagePath = `${usuario.tenant_id}/${obraId}/${nomeArquivo}`

  // Fazer upload para Supabase Storage
  const { error: uploadError } = await sb.storage
    .from('contratos-manuais')
    .upload(storagePath, buffer, {
      contentType: arquivo.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({
      error: 'Falha no upload: ' + uploadError.message,
      dica: 'Verifique se o bucket "contratos-manuais" foi criado no Supabase Storage',
    }, { status: 500 })
  }

  // URL assinada de curta duração (1h) — nunca URL pública permanente
  const { data: urlData } = await sb.storage
    .from('contratos-manuais')
    .createSignedUrl(storagePath, 3600)
  // Salva o path, não a URL assinada (URLs assinadas são geradas on-demand)
  const arquivoUrl = storagePath

  // Marcar contratos anteriores como não vigentes (se substituição)
  if (substituirVigente) {
    await sb.from('obras_contratos')
      .update({ vigente: false })
      .eq('obra_id', obraId)
      .eq('tipo', 'manual')
      .eq('vigente', true)
  }

  // Registrar na tabela obras_contratos
  const { data: ocRow } = await sb.from('obras_contratos').insert({
    obra_id:     obraId,
    tenant_id:   usuario.tenant_id,
    tipo:        'manual',
    arquivo_url: arquivoUrl,
    arquivo_nome: arquivo.name,
    vigente:     true,
  }).select().single()

  // Atualizar obra: status_contrato = valido, liberar exportação
  await sb.from('obras').update({
    status_contrato:      'contrato_manual',
    requer_recontracao:   false,
    motivo_recontracao:   null,
    contrato_manual_url:  arquivoUrl,
    contrato_manual_nome: arquivo.name,
    contrato_manual_em:   new Date().toISOString(),
    exportacao_bloqueada: false,
    exportacao_bloqueio_motivo: null,
    updated_at: new Date().toISOString(),
  })
    .eq('id', obraId)
    .eq('tenant_id', usuario.tenant_id)

  // Extrair letra se solicitado (apenas PDF)
  let letraExtraida: string | null = null
  if (extrairLetra && arquivo.type === 'application/pdf') {
    const textoCompleto = await extrairTextoPDF(buffer)
    if (textoCompleto) {
      letraExtraida = extrairLetraDaLegal(textoCompleto) || null
    }
  }

  await logAudit({
    tenant_id:      usuario.tenant_id,
    usuario_id:     usuario.id,
    acao:           'upload_contrato',
    modulo:         'contratos',
    tabela_afetada: 'obras_contratos',
    registro_id:    ocRow?.id ?? null,
    dados_novos: {
      obra_id:    obraId,
      nome:       arquivo.name,
      tamanho:    arquivo.size,
      path:       storagePath,
    } as Record<string, unknown>,
    ip:             req.headers.get('x-forwarded-for') ?? null,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({
    ok: true,
    arquivo_url:     arquivoUrl,
    arquivo_nome:    arquivo.name,
    status_contrato: 'contrato_manual',
    obras_contratos_id: ocRow?.id ?? null,
    letra_extraida:  letraExtraida,
    mensagem: letraExtraida
      ? 'Contrato salvo e letra extraída com sucesso. Revise o texto antes de salvar.'
      : 'Contrato salvo com sucesso.',
  })
}

// ── GET /api/obras/[id]/contrato-manual — listar contratos manuais ───────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: obraId } = await params

  const { data, error } = await sb
    .from('obras_contratos')
    .select('*')
    .eq('obra_id', obraId)
    .eq('tenant_id', usuario.tenant_id)
    .order('criado_em', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
