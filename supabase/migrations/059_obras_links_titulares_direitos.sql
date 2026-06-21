-- 059_obras_links_titulares_direitos.sql
-- Adiciona colunas de percentual por tipo de direito jurídico em obras_links_titulares
-- Brasil: 8 tipos | Exterior: 7 tipos (sem autorizacoes_onus)
--
-- Mapeamento com 039_tipos_direito_juridicos.sql:
--   repr_grafica          → DIREITOS DE REPRODUÇÃO GRÁFICA (EDIÇÃO)
--   repr_fonomecanica     → DIREITOS DE REPRODUÇÃO FONOMECÂNICOS
--   inclusao_audiovisual  → DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES AUDIOVISUAIS
--   inclusao_publicitaria → DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES PUBLICITÁRIAS
--   distribuicao_meios    → DIREITOS DE DISTRIBUIÇÃO MEDIANTE MEIOS ÓTICOS/CABO/SATÉLITES/DIGITAL
--   inclusao_base_dados   → DIREITOS DE INCLUSÃO EM BASE DE DADOS OU ARMAZENAMENTO
--   comunicacao_publico   → DIREITOS DE COMUNICAÇÃO AO PÚBLICO
--   autorizacoes_onus     → AUTORIZAÇÕES COM ÔNUS (apenas Brasil)

ALTER TABLE obras_links_titulares
  -- ────────── BRASIL (8 tipos) ──────────
  ADD COLUMN IF NOT EXISTS pct_repr_grafica              NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_repr_fonomecanica         NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_inclusao_audiovisual      NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_inclusao_publicitaria     NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_distribuicao_meios        NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_inclusao_base_dados       NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_comunicacao_publico       NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_autorizacoes_onus         NUMERIC(7,4) NOT NULL DEFAULT 0,
  -- ────────── EXTERIOR (7 tipos — sem autorizacoes_onus) ──────────
  ADD COLUMN IF NOT EXISTS pct_ext_repr_grafica          NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_ext_repr_fonomecanica     NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_ext_inclusao_audiovisual  NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_ext_inclusao_publicitaria NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_ext_distribuicao_meios    NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_ext_inclusao_base_dados   NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_ext_comunicacao_publico   NUMERIC(7,4) NOT NULL DEFAULT 0;

-- Comentários descritivos
COMMENT ON COLUMN obras_links_titulares.pct_repr_grafica          IS 'Brasil — Reprodução Gráfica (Edição)';
COMMENT ON COLUMN obras_links_titulares.pct_repr_fonomecanica     IS 'Brasil — Reprodução Fonomecânica (Venda/Locação)';
COMMENT ON COLUMN obras_links_titulares.pct_inclusao_audiovisual  IS 'Brasil — Inclusão/Adaptação em Produções Audiovisuais';
COMMENT ON COLUMN obras_links_titulares.pct_inclusao_publicitaria IS 'Brasil — Inclusão/Adaptação em Produções Publicitárias';
COMMENT ON COLUMN obras_links_titulares.pct_distribuicao_meios    IS 'Brasil — Distribuição por Meios (Digital/Cabo/Satélite)';
COMMENT ON COLUMN obras_links_titulares.pct_inclusao_base_dados   IS 'Brasil — Inclusão em Base de Dados ou Armazenamento';
COMMENT ON COLUMN obras_links_titulares.pct_comunicacao_publico   IS 'Brasil — Comunicação ao Público';
COMMENT ON COLUMN obras_links_titulares.pct_autorizacoes_onus     IS 'Brasil — Autorizações com Ônus';
COMMENT ON COLUMN obras_links_titulares.pct_ext_repr_grafica          IS 'Exterior — Reprodução Gráfica (Edição)';
COMMENT ON COLUMN obras_links_titulares.pct_ext_repr_fonomecanica     IS 'Exterior — Reprodução Fonomecânica';
COMMENT ON COLUMN obras_links_titulares.pct_ext_inclusao_audiovisual  IS 'Exterior — Inclusão/Adaptação em Produções Audiovisuais';
COMMENT ON COLUMN obras_links_titulares.pct_ext_inclusao_publicitaria IS 'Exterior — Inclusão/Adaptação em Produções Publicitárias';
COMMENT ON COLUMN obras_links_titulares.pct_ext_distribuicao_meios    IS 'Exterior — Distribuição por Meios (Digital/Cabo/Satélite)';
COMMENT ON COLUMN obras_links_titulares.pct_ext_inclusao_base_dados   IS 'Exterior — Inclusão em Base de Dados ou Armazenamento';
COMMENT ON COLUMN obras_links_titulares.pct_ext_comunicacao_publico   IS 'Exterior — Comunicação ao Público';
