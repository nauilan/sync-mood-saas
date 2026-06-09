import { createClient } from '@supabase/supabase-js'

export interface LogAuditParams {
  tenant_id: string
  usuario_id?: string | null
  event_id?: string | null
  origem_execucao?: 'usuario' | 'sistema' | 'importacao' | 'job' | 'api'
  acao: string
  modulo: string
  tabela_afetada?: string | null
  registro_id?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados_anteriores?: Record<string, any> | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados_novos?: Record<string, any> | null
  ip?: string | null
  user_agent?: string | null
}

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Insere um registro em audit_logs. Nunca lança exceção — falhas são silenciosas. */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const sb = getAdminClient()
    if (!sb) return
    await sb.from('audit_logs').insert({
      tenant_id:        params.tenant_id,
      usuario_id:       params.usuario_id       ?? null,
      event_id:         params.event_id         ?? null,
      origem_execucao:  params.origem_execucao  ?? 'usuario',
      acao:             params.acao,
      modulo:           params.modulo,
      tabela_afetada:   params.tabela_afetada   ?? null,
      registro_id:      params.registro_id      ?? null,
      dados_anteriores: params.dados_anteriores ?? null,
      dados_novos:      params.dados_novos      ?? null,
      ip:               params.ip               ?? null,
      user_agent:       params.user_agent        ?? null,
    })
  } catch {
    // Audit failures must never break the main operation
  }
}
