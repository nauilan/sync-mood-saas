import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasCompleteEditorialChain } from '@/lib/cwr-materialization'

const sanitize = (v: string | undefined) =>
  (v ?? '').replace(/[\uFEFF\u200B\u200C\u200D]/g, '').trim()

function sb() {
  return createClient(
    sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL),
    sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false } }
  )
}

async function getUser(req: NextRequest) {
  const raw = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  const token = raw.replace(/[\uFEFF\u200B\u200C\u200D]/g, '').trim()
  if (!token) return null
  const client = sb()
  const { data: { user } } = await client.auth.getUser(token)
  if (!user) return null
  const { data } = await client.from('usuarios').select('id,tenant_id').eq('auth_user_id', user.id).single()
  return data ? { userId: data.id as string, tenantId: data.tenant_id as string } : null
}

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
  if (papel === 'A' || papel === 'PA')  return 'autor'
  if (papel === 'AR' || papel === 'AE') return 'arranjador'
  if (papel === 'AD')                   return 'adaptador'
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

// POST /api/cwr/[id]/popular-links
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('id, status, tenant_id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })

  const { data: impObras, error: errObras } = await client
    .from('cwr_importacoes_obras')
    .select('id, obra_id, snapshot_cwr')
    .eq('importacao_id', id)
    .not('obra_id', 'is', null)

  if (errObras) return NextResponse.json({ error: errObras.message }, { status: 500 })
  if (!impObras?.length) return NextResponse.json({ error: 'Nenhuma obra encontrada nesta importação' }, { status: 404 })

  const obraIds = impObras.map(r => r.obra_id as string)
  const { data: existingLinks } = await client
    .from('obras_links')
    .select('obra_id')
    .in('obra_id', obraIds)

  const obraIdsComLinks = new Set((existingLinks ?? []).map((l: any) => l.obra_id as string))
  const obrasParaProcessar = impObras.filter(r => !obraIdsComLinks.has(r.obra_id as string))

  if (obrasParaProcessar.length === 0) {
    return NextResponse.json({
      ok: true,
      message: 'Todas as obras já possuem titulares vinculados.',
      obras_processadas: 0,
      obras_ja_tinham_links: obraIdsComLinks.size,
      titulares_criados: 0,
    })
  }

  let totalLinksCreados    = 0
  let totalTitularesCreados = 0

  for (const row of obrasParaProcessar) {
    const snap     = (row.snapshot_cwr ?? {}) as Record<string, unknown>
    const autores  = (snap.autores  as Participante[]) ?? []
    const editoras = (snap.editoras as Participante[]) ?? []
    if (hasCompleteEditorialChain(snap as any)) {
      continue
    }


    const obraId   = row.obra_id as string
    const tenantId = usuario.tenantId

    const caList  = autores.filter(a => a.controlled === true  && a.nome?.trim())
    const owrList = autores.filter(a => a.controlled !== true  && a.nome?.trim())

    // Deduplica editoras por (nome, tipo) — mantém maior pr_pct para evitar duplicatas do CWR
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
        .filter(e => e.nome?.trim())
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

      if (errLink || !linkRow) { linkNum++; continue }
      const linkId = linkRow.id as string
      linkNum++
      totalLinksCreados++

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
      if (!errTit) totalTitularesCreados += titulares.length
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

      if (errLink || !linkRow) { linkNum++; continue }
      const linkId = linkRow.id as string
      linkNum++
      totalLinksCreados++

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
      if (!errTit) totalTitularesCreados++
    }
  }

  return NextResponse.json({
    ok: true,
    obras_processadas:     obrasParaProcessar.length,
    obras_ja_tinham_links: obraIdsComLinks.size,
    links_criados:         totalLinksCreados,
    titulares_criados:     totalTitularesCreados,
  })
}
