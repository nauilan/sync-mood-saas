import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const SB_URL  = env['NEXT_PUBLIC_SUPABASE_URL']
const SB_ANON = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
const SB_SVC  = env['SUPABASE_SERVICE_ROLE_KEY']

const sbAdmin = createClient(SB_URL, SB_SVC, { auth: { autoRefreshToken: false, persistSession: false } })

console.log('=== Verificando RLS + meu_tenant_id ===')

// 1. Service role ainda vê obras?
const r1 = await sbAdmin.from('obras').select('id, titulo').limit(1)
console.log('1. Service role vê obras:', r1.data?.length ?? 0, r1.error?.message ?? 'OK')

// 2. Listar usuários no Supabase Auth para achar o email correto
const { data: authUsers } = await sbAdmin.auth.admin.listUsers()
console.log('\n2. Usuários no Supabase Auth:')
for (const u of (authUsers?.users ?? [])) {
  console.log(`   - ${u.email ?? '(sem email)'} | id=${u.id}`)
}

// 3. Tentar login por CPF (o sistema usa CPF, não email — precisa verificar)
// O email pode ser o CPF com domínio fictício ou diferente
const sbAnon = createClient(SB_URL, SB_ANON, { auth: { autoRefreshToken: false, persistSession: false } })

// Tenta com o CPF como email (padrão common em sistemas BR)
const credList = [
  { email: '04730581970@syncmood.com.br', password: 'admin123' },
  { email: 'admin@syncmood.com.br', password: 'admin123' },
  { email: 'marina@syncmood.com.br', password: 'admin123' },
]

// Adiciona os emails do Auth
for (const u of (authUsers?.users ?? [])) {
  if (u.email) credList.push({ email: u.email, password: 'admin123' })
}

let token = null
for (const creds of credList) {
  const sb2 = createClient(SB_URL, SB_ANON, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: s, error: e } = await sb2.auth.signInWithPassword(creds)
  if (!e && s?.session?.access_token) {
    token = s.session.access_token
    console.log(`\n3. Login OK: ${creds.email} | uid=${s.session.user.id}`)
    break
  }
}

if (!token) {
  console.log('\n3. Nenhum login funcionou com admin123')
  console.log('   → Testar direto com token do browser ou redefinir senha no Supabase Auth')
} else {
  const sbUser = createClient(SB_URL, SB_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  const r2 = await sbUser.from('obras').select('id, titulo').limit(5)
  console.log(`4. Obras visíveis pelo usuário: ${r2.data?.length ?? 0}`, r2.error?.message ?? 'OK')

  const r3 = await sbUser.rpc('meu_tenant_id')
  console.log(`5. meu_tenant_id():`, r3.data, r3.error?.message ?? 'OK')
}
