/**
 * auditoria_limpeza.mjs
 * Audita e executa limpeza segura das tabelas operacionais de teste.
 * Preserva: titulares, editoras, usuários, tenants, perfis, configurações.
 * Remove: contratos, obras, fonogramas, vínculos, importações, audit_logs.
 *
 * Uso:
 *   node auditoria_limpeza.mjs          → apenas relatório (não apaga nada)
 *   node auditoria_limpeza.mjs --executar → executa a limpeza real
 */

import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const { createClient } = require('./apps/web/node_modules/@supabase/supabase-js')

// Carrega .env.local manualmente sem precisar de dotenv
function loadEnv(file) {
  try {
    const lines = readFileSync(file, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !process.env[key]) process.env[key] = val
    }
  } catch { /* arquivo pode não existir */ }
}
loadEnv(resolve(__dirname, 'apps/web/.env.local'))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ausentes.')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
const EXECUTAR = process.argv.includes('--executar')

// ── Tabelas PRESERVADAS (apenas contagem para validação) ────────────────────
const PRESERVAR = [
  { tabela: 'tenants',          label: 'Tenants/Editoras' },
  { tabela: 'titulares',        label: 'Titulares' },
  { tabela: 'editoras',         label: 'Editoras' },
  { tabela: 'usuarios',         label: 'Usuários' },
  { tabela: 'negocios_editoriais', label: 'Negócios Editoriais' },
]

// ── Tabelas OPERACIONAIS a limpar (ordem respeita FK) ───────────────────────
// Dependências: primeiro filhos, depois pais
const LIMPAR = [
  // D4Sign / assinaturas
  { tabela: 'assinaturas',           label: 'Assinaturas de contrato',  filtro: null },
  // Vínculos de obras
  { tabela: 'obras_links_titulares', label: 'Obras links titulares',    filtro: null },
  { tabela: 'obras_links',           label: 'Obras links',              filtro: null },
  { tabela: 'obras_participantes',   label: 'Obras participantes',      filtro: null },
  // Fonogramas
  { tabela: 'fonogramas',            label: 'Fonogramas',               filtro: null },
  // Obras e contratos
  { tabela: 'obras',                 label: 'Obras',                    filtro: null },
  { tabela: 'contratos',             label: 'Contratos',                filtro: null },
  // Importações/CWR
  { tabela: 'match_lista_oni',       label: 'Match lista ONI',          filtro: null },
  { tabela: 'importacoes',           label: 'Importações',              filtro: null },
  // Audit logs (operacionais de teste)
  { tabela: 'audit_logs',            label: 'Audit logs de teste',      filtro: null },
]

async function contarRegistros(tabela, filtro = null) {
  try {
    let q = sb.from(tabela).select('*', { count: 'exact', head: true })
    if (filtro) q = q.match(filtro)
    const { count, error } = await q
    if (error) return { count: null, error: error.message }
    return { count: count ?? 0, error: null }
  } catch (e) {
    return { count: null, error: e.message }
  }
}

async function deletarTudo(tabela) {
  try {
    // DELETE WHERE true para evitar erro "delete requires a where clause"
    const { error } = await sb.from(tabela).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      // Tenta com coluna diferente (algumas tabelas podem não ter 'id')
      const { error: e2 } = await sb.from(tabela).delete().gte('created_at', '2000-01-01')
      if (e2) return { ok: false, error: e2.message }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

async function main() {
  console.log('\n' + '═'.repeat(60))
  console.log('  SYNC MOOD — AUDITORIA DE LIMPEZA DE AMBIENTE DE TESTE')
  console.log('═'.repeat(60))
  console.log(`  Modo: ${EXECUTAR ? '⚠️  EXECUTAR LIMPEZA REAL' : '📋 APENAS RELATÓRIO (dry-run)'}`)
  console.log('═'.repeat(60) + '\n')

  // ── 1. Preservados ──────────────────────────────────────────────────────
  console.log('✅ REGISTROS PRESERVADOS (não serão tocados)\n')
  for (const { tabela, label } of PRESERVAR) {
    const { count, error } = await contarRegistros(tabela)
    if (error) {
      console.log(`  ${label.padEnd(30)} → tabela não existe / erro: ${error}`)
    } else {
      console.log(`  ${label.padEnd(30)} → ${count} registro(s)`)
    }
  }

  // ── 2. A limpar ─────────────────────────────────────────────────────────
  console.log('\n🗑️  REGISTROS A REMOVER\n')
  const plano = []
  for (const item of LIMPAR) {
    const { count, error } = await contarRegistros(item.tabela, item.filtro)
    if (error) {
      console.log(`  ${item.label.padEnd(35)} → tabela não existe / ${error}`)
      plano.push({ ...item, count: 0, existe: false })
    } else {
      console.log(`  ${item.label.padEnd(35)} → ${count} registro(s)`)
      plano.push({ ...item, count, existe: true })
    }
  }

  const total = plano.reduce((s, x) => s + (x.count ?? 0), 0)
  console.log(`\n  TOTAL a remover: ${total} registros`)

  if (!EXECUTAR) {
    console.log('\n' + '─'.repeat(60))
    console.log('  ℹ️  DRY-RUN concluído. Nada foi apagado.')
    console.log('  Para executar: node auditoria_limpeza.mjs --executar')
    console.log('─'.repeat(60) + '\n')
    return
  }

  // ── 3. Execução ─────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('  ⚠️  EXECUTANDO LIMPEZA...')
  console.log('═'.repeat(60) + '\n')

  for (const item of plano) {
    if (!item.existe || item.count === 0) {
      console.log(`  SKIP  ${item.label} (0 registros)`)
      continue
    }
    const { ok, error } = await deletarTudo(item.tabela)
    if (ok) {
      console.log(`  ✓ DELETE ${item.label} — ${item.count} registro(s) removido(s)`)
    } else {
      console.log(`  ✗ FALHA  ${item.label} — ${error}`)
    }
  }

  // ── 4. Validação pós-limpeza ─────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60))
  console.log('  VALIDAÇÃO PÓS-LIMPEZA\n')
  for (const { tabela, label } of PRESERVAR) {
    const { count } = await contarRegistros(tabela)
    console.log(`  ${label.padEnd(30)} → ${count ?? '?'} registro(s) ✓`)
  }
  for (const item of LIMPAR) {
    if (!item.existe) continue
    const { count } = await contarRegistros(item.tabela)
    const ok = count === 0
    console.log(`  ${item.label.padEnd(35)} → ${count ?? '?'} registro(s) ${ok ? '✓ limpo' : '⚠️ AINDA TEM DADOS'}`)
  }

  console.log('\n' + '═'.repeat(60))
  console.log('  Limpeza concluída.')
  console.log('═'.repeat(60) + '\n')
}

main().catch(e => { console.error(e); process.exit(1) })
