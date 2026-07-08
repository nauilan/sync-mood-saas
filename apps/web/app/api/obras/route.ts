import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'
import { calcularConcentracaoLink, type ParticipacaoConcentracao } from '@/lib/backoffice-rules'

function mapPapelToFuncaoLink(papel: unknown): string {
  const normalized = String(papel ?? '').trim().toLowerCase()
  if (!normalized) return 'CA'

  const map: Record<string, string> = {
    autor: 'A',
    autores: 'A',
    compositor: 'CA',
    compositores: 'CA',
    compositor_letrista: 'CA',
    'compositor-letrista': 'CA',
    coautor: 'CA',
    versionista: 'V',
    adaptador: 'AD',
    editora_original: 'E',
    editora: 'E',
    subeditora: 'SE',
    administradora: 'AM',
    interprete_referencia: 'I',
    interprete: 'I',
  }

  const upper = normalized.toUpperCase()
  const enumValues = new Set(['CA', 'V', 'SA', 'E', 'AM', 'SE', 'C', 'CE', 'A', 'I', 'M', 'T', 'AD', 'H', 'OWR'])
  if (enumValues.has(upper)) return upper

  return map[normalized] ?? 'CA'
}

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
async function autenticar(req: NextRequest, sb: any): Promise<{ id: string; tenant_id: string; role: string } | null> {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  return data as { id: string; tenant_id: string; role: string } | null
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
  const per_page = Math.min(1000, parseInt(searchParams.get('per_page') ?? '100'))
  const offset   = (page - 1) * per_page

  let query = sb
    .from('obras')
    .select(
      `*,
      obras_links(
        id, numero_link, percentual_link, tipo_link, controlado, status,
        obras_links_titulares(
          id, nome, papel, funcao_no_link,
          percentual_exec_publica, percentual_fonomecanico, percentual_sincronizacao,
          ipi, controlado, titular_id
        )
      ),
      fonogramas(id)`,
      { count: 'exact' }
    )
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .order('titulo', { ascending: true })
    .range(offset, offset + per_page - 1)

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('titulo', `%${search}%`)

  // titulo_similar: busca obras com título parecido (usado para detecção de duplicidade)
  const tituloSimilar = searchParams.get('titulo_similar')
  if (tituloSimilar && tituloSimilar.trim().length >= 2 && !search) {
    query = query.ilike('titulo', `%${tituloSimilar.trim()}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/obras]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mapeamento CWR funcao_no_link → papel editorial normalizado
  const CWR_ROLE_MAP: Record<string, string> = {
    E: 'editora_original',
    SE: 'subeditora', SA: 'subeditora',
    AM: 'administradora',
    CA: 'compositor', C: 'compositor', CE: 'compositor',
    A: 'autor', T: 'autor',
    V: 'versionista', AD: 'adaptador',
    I: 'interprete_referencia',
  }

  // Mapear obras_links → _links (formato esperado pelo frontend)
  const mapped = (data ?? []).map((obra: Record<string, unknown>) => {
    const { obras_links, fonogramas: fono, ...rest } = obra as any
    return {
      ...rest,
      _links: (obras_links ?? []).map((l: any) => ({
        ...l,
        titulares: (l.obras_links_titulares ?? []).map((t: any) => ({
          ...t,
          papel: t.funcao_no_link
            ? (CWR_ROLE_MAP[t.funcao_no_link.toUpperCase()] ?? t.papel)
            : t.papel,
        })),
        obras_links_titulares: undefined,
      })),
      _fonogramas_count: (fono ?? []).length,
    }
  })

  return NextResponse.json({
    data:     mapped,
    total:    count ?? 0,
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

  // ── Regra: contrato de origem deve estar validado (TSM direto) ou aprovado_admin (administrada) ──
  const contratoOrigemId = rest.contrato_origem_id as string | undefined | null
  const STATUS_LIBERA_OBRA = ['validado', 'aprovado_admin']
  if (contratoOrigemId) {
    const { data: cRef } = await sb
      .from('contratos')
      .select('status')
      .eq('id', contratoOrigemId)
      .eq('tenant_id', usuario.tenant_id)
      .single()
    if (!cRef) {
      return NextResponse.json({ error: 'Contrato de origem não encontrado' }, { status: 404 })
    }
    if (!STATUS_LIBERA_OBRA.includes(cRef.status)) {
      return NextResponse.json({
        error: `O contrato está com status "${cRef.status}". Obras só podem ser cadastradas após validação (TSM direto: 'validado') ou aprovação do administrador (administrada: 'aprovado_admin').`,
        contrato_status: cRef.status,
      }, { status: 422 })
    }
  }

  // 1. Inserir obra
  const allowedFields = [
    'titulo_alternativo', 'subtitulo', 'idioma', 'genero_musical',
    'ano_criacao', 'duracao_segundos', 'letra', 'status', 'iswc', 'codigo_obra',
    'observacoes', 'contrato_origem_id', 'interprete_referencia', 'editora_id',
    'status_catalogo', 'origem_editora_id',
  ]
  const obraPayload: Record<string, unknown> = { titulo, tenant_id: usuario.tenant_id }
  for (const k of allowedFields) {
    if (rest[k] !== undefined && rest[k] !== null && rest[k] !== '') obraPayload[k] = rest[k]
  }
  // Compatibilidade: form pode enviar 'genero' mas o banco usa 'genero_musical'
  if (rest.genero !== undefined && rest.genero !== null && rest.genero !== '' && !obraPayload.genero_musical) {
    obraPayload.genero_musical = rest.genero
  }
  // Regra: obra criada com contrato de origem → pré-cadastro até revisão do Admin
  //        obra criada diretamente pelo Admin sem contrato → catálogo ativo
  if (!obraPayload.status_catalogo) {
    obraPayload.status_catalogo = contratoOrigemId ? 'pre_cadastro' : 'catalogo_ativo'
  }
  // Auto-gerar codigo_obra robusto: Math.max sobre todos OBR-% do tenant + retry anti-colisão
  let obra: Record<string, unknown> | null = null
  let obraErr: { code?: string; message: string } | null = null

  if (!obraPayload.codigo_obra) {
    const { data: codigosExistentes } = await sb
      .from('obras')
      .select('codigo_obra')
      .eq('tenant_id', usuario.tenant_id)
      .like('codigo_obra', 'OBR-%')

    const maiorNum = (codigosExistentes ?? []).reduce((max, row) => {
      const n = parseInt(String(row.codigo_obra).replace('OBR-', ''), 10)
      return isNaN(n) ? max : Math.max(max, n)
    }, 0)
    let nextNum = maiorNum + 1

    for (let attempt = 0; attempt < 3; attempt++) {
      obraPayload.codigo_obra = `OBR-${String(nextNum).padStart(5, '0')}`
      const result = await sb.from('obras').insert(obraPayload).select().single()
      obra = result.data as Record<string, unknown> | null
      obraErr = result.error as { code?: string; message: string } | null

      if (!obraErr) break
      if (
        obraErr.code === '23505' &&
        obraErr.message.includes('obras_tenant_id_codigo_obra_key')
      ) {
        nextNum++
        continue
      }
      break
    }
  } else {
    const result = await sb.from('obras').insert(obraPayload).select().single()
    obra = result.data as Record<string, unknown> | null
    obraErr = result.error as { code?: string; message: string } | null
  }

  if (obraErr) return NextResponse.json({ error: obraErr.message }, { status: 500 })
  if (!obra) return NextResponse.json({ error: 'Obra não foi criada' }, { status: 500 })

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
          tipo_link: 'controlado',
          controlado: link.controlado ?? false,
          status: 'ativo',
        })
        .select('id')
        .single()

      if (linkErr || !linkRow) {
        return NextResponse.json({ error: linkErr?.message ?? 'Falha ao criar link da obra' }, { status: 500 })
      }

      const titulares = Array.isArray(link.titulares) ? link.titulares : []
      if (titulares.length > 0) {
        // ── Calcular concentração sintética ANTES do insert ──────────────────
        const partics: ParticipacaoConcentracao[] = titulares.map((t: Record<string, unknown>) => ({
          link_number: 1,
          papel:       mapPapelToFuncaoLink(t.papel),
          pr_pct:      Number(t.percentual_exec_publica ?? t.percentual ?? 0),
          controlled:  Boolean(t.controlado ?? false),
        }))
        const concResults = calcularConcentracaoLink(partics)

        const titRows = titulares.map((t: Record<string, unknown>, idx: number) => {
          const conc = concResults[idx]
          const execPublica = Number(t.percentual_exec_publica ?? t.percentual ?? 0)
          return {
            obra_link_id: linkRow.id,
            obra_id: obra!.id,
            tenant_id: usuario.tenant_id,
            titular_id: t.titular_id || null,
            nome: t.nome ?? '',
            papel: t.papel ?? 'compositor',
            funcao_no_link: mapPapelToFuncaoLink(t.papel),
            percentual_exec_publica:   execPublica,
            percentual_fonomecanico:   Number(t.percentual_fonomecanico ?? t.percentual ?? 0),
            percentual_sincronizacao:  Number(t.percentual_sincronizacao ?? t.percentual ?? 0),
            controlado: Boolean(t.controlado ?? false),
            ipi: t.ipi || null,
            cae: t.ipi || null,
            editora_id: t.editora_id ?? null,
            editora_original_id: t.editora_original_id ?? t.editora_id ?? null,
            editora_administradora_id: t.editora_administradora_id ?? null,
            status_controle: t.controlado ? 'controlado' : 'nao_controlado',
            origem:    'manual',
            criado_por: usuario.id,
            // ── pct_* sintéticos (concentração) ────────────────────────────
            pct_repr_fonomecanica:         conc.mr_gravado,
            pct_inclusao_audiovisual:      conc.sr_gravado,
            pct_inclusao_publicitaria:     0,        // D via contrato (Etapa 3B)
            pct_comunicacao_publico:       execPublica, // individual diluído, NÃO concentra
            pct_repr_grafica:              0,
            pct_distribuicao_meios:        0,
            pct_inclusao_base_dados:       0,
            pct_autorizacoes_onus:         0,
            pct_ext_repr_grafica:          0,
            pct_ext_repr_fonomecanica:     0,
            pct_ext_inclusao_audiovisual:  0,
            pct_ext_inclusao_publicitaria: 0,
            pct_ext_distribuicao_meios:    0,
            pct_ext_inclusao_base_dados:   0,
            pct_ext_comunicacao_publico:   0,
          }
        })

        const { data: insertedTits, error: titularesErr } = await sb
          .from('obras_links_titulares')
          .insert(titRows)
          .select('id')
        if (titularesErr) {
          return NextResponse.json({ error: titularesErr.message }, { status: 500 })
        }

        // ── Upsert titular_direito_controle (4 direitos por titular) ────────
        if (insertedTits && insertedTits.length > 0) {
          type TdcRow = {
            obra_link_titular_id: string; direito: string; territorio: string
            controlado: boolean; pct_sintetico: number; origem: string; criado_por: string
          }
          const tdcRows: TdcRow[] = []
          for (let j = 0; j < insertedTits.length; j++) {
            const tId   = (insertedTits[j] as { id: string }).id
            const conc  = concResults[j]
            const tCtrl = Boolean(titulares[j].controlado ?? false)
            const base  = { obra_link_titular_id: tId, territorio: 'BR', origem: 'manual', criado_por: usuario.id }
            tdcRows.push({ ...base, direito: 'repr_fonomecanica',     controlado: conc.ehConcentrador, pct_sintetico: conc.mr_gravado })
            tdcRows.push({ ...base, direito: 'inclusao_audiovisual',  controlado: conc.ehConcentrador, pct_sintetico: conc.sr_gravado })
            tdcRows.push({ ...base, direito: 'inclusao_publicitaria', controlado: conc.ehConcentrador, pct_sintetico: 0 })
            tdcRows.push({ ...base, direito: 'comunicacao_publico',   controlado: tCtrl,               pct_sintetico: 0 })
          }
          await sb.from('titular_direito_controle')
            .upsert(tdcRows, { onConflict: 'obra_link_titular_id,direito,territorio' })
        }
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

  // ── 4. 3B-1b: Gravar analítico (contrato + contrato_titular_direito) ─────────
  {
    type SplitPayload = { contratado: boolean; br_autor: number; br_editora: number; ext_autor: number; ext_editora: number }
    const splitsDireitosRaw = rest.splits_direitos as Record<string, SplitPayload> | null | undefined
    const nomeContratanteP  = rest.nome_contratante as string | null | undefined
    const dataContratoP     = rest.data_contrato    as string | null | undefined

    if (splitsDireitosRaw && typeof splitsDireitosRaw === 'object') {
      // Encontrar compositor principal (primeiro titular do primeiro link)
      let compositorTitularId: string | null = null
      if (Array.isArray(links) && links.length > 0) {
        const primeiroLink = links[0] as { titulares?: { papel?: string; titular_id?: string }[] }
        const compositor = (primeiroLink.titulares ?? []).find(t =>
          ['compositor', 'autor', 'adaptador', 'versionista'].includes(t.papel ?? '')
        )
        if (compositor?.titular_id) compositorTitularId = compositor.titular_id
      }

      if (compositorTitularId) {
        // Obter ou criar contrato
        let contratoId = contratoOrigemId || null

        if (!contratoId) {
          const { count: cntC } = await sb.from('contratos')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', usuario.tenant_id)
          const numContrato = `CNT-${String((cntC ?? 0) + 1).padStart(5, '0')}`

          const { data: novoContrato } = await sb.from('contratos').insert({
            tenant_id:          usuario.tenant_id,
            titular_id:         compositorTitularId,
            numero:             numContrato,
            tipo:               'cessao',
            data_inicio:        dataContratoP || new Date().toISOString().split('T')[0],
            prazo_indeterminado: !dataContratoP,
            status:             'ativo',
            splits_direitos:    splitsDireitosRaw,
            observacoes:        nomeContratanteP ? `Titular: ${nomeContratanteP}` : null,
          }).select('id').single()

          if (novoContrato) {
            contratoId = novoContrato.id
            await sb.from('contrato_obras').insert({
              tenant_id:   usuario.tenant_id,
              contrato_id: contratoId,
              obra_id:     (obra as { id: string }).id,
            })
            await sb.from('obras')
              .update({ contrato_origem_id: contratoId })
              .eq('id', (obra as { id: string }).id)
              .eq('tenant_id', usuario.tenant_id)
          }
        }

        if (contratoId) {
          const DIREITOS_KEYS = [
            'repr_grafica', 'repr_fonomecanica',
            'inclusao_audiovisual', 'inclusao_publicitaria',
            'distribuicao_meios', 'inclusao_base_dados',
            'comunicacao_publico', 'autorizacoes_onus',
          ] as const
          const SO_BR = new Set(['repr_grafica', 'autorizacoes_onus'])

          const ctdRows: Record<string, unknown>[] = []
          for (const direito of DIREITOS_KEYS) {
            const sp = splitsDireitosRaw[direito]
            if (!sp?.contratado) continue

            // Linha BR
            ctdRows.push({
              tenant_id:      usuario.tenant_id,
              contrato_id:    contratoId,
              titular_id:     compositorTitularId,
              direito,
              territorio:     'BR',
              pct_autor:      sp.br_autor,
              pct_ed_original: sp.br_editora,
              pct_ed_adm:     0,
              ativo:          true,
              origem:         'contrato',
            })

            // Linha EXT (só se não-soBr E valores somam ~100)
            if (!SO_BR.has(direito)) {
              const extSum = (sp.ext_autor ?? 0) + (sp.ext_editora ?? 0)
              if (Math.abs(extSum - 100) < 0.02) {
                ctdRows.push({
                  tenant_id:      usuario.tenant_id,
                  contrato_id:    contratoId,
                  titular_id:     compositorTitularId,
                  direito,
                  territorio:     'EXT',
                  pct_autor:      sp.ext_autor,
                  pct_ed_original: sp.ext_editora,
                  pct_ed_adm:     0,
                  ativo:          true,
                  origem:         'contrato',
                })
              }
            }
          }

          if (ctdRows.length > 0) {
            // Idempotência: delete + reinsert
            await sb.from('contrato_titular_direito')
              .delete()
              .eq('contrato_id', contratoId)
              .eq('tenant_id', usuario.tenant_id)
            await sb.from('contrato_titular_direito').insert(ctdRows)

            // Sync splits_direitos JSONB (cópia derivada da tabela)
            await sb.from('contratos')
              .update({ splits_direitos: splitsDireitosRaw })
              .eq('id', contratoId)
              .eq('tenant_id', usuario.tenant_id)
          }
        }
      }
    }
  }

  try {
    await logAudit({
      tenant_id: usuario.tenant_id,
      acao: 'criar',
      modulo: 'obras',
      tabela_afetada: 'obras',
      registro_id: (obra as { id: string }).id,
      dados_novos: obra as Record<string, unknown>,
      origem_execucao: 'usuario',
    })
  } catch (auditErr) {
    console.error('[obras] logAudit falhou silenciosamente:', auditErr)
  }
  return NextResponse.json(obra, { status: 201 })
}
