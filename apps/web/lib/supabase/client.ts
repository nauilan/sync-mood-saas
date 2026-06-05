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
 * Usado quando `getSession()` não consegue parsear o cookie customizado do login via CPF.
 */
export function getAccessToken(): string {
  if (typeof document === 'undefined') return ''

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  let projectRef = ''
  try {
    projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  } catch { return '' }

  const cookieName = `sb-${projectRef}-auth-token`

  const pairs = document.cookie.split(';')
  for (const pair of pairs) {
    const [key, ...rest] = pair.trim().split('=')
    if (key === cookieName) {
      try {
        const decoded = decodeURIComponent(rest.join('='))
        const parsed = JSON.parse(decoded)
        return parsed.access_token ?? ''
      } catch { return '' }
    }
  }
  return ''
}
