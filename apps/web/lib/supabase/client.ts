import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Extrai o access_token da sessão Supabase lendo diretamente o cookie do browser.
 * Escaneia todos os cookies com padrão sb-*-auth-token sem depender de env vars
 * (que podem não estar inlined no bundle cliente em alguns deploys).
 */
export function getAccessToken(): string {
  if (typeof document === 'undefined') return ''

  const pairs = document.cookie.split(';')
  for (const pair of pairs) {
    const [key, ...rest] = pair.trim().split('=')
    // Padrão: sb-{projectRef}-auth-token ou sb-{projectRef}-auth-token.0 etc.
    if (/^sb-[a-z0-9]+-auth-token$/.test(key)) {
      try {
        const decoded = decodeURIComponent(rest.join('='))
        const parsed = JSON.parse(decoded)
        if (parsed.access_token) return parsed.access_token
      } catch { /* continua para o próximo cookie */ }
    }
  }

  // Fallback: tentar construir o nome a partir da URL (quando env var está disponível)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    if (supabaseUrl) {
      const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
      const cookieName = `sb-${projectRef}-auth-token`
      for (const pair of pairs) {
        const [key, ...rest] = pair.trim().split('=')
        if (key === cookieName) {
          const decoded = decodeURIComponent(rest.join('='))
          const parsed = JSON.parse(decoded)
          if (parsed.access_token) return parsed.access_token
        }
      }
    }
  } catch { /* ignorar */ }

  return ''
}
