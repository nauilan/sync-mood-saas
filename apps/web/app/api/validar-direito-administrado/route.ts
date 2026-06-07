import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function supabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function autenticar(sb: ReturnType<typeof supabase>, req: NextRequest): Promise<string | null> {
  if (!sb) return null
  const auth = req.headers.get('authorization') ?? ''
  let token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    const chunks: string[] = []
    for (const c of req.cookies.getAll()) {
      const m = c.name.match(/auth-token\.(\d+)$/)
      if (m) { chunks[parseInt(m[1])] = c.value; continue }
      if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) { chunks[0] = c.value }
    }
    const joined = chunks.filter(Boolean).join('')
    if (joined) {
      try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) token = p.access_token } catch { /* */ }
      if (!token) { try { const p = JSON.parse(joined); if (p?.access_token) token = p.access_token } catch { /* */ } }
    }
  }
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  return (usuario as any)?.tenant_id ?? null
}

/**
 * POST /api/validar-direito-administrado
 *
 * Trava operacional central — valida se uma administradora pode representar
 * um direito específico de uma editora original em um território e data.
 *
 * Body: {
 *   editora_original_id: string   (UUID)
 *   administradora_id:   string   (UUID)
 *   direito_codigo:      string   (ex: 'execucao_publica', 'fonodigital')
 *   territorio:          string   ('brasil' | 'exterior' | código ISO)
 *   data_referencia?:    string   (YYYY-MM-DD, default: hoje)
 * }
 *
 * Retorna: { permitido, motivo, pct_editora_original, pct_administradora,
 *            negocio_editorial_id, territorio, direito_codigo }
 */
export async function POST(req: NextRequest) {
  const sb = supabase()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { editora_original_id, administradora_id, direito_codigo, territorio, data_referencia } = body

  if (!editora_original_id) return NextResponse.json({ error: 'editora_original_id obrigatório' }, { status: 400 })
  if (!administradora_id)   return NextResponse.json({ error: 'administradora_id obrigatório' }, { status: 400 })
  if (!direito_codigo)      return NextResponse.json({ error: 'direito_codigo obrigatório' }, { status: 400 })
  if (!territorio)          return NextResponse.json({ error: 'territorio obrigatório' }, { status: 400 })

  const { data, error } = await sb.rpc('validar_direito_administrado', {
    p_editora_original_id: editora_original_id,
    p_administradora_id:   administradora_id,
    p_direito_codigo:      direito_codigo,
    p_territorio:          territorio,
    p_data_referencia:     data_referencia ?? new Date().toISOString().slice(0, 10),
    p_tenant_id:           tenant_id,   // obrigatório: service_role bypassa RLS
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
