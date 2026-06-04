/**
 * lib/analitico-negocios.ts
 *
 * Resolução de negócios editoriais para o Analítico.
 *
 * REGRA FUNDAMENTAL:
 * A divisão entre Editora Administrada e Editora Administradora NUNCA é
 * inferida do CWR, BackOffice, UBEM ou qualquer fonte externa.
 * Ela é obtida EXCLUSIVAMENTE da tabela `negocios_editoriais`.
 *
 * Se não houver negócio cadastrado → erro explícito, sem cálculo.
 */

export interface NegocioEditorial {
  id: string
  status: 'ativo' | 'inativo' | 'encerrado'
  editora_administrada_id: string
  editora_administrada_nome: string
  editora_administradora_id: string
  editora_administradora_nome: string
  percentual_administrada: number   // ex: 60
  percentual_administradora: number // ex: 40
  receitas_aplicaveis: string[]     // ex: ['digital','sync']
  abrangencia_tipo: string
  abrangencia_ids: string[]
  territorios: string[]
  data_inicio: string
  data_fim?: string | null
}

export interface ResolucaoNegocio {
  encontrado: boolean
  negocio?: NegocioEditorial
  erro?: string
}

/**
 * Resultado do cálculo do Analítico para um link (autor/editora).
 *
 * Exemplo:
 *   parteEditorial = 25%
 *   resultado:
 *     percentual_administrada   = 25 * 0.60 = 15%
 *     percentual_administradora = 25 * 0.40 = 10%
 */
export interface ResultadoAnaliticoLink {
  /** Percentual individual do autor na obra (parte autoral) */
  percentual_autor: number
  /** Percentual total cedido à editora pelo contrato editorial */
  percentual_parte_editorial: number
  /** Percentual final da Editora Administrada */
  percentual_administrada: number
  /** Nome da Editora Administrada */
  editora_administrada_nome: string
  /** Percentual final da Editora Administradora (0 se não houver negócio) */
  percentual_administradora: number
  /** Nome da Editora Administradora */
  editora_administradora_nome: string
  /** Negócio utilizado para o cálculo */
  negocio_id: string
  /** Advertência — preenchida quando não há negócio cadastrado */
  aviso?: string
}

/**
 * Verifica se um negócio está vigente na data informada.
 */
function isVigente(negocio: NegocioEditorial, dataReferencia: Date = new Date()): boolean {
  if (negocio.status !== 'ativo') return false
  const inicio = new Date(negocio.data_inicio + 'T00:00:00')
  if (dataReferencia < inicio) return false
  if (negocio.data_fim) {
    const fim = new Date(negocio.data_fim + 'T23:59:59')
    if (dataReferencia > fim) return false
  }
  return true
}

/**
 * Verifica se o negócio cobre a receita informada.
 */
function cobreReceita(negocio: NegocioEditorial, tipoReceita: string): boolean {
  const tipos = negocio.receitas_aplicaveis ?? []
  return tipos.length === 0 || tipos.includes(tipoReceita) || tipos.includes('todas')
}

/**
 * Verifica se o negócio cobre a obra/autor informado.
 */
function cobreAbrangencia(negocio: NegocioEditorial, obraId?: string, autorId?: string): boolean {
  if (negocio.abrangencia_tipo === 'catalogo_inteiro') return true
  if (negocio.abrangencia_tipo === 'obras_especificas' && obraId) {
    return (negocio.abrangencia_ids ?? []).includes(obraId)
  }
  if (negocio.abrangencia_tipo === 'autor_especifico' && autorId) {
    return (negocio.abrangencia_ids ?? []).includes(autorId)
  }
  if (negocio.abrangencia_tipo === 'grupo_autores' && autorId) {
    return (negocio.abrangencia_ids ?? []).includes(autorId)
  }
  return false
}

/**
 * Encontra o negócio editorial vigente para uma Editora Administrada.
 *
 * Prioridade: negócio com abrangência específica > catálogo inteiro.
 */
export function resolverNegocio(
  editoraAdministradaId: string,
  negocios: NegocioEditorial[],
  opcoes?: {
    tipoReceita?: string
    obraId?: string
    autorId?: string
    dataReferencia?: Date
  }
): ResolucaoNegocio {
  const { tipoReceita = 'digital', obraId, autorId, dataReferencia = new Date() } = opcoes ?? {}

  // Filtra por editora administrada + vigência
  const candidatos = negocios.filter(n =>
    n.editora_administrada_id === editoraAdministradaId &&
    isVigente(n, dataReferencia) &&
    cobreReceita(n, tipoReceita) &&
    cobreAbrangencia(n, obraId, autorId)
  )

  if (candidatos.length === 0) {
    return {
      encontrado: false,
      erro: `Regra de negócio não localizada para a editora administrada [${editoraAdministradaId}] na receita "${tipoReceita}". Cadastre o contrato de administração em Negócios entre Editoras.`,
    }
  }

  // Prefere abrangência específica sobre catálogo inteiro
  const especifico = candidatos.find(n => n.abrangencia_tipo !== 'catalogo_inteiro')
  return { encontrado: true, negocio: especifico ?? candidatos[0] }
}

/**
 * Calcula o Analítico de um link (autor + editora) aplicando o negócio editorial.
 *
 * @param percentualAutorNaObra   Ex: 50 (o autor tem 50% da obra)
 * @param percentualCedidoEditora Ex: 25 (o autor cedeu 25% à editora pelo contrato editorial)
 *                                O autor fica com: percentualAutorNaObra - percentualCedidoEditora
 * @param editoraAdministradaId   ID da editora que recebe a parte editorial
 * @param negocios                Lista de negócios cadastrados
 * @param opcoes                  Filtros de receita/obra/autor/data
 */
export function calcularAnaliticoLink(
  percentualAutorNaObra: number,
  percentualCedidoEditora: number,
  editoraAdministradaId: string,
  editoraAdministradaNome: string,
  negocios: NegocioEditorial[],
  opcoes?: {
    tipoReceita?: string
    obraId?: string
    autorId?: string
    dataReferencia?: Date
  }
): ResultadoAnaliticoLink & { erro?: string } {
  const percentualAutor = percentualAutorNaObra - percentualCedidoEditora

  const resolucao = resolverNegocio(editoraAdministradaId, negocios, opcoes)

  if (!resolucao.encontrado || !resolucao.negocio) {
    // SEM NEGÓCIO: toda a parte editorial fica na administrada, sem divisão
    return {
      percentual_autor:           percentualAutor,
      percentual_parte_editorial: percentualCedidoEditora,
      percentual_administrada:    percentualCedidoEditora,
      editora_administrada_nome:  editoraAdministradaNome,
      percentual_administradora:  0,
      editora_administradora_nome: '—',
      negocio_id: '',
      erro: resolucao.erro,
      aviso: resolucao.erro,
    }
  }

  const neg = resolucao.negocio
  const fatorAdm  = neg.percentual_administrada  / 100
  const fatorAdmR = neg.percentual_administradora / 100

  return {
    percentual_autor:            percentualAutor,
    percentual_parte_editorial:  percentualCedidoEditora,
    percentual_administrada:     parseFloat((percentualCedidoEditora * fatorAdm).toFixed(4)),
    editora_administrada_nome:   neg.editora_administrada_nome,
    percentual_administradora:   parseFloat((percentualCedidoEditora * fatorAdmR).toFixed(4)),
    editora_administradora_nome: neg.editora_administradora_nome,
    negocio_id: neg.id,
  }
}
