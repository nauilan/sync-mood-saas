import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, '')] })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// Validate if the columns already exist
const { error: checkErr } = await sb.from('titulares').select('contatos, endereco, dados_bancarios, funcoes, sexo, codigo_interno').limit(1)

if (!checkErr) {
  console.log('✅  Migration 047 já foi aplicada — colunas presentes:')
  console.log('    contatos, endereco, dados_bancarios, funcoes, sexo, codigo_interno')
  process.exit(0)
}

console.log('⚠   Colunas não encontradas. Migration 047 ainda não foi executada.')
console.log('\n📋  Execute o seguinte SQL no Supabase SQL Editor (https://supabase.com/dashboard):\n')
const sql = readFileSync(join(process.cwd(), '..', '..', 'supabase', 'migrations', '047_titulares_colunas_inline.sql'), 'utf8')
console.log(sql)
console.log('\nDepois re-execute este script para confirmar.')
