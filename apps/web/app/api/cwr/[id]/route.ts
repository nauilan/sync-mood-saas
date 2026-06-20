import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sanitize = (v: string | undefined) =>
  (v ?? '').replace(/[\uFEFF\u200B\u200C\u200D]/g, '').trim()

function sb() {
  return createClient(
    sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL),
    sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false } }
  )
}

async function getUser(req: NextRequest) {
  const raw = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  const token = raw.replace(/[\uFEFF\u200B\u200C\u200D]/g, '').trim()
  if (!token) return null
  const client = sb()
  const { data: { user } } = await client.auth.getUser(token)
  if (!user) return null
  const { data } = await client.from('usuarios').select('id,tenant_id,role').eq('auth_user_id', user.id).single()
  return data ? { userId: data.id as string, tenantId: data.tenant_id as string, role: data.role as string } : null
}

// ── DELETE /api/cwr/[id] — apaga importação + obras criadas por ela ───────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  // 1. Confirmar que a importação pertence ao tenant
  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('id, nome_arquivo, status, tenant_id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })

  // 2. Coletar todos os obra_ids desta importação
  const { data: cioRows } = await client
    .from('cwr_importacoes_obras')
    .select('obra_id')
    .eq('importacao_id', id)
    .not('obra_id', 'is', null)

  const obraIds = [...new Set((cioRows ?? []).map((r: any) => r.obra_id as string).filter(Boolean))]

  const CHUNK = 200

  // 3. Deletar obras_links_titulares das obras desta importação
  for (let i = 0; i < obraIds.length; i += CHUNK) {
    await client.from('obras_links_titulares').delete().in('obra_id', obraIds.slice(i, i + CHUNK))
  }

  // 4. Deletar fonogramas das obras desta importação
  for (let i = 0; i < obraIds.length; i += CHUNK) {
    await client.from('fonogramas').delete().in('obra_id', obraIds.slice(i, i + CHUNK))
  }

  // 5. Deletar obras_links das obras desta importação
  for (let i = 0; i < obraIds.length; i += CHUNK) {
    await client.from('obras_links').delete().in('obra_id', obraIds.slice(i, i + CHUNK))
  }

  // 6. Deletar as obras em si
  let obrasRemovidas = 0
  for (let i = 0; i < obraIds.length; i += CHUNK) {
    const { count } = await client
      .from('obras')
      .delete({ count: 'exact' })
      .in('id', obraIds.slice(i, i + CHUNK))
    obrasRemovidas += count ?? 0
  }

  // 7. Deletar staging de titulares desta importação
  await client.from('cwr_importacoes_titulares').delete().eq('importacao_id', id)

  // 8. Deletar registros de obras desta importação
  await client.from('cwr_importacoes_obras').delete().eq('importacao_id', id)

  // 9. Deletar conflitos desta importação
  await client.from('cwr_conflitos').delete().eq('importacao_id', id)

  // 10. Deletar a importação
  await client.from('cwr_importacoes').delete().eq('id', id)

  return NextResponse.json({
    ok: true,
    importacao_id:   id,
    nome_arquivo:    imp.nome_arquivo,
    obras_removidas: obrasRemovidas,
  })
}

// ── GET /api/cwr/[id] — preview da importação ─────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })

  const { data: obrasImp } = await client
    .from('cwr_importacoes_obras')
    .select('*')
    .eq('importacao_id', id)
    .order('match_tipo')

  const { data: conflitos } = await client
    .from('cwr_conflitos')
    .select('*')
    .eq('importacao_id', id)

  return NextResponse.json({
    importacao: imp,
    obras:      obrasImp ?? [],
    conflitos:  conflitos ?? [],
  })
}
