-- 007_recebimentos_importacoes.sql
-- ============================================================

-- ============================================================
-- 007_recebimentos_importacoes.sql
-- ============================================================

-- ── IMPORTACOES_LOG ──────────────────────────────────────────
-- Auditoria de cada arquivo importado (CWR, DSP TXT, etc.)
CREATE TABLE importacoes_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  arquivo               TEXT NOT NULL,
  statement_id          TEXT,                                      -- ex: ST492347 (anti-duplicação)
  tipo                  tipo_importacao_log NOT NULL,
  status                status_importacao NOT NULL DEFAULT 'sucesso',
  obras_importadas      INTEGER DEFAULT 0,
  titulares_importados  INTEGER DEFAULT 0,
  total_valor           NUMERIC(18,6) DEFAULT 0,
  publisher             TEXT,
  source                TEXT,                                      -- DSP: Spotify, YouTube, etc.
  periodo_inicio        DATE,
  periodo_fim           DATE,
  detalhes              TEXT,
  usuario_id            UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_importacoes_tenant       ON importacoes_log(tenant_id);
CREATE INDEX idx_importacoes_statement    ON importacoes_log(statement_id);
CREATE INDEX idx_importacoes_tipo         ON importacoes_log(tipo);
CREATE INDEX idx_importacoes_created      ON importacoes_log(created_at DESC);

-- ── RECEBIMENTOS ─────────────────────────────────────────────
CREATE TABLE recebimentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  editora_id        UUID REFERENCES editoras(id) ON DELETE SET NULL,
  importacao_id     UUID REFERENCES importacoes_log(id) ON DELETE SET NULL,
  obra_id           UUID REFERENCES obras(id) ON DELETE SET NULL,

  -- Metadados do arquivo B-55
  statement_id      TEXT,
  publisher         TEXT,
  source            TEXT,                                          -- DSP
  song_code         TEXT,                                          -- Publisher_SongCode
  song_title        TEXT,
  start_date        DATE,
  end_date          DATE,

  -- Valores
  valor_bruto       NUMERIC(18,6) NOT NULL DEFAULT 0,
  moeda             TEXT NOT NULL DEFAULT 'USD',
  valor_brl         NUMERIC(18,6),                                 -- convertido se necessário

  -- Status
  fonte             fonte_recebimento NOT NULL DEFAULT 'backoffice_music_services',
  status            status_recebimento NOT NULL DEFAULT 'importado',
  periodo_dist_id   UUID,                                          -- FK periodos_distribuicao (adicionado depois)
  matched_em        TIMESTAMPTZ,
  distribuido_em    TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_recebimentos_updated_at BEFORE UPDATE ON recebimentos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_recebimentos_tenant      ON recebimentos(tenant_id);
CREATE INDEX idx_recebimentos_obra        ON recebimentos(obra_id);
CREATE INDEX idx_recebimentos_song_code   ON recebimentos(song_code);
CREATE INDEX idx_recebimentos_statement   ON recebimentos(statement_id);
CREATE INDEX idx_recebimentos_status      ON recebimentos(status);
CREATE INDEX idx_recebimentos_periodo     ON recebimentos(periodo_dist_id);


-- ============================================================
-- 008_distribuicao.sql
-- ============================================================

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


-- ============================================================
-- 009_autorizacoes_prestacao.sql
-- ============================================================

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


-- ============================================================
