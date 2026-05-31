-- ============================================================
-- 003_editoras.sql — Editoras Administradas
-- ============================================================

CREATE TABLE editoras (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  razao_social                TEXT NOT NULL,
  nome_fantasia               TEXT NOT NULL,
  cnpj                        TEXT,
  endereco                    TEXT,
  bairro                      TEXT,
  cep                         TEXT,
  cidade                      TEXT,
  estado                      CHAR(2),
  pais                        TEXT NOT NULL DEFAULT 'BR',
  telefone                    TEXT,
  email                       TEXT,
  site                        TEXT,
  codigo_cae                  TEXT,
  codigo_ipi                  TEXT,
  ipi_socinpro                TEXT,
  sociedade_autoral_vinculada TEXT,
  logo_url                    TEXT,
  dados_bancarios             JSONB DEFAULT '{}',
  status                      status_geral NOT NULL DEFAULT 'ativo',
  deleted_at                  TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK reversa: tenants.editora_master_id → editoras
ALTER TABLE tenants ADD CONSTRAINT fk_tenants_editora_master
  FOREIGN KEY (editora_master_id) REFERENCES editoras(id) ON DELETE SET NULL;

-- FK: usuarios.editora_id → editoras
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_editora
  FOREIGN KEY (editora_id) REFERENCES editoras(id) ON DELETE SET NULL;

CREATE TRIGGER trg_editoras_updated_at BEFORE UPDATE ON editoras FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_editoras_tenant ON editoras(tenant_id);
CREATE INDEX idx_editoras_cnpj   ON editoras(cnpj);
