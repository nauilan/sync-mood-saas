/**
 * audit-db.mjs — Auditoria de dados fictícios no banco Supabase
 * Uso: node scripts/audit-db.mjs
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// ── Carregar .env.local manualmente ──────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const SUPABASE_URL         = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TENANT_ID            = env.NEXT_PUBLIC_TENANT_ID || null

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas no .env.local')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const SUSPEITOS = ['%TESTE%','%HOMOLOG%','%DEMO%','%MOCK%','%FICTICI%','%EXEMPLO%','%SAMPLE%','%LOREM%','%HML%','%TSM-HML%','%CTR-HML%','%RASCUNHO%']

function matchesSuspeito(str) {
  if (!str) return false
  const s = str.toUpperCase()
  return SUSPEITOS.some(p => {
    const term = p.replace(/%/g, '')
    return s.includes(term)
  })
}

function fmt(rows) {
  if (!rows || rows.length === 0) return '  (nenhum registro suspeito encontrado)'
  return rows.map((r, i) => `  [${i+1}] ${JSON.stringify(r)}`).join('\n')
}

async function run() {
  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  AUDITORIA DE DADOS FICTÍCIOS — Sync Mood')
  console.log('  Supabase:', SUPABASE_URL)
  console.log('══════════════════════════════════════════════════════════════\n')

  // ── [1] CONTAGEM GERAL ────────────────────────────────────────────────────
  console.log('── [CONTAGEM GERAL] ──────────────────────────────────────────')
  const tabelas = [
    'titulares','editoras','negocios_editoriais','contratos','obras',
    'obras_links','obras_links_titulares','obras_participantes',
    'fonogramas','importacoes','audit_logs','recebimentos'
  ]
  for (const t of tabelas) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true })
    if (error) console.log(`  ${t.padEnd(28)} ERROR: ${error.message}`)
    else       console.log(`  ${t.padEnd(28)} ${String(count).padStart(6)} registros`)
  }

  // ── [2] OBRAS SUSPEITAS ───────────────────────────────────────────────────
  console.log('\n── [OBRAS SUSPEITAS] ─────────────────────────────────────────')
  const { data: obras } = await sb
    .from('obras')
    .select('id, codigo_obra, titulo, status, origem_cadastro, contrato_origem_id, created_at, deleted_at')
    .order('created_at', { ascending: false })

  const obrasSus = (obras || []).filter(o =>
    matchesSuspeito(o.titulo) || matchesSuspeito(o.codigo_obra)
  )
  console.log(fmt(obrasSus))

  // ── [3] CONTRATOS SUSPEITOS ───────────────────────────────────────────────
  console.log('\n── [CONTRATOS SUSPEITOS] ─────────────────────────────────────')
  const { data: contratos } = await sb
    .from('contratos')
    .select('id, numero, tipo, status, observacoes, created_at, deleted_at')
    .order('created_at', { ascending: false })

  const contratosSus = (contratos || []).filter(c =>
    matchesSuspeito(c.numero) || matchesSuspeito(c.observacoes)
  )
  console.log(fmt(contratosSus))

  // ── [4] TITULARES SUSPEITOS ───────────────────────────────────────────────
  console.log('\n── [TITULARES SUSPEITOS] ─────────────────────────────────────')
  const { data: titulares } = await sb
    .from('titulares')
    .select('id, nome_completo, cpf_cnpj, codigo_titular, status, created_at')
    .order('created_at', { ascending: false })

  const titularesSus = (titulares || []).filter(t =>
    matchesSuspeito(t.nome_completo) || matchesSuspeito(t.codigo_titular) ||
    ['000.000.000-00','123.456.789-00','111.222.333-44','222.333.444-55'].includes(t.cpf_cnpj)
  )
  console.log(fmt(titularesSus))

  // ── [5] FONOGRAMAS VINCULADOS A OBRAS SUSPEITAS ───────────────────────────
  console.log('\n── [FONOGRAMAS SUSPEITOS] ────────────────────────────────────')
  if (obrasSus.length > 0) {
    const ids = obrasSus.map(o => o.id)
    const { data: fono } = await sb
      .from('fonogramas')
      .select('id, titulo_fonograma, isrc, interprete, obra_id, status, created_at')
      .in('obra_id', ids)
    console.log(fmt(fono))
  } else {
    // Busca geral por ISRC suspeito
    const { data: fono } = await sb
      .from('fonogramas')
      .select('id, titulo_fonograma, isrc, interprete, obra_id, status, created_at')
      .ilike('isrc', '%BRT2606%')
    const fono2 = (fono || []).filter(f => matchesSuspeito(f.titulo_fonograma))
    console.log(fmt([...( fono || []), ...fono2].filter((v,i,a) => a.findIndex(x => x.id===v.id)===i)))
  }

  // ── [6] OBRAS_PARTICIPANTES de obras suspeitas ────────────────────────────
  console.log('\n── [OBRAS_PARTICIPANTES de obras suspeitas] ──────────────────')
  if (obrasSus.length > 0) {
    const ids = obrasSus.map(o => o.id)
    const { data: part } = await sb
      .from('obras_participantes')
      .select('id, obra_id, titular_id, editora_id, papel, percentual, created_at')
      .in('obra_id', ids)
    console.log(fmt(part))
  } else {
    console.log('  (nenhuma obra suspeita encontrada para verificar participantes)')
  }

  // ── [7] OBRAS_LINKS de obras suspeitas ────────────────────────────────────
  console.log('\n── [OBRAS_LINKS de obras suspeitas] ──────────────────────────')
  if (obrasSus.length > 0) {
    const ids = obrasSus.map(o => o.id)
    const { data: links } = await sb
      .from('obras_links')
      .select('id, obra_id, numero_link, tipo_link, status, created_at')
      .in('obra_id', ids)
    console.log(fmt(links))
  } else {
    console.log('  (nenhuma obra suspeita encontrada para verificar links)')
  }

  // ── [8] OBRAS_LINKS_TITULARES de obras suspeitas ──────────────────────────
  console.log('\n── [OBRAS_LINKS_TITULARES de obras suspeitas] ────────────────')
  if (obrasSus.length > 0) {
    const ids = obrasSus.map(o => o.id)
    const { data: lt } = await sb
      .from('obras_links_titulares')
      .select('id, obra_id, nome, funcao_no_link, percentual_exec_publica, created_at')
      .in('obra_id', ids)
    console.log(fmt(lt))
  } else {
    console.log('  (nenhuma obra suspeita encontrada para verificar links_titulares)')
  }

  // ── [9] EDITORAS SUSPEITAS ────────────────────────────────────────────────
  console.log('\n── [EDITORAS SUSPEITAS] ──────────────────────────────────────')
  const { data: editoras } = await sb
    .from('editoras')
    .select('id, razao_social, nome_fantasia, cnpj, codigo_interno, status, created_at')
    .order('created_at', { ascending: false })

  const editorasSus = (editoras || []).filter(e =>
    matchesSuspeito(e.razao_social) || matchesSuspeito(e.nome_fantasia) || matchesSuspeito(e.codigo_interno)
  )
  console.log(fmt(editorasSus))

  // ── [10] NEGÓCIOS EDITORIAIS SUSPEITOS ────────────────────────────────────
  console.log('\n── [NEGOCIOS_EDITORIAIS SUSPEITOS] ───────────────────────────')
  const { data: negocios } = await sb
    .from('negocios_editoriais')
    .select('id, nome, status, created_at')
    .order('created_at', { ascending: false })

  const negociosSus = (negocios || []).filter(n => matchesSuspeito(n.nome))
  console.log(fmt(negociosSus))

  // ── [11] IMPORTAÇÕES SUSPEITAS ────────────────────────────────────────────
  console.log('\n── [IMPORTAÇÕES SUSPEITAS] ───────────────────────────────────')
  const { data: imp, error: impErr } = await sb
    .from('importacoes')
    .select('id, tipo, arquivo_nome, status, created_at')
    .order('created_at', { ascending: false })

  if (impErr) {
    console.log('  Tabela importacoes:', impErr.message)
  } else {
    const impSus = (imp || []).filter(i => matchesSuspeito(i.arquivo_nome))
    console.log(fmt(impSus.length ? impSus : imp?.slice(0,5)))
  }

  // ── [12] AUDIT_LOGS — existência ──────────────────────────────────────────
  console.log('\n── [AUDIT_LOGS] ──────────────────────────────────────────────')
  const { count: auditCount } = await sb
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
  console.log(`  Total de registros: ${auditCount}`)
  if (auditCount > 0) {
    const { data: lastLogs } = await sb
      .from('audit_logs')
      .select('id, modulo, acao, tabela_afetada, registro_id, origem_execucao, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    console.log('  Últimos 5 logs:')
    console.log(fmt(lastLogs))
  }

  // ── [13] TODOS OS TITULARES (listagem completa para conferência) ──────────
  console.log('\n── [TODOS OS TITULARES] ──────────────────────────────────────')
  console.log(fmt((titulares || []).map(t => ({
    id: t.id?.slice(0,8)+'...',
    nome: t.nome_completo,
    cpf: t.cpf_cnpj,
    codigo: t.codigo_titular,
    status: t.status
  }))))

  // ── [14] TODAS AS OBRAS ───────────────────────────────────────────────────
  console.log('\n── [TODAS AS OBRAS] ──────────────────────────────────────────')
  console.log(fmt((obras || []).map(o => ({
    id: o.id?.slice(0,8)+'...',
    codigo: o.codigo_obra,
    titulo: o.titulo,
    status: o.status,
    deleted_at: o.deleted_at
  }))))

  // ── [15] TODOS OS CONTRATOS ───────────────────────────────────────────────
  console.log('\n── [TODOS OS CONTRATOS] ──────────────────────────────────────')
  console.log(fmt((contratos || []).map(c => ({
    id: c.id?.slice(0,8)+'...',
    numero: c.numero,
    tipo: c.tipo,
    status: c.status,
    deleted_at: c.deleted_at
  }))))

  // ── RESUMO ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  RESUMO DE SUSPEITOS ENCONTRADOS')
  console.log('══════════════════════════════════════════════════════════════')
  console.log(`  Obras suspeitas:        ${obrasSus.length}`)
  console.log(`  Contratos suspeitos:    ${contratosSus.length}`)
  console.log(`  Titulares suspeitos:    ${titularesSus.length}`)
  console.log(`  Editoras suspeitas:     ${editorasSus.length}`)
  console.log(`  Negócios sus.:          ${negociosSus.length}`)
  console.log('\n  IDs para remoção:')
  if (obrasSus.length)    obrasSus.forEach(o    => console.log(`    OBRA      ${o.id}  "${o.titulo}"  cod: ${o.codigo_obra}`))
  if (contratosSus.length) contratosSus.forEach(c => console.log(`    CONTRATO  ${c.id}  "${c.numero}"`))
  if (titularesSus.length) titularesSus.forEach(t => console.log(`    TITULAR   ${t.id}  "${t.nome_completo}"`))
  console.log('\n══════════════════════════════════════════════════════════════\n')
}

run().catch(e => { console.error('ERRO:', e); process.exit(1) })
