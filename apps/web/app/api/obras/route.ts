import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'

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

// ── GET /api/obras — listar obras do tenant ───────────────────────────────────
export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status')
  const search   = searchParams.get('q')
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const per_page = Math.min(200, parseInt(searchParams.get('per_page') ?? '100'))
  const offset   = (page - 1) * per_page

  let query = sb
    .from('obras')
    .select('*', { count: 'exact' })
    .eq('tenant_id', usuario.tenant_id)
    .order('titulo', { ascending: true })
    .range(offset, offset + per_page - 1)

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('titulo', `%${search}%`)

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/obras]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    per_page,
  })
}

// ── POST /api/obras — criar obra com links, titulares e fonogramas ────────────
export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { titulo, links, fonogramas, ...rest } = body as any
  if (!titulo) return NextResponse.json({ error: 'Campo "titulo" obrigatório' }, { status: 400 })

  // 1. Inserir obra
  const allowedFields = ['titulo_alternativo', 'subtitulo', 'idioma', 'genero', 'ano_criacao', 'duracao_segundos', 'letra', 'status', 'iswc', 'codigo_obra']
  const obraPayload: Record<string, unknown> = { titulo, tenant_id: usuario.tenant_id }
  for (const k of allowedFields) {
    if (rest[k] !== undefined && rest[k] !== null && rest[k] !== '') obraPayload[k] = rest[k]
  }

  const { data: obra, error: obraErr } = await sb
    .from('obras')
    .insert(obraPayload)
    .select()
    .single()

  if (obraErr) return NextResponse.json({ error: obraErr.message }, { status: 500 })

  // 2. Inserir links e titulares
  if (Array.isArray(links)) {
    for (let i = 0; i < links.length; i++) {
      const link = links[i]
      const { data: linkRow, error: linkErr } = await sb
        .from('obras_links')
        .insert({
          obra_id: obra.id,
          tenant_id: usuario.tenant_id,
          numero_link: link.ordem ?? (i + 1),
          percentual_link: link.percentual_controlado ?? 0,
          tipo_link: 'coautoria',
          controlado: link.controlado ?? false,
          status: 'ativo',
        })
        .select('id')
        .single()

      if (linkErr || !linkRow) continue

      const titulares = Array.isArray(link.titulares) ? link.titulares : []
      if (titulares.length > 0) {
        const titRows = titulares.map((t: Record<string, unknown>) => ({
          obra_link_id: linkRow.id,
          tenant_id: usuario.tenant_id,
          titular_id: t.titular_id ?? null,
          nome: t.nome ?? '',
          papel: t.papel ?? 'compositor',
          funcao_no_link: t.papel ?? 'compositor',
          percentual_exec_publica: t.percentual ?? 0,
          percentual_fonomecanico: t.percentual ?? 0,
          percentual_sincronizacao: t.percentual ?? 0,
          controlado: t.controlado ?? false,
          ipi: t.ipi || null,
          cae: t.ipi || null,
        }))
        await sb.from('obras_links_titulares').insert(titRows)
      }
    }
  }

  // 3. Inserir fonogramas
  if (Array.isArray(fonogramas)) {
    const fonoRows = fonogramas
      .filter((f: Record<string, unknown>) => f.titulo_fonograma || f.isrc)
      .map((f: Record<string, unknown>) => ({
        obra_id: obra.id,
        tenant_id: usuario.tenant_id,
        titulo_fonograma: f.titulo_fonograma ?? '',
        interprete: f.interprete ?? '',
        isrc: f.isrc || null,
        produtor_fonografico: f.produtor || null,
      }))
    if (fonoRows.length > 0) {
      await sb.from('fonogramas').insert(fonoRows)
    }
  }

  await logAudit({
    tenant_id: usuario.tenant_id,
    acao: 'criar',
    modulo: 'obras',
    tabela_afetada: 'obras',
    registro_id: (obra as { id: string }).id,
    dados_novos: obra as Record<string, unknown>,
    origem_execucao: 'usuario',
  })
  return NextResponse.json(obra, { status: 201 })
}
