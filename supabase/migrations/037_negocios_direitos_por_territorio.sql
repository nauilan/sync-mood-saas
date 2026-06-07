-- Migration 037 — Direitos Administrados por Território nos Negócios Editoriais
-- Adiciona direitos_brasil, direitos_exterior, percentuais_brasil, percentuais_exterior
--
-- REGRA ARQUITETURAL:
--   "Direitos Internacionais" não é um tipo de direito — é um território.
--   A separação Brasil/Exterior permite contratos com coberturas diferentes por território.
--
-- NOTA (fix aplicado em 07/06/2026):
--   O INSERT original de tipos_direito foi removido desta migration.
--   Os 11 tipos legados já existem no banco (inseridos pela migration 016).
--   As colunas entra_distribuicao / tipo_cwr não existem na tabela real.
--   Seed definitivo dos 8 tipos jurídicos realizado pela migration 039.

-- ─── 1. Novos campos em negocios_editoriais ───────────────────────────────────
ALTER TABLE negocios_editoriais
  ADD COLUMN IF NOT EXISTS direitos_brasil      JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS direitos_exterior    JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS percentuais_brasil   JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS percentuais_exterior JSONB DEFAULT NULL;

COMMENT ON COLUMN negocios_editoriais.direitos_brasil IS
  'Códigos dos direitos jurídicos administrados no Brasil. Ex: ["comunicacao_publico","distribuicao_meios"]';
COMMENT ON COLUMN negocios_editoriais.direitos_exterior IS
  'Códigos dos direitos jurídicos administrados no Exterior. Ex: ["distribuicao_meios","inclusao_audiovisual"]';
COMMENT ON COLUMN negocios_editoriais.percentuais_brasil IS
  'Percentuais por direito para Brasil. Ex: {"comunicacao_publico":{"administrada":60,"administradora":40}}';
COMMENT ON COLUMN negocios_editoriais.percentuais_exterior IS
  'Percentuais por direito para Exterior. Substitui percentual padrão por tipo de direito.';

-- ─── 2. Índices GIN ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_neg_direitos_brasil
  ON negocios_editoriais USING GIN (direitos_brasil);

CREATE INDEX IF NOT EXISTS idx_neg_direitos_exterior
  ON negocios_editoriais USING GIN (direitos_exterior);

-- ─── 3. Desativar 'internacional' se existir (não é direito, é território) ───
UPDATE tipos_direito
SET ativo = FALSE
WHERE tenant_id IS NULL AND codigo = 'internacional';
