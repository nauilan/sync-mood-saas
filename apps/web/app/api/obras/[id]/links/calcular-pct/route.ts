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
    .from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
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
      editora_original_id, editora_administradora_id
    `)
    .eq('obra_link_id', link_id)
    .eq('tenant_id', usuario.tenant_id)

  if (tErr || !titulares) {
    return NextResponse.json({ error: tErr?.message ?? 'Titulares não encontrados' }, { status: 500 })
  }

  const CAs = titulares.filter(t => (t.funcao_no_link ?? '').toUpperCase() === 'CA')
  const Es  = titulares.filter(t => ['E','SE'].includes((t.funcao_no_link ?? '').toUpperCase()))
  const AMs = titulares.filter(t => ['AM','SA'].includes((t.funcao_no_link ?? '').toUpperCase()))
  const hasAM = AMs.length > 0

  if (CAs.length === 0) {
    return NextResponse.json({ error: 'Nenhum CA encontrado neste link' }, { status: 422 })
  }

  // linkBase: usa MR se preenchido, senão PR
  const linkTotalMR = titulares.reduce((s, t) => s + (t.percentual_fonomecanico ?? 0), 0)
  const linkTotalPR = titulares.reduce((s, t) => s + (t.percentual_exec_publica ?? 0), 0)
  const linkBase = linkTotalMR > 0 ? linkTotalMR : linkTotalPR

  if (linkBase <= 0) {
    return NextResponse.json({ error: 'Link sem percentual (PR/MR = 0)' }, { status: 422 })
  }

  // 2. Buscar contrato do primeiro CA (se houver múltiplos CAs com contratos diferentes,
  //    cada um teria suas próprias regras; para o modelo atual (1 CA por link) é suficiente)
  const caContrato = CAs[0]?.contrato_id
    ? (await sb.from('contratos').select('percentual_autor, percentual_editora, splits_direitos')
        .eq('id', CAs[0].contrato_id).single()).data
    : null

  // 3. Buscar negócio editorial entre E e AM
  let negocio: any = null
  if (hasAM && Es.length > 0) {
    const editoraId = Es[0].editora_id
    const amId      = AMs[0].editora_id
    if (editoraId && amId) {
      const { data: neg } = await sb
        .from('negocios_editoriais')
        .select('percentual_administrada, percentual_administradora, percentuais_por_receita')
        .eq('tenant_id', usuario.tenant_id)
        .eq('editora_administrada_id', editoraId)
        .eq('editora_administradora_id', amId)
        .eq('status', 'ativo')
        .limit(1)
        .single()
      negocio = neg ?? null
    }
  }

  // 4. Calcular pct_* para cada titular
  type UpdatePayload = Record<string, number>
  const updates: { id: string; payload: UpdatePayload }[] = []

  for (const t of titulares) {
    const fn = (t.funcao_no_link ?? '').toUpperCase()
    const isCA  = fn === 'CA'
    const isE   = fn === 'E' || fn === 'SE'
    const isAM  = fn === 'AM' || fn === 'SA'
    const isOWR = !isCA && !isE && !isAM

    if (isOWR) continue  // OWR: todos pct_* = 0 (sem direito em outros tipos)

    const payload: UpdatePayload = {}

    // ── BRASIL ──────────────────────────────────────────────────────────────
    for (const tipo of BR_TIPOS) {
      const autorRatio = getContratoAutorRatioForTipo(caContrato, tipo) / 100  // 0–1
      const edRatio    = 1 - autorRatio

      let val = 0
      if (isCA) {
        val = round2(linkBase * autorRatio)
      } else if (isE) {
        if (!hasAM) {
          // E fica com tudo da parte editorial
          val = round2Up(linkBase * edRatio)
        } else {
          const neg = getNegocioRatioForTipo(negocio, tipo)
          val = round2Up(linkBase * edRatio * neg.pctAdministrada / 100)
        }
      } else if (isAM) {
        const neg = getNegocioRatioForTipo(negocio, tipo)
        val = round2(linkBase * edRatio * neg.pctAdministradora / 100)
      }
      payload[`pct_${tipo}`] = val
    }

    // ── EXTERIOR (autor sempre 50% do linkBase por lei BR) ────────────────
    for (const tipo of EXT_TIPOS) {
      const brTipo = tipo.replace('ext_', '')
      const autorRatioExt = 0.5  // autor sempre 50% no EXT por lei
      const edRatioExt    = 0.5

      let val = 0
      if (isCA) {
        val = round2(linkBase * autorRatioExt)
      } else if (isE) {
        if (!hasAM) {
          val = round2Up(linkBase * edRatioExt)
        } else {
          const neg = getNegocioRatioForTipo(negocio, tipo)
          val = round2Up(linkBase * edRatioExt * neg.pctAdministrada / 100)
        }
      } else if (isAM) {
        const neg = getNegocioRatioForTipo(negocio, tipo)
        val = round2(linkBase * edRatioExt * neg.pctAdministradora / 100)
      }
      payload[`pct_${tipo}`] = val
    }

    updates.push({ id: t.id, payload })
  }

  // 5. Salvar via PATCH individual (Supabase JS client não tem bulk update nativo)
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

  // 6. Retornar dados atualizados do link
  return NextResponse.json({
    ok: true,
    link_id,
    atualizados: updates.length,
    negocio_encontrado: negocio != null,
    contrato_encontrado: caContrato != null,
  })
}
