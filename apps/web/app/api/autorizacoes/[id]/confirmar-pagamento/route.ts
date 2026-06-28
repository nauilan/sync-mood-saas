import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'
import { resolverRecebedorEditorial } from '@/lib/editorial-recebedor'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function getToken(req: NextRequest): string {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const chunks: string[] = []
  for (const c of req.cookies.getAll()) {
    const m = c.name.match(/auth-token\.(\d+)$/)
    if (m) {
      chunks[parseInt(m[1])] = c.value
      continue
    }
    if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) chunks[0] = c.value
  }
  const joined = chunks.filter(Boolean).join('')
  if (joined) {
    try {
      const p = JSON.parse(decodeURIComponent(joined))
      if (p?.access_token) return p.access_token
    } catch {}
    try {
      const p = JSON.parse(joined)
      if (p?.access_token) return p.access_token
    } catch {}
  }
  return ''
}

async function autenticar(sb: NonNullable<ReturnType<typeof getAdminClient>>, req: NextRequest) {
  const token = getToken(req)
  if (!token) return null
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  return usuario as { id: string; tenant_id: string; role: string } | null
}

async function fetchRecebedorLinksCompat(sb: any, obraId: string, tenantId: string) {
  const { data: rows } = await sb.from('obras_links_titulares')
    .select([
      'funcao_no_link',
      'papel',
      'controlado',
      'status_controle',
      'percentual_controle_brasil',
      'percentual_controle_exterior',
      'percentual_exec_publica',
      'editora_id',
      'editora_original_id',
      'editora_administradora_id',
    ].join(', '))
    .eq('obra_id', obraId)
    .eq('tenant_id', tenantId)

  const baseRows = (rows ?? []) as Array<Record<string, unknown>>
  if (baseRows.length === 0) return []

  const editoraIds = Array.from(new Set(
    baseRows
      .flatMap((item) => [
        item.editora_id,
        item.editora_original_id,
        item.editora_administradora_id,
      ])
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  ))

  const { data: editoras } = editoraIds.length > 0
    ? await sb.from('editoras')
      .select('id, nome_fantasia, razao_social')
      .eq('tenant_id', tenantId)
      .in('id', editoraIds)
    : { data: [] as Array<Record<string, unknown>> }

  const editorasPorId = new Map(
    ((editoras ?? []) as Array<Record<string, unknown>>).map((item) => [
      String(item.id),
      {
        id: String(item.id),
        nome: String(item.nome_fantasia ?? item.razao_social ?? ''),
      },
    ]),
  )

  return baseRows.map((item) => ({
    papel: item.funcao_no_link ?? item.papel ?? null,
    controlado: item.controlado ?? null,
    status_controle: item.status_controle ?? null,
    percentual_controle_brasil: item.percentual_controle_brasil ?? item.percentual_exec_publica ?? null,
    percentual_controle_exterior: item.percentual_controle_exterior ?? item.percentual_exec_publica ?? null,
    percentual_controle: item.percentual_exec_publica ?? null,
    editora: item.editora_id ? editorasPorId.get(String(item.editora_id)) ?? null : null,
    editora_original: item.editora_original_id ? editorasPorId.get(String(item.editora_original_id)) ?? null : null,
    editora_administradora: item.editora_administradora_id ? editorasPorId.get(String(item.editora_administradora_id)) ?? null : null,
  }))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config invÃ¡lida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const {
    valor_pago,
    data_pagamento = new Date().toISOString().slice(0, 10),
    forma_pagamento,
    observacoes,
  } = body

  let aut: Record<string, unknown> | null = null
  let autErr: { message?: string } | null = null

  const tentativaNova = await sb
    .from('autorizacoes')
    .select('id, tenant_id, obra_id, numero_autorizacao, licenciado_nome, valor_licenca, modelo_negocio, status_workflow, cc_movimento_id, editora_administrada_id, pago_a')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (!tentativaNova.error && tentativaNova.data) {
    aut = tentativaNova.data as Record<string, unknown>
  } else {
    const tentativaLegada = await sb
      .from('autorizacoes')
      .select('id, tenant_id, obra_id, numero_autorizacao, licenciado_nome, valor_licenca, modelo_negocio, status_workflow, cc_movimento_id, editora_administrada_id')
      .eq('id', id)
      .eq('tenant_id', usuario.tenant_id)
      .single()

    autErr = tentativaLegada.error
    if (tentativaLegada.data) aut = tentativaLegada.data as Record<string, unknown>
  }

  if (autErr || !aut) return NextResponse.json({ error: 'AutorizaÃ§Ã£o nÃ£o encontrada' }, { status: 404 })
  if ((aut as any).cc_movimento_id) return NextResponse.json({ error: 'Pagamento jÃ¡ confirmado' }, { status: 409 })

  const modelo = (aut as any).modelo_negocio ?? 'pago_editora'
  const valorFinal = valor_pago ?? (aut as any).valor_licenca ?? 0
  const obra_id = (aut as any).obra_id
  const numAut = (aut as any).numero_autorizacao ?? id.slice(0, 8)
  const licNome = (aut as any).licenciado_nome ?? 'Licenciado'
  let recebedorEditoraId = (aut as any).pago_a ?? (aut as any).editora_administrada_id ?? null

  if (modelo === 'pago_editora' && obra_id && !recebedorEditoraId) {
    const linksRecebedor = await fetchRecebedorLinksCompat(sb, obra_id, usuario.tenant_id)
    const recebedor = resolverRecebedorEditorial(linksRecebedor as any)
    if (!recebedor.ok) {
      return NextResponse.json({
        error: 'Pagamento nÃ£o pode ser confirmado: falta recebedor vÃ¡lido (administradora ou editora original controlada).',
      }, { status: 422 })
    }
    recebedorEditoraId = recebedor.editoraId
  }

  let recebedorNome = 'Recebedor Editorial'
  if (recebedorEditoraId) {
    const { data: edAdm } = await sb.from('editoras').select('nome_fantasia, razao_social').eq('id', recebedorEditoraId).single()
    if (edAdm) recebedorNome = (edAdm as any).nome_fantasia ?? (edAdm as any).razao_social ?? recebedorNome
  }

  const patchAut: Record<string, unknown> = {
    data_pagamento_confirmado: new Date(data_pagamento).toISOString(),
    valor_pago: valorFinal,
    validada_em: new Date().toISOString(),
  }
  const statusAtual = (aut as any).status_workflow
  if (!['cancelada', 'expirada'].includes(statusAtual)) {
    patchAut.status_workflow = 'emitida'
    patchAut.status = 'vigente'
  }

  let movimentoId: string | null = null

  if (modelo === 'pago_editora' && valorFinal > 0 && obra_id) {
    const { data: ccExist } = await sb
      .from('cc_obras')
      .select('id, saldo_atual')
      .eq('obra_id', obra_id)
      .eq('tenant_id', usuario.tenant_id)
      .maybeSingle()

    let ccObraId: string
    let saldoAnterior = 0

    if (ccExist) {
      ccObraId = (ccExist as any).id
      saldoAnterior = Number((ccExist as any).saldo_atual ?? 0)
    } else {
      const { data: ccNovo, error: ccErr } = await sb
        .from('cc_obras')
        .insert({
          tenant_id: usuario.tenant_id,
          obra_id,
          saldo_atual: 0,
          saldo_bloqueado: 0,
          saldo_distribuido: 0,
          saldo_pendente: 0,
          moeda: 'BRL',
          status: 'ativo',
        })
        .select('id')
        .single()

      if (ccErr) return NextResponse.json({ error: `Erro ao criar cc_obras: ${ccErr.message}` }, { status: 500 })
      ccObraId = (ccNovo as any).id
    }

    const saldoPosterior = saldoAnterior + Number(valorFinal)

    const payloadMovCandidates: Record<string, unknown>[] = [
      {
        tenant_id: usuario.tenant_id,
        cc_obra_id: ccObraId,
        obra_id,
        tipo: 'entrada',
        valor: valorFinal,
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoPosterior,
        descricao: `AutorizaÃ§Ã£o ${numAut} â€” ${licNome} â†’ ${recebedorNome}`,
        source: 'autorizacao',
        source_id: id,
        editora_id: recebedorEditoraId,
        forma_pagamento: forma_pagamento ?? null,
        observacoes: observacoes ?? null,
        criado_em: new Date(data_pagamento).toISOString(),
      },
      {
        tenant_id: usuario.tenant_id,
        cc_obra_id: ccObraId,
        obra_id,
        tipo: 'entrada',
        valor: valorFinal,
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoPosterior,
        descricao: `AutorizaÃ§Ã£o ${numAut} â€” ${licNome} â†’ ${recebedorNome}`,
        source: 'autorizacao',
        source_id: id,
        editora_id: recebedorEditoraId,
        criado_em: new Date(data_pagamento).toISOString(),
      },
      {
        tenant_id: usuario.tenant_id,
        cc_obra_id: ccObraId,
        obra_id,
        tipo: 'entrada',
        valor: valorFinal,
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoPosterior,
        descricao: `AutorizaÃ§Ã£o ${numAut} â€” ${licNome} â†’ ${recebedorNome}`,
        source: 'autorizacao',
        editora_id: recebedorEditoraId,
      },
      {
        tenant_id: usuario.tenant_id,
        cc_obra_id: ccObraId,
        obra_id,
        tipo: 'entrada',
        valor: valorFinal,
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoPosterior,
        descricao: `AutorizaÃ§Ã£o ${numAut} â€” ${licNome} â†’ ${recebedorNome}`,
      },
    ]

    let movRes: { data?: unknown; error?: { message?: string } | null } = { data: null, error: null }
    for (const payloadMov of payloadMovCandidates) {
      movRes = await sb
        .from('cc_obras_movimentos')
        .insert(payloadMov as any)
        .select('id')
        .single()

      if (!movRes.error) break
    }

    const { data: mov, error: movErr } = movRes

    if (movErr) return NextResponse.json({ error: `Erro ao criar movimento CC: ${movErr.message}` }, { status: 500 })
    movimentoId = (mov as any).id

    await sb.from('cc_obras').update({ saldo_atual: saldoPosterior }).eq('id', ccObraId)
    patchAut.cc_movimento_id = movimentoId
  }

  const { data: autAtualizada, error: patchErr } = await sb
    .from('autorizacoes')
    .update(patchAut)
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select()
    .single()

  if (patchErr) return NextResponse.json({ error: patchErr.message }, { status: 500 })

  await logAudit({
    tenant_id: usuario.tenant_id,
    usuario_id: usuario.id,
    acao: 'confirmar_pagamento',
    modulo: 'autorizacoes',
    tabela_afetada: 'autorizacoes',
    registro_id: id,
    dados_novos: { modelo_negocio: modelo, valor_pago: valorFinal, movimentoId } as Record<string, unknown>,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({
    autorizacao: autAtualizada,
    modelo_negocio: modelo,
    cc_movimento_id: movimentoId,
    cc_atualizado: modelo === 'pago_editora' && movimentoId !== null,
    mensagem: modelo === 'pago_editora'
      ? `Pagamento confirmado. Entrada de R$ ${Number(valorFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrada no conta corrente da obra.`
      : modelo === 'pago_autor'
      ? 'Pagamento confirmado. Valor pago diretamente ao autor â€” conta corrente de obra nÃ£o afetada.'
      : 'AutorizaÃ§Ã£o sem Ã´nus confirmada â€” nenhum valor a distribuir.',
  })
}
