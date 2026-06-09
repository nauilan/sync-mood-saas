-- Migration 045: Fonogramas — campos complementares
-- Adiciona colunas ausentes na tabela fonogramas (criada em 006_obras.sql)
-- Não recria a tabela; usa ADD COLUMN IF NOT EXISTS para segurança.

ALTER TABLE fonogramas
  ADD COLUMN IF NOT EXISTS produtor_fonografico TEXT,
  ADD COLUMN IF NOT EXISTS data_lancamento      DATE,
  ADD COLUMN IF NOT EXISTS pais                 TEXT,
  ADD COLUMN IF NOT EXISTS status               TEXT NOT NULL DEFAULT 'ativo'
    CONSTRAINT fonogramas_status_check CHECK (status IN ('ativo','inativo','pendente')),
  ADD COLUMN IF NOT EXISTS deleted_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by           UUID;

-- Índice para soft delete
CREATE INDEX IF NOT EXISTS idx_fonogramas_deleted_at ON fonogramas (deleted_at)
  WHERE deleted_at IS NULL;

-- Índice para busca por obra com filtro de status
CREATE INDEX IF NOT EXISTS idx_fonogramas_obra_status ON fonogramas (obra_id, status)
  WHERE deleted_at IS NULL;

-- Índice para busca por ISRC
CREATE INDEX IF NOT EXISTS idx_fonogramas_isrc ON fonogramas (isrc)
  WHERE isrc IS NOT NULL AND deleted_at IS NULL;
