import type { Obra } from './types-obras'

// Catalogo importado do CWR v2.1: CW260020TSL_189.V21
// 760 obras — Top Show Music Limitada - ME

export const MOCK_OBRAS: Obra[] = []
export function getObraById(id: string) {
  return MOCK_OBRAS.find(o => o.id === id) ?? null
}

export function getLinksById(obra_id: string) {
  return MOCK_OBRAS.find(o => o.id === obra_id)?._links ?? []
}

export function getFonogramasById(obra_id: string) {
  return MOCK_OBRAS.find(o => o.id === obra_id)?._fonogramas ?? []
}

export function calcularPercentualControlado(obra_id: string): number {
  const obra = MOCK_OBRAS.find(o => o.id === obra_id)
  if (!obra?._links) return 0
  return obra._percentual_controlado ?? 0
}

export const MOCK_OBRAS_LINKS: Record<string, import('./types-obras').ObraLink[]> =
  Object.fromEntries(MOCK_OBRAS.map(o => [o.id, o._links ?? []]))

export const MOCK_OBRAS_FONOGRAMAS: Record<string, import('./types-obras').Fonograma[]> =
  Object.fromEntries(MOCK_OBRAS.map(o => [o.id, o._fonogramas ?? []]))

export const KPI_OBRAS = {
  total: MOCK_OBRAS.length,
  ativas: MOCK_OBRAS.filter(o => o.status === 'ativa').length,
  pre_cadastro: MOCK_OBRAS.filter(o => o.status === 'pre_cadastro').length,
  sem_iswc: MOCK_OBRAS.filter(o => !o.iswc).length,
  com_fonograma: MOCK_OBRAS.filter(o => (o._fonogramas?.length ?? 0) > 0).length,
}

export default MOCK_OBRAS
