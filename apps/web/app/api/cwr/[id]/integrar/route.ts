/**
 * POST /api/cwr/[id]/integrar
 *
 * Integração completa do CWR ao banco editorial:
 * 1. Cria/vincula titulares (autores) reais na tabela `titulares`
 * 2. Cria/vincula titulares (editoras) reais na tabela `titulares`
 * 3. Atualiza obras_links_titulares com titular_id real
 * 4. Cria editoras reais na tabela `editoras` (controladas)
 * 5. Cria/corrige fonogramas com campos corretos
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── helpers ──────────────────────────────────────────────────────────────────

function sb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/[\uFEFF]/g, '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY  ?? '').replace(/[\uFEFF]/g, '').trim(),
    { auth: { persistSession: false } }
  )
}

async function getUser(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '')
    .replace('Bearer ', '')
    .replace(/[\uFEFF\u200B]/g, '')
    .trim()
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

/** Normaliza nome para matching: remove acentos, uppercase, colapsa espaços */
function normNome(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Chave única para um titular: IPI tem prioridade, senão nome normalizado */
function chaveTitular(ipi: string | null | undefined, nome: string): string {
  const i = (ipi ?? '').trim()
  return i.length > 0 ? `IPI:${i}` : `NOME:${normNome(nome)}`
}

function mapPapelAutor(p: string): string {
  const r = (p ?? '').toUpperCase().trim()
  if (r === 'CA' || r === 'C' || r === 'ES') return 'compositor'
  if (r === 'A'  || r === 'PA') return 'autor'
  if (r === 'AR' || r === 'AE') return 'arranjador'
  if (r === 'AD') return 'adaptador'
  return 'compositor'
}

function mapPapelEditora(tipo: string, papel: string): string {
  const t = (tipo ?? papel ?? '').toUpperCase().trim()
  if (t === 'SE') return 'subeditora'
  if (t === 'AM' || t === 'AQ') return 'administradora'
  return 'editora_original'
}

// ── endpoint ─────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  // ── 0. Verificar importação ─────────────────────────────────────────────
  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('id, status, tenant_id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })
  if (imp.status !== 'confirmado') {
    return NextResponse.json({ error: 'Importação precisa estar confirmada antes de integrar.' }, { status: 400 })
  }

  // ── 1. Carregar snapshots ────────────────────────────────────────────────
  const { data: impObras } = await client
    .from('cwr_importacoes_obras')
    .select('obra_id, snapshot_cwr')
    .eq('importacao_id', id)
    .not('obra_id', 'is', null)

  if (!impObras?.length) {
    return NextResponse.json({ error: 'Nenhuma obra encontrada nesta importação.' }, { status: 404 })
  }

  // ── 2. Deduplicate autores e editoras do snapshot ───────────────────────
  // autoresUnicos: chave → { nome, ipi, papel_cwr, tipo_pessoa }
  const autoresUnicos = new Map<string, { nome: string; ipi: string | null; tipo: 'autor' }>()
  const editorasUnicas = new Map<string, { nome: string; ipi: string | null; controlled: boolean; tipo: 'editora' | 'editora_administrada' }>()

  // por obra: chave → { papel, pr_pct, mr_pct, sr_pct, controlled, obraId }
  type PartObra = { chave: string; papel: string; pr_pct: number; mr_pct: number; sr_pct: number; controlled: boolean; obraId: string }
  const obraParticipacoes: PartObra[] = []
  const obraFonogramas: { obraId: string; isrc: string | null; titulo: string; interprete: string | null; versao: string | null; ano: number | null }[] = []

  for (const row of impObras) {
    const snap = (row.snapshot_cwr ?? {}) as Record<string, unknown>
    const obraId = row.obra_id as string
    const obraTitulo = (snap.titulo as string) ?? ''

    for (const a of ((snap.autores as any[]) ?? [])) {
      if (!(a.nome as string)?.trim()) continue
      const chave = chaveTitular(a.ipi, a.nome)
      if (!autoresUnicos.has(chave)) {
        autoresUnicos.set(chave, { nome: (a.nome as string).trim(), ipi: (a.ipi ?? null), tipo: 'autor' })
      }
      obraParticipacoes.push({
        chave,
        papel: mapPapelAutor(a.papel ?? ''),
        pr_pct: a.pr_pct ?? 0,
        mr_pct: a.mr_pct ?? 0,
        sr_pct: a.sr_pct ?? 0,
        controlled: a.controlled ?? false,
        obraId,
      })
    }

    for (const e of ((snap.editoras as any[]) ?? [])) {
      if (!(e.nome as string)?.trim()) continue
      const chave = chaveTitular(e.ipi, e.nome)
      const tipoEdit: 'editora' | 'editora_administrada' = e.controlled ? 'editora' : 'editora_administrada'
      if (!editorasUnicas.has(chave)) {
        editorasUnicas.set(chave, { nome: (e.nome as string).trim(), ipi: e.ipi ?? null, controlled: e.controlled ?? false, tipo: tipoEdit })
      }
      obraParticipacoes.push({
        chave,
        papel: mapPapelEditora(e.tipo ?? '', e.papel ?? ''),
        pr_pct: e.pr_pct ?? 0,
        mr_pct: e.mr_pct ?? 0,
        sr_pct: e.sr_pct ?? 0,
        controlled: e.controlled ?? false,
        obraId,
      })
    }

    for (const fg of ((snap.fonogramas as any[]) ?? [])) {
      if (!fg.isrc && !fg.titulo) continue
      obraFonogramas.push({
        obraId,
        isrc:      fg.isrc      ?? null,
        titulo:    fg.titulo    ?? obraTitulo,
        interprete: fg.interprete ?? null,
        versao:    fg.versao    ?? null,
        ano:       fg.ano       ?? null,
      })
    }
  }

  // ── 3. Buscar titulares já existentes no tenant ─────────────────────────
  const ipisAutores   = [...autoresUnicos.values()].map(a => a.ipi).filter(Boolean) as string[]
  const ipisEditoras  = [...editorasUnicas.values()].map(e => e.ipi).filter(Boolean) as string[]
  const todosIpis     = [...new Set([...ipisAutores, ...ipisEditoras])]

  // Buscar por IPI
  const { data: existentesPorIPI } = todosIpis.length
    ? await client.from('titulares').select('id, ipi, nome_completo, tipo').eq('tenant_id', usuario.tenantId).in('ipi', todosIpis)
    : { data: [] }

  const ipiToId: Record<string, string> = {}
  for (const t of (existentesPorIPI ?? [])) {
    if (t.ipi) ipiToId[t.ipi] = t.id as string
  }

  // ── 4. Determinar quais criar ────────────────────────────────────────────
  const chavesToCreate: Map<string, { nome: string; ipi: string | null; tipo: 'autor' | 'editora' | 'editora_administrada' }> = new Map()
  const chaveToId: Record<string, string> = {}

  for (const [chave, info] of autoresUnicos) {
    if (info.ipi && ipiToId[info.ipi]) {
      chaveToId[chave] = ipiToId[info.ipi]
    } else {
      chavesToCreate.set(chave, info)
    }
  }
  for (const [chave, info] of editorasUnicas) {
    if (info.ipi && ipiToId[info.ipi]) {
      chaveToId[chave] = ipiToId[info.ipi]
    } else {
      chavesToCreate.set(chave, info)
    }
  }

  // ── 5. Criar titulares em lote ────────────────────────────────────────────
  let titularesCriados = 0
  let titularesVinculados = Object.keys(chaveToId).length

  if (chavesToCreate.size > 0) {
    // Pegar contagem atual para gerar códigos
    const { count: totalAtual } = await client
      .from('titulares')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', usuario.tenantId)

    let seq = (totalAtual ?? 0) + 1
    const novosPayloads: Record<string, unknown>[] = []
    const novasChaves: string[] = []

    for (const [chave, info] of chavesToCreate) {
      const isEditora = info.tipo === 'editora' || info.tipo === 'editora_administrada'
      novosPayloads.push({
        tenant_id:      usuario.tenantId,
        codigo_titular: `CWR${String(seq).padStart(5, '0')}`,
        codigo_interno: `CWR${String(seq).padStart(5, '0')}`,
        tipo:           info.tipo,
        pessoa:         isEditora ? 'PJ' : 'PF',
        nome_completo:  info.nome,
        ipi:            info.ipi ?? null,
        codigo_ipi:     info.ipi ?? null,
        status:         'ativo',
      })
      novasChaves.push(chave)
      seq++
    }

    // Inserir em lotes de 200
    const CHUNK = 200
    for (let i = 0; i < novosPayloads.length; i += CHUNK) {
      const chunk    = novosPayloads.slice(i, i + CHUNK)
      const chunkKeys = novasChaves.slice(i, i + CHUNK)
      const { data: criados } = await client.from('titulares').insert(chunk).select('id, ipi, codigo_titular')
      if (criados) {
        titularesCriados += criados.length
        for (let j = 0; j < criados.length; j++) {
          chaveToId[chunkKeys[j]] = criados[j].id as string
        }
      }
    }
  }

  // ── 6. Atualizar obras_links_titulares com titular_id real ───────────────
  let participacoesAtualizadas = 0

  // Buscar todos os links das obras desta importação
  const obraIds = [...new Set(impObras.map(r => r.obra_id as string))]
  const { data: linksExistentes } = await client
    .from('obras_links')
    .select('id, obra_id')
    .in('obra_id', obraIds)

  const obraIdToLinkId: Record<string, string> = {}
  for (const l of (linksExistentes ?? [])) {
    obraIdToLinkId[l.obra_id as string] = l.id as string
  }

  // Para cada participação, atualizar ou inserir
  // Agrupamos por obra para minimizar queries
  const obraParticByObra = new Map<string, PartObra[]>()
  for (const p of obraParticipacoes) {
    if (!obraParticByObra.has(p.obraId)) obraParticByObra.set(p.obraId, [])
    obraParticByObra.get(p.obraId)!.push(p)
  }

  // Deletar obras_links_titulares existentes sem titular_id vinculado (recriar limpos)
  if (obraIds.length > 0) {
    await client
      .from('obras_links_titulares')
      .delete()
      .in('obra_id', obraIds)
      .is('titular_id', null)
  }

  // Recriar obras_links e obras_links_titulares com titular_id real
  // Garantir que obras_links exista para cada obra
  const obrasSemLink = obraIds.filter(oid => !obraIdToLinkId[oid])
  if (obrasSemLink.length > 0) {
    const { data: novosLinks } = await client
      .from('obras_links')
      .insert(obrasSemLink.map(oid => ({
        obra_id: oid, tenant_id: usuario.tenantId,
        numero_link: 1, percentual_link: 100,
        tipo_link: 'coautoria', controlado: true, status: 'ativo',
      })))
      .select('id, obra_id')
    for (const l of (novosLinks ?? [])) obraIdToLinkId[l.obra_id as string] = l.id as string
  }

  const titularesPayloads: Record<string, unknown>[] = []
  for (const [obraId, partics] of obraParticByObra) {
    const linkId = obraIdToLinkId[obraId]
    if (!linkId) continue
    for (const p of partics) {
      const titularId = chaveToId[p.chave] ?? null
      titularesPayloads.push({
        obra_link_id:              linkId,
        obra_id:                   obraId,
        tenant_id:                 usuario.tenantId,
        titular_id:                titularId,
        nome:                      (autoresUnicos.get(p.chave) ?? editorasUnicas.get(p.chave))?.nome ?? '',
        papel:                     p.papel,
        funcao_no_link:            p.papel,
        percentual_exec_publica:   p.pr_pct,
        percentual_fonomecanico:   p.mr_pct,
        percentual_sincronizacao:  p.sr_pct,
        controlado:                p.controlled,
        ipi:                       (autoresUnicos.get(p.chave) ?? editorasUnicas.get(p.chave))?.ipi ?? null,
        cae:                       (autoresUnicos.get(p.chave) ?? editorasUnicas.get(p.chave))?.ipi ?? null,
      })
    }
  }

  const TCHUNK = 500
  for (let i = 0; i < titularesPayloads.length; i += TCHUNK) {
    const { data: ins } = await client
      .from('obras_links_titulares')
      .insert(titularesPayloads.slice(i, i + TCHUNK))
      .select('id')
    participacoesAtualizadas += (ins?.length ?? 0)
  }

  // ── 7. Criar editoras reais (controladas) na tabela `editoras` ──────────
  let editorasCriadas = 0
  const editorasControladas = [...editorasUnicas.entries()].filter(([, e]) => e.controlled)

  if (editorasControladas.length > 0) {
    const ipisEd = editorasControladas.map(([, e]) => e.ipi).filter(Boolean) as string[]
    const { data: edExistentes } = ipisEd.length
      ? await client.from('editoras').select('id, codigo_ipi').eq('tenant_id', usuario.tenantId).in('codigo_ipi', ipisEd)
      : { data: [] }

    const ipisEdExistentes = new Set((edExistentes ?? []).map(e => e.codigo_ipi as string))
    const novasEditoras = editorasControladas.filter(([, e]) => !e.ipi || !ipisEdExistentes.has(e.ipi ?? ''))

    if (novasEditoras.length > 0) {
      const edPayloads = novasEditoras.map(([, e]) => ({
        tenant_id:    usuario.tenantId,
        nome_fantasia: e.nome,
        razao_social:  e.nome,
        codigo_ipi:    e.ipi ?? null,
        tipo_editora:  'administrada',
        controlada:    true,
        status:        'ativo',
      }))
      const { data: edCriadas } = await client.from('editoras').insert(edPayloads).select('id')
      editorasCriadas = edCriadas?.length ?? 0
    }
  }

  // ── 8. Fonogramas: recriar com campos corretos ───────────────────────────
  let fonogramasCriados = 0
  let fonogramasJaExistiam = 0

  if (obraFonogramas.length > 0) {
    // Buscar ISRCs já existentes para este tenant
    const isrcs = obraFonogramas.map(f => f.isrc).filter(Boolean) as string[]
    const { data: fgExistentes } = isrcs.length
      ? await client.from('fonogramas').select('id, isrc, obra_id').eq('tenant_id', usuario.tenantId).in('isrc', isrcs)
      : { data: [] }

    const isrcExistente = new Set((fgExistentes ?? []).map(f => f.isrc as string))
    fonogramasJaExistiam = isrcExistente.size

    // Também deletar fonogramas antigos sem titulo_fonograma (criados com campo errado)
    await client
      .from('fonogramas')
      .delete()
      .in('obra_id', obraIds)
      .is('titulo_fonograma', null)

    const fgNovos = obraFonogramas.filter(f => !f.isrc || !isrcExistente.has(f.isrc))

    const fgPayloads = fgNovos.map(f => ({
      obra_id:         f.obraId,
      tenant_id:       usuario.tenantId,
      isrc:            f.isrc            ?? null,
      titulo_fonograma: f.titulo         ?? '',
      interprete:      f.interprete      ?? null,
      versao:          f.versao          ?? null,
      ano_gravacao:    f.ano             ?? null,
      status:          'ativo',
    }))

    const FCHUNK = 500
    for (let i = 0; i < fgPayloads.length; i += FCHUNK) {
      const { data: fgCriados } = await client.from('fonogramas').insert(fgPayloads.slice(i, i + FCHUNK)).select('id')
      fonogramasCriados += fgCriados?.length ?? 0
    }
  }

  // ── 9. Relatório ─────────────────────────────────────────────────────────
  return NextResponse.json({
    ok: true,
    obras_integradas:          impObras.length,
    titulares_criados:         titularesCriados,
    titulares_vinculados:      titularesVinculados,
    editoras_criadas:          editorasCriadas,
    participacoes_gravadas:    participacoesAtualizadas,
    fonogramas_criados:        fonogramasCriados,
    fonogramas_ja_existiam:    fonogramasJaExistiam,
  })
}
