import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * POST /api/obras/migrar-editoras-cwr
 *
 * Lê os titulares já existentes no banco com tipo='editora' (publishers do CWR)
 * e cria pré-cadastros na tabela `editoras` para cada um que ainda não existe.
 */
export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) {
    return NextResponse.json({ error: 'Supabase não configurado (service_role ausente)' }, { status: 503 })
  }

  // ── Autenticar usuário via JWT ──────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
  }
  const { data: usuario } = await sb.from('usuarios')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) {
    return NextResponse.json({ error: 'Usuário não encontrado no sistema' }, { status: 403 })
  }
  if (!['master', 'admin', 'editora_administrada'].includes(usuario.role)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }
  const tenantId: string = usuario.tenant_id

  // 1. Buscar todos os titulares com tipo='editora' do tenant
  const { data: titulares, error: tErr } = await sb
    .from('titulares')
    .select('id, nome_completo, codigo_interno_legado, codigo_sequence_cwr, ipi, codigo_ipi')
    .eq('tenant_id', tenantId)
    .eq('tipo', 'editora')

  if (tErr) {
    return NextResponse.json({ error: `Erro ao buscar titulares: ${tErr.message}` }, { status: 500 })
  }
  if (!titulares || titulares.length === 0) {
    return NextResponse.json({ message: 'Nenhum titular do tipo editora encontrado', criadas: 0 })
  }

  // 2. Buscar editoras já existentes no tenant (por nome)
  const { data: existentes } = await sb
    .from('editoras')
    .select('id, nome_fantasia')
    .eq('tenant_id', tenantId)

  const existentesNomes = new Set(
    (existentes ?? []).map((e: any) => e.nome_fantasia?.trim().toUpperCase()).filter(Boolean)
  )

  // 3. Filtrar somente os que ainda não existem
  const novas = titulares.filter((t: any) => {
    const nome = (t.nome_completo ?? '').trim().toUpperCase()
    return nome && !existentesNomes.has(nome)
  })

  if (novas.length === 0) {
    return NextResponse.json({
      message: 'Todas as editoras já estão cadastradas',
      total_titulares_editora: titulares.length,
      criadas: 0,
    })
  }

  // 4. Criar pré-cadastros na tabela editoras
  const payload = novas.map((t: any) => ({
    tenant_id:            tenantId,
    razao_social:         t.nome_completo.trim(),
    nome_fantasia:        t.nome_completo.trim(),
    status:               'ativo',
    codigo_ipi:           t.codigo_ipi ?? t.ipi ?? null,
    codigo_interno:       t.codigo_interno_legado ?? t.codigo_sequence_cwr ?? null,
    tipo_editora:         'administrada',
    controlada:           true,
    origem_importacao:    'cwr',
  }))

  const { data: inserted, error: insErr } = await sb
    .from('editoras')
    .upsert(payload as any, { ignoreDuplicates: true })
    .select('id')

  if (insErr) {
    return NextResponse.json({ error: `Erro ao criar editoras: ${insErr.message}` }, { status: 500 })
  }

  const criadas = (inserted ?? []).length || novas.length

  return NextResponse.json({
    message: 'Pré-cadastros criados com sucesso',
    total_titulares_editora: titulares.length,
    ja_existiam: titulares.length - novas.length,
    criadas,
    editoras: novas.map((t: any) => t.nome_completo),
  })
}
