import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseCwr } from '@/lib/cwr-parser'
import { matchObra, matchAutor, matchEditora } from '@/lib/cwr-matching'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token) return { error: 'sem_token' } as const
  const client = sb()
  const { data: { user }, error: authErr } = await client.auth.getUser(token)
  if (!user) return { error: 'token_invalido', detail: authErr?.message } as const
  const { data, error: dbErr } = await client.from('usuarios').select('id,tenant_id,role').eq('auth_user_id', user.id).single()
  if (!data) return { error: 'usuario_nao_encontrado', detail: dbErr?.message } as const
  return { userId: data.id as string, tenantId: data.tenant_id as string, role: data.role as string }
}

// ── GET /api/cwr — lista importações ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const usuario = await getUser(req)
  if (!usuario || 'error' in usuario) {
    return NextResponse.json({ error: 'Não autenticado', debug: usuario }, { status: 401 })
  }

  const client = sb()
  const { data, error } = await client
    .from('cwr_importacoes')
    .select('id,nome_arquivo,status,relatorio,created_at')
    .eq('tenant_id', usuario.tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ importacoes: data ?? [] })
}

// ── POST /api/cwr — upload e análise ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let conteudo = ''
  let nomeArquivo = 'importacao.cwr'

  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('arquivo') as File | null
    if (!file) return NextResponse.json({ error: 'Campo "arquivo" obrigatório' }, { status: 400 })
    conteudo = await file.text()
    nomeArquivo = file.name
  } else {
    const body = await req.json().catch(() => ({})) as Record<string, string>
    conteudo = body.conteudo ?? ''
    nomeArquivo = body.nome_arquivo ?? 'importacao.cwr'
  }

  if (!conteudo) return NextResponse.json({ error: 'Arquivo vazio' }, { status: 400 })

  // 1. Parse
  const parsed = parseCwr(conteudo)

  // 2. Buscar obras, titulares e editoras existentes para matching
  const client = sb()
  const { data: obrasExist } = await client
    .from('obras')
    .select('id,codigo_obra,iswc,titulo,status_catalogo')
    .eq('tenant_id', usuario.tenantId)
    .is('deleted_at', null)

  const { data: titularesExist } = await client
    .from('titulares')
    .select('id,nome,ipi')
    .eq('tenant_id', usuario.tenantId)

  const { data: editorasExist } = await client
    .from('editoras')
    .select('id,nome,ipi')
    .eq('tenant_id', usuario.tenantId)

  const obras = obrasExist ?? []
  const titulares = titularesExist ?? []
  const editoras = editorasExist ?? []

  // 3. Verificar titulares com contrato válido
  const { data: contratosValidos } = await client
    .from('contratos')
    .select('titular_id')
    .eq('tenant_id', usuario.tenantId)
    .in('status', ['aprovado_admin', 'validado', 'assinado'])

  const titularIdsComContrato = new Set((contratosValidos ?? []).map((c: Record<string, string>) => c.titular_id))
  const titularesComStatus = titulares.map((t: Record<string, string>) => ({
    ...t,
    tem_contrato_valido: titularIdsComContrato.has(t.id),
  }))

  // 4. Rodar matching por obra
  const obrasAnalisadas = parsed.obras.map(cwrObra => {
    const matchResult = matchObra(cwrObra, obras as Parameters<typeof matchObra>[1])
    const autoresMatch = cwrObra.autores.map(a => matchAutor(a, titularesComStatus as Parameters<typeof matchAutor>[1]))
    const editorasMatch = cwrObra.editoras.map(e => matchEditora(e, editoras as Parameters<typeof matchEditora>[1]))

    return {
      cwr:      cwrObra,
      match:    matchResult,
      autores:  autoresMatch,
      editoras: editorasMatch,
    }
  })

  // 5. Salvar importação no banco
  const { data: imp, error: errImp } = await client
    .from('cwr_importacoes')
    .insert({
      tenant_id:    usuario.tenantId,
      criado_por:   usuario.userId,
      nome_arquivo: nomeArquivo,
      conteudo_raw: conteudo,
      status:       'em_analise',
    })
    .select('id')
    .single()

  if (errImp || !imp) return NextResponse.json({ error: errImp?.message ?? 'Erro ao salvar' }, { status: 500 })

  // 6. Salvar snapshot por obra
  const rows = obrasAnalisadas.map(o => ({
    importacao_id:    imp.id,
    obra_id:          o.match.obra_id,
    snapshot_cwr:     o.cwr,
    match_tipo:       o.match.match_tipo,
    match_score:      o.match.match_score,
    match_criterio:   o.match.match_criterio,
    status_editorial: o.autores.find(a => a.status_editorial === 'controlado') ? 'controlado' : 'em_validacao',
    negocio_editorial: {
      percentual_total: o.cwr.percentual_total,
      editoras:         o.editoras,
    },
    fonogramas:  o.cwr.fonogramas,
    titulos_alt: o.cwr.titulos_alt,
  }))

  await client.from('cwr_importacoes_obras').insert(rows)

  // 7. Resumo
  const resumo = {
    obras_lidas:     obrasAnalisadas.length,
    obras_novas:     obrasAnalisadas.filter(o => o.match.match_tipo === 'nova').length,
    obras_vinculadas: obrasAnalisadas.filter(o => o.match.match_tipo === 'vinculada').length,
    obras_divergentes: obrasAnalisadas.filter(o => o.match.match_tipo === 'divergente').length,
    obras_conflito:  obrasAnalisadas.filter(o => o.match.match_tipo === 'conflito').length,
    erros_parse:     parsed.erros_parse.length,
    sender:          parsed.sender,
    versao:          parsed.versao,
  }

  return NextResponse.json({ importacao_id: imp.id, resumo }, { status: 201 })
}
