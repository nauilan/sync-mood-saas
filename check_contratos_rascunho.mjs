// Verifica contratos rascunho com assinantes e e-mails preenchidos
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const env = Object.fromEntries(
  readFileSync(join('apps/web/.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY

// Busca contratos rascunho
const r = await fetch(`${URL}/rest/v1/contratos?status=eq.rascunho&select=id,numero,tipo,status,assinantes_d4sign,obras_json,provedor_assinatura,d4sign_uuid,d4sign_status&order=created_at.desc&limit=5`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
})
const contratos = await r.json()
console.log(`\n=== CONTRATOS RASCUNHO (${contratos.length}) ===`)
for (const c of contratos) {
  const assinantes = c.assinantes_d4sign || []
  const comEmail = assinantes.filter((a) => a.email)
  const obras = c.obras_json || []
  console.log(`\n[${c.numero || c.id.slice(0,8)}]`)
  console.log(`  status: ${c.status} | d4sign: ${c.d4sign_uuid ? c.d4sign_uuid.slice(0,16)+'...' : 'nenhum'}`)
  console.log(`  assinantes: ${assinantes.length} total, ${comEmail.length} com email`)
  console.log(`  obras: ${obras.length}`)
  console.log(`  provedor: ${c.provedor_assinatura}`)
  if (assinantes.length > 0) {
    for (const a of assinantes) {
      console.log(`    - ${a.papel}: ${a.nome} | cpf:${a.cpf?'ok':'VAZIO'} | email:${a.email || 'VAZIO'}`)
    }
  }
  console.log(`  ⟶ Pode enviar: ${assinantes.length === 4 && comEmail.length === 4 ? 'SIM' : 'NÃO'}`)
}
