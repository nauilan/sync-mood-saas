-- ============================================================
-- SYNC MOOD SAAS -- MIGRATION COMPLETA v2 (com DROP seguro)
-- Execute no SQL Editor: https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/editor
-- ============================================================

-- DROP tudo na ordem inversa (seguro para reexecutar)
DROP TABLE IF EXISTS autorizacao_obras, autorizacoes CASCADE;
DROP TABLE IF EXISTS prestacao_contas CASCADE;
DROP TABLE IF EXISTS cc_movimentos, cc_titulares, cc_obras CASCADE;
DROP TABLE IF EXISTS distribuicao_itens, distribuicoes, periodos_distribuicao CASCADE;
DROP TABLE IF EXISTS recebimento_itens, importacoes_log, recebimentos CASCADE;
DROP TABLE IF EXISTS gravacoes, fonogramas CASCADE;
DROP TABLE IF EXISTS obra_link_titulares, obra_links, obras CASCADE;
DROP TABLE IF EXISTS clausulas, contrato_obras, contratos, modelos_juridicos CASCADE;
DROP TABLE IF EXISTS titulares_dados_bancarios, titulares_contatos, titulares_pseudonimos CASCADE;
DROP TABLE IF EXISTS titulares_pj, titulares_pf, titulares CASCADE;
DROP TABLE IF EXISTS editoras_configuracoes, editoras CASCADE;
DROP TABLE IF EXISTS permissoes, perfis, usuarios CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS fn_meu_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS fn_meu_role() CASCADE;
DROP FUNCTION IF EXISTS fn_meu_titular_id() CASCADE;
DROP VIEW IF EXISTS v_obras_com_titulares CASCADE;
DROP VIEW IF EXISTS v_cc_titular_resumo CASCADE;
DROP TYPE IF EXISTS pessoa_tipo, status_geral, tipo_titular, tipo_conta_bancaria, tipo_contrato CASCADE;
DROP TYPE IF EXISTS status_contrato, direito_tipo, status_obra, versao_fonograma, funcao_autor CASCADE;
DROP TYPE IF EXISTS role_usuario, plano_tenant, tipo_link, funcao_link, status_controle CASCADE;
DROP TYPE IF EXISTS origem_cadastro_obra, status_iswc, tipo_periodo_dist, status_periodo_dist CASCADE;
DROP TYPE IF EXISTS status_distribuicao, tipo_movimento_obra, tipo_movimento_tit, fonte_recebimento CASCADE;
DROP TYPE IF EXISTS status_recebimento, formato_importacao, tipo_importacao_log, status_importacao CASCADE;


-- ============================================================
-- 001_enums.sql
-- ============================================================

-- ============================================================
-- 001_enums.sql — Sync Mood Gestão Inteligente
-- Todos os ENUM types do sistema
-- ============================================================

CREATE TYPE pessoa_tipo           AS ENUM ('PF', 'PJ');
CREATE TYPE status_geral          AS ENUM ('ativo', 'inativo');
CREATE TYPE tipo_titular          AS ENUM ('autor', 'compositor', 'interprete', 'produtor', 'editora', 'gravadora', 'cessionario');
CREATE TYPE tipo_conta_bancaria   AS ENUM ('corrente', 'poupanca', 'pagamento');
CREATE TYPE tipo_contrato         AS ENUM ('cessao', 'administracao', 'coedicao', 'subedicao', 'licenciamento', 'autorizacao');
CREATE TYPE status_contrato       AS ENUM ('ativo', 'encerrado', 'suspenso', 'em_analise');
CREATE TYPE direito_tipo          AS ENUM ('execucao_publica', 'reproducao', 'sincronizacao', 'digital', 'internacional');
CREATE TYPE status_obra           AS ENUM (
  'ativa', 'inativa', 'em_analise', 'rascunho', 'pre_cadastro',
  'pendente_contrato', 'pendente_percentual', 'pendente_validacao',
  'validada', 'enviada_sociedade', 'aguardando_retorno', 'bloqueada'
);
CREATE TYPE versao_fonograma      AS ENUM ('original', 'ao_vivo', 'remix', 'acustico', 'outro');
CREATE TYPE funcao_autor          AS ENUM ('autor', 'compositor', 'versionista', 'adaptador');
CREATE TYPE role_usuario          AS ENUM ('master', 'editora_administrada', 'autor', 'financeiro', 'juridico', 'atendimento', 'admin');
CREATE TYPE plano_tenant          AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE tipo_link             AS ENUM ('controlado', 'parcialmente_controlado', 'direto_sem_editora', 'editora_administrada', 'cessionario');
CREATE TYPE funcao_link           AS ENUM ('CA', 'V', 'SA', 'E', 'AM', 'SE', 'C', 'CE', 'A', 'I', 'M', 'T', 'AD', 'H');
CREATE TYPE status_controle       AS ENUM ('controlado', 'nao_controlado', 'contrato_pendente', 'contrato_validado', 'direto_pela_sociedade', 'administrado_por_terceiro', 'bloqueado');
CREATE TYPE origem_cadastro_obra  AS ENUM ('contrato_sistema', 'manual', 'migracao');
CREATE TYPE status_iswc           AS ENUM ('pendente', 'aguardando_retorno', 'recebido');
CREATE TYPE tipo_periodo_dist     AS ENUM ('mensal', 'trimestral');
CREATE TYPE status_periodo_dist   AS ENUM ('aberto', 'em_processamento', 'encerrado', 'cancelado');
CREATE TYPE status_distribuicao   AS ENUM ('previa', 'calculando', 'aprovacao', 'aprovada', 'executada', 'estornada');
CREATE TYPE tipo_movimento_obra   AS ENUM ('entrada', 'distribuicao', 'recoupment', 'retencao', 'taxa_administrativa', 'estorno', 'ajuste', 'bloqueio', 'liberacao');
CREATE TYPE tipo_movimento_tit    AS ENUM ('credito', 'debito', 'retencao', 'recoupment', 'pagamento', 'estorno', 'bloqueio', 'ajuste');
CREATE TYPE fonte_recebimento     AS ENUM ('ecad_socinpro', 'backoffice_music_services', 'sync', 'internacional', 'acordo_direto');
CREATE TYPE status_recebimento    AS ENUM ('importado', 'pendente_matching', 'em_conciliacao', 'conciliado', 'divergente', 'distribuido', 'auditado');
CREATE TYPE formato_importacao    AS ENUM ('pdf', 'xls', 'xlsx', 'csv', 'txt', 'xml');
CREATE TYPE tipo_importacao_log   AS ENUM ('CWR', 'DSP_TXT', 'XLSX', 'outro');
CREATE TYPE status_importacao     AS ENUM ('sucesso', 'parcial', 'erro');


-- ============================================================
-- 002_tenants_usuarios.sql
-- ============================================================

-- ============================================================
-- 002_tenants_usuarios.sql — Multi-tenant + Auth
-- ============================================================

-- ── TENANTS ──────────────────────────────────────────────────
CREATE TABLE tenants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,                        -- ex: "topshow", "edimusic"
  editora_master_id   UUID,                                        -- FK editoras (adicionado depois)
  plano               plano_tenant NOT NULL DEFAULT 'free',
  ativo               BOOLEAN NOT NULL DEFAULT TRUE,
  logo_url            TEXT,
  dominio_personalizado TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── USUARIOS ─────────────────────────────────────────────────
-- Espelha auth.users do Supabase, com perfil de negócio
CREATE TABLE usuarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email           TEXT,                                              -- email Supabase Auth ({cpf}@syncmood.app)
  cpf             TEXT UNIQUE,                                       -- login principal (CPF sem formatação)
  nome            TEXT NOT NULL,
  role            role_usuario NOT NULL DEFAULT 'autor',
  titular_id      UUID,                                              -- FK titulares (adicionado depois)
  editora_id      UUID,                                              -- FK editoras (adicionado depois)
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acesso   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PERFIS DE PERMISSÃO ──────────────────────────────────────
CREATE TABLE perfis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  role        role_usuario NOT NULL,
  permissoes  JSONB NOT NULL DEFAULT '{}',                         -- { "titulares": ["read","write"], ... }
  descricao   TEXT,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, nome)
);

-- ── TRIGGER updated_at genérico ─────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at   BEFORE UPDATE ON tenants   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_usuarios_updated_at  BEFORE UPDATE ON usuarios  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_perfis_updated_at    BEFORE UPDATE ON perfis    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX idx_usuarios_tenant    ON usuarios(tenant_id);
CREATE INDEX idx_usuarios_auth      ON usuarios(auth_user_id);
CREATE INDEX idx_usuarios_email     ON usuarios(email);
CREATE INDEX idx_perfis_tenant      ON perfis(tenant_id);


-- ============================================================
-- 003_editoras.sql
-- ============================================================

-- ============================================================
-- 003_editoras.sql — Editoras Administradas
-- ============================================================

CREATE TABLE editoras (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  razao_social                TEXT NOT NULL,
  nome_fantasia               TEXT NOT NULL,
  cnpj                        TEXT,
  endereco                    TEXT,
  bairro                      TEXT,
  cep                         TEXT,
  cidade                      TEXT,
  estado                      CHAR(2),
  pais                        TEXT NOT NULL DEFAULT 'BR',
  telefone                    TEXT,
  email                       TEXT,
  site                        TEXT,
  codigo_cae                  TEXT,
  codigo_ipi                  TEXT,
  ipi_socinpro                TEXT,
  sociedade_autoral_vinculada TEXT,
  logo_url                    TEXT,
  dados_bancarios             JSONB DEFAULT '{}',
  status                      status_geral NOT NULL DEFAULT 'ativo',
  deleted_at                  TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK reversa: tenants.editora_master_id → editoras
ALTER TABLE tenants ADD CONSTRAINT fk_tenants_editora_master
  FOREIGN KEY (editora_master_id) REFERENCES editoras(id) ON DELETE SET NULL;

-- FK: usuarios.editora_id → editoras
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_editora
  FOREIGN KEY (editora_id) REFERENCES editoras(id) ON DELETE SET NULL;

CREATE TRIGGER trg_editoras_updated_at BEFORE UPDATE ON editoras FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_editoras_tenant ON editoras(tenant_id);
CREATE INDEX idx_editoras_cnpj   ON editoras(cnpj);


-- ============================================================
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
-- 010_rls.sql
-- ============================================================

-- ============================================================
-- 010_rls.sql — Row Level Security (Multi-tenant)
-- REGRA: cada tenant só vê seus próprios dados
-- ============================================================

-- Habilitar RLS em todas as tabelas de negócio
ALTER TABLE tenants                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE editoras                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_pf              ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_pj              ENABLE ROW LEVEL SECURITY;
ALTER TABLE titular_pseudonimos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE titular_enderecos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE titular_contatos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE titular_dados_bancarios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE titular_documentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_juridicos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_obras            ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_aditivos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_links               ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_links_titulares     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fonogramas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE importacoes_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recebimentos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos_distribuicao     ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribuicoes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribuicao_itens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_obras                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_obras_movimentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_titulares              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_titulares_movimentos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE autorizacoes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestacao_contas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestacao_contestacoes    ENABLE ROW LEVEL SECURITY;

-- ── FUNÇÃO AUXILIAR: retorna tenant_id do usuário logado ────
CREATE OR REPLACE FUNCTION fn_meu_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM usuarios
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── FUNÇÃO AUXILIAR: retorna role do usuário logado ─────────
CREATE OR REPLACE FUNCTION fn_meu_role()
RETURNS role_usuario AS $$
  SELECT role FROM usuarios
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── FUNÇÃO AUXILIAR: retorna titular_id do usuário logado ───
CREATE OR REPLACE FUNCTION fn_meu_titular_id()
RETURNS UUID AS $$
  SELECT titular_id FROM usuarios
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── MACRO: cria políticas READ/WRITE para tenant_id ────────
-- Padrão: SELECT = mesmo tenant | INSERT/UPDATE/DELETE = master ou editora
-- (roles autor e atendimento só lêem)

-- TENANTS: usuário vê apenas seu próprio tenant
CREATE POLICY "tenant_select" ON tenants FOR SELECT
  USING (id = fn_meu_tenant_id());

-- USUARIOS
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT
  WITH CHECK (tenant_id = fn_meu_tenant_id() AND fn_meu_role() IN ('master','admin'));
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE
  USING (tenant_id = fn_meu_tenant_id() AND fn_meu_role() IN ('master','admin'));

-- EDITORAS
CREATE POLICY "editoras_select" ON editoras FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());
CREATE POLICY "editoras_write" ON editoras FOR ALL
  USING (tenant_id = fn_meu_tenant_id() AND fn_meu_role() IN ('master','admin','editora_administrada'));

-- TITULARES
CREATE POLICY "titulares_select_all" ON titulares FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());

-- Autor só vê a si mesmo:
CREATE POLICY "titulares_select_own" ON titulares FOR SELECT
  USING (
    fn_meu_role() = 'autor'
    AND id = fn_meu_titular_id()
  );

CREATE POLICY "titulares_write" ON titulares FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('master','admin','editora_administrada','atendimento')
  );

-- Sub-tabelas de titular: herdamos a mesma lógica de tenant_id
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'titulares_pf','titulares_pj','titular_pseudonimos',
    'titular_enderecos','titular_contatos',
    'titular_dados_bancarios','titular_documentos'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "rls_select_%1$s" ON %1$s FOR SELECT USING (tenant_id = fn_meu_tenant_id());
       CREATE POLICY "rls_write_%1$s"  ON %1$s FOR ALL   USING (tenant_id = fn_meu_tenant_id() AND fn_meu_role() IN (''master'',''admin'',''editora_administrada'',''atendimento''));',
      tbl
    );
  END LOOP;
END $$;

-- CONTRATOS
CREATE POLICY "contratos_select" ON contratos FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());
CREATE POLICY "contratos_write" ON contratos FOR ALL
  USING (tenant_id = fn_meu_tenant_id() AND fn_meu_role() IN ('master','admin','editora_administrada','juridico'));

-- OBRAS
CREATE POLICY "obras_select" ON obras FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());
CREATE POLICY "obras_write" ON obras FOR ALL
  USING (tenant_id = fn_meu_tenant_id() AND fn_meu_role() IN ('master','admin','editora_administrada','atendimento'));

-- Restante das tabelas: same-tenant read-write para roles de negócio
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'obras_links','obras_links_titulares','fonogramas',
    'modelos_juridicos','contrato_obras','contrato_aditivos',
    'importacoes_log','recebimentos',
    'periodos_distribuicao','distribuicoes','distribuicao_itens',
    'cc_obras','cc_obras_movimentos','cc_titulares','cc_titulares_movimentos',
    'autorizacoes','prestacao_contas','prestacao_contestacoes','perfis'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "rls_select_%1$s" ON %1$s FOR SELECT USING (tenant_id = fn_meu_tenant_id());
       CREATE POLICY "rls_write_%1$s"  ON %1$s FOR ALL   USING (tenant_id = fn_meu_tenant_id() AND fn_meu_role() IN (''master'',''admin'',''editora_administrada'',''financeiro'',''juridico'',''atendimento''));',
      tbl
    );
  END LOOP;
END $$;

-- CC Titular: autor só vê seu próprio CC
CREATE POLICY "cc_titulares_autor_select" ON cc_titulares FOR SELECT
  USING (
    fn_meu_role() = 'autor'
    AND titular_id = fn_meu_titular_id()
  );

CREATE POLICY "cc_tit_mov_autor_select" ON cc_titulares_movimentos FOR SELECT
  USING (
    fn_meu_role() = 'autor'
    AND titular_id = fn_meu_titular_id()
  );

-- Prestação de contas: autor só vê suas próprias
CREATE POLICY "prestacao_autor_select" ON prestacao_contas FOR SELECT
  USING (
    fn_meu_role() = 'autor'
    AND titular_id = fn_meu_titular_id()
  );


-- ============================================================
-- 011_seed_primeiro_tenant.sql
-- ============================================================

-- ============================================================
-- 011_seed_primeiro_tenant.sql
-- Execute APÓS criar o primeiro usuário no Supabase Auth
-- Substitua os valores abaixo antes de executar
-- ============================================================

-- 1. Criar o tenant master
INSERT INTO tenants (id, nome, slug, plano, ativo)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',  -- troque por um UUID real
  'Top Show Music',
  'topshow',
  'pro',
  TRUE
);

-- 2. Criar a editora principal
INSERT INTO editoras (id, tenant_id, razao_social, nome_fantasia, cnpj, pais, status)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'TOP SHOW MUSIC LIMIT',
  'Top Show Music',
  '00.000.000/0001-00',  -- preencher com CNPJ real
  'BR',
  'ativo'
);

-- 3. Vincular editora ao tenant
UPDATE tenants
SET editora_master_id = 'bbbbbbbb-0000-0000-0000-000000000001'
WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- 4. Criar o usuário master
-- auth_user_id será vinculado após criar usuário no Supabase Auth → Authentication → Users
INSERT INTO usuarios (
  id, tenant_id, auth_user_id, email, cpf, nome, role, editora_id, ativo
)
VALUES (
  gen_random_uuid(),
  'aaaaaaaa-0000-0000-0000-000000000001',
  NULL,                                      -- vincular após criar em Authentication > Users
  'admin@topshowmusic.com.br',
  NULL,                                      -- preencher com CPF do admin quando criar login
  'Administrador Master',
  'master',
  'bbbbbbbb-0000-0000-0000-000000000001',
  TRUE
);

-- 5. Criar perfis padrão
INSERT INTO perfis (tenant_id, nome, role, permissoes, ativo) VALUES
('aaaaaaaa-0000-0000-0000-000000000001', 'Master',              'master',             '{"all": true}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Administrador',       'admin',              '{"all": true}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Editora Administrada','editora_administrada','{"obras": ["read","write"], "titulares": ["read","write"], "contratos": ["read","write"], "relatorios": ["read"]}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Autor / Titular',     'autor',              '{"portal": ["read"], "cc_titular": ["read"], "prestacao_contas": ["read"]}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Financeiro',          'financeiro',         '{"financeiro": ["read","write"], "distribuicao": ["read","write"], "cc_obra": ["read","write"], "cc_titular": ["read","write"]}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Jurídico',            'juridico',           '{"contratos": ["read","write"], "autorizacoes": ["read","write"], "modelos_juridicos": ["read","write"]}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Atendimento',         'atendimento',        '{"titulares": ["read","write"], "obras": ["read"], "contratos": ["read"]}', TRUE);

