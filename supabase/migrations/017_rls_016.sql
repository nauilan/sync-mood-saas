-- ============================================================
-- 017_rls_016.sql — RLS para tabelas criadas nas migrations 015 e 016
--
-- PROBLEMA CORRIGIDO:
--   As policies geradas em 015 e 016 usavam um subquery inline e
--   não distinguiam SELECT de WRITE, permitindo que qualquer usuário
--   do tenant gravasse em tabelas computadas (obras_analitico).
--
-- PADRÃO APLICADO (igual a 010_rls.sql):
--   SELECT  → fn_meu_tenant_id()  (todos os roles do tenant)
--   WRITE   → fn_meu_tenant_id() + role IN (...)
--   Tabelas globais sem tenant_id → SELECT authenticated only
--
-- EXECUÇÃO: rodar após 015 e 016 já estarem aplicadas.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- SEÇÃO 1 — TIPOS_PARTICIPANTE
-- Tabela global (sem tenant_id). Nenhum usuário pode escrever
-- via client — apenas service_role (bridge) faz alterações.
-- ────────────────────────────────────────────────────────────
ALTER TABLE tipos_participante ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer usuário autenticado
CREATE POLICY "tipos_participante_select" ON tipos_participante FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Escrita: bloqueada para usuários comuns (apenas service_role bypassa)
-- Nenhuma policy de INSERT/UPDATE/DELETE = negação por padrão


-- ────────────────────────────────────────────────────────────
-- SEÇÃO 2 — TIPOS_DIREITO
-- tenant_id NULL  = tipo global (todos os tenants vêem)
-- tenant_id = X   = tipo customizado (só o tenant X vê/edita)
-- ────────────────────────────────────────────────────────────
ALTER TABLE tipos_direito ENABLE ROW LEVEL SECURITY;

-- SELECT: tipo global (NULL) OU do meu tenant
CREATE POLICY "tipos_direito_select" ON tipos_direito FOR SELECT
  USING (
    tenant_id IS NULL
    OR tenant_id = fn_meu_tenant_id()
  );

-- INSERT: apenas master/admin podem criar tipos customizados
CREATE POLICY "tipos_direito_insert" ON tipos_direito FOR INSERT
  WITH CHECK (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('master', 'admin')
  );

-- UPDATE/DELETE: apenas no próprio tenant, nunca nos globais
CREATE POLICY "tipos_direito_update" ON tipos_direito FOR UPDATE
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('master', 'admin')
  );

CREATE POLICY "tipos_direito_delete" ON tipos_direito FOR DELETE
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('master', 'admin')
  );


-- ────────────────────────────────────────────────────────────
-- SEÇÃO 3 — OBRAS_LINKS_TITULARES_DIREITOS
-- Corrige a policy de 016 (era ALL sem distinção de role)
-- ────────────────────────────────────────────────────────────

-- Remove policy anterior (criada inline na 016)
DROP POLICY IF EXISTS "tenant_isolation_olt_direitos" ON obras_links_titulares_direitos;

-- SELECT: qualquer role do tenant
CREATE POLICY "olt_direitos_select" ON obras_links_titulares_direitos FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());

-- WRITE: roles de negócio (bridge usa service_role, bypassa RLS)
CREATE POLICY "olt_direitos_write" ON obras_links_titulares_direitos FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('master', 'admin', 'editora_administrada', 'atendimento')
  );


-- ────────────────────────────────────────────────────────────
-- SEÇÃO 4 — OBRAS_ANALITICO
-- Tabela computada pela bridge. Usuários comuns só LÊEM.
-- Escrita é responsabilidade exclusiva da bridge (service_role).
-- Corrige a policy de 016 (era ALL sem distinção de role).
-- ────────────────────────────────────────────────────────────

-- Remove policy anterior (criada inline na 016)
DROP POLICY IF EXISTS "tenant_isolation_analitico" ON obras_analitico;

-- SELECT: qualquer role do tenant, mas autor só vê obras ligadas a si
-- (simplificado aqui — restrição fina pode ser adicionada depois)
CREATE POLICY "analitico_select" ON obras_analitico FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());

-- Autor: só vê linhas onde é o participante
CREATE POLICY "analitico_select_autor" ON obras_analitico FOR SELECT
  USING (
    fn_meu_role() = 'autor'
    AND titular_id = fn_meu_titular_id()
  );

-- WRITE: apenas roles administrativos podem gravar manualmente
-- (a bridge usa service_role, que bypassa tudo)
CREATE POLICY "analitico_write" ON obras_analitico FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('master', 'admin')
  );


-- ────────────────────────────────────────────────────────────
-- SEÇÃO 5 — NEGOCIOS_EDITORIAIS (criada na 015)
-- Corrige a policy que era ALL sem distinção de role.
-- ────────────────────────────────────────────────────────────

-- Remove policy anterior (criada inline na 015)
DROP POLICY IF EXISTS "tenant_isolation_negocios" ON negocios_editoriais;

-- SELECT: todos os roles do tenant
CREATE POLICY "negocios_select" ON negocios_editoriais FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());

-- WRITE: apenas master/admin/editora_administrada/juridico
CREATE POLICY "negocios_write" ON negocios_editoriais FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('master', 'admin', 'editora_administrada', 'juridico')
  );


-- ────────────────────────────────────────────────────────────
-- SEÇÃO 6 — BACKOFFICE_OBRAS_STATUS (migration 012/014)
-- Verificar se existe e adicionar RLS se ainda não tiver.
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'backoffice_obras_status'
  ) THEN
    EXECUTE 'ALTER TABLE backoffice_obras_status ENABLE ROW LEVEL SECURITY';
    EXECUTE '
      CREATE POLICY "backoffice_select" ON backoffice_obras_status FOR SELECT
        USING (tenant_id = fn_meu_tenant_id())
    ';
    EXECUTE '
      CREATE POLICY "backoffice_write" ON backoffice_obras_status FOR ALL
        USING (
          tenant_id = fn_meu_tenant_id()
          AND fn_meu_role() IN (''master'', ''admin'', ''financeiro'')
        )
    ';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- SEÇÃO 7 — EDITORAS_ADMINISTRADAS (migration 014)
-- Verificar se existe e adicionar RLS se ainda não tiver.
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'editoras_administradas'
  ) THEN
    EXECUTE 'ALTER TABLE editoras_administradas ENABLE ROW LEVEL SECURITY';
    EXECUTE '
      CREATE POLICY "edit_admin_select" ON editoras_administradas FOR SELECT
        USING (tenant_id = fn_meu_tenant_id())
    ';
    EXECUTE '
      CREATE POLICY "edit_admin_write" ON editoras_administradas FOR ALL
        USING (
          tenant_id = fn_meu_tenant_id()
          AND fn_meu_role() IN (''master'', ''admin'', ''editora_administrada'')
        )
    ';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL — lista tabelas sem RLS ativo
-- Cole no SQL Editor do Supabase para confirmar cobertura:
-- ────────────────────────────────────────────────────────────
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND rowsecurity = false
-- ORDER BY tablename;
