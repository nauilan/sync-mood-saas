// check-contrato-new.mjs
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const envPath = join(process.cwd(), 'apps/web/.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const url = `${SUPABASE_URL}/rest/v1/contratos?id=eq.07b68f46-5d76-4a15-a484-94503805127b&select=id,numero,tipo,status,titular_id,assinantes_d4sign,obras_json,provedor_assinatura`

const r = await fetch(url, {
  headers: { 
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json'
  }
})
const data = await r.json()
console.log(JSON.stringify(data, null, 2))
