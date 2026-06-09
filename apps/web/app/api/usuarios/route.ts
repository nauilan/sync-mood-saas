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

interface UsuarioAtual { tenant_id: string; role: string }

async function getTenantId(authUserId: string): Promise<UsuarioAtual | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios?select=tenant_id,role&auth_user_id=eq.${authUserId}&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  )
  const data = await res.json()
  return Array.isArray(data) && data[0] ? (data[0] as UsuarioAtual) : null
}

// GET /api/usuarios — lista usuários do tenant
export async function GET(req: NextRequest) {
  const token = getToken(req)
  const authUser = await getAuthUser(token)
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const usuarioAtual = await getTenantId(authUser.id)
  if (!usuarioAtual?.tenant_id) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })

  // Apenas master/admin pode gerenciar usuários
  if (!['master', 'admin', 'super_admin'].includes(usuarioAtual.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios?tenant_id=eq.${usuarioAtual.tenant_id}&order=created_at.asc`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  )
  const data = await res.json()
  return NextResponse.json({ usuarios: Array.isArray(data) ? data : [] })
}

// POST /api/usuarios — cria novo usuário
export async function POST(req: NextRequest) {
  const token = getToken(req)
  const authUser = await getAuthUser(token)
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const usuarioAtual = await getTenantId(authUser.id)
  if (!usuarioAtual?.tenant_id) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })
  if (!['master', 'admin', 'super_admin'].includes(usuarioAtual.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  let body: { nome?: string; email?: string; cpf?: string; senha?: string; role?: string; telefone?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const { nome, email, cpf, senha, role = 'atendimento', telefone } = body
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  if (!senha?.trim() || senha.length < 6) return NextResponse.json({ error: 'Senha mínima de 6 caracteres' }, { status: 400 })

  // Resolve e-mail para Supabase Auth
  let authEmail = ''
  if (email?.includes('@')) {
    authEmail = email.trim()
  } else if (cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) return NextResponse.json({ error: 'CPF inválido (precisa de 11 dígitos)' }, { status: 400 })
    authEmail = `${cpfLimpo}@syncmood.app`
  } else {
    return NextResponse.json({ error: 'Informe e-mail ou CPF' }, { status: 400 })
  }

  // 1. Criar no Supabase Auth via Admin API
  const createAuthRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: authEmail,
      password: senha,
      email_confirm: true,
      user_metadata: { full_name: nome, user_role: role },
    }),
  })

  if (!createAuthRes.ok) {
    const errData = await createAuthRes.json()
    const msg = errData?.msg ?? errData?.message ?? 'Erro ao criar usuário na autenticação'
    if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
      return NextResponse.json({ error: 'E-mail ou CPF já cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const newAuthUser = await createAuthRes.json()

  // 2. Inserir na tabela usuarios
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      tenant_id:    usuarioAtual.tenant_id,
      auth_user_id: newAuthUser.id,
      email:        authEmail,
      cpf:          cpf ? cpf.replace(/\D/g, '') : null,
      nome:         nome.trim(),
      role,
      // telefone: somente se a coluna existir (migration 046). Omitido se null para evitar erro
      ...(telefone?.trim() ? { telefone: telefone.trim() } : {}),
      ativo:        true,
    }),
  })

  if (!insertRes.ok) {
    // Rollback: deletar o auth user criado
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${newAuthUser.id}`, {
      method: 'DELETE',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    })
    const errData = await insertRes.json()
    return NextResponse.json({ error: errData?.message ?? 'Erro ao salvar usuário' }, { status: 500 })
  }

  const inserted = await insertRes.json()
  const usuario = Array.isArray(inserted) ? inserted[0] : inserted

  // 3. Audit log (não bloqueia em caso de erro)
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id:       usuarioAtual.tenant_id,
        usuario_id:      authUser.id,
        origem_execucao: 'usuario',
        acao:            'criar',
        modulo:          'config',
        tabela_afetada:  'usuarios',
        registro_id:     String(usuario?.id ?? ''),
        dados_novos:     { nome, email: authEmail, role },
      }),
    })
  } catch { /* não bloqueia */ }

  return NextResponse.json({ usuario }, { status: 201 })
}
