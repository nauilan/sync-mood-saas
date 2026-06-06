-- ============================================================
-- 027_rbac_rls_ajustes.sql
-- RLS: ajustes pós-RBAC
--   1. Remove editora_administrada de contratos_write
--      → usa solicitacoes_contratos (028) a partir de agora
--   2. Remove editora_administrada de obras_write
--      → usa solicitacoes_obras (028) a partir de agora
--   3. Restringe editoras_write de editora_administrada
--      → apenas as editoras vinculadas em usuarios_editoras
--   4. Adiciona super_admin às políticas de usuarios insert/update
-- Requer: 026 já aplicada (fn_minhas_editoras_ids disponível).
-- ── Nota: middleware.ts (proteção de rotas sem login) será ──
--    implementado em código (apps/web/middleware.ts) na Fase 1
--    do middleware — não há SQL necessário para isso.
-- ============================================================

-- ── 1. contratos_write — remove editora_administrada ────────
-- editora_administrada não pode mais criar/editar contratos oficiais.
-- O fluxo correto passa por solicitacoes_contratos (migration 028).
DROP POLICY IF EXISTS "contratos_write" ON contratos;
CREATE POLICY "contratos_write" ON contratos FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('super_admin', 'master', 'admin', 'juridico')
  );

-- ── 2. obras_write — remove editora_administrada ────────────
-- editora_administrada não pode mais criar/editar obras oficiais.
-- O fluxo correto passa por solicitacoes_obras (migration 028).
DROP POLICY IF EXISTS "obras_write" ON obras;
CREATE POLICY "obras_write" ON obras FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('super_admin', 'master', 'admin', 'atendimento')
  );

-- ── 3. editoras_write — restringe editora_administrada ──────
-- master/admin/super_admin → qualquer editora do tenant
-- editora_administrada     → apenas editoras vinculadas a ela
DROP POLICY IF EXISTS "editoras_write" ON editoras;
CREATE POLICY "editoras_write" ON editoras FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND (
      fn_meu_role() IN ('super_admin', 'master', 'admin')
      OR (
        fn_meu_role() = 'editora_administrada'
        AND id = ANY(fn_minhas_editoras_ids())
      )
    )
  );

-- ── 4. usuarios_insert — adiciona super_admin ───────────────
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT
  WITH CHECK (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('super_admin', 'master', 'admin')
  );

-- ── 5. usuarios_update — adiciona super_admin ───────────────
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('super_admin', 'master', 'admin')
  );
