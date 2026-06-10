// Restaura status do contrato para rascunho
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const env = Object.fromEntries(
  readFileSync(join('apps/web/.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const ID  = 'b532af72-1c83-47ee-b7cf-b9c591c4c149'
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

const r = await fetch(`${URL}/rest/v1/contratos?id=eq.${ID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ status: 'rascunho', d4sign_uuid: null, d4sign_status: null })
})
console.log('PATCH status:', r.status)
const [c] = await r.json()
console.log('Status restaurado:', c?.status, '| d4sign_uuid:', c?.d4sign_uuid)
