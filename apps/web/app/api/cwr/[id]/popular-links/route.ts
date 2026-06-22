import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

function mapFuncaoAutor(papel: string): string {
  const p = (papel ?? '').toUpperCase().trim()
  // CA = autor controlado (SWT); OWR = autor não controlado (OWT)
  return 'CA'
}

function mapPapelAutor(p: string): string {
  const papel = (p ?? '').toUpperCase().trim()
  if (papel === 'CA') return 'compositor'
  if (papel === 'C')  return 'compositor'
  if (papel === 'A')  return 'autor'
  if (papel === 'AR') return 'arranjador'
  if (papel === 'AD') return 'adaptador'
  if (papel === 'PA') return 'autor'
  if (papel === 'ES') return 'compositor'
  if (papel === 'AE') return 'arranjador'
  return 'compositor'
}

function mapFuncaoEditora(tipo: string): string {
  const t = (tipo ?? '').toUpperCase().trim()
  if (t === 'SE') return 'SE'
  if (t === 'AM' || t === 'AQ') return 'AM'
  return 'E'
}

function mapPapelEditora(tipo: string): string {
  const t = (tipo ?? '').toUpperCase().trim()
  if (t === 'SE') return 'subeditora'
  if (t === 'AM' || t === 'AQ') return 'administradora'
  return 'editora_original'
}

// POST /api/cwr/[id]/popular-links
// Regra: 1 link por autor (controlado ou não).
// Autores controlados (CA): recebem as editoras proporcionalmente.
// Autores não controlados (OWR): link próprio, sem editoras.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  // 1. Verificar importação
  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('id, status, tenant_id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })

  // 2. Buscar todas as obras desta importação com obra_id preenchido
  const { data: impObras, error: errObras } = await client
    .from('cwr_importacoes_obras')
    .select('id, obra_id, snapshot_cwr')
    .eq('importacao_id', id)
    .not('obra_id', 'is', null)

  if (errObras) return NextResponse.json({ error: errObras.message }, { status: 500 })
  if (!impObras?.length) return NextResponse.json({ error: 'Nenhuma obra encontrada nesta importação' }, { status: 404 })

  // 3. Verificar quais obras já têm obras_links (evitar duplicatas)
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

  let totalLinksCreados = 0
  let totalTitularesCreados = 0

  // 4. Processar obra por obra — 1 link por autor
  for (const row of obrasParaProcessar) {
    const snap      = (row.snapshot_cwr ?? {}) as Record<string, unknown>
    const autores   = (snap.autores  as any[]) ?? []
    const editoras  = (snap.editoras as any[]) ?? []

    const obraId    = row.obra_id as string
    const tenantId  = usuario.tenantId

    const caList  = autores.filter(a => a.controlled === true)
    const owrList = autores.filter(a => a.controlled !== true)

    // Total PR dos autores controlados — base para distribuição proporcional das editoras
    const totalCaPR = caList.reduce((s: number, a: any) => s + (a.pr_pct ?? 0), 0)

    let linkNum = 1

    // ── Links dos autores CONTROLADOS (CA) ────────────────────────────────
    for (const ca of caList) {
      // Criar o link
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

      if (errLink || !linkRow) continue
      const linkId = linkRow.id as string
      linkNum++
      totalLinksCreados++

      const titulares: Record<string, unknown>[] = []

      // Adicionar o CA
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

      // Proporção deste CA no total de CAs controlados
      const proporcao = totalCaPR > 0 ? (ca.pr_pct ?? 0) / totalCaPR : (caList.length > 0 ? 1 / caList.length : 1)

      // Adicionar editoras proporcionalmente a este CA
      for (const e of editoras) {
        if (!e.nome?.trim()) continue
        const funcaoEd = mapFuncaoEditora(e.tipo ?? e.papel ?? '')
        const papelEd  = mapPapelEditora(e.tipo ?? e.papel ?? '')
        const isAM     = funcaoEd === 'AM'

        // Se só 1 CA controlado, editora recebe 100% dos seus %. Se múltiplos CAs, distribui proporcional.
        const fator = caList.length === 1 ? 1 : proporcao

        // AM coleta o MR em nome do CA — usa o PR do CA como referência
        const mrEd = isAM ? (ca.pr_pct ?? 0) * fator : 0

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
      if (!errTit) totalTitularesCreados += titulares.length
    }

    // ── Links dos autores NÃO CONTROLADOS (OWR) ───────────────────────────
    for (const owr of owrList) {
      if (!owr.nome?.trim()) continue

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

      if (errLink || !linkRow) continue
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
