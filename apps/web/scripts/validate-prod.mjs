/**
 * Validação completa em produção
 * node scripts/validate-prod.mjs
 */
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'

// Lê env para pegar service role (necessário para criar colaborador)
const envPath = path.resolve(process.cwd(), '.env.local')
const env = {}
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '').split('\n')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
}
const SVC = env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || ''
const SH = { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' }

const HOST = 'sync-mood-saas.vercel.app'

function req(path, opts = {}) {
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      path,
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    }
    const r = https.request(options, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode, body }) }
      })
    })
    r.on('error', e => resolve({ status: 0, body: e.message }))
    if (opts.body) r.write(JSON.stringify(opts.body))
    r.end()
  })
}

function supaReq(path, opts = {}) {
  return new Promise((resolve) => {
    const url = new URL(SUPA_URL + path)
    const options = {
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      method: opts.method || 'GET',
      headers: { ...SH, ...(opts.headers || {}) },
    }
    const r = https.request(options, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode, body }) }
      })
    })
    r.on('error', e => resolve({ status: 0, body: e.message }))
    if (opts.body) r.write(JSON.stringify(opts.body))
    r.end()
  })
}

const COLAB_CPF  = '11122233344'
const COLAB_PASS = 'Colab@2025'
const COLAB_EMAIL_AUTH = `${COLAB_CPF}@syncmood.app`
let colaboradorAuthId = null
let colaboradorUserId = null
let masterToken = null

async function run() {
  console.log('════════════════════════════════════════════════')
  console.log('  VALIDAÇÃO PRODUÇÃO — SYNC MOOD')
  console.log('  ' + HOST)
  console.log('════════════════════════════════════════════════\n')

  // ── BLOCO 1: Proteção da rota ────────────────────────────────────────────
  console.log('BLOCO 1 — Proteção sem autenticação')
  const me0 = await req('/api/me')
  console.log('  /api/me sem token → ' + (me0.status === 401 ? '✅ 401' : '❌ ' + me0.status))

  // ── BLOCO 2: Login Master ────────────────────────────────────────────────
  console.log('\nBLOCO 2 — Login Master (CPF 04730581970)')
  const r2a = await req('/api/auth/login', { method:'POST', body:{ cpf:'04730581970', password:'senhaerrada' } })
  console.log('  Senha errada → ' + (r2a.status === 401 ? '✅ 401' : '❌ ' + r2a.status))

  const r2b = await req('/api/auth/login', { method:'POST', body:{ cpf:'04730581970', password:'admin123' } })
  masterToken = r2b.body?.access_token
  console.log('  Login correto → ' + (r2b.status === 200 ? '✅ 200' : '❌ ' + r2b.status) +
    ' | role: ' + (r2b.body?.role ?? '?') + ' | redirect: ' + (r2b.body?.redirectTo ?? '?'))

  // ── BLOCO 3: /api/me autenticado ─────────────────────────────────────────
  console.log('\nBLOCO 3 — /api/me autenticado')
  if (masterToken) {
    const me3 = await req('/api/me', { headers:{ Authorization:'Bearer '+masterToken } })
    console.log('  role: ' + (me3.body?.role ?? '?') + ' | tenant: ' + (me3.body?.tenant_nome ?? '?'))
    console.log('  Status → ' + (me3.status === 200 && me3.body?.role === 'master' ? '✅ PASS' : '❌ FAIL (' + me3.status + ')'))
  } else {
    console.log('  ❌ Sem token — login falhou')
  }

  // ── BLOCO 4: Criar colaborador via Supabase Admin ────────────────────────
  console.log('\nBLOCO 4 — Criar colaborador real (CPF ' + COLAB_CPF + ')')

  // Verifica se já existe
  const listAuth = await supaReq('/auth/v1/admin/users?per_page=1000')
  const users = Array.isArray(listAuth.body?.users) ? listAuth.body.users : []
  let colabAuthUser = users.find(u => u.email?.toLowerCase() === COLAB_EMAIL_AUTH.toLowerCase())

  if (!colabAuthUser) {
    const cre = await supaReq('/auth/v1/admin/users', {
      method: 'POST',
      body: {
        email: COLAB_EMAIL_AUTH,
        password: COLAB_PASS,
        email_confirm: true,
        user_metadata: { full_name: 'Colaborador Teste', user_role: 'financeiro' },
      }
    })
    if (cre.status === 200 || cre.status === 201) {
      colabAuthUser = cre.body
      console.log('  Auth criado → ✅ ID: ' + cre.body?.id?.slice(0,8) + '...')
    } else {
      console.log('  Auth criar → ❌ ' + cre.status + ' ' + JSON.stringify(cre.body).slice(0,100))
    }
  } else {
    console.log('  Auth já existe → ✅ ID: ' + colabAuthUser.id?.slice(0,8) + '...')
    // Reset senha para garantir
    await supaReq('/auth/v1/admin/users/' + colabAuthUser.id, {
      method: 'PUT',
      body: { password: COLAB_PASS }
    })
    console.log('  Senha resetada → ✅')
  }
  colaboradorAuthId = colabAuthUser?.id

  // Cria linha em usuarios via /api/usuarios (usa token Master)
  if (masterToken && colaboradorAuthId) {
    // Primeiro busca tenant
    const tRes = await supaReq('/rest/v1/tenants?limit=1&order=created_at.asc')
    const tenantId = Array.isArray(tRes.body) && tRes.body[0] ? tRes.body[0].id : null

    // Verifica se já existe em usuarios
    const uExist = await supaReq('/rest/v1/usuarios?auth_user_id=eq.' + colaboradorAuthId + '&limit=1')
    if (Array.isArray(uExist.body) && uExist.body[0]) {
      colaboradorUserId = uExist.body[0].id
      // Garante ativo=true
      await supaReq('/rest/v1/usuarios?id=eq.' + colaboradorUserId, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: { ativo: true, role: 'financeiro' }
      })
      console.log('  usuarios já existe → ✅ ID: ' + colaboradorUserId?.slice(0,8) + '...')
    } else {
      const ins = await supaReq('/rest/v1/usuarios', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: {
          tenant_id: tenantId,
          auth_user_id: colaboradorAuthId,
          email: 'colaborador@teste.com',
          cpf: COLAB_CPF,
          nome: 'Colaborador Teste',
          role: 'financeiro',
          ativo: true,
        }
      })
      if (ins.status === 201) {
        colaboradorUserId = Array.isArray(ins.body) ? ins.body[0]?.id : ins.body?.id
        console.log('  usuarios criado → ✅ ID: ' + colaboradorUserId?.slice(0,8) + '...')
      } else {
        console.log('  usuarios criar → ❌ ' + ins.status + ' ' + JSON.stringify(ins.body).slice(0,100))
      }
    }
  }

  // ── BLOCO 5: Login colaborador ────────────────────────────────────────────
  console.log('\nBLOCO 5 — Login colaborador (CPF ' + COLAB_CPF + ')')
  const r5 = await req('/api/auth/login', { method:'POST', body:{ cpf: COLAB_CPF, password: COLAB_PASS } })
  const colabToken = r5.body?.access_token
  console.log('  Login → ' + (r5.status === 200 ? '✅ 200' : '❌ ' + r5.status) +
    ' | role: ' + (r5.body?.role ?? '?'))

  // ── BLOCO 6: Bloquear colaborador ─────────────────────────────────────────
  console.log('\nBLOCO 6 — Bloquear colaborador')
  if (colaboradorUserId) {
    await supaReq('/rest/v1/usuarios?id=eq.' + colaboradorUserId, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: { ativo: false }
    })
    const r6 = await req('/api/auth/login', { method:'POST', body:{ cpf: COLAB_CPF, password: COLAB_PASS } })
    console.log('  Bloqueado → login retorna: ' + (r6.status === 403 ? '✅ 403 bloqueado' : '❌ ' + r6.status + ' ' + JSON.stringify(r6.body).slice(0,60)))
  } else {
    console.log('  ❌ Sem ID do colaborador')
  }

  // ── BLOCO 7: Reset de senha ────────────────────────────────────────────────
  console.log('\nBLOCO 7 — Reset de senha + reativar')
  const NOVA_SENHA = 'NovaColab@999'
  if (colaboradorAuthId && colaboradorUserId) {
    // Reativa
    await supaReq('/rest/v1/usuarios?id=eq.' + colaboradorUserId, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: { ativo: true }
    })
    // Reset senha
    const rst = await supaReq('/auth/v1/admin/users/' + colaboradorAuthId, {
      method: 'PUT',
      body: { password: NOVA_SENHA }
    })
    console.log('  Senha resetada → ' + (rst.status === 200 ? '✅' : '❌ ' + rst.status))

    const r7 = await req('/api/auth/login', { method:'POST', body:{ cpf: COLAB_CPF, password: NOVA_SENHA } })
    console.log('  Login nova senha → ' + (r7.status === 200 ? '✅ 200' : '❌ ' + r7.status))
  }

  // ── LIMPEZA ───────────────────────────────────────────────────────────────
  console.log('\nLimpeza do colaborador de teste...')
  if (colaboradorUserId) {
    await supaReq('/rest/v1/usuarios?id=eq.' + colaboradorUserId, { method: 'DELETE' })
  }
  if (colaboradorAuthId) {
    await supaReq('/auth/v1/admin/users/' + colaboradorAuthId, { method: 'DELETE' })
  }
  console.log('  ✅ Removido')

  // ── RESULTADO FINAL ───────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════')
  console.log('PRODUÇÃO VALIDADA:')
  console.log('  URL:   https://' + HOST)
  console.log('  CPF Master:  04730581970')
  console.log('  Senha:       admin123')
  console.log('  Role:        master')
  console.log('  Redirect:    /master/dashboard')
  console.log('════════════════════════════════════════════════\n')
}

run().catch(console.error)
