-- ============================================================
-- 019_fix_rls_tenant_vs_auth_uid.sql
-- Corrige todas as RLS que usavam auth.uid() como tenant_id.
-- Usa verificações condicionais para evitar erros em tabelas
-- que podem não existir em todos os ambientes.
-- ============================================================

-- ── 1. Função auxiliar para retornar o tenant_id do usuário logado ──────────
CREATE OR REPLACE FUNCTION meu_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM usuarios
  WHERE auth_user_id = auth.uid()
  LIMIT 1
$$;

-- ── 2. Macro helper para DROP+CREATE policy apenas se a tabela existir ───────
-- Usamos DO $$ ... $$ para cada tabela, evitando erros em tabelas ausentes.

-- obras
DO $$ BEGIN
  IF to_regclass('public.obras') IS NOT NULL THEN
    DROP POLICY IF EXISTS "obras_tenant" ON obras;
    CREATE POLICY "obras_tenant" ON obras
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- obras_titulos
DO $$ BEGIN
  IF to_regclass('public.obras_titulos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "obras_titulos_tenant" ON obras_titulos;
    CREATE POLICY "obras_titulos_tenant" ON obras_titulos
      FOR ALL USING (
        obra_id IN (SELECT id FROM obras WHERE tenant_id = meu_tenant_id())
      );
  END IF;
END $$;

-- obras_letras
DO $$ BEGIN
  IF to_regclass('public.obras_letras') IS NOT NULL THEN
    DROP POLICY IF EXISTS "obras_letras_tenant" ON obras_letras;
    CREATE POLICY "obras_letras_tenant" ON obras_letras
      FOR ALL USING (
        obra_id IN (SELECT id FROM obras WHERE tenant_id = meu_tenant_id())
      );
  END IF;
END $$;

-- obras_links
DO $$ BEGIN
  IF to_regclass('public.obras_links') IS NOT NULL THEN
    DROP POLICY IF EXISTS "obras_links_tenant" ON obras_links;
    CREATE POLICY "obras_links_tenant" ON obras_links
      FOR ALL USING (
        obra_id IN (SELECT id FROM obras WHERE tenant_id = meu_tenant_id())
      );
  END IF;
END $$;

-- obras_links_titulares  (tem tenant_id direto)
DO $$ BEGIN
  IF to_regclass('public.obras_links_titulares') IS NOT NULL THEN
    DROP POLICY IF EXISTS "obras_links_titulares_tenant" ON obras_links_titulares;
    CREATE POLICY "obras_links_titulares_tenant" ON obras_links_titulares
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- fonogramas
DO $$ BEGIN
  IF to_regclass('public.fonogramas') IS NOT NULL THEN
    DROP POLICY IF EXISTS "fonogramas_tenant" ON fonogramas;
    CREATE POLICY "fonogramas_tenant" ON fonogramas
      FOR ALL USING (
        obra_id IN (SELECT id FROM obras WHERE tenant_id = meu_tenant_id())
      );
  END IF;
END $$;

-- obras_contratos
DO $$ BEGIN
  IF to_regclass('public.obras_contratos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "obras_contratos_tenant" ON obras_contratos;
    CREATE POLICY "obras_contratos_tenant" ON obras_contratos
      FOR ALL USING (
        obra_id IN (SELECT id FROM obras WHERE tenant_id = meu_tenant_id())
      );
  END IF;
END $$;

-- obras_exportacoes_log
DO $$ BEGIN
  IF to_regclass('public.obras_exportacoes_log') IS NOT NULL THEN
    DROP POLICY IF EXISTS "obras_exportacoes_log_tenant" ON obras_exportacoes_log;
    CREATE POLICY "obras_exportacoes_log_tenant" ON obras_exportacoes_log
      FOR ALL USING (
        obra_id IN (SELECT id FROM obras WHERE tenant_id = meu_tenant_id())
      );
  END IF;
END $$;

-- obras_divergencias
DO $$ BEGIN
  IF to_regclass('public.obras_divergencias') IS NOT NULL THEN
    DROP POLICY IF EXISTS "obras_divergencias_tenant" ON obras_divergencias;
    CREATE POLICY "obras_divergencias_tenant" ON obras_divergencias
      FOR ALL USING (
        obra_id IN (SELECT id FROM obras WHERE tenant_id = meu_tenant_id())
      );
  END IF;
END $$;

-- titulares
DO $$ BEGIN
  IF to_regclass('public.titulares') IS NOT NULL THEN
    DROP POLICY IF EXISTS "titulares_tenant" ON titulares;
    CREATE POLICY "titulares_tenant" ON titulares
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- editoras
DO $$ BEGIN
  IF to_regclass('public.editoras') IS NOT NULL THEN
    DROP POLICY IF EXISTS "editoras_tenant" ON editoras;
    CREATE POLICY "editoras_tenant" ON editoras
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- editoras_administradas
DO $$ BEGIN
  IF to_regclass('public.editoras_administradas') IS NOT NULL THEN
    DROP POLICY IF EXISTS "editoras_administradas_rls" ON editoras_administradas;
    CREATE POLICY "editoras_administradas_rls" ON editoras_administradas
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- recebimentos
DO $$ BEGIN
  IF to_regclass('public.recebimentos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "recebimentos_tenant"      ON recebimentos;
    DROP POLICY IF EXISTS "recebimentos_select_auth" ON recebimentos;
    DROP POLICY IF EXISTS "recebimentos_insert_auth" ON recebimentos;
    DROP POLICY IF EXISTS "recebimentos_update_auth" ON recebimentos;
    CREATE POLICY "recebimentos_tenant" ON recebimentos
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- contas_correntes_obras
DO $$ BEGIN
  IF to_regclass('public.contas_correntes_obras') IS NOT NULL THEN
    DROP POLICY IF EXISTS "master_select_cco"              ON contas_correntes_obras;
    DROP POLICY IF EXISTS "contas_correntes_obras_tenant"  ON contas_correntes_obras;
    CREATE POLICY "contas_correntes_obras_tenant" ON contas_correntes_obras
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- cc_obras_movimentos
DO $$ BEGIN
  IF to_regclass('public.cc_obras_movimentos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "cc_obras_movimentos_tenant" ON cc_obras_movimentos;
    CREATE POLICY "cc_obras_movimentos_tenant" ON cc_obras_movimentos
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- contratos
DO $$ BEGIN
  IF to_regclass('public.contratos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "contratos_tenant"       ON contratos;
    DROP POLICY IF EXISTS "contratos_select_auth"  ON contratos;
    DROP POLICY IF EXISTS "contratos_insert_auth"  ON contratos;
    DROP POLICY IF EXISTS "contratos_update_auth"  ON contratos;
    CREATE POLICY "contratos_tenant" ON contratos
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- negocios_editoriais
DO $$ BEGIN
  IF to_regclass('public.negocios_editoriais') IS NOT NULL THEN
    DROP POLICY IF EXISTS "negocios_editoriais_tenant" ON negocios_editoriais;
    CREATE POLICY "negocios_editoriais_tenant" ON negocios_editoriais
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- obras_analitico
DO $$ BEGIN
  IF to_regclass('public.obras_analitico') IS NOT NULL THEN
    DROP POLICY IF EXISTS "obras_analitico_rls" ON obras_analitico;
    CREATE POLICY "obras_analitico_rls" ON obras_analitico
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- obras_links_titulares_direitos (tem tenant_id direto)
DO $$ BEGIN
  IF to_regclass('public.obras_links_titulares_direitos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "obras_links_titulares_direitos_rls" ON obras_links_titulares_direitos;
    CREATE POLICY "obras_links_titulares_direitos_rls" ON obras_links_titulares_direitos
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- tipos_direito (tenant_id nullable = seed global)
DO $$ BEGIN
  IF to_regclass('public.tipos_direito') IS NOT NULL THEN
    DROP POLICY IF EXISTS "tipos_direito_rls" ON tipos_direito;
    CREATE POLICY "tipos_direito_rls" ON tipos_direito
      FOR SELECT USING (tenant_id IS NULL OR tenant_id = meu_tenant_id());
  END IF;
END $$;

-- tipos_participante (sem tenant_id — tabela global, qualquer autenticado pode ler)
DO $$ BEGIN
  IF to_regclass('public.tipos_participante') IS NOT NULL THEN
    DROP POLICY IF EXISTS "tipos_participante_rls" ON tipos_participante;
    CREATE POLICY "tipos_participante_rls" ON tipos_participante
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- usuarios
DO $$ BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL THEN
    DROP POLICY IF EXISTS "usuarios_tenant" ON usuarios;
    CREATE POLICY "usuarios_tenant" ON usuarios
      FOR ALL USING (
        tenant_id = meu_tenant_id()
        OR auth_user_id = auth.uid()
      );
  END IF;
END $$;

-- autorizacoes
DO $$ BEGIN
  IF to_regclass('public.autorizacoes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "autorizacoes_tenant" ON autorizacoes;
    CREATE POLICY "autorizacoes_tenant" ON autorizacoes
      FOR ALL USING (tenant_id = meu_tenant_id());
  END IF;
END $$;

-- autorizacoes_items
DO $$ BEGIN
  IF to_regclass('public.autorizacoes_items') IS NOT NULL THEN
    DROP POLICY IF EXISTS "autorizacoes_items_tenant" ON autorizacoes_items;
    CREATE POLICY "autorizacoes_items_tenant" ON autorizacoes_items
      FOR ALL USING (
        autorizacao_id IN (SELECT id FROM autorizacoes WHERE tenant_id = meu_tenant_id())
      );
  END IF;
END $$;

-- autorizacoes_historico
DO $$ BEGIN
  IF to_regclass('public.autorizacoes_historico') IS NOT NULL THEN
    DROP POLICY IF EXISTS "autorizacoes_historico_tenant" ON autorizacoes_historico;
    CREATE POLICY "autorizacoes_historico_tenant" ON autorizacoes_historico
      FOR ALL USING (
        autorizacao_id IN (SELECT id FROM autorizacoes WHERE tenant_id = meu_tenant_id())
      );
  END IF;
END $$;

-- ── 3. Confirmar RLS ativado nas tabelas principais ───────────────────────────
DO $$ BEGIN
  IF to_regclass('public.obras')             IS NOT NULL THEN ALTER TABLE obras             ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.obras_links')       IS NOT NULL THEN ALTER TABLE obras_links       ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.titulares')         IS NOT NULL THEN ALTER TABLE titulares         ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.editoras')          IS NOT NULL THEN ALTER TABLE editoras          ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.recebimentos')      IS NOT NULL THEN ALTER TABLE recebimentos      ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.contratos')         IS NOT NULL THEN ALTER TABLE contratos         ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.negocios_editoriais')     IS NOT NULL THEN ALTER TABLE negocios_editoriais     ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.obras_analitico')         IS NOT NULL THEN ALTER TABLE obras_analitico         ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.cc_obras_movimentos')     IS NOT NULL THEN ALTER TABLE cc_obras_movimentos     ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.tipos_direito')           IS NOT NULL THEN ALTER TABLE tipos_direito           ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.tipos_participante')      IS NOT NULL THEN ALTER TABLE tipos_participante      ENABLE ROW LEVEL SECURITY; END IF;
  IF to_regclass('public.usuarios')                IS NOT NULL THEN ALTER TABLE usuarios                ENABLE ROW LEVEL SECURITY; END IF;
END $$;
