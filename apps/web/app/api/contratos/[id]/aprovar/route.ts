/**
 * POST /api/contratos/[id]/aprovar
 *
 * Workflow de aprovação — 2 fluxos:
 *
 * FLUXO DIRETO (Top Show Music como editora original):
 *   action = 'validar'              → Admin valida contrato assinado
 *                                     assinado → validado → [Iniciar Cadastro da Obra]
 *
 * FLUXO ADMINISTRADA (EDI Music, LR, P3, etc.):
 *   action = 'validar_administrada' → Administrada valida contrato assinado
 *   action = 'solicitar_admin'      → Administrada solicita revisão do administrador
 *   action = 'aprovar_admin'        → Administrador aprova → [Iniciar Cadastro da Obra]
 *   action = 'rejeitar_admin'       → Administrador rejeita com motivo
 *
 * REGRA CENTRAL: nenhuma ação cria nem ativa obra automaticamente.
 * Contrato validado/aprovado apenas libera o botão "Iniciar Cadastro da Obra".
 * A obra nasce como 'pre_cadastro' e só vira 'catalogo_ativo' após revisão
 * e ativação manual pelo Admin.
 *
 * Ambos os status 'validado' e 'aprovado_admin' desbloqueiam criação de obra.
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
    try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) return p.access_token } catch { /* */ }
    try { const p = JSON.parse(joined); if (p?.access_token) return p.access_token } catch { /* */ }
  }
  return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autenticar(sb: any, req: NextRequest) {
  const token = getToken(req)
  if (!token) return null
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  return usuario as { id: string; tenant_id: string; role: string } | null
}

// Status que liberam criação de obra (pré-cadastro)
const STATUS_LIBERA_OBRA = ['validado', 'aprovado_admin']

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { action, motivo } = await req.json() as { action: string; motivo?: string }

  const isAdmin = ['master', 'admin', 'administrador'].includes(usuario.role?.toLowerCase() ?? '')

  // Buscar contrato atual
  const { data: contrato, error: errContrato } = await sb
    .from('contratos')
    .select('id, status, obras_json, tenant_id, numero')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (errContrato || !contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  let novoStatus: string
  let updatePayload: Record<string, unknown> = {}

  switch (action) {

    // ── Fluxo direto TSM ─────────────────────────────────────────────────────
    case 'validar':
      if (!isAdmin) {
        return NextResponse.json({ error: 'Apenas Admin/Master pode validar diretamente' }, { status: 403 })
      }
      if (contrato.status !== 'assinado') {
        return NextResponse.json({
          error: `Contrato deve estar 'assinado' para validar (atual: ${contrato.status})`,
        }, { status: 422 })
      }
      novoStatus = 'validado'
      updatePayload = {
        status:        novoStatus,
        validado_em:   new Date().toISOString(),
        validado_por:  usuario.id,
      }
      break

    // ── Fluxo administrada ───────────────────────────────────────────────────
    case 'validar_administrada':
      if (contrato.status !== 'assinado') {
        return NextResponse.json({
          error: `Contrato deve estar 'assinado' (atual: ${contrato.status})`,
        }, { status: 422 })
      }
      novoStatus = 'validado_administrada'
      updatePayload = {
        status:                    novoStatus,
        validado_administrada_em:  new Date().toISOString(),
        validado_administrada_por: usuario.id,
      }
      break

    case 'solicitar_admin':
      if (contrato.status !== 'validado_administrada') {
        return NextResponse.json({
          error: `Contrato deve estar 'validado_administrada' (atual: ${contrato.status})`,
        }, { status: 422 })
      }
      novoStatus = 'aguardando_validacao_admin'
      updatePayload = { status: novoStatus }
      break

    case 'aprovar_admin':
      if (!isAdmin) {
        return NextResponse.json({ error: 'Apenas Admin/Master pode aprovar' }, { status: 403 })
      }
      if (contrato.status !== 'aguardando_validacao_admin') {
        return NextResponse.json({
          error: `Contrato deve estar 'aguardando_validacao_admin' (atual: ${contrato.status})`,
        }, { status: 422 })
      }
      novoStatus = 'aprovado_admin'
      updatePayload = {
        status:             novoStatus,
        aprovado_admin_em:  new Date().toISOString(),
        aprovado_admin_por: usuario.id,
      }
      break

    case 'rejeitar_admin':
      if (!isAdmin) {
        return NextResponse.json({ error: 'Apenas Admin/Master pode rejeitar' }, { status: 403 })
      }
      if (!motivo) {
        return NextResponse.json({ error: 'Motivo de rejeição obrigatório' }, { status: 400 })
      }
      if (contrato.status !== 'aguardando_validacao_admin') {
        return NextResponse.json({
          error: `Contrato deve estar 'aguardando_validacao_admin' (atual: ${contrato.status})`,
        }, { status: 422 })
      }
      novoStatus = 'rejeitado_admin'
      updatePayload = {
        status:                novoStatus,
        motivo_rejeicao_admin: motivo,
        aprovado_admin_em:     new Date().toISOString(),
        aprovado_admin_por:    usuario.id,
      }
      break

    default:
      return NextResponse.json({ error: `Ação inválida: ${action}` }, { status: 400 })
  }

  // Atualizar contrato
  const { data: contratoAtualizado, error: errUpdate } = await sb
    .from('contratos')
    .update({ ...updatePayload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select()
    .single()

  if (errUpdate) {
    return NextResponse.json({ error: errUpdate.message }, { status: 500 })
  }

  // Após validação/aprovação → marcar cedente como 'controlado' em obras já existentes
  // REGRA: nunca cria nem ativa obra automaticamente.
  if (STATUS_LIBERA_OBRA.includes(novoStatus)) {
    const obrasJson = (contrato as any).obras_json as Array<{
      id?: string
      participantes?: Array<{ titular_id?: string; papel?: string }>
    }> | null

    if (Array.isArray(obrasJson)) {
      for (const obra of obrasJson) {
        if (!obra.id) continue
        const cedente = obra.participantes?.find(p =>
          ['A', 'CA', 'autor', 'compositor', 'compositor_letrista', 'letrista'].includes(p.papel ?? '')
        )
        if (cedente?.titular_id) {
          await sb.from('obras_participantes')
            .update({
              status_editorial:     'controlado',
              contrato_controle_id: id,
              data_controle:        new Date().toISOString(),
            })
            .eq('obra_id', obra.id)
            .eq('titular_id', cedente.titular_id)
            .eq('tenant_id', usuario.tenant_id)
        }
      }
    }
  }

  await logAudit({
    tenant_id:       usuario.tenant_id,
    usuario_id:      usuario.id,
    acao:            action,
    modulo:          'contratos',
    tabela_afetada:  'contratos',
    registro_id:     id,
    dados_novos:     updatePayload,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({
    ok:     true,
    action,
    status: novoStatus,
    contrato: contratoAtualizado,
  })
}
