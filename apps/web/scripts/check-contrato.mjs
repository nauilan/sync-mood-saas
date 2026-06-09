import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// Read .env.local
import { join } from 'node:path'
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
  console.error('Missing env vars')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// Busca os últimos 3 contratos para análise
const { data: todos, error: errLista } = await sb
  .from('contratos')
  .select('id, numero, tipo, status, provedor_assinatura, assinantes_d4sign, obras_json, tenant_id, titular_id')
  .order('created_at', { ascending: false })
  .limit(3)

const data = todos?.[0]
const error = errLista

if (error) {
  console.error('ERRO:', error.message)
  process.exit(1)
}

console.log('\n=== ÚLTIMOS 3 CONTRATOS ===\n')
for (const c of (todos ?? [])) {
  console.log('---')
  console.log('ID:          ', c.id)
  console.log('Número:      ', c.numero)
  console.log('tipo:        ', c.tipo)
  console.log('status:      ', c.status)
  console.log('provedor:    ', c.provedor_assinatura)
  console.log('titular_id:  ', c.titular_id)
  console.log('assinantes_d4sign:', JSON.stringify(c.assinantes_d4sign, null, 2))
  console.log('obras_json:  ', JSON.stringify(c.obras_json, null, 2))
}
