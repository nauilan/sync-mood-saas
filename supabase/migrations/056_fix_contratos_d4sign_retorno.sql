-- ============================================================
-- Migration 056 — Fix: colunas faltantes em contratos para
-- fluxo D4Sign → Assinatura → Retorno/Webhook funcionar
--
-- Problema identificado em auditoria:
--   O webhook POST /api/d4sign/webhook tentava gravar
--   data_assinatura e d4sign_pdf_url em contratos, mas essas
--   colunas não existiam → UPDATE falhava silenciosamente →
--   contrato nunca transitava para status 'assinado'.
--
-- Colunas adicionadas:
--   data_assinatura  — data/hora em que todos os signatários concluíram
--   d4sign_pdf_url   — URL do PDF assinado retornada pela D4Sign
--
-- Índices garantidos com IF NOT EXISTS (seguros para reexecutar):
--   idx_contratos_d4sign_uuid — já existe na 048, mas reforçado
--   idx_contratos_status      — já existe na 005, mas reforçado
-- ============================================================

-- 1. Colunas faltantes
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS data_assinatura TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS d4sign_pdf_url  TEXT;

-- 2. Índices (IF NOT EXISTS = seguro mesmo se já existirem)
CREATE INDEX IF NOT EXISTS idx_contratos_d4sign_uuid
  ON contratos (d4sign_uuid)
  WHERE d4sign_uuid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contratos_status
  ON contratos (status);

-- ============================================================
-- Validação obrigatória após aplicar
-- Esperado: 4 linhas (data_assinatura, d4sign_pdf_url,
--           d4sign_uuid, status)
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contratos'
  AND column_name IN (
    'data_assinatura',
    'd4sign_pdf_url',
    'd4sign_uuid',
    'status'
  )
ORDER BY column_name;
