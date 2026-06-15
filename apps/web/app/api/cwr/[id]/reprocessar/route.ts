import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseCwr } from '@/lib/cwr-parser'
import { matchObra, matchAutor, matchEditora } from '@/lib/cwr-matching'

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

// ── POST /api/cwr/[id]/reprocessar ────────────────────────────────────────────
// Lê conteudo_raw do banco, re-parseia com o parser atualizado e substitui
// snapshots de forma segura: INSERT novo lote → só então DELETE lote antigo.
// Se o INSERT falhar, o lote antigo é preservado intacto.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  // 1. Carregar importação
  const { data: imp, error: errImp } = await client
    .from('cwr_importacoes')
    .select('id,status,tenant_id,conteudo_raw,nome_arquivo')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp || errImp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })
  if (imp.status === 'confirmado') {
    return NextResponse.json({ error: 'Importação já confirmada — não pode ser reprocessada' }, { status: 400 })
  }
  if (!imp.conteudo_raw) {
    return NextResponse.json({ error: 'conteudo_raw ausente — impossível reprocessar' }, { status: 422 })
  }

  // 2. Re-parsear usando o parser atualizado
  const parsed = parseCwr(imp.conteudo_raw as string)

  // 3. Buscar obras, titulares e editoras existentes para novo matching
  const [
    { data: obrasExist },
    { data: titularesExist },
    { data: editorasExist },
    { data: contratosValidos },
  ] = await Promise.all([
    client.from('obras').select('id,codigo_obra,iswc,titulo,status_catalogo').eq('tenant_id', usuario.tenantId).is('deleted_at', null),
    client.from('titulares').select('id,nome,ipi').eq('tenant_id', usuario.tenantId),
    client.from('editoras').select('id,nome,ipi').eq('tenant_id', usuario.tenantId),
    client.from('contratos').select('titular_id').eq('tenant_id', usuario.tenantId).in('status', ['aprovado_admin', 'validado', 'assinado']),
  ])

  const titularIdsComContrato = new Set((contratosValidos ?? []).map((c: Record<string, string>) => c.titular_id))
  const titularesComStatus = (titularesExist ?? []).map((t: Record<string, string>) => ({
    ...t,
    tem_contrato_valido: titularIdsComContrato.has(t.id),
  }))

  // 4. Matching por obra
  const obrasAnalisadas = parsed.obras.map(cwrObra => {
    const matchResult  = matchObra(cwrObra, (obrasExist ?? []) as Parameters<typeof matchObra>[1])
    const autoresMatch = cwrObra.autores.map(a => matchAutor(a, titularesComStatus as Parameters<typeof matchAutor>[1]))
    const editorasMatch = cwrObra.editoras.map(e => matchEditora(e, (editorasExist ?? []) as Parameters<typeof matchEditora>[1]))
    return { cwr: cwrObra, match: matchResult, autores: autoresMatch, editoras: editorasMatch }
  })

  // 5. Substituição segura: capturar IDs antigos → INSERT novo lote → DELETE lote antigo
  // Se o INSERT falhar, o lote antigo é preservado e o erro é retornado.

  // 5a. Validar que o parse produziu dados antes de tocar o banco
  if (obrasAnalisadas.length === 0) {
    return NextResponse.json(
      { error: 'Parser não produziu obras — reprocessamento cancelado, snapshot anterior mantido' },
      { status: 422 }
    )
  }

  // 5b. Capturar IDs do lote atual (antes de inserir o novo)
  const { data: existingRows } = await client
    .from('cwr_importacoes_obras')
    .select('id')
    .eq('importacao_id', id)
  const oldIds = (existingRows ?? []).map((r: { id: string }) => r.id)

  // 5c. Montar novo lote
  const rows = obrasAnalisadas.map(o => ({
    importacao_id:     id,
    obra_id:           o.match.obra_id,
    snapshot_cwr:      o.cwr,
    match_tipo:        o.match.match_tipo,
    match_score:       o.match.match_score,
    match_criterio:    o.match.match_criterio,
    status_editorial:  o.autores.find(a => a.status_editorial === 'controlado') ? 'controlado' : 'em_validacao',
    negocio_editorial: {
      percentual_total: o.cwr.percentual_total,
      editoras:         o.editoras,
    },
    fonogramas:  o.cwr.fonogramas,
    titulos_alt: o.cwr.titulos_alt,
  }))

  // 5d. INSERT novo lote PRIMEIRO — se falhar, snapshot anterior intacto
  const { error: errInsert } = await client.from('cwr_importacoes_obras').insert(rows)
  if (errInsert) return NextResponse.json({ error: errInsert.message }, { status: 500 })

  // 5e. Só após insert com sucesso, deletar lote antigo pelos IDs capturados
  if (oldIds.length > 0) {
    const chunkSize = 200
    for (let i = 0; i < oldIds.length; i += chunkSize) {
      await client
        .from('cwr_importacoes_obras')
        .delete()
        .in('id', oldIds.slice(i, i + chunkSize))
    }
  }

  // 6. Métricas de reprocessamento
  const stats = {
    obras_lidas:          obrasAnalisadas.length,
    obras_novas:          obrasAnalisadas.filter(o => o.match.match_tipo === 'nova').length,
    obras_vinculadas:     obrasAnalisadas.filter(o => o.match.match_tipo === 'vinculada').length,
    obras_conflito:       obrasAnalisadas.filter(o => o.match.match_tipo === 'conflito').length,
    obras_divergentes:    obrasAnalisadas.filter(o => o.match.match_tipo === 'divergente').length,
    iswcs_recuperados:    obrasAnalisadas.filter(o => o.cwr.iswc).length,
    isrcs_recuperados:    obrasAnalisadas.reduce((acc, o) => acc + o.cwr.fonogramas.filter(f => f.isrc).length, 0),
    autores_com_nome:     obrasAnalisadas.reduce((acc, o) => acc + o.cwr.autores.filter(a => a.nome).length, 0),
    editoras_com_nome:    obrasAnalisadas.reduce((acc, o) => acc + o.cwr.editoras.filter(e => e.nome).length, 0),
    erros_parse:          parsed.erros_parse.length,
  }

  // 7. Atualizar status + marcar parser_versao = 2
  await client
    .from('cwr_importacoes')
    .update({
      status:      'em_analise',
      relatorio:   { parser_versao: 2, reprocessado_em: new Date().toISOString(), ...stats },
      updated_at:  new Date().toISOString(),
    })
    .eq('id', id)

  return NextResponse.json({ ok: true, stats })
}
