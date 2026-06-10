// Verifica os valores válidos do enum status_contrato
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const env = Object.fromEntries(
  readFileSync(join('apps/web/.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY

// Testa os valores via tentativa de PATCH com cada um
const testValues = ['ativo', 'assinado', 'enviado', 'pendente', 'cancelado', 'aguardando', 'em_assinatura', 'aguardando_assinatura', 'vigente', 'expirado', 'suspenso', 'concluido', 'enviado_assinatura']
const ID = 'b532af72-1c83-47ee-b7cf-b9c591c4c149'

console.log('Verificando valores válidos do enum status_contrato...')
for (const val of testValues) {
  const r = await fetch(`${URL}/rest/v1/contratos?id=eq.${ID}`, {
    method: 'PATCH',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ status: val })
  })
  const ok = r.status === 200
  if (ok) console.log(`  ✓ "${val}" — VÁLIDO`)
}

// Busca o status atual depois
const r = await fetch(`${URL}/rest/v1/contratos?id=eq.${ID}&select=status`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
})
const [c] = await r.json()
console.log('\nStatus atual:', c?.status)
