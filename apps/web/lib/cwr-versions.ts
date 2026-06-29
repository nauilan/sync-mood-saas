export const DEFAULT_CWR_VERSION = '2.1' as const
export const ALLOWED_CWR_VERSIONS = ['2.1', '2.2'] as const

export type CWRVersion = (typeof ALLOWED_CWR_VERSIONS)[number]

export function isCWRVersion(value: unknown): value is CWRVersion {
  return typeof value === 'string' && (ALLOWED_CWR_VERSIONS as readonly string[]).includes(value)
}

export function normalizeCWRVersion(value: unknown): CWRVersion {
  return isCWRVersion(value) ? value : DEFAULT_CWR_VERSION
}