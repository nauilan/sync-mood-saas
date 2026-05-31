// ============================================================
// lib/save-editora-supabase.ts — CRUD de Editoras no Supabase
// ============================================================

import { createClient } from '@/lib/supabase/client'
import { setStore, getStore, STORE_KEYS } from '@/lib/store'
import type { EditoraAdministrada, TipoEditora } from '@/lib/types-cadastros'

// ── Payload para criação/atualização ─────────────────────────────────────────
export interface EditoraPayload {
  id?: string
  tenant_id?: string
  codigo?: string
  razao_social: string
  nome_fantasia: string
  cnpj?: string | null
  cae?: string | null
  ipi?: string | null
  codigo_publisher_cwr?: string | null
  codigo_interno_legado?: string | null
  backoffice_publisher_id?: string | null
  tipo_editora: TipoEditora
  controlada?: boolean
  ativo?: boolean
}

// ── Mapeamento Supabase row → EditoraAdministrada ────────────────────────────
function rowToEditora(row: any): EditoraAdministrada {
  return {
    id:                     row.id,
    codigo:                 row.codigo ?? '',
    razao_social:           row.razao_social ?? '',
    nome_fantasia:          row.nome_fantasia ?? row.razao_social ?? '',
    cnpj:                   row.cnpj ?? null,
    logo_url:               row.logo_url ?? null,
    ativa:                  row.ativo ?? row.ativa ?? true,
    administradora_id:      row.administradora_id ?? null,
    created_at:             row.created_at ?? new Date().toISOString(),
    controlada:             row.controlada ?? false,
    tipo_editora:           (row.tipo_editora as TipoEditora) ?? 'administrada',
    codigo_interno_legado:  row.codigo_interno_legado ?? null,
    codigo_publisher_cwr:   row.codigo_publisher_cwr ?? null,
    backoffice_publisher_id:row.backoffice_publisher_id ?? null,
  }
}

// ── Listar editoras ───────────────────────────────────────────────────────────
export async function listarEditoras(tenantId?: string): Promise<{ data: EditoraAdministrada[]; source: 'supabase' | 'store' }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && key && !url.includes('placeholder')) {
    try {
      const sb = createClient()
      let q = (sb.from('editoras') as any).select('*').order('nome_fantasia', { ascending: true })
      if (tenantId) q = q.eq('tenant_id', tenantId)
      const { data, error } = await q
      if (!error && data) {
        const editoras = (data as any[]).map(rowToEditora)
        setStore(STORE_KEYS.editoras, editoras)
        return { data: editoras, source: 'supabase' }
      }
    } catch { /* fallback */ }
  }

  const stored = getStore<EditoraAdministrada>(STORE_KEYS.editoras)
  return { data: stored, source: 'store' }
}

// ── Salvar editora (create ou update) ────────────────────────────────────────
export async function salvarEditora(payload: EditoraPayload): Promise<{ ok: boolean; data?: EditoraAdministrada; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isUpdate = !!payload.id

  if (url && key && !url.includes('placeholder')) {
    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()

      // Montar row para o banco
      const row: any = {
        razao_social:            payload.razao_social,
        nome_fantasia:           payload.nome_fantasia,
        cnpj:                    payload.cnpj ?? null,
        cae:                     payload.cae ?? null,
        ipi:                     payload.ipi ?? null,
        codigo_publisher_cwr:    payload.codigo_publisher_cwr ?? null,
        codigo_interno_legado:   payload.codigo_interno_legado ?? null,
        backoffice_publisher_id: payload.backoffice_publisher_id ?? null,
        tipo_editora:            payload.tipo_editora,
        controlada:              payload.controlada ?? false,
        ativo:                   payload.ativo ?? true,
        updated_at:              new Date().toISOString(),
      }

      if (!isUpdate) {
        // Novo cadastro
        if (user) {
          const { data: userRow } = await (sb.from('usuarios') as any).select('tenant_id').eq('id', user.id).single()
          row.tenant_id = userRow?.tenant_id ?? payload.tenant_id
        }
        // Gerar código se não informado
        row.codigo = payload.codigo ?? `ED${Date.now().toString(36).toUpperCase().slice(-6)}`
        row.created_at = new Date().toISOString()
      }

      const { data, error } = isUpdate
        ? await (sb.from('editoras') as any).update(row).eq('id', payload.id).select().single()
        : await (sb.from('editoras') as any).insert(row).select().single()

      if (error) return { ok: false, error: error.message }
      const saved = rowToEditora(data)
      _atualizarStoreEditora(saved, isUpdate)
      return { ok: true, data: saved }
    } catch (e: any) {
      return { ok: false, error: e?.message ?? 'Erro desconhecido' }
    }
  }

  // Fallback: apenas localStorage
  const local: EditoraAdministrada = {
    id:                     payload.id ?? `local-${Date.now()}`,
    codigo:                 payload.codigo ?? `ED${Date.now().toString(36).toUpperCase().slice(-6)}`,
    razao_social:           payload.razao_social,
    nome_fantasia:          payload.nome_fantasia,
    cnpj:                   payload.cnpj ?? null,
    logo_url:               null,
    ativa:                  payload.ativo ?? true,
    administradora_id:      null,
    created_at:             new Date().toISOString(),
    controlada:             payload.controlada ?? false,
    tipo_editora:           payload.tipo_editora,
    codigo_interno_legado:  payload.codigo_interno_legado ?? null,
    codigo_publisher_cwr:   payload.codigo_publisher_cwr ?? null,
    backoffice_publisher_id:payload.backoffice_publisher_id ?? null,
  }
  _atualizarStoreEditora(local, isUpdate)
  return { ok: true, data: local }
}

// ── Deletar editora ───────────────────────────────────────────────────────────
export async function deletarEditora(id: string): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && key && !url.includes('placeholder')) {
    try {
      const sb = createClient()
      const { error } = await (sb.from('editoras') as any).delete().eq('id', id)
      if (error) return { ok: false, error: error.message }
    } catch (e: any) {
      return { ok: false, error: e?.message ?? 'Erro' }
    }
  }

  // Remove do store local também
  const stored = getStore<EditoraAdministrada>(STORE_KEYS.editoras)
  setStore(STORE_KEYS.editoras, stored.filter(e => e.id !== id))
  return { ok: true }
}

// ── Atualizar store local ─────────────────────────────────────────────────────
function _atualizarStoreEditora(editora: EditoraAdministrada, isUpdate: boolean) {
  const stored = getStore<EditoraAdministrada>(STORE_KEYS.editoras)
  if (isUpdate) {
    setStore(STORE_KEYS.editoras, stored.map(e => e.id === editora.id ? editora : e))
  } else {
    setStore(STORE_KEYS.editoras, [editora, ...stored])
  }
}
