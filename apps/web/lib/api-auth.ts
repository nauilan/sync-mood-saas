import { NextRequest } from 'next/server'

export type UsuarioAutenticado = {
  id: string
  tenant_id: string
  role: string
}

function cleanToken(token: string): string {
  return token.replace(/[\uFEFF\u200B\u200C\u200D\u00AD]/g, '').trim()
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function autenticar(req: NextRequest, sb: any): Promise<UsuarioAutenticado | null> {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  return data as UsuarioAutenticado | null
}