-- ============================================================
-- 026_rbac_roles_usuarios_editoras.sql
-- RBAC Base:
--   1. Adiciona super_admin ao ENUM role_usuario
--   2. Cria tabela usuarios_editoras (M:N usuario ↔ editora)
--   3. Migra vínculos existentes (usuarios.editora_id → usuarios_editoras)
--   4. Cria fn_minhas_editoras_ids() — helper para RLS por editora
-- ============================================================

-- ── 1. Adicionar super_admin ao ENUM role_usuario ───────────
-- Preserva todos os valores existentes.
-- super_admin = administração global/técnica do SaaS.
-- Não representa a Top Show Music (que é role 'master').
ALTER TYPE role_usuario ADD VALUE IF NOT EXISTS 'super_admin';

-- ── 2. Criar tabela usuarios_editoras (M:N) ─────────────────
-- Um usuário pode estar vinculado a múltiplas editoras.
-- Necessário para colaboradores multi-editora e para RLS
-- que restringe editora_administrada apenas à(s) sua(s) editora(s).
CREATE TABLE IF NOT EXISTS usuarios_editoras (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID        NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  editora_id  UUID        NOT NULL REFERENCES editoras(id)  ON DELETE CASCADE,
  tenant_id   UUID        NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, editora_id)
);

COMMENT ON TABLE  usuarios_editoras IS
  'Vínculo M:N entre usuários e editoras. Suporta colaboradores multi-editora e '
  'RLS granular: editora_administrada só acessa dados das editoras aqui vinculadas.';
COMMENT ON COLUMN usuarios_editoras.usuario_id IS 'Usuário do sistema.';
COMMENT ON COLUMN usuarios_editoras.editora_id IS 'Editora à qual o usuário está vinculado.';

-- ── 3. Migrar vínculos existentes (usuarios.editora_id) ─────
-- Backward-compat: a coluna editora_id em usuarios NÃO é removida.
-- Apenas os vínculos existentes são espelhados na nova tabela.
INSERT INTO usuarios_editoras (usuario_id, editora_id, tenant_id)
SELECT id, editora_id, tenant_id
FROM   usuarios
WHERE  editora_id IS NOT NULL
ON CONFLICT (usuario_id, editora_id) DO NOTHING;

-- ── 4. Função auxiliar: editoras vinculadas ao usuário logado
-- SECURITY DEFINER: executa como dono da função (ignora RLS interno).
-- Retorna array vazio ({}) se o usuário não tiver editoras vinculadas.
CREATE OR REPLACE FUNCTION fn_minhas_editoras_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT ue.editora_id
      FROM   usuarios_editoras ue
      JOIN   usuarios u ON u.id = ue.usuario_id
      WHERE  u.auth_user_id = auth.uid()
    ),
    '{}'::UUID[]
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION fn_minhas_editoras_ids IS
  'Retorna array com IDs de editoras às quais o usuário logado está vinculado. '
  'SECURITY DEFINER: bypass de RLS para leitura interna (evita recursão). '
  'Retorna array vazio se sem vínculos.';

-- ── 5. Índices ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usuarios_editoras_usuario ON usuarios_editoras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_editoras_editora ON usuarios_editoras(editora_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_editoras_tenant  ON usuarios_editoras(tenant_id);

-- ── 6. RLS ───────────────────────────────────────────────────
ALTER TABLE usuarios_editoras ENABLE ROW LEVEL SECURITY;

-- Todos do tenant podem ver os vínculos (transparência interna)
CREATE POLICY "ue_select" ON usuarios_editoras FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());

-- Apenas admins gerenciam vínculos
CREATE POLICY "ue_write" ON usuarios_editoras FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('super_admin', 'master', 'admin')
  );
