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
  const { data } = await client.from('usuarios').select('id,tenant_id,role').eq('auth_user_id', user.id).single()
  return data ? { userId: data.id as string, tenantId: data.tenant_id as string, role: data.role as string } : null
}

// ── POST /api/cwr/[id]/confirmar ──────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  // ── 1. Verificar importação ──────────────────────────────────────────────────
  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('id,status,tenant_id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })
  if (imp.status === 'confirmado') return NextResponse.json({ error: 'Importação já confirmada' }, { status: 400 })

  // ── 2. Carregar staging ──────────────────────────────────────────────────────
  const { data: obrasImp, error: errStaging } = await client
    .from('cwr_importacoes_obras')
    .select('*')
    .eq('importacao_id', id)

  if (errStaging) {
    return NextResponse.json({ error: 'Erro ao ler obras da importação', detail: errStaging.message }, { status: 500 })
  }

  const rows = obrasImp ?? []

  // ── 3. Separar por tipo ──────────────────────────────────────────────────────
  const novasRows  = rows.filter(r => r.match_tipo === 'nova')
  const conflitos  = rows.filter(r => r.match_tipo === 'conflito')
  const vinculadas = rows.filter(r => r.match_tipo === 'vinculada')

  // ── 4. Construir payload de obras com codigo_obra único ──────────────────────
  // Evitar duplicatas dentro do próprio lote
  const codigosUsados = new Set<string>()
  const obraPayloads = novasRows.map((row, idx) => {
    const snap = row.snapshot_cwr as Record<string, unknown>
    const titulo  = ((snap.titulo as string) ?? 'Sem título').trim()
    let codigo    = ((snap.submitter_work_no as string) ?? '').trim()
    if (!codigo || codigosUsados.has(codigo)) {
      codigo = `CWR-${id.slice(0, 8)}-${idx + 1}`
    }
    codigosUsados.add(codigo)
    return {
      _stagingId: row.id as string,           // não vai para o banco — apenas para mapeamento
      tenant_id:       usuario.tenantId,
      titulo,
      iswc:            (snap.iswc as string | null) ?? null,
      status_catalogo: 'pre_cadastro' as const,
      origem_cadastro: 'importacao_cwr' as const,
      codigo_obra:     codigo,
    }
  })

  // ── 5. Insert em lote — ATÔMICO: se falhar, nenhuma obra é criada ────────────
  const dbPayloads = obraPayloads.map(({ _stagingId: _s, ...rest }) => rest)
  const { data: obrasInseridas, error: errInsert } = await client
    .from('obras')
    .insert(dbPayloads)
    .select('id, codigo_obra')

  if (errInsert) {
    // Não marca como confirmado — retorna o erro para o frontend
    console.error('[CWR confirmar] Falha no insert em lote:', errInsert)
    return NextResponse.json({
      error:  'Falha ao criar obras no banco de dados.',
      detail: errInsert.message,
      code:   errInsert.code,
    }, { status: 500 })
  }

  if (!obrasInseridas || obrasInseridas.length !== novasRows.length) {
    return NextResponse.json({
      error:    'Insert incompleto: número de obras criadas diverge do esperado.',
      esperado: novasRows.length,
      criadas:  obrasInseridas?.length ?? 0,
    }, { status: 500 })
  }

  // ── 6. Mapear IDs retornados → staging rows ──────────────────────────────────
  const codigoToId: Record<string, string> = {}
  for (const o of obrasInseridas) {
    codigoToId[o.codigo_obra] = o.id
  }

  // ── 7. Fonogramas + atualizar staging (erros aqui não revertem obras) ─────────
  let fonogramas_criados = 0
  for (const payload of obraPayloads) {
    const obraId  = codigoToId[payload.codigo_obra]
    const row     = novasRows[obraPayloads.indexOf(payload)]
    const snap    = row.snapshot_cwr as Record<string, unknown>

    // Atualizar staging com obra_id real
    await client.from('cwr_importacoes_obras').update({ obra_id: obraId }).eq('id', row.id)

    // Fonogramas
    const fono = (snap.fonogramas as unknown[]) ?? []
    if (fono.length > 0) {
      const fonoRows = fono.map((f: unknown) => {
        const fg = f as Record<string, unknown>
        return {
          obra_id:          obraId,
          tenant_id:        usuario.tenantId,
          isrc:             fg.isrc       ?? null,
          titulo_fonograma: (fg.titulo as string) ?? payload.titulo,
          interprete:       (fg.interprete as string) ?? '',
          versao:           (fg.versao as string) ?? 'original',
          ano_gravacao:     fg.ano        ?? null,
        }
      })
      await client.from('fonogramas').insert(fonoRows)
      fonogramas_criados += fono.length
    }
  }

  // ── 8. Criar obras_links + obras_links_titulares a partir do snapshot ────────
  const FUNCAO_OK = new Set<string>(['CA','V','SA','E','AM','SE','C','CE','A','I','M','T','AD','H'])
  function sanitizeFuncaoAutor(p: string): string {
    const r = (p ?? '').toUpperCase().trim()
    if (FUNCAO_OK.has(r)) return r
    if (r === 'AR' || r === 'AE') return 'AD'
    if (r === 'ES')               return 'CA'
    if (r === 'PA')               return 'A'
    if (r === 'TR')               return 'T'
    return 'CA'
  }
  function sanitizeFuncaoEditora(tipo: string, papel: string): string {
    const t = (tipo ?? papel ?? '').toUpperCase().trim()
    if (FUNCAO_OK.has(t)) return t
    if (t === 'AQ')       return 'AM'
    if (t === 'ES')       return 'SE'
    return 'E'
  }

  const linksPayload = obraPayloads.map(p => ({
    obra_id:         codigoToId[p.codigo_obra],
    tenant_id:       usuario.tenantId,
    numero_link:     1,
    percentual_link: 100,
    tipo_link:       'controlado',
    controlado:      true,
    status:          'ativo',
  }))

  const { data: linksCreated } = await client
    .from('obras_links')
    .insert(linksPayload)
    .select('id, obra_id')

  if (linksCreated?.length) {
    const obraToLink: Record<string, string> = {}
    for (const l of linksCreated) obraToLink[l.obra_id as string] = l.id as string

    const allTitulares: Record<string, unknown>[] = []
    for (const payload of obraPayloads) {
      const obraId = codigoToId[payload.codigo_obra]
      const linkId = obraToLink[obraId]
      if (!linkId) continue
      const row  = novasRows[obraPayloads.indexOf(payload)]
      const snap = row.snapshot_cwr as Record<string, unknown>
      for (const a of ((snap.autores as any[]) ?? [])) {
        if (!(a.nome as string)?.trim()) continue
        allTitulares.push({
          obra_link_id: linkId, obra_id: obraId, tenant_id: usuario.tenantId,
          titular_id: null,
          nome: (a.nome as string)?.trim() ?? '',
          funcao_no_link: sanitizeFuncaoAutor(a.papel ?? ''),
          percentual_exec_publica: a.pr_pct ?? 0,
          // GUARDA DEFENSIVA: autores nunca coletam MR diretamente (SWR/OWR/CA/C/A/V/AD)
          // AM coleta em nome deles — gravar aqui duplicaria o valor no BackOffice.
          percentual_fonomecanico: 0,
          percentual_sincronizacao: a.sr_pct ?? 0,
          ipi: a.ipi ?? null,
          status_controle: a.controlled ? 'controlado' : 'nao_controlado',
        })
      }
      // AM MR = soma dos PR controlados do link (NUNCA o valor bruto SPT do CWR)
      const autoresSnap = (snap.autores as any[]) ?? []
      const mrAmCorreto = calcularMrAM(
        autoresSnap.map((a: any) => ({ pr_pct: a.pr_pct ?? 0, controlled: a.controlled ?? false }))
      )
      for (const e of ((snap.editoras as any[]) ?? [])) {
        if (!(e.nome as string)?.trim()) continue
        const funcaoEd = sanitizeFuncaoEditora(e.tipo ?? '', e.papel ?? '')
        // Regra BackOffice: E/SE/SA → MR=0; AM → soma PR controlados (não valor bruto CWR)
        const mrEd = deveZerarMR(funcaoEd) ? 0 : mrAmCorreto
        allTitulares.push({
          obra_link_id: linkId, obra_id: obraId, tenant_id: usuario.tenantId,
          titular_id: null,
          nome: (e.nome as string)?.trim() ?? '',
          funcao_no_link: funcaoEd,
          percentual_exec_publica: e.pr_pct ?? 0, percentual_fonomecanico: mrEd,
          percentual_sincronizacao: e.sr_pct ?? 0,
          ipi: e.ipi ?? null,
          status_controle: e.controlled ? 'controlado' : 'nao_controlado',
        })
      }
    }
    for (let i = 0; i < allTitulares.length; i += 500) {
      await client.from('obras_links_titulares').insert(allTitulares.slice(i, i + 500))
    }
  }

  // ── 9. Registrar conflitos ───────────────────────────────────────────────────
  for (const row of conflitos) {
    const snap = row.snapshot_cwr as Record<string, unknown>
    await client.from('cwr_conflitos').insert({
      importacao_id: id,
      obra_id:       row.obra_id,
      tipo:          'divergencia_geral',
      descricao:     'Obra em catalogo_ativo com dados divergentes no CWR',
      dados_cwr:     snap,
      dados_sistema: { obra_id: row.obra_id },
    })
  }

  // ── 9. Contadores editoriais ─────────────────────────────────────────────────
  let participantes_controlados = 0, participantes_nao_controlados = 0, participantes_adm_ext = 0
  for (const row of rows) {
    const status = row.status_editorial as string
    if (status === 'controlado') participantes_controlados++
    else if (status === 'administrado_externo') participantes_adm_ext++
    else participantes_nao_controlados++
  }

  // ── 10. Relatório final ───────────────────────────────────────────────────────
  const relatorio = {
    obras_lidas:                  rows.length,
    obras_novas:                  obrasInseridas.length,
    obras_vinculadas:             vinculadas.length,
    obras_ignoradas:              0,
    obras_divergentes:            0,
    titulares_novos:              0,
    titulares_vinculados:         0,
    editoras_novas:               0,
    editoras_vinculadas:          0,
    negocios_editoriais_criados:  obrasInseridas.length,
    fonogramas_criados,
    fonogramas_vinculados:        0,
    participantes_controlados,
    participantes_nao_controlados,
    participantes_administrado_externo: participantes_adm_ext,
    conflitos_editoriais:         conflitos.length,
  }

  // ── 11. Marcar como confirmado — só aqui, depois de tudo ok ──────────────────
  const { error: errConfirm } = await client
    .from('cwr_importacoes')
    .update({ status: 'confirmado', relatorio, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (errConfirm) {
    // Obras já foram criadas mas o status não atualizou — log crítico
    console.error('[CWR confirmar] CRÍTICO: obras inseridas mas status não atualizou:', errConfirm)
    return NextResponse.json({
      error:       'Obras criadas mas falha ao finalizar importação.',
      detail:      errConfirm.message,
      obras_novas: obrasInseridas.length,
    }, { status: 500 })
  }

  return NextResponse.json({ ok: true, relatorio })
}
