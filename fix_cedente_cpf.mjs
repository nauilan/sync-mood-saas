// Corrige CPF do cedente Nauilan no contrato CTO-1781044412658 e pega o ID
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const env = Object.fromEntries(
  readFileSync(join('apps/web/.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

// Busca o contrato
const r = await fetch(`${URL}/rest/v1/contratos?numero=eq.CTO-1781044412658&select=id,numero,assinantes_d4sign`, {
  headers
})
const [contrato] = await r.json()
console.log('Contrato ID:', contrato.id)
console.log('Assinantes atuais:', JSON.stringify(contrato.assinantes_d4sign, null, 2))

// Corrige CPF do cedente
const assinantes = contrato.assinantes_d4sign.map((a) => {
  if (a.papel === 'cedente' && !a.cpf) {
    return { ...a, cpf: '04730581970' }
  }
  return a
})

const patch = await fetch(`${URL}/rest/v1/contratos?id=eq.${contrato.id}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ assinantes_d4sign: assinantes })
})
const updated = await patch.json()
console.log('\nAtualização status:', patch.status)
console.log('Assinantes atualizados:', JSON.stringify(updated[0]?.assinantes_d4sign?.find(a => a.papel === 'cedente'), null, 2))
console.log('\nID para teste:', contrato.id)
