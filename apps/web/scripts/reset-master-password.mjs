/**
 * Reset de senha do usuário Master Nauilan
 * Roda: node scripts/reset-master-password.mjs
 *
 * Usa Supabase Admin API para redefinir a senha sem precisar da senha atual.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'

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

const URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || ''
const SVC = env.SUPABASE_SERVICE_ROLE_KEY || ''
const H   = { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' }

const CPF_EMAIL  = '04730581970@syncmood.app'
const AUTH_ID    = '27f38ec4'  // primeiros 8 chars — precisamos do ID completo

;(async () => {
  if (!URL || !SVC) {
    console.error('❌  .env.local incompleto.')
    process.exit(1)
  }

  console.log('\n════════════════════════════════════════════════')
  console.log('   RESET DE SENHA — MASTER NAUILAN')
  console.log('════════════════════════════════════════════════\n')

  // Busca o auth_user_id completo pelo email CPF
  console.log(`Buscando usuário por email: ${CPF_EMAIL}...`)
  const listRes = await fetch(`${URL}/auth/v1/admin/users?per_page=1000`, { headers: H })
  const listData = await listRes.json()
  const users = Array.isArray(listData.users) ? listData.users : []
  const master = users.find(u => u.email?.toLowerCase() === CPF_EMAIL.toLowerCase())

  if (!master) {
    console.error(`❌  Usuário ${CPF_EMAIL} não encontrado no Auth.`)
    process.exit(1)
  }

  console.log(`✅  Usuário encontrado — ID: ${master.id}`)
  console.log(`    E-mail Auth: ${master.email}`)

  // Lê nova senha do terminal
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const novaSenha = await rl.question('\nDigite a nova senha (mínimo 8 caracteres): ')
  rl.close()

  if (!novaSenha || novaSenha.length < 8) {
    console.error('❌  Senha muito curta. Mínimo 8 caracteres.')
    process.exit(1)
  }

  // Reset via Admin API
  console.log('\nRedefinindo senha...')
  const resetRes = await fetch(`${URL}/auth/v1/admin/users/${master.id}`, {
    method: 'PUT',
    headers: H,
    body: JSON.stringify({ password: novaSenha }),
  })
  const resetData = await resetRes.json()

  if (resetRes.ok) {
    console.log('\n✅  Senha redefinida com sucesso!\n')
    console.log('════════════════════════════════════════════════')
    console.log('LOGIN DISPONÍVEL:')
    console.log('  CPF:     047.305.819-70')
    console.log('  E-mail:  contato@topshowmusic.com.br')
    console.log(`  Senha:   ${novaSenha}`)
    console.log('════════════════════════════════════════════════\n')
  } else {
    console.error(`❌  Erro: ${JSON.stringify(resetData).slice(0, 300)}`)
    process.exit(1)
  }
})()
