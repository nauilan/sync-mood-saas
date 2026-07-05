/**
 * Utilitário central de normalização e formatação de percentuais.
 *
 * Regra oficial do sistema:
 *   - Trabalha com 2 casas decimais.
 *   - Terceira casa 0,001–0,005 → arredonda para BAIXO.
 *   - Terceira casa 0,006–0,009 → arredonda para CIMA.
 *
 * Convenção do banco: percentuais gravados como inteiros (ex: 60 = 60%).
 * A divisão por 100 é feita nas libs de cálculo, nunca aqui.
 */

/**
 * Normaliza um percentual para 2 casas decimais seguindo a regra oficial.
 *
 * Diferente do Math.round padrão (que arredonda .005 para cima),
 * esta função trata .005 como lower-bound (arredonda para baixo).
 *
 * Exemplos:
 *   normalizarPercentual(10.001) → 10.00
 *   normalizarPercentual(10.005) → 10.00
 *   normalizarPercentual(10.006) → 10.01
 *   normalizarPercentual(10.009) → 10.01
 *   normalizarPercentual(50)     → 50.00
 *   normalizarPercentual(12.5)   → 12.50
 */
export function normalizarPercentual(n: number): number {
  if (!isFinite(n)) return 0
  // Usar representação string para evitar imprecisão de ponto flutuante.
  // Regra: 3ª casa 0–5 → arredonda para baixo; 6–9 → arredonda para cima.
  const fixed3 = n.toFixed(3)                // ex: "10.006", "50.000"
  const thirdDigit = parseInt(fixed3.slice(-1)) // dígito da 3ª casa decimal
  const base = parseFloat(fixed3.slice(0, -1))  // valor truncado em 2 casas
  const result = thirdDigit >= 6 ? base + 0.01 : base
  return parseFloat(result.toFixed(2))
}

/**
 * Formata um percentual para exibição no padrão brasileiro: "50,00%".
 *
 * @param n - Número percentual (inteiro ou decimal, ex: 50 ou 12.5)
 * @param sufixo - Se true (padrão), adiciona o símbolo "%"
 */
export function formatarPercentual(n: number | null | undefined, sufixo = true): string {
  const valor = normalizarPercentual(n ?? 0)
  const str = valor.toFixed(2).replace('.', ',')
  return sufixo ? `${str}%` : str
}

/**
 * Valida se um conjunto de percentuais soma exatamente 100,00%.
 *
 * Aceita percentuais como inteiros (ex: [60, 40]) ou decimais (ex: [12.5, 87.5]).
 * A soma é normalizada antes da comparação.
 *
 * @param percentuais - Array de números percentuais
 * @param tolerancia - Diferença máxima tolerada (padrão: 0.01 = um centésimo)
 * @returns { ok, soma, diferenca, residuo }
 */
export function validarSoma100(
  percentuais: number[],
  tolerancia = 0.01
): { ok: boolean; soma: number; diferenca: number; residuo: number } {
  // Soma bruta para evitar acumulação de erros de arredondamento
  const somaBruta = percentuais.reduce((acc, p) => acc + (p ?? 0), 0)
  const soma = normalizarPercentual(somaBruta)

  const diferenca = normalizarPercentual(Math.abs(soma - 100))
  const residuo = normalizarPercentual(100 - soma)

  return {
    ok: diferenca <= tolerancia,
    soma,
    diferenca,
    residuo,
  }
}

/**
 * Ajusta o último item de um array para que a soma feche exatamente 100,00%.
 * Útil quando o arredondamento gera diferença residual.
 *
 * @param percentuais - Array de percentuais (o último será ajustado)
 * @returns Novo array com o último item ajustado
 */
export function ajustarUltimoParaSomar100(percentuais: number[]): number[] {
  if (percentuais.length === 0) return []
  const semUltimo = percentuais.slice(0, -1)
  const somaAntes = semUltimo.reduce((acc, p) => normalizarPercentual(acc + normalizarPercentual(p)), 0)
  const ultimo = normalizarPercentual(100 - somaAntes)
  return [...semUltimo, ultimo]
}
