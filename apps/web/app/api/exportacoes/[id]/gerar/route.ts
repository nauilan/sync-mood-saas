import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// ── POST /api/exportacoes/[id]/gerar ────────────────────────────────────────
// Aciona a geração do arquivo de exportação.
// Fase atual: stub de governança — valida regras e muda status para 'gerando'.
// Os geradores CWR/Socinpro/BackOffice serão implementados na próxima fase.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['master', 'admin'].includes(usuario.role ?? '')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  const { id } = await params

  const { data: exportacao } = await sb
    .from('exportacoes')
    .select('id, status, destino, formato, tenant_id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (!exportacao) return NextResponse.json({ error: 'Exportação não encontrada' }, { status: 404 })

  // ── Verificar bloqueio contratual das obras incluídas ─────────────────────
  // Busca obras vinculadas à exportação que estão com exportacao_bloqueada=true
  const { data: obrasExportacao } = await sb
    .from('exportacao_obras')
    .select('obra_id')
    .eq('exportacao_id', id)
  const obraIds = (obrasExportacao ?? []).map((r: any) => r.obra_id as string).filter(Boolean)
  if (obraIds.length > 0) {
    const { data: obrasBloqueadas } = await sb
      .from('obras')
      .select('id, titulo, exportacao_bloqueio_motivo')
      .in('id', obraIds)
      .eq('exportacao_bloqueada', true)
    if ((obrasBloqueadas ?? []).length > 0) {
      const titulos = (obrasBloqueadas as any[]).map((o: any) => o.titulo).join(', ')
      return NextResponse.json({
        error: 'Exportação bloqueada — há obras com pendência contratual',
        codigo: 'EXPORTACAO_BLOQUEADA',
        obras_bloqueadas: obrasBloqueadas,
        mensagem: `As seguintes obras precisam de contrato vigente antes de exportar: ${titulos}`,
      }, { status: 422 })
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (!['preparando', 'erro'].includes(exportacao.status ?? '')) {
    return NextResponse.json({
      error: `Exportação com status "${exportacao.status}" não pode ser (re)gerada.`,
    }, { status: 422 })
  }

  // Marcar como 'gerando'
  await sb.from('exportacoes').update({ status: 'gerando' }).eq('id', id)

  // Log do evento
  await sb.from('exportacoes_logs').insert({
    exportacao_id: id,
    evento:        'geracao_iniciada',
    mensagem:      `Geração iniciada para destino "${exportacao.destino}" formato "${exportacao.formato}". Aguardando implementação do gerador.`,
    dados_json:    { destino: exportacao.destino, formato: exportacao.formato },
    timestamp:     new Date().toISOString(),
  })

  // TODO: Fase 2 — acionar gerador CWR/Socinpro/BackOffice conforme exportacao.destino
  // Por ora, permanece em 'gerando' até o gerador ser implementado
  // Quando implementado:
  // const arquivo = await gerarCWR(exportacao)  // ou gerarSocinpro / gerarBackOffice
  // await sb.from('exportacoes').update({ status: 'gerado', arquivo_url: arquivo.url })

  return NextResponse.json({
    data: {
      id,
      status: 'gerando',
      mensagem: 'Geração enfileirada. Os geradores CWR/Socinpro/BackOffice serão ativados na próxima fase.',
    },
  })
}
