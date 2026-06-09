// ============================================================
// lib/save-obras-supabase.ts — Persiste obras CWR no Supabase
// Fluxo principal da importação CWR (localStorage removido como fallback).
//
// Etapas:
//   1. Obtém tenant_id + userId da sessão
//   2. Upsert em `titulares` — 3 layers de matching:
//        Layer 1: codigo_titular (código CWR/legado)
//        Layer 2: codigo_ipi / ipi (evita duplicar titulares reais)
//        Layer 3: nome_completo (fallback seguro, somente sem IPI)
//  2b. Pré-cadastra editoras PJ em `editoras` + constrói editoraIdMap
//   3. Busca IDs de titulares e editoras para uso nos links
//      (inclui lookup amplo por IPI para titulares matched via Layer 2)
//   4. Upsert em `obras`
//   5. Mapear codigo_obra → id Supabase
//   6. Upsert em `obras_links` + `obras_links_titulares`
//   7. Insert em `obras_participantes` (um participante por linha)
//   8. Insert em `fonogramas` (ISRCs/REC records do CWR)
//   9. Audit log em `audit_logs`
// ============================================================

import { createClient } from '@/lib/supabase/client'
import type { Obra, ObraLink } from '@/lib/types-obras'
import type { TitularStore, GravacaoStore } from '@/lib/cwr-to-obra'

export interface SaveObrasResult {
  obras_saved: number
  titulares_saved: number
  links_saved: number
  participantes_saved: number
  fonogramas_saved: number
  errors: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function mapPapelToFuncao(papel: string): string {
  const map: Record<string, string> = {
    autor: 'A', compositor: 'C', versionista: 'V', adaptador: 'AD',
    editora_original: 'E', administradora: 'AM', subeditora: 'SE',
    interprete_referencia: 'I',
  }
  return map[papel] ?? 'A'
}

/**
 * Mapeia papel verbose (CwrPapel) → código válido em obras_participantes.
 * Aceitos: 'CA','E','SE','CO','AD','TR','AM'
 */
function papelParticipantes(papel: string): string | null {
  const map: Record<string, string> = {
    autor:             'CA',
    compositor:        'CA',
    versionista:       'TR',
    adaptador:         'AD',
    editora_original:  'E',
    administradora:    'AM',
    subeditora:        'SE',
    outro:             'CA',
  }
  return map[papel] ?? null
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function saveObrasToSupabase(
  obras: Obra[],
  titulares: TitularStore[],
  gravacoes: GravacaoStore[] = []
): Promise<SaveObrasResult> {
  const result: SaveObrasResult = {
    obras_saved: 0,
    titulares_saved: 0,
    links_saved: 0,
    participantes_saved: 0,
    fonogramas_saved: 0,
    errors: [],
  }

  if (!obras.length) return result

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    result.errors.push('Supabase não configurado')
    return result
  }

  let tenantId: string | null = null
  let userId: string | null = null

  try {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // ── 1. Obter tenant_id + userId da sessão ────────────────────────────────
    const { data: sessionData } = await supabase.auth.getSession()
    userId = sessionData?.session?.user?.id ?? null

    if (userId) {
      const { data: userRow } = await sb
        .from('usuarios')
        .select('tenant_id')
        .eq('auth_user_id', userId)
        .maybeSingle()
      tenantId = userRow?.tenant_id ?? null
    }

    if (!tenantId) {
      const { data: tenantRow } = await sb
        .from('tenants')
        .select('id')
        .limit(1)
        .maybeSingle()
      tenantId = tenantRow?.id ?? null
    }

    if (!tenantId) {
      result.errors.push('Tenant não encontrado')
      return result
    }

    // ── 2. Upsert titulares — 3 layers de matching ───────────────────────────
    const titularesData = titulares.map((t, idx) => {
      const codigoCwr = String(
        t.codigo_interno_legado ?? t.codigo_sequence_cwr ?? ''
      ).trim()
      const codigoTitular = codigoCwr || `CWR-${Date.now().toString(36).slice(-4).toUpperCase()}-${idx}`
      const isPJ = t.tipo === 'pessoa_juridica'

      return {
        tenant_id:      tenantId!,
        codigo_titular: codigoTitular,
        tipo:           isPJ ? 'editora' : 'autor',
        nome_completo:  String(t.nome ?? '').trim(),
        pessoa:         isPJ ? 'PJ' : 'PF',
        ipi:            t.ipi ?? null,
        codigo_ipi:     t.ipi ?? null,
        status:         'ativo',
        ...(codigoCwr             ? { codigo_interno_legado:  codigoCwr }             : {}),
        ...(t.codigo_sequence_cwr ? { codigo_sequence_cwr: t.codigo_sequence_cwr }    : {}),
      } as any
    })

    if (titularesData.length > 0) {
      // ── Layer 1: lookup por codigo_titular ──────────────────────────────────
      const codigos = titularesData.map((t: any) => t.codigo_titular).filter(Boolean)
      const { data: existentes } = await sb
        .from('titulares')
        .select('id, codigo_titular, ipi')
        .eq('tenant_id', tenantId)
        .in('codigo_titular', codigos)

      const existentesCodigos = new Set((existentes ?? []).map((e: any) => e.codigo_titular))
      result.titulares_saved = (existentes ?? []).length
      let novos = titularesData.filter((t: any) => !existentesCodigos.has(t.codigo_titular))

      // ── Layer 2: IPI — evita duplicar titulares reais já cadastrados ─────────
      if (novos.length > 0) {
        const ipisParaBuscar = [...new Set(novos.map((t: any) => t.ipi).filter(Boolean))] as string[]
        if (ipisParaBuscar.length > 0) {
          const [{ data: byCodigoIpi }, { data: byIpi }] = await Promise.all([
            sb.from('titulares').select('id, codigo_ipi').eq('tenant_id', tenantId).in('codigo_ipi', ipisParaBuscar),
            sb.from('titulares').select('id, ipi').eq('tenant_id', tenantId).in('ipi', ipisParaBuscar),
          ])
          const ipisEncontrados = new Set<string>()
          for (const r of [...(byCodigoIpi ?? []), ...(byIpi ?? [])] as any[]) {
            if (r.codigo_ipi) ipisEncontrados.add(r.codigo_ipi)
            if (r.ipi)        ipisEncontrados.add(r.ipi)
          }
          novos = novos.filter((t: any) => {
            if (t.ipi && ipisEncontrados.has(t.ipi)) {
              result.titulares_saved++ // contabiliza como existente encontrado por IPI
              return false
            }
            return true
          })
        }
      }

      // ── Layer 3: nome_completo (somente para titulares sem IPI) ─────────────
      const novosParaNome = novos.filter((t: any) => !t.ipi)
      if (novosParaNome.length > 0) {
        const nomes = [...new Set(
          novosParaNome.map((t: any) => String(t.nome_completo ?? '').trim()).filter(Boolean)
        )]
        if (nomes.length > 0) {
          const { data: existentesPorNome } = await sb
            .from('titulares')
            .select('id, nome_completo')
            .eq('tenant_id', tenantId)
            .in('nome_completo', nomes)
          const nomesEncontrados = new Set(
            (existentesPorNome ?? []).map((r: any) => String(r.nome_completo ?? '').trim())
          )
          novos = novos.filter((t: any) => {
            if (!t.ipi && nomesEncontrados.has(String(t.nome_completo ?? '').trim())) {
              result.titulares_saved++ // contabiliza como existente encontrado por nome
              return false
            }
            return true
          })
        }
      }

      // ── Inserir apenas os genuinamente novos ─────────────────────────────────
      if (novos.length > 0) {
        const { error: tErr, data: inserted } = await sb
          .from('titulares')
          .insert(novos)
          .select('id, codigo_titular, ipi')
        if (tErr) {
          result.errors.push(`Titulares insert: ${tErr.message}`)
        } else {
          result.titulares_saved += (inserted ?? []).length
        }
        if (inserted) (existentes ?? []).push(...inserted)
      }
    }

    // ── 2b. Pré-cadastrar editoras PJ em `editoras` + construir editoraIdMap ──
    // Necessário para preencher obras_participantes.editora_id corretamente.
    const pjTitulares = titulares.filter(t => t.tipo === 'pessoa_juridica')
    const editoraIdMap = new Map<string, string>() // codigo_interno → editoras.id

    if (pjTitulares.length > 0) {
      const pjCodigos = pjTitulares
        .map(t => String(t.codigo_interno_legado ?? '').trim())
        .filter(Boolean)
      const pjNomes = pjTitulares
        .map(t => String(t.nome ?? '').trim().toUpperCase())
        .filter(Boolean)

      // Lookup por codigo_interno
      if (pjCodigos.length > 0) {
        const { data: existentesByCod } = await sb
          .from('editoras')
          .select('id, codigo_interno')
          .eq('tenant_id', tenantId)
          .in('codigo_interno', pjCodigos)
        for (const r of (existentesByCod ?? []) as any[]) {
          if (r.codigo_interno) editoraIdMap.set(r.codigo_interno, r.id)
        }
      }

      // Lookup por nome_fantasia
      const jaExistemNomes = new Set<string>()
      if (pjNomes.length > 0) {
        const { data: existentesByNome } = await sb
          .from('editoras')
          .select('id, nome_fantasia, codigo_interno')
          .eq('tenant_id', tenantId)
          .in('nome_fantasia', pjNomes)
        for (const r of (existentesByNome ?? []) as any[]) {
          if (r.nome_fantasia) {
            jaExistemNomes.add(r.nome_fantasia.toUpperCase())
            editoraIdMap.set(`nome:${r.nome_fantasia.toUpperCase()}`, r.id)
            if (r.codigo_interno && !editoraIdMap.has(r.codigo_interno)) {
              editoraIdMap.set(r.codigo_interno, r.id)
            }
          }
        }
      }

      // ── Layer C1a: CNPJ extraído do prefixo do nome SPU (ex: "51.132.039 ...") ──
      const jaExistemByCnpj = new Set<string>()
      const cnpjPrefixRe    = /^(\d{2}\.\d{3}\.\d{3})/
      for (const t of pjTitulares) {
        const nomeRaw    = String(t.nome ?? '').trim()
        const matchCnpj  = nomeRaw.match(cnpjPrefixRe)
        if (!matchCnpj) continue
        const cnpjPrefix = matchCnpj[1] // ex: "51.132.039"
        const { data: byC } = await sb
          .from('editoras')
          .select('id, cnpj_cpf, codigo_interno')
          .eq('tenant_id', tenantId)
          .ilike('cnpj_cpf', `${cnpjPrefix}%`)
          .limit(1)
          .maybeSingle()
        if (byC) {
          const cod = String(t.codigo_interno_legado ?? '').trim()
          if (cod)   { editoraIdMap.set(cod, byC.id);                  jaExistemByCnpj.add(cod) }
          if (t.ipi) { editoraIdMap.set(t.ipi, byC.id);               jaExistemByCnpj.add(t.ipi) }
          editoraIdMap.set(`cnpj:${cnpjPrefix}`, byC.id)
          jaExistemByCnpj.add(`cnpj:${cnpjPrefix}`)
        }
      }

      // ── Layer C1b: IPI de editoras ────────────────────────────────────────────
      const pjIpis = [...new Set(pjTitulares.map(t => t.ipi).filter(Boolean))] as string[]
      if (pjIpis.length > 0) {
        const { data: existentesByEdiIpi } = await sb
          .from('editoras')
          .select('id, codigo_ipi')
          .eq('tenant_id', tenantId)
          .in('codigo_ipi', pjIpis)
        for (const r of (existentesByEdiIpi ?? []) as any[]) {
          if (r.codigo_ipi) {
            editoraIdMap.set(r.codigo_ipi, r.id)
            jaExistemByCnpj.add(r.codigo_ipi)
          }
        }
      }

      // Inserir apenas editoras ainda não existentes (C1: exclui matches por CNPJ/IPI)
      const novasEditoras = pjTitulares.filter(t => {
        const cod  = String(t.codigo_interno_legado ?? '').trim()
        const nome = String(t.nome ?? '').trim().toUpperCase()
        const ipi  = t.ipi ?? ''
        return (
          (!cod  || (!editoraIdMap.has(cod)  && !jaExistemByCnpj.has(cod)))  &&
          (!nome || !jaExistemNomes.has(nome))                                 &&
          (!ipi  || !jaExistemByCnpj.has(ipi))
        )
      })

      if (novasEditoras.length > 0) {
        const edPayload = novasEditoras.map(t => ({
          tenant_id:         tenantId!,
          razao_social:      t.nome,
          nome_fantasia:     t.nome,
          status:            'ativo',
          codigo_ipi:        t.ipi ?? null,
          codigo_interno:    String(t.codigo_interno_legado ?? '').trim() || null,
          tipo_editora:      'administrada',
          controlada:        t.controlado,
          origem_importacao: 'cwr',
        }))

        const { data: insertedEd, error: edErr } = await sb
          .from('editoras')
          .insert(edPayload)
          .select('id, codigo_interno, nome_fantasia')
        if (edErr) {
          result.errors.push(`Editoras PJ: ${edErr.message}`)
        } else {
          for (const r of (insertedEd ?? []) as any[]) {
            if (r.codigo_interno) editoraIdMap.set(r.codigo_interno, r.id)
            if (r.nome_fantasia) editoraIdMap.set(`nome:${r.nome_fantasia.toUpperCase()}`, r.id)
          }
        }
      }
    }

    // ── 3. Buscar ids dos titulares (para usar em links e participantes) ──────
    const titularIdMap  = new Map<string, string>() // codigo_titular → uuid
    const titularIpiMap = new Map<string, string>() // ipi → uuid
    {
      const codigos = titularesData.map((t: any) => t.codigo_titular).filter(Boolean)
      const { data: rows } = await sb
        .from('titulares')
        .select('id, codigo_titular, ipi, codigo_ipi')
        .eq('tenant_id', tenantId)
        .in('codigo_titular', codigos)
      if (rows) {
        for (const r of rows as any[]) {
          if (r.codigo_titular) titularIdMap.set(r.codigo_titular, r.id)
          if (r.ipi)            titularIpiMap.set(r.ipi, r.id)
          if (r.codigo_ipi)     titularIpiMap.set(r.codigo_ipi, r.id)
        }
      }

      // Lookup amplo por IPI — captura titulares matched via Layer 2 (diferentes codigo_titular)
      const todosIpis = [...new Set(titularesData.map((t: any) => t.ipi).filter(Boolean))] as string[]
      if (todosIpis.length > 0) {
        const { data: rowsByIpi } = await sb
          .from('titulares')
          .select('id, codigo_ipi, ipi')
          .eq('tenant_id', tenantId)
          .in('codigo_ipi', todosIpis)
        for (const r of (rowsByIpi ?? []) as any[]) {
          if (r.codigo_ipi && !titularIpiMap.has(r.codigo_ipi)) titularIpiMap.set(r.codigo_ipi, r.id)
          if (r.ipi        && !titularIpiMap.has(r.ipi))        titularIpiMap.set(r.ipi, r.id)
        }
      }
    }

    // ── 4. Enrich-only em obras (C3): não sobrescrever campos preenchidos ────
    const codigos = obras.map(o => o.codigo).filter(Boolean)
    const { data: existingObrasRows } = await sb
      .from('obras')
      .select('id, codigo_obra, titulo, iswc, idioma, titulo_alternativo, codigo_interno_legado, codigo_obra_cwr_original')
      .eq('tenant_id', tenantId)
      .in('codigo_obra', codigos)
    const existingObraMap = new Map<string, any>()
    if (existingObrasRows) {
      for (const r of existingObrasRows as any[]) {
        if (r.codigo_obra) existingObraMap.set(r.codigo_obra, r)
      }
    }

    const novasObras  = obras.filter(o => !existingObraMap.has(o.codigo))
    const existentes  = obras.filter(o =>  existingObraMap.has(o.codigo))

    let allInsertedObras: any[] = []

    // Inserir obras novas com payload completo
    if (novasObras.length > 0) {
      const novasPayload = novasObras.map(o => ({
        tenant_id:                  tenantId!,
        titulo:                     o.titulo,
        titulo_alternativo:         o.titulo_original ?? null,
        iswc:                       o.iswc ?? null,
        idioma:                     o.idioma ?? 'PT',
        status:                     'ativa',
        codigo_obra:                o.codigo,
        origem_cadastro:            'migracao',
        status_iswc:                o.iswc ? 'recebido' : 'pendente',
        observacoes:                o.observacoes ?? null,
        codigo_interno_legado:      o.codigo_interno_legado ?? null,
        codigo_obra_cwr_original:   o.codigo_obra_cwr_original ?? null,
        backoffice_status:          'nao_enviada',
        origem_importacao:          'cwr',
      }))
      const { data: inserted, error: oInsErr } = await sb
        .from('obras')
        .insert(novasPayload)
        .select('id, codigo_obra')
      if (oInsErr) { result.errors.push(`Obras insert: ${oInsErr.message}`); return result }
      allInsertedObras = inserted ?? []
      result.obras_saved += allInsertedObras.length
    }

    // Enriquecer obras existentes: atualizar apenas campos null/vazios; logar conflitos
    for (const o of existentes) {
      const row   = existingObraMap.get(o.codigo)
      const patch: Record<string, any> = {}

      const checkField = (dbVal: any, cwrVal: any, fieldName: string) => {
        if (cwrVal === null || cwrVal === undefined || cwrVal === '') return
        if (dbVal === null || dbVal === undefined || dbVal === '') {
          patch[fieldName] = cwrVal
        } else if (String(dbVal).trim() !== String(cwrVal).trim()) {
          result.errors.push(
            `[CONFLITO] Obra ${o.codigo}: ${fieldName}: banco="${dbVal}" vs cwr="${cwrVal}"`
          )
        }
      }

      checkField(row.titulo,             o.titulo,           'titulo')
      checkField(row.iswc,               o.iswc,             'iswc')
      checkField(row.idioma,             o.idioma,           'idioma')
      checkField(row.titulo_alternativo, o.titulo_original,  'titulo_alternativo')
      if (!row.codigo_interno_legado    && o.codigo_interno_legado)    patch.codigo_interno_legado    = o.codigo_interno_legado
      if (!row.codigo_obra_cwr_original && o.codigo_obra_cwr_original) patch.codigo_obra_cwr_original = o.codigo_obra_cwr_original

      if (Object.keys(patch).length > 0) {
        const { error: updErr } = await sb
          .from('obras')
          .update(patch)
          .eq('id', row.id)
        if (updErr) result.errors.push(`Obras update ${o.codigo}: ${updErr.message}`)
        else result.obras_saved++
      }

      allInsertedObras.push({ id: row.id, codigo_obra: row.codigo_obra })
    }

    // ── 5. Mapear codigo_obra → id Supabase ──────────────────────────────────
    const obraIdMap = new Map<string, string>()
    for (const r of allInsertedObras) {
      if (r.codigo_obra) obraIdMap.set(r.codigo_obra, r.id)
    }
    // Fallback: recarregar do banco se mapa ficou vazio
    if (obraIdMap.size === 0) {
      const { data: obrasRows } = await sb
        .from('obras')
        .select('id, codigo_obra')
        .eq('tenant_id', tenantId)
        .in('codigo_obra', obras.map(o => o.codigo))
      if (obrasRows) {
        for (const r of obrasRows as any[]) {
          if (r.codigo_obra) obraIdMap.set(r.codigo_obra, r.id)
        }
      }
    }

    // ── 6. Upsert obras_links + obras_links_titulares ────────────────────────
    const linksToInsert: any[] = []
    const linkTitularesToInsert: any[] = []

    for (const obra of obras) {
      const obraUuid = obraIdMap.get(obra.codigo)
      if (!obraUuid) continue
      const links: ObraLink[] = obra._links ?? []

      for (const link of links) {
        const tipoLink = link.controlado
          ? (link.percentual_controlado < 100 ? 'parcialmente_controlado' : 'controlado')
          : 'direto_sem_editora'

        linksToInsert.push({
          tenant_id:       tenantId!,
          obra_id:         obraUuid,
          numero_link:     link.ordem,
          descricao:       link.descricao ?? null,
          percentual_link: link.percentual_controlado ?? 0,
          tipo_link:       tipoLink,
          status:          'ativo',
        })

        for (const t of (link.titulares ?? [])) {
          const codigoCwr = String(
            t.codigo_interno_legado_titular ?? t.writer_sequence_code ?? t.publisher_sequence_code ?? t.ipi ?? ''
          ).trim()
          const titUuid = (codigoCwr ? titularIdMap.get(codigoCwr) : null)
            ?? (t.ipi ? titularIpiMap.get(t.ipi) : null)
            ?? null
          const isPJ = ['editora_original', 'administradora', 'subeditora'].includes(t.papel)

          linkTitularesToInsert.push({
            tenant_id:                    tenantId!,
            obra_id:                      obraUuid,
            obra_link_id:                 'PENDING',
            titular_id:                   isPJ ? null : titUuid,
            editora_id:                   isPJ ? titUuid : null,
            funcao_no_link:               mapPapelToFuncao(t.papel),
            percentual_exec_publica:      t.percentual_exec_publica ?? t.percentual ?? 0,
            percentual_fonomecanico:      t.percentual_fonomecanico ?? t.percentual ?? 0,
            percentual_sincronizacao:     t.percentual_sincronizacao ?? t.percentual ?? 0,
            ipi:                          t.ipi ?? null,
            status_controle:              t.controlado ? 'controlado' : 'nao_controlado',
            ...(t.codigo_interno_legado_titular
              ? { codigo_interno_legado_titular: t.codigo_interno_legado_titular } : {}),
            ...(t.writer_sequence_code
              ? { writer_sequence_code: t.writer_sequence_code } : {}),
            ...(t.publisher_sequence_code
              ? { publisher_sequence_code: t.publisher_sequence_code } : {}),
            ...(t.pwr_writer_code
              ? { pwr_writer_code: t.pwr_writer_code } : {}),
            _obra_codigo: obra.codigo,
            _link_ordem:  link.ordem,
          })
        }
      }
    }

    if (linksToInsert.length > 0) {
      const { data: insertedLinks, error: lErr } = await sb
        .from('obras_links')
        .upsert(linksToInsert, { onConflict: 'obra_id,numero_link', ignoreDuplicates: false })
        .select('id, obra_id, numero_link')

      if (lErr) {
        result.errors.push(`Links: ${lErr.message}`)
      } else if (insertedLinks) {
        result.links_saved = insertedLinks.length

        const linkUuidMap = new Map<string, string>()
        for (const l of insertedLinks as any[]) {
          linkUuidMap.set(`${l.obra_id}:${l.numero_link}`, l.id)
        }

        const finalLinkTitulares = linkTitularesToInsert
          .map(lt => {
            const obraUuid2 = obraIdMap.get(lt._obra_codigo)
            const linkUuid  = obraUuid2
              ? linkUuidMap.get(`${obraUuid2}:${lt._link_ordem}`)
              : null
            if (!linkUuid) return null
            const { _obra_codigo: _c, _link_ordem: _o, ...rest } = lt
            return { ...rest, obra_link_id: linkUuid }
          })
          .filter(Boolean)

        if (finalLinkTitulares.length > 0) {
          const { error: ltErr } = await sb
            .from('obras_links_titulares')
            .upsert(finalLinkTitulares, { ignoreDuplicates: true })
          if (ltErr) result.errors.push(`Titulares do link: ${ltErr.message}`)
        }
      }
    }

    // ── 7. Insert obras_participantes ────────────────────────────────────────
    // Um participante por linha: CA/CO/AD/TR → titular_id | E/SE/AM → editora_id
    // Regra: percentual > 0 | E/SE/AM exigem status_resolucao_editorial NOT NULL
    // Não usa upsert — tabela sem unique constraint; faz check de existência antes.
    const participantesRows: any[] = []

    for (const obra of obras) {
      const obraUuid = obraIdMap.get(obra.codigo)
      if (!obraUuid) continue

      for (const link of (obra._links ?? [])) {
        for (const t of (link.titulares ?? [])) {
          const papel = papelParticipantes(t.papel)
          if (!papel) continue

          const pct = t.percentual_exec_publica ?? t.percentual ?? 0
          if (pct <= 0) continue

          const isEditorial = ['E', 'SE', 'AM'].includes(papel)

          if (isEditorial) {
            const cwrCode = String(
              t.codigo_interno_legado_titular ?? t.publisher_sequence_code ?? ''
            ).trim()
            const nomeKey = t.nome ? `nome:${t.nome.trim().toUpperCase()}` : ''
            const edUuid = (cwrCode ? editoraIdMap.get(cwrCode) : null)
              ?? (t.ipi ? editoraIdMap.get(t.ipi) : null)
              ?? (nomeKey ? editoraIdMap.get(nomeKey) : null)
              ?? null
            if (!edUuid) continue // sem editora no banco — evitar violação FK

            participantesRows.push({
              tenant_id:                  tenantId!,
              obra_id:                    obraUuid,
              editora_id:                 edUuid,
              titular_id:                 null,
              papel,
              percentual:                 pct,
              status_resolucao_editorial: 'pendente_revisao',
            })
          } else {
            const cwrCode = String(
              t.codigo_interno_legado_titular ?? t.writer_sequence_code ?? ''
            ).trim()
            const titUuid = (cwrCode ? titularIdMap.get(cwrCode) : null)
              ?? (t.ipi ? titularIpiMap.get(t.ipi) : null)
              ?? null
            if (!titUuid) continue // sem titular no banco

            participantesRows.push({
              tenant_id:                  tenantId!,
              obra_id:                    obraUuid,
              titular_id:                 titUuid,
              editora_id:                 null,
              papel,
              percentual:                 pct,
              status_resolucao_editorial: null,
            })
          }
        }
      }
    }

    // ── Regra de coedição / controle parcial (C2) ────────────────────────────
    // Um mesmo titular PODE e DEVE aparecer mais de uma vez na mesma obra quando:
    //   • percentual diferente      → coedição proporcional entre cadeias
    //   • cadeia editorial diferente → administradora ou subeditora distinta
    //   • parte controlada + parte não controlada → controle parcial (ex: Top Show vs Universal)
    //   • subedição cruzada entre editoras
    //
    // NÃO somar, NÃO remover, NÃO consolidar — cada linha representa um vínculo
    // editorial independente essencial para BackOffice, CWR, recebimentos e
    // prestação de contas.
    //
    // Chave de dedup inclui `percentual` para distinguir esses vínculos.
    // Limitação futura: se dois vínculos tiverem o mesmo percentual em cadeias
    // distintas, incluir obra_link_id na chave (requer campo na tabela).
    const seenPart = new Set<string>()
    const participantesDedup = participantesRows.filter(r => {
      const key = `${r.obra_id}|${r.titular_id ?? ''}|${r.editora_id ?? ''}|${r.papel}|${r.percentual}`
      if (seenPart.has(key)) return false
      seenPart.add(key)
      return true
    })

    if (participantesDedup.length > 0) {
      // Verificar existentes para não duplicar (inclui percentual na chave)
      const obraIds = [...new Set(participantesDedup.map(r => r.obra_id))]
      const { data: existentesOp } = await sb
        .from('obras_participantes')
        .select('obra_id, titular_id, editora_id, papel, percentual')
        .eq('tenant_id', tenantId)
        .in('obra_id', obraIds)

      const existentesOpSet = new Set(
        (existentesOp ?? []).map(
          (r: any) => `${r.obra_id}|${r.titular_id ?? ''}|${r.editora_id ?? ''}|${r.papel}|${r.percentual}`
        )
      )

      const novosParticipantes = participantesDedup.filter(r => {
        const key = `${r.obra_id}|${r.titular_id ?? ''}|${r.editora_id ?? ''}|${r.papel}|${r.percentual}`
        return !existentesOpSet.has(key)
      })

      if (novosParticipantes.length > 0) {
        const { error: opErr } = await sb
          .from('obras_participantes')
          .insert(novosParticipantes)
        if (opErr) result.errors.push(`Participantes: ${opErr.message}`)
        else result.participantes_saved = novosParticipantes.length
      }
    }

    // ── 8. Insert fonogramas (ISRCs/REC records do CWR) ──────────────────────
    if (gravacoes.length > 0) {
      const fonogramasRows: any[] = []

      for (const grav of gravacoes) {
        // grav.obra_codigo = codigo CWR da obra (chave para obraIdMap)
        const obraUuid = obraIdMap.get(grav.obra_codigo)
        if (!obraUuid) continue

        fonogramasRows.push({
          tenant_id:        tenantId!,
          obra_id:          obraUuid,
          titulo_fonograma: grav.titulo_fonograma || null,
          interprete:       grav.interprete       || null,
          isrc:             grav.isrc             || null,
          duracao_segundos: grav.duracao          ?? null,
          // versao defaults to 'original' (DB default)
        })
      }

      // Deduplica por (obra_id + isrc) se ISRC presente, senão por (obra_id + titulo + interprete)
      const seenFono = new Set<string>()
      const fonogramasDedup = fonogramasRows.filter(r => {
        const key = r.isrc
          ? `${r.obra_id}|isrc:${r.isrc}`
          : `${r.obra_id}|${normalize(r.titulo_fonograma ?? '')}|${normalize(r.interprete ?? '')}`
        if (seenFono.has(key)) return false
        seenFono.add(key)
        return true
      })

      if (fonogramasDedup.length > 0) {
        // Check-antes-de-insert por (obra_id, isrc) para evitar duplicatas
        const obrasComFono  = [...new Set(fonogramasDedup.map(r => r.obra_id))]
        const isrcsNoLote   = fonogramasDedup.map(r => r.isrc).filter(Boolean) as string[]
        const existentesFono = new Set<string>()

        if (isrcsNoLote.length > 0) {
          const { data: fonoRows } = await sb
            .from('fonogramas')
            .select('obra_id, isrc')
            .eq('tenant_id', tenantId)
            .in('obra_id', obrasComFono)
            .not('isrc', 'is', null)
          for (const r of (fonoRows ?? []) as any[]) {
            if (r.isrc) existentesFono.add(`${r.obra_id}|isrc:${r.isrc}`)
          }
        }

        const novosFonogramas = fonogramasDedup.filter(r =>
          !r.isrc || !existentesFono.has(`${r.obra_id}|isrc:${r.isrc}`)
        )

        if (novosFonogramas.length > 0) {
          const { error: fonoErr } = await sb
            .from('fonogramas')
            .insert(novosFonogramas)
          if (fonoErr) result.errors.push(`Fonogramas: ${fonoErr.message}`)
          else result.fonogramas_saved = novosFonogramas.length
        }
      }
    }

    // ── 9. Audit log ─────────────────────────────────────────────────────────
    // Usa a sessão autenticada do usuário (não service role).
    // Falha silenciosa — audit não pode bloquear a importação.
    try {
      await sb.from('audit_logs').insert({
        tenant_id:       tenantId,
        usuario_id:      userId ?? null,
        origem_execucao: 'importacao',
        acao:            'importar',
        modulo:          'backoffice',
        tabela_afetada:  'obras',
        dados_novos: {
          obras_salvas:         result.obras_saved,
          titulares_salvos:     result.titulares_saved,
          fonogramas_salvos:    result.fonogramas_saved,
          participantes_salvos: result.participantes_saved,
          avisos:               result.errors.length,
        },
      })
    } catch {
      // Audit failures must never block the main operation
    }

  } catch (err) {
    result.errors.push(`Erro inesperado: ${String(err)}`)
  }

  return result
}

/** Remove todas as obras/links/titulares do tenant do usuário atual */
export async function clearObrasFromSupabase(): Promise<{ ok: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return { ok: false, error: 'Supabase não configurado' }
  }
  try {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id
    if (!userId) return { ok: false, error: 'Usuário não autenticado' }

    let tenantId: string | null = null
    const { data: userRow } = await sb
      .from('usuarios').select('tenant_id').eq('auth_user_id', userId).maybeSingle()
    tenantId = userRow?.tenant_id ?? null

    if (!tenantId) {
      const { data: tenantRow } = await sb.from('tenants').select('id').limit(1).maybeSingle()
      tenantId = tenantRow?.id ?? null
    }

    if (!tenantId) return { ok: false, error: 'Tenant não encontrado' }

    await sb.from('obras_participantes').delete().eq('tenant_id', tenantId)
    await sb.from('obras_links_titulares').delete().eq('tenant_id', tenantId)
    await sb.from('obras_links').delete().eq('tenant_id', tenantId)
    await sb.from('obras').delete().eq('tenant_id', tenantId)
    await sb.from('titulares').delete().eq('tenant_id', tenantId)

    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
