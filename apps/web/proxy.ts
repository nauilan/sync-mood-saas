import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type UserRole = 'master' | 'editora' | 'titular'

const PROTECTED_PREFIXES = ['/master', '/editora', '/titular']
const AUTH_ROUTES = ['/auth/login', '/auth/signup']

const ROLE_HOME: Record<UserRole, string> = {
  master: '/master/dashboard',
  editora: '/editora/dashboard',
  titular: '/titular/dashboard',
}

const DEMO_MODE = true

export async function proxy(request: NextRequest) {
  if (DEMO_MODE) {
    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/master/dashboard', request.url))
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
    const role = (user.user_metadata?.user_role ?? 'editora') as UserRole
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/editora/dashboard', request.url))
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  if (isAuthRoute && user) {
    const role = (user.user_metadata?.user_role ?? 'editora') as UserRole
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/editora/dashboard', request.url))
  }

  if (user && pathname.startsWith('/master')) {
    const role = user.user_metadata?.user_role as UserRole
    if (role !== 'master') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/editora/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}