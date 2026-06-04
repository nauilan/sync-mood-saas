// ============================================================
// lib/save-obras-supabase.ts — Persiste obras CWR no Supabase
// Chamado após importação CWR, em paralelo com upsertStore (localStorage).
//
// Fluxo:
//   1. Obtém sessão atual para tenant_id
//   2. Upsert em `obras` (chave: codigo_obra)
//   3. Upsert em `titulares` (chave: ipi ou nome normalizado)
//   4. Upsert em `obras_links` e `obras_links_titulares`
//   Se qualquer etapa falhar, silencia o erro — localStorage continua como fallback.
// ============================================================

import { createClient } from '@/lib/supabase/client'
import type { Obra, ObraLink } from '@/lib/types-obras'
import type { TitularStore } from '@/lib/cwr-to-obra'

export interface SaveObrasResult {
  obras_saved: number
  titulares_saved: number
  links_saved: number
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

// ── Main export ───────────────────────────────────────────────────────────────

export async function saveObrasToSupabase(
  obras: Obra[],
  titulares: TitularStore[]
): Promise<SaveObrasResult> {
  const result: SaveObrasResult = {
    obras_saved: 0,
    titulares_saved: 0,
    links_saved: 0,
    errors: [],
  }

  if (!obras.length) return result

  // Verificar se Supabase está configurado
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    result.errors.push('Supabase não configurado — dados salvos apenas em localStorage')
    return result
  }

  let tenantId: string | null = null

  try {
    const supabase = createClient()

    // ── 1. Obter tenant_id da sessão ────────────────────────────────────────
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    if (userId) {
      const { data: userRow } = await sb
        .from('usuarios')
        .select('tenant_id')
        .eq('auth_user_id', userId)
        .maybeSingle()
      tenantId = userRow?.tenant_id ?? null
    }

    if (!tenantId) {
      // Tentar buscar o primeiro tenant disponível (modo dev/demo)
      const { data: tenantRow } = await sb
        .from('tenants')
        .select('id')
        .limit(1)
        .maybeSingle()
      tenantId = tenantRow?.id ?? null
    }

    if (!tenantId) {
      result.errors.push('Tenant não encontrado — dados salvos apenas em localStorage')
      return result
    }

    // ── 2. Upsert titulares ─────────────────────────────────────────────────
    const titularesData = titulares.map(t => ({
      tenant_id: tenantId!,
      tipo: t.tipo === 'pessoa_juridica' ? 'editora' : 'autor',
      nome_completo: t.nome,
      pessoa: t.tipo === 'pessoa_juridica' ? 'PJ' : 'PF',
      ipi: t.ipi ?? null,
      codigo_ipi: t.ipi ?? null,
      status: 'ativo',
      // campos de migration 012 (cast para any pois database.types.ts ainda não os inclui)
      ...(t.codigo_interno_legado ? { codigo_interno_legado: t.codigo_interno_legado } : {}),
      ...(t.codigo_sequence_cwr   ? { codigo_sequence_cwr: t.codigo_sequence_cwr }   : {}),
    } as any))

    if (titularesData.length > 0) {
      const { error: tErr, count } = await sb
        .from('titulares')
        .upsert(titularesData, {
          onConflict: 'tenant_id,ipi',
          ignoreDuplicates: false,
          count: 'exact',
        })
      if (tErr) {
        // ipi pode ser nulo; tentar sem constraint
        const { error: tErr2, count: c2 } = await sb
          .from('titulares')
          .upsert(titularesData, { ignoreDuplicates: true, count: 'exact' })
        if (!tErr2) result.titulares_saved = c2 ?? titularesData.length
        else result.errors.push(`Titulares: ${tErr2.message}`)
      } else {
        result.titulares_saved = count ?? titularesData.length
      }
    }

    // ── 3. Buscar ids dos titulares recém-inseridos (para usar em links) ────
    const titularIdMap = new Map<string, string>() // ipi → uuid
    if (titulares.some(t => t.ipi)) {
      const ipis = titulares.filter(t => t.ipi).map(t => t.ipi!)
      const { data: rows } = await sb
        .from('titulares')
        .select('id, ipi')
        .eq('tenant_id', tenantId)
        .in('ipi', ipis)
      if (rows) {
        for (const r of rows) {
          if (r.ipi) titularIdMap.set(r.ipi, r.id)
        }
      }
    }

    // ── 4. Upsert obras — busca IDs existentes primeiro para evitar duplicatas ─
    const codigos = obras.map(o => o.codigo).filter(Boolean)
    const { data: existingObras } = await sb
      .from('obras')
      .select('id, codigo_obra')
      .eq('tenant_id', tenantId)
      .in('codigo_obra', codigos)
    const existingObraMap = new Map<string, string>()
    if (existingObras) {
      for (const r of existingObras as any[]) {
        if (r.codigo_obra && r.id) existingObraMap.set(r.codigo_obra, r.id)
      }
    }

    const obrasData = obras.map(o => ({
      ...(existingObraMap.has(o.codigo) ? { id: existingObraMap.get(o.codigo) } : {}),
      tenant_id: tenantId!,
      titulo: o.titulo,
      titulo_alternativo: o.titulo_original ?? null,
      iswc: o.iswc ?? null,
      idioma: o.idioma ?? 'PT',
      status: 'ativa',
      codigo_obra: o.codigo,
      origem_cadastro: 'migracao',
      status_iswc: o.iswc ? 'recebido' : 'pendente',
      observacoes: o.observacoes ?? null,
      codigo_interno_legado: o.codigo_interno_legado ?? null,
      codigo_obra_cwr_original: o.codigo_obra_cwr_original ?? null,
      backoffice_status: 'nao_enviada',
      origem_importacao: 'cwr',
    }))

    const { data: insertedObras, error: oErr } = await sb
      .from('obras')
      .upsert(obrasData, { onConflict: 'id', ignoreDuplicates: false })
      .select('id, codigo_obra')

    if (oErr) {
      result.errors.push(`Obras: ${oErr.message}`)
      return result
    }

    result.obras_saved = (insertedObras ?? []).length

    // ── 5. Mapear codigo_obra → id Supabase ─────────────────────────────────
    const obraIdMap = new Map<string, string>() // codigo → uuid
    if (insertedObras) {
      for (const r of insertedObras as any[]) {
        if (r.codigo_obra) obraIdMap.set(r.codigo_obra, r.id)
      }
    }
    // Fallback: buscar por codigo_obra se upsert não retornou IDs
    if (obraIdMap.size === 0) {
      const codigos = obras.map(o => o.codigo)
      const { data: obrasRows } = await sb
        .from('obras')
        .select('id, codigo_obra')
        .eq('tenant_id', tenantId)
        .in('codigo_obra', codigos)
      if (obrasRows) {
        for (const r of obrasRows as any[]) {
          if (r.codigo_obra) obraIdMap.set(r.codigo_obra, r.id)
        }
      }
    }

    // ── 6. Upsert obras_links ────────────────────────────────────────────────
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
          tenant_id: tenantId!,
          obra_id: obraUuid,
          numero_link: link.ordem,
          descricao: link.descricao ?? null,
          percentual_link: link.percentual_controlado ?? 0,
          tipo_link: tipoLink,
          status: 'ativo',
        })

        for (const t of (link.titulares ?? [])) {
          const titUuid = t.ipi ? titularIdMap.get(t.ipi) ?? null : null
          const isPJ = ['editora_original', 'administradora', 'subeditora'].includes(t.papel)

          linkTitularesToInsert.push({
            tenant_id: tenantId!,
            obra_id: obraUuid,
            obra_link_id: 'PENDING', // substituído após insert dos links
            titular_id: isPJ ? null : titUuid,
            editora_id: isPJ ? titUuid : null,
            funcao_no_link: mapPapelToFuncao(t.papel),
            percentual_exec_publica: t.percentual_exec_publica ?? t.percentual ?? 0,
            percentual_fonomecanico: t.percentual_fonomecanico ?? t.percentual ?? 0,
            percentual_sincronizacao: t.percentual_sincronizacao ?? t.percentual ?? 0,
            ipi: t.ipi ?? null,
            status_controle: t.controlado ? 'controlado' : 'nao_controlado',
            // campos migration 012
            ...(t.codigo_interno_legado_titular
              ? { codigo_interno_legado_titular: t.codigo_interno_legado_titular } : {}),
            ...(t.writer_sequence_code
              ? { writer_sequence_code: t.writer_sequence_code } : {}),
            ...(t.publisher_sequence_code
              ? { publisher_sequence_code: t.publisher_sequence_code } : {}),
            ...(t.pwr_writer_code
              ? { pwr_writer_code: t.pwr_writer_code } : {}),
            // para relacionar com o link correto depois
            _obra_codigo: obra.codigo,
            _link_ordem: link.ordem,
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

        // Mapear obra_id+numero_link → link uuid
        const linkUuidMap = new Map<string, string>()
        for (const l of insertedLinks as any[]) {
          linkUuidMap.set(`${l.obra_id}:${l.numero_link}`, l.id)
        }

        // Resolver obra_link_id nas titulares dos links
        const finalLinkTitulares = linkTitularesToInsert
          .map(lt => {
            const obraUuid2 = obraIdMap.get(lt._obra_codigo)
            const linkUuid = obraUuid2
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

  } catch (err) {
    result.errors.push(`Erro inesperado: ${String(err)}`)
  }

  return result
}

/** Remove todas as obras/links/titulares do tenant do usuário atual — operação nuclear */
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

    // Deletar em cascata: titulares dos links → links → obras → titulares
    await sb.from('obras_links_titulares').delete().eq('tenant_id', tenantId)
    await sb.from('obras_links').delete().eq('tenant_id', tenantId)
    await sb.from('obras').delete().eq('tenant_id', tenantId)
    await sb.from('titulares').delete().eq('tenant_id', tenantId)

    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
