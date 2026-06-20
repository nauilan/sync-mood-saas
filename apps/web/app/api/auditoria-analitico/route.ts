import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function autenticar(client: ReturnType<typeof createClient<any>>, req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? ''
  let token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    const chunks: string[] = []
    for (const c of req.cookies.getAll()) {
      const m = c.name.match(/auth-token\.(\d+)$/)
      if (m) { chunks[parseInt(m[1])] = c.value; continue }
      if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) { chunks[0] = c.value }
    }
    const joined = chunks.filter(Boolean).join('')
    if (joined) {
      try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) token = p.access_token } catch {}
      if (!token) { try { const p = JSON.parse(joined); if (p?.access_token) token = p.access_token } catch {} }
    }
  }
  if (!token) return null
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await client
    .from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  return (usuario as any)?.tenant_id ?? null
}

const norm = (s: string) => (s ?? '').toUpperCase().trim().replace(/\s+/g, ' ')

export async function GET(req: NextRequest) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 })

  const tenantId = await autenticar(client, req)
  if (!tenantId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // ── 1. Buscar titulares de todos os links ──────────────────────────────────
  const { data: titulares, error: errTit } = await client
    .from('obras_links_titulares')
    .select('obra_link_id, obra_id, funcao_no_link, nome, percentual_exec_publica, status_controle')
    .eq('tenant_id', tenantId)

  if (errTit) return NextResponse.json({ error: errTit.message }, { status: 500 })

  // ── 2. Obras ───────────────────────────────────────────────────────────────
  const { data: obras } = await client
    .from('obras')
    .select('id, titulo, codigo_obra')
    .eq('tenant_id', tenantId)

  // ── 3. Links (numero_link) ─────────────────────────────────────────────────
  const { data: obraLinks } = await client
    .from('obras_links')
    .select('id, obra_id, numero_link')
    .eq('tenant_id', tenantId)

  // ── 4. Negócios editoriais ativos ──────────────────────────────────────────
  const { data: negocios } = await client
    .from('negocios_editoriais')
    .select('id, editora_administrada_nome, editora_administradora_nome, percentual_administrada, percentual_administradora, status, deleted_at, percentuais_brasil, percentuais_exterior')
    .eq('tenant_id', tenantId)
    .eq('status', 'ativo')
    .is('deleted_at', null)

  // ── 5. Índices rápidos ─────────────────────────────────────────────────────
  const obraById   = new Map((obras ?? []).map((o: any) => [o.id, o]))
  const linkById   = new Map((obraLinks ?? []).map((l: any) => [l.id, l]))

  // Índice de negócio por nome normalizado da administradora
  const negocioByAmNome = new Map<string, any>()
  for (const ne of (negocios ?? [])) {
    const key = norm(ne.editora_administradora_nome ?? '')
    if (key && !negocioByAmNome.has(key)) negocioByAmNome.set(key, ne)
  }

  // ── 6. Agrupar titulares por link ─────────────────────────────────────────
  const linksMap = new Map<string, any[]>()
  for (const t of (titulares ?? [])) {
    const list = linksMap.get(t.obra_link_id) ?? []
    list.push(t)
    linksMap.set(t.obra_link_id, list)
  }

  // ── 7. Calcular confronto por link ─────────────────────────────────────────
  const resultados: any[] = []

  for (const [linkId, titList] of linksMap) {
    const amEntries = titList.filter((t: any) => t.funcao_no_link === 'AM')
    if (amEntries.length === 0) continue  // apenas links com AM

    const eEntries   = titList.filter((t: any) => t.funcao_no_link === 'E')
    const ctrlList   = titList.filter((t: any) => t.status_controle === 'controlado')
    const totalPrCtrl = ctrlList.reduce((s: number, t: any) => s + (t.percentual_exec_publica ?? 0), 0)

    const amPr   = amEntries.reduce((s: number, t: any) => s + (t.percentual_exec_publica ?? 0), 0)
    const ePr    = eEntries.reduce((s: number, t: any) => s + (t.percentual_exec_publica ?? 0), 0)
    const amNome = amEntries[0]?.nome ?? ''
    const eNome  = eEntries[0]?.nome ?? ''

    // Analítico de cada um dentro do total controlado
    const pctAmAnalitico = totalPrCtrl > 0 ? Math.round((amPr / totalPrCtrl) * 10000) / 100 : null
    const pctEAnalitico  = totalPrCtrl > 0 ? Math.round((ePr  / totalPrCtrl) * 10000) / 100 : null

    // Razão entre E e AM dentro da fatia editorial (publisher portion)
    const publisherPr = ePr + amPr
    const pctAmSobrePublisher = publisherPr > 0 ? Math.round((amPr / publisherPr) * 10000) / 100 : null
    const pctESobrePublisher  = publisherPr > 0 ? Math.round((ePr  / publisherPr) * 10000) / 100 : null

    // Busca negócio cadastrado pela AM
    const negocio = negocioByAmNome.get(norm(amNome))

    // Percentual específico de repr_fonomecanica no negócio (se existir)
    const negFono = negocio?.percentuais_brasil?.repr_fonomecanica
      ?? negocio?.percentuais_exterior?.repr_fonomecanica
      ?? null

    const negPctAm = negFono?.administradora ?? negocio?.percentual_administradora ?? null
    const negPctE  = negFono?.administrada   ?? negocio?.percentual_administrada   ?? null

    let status: string
    let diferenca: number | null = null

    if (eEntries.length === 0) {
      status = 'sem_e'  // link com AM mas sem E (estrutura direta)
    } else if (!negocio) {
      status = 'sem_negocio'
    } else if (pctAmSobrePublisher !== null && negPctAm !== null) {
      diferenca = Math.round(Math.abs(pctAmSobrePublisher - negPctAm) * 100) / 100
      status = diferenca <= 0.5 ? 'ok' : 'divergente'
    } else {
      status = 'sem_dados'
    }

    const obraId  = titList[0]?.obra_id
    const obra    = obraById.get(obraId)
    const linkRec = linkById.get(linkId)

    resultados.push({
      obra_id:               obraId,
      titulo:                obra?.titulo ?? '—',
      codigo:                obra?.codigo_obra ?? '—',
      link:                  linkRec?.numero_link ?? 1,
      e_nome:                eNome || '—',
      am_nome:               amNome,
      e_pr:                  ePr,
      am_pr:                 amPr,
      total_pr_ctrl:         totalPrCtrl,
      pct_e_analitico:       pctEAnalitico,
      pct_am_analitico:      pctAmAnalitico,
      pct_e_publisher:       pctESobrePublisher,
      pct_am_publisher:      pctAmSobrePublisher,
      negocio_id:            negocio?.id ?? null,
      negocio_nome:          negocio ? `${negocio.editora_administrada_nome} × ${negocio.editora_administradora_nome}` : null,
      negocio_pct_e:         negPctE,
      negocio_pct_am:        negPctAm,
      diferenca,
      status,
    })
  }

  // ── 8. Ordenar: divergente → sem_negocio → sem_e → sem_dados → ok ─────────
  const ORDER: Record<string, number> = { divergente: 0, sem_negocio: 1, sem_e: 2, sem_dados: 3, ok: 4 }
  resultados.sort((a, b) => {
    const oa = ORDER[a.status] ?? 99
    const ob = ORDER[b.status] ?? 99
    if (oa !== ob) return oa - ob
    return a.titulo.localeCompare(b.titulo)
  })

  const summary = {
    total:       resultados.length,
    ok:          resultados.filter(r => r.status === 'ok').length,
    divergente:  resultados.filter(r => r.status === 'divergente').length,
    sem_negocio: resultados.filter(r => r.status === 'sem_negocio').length,
    sem_e:       resultados.filter(r => r.status === 'sem_e').length,
  }

  return NextResponse.json({ summary, resultados })
}
