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
