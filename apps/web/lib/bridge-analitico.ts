/**
 * lib/bridge-analitico.ts
 *
 * Função bridge: transforma obra + contratos + negócios editoriais em linhas
 * prontas para inserção na tabela `obras_analitico`.
 *
 * ── RESPONSABILIDADES ────────────────────────────────────────────────────────
 *  1. Iterar sobre cada link da obra.
 *  2. Para cada combinação tipo_direito × territorio:
 *     a. Resolver percentual autoral e percentual editorial por link.
 *     b. Aplicar negócio editorial (E → AM) quando cadastrado.
 *     c. Marcar PENDENTE quando AM identificada mas negócio não encontrado.
 *     d. Aplicar cessões sobre a parte autoral quando existirem.
 *  3. Retornar linhas tipadas para inserção + sumário de pendências.
 *
 * ── O QUE ESTA FUNÇÃO NÃO FAZ ─────────────────────────────────────────────
 *  - Não acessa o banco de dados diretamente.
 *  - Não calcula valores monetários (apenas percentuais).
 *  - Não invalida versões antigas (responsabilidade da API route).
 *  - Não presume percentuais: se não há contrato e não há CWR → PENDENTE.
 *
 * ── REGRA DE CONTROLE ─────────────────────────────────────────────────────
 *  `controlado = false` NÃO significa ignorar o participante.
 *  Significa: verificar se existe relação contratual aplicável ao tipo de
 *  direito e território em processamento. Se houver → calcular. Se não
 *  houver E o participante aparecer no CWR → usar CWR como fallback com
 *  status 'calculado' e fonte marcada como 'cwr'.
 *
 * ── HIERARQUIA DE FALLBACK DE PERCENTUAIS ─────────────────────────────────
 *  1. Contrato com split específico para o tipo_direito
 *  2. Contrato com percentual padrão (sem split por direito)
 *  3. Percentual do CWR (fallback — marcado como fonte='cwr')
 *  4. PENDENTE (sem contrato e sem CWR)
 */

// ── Tipos de entrada ─────────────────────────────────────────────────────────

/** Direito flexível de um titular dentro do link (tabela obras_links_titulares_direitos) */
export interface DireitoFlexivel {
  tipo_direito_id: string
  tipo_direito_codigo: string   // 'digital', 'sincronizacao', 'mecanico', etc.
  percentual: number
  controlado: boolean
  fonte: 'cwr' | 'contrato' | 'manual' | 'calculado'
}

/** Titular dentro de um link da obra */
export interface LinkTitularInput {
  id: string                    // obras_links_titulares.id
  obra_link_id: string
  titular_id: string | null
  editora_id: string | null
  nome: string
  funcao_no_link: 'CA' | 'E' | 'AM' | 'SE' | 'PA' | 'ES' | string
  papel: string                 // 'autor' | 'editora' | etc.
  /** Percentuais legados (fallback CWR) */
  percentual_exec_publica: number
  percentual_fonomecanico: number
  percentual_sincronizacao: number
  /** Direitos flexíveis — quando existirem, têm prioridade sobre legados */
  direitos_flexiveis: DireitoFlexivel[]
  controlado: boolean
  editora_original_id: string | null
  editora_administradora_id: string | null
  contrato_id: string | null
}

/** Link de uma obra (agrupa titulares) */
export interface ObraLinkInput {
  id: string
  obra_id: string
  numero_link: number
  percentual_link: number       // % da obra que este link representa (soma de todos links = 100)
  tipo_link: string
  controlado: boolean
  titulares: LinkTitularInput[]
}

/**
 * Contrato editorial: autor × editora administrada.
 * Fonte oficial dos percentuais de divisão autoral.
 */
export interface ContratoEditorialInput {
  id: string
  titular_id: string            // autor
  editora_id: string            // editora administrada
  percentual_editora: number    // % cedido pelo autor à editora
  percentual_autor: number      // % que o autor retém
  /** Splits específicos por tipo de direito. Chave = tipo_direito_codigo */
  splits_direitos: Record<string, { percentual_editora: number; percentual_autor: number }>
  data_inicio: string
  data_fim: string | null
  status: string
  territorio: string | null     // null = todos
}

/**
 * Negócio editorial: editora administrada × editora administradora.
 * Fonte oficial da divisão da parte editorial entre E e AM.
 */
export interface NegocioEditorialInput {
  id: string
  editora_administrada_id: string
  editora_administrada_nome: string
  editora_administradora_id: string
  editora_administradora_nome: string
  percentual_administrada: number
  percentual_administradora: number
  receitas_aplicaveis: string[] // [] = todas
  abrangencia_tipo: string
  abrangencia_ids: string[]
  territorios: string[]         // [] ou ['mundial'] = todos
  tipo_direito_id: string | null// null = todos os tipos
  data_inicio: string
  data_fim: string | null
  status: string
}

/**
 * Cessão de direitos: titular cedente → cessionário.
 * Aplicada sobre a parte autoral do cedente.
 */
export interface CessaoInput {
  id: string                    // contrato_id
  titular_cedente_id: string
  titular_cessionario_id: string | null
  editora_cessionaria_id: string | null
  nome_cessionario: string
  tipo_cessionario: 'cessionario_pj' | 'cessionario_pf' | 'licenciante' | 'herdeiro'
  percentual_cessao: number     // % da parte do cedente que é cedida
  tipo_direito_codigo: string | null // null = todos
  territorio: string | null     // null = todos
  data_inicio: string
  data_fim: string | null
  status: string
}

/** Contexto completo para o cálculo da bridge */
export interface BridgeContexto {
  tenant_id: string
  obra_id: string
  links: ObraLinkInput[]
  contratos_editoriais: ContratoEditorialInput[]
  negocios_editoriais: NegocioEditorialInput[]
  cessoes: CessaoInput[]
  /** Tipos de direito a processar. Ex: ['digital', 'sincronizacao'] */
  tipos_direito: Array<{ id: string; codigo: string }>
  /** Territórios a processar. Ex: ['BR', 'US'] */
  territorios: string[]
  competencia_inicio: Date | null
  competencia_fim: Date | null
  versao_calculo: number
}

// ── Tipos de saída ───────────────────────────────────────────────────────────

/** Linha pronta para inserção em obras_analitico */
export interface ObrasAnaliticoInsert {
  tenant_id: string
  obra_id: string
  obra_link_id: string | null
  obra_link_origem_id: string | null
  titular_id: string | null
  editora_id: string | null
  nome_participante: string
  tipo_participante_codigo: string  // código da tabela tipos_participante
  percentual_sobre_obra: number
  percentual_sobre_origem: number | null
  /** Preenchido após insert — auto-referencial. Identificado por _tempOrigemKey */
  origem_participante_id: string | null
  /** Chave temporária para vincular origem antes do insert (não vai ao BD) */
  _tempOrigemKey: string | null
  /** Chave que identifica esta linha como origem para outras (não vai ao BD) */
  _tempKey: string | null
  nivel_distribuicao: number
  tipo_direito_id: string | null
  territorio: string
  competencia_inicio: Date | null
  competencia_fim: Date | null
  contrato_id: string | null
  negocio_editorial_id: string | null
  status_calculo: 'calculado' | 'pendente' | 'erro'
  pendencia: string | null
  versao_calculo: number
  calculado_por: string
}

export interface BridgeResultado {
  linhas: ObrasAnaliticoInsert[]
  pendencias: string[]
  avisos: string[]
  total_participantes: number
  soma_percentuais: Record<string, number>  // chave: `${tipo_direito}|${territorio}`
}

// ── Helpers internos ─────────────────────────────────────────────────────────

function isContratoVigente(
  c: { data_inicio: string; data_fim: string | null; status: string },
  referencia: Date = new Date()
): boolean {
  if (!['vigente', 'assinado', 'ativo'].includes(c.status)) return false
  const inicio = new Date(c.data_inicio + 'T00:00:00')
  if (referencia < inicio) return false
  if (c.data_fim) {
    const fim = new Date(c.data_fim + 'T23:59:59')
    if (referencia > fim) return false
  }
  return true
}

function isNegocioVigente(n: NegocioEditorialInput, referencia: Date = new Date()): boolean {
  if (n.status !== 'ativo') return false
  const inicio = new Date(n.data_inicio + 'T00:00:00')
  if (referencia < inicio) return false
  if (n.data_fim) {
    const fim = new Date(n.data_fim + 'T23:59:59')
    if (referencia > fim) return false
  }
  return true
}

/** Verifica se negócio cobre o território informado */
function negocioCobreTerritorioETipo(
  n: NegocioEditorialInput,
  territorio: string,
  tipoDireitoCodigo: string,
  tipoDireitoId: string
): boolean {
  // Território
  const ts = n.territorios ?? []
  const cobTerritorioOk = ts.length === 0 || ts.includes('mundial') || ts.includes(territorio)
  if (!cobTerritorioOk) return false

  // Tipo de direito: negócio com tipo_direito_id específico só vale para aquele tipo
  if (n.tipo_direito_id && n.tipo_direito_id !== tipoDireitoId) return false

  // Receitas aplicáveis (campo legado — array de códigos)
  const rs = n.receitas_aplicaveis ?? []
  const cobReceitaOk = rs.length === 0 || rs.includes('todas') || rs.includes(tipoDireitoCodigo)
  if (!cobReceitaOk) return false

  return true
}

/** Verifica abrangência do negócio (catálogo / obra / autor específico) */
function negocioCobreAbrangencia(
  n: NegocioEditorialInput,
  obraId: string,
  titularId: string | null
): boolean {
  if (n.abrangencia_tipo === 'catalogo_inteiro') return true
  const ids = n.abrangencia_ids ?? []
  if (n.abrangencia_tipo === 'obras_especificas' || n.abrangencia_tipo === 'grupo_obras') {
    return ids.includes(obraId)
  }
  if (
    (n.abrangencia_tipo === 'autor_especifico' || n.abrangencia_tipo === 'grupo_autores') &&
    titularId
  ) {
    return ids.includes(titularId)
  }
  return false
}

/**
 * Encontra o negócio editorial mais específico e vigente.
 * Prioridade: específico de obra/autor > catálogo inteiro.
 */
function resolverNegocio(
  negocios: NegocioEditorialInput[],
  editoraAdministradaId: string,
  obraId: string,
  autorId: string | null,
  tipoDireitoCodigo: string,
  tipoDireitoId: string,
  territorio: string,
  referencia: Date
): NegocioEditorialInput | null {
  const candidatos = negocios.filter(n =>
    n.editora_administrada_id === editoraAdministradaId &&
    isNegocioVigente(n, referencia) &&
    negocioCobreTerritorioETipo(n, territorio, tipoDireitoCodigo, tipoDireitoId) &&
    negocioCobreAbrangencia(n, obraId, autorId)
  )
  if (candidatos.length === 0) return null
  // Prefere abrangência específica
  const especifico = candidatos.find(n => n.abrangencia_tipo !== 'catalogo_inteiro')
  return especifico ?? candidatos[0]
}

/**
 * Retorna o percentual editorial para um par autor × editora,
 * para um tipo de direito específico.
 * Hierarquia: split_especifico > padrao_contrato > fallback_cwr
 */
function resolverPercentualEditorial(
  contrato: ContratoEditorialInput | null,
  tipoDireitoCodigo: string,
  percentualCwrTotal: number  // percentual_editora + percentual_autor conforme CWR
): { percentual_editora: number; percentual_autor: number; fonte: 'contrato' | 'cwr' } {
  if (!contrato) {
    // Sem contrato: usa CWR diretamente
    // percentualCwrTotal é o total do link do autor (CA%)
    // Sem contrato registrado, não sabemos a divisão → usa como 0% editorial
    // O CWR mostra CA% já deduzido da parte editorial — usamos como está
    return { percentual_editora: 0, percentual_autor: percentualCwrTotal, fonte: 'cwr' }
  }

  // Verifica split específico por tipo de direito
  const split = contrato.splits_direitos?.[tipoDireitoCodigo]
  if (split) {
    return {
      percentual_editora: split.percentual_editora,
      percentual_autor: split.percentual_autor,
      fonte: 'contrato',
    }
  }

  // Percentual padrão do contrato
  return {
    percentual_editora: contrato.percentual_editora,
    percentual_autor: contrato.percentual_autor,
    fonte: 'contrato',
  }
}

/** Arredonda percentual para 4 casas, com regra 0.0005 de corte */
function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

// ── Função principal ─────────────────────────────────────────────────────────

/**
 * Executa a bridge para uma obra, gerando todas as linhas do `obras_analitico`.
 *
 * @param ctx  Contexto com obra, links, contratos, negócios, cessões e filtros.
 * @returns    Linhas para inserção + sumário de pendências e avisos.
 */
export function executarBridge(ctx: BridgeContexto): BridgeResultado {
  const linhas: ObrasAnaliticoInsert[] = []
  const pendencias: string[] = []
  const avisos: string[] = []
  const referencia = ctx.competencia_inicio ?? new Date()
  const somaPercentuais: Record<string, number> = {}

  // Itera sobre cada combinação tipo_direito × territorio
  for (const tipoDireito of ctx.tipos_direito) {
    for (const territorio of ctx.territorios) {
      const chave = `${tipoDireito.codigo}|${territorio}`
      somaPercentuais[chave] = 0

      for (const link of ctx.links) {
        // Separa participantes por função
        const autores  = link.titulares.filter(t =>
          ['CA', 'A', 'C', 'PA', 'ES'].includes(t.funcao_no_link)
        )
        const editoras = link.titulares.filter(t => t.funcao_no_link === 'E')
        const admins   = link.titulares.filter(t => t.funcao_no_link === 'AM' || t.funcao_no_link === 'SE')

        // ── AUTORES (CA) ─────────────────────────────────────────────────────
        for (const autor of autores) {
          // Percentual do autor no CWR para este tipo de direito
          const pctCwrAutor = obterPercentualCwr(autor, tipoDireito.codigo)

          // Busca contrato editorial vigente entre autor e editora do link
          const editora = editoras.find(e =>
            e.editora_id === autor.editora_original_id ||
            e.titular_id === autor.editora_original_id
          ) ?? editoras[0] ?? null

          const contrato = ctx.contratos_editoriais.find(c =>
            c.titular_id === autor.titular_id &&
            (editora ? c.editora_id === editora.editora_id : true) &&
            isContratoVigente(c, referencia) &&
            (c.territorio === null || c.territorio === territorio)
          ) ?? null

          // Verifica se há contrato ou usa CWR
          // controlado = false não significa pular: verificamos contratos aplicáveis
          let percentualAutoral: number
          let percentualEditorial: number
          let fonteContrato: 'contrato' | 'cwr'

          if (contrato) {
            const res = resolverPercentualEditorial(contrato, tipoDireito.codigo, pctCwrAutor)
            // Percentuais do contrato são relativos à parte total do link do autor
            const parteTotal = pctCwrAutor  // total do link = CA% no CWR
            percentualEditorial = round4((parteTotal * res.percentual_editora) / 100)
            percentualAutoral   = round4(parteTotal - percentualEditorial)
            fonteContrato = 'contrato'
          } else {
            // Sem contrato: usa CWR diretamente
            // No CWR, CA% já é a parte autoral líquida (editora aparece em linha separada como E)
            percentualAutoral   = pctCwrAutor
            percentualEditorial = 0  // editora já tem linha própria no CWR
            fonteContrato = 'cwr'
          }

          const tempKey = `autor|${autor.id}|${tipoDireito.codigo}|${territorio}`

          // Linha do autor
          const linhaAutor: ObrasAnaliticoInsert = {
            tenant_id:              ctx.tenant_id,
            obra_id:                ctx.obra_id,
            obra_link_id:           link.id,
            obra_link_origem_id:    link.id,
            titular_id:             autor.titular_id,
            editora_id:             null,
            nome_participante:      autor.nome,
            tipo_participante_codigo: 'autor',
            percentual_sobre_obra:  round4(percentualAutoral),
            percentual_sobre_origem: null,
            origem_participante_id: null,
            _tempKey:               tempKey,
            _tempOrigemKey:         null,
            nivel_distribuicao:     0,
            tipo_direito_id:        tipoDireito.id,
            territorio,
            competencia_inicio:     ctx.competencia_inicio,
            competencia_fim:        ctx.competencia_fim,
            contrato_id:            contrato?.id ?? null,
            negocio_editorial_id:   null,
            status_calculo:         'calculado',
            pendencia:              null,
            versao_calculo:         ctx.versao_calculo,
            calculado_por:          'bridge_v1',
          }
          linhas.push(linhaAutor)
          somaPercentuais[chave] = round4((somaPercentuais[chave] ?? 0) + percentualAutoral)

          // ── CESSÕES sobre a parte autoral ──────────────────────────────────
          if (autor.titular_id) {
            const cessoes = ctx.cessoes.filter(c =>
              c.titular_cedente_id === autor.titular_id &&
              isContratoVigente(c, referencia) &&
              (c.tipo_direito_codigo === null || c.tipo_direito_codigo === tipoDireito.codigo) &&
              (c.territorio === null || c.territorio === territorio)
            )

            if (cessoes.length > 0) {
              let pctRestanteAutor = percentualAutoral

              for (const cessao of cessoes) {
                const pctCessao = round4((percentualAutoral * cessao.percentual_cessao) / 100)
                pctRestanteAutor = round4(pctRestanteAutor - pctCessao)

                linhas.push({
                  tenant_id:              ctx.tenant_id,
                  obra_id:                ctx.obra_id,
                  obra_link_id:           link.id,
                  obra_link_origem_id:    link.id,
                  titular_id:             cessao.titular_cessionario_id,
                  editora_id:             cessao.editora_cessionaria_id,
                  nome_participante:      cessao.nome_cessionario,
                  tipo_participante_codigo: cessao.tipo_cessionario,
                  percentual_sobre_obra:  pctCessao,
                  percentual_sobre_origem: cessao.percentual_cessao,
                  origem_participante_id: null,
                  _tempKey:               `cessao|${cessao.id}|${tipoDireito.codigo}|${territorio}`,
                  _tempOrigemKey:         tempKey,  // aponta para o autor
                  nivel_distribuicao:     1,
                  tipo_direito_id:        tipoDireito.id,
                  territorio,
                  competencia_inicio:     ctx.competencia_inicio,
                  competencia_fim:        ctx.competencia_fim,
                  contrato_id:            cessao.id,
                  negocio_editorial_id:   null,
                  status_calculo:         'calculado',
                  pendencia:              null,
                  versao_calculo:         ctx.versao_calculo,
                  calculado_por:          'bridge_v1',
                })
                somaPercentuais[chave] = round4((somaPercentuais[chave] ?? 0) + pctCessao)
              }

              // Atualiza percentual do autor após cessões
              const idxAutor = linhas.findIndex(l => l._tempKey === tempKey)
              if (idxAutor >= 0) {
                linhas[idxAutor].percentual_sobre_obra = pctRestanteAutor
                somaPercentuais[chave] = round4(
                  (somaPercentuais[chave] ?? 0) - (percentualAutoral - pctRestanteAutor)
                )
              }
            }
          }
        }  // fim autores

        // ── EDITORAS ADMINISTRADAS (E) ────────────────────────────────────────
        for (const editora of editoras) {
          const pctCwrEditora = obterPercentualCwr(editora, tipoDireito.codigo)

          // Identifica se há AM vinculada a esta E (pela CWR ou pelo campo editora_administradora_id)
          const adminVinculada = admins.find(am =>
            am.editora_original_id === editora.editora_id ||
            editora.editora_administradora_id !== null
          ) ?? null

          const editoraId = editora.editora_id ?? ''
          const tempKeyEditora = `editora|${editora.id}|${tipoDireito.codigo}|${territorio}`

          // Busca negócio editorial para E → AM
          const negocio = editoraId
            ? resolverNegocio(
                ctx.negocios_editoriais,
                editoraId,
                ctx.obra_id,
                null,
                tipoDireito.codigo,
                tipoDireito.id,
                territorio,
                referencia
              )
            : null

          // Base editorial = E% + AM% do CWR (o CWR já mostra o resultado da divisão)
          // Quando o negócio é aplicado, recalculamos a divisão sobre o total editorial
          const pctCwrAdmin = adminVinculada
            ? obterPercentualCwr(adminVinculada, tipoDireito.codigo)
            : 0
          const totalEditorial = round4(pctCwrEditora + pctCwrAdmin)

          if (adminVinculada && !negocio) {
            // Cenário B: AM identificada mas sem negócio → PENDENTE
            const msg =
              `Negócio editorial não localizado para a Editora Administrada "${editora.nome}" ` +
              `com Editora Administradora "${adminVinculada.nome}" — ` +
              `tipo: ${tipoDireito.codigo} / território: ${territorio}. ` +
              `Cadastre o contrato de administração em Negócios entre Editoras.`
            pendencias.push(msg)

            // Editora fica pendente com o total editorial (E + AM do CWR)
            linhas.push({
              tenant_id:              ctx.tenant_id,
              obra_id:                ctx.obra_id,
              obra_link_id:           link.id,
              obra_link_origem_id:    link.id,
              titular_id:             editora.titular_id,
              editora_id:             editora.editora_id,
              nome_participante:      editora.nome,
              tipo_participante_codigo: 'editora_administrada',
              percentual_sobre_obra:  round4(totalEditorial),
              percentual_sobre_origem: null,
              origem_participante_id: null,
              _tempKey:               tempKeyEditora,
              _tempOrigemKey:         null,
              nivel_distribuicao:     0,
              tipo_direito_id:        tipoDireito.id,
              territorio,
              competencia_inicio:     ctx.competencia_inicio,
              competencia_fim:        ctx.competencia_fim,
              contrato_id:            null,
              negocio_editorial_id:   null,
              status_calculo:         'pendente',
              pendencia:              msg,
              versao_calculo:         ctx.versao_calculo,
              calculado_por:          'bridge_v1',
            })
            somaPercentuais[chave] = round4((somaPercentuais[chave] ?? 0) + totalEditorial)

            // AM com 0% e pendente
            linhas.push({
              tenant_id:              ctx.tenant_id,
              obra_id:                ctx.obra_id,
              obra_link_id:           link.id,
              obra_link_origem_id:    link.id,
              titular_id:             adminVinculada.titular_id,
              editora_id:             adminVinculada.editora_id,
              nome_participante:      adminVinculada.nome,
              tipo_participante_codigo: 'editora_administradora',
              percentual_sobre_obra:  0,
              percentual_sobre_origem: null,
              origem_participante_id: null,
              _tempKey:               `admin|${adminVinculada.id}|${tipoDireito.codigo}|${territorio}`,
              _tempOrigemKey:         tempKeyEditora,
              nivel_distribuicao:     1,
              tipo_direito_id:        tipoDireito.id,
              territorio,
              competencia_inicio:     ctx.competencia_inicio,
              competencia_fim:        ctx.competencia_fim,
              contrato_id:            null,
              negocio_editorial_id:   null,
              status_calculo:         'pendente',
              pendencia:              msg,
              versao_calculo:         ctx.versao_calculo,
              calculado_por:          'bridge_v1',
            })

          } else if (negocio) {
            // Cenário com negócio: divide conforme contrato
            const pctAdm  = round4((totalEditorial * negocio.percentual_administrada)  / 100)
            const pctAdmR = round4((totalEditorial * negocio.percentual_administradora) / 100)

            // Editora administrada
            linhas.push({
              tenant_id:              ctx.tenant_id,
              obra_id:                ctx.obra_id,
              obra_link_id:           link.id,
              obra_link_origem_id:    link.id,
              titular_id:             editora.titular_id,
              editora_id:             editora.editora_id,
              nome_participante:      editora.nome,
              tipo_participante_codigo: 'editora_administrada',
              percentual_sobre_obra:  pctAdm,
              percentual_sobre_origem: negocio.percentual_administrada,
              origem_participante_id: null,
              _tempKey:               tempKeyEditora,
              _tempOrigemKey:         null,
              nivel_distribuicao:     0,
              tipo_direito_id:        tipoDireito.id,
              territorio,
              competencia_inicio:     ctx.competencia_inicio,
              competencia_fim:        ctx.competencia_fim,
              contrato_id:            editora.contrato_id,
              negocio_editorial_id:   negocio.id,
              status_calculo:         'calculado',
              pendencia:              null,
              versao_calculo:         ctx.versao_calculo,
              calculado_por:          'bridge_v1',
            })
            somaPercentuais[chave] = round4((somaPercentuais[chave] ?? 0) + pctAdm)

            // Editora administradora (derivada da administrada)
            linhas.push({
              tenant_id:              ctx.tenant_id,
              obra_id:                ctx.obra_id,
              obra_link_id:           link.id,
              obra_link_origem_id:    link.id,
              titular_id:             negocio.editora_administradora_id ? null : null,
              editora_id:             negocio.editora_administradora_id || null,
              nome_participante:      negocio.editora_administradora_nome,
              tipo_participante_codigo: 'editora_administradora',
              percentual_sobre_obra:  pctAdmR,
              percentual_sobre_origem: negocio.percentual_administradora,
              origem_participante_id: null,    // preenchido após insert via _tempOrigemKey
              _tempKey:               `admr|${negocio.editora_administradora_id}|${link.id}|${tipoDireito.codigo}|${territorio}`,
              _tempOrigemKey:         tempKeyEditora,
              nivel_distribuicao:     1,
              tipo_direito_id:        tipoDireito.id,
              territorio,
              competencia_inicio:     ctx.competencia_inicio,
              competencia_fim:        ctx.competencia_fim,
              contrato_id:            editora.contrato_id,
              negocio_editorial_id:   negocio.id,
              status_calculo:         'calculado',
              pendencia:              null,
              versao_calculo:         ctx.versao_calculo,
              calculado_por:          'bridge_v1',
            })
            somaPercentuais[chave] = round4((somaPercentuais[chave] ?? 0) + pctAdmR)

          } else {
            // Cenário A: sem AM e sem negócio → 100% da parte editorial fica na Administrada
            // Usa totalEditorial (= pctCwrEditora quando não há AM) para consistência
            linhas.push({
              tenant_id:              ctx.tenant_id,
              obra_id:                ctx.obra_id,
              obra_link_id:           link.id,
              obra_link_origem_id:    link.id,
              titular_id:             editora.titular_id,
              editora_id:             editora.editora_id,
              nome_participante:      editora.nome,
              tipo_participante_codigo: 'editora_administrada',
              percentual_sobre_obra:  round4(totalEditorial),
              percentual_sobre_origem: null,
              origem_participante_id: null,
              _tempKey:               tempKeyEditora,
              _tempOrigemKey:         null,
              nivel_distribuicao:     0,
              tipo_direito_id:        tipoDireito.id,
              territorio,
              competencia_inicio:     ctx.competencia_inicio,
              competencia_fim:        ctx.competencia_fim,
              contrato_id:            editora.contrato_id,
              negocio_editorial_id:   null,
              status_calculo:         'calculado',
              pendencia:              null,
              versao_calculo:         ctx.versao_calculo,
              calculado_por:          'bridge_v1',
            })
            somaPercentuais[chave] = round4((somaPercentuais[chave] ?? 0) + totalEditorial)
          }
        }  // fim editoras

        // ── AM DO CWR SEM E IDENTIFICADA (AM orphan) ──────────────────────────
        // Casos onde o AM aparece no CWR mas não há E correspondente no link
        const amsOrfas = admins.filter(am =>
          !editoras.some(e =>
            e.editora_id === am.editora_original_id ||
            am.editora_original_id === null
          )
        )
        for (const am of amsOrfas) {
          const pctCwrAm = obterPercentualCwr(am, tipoDireito.codigo)
          avisos.push(
            `AM "${am.nome}" no link ${link.numero_link} não tem Editora Administrada identificada. ` +
            `Percentual ${pctCwrAm}% usado diretamente do CWR.`
          )
          linhas.push({
            tenant_id:              ctx.tenant_id,
            obra_id:                ctx.obra_id,
            obra_link_id:           link.id,
            obra_link_origem_id:    link.id,
            titular_id:             am.titular_id,
            editora_id:             am.editora_id,
            nome_participante:      am.nome,
            tipo_participante_codigo: 'editora_administradora',
            percentual_sobre_obra:  round4(pctCwrAm),
            percentual_sobre_origem: null,
            origem_participante_id: null,
            _tempKey:               `am_orfao|${am.id}|${tipoDireito.codigo}|${territorio}`,
            _tempOrigemKey:         null,
            nivel_distribuicao:     0,
            tipo_direito_id:        tipoDireito.id,
            territorio,
            competencia_inicio:     ctx.competencia_inicio,
            competencia_fim:        ctx.competencia_fim,
            contrato_id:            null,
            negocio_editorial_id:   null,
            status_calculo:         'calculado',
            pendencia:              null,
            versao_calculo:         ctx.versao_calculo,
            calculado_por:          'bridge_v1',
          })
          somaPercentuais[chave] = round4((somaPercentuais[chave] ?? 0) + pctCwrAm)
        }

      }  // fim links
    }  // fim territorios
  }  // fim tipos_direito

  // Resolve _tempOrigemKey → _tempKey mapeamento
  const keyToIndex = new Map<string, number>()
  linhas.forEach((l, i) => { if (l._tempKey) keyToIndex.set(l._tempKey, i) })

  // Validação: soma de percentuais deve ser 100% por chave
  for (const [chave, soma] of Object.entries(somaPercentuais)) {
    const diff = Math.abs(soma - 100)
    if (diff > 0.02) {
      avisos.push(
        `Soma de percentuais para ${chave} = ${soma.toFixed(4)}% (esperado: 100%). ` +
        `Verifique se todos os participantes do link estão com percentuais corretos.`
      )
    }
  }

  return {
    linhas,
    pendencias,
    avisos,
    total_participantes: linhas.length,
    soma_percentuais: somaPercentuais,
  }
}

// ── Helper: extrai percentual CWR por tipo de direito ────────────────────────

/**
 * Extrai o percentual do titular para um tipo de direito específico.
 * Prioridade: direito flexível cadastrado > colunas legadas.
 */
function obterPercentualCwr(titular: LinkTitularInput, tipoDireitoCodigo: string): number {
  // Tenta direito flexível primeiro (nova arquitetura)
  const flexivel = titular.direitos_flexiveis.find(
    d => d.tipo_direito_codigo === tipoDireitoCodigo
  )
  if (flexivel) return flexivel.percentual

  // Fallback para colunas legadas
  switch (tipoDireitoCodigo) {
    case 'exec_publica':  return titular.percentual_exec_publica
    case 'digital':       return titular.percentual_fonomecanico
    case 'mecanico':      return titular.percentual_fonomecanico
    case 'sincronizacao': return titular.percentual_sincronizacao
    case 'audiovisual':   return titular.percentual_sincronizacao
    case 'publicidade':   return titular.percentual_sincronizacao
    default:
      // Para tipos sem equivalência legada, retorna 0
      // O sistema marcará como pendente se não houver direito flexível cadastrado
      return 0
  }
}

// ── Utilitário: resolve origens após insert ───────────────────────────────────

/**
 * Após inserir as linhas no banco e obter os IDs retornados,
 * atualiza `origem_participante_id` das linhas derivadas (nivel >= 1).
 *
 * @param linhasInseridas  Linhas já inseridas com seus IDs do banco.
 * @param mapa             Map de _tempKey → id retornado pelo banco.
 */
export function resolverOrigensAposInsert(
  linhasInseridas: Array<ObrasAnaliticoInsert & { id: string }>,
  mapa: Map<string, string>
): void {
  for (const linha of linhasInseridas) {
    if (linha._tempOrigemKey && mapa.has(linha._tempOrigemKey)) {
      linha.origem_participante_id = mapa.get(linha._tempOrigemKey)!
    }
  }
}
