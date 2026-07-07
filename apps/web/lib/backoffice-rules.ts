/**
 * REGRAS DEFINITIVAS BACKOFFICE — MR, LINKS E ANALÍTICO
 *
 * Fonte de verdade para toda importação CWR, reintegração, checklist SWI,
 * exportação e display financeiro. Qualquer alteração aqui se propaga
 * automaticamente para integrar, confirmar, popular-links e UI.
 *
 * ═══════════════════════════════════════════════════════════
 * REGRA 1 — MR SINTÉTICO (Fono/Digital — cobrança externa)
 * ═══════════════════════════════════════════════════════════
 * Somente a AM (administradora local) pode ter percentual_fonomecanico > 0.
 * Todos os demais recebem MR = 0:
 *   • autores controlados  (SWR / CA / C / CE)
 *   • autores não controlados (OWR)
 *   • editora original (E)
 *   • subeditoras (SE / SA)
 *
 * AM.MR = soma dos PR% de todos os participantes controlados DO LINK.
 * OWR (não controlado) NÃO entra nessa soma.
 * Fonte: calcularMrAM(). NUNCA usar o valor bruto SPT do CWR.
 *
 * ═══════════════════════════════════════════════════════
 * REGRA 2 — LINKS (separação de chains editoriais)
 * ═══════════════════════════════════════════════════════
 * • SWR (controlado): entra no link definido por seu PWR correspondente.
 * • OWR (não controlado): ganha link exclusivo após os links PWR.
 * • E e AM: entram no mesmo link do SWR a que pertencem (via PWR / pubIpToLinkNum).
 * • OWR nunca compartilha link com SWR controlado.
 * • OWR não entra no cálculo de totalControlledPr da AM.
 * Implementação: integrar/route.ts (pubIpToLinkNums + occurrence counter).
 *
 * ════════════════════════════════════════════════════════
 * REGRA 3 — CHECKLIST SWI (validação para exportação)
 * ════════════════════════════════════════════════════════
 * ADM_MR_COLLECT: lê percentual_fonomecanico da AM (deve ser = totalControlledPr).
 * Se ADM_MR_COLLECT = 0 → item pendente.
 * Autores e E não entram nessa validação como coletores de MR.
 *
 * ══════════════════════════════════════════════════════════════════════
 * REGRA 4 — ANALÍTICO (divisão econômica interna do link)
 * ══════════════════════════════════════════════════════════════════════
 * Usado na aba Integrantes (modo Analítico), conta corrente e financeiro.
 *
 * Fórmula: percentual_analitico = (PR_participante / soma_PR_ctrl_do_link) × 100
 *
 * Regras:
 * • Somente participantes com status_controle = 'controlado' recebem %.
 * • Não-controlados (OWR / nao_controlado) → exibem — (não participam).
 * • Cada link controlado fecha exatamente 100%.
 * • Valor NÃO é armazenado no banco — calculado em runtime (frontend / financeiro).
 * • O Sintético (percentual_fonomecanico/sincronizacao da AM) é o que vai para
 *   CWR, SWI, BackOffice e integrações com sociedades.
 *
 * Exemplo "A CASA" — Link 1 (controlado, PR total = 50):
 *   Roberto (CA) 37,5  → 37,5/50×100 = 75%
 *   Lojas Mil (E) 7,5  → 7,5/50×100  = 15%
 *   Top Show (AM) 5    → 5/50×100    = 10%
 *   José Lazaro (OWR, link separado) → —
 */

/**
 * Roles que NUNCA devem ter percentual_fonomecanico > 0.
 * Inclui variantes CWR brutos, nomes normalizados internos e nomes display.
 */
export const ROLES_MR_ZERO = new Set([
  // Autores — roles internos normalizados
  'CA', 'C', 'CE', 'A', 'T', 'V', 'AD', 'I',
  // Autores — records CWR brutos
  'SWR', 'OWR', 'PWR',
  // Editoras que não coletam MR diretamente — códigos CWR/DB
  'E', 'SE', 'SA',
  // Editoras que não coletam MR diretamente — nomes normalizados (popular-links/confirmar)
  'editora_original', 'subeditora',
  // Autores — nomes normalizados pelo mapPapelAutor
  'compositor', 'autor', 'versionista', 'adaptador', 'interprete_referencia',
])

/**
 * Roles que representam autores não controlados (OWR).
 * Esses participantes recebem link exclusivo e não entram em totalControlledPr.
 */
export const ROLES_NAO_CONTROLADO = new Set([
  'OWR',
])

/**
 * Verifica se um papel (funcao_no_link) deve ter MR = 0.
 * Usar em qualquer ponto do sistema que grave percentual_fonomecanico.
 */
export function deveZerarMR(papel: string): boolean {
  return ROLES_MR_ZERO.has(papel?.toUpperCase().trim() ?? '')
}

/**
 * Calcula o MR que a AM deve receber para uma obra/link.
 * = soma dos PR% de todos os participantes controlados do link.
 * OWR (controlled=false) é excluído automaticamente.
 * NUNCA usar o valor bruto SPT/MR do snapshot CWR.
 */
export function calcularMrAM(
  partics: Array<{ pr_pct: number; controlled: boolean }>
): number {
  return partics
    .filter(p => p.controlled)
    .reduce((sum, p) => sum + p.pr_pct, 0)
}

/**
 * Calcula o percentual analítico de um participante dentro de um link.
 * Implementa REGRA 4: (PR_participante / soma_PR_controlados_do_link) × 100.
 * Retorna 0 se o denominador for zero (link sem controlados).
 *
 * Uso: frontend (modo Analítico da aba Integrantes), conta corrente, financeiro.
 * NÃO armazenar no banco — calculado em runtime.
 */
export function calcularAnaliticoPct(
  prParticipante: number,
  somaPrControladosDoLink: number
): number {
  if (somaPrControladosDoLink <= 0) return 0
  return (prParticipante / somaPrControladosDoLink) * 100
}

// ═══════════════════════════════════════════════════════════════════
// CONCENTRAÇÃO SINTÉTICA POR LINK — reutilizável (CWR, contrato, manual)
// ═══════════════════════════════════════════════════════════════════

export interface ParticipacaoConcentracao {
  link_number: number   // número do link (já normalizado: ?? 1 antes de chamar)
  papel: string         // funcao_no_link: 'AM', 'E', 'CA', 'OWR', etc.
  pr_pct: number        // percentual_exec_publica (participação individual)
  mr_pct?: number       // MR bruto do CWR — fallback quando não concentrador; default 0
  sr_pct?: number       // SR bruto do CWR — fallback quando não concentrador; default 0
  controlled: boolean   // status_controle === 'controlado'
}

export interface ResultadoConcentracao {
  mr_gravado: number      // → pct_repr_fonomecanica + percentual_fonomecanico
  sr_gravado: number      // → pct_inclusao_audiovisual + percentual_sincronizacao
  ehConcentrador: boolean // AM, ou E quando não há AM no link
}

/**
 * Calcula a concentração sintética para todos os participantes de uma obra.
 *
 * EXTRAÇÃO EXATA do bloco inline do integrar/route.ts (linhas 929–966 originais).
 * Lógica bit-a-bit idêntica — refactor de extração, não reescrita.
 *
 * Regras (ver §REGRA 1 e §REGRA 2 acima):
 *   brutoPorLink = Σ pr_pct de TODOS os participantes do link (sem filtro controlled)
 *   Concentrador = AM se houver no link; senão E
 *   Concentrador: mr_gravado = brutoPorLink; demais: 0 via deveZerarMR
 *
 * Retorna array PARALELO a `partics` (índice 1:1 — mesma ordem, mesmo length).
 */
export function calcularConcentracaoLink(
  partics: ParticipacaoConcentracao[]
): ResultadoConcentracao[] {
  // 1. brutoPorLink: soma de TODOS os pr_pct por link_number (sem filtro)
  const brutoPorLink = new Map<number, number>()
  for (const p of partics) {
    brutoPorLink.set(p.link_number, (brutoPorLink.get(p.link_number) ?? 0) + p.pr_pct)
  }

  // 2. Por participante — lógica exata extraída do integrar/route.ts
  return partics.map(p => {
    const total     = brutoPorLink.get(p.link_number) ?? 0
    const linkTemAM = partics.some(p2 => p2.link_number === p.link_number && p2.papel === 'AM')
    const ehConc    = p.papel === 'AM' || (!linkTemAM && p.papel === 'E')

    const mr_final   = (ehConc && total > 0) ? total : (p.mr_pct ?? 0)
    const mr_gravado = deveZerarMR(p.papel) && !ehConc ? 0 : mr_final
    const sr_final   = (ehConc && total > 0) ? total : (p.sr_pct ?? 0)
    const sr_gravado = deveZerarMR(p.papel) && !ehConc ? 0 : sr_final

    return { mr_gravado, sr_gravado, ehConcentrador: ehConc }
  })
}
