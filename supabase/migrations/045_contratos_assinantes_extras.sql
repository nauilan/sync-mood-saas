-- ============================================================
-- Migration 045 — Colunas extras em contratos
-- Adiciona assinantes_d4sign JSONB, provedor_assinatura TEXT,
-- obras_json JSONB (snapshot das obras no momento da criação)
-- ============================================================

-- 1. assinantes_d4sign — array JSON com os 4 assinantes do contrato
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS assinantes_d4sign JSONB;

-- 2. provedor_assinatura — d4sign | docusign | icp_brasil | manual
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS provedor_assinatura TEXT;

-- 3. obras_json — snapshot das obras informadas no wizard
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS obras_json JSONB;

-- 4. Índice para busca por provedor (opcional / informativo)
CREATE INDEX IF NOT EXISTS idx_contratos_provedor
  ON contratos (tenant_id, provedor_assinatura)
  WHERE provedor_assinatura IS NOT NULL;

-- ============================================================
-- Validação rápida
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contratos'
  AND column_name IN ('assinantes_d4sign', 'provedor_assinatura', 'obras_json')
ORDER BY column_name;
-- Esperado: 3 linhas
