// ============================================================
// lib/cwr-to-obra.ts — Converte CwrObra[] → Obra[] + Titular[]
// Alimenta o store após importação de CWR
// ============================================================

import type { CwrObra, CwrTitular, CwrPapel } from './cwr-parser'
import type { Obra, ObraLink, ObraLinkTitular, PapelTitularLink } from './types-obras'

// ── Tipo Titular (simplificado para o store) ──────────────────────────────────

export interface TitularStore {
  id: string
  codigo: string
  nome: string
  nome_artistico?: string
  ipi?: string
  tipo: 'pessoa_fisica' | 'pessoa_juridica'
  papel_padrao: PapelTitularLink
  controlado: boolean
  status: 'ativo' | 'pendente'
  created_at: string
}

// ── Gravação extraída do CWR ──────────────────────────────────────────────────

export interface GravacaoStore {
  id: string
  obra_id: string
  obra_codigo: string
  titulo_fonograma: string
  interprete: string
  isrc?: string
  duracao?: number
  status: 'cadastrada'
  created_at: string
}

// ── Resultado da conversão ────────────────────────────────────────────────────

export interface CwrImportResult {
  obras: Obra[]
  titulares: TitularStore[]
  gravacoes: GravacaoStore[]
  stats: {
    obras_total: number
    obras_controladas: number
    titulares_novos: number
    titulares_nao_controlados: number
    gravacoes: number
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function slug(nome: string): string {
  return nome.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
}

// Mapeia CwrPapel → PapelTitularLink (tratando 'outro' como 'autor')
function toPapelLink(p: CwrPapel): PapelTitularLink {
  if (p === 'outro') return 'autor'
  return p
}

function isPessoaJuridica(papel: CwrPapel): boolean {
  return papel === 'editora_original' || papel === 'administradora' || papel === 'subeditora'
}

// ── Converter um CwrTitular → ObraLinkTitular ─────────────────────────────────

function toObraLinkTitular(t: CwrTitular, linkId: string): ObraLinkTitular {
  const pct = t.mr_pct > 0 ? t.mr_pct : t.pr_pct
  return {
    id: uid(),
    link_id: linkId,
    titular_id: t.ipi ? `tit-${slug(t.nome)}` : undefined,
    nome: t.nome,
    papel: toPapelLink(t.papel),
    percentual: pct,
    percentual_exec_publica: t.pr_pct || null,
    percentual_fonomecanico: t.mr_pct || null,
    ipi: t.ipi || null,
    controlado: t.controlado,
  }
}

// ── Agrupar titulares em links (cada link = 1 cadeia editorial) ───────────────
// Regra: titulares do mesmo "grupo de link" ficam juntos.
// No CWR, SPU → SWR/OWR formam um grupo. Simplificação: 1 grupo por obra.
// Se houver múltiplos SPU (múltiplas editoras), cada SPU + seus SWR = 1 link.

function buildLinks(obraId: string, titulares: CwrTitular[]): ObraLink[] {
  // Separar editoras (SPU/OPU) e autores (SWR/OWR)
  const editoras   = titulares.filter(t => t.tipo === 'SPU' || t.tipo === 'OPU')
  const autores    = titulares.filter(t => t.tipo === 'SWR' || t.tipo === 'OWR')

  if (editoras.length === 0) {
    // Sem editora: criar 1 link não controlado com todos os autores
    const linkId = uid()
    const totalPct = autores.reduce((s, a) => s + (a.mr_pct || a.pr_pct), 0)
    return [{
      id: linkId,
      obra_id: obraId,
      ordem: 1,
      descricao: 'Link sem editora (não controlado)',
      controlado: false,
      percentual_controlado: 0,
      titulares: autores.map(t => toObraLinkTitular(t, linkId)),
    }]
  }

  // Com editoras: agrupar autores por publisher_ipi quando disponível
  const links: ObraLink[] = []
  editoras.forEach((editora, idx) => {
    const linkId = uid()
    // Autores que referenciam esta editora via PWR, ou todos se não houver PWR
    const autoresDeste = autores.filter(a =>
      !a.publisher_ipi || a.publisher_ipi === editora.ipi
    )

    const membros: CwrTitular[] = [editora, ...autoresDeste]
    const totalPct = membros.reduce((s, m) => s + (m.mr_pct || m.pr_pct), 0)

    links.push({
      id: linkId,
      obra_id: obraId,
      ordem: idx + 1,
      descricao: `Link ${idx + 1} — ${editora.nome}`,
      controlado: editora.controlado,
      percentual_controlado: editora.controlado ? Math.min(100, Math.round(totalPct)) : 0,
      titulares: membros.map(t => toObraLinkTitular(t, linkId)),
    })
  })

  return links
}

// ── Converter CwrObra → Obra ──────────────────────────────────────────────────

function cwrObraToObra(cwr: CwrObra): Obra {
  const obraId = `obra-${slug(cwr.codigo || cwr.titulo)}-${uid()}`
  const links  = buildLinks(obraId, cwr.titulares)
  const pctControlado = links
    .filter(l => l.controlado)
    .reduce((s, l) => s + l.percentual_controlado, 0)

  return {
    id: obraId,
    codigo: cwr.codigo || `CWR-${uid()}`,
    titulo: cwr.titulo,
    titulo_original: cwr.titulo_alternativo || null,
    iswc: cwr.iswc || null,
    idioma: cwr.lang || 'PT',
    duracao: cwr.duracao_seg || null,
    status: 'ativa',
    observacoes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    _links: links,
    _links_count: links.length,
    _percentual_controlado: Math.min(100, pctControlado),
  }
}

// ── Extrair titulares únicos ──────────────────────────────────────────────────

function extractTitulares(obras: CwrObra[]): TitularStore[] {
  const map = new Map<string, TitularStore>()

  for (const obra of obras) {
    for (const t of obra.titulares) {
      const chave = t.ipi || slug(t.nome)
      if (map.has(chave)) continue

      map.set(chave, {
        id: `tit-${chave}`,
        codigo: `T${String(map.size + 1).padStart(4, '0')}`,
        nome: t.nome,
        ipi: t.ipi || undefined,
        tipo: isPessoaJuridica(t.papel) ? 'pessoa_juridica' : 'pessoa_fisica',
        papel_padrao: toPapelLink(t.papel),
        controlado: t.controlado,
        status: t.controlado ? 'ativo' : 'pendente',
        created_at: new Date().toISOString(),
      })
    }
  }

  return Array.from(map.values())
}

// ── Extrair gravações (PER records + info de duração) ────────────────────────

function extractGravacoes(obras: Obra[], cwrObras: CwrObra[]): GravacaoStore[] {
  return cwrObras
    .filter(cwr => cwr.duracao_seg > 0)
    .map(cwr => {
      const obra = obras.find(o => o.codigo === cwr.codigo)
      return {
        id: uid(),
        obra_id: obra?.id ?? '',
        obra_codigo: cwr.codigo,
        titulo_fonograma: cwr.titulo,
        interprete: '—',
        duracao: cwr.duracao_seg,
        status: 'cadastrada' as const,
        created_at: new Date().toISOString(),
      }
    })
    .filter(g => g.obra_id)
}

// ── Função principal ──────────────────────────────────────────────────────────

export function cwrToStore(cwrObras: CwrObra[]): CwrImportResult {
  const obras     = cwrObras.map(cwrObraToObra)
  const titulares = extractTitulares(cwrObras)
  const gravacoes = extractGravacoes(obras, cwrObras)

  return {
    obras,
    titulares,
    gravacoes,
    stats: {
      obras_total:                obras.length,
      obras_controladas:          obras.filter(o => (o._percentual_controlado ?? 0) > 0).length,
      titulares_novos:            titulares.filter(t => t.controlado).length,
      titulares_nao_controlados:  titulares.filter(t => !t.controlado).length,
      gravacoes:                  gravacoes.length,
    },
  }
}
