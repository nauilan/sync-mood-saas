/**
 * Define senha do Master Nauilan via Supabase Admin API
 * Roda: node scripts/set-master-password.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

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

const URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || ''
const SVC = env.SUPABASE_SERVICE_ROLE_KEY || ''
const H   = { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' }

const CPF_EMAIL  = '04730581970@syncmood.app'
const NEW_PASS   = 'admin123'

;(async () => {
  if (!URL || !SVC) { console.error('❌  .env.local incompleto.'); process.exit(1) }

  // Busca auth user pelo CPF email
  const listRes = await fetch(`${URL}/auth/v1/admin/users?per_page=1000`, { headers: H })
  const listData = await listRes.json()
  const users = Array.isArray(listData.users) ? listData.users : []
  const master = users.find(u => u.email?.toLowerCase() === CPF_EMAIL.toLowerCase())

  if (!master) {
    // Não existe — criar
    console.log(`⚠️  Usuário ${CPF_EMAIL} não existe. Criando...`)
    const createRes = await fetch(`${URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({
        email:         CPF_EMAIL,
        password:      NEW_PASS,
        email_confirm: true,
        user_metadata: { full_name: 'Nauilan Vicentini', user_role: 'master' },
      }),
    })
    const createData = await createRes.json()
    if (!createRes.ok) {
      console.error('❌  Erro ao criar:', JSON.stringify(createData).slice(0, 300))
      process.exit(1)
    }
    console.log(`✅  Auth user criado — ID: ${createData.id}`)

    // Garante linha em usuarios
    await upsertUsuario(createData.id, URL, H)

    console.log('\n✅  Master configurado com sucesso!')
    console.log(`   CPF: 047.305.819-70  |  Senha: ${NEW_PASS}`)
    return
  }

  // Existe — resetar senha
  console.log(`✅  Usuário encontrado — ${master.id}`)
  const resetRes = await fetch(`${URL}/auth/v1/admin/users/${master.id}`, {
    method: 'PUT',
    headers: H,
    body: JSON.stringify({ password: NEW_PASS }),
  })
  const resetData = await resetRes.json()

  if (!resetRes.ok) {
    console.error('❌  Erro ao resetar senha:', JSON.stringify(resetData).slice(0, 300))
    process.exit(1)
  }

  console.log('✅  Senha redefinida para admin123')

  // Garante linha em usuarios com role master + ativo
  await upsertUsuario(master.id, URL, H)

  console.log('\n════════════════════════════════════════')
  console.log('LOGIN MASTER CONFIGURADO:')
  console.log('  CPF:   04730581970')
  console.log(`  Senha: ${NEW_PASS}`)
  console.log('  Role:  master')
  console.log('════════════════════════════════════════\n')
})()

async function upsertUsuario(authId, URL, H) {
  // Busca tenant principal
  const tRes  = await fetch(`${URL}/rest/v1/tenants?limit=1&order=created_at.asc`, { headers: H })
  const tData = await tRes.json()
  const tenantId = Array.isArray(tData) && tData[0] ? tData[0].id : null

  // Verifica se já existe linha
  const uRes  = await fetch(`${URL}/rest/v1/usuarios?auth_user_id=eq.${authId}&limit=1`, { headers: H })
  const uData = await uRes.json()
  const existing = Array.isArray(uData) && uData[0] ? uData[0] : null

  if (existing) {
    // Atualiza role/ativo/cpf se necessário
    const patch = await fetch(`${URL}/rest/v1/usuarios?id=eq.${existing.id}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({ role: 'master', ativo: true, cpf: '04730581970' }),
    })
    console.log(patch.ok ? '✅  usuarios: role=master, ativo=true confirmados' : '⚠️  usuarios: erro ao atualizar')
  } else {
    // Cria nova linha
    const ins = await fetch(`${URL}/rest/v1/usuarios`, {
      method: 'POST',
      headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({
        tenant_id:    tenantId,
        auth_user_id: authId,
        email:        'contato@topshowmusic.com.br',
        cpf:          '04730581970',
        nome:         'Nauilan Vicentini',
        role:         'master',
        ativo:        true,
      }),
    })
    console.log(ins.ok ? '✅  usuarios: linha criada com role=master' : `⚠️  usuarios: erro ${ins.status}`)
  }
}
