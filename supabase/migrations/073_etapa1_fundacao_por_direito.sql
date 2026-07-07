-- 073_etapa1_fundacao_por_direito.sql
-- ETAPA 1 — Fundação por-direito (Contratos → Sintético → Analítico)
--
-- Cria duas tabelas:
--   1. titular_direito_controle  — controle SINTÉTICO por (titular × direito × território)
--      FK → obras_links_titulares; flag `controlado` preservado lá como derivado/legado.
--   2. contrato_titular_direito  — negócio ANALÍTICO por (contrato × titular × direito × território)
--      Sem obra_id: um contrato = mesmo split para todas as obras.
--
-- Direitos válidos Brasil (8): repr_grafica, repr_fonomecanica, inclusao_audiovisual,
--   inclusao_publicitaria, distribuicao_meios, inclusao_base_dados,
--   comunicacao_publico, autorizacoes_onus
-- Direitos válidos Exterior (7): os mesmos exceto autorizacoes_onus
--   → CHECK: autorizacoes_onus só em territorio='BR'
--
-- comunicacao_publico = ECAD/execução pública — modelo DILUÍDO:
--   pct_sintetico DEVE ser 0 (ECAD distribui individual; editora não concentra).
--   controlado=TRUE permitido (editora administra cadastro na sociedade).
--
-- Split analítico: pct_autor + pct_ed_original + pct_ed_adm = 100 (tolerância 0.01).
--   taxa_adm não é campo separado — a fatia da adm (pct_ed_adm) já sai dos % da editora.
--   Exemplo: autor 75 / ed_original 12.5 / ed_adm 12.5 = 100.
--
-- As 785 obras existentes NÃO são afetadas — tabelas criadas vazias.
-- RLS: herda padrão do projeto (tenant_id via usuarios.auth_user_id).

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. titular_direito_controle
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE titular_direito_controle (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_link_titular_id UUID        NOT NULL REFERENCES obras_links_titulares(id) ON DELETE CASCADE,
  direito              TEXT        NOT NULL,
  territorio           TEXT        NOT NULL DEFAULT 'BR',
  controlado           BOOLEAN     NOT NULL DEFAULT FALSE,
  pct_sintetico        NUMERIC(7,4) NOT NULL DEFAULT 0,
  origem               TEXT        NOT NULL DEFAULT 'cwr',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- direitos válidos
  CONSTRAINT chk_tdc_direito CHECK (direito IN (
    'repr_grafica', 'repr_fonomecanica',
    'inclusao_audiovisual', 'inclusao_publicitaria',
    'distribuicao_meios', 'inclusao_base_dados',
    'comunicacao_publico', 'autorizacoes_onus'
  )),

  -- territórios válidos
  CONSTRAINT chk_tdc_territorio CHECK (territorio IN ('BR', 'EXT')),

  -- autorizacoes_onus só existe em território BR
  CONSTRAINT chk_tdc_onus_br_only
    CHECK (direito <> 'autorizacoes_onus' OR territorio = 'BR'),

  -- comunicacao_publico é DILUÍDO: editora não concentra, pct_sintetico deve ser 0
  CONSTRAINT chk_tdc_comunicacao_publica_zero
    CHECK (direito <> 'comunicacao_publico' OR pct_sintetico = 0),

  -- pct_sintetico nunca negativo
  CONSTRAINT chk_tdc_pct_nn CHECK (pct_sintetico >= 0),

  -- origem rastreável
  CONSTRAINT chk_tdc_origem CHECK (origem IN ('cwr', 'contrato', 'manual')),

  -- chave única TOTAL (sem colunas nullable na constraint — evita erro 42P10 no Supabase)
  CONSTRAINT uq_tdc_titular_direito_territorio
    UNIQUE (obra_link_titular_id, direito, territorio)
);

COMMENT ON TABLE titular_direito_controle IS
  'Controle SINTÉTICO por (titular × direito × território). '
  'Registra se a editora controla aquele direito naquela participação. '
  'pct_sintetico = % concentrado (vai à fonte pagadora). '
  'comunicacao_publico sempre pct_sintetico=0 (ECAD distribui individual).';

COMMENT ON COLUMN titular_direito_controle.obra_link_titular_id IS
  'FK para obras_links_titulares. Flag controlado nessa tabela é legado/derivado.';
COMMENT ON COLUMN titular_direito_controle.direito IS
  'Código canônico do direito jurídico (8 valores BR + 7 EXT, sem autorizacoes_onus no EXT).';
COMMENT ON COLUMN titular_direito_controle.territorio IS
  'BR = Brasil, EXT = Exterior.';
COMMENT ON COLUMN titular_direito_controle.pct_sintetico IS
  'Percentual concentrado enviado à fonte pagadora. 0 para comunicacao_publico (diluído).';
COMMENT ON COLUMN titular_direito_controle.origem IS
  'Fonte do dado: cwr (importação), contrato (pós-assinatura), manual (operador).';

-- índices
CREATE INDEX idx_tdc_obra_link_titular ON titular_direito_controle(obra_link_titular_id);
CREATE INDEX idx_tdc_tenant            ON titular_direito_controle(tenant_id);

-- trigger updated_at
CREATE TRIGGER trg_tdc_updated_at
  BEFORE UPDATE ON titular_direito_controle
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE titular_direito_controle ENABLE ROW LEVEL SECURITY;

CREATE POLICY tdc_tenant_isolamento ON titular_direito_controle
  USING (
    tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. contrato_titular_direito
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE contrato_titular_direito (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contrato_id      UUID        NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  titular_id       UUID        NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  direito          TEXT        NOT NULL,
  territorio       TEXT        NOT NULL DEFAULT 'BR',
  -- split analítico: autor + editora_original + editora_adm = 100
  -- a taxa da administradora sai dos % da editora original, nunca do autor
  pct_autor        NUMERIC(7,4) NOT NULL DEFAULT 0,
  pct_ed_original  NUMERIC(7,4) NOT NULL DEFAULT 0,
  pct_ed_adm       NUMERIC(7,4) NOT NULL DEFAULT 0,
  -- ausência de linha = direito não negociado (não cedido)
  ativo            BOOLEAN     NOT NULL DEFAULT TRUE,
  origem           TEXT        NOT NULL DEFAULT 'contrato',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- direitos válidos
  CONSTRAINT chk_ctd_direito CHECK (direito IN (
    'repr_grafica', 'repr_fonomecanica',
    'inclusao_audiovisual', 'inclusao_publicitaria',
    'distribuicao_meios', 'inclusao_base_dados',
    'comunicacao_publico', 'autorizacoes_onus'
  )),

  -- territórios válidos
  CONSTRAINT chk_ctd_territorio CHECK (territorio IN ('BR', 'EXT')),

  -- autorizacoes_onus só BR
  CONSTRAINT chk_ctd_onus_br_only
    CHECK (direito <> 'autorizacoes_onus' OR territorio = 'BR'),

  -- % não negativos
  CONSTRAINT chk_ctd_pct_nn
    CHECK (pct_autor >= 0 AND pct_ed_original >= 0 AND pct_ed_adm >= 0),

  -- pct_autor + pct_ed_original + pct_ed_adm = 100 (tolerância 0.01)
  CONSTRAINT chk_ctd_pct_soma_100
    CHECK (ABS((pct_autor + pct_ed_original + pct_ed_adm) - 100.0) <= 0.01),

  -- origem rastreável
  CONSTRAINT chk_ctd_origem CHECK (origem IN ('contrato', 'manual')),

  -- chave única TOTAL — um split por (contrato, titular, direito, territorio)
  CONSTRAINT uq_ctd_contrato_titular_direito_territorio
    UNIQUE (contrato_id, titular_id, direito, territorio)
);

COMMENT ON TABLE contrato_titular_direito IS
  'Negócio ANALÍTICO por (contrato × titular × direito × território). '
  'Sem obra_id: um contrato = mesmo split para todas as obras. '
  'Ausência de linha = direito não negociado (autor mantém 100%). '
  'Split: pct_autor + pct_ed_original + pct_ed_adm = 100. '
  'A fatia da adm sai dos % da editora original, nunca do autor.';

COMMENT ON COLUMN contrato_titular_direito.pct_autor IS
  'Fatia do autor neste direito. Ex: 75.00.';
COMMENT ON COLUMN contrato_titular_direito.pct_ed_original IS
  'Fatia da editora original neste direito. Ex: 12.50.';
COMMENT ON COLUMN contrato_titular_direito.pct_ed_adm IS
  'Fatia da editora administradora neste direito (sai dos % da editora, não do autor). Ex: 12.50.';
COMMENT ON COLUMN contrato_titular_direito.ativo IS
  'FALSE = direito desativado por aditivo, sem apagar histórico.';

-- índices
CREATE INDEX idx_ctd_contrato  ON contrato_titular_direito(contrato_id);
CREATE INDEX idx_ctd_titular   ON contrato_titular_direito(titular_id);
CREATE INDEX idx_ctd_tenant    ON contrato_titular_direito(tenant_id);

-- trigger updated_at
CREATE TRIGGER trg_ctd_updated_at
  BEFORE UPDATE ON contrato_titular_direito
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE contrato_titular_direito ENABLE ROW LEVEL SECURITY;

CREATE POLICY ctd_tenant_isolamento ON contrato_titular_direito
  USING (
    tenant_id = (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
  );
