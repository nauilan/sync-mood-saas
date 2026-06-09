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

// Colunas da tabela usuarios
const { data: cols } = await sb.from('information_schema.columns')
  .select('column_name, data_type, is_nullable')
  .eq('table_schema', 'public')
  .eq('table_name', 'usuarios')
  .order('ordinal_position')

console.log('\n=== COLUNAS DE USUARIOS ===')
for (const c of (cols ?? [])) {
  console.log(`  ${c.column_name.padEnd(30)} ${c.data_type}  ${c.is_nullable === 'YES' ? 'null' : 'NOT NULL'}`)
}

// Registro atual do Nauilan
const { data: u } = await sb.from('usuarios').select('*').eq('id', '4e1838a8-bffc-4c02-8917-78c91907323c').single()
console.log('\n=== NAUILAN ATUAL ===')
console.log(JSON.stringify(u, null, 2))
