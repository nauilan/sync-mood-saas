import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST() {
  try {
    const cookieStore = await cookies()

    // Cliente normal (usuário autenticado)
    const sbUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { user } } = await sbUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Cliente admin (bypassa RLS)
    const sbAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar se já tem usuario com tenant
    const { data: existingUser } = await sbAdmin
      .from('usuarios')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (existingUser?.tenant_id) {
      return NextResponse.json({ tenant_id: existingUser.tenant_id, created: false })
    }

    // Criar tenant
    const nomeEmpresa = user.user_metadata?.company ?? user.email?.split('@')[0] ?? 'Minha Empresa'
    const slug = nomeEmpresa.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30) + '-' + Date.now().toString(36)

    const { data: tenant, error: tErr } = await sbAdmin
      .from('tenants')
      .insert({ nome: nomeEmpresa, slug, plano: 'pro', ativo: true })
      .select('id')
      .single()

    if (tErr || !tenant) {
      return NextResponse.json({ error: `Erro ao criar tenant: ${tErr?.message}` }, { status: 500 })
    }

    // Criar usuario vinculado ao tenant
    await sbAdmin.from('usuarios').upsert({
      tenant_id: tenant.id,
      auth_user_id: user.id,
      email: user.email,
      nome: user.user_metadata?.nome ?? user.email ?? 'Usuário',
      role: 'admin',
      ativo: true,
    }, { onConflict: 'auth_user_id' })

    return NextResponse.json({ tenant_id: tenant.id, created: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
