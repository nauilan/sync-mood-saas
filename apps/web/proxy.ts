import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type UserRole = 'master' | 'editora' | 'titular'

// Todas as rotas /api/* fazem sua própria autenticação via Bearer token no handler.
// O middleware não bloqueia API routes — cada handler é responsável por validar o token.
const API_PUBLIC = ['/api/']

// Rotas de auth — redireciona para dashboard se já logado
const AUTH_ROUTES = ['/auth/login', '/auth/signup']

const ROLE_HOME: Record<UserRole, string> = {
  master: '/master/dashboard',
  editora: '/editora/dashboard',
  titular: '/titular/dashboard',
}

export async function proxy(request: NextRequest) {
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

  // Atualiza sessão (OBRIGATÓRIO — não remover)
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Raiz → redireciona conforme estado de autenticação
  if (pathname === '/') {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
    const role = (user.user_metadata?.user_role ?? 'master') as UserRole
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/master/dashboard', request.url))
  }

  // API protegida sem sessão → 401 JSON
  const isApiRoute = pathname.startsWith('/api')
  const isApiPublic = API_PUBLIC.some(p => pathname.startsWith(p))
  if (isApiRoute && !isApiPublic && !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Sessão inválida ou expirada.' },
      { status: 401 }
    )
  }

  // Já logado tentando acessar login/signup → redireciona para dashboard
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
  if (isAuthRoute && user) {
    const role = (user.user_metadata?.user_role ?? 'master') as UserRole
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/master/dashboard', request.url))
  }

  // Rotas protegidas (/master, /editora, /titular, /portal) NÃO são bloqueadas aqui.
  // Cada página faz sua própria verificação de autenticação (padrão Supabase SSR).

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
