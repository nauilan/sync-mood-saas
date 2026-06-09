import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const envContent = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { error } = await sb.from('usuarios')
  .update({ nome: 'NAUILAN VICENTINI ZULAI RAMOS', email: 'nauilan@topshowmusic.com.br' })
  .eq('id', '4e1838a8-bffc-4c02-8917-78c91907323c')

console.log(error ? 'ERRO: ' + error.message : 'OK — nome e email atualizados')

const { data } = await sb.from('usuarios')
  .select('nome, email, role, ativo, cpf')
  .eq('id', '4e1838a8-bffc-4c02-8917-78c91907323c')
  .single()

console.log(JSON.stringify(data, null, 2))
