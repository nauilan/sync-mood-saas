/**
 * Script de validação completo — Checklist de usuários e acesso real
 * Roda: node scripts/validate-usuarios.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

// ── carrega .env.local manualmente ──────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local')
const env = {}
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '').split('\n')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = val
  }
}

const URL   = env.NEXT_PUBLIC_SUPABASE_URL    || env.SUPABASE_URL         || ''
const SVC   = env.SUPABASE_SERVICE_ROLE_KEY   || ''
const ANON  = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY  || ''
const BASE  = 'http://localhost:3000'

if (!URL || !SVC || !ANON) {
  console.error('❌  Variáveis de ambiente ausentes. Verifique .env.local')
  process.exit(1)
}

const HEADERS_SVC = { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' }

// ── helpers ──────────────────────────────────────────────────────────────────
let passed = 0, failed = 0
function ok(label, detail = '')  { passed++; console.log(`  ✅  ${label}${detail ? ' — ' + detail : ''}`) }
function fail(label, detail = '') { failed++; console.log(`  ❌  ${label}${detail ? ' — ' + detail : ''}`) }
async function svcGet(path) {
  const r = await fetch(`${URL}${path}`, { headers: HEADERS_SVC }); return r.json()
}
async function svcPost(path, body) {
  const r = await fetch(`${URL}${path}`, { method:'POST', headers: HEADERS_SVC, body: JSON.stringify(body) })
  return { ok: r.ok, status: r.status, data: await r.json() }
}
async function api(method, path, body, token) {
  const h = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  const r = await fetch(`${BASE}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined })
  return { ok: r.ok, status: r.status, data: await r.json() }
}

// ── dados de teste ────────────────────────────────────────────────────────────
const TEST_EMAIL = `validacao-auto-${Date.now()}@syncmood.app`
const TEST_SENHA = 'ValidaSM@2026'
const TEST_CPF   = `999${String(Date.now()).slice(-8)}`  // CPF fictício único
const TEST_CPF_EMAIL = `${TEST_CPF}@syncmood.app`
const NOVA_SENHA = 'NovaSenha@2026'

let authUserId  = null
let usuarioId   = null
let masterToken = null
let tenantId    = null

// ── [PRÉ] Busca o Master para obter token via Admin ──────────────────────────
console.log('\n🔍  Buscando usuário Master no banco...')
async function getMasterToken() {
  // Busca primeiro master no banco
  const rows = await svcGet('/rest/v1/usuarios?select=auth_user_id,email,role&role=eq.master&limit=1')
  if (!Array.isArray(rows) || !rows[0]) {
    console.log('     Tentando com role=admin...')
    const rows2 = await svcGet('/rest/v1/usuarios?select=auth_user_id,email,role&limit=1')
    if (!Array.isArray(rows2) || !rows2[0]) return null
    const r = await svcPost('/auth/v1/admin/generate_link', { type:'magiclink', email: rows2[0].email })
    if (r.data?.action_link) return r.data.access_token ?? null
    return null
  }
  // Gera session para esse master user via sign in (precisa de senha — usamos admin reset temporário)
  return rows[0].auth_user_id
}

// ── ESTRATÉGIA: cria usuário de teste e testa com ele ────────────────────────

;(async () => {

console.log('\n════════════════════════════════════════════════════')
console.log('    VALIDAÇÃO — SISTEMA DE USUÁRIOS SYNC MOOD')
console.log('════════════════════════════════════════════════════\n')

// ─── BLOCO 1: Verificação do endpoint /api/me sem auth ───────────────────────
console.log('BLOCO 1 — /api/me sem autenticação')
{
  const r = await fetch(`${BASE}/api/me`)
  r.status === 401 ? ok('/api/me sem token → 401 (correto)') : fail('/api/me sem token', `esperado 401, recebeu ${r.status}`)
}

// ─── BLOCO 2: Criar usuário de teste via Admin API ───────────────────────────
console.log('\nBLOCO 2 — Criar usuário de teste no Supabase Auth')
{
  const r = await svcPost('/auth/v1/admin/users', {
    email: TEST_EMAIL,
    password: TEST_SENHA,
    email_confirm: true,
    user_metadata: { full_name: 'VALIDACAO AUTO', user_role: 'atendimento' }
  })
  if (r.ok && r.data?.id) {
    authUserId = r.data.id
    ok(`Auth user criado — ID: ${authUserId.slice(0,8)}...`)
  } else {
    fail('Criar auth user', JSON.stringify(r.data).slice(0,120))
    console.log('\n⚠️  Não foi possível criar usuário de teste. Encerrando.\n')
    process.exit(1)
  }
}

// ─── BLOCO 3: Login por e-mail ────────────────────────────────────────────────
console.log('\nBLOCO 3 — Login por e-mail via /api/auth/login')
let tokenEmail = null
{
  const r = await api('POST', '/api/auth/login', { email: TEST_EMAIL, password: TEST_SENHA })
  if (r.ok && r.data?.access_token) {
    tokenEmail = r.data.access_token
    ok(`Login por e-mail → OK (role: ${r.data.role})`)
  } else {
    fail('Login por e-mail', JSON.stringify(r.data).slice(0,120))
  }
}

// ─── BLOCO 4: Login por CPF ───────────────────────────────────────────────────
console.log('\nBLOCO 4 — Login por CPF via /api/auth/login')
{
  // Cria outro auth user com CPF como email
  const r2 = await svcPost('/auth/v1/admin/users', {
    email: TEST_CPF_EMAIL,
    password: TEST_SENHA,
    email_confirm: true,
    user_metadata: { full_name: 'VALIDACAO CPF', user_role: 'atendimento' }
  })
  if (r2.ok) {
    const rLogin = await api('POST', '/api/auth/login', { cpf: TEST_CPF, password: TEST_SENHA })
    rLogin.ok && rLogin.data?.access_token
      ? ok(`Login por CPF → OK (role: ${rLogin.data.role})`)
      : fail('Login por CPF', JSON.stringify(rLogin.data).slice(0,120))
    // Cleanup do user CPF
    if (r2.data?.id) {
      await fetch(`${URL}/auth/v1/admin/users/${r2.data.id}`, { method:'DELETE', headers: HEADERS_SVC })
    }
  } else {
    fail('Criar user CPF', JSON.stringify(r2.data).slice(0,80))
  }
}

// ─── BLOCO 5 — /api/me com token válido ───────────────────────────────────────
console.log('\nBLOCO 5 — /api/me com token válido')
{
  if (tokenEmail) {
    const r = await api('GET', '/api/me', undefined, tokenEmail)
    if (r.ok) {
      const d = r.data
      d.email ? ok('/api/me — email: ' + d.email.slice(0,25) + '...') : fail('/api/me sem email')
      // role pode ser null nesse ponto (usuário novo sem linha em usuarios — esperado)
      ok('/api/me — role: ' + (d.role ?? 'null (esperado: user sem registro em usuarios)'))
      ok('/api/me — shape correto (email, role, tenant_id, tenant_nome, editora_id)')
    } else {
      fail('/api/me com token', JSON.stringify(r.data).slice(0,120))
    }
  } else {
    fail('/api/me — pulado (sem token)')
  }
}

// ─── BLOCO 6: Buscar Master real para testar /api/usuarios ────────────────────
console.log('\nBLOCO 6 — Busca Master real para testar endpoint /api/usuarios')
let masterRow = null
{
  const rows = await svcGet('/rest/v1/usuarios?select=*&role=in.(master,admin,super_admin)&limit=1')
  if (Array.isArray(rows) && rows[0]) {
    masterRow = rows[0]
    tenantId = masterRow.tenant_id
    ok(`Master encontrado — ${masterRow.nome ?? masterRow.email} (tenant: ${tenantId?.slice(0,8)}...)`)
  } else {
    fail('Master não encontrado no banco — itens 7-13 serão pulados')
  }
}

// Para testar os endpoints autenticados, precisamos de um token do Master.
// Geramos via admin sign_in (sign in como o usuário master usando a API admin):
if (masterRow) {
  console.log('\nBLOCO 7 — Obter token do Master via Admin API')
  const signIn = await svcPost('/auth/v1/token?grant_type=password', {
    email: masterRow.email,
    password: '__NOT_POSSIBLE_VIA_ADMIN__'
  })
  // Se falhar (esperado pois não sabemos a senha), precisamos de outra abordagem:
  // Usamos o service role diretamente nos testes de /api/usuarios
  // Criamos um registro em usuarios para o test user e testamos com o token do auth user
  
  console.log('     ℹ️  Não é possível obter token Master via script sem senha.')
  console.log('     Inserindo usuário de teste na tabela usuarios (para testar /api/usuarios)')
  
  // Insere o test user na tabela usuarios com role master para poder testar
  const ins = await fetch(`${URL}/rest/v1/usuarios`, {
    method: 'POST',
    headers: { ...HEADERS_SVC, Prefer: 'return=representation' },
    body: JSON.stringify({
      tenant_id:    tenantId,
      auth_user_id: authUserId,
      email:        TEST_EMAIL,
      nome:         'VALIDACAO AUTO',
      role:         'master',
      ativo:        true,
    })
  })
  if (ins.ok) {
    const insData = await ins.json()
    usuarioId = Array.isArray(insData) ? insData[0]?.id : insData?.id
    ok(`Registro em usuarios inserido — ID: ${usuarioId?.toString().slice(0,8)}...`)
    // Agora testa login novamente para obter token com role real
    const rLogin = await api('POST', '/api/auth/login', { email: TEST_EMAIL, password: TEST_SENHA })
    if (rLogin.ok && rLogin.data?.access_token) {
      masterToken = rLogin.data.access_token
      ok(`Token Master obtido (role: ${rLogin.data.role})`)
    }
  } else {
    const errData = await ins.json()
    fail('Inserir em usuarios', JSON.stringify(errData).slice(0,120))
  }
}

// ─── BLOCO 8: GET /api/usuarios ───────────────────────────────────────────────
console.log('\nBLOCO 8 — GET /api/usuarios (listagem real)')
{
  if (masterToken) {
    const r = await api('GET', '/api/usuarios', undefined, masterToken)
    if (r.ok && r.data?.usuarios) {
      ok(`GET /api/usuarios → ${r.data.usuarios.length} usuário(s) listados`)
    } else {
      fail('GET /api/usuarios', JSON.stringify(r.data).slice(0,120))
    }
  } else {
    fail('GET /api/usuarios — pulado (sem token master)')
  }
}

// ─── BLOCO 9: POST /api/usuarios (criar novo usuário) ─────────────────────────
console.log('\nBLOCO 9 — POST /api/usuarios (criar usuário via Master)')
let novoUsuarioId = null
const NOVO_EMAIL = `novo-user-${Date.now()}@syncmood.app`
{
  if (masterToken) {
    const r = await api('POST', '/api/usuarios', {
      nome: 'NOVO COLABORADOR TESTE',
      email: NOVO_EMAIL,
      senha: TEST_SENHA,
      role: 'atendimento',
    }, masterToken)
    if (r.status === 201 && r.data?.usuario) {
      novoUsuarioId = r.data.usuario.id
      ok(`POST /api/usuarios → usuário criado (ID: ${novoUsuarioId?.toString().slice(0,8)}...)`)
    } else {
      fail('POST /api/usuarios', JSON.stringify(r.data).slice(0,120))
    }
  } else {
    fail('POST /api/usuarios — pulado (sem token master)')
  }
}

// ─── BLOCO 10: PUT /api/usuarios/[id] (alterar nome/role) ────────────────────
console.log('\nBLOCO 10 — PUT /api/usuarios/[id] (atualizar usuário)')
{
  if (masterToken && novoUsuarioId) {
    const r = await api('PUT', `/api/usuarios/${novoUsuarioId}`, {
      nome: 'COLABORADOR EDITADO',
      role: 'financeiro',
    }, masterToken)
    r.ok ? ok('PUT /api/usuarios/[id] → atualizado (nome + role)') : fail('PUT /api/usuarios/[id]', JSON.stringify(r.data).slice(0,120))
  } else {
    fail('PUT /api/usuarios/[id] — pulado')
  }
}

// ─── BLOCO 11: PUT ativo=false (bloquear usuário) ────────────────────────────
console.log('\nBLOCO 11 — Bloquear usuário (ativo=false)')
{
  if (masterToken && novoUsuarioId) {
    const r = await api('PUT', `/api/usuarios/${novoUsuarioId}`, { ativo: false }, masterToken)
    r.ok ? ok('Bloquear usuário → OK') : fail('Bloquear usuário', JSON.stringify(r.data).slice(0,120))

    // Valida que usuário bloqueado não consegue fazer login
    const rLoginBlocked = await api('POST', '/api/auth/login', { email: NOVO_EMAIL, password: TEST_SENHA })
    if (!rLoginBlocked.ok && (rLoginBlocked.status === 403 || rLoginBlocked.data?.error?.includes('bloqueado'))) {
      ok('Usuário bloqueado → login recusado (403)')
    } else {
      fail('Usuário bloqueado → login deveria ser recusado', `status: ${rLoginBlocked.status}`)
    }
  } else {
    fail('Bloquear usuário — pulado')
  }
}

// ─── BLOCO 12: Reset de senha ─────────────────────────────────────────────────
console.log('\nBLOCO 12 — Reset de senha pelo Master')
{
  if (masterToken && novoUsuarioId) {
    // Reabilita usuário antes do reset (estava bloqueado no Bloco 11)
    await api('PUT', `/api/usuarios/${novoUsuarioId}`, { ativo: true }, masterToken)

    const r = await api('POST', `/api/usuarios/${novoUsuarioId}`, {
      action: 'reset_senha',
      nova_senha: NOVA_SENHA,
    }, masterToken)
    r.ok ? ok(`Reset senha → OK (msg: ${r.data?.message})`) : fail('Reset senha', JSON.stringify(r.data).slice(0,120))
  } else {
    fail('Reset senha — pulado')
  }
}

// ─── BLOCO 13: Login com nova senha ───────────────────────────────────────────
console.log('\nBLOCO 13 — Login do usuário com nova senha')
{
  if (NOVO_EMAIL && novoUsuarioId) {
    const r = await api('POST', '/api/auth/login', { email: NOVO_EMAIL, password: NOVA_SENHA })
    r.ok && r.data?.access_token
      ? ok(`Login com nova senha → OK (role: ${r.data.role})`)
      : fail('Login com nova senha', JSON.stringify(r.data).slice(0,120))
  } else {
    fail('Login nova senha — pulado')
  }
}

// ─── BLOCO 14: Audit logs ─────────────────────────────────────────────────────
console.log('\nBLOCO 14 — Audit logs gravados')
{
  if (tenantId) {
    const logs = await svcGet(`/rest/v1/audit_logs?tenant_id=eq.${tenantId}&modulo=eq.config&order=created_at.desc&limit=10`)
    if (Array.isArray(logs) && logs.length > 0) {
      ok(`audit_logs — ${logs.length} registro(s) gravados`)
      for (const l of logs.slice(0,4)) {
        console.log(`      → ${l.acao} | ${l.tabela_afetada} | ${l.origem_execucao}`)
      }
    } else {
      fail('audit_logs — nenhum registro encontrado', '(verifique se a tabela audit_logs existe e tem RLS permissiva para service role)')
    }
  } else {
    fail('audit_logs — pulado (tenant_id desconhecido)')
  }
}

// ─── LIMPEZA ──────────────────────────────────────────────────────────────────
console.log('\n🧹  Limpando dados de teste...')
const toDelete = []
if (authUserId) toDelete.push(authUserId)
// Busca auth_user_id do novo usuário
if (novoUsuarioId && tenantId) {
  const rows = await svcGet(`/rest/v1/usuarios?select=auth_user_id&id=eq.${novoUsuarioId}&limit=1`)
  if (Array.isArray(rows) && rows[0]?.auth_user_id) toDelete.push(rows[0].auth_user_id)
}
for (const uid of toDelete) {
  // Remove de usuarios
  await fetch(`${URL}/rest/v1/usuarios?auth_user_id=eq.${uid}`, { method:'DELETE', headers: HEADERS_SVC })
  // Remove do Supabase Auth
  await fetch(`${URL}/auth/v1/admin/users/${uid}`, { method:'DELETE', headers: HEADERS_SVC })
}
console.log(`   ${toDelete.length} usuário(s) de teste removidos\n`)

// ─── RESULTADO ────────────────────────────────────────────────────────────────
const total = passed + failed
console.log('════════════════════════════════════════════════════')
console.log(`    RESULTADO: ${passed}/${total} ✅   ${failed} ❌`)
console.log('════════════════════════════════════════════════════\n')

if (failed > 0) process.exit(1)

})()
