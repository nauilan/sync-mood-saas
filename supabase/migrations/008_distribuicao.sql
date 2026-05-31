-- ============================================================
-- 008_distribuicao.sql — Períodos, Distribuições, CC Obra, CC Titular
-- ============================================================

-- ── PERIODOS_DISTRIBUICAO ────────────────────────────────────
CREATE TABLE periodos_distribuicao (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo            TEXT NOT NULL,                                 -- "2026-05" ou "1Q26"
  tipo              tipo_periodo_dist NOT NULL,
  label             TEXT NOT NULL,                                 -- "Maio/2026" ou "1º Trimestre 2026"
  ano               INTEGER NOT NULL,
  mes               INTEGER,                                       -- 1-12 (apenas mensal)
  trimestre         INTEGER CHECK (trimestre BETWEEN 1 AND 4),     -- 1-4 (apenas trimestral)
  data_inicio       DATE NOT NULL,
  data_fim          DATE NOT NULL,
  status            status_periodo_dist NOT NULL DEFAULT 'aberto',
  total_previsto    NUMERIC(18,6) DEFAULT 0,
  total_processado  NUMERIC(18,6) DEFAULT 0,
  fontes            TEXT[] DEFAULT '{}',
  criado_por        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  encerrado_por     UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  encerrado_em      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

-- FK recebimentos → periodos_distribuicao
ALTER TABLE recebimentos ADD CONSTRAINT fk_recebimentos_periodo
  FOREIGN KEY (periodo_dist_id) REFERENCES periodos_distribuicao(id) ON DELETE SET NULL;

-- ── DISTRIBUICOES ────────────────────────────────────────────
CREATE TABLE distribuicoes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo            TEXT NOT NULL,
  periodo_id        UUID NOT NULL REFERENCES periodos_distribuicao(id) ON DELETE RESTRICT,
  valor_total       NUMERIC(18,6) DEFAULT 0,
  total_titulares   INTEGER DEFAULT 0,
  status            status_distribuicao NOT NULL DEFAULT 'previa',
  calculado_em      TIMESTAMPTZ,
  aprovado_por      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  aprovado_em       TIMESTAMPTZ,
  executado_por     UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  executado_em      TIMESTAMPTZ,
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

-- ── DISTRIBUICAO_ITENS ───────────────────────────────────────
CREATE TABLE distribuicao_itens (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  distribuicao_id       UUID NOT NULL REFERENCES distribuicoes(id) ON DELETE CASCADE,
  obra_id               UUID REFERENCES obras(id) ON DELETE SET NULL,
  obra_link_id          UUID REFERENCES obras_links(id) ON DELETE SET NULL,
  titular_id            UUID REFERENCES titulares(id) ON DELETE SET NULL,
  editora_id            UUID REFERENCES editoras(id) ON DELETE SET NULL,
  nome_destino          TEXT NOT NULL,
  tipo_destino          TEXT NOT NULL,                             -- autor | editora | administradora | subeditora
  funcao                funcao_link,
  percentual_aplicado   NUMERIC(7,4) NOT NULL,
  valor_bruto           NUMERIC(18,6) NOT NULL,
  valor_liquido         NUMERIC(18,6) NOT NULL,
  retencao_irpf         NUMERIC(18,6) DEFAULT 0,
  retencao_iss          NUMERIC(18,6) DEFAULT 0,
  taxa_administrativa   NUMERIC(18,6) DEFAULT 0,
  recoupment_aplicado   NUMERIC(18,6) DEFAULT 0,

  -- Metadados B-55 para rastreabilidade
  publisher             TEXT,
  source                TEXT,
  song_title            TEXT,
  start_date            DATE,
  end_date              DATE,
  statement_id          TEXT,

  is_previa             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_periodos_updated_at     BEFORE UPDATE ON periodos_distribuicao  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_distribuicoes_updated_at BEFORE UPDATE ON distribuicoes         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_dist_itens_updated_at   BEFORE UPDATE ON distribuicao_itens     FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_periodos_tenant        ON periodos_distribuicao(tenant_id);
CREATE INDEX idx_periodos_status        ON periodos_distribuicao(status);
CREATE INDEX idx_periodos_ano_mes       ON periodos_distribuicao(ano, mes);
CREATE INDEX idx_distribuicoes_tenant   ON distribuicoes(tenant_id);
CREATE INDEX idx_distribuicoes_periodo  ON distribuicoes(periodo_id);
CREATE INDEX idx_dist_itens_dist        ON distribuicao_itens(distribuicao_id);
CREATE INDEX idx_dist_itens_obra        ON distribuicao_itens(obra_id);
CREATE INDEX idx_dist_itens_titular     ON distribuicao_itens(titular_id);

-- ── CC_OBRAS ─────────────────────────────────────────────────
CREATE TABLE cc_obras (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_id             UUID NOT NULL UNIQUE REFERENCES obras(id) ON DELETE CASCADE,
  saldo_atual         NUMERIC(18,6) NOT NULL DEFAULT 0,
  saldo_bloqueado     NUMERIC(18,6) NOT NULL DEFAULT 0,
  saldo_distribuido   NUMERIC(18,6) NOT NULL DEFAULT 0,
  saldo_pendente      NUMERIC(18,6) NOT NULL DEFAULT 0,
  moeda               TEXT NOT NULL DEFAULT 'BRL',
  status              status_geral NOT NULL DEFAULT 'ativo',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cc_obras_movimentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cc_obra_id        UUID NOT NULL REFERENCES cc_obras(id) ON DELETE CASCADE,
  obra_id           UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  tipo              tipo_movimento_obra NOT NULL,
  valor             NUMERIC(18,6) NOT NULL,
  saldo_anterior    NUMERIC(18,6) NOT NULL,
  saldo_posterior   NUMERIC(18,6) NOT NULL,
  descricao         TEXT,
  periodo_id        UUID REFERENCES periodos_distribuicao(id) ON DELETE SET NULL,
  distribuicao_id   UUID REFERENCES distribuicoes(id) ON DELETE SET NULL,
  recebimento_id    UUID REFERENCES recebimentos(id) ON DELETE SET NULL,

  -- Metadados B-55
  publisher         TEXT,
  source            TEXT,
  song_title        TEXT,
  start_date        DATE,
  end_date          DATE,
  statement_id      TEXT,

  is_previa         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CC_TITULARES ─────────────────────────────────────────────
CREATE TABLE cc_titulares (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titular_id          UUID NOT NULL UNIQUE REFERENCES titulares(id) ON DELETE CASCADE,
  saldo_atual         NUMERIC(18,6) NOT NULL DEFAULT 0,
  saldo_bloqueado     NUMERIC(18,6) NOT NULL DEFAULT 0,
  saldo_liberado      NUMERIC(18,6) NOT NULL DEFAULT 0,
  saldo_pago          NUMERIC(18,6) NOT NULL DEFAULT 0,
  moeda               TEXT NOT NULL DEFAULT 'BRL',
  recoupment_ativo    NUMERIC(18,6) DEFAULT 0,                     -- saldo devedor de adiantamentos
  status              status_geral NOT NULL DEFAULT 'ativo',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cc_titulares_movimentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cc_titular_id     UUID NOT NULL REFERENCES cc_titulares(id) ON DELETE CASCADE,
  titular_id        UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  obra_id           UUID REFERENCES obras(id) ON DELETE SET NULL,
  tipo              tipo_movimento_tit NOT NULL,
  valor_bruto       NUMERIC(18,6) NOT NULL,
  valor_liquido     NUMERIC(18,6) NOT NULL,
  retencao_irpf     NUMERIC(18,6) DEFAULT 0,
  retencao_iss      NUMERIC(18,6) DEFAULT 0,
  taxa_admin        NUMERIC(18,6) DEFAULT 0,
  recoupment        NUMERIC(18,6) DEFAULT 0,
  saldo_anterior    NUMERIC(18,6) NOT NULL,
  saldo_posterior   NUMERIC(18,6) NOT NULL,
  descricao         TEXT,
  periodo_id        UUID REFERENCES periodos_distribuicao(id) ON DELETE SET NULL,
  distribuicao_id   UUID REFERENCES distribuicoes(id) ON DELETE SET NULL,

  -- Metadados B-55
  publisher         TEXT,
  source            TEXT,
  song_title        TEXT,
  start_date        DATE,
  end_date          DATE,
  statement_id      TEXT,

  is_previa         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_cc_obras_updated_at     BEFORE UPDATE ON cc_obras     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cc_titulares_updated_at BEFORE UPDATE ON cc_titulares FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_cc_obras_tenant        ON cc_obras(tenant_id);
CREATE INDEX idx_cc_obras_obra          ON cc_obras(obra_id);
CREATE INDEX idx_cc_obr_mov_cc          ON cc_obras_movimentos(cc_obra_id);
CREATE INDEX idx_cc_obr_mov_periodo     ON cc_obras_movimentos(periodo_id);
CREATE INDEX idx_cc_titulares_tenant    ON cc_titulares(tenant_id);
CREATE INDEX idx_cc_titulares_titular   ON cc_titulares(titular_id);
CREATE INDEX idx_cc_tit_mov_cc          ON cc_titulares_movimentos(cc_titular_id);
CREATE INDEX idx_cc_tit_mov_periodo     ON cc_titulares_movimentos(periodo_id);
