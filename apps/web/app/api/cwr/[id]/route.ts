import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token) return null
  const client = sb()
  const { data: { user } } = await client.auth.getUser(token)
  if (!user) return null
  const { data } = await client.from('usuarios').select('id,tenant_id,role').eq('auth_user_id', user.id).single()
  return data ? { userId: data.id as string, tenantId: data.tenant_id as string, role: data.role as string } : null
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
