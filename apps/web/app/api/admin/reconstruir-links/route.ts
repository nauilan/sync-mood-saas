/**
 * POST /api/admin/reconstruir-links
 *
 * Recria TODOS os links do catálogo com a lógica correta:
 *   - 1 link por autor controlado (CA) + editoras proporcionais
 *   - 1 link por autor não controlado (OWR) sem editoras
 *
 * Auth: Header  x-admin-secret: <SUPABASE_SERVICE_ROLE_KEY>
 *
 * Body (opcional):
 *   { obra_ids: string[] }  → processa só essas obras
 *   { dry_run: true }       → simula sem gravar
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

const sanitize = (v: string | undefined) =>
  (v ?? '').replace(/[\uFEFF\u200B\u200C\u200D]/g, '').trim()

// ── helpers de arredondamento ──────────────────────────────────────────────
const r2    = (n: number) => Math.round(n * 100) / 100
const ceil2 = (n: number) => Math.ceil(n  * 100) / 100

// Frações de contrato comuns — snap evita erros de float (ex: 0.80024 → 0.80)
const COMMON_RATIOS = [0.50, 0.60, 0.625, 0.6667, 0.70, 0.75, 0.80, 0.875, 1.0]
function snapRatio(r: number): number {
  let best = r, bestDiff = Infinity
  for (const cr of COMMON_RATIOS) {
    const d = Math.abs(r - cr)
    if (d < bestDiff) { bestDiff = d; best = cr }
  }
  return bestDiff < 0.01 ? best : r
}

function mapPapelAutor(p: string): string {
  const papel = (p ?? '').toUpperCase().trim()
  if (papel === 'C' || papel === 'CA' || papel === 'ES') return 'compositor'
  if (papel === 'A' || papel === 'PA')                   return 'autor'
  if (papel === 'AR' || papel === 'AE')                  return 'arranjador'
  if (papel === 'AD')                                    return 'adaptador'
  return 'compositor'
}

function mapFuncaoEditora(tipo: string): string {
  const t = (tipo ?? '').toUpperCase().trim()
  if (t === 'SE')               return 'SE'
  if (t === 'AM' || t === 'AQ') return 'AM'
  return 'E'
}

function mapPapelEditora(tipo: string): string {
  const t = (tipo ?? '').toUpperCase().trim()
  if (t === 'SE')               return 'subeditora'
  if (t === 'AM' || t === 'AQ') return 'administradora'
  return 'editora_original'
}

interface Participante {
  nome?: string
  papel?: string
  tipo?: string
  pr_pct?: number
  sr_pct?: number
  ipi?: string | null
  controlled?: boolean
  [k: string]: unknown
}

interface Distribuido extends Participante {
  pr_correto: number
}

/**
 * Calcula distribuição correta de percentuais para um link CA:
 *  1. CA share  = r2(linkTotal × caRatio)          ← favor ao autor
 *  2. ed_total  = linkTotal − CA share              ← resto exato
 *  3. E share   = ceil2(ed_total × eRatio)          ← favor ao editor original
 *  4. AM share  = ed_total − E share                ← AM fica com o resto
 */
function calcCaLink(ca: Participante, eds: Participante[], linkTotalCorreto: number): Distribuido[] {
  const result: Distribuido[] = []

  if (eds.length === 0) {
    result.push({ ...ca, pr_correto: linkTotalCorreto })
    return result
  }

  const esRaw  = eds.filter(e => !['AM','AQ'].includes(((e.tipo ?? e.papel) ?? '').toUpperCase().trim()))
  const amsRaw = eds.filter(e =>  ['AM','AQ'].includes(((e.tipo ?? e.papel) ?? '').toUpperCase().trim()))

  // caRatio = CA_raw / linkTotalCorreto — não usa editoras fatoradas no denominador
  const caRatio = snapRatio(linkTotalCorreto > 0 ? (ca.pr_pct ?? 0) / linkTotalCorreto : 0.75)

  const caShare = r2(linkTotalCorreto * caRatio)
  const edTotal = Math.round((linkTotalCorreto - caShare) * 100) / 100

  result.push({ ...ca, pr_correto: caShare })

  if (edTotal <= 0) return result

  if (amsRaw.length === 0) {
    // Só E(s)
    let edAcumulado = 0
    esRaw.forEach((e, idx) => {
      let eShare: number
      if (idx === esRaw.length - 1) {
        eShare = Math.round((edTotal - edAcumulado) * 100) / 100
      } else {
        const eRawTotal = esRaw.reduce((s, x) => s + (x.pr_pct ?? 0), 0)
        const eRatio = eRawTotal > 0 ? (e.pr_pct ?? 0) / eRawTotal : 1 / esRaw.length
        eShare = ceil2(edTotal * eRatio)
      }
      edAcumulado += eShare
      result.push({ ...e, pr_correto: eShare })
    })
  } else {
    // Tem E e AM
    const eRawTotal  = esRaw.reduce((s, e)  => s + (e.pr_pct ?? 0), 0)
    const amRawTotal = amsRaw.reduce((s, e) => s + (e.pr_pct ?? 0), 0)
    const allEdRaw   = eRawTotal + amRawTotal

    let eTotal = 0
    esRaw.forEach(e => {
      const eInt   = Math.round((e.pr_pct ?? 0) * 100)
      const edInt  = Math.round(allEdRaw * 100)
      const eRatio = snapRatio(edInt > 0 ? eInt / edInt : 1 / (esRaw.length + amsRaw.length))
      const eShare = ceil2(edTotal * eRatio)
      eTotal += eShare
      result.push({ ...e, pr_correto: eShare })
    })

    const amTotal = Math.round((edTotal - eTotal) * 100) / 100
    if (amsRaw.length === 1) {
      result.push({ ...amsRaw[0], pr_correto: amTotal })
    } else {
      let amAcumulado = 0
      amsRaw.forEach((am, idx) => {
        let amShare: number
        if (idx === amsRaw.length - 1) {
          amShare = Math.round((amTotal - amAcumulado) * 100) / 100
        } else {
          const amRatio = amRawTotal > 0 ? (am.pr_pct ?? 0) / amRawTotal : 1 / amsRaw.length
          amShare = r2(amTotal * amRatio)
        }
        amAcumulado += amShare
        result.push({ ...am, pr_correto: amShare })
      })
    }
  }

  return result
}

export async function POST(req: NextRequest) {
  const secret = sanitize(req.headers.get('x-admin-secret') ?? '')
  const srvKey = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!srvKey || secret !== srvKey) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body     = await req.json().catch(() => ({}))
  const dryRun   = body.dry_run === true
  const obraFilt = Array.isArray(body.obra_ids) ? (body.obra_ids as string[]) : null

  const client = createClient(
    sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL),
    srvKey,
    { auth: { persistSession: false } }
  )

  let query = client
    .from('cwr_importacoes_obras')
    .select('id, obra_id, snapshot_cwr')
    .not('obra_id', 'is', null)
    .not('snapshot_cwr', 'is', null)

  if (obraFilt?.length) {
    query = query.in('obra_id', obraFilt)
  }

  const { data: rows, error: errRows } = await query
  if (errRows) return NextResponse.json({ error: errRows.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ ok: true, message: 'Nenhuma obra encontrada', total: 0 })

  const byObra = new Map<string, typeof rows[0]>()
  for (const r of rows) {
    const key = r.obra_id as string
    if (!byObra.has(key)) byObra.set(key, r)
  }
  const toProcess = Array.from(byObra.values())

  // Buscar tenant_id em batches de 100 (evita URL longa)
  const allObraIds = toProcess.map(r => r.obra_id as string)
  const tenantByObra = new Map<string, string>()
  const BATCH = 100
  for (let i = 0; i < allObraIds.length; i += BATCH) {
    const { data: obs } = await client
      .from('obras')
      .select('id, tenant_id')
      .in('id', allObraIds.slice(i, i + BATCH))
    for (const o of (obs ?? [])) tenantByObra.set(o.id as string, o.tenant_id as string)
  }

  let totalObras  = 0
  let totalLinks  = 0
  let totalTit    = 0
  let totalErrors = 0
  const erros: { obra_id: string; error: string }[] = []
  const preview: { obra_id: string; links: number; titulares: number }[] = []

  for (const row of toProcess) {
    const obraId   = row.obra_id as string
    const tenantId = tenantByObra.get(obraId) ?? ''
    const snap     = (row.snapshot_cwr ?? {}) as Record<string, unknown>
    const autores  = (snap.autores  as Participante[]) ?? []
    const editoras = (snap.editoras as Participante[]) ?? []

    const caList  = autores.filter(a => a.controlled === true  && a.nome?.trim())
    const owrList = autores.filter(a => a.controlled !== true  && a.nome?.trim())

    if (dryRun) {
      const edPorCA = caList.length > 0 ? editoras.filter(e => e.nome?.trim()).length : 0
      preview.push({
        obra_id:    obraId,
        links:      caList.length + owrList.length,
        titulares:  caList.length + (caList.length * edPorCA) + owrList.length,
      })
      continue
    }

    try {
      await client.from('obras_links_titulares').delete().eq('obra_id', obraId)
      await client.from('obras_links').delete().eq('obra_id', obraId)

      // Deduplica editoras por (nome, tipo) — evita duplicatas do snapshot CWR
      const editoras_unicas = editoras.filter(e => e.nome?.trim()).reduce((acc: Participante[], e) => {
        const chave = `${(e.nome ?? '').trim().toLowerCase()}|${((e.tipo ?? e.papel) ?? '').toUpperCase().trim()}`
        const idx = acc.findIndex(x => `${(x.nome ?? '').trim().toLowerCase()}|${((x.tipo ?? x.papel) ?? '').toUpperCase().trim()}` === chave)
        if (idx >= 0) { if ((e.pr_pct ?? 0) > (acc[idx].pr_pct ?? 0)) acc[idx] = e }
        else acc.push({ ...e })
        return acc
      }, [])

      const owrRawTotal   = owrList.reduce((s, o) => s + (o.pr_pct ?? 0), 0)
      const totalCaPR     = caList.reduce((s, a)  => s + (a.pr_pct ?? 0), 0)
      const caCorrectPool = Math.round((100 - owrRawTotal) * 100) / 100

      // Calcular link_total_correto para cada CA
      const caLinkTotals: number[] = []
      let caAccumulated = 0
      for (let ci = 0; ci < caList.length; ci++) {
        let linkTotal: number
        if (ci === caList.length - 1) {
          linkTotal = Math.round((caCorrectPool - caAccumulated) * 100) / 100
        } else {
          const ratio = totalCaPR > 0 ? (caList[ci].pr_pct ?? 0) / totalCaPR : 1 / caList.length
          linkTotal   = r2(caCorrectPool * ratio)
        }
        caAccumulated += linkTotal
        caLinkTotals.push(linkTotal)
      }

      let linkNum = 1

      // ── Links CA ──────────────────────────────────────────────────────────
      for (let ci = 0; ci < caList.length; ci++) {
        const ca               = caList[ci]
        const linkTotalCorreto = caLinkTotals[ci]
        const proporcao        = totalCaPR > 0 ? (ca.pr_pct ?? 0) / totalCaPR : 1 / caList.length
        const fator            = caList.length === 1 ? 1 : proporcao

        const edsParaEstCA = editoras_unicas
          .map(e => ({ ...e, pr_pct: (e.pr_pct ?? 0) * fator }))

        const distribuicao = calcCaLink(ca, edsParaEstCA, linkTotalCorreto)

        const { data: linkRow, error: errLink } = await client
          .from('obras_links')
          .insert({
            obra_id:         obraId,
            tenant_id:       tenantId,
            numero_link:     linkNum,
            percentual_link: linkTotalCorreto,
            tipo_link:       'controlado',
            controlado:      true,
            status:          'ativo',
          })
          .select('id')
          .single()

        if (errLink || !linkRow) {
          erros.push({ obra_id: obraId, error: errLink?.message ?? 'Erro link CA' })
          linkNum++
          continue
        }

        const linkId = linkRow.id as string
        linkNum++
        totalLinks++

        const titulares: Record<string, unknown>[] = []

        distribuicao.forEach((d, idx) => {
          if (idx === 0) {
            titulares.push({
              obra_link_id:             linkId,
              obra_id:                  obraId,
              tenant_id:                tenantId,
              nome:                     (d.nome ?? '').trim(),
              papel:                    mapPapelAutor(d.papel ?? ca.papel ?? ''),
              funcao_no_link:           'CA',
              percentual_exec_publica:  d.pr_correto,
              percentual_fonomecanico:  0,
              percentual_sincronizacao: d.sr_pct ?? 0,
              controlado:               true,
              status_controle:          'controlado',
              ipi:                      d.ipi ?? null,
              cae:                      d.ipi ?? null,
            })
          } else {
            const funcaoEd = mapFuncaoEditora((d.tipo ?? d.papel) ?? '')
            const papelEd  = mapPapelEditora((d.tipo ?? d.papel) ?? '')
            const isAM     = funcaoEd === 'AM'
            titulares.push({
              obra_link_id:             linkId,
              obra_id:                  obraId,
              tenant_id:                tenantId,
              nome:                     (d.nome ?? '').trim(),
              papel:                    papelEd,
              funcao_no_link:           funcaoEd,
              percentual_exec_publica:  d.pr_correto,
              percentual_fonomecanico:  isAM ? d.pr_correto : 0,
              percentual_sincronizacao: Math.round(((d.sr_pct ?? 0) * fator) * 100) / 100,
              controlado:               d.controlled ?? false,
              status_controle:          (d.controlled ?? false) ? 'controlado' : 'nao_controlado',
              ipi:                      d.ipi ?? null,
              cae:                      d.ipi ?? null,
            })
          }
        })

        const { error: errTit } = await client.from('obras_links_titulares').insert(titulares)
        if (!errTit) totalTit += titulares.length
        else erros.push({ obra_id: obraId, error: 'titulares CA: ' + errTit.message })
      }

      // ── Links OWR ─────────────────────────────────────────────────────────
      for (const owr of owrList) {
        const { data: linkRow, error: errLink } = await client
          .from('obras_links')
          .insert({
            obra_id:         obraId,
            tenant_id:       tenantId,
            numero_link:     linkNum,
            percentual_link: owr.pr_pct ?? 0,
            tipo_link:       'direto_sem_editora',
            controlado:      false,
            status:          'ativo',
          })
          .select('id')
          .single()

        if (errLink || !linkRow) {
          erros.push({ obra_id: obraId, error: errLink?.message ?? 'Erro link OWR' })
          linkNum++
          continue
        }

        const linkId = linkRow.id as string
        linkNum++
        totalLinks++

        const { error: errTit } = await client.from('obras_links_titulares').insert({
          obra_link_id:             linkId,
          obra_id:                  obraId,
          tenant_id:                tenantId,
          nome:                     (owr.nome as string).trim(),
          papel:                    mapPapelAutor(owr.papel ?? ''),
          funcao_no_link:           'OWR',
          percentual_exec_publica:  owr.pr_pct ?? 0,
          percentual_fonomecanico:  0,
          percentual_sincronizacao: owr.sr_pct ?? 0,
          controlado:               false,
          status_controle:          'nao_controlado',
          ipi:                      owr.ipi ?? null,
          cae:                      owr.ipi ?? null,
        })
        if (!errTit) totalTit++
        else erros.push({ obra_id: obraId, error: 'titular OWR: ' + errTit.message })
      }

      totalObras++
    } catch (e: any) {
      totalErrors++
      erros.push({ obra_id: obraId, error: e?.message ?? String(e) })
    }
  }

  if (dryRun) {
    return NextResponse.json({
      ok:            true,
      dry_run:       true,
      total_obras:   toProcess.length,
      preview:       preview.slice(0, 50),
      preview_total: preview.length,
    })
  }

  return NextResponse.json({
    ok:                totalErrors === 0,
    obras_processadas: totalObras,
    links_criados:     totalLinks,
    titulares_criados: totalTit,
    erros_total:       totalErrors,
    erros:             erros.length ? erros.slice(0, 20) : undefined,
  })
}
