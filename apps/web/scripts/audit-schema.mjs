/**
 * audit-schema.mjs
 * Consulta colunas reais de cada tabela e exibe relatório de persistência
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const envContent = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, '')] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const TABELAS = [
  'titulares', 'editoras', 'negocios_editoriais', 'contratos',
  'obras', 'fonogramas', 'obras_links', 'obras_links_titulares',
  'obras_participantes', 'usuarios',
]

console.log('\n=== AUDITORIA DE SCHEMA — COLUNAS REAIS DO BANCO ===\n')

for (const tabela of TABELAS) {
  const { data, error } = await sb
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable, column_default')
    .eq('table_schema', 'public')
    .eq('table_name', tabela)
    .order('ordinal_position')

  if (error) {
    console.log(`[${tabela}] ERRO: ${error.message}`)
    continue
  }
  if (!data || data.length === 0) {
    console.log(`[${tabela}] — tabela NÃO ENCONTRADA no banco`)
    continue
  }

  console.log(`\n┌── ${tabela.toUpperCase()} (${data.length} colunas) ───`)
  for (const col of data) {
    const nullable = col.is_nullable === 'YES' ? '?' : ' '
    const def = col.column_default ? ` (default: ${col.column_default.substring(0, 30)})` : ''
    console.log(`│  ${nullable} ${col.column_name.padEnd(35)} ${col.data_type}${def}`)
  }
  console.log('└' + '─'.repeat(60))
}

// Verifica existência de registros reais por tabela
console.log('\n\n=== CONTAGEM DE REGISTROS ATIVOS ===\n')
for (const tabela of TABELAS) {
  try {
    let q = sb.from(tabela).select('id', { count: 'exact', head: true })
    // Tentar filtro de soft delete onde aplicável
    const { count, error } = await q
    if (error) { console.log(`  ${tabela.padEnd(30)} ERRO: ${error.message}`); continue }
    console.log(`  ${tabela.padEnd(30)} ${count ?? 0} registros`)
  } catch { /* */ }
}

// Verifica contatos dos 4 titulares chave
console.log('\n\n=== CONTATOS DOS 4 TITULARES ASSINANTES ===\n')
const ALVO_IDS = [
  'dae373c3-9582-4b29-9d94-f73c8663144e',
  '74895145-8c6c-47c9-a40c-df8a9521603e',
  'beaf3628-f7b3-48c0-a2b6-335264e0bc3d',
  '2b9eec10-36ba-4ef4-ad02-358c3794016c',
]
const { data: tits } = await sb
  .from('titulares')
  .select('id, nome_completo, contatos, pseudonimos, documentos, endereco, dados_bancarios, funcoes, sexo, estado_civil')
  .in('id', ALVO_IDS)

for (const t of (tits ?? [])) {
  const emails = Array.isArray(t.contatos) ? t.contatos.filter(c => c.tipo === 'email').map(c => c.valor) : []
  console.log(`${t.nome_completo}`)
  console.log(`  e-mails: ${emails.length > 0 ? emails.join(', ') : '⚠ VAZIO'}`)
  console.log(`  contatos: ${JSON.stringify(t.contatos ?? '[]')}`)
  console.log(`  pseudonimos: ${JSON.stringify(t.pseudonimos ?? '[]')}`)
  console.log(`  documentos: ${JSON.stringify(t.documentos ?? '[]')}`)
  console.log(`  sexo: ${t.sexo ?? 'null'}`)
  console.log(`  estado_civil: ${t.estado_civil ?? 'null'}`)
  console.log()
}

// Verifica últimos contratos
console.log('\n=== ÚLTIMOS CONTRATOS (campo assinantes_d4sign e obras_json) ===\n')
const { data: contratos } = await sb
  .from('contratos')
  .select('id, numero, tipo, status, editora_id, provedor_assinatura, assinantes_d4sign, obras_json, created_at')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .limit(5)

for (const c of (contratos ?? [])) {
  console.log(`[${c.numero ?? c.id}] tipo=${c.tipo} status=${c.status}`)
  console.log(`  editora_id: ${c.editora_id ?? 'NULL ⚠'}`)
  console.log(`  provedor_assinatura: ${c.provedor_assinatura ?? 'NULL ⚠'}`)
  console.log(`  assinantes_d4sign: ${c.assinantes_d4sign ? JSON.stringify(c.assinantes_d4sign).substring(0, 120) + '...' : 'NULL ⚠'}`)
  console.log(`  obras_json: ${c.obras_json ? JSON.stringify(c.obras_json).substring(0, 120) + '...' : 'NULL ⚠'}`)
  console.log()
}
