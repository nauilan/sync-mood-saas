-- Migration 021: campos operacionais em editoras
-- Contexto: migrations 012/014 nao foram aplicadas no banco de producao.
-- Este arquivo garante que os campos de classificacao editorial fiquem versionados.
-- Safe to re-run: usa ADD COLUMN IF NOT EXISTS e UPDATE idempotente.

ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS tipo_editora         TEXT NOT NULL DEFAULT 'administrada'
    CHECK (tipo_editora IN ('master','administrada','externa')),
  ADD COLUMN IF NOT EXISTS controlada           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS codigo_publisher_cwr TEXT;

COMMENT ON COLUMN editoras.tipo_editora         IS 'master = administradora do grupo | administrada = editora do catalogo | externa = editora de terceiros';
COMMENT ON COLUMN editoras.controlada           IS 'TRUE se a editora e controlada/gerida pelo tenant (grupo editorial proprio).';
COMMENT ON COLUMN editoras.codigo_publisher_cwr IS 'Publisher code nos registros SPU do CWR (ex: ED01, 2646326).';

CREATE INDEX IF NOT EXISTS idx_editoras_tipo       ON editoras(tipo_editora);
CREATE INDEX IF NOT EXISTS idx_editoras_controlada ON editoras(controlada);
