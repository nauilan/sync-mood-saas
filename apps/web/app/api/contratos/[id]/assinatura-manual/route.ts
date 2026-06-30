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
  const { data } = await sb
    .from('usuarios')
    .select('id, tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  return data as { id: string; tenant_id: string; role: string } | null
}

// ── POST /api/contratos/[id]/assinatura-manual ───────────────────────────────
// Recebe um PDF assinado manualmente fora do sistema e o associa ao contrato.
// Bucket: contratos-manuais (reaproveitado — RLS por tenant já testada)
// Path:   {tenant_id}/contratos/{contrato_id}/{timestamp}-{nome}
// Nunca gera URL pública permanente — signed URL com TTL 1h gerada on-demand.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: contratoId } = await params

  // Verificar que o contrato pertence ao tenant
  const { data: contrato } = await sb
    .from('contratos')
    .select('id, numero, status, tenant_id')
    .eq('id', contratoId)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  // Parsear multipart/form-data
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Multipart inválido' }, { status: 400 })
  }

  const arquivo = formData.get('arquivo') as File | null
  if (!arquivo) return NextResponse.json({ error: 'Campo "arquivo" obrigatório' }, { status: 400 })

  // Validar tipo (apenas PDF) e tamanho (máx 20 MB)
  const tiposPermitidos = ['application/pdf']
  if (!tiposPermitidos.includes(arquivo.type)) {
    return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos' }, { status: 400 })
  }
  const MAX_BYTES = 20 * 1024 * 1024 // 20 MB
  if (arquivo.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo excede o limite de 20 MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer())
  const timestamp = Date.now()
  const nomeArquivo = `${timestamp}-${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  // Path distinto do fluxo de obras: contratos/{contrato_id}/...
  const storagePath = `${usuario.tenant_id}/contratos/${contratoId}/${nomeArquivo}`

  // Upload para Supabase Storage — bucket privado, sem URL pública
  const { error: uploadError } = await sb.storage
    .from('contratos-manuais')
    .upload(storagePath, buffer, {
      contentType: arquivo.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({
      error: 'Falha no upload: ' + uploadError.message,
      dica: 'Verifique se o bucket "contratos-manuais" existe no Supabase Storage.',
    }, { status: 500 })
  }

  // Gerar signed URL de 1h para retorno imediato (opcional — o path é o que fica salvo)
  const { data: urlData } = await sb.storage
    .from('contratos-manuais')
    .createSignedUrl(storagePath, 3600)

  // Atualizar contrato: path do PDF, método e status
  const { error: updateError } = await sb
    .from('contratos')
    .update({
      arquivo_assinado_url:  storagePath,       // path — nunca URL pública permanente
      metodo_assinatura:     'manual',
      status:                'assinado',
      updated_at:            new Date().toISOString(),
    })
    .eq('id', contratoId)
    .eq('tenant_id', usuario.tenant_id)

  if (updateError) {
    return NextResponse.json({ error: 'Falha ao atualizar contrato: ' + updateError.message }, { status: 500 })
  }

  await logAudit({
    tenant_id:       usuario.tenant_id,
    usuario_id:      usuario.id,
    acao:            'upload_assinatura_manual',
    modulo:          'contratos',
    tabela_afetada:  'contratos',
    registro_id:     contratoId,
    dados_novos: {
      contrato_id:  contratoId,
      numero:       contrato.numero,
      nome_arquivo: arquivo.name,
      tamanho:      arquivo.size,
      path:         storagePath,
    } as Record<string, unknown>,
    ip:              req.headers.get('x-forwarded-for') ?? null,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({
    ok:                   true,
    arquivo_assinado_url: storagePath,
    arquivo_nome:         arquivo.name,
    signed_url:           urlData?.signedUrl ?? null,
    status:               'assinado',
    mensagem:             'Contrato marcado como assinado manualmente com sucesso.',
  })
}

// ── GET /api/contratos/[id]/assinatura-manual — gerar signed URL para download
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: contratoId } = await params

  const { data: contrato } = await sb
    .from('contratos')
    .select('id, arquivo_assinado_url, metodo_assinatura, tenant_id')
    .eq('id', contratoId)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  if (!contrato.arquivo_assinado_url || contrato.metodo_assinatura !== 'manual') {
    return NextResponse.json({ error: 'Nenhum arquivo de assinatura manual registrado' }, { status: 404 })
  }

  // Gerar signed URL válida por 1h — nunca expõe URL pública permanente
  const { data: urlData, error: urlError } = await sb.storage
    .from('contratos-manuais')
    .createSignedUrl(contrato.arquivo_assinado_url, 3600)

  if (urlError || !urlData?.signedUrl) {
    return NextResponse.json({ error: 'Não foi possível gerar o link de download' }, { status: 500 })
  }

  return NextResponse.json({ signed_url: urlData.signedUrl, expira_em: '1h' })
}
