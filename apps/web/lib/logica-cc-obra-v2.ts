/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  CONTA CORRENTE DE OBRA v2 — Sync Mood
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  FONTE DE VERDADE: obras_analitico (gerada pela bridge-analitico.ts)
 *
 *  Esta lib NÃO lê contratos, NÃO lê CWR, NÃO lê titulares diretamente.
 *  Ela apenas lê o resultado já calculado da bridge e gera os movimentos
 *  financeiros na tabela cc_obras_movimentos.
 *
 *  REGRA DE INCLUSÃO:
 *    ✓  status_calculo = 'calculado'  →  gera movimento financeiro
 *    ✗  status_calculo = 'pendente'   →  retém no CC Obra (gera movimento retido)
 *    ✗  Fontes ECAD/SOCINPRO          →  apenas registro informativo (sem CC Obra)
 *
 *  RASTREABILIDADE completa em cada movimento:
 *    tipo_direito_id · territorio · competencia_inicio/fim
 *    fonte_pagadora_codigo · versao_calculo · analitico_linha_id
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { isReceitaECAD } from './logica-cc-obra'

// ── Fontes ECAD que NÃO entram no CC Obra ────────────────────────────────────
export { isReceitaECAD, FONTES_EXCLUIDAS_CC_OBRA } from './logica-cc-obra'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface RecebimentoInput {
  id: string                 // id do recebimento no banco
  obra_id: string
  tenant_id: string
  valor_bruto: number        // valor recebido para esta obra
  tipo_direito_id?: string   // FK para tipos_direito (pode ser null = padrão)
  territorio?: string        // ex: 'BR', 'US', 'MUNDIAL'
  competencia_inicio: string // DATE ISO — início da competência
  competencia_fim: string    // DATE ISO — fim da competência
  fonte_pagadora_codigo: string  // ex: 'SPOTIFY', 'YOUTUBE', 'WARNER'
  fonte_pagadora_tipo?: string   // ex: 'dsp', 'sociedade', 'cliente_direto'
  moeda?: string             // ex: 'BRL', 'USD'
  cotacao_brl?: number       // taxa de câmbio se moeda != BRL
}

export interface MovimentoCC {
  tenant_id: string
  obra_id: string
  recebimento_id: string
  analitico_linha_id: string       // FK para obras_analitico.id
  titular_id: string | null
  editora_id: string | null
  nome_participante: string
  tipo_participante_codigo: string
  percentual_sobre_obra: number
  valor_bruto_participante: number  // valor_bruto × percentual / 100
  valor_liquido_participante: number // mesmo que bruto por ora (IRPF no CC Titular)
  tipo_direito_id: string | null
  territorio: string | null
  competencia_inicio: string
  competencia_fim: string
  fonte_pagadora_codigo: string
  fonte_pagadora_tipo: string | null
  status_movimento: 'distribuido' | 'retido_pendencia'
  pendencia: string | null
  versao_calculo: number
  calculado_por: string
}

export interface ResultadoCCObra {
  obra_id: string
  recebimento_id: string
  valor_bruto: number
  total_distribuido: number
  total_retido: number
  movimentos: MovimentoCC[]
  alertas: string[]
  fonte_excluida: boolean      // true quando é ECAD — não processa CC Obra
}

// ── Helper ────────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Ajuste de centavos: garante que a soma dos valores distribuídos
 * seja exatamente igual ao valor_bruto (regra 0.04 → menor, 0.05+ → maior).
 */
function ajustarCentavos(valores: number[], total: number): number[] {
  const soma = valores.reduce((a, b) => a + b, 0)
  const diff = round2(total - soma)
  if (diff === 0 || valores.length === 0) return valores
  // Aplica a diferença na maior participação (menor impacto relativo)
  const idx = valores.indexOf(Math.max(...valores))
  const copia = [...valores]
  copia[idx] = round2(copia[idx] + diff)
  return copia
}

// ── Função principal ──────────────────────────────────────────────────────────

/**
 * Processa um recebimento para uma obra:
 *  1. Verifica se é fonte ECAD (se sim, retorna registro informativo)
 *  2. Lê as linhas vigentes de obras_analitico para a obra/tipo_direito/territorio
 *  3. Para linhas 'calculado': gera movimento financeiro distribuído
 *  4. Para linhas 'pendente': gera movimento retido com flag de pendência
 *  5. Grava tudo em cc_obras_movimentos
 *  6. Retorna resultado completo
 */
export async function processarRecebimentoCCObra(
  sb: SupabaseClient,
  recebimento: RecebimentoInput,
): Promise<ResultadoCCObra> {

  const resultado: ResultadoCCObra = {
    obra_id:          recebimento.obra_id,
    recebimento_id:   recebimento.id,
    valor_bruto:      recebimento.valor_bruto,
    total_distribuido: 0,
    total_retido:     0,
    movimentos:       [],
    alertas:          [],
    fonte_excluida:   false,
  }

  // ── 1. Guarda ECAD ─────────────────────────────────────────────────────────
  if (isReceitaECAD(recebimento.fonte_pagadora_codigo)) {
    resultado.fonte_excluida = true
    resultado.alertas.push(
      `Fonte ${recebimento.fonte_pagadora_codigo} é ECAD/sociedade arrecadadora. ` +
      `O ECAD paga os titulares diretamente. Registro apenas informativo — não processa CC Obra.`
    )
    return resultado
  }

  // ── 2. Buscar linhas vigentes do analítico ─────────────────────────────────
  let query = sb
    .from('obras_analitico')
    .select('*')
    .eq('tenant_id', recebimento.tenant_id)
    .eq('obra_id',   recebimento.obra_id)
    .is('invalidado_em', null)   // apenas versão atual
    .order('nivel_distribuicao', { ascending: true })

  // Filtrar por tipo de direito se informado
  if (recebimento.tipo_direito_id) {
    query = query.eq('tipo_direito_id', recebimento.tipo_direito_id)
  }

  // Filtrar por território (aceita 'MUNDIAL' ou correspondência exata)
  if (recebimento.territorio && recebimento.territorio !== 'MUNDIAL') {
    query = query.or(`territorio.eq.${recebimento.territorio},territorio.eq.MUNDIAL`)
  }

  const { data: linhas, error } = await query

  if (error) throw new Error(`Erro ao buscar obras_analitico: ${error.message}`)

  if (!linhas || linhas.length === 0) {
    resultado.alertas.push(
      `Nenhuma linha de analítico encontrada para a obra ${recebimento.obra_id}. ` +
      `Execute a bridge primeiro (POST /api/obras/${recebimento.obra_id}/analitico).`
    )
    return resultado
  }

  // ── 3. Separar calculadas × pendentes ─────────────────────────────────────
  const calculadas = linhas.filter(l => l.status_calculo === 'calculado')
  const pendentes  = linhas.filter(l => l.status_calculo === 'pendente')

  // Percentual total calculado (pode ser < 100% se há pendentes)
  const pctCalculado = calculadas.reduce((s: number, l: Record<string, unknown>) => s + (Number(l.percentual_sobre_obra) || 0), 0)
  const pctPendente  = pendentes.reduce((s: number, l: Record<string, unknown>) => s + (Number(l.percentual_sobre_obra) || 0), 0)

  // ── 4. Calcular valores ────────────────────────────────────────────────────
  const valoresCalculados = calculadas.map((l: Record<string, unknown>) =>
    round2(recebimento.valor_bruto * (Number(l.percentual_sobre_obra) || 0) / 100)
  )
  // Ajustar centavos para fechar o total distribuível
  const valorDistribuivel = round2(recebimento.valor_bruto * pctCalculado / 100)
  const valoresAjustados  = ajustarCentavos(valoresCalculados, valorDistribuivel)

  const versaoCalculo = linhas[0]?.versao_calculo ?? 1

  // ── 5. Montar movimentos distribuídos ─────────────────────────────────────
  calculadas.forEach((l: Record<string, unknown>, idx: number) => {
    const valor = valoresAjustados[idx]
    resultado.movimentos.push({
      tenant_id:                    recebimento.tenant_id,
      obra_id:                      recebimento.obra_id,
      recebimento_id:               recebimento.id,
      analitico_linha_id:           l.id as string,
      titular_id:                   (l.titular_id as string) ?? null,
      editora_id:                   (l.editora_id as string) ?? null,
      nome_participante:            l.nome_participante as string,
      tipo_participante_codigo:     l.tipo_participante_codigo as string,
      percentual_sobre_obra:        Number(l.percentual_sobre_obra),
      valor_bruto_participante:     valor,
      valor_liquido_participante:   valor,  // IRPF é calculado no CC Titular
      tipo_direito_id:              (l.tipo_direito_id as string) ?? recebimento.tipo_direito_id ?? null,
      territorio:                   (l.territorio as string) ?? recebimento.territorio ?? null,
      competencia_inicio:           recebimento.competencia_inicio,
      competencia_fim:              recebimento.competencia_fim,
      fonte_pagadora_codigo:        recebimento.fonte_pagadora_codigo,
      fonte_pagadora_tipo:          recebimento.fonte_pagadora_tipo ?? null,
      status_movimento:             'distribuido',
      pendencia:                    null,
      versao_calculo:               versaoCalculo,
      calculado_por:                'cc_obra_v2',
    })
    resultado.total_distribuido = round2(resultado.total_distribuido + valor)
  })

  // ── 6. Montar movimentos retidos (pendentes) ───────────────────────────────
  pendentes.forEach((l: Record<string, unknown>) => {
    const valorRetido = round2(recebimento.valor_bruto * (Number(l.percentual_sobre_obra) || 0) / 100)
    resultado.movimentos.push({
      tenant_id:                    recebimento.tenant_id,
      obra_id:                      recebimento.obra_id,
      recebimento_id:               recebimento.id,
      analitico_linha_id:           l.id as string,
      titular_id:                   (l.titular_id as string) ?? null,
      editora_id:                   (l.editora_id as string) ?? null,
      nome_participante:            l.nome_participante as string,
      tipo_participante_codigo:     l.tipo_participante_codigo as string,
      percentual_sobre_obra:        Number(l.percentual_sobre_obra),
      valor_bruto_participante:     valorRetido,
      valor_liquido_participante:   0,   // retido — não paga ainda
      tipo_direito_id:              (l.tipo_direito_id as string) ?? recebimento.tipo_direito_id ?? null,
      territorio:                   (l.territorio as string) ?? recebimento.territorio ?? null,
      competencia_inicio:           recebimento.competencia_inicio,
      competencia_fim:              recebimento.competencia_fim,
      fonte_pagadora_codigo:        recebimento.fonte_pagadora_codigo,
      fonte_pagadora_tipo:          recebimento.fonte_pagadora_tipo ?? null,
      status_movimento:             'retido_pendencia',
      pendencia:                    (l.pendencia as string) ?? 'Regra editorial pendente',
      versao_calculo:               versaoCalculo,
      calculado_por:                'cc_obra_v2',
    })
    resultado.total_retido = round2(resultado.total_retido + valorRetido)
  })

  // Alerta se há retenção
  if (resultado.total_retido > 0) {
    resultado.alertas.push(
      `R$ ${resultado.total_retido.toFixed(2)} retidos por pendência de regra editorial ` +
      `(${pctPendente.toFixed(4)}% da obra). ` +
      `Cadastre o negócio entre editoras para liberar.`
    )
  }

  // ── 7. Gravar em cc_obras_movimentos ──────────────────────────────────────
  if (resultado.movimentos.length > 0) {
    // Deletar movimentos anteriores para este recebimento (idempotência)
    await sb
      .from('cc_obras_movimentos')
      .delete()
      .eq('recebimento_id', recebimento.id)
      .eq('obra_id', recebimento.obra_id)

    // Inserir novos movimentos em lotes de 50
    const LOTE = 50
    for (let i = 0; i < resultado.movimentos.length; i += LOTE) {
      const lote = resultado.movimentos.slice(i, i + LOTE)
      const { error: insErr } = await sb.from('cc_obras_movimentos').insert(lote)
      if (insErr) throw new Error(`Erro ao gravar cc_obras_movimentos: ${insErr.message}`)
    }
  }

  return resultado
}

/**
 * Busca o extrato do CC Obra de uma obra — todos os movimentos vigentes.
 */
export async function buscarExtratoCCObra(
  sb: SupabaseClient,
  tenantId: string,
  obraId: string,
  filtros?: {
    tipo_direito_id?: string
    territorio?: string
    competencia_inicio?: string
    competencia_fim?: string
    status_movimento?: 'distribuido' | 'retido_pendencia'
  }
): Promise<{
  movimentos: Record<string, unknown>[]
  total_distribuido: number
  total_retido: number
  saldo_pendente: number
}> {
  let query = sb
    .from('cc_obras_movimentos')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('obra_id', obraId)
    .order('created_at', { ascending: false })

  if (filtros?.tipo_direito_id)  query = query.eq('tipo_direito_id', filtros.tipo_direito_id)
  if (filtros?.territorio)       query = query.eq('territorio', filtros.territorio)
  if (filtros?.status_movimento) query = query.eq('status_movimento', filtros.status_movimento)
  if (filtros?.competencia_inicio) query = query.gte('competencia_inicio', filtros.competencia_inicio)
  if (filtros?.competencia_fim)    query = query.lte('competencia_fim', filtros.competencia_fim)

  const { data, error } = await query
  if (error) throw new Error(`Erro ao buscar CC Obra: ${error.message}`)

  const movimentos = data ?? []
  const total_distribuido = movimentos
    .filter((m: Record<string, unknown>) => m.status_movimento === 'distribuido')
    .reduce((s: number, m: Record<string, unknown>) => s + Number(m.valor_bruto_participante), 0)
  const total_retido = movimentos
    .filter((m: Record<string, unknown>) => m.status_movimento === 'retido_pendencia')
    .reduce((s: number, m: Record<string, unknown>) => s + Number(m.valor_bruto_participante), 0)

  return {
    movimentos,
    total_distribuido: round2(total_distribuido),
    total_retido:      round2(total_retido),
    saldo_pendente:    round2(total_retido),
  }
}

// ── Cliente admin (para uso em API routes) ────────────────────────────────────
export function getAdminClientForCC(): SupabaseClient {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) throw new Error('Supabase não configurado (service_role ausente)')
  return createClient(url, key, { auth: { persistSession: false } })
}
