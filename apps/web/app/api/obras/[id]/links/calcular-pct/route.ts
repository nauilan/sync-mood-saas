/**
 * POST /api/obras/[id]/links/calcular-pct
 *
 * Calcula os 15 pct_* de um link a partir do contrato (autor/editora)
 * e do negócio editorial (editora_administrada ↔ editora_administradora).
 *
 * Body: { link_id: string }
 *
 * Lógica:
 *  1. Lê todos os titulares do link (CA, E, AM)
 *  2. Para cada CA: busca o contrato → percentual_autor/editora + splits_direitos
 *  3. Busca negocio_editorial entre a E e a AM do link
 *  4. Para cada tipo BR: calcula pct_* com base no ratio do contrato e do negócio
 *  5. Para tipos EXT: CA = 50% do linkBase, editorial = 50% dividido por negócio
 *  6. Salva via PATCH em obras_links_titulares
 *  7. Retorna os titulares atualizados
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcularConcentracaoLink, type ParticipacaoConcentracao } from '@/lib/backoffice-rules'

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

// Mapeamento tipo jurídico → chave em negocio.percentuais_por_receita
const TIPO_PARA_RECEITA: Record<string, string> = {
  repr_grafica:          'outros',
  repr_fonomecanica:     'mecanico',
  inclusao_audiovisual:  'sync',
  inclusao_publicitaria: 'outros',
  distribuicao_meios:    'streaming',
  inclusao_base_dados:   'outros',
  comunicacao_publico:   'execucao_publica',
  autorizacoes_onus:     'outros',
  // EXT → todos mapeiam para 'internacional'
  ext_repr_grafica:          'internacional',
  ext_repr_fonomecanica:     'internacional',
  ext_inclusao_audiovisual:  'internacional',
  ext_inclusao_publicitaria: 'internacional',
  ext_distribuicao_meios:    'internacional',
  ext_inclusao_base_dados:   'internacional',
  ext_comunicacao_publico:   'internacional',
}

const BR_TIPOS = [
  'repr_grafica', 'repr_fonomecanica', 'inclusao_audiovisual', 'inclusao_publicitaria',
  'distribuicao_meios', 'inclusao_base_dados', 'comunicacao_publico', 'autorizacoes_onus',
] as const

const EXT_TIPOS = [
  'ext_repr_grafica', 'ext_repr_fonomecanica', 'ext_inclusao_audiovisual',
  'ext_inclusao_publicitaria', 'ext_distribuicao_meios', 'ext_inclusao_base_dados',
  'ext_comunicacao_publico',
] as const

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Para E: arredonda pra CIMA em favor do editor quando a soma não fecha exatamente
function round2Up(n: number): number {
  return Math.ceil(n * 100) / 100
}

function getNegocioRatioForTipo(
  negocio: any,
  tipo: string
): { pctAdministrada: number; pctAdministradora: number } {
  const receitaKey = TIPO_PARA_RECEITA[tipo]
  const override = negocio?.percentuais_por_receita?.[receitaKey]
  if (override) {
    return {
      pctAdministrada:   Number(override.administrada ?? 0),
      pctAdministradora: Number(override.administradora ?? 0),
    }
  }
  return {
    pctAdministrada:   Number(negocio?.percentual_administrada ?? 100),
    pctAdministradora: Number(negocio?.percentual_administradora ?? 0),
  }
}

function getContratoAutorRatioForTipo(contrato: any, tipo: string): number {
  // splits_direitos pode ter override por tipo: { repr_grafica: { autor: 80 }, ... }
  const splitKey = tipo.replace('ext_', '') // EXT usa o mesmo split do contrato
  const override = contrato?.splits_direitos?.[splitKey]?.autor
  if (override != null) return Number(override)
  return Number(contrato?.percentual_autor ?? 75)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const { id: obra_id } = await params

  // Auth
  const token = getToken(req)
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios').select('id, tenant_id').eq('auth_user_id', user.id).single()
  if (!usuario) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { link_id } = body
  if (!link_id) return NextResponse.json({ error: 'link_id obrigatório' }, { status: 400 })

  // 1. Buscar titulares do link
  const { data: titulares, error: tErr } = await sb
    .from('obras_links_titulares')
    .select(`
      id, funcao_no_link, nome, editora_id, titular_id, contrato_id,
      percentual_exec_publica, percentual_fonomecanico, percentual_sincronizacao,
      editora_original_id, editora_administradora_id, controlado
    `)
    .eq('obra_link_id', link_id)
    .eq('tenant_id', usuario.tenant_id)

  if (tErr || !titulares) {
    return NextResponse.json({ error: tErr?.message ?? 'Titulares não encontrados' }, { status: 500 })
  }

  const CAs = titulares.filter(t => (t.funcao_no_link ?? '').toUpperCase() === 'CA')
  if (CAs.length === 0) {
    return NextResponse.json({ error: 'Nenhum CA encontrado neste link' }, { status: 422 })
  }

  // Verificar que há algum percentual base
  const linkTotalPR = titulares.reduce((s, t) => s + (t.percentual_exec_publica ?? 0), 0)
  if (linkTotalPR <= 0) {
    return NextResponse.json({ error: 'Link sem percentual (exec_publica = 0)' }, { status: 422 })
  }

  // ── Concentração sintética via calcularConcentracaoLink() ─────────────────
  // Mesma função do /integrar (CWR). pct_* = CONTROLE, não split de negócio.
  // Participantes concentráveis: CA, E, SE, AM, SA. OWR: pct_* = 0 (não atualiza).
  const participantes = titulares.filter(t => {
    const fn = (t.funcao_no_link ?? '').toUpperCase()
    return fn === 'CA' || fn === 'E' || fn === 'SE' || fn === 'AM' || fn === 'SA'
  })

  const partics_conc: ParticipacaoConcentracao[] = participantes.map(t => ({
    link_number: 1,   // chamado por link — todos no mesmo link
    papel:       t.funcao_no_link ?? '',
    pr_pct:      t.percentual_exec_publica ?? 0,
    controlled:  (t as any).controlado ?? false,
  }))

  const concResults = calcularConcentracaoLink(partics_conc)

  // ── Montar payloads ───────────────────────────────────────────────────────
  type UpdatePayload = Record<string, number | string | null>
  const updates: { id: string; payload: UpdatePayload }[] = []

  type TdcRow = {
    obra_link_titular_id: string; direito: string; territorio: string
    controlado: boolean; pct_sintetico: number; origem: string; criado_por: string | null
  }
  const tdcRows: TdcRow[] = []

  for (let i = 0; i < participantes.length; i++) {
    const t    = participantes[i]
    const conc = concResults[i]

    const payload: UpdatePayload = {
      // ── CWR-derivados concentráveis ──────────────────────────────────────
      pct_repr_fonomecanica:         conc.mr_gravado,
      pct_inclusao_audiovisual:      conc.sr_gravado,
      pct_inclusao_publicitaria:     0,           // D via contrato (Etapa 3B)
      // ── Execução pública: individual diluído, NÃO concentra, NÃO split ──
      pct_comunicacao_publico:       t.percentual_exec_publica ?? 0,
      // ── Demais BR: 0 até negociação via contrato (Etapa 3B) ──────────────
      pct_repr_grafica:              0,
      pct_distribuicao_meios:        0,
      pct_inclusao_base_dados:       0,
      pct_autorizacoes_onus:         0,
      // ── EXT: 0 até território EXT habilitado ─────────────────────────────
      pct_ext_repr_grafica:          0,
      pct_ext_repr_fonomecanica:     0,
      pct_ext_inclusao_audiovisual:  0,
      pct_ext_inclusao_publicitaria: 0,
      pct_ext_distribuicao_meios:    0,
      pct_ext_inclusao_base_dados:   0,
      pct_ext_comunicacao_publico:   0,
      // ── Rastreabilidade ───────────────────────────────────────────────────
      origem:     'manual',
      criado_por: usuario.id,
    }

    updates.push({ id: t.id, payload })

    // ── titular_direito_controle: 4 direitos CWR-derivados ───────────────
    const tdcBase = { obra_link_titular_id: t.id, territorio: 'BR', origem: 'manual', criado_por: usuario.id }
    tdcRows.push({ ...tdcBase, direito: 'repr_fonomecanica',     controlado: conc.ehConcentrador,         pct_sintetico: conc.mr_gravado })
    tdcRows.push({ ...tdcBase, direito: 'inclusao_audiovisual',  controlado: conc.ehConcentrador,         pct_sintetico: conc.sr_gravado })
    tdcRows.push({ ...tdcBase, direito: 'inclusao_publicitaria', controlado: conc.ehConcentrador,         pct_sintetico: 0 })
    tdcRows.push({ ...tdcBase, direito: 'comunicacao_publico',   controlado: (t as any).controlado ?? false, pct_sintetico: 0 })
  }

  // ── PATCH obras_links_titulares ───────────────────────────────────────────
  const errors: string[] = []
  for (const upd of updates) {
    const { error: updErr } = await sb
      .from('obras_links_titulares')
      .update(upd.payload)
      .eq('id', upd.id)
      .eq('tenant_id', usuario.tenant_id)
    if (updErr) errors.push(`${upd.id}: ${updErr.message}`)
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Erros ao salvar', details: errors }, { status: 500 })
  }

  // ── Upsert titular_direito_controle ───────────────────────────────────────
  if (tdcRows.length > 0) {
    const { error: tdcErr } = await sb
      .from('titular_direito_controle')
      .upsert(tdcRows, { onConflict: 'obra_link_titular_id,direito,territorio' })
    if (tdcErr) {
      console.error('[calcular-pct] TDC upsert error:', tdcErr.message)
      // Não aborta: TDC é aditivo; erro aqui não invalida os dados principais
    }
  }

  // ── Retornar resultado ────────────────────────────────────────────────────
  return NextResponse.json({
    ok:          true,
    link_id,
    atualizados: updates.length,
    tdc_rows:    tdcRows.length,
  })
}
