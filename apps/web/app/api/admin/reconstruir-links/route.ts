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

  // 1. Buscar todas as cwr_importacoes_obras com snapshot_cwr e obra_id
  let query = client
    .from('cwr_importacoes_obras')
    .select('id, obra_id, snapshot_cwr, obras!inner(tenant_id)')
    .not('obra_id', 'is', null)
    .not('snapshot_cwr', 'is', null)

  if (obraFilt?.length) {
    query = query.in('obra_id', obraFilt)
  }

  const { data: rows, error: errRows } = await query
  if (errRows) return NextResponse.json({ error: errRows.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ ok: true, message: 'Nenhuma obra encontrada', total: 0 })

  // Dedup por obra_id — pegar só a importação mais recente por obra
  const byObra = new Map<string, typeof rows[0]>()
  for (const r of rows) {
    const key = r.obra_id as string
    if (!byObra.has(key)) byObra.set(key, r)
  }
  const toProcess = Array.from(byObra.values())

  let totalObras   = 0
  let totalLinks   = 0
  let totalTit     = 0
  let totalErrors  = 0
  const erros: { obra_id: string; error: string }[] = []
  const preview: { obra_id: string; links: number; titulares: number }[] = []

  for (const row of toProcess) {
    const obraId   = row.obra_id as string
    const tenantId = (row as any).obras?.tenant_id as string ?? ''
    const snap     = (row.snapshot_cwr ?? {}) as Record<string, unknown>
    const autores  = (snap.autores  as any[]) ?? []
    const editoras = (snap.editoras as any[]) ?? []

    const caList  = autores.filter(a => a.controlled === true)
    const owrList = autores.filter(a => a.controlled !== true && a.nome?.trim())

    // Calcular quantos links/titulares serão criados
    const editorasPorCA = caList.length > 0 ? editoras.filter(e => e.nome?.trim()) : []
    const linksCount    = caList.length + owrList.length
    const titCount      = caList.length + (caList.length * editorasPorCA.length) + owrList.length

    if (dryRun) {
      preview.push({ obra_id: obraId, links: linksCount, titulares: titCount })
      continue
    }

    try {
      // 2. Apagar links e titulares existentes desta obra
      await client.from('obras_links_titulares').delete().eq('obra_id', obraId)
      await client.from('obras_links').delete().eq('obra_id', obraId)

      const totalCaPR = caList.reduce((s: number, a: any) => s + (a.pr_pct ?? 0), 0)
      let linkNum = 1

      // ── Links dos autores CONTROLADOS (CA) ────────────────────────────────
      for (const ca of caList) {
        const { data: linkRow, error: errLink } = await client
          .from('obras_links')
          .insert({
            obra_id:         obraId,
            tenant_id:       tenantId,
            numero_link:     linkNum,
            percentual_link: ca.pr_pct ?? 0,
            tipo_link:       'controlado',
            controlado:      true,
            status:          'ativo',
          })
          .select('id')
          .single()

        if (errLink || !linkRow) {
          erros.push({ obra_id: obraId, error: errLink?.message ?? 'Erro ao criar link CA' })
          continue
        }

        const linkId    = linkRow.id as string
        const proporcao = totalCaPR > 0 ? (ca.pr_pct ?? 0) / totalCaPR : (caList.length > 0 ? 1 / caList.length : 1)
        const fator     = caList.length === 1 ? 1 : proporcao

        linkNum++
        totalLinks++

        const titulares: Record<string, unknown>[] = []

        // CA
        titulares.push({
          obra_link_id:             linkId,
          obra_id:                  obraId,
          tenant_id:                tenantId,
          nome:                     (ca.nome as string).trim(),
          papel:                    mapPapelAutor(ca.papel ?? ''),
          funcao_no_link:           'CA',
          percentual_exec_publica:  ca.pr_pct ?? 0,
          percentual_fonomecanico:  0,
          percentual_sincronizacao: ca.sr_pct ?? 0,
          controlado:               true,
          status_controle:          'controlado',
          ipi:                      ca.ipi ?? null,
          cae:                      ca.ipi ?? null,
        })

        // Editoras proporcionais
        for (const e of editoras) {
          if (!e.nome?.trim()) continue
          const funcaoEd = mapFuncaoEditora(e.tipo ?? e.papel ?? '')
          const papelEd  = mapPapelEditora(e.tipo ?? e.papel ?? '')
          const isAM     = funcaoEd === 'AM'
          const mrEd     = isAM ? (ca.pr_pct ?? 0) * fator : 0

          titulares.push({
            obra_link_id:             linkId,
            obra_id:                  obraId,
            tenant_id:                tenantId,
            nome:                     (e.nome as string).trim(),
            papel:                    papelEd,
            funcao_no_link:           funcaoEd,
            percentual_exec_publica:  Math.round((e.pr_pct ?? 0) * fator * 100) / 100,
            percentual_fonomecanico:  Math.round(mrEd * 100) / 100,
            percentual_sincronizacao: Math.round((e.sr_pct ?? 0) * fator * 100) / 100,
            controlado:               e.controlled ?? false,
            status_controle:          (e.controlled ?? false) ? 'controlado' : 'nao_controlado',
            ipi:                      e.ipi ?? null,
            cae:                      e.ipi ?? null,
          })
        }

        const { error: errTit } = await client.from('obras_links_titulares').insert(titulares)
        if (!errTit) totalTit += titulares.length
      }

      // ── Links dos autores NÃO CONTROLADOS (OWR) ───────────────────────────
      for (const owr of owrList) {
        const { data: linkRow, error: errLink } = await client
          .from('obras_links')
          .insert({
            obra_id:         obraId,
            tenant_id:       tenantId,
            numero_link:     linkNum,
            percentual_link: owr.pr_pct ?? 0,
            tipo_link:       'nao_controlado',
            controlado:      false,
            status:          'ativo',
          })
          .select('id')
          .single()

        if (errLink || !linkRow) {
          erros.push({ obra_id: obraId, error: errLink?.message ?? 'Erro ao criar link OWR' })
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
      }

      totalObras++
    } catch (e: any) {
      totalErrors++
      erros.push({ obra_id: obraId, error: e?.message ?? String(e) })
    }
  }

  if (dryRun) {
    return NextResponse.json({
      ok:       true,
      dry_run:  true,
      total_obras:     toProcess.length,
      preview:  preview.slice(0, 50),
      preview_total: preview.length,
    })
  }

  return NextResponse.json({
    ok:              totalErrors === 0,
    obras_processadas: totalObras,
    links_criados:    totalLinks,
    titulares_criados: totalTit,
    erros_total:       totalErrors,
    erros:             erros.length ? erros.slice(0, 20) : undefined,
  })
}
