import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processarRecebimentoCCObra, getAdminClientForCC } from '@/lib/logica-cc-obra-v2'
import type { RecebimentoInput } from '@/lib/logica-cc-obra-v2'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autenticar(req: NextRequest, sb: any): Promise<{ tenant_id: string; role: string } | null> {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim()
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('usuarios').select('tenant_id, role').eq('auth_user_id', user.id).single()
  const u = data as { tenant_id: string; role: string } | null
  return u
}

// ── GET /api/recebimentos/[id] — detalhe ──────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const { data, error } = await sb
    .from('recebimentos')
    .select(`
      *,
      obra:obra_id ( id, titulo, codigo_interno_legado, iswc ),
      tipo_direito:tipo_direito_id ( id, codigo, nome )
    `)
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 })

  // Buscar movimentos de CC associados
  const { data: movimentos } = await sb
    .from('cc_obras_movimentos')
    .select('*')
    .eq('recebimento_id', id)
    .eq('tenant_id', usuario.tenant_id)
    .order('status_movimento', { ascending: true })

  return NextResponse.json({ data, movimentos: movimentos ?? [] })
}

// ── PUT /api/recebimentos/[id] — atualizar status/observações ────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['master', 'admin', 'financeiro'].includes(usuario.role)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  const { id } = await params

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  // Apenas campos editáveis manualmente
  const editaveis = ['status', 'observacoes', 'tipo_direito_id', 'territorio']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const campo of editaveis) {
    if (campo in body) update[campo] = body[campo]
  }

  const { data, error } = await sb
    .from('recebimentos')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── POST /api/recebimentos/[id]/processar — executar CC Obra ──────────────────
// Rota especial: /api/recebimentos/[id] com body action='processar'
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['master', 'admin', 'financeiro'].includes(usuario.role)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  const { id } = await params

  // Buscar recebimento completo
  const { data: rec, error: recErr } = await sb
    .from('recebimentos')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (recErr || !rec) return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 })
  if (!rec.obra_id) return NextResponse.json({ error: 'Recebimento sem obra vinculada — vincule uma obra primeiro' }, { status: 422 })

  const input: RecebimentoInput = {
    id:                  rec.id,
    obra_id:             rec.obra_id,
    tenant_id:           rec.tenant_id,
    valor_bruto:         Number(rec.valor_bruto),
    tipo_direito_id:     rec.tipo_direito_id ?? undefined,
    territorio:          rec.territorio ?? 'BR',
    competencia_inicio:  rec.competencia_inicio,
    competencia_fim:     rec.competencia_fim,
    fonte_pagadora_codigo: rec.fonte_pagadora_codigo,
    fonte_pagadora_tipo:  rec.fonte_pagadora_tipo ?? undefined,
    moeda:               rec.moeda ?? 'BRL',
    cotacao_brl:         rec.cotacao_brl ? Number(rec.cotacao_brl) : undefined,
  }

  try {
    const sbAdmin = getAdminClientForCC()
    const resultado = await processarRecebimentoCCObra(sbAdmin, input)

    // Atualizar status do recebimento
    const novoStatus = resultado.fonte_excluida ? 'auditado'
      : resultado.alertas.length > 0 && resultado.total_retido > 0 ? 'pendente_matching'
      : 'distribuido'

    await sb.from('recebimentos')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ resultado })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
