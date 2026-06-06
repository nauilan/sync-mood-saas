import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Extrai o access_token da sessão Supabase lendo diretamente os cookies do browser.
 * Suporta cookie único (sb-xxx-auth-token) e cookies em chunks (sb-xxx-auth-token.0, .1, ...).
 */
export function getAccessToken(): string {
  if (typeof document === 'undefined') return ''

  const pairs = document.cookie.split(';')
  const cookieMap: Record<string, string> = {}
  for (const pair of pairs) {
    const idx = pair.indexOf('=')
    if (idx < 0) continue
    const key = pair.slice(0, idx).trim()
    const val = pair.slice(idx + 1).trim()
    cookieMap[key] = val
  }

  // Encontrar o projectRef a partir dos cookies existentes
  const baseKeys = Object.keys(cookieMap).filter(k => /^sb-[a-z0-9]+-auth-token(\.0)?$/.test(k))
  for (const baseKey of baseKeys) {
    // Extrair o nome base sem índice
    const base = baseKey.replace(/\.\d+$/, '')

    // Tentar ler como cookie único primeiro
    if (cookieMap[base]) {
      try {
        const decoded = decodeURIComponent(cookieMap[base])
        const parsed = JSON.parse(decoded)
        // @supabase/ssr v0.10+ armazena como { currentSession: { access_token } }
        // versões anteriores armazenavam como { access_token }
        const token = parsed?.access_token ?? parsed?.currentSession?.access_token
        if (token) return token
      } catch { /* continua */ }
    }

    // Montar a partir de chunks .0, .1, .2, ...
    let assembled = ''
    for (let i = 0; i < 10; i++) {
      const chunk = cookieMap[`${base}.${i}`]
      if (!chunk) break
      assembled += decodeURIComponent(chunk)
    }
    if (assembled) {
      try {
        const parsed = JSON.parse(assembled)
        const token = parsed?.access_token ?? parsed?.currentSession?.access_token
        if (token) return token
      } catch { /* continua */ }
    }
  }

  return ''
}
