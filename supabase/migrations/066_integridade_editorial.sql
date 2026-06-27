-- Migration 066: Motor de integridade editorial
-- Adiciona status_integridade à tabela obras (apta | contrato_pendente | link_incompleto |
--   percentual_pendente | recebedor_pendente | revisao | bloqueada)

-- 1. Enum de status de integridade editorial
DO $$ BEGIN
  CREATE TYPE status_integridade_obra AS ENUM (
    'apta',
    'contrato_pendente',
    'link_incompleto',
    'percentual_pendente',
    'recebedor_pendente',
    'revisao',
    'bloqueada'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Colunas na tabela obras
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS status_integridade        status_integridade_obra DEFAULT 'contrato_pendente',
  ADD COLUMN IF NOT EXISTS integridade_calculada_em  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS integridade_pendencias    JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS obras_status_integridade_idx
  ON obras(tenant_id, status_integridade)
  WHERE deleted_at IS NULL;

-- 3. Backfill inicial provisório (será recalculado pela API GET /integridade)
-- Obras bloqueadas
UPDATE obras
SET status_integridade = 'bloqueada'
WHERE exportacao_bloqueada = TRUE
  AND deleted_at IS NULL;

-- Obras com recontratação pendente
UPDATE obras
SET status_integridade = 'contrato_pendente'
WHERE status_contrato = 'recontratacao_pendente'
  AND exportacao_bloqueada IS NOT TRUE
  AND deleted_at IS NULL;

-- Obras com contrato válido + catálogo ativo → candidatas a apta
-- (recalculadas pela API para verificar links + percentuais + recebedores)
UPDATE obras
SET status_integridade = 'apta'
WHERE status_contrato IN ('valido', 'contrato_sistema', 'contrato_manual')
  AND status_catalogo  = 'catalogo_ativo'
  AND exportacao_bloqueada IS NOT TRUE
  AND status_integridade NOT IN ('bloqueada', 'contrato_pendente')
  AND deleted_at IS NULL;
