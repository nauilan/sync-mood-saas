/**
 * REGRAS DEFINITIVAS BACKOFFICE — MR e LINKS
 *
 * Fonte de verdade para toda importação CWR, reintegração, checklist SWI e
 * futura exportação. Qualquer alteração aqui se propaga automaticamente para
 * integrar, confirmar, popular-links e UI.
 *
 * REGRA 1 — MR (Fono/Digital)
 * ─────────────────────────────
 * Somente a AM (administradora local) pode ter percentual_fonomecanico > 0.
 * Todos os demais recebem MR = 0:
 *   • autores controlados  (SWR / CA / C / CE)
 *   • autores não controlados (OWR)
 *   • editora original (E)
 *   • subeditoras (SE / SA)
 *
 * A AM recebe: soma dos PR% de todos os participantes controlled dessa obra.
 * OWR (não controlado) NÃO entra nessa soma.
 *
 * REGRA 2 — LINKS
 * ────────────────
 * • SWR (controlado): entra no link definido por seu PWR correspondente.
 * • OWR (não controlado): ganha link exclusivo após os links PWR.
 * • E e AM: entram no mesmo link do SWR a que pertencem (via PWR / pubIpToLinkNum).
 * • OWR nunca compartilha link com SWR controlado.
 * • OWR não entra no cálculo de totalControlledPr da AM.
 *
 * REGRA 3 — CHECKLIST SWI
 * ────────────────────────
 * ADM_MR_COLLECT: lê percentual_fonomecanico da AM (deve ser = totalControlledPr).
 * Se ADM_MR_COLLECT = 0 → item pendente.
 * Autores e E não entram nessa validação como coletores de MR.
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
 * Calcula o MR que a AM deve receber para uma obra.
 * = soma dos PR% de todos os participantes controlados.
 * OWR (controlled=false) é excluído automaticamente.
 */
export function calcularMrAM(
  partics: Array<{ pr_pct: number; controlled: boolean }>
): number {
  return partics
    .filter(p => p.controlled)
    .reduce((sum, p) => sum + p.pr_pct, 0)
}
