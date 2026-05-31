-- 004_titulares.sql
-- ============================================================

-- ============================================================
-- 004_titulares.sql — Titulares PF/PJ e sub-tabelas
-- ============================================================

-- ── TITULARES (tabela principal) ────────────────────────────
CREATE TABLE titulares (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  editora_id          UUID REFERENCES editoras(id) ON DELETE SET NULL,
  codigo_titular      TEXT NOT NULL,                               -- ex: T0001
  tipo                tipo_titular NOT NULL DEFAULT 'autor',
  pessoa              pessoa_tipo NOT NULL DEFAULT 'PF',
  nome_completo       TEXT NOT NULL,
  nome_artistico      TEXT,
  cpf_cnpj            TEXT,
  rg                  TEXT,
  data_nascimento     DATE,
  nacionalidade       TEXT DEFAULT 'Brasileira',
  sociedade_autoral   TEXT,
  codigo_cae          TEXT,
  codigo_ipi          TEXT,
  ipi                 TEXT,
  usuario_id          UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  status              status_geral NOT NULL DEFAULT 'ativo',
  observacoes         TEXT,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, codigo_titular)
);

-- FK: usuarios.titular_id → titulares
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_titular
  FOREIGN KEY (titular_id) REFERENCES titulares(id) ON DELETE SET NULL;

-- ── TITULARES_PF ─────────────────────────────────────────────
CREATE TABLE titulares_pf (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titular_id  UUID NOT NULL UNIQUE REFERENCES titulares(id) ON DELETE CASCADE,
  cpf         TEXT,
  rg          TEXT,
  data_nasc   DATE,
  naturalidade TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TITULARES_PJ ─────────────────────────────────────────────
CREATE TABLE titulares_pj (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titular_id       UUID NOT NULL UNIQUE REFERENCES titulares(id) ON DELETE CASCADE,
  cnpj             TEXT,
  razao_social     TEXT,
  inscricao_estado TEXT,
  responsavel_nome TEXT,
  responsavel_cpf  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PSEUDÔNIMOS ──────────────────────────────────────────────
CREATE TABLE titular_pseudonimos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titular_id  UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  pseudonimo  TEXT NOT NULL,
  is_principal BOOLEAN NOT NULL DEFAULT FALSE,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  data_inicio DATE,
  data_fim    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ENDEREÇOS ────────────────────────────────────────────────
CREATE TABLE titular_enderecos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titular_id  UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  tipo        TEXT DEFAULT 'residencial',
  cep         TEXT,
  logradouro  TEXT,
  numero      TEXT,
  complemento TEXT,
  bairro      TEXT,
  cidade      TEXT,
  estado      CHAR(2),
  pais        TEXT DEFAULT 'BR',
  principal   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONTATOS ─────────────────────────────────────────────────
CREATE TABLE titular_contatos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titular_id  UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,                                       -- telefone | whatsapp | email | site
  valor       TEXT NOT NULL,
  principal   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DADOS BANCÁRIOS ──────────────────────────────────────────
CREATE TABLE titular_dados_bancarios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titular_id   UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  banco        TEXT,
  agencia      TEXT,
  conta        TEXT,
  tipo_conta   tipo_conta_bancaria,
  pix_chave    TEXT,
  pix_tipo     TEXT,                                               -- cpf | cnpj | email | telefone | aleatoria
  principal    BOOLEAN NOT NULL DEFAULT FALSE,
  ativo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DOCUMENTOS ───────────────────────────────────────────────
CREATE TABLE titular_documentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titular_id  UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,                                       -- rg | cpf | passaporte | cnh | etc
  numero      TEXT,
  url_arquivo TEXT,
  validade    DATE,
  emissao     DATE,
  orgao       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TRIGGERS ─────────────────────────────────────────────────
CREATE TRIGGER trg_titulares_updated_at            BEFORE UPDATE ON titulares              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_titulares_pf_updated_at         BEFORE UPDATE ON titulares_pf           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_titulares_pj_updated_at         BEFORE UPDATE ON titulares_pj           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_titular_pseudonimos_updated_at  BEFORE UPDATE ON titular_pseudonimos    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_titular_enderecos_updated_at    BEFORE UPDATE ON titular_enderecos      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_titular_contatos_updated_at     BEFORE UPDATE ON titular_contatos       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_titular_db_updated_at           BEFORE UPDATE ON titular_dados_bancarios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_titular_docs_updated_at         BEFORE UPDATE ON titular_documentos     FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX idx_titulares_tenant      ON titulares(tenant_id);
CREATE INDEX idx_titulares_editora     ON titulares(editora_id);
CREATE INDEX idx_titulares_cpf_cnpj    ON titulares(cpf_cnpj);
CREATE INDEX idx_titulares_ipi         ON titulares(ipi);
CREATE INDEX idx_tit_pseudo_titular    ON titular_pseudonimos(titular_id);
CREATE INDEX idx_tit_end_titular       ON titular_enderecos(titular_id);
CREATE INDEX idx_tit_cont_titular      ON titular_contatos(titular_id);
CREATE INDEX idx_tit_db_titular        ON titular_dados_bancarios(titular_id);


-- ============================================================
-- 005_contratos.sql
-- ============================================================

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


-- ============================================================
-- 006_obras.sql
-- ============================================================

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


-- ============================================================
