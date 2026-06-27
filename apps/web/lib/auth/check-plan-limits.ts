/**
 * checkPlanLimit — middleware de limites de licença por tenant.
 *
 * Chamado antes de INSERT em recursos controlados (obras, contratos, autorizações, CWR).
 * Retorna { ok: true } se o recurso está dentro do plano, ou { ok: false, motivo } se bloqueado.
 *
 * Uso:
 *   const limit = await checkPlanLimit(sb, usuario.tenant_id, 'obras')
 *   if (!limit.ok) return NextResponse.json({ error: limit.motivo }, { status: 402 })
 */

import { SupabaseClient } from '@supabase/supabase-js'

export type LimitKey = 'obras' | 'contratos' | 'autorizacoes' | 'cwr_importacoes'

export interface PlanLimitResult {
  ok:     boolean
  motivo?: string
}

export async function checkPlanLimit(
  sb:        SupabaseClient,
  tenant_id: string,
  recurso:   LimitKey
): Promise<PlanLimitResult> {
  const { data, error } = await sb
    .from('tenant_planos')
    .select(
      'status_licenca, licenca_fim, trial_fim, plano,' +
      'max_obras, max_contratos, max_autorizacoes_mes, max_cwr_importacoes,' +
      'uso_autorizacoes_mes, uso_chamadas_ia_mes'
    )
    .eq('tenant_id', tenant_id)
    .maybeSingle()

  // Sem plano cadastrado = acesso liberado (uso interno)
  if (error || !data) return { ok: true }

  const pl = data as unknown as Record<string, unknown>

  // Verificar status da licença
  if (pl.status_licenca !== 'ativa' && pl.status_licenca !== 'trial') {
    return {
      ok:     false,
      motivo: `Licença ${pl.status_licenca}. Contate o suporte para reativação.`,
    }
  }

  // Verificar vencimento
  const hoje = new Date()
  if (pl.licenca_fim && new Date(pl.licenca_fim as string) < hoje) {
    return { ok: false, motivo: 'Licença expirada. Renove para continuar.' }
  }
  if (pl.status_licenca === 'trial' && pl.trial_fim && new Date(pl.trial_fim as string) < hoje) {
    return { ok: false, motivo: 'Período de trial expirado.' }
  }

  // Verificar limites por recurso
  if (recurso === 'obras' && pl.max_obras != null) {
    const { count } = await sb
      .from('obras')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .is('deleted_at', null)
    if ((count ?? 0) >= (pl.max_obras as number)) {
      return {
        ok:     false,
        motivo: `Limite de obras atingido (${pl.max_obras}). Faça upgrade do plano.`,
      }
    }
  }

  if (recurso === 'contratos' && pl.max_contratos != null) {
    const { count } = await sb
      .from('obras_contratos')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
    if ((count ?? 0) >= (pl.max_contratos as number)) {
      return {
        ok:     false,
        motivo: `Limite de contratos atingido (${pl.max_contratos}). Faça upgrade do plano.`,
      }
    }
  }

  if (recurso === 'autorizacoes' && pl.max_autorizacoes_mes != null) {
    const uso = (pl.uso_autorizacoes_mes as number) ?? 0
    if (uso >= (pl.max_autorizacoes_mes as number)) {
      return {
        ok:     false,
        motivo: `Limite mensal de autorizações atingido (${pl.max_autorizacoes_mes}). Renova no próximo mês ou faça upgrade.`,
      }
    }
  }

  if (recurso === 'cwr_importacoes' && pl.max_cwr_importacoes != null) {
    const { count } = await sb
      .from('cwr_importacoes')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
    if ((count ?? 0) >= (pl.max_cwr_importacoes as number)) {
      return {
        ok:     false,
        motivo: `Limite de importações CWR atingido (${pl.max_cwr_importacoes}). Faça upgrade do plano.`,
      }
    }
  }

  return { ok: true }
}
