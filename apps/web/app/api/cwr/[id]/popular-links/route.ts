import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deveZerarMR, calcularMrAM } from '@/lib/backoffice-rules'

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

function mapPapelEditora(tipo: string, papel: string): string {
  const t = (tipo ?? papel ?? '').toUpperCase().trim()
  if (t === 'SE') return 'subeditora'
  if (t === 'AM' || t === 'AQ') return 'administradora'
  if (t === 'PA') return 'editora_original'
  return 'editora_original'
}

// POST /api/cwr/[id]/popular-links
// Lê snapshot_cwr de todas as obras desta importação e cria obras_links + obras_links_titulares
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

  // 4. Inserir obras_links em lote
  const linksPayload = obrasParaProcessar.map(row => ({
    obra_id:         row.obra_id as string,
    tenant_id:       usuario.tenantId,
    numero_link:     1,
    percentual_link: 100,
    tipo_link:       'controlado',
    controlado:      true,
    status:          'ativo',
  }))

  const { data: linksCreated, error: errLinks } = await client
    .from('obras_links')
    .insert(linksPayload)
    .select('id, obra_id')

  if (errLinks || !linksCreated?.length) {
    return NextResponse.json({ error: 'Falha ao criar obras_links', detail: errLinks?.message }, { status: 500 })
  }

  // 5. Mapear obra_id → link_id
  const obraToLinkId: Record<string, string> = {}
  for (const l of linksCreated) {
    obraToLinkId[l.obra_id as string] = l.id as string
  }

  // 6. Montar todos os titulares
  const allTitulares: Record<string, unknown>[] = []

  for (const row of obrasParaProcessar) {
    const linkId = obraToLinkId[row.obra_id as string]
    if (!linkId) continue

    const snap     = (row.snapshot_cwr ?? {}) as Record<string, unknown>
    const autores  = (snap.autores  as any[]) ?? []
    const editoras = (snap.editoras as any[]) ?? []

    for (const a of autores) {
      if (!a.nome?.trim()) continue
      allTitulares.push({
        obra_link_id:           linkId,
        obra_id:                row.obra_id,
        tenant_id:              usuario.tenantId,
        titular_id:             null,
        nome:                   (a.nome as string).trim(),
        papel:                  mapPapelAutor(a.papel ?? ''),
        funcao_no_link:         mapPapelAutor(a.papel ?? ''),
        percentual_exec_publica:  a.pr_pct ?? 0,
        // GUARDA DEFENSIVA: autores nunca coletam MR diretamente (SWR/OWR/CA/C/A/V/AD)
        // AM coleta em nome deles — gravar aqui duplicaria o valor no BackOffice.
        percentual_fonomecanico:  0,
        percentual_sincronizacao: a.sr_pct ?? 0,
        controlado:             a.controlled ?? false,
        status_controle:        (a.controlled ?? false) ? 'controlado' : 'nao_controlado',
        ipi:                    a.ipi   ?? null,
        cae:                    a.ipi   ?? null,
      })
    }

    // AM MR = soma dos PR controlados do link (NUNCA o valor bruto SPT do CWR)
    const mrAmCorreto = calcularMrAM(
      autores.map((a: any) => ({ pr_pct: a.pr_pct ?? 0, controlled: a.controlled ?? false }))
    )
    for (const e of editoras) {
      if (!e.nome?.trim()) continue
      const papelEd = mapPapelEditora(e.tipo ?? '', e.papel ?? '')
      // Regra BackOffice: E/SE/SA → MR=0; AM → soma PR controlados (não valor bruto CWR)
      const mrEd = deveZerarMR(papelEd) ? 0 : mrAmCorreto
      allTitulares.push({
        obra_link_id:           linkId,
        obra_id:                row.obra_id,
        tenant_id:              usuario.tenantId,
        titular_id:             null,
        nome:                   (e.nome as string).trim(),
        papel:                  papelEd,
        funcao_no_link:         papelEd,
        percentual_exec_publica:  e.pr_pct ?? 0,
        percentual_fonomecanico:  mrEd,
        percentual_sincronizacao: e.sr_pct ?? 0,
        controlado:             e.controlled ?? false,
        status_controle:        (e.controlled ?? false) ? 'controlado' : 'nao_controlado',
        ipi:                    e.ipi   ?? null,
        cae:                    e.ipi   ?? null,
      })
    }
  }

  // 7. Inserir titulares em lotes de 500
  const CHUNK = 500
  let titularesCreados = 0
  for (let i = 0; i < allTitulares.length; i += CHUNK) {
    const chunk = allTitulares.slice(i, i + CHUNK)
    const { error: errTit } = await client.from('obras_links_titulares').insert(chunk)
    if (!errTit) titularesCreados += chunk.length
  }

  return NextResponse.json({
    ok: true,
    obras_processadas:     obrasParaProcessar.length,
    obras_ja_tinham_links: obraIdsComLinks.size,
    links_criados:         linksCreated.length,
    titulares_criados:     titularesCreados,
  })
}
