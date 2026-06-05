import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
const env = {}
for (const line of envLines) {
  const [k, ...vs] = line.split('=')
  if (k && vs.length) env[k.trim()] = vs.join('=').trim()
}
const sb = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'], {
  auth: { autoRefreshToken: false, persistSession: false }
})

const checks = [
  // 016
  { label: 'tipos_direito (016)',                    table: 'tipos_direito' },
  { label: 'tipos_participante (016)',               table: 'tipos_participante' },
  { label: 'obras_links_titulares_direitos (016)',   table: 'obras_links_titulares_direitos' },
  { label: 'obras_analitico (016)',                  table: 'obras_analitico' },
  // 018
  { label: 'cc_obras_movimentos (018 colunas novas)', table: 'cc_obras_movimentos', cols: ['tipo_direito_id','territorio','versao_calculo','competencia_inicio'] },
  // negocios_editoriais
  { label: 'negocios_editoriais',                    table: 'negocios_editoriais' },
]

console.log('\n=== Status das tabelas no Supabase PRODUCAO ===\n')

for (const c of checks) {
  const cols = c.cols ? c.cols.join(', ') : 'id'
  const { data, error } = await sb.from(c.table).select(cols).limit(1)
  if (error) {
    console.log(`  ✗ ${c.label.padEnd(45)} ERRO: ${error.message.substring(0, 80)}`)
  } else {
    const rows = data?.length ?? 0
    console.log(`  ✓ ${c.label.padEnd(45)} OK (${rows} row(s) returned)`)
  }
}

// Verificar colunas de recebimentos (016 adicionou tipo_direito_id etc)
const { data: recCheck, error: recErr } = await sb
  .from('recebimentos')
  .select('tipo_direito_id, territorio, competencia_inicio, competencia_fim, fonte_pagadora_codigo, fonte_pagadora_tipo')
  .limit(1)
console.log(`  ${recErr ? '✗' : '✓'} recebimentos — colunas 016 (tipo_direito_id, territorio...)`.padEnd(50) + (recErr ? ' ERRO: ' + recErr.message.substring(0,60) : ' OK'))

// Verificar quantas linhas tem obras_analitico
const { count: qAnalitico } = await sb.from('obras_analitico').select('*', { count: 'exact', head: true })
console.log(`\n  obras_analitico: ${qAnalitico ?? 0} linhas`)

const { count: qMovimentos } = await sb.from('cc_obras_movimentos').select('*', { count: 'exact', head: true })
console.log(`  cc_obras_movimentos: ${qMovimentos ?? 0} linhas`)

const { count: qRecebimentos } = await sb.from('recebimentos').select('*', { count: 'exact', head: true })
console.log(`  recebimentos: ${qRecebimentos ?? 0} linhas`)

const { count: qObras } = await sb.from('obras').select('*', { count: 'exact', head: true })
console.log(`  obras: ${qObras ?? 0} linhas`)

console.log('\n=== Verificação concluída ===')
