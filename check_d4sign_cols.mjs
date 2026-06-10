// Verifica se as colunas d4sign existem e testa update direto
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
const HDR = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

// 1. Verifica existência das colunas
console.log('1. Verificando colunas...')
const r1 = await fetch(`${URL}/rest/v1/contratos?id=eq.${ID}&select=d4sign_uuid,d4sign_status`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
})
console.log('   Status:', r1.status)
const t1 = await r1.text()
console.log('   Body:', t1.slice(0, 200))

// 2. Tenta update direto
if (r1.ok) {
  console.log('\n2. Testando PATCH direto...')
  const r2 = await fetch(`${URL}/rest/v1/contratos?id=eq.${ID}`, {
    method: 'PATCH',
    headers: HDR,
    body: JSON.stringify({
      d4sign_uuid:   'f4db6327-566e-458e-b826-70d9d35699a0',
      d4sign_status: 'aguardando_assinaturas',
      status:        'aguardando_assinatura'
    })
  })
  console.log('   Status:', r2.status)
  const t2 = await r2.text()
  console.log('   Body:', t2.slice(0, 300))

  // 3. Verifica resultado
  if (r2.ok) {
    const [c] = JSON.parse(t2)
    console.log('\n3. Resultado no banco:')
    console.log('   status:', c?.status)
    console.log('   d4sign_uuid:', c?.d4sign_uuid)
    console.log('   d4sign_status:', c?.d4sign_status)
  }
}
