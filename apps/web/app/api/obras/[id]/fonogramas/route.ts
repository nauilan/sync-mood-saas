/**
 * GET /api/obras/[id]/fonogramas
 *
 * Retorna todos os fonogramas vinculados a uma obra específica.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const { id: obra_id } = await params

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: usuario } = await sb
    .from('usuarios')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })

  const { data, error } = await sb
    .from('fonogramas')
    .select(`
      id, obra_id, isrc, titulo_fonograma, interprete,
      versao, duracao_segundos, ano_gravacao, gravadora,
      produtor_fonografico, data_lancamento, pais, plataformas,
      url_preview, status, created_at, updated_at
    `)
    .eq('obra_id', obra_id)
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .order('titulo_fonograma')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], total: (data ?? []).length })
}
