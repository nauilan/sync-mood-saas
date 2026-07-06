-- Migration 072: obras_interpretes — adicionar nome_normalizado + fonograma_id
-- Intérprete liga à OBRA (não ao fonograma). fonograma_id é opcional (null = sem gravação lançada).
-- DROP fonograma_interpretes (migration 071 — tabela vazia, modelagem descartada).

BEGIN;

-- Adicionar colunas necessárias para matching e vínculo opcional de gravação
ALTER TABLE obras_interpretes
  ADD COLUMN IF NOT EXISTS nome_normalizado TEXT,
  ADD COLUMN IF NOT EXISTS fonograma_id     UUID REFERENCES fonogramas(id) ON DELETE SET NULL;

-- Índice para matching de execuções (ONI)
CREATE INDEX IF NOT EXISTS idx_obras_interpretes_nome_norm
  ON obras_interpretes(nome_normalizado)
  WHERE nome_normalizado IS NOT NULL;

-- Idempotência: reintegrar não duplica por obra+nome
CREATE UNIQUE INDEX IF NOT EXISTS uq_obras_interpretes_obra_nome
  ON obras_interpretes(obra_id, nome_normalizado)
  WHERE nome_normalizado IS NOT NULL;

-- DROP da fonograma_interpretes (071) — nunca usada, modelagem trocada por obras_interpretes
DROP TABLE IF EXISTS fonograma_interpretes;

COMMIT;
