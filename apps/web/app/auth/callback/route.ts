import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/editora/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const role = data.user.user_metadata?.user_role ?? 'editora'
      const routes: Record<string, string> = {
        master: '/master/dashboard',
        editora: '/editora/dashboard',
        titular: '/titular/dashboard',
      }
      return NextResponse.redirect(`${origin}${routes[role] ?? next}`)
    }
  }
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}