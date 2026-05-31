// ============================================================
// lib/oni-csv-export.ts — Gerador do CSV de identificacao ONI
// Sync Mood Gestao Inteligente — M5 BackOffice
// Conforme PDF B-74: campos ONI_CODE, SUBMITTER_SONGCODE
// ============================================================

import type { ONIMatch } from './types-oni'

export interface CSVExportOptions {
  separator: ',' | ';'
  includeHeader: boolean
}

export const DEFAULT_CSV_OPTIONS: CSVExportOptions = {
  separator: ',',
  includeHeader: true,
}

/**
 * Escapa um campo CSV (envolve em aspas duplas se contiver o separador ou aspas).
 */
function escapeField(value: string, separator: string): string {
  if (value.includes(separator) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Gera o conteudo CSV de identificacao ONI a partir dos matches aprovados.
 * Formato: ONI_CODE,SUBMITTER_SONGCODE (conforme B-74)
 */
export function generateONICSV(
  matches: ONIMatch[],
  options: CSVExportOptions = DEFAULT_CSV_OPTIONS,
): string {
  const approved = matches.filter(
    m => m.status === 'aprovado' && m.obra_id !== null && m.submitter_songcode !== null,
  )

  const sep = options.separator
  const lines: string[] = []

  if (options.includeHeader) {
    lines.push(
      [escapeField('ONI_CODE', sep), escapeField('SUBMITTER_SONGCODE', sep)].join(sep),
    )
  }

  for (const match of approved) {
    lines.push(
      [
        escapeField(match.oni_code, sep),
        escapeField(match.submitter_songcode!, sep),
      ].join(sep),
    )
  }

  return lines.join('\n')
}

/**
 * Retorna preview das primeiras N linhas do CSV (string[]).
 */
export function previewONICSV(
  matches: ONIMatch[],
  options: CSVExportOptions = DEFAULT_CSV_OPTIONS,
  limit = 20,
): string[] {
  const csv = generateONICSV(matches, options)
  return csv.split('\n').slice(0, limit)
}

/**
 * Dispara o download do CSV no browser.
 */
export function downloadONICSV(
  matches: ONIMatch[],
  filename: string,
  options: CSVExportOptions = DEFAULT_CSV_OPTIONS,
): void {
  const content = generateONICSV(matches, options)
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
