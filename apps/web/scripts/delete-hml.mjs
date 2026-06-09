/**
 * delete-hml.mjs — Remove definitivamente os registros de homologação
 * IDs confirmados na auditoria de 07/06/2026
 * Uso: node scripts/delete-hml.mjs
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// ── Carregar .env.local ───────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8').split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const OBRA_HML_ID     = '7a05dec1-d323-48ba-9f4f-61236625df9c'
const CONTRATO_HML_ID = '48acd6e6-bec1-4243-a24d-5bd57719821b'

async function run() {
  console.log('\n══════════════════════════════════════════════════')
  console.log('  DELETE FÍSICO — Registros HML')
  console.log('══════════════════════════════════════════════════')

  // ── 1. Verificar dependências (segurança) ──────────────────────────────────
  console.log('\n[1] Verificando dependências antes de deletar...')
  const { count: cPart }    = await sb.from('obras_participantes').select('*', { count:'exact', head:true }).eq('obra_id', OBRA_HML_ID)
  const { count: cLinks }   = await sb.from('obras_links').select('*', { count:'exact', head:true }).eq('obra_id', OBRA_HML_ID)
  const { count: cFono }    = await sb.from('fonogramas').select('*', { count:'exact', head:true }).eq('obra_id', OBRA_HML_ID)
  const { count: cCObraRef} = await sb.from('obras').select('*', { count:'exact', head:true }).eq('contrato_origem_id', CONTRATO_HML_ID)

  console.log(`    obras_participantes vinculadas: ${cPart}`)
  console.log(`    obras_links vinculadas:         ${cLinks}`)
  console.log(`    fonogramas vinculados:           ${cFono}`)
  console.log(`    obras com contrato_origem_id:   ${cCObraRef}`)

  if ((cPart||0) + (cLinks||0) + (cFono||0) + (cCObraRef||0) > 0) {
    console.error('\n❌ BLOQUEADO — existem dependências. Abortar.')
    process.exit(1)
  }
  console.log('    ✓ Nenhuma dependência. Seguro prosseguir.')

  // ── 2. Limpar contrato_obras (se houver) ───────────────────────────────────
  console.log('\n[2] Removendo entradas em contrato_obras (se houver)...')
  const { error: eCO } = await sb.from('contrato_obras').delete().eq('contrato_id', CONTRATO_HML_ID)
  if (eCO && !eCO.message?.includes('0 rows')) console.log(`    Aviso contrato_obras: ${eCO.message}`)
  else console.log('    ✓ contrato_obras limpo')

  // ── 3. NULL em obras.contrato_origem_id (segurança extra) ─────────────────
  console.log('\n[3] Garantindo NULL em obras.contrato_origem_id...')
  const { error: eNull } = await sb.from('obras').update({ contrato_origem_id: null }).eq('contrato_origem_id', CONTRATO_HML_ID)
  if (eNull) console.log(`    Aviso update: ${eNull.message}`)
  else console.log('    ✓ Nenhuma obra aponta para o contrato HML')

  // ── 4. DELETE da obra ──────────────────────────────────────────────────────
  console.log('\n[4] Deletando obra HML...')
  const { error: eObra, count: obraCount } = await sb
    .from('obras')
    .delete({ count: 'exact' })
    .eq('id', OBRA_HML_ID)

  if (eObra) { console.error(`    ❌ Erro ao deletar obra: ${eObra.message}`); process.exit(1) }
  console.log(`    ✓ Obra deletada (${obraCount} registro removido)`)

  // ── 5. DELETE do contrato ──────────────────────────────────────────────────
  console.log('\n[5] Deletando contrato HML...')
  const { error: eCtr, count: ctrCount } = await sb
    .from('contratos')
    .delete({ count: 'exact' })
    .eq('id', CONTRATO_HML_ID)

  if (eCtr) { console.error(`    ❌ Erro ao deletar contrato: ${eCtr.message}`); process.exit(1) }
  console.log(`    ✓ Contrato deletado (${ctrCount} registro removido)`)

  // ── 6. Verificação pós-delete ──────────────────────────────────────────────
  console.log('\n[6] Verificação pós-delete...')
  const { count: obrasFinal }    = await sb.from('obras').select('*', { count:'exact', head:true })
  const { count: contratosFinal} = await sb.from('contratos').select('*', { count:'exact', head:true })
  const { data: obraCheck }      = await sb.from('obras').select('id').eq('id', OBRA_HML_ID)
  const { data: ctrCheck }       = await sb.from('contratos').select('id').eq('id', CONTRATO_HML_ID)

  console.log(`    obras restantes no banco:     ${obrasFinal}`)
  console.log(`    contratos restantes no banco: ${contratosFinal}`)
  console.log(`    obra HML ainda existe?        ${obraCheck?.length ? '❌ SIM (erro!)' : '✓ Não — removida'}`)
  console.log(`    contrato HML ainda existe?    ${ctrCheck?.length ? '❌ SIM (erro!)' : '✓ Não — removido'}`)

  console.log('\n══════════════════════════════════════════════════')
  console.log('  RESULTADO: BANCO LIMPO')
  console.log('══════════════════════════════════════════════════\n')
}

run().catch(e => { console.error('ERRO fatal:', e); process.exit(1) })
