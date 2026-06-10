/**
 * reauditoria_final.mjs — Estado completo do banco após limpeza
 */
import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const { createClient } = require('./apps/web/node_modules/@supabase/supabase-js')

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
  } catch {}
}
loadEnv(resolve(__dirname, 'apps/web/.env.local'))

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function count(tabela) {
  try {
    const { count, error } = await sb.from(tabela).select('*', { count: 'exact', head: true })
    if (error) return { n: null, err: error.message }
    return { n: count ?? 0, err: null }
  } catch (e) { return { n: null, err: e.message } }
}

async function sample(tabela, campos) {
  try {
    const { data, error } = await sb.from(tabela).select(campos).limit(20)
    if (error) return []
    return data ?? []
  } catch { return [] }
}

async function main() {
  console.log('\n' + '═'.repeat(64))
  console.log('  SYNC MOOD — REAUDITORIA FINAL DO BANCO')
  console.log('  ' + new Date().toLocaleString('pt-BR'))
  console.log('═'.repeat(64))

  // ── CADASTROS BASE ─────────────────────────────────────────────────────
  console.log('\n■ CADASTROS BASE (devem permanecer)\n')

  const titulares = await sample('titulares', 'id, nome, tipo_pessoa, categoria, ativo')
  const { n: nTit } = await count('titulares')
  console.log(`  Titulares: ${nTit}`)
  titulares.forEach(t => console.log(`    · ${t.nome} | ${t.tipo_pessoa} | ${t.categoria} | ativo: ${t.ativo}`))

  const { n: nEdit } = await count('editoras')
  const editoras = await sample('editoras', 'id, nome, cnpj')
  console.log(`\n  Editoras: ${nEdit}`)
  editoras.forEach(e => console.log(`    · ${e.nome} | ${e.cnpj ?? '—'}`))

  const { n: nNeg } = await count('negocios_editoriais')
  console.log(`\n  Negócios Editoriais: ${nNeg}`)

  const { n: nUsr } = await count('usuarios')
  const usuarios = await sample('usuarios', 'id, nome, cpf, role, ativo')
  console.log(`\n  Usuários: ${nUsr}`)
  usuarios.forEach(u => console.log(`    · ${u.nome ?? '—'} | CPF: ${u.cpf ?? '—'} | role: ${u.role} | ativo: ${u.ativo}`))

  const { n: nTen } = await count('tenants')
  const tenants = await sample('tenants', 'id, nome')
  console.log(`\n  Tenants: ${nTen}`)
  tenants.forEach(t => console.log(`    · ${t.nome ?? t.id}`))

  // ── TABELAS OPERACIONAIS ───────────────────────────────────────────────
  console.log('\n■ TABELAS OPERACIONAIS (devem estar zeradas)\n')

  const operacionais = [
    'contratos', 'obras', 'fonogramas',
    'obras_links', 'obras_links_titulares', 'obras_participantes',
    'assinaturas', 'audit_logs', 'importacoes', 'match_lista_oni'
  ]

  for (const tabela of operacionais) {
    const { n, err } = await count(tabela)
    if (err) {
      console.log(`  ${tabela.padEnd(30)} → tabela inexistente/erro`)
    } else {
      const status = n === 0 ? '✓ ZERADO' : `⚠️  ${n} registro(s) restante(s)`
      console.log(`  ${tabela.padEnd(30)} → ${status}`)
    }
  }

  // ── RESUMO FINAL ───────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(64))
  console.log('  RESUMO\n')
  console.log(`  Titulares preservados:          ${nTit}  ${nTit === 11 ? '✓' : '⚠️'}`)
  console.log(`  Editoras preservadas:           ${nEdit}  ${nEdit === 7 ? '✓' : '⚠️'}`)
  console.log(`  Negócios Editoriais:            ${nNeg}  ${nNeg === 6 ? '✓' : '⚠️'}`)
  console.log(`  Usuário Master:                 ${nUsr}  ${nUsr >= 1 ? '✓' : '⚠️'}`)
  console.log(`  Contratos zerados:              ${(await count('contratos')).n === 0 ? '✓ SIM' : '⚠️ NÃO'}`)
  console.log(`  Obras zeradas:                  ${(await count('obras')).n === 0 ? '✓ SIM' : '⚠️ NÃO'}`)
  console.log(`  Audit logs zerados:             ${(await count('audit_logs')).n === 0 ? '✓ SIM' : '⚠️ NÃO'}`)
  console.log('\n  Ambiente: PRONTO PARA OPERAÇÃO REAL CONTROLADA')
  console.log('─'.repeat(64) + '\n')
}

main().catch(e => { console.error(e); process.exit(1) })
