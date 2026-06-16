-- ============================================================
-- Migration 058 — obras_interpretes + campos editoriais em obras
-- Objetivo: transformar obra em centro editorial completo
-- ============================================================
BEGIN;

-- ── 1. Campos adicionais em obras ───────────────────────────────────────────

ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS iswc_anterior         TEXT,
  ADD COLUMN IF NOT EXISTS iswc_alternativo      TEXT,
  ADD COLUMN IF NOT EXISTS iswc_origem           TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS territorio            TEXT,
  ADD COLUMN IF NOT EXISTS prazo_inicio          DATE,
  ADD COLUMN IF NOT EXISTS prazo_fim             DATE,
  ADD COLUMN IF NOT EXISTS prazo_indeterminado   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS direitos_administrados JSONB;

-- ── 2. Tabela obras_interpretes ──────────────────────────────────────────────
-- Representa os intérpretes/artistas vinculados à obra.
-- Um intérprete pode ou não ter um titular cadastrado.

CREATE TABLE IF NOT EXISTS obras_interpretes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL,
  obra_id        UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  titular_id     UUID REFERENCES titulares(id) ON DELETE SET NULL,
  nome_artistico TEXT NOT NULL,
  nome_civil     TEXT,
  tipo           TEXT NOT NULL DEFAULT 'principal',
  -- tipos: principal | feat | participacao | grupo | banda | convidado
  origem         TEXT DEFAULT 'manual',
  -- origens: manual | cwr | autorizacao | importacao
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obras_interpretes_obra
  ON obras_interpretes(obra_id);

CREATE INDEX IF NOT EXISTS idx_obras_interpretes_titular
  ON obras_interpretes(titular_id)
  WHERE titular_id IS NOT NULL;

-- ── 3. Campos adicionais em fonogramas ──────────────────────────────────────
-- Permite rastrear titular do intérprete e origem do cadastro do fonograma.

ALTER TABLE fonogramas
  ADD COLUMN IF NOT EXISTS titular_id  UUID REFERENCES titulares(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origem      TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS contrato_id UUID REFERENCES contratos(id) ON DELETE SET NULL;

COMMIT;

-- ── 4. Ampliar enum status_iswc ──────────────────────────────────────────────
-- IMPORTANTE: ALTER TYPE ADD VALUE *não pode* rodar dentro de BEGIN/COMMIT.
-- Executar essas linhas separadamente no Supabase, após o COMMIT acima:

ALTER TYPE status_iswc ADD VALUE IF NOT EXISTS 'aguardando_registro';
ALTER TYPE status_iswc ADD VALUE IF NOT EXISTS 'conflito_iswc';
