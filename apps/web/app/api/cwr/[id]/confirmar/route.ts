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
  const { data } = await client.from('usuarios').select('id,tenant_id,role').eq('auth_user_id', user.id).single()
  return data ? { userId: data.id as string, tenantId: data.tenant_id as string, role: data.role as string } : null
}

// —— POST /api/cwr/[id]/confirmar ——————————————————————————————————————

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  // —— 1. Verificar importação ————————————————————————————————————————
  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('id,status,tenant_id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })
  if (imp.status === 'confirmado') return NextResponse.json({ error: 'Importação já confirmada' }, { status: 400 })

  // —— 2. Carregar staging ————————————————————————————————————————————
  const { data: obrasImp, error: errStaging } = await client
    .from('cwr_importacoes_obras')
    .select('*')
    .eq('importacao_id', id)

  if (errStaging) {
    return NextResponse.json({ error: 'Erro ao ler obras da importação', detail: errStaging.message }, { status: 500 })
  }

  const rows = obrasImp ?? []

  // —— 3. Separar por tipo ————————————————————————————————————————————
  const novasRows  = rows.filter(r => r.match_tipo === 'nova')
  const conflitos  = rows.filter(r => r.match_tipo === 'conflito')
  const vinculadas = rows.filter(r => r.match_tipo === 'vinculada')

  // —— 4. Construir payload de obras com codigo_obra único ————————————
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
      _stagingId: row.id as string,
      tenant_id:       usuario.tenantId,
      titulo,
      iswc:            (snap.iswc as string | null) ?? null,
      status_catalogo: 'pre_cadastro' as const,
      origem_cadastro: 'importacao_cwr' as const,
      codigo_obra:     codigo,
    }
  })

  // —— 5. Insert em lote ——————————————————————————————————————————————
  const dbPayloads = obraPayloads.map(({ _stagingId: _s, ...rest }) => rest)
  const { data: obrasInseridas, error: errInsert } = await client
    .from('obras')
    .insert(dbPayloads)
    .select('id, codigo_obra')

  if (errInsert) {
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

  // —— 6. Mapear IDs retornados ———————————————————————————————————————
  const codigoToId: Record<string, string> = {}
  for (const o of obrasInseridas) {
    codigoToId[o.codigo_obra] = o.id
  }

  // —— 7. Fonogramas + atualizar staging (sem materialização editorial) ——
  let fonogramas_criados = 0
  for (const payload of obraPayloads) {
    const obraId  = codigoToId[payload.codigo_obra]
    const row     = novasRows[obraPayloads.indexOf(payload)]
    const snap    = row.snapshot_cwr as Record<string, unknown>

    await client.from('cwr_importacoes_obras').update({ obra_id: obraId }).eq('id', row.id)

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

  // —— 8. Confirmar obra sem materializar cadeia editorial definitiva ——

  // —— 9. Registrar conflitos ————————————————————————————————————————
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

  // —— 9. Contadores editoriais ————————————————————————————————————————
  let participantes_controlados = 0, participantes_nao_controlados = 0, participantes_adm_ext = 0
  for (const row of rows) {
    const status = row.status_editorial as string
    if (status === 'controlado') participantes_controlados++
    else if (status === 'administrado_externo') participantes_adm_ext++
    else participantes_nao_controlados++
  }

  // —— 10. Relatório final ————————————————————————————————————————————
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

  // —— 11. Marcar como confirmado ——————————————————————————————————————
  const { error: errConfirm } = await client
    .from('cwr_importacoes')
    .update({ status: 'confirmado', relatorio, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (errConfirm) {
    console.error('[CWR confirmar] CRÍTICO: obras inseridas mas status não atualizou:', errConfirm)
    return NextResponse.json({
      error:       'Obras criadas mas falha ao finalizar importação.',
      detail:      errConfirm.message,
      obras_novas: obrasInseridas.length,
    }, { status: 500 })
  }

  return NextResponse.json({ ok: true, relatorio })
}