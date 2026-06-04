import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)
const SERVICE_KEY  = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY)

/**
 * POST /api/obras/migrar-editoras-cwr
 *
 * Lê os titulares já existentes no banco com tipo='editora' (publishers do CWR)
 * e cria pré-cadastros na tabela `editoras` para cada um que ainda não existe.
 *
 * Não exige re-importação do CWR.
 */
export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }

  // Usa service role para bypassar RLS
  const adminKey = SERVICE_KEY || ANON_KEY

  let tenantId: string | null = null
  try {
    const body = await req.json()
    tenantId = body.tenant_id ?? null
  } catch { /* opcional */ }

  // Resolver tenant_id
  if (!tenantId) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=id&limit=1`, {
      headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}` },
    })
    const rows = await r.json()
    tenantId = rows?.[0]?.id ?? null
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })
  }

  // 1. Buscar todos os titulares com tipo='editora' do tenant
  const titRes = await fetch(
    `${SUPABASE_URL}/rest/v1/titulares?tenant_id=eq.${tenantId}&tipo=eq.editora&select=id,nome_completo,codigo_interno_legado,codigo_sequence_cwr,ipi,codigo_ipi`,
    { headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}` } }
  )
  if (!titRes.ok) {
    return NextResponse.json({ error: 'Erro ao buscar titulares' }, { status: 500 })
  }
  const titulares: Array<{
    id: string
    nome_completo: string
    codigo_interno_legado?: string
    codigo_sequence_cwr?: string
    ipi?: string
    codigo_ipi?: string
  }> = await titRes.json()

  if (titulares.length === 0) {
    return NextResponse.json({ message: 'Nenhum titular do tipo editora encontrado', criadas: 0 })
  }

  // 2. Buscar editoras já existentes no tenant (por nome)
  const edRes = await fetch(
    `${SUPABASE_URL}/rest/v1/editoras?tenant_id=eq.${tenantId}&select=id,nome_fantasia`,
    { headers: { apikey: adminKey, Authorization: `Bearer ${adminKey}` } }
  )
  const existentes: Array<{ id: string; nome_fantasia: string }> = edRes.ok ? await edRes.json() : []
  const existentesNomes = new Set(existentes.map(e => e.nome_fantasia.trim().toUpperCase()))

  // 3. Filtrar somente os que ainda não existem na tabela editoras
  const novas = titulares.filter(t => {
    const nome = (t.nome_completo ?? '').trim().toUpperCase()
    return nome && !existentesNomes.has(nome)
  })

  if (novas.length === 0) {
    return NextResponse.json({
      message: 'Todas as editoras já estão cadastradas',
      total_titulares_editora: titulares.length,
      criadas: 0,
    })
  }

  // 4. Criar pré-cadastros na tabela editoras
  const payload = novas.map(t => ({
    tenant_id:            tenantId,
    razao_social:         t.nome_completo.trim(),
    nome_fantasia:        t.nome_completo.trim(),
    status:               'ativo',
    codigo_ipi:           t.codigo_ipi ?? t.ipi ?? null,
    // Campos CWR
    codigo_publisher_cwr: t.codigo_interno_legado ?? t.codigo_sequence_cwr ?? null,
    tipo_editora:         'administrada',  // padrão — usuário ajusta
    controlada:           false,           // padrão — usuário ajusta
    origem_importacao:    'cwr',
  }))

  const insRes = await fetch(`${SUPABASE_URL}/rest/v1/editoras`, {
    method: 'POST',
    headers: {
      apikey: adminKey,
      Authorization: `Bearer ${adminKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,count=exact',
    },
    body: JSON.stringify(payload),
  })

  if (!insRes.ok) {
    const err = await insRes.json()
    return NextResponse.json({ error: `Erro ao criar editoras: ${JSON.stringify(err)}` }, { status: 500 })
  }

  const countHeader = insRes.headers.get('content-range')
  const criadas = countHeader ? parseInt(countHeader.split('/')[1] ?? '0') : novas.length

  return NextResponse.json({
    message: `Pré-cadastros criados com sucesso`,
    total_titulares_editora: titulares.length,
    ja_existiam: titulares.length - novas.length,
    criadas: criadas || novas.length,
    editoras: novas.map(t => t.nome_completo),
  })
}
