-- Migration 057: colunas de auditoria do fluxo de aprovação de contratos
-- Necessário para a rota /api/contratos/[id]/aprovar funcionar corretamente.

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS validado_em               TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validado_por              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS validado_administrada_em  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validado_administrada_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aprovado_admin_em         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aprovado_admin_por        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejeitado_admin_em        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejeitado_admin_por       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao           TEXT,
  ADD COLUMN IF NOT EXISTS em_vigor_em               TIMESTAMPTZ;

-- Índices de busca por responsável
CREATE INDEX IF NOT EXISTS idx_contratos_validado_por       ON contratos (validado_por);
CREATE INDEX IF NOT EXISTS idx_contratos_aprovado_admin_por ON contratos (aprovado_admin_por);
