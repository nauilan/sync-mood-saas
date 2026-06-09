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

const { data, error } = await sb
  .from('titulares')
  .select('*')
  .is('deleted_at', null)
  .limit(1)

if (error) { console.error('Erro:', error.message); process.exit(1) }

if (data?.[0]) {
  console.log('\n=== COLUNAS DA TABELA titulares ===\n')
  console.log(Object.keys(data[0]).join(', '))
}

// Busca completa sem colunas que podem não existir
const { data: todos, error: err2 } = await sb
  .from('titulares')
  .select('id, nome_completo, cpf_cnpj')
  .is('deleted_at', null)
  .order('nome_completo')

if (err2) { console.error(err2.message); process.exit(1) }

console.log(`\n=== ${todos.length} TITULARES ===\n`)
for (const t of todos) {
  console.log(`| ${t.id} | ${(t.nome_completo ?? '').padEnd(40)} | ${t.cpf_cnpj ?? ''} |`)
}
