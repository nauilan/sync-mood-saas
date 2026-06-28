/**
 * GET   /api/cobracas/[id]
 * PATCH /api/cobracas/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAudit }                  from '@/lib/audit'
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
    if (m) { chunks[parseInt(m[1])] = c.value; continue }
    if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) { chunks[0] = c.value }
  }
  const joined = chunks.filter(Boolean).join('')
  if (joined) {
    try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) return p.access_token } catch { /* */ }
    try { const p = JSON.parse(joined); if (p?.access_token) return p.access_token } catch { /* */ }
  }
  return ''
}

async function autenticar(sb: any, req: NextRequest) {
  const token = getToken(req)
  if (!token) return null
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  return usuario as { id: string; tenant_id: string; role: string } | null
}

const ALLOWED_PATCH = new Set([
  'tipo', 'status', 'valor_bruto', 'valor_liquido', 'percentual_comissao', 'moeda',
  'licenciado_nome', 'licenciado_cnpj_cpf', 'licenciado_email',
  'data_emissao', 'data_vencimento', 'data_pagamento',
  'periodo_referencia', 'territorio', 'observacoes',
  'obra_id', 'editora_id', 'titular_id', 'autorizacao_id', 'editora_administrada_id',
])

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data, error } = await sb.from('cobracas')
    .select(`*, obra:obra_id(id,titulo), editora:editora_id(id,nome), titular:titular_id(id,nome), autorizacao:autorizacao_id(id,numero_autorizacao)`)
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const safeBody: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_PATCH.has(k)) safeBody[k] = v
  }

  const { data: anterior } = await sb.from('cobracas')
    .select('*').eq('id', id).eq('tenant_id', usuario.tenant_id).single()

  const { data, error } = await sb.from('cobracas')
    .update({ ...safeBody, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Quando cobrança vira "paga": acionar CC de obras se modelo_negocio = pago_editora ──
  const statusAnterior = (anterior as any)?.status
  const statusNovo     = safeBody.status as string | undefined
  const autorizacaoId  = (data as any)?.autorizacao_id ?? (anterior as any)?.autorizacao_id

  if (statusNovo === 'paga' && statusAnterior !== 'paga' && autorizacaoId) {
    // Buscar autorização vinculada
    const { data: aut } = await sb
      .from('autorizacoes')
      .select('id, obra_id, numero_autorizacao, licenciado_nome, valor_licenca, modelo_negocio, cc_movimento_id, pago_a')
      .eq('id', autorizacaoId)
      .eq('tenant_id', usuario.tenant_id)
      .single()

    const modelo = (aut as any)?.modelo_negocio ?? 'pago_editora'

    if (modelo === 'pago_editora' && aut && !(aut as any).cc_movimento_id) {
      const obra_id    = (aut as any).obra_id
      const valorFinal = Number((data as any)?.valor_liquido ?? (data as any)?.valor_bruto ?? (aut as any)?.valor_licenca ?? 0)
      const numAut     = (aut as any).numero_autorizacao ?? autorizacaoId.slice(0, 8)
      const licNome    = (aut as any).licenciado_nome ?? 'Licenciado'
      const dataPag    = (data as any)?.data_pagamento ?? new Date().toISOString().slice(0, 10)
      let recebedorEditoraId = (aut as any)?.pago_a ?? null

      if (!recebedorEditoraId) {
        const { data: linksRecebedor } = await sb.from('obras_links_titulares')
          .select('papel:funcao_no_link, controlado, status_controle, percentual_controle_brasil, percentual_controle_exterior, percentual:percentual_exec_publica, editora:editoras!obras_links_titulares_editora_original_id_fkey(id,nome), editora_original:editoras!obras_links_titulares_editora_original_id_fkey(id,nome), editora_administradora:editoras!obras_links_titulares_editora_administradora_id_fkey(id,nome)')
          .eq('obra_id', obra_id)
          .eq('tenant_id', usuario.tenant_id)

        const recebedor = resolverRecebedorEditorial((linksRecebedor ?? []) as any)
        if (!recebedor.ok) {
          return NextResponse.json({
            error: 'Cobrança não pode gerar conta corrente: falta recebedor válido (administradora ou editora original controlada).',
          }, { status: 422 })
        }
        recebedorEditoraId = recebedor.editoraId
      }

      if (obra_id && valorFinal > 0) {
        // Garantir cc_obras
        const { data: ccExist } = await sb
          .from('cc_obras')
          .select('id, saldo_atual')
          .eq('obra_id', obra_id)
          .eq('tenant_id', usuario.tenant_id)
          .maybeSingle()

        let ccObraId: string
        let saldoAnterior = 0

        if (ccExist) {
          ccObraId      = (ccExist as any).id
          saldoAnterior = Number((ccExist as any).saldo_atual ?? 0)
        } else {
          const { data: ccNovo } = await sb
            .from('cc_obras')
            .insert({ tenant_id: usuario.tenant_id, obra_id, saldo_atual: 0, saldo_bloqueado: 0, saldo_distribuido: 0, saldo_pendente: 0, moeda: 'BRL', status: 'ativo' })
            .select('id').single()
          ccObraId = (ccNovo as any).id
        }

        const saldoPosterior = saldoAnterior + valorFinal
        const { data: mov } = await sb
          .from('cc_obras_movimentos')
          .insert({
            tenant_id: usuario.tenant_id, cc_obra_id: ccObraId, obra_id,
            tipo: 'entrada', valor: valorFinal,
            saldo_anterior: saldoAnterior, saldo_posterior: saldoPosterior,
            descricao: `Autorização ${numAut} — ${licNome}`,
            source: 'autorizacao', source_id: autorizacaoId,
            editora_id: recebedorEditoraId,
            criado_em: new Date(dataPag).toISOString(),
          })
          .select('id').single()

        if (mov) {
          await sb.from('cc_obras').update({ saldo_atual: saldoPosterior }).eq('id', ccObraId)
          await sb.from('autorizacoes').update({ cc_movimento_id: (mov as any).id }).eq('id', autorizacaoId)
        }
      }
    }
    // pago_autor → não alimenta cc_obras (pagamento direto ao autor)
    // sem_onus   → sem valor, não alimenta cc_obras
  }

  await logAudit({
    tenant_id: usuario.tenant_id, usuario_id: usuario.id,
    acao: 'alterar', modulo: 'cobracas', tabela_afetada: 'cobracas',
    registro_id: id,
    dados_anteriores: anterior as Record<string, unknown>,
    dados_novos: data as Record<string, unknown>,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({ data })
}
