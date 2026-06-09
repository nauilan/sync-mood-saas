/**
 * Garante que Nauilan existe no Supabase Auth + tabela usuarios como master
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const envContent = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, '')] })
)

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const CPF         = '04730581970'
const EMAIL_REAL  = 'nauilan@topshowmusic.com.br'
const AUTH_EMAIL  = `${CPF}@syncmood.app`
const SENHA       = 'admin123'
const NOME        = 'NAUILAN VICENTINI ZULAI RAMOS'

console.log('\n=== CADASTRO MASTER — NAUILAN ===\n')

// 1. Pegar tenant_id (editora master)
const { data: editoras } = await sb.from('editoras').select('id, nome_fantasia, tipo_editora').is('deleted_at', null)
console.log('Editoras encontradas:')
for (const e of editoras ?? []) console.log(`  ${e.id} | ${e.nome_fantasia} | ${e.tipo_editora}`)

const editoraMaster = (editoras ?? []).find(e => e.tipo_editora === 'master') ?? (editoras ?? [])[0]
if (!editoraMaster) { console.error('Nenhuma editora encontrada. Abortando.'); process.exit(1) }
console.log(`\nUsando editora: ${editoraMaster.nome_fantasia} (${editoraMaster.id})\n`)

// 2. Pegar tenant_id
const { data: tenants, error: tenantErr } = await sb.from('tenants').select('id, nome').limit(5)
let tenantId = (!tenantErr && tenants) ? (tenants[0]?.id ?? null) : null
if (!tenantId) {
  // tenta via campo tenant_id na editora
  const { data: ed } = await sb.from('editoras').select('id, tenant_id').eq('id', editoraMaster.id).single()
  tenantId = ed?.tenant_id ?? null
}
console.log('tenant_id:', tenantId ?? '(não encontrado — usando editora_id como tenant_id)')
if (!tenantId) tenantId = editoraMaster.id

// 3. Verificar se existe no Auth
const { data: authList } = await sb.auth.admin.listUsers({ perPage: 200 })
const existing = (authList?.users ?? []).find(u => u.email === AUTH_EMAIL || u.email === EMAIL_REAL)

let authUserId = ''

if (existing) {
  authUserId = existing.id
  console.log(`Auth: usuário já existe — ID: ${authUserId}`)
  // Garantir senha correta
  const { error: pwErr } = await sb.auth.admin.updateUserById(authUserId, { password: SENHA })
  if (pwErr) console.error(`  Erro ao atualizar senha: ${pwErr.message}`)
  else console.log('  Senha atualizada.')
} else {
  console.log('Auth: criando novo usuário...')
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: AUTH_EMAIL,
    password: SENHA,
    email_confirm: true,
    user_metadata: { nome_completo: NOME, role: 'master' },
  })
  if (createErr || !created?.user) { console.error(`Erro ao criar auth: ${createErr?.message}`); process.exit(1) }
  authUserId = created.user.id
  console.log(`Auth: criado — ID: ${authUserId}`)
}

// 4. Verificar/inserir na tabela usuarios
const { data: usuarioExistente } = await sb.from('usuarios').select('*').or(`cpf.eq.${CPF},auth_user_id.eq.${authUserId}`).single()

if (usuarioExistente) {
  console.log(`\nusuarios: já existe (${usuarioExistente.id}) — atualizando...`)
  const { error } = await sb.from('usuarios').update({
    auth_user_id: authUserId,
    nome_completo: NOME,
    cpf: CPF,
    email: EMAIL_REAL,
    role: 'master',
    ativo: true,
    tenant_id: tenantId,
  }).eq('id', usuarioExistente.id)
  if (error) console.error(`  Erro: ${error.message}`)
  else console.log('  Atualizado com sucesso.')
} else {
  console.log('\nusuarios: inserindo...')
  const { error } = await sb.from('usuarios').insert({
    auth_user_id: authUserId,
    tenant_id: tenantId,
    nome_completo: NOME,
    cpf: CPF,
    email: EMAIL_REAL,
    role: 'master',
    ativo: true,
  })
  if (error) console.error(`  Erro: ${error.message}`)
  else console.log('  Inserido com sucesso.')
}

// 5. Confirmação final
const { data: confirmacao } = await sb.from('usuarios')
  .select('id, nome_completo, cpf, email, role, ativo, tenant_id, auth_user_id')
  .or(`cpf.eq.${CPF},auth_user_id.eq.${authUserId}`)
  .single()

console.log('\n=== CONFIRMAÇÃO ===')
console.log(JSON.stringify(confirmacao, null, 2))
console.log('\nLogin: CPF =', CPF, '| Senha =', SENHA)
console.log('Auth email:', AUTH_EMAIL)
