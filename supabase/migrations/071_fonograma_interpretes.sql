-- Migration 071: fonograma_interpretes
-- Intérpretes ligados ao fonograma (gravação), não à obra.
-- Um fonograma pode ter N intérpretes (colab/feat).
-- Intérprete pode existir antes do ISRC (isrc é nullable em fonogramas).
-- nome_normalizado indexado para futuro matching de execuções (ONI).

BEGIN;

CREATE TABLE IF NOT EXISTS fonograma_interpretes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fonograma_id     UUID        NOT NULL REFERENCES fonogramas(id) ON DELETE CASCADE,
  nome             TEXT        NOT NULL,
  nome_normalizado TEXT,
  ordem            SMALLINT    NOT NULL DEFAULT 0,
  papel            TEXT        NOT NULL DEFAULT 'principal',
  origem           TEXT        NOT NULL DEFAULT 'manual',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Busca por fonograma (join principal)
CREATE INDEX IF NOT EXISTS idx_fonograma_interpretes_fg
  ON fonograma_interpretes(fonograma_id);

-- Matching futuro de execuções / ONI
CREATE INDEX IF NOT EXISTS idx_fonograma_interpretes_nome_norm
  ON fonograma_interpretes(nome_normalizado)
  WHERE nome_normalizado IS NOT NULL;

-- Idempotência: reintegrar não duplica (mesmo fonograma + mesmo nome normalizado = 1 registro)
CREATE UNIQUE INDEX IF NOT EXISTS uq_fonograma_interpretes_fg_nome
  ON fonograma_interpretes(fonograma_id, nome_normalizado)
  WHERE nome_normalizado IS NOT NULL;

COMMIT;
