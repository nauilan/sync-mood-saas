/**
 * POST /api/admin/reintegrar-catalogo
 * Reintegra TODAS as obras do catálogo com a versão atual do parser.
 *
 * Auth: Header  x-admin-secret: <SUPABASE_SERVICE_ROLE_KEY>
 *
 * Processo:
 *   1. Valida o secret
 *   2. Busca todas as cwr_importacoes com status 'integrado'
 *   3. Chama POST /api/cwr/[id]/integrar para cada (usando service role key como bearer)
 *   4. Retorna resumo
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

export const maxDuration = 300 // Vercel Pro: até 300s

export async function POST(req: NextRequest) {
  const secret = (req.headers.get('x-admin-secret') ?? '').trim()
  const srvKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/[\uFEFF]/g, '').trim()

  if (!srvKey || secret !== srvKey) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const sb = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    srvKey,
    { auth: { persistSession: false } }
  )

  const { data: importacoes, error } = await sb
    .from('cwr_importacoes')
    .select('id, status')
    .in('status', ['integrado'])
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!importacoes?.length) {
    return NextResponse.json({ ok: true, message: 'Nenhuma importação integrada encontrada', total: 0 })
  }

  const host    = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
  const proto   = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`

  const results: { id: string; ok: boolean; obras?: number; error?: string }[] = []

  for (const imp of importacoes) {
    try {
      const res  = await fetch(`${baseUrl}/api/cwr/${imp.id}/integrar`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${srvKey}`,
        },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      results.push({
        id:    imp.id,
        ok:    data.ok ?? res.ok,
        obras: data.obras_integradas ?? data.obras ?? undefined,
        error: res.ok ? undefined : (data.error ?? `HTTP ${res.status}`),
      })
    } catch (e: any) {
      results.push({ id: imp.id, ok: false, error: e?.message ?? String(e) })
    }
  }

  const sucesso     = results.filter(r => r.ok).length
  const totalObras  = results.reduce((s, r) => s + (r.obras ?? 0), 0)
  const falhas      = results.filter(r => !r.ok)

  return NextResponse.json({
    ok:                    falhas.length === 0,
    importacoes_total:     importacoes.length,
    importacoes_sucesso:   sucesso,
    importacoes_falha:     falhas.length,
    obras_reintegradas:    totalObras,
    detalhes:              results,
    falhas:                falhas.length ? falhas : undefined,
  })
}
