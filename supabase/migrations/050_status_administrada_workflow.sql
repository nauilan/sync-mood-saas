-- Migration 050: Workflow Editoras Administradas
-- Novos status de contrato, campos de aprovação em obras e contratos
-- Executar no Supabase SQL Editor

-- ── 1. Novos valores no enum status_contrato ────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'validado_administrada'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_contrato'))
  THEN ALTER TYPE status_contrato ADD VALUE 'validado_administrada'; END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_validacao_admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_contrato'))
  THEN ALTER TYPE status_contrato ADD VALUE 'aguardando_validacao_admin'; END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aprovado_admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_contrato'))
  THEN ALTER TYPE status_contrato ADD VALUE 'aprovado_admin'; END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rejeitado_admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_contrato'))
  THEN ALTER TYPE status_contrato ADD VALUE 'rejeitado_admin'; END IF;
END$$;

-- ── 2. Campos de aprovação em contratos ────────────────────────────────────
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS validado_administrada_em   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validado_administrada_por  UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS aprovado_admin_em          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aprovado_admin_por         UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS motivo_rejeicao_admin      TEXT,
  ADD COLUMN IF NOT EXISTS origem_editora_id          UUID REFERENCES editoras(id);

-- ── 3. Status de obra (TEXT com CHECK) ─────────────────────────────────────
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS status_catalogo TEXT DEFAULT 'pre_cadastro'
    CHECK (status_catalogo IN (
      'pre_cadastro', 'aguardando_contrato', 'aguardando_validacao_admin',
      'catalogo_ativo', 'pendente_ajuste', 'rejeitada', 'inativa'
    )),
  ADD COLUMN IF NOT EXISTS origem_editora_id    UUID REFERENCES editoras(id),
  ADD COLUMN IF NOT EXISTS aprovado_catalogo_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aprovado_catalogo_por UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS motivo_rejeicao      TEXT;

-- ── 4. Índices ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contratos_status_catalogo
  ON contratos (status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_obras_status_catalogo
  ON obras (status_catalogo, tenant_id);
CREATE INDEX IF NOT EXISTS idx_obras_origem_editora
  ON obras (origem_editora_id) WHERE origem_editora_id IS NOT NULL;

-- ── Validação ───────────────────────────────────────────────────────────────
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_contrato')
ORDER BY enumsortorder;
