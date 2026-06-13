/**
 * POST /api/cwr/[id]/reverter
 *
 * Desfaz a integração CWR usando os IDs salvos em relatorio.integracao.
 * Remove participações (obras_links_titulares) e fonogramas criados por esta
 * importação. Titulares e editoras NÃO são removidos — são dados de referência.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/[\uFEFF]/g, '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY  ?? '').replace(/[\uFEFF]/g, '').trim(),
    { auth: { persistSession: false } }
  )
}

async function getUser(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '')
    .replace('Bearer ', '')
    .replace(/[\uFEFF\u200B]/g, '')
    .trim()
  if (!token) return null
  const c = sb()
  const { data: { user } } = await c.auth.getUser(token)
  if (!user) return null
  const { data } = await c
    .from('usuarios')
    .select('id, tenant_id')
    .eq('auth_user_id', user.id)
    .single()
  return data ? { userId: data.id as string, tenantId: data.tenant_id as string } : null
}

async function deleteInChunks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  table: string,
  ids: string[],
  chunkSize = 200
) {
  let deletados = 0
  for (let i = 0; i < ids.length; i += chunkSize) {
    const { data } = await client.from(table).delete().in('id', ids.slice(i, i + chunkSize)).select('id')
    deletados += data?.length ?? 0
  }
  return deletados
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('id, status, tenant_id, relatorio')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })

  const integracao = (imp.relatorio as Record<string, unknown>)?.integracao as Record<string, unknown> | undefined
  if (!integracao) {
    return NextResponse.json({ error: 'Nenhuma integração encontrada para reverter.' }, { status: 400 })
  }

  const partIds = (integracao.participacoes_ids     as string[]) ?? []
  const fgIds   = (integracao.fonogramas_criados_ids as string[]) ?? []
  // Nota: titulares_criados_ids e editoras_criadas_ids são retidos
  // pois podem ser referenciados por outras obras/imports.

  const participacoesRemovidas = partIds.length > 0
    ? await deleteInChunks(client, 'obras_links_titulares', partIds)
    : 0

  const fonogramasRemovidos = fgIds.length > 0
    ? await deleteInChunks(client, 'fonogramas', fgIds)
    : 0

  // Limpar integracao do relatorio
  const relAtual = (imp.relatorio as Record<string, unknown>) ?? {}
  const { integracao: _removed, ...relSemIntegracao } = relAtual as { integracao?: unknown } & Record<string, unknown>
  await client
    .from('cwr_importacoes')
    .update({ relatorio: relSemIntegracao, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({
    ok: true,
    participacoes_removidas:  participacoesRemovidas,
    fonogramas_removidos:     fonogramasRemovidos,
    aviso: 'Titulares e editoras criados foram mantidos como dados de referência.',
  })
}
