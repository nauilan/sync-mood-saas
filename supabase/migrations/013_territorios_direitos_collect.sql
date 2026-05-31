-- ============================================================
-- 013_territorios_direitos_collect.sql
-- Territórios parametrizáveis, direitos por tenant e
-- collect PR/MR por obra/território/publisher local.
--
-- Implementa os pontos 11, 12 e 13 da Arquitetura Funcional v2.0.
-- TODOS os percentuais são parametrizáveis — nada é fixo no código.
-- ============================================================

-- ── TERRITÓRIOS ──────────────────────────────────────────────
-- Lista de territórios gerenciados pelo tenant.
-- Permite Brasil, Mundo, EUA, Europa, América Latina, ou personalizados.
CREATE TABLE IF NOT EXISTS territorios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo        TEXT NOT NULL,             -- BR, WORLD, US, ES, PT, JP, LATAM…
  nome          TEXT NOT NULL,
  descricao     TEXT,
  cisac_code    TEXT,                      -- Código CISAC/BIEM para exportação CWR/SPT
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

-- Seed de territórios padrão é feito via aplicação na primeira execução,
-- não via migration (para evitar conflitos com UUIDs de tenant).

CREATE INDEX IF NOT EXISTS idx_territorios_tenant ON territorios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_territorios_codigo ON territorios(codigo);


-- ── TIPOS DE DIREITO ─────────────────────────────────────────
-- Direitos musicais gerenciados. Completamente parametrizável por tenant.
-- Cada tenant pode ter direitos adicionais além dos padrão.
CREATE TABLE IF NOT EXISTS tipos_direito (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo              TEXT NOT NULL,       -- PR, MR, SYNC, PUB, AV, DIG, GRF, KAR, PAR, DB, ESP
  nome                TEXT NOT NULL,       -- Execução Pública, Fonomecânico, Sincronização…
  descricao           TEXT,
  -- Se FALSE, este direito NÃO entra no motor de distribuição do Sync Mood
  -- (ex: Execução Pública é gerida pelo ECAD — apenas demonstrativo)
  entra_distribuicao  BOOLEAN NOT NULL DEFAULT TRUE,
  -- Para geração CWR: qual campo de percentual usar (pr_pct ou mr_pct do SPU/SWR)
  tipo_cwr            TEXT CHECK (tipo_cwr IN ('PR','MR','ambos','nenhum')) DEFAULT 'ambos',
  ordem               INTEGER NOT NULL DEFAULT 0,
  ativo               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

COMMENT ON COLUMN tipos_direito.entra_distribuicao IS
  'FALSE para Execução Pública (ECAD distribui diretamente). Apenas demonstrativo/BI.';

CREATE INDEX IF NOT EXISTS idx_tipos_direito_tenant ON tipos_direito(tenant_id);


-- ── OBRA TERRITORY COLLECT ───────────────────────────────────
-- Define publisher local e percentuais de collect por obra + território.
-- Uma mesma editora pode ter collect diferente por obra.
-- Compatível com BackOffice SPT e subedição internacional.
CREATE TABLE IF NOT EXISTS obra_territory_collect (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_id             UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  territorio_id       UUID NOT NULL REFERENCES territorios(id) ON DELETE RESTRICT,
  publisher_local_id  UUID REFERENCES editoras(id) ON DELETE SET NULL,
  -- Percentuais de collect (0-100). NULL = não configurado para este território.
  collect_pr          NUMERIC(7,4),        -- % autorizado a arrecadar Exec. Pública
  collect_mr          NUMERIC(7,4),        -- % autorizado a arrecadar Fonomecânico
  collect_sync        NUMERIC(7,4),
  collect_digital     NUMERIC(7,4),
  -- Vigência
  data_inicio         DATE,
  data_fim            DATE,                -- NULL = indefinido
  -- Origem desta configuração
  contrato_id         UUID,                -- FK contratos (sem REFERENCES para evitar dep. circular)
  origem              TEXT DEFAULT 'manual'
    CHECK (origem IN ('manual','cwr_spt','contrato','subedicao','migracao')),
  status              TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo','encerrado','suspenso')),
  observacoes         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_otc_updated_at
  BEFORE UPDATE ON obra_territory_collect
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_otc_obra        ON obra_territory_collect(obra_id);
CREATE INDEX IF NOT EXISTS idx_otc_territorio  ON obra_territory_collect(territorio_id);
CREATE INDEX IF NOT EXISTS idx_otc_tenant      ON obra_territory_collect(tenant_id);
CREATE INDEX IF NOT EXISTS idx_otc_publisher   ON obra_territory_collect(publisher_local_id);

COMMENT ON TABLE obra_territory_collect IS
  'Collect PR/MR por obra + território + publisher local. Nenhum valor é fixo.';


-- ── OBRA LINK TITULAR — adicionar campos de território e direito ─
-- Estende obras_links_titulares para suportar percentuais por direito.
-- Cada linha da "grade da obra" pode ter percentuais distintos por tipo de direito.
ALTER TABLE obras_links_titulares
  ADD COLUMN IF NOT EXISTS territorio_id       UUID REFERENCES territorios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS percentual_sync     NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS percentual_publ     NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS percentual_digital  NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS percentual_grafico  NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS percentual_karaoke  NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS percentual_partitura NUMERIC(7,4),
  ADD COLUMN IF NOT EXISTS contrato_id         UUID;  -- FK contratos (sem REFERENCES por ora)

COMMENT ON COLUMN obras_links_titulares.territorio_id IS
  'Território desta linha da grade. NULL = todos os territórios.';
COMMENT ON COLUMN obras_links_titulares.contrato_id IS
  'Contrato que rege esta participação. Permite contratos diferentes por autor na mesma obra.';

CREATE INDEX IF NOT EXISTS idx_olt_territorio ON obras_links_titulares(territorio_id);


-- ── OBRAS_LINKS — adicionar percentual por tipo e território ──
ALTER TABLE obras_links
  ADD COLUMN IF NOT EXISTS percentual_total          NUMERIC(7,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS percentual_nao_controlado NUMERIC(7,4) DEFAULT 0;


-- ── RECEBIMENTOS — adicionar território e tipo de direito ────
ALTER TABLE recebimentos
  ADD COLUMN IF NOT EXISTS territorio_id   UUID REFERENCES territorios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo_direito_id UUID REFERENCES tipos_direito(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recebimentos_territorio  ON recebimentos(territorio_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_direito     ON recebimentos(tipo_direito_id);


-- ── CC_OBRAS_MOVIMENTOS — adicionar tipo de direito e território ─
ALTER TABLE cc_obras_movimentos
  ADD COLUMN IF NOT EXISTS territorio_id   UUID REFERENCES territorios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo_direito_id UUID REFERENCES tipos_direito(id) ON DELETE SET NULL;

ALTER TABLE cc_titulares_movimentos
  ADD COLUMN IF NOT EXISTS territorio_id   UUID REFERENCES territorios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo_direito_id UUID REFERENCES tipos_direito(id) ON DELETE SET NULL;
