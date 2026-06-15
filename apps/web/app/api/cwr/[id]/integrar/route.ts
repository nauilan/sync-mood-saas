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
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── helpers ───────────────────────────────────────────────────────────────────

function sb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/[\uFEFF]/g, '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/[\uFEFF]/g, '').trim(),
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
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  // ── 0. Verificar importação ───────────────────────────────────────────────
  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('id, status, tenant_id, relatorio')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })
  if (imp.status !== 'confirmado') {
    return NextResponse.json(
      { error: 'A importação precisa estar confirmada antes de integrar.' },
      { status: 400 }
    )
  }

  // ── 1. Limpar execução anterior (idempotência) ────────────────────────────
  // Titulares e editoras NÃO são deletados — são dados de referência compartilhada.
  // Apenas participações e fonogramas criados por esta importação são refeitos.
  const relAnterior = (imp.relatorio as Record<string, unknown>)?.integracao as Record<string, unknown> | undefined
  if (relAnterior) {
    const partIds = (relAnterior.participacoes_ids as string[]) ?? []
    const fgIds   = (relAnterior.fonogramas_criados_ids as string[]) ?? []
    if (partIds.length > 0) await deleteInChunks(client, 'obras_links_titulares', partIds)
    if (fgIds.length   > 0) await deleteInChunks(client, 'fonogramas', fgIds)
  }

  // ── 2. Carregar snapshots ─────────────────────────────────────────────────
  const { data: impObras } = await client
    .from('cwr_importacoes_obras')
    .select('obra_id, snapshot_cwr')
    .eq('importacao_id', id)
    .not('obra_id', 'is', null)

  if (!impObras?.length) {
    return NextResponse.json({ error: 'Nenhuma obra encontrada nesta importação.' }, { status: 404 })
  }

  // ── 3. Extrair autores, editoras, fonogramas dos snapshots ────────────────
  const autoresUnicos   = new Map<string, { nome: string; ipi: string | null; tipo: 'autor' }>()
  const editorasUnicas  = new Map<string, { nome: string; ipi: string | null; controlled: boolean; tipo: 'editora' | 'editora_administrada' }>()

  type PartObra = {
    chave: string; papel: string
    pr_pct: number; mr_pct: number; sr_pct: number
    controlled: boolean; obraId: string
  }
  const obraParticipacoes: PartObra[] = []
  type FgObra = { obraId: string; isrc: string | null; titulo: string; interprete: string | null; versao: string | null; ano: number | null }
  const obraFonogramas: FgObra[] = []

  for (const row of impObras) {
    const snap    = (row.snapshot_cwr ?? {}) as Record<string, unknown>
    const obraId  = row.obra_id as string
    const obraTit = (snap.titulo as string) ?? ''

    for (const a of ((snap.autores as any[]) ?? [])) {
      if (!(a.nome as string)?.trim()) continue
      const chave = chaveTitular(a.ipi, a.nome)
      if (!autoresUnicos.has(chave)) {
        autoresUnicos.set(chave, { nome: (a.nome as string).trim(), ipi: a.ipi ?? null, tipo: 'autor' })
      }
      obraParticipacoes.push({
        chave,
        papel:      mapPapelAutor(a.papel ?? ''),
        pr_pct:     Number(a.pr_pct)  || 0,
        mr_pct:     Number(a.mr_pct)  || 0,
        sr_pct:     Number(a.sr_pct)  || 0,
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
        papel:      mapPapelEditora(e.tipo ?? '', e.papel ?? ''),
        pr_pct:     Number(e.pr_pct)  || 0,
        mr_pct:     Number(e.mr_pct)  || 0,
        sr_pct:     Number(e.sr_pct)  || 0,
        controlled: e.controlled ?? false,
        obraId,
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
      })
    }
  }

  // ── 4. Buscar TODOS os titulares do tenant (dedup IPI + nome) ─────────────
  const { data: todosExistentes } = await client
    .from('titulares')
    .select('id, ipi, nome_completo, tipo')
    .eq('tenant_id', usuario.tenantId)
    .is('deleted_at', null)

  const ipiToId:      Record<string, string> = {}
  const nomeNormToId: Record<string, string> = {}
  for (const t of (todosExistentes ?? [])) {
    if (t.ipi) ipiToId[t.ipi as string] = t.id as string
    const n = normNome(t.nome_completo as string)
    if (!nomeNormToId[n]) nomeNormToId[n] = t.id as string
  }

  // ── 5. Resolver chaves → IDs existentes ou marcar para criar ─────────────
  const chavesToCreate = new Map<string, { nome: string; ipi: string | null; tipo: 'autor' | 'editora' | 'editora_administrada' }>()
  const chaveToId: Record<string, string> = {}
  const conflitos: { tipo: string; descricao: string }[] = []

  function resolverChave(chave: string, info: { nome: string; ipi: string | null; tipo: 'autor' | 'editora' | 'editora_administrada' }) {
    if (info.ipi && ipiToId[info.ipi]) {
      chaveToId[chave] = ipiToId[info.ipi]
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
        chaveToId[chave] = nomeNormToId[nomeNorm]
      } else {
        chavesToCreate.set(chave, info)
      }
    }
  }

  for (const [chave, info] of autoresUnicos)  resolverChave(chave, info)
  for (const [chave, info] of editorasUnicas) resolverChave(chave, info)

  // ── 6. Criar titulares ausentes em lote ───────────────────────────────────
  let titularesCriados   = 0
  const titularesCriadosIds: string[] = []

  if (chavesToCreate.size > 0) {
    const { count: totalAtual } = await client
      .from('titulares')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', usuario.tenantId)

    let seq = (totalAtual ?? 0) + 1
    const payloads:  Record<string, unknown>[] = []
    const chaveKeys: string[]                  = []

    for (const [chave, info] of chavesToCreate) {
      const isEdit = info.tipo === 'editora' || info.tipo === 'editora_administrada'
      payloads.push({
        tenant_id:      usuario.tenantId,
        codigo_titular: `CWR${String(seq).padStart(5, '0')}`,
        codigo_interno: `CWR${String(seq).padStart(5, '0')}`,
        tipo:           (info.tipo === 'editora_administrada' ? 'editora' : info.tipo) as string,
        pessoa:         isEdit ? 'PJ' : 'PF',
        nome_completo:  info.nome,
        ipi:            info.ipi ?? null,
        codigo_ipi:     info.ipi ?? null,
        status:         'ativo',
        observacoes:    `Criado via importação CWR ${id}`,
      })
      chaveKeys.push(chave)
      seq++
    }

    const CHUNK = 200
    for (let i = 0; i < payloads.length; i += CHUNK) {
      const chunk      = payloads.slice(i, i + CHUNK)
      const chunkChaves = chaveKeys.slice(i, i + CHUNK)
      const { data: criados, error: titErr } = await client
        .from('titulares')
        .insert(chunk)
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
          // Atualizar mapa de nomes para evitar duplicatas nos próximos lotes
          const n = normNome(criados[j].nome_completo as string)
          if (!nomeNormToId[n]) nomeNormToId[n] = criados[j].id as string
        }
      }
    }
  }

  const titularesVinculados = Object.keys(chaveToId).length - titularesCriados

  // ── 7. Garantir obras_links e inserir obras_links_titulares ───────────────
  let participacoesGravadas = 0
  const participacoesIds: string[]  = []

  const obraIds = [...new Set(impObras.map(r => r.obra_id as string))]

  // ── Upsert obras_links (idempotente — ignora duplicatas) ──────────────────
  const CHUNK = 500
  for (let i = 0; i < obraIds.length; i += CHUNK) {
    const { error: linkErr } = await client
      .from('obras_links')
      .upsert(
        obraIds.slice(i, i + CHUNK).map(oid => ({
          obra_id:         oid,
          tenant_id:       usuario.tenantId,
          numero_link:     1,
          percentual_link: 100,
          tipo_link:       'controlado',
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

  // Carregar IDs dos links (novos + já existentes)
  const obraIdToLinkId: Record<string, string> = {}
  const obrasLinksIds: string[] = []
  for (let i = 0; i < obraIds.length; i += CHUNK) {
    const { data: lks } = await client
      .from('obras_links')
      .select('id, obra_id')
      .in('obra_id', obraIds.slice(i, i + CHUNK))
    for (const l of (lks ?? [])) {
      obraIdToLinkId[l.obra_id as string] = l.id as string
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

  const titPayloads: Record<string, unknown>[] = []
  for (const [obraId, partics] of partByObra) {
    const linkId = obraIdToLinkId[obraId]
    if (!linkId) continue
    for (const p of partics) {
      const info = autoresUnicos.get(p.chave) ?? editorasUnicas.get(p.chave)
      titPayloads.push({
        obra_link_id:             linkId,
        obra_id:                  obraId,
        tenant_id:                usuario.tenantId,
        titular_id:               chaveToId[p.chave] ?? null,
        nome:                     info?.nome ?? '',
        funcao_no_link:           p.papel,
        percentual_exec_publica:  p.pr_pct  ?? 0,
        percentual_fonomecanico:  p.mr_pct  ?? 0,
        percentual_sincronizacao: p.sr_pct  ?? 0,
        ipi:                      info?.ipi ?? null,
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
      obraIdToLinkId_len: Object.keys(obraIdToLinkId).length,
      titPayloads_len: 0,
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
          tenant_id:     usuario.tenantId,
          nome_fantasia: e.nome,
          razao_social:  e.nome,
          codigo_ipi:    e.ipi ?? null,
          tipo_editora:  'administrada',
          controlada:    true,
          status:        'ativo',
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
        .insert(novos.slice(i, i + FCHUNK).map(f => ({
          obra_id:          f.obraId,
          tenant_id:        usuario.tenantId,
          isrc:             f.isrc         ?? null,
          titulo_fonograma: f.titulo       ?? '',
          interprete:       f.interprete   ?? null,
          versao:           f.versao       ?? 'original',
          ano_gravacao:     f.ano          ?? null,
        })))
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

  // ── 11. Resposta ──────────────────────────────────────────────────────────
  return NextResponse.json({
    ok:                     true,
    obras_integradas:       impObras.length,
    titulares_criados:      titularesCriados,
    titulares_vinculados:   titularesVinculados,
    _debug: {
      obraParticipacoes_len: obraParticipacoes.length,
      titPayloads_len:       titPayloads.length,
      obraIdToLinkId_len:    Object.keys(obraIdToLinkId).length,
      insert_error:          insertError,
    },
    editoras_criadas:       editorasCriadas,
    participacoes_gravadas: participacoesGravadas,
    fonogramas_criados:     fonogramasCriados,
    fonogramas_vinculados:  fonogramasVinculados,
    conflitos:              conflitos.length,
    conflitos_detalhe:      conflitos.slice(0, 50),
    rollback_disponivel:    true,
  })
}
