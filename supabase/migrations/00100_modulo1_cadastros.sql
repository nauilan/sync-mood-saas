-- ============================================================
-- MIGRATION 00100 — MODULO 1 CADASTROS
-- Sync Mood Gestao Inteligente — Multi-Tenant
-- ============================================================

-- Extensoes necessarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE escopo_perfil AS ENUM ('master', 'administrada', 'autor', 'financeiro', 'juridico', 'operacional');
CREATE TYPE tipo_pessoa AS ENUM ('PF', 'PJ');
CREATE TYPE funcao_titular AS ENUM (
  'CA',                   -- autor/compositor
  'V',                    -- versionista
  'AD',                   -- adaptador
  'cessionario_pf',       -- cessionario PF
  'CI',                   -- herdeiro
  'I',                    -- interprete
  'E',                    -- editora original
  'AM',                   -- editora administradora
  'SE',                   -- subeditora
  'cessionario_pj',       -- cessionario PJ
  'gravadora',
  'produtora_fono',       -- produtora fonografica
  'emissora_tv',
  'plataforma_digital',
  'produtora_audiovisual',
  'cliente',
  'agencia'
);
CREATE TYPE tipo_contato AS ENUM ('telefone', 'whatsapp', 'email');
CREATE TYPE tipo_conta_bancaria_m1 AS ENUM ('corrente', 'poupanca', 'pagamento', 'salario');
CREATE TYPE tipo_pix AS ENUM ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria');
CREATE TYPE tipo_documento_m1 AS ENUM ('rg', 'cpf', 'cnpj', 'passaporte', 'cnh', 'contrato_social', 'outro');

-- ============================================================
-- EDITORAS ADMINISTRADAS
-- ============================================================
CREATE TABLE editoras_administradas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo              TEXT NOT NULL UNIQUE,
  razao_social        TEXT NOT NULL,
  nome_fantasia       TEXT NOT NULL,
  cnpj                TEXT UNIQUE,
  logo_url            TEXT,
  ativa               BOOLEAN NOT NULL DEFAULT true,
  administradora_id   UUID REFERENCES editoras_administradas(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_editoras_administradas_administradora ON editoras_administradas(administradora_id);

-- ============================================================
-- PERFIS DE ACESSO
-- ============================================================
CREATE TABLE perfis_acesso (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo              TEXT NOT NULL UNIQUE,
  nome                TEXT NOT NULL,
  escopo              escopo_perfil NOT NULL,
  permissoes_json     JSONB NOT NULL DEFAULT '{}'
);

-- Perfis padrao
INSERT INTO perfis_acesso (codigo, nome, escopo, permissoes_json) VALUES
  ('MASTER', 'Master / Administradora', 'master', '{"all": true}'),
  ('ADMINISTRADA', 'Editora Administrada', 'administrada', '{"titulares": true, "contratos": true, "obras": true}'),
  ('AUTOR', 'Autor / Compositor', 'autor', '{"obras": "read", "contratos": "read", "financeiro": "read"}'),
  ('FINANCEIRO', 'Financeiro', 'financeiro', '{"recebimentos": true, "distribuicao": true, "pagamentos": true}'),
  ('JURIDICO', 'Juridico', 'juridico', '{"contratos": true, "autorizacoes": true, "documentos": true}'),
  ('OPERACIONAL', 'Operacional', 'operacional', '{"cadastros": true, "obras": true, "exportacoes": true}');

-- ============================================================
-- USUARIOS EDITORA (vinculo usuario <-> editora <-> perfil)
-- ============================================================
CREATE TABLE usuarios_editora (
  usuario_id   UUID NOT NULL,
  editora_id   UUID NOT NULL REFERENCES editoras_administradas(id) ON DELETE CASCADE,
  perfil_id    UUID NOT NULL REFERENCES perfis_acesso(id),
  PRIMARY KEY (usuario_id, editora_id)
);

-- ============================================================
-- TITULARES (nucleo)
-- ============================================================
CREATE TABLE titulares (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_titular   TEXT NOT NULL,           -- EDITAVEL (migracao legada)
  id_interno       TEXT GENERATED ALWAYS AS ('TIT-' || LPAD(SUBSTRING(id::text, 1, 8), 8, '0')) STORED,
  tipo_pessoa      tipo_pessoa NOT NULL,
  editora_id       UUID NOT NULL REFERENCES editoras_administradas(id) ON DELETE RESTRICT,
  ativo            BOOLEAN NOT NULL DEFAULT true,
  observacoes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (codigo_titular, editora_id)
);

CREATE INDEX idx_titulares_editora ON titulares(editora_id);
CREATE INDEX idx_titulares_ativo ON titulares(ativo);

-- ============================================================
-- TITULARES — PESSOA FISICA
-- ============================================================
CREATE TABLE titulares_pessoa_fisica (
  titular_id          UUID PRIMARY KEY REFERENCES titulares(id) ON DELETE CASCADE,
  nome_completo       TEXT NOT NULL,
  cpf                 TEXT UNIQUE,
  rg                  TEXT,
  data_nasc           DATE,
  nacionalidade       TEXT DEFAULT 'Brasileira',
  estado_civil        TEXT,
  profissao           TEXT,
  nome_artistico_principal TEXT,
  sociedade_autoral   TEXT,
  cae                 TEXT,
  ipi                 TEXT
);

CREATE INDEX idx_tpf_nome ON titulares_pessoa_fisica USING gin(nome_completo gin_trgm_ops);
CREATE INDEX idx_tpf_nome_artistico ON titulares_pessoa_fisica USING gin(nome_artistico_principal gin_trgm_ops);
CREATE INDEX idx_tpf_cpf ON titulares_pessoa_fisica(cpf);
CREATE INDEX idx_tpf_cae ON titulares_pessoa_fisica(cae);
CREATE INDEX idx_tpf_ipi ON titulares_pessoa_fisica(ipi);

-- ============================================================
-- TITULARES — PESSOA JURIDICA
-- ============================================================
CREATE TABLE titulares_pessoa_juridica (
  titular_id          UUID PRIMARY KEY REFERENCES titulares(id) ON DELETE CASCADE,
  razao_social        TEXT NOT NULL,
  nome_fantasia       TEXT,
  cnpj                TEXT UNIQUE,
  ie                  TEXT,     -- Inscricao estadual
  im                  TEXT,     -- Inscricao municipal
  responsavel_legal   TEXT,
  sociedade_autoral   TEXT,
  cae                 TEXT,
  ipi                 TEXT,
  site                TEXT
);

CREATE INDEX idx_tpj_razao_social ON titulares_pessoa_juridica USING gin(razao_social gin_trgm_ops);
CREATE INDEX idx_tpj_nome_fantasia ON titulares_pessoa_juridica USING gin(nome_fantasia gin_trgm_ops);
CREATE INDEX idx_tpj_cnpj ON titulares_pessoa_juridica(cnpj);
CREATE INDEX idx_tpj_cae ON titulares_pessoa_juridica(cae);
CREATE INDEX idx_tpj_ipi ON titulares_pessoa_juridica(ipi);

-- ============================================================
-- TITULARES — FUNCOES
-- ============================================================
CREATE TABLE titulares_funcoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titular_id  UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  funcao      funcao_titular NOT NULL,
  sigla       TEXT GENERATED ALWAYS AS (funcao::text) STORED,
  ativa       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (titular_id, funcao)
);

CREATE INDEX idx_titulares_funcoes_titular ON titulares_funcoes(titular_id);
CREATE INDEX idx_titulares_funcoes_funcao ON titulares_funcoes(funcao);

-- ============================================================
-- TITULARES — PSEUDONIMOS (so PF)
-- ============================================================
CREATE TABLE titulares_pseudonimos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titular_id   UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  pseudonimo   TEXT NOT NULL,
  principal    BOOLEAN NOT NULL DEFAULT false,
  ativo        BOOLEAN NOT NULL DEFAULT true,
  data_inicio  DATE,
  data_fim     DATE
);

CREATE INDEX idx_tps_titular ON titulares_pseudonimos(titular_id);
CREATE INDEX idx_tps_pseudonimo ON titulares_pseudonimos USING gin(pseudonimo gin_trgm_ops);

-- apenas 1 pseudonimo principal por titular
CREATE UNIQUE INDEX idx_tps_principal_unico ON titulares_pseudonimos(titular_id) WHERE principal = true AND ativo = true;

-- ============================================================
-- TITULARES — ENDERECOS
-- ============================================================
CREATE TABLE titulares_enderecos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titular_id  UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  cep         TEXT,
  endereco    TEXT,
  numero      TEXT,
  compl       TEXT,
  bairro      TEXT,
  cidade      TEXT,
  estado      TEXT,
  pais        TEXT DEFAULT 'Brasil',
  principal   BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_tend_titular ON titulares_enderecos(titular_id);

-- ============================================================
-- TITULARES — CONTATOS
-- ============================================================
CREATE TABLE titulares_contatos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titular_id  UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  tipo        tipo_contato NOT NULL,
  valor       TEXT NOT NULL,
  principal   BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_tcont_titular ON titulares_contatos(titular_id);
CREATE INDEX idx_tcont_email ON titulares_contatos(valor) WHERE tipo = 'email';

-- ============================================================
-- TITULARES — DOCUMENTOS
-- ============================================================
CREATE TABLE titulares_documentos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titular_id  UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  tipo        tipo_documento_m1 NOT NULL,
  numero      TEXT,
  url_arquivo TEXT,
  validade    DATE
);

CREATE INDEX idx_tdoc_titular ON titulares_documentos(titular_id);

-- ============================================================
-- TITULARES — DADOS BANCARIOS
-- ============================================================
CREATE TABLE titulares_dados_bancarios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titular_id      UUID NOT NULL REFERENCES titulares(id) ON DELETE CASCADE,
  banco           TEXT NOT NULL,
  agencia         TEXT,
  conta           TEXT,
  tipo_conta      tipo_conta_bancaria_m1,
  titular_conta   TEXT,
  cpf_cnpj_titular TEXT,
  pix_chave       TEXT,
  pix_tipo        tipo_pix,
  principal       BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_tbanco_titular ON titulares_dados_bancarios(titular_id);

-- ============================================================
-- TRIGGERS — updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_titulares_updated_at
  BEFORE UPDATE ON titulares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE editoras_administradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_pessoa_fisica ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_pessoa_juridica ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_pseudonimos ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE titulares_dados_bancarios ENABLE ROW LEVEL SECURITY;

-- Administradora ve todas as editoras e titulares
CREATE POLICY "administradora_ve_tudo" ON editoras_administradas
  FOR ALL USING (
    administradora_id IS NULL OR -- e a administradora raiz
    EXISTS (
      SELECT 1 FROM usuarios_editora ue
      JOIN perfis_acesso pa ON pa.id = ue.perfil_id
      WHERE ue.usuario_id = auth.uid()
        AND (pa.escopo = 'master' OR ue.editora_id = editoras_administradas.administradora_id)
    )
  );

-- Administrada ve apenas seus titulares
CREATE POLICY "editora_ve_seus_titulares" ON titulares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios_editora ue
      WHERE ue.usuario_id = auth.uid()
        AND ue.editora_id = titulares.editora_id
    )
  );

-- Autor ve apenas a si mesmo
CREATE POLICY "autor_ve_a_si_mesmo_pf" ON titulares_pessoa_fisica
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM titulares t
      WHERE t.id = titular_id
        AND t.ativo = true
    )
  );

-- Policies derivadas (tabelas filhas seguem a mesma logica do titular pai)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'titulares_pessoa_juridica', 'titulares_funcoes', 'titulares_pseudonimos',
    'titulares_enderecos', 'titulares_contatos', 'titulares_documentos', 'titulares_dados_bancarios'
  ] LOOP
    EXECUTE format('
      CREATE POLICY "acesso_via_titular" ON %I
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM titulares t
          JOIN usuarios_editora ue ON ue.editora_id = t.editora_id
          WHERE t.id = titular_id AND ue.usuario_id = auth.uid()
        )
      )', tbl);
  END LOOP;
END;
$$;
