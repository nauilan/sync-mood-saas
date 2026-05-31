/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  REGRA DE NEGÓCIO — CONTA CORRENTE DO TITULAR (CC TITULAR)
 *  Sync Mood — Sistema de Gestão de Direitos Autorais
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  ORIGEM DOS VALORES NO CC TITULAR
 *  Os valores chegam ao CC Titular VINDOS DO CC OBRA, já separados
 *  por contrato vigente. O CC Titular recebe o valor BRUTO de cada obra.
 *
 *  Quem pode ter CC Titular:
 *    - Autor / Titular PF
 *    - Autor / Titular PJ
 *    - Editora (E)
 *    - Coeditora (E)
 *    - Editora Administradora (AM)
 *    - Cessionário PJ
 *    - Cessionário PF
 *    - Licenciante PF ou PJ
 *    - Subeditor (para repasses internacionais)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  FLUXO DENTRO DO CC TITULAR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  ENTRADA (vindo do CC Obra — valor BRUTO)
 *  ┌────────────────────────────────────────────────────┐
 *  │  CONTA CORRENTE DO TITULAR                         │
 *  │  → Acumula entradas de múltiplas obras             │
 *  │  → Cada lançamento referencia: obra + contrato     │
 *  └────────────────────────────────────────────────────┘
 *                         │
 *                         ▼
 *  PASSO 1 — O titular é PF ou PJ?
 *
 *  PJ (Editora, Cessionário PJ, etc.)
 *    → NÃO incide IRPF
 *    → Valor líquido = Valor bruto
 *    → Segue para pagamento bancário
 *
 *  PF (Autor, Cessionário PF, Licenciante PF)
 *    → INCIDE IRPF
 *    → Sistema aplica tabela progressiva vigente do Brasil
 *    → Calcula: Valor líquido = Valor bruto - IRPF retido
 *    → IRPF retido é recolhido pela Editora (fonte pagadora)
 *    → Segue para pagamento bancário com valor líquido
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  TABELA PROGRESSIVA IRPF (referência — atualizar conforme legislação)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Base de Cálculo Mensal (R$)     | Alíquota | Dedução (R$)
 *  ──────────────────────────────────────────────────────────
 *  Até 2.259,20                    |    —     |     —
 *  De 2.259,21 até 2.826,65        |  7,5%    |   169,44
 *  De 2.826,66 até 3.751,05        | 15,0%    |   381,44
 *  De 3.751,06 até 4.664,68        | 22,5%    |   662,77
 *  Acima de 4.664,68               | 27,5%    |   896,00
 *
 *  ⚠️ Atenção: tabela sujeita a atualização pelo governo federal.
 *     O sistema deve permitir atualização dos valores sem alteração de código.
 *     Configurar em: Config → Parâmetros → Tabela IRPF
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  REGRAS CRÍTICAS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  1. A retenção do IRPF NÃO ocorre no CC Obra.
 *     O CC Obra distribui valores BRUTOS.
 *     A retenção ocorre AQUI, no CC Titular, no momento do pagamento.
 *
 *  2. A Editora é a FONTE PAGADORA responsável pela retenção e recolhimento
 *     do IRPF ao governo, via DARF ou sistema equivalente.
 *
 *  3. O CC Titular registra:
 *     - Valor bruto recebido (vindo do CC Obra)
 *     - IRPF retido (se PF)
 *     - Valor líquido pago ao titular
 *     - Referência da obra e do contrato que originou o lançamento
 *
 *  4. Cada lançamento no CC Titular deve ter rastreabilidade completa:
 *     obra → contrato → percentual → valor bruto → IRPF → valor líquido
 *
 *  5. Titulares isentos de IRPF (ex: portadores de doença grave)
 *     devem ser sinalizados no cadastro do titular para que o sistema
 *     não aplique retenção.
 *
 *  6. O CC Titular acumula valores de MÚLTIPLAS OBRAS.
 *     O IRPF é calculado sobre CADA PAGAMENTO individualmente
 *     (não sobre o acumulado mensal de todas as obras juntas —
 *     a consolidação anual é responsabilidade do titular via DIRPF).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  RESUMO DO FLUXO COMPLETO (CC OBRA → CC TITULAR)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  CC OBRA distribui BRUTO:
 *    ├──► CC Titular Editora(s)       → sem IRPF (PJ)
 *    ├──► CC Titular Cessionário PJ   → sem IRPF (PJ)
 *    ├──► CC Titular Cessionário PF   → retém IRPF → paga líquido
 *    ├──► CC Titular Licenciante PF   → retém IRPF → paga líquido
 *    ├──► CC Titular Licenciante PJ   → sem IRPF (PJ)
 *    └──► CC Titular Autor PF         → retém IRPF → paga líquido
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  IMPACTO NOS MÓDULOS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Módulo                | Impacto
 *  ──────────────────────────────────────────────────────────────────
 *  CC Obra               | Envia valor BRUTO ao CC Titular
 *  CC Titular            | Retém IRPF (se PF) e registra valor líquido
 *  Distribuição          | Executa o pagamento bancário (valor líquido)
 *  Prestação de Contas   | Extrato: bruto + IRPF + líquido por obra
 *  Config → Parâmetros   | Tabela IRPF configurável sem código
 *  Relatórios Fiscais    | DARF, Informe de Rendimentos, DIRF
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── Tabela IRPF (atualizar em Config → Parâmetros) ───────────────────────

export interface FaixaIRPF {
  limite_inferior: number   // R$ — null = sem limite inferior (primeira faixa)
  limite_superior: number | null  // R$ — null = sem limite superior (última faixa)
  aliquota: number          // decimal ex: 0.075 = 7,5%
  deducao: number           // R$ a deduzir após aplicar alíquota
}

export const TABELA_IRPF_2024: FaixaIRPF[] = [
  { limite_inferior: 0,        limite_superior: 2259.20, aliquota: 0,     deducao: 0      },
  { limite_inferior: 2259.21,  limite_superior: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { limite_inferior: 2826.66,  limite_superior: 3751.05, aliquota: 0.15,  deducao: 381.44 },
  { limite_inferior: 3751.06,  limite_superior: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { limite_inferior: 4664.69,  limite_superior: null,    aliquota: 0.275, deducao: 896.00 },
]

export type NaturezaTitular = 'PF' | 'PJ'

export interface ResultadoIRPF {
  valor_bruto: number
  aliquota_aplicada: number
  irpf_retido: number
  valor_liquido: number
  isento: boolean
}

/**
 * Calcula o IRPF a reter no CC Titular.
 * Se o titular for PJ ou estiver marcado como isento, retorna sem retenção.
 */
export function calcularIRPF(
  valorBruto: number,
  natureza: NaturezaTitular,
  isento: boolean = false,
  tabela: FaixaIRPF[] = TABELA_IRPF_2024,
): ResultadoIRPF {
  if (natureza === 'PJ' || isento) {
    return {
      valor_bruto: valorBruto,
      aliquota_aplicada: 0,
      irpf_retido: 0,
      valor_liquido: valorBruto,
      isento: true,
    }
  }

  const faixa = tabela
    .slice()
    .reverse()
    .find(f => valorBruto >= f.limite_inferior)

  if (!faixa || faixa.aliquota === 0) {
    return {
      valor_bruto: valorBruto,
      aliquota_aplicada: 0,
      irpf_retido: 0,
      valor_liquido: valorBruto,
      isento: false,
    }
  }

  const irpf = parseFloat(((valorBruto * faixa.aliquota) - faixa.deducao).toFixed(2))
  const irpfFinal = Math.max(0, irpf)

  return {
    valor_bruto: valorBruto,
    aliquota_aplicada: faixa.aliquota,
    irpf_retido: irpfFinal,
    valor_liquido: parseFloat((valorBruto - irpfFinal).toFixed(2)),
    isento: false,
  }
}
