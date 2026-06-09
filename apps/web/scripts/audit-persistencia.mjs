import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// load env
const env = {}
try {
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').forEach(l => { const [k,...v] = l.split('='); if(k) env[k.trim()] = v.join('=').trim() })
} catch {}
try {
  readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
    .split('\n').forEach(l => { const [k,...v] = l.split('='); if(k) env[k.trim()] = v.join('=').trim() })
} catch {}

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.log('ENV não encontrado'); process.exit(1) }

const sb = createClient(url, key, { auth: { persistSession: false } })

// 1. Titulares (contatos JSONB preenchido?)
const { data: titulares } = await sb.from('titulares').select('id,nome_completo,contatos,pseudonimos,documentos,funcoes,endereco').is('deleted_at', null).limit(10)
console.log('\n=== TITULARES ===')
for (const t of titulares || []) {
  const cont = Array.isArray(t.contatos) ? t.contatos.length : 0
  console.log(`  ${t.nome_completo}: contatos=${cont}, pseudonimos=${Array.isArray(t.pseudonimos)?t.pseudonimos.length:0}, docs=${Array.isArray(t.documentos)?t.documentos.length:0}, endereco=${t.endereco?'sim':'nao'}`)
}

// 2. Obras
const { data: obras } = await sb.from('obras').select('id,titulo,codigo,editora_id,contrato_origem_id,genero_musical,interprete_referencia').is('deleted_at', null).limit(10)
console.log('\n=== OBRAS ===')
for (const o of obras || []) {
  console.log(`  ${o.titulo} (${o.codigo}): editora_id=${o.editora_id?'ok':'-'}, contrato_id=${o.contrato_origem_id?'ok':'-'}, genero=${o.genero_musical||'-'}`)
}

// 3. Fonogramas
const { data: fonogramas } = await sb.from('fonogramas').select('id,titulo,isrc,interprete,obra_id').limit(10)
console.log('\n=== FONOGRAMAS ===')
console.log(`  Total: ${fonogramas?.length || 0}`)
for (const f of fonogramas || []) {
  console.log(`  ${f.titulo} | isrc=${f.isrc||'-'} | obra_id=${f.obra_id?'ok':'-'}`)
}

// 4. Contratos (rascunho - campos críticos)
const { data: contratos } = await sb.from('contratos').select('id,numero,tipo,status,editora_id,titular_id,assinantes_d4sign,obras_json,provedor_assinatura').is('deleted_at', null).limit(5)
console.log('\n=== CONTRATOS ===')
for (const c of contratos || []) {
  const assin = Array.isArray(c.assinantes_d4sign) ? c.assinantes_d4sign.length : 0
  const objs = Array.isArray(c.obras_json) ? c.obras_json.length : 0
  console.log(`  ${c.numero} | status=${c.status} | editora_id=${c.editora_id?'ok':'-'} | assinantes=${assin} | obras_json=${objs} | provedor=${c.provedor_assinatura||'-'}`)
  if (assin > 0) {
    for (const a of c.assinantes_d4sign) {
      console.log(`    - ${a.nome} | cpf=${a.cpf||'-'} | email=${a.email||'-'} | papel=${a.papel}`)
    }
  }
}

// 5. Audit logs
const { data: logs, count } = await sb.from('audit_logs').select('id,acao,modulo,tabela_afetada,created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5)
console.log(`\n=== AUDIT LOGS (total: ${count}) ===`)
for (const l of logs || []) {
  console.log(`  ${l.acao} | ${l.modulo} | ${l.tabela_afetada} | ${new Date(l.created_at).toLocaleString('pt-BR')}`)
}

console.log('\n=== FIM DA AUDITORIA ===')
