-- Migration 060: Integridade contratual das obras
-- Adiciona status_contrato, requer_recontracao e tabela obras_contratos

-- Enum de status contratual da obra
DO $$ BEGIN
  CREATE TYPE status_contrato_obra AS ENUM (
    'sem_contrato',
    'contrato_manual',
    'contrato_sistema',
    'recontratacao_pendente',
    'valido'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Colunas na tabela obras
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS status_contrato      status_contrato_obra DEFAULT 'sem_contrato',
  ADD COLUMN IF NOT EXISTS requer_recontracao   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS motivo_recontracao   TEXT,
  ADD COLUMN IF NOT EXISTS contrato_manual_url  TEXT,
  ADD COLUMN IF NOT EXISTS contrato_manual_nome TEXT,
  ADD COLUMN IF NOT EXISTS contrato_manual_em   TIMESTAMPTZ;

-- Tabela M:N: obra <-> contratos (sistema e manuais)
CREATE TABLE IF NOT EXISTS obras_contratos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id         UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL,
  contrato_id     UUID REFERENCES contratos(id) ON DELETE SET NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('sistema','manual')),
  arquivo_url     TEXT,
  arquivo_nome    TEXT,
  vigente         BOOLEAN DEFAULT TRUE,
  substituido_por UUID REFERENCES obras_contratos(id),
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS obras_contratos_obra_id_idx    ON obras_contratos(obra_id);
CREATE INDEX IF NOT EXISTS obras_contratos_tenant_id_idx  ON obras_contratos(tenant_id);
CREATE INDEX IF NOT EXISTS obras_contratos_vigente_idx    ON obras_contratos(vigente) WHERE vigente = TRUE;

-- RLS
ALTER TABLE obras_contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "obras_contratos_tenant_isolamento"
  ON obras_contratos
  USING (
    tenant_id = (
      SELECT tenant_id FROM usuarios WHERE id = auth.uid() LIMIT 1
    )
  );

-- Preencher status_contrato para obras que já têm contrato sistema ativo
UPDATE obras o
  SET status_contrato = 'contrato_sistema',
      requer_recontracao = FALSE
WHERE contrato_origem_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = o.contrato_origem_id
      AND c.status_contrato IN ('ativo','assinado','vigente','aprovado')
  )
  AND (o.status_contrato = 'sem_contrato' OR o.status_contrato IS NULL);

-- Vincular obras a contratos na tabela obras_contratos
INSERT INTO obras_contratos (obra_id, tenant_id, contrato_id, tipo, vigente)
SELECT o.id, o.tenant_id, o.contrato_origem_id, 'sistema', TRUE
FROM obras o
WHERE o.contrato_origem_id IS NOT NULL
  AND o.status_contrato = 'contrato_sistema'
  AND NOT EXISTS (
    SELECT 1 FROM obras_contratos oc
    WHERE oc.obra_id = o.id AND oc.contrato_id = o.contrato_origem_id
  );
