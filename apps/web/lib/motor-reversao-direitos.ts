/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MOTOR DE REVERSÃO AUTOMÁTICA DE DIREITOS
 *  Sync Mood — Sistema de Gestão de Direitos Autorais
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  REGRA:
 *  Quando a data_termino de um contrato é atingida, NO DIA SUBSEQUENTE
 *  todos os direitos e percentuais negociados retornam automaticamente
 *  ao cedente (autor ou editora original).
 *
 *  Exemplo:
 *    Contrato LPJ001 · data_termino: 10/06/2026
 *    Dia 10/06/2026 → contrato ainda vigente (último dia)
 *    Dia 11/06/2026 → sistema executa reversão automática:
 *      - status do contrato → ENCERRADO
 *      - % que ia para o licenciante → volta para o autor
 *      - CC Obra recalcula destinatários
 *      - CC Titular do licenciante → bloqueado para novos lançamentos desta obra
 *      - Histórico registra a reversão com data/hora
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface RegistroReversao {
  contrato_id: string
  contrato_codigo: string
  contrato_nome: string
  tipo_contrato: string
  data_termino: string
  data_reversao: string   // dia subsequente ao término
  cedente_id: string
  cedente_nome: string
  cessionario_nome: string
  percentual_revertido: number
  direitos_revertidos: string[]
  executado_em: string    // timestamp ISO
}

const CHAVE_REVERSOES = 'sync_reversoes_direitos'
const CHAVE_ULTIMA_EXECUCAO = 'sync_reversao_ultima_execucao'

/**
 * Verifica se hoje é o dia subsequente ao término do contrato.
 * O contrato ainda é válido no dia do término (data_termino inclusive).
 * A reversão ocorre no dia SEGUINTE.
 */
export function deveReverter(dataTermino: string): boolean {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const termino = new Date(dataTermino + 'T00:00:00')
  termino.setHours(0, 0, 0, 0)

  // Reversão ocorre quando hoje > data_termino (dia subsequente ou depois)
  return hoje > termino
}

/**
 * Executa a reversão automática de todos os contratos vencidos.
 * Roda uma vez por dia (verifica pela chave de última execução).
 * Retorna lista de reversões executadas nesta rodada.
 */
export function executarReversaoAutomatica(): RegistroReversao[] {
  const hoje = new Date().toISOString().split('T')[0]
  const ultimaExecucao = localStorage.getItem(CHAVE_ULTIMA_EXECUCAO)

  // Já executou hoje → pula
  if (ultimaExecucao === hoje) return []

  const reversoes: RegistroReversao[] = []

  try {
    const raw = localStorage.getItem('sync_contratos_tipo_v2')
    if (!raw) {
      localStorage.setItem(CHAVE_ULTIMA_EXECUCAO, hoje)
      return []
    }

    const contratos = JSON.parse(raw)
    const tiposComCessionario = [
      'licenciamento_licenciante_pj',
      'licenciamento_licenciante_pf',
      'cessao_cessionario_pj',
      'cessao_cessionario_pf',
      'licenciamento',
      'cessao_total',
    ]

    let houveMudanca = false

    const contratosAtualizados = contratos.map((c: any) => {
      // Só processa contratos ativos, com data_termino, e dos tipos que alteram recebedor
      if (
        !c.ativo ||
        !c.data_termino ||
        !tiposComCessionario.includes(c.tipo) ||
        c.status_vigencia === 'encerrado'
      ) return c

      if (!deveReverter(c.data_termino)) return c

      // ── Executa reversão ──────────────────────────────────────
      const direitosRevertidos = c.direitos
        ?.filter((d: any) => d.ativo)
        .map((d: any) => d.codigo) ?? []

      const registro: RegistroReversao = {
        contrato_id: c.id,
        contrato_codigo: c.codigo,
        contrato_nome: c.nome,
        tipo_contrato: c.tipo,
        data_termino: c.data_termino,
        data_reversao: hoje,
        cedente_id: '',
        cedente_nome: 'CEDENTE (AUTOR/EDITORA)',
        cessionario_nome: c.cessionario_nome || 'CESSIONÁRIO/LICENCIANTE',
        percentual_revertido: c.pct_autor_br ?? 0,
        direitos_revertidos: direitosRevertidos,
        executado_em: new Date().toISOString(),
      }

      reversoes.push(registro)
      houveMudanca = true

      // Marca o contrato como encerrado e reverte percentuais
      return {
        ...c,
        status_vigencia: 'encerrado',
        ativo: false,
        cessionario_nome: c.cessionario_nome,   // mantém histórico
        cessionario_cpf_cnpj: c.cessionario_cpf_cnpj,
        // Percentuais revertidos: 100% volta para o autor
        pct_autor_br: 100,
        pct_editora_br: 0,
        pct_autor_ext: 100,
        pct_editora_ext: 0,
        direitos: c.direitos?.map((d: any) => ({
          ...d,
          percentual_autor: 100,
          percentual_editora: 0,
        })) ?? [],
        data_reversao_executada: hoje,
        updated_at: new Date().toISOString(),
      }
    })

    if (houveMudanca) {
      // Persiste contratos com reversão aplicada
      localStorage.setItem('sync_contratos_tipo_v2', JSON.stringify(contratosAtualizados))

      // Persiste histórico de reversões
      const historicoRaw = localStorage.getItem(CHAVE_REVERSOES)
      const historico: RegistroReversao[] = historicoRaw ? JSON.parse(historicoRaw) : []
      localStorage.setItem(CHAVE_REVERSOES, JSON.stringify([...historico, ...reversoes]))
    }

  } catch {
    // silencioso — não pode travar o sistema
  }

  // Marca que já executou hoje
  localStorage.setItem(CHAVE_ULTIMA_EXECUCAO, hoje)

  return reversoes
}

/**
 * Retorna histórico completo de reversões já executadas.
 */
export function obterHistoricoReversoes(): RegistroReversao[] {
  try {
    const raw = localStorage.getItem(CHAVE_REVERSOES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
