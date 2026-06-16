-- Migration 057b: remover FK constraints das colunas de auditoria de contratos
-- auth.users não pode ser referenciado com FK de tabelas public no Supabase.
-- Manter como UUID simples — o dado é auditoria, não integridade referencial crítica.

ALTER TABLE contratos
  DROP CONSTRAINT IF EXISTS contratos_validado_por_fkey,
  DROP CONSTRAINT IF EXISTS contratos_validado_administrada_por_fkey,
  DROP CONSTRAINT IF EXISTS contratos_aprovado_admin_por_fkey,
  DROP CONSTRAINT IF EXISTS contratos_rejeitado_admin_por_fkey;
