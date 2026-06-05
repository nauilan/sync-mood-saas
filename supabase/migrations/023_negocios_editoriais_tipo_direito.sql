-- ============================================================
-- 023_negocios_editoriais_tipo_direito.sql
--
-- 1. Adiciona coluna tipo_direito_id à tabela negocios_editoriais
--    (a bridge filtra negócios por este campo — linha 236 bridge-analitico.ts)
-- 2. Adiciona 'grupo_obras' ao CHECK de abrangencia_tipo
--    (a bridge aceita grupo_obras na prioridade de resolução)
-- ============================================================

-- 1. Adicionar tipo_direito_id (nullable — null = aplica a todos os tipos)
ALTER TABLE negocios_editoriais
  ADD COLUMN IF NOT EXISTS tipo_direito_id UUID REFERENCES tipos_direito(id) ON DELETE SET NULL;

-- Índice para performance na bridge (filtra por tipo_direito_id + editora_administrada_id)
CREATE INDEX IF NOT EXISTS idx_negocios_tipo_direito
  ON negocios_editoriais(tipo_direito_id)
  WHERE tipo_direito_id IS NOT NULL;

-- 2. Ampliar CHECK de abrangencia_tipo para incluir 'grupo_obras'
ALTER TABLE negocios_editoriais
  DROP CONSTRAINT IF EXISTS negocios_editoriais_abrangencia_tipo_check;

ALTER TABLE negocios_editoriais
  ADD CONSTRAINT negocios_editoriais_abrangencia_tipo_check
  CHECK (abrangencia_tipo IN (
    'catalogo_inteiro',
    'obras_especificas',
    'grupo_obras',
    'autor_especifico',
    'grupo_autores'
  ));
