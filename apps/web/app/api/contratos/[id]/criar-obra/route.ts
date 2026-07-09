/**
 * POST /api/contratos/[id]/criar-obra
 *
 * Cria obras no catálogo a partir do obras_json do contrato.
 * - Bloqueia duplicata por ISWC ou por título + mesmo conjunto de autores
 * - Cria obra + obras_links + obras_links_titulares para cada obra do rascunho
 * - contrato_origem_id da obra aponta para o contrato
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'
import {
  classificarAutoresDedup,
  isPapelAutorDedup,
  normalizarTextoDedup,
} from '@/lib/obra-dedup'

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
async function autenticar(sb: any, req: NextRequest): Promise<string | null> {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  return usuario?.tenant_id ?? null
}

/** Mapeia papel textual do contrato → funcao_link enum do banco */
function papelToFuncao(papel: string): string {
  const map: Record<string, string> = {
    compositor:           'CA',
    letrista:             'CA',
    compositor_letrista:  'CA',
    arranjador:           'A',
    adaptador:            'AD',
    autor:                'CA',
    editora:              'E',
    editora_original:     'E',
    administradora:       'AM',
  }
  return map[(papel ?? '').toLowerCase()] ?? 'CA'
}

/** Gera codigo_obra único: prefixo (3 letras da editora) + sequencial 4 dígitos */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gerarCodigoObra(sb: any, tenant_id: string, nomeEditora: string): Promise<string> {
  const sigla = (nomeEditora ?? 'OBR')
    .trim()
    .split(/\s+/)[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X')

  // Conta TODAS as obras do tenant (incluindo deleted) para não reutilizar código
  const { count } = await sb
    .from('obras')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id)

  const seq = (count ?? 0) + 1
  return `${sigla}${String(seq).padStart(4, '0')}`
}

type ObraJson = {
  titulo: string
  titulo_alternativo?: string
  papel_autor?: string
  pct_autor?: number
  co_autores?: Array<{ nome: string; papel: string; pct?: number }>
}

type MatchTipo = 'duplicata_exata' | 'homonima' | 'nenhum'
type AutorDedup = { titular_id?: string | null; nomes: string[] }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enriquecerAutores(sb: any, tenantId: string, autores: AutorDedup[]): Promise<AutorDedup[]> {
  const ids = Array.from(new Set(autores.map(a => a.titular_id).filter(Boolean))) as string[]
  if (ids.length === 0) return autores

  const { data: titulares } = await sb
    .from('titulares')
    .select('id, nome_completo, nome_artistico, pseudonimos')
    .eq('tenant_id', tenantId)
    .in('id', ids)

  const byId = new Map<string, any>((titulares ?? []).map((t: any) => [t.id, t]))
  return autores.map(a => {
    const tit: any = a.titular_id ? byId.get(a.titular_id) : null
    const pseudonimos = Array.isArray(tit?.pseudonimos)
      ? tit.pseudonimos.map((p: any) => p?.nome).filter(Boolean)
      : []
    return {
      ...a,
      nomes: [
        ...a.nomes,
        tit?.nome_completo,
        tit?.nome_artistico,
        ...pseudonimos,
      ].filter(Boolean),
    }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function classificarMatchAutores(
  sb: any,
  tenantId: string,
  existingObraId: string,
  novosAutores: AutorDedup[]
): Promise<MatchTipo> {
  const { data: existingLinks } = await sb
    .from('obras_links_titulares')
    .select('titular_id, nome, papel, funcao_no_link')
    .eq('obra_id', existingObraId)

  const existingAutores = (existingLinks ?? [])
    .filter((t: Record<string, unknown>) => isPapelAutorDedup(t))
    .map((t: Record<string, unknown>) => ({
      titular_id: t.titular_id as string | null,
      nomes: [String(t.nome ?? '')],
    }))

  if (existingAutores.length === 0 || novosAutores.length === 0) return 'nenhum'

  const existentes = await enriquecerAutores(sb, tenantId, existingAutores)
  const novos = await enriquecerAutores(sb, tenantId, novosAutores)
  return classificarAutoresDedup(novos, existentes)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const iswcInput: string | undefined = body.iswc || undefined
  const interpretesInput: Array<{ nome_artistico: string; nome_civil?: string; tipo?: string }> = body.interpretes ?? []
  const fonogramasInput: Array<Record<string, unknown>> = body.fonogramas ?? []

  // ── 1. Buscar contrato ────────────────────────────────────────────────────
  const { data: contrato, error: errContrato } = await sb
    .from('contratos')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .single()

  if (errContrato || !contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  // ── 2. Validar status do contrato ─────────────────────────────────────────
  const statusPermitidos = ['validado', 'aprovado_admin']
  if (!statusPermitidos.includes(contrato.status)) {
    return NextResponse.json(
      { error: `Contrato deve estar validado ou aprovado. Status atual: ${contrato.status}` },
      { status: 422 }
    )
  }

  // ── 3. Verificar obras_json ───────────────────────────────────────────────
  const obrasJson: ObraJson[] = contrato.obras_json ?? []
  if (obrasJson.length === 0) {
    return NextResponse.json({ error: 'Contrato não possui obras no rascunho (obras_json vazio)' }, { status: 422 })
  }

  // ── 4. Buscar dados da editora ────────────────────────────────────────────
  let editoraNome = 'OBR'
  let editoraRazaoSocial = ''

  // Tenta editora_id do contrato; fallback: editora principal do tenant
  let editoraIdFinal: string | null = contrato.editora_id ?? null
  if (editoraIdFinal) {
    const { data: ed } = await sb
      .from('editoras')
      .select('id, nome_fantasia, razao_social')
      .eq('id', editoraIdFinal)
      .single()
    if (ed) {
      editoraNome       = ed.nome_fantasia ?? 'OBR'
      editoraRazaoSocial = ed.razao_social ?? ed.nome_fantasia ?? ''
    }
  } else {
    const { data: edFallback } = await sb
      .from('editoras')
      .select('id, nome_fantasia, razao_social')
      .eq('tenant_id', tenant_id)
      .limit(1)
      .single()
    if (edFallback) {
      editoraIdFinal    = edFallback.id
      editoraNome       = edFallback.nome_fantasia ?? 'OBR'
      editoraRazaoSocial = edFallback.razao_social ?? edFallback.nome_fantasia ?? ''
    }
  }

  // ── 5. Buscar dados do titular principal ──────────────────────────────────
  let titularNome = 'Titular'

  if (contrato.titular_id) {
    const { data: tit } = await sb
      .from('titulares')
      .select('nome_completo, nome')
      .eq('id', contrato.titular_id)
      .single()
    if (tit) titularNome = tit.nome_completo ?? tit.nome ?? 'Titular'
  }

  // ── 6. Verificar obras existentes (antes de criar) ────────────────────────
  type ExistenteItem = {
    titulo: string
    obras: unknown[]
    match_type: 'duplicata_exata' | 'homonima'
  }
  const existentes: ExistenteItem[] = []
  const homonimas = new Set<string>()

  if (iswcInput?.trim()) {
    const { data: porIswc } = await sb
      .from('obras')
      .select('id, codigo_obra, titulo, iswc')
      .eq('tenant_id', tenant_id)
      .eq('iswc', iswcInput.trim())
      .is('deleted_at', null)

    if ((porIswc ?? []).length > 0) {
      return NextResponse.json({
        match: true,
        match_type: 'duplicata_exata',
        message: 'Obra duplicada: ISWC já existe no catálogo.',
        existentes: [{ titulo: obrasJson[0]?.titulo ?? '', obras: porIswc, match_type: 'duplicata_exata' }],
      }, { status: 409 })
    }
  }

  for (const o of obrasJson) {
    const tituloNorm = normalizarTextoDedup(o.titulo)
    const { data: existingListAll } = await sb
      .from('obras')
      .select('id, codigo_obra, titulo, status, iswc')
      .eq('tenant_id', tenant_id)
      .is('deleted_at', null)

    const existingList = (existingListAll ?? []).filter((ex: any) => normalizarTextoDedup(ex.titulo) === tituloNorm)
    if (!existingList || existingList.length === 0) continue

    const novosAutores: AutorDedup[] = []
    if (contrato.titular_id) novosAutores.push({ titular_id: contrato.titular_id, nomes: [titularNome] })
    for (const co of o.co_autores ?? []) {
      const { data: coTit } = await sb
        .from('titulares')
        .select('id')
        .eq('tenant_id', tenant_id)
        .or(`nome_completo.ilike.${co.nome.trim()},nome_artistico.ilike.${co.nome.trim()}`)
        .limit(1)
      novosAutores.push({ titular_id: coTit?.[0]?.id ?? null, nomes: [co.nome] })
    }

    let worstMatch: MatchTipo = 'nenhum'
    for (const ex of existingList as Array<{ id: string; codigo_obra: string; titulo: string; status: string }>) {
      const m = await classificarMatchAutores(sb, tenant_id, ex.id, novosAutores)
      if (m === 'duplicata_exata') { worstMatch = 'duplicata_exata'; break }
      if (m === 'homonima') worstMatch = 'homonima'
    }

    if (worstMatch === 'nenhum') continue
    if (worstMatch === 'duplicata_exata') {
      existentes.push({ titulo: o.titulo, obras: existingList, match_type: worstMatch })
    } else {
      homonimas.add(o.titulo)
    }
  }

  if (existentes.length > 0) {
    return NextResponse.json({
      match: true,
      match_type: 'duplicata_exata',
      message: 'Obra duplicada: mesmo título e mesmos autores já existem no catálogo.',
      existentes,
    }, { status: 409 })
  }

  // ── 7. Criar obras ────────────────────────────────────────────────────────
  const criadas: Array<{ obra_id: string; codigo_obra: string; titulo: string }> = []
  const erros: Array<{ titulo: string; motivo: string }> = []

  for (const o of obrasJson) {
    const pctAutor   = o.pct_autor ?? 50
    const pctEditora = typeof contrato.percentual_editora === 'number'
      ? contrato.percentual_editora
      : Math.max(0, 100 - pctAutor)

    // ── 7a. Gerar codigo_obra único ─────────────────────────────────────────
    const codigoObra = await gerarCodigoObra(sb, tenant_id, editoraNome)

    // ── 7b. Inserir obra ────────────────────────────────────────────────────
    const obsHomonima = homonimas.has(o.titulo)
      ? 'Obra homônima: mesmo título com autor em comum e coautores diferentes.'
      : null

    const { data: novaObra, error: errObra } = await sb
      .from('obras')
      .insert({
        tenant_id,
        editora_id:         editoraIdFinal,
        codigo_obra:        codigoObra,
        titulo:             (o.titulo ?? '').trim(),
        titulo_alternativo: o.titulo_alternativo ?? null,
        iswc:               iswcInput ?? null,
        status:             'pre_cadastro',
        origem_cadastro:    'contrato_sistema',
        contrato_origem_id: contrato.id,
        observacoes:         obsHomonima,
      })
      .select()
      .single()

    if (errObra || !novaObra) {
      erros.push({ titulo: o.titulo, motivo: errObra?.message ?? 'Erro desconhecido' })
      continue
    }

    // ── 7c. Link 1 — titular (CA) + editora (E) ─────────────────────────────
    const { data: link1, error: errLink1 } = await sb
      .from('obras_links')
      .insert({
        tenant_id,
        obra_id:               novaObra.id,
        numero_link:           1,
        percentual_link:       pctAutor + pctEditora,
        tipo_link:             'controlado',
        controlado:            true,
        percentual_controlado: pctAutor + pctEditora,
        status:                'ativo',
      })
      .select()
      .single()

    if (errLink1 || !link1) {
      erros.push({ titulo: o.titulo, motivo: `Erro no link 1: ${errLink1?.message}` })
      continue
    }

    // Participante: autor (CA)
    if (contrato.titular_id) {
      const { error: errCA } = await sb.from('obras_links_titulares').insert({
        tenant_id,
        obra_link_id:           link1.id,
        obra_id:                novaObra.id,
        titular_id:             contrato.titular_id,
        nome:                   titularNome,
        funcao_no_link:         papelToFuncao(o.papel_autor ?? 'autor'),
        papel:                  o.papel_autor ?? 'autor',
        percentual_exec_publica: pctAutor,
        percentual_fonomecanico: pctAutor,
        editora_original_id:    editoraIdFinal,
        contrato_id:            contrato.id,
        controlado:             true,
        status_controle:        'controlado',
      })
      if (errCA) console.error('[criar-obra] Erro ao inserir CA:', errCA.message)
    }

    // Participante: editora (E)
    if (editoraIdFinal) {
      const { error: errE } = await sb.from('obras_links_titulares').insert({
        tenant_id,
        obra_link_id:           link1.id,
        obra_id:                novaObra.id,
        editora_id:             editoraIdFinal,
        nome:                   editoraRazaoSocial || editoraNome,
        funcao_no_link:         'E',
        papel:                  'editora_original',
        percentual_exec_publica: pctEditora,
        percentual_fonomecanico: pctEditora,
        editora_original_id:    editoraIdFinal,
        contrato_id:            contrato.id,
        controlado:             true,
        status_controle:        'controlado',
      })
      if (errE) console.error('[criar-obra] Erro ao inserir E:', errE.message)
    }

    // ── 7d. Co-autores — cada um em link separado ───────────────────────────
    for (const [coIdx, co] of (o.co_autores ?? []).entries()) {
      const coLinkNum = 2 + coIdx

      const { data: linkCo, error: errLinkCo } = await sb
        .from('obras_links')
        .insert({
          tenant_id,
          obra_id:               novaObra.id,
          numero_link:           coLinkNum,
          percentual_link:       co.pct ?? 0,
          tipo_link:             'direto_sem_editora',
          controlado:            false,
          percentual_controlado: 0,
          status:                'ativo',
        })
        .select()
        .single()

      if (errLinkCo || !linkCo) continue

      // Tentar localizar titular do co-autor pelo nome exato
      const { data: coTitulares } = await sb
        .from('titulares')
        .select('id')
        .eq('tenant_id', tenant_id)
        .ilike('nome_completo', co.nome.trim())
        .limit(1)

      const coTitularId: string | null = coTitulares?.[0]?.id ?? null

      await sb.from('obras_links_titulares').insert({
        tenant_id,
        obra_link_id:           linkCo.id,
        obra_id:                novaObra.id,
        titular_id:             coTitularId,
        nome:                   co.nome,
        funcao_no_link:         papelToFuncao(co.papel),
        papel:                  co.papel,
        percentual_exec_publica: co.pct ?? 0,
        percentual_fonomecanico: co.pct ?? 0,
        controlado:             false,
        status_controle:        'nao_controlado',
      })
    }

    criadas.push({ obra_id: novaObra.id, codigo_obra: codigoObra, titulo: o.titulo })

    // ── Inserir intérpretes ──────────────────────────────────────────────────
    for (const interp of interpretesInput) {
      if (!interp.nome_artistico?.trim()) continue
      await sb.from('obras_interpretes').insert({
        tenant_id,
        obra_id:        novaObra.id,
        nome_artistico: interp.nome_artistico.trim(),
        nome_civil:     interp.nome_civil?.trim() || null,
        tipo:           interp.tipo ?? 'principal',
        origem:         'manual',
      })
    }

    // ── Inserir fonogramas ───────────────────────────────────────────────────
    for (const fono of fonogramasInput) {
      if (!fono.titulo_fonograma && !fono.isrc) continue
      await sb.from('fonogramas').insert({
        tenant_id,
        obra_id:         novaObra.id,
        titulo_fonograma: fono.titulo_fonograma ?? '',
        isrc:            fono.isrc || null,
        interprete:      fono.interprete || null,
        versao:          fono.versao || null,
        titulo_versao:   fono.titulo_versao || null,
        gravadora:       fono.gravadora || null,
        duracao_segundos: fono.duracao_segundos || null,
        data_lancamento: fono.data_lancamento || null,
        titulo_album:    fono.titulo_album || null,
        produtor_album:  fono.produtor_album || null,
        codigo_catalogo: fono.codigo_catalogo || null,
        ean:             fono.ean || null,
        formato_audio:   fono.formato_audio ?? true,
        tecnica_digital: fono.tecnica_digital ?? true,
        tipo_midia:      fono.tipo_midia || null,
        origem:          'manual',
        contrato_id:     contrato.id,
      })
    }

    // ── Vincular em contrato_obras (upsert para ser idempotente) ─────────────
    const { error: errCO } = await sb
      .from('contrato_obras')
      .upsert(
        { tenant_id, contrato_id: contrato.id, obra_id: novaObra.id },
        { onConflict: 'contrato_id,obra_id', ignoreDuplicates: true }
      )
    if (errCO) console.error('[criar-obra] contrato_obras upsert:', errCO.message)

    await logAudit({
      tenant_id,
      acao:             'criar',
      modulo:           'obras',
      tabela_afetada:   'obras',
      registro_id:      novaObra.id,
      dados_novos:      { ...novaObra, contrato_id: contrato.id },
      origem_execucao:  'usuario',
    })
  }

  if (criadas.length === 0) {
    return NextResponse.json({ error: 'Nenhuma obra criada.', erros }, { status: 500 })
  }

  return NextResponse.json({
    criadas,
    erros,
    homonimas: Array.from(homonimas),
    total:   criadas.length,
    message: `${criadas.length} obra(s) criada(s) com sucesso.`,
  })
}
