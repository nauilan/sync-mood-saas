import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const SERVICE_KEY  = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

function getToken(req: NextRequest): string {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const chunks: string[] = []
  for (const c of req.cookies.getAll()) {
    const m = c.name.match(/auth-token\.(\d+)$/)
    if (m) { chunks[parseInt(m[1])] = c.value; continue }
    if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) { chunks[0] = c.value }
  }
  const joined = chunks.filter(Boolean).join('')
  if (joined) {
    try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) return p.access_token } catch { /* */ }
    try { const p = JSON.parse(joined); if (p?.access_token) return p.access_token } catch { /* */ }
  }
  return ANON_KEY
}

async function getAuthUser(token: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

async function getUsuarioAtual(authUserId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios?select=tenant_id,role&auth_user_id=eq.${authUserId}&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  )
  const data = await res.json()
  return Array.isArray(data) && data[0] ? data[0] : null
}

// PUT /api/usuarios/[id] — atualiza nome, role, ativo, telefone
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getToken(req)
  const authUser = await getAuthUser(token)
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const usuarioAtual = await getUsuarioAtual(authUser.id)
  if (!usuarioAtual) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  if (!['master', 'admin', 'super_admin'].includes(usuarioAtual.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  // Busca usuário alvo para verificar tenant
  const targetRes = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios?select=id,auth_user_id,nome,role,ativo&id=eq.${id}&tenant_id=eq.${usuarioAtual.tenant_id}&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  )
  const targetData = await targetRes.json()
  const target = Array.isArray(targetData) && targetData[0] ? targetData[0] : null
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  if (body.nome      !== undefined) updates.nome      = body.nome
  if (body.role      !== undefined) updates.role      = body.role
  if (body.ativo     !== undefined) updates.ativo     = body.ativo
  if (body.telefone  !== undefined) updates.telefone  = body.telefone

  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updates),
    }
  )
  if (!updateRes.ok) return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  const updated = await updateRes.json()

  // Audit log
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id:       usuarioAtual.tenant_id,
        usuario_id:      authUser.id,
        origem_execucao: 'usuario',
        acao:            'alterar',
        modulo:          'config',
        tabela_afetada:  'usuarios',
        registro_id:     id,
        dados_anteriores:{ nome: target.nome, role: target.role, ativo: target.ativo },
        dados_novos:     updates,
      }),
    })
  } catch { /* não bloqueia */ }

  return NextResponse.json({ usuario: Array.isArray(updated) ? updated[0] : updated })
}

// POST /api/usuarios/[id] com body { action: 'reset_senha', nova_senha: '...' }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getToken(req)
  const authUser = await getAuthUser(token)
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const usuarioAtual = await getUsuarioAtual(authUser.id)
  if (!['master', 'admin', 'super_admin'].includes(usuarioAtual?.role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  let body: { action?: string; nova_senha?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  if (body.action !== 'reset_senha') {
    return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  }
  if (!body.nova_senha || body.nova_senha.length < 6) {
    return NextResponse.json({ error: 'Senha mínima de 6 caracteres' }, { status: 400 })
  }

  // Busca auth_user_id do alvo
  const targetRes = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios?select=auth_user_id&id=eq.${id}&tenant_id=eq.${usuarioAtual.tenant_id}&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  )
  const targetData = await targetRes.json()
  const target = Array.isArray(targetData) && targetData[0] ? targetData[0] : null
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Atualiza senha via Admin API
  const resetRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${target.auth_user_id}`, {
    method: 'PUT',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: body.nova_senha }),
  })
  if (!resetRes.ok) {
    const errData = await resetRes.json()
    return NextResponse.json({ error: errData?.message ?? 'Erro ao redefinir senha' }, { status: 500 })
  }

  // Audit log
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id:       usuarioAtual.tenant_id,
        usuario_id:      authUser.id,
        origem_execucao: 'usuario',
        acao:            'alterar',
        modulo:          'config',
        tabela_afetada:  'auth.users',
        registro_id:     id,
        dados_novos:     { acao: 'reset_senha_pelo_master' },
      }),
    })
  } catch { /* não bloqueia */ }

  return NextResponse.json({ ok: true, message: 'Senha redefinida com sucesso' })
}
