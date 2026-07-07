-- ─────────────────────────────────────────────────────────────────────────────
-- 074_etapa3a_origem_criado_por_iswc_dedup.sql
--
-- Etapa 3A — origem + criado_por em obras_links_titulares e
-- titular_direito_controle; índice único parcial em obras(iswc).
--
-- RODAR MANUALMENTE no SQL Editor do Supabase (pipeline CI só faz build JS).
--
-- ANTES DE EXECUTAR: confirme que não há ISWCs duplicados por tenant:
--   SELECT tenant_id, iswc, COUNT(*)
--   FROM obras
--   WHERE iswc IS NOT NULL
--   GROUP BY tenant_id, iswc
--   HAVING COUNT(*) > 1;
-- Se retornar linhas → reportar antes de rodar este script.
-- Se retornar 0 linhas → pode rodar o script completo.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. obras_links_titulares: adicionar origem + criado_por
ALTER TABLE obras_links_titulares
  ADD COLUMN IF NOT EXISTS origem     TEXT DEFAULT 'cwr'
    CONSTRAINT chk_olt_origem CHECK (origem IN ('cwr', 'contrato', 'manual')),
  ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL;

-- 2. Backfill: registros com contrato_id preenchido vieram do fluxo de contrato
--    (CWR não grava contrato_id → fica com DEFAULT 'cwr' correto)
--    (manuais antigos sem contrato_id ficam 'cwr' — limitação histórica aceita)
UPDATE obras_links_titulares
SET origem = 'contrato'
WHERE contrato_id IS NOT NULL;

-- 3. titular_direito_controle: adicionar criado_por
ALTER TABLE titular_direito_controle
  ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL;

-- 4. Índice único parcial em obras(tenant_id, iswc) — apenas onde iswc preenchido
--    Não colide com NULL (NULL != NULL no Postgres por design)
CREATE UNIQUE INDEX IF NOT EXISTS uq_obras_tenant_iswc
  ON obras (tenant_id, iswc)
  WHERE iswc IS NOT NULL;

-- ─── Verificação pós-execução ────────────────────────────────────────────────
-- SELECT COUNT(*) FROM obras_links_titulares WHERE origem IS NULL;     -- deve ser 0
-- SELECT COUNT(*) FROM obras_links_titulares WHERE origem = 'contrato'; -- > 0 se há contratos
-- SELECT COUNT(*) FROM titular_direito_controle WHERE criado_por IS NOT NULL; -- 0 (ok, é novo)
-- SELECT indexname FROM pg_indexes WHERE indexname = 'uq_obras_tenant_iswc'; -- deve aparecer
