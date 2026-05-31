/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MÓDULO SOCINPRO / ECAD — Direito de Execução Pública
 *  Sync Mood — Sistema de Gestão de Direitos Autorais
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  REGRA:
 *  Valores recebidos via ECAD/sociedades arrecadadoras NÃO transitam
 *  pelo Conta Corrente Obra. O ECAD paga às sociedades, que repassam
 *  diretamente aos titulares filiados.
 *
 *  No caso da TOP SHOW MUSIC: recebimentos via SOCINPRO.
 *
 *  O sistema IMPORTA os demonstrativos para:
 *    1. BI Estratégico — obras mais executadas / rendimento por execução
 *    2. Financeiro      — composição de rendimentos por direito
 *    3. Prestação de contas — informativo por obra e por titular
 *    4. NÃO gera distribuição no CC Obra (fluxo ECAD é externo)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type SociedadeECAD =
  | 'SOCINPRO'
  | 'ABRAMUS'
  | 'AMAR'
  | 'ASSIM'
  | 'SBACEM'
  | 'SICAM'
  | 'UBC'
  | 'OUTRA'

export type TipoExecucaoPublica =
  | 'RADIO'
  | 'TV_ABERTA'
  | 'TV_FECHADA'
  | 'SHOW_AO_VIVO'
  | 'ESTABELECIMENTO'
  | 'STREAMING_EXECUCAO'
  | 'SONORIZACAO_AMBIENTE'
  | 'OUTROS'

export const TIPO_EXECUCAO_LABELS: Record<TipoExecucaoPublica, string> = {
  RADIO:                 'Rádio',
  TV_ABERTA:             'TV Aberta',
  TV_FECHADA:            'TV Fechada / Pay TV',
  SHOW_AO_VIVO:          'Show ao Vivo',
  ESTABELECIMENTO:       'Estabelecimento Comercial',
  STREAMING_EXECUCAO:    'Streaming de Execução',
  SONORIZACAO_AMBIENTE:  'Sonorização Ambiente',
  OUTROS:                'Outros',
}

/** Uma linha do demonstrativo SOCINPRO/ECAD */
export interface LinhaSocinpro {
  id: string
  obra_titulo: string
  obra_codigo_ecad?: string      // código interno ECAD da obra
  iswc?: string                  // ex: T-012.345.678-9
  titular_nome: string
  titular_codigo_ecad?: string
  sociedade: SociedadeECAD
  tipo_execucao: TipoExecucaoPublica
  competencia: string            // ex: '2025-01' (YYYY-MM)
  num_execucoes: number
  valor_bruto: number            // R$
  desconto_admin?: number        // R$ — taxa administrativa da sociedade
  valor_liquido: number          // R$ = bruto - desconto
  moeda: string                  // geralmente 'BRL'
  data_pagamento?: string        // YYYY-MM-DD
  observacao?: string
}

/** Cabeçalho de um lote de importação */
export interface LoteSocinpro {
  id: string
  nome_arquivo: string
  sociedade: SociedadeECAD
  competencia: string            // YYYY-MM
  data_importacao: string        // ISO
  importado_por: string
  total_linhas: number
  total_obras: number
  total_titulares: number
  valor_bruto_total: number
  valor_liquido_total: number
  status: 'pendente' | 'conciliado' | 'divergencia'
  linhas: LinhaSocinpro[]
}

// ── Persistência ────────────────────────────────────────────────────────────

const CHAVE_LOTES = 'sync_socinpro_lotes_v1'

export function salvarLote(lote: LoteSocinpro): void {
  const lotes = obterLotes()
  const idx = lotes.findIndex(l => l.id === lote.id)
  if (idx >= 0) lotes[idx] = lote
  else lotes.unshift(lote)
  localStorage.setItem(CHAVE_LOTES, JSON.stringify(lotes))
}

export function obterLotes(): LoteSocinpro[] {
  try {
    const raw = localStorage.getItem(CHAVE_LOTES)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function obterLote(id: string): LoteSocinpro | undefined {
  return obterLotes().find(l => l.id === id)
}

export function excluirLote(id: string): void {
  const lotes = obterLotes().filter(l => l.id !== id)
  localStorage.setItem(CHAVE_LOTES, JSON.stringify(lotes))
}

// ── Agregações para BI ──────────────────────────────────────────────────────

export interface RankingObraECAD {
  obra_titulo: string
  iswc?: string
  total_execucoes: number
  total_valor_liquido: number
  competencias: string[]
  tipos: TipoExecucaoPublica[]
}

export interface RankingTitularECAD {
  titular_nome: string
  sociedade: SociedadeECAD
  total_valor_liquido: number
  total_execucoes: number
}

export interface ResumoPorCompetencia {
  competencia: string
  total_obras: number
  total_execucoes: number
  valor_bruto: number
  valor_liquido: number
}

/** Agrega todas as linhas importadas para alimentar o BI */
export function calcularBIExecucaoPublica(): {
  ranking_obras: RankingObraECAD[]
  ranking_titulares: RankingTitularECAD[]
  por_competencia: ResumoPorCompetencia[]
  por_tipo_execucao: { tipo: TipoExecucaoPublica; label: string; valor: number; execucoes: number }[]
  por_sociedade: { sociedade: SociedadeECAD; valor: number }[]
  total_geral_liquido: number
  total_geral_execucoes: number
} {
  const lotes = obterLotes()
  const todasLinhas = lotes.flatMap(l => l.linhas)

  // Ranking obras
  const mapaObras = new Map<string, RankingObraECAD>()
  for (const linha of todasLinhas) {
    const key = linha.obra_titulo
    const prev = mapaObras.get(key) ?? {
      obra_titulo: linha.obra_titulo,
      iswc: linha.iswc,
      total_execucoes: 0,
      total_valor_liquido: 0,
      competencias: [],
      tipos: [],
    }
    mapaObras.set(key, {
      ...prev,
      total_execucoes: prev.total_execucoes + linha.num_execucoes,
      total_valor_liquido: prev.total_valor_liquido + linha.valor_liquido,
      competencias: Array.from(new Set([...prev.competencias, linha.competencia])),
      tipos: Array.from(new Set([...prev.tipos, linha.tipo_execucao])) as TipoExecucaoPublica[],
    })
  }
  const ranking_obras = Array.from(mapaObras.values())
    .sort((a, b) => b.total_valor_liquido - a.total_valor_liquido)

  // Ranking titulares
  const mapaTitulares = new Map<string, RankingTitularECAD>()
  for (const linha of todasLinhas) {
    const key = `${linha.titular_nome}__${linha.sociedade}`
    const prev = mapaTitulares.get(key) ?? {
      titular_nome: linha.titular_nome,
      sociedade: linha.sociedade,
      total_valor_liquido: 0,
      total_execucoes: 0,
    }
    mapaTitulares.set(key, {
      ...prev,
      total_valor_liquido: prev.total_valor_liquido + linha.valor_liquido,
      total_execucoes: prev.total_execucoes + linha.num_execucoes,
    })
  }
  const ranking_titulares = Array.from(mapaTitulares.values())
    .sort((a, b) => b.total_valor_liquido - a.total_valor_liquido)

  // Por competência
  const mapaComp = new Map<string, ResumoPorCompetencia>()
  for (const linha of todasLinhas) {
    const prev = mapaComp.get(linha.competencia) ?? {
      competencia: linha.competencia,
      total_obras: 0,
      total_execucoes: 0,
      valor_bruto: 0,
      valor_liquido: 0,
    }
    mapaComp.set(linha.competencia, {
      competencia: linha.competencia,
      total_obras: prev.total_obras + 1,
      total_execucoes: prev.total_execucoes + linha.num_execucoes,
      valor_bruto: prev.valor_bruto + linha.valor_bruto,
      valor_liquido: prev.valor_liquido + linha.valor_liquido,
    })
  }
  const por_competencia = Array.from(mapaComp.values())
    .sort((a, b) => b.competencia.localeCompare(a.competencia))

  // Por tipo de execução
  const mapaTipo = new Map<string, { valor: number; execucoes: number }>()
  for (const linha of todasLinhas) {
    const prev = mapaTipo.get(linha.tipo_execucao) ?? { valor: 0, execucoes: 0 }
    mapaTipo.set(linha.tipo_execucao, {
      valor: prev.valor + linha.valor_liquido,
      execucoes: prev.execucoes + linha.num_execucoes,
    })
  }
  const por_tipo_execucao = Array.from(mapaTipo.entries()).map(([tipo, v]) => ({
    tipo: tipo as TipoExecucaoPublica,
    label: TIPO_EXECUCAO_LABELS[tipo as TipoExecucaoPublica],
    valor: v.valor,
    execucoes: v.execucoes,
  })).sort((a, b) => b.valor - a.valor)

  // Por sociedade
  const mapaSoc = new Map<string, number>()
  for (const linha of todasLinhas) {
    mapaSoc.set(linha.sociedade, (mapaSoc.get(linha.sociedade) ?? 0) + linha.valor_liquido)
  }
  const por_sociedade = Array.from(mapaSoc.entries())
    .map(([sociedade, valor]) => ({ sociedade: sociedade as SociedadeECAD, valor }))
    .sort((a, b) => b.valor - a.valor)

  const total_geral_liquido = todasLinhas.reduce((s, l) => s + l.valor_liquido, 0)
  const total_geral_execucoes = todasLinhas.reduce((s, l) => s + l.num_execucoes, 0)

  return {
    ranking_obras,
    ranking_titulares,
    por_competencia,
    por_tipo_execucao,
    por_sociedade,
    total_geral_liquido,
    total_geral_execucoes,
  }
}

// ── Mock para desenvolvimento ────────────────────────────────────────────────

export function gerarMockLinhas(competencia: string): LinhaSocinpro[] {
  const obras = [
    { titulo: 'SOL DE JANEIRO', iswc: 'T-011.234.567-8', cod: 'ECAD-001' },
    { titulo: 'AMOR DE BAR', iswc: 'T-011.234.568-6', cod: 'ECAD-002' },
    { titulo: 'NOITE ESTRELADA', iswc: 'T-011.234.569-4', cod: 'ECAD-003' },
    { titulo: 'CORAÇÃO PARTIDO', iswc: 'T-011.234.570-8', cod: 'ECAD-004' },
    { titulo: 'SAUDADE DE MINAS', iswc: 'T-011.234.571-6', cod: 'ECAD-005' },
    { titulo: 'ESPELHO', iswc: 'T-011.234.572-4', cod: 'ECAD-006' },
    { titulo: 'CHUVA DE VERÃO', iswc: 'T-011.234.573-2', cod: 'ECAD-007' },
    { titulo: 'MINHA VIDA', iswc: 'T-011.234.574-0', cod: 'ECAD-008' },
  ]
  const tipos: TipoExecucaoPublica[] = ['RADIO', 'TV_ABERTA', 'TV_FECHADA', 'SHOW_AO_VIVO', 'ESTABELECIMENTO']

  return obras.map((obra, i) => {
    const numExec = Math.floor(Math.random() * 9000) + 1000
    const bruto = parseFloat((Math.random() * 2000 + 200).toFixed(2))
    const desconto = parseFloat((bruto * 0.05).toFixed(2))
    return {
      id: `mock-${competencia}-${i}`,
      obra_titulo: obra.titulo,
      iswc: obra.iswc,
      obra_codigo_ecad: obra.cod,
      titular_nome: 'NAUILAN BARBOSA SILVA',
      titular_codigo_ecad: 'SOC-9999',
      sociedade: 'SOCINPRO',
      tipo_execucao: tipos[i % tipos.length],
      competencia,
      num_execucoes: numExec,
      valor_bruto: bruto,
      desconto_admin: desconto,
      valor_liquido: parseFloat((bruto - desconto).toFixed(2)),
      moeda: 'BRL',
      data_pagamento: `${competencia}-15`,
    }
  })
}
