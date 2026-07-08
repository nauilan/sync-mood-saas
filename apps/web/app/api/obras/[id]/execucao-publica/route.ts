import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function autenticar(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user }, error } = await sb().auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await sb().from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  return usuario
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuario = await autenticar(req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const client = sb()
  const { id: obraId } = await params

  const { data: obra, error: obraErr } = await client
    .from('obras')
    .select('id, titulo, codigo_obra, iswc, tenant_id')
    .eq('id', obraId)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (obraErr || !obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const { data: titulares, error: titErr } = await client
    .from('obras_links_titulares')
    .select(`
      id,
      papel,
      percentual,
      pct_comunicacao_publico,
      percentual_exec_publica,
      controlado,
      obra_link_id,
      titular_id,
      titulares!inner (
        id,
        codigo_titular,
        tipo,
        pessoa,
        nome_completo,
        nome_artistico,
        cpf_cnpj,
        sociedade_autoral
      )
    `)
    .eq('obra_id', obraId)
    .eq('tenant_id', usuario.tenant_id)
    .order('papel')

  if (titErr) return NextResponse.json({ error: titErr.message }, { status: 500 })

  return NextResponse.json({ obra, titulares: titulares ?? [] })
}
