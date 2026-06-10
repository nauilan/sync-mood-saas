// Verifica o contrato no banco após envio D4Sign
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

const r = await fetch(`${URL}/rest/v1/contratos?id=eq.${ID}&select=id,numero,status,d4sign_uuid,d4sign_status,provedor_assinatura`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
})
const [c] = await r.json()
console.log('Contrato no banco:')
console.log('  numero:', c.numero)
console.log('  status:', c.status)
console.log('  d4sign_uuid:', c.d4sign_uuid)
console.log('  d4sign_status:', c.d4sign_status)
console.log('  provedor:', c.provedor_assinatura)
console.log()
if (c.d4sign_uuid && c.d4sign_status === 'aguardando_assinatura') {
  console.log('✓ Banco atualizado corretamente')
} else {
  console.log('✗ Campos D4Sign não foram salvos')
}
