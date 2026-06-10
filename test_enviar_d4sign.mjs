// Testa o fluxo completo de envio para D4Sign
// Usa a API de produção (env vars D4Sign só existem lá)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const env = Object.fromEntries(
  readFileSync(join('apps/web/.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const APP_URL = 'https://sync-mood-saas.vercel.app'
const CONTRATO_ID = 'b532af72-1c83-47ee-b7cf-b9c591c4c149'

// 1. Login via Supabase Auth (email CPF@syncmood.app / admin123)
console.log('1. Fazendo login...')
const loginR = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
  body: JSON.stringify({ email: '04730581970@syncmood.app', password: 'admin123' })
})
const loginData = await loginR.json()
if (!loginR.ok || !loginData.access_token) {
  console.error('Login falhou:', loginData)
  process.exit(1)
}
const token = loginData.access_token
console.log('   ✓ Login OK. User:', loginData.user?.email)

// 2. Chama POST /api/contratos/:id/enviar-assinatura na produção
console.log('\n2. Enviando contrato para D4Sign...')
console.log('   Contrato ID:', CONTRATO_ID)
const enviarR = await fetch(`${APP_URL}/api/contratos/${CONTRATO_ID}/enviar-assinatura`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
const enviarData = await enviarR.json()
console.log('\n   HTTP status:', enviarR.status)
console.log('   Resposta:', JSON.stringify(enviarData, null, 2))

if (enviarR.ok) {
  console.log('\n✓ SUCESSO! Contrato enviado para D4Sign')
  console.log('  d4sign_uuid:', enviarData.d4sign_uuid)
  console.log('  status:', enviarData.status)
} else {
  console.error('\n✗ ERRO:', enviarData.error || enviarData.message || 'Desconhecido')
}
