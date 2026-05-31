/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  REGRA DE NEGÓCIO — CONTA CORRENTE DE OBRA (CC OBRA)
 *  Sync Mood — Sistema de Gestão de Direitos Autorais
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  ORIGEM DO CC OBRA
 *  O Conta Corrente de Obra SURGE a partir dos negócios jurídicos firmados:
 *    - Autor × Editora       (Contrato de Cessão / Edição / Administração / Coedição / Subedição)
 *    - Autor × Cessionário   (Termo de Cessão PF ou PJ)
 *    - Autor × Licenciante   (Contrato de Licenciamento)
 *
 *  Enquanto não houver nenhum negócio jurídico vigente sobre a obra,
 *  ela NÃO possui CC Obra ativo.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  FLUXO DE PAGAMENTO — CÁLCULO SEQUENCIAL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  REGRA GERAL — PORTA DE ENTRADA DO CC OBRA
 *  ═══════════════════════════════════════════════════════════════════════════
 *
 *  TODOS os valores oriundos da exploração dos direitos negociados em
 *  contratos diversos que chegam à editora DEVEM ser repassados ao
 *  Conta Corrente da Obra. É DENTRO do CC Obra que os acordos vigentes
 *  são aplicados e os valores divididos e repassados aos seus respectivos
 *  donos conforme os contratos.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  ⚠️  EXCEÇÃO — SOCINPRO / ECAD (Direito de Comunicação ao Público /
 *                                   Direito de Execução Pública)
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *  OS VALORES RECEBIDOS PELA SOCINPRO (e demais sociedades arrecadadoras
 *  do ECAD: ABRAMUS, AMAR, ASSIM, SBACEM, SICAM, SOCINPRO, UBC) NÃO
 *  ENTRAM no Conta Corrente da Obra.
 *
 *  Motivo: o ECAD paga AS PRÓPRIAS SOCIEDADES, que fazem os pagamentos
 *  DIRETAMENTE aos seus titulares filiados.
 *
 *  No caso da TOP SHOW MUSIC:
 *    → os valores de execução pública (SOCINPRO) são recebidos
 *      ATRAVÉS DA SOCINPRO, que paga diretamente ao titular.
 *    → Esses valores NÃO transitam pelo CC Obra da editora.
 *    → O sistema deve apenas REGISTRAR / INFORMAR esses recebimentos
 *      (para fins de prestação de contas e histórico), mas NÃO
 *      executar o cálculo de distribuição do CC Obra sobre eles.
 *
 *  Direito afetado: BR-g) Direito de Comunicação ao Público (execução pública)
 *
 *  Fluxo ECAD/SOCINPRO:
 *    ECAD → SOCINPRO → Titular (direto, sem passar pela editora / CC Obra)
 *
 *  Fluxo de todos os DEMAIS direitos:
 *    Exploração → Editora → CC Obra → Divisão contratual → CC Titular(es)
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *  PASSO 0 — ENTRADA
 *  ┌────────────────────────────────────────────────────┐
 *  │  RECEITA BRUTA DA OBRA (100%)                      │
 *  │  → Chega ao Conta Corrente da Obra                 │
 *  │  → Fontes que ENTRAM no CC Obra:                   │
 *  │      DSP, Sync, Internacional, Publicidade,        │
 *  │      Reprodução gráfica, Fonomecanica, Audiovisual, │
 *  │      Base de dados, Ônus/Liberações                │
 *  │  → Fontes que NÃO entram no CC Obra (ECAD/SOCINPRO):│
 *  │      Execução pública — pago pelo ECAD direto      │
 *  │      às sociedades, que repassam ao titular.       │
 *  └────────────────────────────────────────────────────┘
 *                         │
 *  PASSO 1 — SEPARAR PARTICIPAÇÃO DA(S) EDITORA(S)
 *                         │
 *                         ▼
 *
 *  ├──► % EDITORA A ──► CC Titular Editora A   (EDITORA ORIGINAL — E)
 *  ├──► % EDITORA B ──► CC Titular Editora B   (COEDIÇÃO — E)        SE HOUVER
 *  └──► % EDITORA C ──► CC Titular Editora C   (ADMINISTRADORA — AM) SE HOUVER
 *
 *  Cada editora recebe seu % conforme o contrato vigente.
 *  A Editora Administradora (AM) opera em nome da Editora Original (E),
 *  mas o repasse financeiro segue o acordo entre elas.
 *
 *  Exemplo:
 *    Receita obra: R$ 1.000,00
 *    Autor: 100% da obra | Editora A (E): 25% da parte do autor
 *    → Editora A recebe: R$ 250,00  → CC Titular Editora A
 *    → Sobra para o Autor: R$ 750,00
 *
 *  IMPORTANTE: A soma dos % de todas as editoras não pode ultrapassar
 *  o % total da editora contratado com o autor.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  PASSO 2 — VERIFICAR CONTRATOS DE CESSÃO / LICENÇA DO AUTOR
 *
 *  Com o valor líquido do autor (após desconto das editoras):
 *
 *  NÃO tem contrato de cessão/licença vigente?
 *    → Valor vai DIRETO para o CC Titular do Autor
 *
 *  TEM contrato(s) vigente(s)?
 *    → O sistema separa conforme cada contrato ativo:
 *
 *    ┌─ Cessionário PJ  → CC Titular da Empresa        (sem IRPF — natureza PJ)
 *    ├─ Cessionário PF  → CC Titular do Terceiro PF    (com IRPF — descontado na fonte)
 *    ├─ Licenciante     → CC Titular do Licenciante    (com IRPF se PF — descontado na fonte)
 *    └─ Autor restante  → CC Titular do Autor          (com IRPF se PF — descontado na fonte)
 *
 *  ⚠️  IRPF — RETENÇÃO NA FONTE
 *  O IRPF NÃO é retido no CC Obra.
 *  O valor chega BRUTO ao CC Titular de cada destinatário PF.
 *  A retenção do IRPF acontece NO CONTA CORRENTE TITULAR,
 *  conforme a tabela progressiva vigente do Brasil, no momento
 *  do pagamento/repasse ao titular PF.
 *
 *  Resumo:
 *    CC Obra      → distribui valores BRUTOS a cada destinatário
 *    CC Titular   → retém o IRPF e registra o valor líquido a pagar
 *
 *  Pagamento a PJ (Cessionário PJ ou Editora PJ): NÃO incide IRPF.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  DESTINOS FINAIS DO DINHEIRO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  → CC Titular Editora(s)        — Conta bancária cadastrada na editora
 *  → CC Titular Autor             — Conta bancária cadastrada no titular PF/PJ
 *  → CC Titular Cessionário PJ    — Conta bancária da empresa cessionária
 *  → CC Titular Cessionário PF    — Conta bancária do terceiro PF
 *  → CC Titular Licenciante       — Conta bancária do licenciante
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  REGRAS CRÍTICAS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  1. O cálculo só executa se o contrato estiver com status VIGENTE
 *     (assinado + dentro do prazo de vigência — data_inicio <= hoje <= data_termino)
 *
 *  1a. REGRA DE VENCIMENTO E REVERSÃO DE DIREITOS:
 *     - Todo contrato DEVE ter data_inicio.
 *     - data_termino é OBRIGATÓRIA para: LIC, LPJ, LPF (licenciamentos).
 *     - data_termino é OPCIONAL para demais tipos (prazo indeterminado).
 *     - Ao atingir a data_termino, TODOS os direitos negociados retornam
 *       automaticamente ao CEDENTE (autor ou editora).
 *     - O sistema BLOQUEIA novos pagamentos ao cessionário/licenciante.
 *     - O sistema ALERTA os colaboradores com antecedência configurável (dias).
 *
 *  Status do contrato por data:
 *    data_inicio > hoje          → AGUARDANDO INÍCIO
 *    data_inicio <= hoje
 *      sem data_termino          → VIGENTE (indeterminado)
 *      data_termino >= hoje      → VIGENTE
 *      data_termino < hoje       → VENCIDO → direitos retornam ao cedente
 *
 *  2. Contratos VENCIDOS ou NÃO ASSINADOS → o valor fica retido no CC Obra
 *     aguardando regularização (gera bloqueio/alerta)
 *
 *  3. Cessão de Direitos (CPJ/CPF) NÃO altera a identidade do autor na obra.
 *     O autor continua: criador, ECAD, CWR, histórico.
 *     Só muda: o RECEBEDOR FINANCEIRO.
 *
 *  4. Na Cessão Total ou Licenciamento integral:
 *     o autor deixa de ser recebedor financeiro pela duração do contrato.
 *     O sistema bloqueia novos pagamentos ao autor por aquela obra.
 *
 *  5. Subedição: o repasse ao subeditor ocorre sobre o % da editora no exterior,
 *     descontada a comissão do subeditor. Moeda e câmbio são registrados
 *     separadamente no CC Internacional.
 *
 *  6. Coedição: cada coeditora recebe seu % direto. A soma dos % das
 *     coeditoreas não pode ultrapassar o % total da editora na obra.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  IMPACTO NOS MÓDULOS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Módulo                | Impacto
 *  ─────────────────────────────────────────────────────────────────
 *  Contratos-Tipo        | Define o molde da regra (%)
 *  Contratos             | Instância real: titular + obra + % + vigência
 *  CC Obra               | Recebe, calcula e distribui
 *  CC Titular            | Recebe o valor já calculado
 *  Distribuição          | Executa o repasse bancário
 *  Prestação de Contas   | Documenta o extrato para o titular
 *  Tributação            | IRPF (CPF) × sem IRPF (CPJ)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── Tipos do motor de cálculo ────────────────────────────────────────────

/**
 * Fontes de receita que NÃO entram no CC Obra.
 * O ECAD paga diretamente às sociedades arrecadadoras,
 * que repassam diretamente aos titulares filiados.
 * O sistema apenas REGISTRA esses valores (informativo/histórico).
 */
export const FONTES_EXCLUIDAS_CC_OBRA = [
  'SOCINPRO',
  'ABRAMUS',
  'AMAR',
  'ASSIM',
  'SBACEM',
  'SICAM',
  'UBC',
  'ECAD',
] as const

export type FonteExcluidaCCObra = typeof FONTES_EXCLUIDAS_CC_OBRA[number]

/**
 * Retorna true se a receita veio de uma sociedade ECAD
 * e portanto NÃO deve transitar pelo CC Obra.
 */
export function isReceitaECAD(fonte: string): boolean {
  return FONTES_EXCLUIDAS_CC_OBRA.includes(fonte as FonteExcluidaCCObra)
}

export type TipoDestinatario =
  | 'editora'
  | 'coeditora'
  | 'subeditor'
  | 'administradora'
  | 'autor'
  | 'cessionario_pj'
  | 'cessionario_pf'
  | 'licenciante'

export interface ParticipacaoObra {
  destinatario_id: string
  destinatario_nome: string
  tipo: TipoDestinatario
  percentual: number          // % sobre a parte que entra no cálculo
  valor_calculado: number     // valor em R$
  contrato_id: string         // contrato que originou
  incide_irpf: boolean
  conta_bancaria_id: string   // para onde o dinheiro vai
}

export interface ResultadoCalculoCC {
  obra_id: string
  obra_titulo: string
  valor_bruto: number
  participacoes: ParticipacaoObra[]
  total_distribuido: number
  saldo_retido: number        // caso haja contrato pendente/bloqueado
  data_calculo: string
  contratos_vigentes: string[]
  alertas: string[]
  /** true quando a receita é ECAD/sociedade — NÃO transita pelo CC Obra */
  fonte_excluida?: boolean
}

/**
 * Executa o cálculo sequencial de distribuição de uma receita de obra.
 * Passo 1: separa editoras. Passo 2: verifica cessões/licenças do autor.
 *
 * @param fonte  Identificador da fonte pagadora (ex: 'DSP', 'SYNC', 'SOCINPRO').
 *               Se a fonte for ECAD/sociedade arrecadadora, o cálculo é bloqueado
 *               e o valor deve apenas ser registrado no histórico informativo.
 */
export function calcularDistribuicaoObra(
  valorBruto: number,
  participacoesContratadas: ParticipacaoObra[],
  fonte: string = 'DSP',
): ResultadoCalculoCC {
  // ── Guarda de exceção ECAD/SOCINPRO ──────────────────────────────────────
  if (isReceitaECAD(fonte)) {
    return {
      obra_id: '',
      obra_titulo: '',
      valor_bruto: valorBruto,
      participacoes: [],
      total_distribuido: 0,
      saldo_retido: 0,
      data_calculo: new Date().toISOString(),
      contratos_vigentes: [],
      alertas: [
        `RECEITA ECAD/SOCINPRO — fonte: ${fonte}. ` +
        `Este valor NÃO transita pelo CC Obra. ` +
        `O ECAD paga diretamente à ${fonte}, que repassa ao titular. ` +
        `Registro apenas informativo no histórico.`,
      ],
      fonte_excluida: true,
    }
  }

  // Passo 1: editoras primeiro
  const editoras = participacoesContratadas.filter(p =>
    ['editora', 'coeditora', 'administradora', 'subeditor'].includes(p.tipo)
  )
  const demais = participacoesContratadas.filter(p =>
    !['editora', 'coeditora', 'administradora', 'subeditor'].includes(p.tipo)
  )

  let saldoAutor = valorBruto
  const resultado: ParticipacaoObra[] = []

  for (const e of editoras) {
    const valor = parseFloat(((valorBruto * e.percentual) / 100).toFixed(2))
    resultado.push({ ...e, valor_calculado: valor })
    saldoAutor -= valor
  }

  // Passo 2: cessões / licenças sobre saldo do autor
  let saldoRestante = saldoAutor
  for (const d of demais) {
    if (d.tipo === 'autor') continue // autor recebe o que sobrar
    const valor = parseFloat(((saldoAutor * d.percentual) / 100).toFixed(2))
    resultado.push({ ...d, valor_calculado: valor })
    saldoRestante -= valor
  }

  // Autor recebe o que sobrou
  const autor = demais.find(p => p.tipo === 'autor')
  if (autor && saldoRestante > 0) {
    resultado.push({ ...autor, valor_calculado: parseFloat(saldoRestante.toFixed(2)) })
  }

  const totalDistribuido = resultado.reduce((a, p) => a + p.valor_calculado, 0)

  return {
    obra_id: '',
    obra_titulo: '',
    valor_bruto: valorBruto,
    participacoes: resultado,
    total_distribuido: parseFloat(totalDistribuido.toFixed(2)),
    saldo_retido: parseFloat((valorBruto - totalDistribuido).toFixed(2)),
    data_calculo: new Date().toISOString(),
    contratos_vigentes: participacoesContratadas.map(p => p.contrato_id),
    alertas: [],
    fonte_excluida: false,
  }
}
