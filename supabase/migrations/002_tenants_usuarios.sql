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
