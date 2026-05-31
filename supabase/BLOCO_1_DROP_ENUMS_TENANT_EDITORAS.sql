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
