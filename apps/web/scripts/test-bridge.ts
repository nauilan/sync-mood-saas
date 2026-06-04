/**
 * scripts/test-bridge.ts
 *
 * Testes controlados da função executarBridge.
 * Execute: npx tsx scripts/test-bridge.ts
 */

import {
  executarBridge,
  type BridgeContexto,
  type ObraLinkInput,
  type LinkTitularInput,
  type ContratoEditorialInput,
  type NegocioEditorialInput,
  type CessaoInput,
} from '../lib/bridge-analitico'

// ── Helpers de fixture ────────────────────────────────────────────────────────

const TENANT  = 'tenant-001'
const OBRA_ID = 'obra-001'

const TIPO_DIGITAL = { id: 'td-digital', codigo: 'digital' }
const TIPO_SYNC    = { id: 'td-sync',    codigo: 'sincronizacao' }

function titular(
  id: string,
  nome: string,
  funcao: string,
  pctExec: number,
  pctFono: number,
  pctSync: number,
  opts?: Partial<LinkTitularInput>
): LinkTitularInput {
  return {
    id,
    obra_link_id: 'link-001',
    titular_id:   `tit-${id}`,
    editora_id:   funcao === 'E' || funcao === 'AM' ? `ed-${id}` : null,
    nome,
    funcao_no_link: funcao as any,
    papel: funcao === 'CA' ? 'autor' : 'editora',
    percentual_exec_publica:  pctExec,
    percentual_fonomecanico:  pctFono,
    percentual_sincronizacao: pctSync,
    direitos_flexiveis: [],
    controlado: true,
    editora_original_id: null,
    editora_administradora_id: null,
    contrato_id: null,
    ...opts,
  }
}

function link(
  id: string,
  numero: number,
  titulares: LinkTitularInput[],
  opts?: Partial<ObraLinkInput>
): ObraLinkInput {
  return {
    id,
    obra_id: OBRA_ID,
    numero_link: numero,
    percentual_link: 100,
    tipo_link: 'controlado',
    controlado: true,
    titulares,
    ...opts,
  }
}

function negocio(
  id: string,
  admId: string,
  admNome: string,
  admrId: string,
  admrNome: string,
  pctAdm: number,
  pctAdmr: number,
  opts?: Partial<NegocioEditorialInput>
): NegocioEditorialInput {
  return {
    id,
    editora_administrada_id:    admId,
    editora_administrada_nome:  admNome,
    editora_administradora_id:  admrId,
    editora_administradora_nome: admrNome,
    percentual_administrada:    pctAdm,
    percentual_administradora:  pctAdmr,
    receitas_aplicaveis:        [],
    abrangencia_tipo:           'catalogo_inteiro',
    abrangencia_ids:            [],
    territorios:                [],
    tipo_direito_id:            null,
    data_inicio:                '2020-01-01',
    data_fim:                   null,
    status:                     'ativo',
    ...opts,
  }
}

function contexto(
  links: ObraLinkInput[],
  opts?: {
    contratos?: ContratoEditorialInput[]
    negocios?: NegocioEditorialInput[]
    cessoes?: CessaoInput[]
    tipos?: typeof TIPO_DIGITAL[]
    territorios?: string[]
    versao?: number
  }
): BridgeContexto {
  return {
    tenant_id: TENANT,
    obra_id:   OBRA_ID,
    links,
    contratos_editoriais: opts?.contratos ?? [],
    negocios_editoriais:  opts?.negocios  ?? [],
    cessoes:              opts?.cessoes   ?? [],
    tipos_direito:        opts?.tipos     ?? [TIPO_DIGITAL],
    territorios:          opts?.territorios ?? ['BR'],
    competencia_inicio:   new Date('2025-11-01'),
    competencia_fim:      new Date('2025-11-30'),
    versao_calculo:       opts?.versao ?? 1,
  }
}

// ── Exibição ─────────────────────────────────────────────────────────────────

let totalTestes = 0
let totalPassados = 0

function exibir(
  cenario: string,
  ctx: BridgeContexto,
  asserts?: Array<{ desc: string; fn: () => boolean }>
) {
  console.log('\n' + '═'.repeat(72))
  console.log(`CENÁRIO ${++totalTestes}: ${cenario}`)
  console.log('═'.repeat(72))

  const r = executarBridge(ctx)

  console.log(`\n▶ LINHAS GERADAS (${r.linhas.length}):`)
  console.log(
    ['Nome'.padEnd(28), 'Tipo'.padEnd(22), '%Obra'.padStart(7), '%Orig'.padStart(7),
     'Nível'.padStart(6), 'Direito'.padEnd(14), 'Territ'.padEnd(8),
     'Status'.padEnd(12), 'Origem?'].join(' │ ')
  )
  console.log('─'.repeat(120))
  for (const l of r.linhas) {
    const hasOrigem = l._tempOrigemKey ? '✓' : '—'
    console.log([
      l.nome_participante.padEnd(28),
      l.tipo_participante_codigo.padEnd(22),
      String(l.percentual_sobre_obra.toFixed(4)).padStart(7),
      (l.percentual_sobre_origem != null ? l.percentual_sobre_origem.toFixed(2) : '—').padStart(7),
      String(l.nivel_distribuicao).padStart(6),
      (ctx.tipos_direito.find(t => t.id === l.tipo_direito_id)?.codigo ?? '?').padEnd(14),
      l.territorio.padEnd(8),
      l.status_calculo.padEnd(12),
      hasOrigem,
    ].join(' │ '))
    if (l.pendencia) {
      console.log(`    ⚠️  ${l.pendencia.substring(0, 100)}...`)
    }
  }

  console.log('\n▶ SOMA DE PERCENTUAIS:')
  for (const [chave, soma] of Object.entries(r.soma_percentuais)) {
    const ok = Math.abs(soma - 100) <= 0.02
    console.log(`   ${chave.padEnd(30)} = ${soma.toFixed(4)}%  ${ok ? '✅' : '❌ DIVERGE DE 100%'}`)
  }

  if (r.pendencias.length > 0) {
    console.log('\n▶ PENDÊNCIAS:')
    r.pendencias.forEach(p => console.log(`   ⚠️  ${p.substring(0, 110)}...`))
  }
  if (r.avisos.length > 0) {
    console.log('\n▶ AVISOS:')
    r.avisos.forEach(a => console.log(`   ℹ️  ${a}`))
  }

  if (asserts && asserts.length > 0) {
    console.log('\n▶ VALIDAÇÕES:')
    for (const assert of asserts) {
      let passed = false
      try { passed = assert.fn() } catch {}
      if (passed) totalPassados++
      console.log(`   ${passed ? '✅' : '❌'} ${assert.desc}`)
    }
  }

  return r
}

// ════════════════════════════════════════════════════════════════════════════
// CENÁRIO 1 — Autor + Editora Administrada, sem Administradora
// ════════════════════════════════════════════════════════════════════════════
exibir(
  '1 autor + 1 editora administrada, sem administradora',
  contexto([
    link('link-001', 1, [
      titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75),
      titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25),
    ])
  ]),
  [
    { desc: 'Roberto com 75% sobre obra',
      fn: () => { const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25)])])); return r.linhas.find(l => l.nome_participante === 'Roberto Sampaio')?.percentual_sobre_obra === 75 } },
    { desc: 'Lojas Mil com 25% sobre obra',
      fn: () => { const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25)])])); return r.linhas.find(l => l.nome_participante === 'Lojas Mil')?.percentual_sobre_obra === 25 } },
    { desc: 'Sem pendências',
      fn: () => { const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25)])])); return r.pendencias.length === 0 } },
    { desc: 'Soma = 100%',
      fn: () => { const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25)])])); return Math.abs((r.soma_percentuais['digital|BR'] ?? 0) - 100) <= 0.02 } },
    { desc: 'Lojas Mil tipo_participante = editora_administrada',
      fn: () => { const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25)])])); return r.linhas.find(l => l.nome_participante === 'Lojas Mil')?.tipo_participante_codigo === 'editora_administrada' } },
  ]
)

// ════════════════════════════════════════════════════════════════════════════
// CENÁRIO 2 — Autor + E + AM com negócio 60/40
// ════════════════════════════════════════════════════════════════════════════
exibir(
  '1 autor + editora administrada + administradora (negócio 60/40)',
  contexto([
    link('link-001', 1, [
      titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75),
      titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25,
        { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }),
      titular('top-show', 'Top Show Music', 'AM', 0, 0, 0,
        { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' }),
    ])
  ], {
    negocios: [
      negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40),
    ],
  }),
  [
    { desc: 'Roberto = 75%',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.find(l => l.nome_participante === 'Roberto Sampaio')?.percentual_sobre_obra === 75
      }},
    { desc: 'Lojas Mil = 15% (25 × 60%)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.find(l => l.nome_participante === 'Lojas Mil')?.percentual_sobre_obra === 15
      }},
    { desc: 'Top Show = 10% (25 × 40%)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.find(l => l.nome_participante === 'Top Show Music')?.percentual_sobre_obra === 10
      }},
    { desc: 'Top Show nivel_distribuicao = 1',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.find(l => l.nome_participante === 'Top Show Music')?.nivel_distribuicao === 1
      }},
    { desc: 'Top Show aponta para Lojas Mil via _tempOrigemKey',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        const lojasKey = r.linhas.find(l => l.nome_participante === 'Lojas Mil')?._tempKey
        const topOrigemKey = r.linhas.find(l => l.nome_participante === 'Top Show Music')?._tempOrigemKey
        return !!lojasKey && lojasKey === topOrigemKey
      }},
    { desc: 'Top Show percentual_sobre_origem = 40',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.find(l => l.nome_participante === 'Top Show Music')?.percentual_sobre_origem === 40
      }},
    { desc: 'Soma = 100%', fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return Math.abs((r.soma_percentuais['digital|BR'] ?? 0) - 100) <= 0.02
      }},
  ]
)

// ════════════════════════════════════════════════════════════════════════════
// CENÁRIO 3 — AM identificada mas SEM negócio editorial
// ════════════════════════════════════════════════════════════════════════════
exibir(
  'AM identificada, sem negócio editorial → PENDENTE',
  contexto([
    link('link-001', 1, [
      titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75),
      titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25,
        { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }),
      titular('top-show', 'Top Show Music', 'AM', 0, 0, 0,
        { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' }),
    ])
  ], { negocios: [] }), // SEM negócio
  [
    { desc: 'Lojas Mil status = pendente',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [] }))
        return r.linhas.find(l => l.nome_participante === 'Lojas Mil')?.status_calculo === 'pendente'
      }},
    { desc: 'Top Show percentual_sobre_obra = 0',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [] }))
        return r.linhas.find(l => l.nome_participante === 'Top Show Music')?.percentual_sobre_obra === 0
      }},
    { desc: 'Roberto status = calculado (não afetado pela pendência)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [] }))
        return r.linhas.find(l => l.nome_participante === 'Roberto Sampaio')?.status_calculo === 'calculado'
      }},
    { desc: 'pendencias.length > 0',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { negocios: [] }))
        return r.pendencias.length > 0
      }},
  ]
)

// ════════════════════════════════════════════════════════════════════════════
// CENÁRIO 4 — Múltiplos links (1 controlado + 1 não controlado)
// ════════════════════════════════════════════════════════════════════════════

const linkControlado: ObraLinkInput = {
  id: 'link-001',
  obra_id: OBRA_ID,
  numero_link: 1,
  percentual_link: 50,
  tipo_link: 'controlado',
  controlado: true,
  titulares: [
    titular('roberto', 'Roberto Sampaio', 'CA', 37.5, 37.5, 37.5, { obra_link_id: 'link-001' }),
    titular('lojas-mil', 'Lojas Mil', 'E', 7.5, 7.5, 7.5,
      { obra_link_id: 'link-001', editora_id: 'ed-lojas-mil' }),
    titular('top-show', 'Top Show Music', 'AM', 5, 5, 5,
      { obra_link_id: 'link-001', editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' }),
  ],
}

const linkNaoControlado: ObraLinkInput = {
  id: 'link-002',
  obra_id: OBRA_ID,
  numero_link: 2,
  percentual_link: 50,
  tipo_link: 'nao_controlado',
  controlado: false,
  titulares: [
    titular('jose', 'José Lázaro', 'E', 50, 50, 50,
      { obra_link_id: 'link-002', editora_id: 'ed-jose', controlado: false }),
  ],
}

exibir(
  'Múltiplos links: Link 1 controlado (Roberto+LM+TS) + Link 2 não controlado (José)',
  contexto([linkControlado, linkNaoControlado], {
    negocios: [
      negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40),
    ],
  }),
  [
    { desc: 'Link 1: soma Roberto+Lojas+TopShow = 50%',
      fn: () => {
        const r = executarBridge(contexto([linkControlado, linkNaoControlado], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        const link1 = r.linhas.filter(l => l.obra_link_id === 'link-001')
        return Math.abs(link1.reduce((s, l) => s + l.percentual_sobre_obra, 0) - 50) <= 0.02
      }},
    { desc: 'Link 2: José com 50%',
      fn: () => {
        const r = executarBridge(contexto([linkControlado, linkNaoControlado], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.find(l => l.nome_participante === 'José Lázaro')?.percentual_sobre_obra === 50
      }},
    { desc: 'obra_link_origem_id de cada linha aponta para o link correto',
      fn: () => {
        const r = executarBridge(contexto([linkControlado, linkNaoControlado], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.every(l => l.obra_link_origem_id === l.obra_link_id)
      }},
  ]
)

// ════════════════════════════════════════════════════════════════════════════
// CENÁRIO 5 — Dois tipos de direito: digital e sincronização
// ════════════════════════════════════════════════════════════════════════════

exibir(
  'Dois tipos de direito: digital (60/40) e sync (70/30)',
  contexto([
    link('link-001', 1, [
      titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75),
      titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25,
        { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }),
      titular('top-show', 'Top Show Music', 'AM', 0, 0, 0,
        { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' }),
    ])
  ], {
    tipos: [TIPO_DIGITAL, TIPO_SYNC],
    negocios: [
      // negócio para digital: 60/40
      negocio('neg-digital', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40,
        { tipo_direito_id: 'td-digital' }),
      // negócio para sync: 70/30
      negocio('neg-sync', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 70, 30,
        { tipo_direito_id: 'td-sync' }),
    ],
  }),
  [
    { desc: 'Digital: Lojas Mil = 15%, Top Show = 10%',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { tipos: [TIPO_DIGITAL, TIPO_SYNC], negocios: [negocio('neg-digital', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40, { tipo_direito_id: 'td-digital' }), negocio('neg-sync', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 70, 30, { tipo_direito_id: 'td-sync' })] }))
        const lmD = r.linhas.find(l => l.nome_participante === 'Lojas Mil' && l.tipo_direito_id === 'td-digital')
        const tsD = r.linhas.find(l => l.nome_participante === 'Top Show Music' && l.tipo_direito_id === 'td-digital')
        return lmD?.percentual_sobre_obra === 15 && tsD?.percentual_sobre_obra === 10
      }},
    { desc: 'Sync: Lojas Mil = 17.5%, Top Show = 7.5%',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { tipos: [TIPO_DIGITAL, TIPO_SYNC], negocios: [negocio('neg-digital', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40, { tipo_direito_id: 'td-digital' }), negocio('neg-sync', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 70, 30, { tipo_direito_id: 'td-sync' })] }))
        const lmS = r.linhas.find(l => l.nome_participante === 'Lojas Mil' && l.tipo_direito_id === 'td-sync')
        const tsS = r.linhas.find(l => l.nome_participante === 'Top Show Music' && l.tipo_direito_id === 'td-sync')
        return lmS?.percentual_sobre_obra === 17.5 && tsS?.percentual_sobre_obra === 7.5
      }},
    { desc: 'Total de linhas = 6 (3 participantes × 2 tipos)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { tipos: [TIPO_DIGITAL, TIPO_SYNC], negocios: [negocio('neg-digital', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40, { tipo_direito_id: 'td-digital' }), negocio('neg-sync', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 70, 30, { tipo_direito_id: 'td-sync' })] }))
        return r.linhas.length === 6
      }},
  ]
)

// ════════════════════════════════════════════════════════════════════════════
// CENÁRIO 6 — Dois territórios: BR (60/40) e US (50/50)
// ════════════════════════════════════════════════════════════════════════════

exibir(
  'Dois territórios: BR 60/40 vs US 50/50',
  contexto([
    link('link-001', 1, [
      titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75),
      titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25,
        { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }),
      titular('top-show', 'Top Show Music', 'AM', 0, 0, 0,
        { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' }),
    ])
  ], {
    territorios: ['BR', 'US'],
    negocios: [
      negocio('neg-br', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40,
        { territorios: ['BR'] }),
      negocio('neg-us', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 50, 50,
        { territorios: ['US'] }),
    ],
  }),
  [
    { desc: 'BR: Lojas Mil = 15%, Top Show = 10%',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { territorios: ['BR', 'US'], negocios: [negocio('neg-br', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40, { territorios: ['BR'] }), negocio('neg-us', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 50, 50, { territorios: ['US'] })] }))
        const lmBR = r.linhas.find(l => l.nome_participante === 'Lojas Mil' && l.territorio === 'BR')
        const tsBR = r.linhas.find(l => l.nome_participante === 'Top Show Music' && l.territorio === 'BR')
        return lmBR?.percentual_sobre_obra === 15 && tsBR?.percentual_sobre_obra === 10
      }},
    { desc: 'US: Lojas Mil = 12.5%, Top Show = 12.5%',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { territorios: ['BR', 'US'], negocios: [negocio('neg-br', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40, { territorios: ['BR'] }), negocio('neg-us', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 50, 50, { territorios: ['US'] })] }))
        const lmUS = r.linhas.find(l => l.nome_participante === 'Lojas Mil' && l.territorio === 'US')
        const tsUS = r.linhas.find(l => l.nome_participante === 'Top Show Music' && l.territorio === 'US')
        return lmUS?.percentual_sobre_obra === 12.5 && tsUS?.percentual_sobre_obra === 12.5
      }},
    { desc: 'Negócio BR e US distintos (negocio_editorial_id diferente)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil', editora_administradora_id: 'ed-top-show' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-lojas-mil' })])], { territorios: ['BR', 'US'], negocios: [negocio('neg-br', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40, { territorios: ['BR'] }), negocio('neg-us', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 50, 50, { territorios: ['US'] })] }))
        const lmBR = r.linhas.find(l => l.nome_participante === 'Lojas Mil' && l.territorio === 'BR')
        const lmUS = r.linhas.find(l => l.nome_participante === 'Lojas Mil' && l.territorio === 'US')
        return lmBR?.negocio_editorial_id !== lmUS?.negocio_editorial_id
      }},
  ]
)

// ════════════════════════════════════════════════════════════════════════════
// CENÁRIO 7 — Cessão sobre parte autoral (20% para Empresa XYZ)
// ════════════════════════════════════════════════════════════════════════════

const cessao: CessaoInput = {
  id:                       'ces-001',
  titular_cedente_id:       'tit-roberto',
  titular_cessionario_id:   null,
  editora_cessionaria_id:   'ed-xyz',
  nome_cessionario:         'Empresa XYZ',
  tipo_cessionario:         'cessionario_pj',
  percentual_cessao:        20,
  tipo_direito_codigo:      null,
  territorio:               null,
  data_inicio:              '2024-01-01',
  data_fim:                 null,
  status:                   'vigente',
}

exibir(
  'Cessão: Roberto cedeu 20% da sua parte autoral para Empresa XYZ',
  contexto([
    link('link-001', 1, [
      titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75),
      titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25,
        { editora_id: 'ed-lojas-mil' }),
    ])
  ], {
    negocios: [
      negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40),
    ],
    cessoes: [cessao],
  }),
  [
    { desc: 'Roberto = 60% (75 × 80%)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)], cessoes: [cessao] }))
        return r.linhas.find(l => l.nome_participante === 'Roberto Sampaio')?.percentual_sobre_obra === 60
      }},
    { desc: 'Empresa XYZ = 15% (75 × 20%)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)], cessoes: [cessao] }))
        return r.linhas.find(l => l.nome_participante === 'Empresa XYZ')?.percentual_sobre_obra === 15
      }},
    { desc: 'Empresa XYZ nivel_distribuicao = 1',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)], cessoes: [cessao] }))
        return r.linhas.find(l => l.nome_participante === 'Empresa XYZ')?.nivel_distribuicao === 1
      }},
    { desc: 'Empresa XYZ aponta para Roberto via _tempOrigemKey',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)], cessoes: [cessao] }))
        const robertoKey = r.linhas.find(l => l.nome_participante === 'Roberto Sampaio')?._tempKey
        const xyzOrigemKey = r.linhas.find(l => l.nome_participante === 'Empresa XYZ')?._tempOrigemKey
        return !!robertoKey && robertoKey === xyzOrigemKey
      }},
    { desc: 'Empresa XYZ percentual_sobre_origem = 20',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)], cessoes: [cessao] }))
        return r.linhas.find(l => l.nome_participante === 'Empresa XYZ')?.percentual_sobre_origem === 20
      }},
    { desc: 'Soma = 100% (60+15+15+10)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 75, 75, 75), titular('lojas-mil', 'Lojas Mil', 'E', 25, 25, 25, { editora_id: 'ed-lojas-mil' })])], { negocios: [negocio('neg-001', 'ed-lojas-mil', 'Lojas Mil', 'ed-top-show', 'Top Show Music', 60, 40)], cessoes: [cessao] }))
        return Math.abs((r.soma_percentuais['digital|BR'] ?? 0) - 100) <= 0.02
      }},
  ]
)

// ════════════════════════════════════════════════════════════════════════════
// CENÁRIO 8 — Coedição: duas editoras com participação editorial própria
// ════════════════════════════════════════════════════════════════════════════
//
// Obra: CANÇÃO DA MANHÃ
// Link: Roberto (CA) 60% | P3 Editora (E) 25% | LMB Music (E) 15%
// Coedição: P3 e LMB têm participação própria — NÃO é administração.
// P3 tem negócio com Top Show (60/40). LMB não tem administradora.
// ════════════════════════════════════════════════════════════════════════════

exibir(
  'Coedição: P3 Editora (E, 25%) + LMB Music (E, 15%) — participação editorial própria',
  contexto([
    link('link-001', 1, [
      titular('roberto', 'Roberto Sampaio', 'CA', 60, 60, 60),
      titular('p3',      'P3 Editora',      'E', 25, 25, 25,
        { editora_id: 'ed-p3', editora_administradora_id: 'ed-top-show' }),
      titular('lmb',     'LMB Music',        'E', 15, 15, 15,
        { editora_id: 'ed-lmb' }),
      // AM de P3 (não aparece com % direto no CWR — gerado pelo negócio)
      titular('top-show', 'Top Show Music', 'AM', 0, 0, 0,
        { editora_id: 'ed-top-show', editora_original_id: 'ed-p3' }),
    ])
  ], {
    negocios: [
      // P3 tem negócio com Top Show: 60/40
      negocio('neg-p3', 'ed-p3', 'P3 Editora', 'ed-top-show', 'Top Show Music', 60, 40),
      // LMB não tem administradora (sem negócio)
    ],
  }),
  [
    { desc: 'Roberto = 60%',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 60, 60, 60), titular('p3', 'P3 Editora', 'E', 25, 25, 25, { editora_id: 'ed-p3', editora_administradora_id: 'ed-top-show' }), titular('lmb', 'LMB Music', 'E', 15, 15, 15, { editora_id: 'ed-lmb' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-p3' })])], { negocios: [negocio('neg-p3', 'ed-p3', 'P3 Editora', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.find(l => l.nome_participante === 'Roberto Sampaio')?.percentual_sobre_obra === 60
      }},
    { desc: 'P3 Editora = 15% (25 × 60%)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 60, 60, 60), titular('p3', 'P3 Editora', 'E', 25, 25, 25, { editora_id: 'ed-p3', editora_administradora_id: 'ed-top-show' }), titular('lmb', 'LMB Music', 'E', 15, 15, 15, { editora_id: 'ed-lmb' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-p3' })])], { negocios: [negocio('neg-p3', 'ed-p3', 'P3 Editora', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.find(l => l.nome_participante === 'P3 Editora')?.percentual_sobre_obra === 15
      }},
    { desc: 'Top Show (de P3) = 10% (25 × 40%)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 60, 60, 60), titular('p3', 'P3 Editora', 'E', 25, 25, 25, { editora_id: 'ed-p3', editora_administradora_id: 'ed-top-show' }), titular('lmb', 'LMB Music', 'E', 15, 15, 15, { editora_id: 'ed-lmb' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-p3' })])], { negocios: [negocio('neg-p3', 'ed-p3', 'P3 Editora', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.find(l => l.nome_participante === 'Top Show Music')?.percentual_sobre_obra === 10
      }},
    { desc: 'LMB Music = 15% (sem administradora — Cenário A)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 60, 60, 60), titular('p3', 'P3 Editora', 'E', 25, 25, 25, { editora_id: 'ed-p3', editora_administradora_id: 'ed-top-show' }), titular('lmb', 'LMB Music', 'E', 15, 15, 15, { editora_id: 'ed-lmb' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-p3' })])], { negocios: [negocio('neg-p3', 'ed-p3', 'P3 Editora', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        const lmb = r.linhas.find(l => l.nome_participante === 'LMB Music')
        return lmb?.percentual_sobre_obra === 15 && lmb.status_calculo === 'calculado'
      }},
    { desc: 'LMB tipo = editora_administrada (coedição, não administração)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 60, 60, 60), titular('p3', 'P3 Editora', 'E', 25, 25, 25, { editora_id: 'ed-p3', editora_administradora_id: 'ed-top-show' }), titular('lmb', 'LMB Music', 'E', 15, 15, 15, { editora_id: 'ed-lmb' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-p3' })])], { negocios: [negocio('neg-p3', 'ed-p3', 'P3 Editora', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.linhas.find(l => l.nome_participante === 'LMB Music')?.tipo_participante_codigo === 'editora_administrada'
      }},
    { desc: 'Soma = 100% (60+15+10+15)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 60, 60, 60), titular('p3', 'P3 Editora', 'E', 25, 25, 25, { editora_id: 'ed-p3', editora_administradora_id: 'ed-top-show' }), titular('lmb', 'LMB Music', 'E', 15, 15, 15, { editora_id: 'ed-lmb' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-p3' })])], { negocios: [negocio('neg-p3', 'ed-p3', 'P3 Editora', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return Math.abs((r.soma_percentuais['digital|BR'] ?? 0) - 100) <= 0.02
      }},
    { desc: 'Sem pendências (LMB sem AM não gera pendência — Cenário A)',
      fn: () => {
        const r = executarBridge(contexto([link('link-001', 1, [titular('roberto', 'Roberto Sampaio', 'CA', 60, 60, 60), titular('p3', 'P3 Editora', 'E', 25, 25, 25, { editora_id: 'ed-p3', editora_administradora_id: 'ed-top-show' }), titular('lmb', 'LMB Music', 'E', 15, 15, 15, { editora_id: 'ed-lmb' }), titular('top-show', 'Top Show Music', 'AM', 0, 0, 0, { editora_id: 'ed-top-show', editora_original_id: 'ed-p3' })])], { negocios: [negocio('neg-p3', 'ed-p3', 'P3 Editora', 'ed-top-show', 'Top Show Music', 60, 40)] }))
        return r.pendencias.length === 0
      }},
  ]
)

// ════════════════════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(72))
console.log(`RESULTADO: ${totalPassados} / ${/* conta asserts */ 0 + 6 + 4 + 3 + 3 + 3 + 6 + 7} validações passaram`)
console.log(`Testes executados: ${totalTestes} cenários`)
console.log('═'.repeat(72))
