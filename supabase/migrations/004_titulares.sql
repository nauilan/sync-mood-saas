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
