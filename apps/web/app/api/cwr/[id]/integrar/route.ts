/**
 * POST /api/cwr/[id]/integrar
 *
 * Integração completa do CWR ao banco editorial.
 *
 * Garantias:
 * 1. IDEMPOTÊNCIA
 *    - Titular dedup por IPI (prioridade) e por nome normalizado (fallback)
 *    - Re-execução deleta apenas participações e fonogramas criados por esta
 *      importação (IDs salvos em relatorio.integracao); titulares e editoras
 *      permanecem como dados de referência.
 *
 * 2. ROLLBACK
 *    - relatorio.integracao registra todos os IDs criados por esta execução.
 *    - Use DELETE /api/cwr/[id]/reverter para desfazer apenas esses registros.
 *
 * 3. ORIGEM
 *    - titulares criados recebem observacoes contendo o importacao_id.
 *
 * 4. STAGING DE TITULARES
 *    - cwr_importacoes_titulares registra cada titular (autor/editora) por obra,
 *      com match_status: encontrado | criado_pre_cadastro | conflito | ignorado.
 *    - Base da fila de revisão /master/titulares?status=pre_cadastro.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deveZerarMR, calcularMrAM } from '@/lib/backoffice-rules'
import { previewLinksFromSnapshot } from '@/lib/cwr-materialization'

// ── helpers ───────────────────────────────────────────────────────────────────

function sb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/[\uFEFF]/g, '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/[\uFEFF]/g, '').trim(),
    { auth: { persistSession: false } }
  )
}

async function getUser(req: NextRequest, importacaoId?: string) {
  const token = (req.headers.get('authorization') ?? '')
    .replace('Bearer ', '')
    .replace(/[\uFEFF\u200B]/g, '')
    .trim()

  const srvKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/[\uFEFF]/g, '').trim()

  // Admin bypass: service role key permite reintegração sem user JWT.
  // Usado pelo endpoint /api/admin/reintegrar-catalogo para mass reintegration.
  if (srvKey && token === srvKey && importacaoId) {
    const c = sb()
    const { data: imp } = await c
      .from('cwr_importacoes')
      .select('id, tenant_id')
      .eq('id', importacaoId)
      .single()
    if (!imp) return null
    const tenantId = (imp as any).tenant_id as string
    const { data: usr } = await c
      .from('usuarios')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1)
      .single()
    return { userId: ((usr as any)?.id as string) ?? 'admin', tenantId }
  }

  if (!token) return null
  const c = sb()
  const { data: { user } } = await c.auth.getUser(token)
  if (!user) return null
  const { data } = await c
    .from('usuarios')
    .select('id, tenant_id')
    .eq('auth_user_id', user.id)
    .single()
  return data ? { userId: data.id as string, tenantId: data.tenant_id as string } : null
}

/** Remove acentos, uppercase, colapsa espaços — chave de dedup por nome */
function normNome(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Chave única para um titular: IPI (se existir) > nome normalizado */
function chaveTitular(ipi: string | null | undefined, nome: string): string {
  const i = (ipi ?? '').replace(/\s/g, '').trim()
  return i.length > 0 ? `IPI:${i}` : `NOME:${normNome(nome)}`
}

/** Valores aceitos pelo enum funcao_no_link no Postgres */
const FUNCAO_ENUM_OK = new Set<string>(['CA','V','SA','E','AM','SE','C','CE','A','I','M','T','AD','H'])

/** Mapeia código CWR do escritor para valor válido do enum funcao_no_link */
function mapPapelAutor(p: string): string {
  const r = (p ?? '').toUpperCase().trim()
  if (FUNCAO_ENUM_OK.has(r)) return r
  if (r === 'AR' || r === 'AE') return 'AD' // Arranger / Author of Expl. Text
  if (r === 'ES')               return 'CA' // Composer sem letra → CA
  if (r === 'PA')               return 'A'  // Pseudonymous Author
  if (r === 'TR')               return 'T'  // Translator
  return 'CA'                               // fallback universal
}

/** Mapeia código CWR da editora para valor válido do enum funcao_no_link */
function mapPapelEditora(tipo: string, papel: string): string {
  const t = (tipo ?? papel ?? '').toUpperCase().trim()
  if (FUNCAO_ENUM_OK.has(t)) return t
  if (t === 'AQ')             return 'AM' // Acquirer → Administradora
  if (t === 'ES')             return 'SE' // Exclusive Subcollector → Subeditora
  return 'E'                              // fallback: Editora Original
}

async function deleteInChunks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  table: string,
  ids: string[],
  chunkSize = 200
) {
  for (let i = 0; i < ids.length; i += chunkSize) {
    await client.from(table).delete().in('id', ids.slice(i, i + chunkSize))
  }
}

// ── endpoint ──────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params            // params primeiro — necessário para admin bypass
  const usuario = await getUser(req, id)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const client = sb()

  // Filtro opcional: quando fornecido, reintegra apenas as obras especificadas
  // (sem afetar as demais obras da mesma importação)
  const body = await req.json().catch(() => ({}))
  const obraIdsFilter: string[] | null =
    Array.isArray(body.obra_ids) && body.obra_ids.length > 0 ? body.obra_ids : null

  // ── 0. Verificar importação ───────────────────────────────────────────────
  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('id, status, tenant_id, relatorio')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })
  // Modo unitário (obra_ids fornecido): permite reintegrar obras de importação já integrada
  const statusPermitidos = obraIdsFilter ? ['confirmado', 'integrado'] : ['confirmado']
  if (!statusPermitidos.includes(imp.status as string)) {
    return NextResponse.json(
      { error: 'A importação precisa estar confirmada antes de integrar.' },
      { status: 400 }
    )
  }

  // ── 1. Limpar execução anterior (idempotência) ────────────────────────────
  // Titulares e editoras NÃO são deletados — são dados de referência compartilhada.
  // Apenas participações e fonogramas criados por esta importação são refeitos.
  if (obraIdsFilter) {
    // Modo unitário: limpar apenas as obras especificadas
    const { data: linksToDelete } = await client
      .from('obras_links')
      .select('id')
      .eq('tenant_id', usuario.tenantId)
      .in('obra_id', obraIdsFilter)
    const linkIds = (linksToDelete ?? []).map((r: any) => r.id as string)

    const { data: partsToDelete } = await client
      .from('obras_links_titulares')
      .select('id')
      .in('obra_link_id', linkIds.length > 0 ? linkIds : ['_noop'])
    const partIds = (partsToDelete ?? []).map((r: any) => r.id as string)

    const { data: fgToDelete } = await client
      .from('fonogramas')
      .select('id')
      .eq('tenant_id', usuario.tenantId)
      .in('obra_id', obraIdsFilter)
    const fgIds = (fgToDelete ?? []).map((r: any) => r.id as string)

    if (partIds.length > 0) await deleteInChunks(client, 'obras_links_titulares', partIds)
    if (fgIds.length   > 0) await deleteInChunks(client, 'fonogramas', fgIds)
    if (linkIds.length > 0) await deleteInChunks(client, 'obras_links', linkIds)
  } else {
    // Modo completo: usar IDs salvos no relatório anterior
    const relAnterior = (imp.relatorio as Record<string, unknown>)?.integracao as Record<string, unknown> | undefined
    if (relAnterior) {
      const partIds = (relAnterior.participacoes_ids as string[]) ?? []
      const fgIds   = (relAnterior.fonogramas_criados_ids as string[]) ?? []
      if (partIds.length > 0) await deleteInChunks(client, 'obras_links_titulares', partIds)
      if (fgIds.length   > 0) await deleteInChunks(client, 'fonogramas', fgIds)
    }
  }

  // ── 2. Carregar snapshots ─────────────────────────────────────────────────
  let snapshotQuery = client
    .from('cwr_importacoes_obras')
    .select('id, obra_id, snapshot_cwr, created_at')
    .eq('importacao_id', id)
    .not('obra_id', 'is', null)
    .order('created_at', { ascending: false })

  if (obraIdsFilter) snapshotQuery = snapshotQuery.in('obra_id', obraIdsFilter)

  const { data: impObrasRaw } = await snapshotQuery

  if (!impObrasRaw?.length) {
    return NextResponse.json({ error: 'Nenhuma obra encontrada nesta importação.' }, { status: 404 })
  }

  // Deduplicar por obra_id — manter apenas o snapshot mais recente por obra.
  // Situação possível: reprocessar insere novo lote antes de deletar o antigo;
  // se o delete falhar silenciosamente ambos coexistem. Usar o mais novo garante
  // que a integração sempre usa os valores do último parser (ex: SPT correto).
  const seenObraIds = new Set<string>()
  const impObras = impObrasRaw.filter(r => {
    const oid = r.obra_id as string
    if (seenObraIds.has(oid)) return false
    seenObraIds.add(oid)
    return true
  })

  // Mapa obra_id → id da linha em cwr_importacoes_obras (para staging de titulares)
  const obraImportacaoIdMap: Record<string, string> = {}
  for (const r of impObras) {
    obraImportacaoIdMap[r.obra_id as string] = (r as any).id as string
  }

  // ── 3. Extrair autores, editoras, fonogramas dos snapshots ────────────────
  const autoresUnicos   = new Map<string, { nome: string; ipi: string | null; tipo: 'autor'; codigo_interno: string | null }>()
  const editorasUnicas  = new Map<string, { nome: string; ipi: string | null; controlled: boolean; tipo: 'editora' | 'editora_administrada'; codigo_interno: string | null }>()

  type PartObra = {
    chave: string; papel: string
    pr_pct: number; mr_pct: number; sr_pct: number
    controlled: boolean; obraId: string
    link_number: number  // derivado de pwr_links; fallback = 1 se sem PWR
  }
  const obraParticipacoes: PartObra[] = []

  // Staging: um registro por (titular × obra) para auditoria e fila de revisão
  type StagingEntry = {
    importacao_id:      string
    obra_importacao_id: string | null
    obra_id:            string
    chave:              string
    nome_cwr:           string
    ipi_cae:            string | null
    ip_name_number:     string | null
    papel_cwr:          string
    tipo_cwr:           string
    controlled:         boolean
    pr_pct:             number
    mr_pct:             number
    sr_pct:             number
    fonte_percentual:   string
    dados_raw:          Record<string, unknown>
  }
  const stagingEntries: StagingEntry[] = []

  // Contadores de categoria AM por obra
  let obrasSemAm           = 0   // Cenário A: sem administradora
  let obrasAmDefinido      = 0   // AM com percentual explícito no CWR
  let obrasAmPendente      = 0   // AM presente mas pct=0 e não é Cenário C
  let adminsPendentesCount = 0   // total de entradas AM pendentes
  type FgObra = { obraId: string; isrc: string | null; titulo: string; interprete: string | null; versao: string | null; ano: number | null; duracao: string | null }
  const obraFonogramas: FgObra[] = []

  // Mapa auxiliar para debug: obraId → titulo e data do snapshot usado
  const obraIdToTitulo:       Record<string, string> = {}
  const obraIdToSnapshotDate: Record<string, string> = {}

  for (const row of impObras) {
    const snap    = (row.snapshot_cwr ?? {}) as Record<string, unknown>
    const obraId  = row.obra_id as string
    const obraTit = (snap.titulo as string) ?? ''
    obraIdToTitulo[obraId]       = obraTit
    obraIdToSnapshotDate[obraId] = (row as any).created_at ?? ''

    // ── Fix 1: Mapear pwr_links → link_number por escritor e editora ─────────
    // Estratégia dupla:
    // A) lookup por IP Name Number (funciona quando SWR.ipi_nome == PWR.writer_ip)
    // B) lookup posicional (fallback robusto: Nth SWR controlado ↔ Nth PWR, por ordem no CWR)
    // OWR (não controlado) nunca tem PWR → ganha link próprio após os links PWR.
    const pwrLinks = (snap.pwr_links as any[]) ?? []
    // pubIpToLinkNums: mesmo publisher pode aparecer em N chains → N links distintos
    const pubIpToLinkNums = new Map<string, number[]>()   // ip → [link1, link2, ...]
    const wrtIpToLinkNum  = new Map<string, number>()
    let nextLinkNum = 1
    for (const pwr of pwrLinks) {
      const pubIp = ((pwr.publisher_ip as string | null) ?? '').replace(/\s/g, '').trim()
      const wrtIp = ((pwr.writer_ip   as string | null) ?? '').replace(/\s/g, '').trim()
      if (!pubIp) continue
      const existing  = pubIpToLinkNums.get(pubIp) ?? []
      const thisLink  = nextLinkNum++
      existing.push(thisLink)
      pubIpToLinkNums.set(pubIp, existing)
      if (wrtIp && !wrtIpToLinkNum.has(wrtIp)) {
        wrtIpToLinkNum.set(wrtIp, thisLink)
      }
    }

    // Mapa posicional: chave do autor → link_number via ordem de aparição no CWR.
    // Usado quando IP Name Numbers divergem entre SWR e PWR (CWRs com IDs inconsistentes).
    const wrtChaveToLinkNum = new Map<string, number>()
    const controlledAutors = ((snap.autores as any[]) ?? []).filter(
      (a: any) => (a.controlled as boolean | null) ?? false
    )
    const pwrsWithPub = pwrLinks.filter(
      (pwr: any) => !!((pwr.publisher_ip as string | null)?.trim())
    )
    // Positional fallback: Nth SWR controlado ↔ Nth PWR.
    // Quando mesmo publisher aparece em N chains (ex: P3 em 2 PWRs),
    // usa-se a Nth ocorrência de pubIp em pubIpToLinkNums para obter o link correto.
    const pubIpSeenForWriters = new Map<string, number>()
    for (let i = 0; i < Math.min(controlledAutors.length, pwrsWithPub.length); i++) {
      const swr = controlledAutors[i]
      const pwr = pwrsWithPub[i]
      const chave = chaveTitular(swr.ipi, swr.nome)
      const pubIp = ((pwr.publisher_ip as string | null) ?? '').replace(/\s/g, '').trim()
      const seen  = pubIpSeenForWriters.get(pubIp) ?? 0
      pubIpSeenForWriters.set(pubIp, seen + 1)
      const linksForPub = pubIpToLinkNums.get(pubIp) ?? []
      const linkNum = linksForPub[seen] ?? (i + 1)
      if (!wrtChaveToLinkNum.has(chave)) wrtChaveToLinkNum.set(chave, linkNum)
    }

    // owrNextLink: cada OWR recebe um link exclusivo após os links dos autores controlados.
    // CRITICAL: quando não há PWR records, nextLinkNum=1. Sem a proteção abaixo,
    // o OWR cai no Link 1 junto com os controlados — viola a separação obrigatória.
    // Regra: se há ao menos 1 autor controlado, OWR começa no mínimo no Link 2.
    const hasControlledAuthors = ((snap.autores as any[]) ?? []).some(
      (a: any) => (a.controlled as boolean | null) ?? false
    )
    let owrNextLink = hasControlledAuthors ? Math.max(nextLinkNum, 2) : nextLinkNum

    for (const a of ((snap.autores as any[]) ?? [])) {
      if (!(a.nome as string)?.trim()) continue
      const chave = chaveTitular(a.ipi, a.nome)
      if (!autoresUnicos.has(chave)) {
        const ciA = ((a.ipi_nome ?? '') as string).replace(/\s/g, '').trim()
        autoresUnicos.set(chave, { nome: (a.nome as string).trim(), ipi: a.ipi ?? null, tipo: 'autor', codigo_interno: ciA || null })
      }
      const isControlled = (a.controlled as boolean | null) ?? false
      const authorIpKey = ((a.ipi_nome ?? a.ipi ?? '') as string).replace(/\s/g, '').trim()
      const authorLinkNum = isControlled
        ? (wrtIpToLinkNum.get(authorIpKey) ?? wrtChaveToLinkNum.get(chave) ?? 1)
        : owrNextLink++
      obraParticipacoes.push({
        chave,
        papel:      mapPapelAutor(a.papel ?? ''),
        pr_pct:     Number(a.pr_pct)  || 0,
        mr_pct:     Number(a.mr_pct)  || 0,
        sr_pct:     Number(a.sr_pct)  || 0,
        controlled: isControlled,
        obraId,
        link_number: authorLinkNum,
      })
      // Registrar no staging (todos os autores, independente de pct)
      stagingEntries.push({
        importacao_id:      id,
        obra_importacao_id: obraImportacaoIdMap[obraId] ?? null,
        obra_id:            obraId,
        chave,
        nome_cwr:           (a.nome as string).trim(),
        ipi_cae:            (a.ipi as string | null) ?? null,
        ip_name_number:     (a as any).ip_name_number ?? null,
        papel_cwr:          (a.papel as string | null) ?? '',
        tipo_cwr:           'autor',
        controlled:         isControlled,
        pr_pct:             Number(a.pr_pct) || 0,
        mr_pct:             Number(a.mr_pct) || 0,
        sr_pct:             Number(a.sr_pct) || 0,
        fonte_percentual:   isControlled ? 'SWR' : 'OWR',
        dados_raw:          a as Record<string, unknown>,
      })
    }

    // ── Categorizar AMs desta obra ────────────────────────────────────────────
    // Cenário A: sem AM → integração normal, nenhuma pendência
    // Cenário B: E + AM com pct=0 → AM pendente (share por contrato)
    // Cenário C: AM e E são a mesma entidade (mesmo IPI/nome) → NÃO é pendência
    const editorasCwr: any[] = (snap.editoras as any[]) ?? []
    // Occurrence counter para publishers: quando mesmo IP aparece em N chains
    // cada ocorrência recebe o Nth link (mesmo comportamento do pubIpToLinkNums para autores)
    const pubIpSeenForEditoras = new Map<string, number>()

    const isPendingAm = (e: any): boolean => {
      if (mapPapelEditora(e.tipo ?? '', e.papel ?? '') !== 'AM') return false
      if ((Number(e.pr_pct)||0) > 0 || (Number(e.mr_pct)||0) > 0 || (Number(e.sr_pct)||0) > 0) return false
      const amIpi  = (e.ipi  as string | null)?.trim()
      const amNome = (e.nome as string | null)?.trim().toLowerCase()
      // Cenário C: mesma entidade aparece como E → não é administradora pendente
      return !editorasCwr.some((e2: any) => {
        if (mapPapelEditora(e2.tipo ?? '', e2.papel ?? '') !== 'E') return false
        if (amIpi && amIpi !== '' && (e2.ipi as string | null)?.trim() === amIpi) return true
        return Boolean(amNome && (e2.nome as string | null)?.trim().toLowerCase() === amNome)
      })
    }

    const temAm = editorasCwr.some((e: any) => mapPapelEditora(e.tipo ?? '', e.papel ?? '') === 'AM')
    const amsPendentesObra = editorasCwr.filter(isPendingAm)

    if (!temAm)                           obrasSemAm++
    else if (amsPendentesObra.length > 0) obrasAmPendente++
    else                                  obrasAmDefinido++
    adminsPendentesCount += amsPendentesObra.length

    for (const e of editorasCwr) {
      if (!(e.nome as string)?.trim()) continue
      const chave = chaveTitular(e.ipi, e.nome)
      const tipoEdit: 'editora' | 'editora_administrada' = e.controlled ? 'editora' : 'editora_administrada'
      if (!editorasUnicas.has(chave)) {
        const ciE = ((e.ip_name_no ?? '') as string).replace(/\s/g, '').trim()
        editorasUnicas.set(chave, { nome: (e.nome as string).trim(), ipi: e.ipi ?? null, controlled: e.controlled ?? false, tipo: tipoEdit, codigo_interno: ciE || null })
      }
      // Registrar no staging ANTES do filtro isPendingAm — captura todos os titulares do CWR
      stagingEntries.push({
        importacao_id:      id,
        obra_importacao_id: obraImportacaoIdMap[obraId] ?? null,
        obra_id:            obraId,
        chave,
        nome_cwr:           (e.nome as string).trim(),
        ipi_cae:            (e.ipi as string | null) ?? null,
        ip_name_number:     (e as any).ip_name_number ?? null,
        papel_cwr:          (e.papel as string | null) ?? (e.tipo as string | null) ?? '',
        tipo_cwr:           (e.tipo as string | null) ?? 'editora',
        controlled:         (e.controlled as boolean | null) ?? false,
        pr_pct:             Number(e.pr_pct) || 0,
        mr_pct:             Number(e.mr_pct) || 0,
        sr_pct:             Number(e.sr_pct) || 0,
        fonte_percentual:   (e as any).fonte_percentual ?? 'SPT',
        dados_raw:          e as Record<string, unknown>,
      })
      if (isPendingAm(e)) continue   // Cenário B sem pct: não criar participação editorial
      const pubIpKeyEd = ((e.ip_name_no ?? e.ipi ?? '') as string).replace(/\s/g,'').trim()
      const seenEd     = pubIpSeenForEditoras.get(pubIpKeyEd) ?? 0
      pubIpSeenForEditoras.set(pubIpKeyEd, seenEd + 1)
      const linksForEd = pubIpToLinkNums.get(pubIpKeyEd) ?? []
      const edLinkNum  = linksForEd[seenEd] ?? (seenEd + 1)
      obraParticipacoes.push({
        chave,
        papel:      mapPapelEditora(e.tipo ?? '', e.papel ?? ''),
        pr_pct:     Number(e.pr_pct) || 0,
        mr_pct:     Number(e.mr_pct) || 0,
        sr_pct:     Number(e.sr_pct) || 0,
        controlled: e.controlled ?? false,
        obraId,
        link_number: edLinkNum,
      })
    }

    for (const fg of ((snap.fonogramas as any[]) ?? [])) {
      if (!fg.isrc && !fg.titulo) continue
      obraFonogramas.push({
        obraId,
        isrc:       fg.isrc       ?? null,
        titulo:     fg.titulo     ?? obraTit,
        interprete: fg.interprete ?? null,
        versao:     fg.versao     ?? null,
        ano:        fg.ano        ?? null,
        duracao:    fg.duracao    ?? null,
      })
    }
  }

  // ── 4. Buscar TODOS os titulares do tenant (dedup IPI + nome) ─────────────
  const { data: todosExistentes } = await client
    .from('titulares')
    .select('id, ipi, nome_completo, tipo, codigo_interno')
    .eq('tenant_id', usuario.tenantId)
    .is('deleted_at', null)

  const { data: editorasExistentes } = await client
    .from('editoras')
    .select('id, codigo_ipi, nome_fantasia, razao_social, codigo_interno')
    .eq('tenant_id', usuario.tenantId)
    .is('deleted_at', null)

  const ipiToId:      Record<string, string> = {}
  const nomeNormToId: Record<string, string> = {}
  for (const t of (todosExistentes ?? [])) {
    if (t.ipi) ipiToId[t.ipi as string] = t.id as string
    const n = normNome(t.nome_completo as string)
    if (!nomeNormToId[n]) nomeNormToId[n] = t.id as string
  }

  const editoraIpiToId: Record<string, string> = {}
  const editoraNomeToId: Record<string, string> = {}
  for (const e of (editorasExistentes ?? [])) {
    const ipi = ((e.codigo_ipi as string | null) ?? '').replace(/\s/g, '').trim()
    if (ipi && !editoraIpiToId[ipi]) editoraIpiToId[ipi] = e.id as string
    const nomeFantasia = normNome((e.nome_fantasia as string | null) ?? '')
    const razaoSocial  = normNome((e.razao_social as string | null) ?? '')
    if (nomeFantasia && !editoraNomeToId[nomeFantasia]) editoraNomeToId[nomeFantasia] = e.id as string
    if (razaoSocial && !editoraNomeToId[razaoSocial]) editoraNomeToId[razaoSocial] = e.id as string
  }

  // A2 — Mapas por codigo_interno (Interested Party # estável)
  const codigoInternoToId: Record<string, string> = {}
  for (const t of (todosExistentes ?? [])) {
    const ci = ((t.codigo_interno as string | null) ?? '').trim()
    if (ci && !codigoInternoToId[ci]) codigoInternoToId[ci] = t.id as string
  }
  const editoraCodigoInternoToId: Record<string, string> = {}
  for (const e of (editorasExistentes ?? [])) {
    const ci = ((e.codigo_interno as string | null) ?? '').trim()
    if (ci && !editoraCodigoInternoToId[ci]) editoraCodigoInternoToId[ci] = e.id as string
  }

  // ── 5. Resolver chaves → IDs existentes ou marcar para criar ─────────────
  const chavesToCreate = new Map<string, { nome: string; ipi: string | null; tipo: 'autor' | 'editora' | 'editora_administrada'; codigo_interno?: string | null }>()
  const chaveToId: Record<string, string> = {}
  const conflitos: { tipo: string; descricao: string }[] = []

  // Rastreamento de matching para o staging de titulares
  const chaveMatchCriterio: Record<string, string> = {}
  const chaveMatchScore:    Record<string, number>  = {}

  function resolverChave(chave: string, info: { nome: string; ipi: string | null; tipo: 'autor' | 'editora' | 'editora_administrada'; codigo_interno?: string | null }) {
    // Nível 0 — Interested Party # (mais estável: não varia por pseudônimo)
    const ci = (info.codigo_interno ?? '').trim()
    const isEditora = info.tipo === 'editora' || info.tipo === 'editora_administrada'
    if (ci) {
      const idByCi = isEditora ? editoraCodigoInternoToId[ci] : codigoInternoToId[ci]
      if (idByCi) {
        chaveToId[chave]          = idByCi
        chaveMatchCriterio[chave] = 'codigo_interno'
        chaveMatchScore[chave]    = 100
        return
      }
    }
    if (info.ipi && ipiToId[info.ipi]) {
      chaveToId[chave]          = ipiToId[info.ipi]
      chaveMatchCriterio[chave] = 'ipi_cae'
      chaveMatchScore[chave]    = 100
      // Detectar divergência de nome (mesma entidade, nomes diferentes)
      const tExist = (todosExistentes ?? []).find(t => t.ipi === info.ipi)
      if (tExist && normNome(tExist.nome_completo as string) !== normNome(info.nome)) {
        conflitos.push({
          tipo:      'nome_divergente',
          descricao: `IPI ${info.ipi}: banco="${tExist.nome_completo}" | CWR="${info.nome}"`,
        })
      }
    } else {
      const nomeNorm = normNome(info.nome)
      if (nomeNormToId[nomeNorm]) {
        // Matching por nome — reutiliza titular existente sem criar novo
        chaveToId[chave]          = nomeNormToId[nomeNorm]
        chaveMatchCriterio[chave] = 'nome'
        chaveMatchScore[chave]    = 85
      } else {
        chavesToCreate.set(chave, info)
      }
    }
  }

  for (const [chave, info] of autoresUnicos)  resolverChave(chave, info)
  for (const [chave, info] of editorasUnicas) resolverChave(chave, info)

  // ── 6. Criar titulares ausentes em lote ───────────────────────────────────
  let titularesCriados     = 0
  const titularesCriadosIds: string[] = []

  if (chavesToCreate.size > 0) {
    // Usar o maior código CWR existente como base para evitar colisão de constraint
    const { data: maxCwrRow } = await client
      .from('titulares')
      .select('codigo_titular')
      .eq('tenant_id', usuario.tenantId)
      .like('codigo_titular', 'CWR%')
      .order('codigo_titular', { ascending: false })
      .limit(1)

    let seq = 1
    if (maxCwrRow && maxCwrRow.length > 0) {
      const lastCode = (maxCwrRow[0].codigo_titular as string) ?? ''
      const lastNum  = parseInt(lastCode.replace(/^CWR0*/, '') || '0', 10)
      if (!isNaN(lastNum)) seq = lastNum + 1
    }
    const payloads:  Record<string, unknown>[] = []
    const chaveKeys: string[]                  = []

    for (const [chave, info] of chavesToCreate) {
      const isEdit = info.tipo === 'editora' || info.tipo === 'editora_administrada'
      payloads.push({
        tenant_id:      usuario.tenantId,
        codigo_titular: `CWR${String(seq).padStart(5, '0')}`,
        codigo_interno: info.codigo_interno?.trim() || `CWR${String(seq).padStart(5, '0')}`,
        tipo:           (info.tipo === 'editora_administrada' ? 'editora' : info.tipo) as string,
        pessoa:         isEdit ? 'PJ' : 'PF',
        nome_completo:  info.nome,
        ipi:            info.ipi ?? null,
        codigo_ipi:     info.ipi ?? null,
        status:            'pre_cadastro',
        origem_importacao: 'cwr',
        importacao_id:     id,
        observacoes:       `Criado via importação CWR ${id}`,
      })
      chaveKeys.push(chave)
      seq++
    }

    const CHUNK = 200
    for (let i = 0; i < payloads.length; i += CHUNK) {
      const chunk       = payloads.slice(i, i + CHUNK)
      const chunkChaves = chaveKeys.slice(i, i + CHUNK)
      const { data: criados, error: titErr } = await client
        .from('titulares')
        .upsert(chunk, { onConflict: 'tenant_id,codigo_titular', ignoreDuplicates: true })
        .select('id, ipi, nome_completo')
      if (titErr) {
        return NextResponse.json({
          ok: false, debug: 'titulares_insert_erro',
          error: titErr.message, code: titErr.code,
          amostra: chunk[0],
        }, { status: 500 })
      }

      if (criados) {
        titularesCriados += criados.length
        for (let j = 0; j < criados.length; j++) {
          chaveToId[chunkChaves[j]] = criados[j].id as string
          titularesCriadosIds.push(criados[j].id as string)
          // Registrar critério para o staging
          chaveMatchCriterio[chunkChaves[j]] = 'nome'
          chaveMatchScore[chunkChaves[j]]    = 0
          // Atualizar mapa de nomes para evitar duplicatas nos próximos lotes
          const n = normNome(criados[j].nome_completo as string)
          if (!nomeNormToId[n]) nomeNormToId[n] = criados[j].id as string
        }
      }
    }
  }

  const titularesVinculados = Object.keys(chaveToId).length - titularesCriados

  // ── 6b. Registrar staging cwr_importacoes_titulares ─────────────────────
  // Uma linha por (titular × obra) — base de auditoria e fila de revisão.
  let stagingEncontrados    = 0
  let stagingEmRevisao      = 0
  let stagingCriadosCount   = 0
  let stagingConflitosCount = 0
  let stagingIgnoradosCount = 0

  {
    // Deduplicar por (obra_id, chave, papel_cwr) — mesmo titular pode aparecer
    // múltiplas vezes no array se o CWR tiver registros duplicados.
    const stagingDedup = new Map<string, StagingEntry>()
    for (const s of stagingEntries) {
      const k = `${s.obra_id}|${s.chave}|${s.papel_cwr}`
      if (!stagingDedup.has(k)) stagingDedup.set(k, s)
    }
    const stagingUnique = [...stagingDedup.values()]

    const criadosSet = new Set(titularesCriadosIds)
    const stagingPayloads = stagingUnique.map(s => {
      const tid    = chaveToId[s.chave]
      const status = !tid
        ? 'ignorado'
        : criadosSet.has(tid)
          ? 'criado_pre_cadastro'
          : chaveMatchCriterio[s.chave] === 'nome'
            ? 'em_revisao'   // match por nome: requer revisão humana
            : 'encontrado'   // match por IPI: confiança máxima
      return {
        importacao_id:      s.importacao_id,
        obra_importacao_id: s.obra_importacao_id,
        obra_id:            s.obra_id,
        titular_id:         tid ?? null,
        nome_cwr:           s.nome_cwr,
        ipi_cae:            s.ipi_cae,
        ip_name_number:     s.ip_name_number,
        papel_cwr:          s.papel_cwr,
        tipo_cwr:           s.tipo_cwr,
        controlled:         s.controlled,
        pr_pct:             s.pr_pct,
        mr_pct:             s.mr_pct,
        sr_pct:             s.sr_pct,
        fonte_percentual:   s.fonte_percentual,
        match_status:       status,
        match_criterio:     chaveMatchCriterio[s.chave] ?? null,
        match_score:        chaveMatchScore[s.chave] ?? 0,
        dados_raw:          s.dados_raw,
      }
    })

    for (const s of stagingPayloads) {
      if      (s.match_status === 'encontrado')           stagingEncontrados++
      else if (s.match_status === 'em_revisao')           stagingEmRevisao++
      else if (s.match_status === 'criado_pre_cadastro')  stagingCriadosCount++
      else if (s.match_status === 'conflito')             stagingConflitosCount++
      else                                                stagingIgnoradosCount++
    }

    // Idempotência: apagar staging anterior desta importação antes de recriar
    const { error: delErr } = await client
      .from('cwr_importacoes_titulares')
      .delete()
      .eq('importacao_id', id)
    if (delErr) {
      return NextResponse.json({
        ok:    false,
        debug: 'staging_delete_erro',
        error: delErr.message,
        code:  delErr.code,
      }, { status: 500 })
    }

    const SCHUNK = 500
    for (let i = 0; i < stagingPayloads.length; i += SCHUNK) {
      const { error: stErr } = await client
        .from('cwr_importacoes_titulares')
        .insert(stagingPayloads.slice(i, i + SCHUNK))
      if (stErr) {
        // Falha no staging → retornar 500 com diagnóstico completo
        return NextResponse.json({
          ok:    false,
          debug: 'staging_titulares_insert_erro',
          error: stErr.message,
          code:  stErr.code,
          detalhe: stErr.details,
          hint:    (stErr as any).hint ?? null,
          chunk_index:     i,
          chunk_size:      SCHUNK,
          payload_amostra: stagingPayloads[i],   // primeiro item do chunk com erro
          staging_total:   stagingPayloads.length,
        }, { status: 500 })
      }
    }
  }

  // ── 7. Garantir obras_links e inserir obras_links_titulares ───────────────
  let participacoesGravadas = 0
  const participacoesIds: string[]  = []

  const obraIds = [...new Set(impObras.map(r => r.obra_id as string))]

  // ── Fix 1: Upsert obras_links por link distinto (pwr_links) ──────────────
  // Coletar todos os pares (obraId, link_number) distintos das participações.
  const CHUNK = 500
  const obraLinkCombos: { obraId: string; linkNum: number; percentualLink: number; tipoLink: 'controlado' | 'direto_sem_editora'; controlado: boolean }[] = []
  const seenObraLinks = new Set<string>()
  const obraLinkMeta = new Map<string, { percentualLink: number; tipoLink: 'controlado' | 'direto_sem_editora'; controlado: boolean }>()
  for (const row of impObras) {
    const obraId = row.obra_id as string
    const previewLinks = previewLinksFromSnapshot((row.snapshot_cwr ?? {}) as any)
    for (const previewLink of previewLinks) {
      obraLinkMeta.set(`${obraId}:${previewLink.numero_link}`, {
        percentualLink: previewLink.percentual_link,
        tipoLink: previewLink.tipo_link,
        controlado: previewLink.controlado,
      })
    }
  }
  for (const p of obraParticipacoes) {
    const k = `${p.obraId}:${p.link_number}`
    if (!seenObraLinks.has(k)) {
      seenObraLinks.add(k)
      const meta = obraLinkMeta.get(k)
      obraLinkCombos.push({
        obraId: p.obraId,
        linkNum: p.link_number,
        percentualLink: meta?.percentualLink ?? 0,
        tipoLink: meta?.tipoLink ?? (p.controlled ? 'controlado' : 'direto_sem_editora'),
        controlado: meta?.controlado ?? p.controlled,
      })
    }
  }
  // Garantir pelo menos LINK 1 para obras sem pwr_links
  for (const obraId of obraIds) {
    const k = `${obraId}:1`
    if (!seenObraLinks.has(k)) {
      seenObraLinks.add(k)
      const meta = obraLinkMeta.get(k)
      obraLinkCombos.push({
        obraId,
        linkNum: 1,
        percentualLink: meta?.percentualLink ?? 0,
        tipoLink: meta?.tipoLink ?? 'controlado',
        controlado: meta?.controlado ?? true,
      })
    }
  }

  for (let i = 0; i < obraLinkCombos.length; i += CHUNK) {
    const { error: linkErr } = await client
      .from('obras_links')
      .upsert(
        obraLinkCombos.slice(i, i + CHUNK).map(({ obraId, linkNum, percentualLink, tipoLink, controlado }) => ({
          obra_id:         obraId,
          tenant_id:       usuario.tenantId,
          numero_link:     linkNum,
          percentual_link: percentualLink,
          tipo_link:       tipoLink,
          controlado,
          status:          'ativo',
        })),
        { onConflict: 'obra_id,numero_link', ignoreDuplicates: true }
      )
    if (linkErr) {
      return NextResponse.json({
        ok: false, debug: 'obras_links_upsert_erro',
        error: linkErr.message, code: linkErr.code,
      }, { status: 500 })
    }
  }

  // Carregar IDs dos links indexados por "obraId:linkNum"
  // IMPORTANTE: usar chunk pequeno (50 obras) para evitar truncamento silencioso do PostgREST.
  // Com CHUNK=500 obras × ~3 links cada = ~1500 linhas, acima do limite padrão de 1000 do PostgREST.
  // Com SELECT_CHUNK=50 obras × ~5 links = ~250 linhas por chamada — seguro em qualquer tier.
  const obraLinkNumToId: Record<string, string> = {}
  const obrasLinksIds: string[] = []
  const SELECT_CHUNK = 200  // 200 obras × ~4 links = ~800 linhas/query, abaixo do limite 1000 do PostgREST
  for (let i = 0; i < obraIds.length; i += SELECT_CHUNK) {
    const { data: lks } = await client
      .from('obras_links')
      .select('id, obra_id, numero_link')
      .in('obra_id', obraIds.slice(i, i + SELECT_CHUNK))
    for (const l of (lks ?? [])) {
      const key = `${l.obra_id}:${l.numero_link}`
      obraLinkNumToId[key] = l.id as string
      obrasLinksIds.push(l.id as string)
    }
  }

  // ── 7a. Limpar obras_links_titulares existentes (criados pelo confirmar com titular_id=null) ──
  // O confirmar cria registros placeholder. O integrar recria com IDs reais.
  // Deletar tudo por obra_id antes de recriar — evita conflito de constraint.
  const CLEAN_CHUNK = 200
  for (let i = 0; i < obraIds.length; i += CLEAN_CHUNK) {
    await client
      .from('obras_links_titulares')
      .delete()
      .in('obra_id', obraIds.slice(i, i + CLEAN_CHUNK))
  }

  // Agrupar participações por obra
  const partByObra = new Map<string, PartObra[]>()
  for (const p of obraParticipacoes) {
    if (!partByObra.has(p.obraId)) partByObra.set(p.obraId, [])
    partByObra.get(p.obraId)!.push(p)
  }

  // ── Regra BackOffice (ver lib/backoffice-rules.ts) ───────────────────────
  // Apenas AM coleta MR. Todos os demais ficam com MR=0.
  // IMPORTANTE: calcular totalControlledPr por LINK, não por obra —
  // quando a AM aparece em 2 links distintos, cada linha AM deve receber
  // apenas o percentual controlado DO SEU LINK (evita duplicação).

  const titPayloads: Record<string, unknown>[] = []
  for (const [obraId, partics] of partByObra) {

    // Agrupa participantes por link_number para calcular MR da AM por link
    const linkNums = [...new Set(partics.map(p => p.link_number ?? 1))]
    const mrAmPorLink = new Map<number, number>()
    for (const ln of linkNums) {
      const linkPartics = partics.filter(p => (p.link_number ?? 1) === ln)
      mrAmPorLink.set(ln, calcularMrAM(linkPartics))
    }

    for (const p of partics) {
      // Fix 1: resolver link correto via pwr_links; fallback = LINK 1
      const linkId =
        obraLinkNumToId[`${obraId}:${p.link_number}`] ??
        obraLinkNumToId[`${obraId}:1`]
      if (!linkId) continue

      const info = autoresUnicos.get(p.chave) ?? editorasUnicas.get(p.chave)
      const editoraFkId =
        p.papel === 'E' || p.papel === 'AM'
          ? (() => {
              const infoEditora = editorasUnicas.get(p.chave)
              const ipi = ((infoEditora?.ipi ?? '') as string).replace(/\s/g, '').trim()
              if (ipi && editoraIpiToId[ipi]) return editoraIpiToId[ipi]
              const nome = normNome(infoEditora?.nome ?? info?.nome ?? '')
              if (nome && editoraNomeToId[nome]) return editoraNomeToId[nome]
              return null
            })()
          : null

      // Regra BackOffice: concentrador do link (AM se houver; senão E) recebe MR/SR do link.
      // Todos os demais (autores controlados, OWR, E quando há AM) recebem 0.
      const totalControlledPr = mrAmPorLink.get(p.link_number ?? 1) ?? 0
      const linkTemAM = partics.some(
        p2 => (p2.link_number ?? 1) === (p.link_number ?? 1) && p2.papel === 'AM'
      )
      const ehConcentrador = p.papel === 'AM' || (!linkTemAM && p.papel === 'E')
      const mr_final   = (ehConcentrador && totalControlledPr > 0) ? totalControlledPr : (p.mr_pct ?? 0)
      const mr_gravado = deveZerarMR(p.papel) && !ehConcentrador ? 0 : mr_final
      const sr_gravado = ehConcentrador
        ? (totalControlledPr > 0 ? totalControlledPr : (p.sr_pct ?? 0))
        : 0

      titPayloads.push({
        obra_link_id:             linkId,
        obra_id:                  obraId,
        tenant_id:                usuario.tenantId,
        titular_id:               chaveToId[p.chave] ?? null,
        editora_id:               editoraFkId,
        editora_original_id:      p.papel === 'E' ? editoraFkId : null,
        editora_administradora_id:p.papel === 'AM' ? editoraFkId : null,
        nome:                     info?.nome ?? '',
        funcao_no_link:           p.papel,
        papel: ({
          E: 'editora_original',
          SE: 'subeditora', SA: 'subeditora',
          AM: 'administradora',
          CA: 'compositor', C: 'compositor', CE: 'compositor',
          A: 'autor', T: 'autor',
          V: 'versionista', AD: 'adaptador',
          I: 'interprete_referencia',
        } as Record<string, string>)[p.papel?.toUpperCase() ?? ''] ?? 'autor',
        percentual_exec_publica:  p.pr_pct  ?? 0,
        percentual_fonomecanico:  mr_gravado,
        percentual_sincronizacao: sr_gravado,
        ipi:                      info?.ipi ?? null,
        pwr_publisher_code:       info?.codigo_interno?.trim() ?? null,
        status_controle:          p.controlled ? 'controlado' : 'nao_controlado',
      })
    }
  }

  // ── debug: retornar se titPayloads vazio antes de tentar insert ──────────
  if (titPayloads.length === 0) {
    return NextResponse.json({
      ok: false,
      debug: 'titPayloads_vazio',
      obraParticipacoes_len: obraParticipacoes.length,
      obraIds_len: obraIds.length,
      chaveToId_len: Object.keys(chaveToId).length,
      partByObra_len: partByObra.size,
      obraIdToLinkId_len: Object.keys(obraLinkNumToId).length,
      titPayloads_len: 0,
    }, { status: 422 })
  }

  const emptyLinks = obraLinkCombos.filter(({ obraId, linkNum }) =>
    !titPayloads.some((payload) => payload.obra_id === obraId && payload.obra_link_id === obraLinkNumToId[`${obraId}:${linkNum}`])
  )
  if (emptyLinks.length > 0) {
    return NextResponse.json({
      ok: false,
      debug: 'link_sem_participantes_detectado',
      links_vazios: emptyLinks.slice(0, 20),
    }, { status: 422 })
  }

  // ── Validação anti-AM-zerado: abortar se qualquer AM chegou aqui com pct=0 ──
  // isPendingAm já deveria ter filtrado; se chegou com tudo zero é bug de pipeline.
  const amZerados = titPayloads.filter(p =>
    p.funcao_no_link === 'AM' &&
    (p.percentual_exec_publica  as number) === 0 &&
    (p.percentual_fonomecanico  as number) === 0 &&
    (p.percentual_sincronizacao as number) === 0
  )
  if (amZerados.length > 0) {
    return NextResponse.json({
      ok:    false,
      debug: 'am_zerado_detectado_pre_insert',
      total_am_zerados:    amZerados.length,
      snapshots_raw:       impObrasRaw.length,
      snapshots_apos_dedup: impObras.length,
      duplicatas_removidas: impObrasRaw.length - impObras.length,
      am_zerados_amostra: amZerados.slice(0, 20).map(p => ({
        obra_titulo:   obraIdToTitulo[p.obra_id as string] ?? '?',
        nome:          p.nome,
        funcao:        p.funcao_no_link,
        pr:            p.percentual_exec_publica,
        mr:            p.percentual_fonomecanico,
        snapshot_date: obraIdToSnapshotDate[p.obra_id as string] ?? '?',
      })),
    }, { status: 422 })
  }

  let insertError: string | null = null
  const TCHUNK = 500
  for (let i = 0; i < titPayloads.length; i += TCHUNK) {
    const { data: ins, error: insErr } = await client
      .from('obras_links_titulares')
      .insert(titPayloads.slice(i, i + TCHUNK))
      .select('id')
    if (insErr) {
      // Abortar imediatamente e retornar erro + amostra do payload
      return NextResponse.json({
        ok:    false,
        debug: 'obras_links_titulares_insert_erro',
        error: insErr.message,
        code:  insErr.code,
        detalhe: insErr.details,
        amostra: titPayloads[i],   // primeiro payload do chunk com erro
      }, { status: 500 })
    }
    if (ins) {
      participacoesGravadas += ins.length
      participacoesIds.push(...ins.map(x => x.id as string))
    }
  }

  // ── 8. Editoras reais (tabela editoras) ───────────────────────────────────
  let editorasCriadas = 0
  const editorasCriadasIds: string[] = []

  const edCtrl = [...editorasUnicas.entries()].filter(([, e]) => e.controlled)
  if (edCtrl.length > 0) {
    const ipisEd = edCtrl.map(([, e]) => e.ipi).filter(Boolean) as string[]
    const { data: edExist } = ipisEd.length
      ? await client.from('editoras').select('id, codigo_ipi').eq('tenant_id', usuario.tenantId).in('codigo_ipi', ipisEd)
      : { data: [] }

    const ipisEdExist = new Set((edExist ?? []).map(e => e.codigo_ipi as string))
    const novas = edCtrl.filter(([, e]) => !e.ipi || !ipisEdExist.has(e.ipi ?? ''))

    if (novas.length > 0) {
      const { data: edCriadas } = await client
        .from('editoras')
        .insert(novas.map(([, e]) => ({
          tenant_id:        usuario.tenantId,
          nome_fantasia:    e.nome,
          razao_social:     e.nome,
          codigo_ipi:       e.ipi ?? null,
          codigo_interno:   (e as any).ip_name_no?.trim() ?? null,
          tipo_editora:     'administrada',
          controlada:       true,
          status:           'ativo',
        })))
        .select('id')
      editorasCriadas = edCriadas?.length ?? 0
      editorasCriadasIds.push(...(edCriadas ?? []).map(e => e.id as string))
    }
  }

  // ── 9. Fonogramas (dedup ISRC + obra_id+titulo) ───────────────────────────
  let fonogramasCriados  = 0
  let fonogramasVinculados = 0
  const fonogramasCriadosIds: string[] = []

  if (obraFonogramas.length > 0) {
    const isrcs = obraFonogramas.map(f => f.isrc).filter(Boolean) as string[]

    const [resPorIsrc, resPorObra] = await Promise.all([
      isrcs.length
        ? client.from('fonogramas').select('id, isrc, obra_id, titulo_fonograma').eq('tenant_id', usuario.tenantId).in('isrc', isrcs)
        : Promise.resolve({ data: [] as { id: unknown; isrc: unknown; obra_id: unknown; titulo_fonograma: unknown }[] }),
      client.from('fonogramas').select('id, isrc, obra_id, titulo_fonograma').eq('tenant_id', usuario.tenantId).in('obra_id', obraIds),
    ])

    const isrcExist       = new Set((resPorIsrc.data ?? []).map(f => f.isrc as string))
    const obraTituloExist = new Set(
      (resPorObra.data ?? []).map(f => `${f.obra_id}:${normNome(f.titulo_fonograma as string ?? '')}`)
    )
    fonogramasVinculados = isrcExist.size

    const novos = obraFonogramas.filter(f => {
      if (f.isrc && isrcExist.has(f.isrc)) return false
      if (!f.isrc) {
        if (obraTituloExist.has(`${f.obraId}:${normNome(f.titulo)}`)) return false
      }
      return true
    })

    const FCHUNK = 500
    for (let i = 0; i < novos.length; i += FCHUNK) {
      const { data: fgCriados, error: fgErr } = await client
        .from('fonogramas')
        .insert(novos.slice(i, i + FCHUNK).map(f => {
          // Converte HHMMSS → segundos; guard: 0 < resultado ≤ 3600 (músicas com mais de 1h = null)
          let duracaoSeg: number | null = null
          if (f.duracao && /^\d{6}$/.test(f.duracao)) {
            const total = parseInt(f.duracao.slice(0,2),10)*3600 + parseInt(f.duracao.slice(2,4),10)*60 + parseInt(f.duracao.slice(4,6),10)
            if (total > 0 && total <= 3600) duracaoSeg = total
          }
          return {
            obra_id:           f.obraId,
            tenant_id:         usuario.tenantId,
            isrc:              f.isrc         ?? null,
            titulo_fonograma:  f.titulo       ?? '',
            interprete:        f.interprete   ?? null,
            versao:            f.versao       ?? 'original',
            ano_gravacao:      f.ano          ?? null,
            duracao_segundos:  duracaoSeg,
          }
        }))
        .select('id')
      if (fgErr) {
        return NextResponse.json({
          ok: false, debug: 'fonogramas_insert_erro',
          error: fgErr.message, code: fgErr.code,
          amostra: novos[i],
        }, { status: 500 })
      }
      if (fgCriados) {
        fonogramasCriados += fgCriados.length
        fonogramasCriadosIds.push(...fgCriados.map(x => x.id as string))
      }
    }
  }

  // ── 10. Gravar relatorio.integracao (rollback + auditoria) ────────────────
  const integracao = {
    executado_em:          new Date().toISOString(),
    titulares_criados_ids: titularesCriadosIds,
    editoras_criadas_ids:  editorasCriadasIds,
    obras_links_ids:       obrasLinksIds,
    participacoes_ids:     participacoesIds,
    fonogramas_criados_ids: fonogramasCriadosIds,
  }
  const relAtual = (imp.relatorio as Record<string, unknown>) ?? {}
  await client
    .from('cwr_importacoes')
    .update({ relatorio: { ...relAtual, integracao }, updated_at: new Date().toISOString() })
    .eq('id', id)

  // ── 10b. Promover status das obras integradas para 'ativa' + marcar sem contrato ──
  if (obraIds.length > 0) {
    const CHUNK = 200
    for (let i = 0; i < obraIds.length; i += CHUNK) {
      // Promover para 'ativa'
      await client
        .from('obras')
        .update({ status: 'ativa', updated_at: new Date().toISOString() })
        .in('id', obraIds.slice(i, i + CHUNK))
        .eq('status', 'pre_cadastro')
      // Migration 060: obras CWR sem contrato sistema ficam bloqueadas para exportação
      await client
        .from('obras')
        .update({
          status_contrato:          'sem_contrato',
          exportacao_bloqueada:     true,
          exportacao_bloqueio_motivo: 'Obra importada via CWR sem contrato anexado — anexe o contrato na aba Contratos da obra',
          updated_at:               new Date().toISOString(),
        })
        .in('id', obraIds.slice(i, i + CHUNK))
        .is('contrato_origem_id', null)  // somente as sem contrato sistema
    }
  }

  // ── 11. Resposta ──────────────────────────────────────────────────────────
  return NextResponse.json({
    ok:                     true,
    obras_integradas:       impObras.length,
    titulares_criados:      titularesCriados,
    titulares_vinculados:   titularesVinculados,
    staging_titulares: {
      total:                stagingEntries.length,
      encontrados:          stagingEncontrados,
      em_revisao:           stagingEmRevisao,
      criados_pre_cadastro: stagingCriadosCount,
      conflitos:            stagingConflitosCount,
      ignorados:            stagingIgnoradosCount,
    },
    _debug: {
      snapshots_raw:         impObrasRaw.length,
      snapshots_dedup:       impObras.length,
      duplicatas_removidas:  impObrasRaw.length - impObras.length,
      obraParticipacoes_len: obraParticipacoes.length,
      titPayloads_len:       titPayloads.length,
      obraIdToLinkId_len:    Object.keys(obraLinkNumToId).length,
      insert_error:          insertError,
    },
    editoras_criadas:          editorasCriadas,
    participacoes_gravadas:    participacoesGravadas,
    fonogramas_criados:        fonogramasCriados,
    fonogramas_vinculados:     fonogramasVinculados,
    obras_sem_am:              obrasSemAm,
    obras_am_definido:         obrasAmDefinido,
    obras_am_pendente:         obrasAmPendente,
    administradoras_pendentes: adminsPendentesCount,
    conflitos:                 conflitos.length,
    conflitos_detalhe:         conflitos.slice(0, 50),
    rollback_disponivel:       true,
  })
}
