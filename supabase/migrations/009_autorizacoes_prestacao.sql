-- ============================================================
-- 009_autorizacoes_prestacao.sql
-- ============================================================

-- ── AUTORIZACOES ─────────────────────────────────────────────
CREATE TABLE autorizacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  editora_id      UUID REFERENCES editoras(id) ON DELETE SET NULL,
  obra_id         UUID NOT NULL REFERENCES obras(id) ON DELETE RESTRICT,
  tipo_uso        TEXT NOT NULL,                                   -- sync | audiovisual | publicidade | tv | ao_vivo
  licenciante     TEXT NOT NULL,
  licenciado      TEXT NOT NULL,
  data_inicio     DATE NOT NULL,
  data_fim        DATE,
  prazo_indeter   BOOLEAN DEFAULT FALSE,
  valor           NUMERIC(18,6) DEFAULT 0,
  moeda           TEXT DEFAULT 'BRL',
  territorio      TEXT DEFAULT 'BR',
  descricao       TEXT,
  arquivo_url     TEXT,
  status          TEXT NOT NULL DEFAULT 'vigente',                 -- vigente | encerrada | suspensa | pendente
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PRESTACAO_CONTAS ─────────────────────────────────────────
CREATE TABLE prestacao_contas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titular_id        UUID NOT NULL REFERENCES titulares(id) ON DELETE RESTRICT,
  periodo_id        UUID NOT NULL REFERENCES periodos_distribuicao(id) ON DELETE RESTRICT,
  distribuicao_id   UUID REFERENCES distribuicoes(id) ON DELETE SET NULL,
  numero            TEXT NOT NULL,
  valor_bruto       NUMERIC(18,6) DEFAULT 0,
  valor_liquido     NUMERIC(18,6) DEFAULT 0,
  retencoes         JSONB DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'gerada',                -- gerada | enviada | aceita | contestada | paga
  url_pdf           TEXT,
  enviado_em        TIMESTAMPTZ,
  aceito_em         TIMESTAMPTZ,
  pago_em           TIMESTAMPTZ,
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, numero)
);

-- ── CONTESTACOES ─────────────────────────────────────────────
CREATE TABLE prestacao_contestacoes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  prestacao_contas_id UUID NOT NULL REFERENCES prestacao_contas(id) ON DELETE CASCADE,
  titular_id          UUID NOT NULL REFERENCES titulares(id) ON DELETE RESTRICT,
  motivo              TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'aberta',
  resposta            TEXT,
  resolvido_em        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_autorizacoes_updated_at      BEFORE UPDATE ON autorizacoes           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_prestacao_updated_at         BEFORE UPDATE ON prestacao_contas       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contestacoes_updated_at      BEFORE UPDATE ON prestacao_contestacoes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_autorizacoes_tenant    ON autorizacoes(tenant_id);
CREATE INDEX idx_autorizacoes_obra      ON autorizacoes(obra_id);
CREATE INDEX idx_prestacao_tenant       ON prestacao_contas(tenant_id);
CREATE INDEX idx_prestacao_titular      ON prestacao_contas(titular_id);
CREATE INDEX idx_prestacao_periodo      ON prestacao_contas(periodo_id);
