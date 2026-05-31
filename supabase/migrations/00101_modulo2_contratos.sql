-- ============================================================
-- MIGRATION 00101 — MODULO 2 CONTRATOS
-- Sync Mood Gestao Inteligente — Multi-Tenant
-- ============================================================

-- ============================================================
-- ENUMS M2
-- ============================================================

CREATE TYPE tipo_contrato_m2 AS ENUM (
  'cessao_parcial',
  'cessao_total',
  'licenciamento',
  'administracao_editorial',
  'coedicao',
  'subedicao',
  'cessao_internacional',
  'cessionario_pj',
  'cessionario_pf'
);

-- Codigo do direito: a-h BR + a-g EXT
CREATE TYPE codigo_direito_m2 AS ENUM (
  'BR_a',  -- Reproducao grafica (Edicao)
  'BR_b',  -- Reproducao fonomecanica
  'BR_c',  -- Inclusao/adaptacao audiovisual
  'BR_d',  -- Inclusao/adaptacao publicitaria
  'BR_e',  -- Distribuicao por meios oticos/cabo/satelite/redes
  'BR_f',  -- Inclusao em base de dados
  'BR_g',  -- Comunicacao ao publico
  'BR_h',  -- Autorizacoes com onus
  'EXT_a', -- Reproducao grafica (Exterior)
  'EXT_b', -- Reproducao fonomecanica (Exterior)
  'EXT_c', -- Inclusao/adaptacao audiovisual (Exterior)
  'EXT_d', -- Inclusao/adaptacao publicitaria (Exterior)
  'EXT_e', -- Distribuicao por meios oticos/cabo/satelite/redes (Exterior)
  'EXT_f', -- Inclusao em base de dados (Exterior)
  'EXT_g'  -- Comunicacao ao publico (Exterior)
);

CREATE TYPE status_contrato_m2 AS ENUM (
  'rascunho',
  'aguardando_assinatura',
  'em_vigor',
  'suspenso',
  'vencendo',
  'vencido',
  'rescindido',
  'revogado'
);

CREATE TYPE tipo_parte_m2 AS ENUM (
  'cedente',
  'cessionario',
  'administrador',
  'subeditora',
  'co_editora',
  'testemunha',
  'interveniente'
);

CREATE TYPE provedor_assinatura_m2 AS ENUM (
  'd4sign',
  'docusign',
  'icp_brasil',
  'manual'
);

CREATE TYPE status_assinatura_m2 AS ENUM (
  'pendente',
  'enviado',
  'assinado',
  'recusado',
  'cancelado'
);

-- ============================================================
-- MODELOS JURIDICOS
-- ============================================================
CREATE TABLE modelos_juridicos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  editora_id          UUID NOT NULL REFERENCES editoras_administradas(id) ON DELETE CASCADE,
  tipo_contrato       tipo_contrato_m2 NOT NULL,
  nome                TEXT NOT NULL,
  descricao           TEXT,
  template_texto      TEXT NOT NULL,
  ativo               BOOLEAN NOT NULL DEFAULT true,
  contagem_uso        INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_modelos_juridicos_editora ON modelos_juridicos(editora_id);
CREATE INDEX idx_modelos_juridicos_tipo ON modelos_juridicos(tipo_contrato);

-- ============================================================
-- CONTRATOS
-- ============================================================
CREATE TABLE contratos (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  editora_id              UUID NOT NULL REFERENCES editoras_administradas(id) ON DELETE CASCADE,
  modelo_juridico_id      UUID REFERENCES modelos_juridicos(id) ON DELETE SET NULL,
  numero                  TEXT NOT NULL,
  tipo                    tipo_contrato_m2 NOT NULL,
  status                  status_contrato_m2 NOT NULL DEFAULT 'rascunho',
  vigencia_inicio         DATE NOT NULL,
  vigencia_fim            DATE,
  prazo_indeterminado     BOOLEAN NOT NULL DEFAULT false,
  renovacao_automatica    BOOLEAN NOT NULL DEFAULT false,
  territorio_principal    TEXT NOT NULL DEFAULT 'BR',
  exclusividade           BOOLEAN NOT NULL DEFAULT false,
  clausula_reversao       BOOLEAN NOT NULL DEFAULT false,
  prazo_reversao_anos     INTEGER,
  observacoes             TEXT,
  criado_por              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_contratos_numero_editora UNIQUE (editora_id, numero)
);

CREATE INDEX idx_contratos_editora ON contratos(editora_id);
CREATE INDEX idx_contratos_tipo ON contratos(tipo);
CREATE INDEX idx_contratos_status ON contratos(status);
CREATE INDEX idx_contratos_vigencia_fim ON contratos(vigencia_fim);

-- ============================================================
-- CONTRATOS_PARTES
-- ============================================================
CREATE TABLE contratos_partes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id     UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  titular_id      UUID NOT NULL REFERENCES titulares(id) ON DELETE RESTRICT,
  papel           tipo_parte_m2 NOT NULL,
  percentual      NUMERIC(6,3),    -- percentual desta parte no contrato
  ordem           INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_partes_contrato ON contratos_partes(contrato_id);
CREATE INDEX idx_contratos_partes_titular ON contratos_partes(titular_id);

-- ============================================================
-- CONTRATOS_DIREITOS
-- ============================================================
CREATE TABLE contratos_direitos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id         UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  codigo              codigo_direito_m2 NOT NULL,
  ativo               BOOLEAN NOT NULL DEFAULT true,
  pct_titular         NUMERIC(6,3) NOT NULL,   -- % para o titular/autor
  pct_editora         NUMERIC(6,3) NOT NULL,   -- % para a editora
  observacao          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_contratos_direitos UNIQUE (contrato_id, codigo)
);

CREATE INDEX idx_contratos_direitos_contrato ON contratos_direitos(contrato_id);

-- ============================================================
-- CONTRATOS_OBRAS
-- ============================================================
CREATE TABLE contratos_obras (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id         UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  titulo_obra         TEXT NOT NULL,
  codigo_obra         TEXT,
  iswc                TEXT,
  percentual_autor    NUMERIC(6,3) NOT NULL DEFAULT 100,  -- % que o autor detém nesta obra
  vigencia_inicio     DATE,
  vigencia_fim        DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_obras_contrato ON contratos_obras(contrato_id);

-- ============================================================
-- CONTRATOS_OBRAS_LINKS
-- ============================================================
CREATE TABLE contratos_obras_links (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_obra_id    UUID NOT NULL REFERENCES contratos_obras(id) ON DELETE CASCADE,
  editora_original_id UUID REFERENCES titulares(id) ON DELETE SET NULL,
  administradora_id   UUID REFERENCES titulares(id) ON DELETE SET NULL,
  percentual_editora  NUMERIC(6,3),
  territorio          TEXT NOT NULL DEFAULT 'MUNDIAL',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_obras_links_obra ON contratos_obras_links(contrato_obra_id);

-- ============================================================
-- CONTRATOS_OBRAS_LINKS_TITULARES
-- ============================================================
CREATE TABLE contratos_obras_links_titulares (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id             UUID NOT NULL REFERENCES contratos_obras_links(id) ON DELETE CASCADE,
  titular_id          UUID NOT NULL REFERENCES titulares(id) ON DELETE RESTRICT,
  percentual          NUMERIC(6,3) NOT NULL,
  papel               TEXT NOT NULL DEFAULT 'CA',
  controlado          BOOLEAN NOT NULL DEFAULT false,  -- indica se este titular e controlado pela editora
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_colt_link ON contratos_obras_links_titulares(link_id);
CREATE INDEX idx_colt_titular ON contratos_obras_links_titulares(titular_id);

-- ============================================================
-- CONTRATOS_ASSINATURAS
-- ============================================================
CREATE TABLE contratos_assinaturas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id         UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  parte_id            UUID REFERENCES contratos_partes(id) ON DELETE SET NULL,
  nome_parte          TEXT NOT NULL,
  tipo_parte          tipo_parte_m2 NOT NULL DEFAULT 'cedente',
  provedor            provedor_assinatura_m2 NOT NULL DEFAULT 'manual',
  status              status_assinatura_m2 NOT NULL DEFAULT 'pendente',
  documento_externo_id TEXT,  -- ID no provedor externo (D4Sign, DocuSign etc)
  data_envio          TIMESTAMPTZ,
  data_assinatura     TIMESTAMPTZ,
  ip_origem           INET,
  hash_documento      TEXT,
  observacao          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_assinaturas_contrato ON contratos_assinaturas(contrato_id);

-- ============================================================
-- CONTRATOS_RECOUPMENT
-- ============================================================
CREATE TABLE contratos_recoupment (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id             UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  titular_id              UUID NOT NULL REFERENCES titulares(id) ON DELETE RESTRICT,
  descricao               TEXT NOT NULL,
  valor_adiantamento      NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_abatido           NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_aberto            NUMERIC(15,2) GENERATED ALWAYS AS (valor_adiantamento - valor_abatido) STORED,
  data_adiantamento       DATE NOT NULL,
  quitado                 BOOLEAN NOT NULL DEFAULT false,
  quitado_em              DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_recoupment_contrato ON contratos_recoupment(contrato_id);
CREATE INDEX idx_contratos_recoupment_titular ON contratos_recoupment(titular_id);

-- ============================================================
-- CONTRATOS_ADITIVOS
-- ============================================================
CREATE TABLE contratos_aditivos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id         UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  numero_aditivo      TEXT NOT NULL,
  descricao           TEXT NOT NULL,
  tipo                TEXT NOT NULL DEFAULT 'misto',
  status              status_contrato_m2 NOT NULL DEFAULT 'rascunho',
  conteudo_json       JSONB,   -- alteracoes em formato estruturado
  data_criacao        DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vigencia       DATE,
  assinado_em         DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_aditivos_contrato ON contratos_aditivos(contrato_id);

-- ============================================================
-- CONTRATOS_HISTORICO
-- ============================================================
CREATE TABLE contratos_historico (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id     UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  tipo_evento     TEXT NOT NULL,
  descricao       TEXT NOT NULL,
  usuario_id      UUID,
  usuario_nome    TEXT,
  ip              INET,
  metadados_json  JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_historico_contrato ON contratos_historico(contrato_id);
CREATE INDEX idx_contratos_historico_created ON contratos_historico(created_at DESC);

-- ============================================================
-- CONTRATOS_EXCLUSIVIDADE_ALERTAS
-- ============================================================
CREATE TABLE contratos_exclusividade_alertas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id         UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  titular_id          UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  tipo_alerta         TEXT NOT NULL,  -- 'vencimento_90d', 'vencimento_30d', 'conflito_editora', etc
  dias_para_vencer    INTEGER,
  data_vencimento     DATE,
  lido                BOOLEAN NOT NULL DEFAULT false,
  lido_em             TIMESTAMPTZ,
  descricao           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exclusividade_alertas_contrato ON contratos_exclusividade_alertas(contrato_id);
CREATE INDEX idx_exclusividade_alertas_titular ON contratos_exclusividade_alertas(titular_id);
CREATE INDEX idx_exclusividade_alertas_lido ON contratos_exclusividade_alertas(lido);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Multi-Tenant
-- ============================================================

ALTER TABLE modelos_juridicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_partes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_direitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_obras_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_obras_links_titulares ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_recoupment ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_aditivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_exclusividade_alertas ENABLE ROW LEVEL SECURITY;

-- Helper: retorna editoras visiveis para o usuario atual
CREATE OR REPLACE FUNCTION editoras_visiveis()
RETURNS SETOF UUID AS $$
  SELECT id FROM editoras_administradas
  WHERE id = (
    SELECT editora_id FROM usuarios_editoras WHERE usuario_id = auth.uid() LIMIT 1
  )
  OR administradora_id = (
    SELECT editora_id FROM usuarios_editoras WHERE usuario_id = auth.uid() LIMIT 1
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Policies — modelos_juridicos
CREATE POLICY "modelos_juridicos_select" ON modelos_juridicos FOR SELECT
  USING (editora_id IN (SELECT editoras_visiveis()));
CREATE POLICY "modelos_juridicos_insert" ON modelos_juridicos FOR INSERT
  WITH CHECK (editora_id IN (SELECT editoras_visiveis()));
CREATE POLICY "modelos_juridicos_update" ON modelos_juridicos FOR UPDATE
  USING (editora_id IN (SELECT editoras_visiveis()));
CREATE POLICY "modelos_juridicos_delete" ON modelos_juridicos FOR DELETE
  USING (editora_id IN (SELECT editoras_visiveis()));

-- Policies — contratos
CREATE POLICY "contratos_select" ON contratos FOR SELECT
  USING (editora_id IN (SELECT editoras_visiveis()));
CREATE POLICY "contratos_insert" ON contratos FOR INSERT
  WITH CHECK (editora_id IN (SELECT editoras_visiveis()));
CREATE POLICY "contratos_update" ON contratos FOR UPDATE
  USING (editora_id IN (SELECT editoras_visiveis()));
CREATE POLICY "contratos_delete" ON contratos FOR DELETE
  USING (editora_id IN (SELECT editoras_visiveis()));

-- Policies — contratos_partes
CREATE POLICY "contratos_partes_select" ON contratos_partes FOR SELECT
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_partes_insert" ON contratos_partes FOR INSERT
  WITH CHECK (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_partes_update" ON contratos_partes FOR UPDATE
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_partes_delete" ON contratos_partes FOR DELETE
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));

-- Policies — contratos_direitos
CREATE POLICY "contratos_direitos_select" ON contratos_direitos FOR SELECT
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_direitos_insert" ON contratos_direitos FOR INSERT
  WITH CHECK (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_direitos_update" ON contratos_direitos FOR UPDATE
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_direitos_delete" ON contratos_direitos FOR DELETE
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));

-- Policies — contratos_obras
CREATE POLICY "contratos_obras_select" ON contratos_obras FOR SELECT
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_obras_insert" ON contratos_obras FOR INSERT
  WITH CHECK (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_obras_update" ON contratos_obras FOR UPDATE
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_obras_delete" ON contratos_obras FOR DELETE
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));

-- Policies — contratos_obras_links
CREATE POLICY "contratos_obras_links_select" ON contratos_obras_links FOR SELECT
  USING (contrato_obra_id IN (
    SELECT co.id FROM contratos_obras co
    JOIN contratos c ON c.id = co.contrato_id
    WHERE c.editora_id IN (SELECT editoras_visiveis())
  ));
CREATE POLICY "contratos_obras_links_insert" ON contratos_obras_links FOR INSERT
  WITH CHECK (contrato_obra_id IN (
    SELECT co.id FROM contratos_obras co
    JOIN contratos c ON c.id = co.contrato_id
    WHERE c.editora_id IN (SELECT editoras_visiveis())
  ));
CREATE POLICY "contratos_obras_links_update" ON contratos_obras_links FOR UPDATE
  USING (contrato_obra_id IN (
    SELECT co.id FROM contratos_obras co
    JOIN contratos c ON c.id = co.contrato_id
    WHERE c.editora_id IN (SELECT editoras_visiveis())
  ));

-- Policies — contratos_obras_links_titulares
CREATE POLICY "colt_select" ON contratos_obras_links_titulares FOR SELECT
  USING (link_id IN (
    SELECT col.id FROM contratos_obras_links col
    JOIN contratos_obras co ON co.id = col.contrato_obra_id
    JOIN contratos c ON c.id = co.contrato_id
    WHERE c.editora_id IN (SELECT editoras_visiveis())
  ));
CREATE POLICY "colt_insert" ON contratos_obras_links_titulares FOR INSERT
  WITH CHECK (link_id IN (
    SELECT col.id FROM contratos_obras_links col
    JOIN contratos_obras co ON co.id = col.contrato_obra_id
    JOIN contratos c ON c.id = co.contrato_id
    WHERE c.editora_id IN (SELECT editoras_visiveis())
  ));

-- Policies — contratos_assinaturas
CREATE POLICY "contratos_assinaturas_select" ON contratos_assinaturas FOR SELECT
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_assinaturas_insert" ON contratos_assinaturas FOR INSERT
  WITH CHECK (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_assinaturas_update" ON contratos_assinaturas FOR UPDATE
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));

-- Policies — contratos_recoupment
CREATE POLICY "contratos_recoupment_select" ON contratos_recoupment FOR SELECT
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_recoupment_insert" ON contratos_recoupment FOR INSERT
  WITH CHECK (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_recoupment_update" ON contratos_recoupment FOR UPDATE
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));

-- Policies — contratos_aditivos
CREATE POLICY "contratos_aditivos_select" ON contratos_aditivos FOR SELECT
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_aditivos_insert" ON contratos_aditivos FOR INSERT
  WITH CHECK (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_aditivos_update" ON contratos_aditivos FOR UPDATE
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));

-- Policies — contratos_historico
CREATE POLICY "contratos_historico_select" ON contratos_historico FOR SELECT
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "contratos_historico_insert" ON contratos_historico FOR INSERT
  WITH CHECK (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));

-- Policies — contratos_exclusividade_alertas
CREATE POLICY "alertas_select" ON contratos_exclusividade_alertas FOR SELECT
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));
CREATE POLICY "alertas_update" ON contratos_exclusividade_alertas FOR UPDATE
  USING (contrato_id IN (SELECT id FROM contratos WHERE editora_id IN (SELECT editoras_visiveis())));

-- ============================================================
-- TRIGGERS — updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contratos_updated_at
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_modelos_juridicos_updated_at
  BEFORE UPDATE ON modelos_juridicos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_recoupment_updated_at
  BEFORE UPDATE ON contratos_recoupment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- COMENTARIOS
-- ============================================================

COMMENT ON TABLE contratos IS 'Contratos autorais M2 — cessao, licenca, administracao, coedicao, subedicao, cessao_internacional, cessionario_pj, cessionario_pf';
COMMENT ON TABLE contratos_direitos IS 'Direitos cedidos por contrato: BR_a-h (8 direitos BR) e EXT_a-g (7 direitos Exterior). Defaults BR 75/25 EXT 50/50, flexibilizaveis.';
COMMENT ON TABLE contratos_obras_links_titulares IS 'Link titular/editora em obra contratada. Campo "controlado" indica se o titular esta sob controle editorial da editora neste contrato.';
COMMENT ON TABLE contratos_assinaturas IS 'Assinaturas digitais: D4Sign, DocuSign, ICP Brasil ou manual.';
COMMENT ON TABLE contratos_exclusividade_alertas IS 'Alertas automaticos para contratos de exclusividade autoral vencendo em <=90 dias.';
