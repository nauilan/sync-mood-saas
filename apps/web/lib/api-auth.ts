import { NextRequest } from 'next/server'

export type UsuarioAutenticado = {
  id: string
  tenant_id: string
  role: string
}

function cleanToken(token: string): string {
  return token.replace(/[\uFEFF\u200B\u200C\u200D\u00AD]/g, '').trim()
}

function charCodes(value: string, limit: number, fromEnd = false): number[] {
  const chars = fromEnd ? value.slice(-limit) : value.slice(0, limit)
  return Array.from(chars).map(char => char.charCodeAt(0))
}

function getRawToken(req: NextRequest): { source: 'authorization' | 'cookie' | 'none'; token: string } {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return { source: 'authorization', token: auth.slice(7) }

  const chunks: string[] = []
  for (const c of req.cookies.getAll()) {
    const m = c.name.match(/auth-token\.(\d+)$/)
    if (m) { chunks[parseInt(m[1])] = c.value; continue }
    if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) { chunks[0] = c.value }
  }
  const joined = chunks.filter(Boolean).join('')
  if (joined) {
    try {
      const p = JSON.parse(decodeURIComponent(joined))
      if (p?.access_token) return { source: 'cookie', token: String(p.access_token) }
    } catch { /* */ }
    try {
      const p = JSON.parse(joined)
      if (p?.access_token) return { source: 'cookie', token: String(p.access_token) }
    } catch { /* */ }
  }

  return { source: 'none', token: '' }
}

export function getToken(req: NextRequest): string {
  return cleanToken(getRawToken(req).token)
}

function serializeAuthError(error: unknown) {
  if (!error || typeof error !== 'object') return error
  const err = error as Record<string, unknown>
  return {
    name: err.name,
    message: err.message,
    status: err.status,
    code: err.code,
    stack: err.stack,
    raw: JSON.stringify(err),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function logAuthByteDebug(label: string, req: NextRequest, sb: any): Promise<void> {
  const raw = getRawToken(req)
  const cleaned = cleanToken(raw.token)

  console.info(`[auth-byte-debug][${label}][token]`, {
    source: raw.source,
    hasAuthorizationHeader: Boolean(req.headers.get('authorization')),
    cookieNames: req.cookies.getAll().map(cookie => cookie.name),
    rawLength: raw.token.length,
    rawFirst10Codes: charCodes(raw.token, 10),
    rawLast5Codes: charCodes(raw.token, 5, true),
    cleanedLength: cleaned.length,
    cleanedFirst10Codes: charCodes(cleaned, 10),
    cleanedLast5Codes: charCodes(cleaned, 5, true),
  })

  if (!cleaned) {
    console.info(`[auth-byte-debug][${label}][getUser]`, {
      attempted: false,
      reason: 'empty-token-after-clean',
    })
    return
  }

  try {
    const { data, error } = await sb.auth.getUser(cleaned)
    console.info(`[auth-byte-debug][${label}][getUser]`, {
      attempted: true,
      hasUser: Boolean(data?.user),
      userId: data?.user?.id ?? null,
      error: serializeAuthError(error),
    })
  } catch (error) {
    console.error(`[auth-byte-debug][${label}][getUser-thrown]`, serializeAuthError(error))
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function autenticar(req: NextRequest, sb: any): Promise<UsuarioAutenticado | null> {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  return data as UsuarioAutenticado | null
}