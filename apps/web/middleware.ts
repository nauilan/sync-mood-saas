import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas protegidas — exigem sessão ativa
const PROTECTED = ['/master', '/portal', '/editora', '/titular', '/backoffice', '/admin']

// Rotas de API protegidas — exigem sessão (exceto as listadas em API_PUBLIC)
const API_PUBLIC = [
  '/api/auth/login',       // login — sem sessão por definição
  '/api/d4sign/webhook',   // webhook D4Sign — servidor externo, sem cookie
  '/api/health',           // health check — Vercel/monitoramento
  '/api/bootstrap-tenant', // onboarding — primeiro acesso
]

// Rotas de auth — redireciona para dashboard se já logado
const AUTH_ROUTES = ['/auth/login']

export async function middleware(request: NextRequest) {
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

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  const isApiRoute = pathname.startsWith('/api')
  const isApiPublic = API_PUBLIC.some(p => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.some(p => pathname.startsWith(p))

  // Rota protegida sem sessão → redireciona para login
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // API protegida sem sessão → 401 JSON
  if (isApiRoute && !isApiPublic && !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Sessão inválida ou expirada.' },
      { status: 401 }
    )
  }

  // Já logado tentando acessar login → redireciona para dashboard
  if (isAuthRoute && user) {
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = '/master/dashboard'
    return NextResponse.redirect(dashUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
