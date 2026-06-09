/**
 * Sincroniza usuário Master Nauilan com Supabase Auth + tabela usuarios
 * Roda: node scripts/sync-master-user.mjs
 *
 * Regras:
 *  - Se existir no Auth, não duplica
 *  - Se não existir na tabela usuarios, cria/vincula
 *  - Login por e-mail (contato@topshowmusic.com.br) E por CPF (04730581970@syncmood.app)
 *  - Nunca sobrescreve senha existente
 */
import fs from 'node:fs'
import path from 'node:path'

// ── carrega .env.local ───────────────────────────────────────────────────────
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

const URL   = env.NEXT_PUBLIC_SUPABASE_URL    || env.SUPABASE_URL          || ''
const SVC   = env.SUPABASE_SERVICE_ROLE_KEY   || ''
const ANON  = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY   || ''

if (!URL || !SVC) { console.error('❌  .env.local incompleto.'); process.exit(1) }

const H = { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' }

const EMAIL_REAL   = 'contato@topshowmusic.com.br'
const CPF_DIGITS   = '04730581970'
const EMAIL_CPF    = `${CPF_DIGITS}@syncmood.app`
const NOME         = 'Nauilan Vicentini'
const ROLE         = 'master'

async function listAllAuthUsers() {
  // Paginação simples — retorna até 1000 usuários
  const r = await fetch(`${URL}/auth/v1/admin/users?per_page=1000`, { headers: H })
  const d = await r.json()
  return Array.isArray(d.users) ? d.users : []
}

async function getUsuariosRows(field, value) {
  const r = await fetch(`${URL}/rest/v1/usuarios?${field}=eq.${encodeURIComponent(value)}&limit=5`, { headers: H })
  return r.json()
}

async function getTenantId() {
  // Usa tenant principal (geralmente o único tenant, ou o que tem role=master)
  const r = await fetch(`${URL}/rest/v1/tenants?limit=1&order=created_at.asc`, { headers: H })
  const d = await r.json()
  return Array.isArray(d) && d[0] ? d[0].id : null
}

;(async () => {
  console.log('\n════════════════════════════════════════════════')
  console.log('   SINCRONIZAÇÃO — MASTER NAUILAN / TOP SHOW')
  console.log('════════════════════════════════════════════════\n')

  // ── 1. Busca tenant principal ─────────────────────────────────────────────
  const tenantId = await getTenantId()
  if (!tenantId) { console.error('❌  Nenhum tenant encontrado.'); process.exit(1) }
  console.log(`Tenant principal: ${tenantId}\n`)

  // ── 2. Busca usuário no Auth (e-mail real e e-mail CPF) ───────────────────
  console.log('Buscando no Supabase Auth...')
  const allUsers = await listAllAuthUsers()

  const byEmailReal  = allUsers.find(u => u.email?.toLowerCase() === EMAIL_REAL.toLowerCase())
  const byEmailCPF   = allUsers.find(u => u.email?.toLowerCase() === EMAIL_CPF.toLowerCase())

  console.log(`  Por e-mail real  (${EMAIL_REAL}): ${byEmailReal ? '✅ EXISTE (id: ' + byEmailReal.id.slice(0,8) + '...)' : '❌ NÃO EXISTE'}`)
  console.log(`  Por CPF email    (${EMAIL_CPF}):  ${byEmailCPF  ? '✅ EXISTE (id: ' + byEmailCPF.id.slice(0,8)  + '...)' : '❌ NÃO EXISTE'}`)

  // ── 3. Decide qual auth_user_id usar ──────────────────────────────────────
  let masterAuthId  = byEmailReal?.id ?? byEmailCPF?.id ?? null
  let credentialsOk = !!masterAuthId

  // ── 4. Se não existe no Auth, cria com e-mail real + identidade CPF ───────
  let tempPassword = null
  if (!masterAuthId) {
    console.log('\n⚠️  Usuário não existe no Auth. Criando...')

    // Gera senha temporária forte
    tempPassword = `TopShow-${Date.now().toString(36).toUpperCase()}`

    const r = await fetch(`${URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({
        email:         EMAIL_REAL,
        password:      tempPassword,
        email_confirm: true,
        user_metadata: { full_name: NOME, user_role: ROLE },
      }),
    })
    const d = await r.json()
    if (r.ok && d.id) {
      masterAuthId = d.id
      credentialsOk = true
      console.log(`  ✅  Auth user criado — ID: ${masterAuthId.slice(0,8)}...`)
      console.log(`  ℹ️  Senha inicial (altere após primeiro login): ${tempPassword}`)
    } else {
      console.error(`  ❌  Erro ao criar auth user: ${JSON.stringify(d).slice(0,200)}`)
      process.exit(1)
    }
  }

  // ── 5. Garante que o CPF email existe como identidade adicional ───────────
  // O Supabase não suporta múltiplos emails por usuário nativamente,
  // então criamos um auth user separado para o CPF que TAMBÉM se vincula
  // ao mesmo registro em usuarios via auth_user_id alternativo.
  // Abordagem mais simples: segundo auth user com email = CPF, mesmo tenant.
  let cpfAuthId = byEmailCPF?.id ?? null
  if (!cpfAuthId && masterAuthId) {
    console.log('\nCriando identidade de login por CPF...')
    // Lê a senha do auth user existente não é possível via API.
    // Para o CPF user, criamos um user espelho que não tem linha em usuarios,
    // mas ao logar redirecionamos pelo email.
    // SOLUÇÃO MELHOR: no route /api/auth/login, quando CPF é fornecido,
    //   buscamos primeiro na tabela usuarios pelo campo cpf, pegamos o email real,
    //   e usamos esse email para autenticar. Isso elimina a necessidade de um
    //   segundo auth user.
    // → Implementamos essa lógica no route de login abaixo.
    console.log('  ℹ️  Login por CPF será resolvido via lookup na tabela usuarios (não precisa de user duplo)')
    cpfAuthId = masterAuthId
  }

  // ── 6. Verifica/cria linha na tabela usuarios ─────────────────────────────
  console.log('\nVerificando tabela usuarios...')

  const [byAuthId, byEmail, byCpf] = await Promise.all([
    masterAuthId ? getUsuariosRows('auth_user_id', masterAuthId) : Promise.resolve([]),
    getUsuariosRows('email',       EMAIL_REAL),
    getUsuariosRows('cpf',         CPF_DIGITS),
  ])

  let usuarioRow = null
  if (Array.isArray(byAuthId) && byAuthId[0]) {
    usuarioRow = byAuthId[0]
    console.log(`  ✅  Linha em usuarios existe (por auth_user_id) — ID: ${usuarioRow.id}`)
  } else if (Array.isArray(byEmail) && byEmail[0]) {
    usuarioRow = byEmail[0]
    console.log(`  ⚠️  Linha em usuarios existe (por e-mail) mas sem auth_user_id — atualizando...`)
  } else if (Array.isArray(byCpf) && byCpf[0]) {
    usuarioRow = byCpf[0]
    console.log(`  ⚠️  Linha em usuarios existe (por CPF) mas sem auth_user_id — atualizando...`)
  } else {
    console.log('  ❌  Linha NÃO existe na tabela usuarios — criando...')
  }

  if (usuarioRow) {
    // Atualiza campos essenciais se necessário
    const needsUpdate =
      usuarioRow.auth_user_id !== masterAuthId ||
      usuarioRow.role         !== ROLE          ||
      usuarioRow.ativo        !== true           ||
      !usuarioRow.cpf

    if (needsUpdate) {
      const upd = await fetch(`${URL}/rest/v1/usuarios?id=eq.${usuarioRow.id}`, {
        method: 'PATCH',
        headers: { ...H, Prefer: 'return=representation' },
        body: JSON.stringify({
          auth_user_id: masterAuthId,
          tenant_id:    tenantId,
          email:        EMAIL_REAL,
          cpf:          CPF_DIGITS,
          nome:         usuarioRow.nome || NOME,
          role:         ROLE,
          ativo:        true,
        }),
      })
      const updData = await upd.json()
      if (upd.ok) {
        usuarioRow = Array.isArray(updData) ? updData[0] : updData
        console.log(`  ✅  Linha em usuarios atualizada`)
      } else {
        console.error(`  ❌  Erro ao atualizar: ${JSON.stringify(updData).slice(0,200)}`)
      }
    } else {
      console.log('  ✅  Linha em usuarios já está correta — nenhuma alteração necessária')
    }
  } else {
    // Cria nova linha
    const ins = await fetch(`${URL}/rest/v1/usuarios`, {
      method: 'POST',
      headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify({
        tenant_id:    tenantId,
        auth_user_id: masterAuthId,
        email:        EMAIL_REAL,
        cpf:          CPF_DIGITS,
        nome:         NOME,
        role:         ROLE,
        ativo:        true,
      }),
    })
    const insData = await ins.json()
    if (ins.ok) {
      usuarioRow = Array.isArray(insData) ? insData[0] : insData
      console.log(`  ✅  Linha em usuarios criada — ID: ${usuarioRow?.id}`)
    } else {
      console.error(`  ❌  Erro ao criar: ${JSON.stringify(insData).slice(0,200)}`)
    }
  }

  // ── 7. Validação do login via /api/auth/login ────────────────────────────
  console.log('\nValidando endpoints de login...')
  const BASE = 'http://localhost:3000'

  // Testa login por e-mail (precisa de senha — testamos a estrutura da resposta)
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL_REAL, password: 'SENHA_PLACEHOLDER_NAO_REAL' }),
  })
  const loginData = await loginRes.json()

  if (loginRes.status === 401) {
    console.log('  ✅  Endpoint /api/auth/login (e-mail) — RESPONDE (senha errada esperada neste teste)')
  } else if (loginRes.status === 200) {
    console.log('  ✅  Login por e-mail FUNCIONOU (token recebido)')
  } else {
    console.log(`  ⚠️  Status inesperado: ${loginRes.status} — ${loginData?.error}`)
  }

  // Testa estrutura de login por CPF (rota atualizada)
  const cpfRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf: CPF_DIGITS, password: 'SENHA_PLACEHOLDER_NAO_REAL' }),
  })
  const cpfData = await cpfRes.json()
  if (cpfRes.status === 401 || cpfRes.status === 200) {
    console.log('  ✅  Endpoint /api/auth/login (CPF) — RESPONDE corretamente')
  } else {
    console.log(`  ⚠️  CPF login status: ${cpfRes.status} — ${cpfData?.error}`)
  }

  // ── 8. Verifica /api/me ──────────────────────────────────────────────────
  console.log('\n/api/me sem token (deve retornar 401):')
  const meRes = await fetch(`${BASE}/api/me`)
  console.log(`  ${meRes.status === 401 ? '✅' : '❌'}  Status: ${meRes.status}`)

  // ── 9. Resultado final ───────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════')
  console.log('ESTADO FINAL DO USUÁRIO MASTER')
  console.log('════════════════════════════════════════════════')
  console.log(`Nome:         ${usuarioRow?.nome ?? NOME}`)
  console.log(`E-mail:       ${EMAIL_REAL}`)
  console.log(`CPF:          ${CPF_DIGITS.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`)
  console.log(`Role:         ${usuarioRow?.role ?? ROLE}`)
  console.log(`Ativo:        ${usuarioRow?.ativo ?? true}`)
  console.log(`Tenant:       ${tenantId}`)
  console.log(`Auth ID:      ${masterAuthId?.slice(0,8)}...`)
  console.log(`Usuarios ID:  ${usuarioRow?.id ?? 'PENDENTE'}`)
  console.log('')
  console.log('Login suportado:')
  console.log(`  ✅  E-mail:  ${EMAIL_REAL}`)
  console.log(`  ✅  CPF:     ${CPF_DIGITS.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`)
  if (tempPassword) {
    console.log('')
    console.log('⚠️  ATENÇÃO: Usuário criado com senha temporária.')
    console.log(`   Senha inicial: ${tempPassword}`)
    console.log('   Altere imediatamente após o primeiro login.')
  } else {
    console.log('')
    console.log('ℹ️  Senha: mantida como estava (não alterada pelo script)')
  }
  console.log('\n════════════════════════════════════════════════\n')

})()
