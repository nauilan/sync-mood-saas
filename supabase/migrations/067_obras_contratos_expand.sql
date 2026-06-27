-- ════════════════════════════════════════════════════════════
-- 067 — Expandir obras_contratos para suporte a contratos manuais
--
-- A migration 060 usava CREATE TABLE IF NOT EXISTS, que era no-op
-- porque a tabela já existia desde 00102 com schema simples.
-- Esta migration adiciona as colunas faltantes com ALTER TABLE.
-- ════════════════════════════════════════════════════════════

-- Adicionar colunas expandidas (sem efeito se já existirem)
ALTER TABLE obras_contratos ADD COLUMN IF NOT EXISTS id              UUID        DEFAULT gen_random_uuid();
ALTER TABLE obras_contratos ADD COLUMN IF NOT EXISTS tenant_id       UUID        REFERENCES tenants(id);
ALTER TABLE obras_contratos ADD COLUMN IF NOT EXISTS tipo            TEXT        CHECK (tipo IN ('sistema','manual'));
ALTER TABLE obras_contratos ADD COLUMN IF NOT EXISTS arquivo_url     TEXT;
ALTER TABLE obras_contratos ADD COLUMN IF NOT EXISTS arquivo_nome    TEXT;
ALTER TABLE obras_contratos ADD COLUMN IF NOT EXISTS vigente         BOOLEAN     DEFAULT TRUE;
ALTER TABLE obras_contratos ADD COLUMN IF NOT EXISTS substituido_por UUID        REFERENCES obras_contratos(id);
ALTER TABLE obras_contratos ADD COLUMN IF NOT EXISTS criado_em       TIMESTAMPTZ DEFAULT NOW();

-- Índices
CREATE INDEX IF NOT EXISTS obras_contratos_tenant_id_idx ON obras_contratos(tenant_id);
CREATE INDEX IF NOT EXISTS obras_contratos_obra_id_idx   ON obras_contratos(obra_id);
CREATE INDEX IF NOT EXISTS obras_contratos_vigente_idx   ON obras_contratos(vigente) WHERE vigente = TRUE;

-- RLS
ALTER TABLE obras_contratos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "obras_contratos_tenant_isolamento" ON obras_contratos
    USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
