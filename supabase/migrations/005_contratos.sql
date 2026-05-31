-- ============================================================
-- 005_contratos.sql — Contratos e Modelos Jurídicos
-- ============================================================

-- ── MODELOS JURÍDICOS ────────────────────────────────────────
CREATE TABLE modelos_juridicos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  tipo            tipo_contrato NOT NULL,
  template_html   TEXT,
  campos_variaveis JSONB DEFAULT '[]',                             -- campos dinâmicos do template
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONTRATOS ────────────────────────────────────────────────
CREATE TABLE contratos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  editora_id            UUID REFERENCES editoras(id) ON DELETE SET NULL,
  numero                TEXT NOT NULL,
  tipo                  tipo_contrato NOT NULL,
  titular_id            UUID NOT NULL REFERENCES titulares(id) ON DELETE RESTRICT,
  modelo_juridico_id    UUID REFERENCES modelos_juridicos(id) ON DELETE SET NULL,
  data_inicio           DATE NOT NULL,
  data_fim              DATE,
  prazo_indeterminado   BOOLEAN NOT NULL DEFAULT FALSE,

  -- Splits padrão (podem ser substituídos por splits por direito)
  percentual_editora    NUMERIC(7,4),                              -- ex: 25.0000
  percentual_autor      NUMERIC(7,4),                              -- ex: 75.0000

  -- Splits detalhados por tipo de direito (15 campos BR + EXT)
  splits_direitos       JSONB DEFAULT '{}',

  territorio            TEXT DEFAULT 'BR',
  direitos              direito_tipo[] DEFAULT ARRAY['execucao_publica','reproducao','sincronizacao','digital']::direito_tipo[],
  exclusividade         BOOLEAN NOT NULL DEFAULT FALSE,

  arquivo_pdf_url       TEXT,
  arquivo_assinado_url  TEXT,
  status                status_contrato NOT NULL DEFAULT 'em_analise',
  observacoes           TEXT,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, numero)
);

-- ── CONTRATO_OBRAS (obras vinculadas ao contrato) ───────────
CREATE TABLE contrato_obras (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  obra_id     UUID NOT NULL,                                       -- FK obras (adicionado depois)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contrato_id, obra_id)
);

-- ── ADITIVOS ─────────────────────────────────────────────────
CREATE TABLE contrato_aditivos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contrato_id     UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  numero_aditivo  TEXT NOT NULL,
  descricao       TEXT,
  data_assinatura DATE,
  arquivo_url     TEXT,
  campos_alterados JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TRIGGERS ─────────────────────────────────────────────────
CREATE TRIGGER trg_modelos_juridicos_updated_at BEFORE UPDATE ON modelos_juridicos  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contratos_updated_at         BEFORE UPDATE ON contratos          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contrato_aditivos_updated_at BEFORE UPDATE ON contrato_aditivos  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX idx_contratos_tenant   ON contratos(tenant_id);
CREATE INDEX idx_contratos_titular  ON contratos(titular_id);
CREATE INDEX idx_contratos_editora  ON contratos(editora_id);
CREATE INDEX idx_contratos_status   ON contratos(status);
CREATE INDEX idx_contrato_obras_contrato ON contrato_obras(contrato_id);
