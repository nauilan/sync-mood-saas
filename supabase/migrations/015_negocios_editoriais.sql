-- ============================================================
-- 015_negocios_editoriais.sql
-- Contratos entre Editora Administrada e Editora Administradora
-- ============================================================

CREATE TABLE negocios_editoriais (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identificação
  nome                        TEXT NOT NULL,
  codigo_interno              TEXT,
  status                      TEXT NOT NULL DEFAULT 'ativo'
                                CHECK (status IN ('ativo','inativo','encerrado')),

  -- Partes
  editora_administrada_id     UUID REFERENCES editoras(id) ON DELETE SET NULL,
  editora_administrada_nome   TEXT,   -- cache de nome para exibição
  editora_administradora_id   UUID REFERENCES editoras(id) ON DELETE SET NULL,
  editora_administradora_nome TEXT,   -- cache de nome para exibição

  -- Percentuais (devem somar 100)
  percentual_administrada     NUMERIC(6,4) NOT NULL
                                CHECK (percentual_administrada >= 0 AND percentual_administrada <= 100),
  percentual_administradora   NUMERIC(6,4) NOT NULL
                                CHECK (percentual_administradora >= 0 AND percentual_administradora <= 100),
  -- constraint de soma = 100
  CONSTRAINT chk_percentuais_somam_100
    CHECK (round(percentual_administrada + percentual_administradora, 4) = 100),

  -- Receitas aplicáveis (array JSON: digital, sync, mecanico, internacional, licenciamento, etc.)
  receitas_aplicaveis         JSONB NOT NULL DEFAULT '["digital","sync","mecanico","internacional","licenciamento"]',

  -- Abrangência
  abrangencia_tipo            TEXT NOT NULL DEFAULT 'catalogo_inteiro'
                                CHECK (abrangencia_tipo IN ('catalogo_inteiro','obras_especificas','autor_especifico','grupo_autores')),
  abrangencia_ids             JSONB DEFAULT '[]',  -- IDs de obras/autores quando não for catálogo inteiro

  -- Território
  territorios                 JSONB NOT NULL DEFAULT '["mundial"]',

  -- Vigência
  data_inicio                 DATE NOT NULL,
  data_fim                    DATE,   -- NULL = indeterminado

  -- Documento
  contrato_url                TEXT,
  contrato_nome_arquivo       TEXT,

  -- Observações
  observacoes                 TEXT,

  -- Auditoria
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_negocios_editoriais_updated_at
  BEFORE UPDATE ON negocios_editoriais
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_negocios_tenant          ON negocios_editoriais(tenant_id);
CREATE INDEX idx_negocios_administrada    ON negocios_editoriais(editora_administrada_id);
CREATE INDEX idx_negocios_administradora  ON negocios_editoriais(editora_administradora_id);
CREATE INDEX idx_negocios_status          ON negocios_editoriais(status);
CREATE INDEX idx_negocios_vigencia        ON negocios_editoriais(data_inicio, data_fim);

-- RLS
ALTER TABLE negocios_editoriais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_negocios" ON negocios_editoriais
  USING (tenant_id = (
    SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1
  ));
