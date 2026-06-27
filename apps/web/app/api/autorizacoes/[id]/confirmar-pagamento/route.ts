/**
 * POST /api/autorizacoes/[id]/confirmar-pagamento
 *
 * Regras de negócio:
 *  - pago_editora : confirma pagamento → cria entrada em cc_obras_movimentos
 *  - pago_autor   : confirma pagamento → NÃO alimenta cc_obras (pagamento direto ao autor)
 *  - sem_onus     : sem valor          → NÃO alimenta cc_obras
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAudit }                  from '@/lib/audit'

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
    if (m) { chunks[parseInt(m[1])] = c.value; continue }
    if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) { chunks[0] = c.value }
  }
  const joined = chunks.filter(Boolean).join('')
  if (joined) {
    try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) return p.access_token } catch { /**/ }
    try { const p = JSON.parse(joined); if (p?.access_token) return p.access_token } catch { /**/ }
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body   = await req.json().catch(() => ({}))
  const {
    valor_pago,
    data_pagamento = new Date().toISOString().slice(0, 10),
    forma_pagamento,
    observacoes,
  } = body

  // ── Buscar autorização ────────────────────────────────────────────────────
  const { data: aut, error: autErr } = await sb
    .from('autorizacoes')
    .select('id, tenant_id, obra_id, numero_autorizacao, licenciado_nome, valor_licenca, modelo_negocio, status_workflow, cc_movimento_id, editora_administrada_id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (autErr || !aut) return NextResponse.json({ error: 'Autorização não encontrada' }, { status: 404 })
  if ((aut as any).cc_movimento_id) return NextResponse.json({ error: 'Pagamento já confirmado' }, { status: 409 })

  const modelo      = (aut as any).modelo_negocio ?? 'pago_editora'
  const valorFinal  = valor_pago ?? (aut as any).valor_licenca ?? 0
  const obra_id     = (aut as any).obra_id
  const numAut      = (aut as any).numero_autorizacao ?? id.slice(0, 8)
  const licNome     = (aut as any).licenciado_nome ?? 'Licenciado'
  const editoraAdmId = (aut as any).editora_administrada_id ?? null

  // Buscar nome da editora administradora para descrição do movimento
  let editoraAdmNome = 'Editora Administradora'
  if (editoraAdmId) {
    const { data: edAdm } = await sb.from('editoras').select('nome').eq('id', editoraAdmId).single()
    if (edAdm) editoraAdmNome = (edAdm as any).nome
  }

  // ── Atualizar status da autorização ──────────────────────────────────────
  const patchAut: Record<string, unknown> = {
    data_pagamento_confirmado: new Date(data_pagamento).toISOString(),
    valor_pago: valorFinal,
    validada_em: new Date().toISOString(),   // pago_editora/pago_autor validam aqui
  }
  // Só muda status se ainda não estiver em estado final
  const statusAtual = (aut as any).status_workflow
  if (!['cancelada', 'expirada'].includes(statusAtual)) {
    patchAut.status_workflow = 'emitida'
    patchAut.status          = 'vigente'
  }

  // ── Lógica CC por modelo de negócio ──────────────────────────────────────
  let movimentoId: string | null = null

  if (modelo === 'pago_editora' && valorFinal > 0 && obra_id) {
    // 1. Garantir que existe um cc_obras para esta obra
    const { data: ccExist } = await sb
      .from('cc_obras')
      .select('id, saldo_atual')
      .eq('obra_id', obra_id)
      .eq('tenant_id', usuario.tenant_id)
      .maybeSingle()

    let ccObraId: string
    let saldoAnterior = 0

    if (ccExist) {
      ccObraId     = (ccExist as any).id
      saldoAnterior = Number((ccExist as any).saldo_atual ?? 0)
    } else {
      const { data: ccNovo, error: ccErr } = await sb
        .from('cc_obras')
        .insert({
          tenant_id:        usuario.tenant_id,
          obra_id,
          saldo_atual:      0,
          saldo_bloqueado:  0,
          saldo_distribuido: 0,
          saldo_pendente:   0,
          moeda:            'BRL',
          status:           'ativo',
        })
        .select('id')
        .single()

      if (ccErr) return NextResponse.json({ error: `Erro ao criar cc_obras: ${ccErr.message}` }, { status: 500 })
      ccObraId = (ccNovo as any).id
    }

    const saldoPosterior = saldoAnterior + Number(valorFinal)

    // 2. Inserir movimento de entrada
    const { data: mov, error: movErr } = await sb
      .from('cc_obras_movimentos')
      .insert({
        tenant_id:       usuario.tenant_id,
        cc_obra_id:      ccObraId,
        obra_id,
        tipo:            'entrada',
        valor:           valorFinal,
        saldo_anterior:  saldoAnterior,
        saldo_posterior: saldoPosterior,
        descricao:       `Autorização ${numAut} — ${licNome} → ${editoraAdmNome}`,
        source:          'autorizacao',
        source_id:       id,
        forma_pagamento: forma_pagamento ?? null,
        observacoes:     observacoes ?? null,
        criado_em:       new Date(data_pagamento).toISOString(),
      })
      .select('id')
      .single()

    if (movErr) return NextResponse.json({ error: `Erro ao criar movimento CC: ${movErr.message}` }, { status: 500 })
    movimentoId = (mov as any).id

    // 3. Atualizar saldo em cc_obras
    await sb.from('cc_obras').update({ saldo_atual: saldoPosterior }).eq('id', ccObraId)

    patchAut.cc_movimento_id = movimentoId
  }
  // pago_autor → pagamento direto ao autor, não alimenta cc_obras
  // sem_onus   → sem valor, não alimenta cc_obras

  // ── Salvar patch na autorização ──────────────────────────────────────────
  const { data: autAtualizada, error: patchErr } = await sb
    .from('autorizacoes')
    .update(patchAut)
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select()
    .single()

  if (patchErr) return NextResponse.json({ error: patchErr.message }, { status: 500 })

  await logAudit({
    tenant_id:       usuario.tenant_id,
    usuario_id:      usuario.id,
    acao:            'confirmar_pagamento',
    modulo:          'autorizacoes',
    tabela_afetada:  'autorizacoes',
    registro_id:     id,
    dados_novos:     { modelo_negocio: modelo, valor_pago: valorFinal, movimentoId } as Record<string, unknown>,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({
    autorizacao:   autAtualizada,
    modelo_negocio: modelo,
    cc_movimento_id: movimentoId,
    cc_atualizado:  modelo === 'pago_editora' && movimentoId !== null,
    mensagem: modelo === 'pago_editora'
      ? `Pagamento confirmado. Entrada de R$ ${Number(valorFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrada no conta corrente da obra.`
      : modelo === 'pago_autor'
      ? 'Pagamento confirmado. Valor pago diretamente ao autor — conta corrente de obra não afetada.'
      : 'Autorização sem ônus confirmada — nenhum valor a distribuir.',
  })
}
