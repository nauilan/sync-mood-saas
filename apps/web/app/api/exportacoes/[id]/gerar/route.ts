import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateCWR } from '@/lib/cwr-generator'
import type { Obra, ObraLink, ObraLinkTitular } from '@/lib/types-obras'

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

function normalizeIswc(value: string | null | undefined): string | null {
  const compact = String(value ?? '').replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  if (!compact || !compact.startsWith('T') || compact.length !== 11) return value ?? null
  return `${compact.slice(0, 1)}-${compact.slice(1, 10)}-${compact.slice(10)}`
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: authData, error: authError } = await sb.auth.getUser(token)
  if (authError || !authData?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: usuario, error: usuarioError } = await sb
    .from('usuarios')
    .select('id, tenant_id, role')
    .eq('auth_user_id', authData.user.id)
    .single()

  if (usuarioError || !usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 })

  const { data: exportacao, error: exportacaoError } = await sb
    .from('exportacoes')
    .select('id, tenant_id, destino, formato, status, codigo')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (exportacaoError || !exportacao) {
    return NextResponse.json({ error: 'Exportação não encontrada.' }, { status: 404 })
  }

  const { data: obrasExportacao } = await sb
    .from('exportacoes_obras')
    .select('obra_id')
    .eq('exportacao_id', id)

  const obraIds = (obrasExportacao ?? []).map((row: any) => String(row.obra_id)).filter(Boolean)
  if (obraIds.length === 0) {
    return NextResponse.json({ error: 'Nenhuma obra vinculada ao lote.' }, { status: 422 })
  }

  if (!['rascunho', 'erro'].includes(exportacao.status ?? '')) {
    return NextResponse.json({
      error: `Exportação com status "${exportacao.status}" não pode ser (re)gerada.`,
    }, { status: 422 })
  }

  const { data: obrasRows, error: obrasError } = await sb
    .from('obras')
    .select('id, tenant_id, codigo_obra, titulo, titulo_original, iswc, idioma, status, editora_id, created_at, updated_at')
    .in('id', obraIds)
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)

  if (obrasError) return NextResponse.json({ error: obrasError.message }, { status: 500 })
  if (!obrasRows?.length) return NextResponse.json({ error: 'Nenhuma obra vinculada ao lote.' }, { status: 422 })

  const { data: linksRows, error: linksError } = await sb
    .from('obras_links')
    .select('id, obra_id, numero_link, controlado, percentual_link')
    .in('obra_id', obraIds)
    .eq('tenant_id', usuario.tenant_id)
    .order('numero_link', { ascending: true })

  if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 })

  const { data: titularesRows, error: titularesError } = await sb
    .from('obras_links_titulares')
    .select(`
      id,
      obra_link_id,
      obra_id,
      titular_id,
      editora_id,
      funcao_no_link,
      percentual_exec_publica,
      percentual_fonomecanico,
      percentual_sincronizacao,
      editora_original_id,
      editora_administradora_id,
      ipi,
      status_controle,
      writer_sequence_code,
      publisher_sequence_code,
      pwr_writer_code,
      pwr_publisher_code,
      codigo_vinculo_cwr_original,
      codigo_interno_legado_titular,
      codigo_interno_legado_editora,
      titulares:titulares!obras_links_titulares_titular_id_fkey(nome_completo, nome_artistico, codigo_ipi),
      editora_original:editoras!obras_links_titulares_editora_original_id_fkey(nome_fantasia, razao_social, codigo_ipi),
      editora_administradora:editoras!obras_links_titulares_editora_administradora_id_fkey(nome_fantasia, razao_social, codigo_ipi)
    `)
    .in('obra_id', obraIds)

  if (titularesError) return NextResponse.json({ error: titularesError.message }, { status: 500 })

  const titularesByLink = new Map<string, ObraLinkTitular[]>()
  for (const row of (titularesRows ?? []) as any[]) {
    const papel =
      row.funcao_no_link === 'E' ? 'editora_original' :
      row.funcao_no_link === 'AM' ? 'administradora' :
      row.funcao_no_link === 'SE' ? 'subeditora' :
      'compositor'

    const titular = row.titulares as { nome_completo?: string; nome_artistico?: string; codigo_ipi?: string } | null
    const editoraOriginal = row.editora_original as { nome_fantasia?: string; razao_social?: string; codigo_ipi?: string } | null
    const editoraAdministradora = row.editora_administradora as { nome_fantasia?: string; razao_social?: string; codigo_ipi?: string } | null

    const nome =
      papel === 'editora_original' ? (editoraOriginal?.nome_fantasia ?? editoraOriginal?.razao_social ?? titular?.nome_completo ?? '') :
      papel === 'administradora' ? (editoraAdministradora?.nome_fantasia ?? editoraAdministradora?.razao_social ?? titular?.nome_completo ?? '') :
      (titular?.nome_artistico ?? titular?.nome_completo ?? '')

    const item: ObraLinkTitular = {
      id: String(row.id),
      link_id: String(row.obra_link_id),
      titular_id: row.titular_id ? String(row.titular_id) : null,
      nome,
      papel,
      percentual: Number(row.percentual_exec_publica ?? 0),
      percentual_exec_publica: Number(row.percentual_exec_publica ?? 0),
      percentual_fonomecanico: Number(row.percentual_fonomecanico ?? 0),
      percentual_sincronizacao: Number(row.percentual_sincronizacao ?? 0),
      ipi: String(
        papel === 'editora_original'
          ? (editoraOriginal?.codigo_ipi ?? row.ipi ?? '')
          : papel === 'administradora'
            ? (editoraAdministradora?.codigo_ipi ?? row.ipi ?? '')
            : (titular?.codigo_ipi ?? row.ipi ?? '')
      ),
      controlado: row.status_controle === 'controlado',
      writer_sequence_code: row.writer_sequence_code ? String(row.writer_sequence_code) : null,
      publisher_sequence_code: row.publisher_sequence_code ? String(row.publisher_sequence_code) : null,
      pwr_writer_code: row.pwr_writer_code ? String(row.pwr_writer_code) : null,
      pwr_publisher_code: row.pwr_publisher_code ? String(row.pwr_publisher_code) : null,
      codigo_vinculo_cwr_original: row.codigo_vinculo_cwr_original ? String(row.codigo_vinculo_cwr_original) : null,
      codigo_interno_legado_titular: row.codigo_interno_legado_titular ? String(row.codigo_interno_legado_titular) : null,
      codigo_interno_legado_editora: row.codigo_interno_legado_editora ? String(row.codigo_interno_legado_editora) : null,
    }

    const current = titularesByLink.get(String(row.obra_link_id)) ?? []
    current.push(item)
    titularesByLink.set(String(row.obra_link_id), current)
  }

  const linksByObra = new Map<string, ObraLink[]>()
  for (const row of (linksRows ?? []) as any[]) {
    const link: ObraLink = {
      id: String(row.id),
      obra_id: String(row.obra_id),
      ordem: Number(row.numero_link ?? 0),
      controlado: !!row.controlado,
      percentual_controlado: Number(row.percentual_link ?? 0),
      titulares: titularesByLink.get(String(row.id)) ?? [],
    }
    const current = linksByObra.get(String(row.obra_id)) ?? []
    current.push(link)
    linksByObra.set(String(row.obra_id), current)
  }

  const obrasParaCwr = (obrasRows as any[])
    .map((obra): { obra: Obra; links: ObraLink[] } => ({
      obra: {
        ...obra,
        codigo: String(obra.codigo_obra ?? ''),
        iswc: normalizeIswc(obra.iswc),
      } as Obra,
      links: linksByObra.get(String(obra.id)) ?? [],
    }))
    .filter((item) => item.links.some((link) => (link.titulares?.length ?? 0) > 0))

  if (obrasParaCwr.length === 0) {
    return NextResponse.json({ error: 'Nenhuma obra exportável com links editoriais encontrados.' }, { status: 422 })
  }

  const generated = generateCWR({
    format: 'CWR',
    senderName: 'SYNC MOOD',
    obras: obrasParaCwr,
  })

  const arquivoUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(generated.content)}`
  const hash = Buffer.from(generated.content, 'utf8').toString('base64').slice(0, 64)

  await sb.from('exportacoes').update({
    status: 'gerado',
    arquivo_url: arquivoUrl,
    hash,
    total_obras: obrasParaCwr.length,
  }).eq('id', id)

  await sb.from('exportacoes_logs').insert({
    exportacao_id: id,
    evento: 'geracao_concluida',
    mensagem: `Arquivo CWR gerado com ${obrasParaCwr.length} obra(s).`,
    dados_json: { destino: exportacao.destino, formato: exportacao.formato, arquivo: generated.filename },
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({
    data: {
      id,
      status: 'gerado',
      arquivo_url: arquivoUrl,
      filename: generated.filename,
      mensagem: `Arquivo CWR gerado com ${obrasParaCwr.length} obra(s).`,
    },
  })
}