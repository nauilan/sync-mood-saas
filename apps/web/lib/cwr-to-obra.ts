/* eslint-disable */
// @ts-nocheck
// ============================================================
// lib/cwr-to-obra.ts — Converte CwrObra[] → Obra[] + Titular[]
// Alimenta o store após importação de CWR.
//
// REGRA DE CONTROLE EDITORIAL (seção 3 da especificação):
//   • AM da Top Show Music → controlado
//   • SPU com papel E de editora administrada cadastrada → controlado
//   • SPU com papel E de editora externa → não controlado
//   • OWR/OPU → nunca controlado
//   • SWR ligado via PWR a uma editora controlada → controlado
//   • SWR ligado a editora não controlada → não controlado
// ============================================================

import type { CwrObra, CwrTitular, CwrPapel } from './cwr-parser'
import type { Obra, ObraLink, ObraLinkTitular, PapelTitularLink, FonteControle } from './types-obras'

export interface EditoraControlada {
  /** Nome fantasia ou razão social (normalizado para comparação) */
  nome: string
  /** IPI da editora, se disponível */
  ipi?: string
  /** Submitter code/publisher code usado no CWR */
  publisher_cwr?: string
  /** Tipo: master (AM) | administrada (E controlada) | externa */
  tipo: 'master' | 'administrada' | 'externa'
  /** Se true, esta editora é controlada pelo tenant */
  controlada: boolean
}

/** Configuração passada ao converter CWR → store */
export interface CwrConvertConfig {
  /** Lista de editoras controladas do tenant. Se vazio, usa heurística padrão. */
  editoras_controladas?: EditoraControlada[]
}

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
  /** Código interno legado do titular (ex: HR01). Preservado do CWR. */
  codigo_interno_legado?: string
  /** Código do autor como aparece no CWR (sequence code) */
  codigo_sequence_cwr?: string
  origem_importacao: 'cwr'
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

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function toPapelLink(p: CwrPapel): PapelTitularLink {
  if (p === 'outro') return 'autor'
  return p
}

function isPessoaJuridica(papel: CwrPapel): boolean {
  return papel === 'editora_original' || papel === 'administradora' || papel === 'subeditora'
}

/** Deduplica lista de CwrTitular por IPI → submitter_code → sequence_code → nome */
function deduplicarTitulares(list: CwrTitular[]): CwrTitular[] {
  const seen = new Set<string>()
  return list.filter(t => {
    const key = t.ipi?.trim() || t.submitter_code?.trim() || t.sequence_code?.trim() || t.nome?.trim() || ''
    if (!key) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Regra de controle editorial ───────────────────────────────────────────────

/**
 * Verifica se um SPU (editora) é controlada, baseado no cadastro do tenant.
 * Regras (em ordem de prioridade):
 *   1. AM de qualquer editora cadastrada como master/administrada = controlada
 *   2. E de editora cadastrada como administrada = controlada
 *   3. E/AM de editora cadastrada como externa = NÃO controlada
 *   4. Sem cadastro e papel AM = controlada (heurística: AM sempre é da casa)
 *   5. Sem cadastro e papel E = NÃO controlada
 */
function isEditoraControlada(
  titular: CwrTitular,
  config: EditoraControlada[]
): boolean {
  if (titular.tipo === 'OPU') return false
  if (titular.tipo !== 'SPU') return false

  const nomeNorm = normalize(titular.nome)
  const papel = titular.papel_cwr.trim().toUpperCase()

  // Procurar match no cadastro de editoras
  const match = config.find(e => {
    if (e.ipi && e.ipi === titular.ipi) return true
    if (e.publisher_cwr && (
      e.publisher_cwr === titular.submitter_code ||
      e.publisher_cwr === titular.sequence_code
    )) return true
    // Match por nome (normalizado, partial)
    const enNorm = normalize(e.nome)
    return nomeNorm.includes(enNorm) || enNorm.includes(nomeNorm)
  })

  if (match) return match.controlada

  // Sem cadastro: heurística por papel
  // AM sem cadastro = controlada (provavelmente a própria editora master)
  // E/AQ sem cadastro = também controlada por padrão:
  // Motivo: o CWR importado É o catálogo do tenant — toda SPU é do grupo.
  // Editoras externas devem ser marcadas explicitamente no cadastro com tipo='externa'.
  if (papel === 'AM' || papel === 'E' || papel === 'AQ' || papel === 'SE') return true
  // Qualquer outro papel de SPU sem cadastro = controlado por precaução
  return true
}

// ── Converter um CwrTitular → ObraLinkTitular ─────────────────────────────────

function toObraLinkTitular(
  t: CwrTitular,
  linkId: string,
  fonteControle: FonteControle = 'cwr'
): ObraLinkTitular {
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
    // Rastreabilidade CWR
    writer_sequence_code: (t.tipo === 'SWR' || t.tipo === 'OWR') ? t.sequence_code : null,
    publisher_sequence_code: t.tipo === 'SPU' ? t.sequence_code : null,
    pwr_writer_code: t.publisher_seq ? t.publisher_seq : null,
    pwr_publisher_code: null,
    codigo_interno_legado_titular: t.submitter_code || t.sequence_code || null,
    fonte_controle: fonteControle,
  }
}

// ── Agrupar titulares em links ────────────────────────────────────────────────
// REGRA: 1 link por AUTOR (SWR/OWR).
// Cada link contém: o autor + a cadeia editorial dele (E + AM + SE).
// Exemplo esperado:
//   LINK 1 — ARIOSTO 37.5% + TOP SHOW AM 2.5% + EDI MUSIC E 10%
//   LINK 2 — LUAN    37.5% + TOP SHOW AM 2.5% + EDI MUSIC E 10%

function editoraMatch(autor: CwrTitular, editora: CwrTitular): boolean {
  if (autor.publisher_seq) {
    return (
      autor.publisher_seq === editora.submitter_code ||
      autor.publisher_seq === editora.sequence_code ||
      autor.publisher_seq.slice(0, 2) === editora.sequence_code
    )
  }
  if (autor.publisher_ipi && editora.ipi && autor.publisher_ipi === editora.ipi) return true
  return false
}

function buildLinks(
  obraId: string,
  titulares: CwrTitular[],
  _pwrLinks: import('./cwr-parser').CwrPwrLink[]
): ObraLink[] {
  const spusTodos = titulares.filter(t => t.tipo === 'SPU' || t.tipo === 'OPU')
  const autores   = titulares.filter(t => t.tipo === 'SWR' || t.tipo === 'OWR')

  // Mapa por código: mantém a ordem das instâncias do CWR (1ª instância para autor 1, 2ª para autor 2, etc.)
  const spusByCode = new Map<string, CwrTitular[]>()
  for (const spu of spusTodos) {
    const code = (spu.submitter_code || spu.sequence_code || '').trim()
    if (!code) continue
    const arr = spusByCode.get(code) ?? []; arr.push(spu); spusByCode.set(code, arr)
  }
  // Contador de uso por código: permite atribuir a i-ésima instância ao i-ésimo autor
  const spuUsed = new Map<string, number>()
  const nextSpu = (code: string): CwrTitular | undefined => {
    const list = spusByCode.get(code) ?? []; if (!list.length) return undefined
    const used = spuUsed.get(code) ?? 0
    const spu = list[Math.min(used, list.length - 1)]
    spuUsed.set(code, used + 1); return spu
  }

  // Lista de códigos únicos de AM e SE (mantendo ordem de aparição)
  const amCodes: string[] = []; const amSeen = new Set<string>()
  const seCodes: string[] = []; const seSeen = new Set<string>()
  for (const spu of spusTodos) {
    const p = spu.papel_cwr.trim().toUpperCase()
    const code = (spu.submitter_code || spu.sequence_code || '').trim()
    if (!code) continue
    if (p === 'AM' && !amSeen.has(code)) { amCodes.push(code); amSeen.add(code) }
    if (p === 'SE' && !seSeen.has(code)) { seCodes.push(code); seSeen.add(code) }
  }

  // Lista plana de editoras E/AQ para fallback (sem dedup — usa nextSpu internamente)
  const editorasETodos = spusTodos.filter(e => { const p = e.papel_cwr.trim().toUpperCase(); return p === 'E' || p === 'AQ' })

  // Sem autores e sem editoras → link vazio
  if (autores.length === 0 && spusTodos.length === 0) return []

  // Sem autores → 1 link só com editoras (deduplica para não repetir)
  if (autores.length === 0) {
    const spus = deduplicarTitulares(spusTodos)
    const linkId = uid()
    const pct = spus.filter(s => s.controlado).reduce((sum, s) => sum + (s.pr_pct || 0), 0)
    return [{ id: linkId, obra_id: obraId, ordem: 1, descricao: 'Link 1 (editoras)', controlado: spus.some(s => s.controlado), percentual_controlado: Math.min(100, Math.round(pct * 100) / 100), titulares: spus.map(s => toObraLinkTitular(s, linkId)) }]
  }

  // Sem editoras → 1 link por autor, não controlado
  if (spusTodos.length === 0) {
    return autores.map((autor, idx) => {
      const linkId = uid()
      return { id: linkId, obra_id: obraId, ordem: idx + 1, descricao: `Link ${idx + 1} — ${autor.nome}`, controlado: false, percentual_controlado: 0, titulares: [toObraLinkTitular(autor, linkId)] }
    })
  }

  // CASO PRINCIPAL: 1 link por autor, cada um com sua cadeia editorial
  // Cada SWR controlado consome a i-ésima instância do seu publisher (E, AM, SE)
  const links: ObraLink[] = []

  autores.forEach((autor, idx) => {
    const linkId = uid()
    const nomeAutor = autor.nome.split(' ').slice(0, 2).join(' ')

    // OWR = autor externo/não controlado. Nunca tem cadeia editorial.
    if (autor.tipo === 'OWR') {
      links.push({
        id: linkId,
        obra_id: obraId,
        ordem: idx + 1,
        descricao: `Link ${idx + 1} — ${nomeAutor} (externo)`,
        controlado: false,
        percentual_controlado: 0,
        titulares: [toObraLinkTitular(autor, linkId)],
      })
      return
    }

    // SWR: buscar a instância correta da editora E (via PWR + contador de uso)
    const pubCode = (autor.publisher_seq || '').trim()
    let editoraDoAutor: CwrTitular | undefined
    if (pubCode) {
      editoraDoAutor = nextSpu(pubCode)
      // fallback: matching por atributos se nextSpu não encontrou (publisher_seq não coincide com código)
      if (!editoraDoAutor) editoraDoAutor = editorasETodos.find(e => editoraMatch(autor, e))
    } else if (editorasETodos.length === 1) {
      editoraDoAutor = editorasETodos[0]
    }

    // AM e SE: i-ésima instância para cada código único
    const adminsDesta: CwrTitular[] = amCodes.map(c => nextSpu(c)!).filter(Boolean)
    const sesDesta:    CwrTitular[] = seCodes.map(c => nextSpu(c)!).filter(Boolean)

    // Montar membros: autor (primeiro) + editora E + AM + SE
    const membros: CwrTitular[] = [autor]
    if (editoraDoAutor) membros.push(editoraDoAutor)
    adminsDesta.forEach(am => { if (!membros.includes(am)) membros.push(am) })
    sesDesta.forEach(se => { if (!membros.includes(se)) membros.push(se) })

    // % controlado do link = soma de exec_pública (pr_pct) de todos membros controlados
    const pctControlado = membros
      .filter(m => m.controlado)
      .reduce((sum, m) => sum + (m.pr_pct || 0), 0)

    links.push({
      id: linkId,
      obra_id: obraId,
      ordem: idx + 1,
      descricao: `Link ${idx + 1} — ${nomeAutor}`,
      controlado: membros.some(m => m.controlado),
      percentual_controlado: Math.min(100, Math.round(pctControlado * 100) / 100),
      titulares: membros.map(t => toObraLinkTitular(t, linkId)),
    })
  })

  return links
}

// ── Aplicar regra de controle editorial nos titulares da obra ─────────────────

function aplicarControleEditorial(
  titulares: CwrTitular[],
  config: EditoraControlada[]
): void {
  // 1ª passagem: marcar editoras como controladas/não controladas
  for (const t of titulares) {
    if (t.tipo === 'SPU' || t.tipo === 'OPU') {
      t.controlado = isEditoraControlada(t, config)
    }
    if (t.tipo === 'OWR') {
      t.controlado = false
    }
  }

  // 2ª passagem: marcar SWR como controlados se a editora ligada via PWR é controlada
  for (const t of titulares) {
    if (t.tipo !== 'SWR') continue

    // Achar a editora ligada por PWR (publisher_seq ou publisher_ipi)
    const editoraLigada = titulares.find(e => {
      if (e.tipo !== 'SPU') return false
      if (t.publisher_seq && (
        t.publisher_seq === e.submitter_code ||
        t.publisher_seq === e.sequence_code ||
        t.publisher_seq.slice(0, 2) === e.sequence_code
      )) return true
      if (t.publisher_ipi && e.ipi && t.publisher_ipi === e.ipi) return true
      return false
    })

    if (editoraLigada) {
      t.controlado = editoraLigada.controlado
    } else {
      // Sem PWR: se há somente 1 editora controlada, SWR é controlado
      const editorasControladas = titulares.filter(e => e.tipo === 'SPU' && e.controlado)
      const editorasTotal = titulares.filter(e => e.tipo === 'SPU')
      t.controlado = editorasControladas.length > 0 && editorasTotal.length === 1
    }
  }
}

// ── Converter CwrObra → Obra ──────────────────────────────────────────────────

function cwrObraToObra(cwr: CwrObra, config: EditoraControlada[]): Obra {
  // Aplicar regra de controle editorial (modifica titulares in-place)
  aplicarControleEditorial(cwr.titulares, config)

  const obraId = `obra-${slug(cwr.codigo || cwr.titulo)}-${uid()}`
  const links  = buildLinks(obraId, cwr.titulares, cwr.pwr_links)

  // % controlado total da obra = soma de exec_pública (pr_pct) de TODOS os titulares controlados
  // (CA + E + AM juntos formam o percentual controlado; OWR nunca é controlado)
  const totalControlado = cwr.titulares
    .filter(t => t.controlado)
    .reduce((sum, t) => sum + (t.pr_pct || 0), 0)

  return {
    id: obraId,
    codigo: cwr.codigo || `CWR-${uid()}`,
    titulo: cwr.titulo,
    titulo_original: cwr.titulo_alternativo || null,
    // ISWC válido deve começar com T e ter ≥ 10 chars (T + 9 dígitos + check)
    iswc: (cwr.iswc && /^[Tt]\d{9,10}/.test(cwr.iswc.trim())) ? cwr.iswc.trim() : null,
    idioma: cwr.lang || 'PT',
    duracao: cwr.duracao_seg || null,
    status: 'ativa',
    observacoes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Rastreabilidade CWR / Legado
    codigo_interno_legado: cwr.codigo_interno_legado || cwr.codigo || null,
    codigo_obra_cwr_original: cwr.codigo || null,
    backoffice_status: 'nao_enviada',
    origem_importacao: 'cwr',
    _links: links,
    _links_count: links.length,
    _percentual_controlado: Math.min(100, Math.round(totalControlado * 100) / 100),
    // Intérpretes e ISRCs extraídos do CWR (PER + REC) — armazenados como metadata
    _performers: cwr.performers?.length ? cwr.performers.map(p => p.nome).join('; ') : undefined,
    _isrcs: cwr.fonogramas?.length ? cwr.fonogramas.map(f => f.isrc).join('; ') : undefined,
  }
}

// ── Extrair titulares únicos ──────────────────────────────────────────────────

function extractTitulares(obras: CwrObra[]): TitularStore[] {
  const map = new Map<string, TitularStore>()

  for (const obra of obras) {
    for (const t of obra.titulares) {
      const chave = t.ipi || slug(t.nome)
      if (map.has(chave)) {
        // Atualizar controlado se a nova ocorrência é mais favorável
        const existing = map.get(chave)!
        if (t.controlado && !existing.controlado) {
          existing.controlado = true
          existing.status = 'ativo'
        }
        continue
      }

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
        // Rastreabilidade
        codigo_interno_legado: t.submitter_code || undefined,
        codigo_sequence_cwr: t.sequence_code || undefined,
        origem_importacao: 'cwr',
      })
    }
  }

  return Array.from(map.values())
}

// ── Extrair gravações ─────────────────────────────────────────────────────────

function extractGravacoes(obras: Obra[], cwrObras: CwrObra[]): GravacaoStore[] {
  const result: GravacaoStore[] = []
  for (const cwr of cwrObras) {
    const obra = obras.find(o => o.codigo === cwr.codigo)
    if (!obra?.id) continue
    const performer = cwr.performers?.map(p => p.nome).join(' / ') || '—'
    // Se houver REC records com ISRC, criar uma entrada por ISRC
    if (cwr.fonogramas?.length) {
      for (const fono of cwr.fonogramas) {
        result.push({
          id: uid(),
          obra_id: obra.id,
          obra_codigo: cwr.codigo,
          titulo_fonograma: cwr.titulo,
          interprete: performer,
          isrc: fono.isrc || undefined,
          duracao: fono.duracao_seg ?? (cwr.duracao_seg > 0 ? cwr.duracao_seg : undefined),
          status: 'cadastrada' as const,
          created_at: new Date().toISOString(),
        })
      }
    } else if (cwr.duracao_seg > 0 || cwr.performers?.length) {
      // Fallback: sem REC, ao menos registrar com performer se houver
      result.push({
        id: uid(),
        obra_id: obra.id,
        obra_codigo: cwr.codigo,
        titulo_fonograma: cwr.titulo,
        interprete: performer,
        duracao: cwr.duracao_seg > 0 ? cwr.duracao_seg : undefined,
        status: 'cadastrada' as const,
        created_at: new Date().toISOString(),
      })
    }
  }
  return result
}

// ── Função principal ──────────────────────────────────────────────────────────

/**
 * Converte obras CWR parsed → store (Obra[], TitularStore[], GravacaoStore[]).
 *
 * @param cwrObras  Resultado do parseCwr()
 * @param config    Configuração de editoras controladas do tenant.
 *                  Se omitido, usa heurística padrão (AM = controlada).
 */
export function cwrToStore(
  cwrObras: CwrObra[],
  config: CwrConvertConfig = {}
): CwrImportResult {
  const editCtrl = config.editoras_controladas ?? []

  const obras     = cwrObras.map(cwr => cwrObraToObra(cwr, editCtrl))
  const titulares = extractTitulares(cwrObras)
  const gravacoes = extractGravacoes(obras, cwrObras)

  const obrasControladas = obras.filter(o => (o._percentual_controlado ?? 0) > 0)

  return {
    obras,
    titulares,
    gravacoes,
    stats: {
      obras_total: obras.length,
      obras_controladas: obrasControladas.length,
      titulares_novos: titulares.filter(t => t.controlado).length,
      titulares_nao_controlados: titulares.filter(t => !t.controlado).length,
      gravacoes: gravacoes.length,
    },
  }
}

// ── Utilitário: normalizar percentual controlado para distribuição ─────────────

/**
 * Dado um conjunto de titulares de uma obra, normaliza os percentuais
 * dos titulares CONTROLADOS para 100%, descartando os externos.
 * Útil para motor de distribuição.
 *
 * Exemplo: Autor 37.5% + Editora 10% + AM 2.5% (externo 50%) → normaliza para 75/20/5
 */
export function normalizarPercentualControlado(
  titulares: ObraLinkTitular[]
): Array<ObraLinkTitular & { percentual_normalizado: number }> {
  const controlados = titulares.filter(t => t.controlado)
  const totalCtrl   = controlados.reduce((sum, t) => sum + t.percentual, 0)
  if (totalCtrl === 0) return titulares.map(t => ({ ...t, percentual_normalizado: 0 }))
  return titulares.map(t => ({
    ...t,
    percentual_normalizado: t.controlado
      ? Math.round((t.percentual / totalCtrl) * 100000) / 1000
      : 0,
  }))
}
