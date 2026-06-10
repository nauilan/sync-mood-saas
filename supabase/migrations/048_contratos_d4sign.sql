-- ============================================================
-- Migration 048 — Integração D4Sign em contratos
-- ============================================================

-- Coluna para armazenar o UUID do documento no D4Sign
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS d4sign_uuid TEXT,
  ADD COLUMN IF NOT EXISTS d4sign_status TEXT;
-- d4sign_status: null | 'processando' | 'aguardando_signatarios' | 'aguardando_assinaturas'
--                     | 'finalizado' | 'arquivado' | 'cancelado'

CREATE INDEX IF NOT EXISTS idx_contratos_d4sign_uuid
  ON contratos (d4sign_uuid)
  WHERE d4sign_uuid IS NOT NULL;

-- ============================================================
-- Validação
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'contratos'
--   AND column_name IN ('d4sign_uuid', 'd4sign_status');
-- Esperado: 2 rows
-- ============================================================
