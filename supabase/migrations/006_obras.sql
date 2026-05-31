-- ============================================================
-- 006_obras.sql — Obras, Links, Titulares por Link, Fonogramas
-- ============================================================

-- ── OBRAS ────────────────────────────────────────────────────
CREATE TABLE obras (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  editora_id            UUID REFERENCES editoras(id) ON DELETE SET NULL,
  codigo_obra           TEXT NOT NULL,                             -- ex: TSM0001
  titulo                TEXT NOT NULL,
  titulo_normalizado    TEXT GENERATED ALWAYS AS (lower(trim(titulo))) STORED,
  subtitulo             TEXT,
  titulo_alternativo    TEXT,
  iswc                  TEXT,                                      -- T-xxx.xxx.xxx-x
  genero_musical        TEXT,
  idioma                TEXT DEFAULT 'PT',
  duracao_segundos      INTEGER,
  ano_criacao           INTEGER,
  interprete_referencia TEXT,
  letra                 TEXT,
  status                status_obra NOT NULL DEFAULT 'pre_cadastro',
  status_iswc           status_iswc NOT NULL DEFAULT 'pendente',
  origem_cadastro       origem_cadastro_obra NOT NULL DEFAULT 'manual',
  contrato_origem_id    UUID REFERENCES contratos(id) ON DELETE SET NULL,
  observacoes           TEXT,
  cwr_iswc_enviado      BOOLEAN DEFAULT FALSE,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, codigo_obra)
);

-- FK contrato_obras → obras
ALTER TABLE contrato_obras ADD CONSTRAINT fk_contrato_obras_obra
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE;

-- ── OBRAS_LINKS ──────────────────────────────────────────────
-- Um link representa uma "faixa editorial" dentro de uma obra
-- (ex: Link 1 = grupo CA+E+AM, Link 2 = outro grupo CA+E+AM)
CREATE TABLE obras_links (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_id               UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  numero_link           INTEGER NOT NULL DEFAULT 1,
  descricao             TEXT,
  percentual_link       NUMERIC(7,4) NOT NULL DEFAULT 100,         -- % da obra que este link representa
  tipo_link             tipo_link NOT NULL DEFAULT 'controlado',
  controlado            BOOLEAN NOT NULL DEFAULT TRUE,
  percentual_controlado NUMERIC(7,4) DEFAULT 100,                  -- % controlado dentro do link
  status                status_geral NOT NULL DEFAULT 'ativo',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(obra_id, numero_link)
);

-- ── OBRAS_LINKS_TITULARES ────────────────────────────────────
-- Cada titular dentro de um link, com seus percentuais
CREATE TABLE obras_links_titulares (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_link_id            UUID NOT NULL REFERENCES obras_links(id) ON DELETE CASCADE,
  obra_id                 UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  titular_id              UUID REFERENCES titulares(id) ON DELETE SET NULL,
  editora_id              UUID REFERENCES editoras(id) ON DELETE SET NULL,
  nome                    TEXT NOT NULL,                           -- cache do nome
  funcao_no_link          funcao_link NOT NULL DEFAULT 'CA',
  papel                   TEXT NOT NULL DEFAULT 'autor',           -- PapelTitularLink normalizado
  percentual_exec_publica NUMERIC(7,4) NOT NULL DEFAULT 0,
  percentual_fonomecanico NUMERIC(7,4) NOT NULL DEFAULT 0,
  percentual_sincronizacao NUMERIC(7,4) NOT NULL DEFAULT 0,
  ipi                     TEXT,
  cae                     TEXT,
  editora_original_id     UUID REFERENCES editoras(id) ON DELETE SET NULL,
  editora_administradora_id UUID REFERENCES editoras(id) ON DELETE SET NULL,
  contrato_id             UUID REFERENCES contratos(id) ON DELETE SET NULL,
  controlado              BOOLEAN NOT NULL DEFAULT FALSE,
  status_controle         status_controle NOT NULL DEFAULT 'nao_controlado',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── FONOGRAMAS ───────────────────────────────────────────────
CREATE TABLE fonogramas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_id           UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  isrc              TEXT,
  titulo_fonograma  TEXT,
  interprete        TEXT,
  versao            versao_fonograma NOT NULL DEFAULT 'original',
  duracao_segundos  INTEGER,
  ano_gravacao      INTEGER,
  gravadora         TEXT,
  plataformas       TEXT[],                                        -- ['spotify','youtube','deezer']
  url_preview       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TRIGGER updated_at ───────────────────────────────────────
CREATE TRIGGER trg_obras_updated_at           BEFORE UPDATE ON obras                 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_obras_links_updated_at     BEFORE UPDATE ON obras_links           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_obras_links_tit_updated_at BEFORE UPDATE ON obras_links_titulares FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_fonogramas_updated_at      BEFORE UPDATE ON fonogramas            FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX idx_obras_tenant        ON obras(tenant_id);
CREATE INDEX idx_obras_editora       ON obras(editora_id);
CREATE INDEX idx_obras_codigo        ON obras(codigo_obra);
CREATE INDEX idx_obras_iswc          ON obras(iswc);
CREATE INDEX idx_obras_titulo_norm   ON obras(titulo_normalizado);
CREATE INDEX idx_obras_status        ON obras(status);
CREATE INDEX idx_obras_links_obra    ON obras_links(obra_id);
CREATE INDEX idx_olt_link            ON obras_links_titulares(obra_link_id);
CREATE INDEX idx_olt_obra            ON obras_links_titulares(obra_id);
CREATE INDEX idx_olt_titular         ON obras_links_titulares(titular_id);
CREATE INDEX idx_olt_ipi             ON obras_links_titulares(ipi);
CREATE INDEX idx_fonogramas_obra     ON fonogramas(obra_id);
CREATE INDEX idx_fonogramas_isrc     ON fonogramas(isrc);

-- ── VIEW: integrantes por obra ───────────────────────────────
CREATE OR REPLACE VIEW v_obra_integrantes AS
SELECT
  o.id           AS obra_id,
  o.titulo,
  ol.numero_link,
  ol.tipo_link,
  ol.percentual_link,
  ol.controlado  AS link_controlado,
  olt.nome       AS nome_participante,
  olt.ipi,
  olt.funcao_no_link,
  olt.papel,
  olt.percentual_exec_publica,
  olt.percentual_fonomecanico,
  olt.percentual_sincronizacao,
  olt.controlado AS participante_controlado,
  olt.status_controle,
  olt.editora_original_id,
  olt.editora_administradora_id,
  olt.titular_id,
  olt.editora_id,
  o.tenant_id
FROM obras o
JOIN obras_links ol ON ol.obra_id = o.id
JOIN obras_links_titulares olt ON olt.obra_link_id = ol.id
WHERE o.deleted_at IS NULL AND ol.status = 'ativo';

-- ── FUNÇÃO: percentual de controle da editora por obra ──────
CREATE OR REPLACE FUNCTION fn_controle_editora(p_obra_id UUID, p_editora_id UUID)
RETURNS TABLE(
  controle_exec_publica    NUMERIC,
  controle_fonomecanico    NUMERIC,
  controle_sincronizacao   NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(olt.percentual_exec_publica), 0),
    COALESCE(SUM(olt.percentual_fonomecanico), 0),
    COALESCE(SUM(olt.percentual_sincronizacao), 0)
  FROM obras_links_titulares olt
  JOIN obras_links ol ON ol.id = olt.obra_link_id
  WHERE ol.obra_id = p_obra_id
    AND olt.controlado = TRUE
    AND (olt.editora_id = p_editora_id OR olt.editora_original_id = p_editora_id OR olt.editora_administradora_id = p_editora_id);
END;
$$ LANGUAGE plpgsql;

-- ── FUNÇÃO: validar soma percentuais por link (deve = 100%) ─
CREATE OR REPLACE FUNCTION fn_validar_percentual_obra(p_obra_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '[]'::jsonb;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      ol.numero_link,
      SUM(olt.percentual_exec_publica) AS soma_exec,
      SUM(olt.percentual_fonomecanico) AS soma_fono,
      SUM(olt.percentual_sincronizacao) AS soma_sinc
    FROM obras_links ol
    JOIN obras_links_titulares olt ON olt.obra_link_id = ol.id
    WHERE ol.obra_id = p_obra_id
    GROUP BY ol.numero_link
  LOOP
    IF rec.soma_exec <> 100 OR rec.soma_fono <> 100 OR rec.soma_sinc <> 100 THEN
      v_result := v_result || jsonb_build_object(
        'link', rec.numero_link,
        'exec_publica', rec.soma_exec,
        'fonomecanico', rec.soma_fono,
        'sincronizacao', rec.soma_sinc,
        'valido', FALSE
      );
    END IF;
  END LOOP;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
