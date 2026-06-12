import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Decodifica o valor de cookie do @supabase/ssr v0.10+.
 * Formato: "base64-<base64url>" (novo) ou JSON puro (antigo).
 */
function decodeCookieValue(raw: string): string {
  const decoded = decodeURIComponent(raw)
  const BASE64_PREFIX = 'base64-'
  if (decoded.startsWith(BASE64_PREFIX)) {
    try {
      const b64 = decoded.slice(BASE64_PREFIX.length)
        .replace(/-/g, '+').replace(/_/g, '/') // base64url → base64
      const pad = b64.length % 4 ? '='.repeat(4 - b64.length % 4) : ''
      return atob(b64 + pad)
    } catch { /* continua */ }
  }
  return decoded
}

/**
 * Extrai o access_token da sessão Supabase lendo diretamente os cookies do browser.
 * Compatível com @supabase/ssr v0.10+ (base64url) e versões anteriores (JSON puro).
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
    const base = baseKey.replace(/\.\d+$/, '')

    // Tentar ler como cookie único primeiro
    if (cookieMap[base]) {
      try {
        const parsed = JSON.parse(decodeCookieValue(cookieMap[base]))
        const token = parsed?.access_token ?? parsed?.currentSession?.access_token
        if (token) return token
      } catch { /* continua */ }
    }

    // Montar a partir de chunks .0, .1, .2, ...
    let assembled = ''
    for (let i = 0; i < 10; i++) {
      const chunk = cookieMap[`${base}.${i}`]
      if (!chunk) break
      assembled += chunk  // chunks já são partes do base64 — concatenar raw
    }
    if (assembled) {
      try {
        const parsed = JSON.parse(decodeCookieValue(assembled))
        const token = parsed?.access_token ?? parsed?.currentSession?.access_token
        if (token) return token
      } catch { /* continua */ }
    }
  }

  return ''
}

/**
 * Faz fetch autenticado usando o access_token da sessão Supabase.
 * Substitui o padrão: const token = getAccessToken(); fetch(..., { headers: { Authorization: `Bearer ${token}` } })
 */
export async function authFetch(url: string, opts?: RequestInit): Promise<Response> {
  // 1. Tenta ler diretamente dos cookies (funciona mesmo antes do browser client inicializar)
  let token = getAccessToken()

  // 2. Fallback: getSession() do browser client (necessário em alguns fluxos OAuth)
  if (!token) {
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      token = data?.session?.access_token ?? ''
    } catch { /* noop */ }
  }

  const isFormData = opts?.body instanceof FormData
  return fetch(url, {
    ...opts,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(opts?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
