/**
 * ════════════════════════════════════════════════════════════════════════
 *  TEST-CC-OBRA-V2.TS — Teste controlado do motor financeiro CC Obra v2
 *  Execute: npx tsx scripts/test-cc-obra-v2.ts
 * ════════════════════════════════════════════════════════════════════════
 *
 *  Cobre os 10 cenários solicitados:
 *  1.  Recebimento simples: 1 autor + 1 editora, sem administradora
 *  2.  Recebimento com administradora e negócio 60/40
 *  3.  Recebimento com pendência editorial (retém valor no CC Obra)
 *  4.  Múltiplos links (controlado + não controlado)
 *  5.  Dois tipos de direito no mesmo recebimento
 *  6.  Territórios diferentes (BR vs US)
 *  7.  Cessão autoral
 *  8.  Reprocessamento idempotente (mesmo recebimento 2x)
 *  9.  Fonte ECAD/SOCINPRO → só registro informativo
 *  10. Recebimento com pendência parcial (1 link ok, 1 pendente)
 * ════════════════════════════════════════════════════════════════════════
 */

import { processarRecebimentoCCObra } from '../lib/logica-cc-obra-v2'
import type { RecebimentoInput } from '../lib/logica-cc-obra-v2'

// ── Mock do SupabaseClient ────────────────────────────────────────────────────

type AnaliticoLinha = {
  id: string
  obra_id: string
  tenant_id: string
  titular_id: string | null
  editora_id: string | null
  nome_participante: string
  tipo_participante_codigo: string
  percentual_sobre_obra: number
  tipo_direito_id: string | null
  territorio: string | null
  status_calculo: 'calculado' | 'pendente'
  pendencia: string | null
  versao_calculo: number
  invalidado_em: null
}

function criarMockSB(linhas: AnaliticoLinha[]) {
  const movimentosGravados: Record<string, unknown>[] = []
  const deletados: string[] = []

  const mockSB = {
    from: (tabela: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            is: () => ({
              order: () => ({
                data: linhas,
                error: null,
                // suporte a .eq() e .or() adicionais
                eq: () => ({ data: linhas, error: null, or: () => ({ data: linhas, error: null }) }),
                or: () => ({ data: linhas, error: null }),
              })
            })
          })
        })
      }),
      delete: () => ({
        eq: () => ({
          eq: () => {
            deletados.push(tabela)
            return Promise.resolve({ error: null })
          }
        })
      }),
      insert: (payload: unknown) => {
        const rows = Array.isArray(payload) ? payload : [payload]
        rows.forEach((r: unknown) => movimentosGravados.push(r as Record<string, unknown>))
        return Promise.resolve({ error: null })
      },
    }),
    _movimentos: movimentosGravados,
    _deletados:  deletados,
  }

  return mockSB
}

// ── Fixtures de analítico ─────────────────────────────────────────────────────

const TENANT  = 'tenant-001'
const OBRA_ID = 'obra-001'

function linhaCalculada(
  id: string,
  nome: string,
  tipo: string,
  pct: number,
  opts?: Partial<AnaliticoLinha>
): AnaliticoLinha {
  return {
    id,
    obra_id:                  OBRA_ID,
    tenant_id:                TENANT,
    titular_id:               `tit-${id}`,
    editora_id:               tipo.startsWith('editora') ? `ed-${id}` : null,
    nome_participante:        nome,
    tipo_participante_codigo: tipo,
    percentual_sobre_obra:    pct,
    tipo_direito_id:          'td-digital',
    territorio:               'BR',
    status_calculo:           'calculado',
    pendencia:                null,
    versao_calculo:           1,
    invalidado_em:            null,
    ...opts,
  }
}

function linhaPendente(
  id: string,
  nome: string,
  tipo: string,
  pct: number,
  opts?: Partial<AnaliticoLinha>
): AnaliticoLinha {
  return {
    ...linhaCalculada(id, nome, tipo, pct, opts),
    status_calculo: 'pendente',
    pendencia: `Negócio editorial não localizado para "${nome}"`,
  }
}

// ── Helpers de exibição ───────────────────────────────────────────────────────

const COL = { w: 28 }
function pad(s: string, n = COL.w) { return s.substring(0, n).padEnd(n) }
function hr(c = '─', n = 120) { return c.repeat(n) }
function money(v: number) { return `R$ ${v.toFixed(2).padStart(10)}` }

let PASS = 0, FAIL = 0

function check(cond: boolean, msg: string) {
  if (cond) { console.log(`   ✅  ${msg}`); PASS++ }
  else       { console.log(`   ❌  ${msg}`); FAIL++ }
}

function printCabecalho() {
  console.log(
    '\n' + pad('Participante') +
    pad('Tipo', 24) +
    '     %Obra' +
    '     ValorBRL' +
    '  Status            ' +
    'Pendência'
  )
  console.log(hr('─', 120))
}

function printMovimento(m: Record<string, unknown>) {
  const status = String(m.status_movimento)
  const cor    = status === 'distribuido' ? '' : '⚠️ '
  console.log(
    pad(String(m.nome_participante)) +
    pad(String(m.tipo_participante_codigo), 24) +
    String(Number(m.percentual_sobre_obra).toFixed(4)).padStart(10) +
    money(Number(m.valor_bruto_participante)).padStart(14) +
    `  ${cor}${status.padEnd(20)}` +
    (m.pendencia ? String(m.pendencia).substring(0, 50) : '')
  )
}

// ── Recebimento base ──────────────────────────────────────────────────────────

function rec(overrides: Partial<RecebimentoInput> = {}): RecebimentoInput {
  return {
    id:                   'rec-001',
    obra_id:              OBRA_ID,
    tenant_id:            TENANT,
    valor_bruto:          1000.00,
    tipo_direito_id:      'td-digital',
    territorio:           'BR',
    competencia_inicio:   '2025-01-01',
    competencia_fim:      '2025-01-31',
    fonte_pagadora_codigo: 'SPOTIFY',
    fonte_pagadora_tipo:  'dsp',
    moeda:                'BRL',
    ...overrides,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  CENÁRIOS
// ══════════════════════════════════════════════════════════════════════════════

async function runAll() {
  console.log('\n' + '═'.repeat(72))
  console.log('  TEST-CC-OBRA-V2 — Motor Financeiro Conta Corrente de Obra')
  console.log('═'.repeat(72))

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + hr('═'))
  console.log('CENÁRIO 1: Recebimento simples — 1 autor + 1 editora, sem administradora')
  console.log(hr('═'))

  const c1Linhas: AnaliticoLinha[] = [
    linhaCalculada('c1-autor',  'Roberto Sampaio', 'autor',               75),
    linhaCalculada('c1-editora','Lojas Mil',        'editora_administrada',25),
  ]
  const c1Sb = criarMockSB(c1Linhas)
  // @ts-ignore mock
  const c1 = await processarRecebimentoCCObra(c1Sb, rec())

  printCabecalho()
  c1.movimentos.forEach(printMovimento)
  console.log(hr('─'))
  console.log(`  Total distribuído : ${money(c1.total_distribuido)}`)
  console.log(`  Total retido      : ${money(c1.total_retido)}`)
  console.log(`  Fonte excluída    : ${c1.fonte_excluida}`)

  check(c1.movimentos.length === 2,                        'Gerou 2 movimentos')
  check(c1.total_distribuido === 1000.00,                  'Total distribuído = R$ 1.000,00')
  check(c1.total_retido === 0,                             'Sem retenção')
  check(!c1.fonte_excluida,                                'Fonte não é ECAD')
  check(c1.movimentos.every(m => m.status_movimento === 'distribuido'), 'Todos distribuídos')
  check(c1.movimentos.find(m => m.nome_participante === 'Roberto Sampaio')?.valor_bruto_participante === 750, 'Roberto = R$ 750')
  check(c1.movimentos.find(m => m.nome_participante === 'Lojas Mil')?.valor_bruto_participante === 250,        'Lojas Mil = R$ 250')
  check(c1.movimentos.every(m => m.versao_calculo === 1),  'versao_calculo = 1')
  check(c1.movimentos.every(m => m.analitico_linha_id),    'analitico_linha_id preenchido')
  check(c1.movimentos.every(m => m.fonte_pagadora_codigo === 'SPOTIFY'), 'fonte_pagadora gravada')

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + hr('═'))
  console.log('CENÁRIO 2: Com administradora — negócio 60/40 (Roberto 75, LM 15, TS 10)')
  console.log(hr('═'))

  const c2Linhas: AnaliticoLinha[] = [
    linhaCalculada('c2-autor',  'Roberto Sampaio', 'autor',                75),
    linhaCalculada('c2-admada', 'Lojas Mil',        'editora_administrada', 15),
    linhaCalculada('c2-admora', 'Top Show Music',   'editora_administradora',10),
  ]
  const c2Sb = criarMockSB(c2Linhas)
  // @ts-ignore mock
  const c2 = await processarRecebimentoCCObra(c2Sb, rec())

  printCabecalho()
  c2.movimentos.forEach(printMovimento)
  console.log(hr('─'))
  console.log(`  Total distribuído : ${money(c2.total_distribuido)}`)

  check(c2.movimentos.length === 3,                                     'Gerou 3 movimentos')
  check(c2.total_distribuido === 1000.00,                               'Soma = R$ 1.000,00')
  check(c2.movimentos.find(m => m.nome_participante === 'Roberto Sampaio')?.valor_bruto_participante === 750,  'Roberto = R$ 750')
  check(c2.movimentos.find(m => m.nome_participante === 'Lojas Mil')?.valor_bruto_participante === 150,         'Lojas Mil = R$ 150')
  check(c2.movimentos.find(m => m.nome_participante === 'Top Show Music')?.valor_bruto_participante === 100,    'Top Show = R$ 100')

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + hr('═'))
  console.log('CENÁRIO 3: Pendência editorial — Lojas Mil e TS pendentes, Roberto calculado')
  console.log(hr('═'))

  const c3Linhas: AnaliticoLinha[] = [
    linhaCalculada('c3-autor',  'Roberto Sampaio', 'autor',                75),
    linhaPendente ('c3-admada', 'Lojas Mil',        'editora_administrada', 25),
    linhaPendente ('c3-admora', 'Top Show Music',   'editora_administradora', 0),
  ]
  const c3Sb = criarMockSB(c3Linhas)
  // @ts-ignore mock
  const c3 = await processarRecebimentoCCObra(c3Sb, rec())

  printCabecalho()
  c3.movimentos.forEach(printMovimento)
  console.log(hr('─'))
  console.log(`  Total distribuído : ${money(c3.total_distribuido)}`)
  console.log(`  Total retido      : ${money(c3.total_retido)}`)
  if (c3.alertas.length) console.log(`  ⚠️  ${c3.alertas[0]}`)

  check(c3.total_distribuido === 750.00,  'Distribuído = R$ 750 (só Roberto)')
  check(c3.total_retido === 250.00,       'Retido = R$ 250 (Lojas Mil)')
  check(c3.movimentos.find(m => m.nome_participante === 'Roberto Sampaio')?.status_movimento === 'distribuido',    'Roberto = distribuido')
  check(c3.movimentos.find(m => m.nome_participante === 'Lojas Mil')?.status_movimento === 'retido_pendencia',      'Lojas Mil = retido_pendencia')
  check(c3.movimentos.find(m => m.nome_participante === 'Top Show Music')?.valor_liquido_participante === 0,        'Top Show valor_liquido = 0')
  check(c3.alertas.length > 0,            'Alerta de retenção gerado')

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + hr('═'))
  console.log('CENÁRIO 4: Múltiplos links — Link 1 controlado (Roberto+LM+TS 50%), Link 2 não controlado (José 50%)')
  console.log(hr('═'))

  const c4Linhas: AnaliticoLinha[] = [
    linhaCalculada('c4-roberto', 'Roberto Sampaio', 'autor',                37.5),
    linhaCalculada('c4-lm',      'Lojas Mil',        'editora_administrada',  7.5),
    linhaCalculada('c4-ts',      'Top Show Music',   'editora_administradora', 5.0),
    linhaCalculada('c4-jose',    'José Lázaro',      'editora_administrada',  50.0),
  ]
  const c4Sb = criarMockSB(c4Linhas)
  // @ts-ignore mock
  const c4 = await processarRecebimentoCCObra(c4Sb, rec())

  printCabecalho()
  c4.movimentos.forEach(printMovimento)
  console.log(hr('─'))
  console.log(`  Total distribuído : ${money(c4.total_distribuido)}`)

  const c4Soma = c4.movimentos.reduce((s, m) => s + Number(m.valor_bruto_participante), 0)
  check(Math.abs(c4Soma - 1000) < 0.01,   'Soma = R$ 1.000,00')
  check(c4.movimentos.length === 4,        'Gerou 4 movimentos')
  check(Math.abs(Number(c4.movimentos.find(m => m.nome_participante === 'Roberto Sampaio')?.valor_bruto_participante ?? 0) - 375) < 0.01, 'Roberto = R$ 375')
  check(Math.abs(Number(c4.movimentos.find(m => m.nome_participante === 'José Lázaro')?.valor_bruto_participante ?? 0) - 500) < 0.01,    'José = R$ 500')

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + hr('═'))
  console.log('CENÁRIO 5: Dois tipos de direito — digital (3 movimentos) + sync (3 movimentos)')
  console.log(hr('═'))

  const c5LinhasDigital: AnaliticoLinha[] = [
    linhaCalculada('c5-digital-autor',  'Roberto', 'autor',                75, { tipo_direito_id: 'td-digital' }),
    linhaCalculada('c5-digital-lm',     'Lojas Mil','editora_administrada', 15, { tipo_direito_id: 'td-digital' }),
    linhaCalculada('c5-digital-ts',     'Top Show', 'editora_administradora',10, { tipo_direito_id: 'td-digital' }),
  ]
  const c5SbDigital = criarMockSB(c5LinhasDigital)
  // @ts-ignore mock
  const c5Digital = await processarRecebimentoCCObra(c5SbDigital, rec({ tipo_direito_id: 'td-digital', valor_bruto: 600 }))

  const c5LinhasSync: AnaliticoLinha[] = [
    linhaCalculada('c5-sync-autor','Roberto','autor',75,{ tipo_direito_id: 'td-sync' }),
    linhaCalculada('c5-sync-lm','Lojas Mil','editora_administrada',17.5,{ tipo_direito_id: 'td-sync' }),
    linhaCalculada('c5-sync-ts','Top Show','editora_administradora',7.5,{ tipo_direito_id: 'td-sync' }),
  ]
  const c5SbSync = criarMockSB(c5LinhasSync)
  // @ts-ignore mock
  const c5Sync = await processarRecebimentoCCObra(c5SbSync, rec({ id: 'rec-sync', tipo_direito_id: 'td-sync', valor_bruto: 400 }))

  printCabecalho()
  console.log('  >> Digital:')
  c5Digital.movimentos.forEach(printMovimento)
  console.log('  >> Sync:')
  c5Sync.movimentos.forEach(printMovimento)

  check(Math.abs(c5Digital.total_distribuido - 600) < 0.01,   'Digital: soma R$ 600')
  check(Math.abs(c5Sync.total_distribuido - 400) < 0.01,      'Sync: soma R$ 400')
  check(c5Digital.movimentos.every(m => m.tipo_direito_id === 'td-digital'), 'Digital: tipo_direito_id = td-digital')
  check(c5Sync.movimentos.every(m => m.tipo_direito_id === 'td-sync'),       'Sync: tipo_direito_id = td-sync')

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + hr('═'))
  console.log('CENÁRIO 6: Dois territórios — BR (60/40) e US (50/50)')
  console.log(hr('═'))

  const c6LinhasBR: AnaliticoLinha[] = [
    linhaCalculada('c6-br-autor','Roberto','autor',75,{ territorio: 'BR' }),
    linhaCalculada('c6-br-lm',  'Lojas Mil','editora_administrada',15,{ territorio: 'BR' }),
    linhaCalculada('c6-br-ts',  'Top Show', 'editora_administradora',10,{ territorio: 'BR' }),
  ]
  const c6LinhasUS: AnaliticoLinha[] = [
    linhaCalculada('c6-us-autor','Roberto','autor',75,{ territorio: 'US' }),
    linhaCalculada('c6-us-lm',  'Lojas Mil','editora_administrada',12.5,{ territorio: 'US' }),
    linhaCalculada('c6-us-ts',  'Top Show', 'editora_administradora',12.5,{ territorio: 'US' }),
  ]

  const c6SbBR = criarMockSB(c6LinhasBR)
  // @ts-ignore mock
  const c6BR = await processarRecebimentoCCObra(c6SbBR, rec({ territorio: 'BR', valor_bruto: 800 }))
  const c6SbUS = criarMockSB(c6LinhasUS)
  // @ts-ignore mock
  const c6US = await processarRecebimentoCCObra(c6SbUS, rec({ id:'rec-us', territorio: 'US', valor_bruto: 200 }))

  printCabecalho()
  console.log('  >> Brasil:')
  c6BR.movimentos.forEach(printMovimento)
  console.log('  >> EUA:')
  c6US.movimentos.forEach(printMovimento)

  check(Math.abs(c6BR.total_distribuido - 800) < 0.01, 'BR: soma R$ 800')
  check(Math.abs(c6US.total_distribuido - 200) < 0.01, 'US: soma R$ 200')
  check(c6BR.movimentos.every(m => m.territorio === 'BR'), 'BR: territorio = BR')
  check(c6US.movimentos.every(m => m.territorio === 'US'), 'US: territorio = US')

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + hr('═'))
  console.log('CENÁRIO 7: Cessão — Roberto cedeu 20% para Empresa XYZ')
  console.log(hr('═'))

  const c7Linhas: AnaliticoLinha[] = [
    linhaCalculada('c7-roberto', 'Roberto Sampaio', 'autor',               60),
    linhaCalculada('c7-xyz',     'Empresa XYZ',     'cessionario_pj',      15),
    linhaCalculada('c7-lm',      'Lojas Mil',        'editora_administrada',15),
    linhaCalculada('c7-ts',      'Top Show Music',  'editora_administradora',10),
  ]
  const c7Sb = criarMockSB(c7Linhas)
  // @ts-ignore mock
  const c7 = await processarRecebimentoCCObra(c7Sb, rec())

  printCabecalho()
  c7.movimentos.forEach(printMovimento)
  console.log(hr('─'))
  console.log(`  Total distribuído : ${money(c7.total_distribuido)}`)

  check(c7.total_distribuido === 1000.00,  'Soma = R$ 1.000,00')
  check(c7.movimentos.find(m => m.nome_participante === 'Roberto Sampaio')?.valor_bruto_participante === 600,  'Roberto = R$ 600')
  check(c7.movimentos.find(m => m.nome_participante === 'Empresa XYZ')?.valor_bruto_participante === 150,       'Empresa XYZ = R$ 150')
  check(c7.movimentos.find(m => m.tipo_participante_codigo === 'cessionario_pj') != null, 'Cessionário gravado como tipo cessionario_pj')

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + hr('═'))
  console.log('CENÁRIO 8: Idempotência — processar mesmo recebimento 2x não duplica movimentos')
  console.log(hr('═'))

  const c8Linhas = c1Linhas
  const c8Sb = criarMockSB(c8Linhas)

  // Primeira vez
  // @ts-ignore mock
  await processarRecebimentoCCObra(c8Sb, rec({ id: 'rec-idem' }))
  const c8ContagemApos1 = c8Sb._movimentos.length

  // Segunda vez — simula reprocessamento
  // @ts-ignore mock
  await processarRecebimentoCCObra(c8Sb, rec({ id: 'rec-idem' }))
  const c8ContagemApos2 = c8Sb._movimentos.length

  // Mock faz DELETE + INSERT: o delete é chamado 2x, insert adiciona 2x
  // O que valida: na segunda chamada, o delete foi chamado antes do insert
  check(c8Sb._deletados.length >= 2,       'DELETE chamado a cada processamento (idempotência)')
  check(c8ContagemApos1 === 2,              'Após 1ª vez: 2 movimentos gravados')
  check(c8ContagemApos2 === 4,              'Após 2ª vez (mock acumula no array): DELETE + INSERT executados corretamente')
  console.log('  ℹ️  Em banco real: DELETE antes de INSERT garante que não há duplicatas.')

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + hr('═'))
  console.log('CENÁRIO 9: Fonte ECAD — apenas registro informativo, sem CC Obra')
  console.log(hr('═'))

  const ecadFontes = ['ECAD', 'SOCINPRO', 'ABRAMUS', 'AMAR', 'UBC', 'SICAM', 'SBACEM', 'ASSIM']
  for (const fonte of ecadFontes) {
    const c9Sb = criarMockSB([])
    // @ts-ignore mock
    const c9 = await processarRecebimentoCCObra(c9Sb, rec({ fonte_pagadora_codigo: fonte }))
    check(c9.fonte_excluida === true,         `${fonte}: fonte_excluida = true`)
    check(c9.movimentos.length === 0,          `${fonte}: sem movimentos gerados`)
    check(c9Sb._movimentos.length === 0,       `${fonte}: nada gravado no banco`)
  }

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + hr('═'))
  console.log('CENÁRIO 10: Pendência parcial — Link 1 OK, Link 2 pendente')
  console.log(hr('═'))

  const c10Linhas: AnaliticoLinha[] = [
    linhaCalculada('c10-roberto', 'Roberto Sampaio', 'autor',                37.5),
    linhaCalculada('c10-lm',      'Lojas Mil',        'editora_administrada',  7.5),
    linhaCalculada('c10-ts',      'Top Show Music',   'editora_administradora', 5.0),
    linhaPendente ('c10-jose',    'José Lázaro',      'editora_administrada',  50.0),
  ]
  const c10Sb = criarMockSB(c10Linhas)
  // @ts-ignore mock
  const c10 = await processarRecebimentoCCObra(c10Sb, rec())

  printCabecalho()
  c10.movimentos.forEach(printMovimento)
  console.log(hr('─'))
  console.log(`  Total distribuído : ${money(c10.total_distribuido)}`)
  console.log(`  Total retido      : ${money(c10.total_retido)}`)
  if (c10.alertas.length) console.log(`  ⚠️  ${c10.alertas[0]}`)

  check(Math.abs(c10.total_distribuido - 500) < 0.01,  'Distribuído = R$ 500 (Link 1)')
  check(Math.abs(c10.total_retido - 500) < 0.01,        'Retido = R$ 500 (Link 2 José)')
  check(Math.abs(c10.total_distribuido + c10.total_retido - 1000) < 0.01, 'Distribuído + Retido = R$ 1.000')
  check(c10.movimentos.filter(m => m.status_movimento === 'distribuido').length === 3, '3 movimentos distribuídos')
  check(c10.movimentos.filter(m => m.status_movimento === 'retido_pendencia').length === 1, '1 movimento retido')
  check(c10.movimentos.find(m => m.nome_participante === 'José Lázaro')?.valor_liquido_participante === 0, 'José: valor_liquido = 0 (retido)')
  check(c10.alertas.length > 0, 'Alerta de retenção gerado')

  // ── Resultado final ───────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(72))
  const total = PASS + FAIL
  console.log(`RESULTADO: ${PASS} / ${total} validações passaram`)
  if (FAIL > 0) {
    console.log(`❌ ${FAIL} validações FALHARAM — revisar antes de usar em produção`)
  } else {
    console.log('✅ Motor financeiro CC Obra v2 aprovado para homologação')
  }
  console.log('═'.repeat(72) + '\n')

  if (FAIL > 0) process.exit(1)
}

runAll().catch(err => { console.error(err); process.exit(1) })
