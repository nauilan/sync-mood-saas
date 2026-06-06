-- ============================================================
-- VALIDAÇÃO PRÉ-APPLY: Migrations 026 + 027 + 028
-- Sync Mood — RBAC + usuarios_editoras + Editora Administrada
-- ============================================================
-- COMO USAR:
--   Cole este script no Supabase SQL Editor e execute.
--   Cada query retorna uma coluna "resultado" com ✅ OK ou ❌ FALTA.
--   Nenhuma query altera dados — 100% read-only.
--
-- COMO INTERPRETAR:
--   ✅ OK      → condição atendida, migration funcionou
--   ❌ FALTA   → condição NÃO atendida, algo não foi criado
--   ❌ RISCO   → problema de segurança — corrigir imediatamente
--   ⚠️ aviso   → informativo, verificar manualmente
--   ℹ️ info    → DIVERGÊNCIA ARQUITETURAL ESPERADA E APROVADA — NÃO É FALHA
--   (linha)    → detalhe informativo, não é pass/fail
--
-- IMPORTANTE — 2 DIVERGÊNCIAS entre o checklist e as migrations:
--   • "solicitacoes_obras_autores" → na migration o nome é
--     "solicitacoes_obras_titulares" (mais genérico: autores,
--     coautores, versionistas etc). A query checa o nome correto.
--   • "solicitacoes_documentos" → NÃO foi criada como tabela
--     separada. Os campos de documento ficam dentro de
--     solicitacoes_contratos: url_documento + nome_documento.
--     A query valida essas colunas no lugar da tabela.
-- ============================================================


-- ============================================================
-- BLOCO 1: Migration 026 — ENUM + usuarios_editoras + função
-- ============================================================

-- 1.1  ENUM role_usuario recebeu 'super_admin'
SELECT
  '1.1 ENUM role_usuario → super_admin' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'role_usuario' AND e.enumlabel = 'super_admin'
    ) THEN '✅ OK'
    ELSE '❌ FALTA — super_admin não está no ENUM'
  END AS resultado;

-- 1.2  Todos os valores atuais do ENUM role_usuario
SELECT
  '1.2 Valores do ENUM role_usuario (informativo)' AS check_item,
  e.enumlabel AS valor,
  e.enumsortorder AS ordem
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'role_usuario'
ORDER BY e.enumsortorder;

-- 1.3  Tabela usuarios_editoras existe
SELECT
  '1.3 Tabela usuarios_editoras existe' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'usuarios_editoras'
    ) THEN '✅ OK'
    ELSE '❌ FALTA'
  END AS resultado;

-- 1.4  Colunas de usuarios_editoras (informativo)
SELECT
  '1.4 Colunas de usuarios_editoras (informativo)' AS check_item,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios_editoras'
ORDER BY ordinal_position;

-- 1.5  RLS ativo em usuarios_editoras
SELECT
  '1.5 RLS ativo em usuarios_editoras' AS check_item,
  CASE
    WHEN (SELECT relrowsecurity FROM pg_class
          WHERE relname = 'usuarios_editoras'
            AND relnamespace = 'public'::regnamespace)
    THEN '✅ OK'
    ELSE '❌ FALTA — ALTER TABLE usuarios_editoras ENABLE ROW LEVEL SECURITY não rodou'
  END AS resultado;

-- 1.6  Policies de usuarios_editoras (ue_select + ue_write)
SELECT
  '1.6 Policies de usuarios_editoras' AS check_item,
  policyname,
  cmd AS operacao
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'usuarios_editoras'
ORDER BY policyname;

-- 1.7  Índices de usuarios_editoras
SELECT
  '1.7 Índices de usuarios_editoras' AS check_item,
  indexname,
  CASE WHEN indexname IN (
    'idx_usuarios_editoras_usuario',
    'idx_usuarios_editoras_editora',
    'idx_usuarios_editoras_tenant'
  ) THEN '✅ OK' ELSE '⚠️ inesperado' END AS resultado
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'usuarios_editoras'
ORDER BY indexname;

-- 1.8  Migração de vínculos: quantos registros foram migrados
SELECT
  '1.8 Vínculos migrados (usuarios.editora_id → usuarios_editoras)' AS check_item,
  COUNT(*) AS total_vinculos,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ OK — registros migrados'
    ELSE '⚠️ Zero registros — pode ser normal se usuarios.editora_id estava vazio'
  END AS resultado
FROM usuarios_editoras;

-- 1.9  Função fn_minhas_editoras_ids existe
SELECT
  '1.9 Função fn_minhas_editoras_ids existe' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'fn_minhas_editoras_ids' AND n.nspname = 'public'
    ) THEN '✅ OK'
    ELSE '❌ FALTA'
  END AS resultado;

-- 1.10  Função fn_minhas_editoras_ids é SECURITY DEFINER
SELECT
  '1.10 fn_minhas_editoras_ids é SECURITY DEFINER' AS check_item,
  CASE
    WHEN (
      SELECT p.prosecdef FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'fn_minhas_editoras_ids' AND n.nspname = 'public'
      LIMIT 1
    ) THEN '✅ OK'
    ELSE '❌ FALTA — risco de recursão infinita no RLS'
  END AS resultado;


-- ============================================================
-- BLOCO 2: Migration 027 — RLS ajustes
-- ============================================================

-- 2.1  contratos_write NÃO contém 'editora_administrada'
SELECT
  '2.1 contratos_write: editora_administrada REMOVIDA' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'contratos'
        AND policyname = 'contratos_write'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'contratos'
        AND policyname = 'contratos_write'
        AND qual LIKE '%editora_administrada%'
    ) THEN '✅ OK — editora_administrada não tem write em contratos oficiais'
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'contratos'
        AND policyname = 'contratos_write'
    ) THEN '❌ FALTA — policy contratos_write não existe'
    ELSE '❌ RISCO — editora_administrada ainda aparece em contratos_write'
  END AS resultado;

-- 2.2  obras_write NÃO contém 'editora_administrada'
SELECT
  '2.2 obras_write: editora_administrada REMOVIDA' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'obras'
        AND policyname = 'obras_write'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'obras'
        AND policyname = 'obras_write'
        AND qual LIKE '%editora_administrada%'
    ) THEN '✅ OK — editora_administrada não tem write em obras oficiais'
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'obras'
        AND policyname = 'obras_write'
    ) THEN '❌ FALTA — policy obras_write não existe'
    ELSE '❌ RISCO — editora_administrada ainda aparece em obras_write'
  END AS resultado;

-- 2.3  editoras_write tem fn_minhas_editoras_ids (restrição por editora)
SELECT
  '2.3 editoras_write: restrição por editora para editora_administrada' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'editoras'
        AND policyname = 'editoras_write'
        AND qual LIKE '%fn_minhas_editoras_ids%'
    ) THEN '✅ OK — editora_administrada restrita às suas editoras'
    ELSE '❌ FALTA ou política não usa fn_minhas_editoras_ids'
  END AS resultado;

-- 2.4  usuarios_insert contém super_admin
SELECT
  '2.4 usuarios_insert: super_admin adicionado' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'usuarios'
        AND policyname = 'usuarios_insert'
        AND (qual LIKE '%super_admin%' OR with_check LIKE '%super_admin%')
    ) THEN '✅ OK'
    ELSE '❌ FALTA — super_admin não está em usuarios_insert'
  END AS resultado;

-- 2.5  usuarios_update contém super_admin
SELECT
  '2.5 usuarios_update: super_admin adicionado' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'usuarios'
        AND policyname = 'usuarios_update'
        AND qual LIKE '%super_admin%'
    ) THEN '✅ OK'
    ELSE '❌ FALTA — super_admin não está em usuarios_update'
  END AS resultado;

-- 2.6  Conteúdo atual das policies de contratos e obras (informativo)
SELECT
  '2.6 Policies atuais de contratos + obras (informativo)' AS check_item,
  tablename,
  policyname,
  cmd AS operacao,
  LEFT(qual, 120) AS condicao_resumida
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('contratos', 'obras')
  AND policyname IN ('contratos_write', 'obras_write')
ORDER BY tablename, policyname;


-- ============================================================
-- BLOCO 3: Migration 028 — ENUMs
-- ============================================================

-- 3.1  ENUMs novos existem
SELECT
  '3.1 ENUMs novos da migration 028' AS check_item,
  t.typname AS enum_name,
  CASE
    WHEN t.typname IS NOT NULL THEN '✅ OK'
    ELSE '❌ FALTA'
  END AS resultado
FROM (VALUES
  ('status_sol_contrato'),
  ('status_sol_obra'),
  ('acao_workflow')
) AS esperado(nome)
LEFT JOIN pg_type t ON t.typname = esperado.nome AND t.typtype = 'e';

-- 3.2  Valores do ENUM status_sol_contrato (informativo)
SELECT
  '3.2 Valores status_sol_contrato' AS check_item,
  e.enumlabel AS valor,
  e.enumsortorder AS ordem
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'status_sol_contrato'
ORDER BY e.enumsortorder;

-- 3.3  status_sol_contrato tem 'devolvido' (regra aprovada pelo usuário)
SELECT
  '3.3 status_sol_contrato tem devolvido' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'status_sol_contrato' AND e.enumlabel = 'devolvido'
    ) THEN '✅ OK'
    ELSE '❌ FALTA — status devolvido não existe no ENUM'
  END AS resultado;

-- 3.4  Valores do ENUM status_sol_obra (informativo)
SELECT
  '3.4 Valores status_sol_obra' AS check_item,
  e.enumlabel AS valor,
  e.enumsortorder AS ordem
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'status_sol_obra'
ORDER BY e.enumsortorder;

-- 3.5  status_sol_obra tem 'devolvida' (regra aprovada pelo usuário)
SELECT
  '3.5 status_sol_obra tem devolvida' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'status_sol_obra' AND e.enumlabel = 'devolvida'
    ) THEN '✅ OK'
    ELSE '❌ FALTA — status devolvida não existe no ENUM'
  END AS resultado;


-- ============================================================
-- BLOCO 4: Migration 028 — Tabelas criadas
-- ============================================================

-- 4.1  Checklist de tabelas novas
-- NOTA: "solicitacoes_obras_autores" do seu checklist foi criada
--       como "solicitacoes_obras_titulares" (nome mais genérico,
--       cobre autores + coautores + versionistas + adaptadores).
-- NOTA: "solicitacoes_documentos" NÃO foi criada como tabela
--       separada. Os campos url_documento e nome_documento
--       ficam dentro de solicitacoes_contratos. Ver check 4.3.
SELECT
  '4.1 Existência das tabelas da migration 028' AS check_item,
  esperado.nome AS tabela,
  CASE
    WHEN t.table_name IS NOT NULL THEN '✅ OK'
    ELSE '❌ FALTA'
  END AS resultado
FROM (VALUES
  ('solicitacoes_contratos'),
  ('solicitacoes_contratos_titulares'),
  ('solicitacoes_contratos_direitos'),
  ('solicitacoes_contratos_territorios'),
  ('solicitacoes_assinaturas'),
  ('solicitacoes_obras'),
  ('solicitacoes_obras_titulares'),   -- nome correto (não "autores")
  ('solicitacoes_obras_direitos'),
  ('solicitacoes_obras_territorios'),
  ('workflow_aprovacoes'),
  ('solicitacoes_historico')
) AS esperado(nome)
LEFT JOIN information_schema.tables t
  ON t.table_name = esperado.nome AND t.table_schema = 'public'
ORDER BY esperado.nome;

-- 4.2  DIVERGÊNCIA ESPERADA: solicitacoes_obras_autores → renomeada para titulares
-- Esta linha sempre mostra ℹ️ — não é falha, é decisão arquitetural aprovada.
SELECT
  '4.2 solicitacoes_obras_autores [checklist original]' AS check_item,
  'ℹ️ RENOMEADA PARA solicitacoes_obras_titulares — decisão arquitetural, não é falha' AS resultado;

-- Verificação real: solicitacoes_obras_titulares existe?
SELECT
  '4.2b → solicitacoes_obras_titulares existe no banco' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'solicitacoes_obras_titulares'
    ) THEN '✅ OK — cobre autor/coautor/versionista/adaptador'
    ELSE '❌ FALTA — solicitacoes_obras_titulares não foi criada'
  END AS resultado;

-- 4.3  DIVERGÊNCIA ESPERADA: solicitacoes_documentos → campos inline em solicitacoes_contratos
-- Esta linha sempre mostra ℹ️ — não é falha, é decisão arquitetural aprovada.
SELECT
  '4.3 solicitacoes_documentos [checklist original]' AS check_item,
  'ℹ️ INLINE EM solicitacoes_contratos — campos url_documento+nome_documento, não tabela separada, não é falha' AS resultado;

-- Verificação real: colunas existem em solicitacoes_contratos?
SELECT
  '4.3b → url_documento + nome_documento em solicitacoes_contratos' AS check_item,
  CASE
    WHEN (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'solicitacoes_contratos'
        AND column_name IN ('url_documento','nome_documento')
    ) = 2 THEN '✅ OK — ambas as colunas existem em solicitacoes_contratos'
    WHEN (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'solicitacoes_contratos'
        AND column_name IN ('url_documento','nome_documento')
    ) = 1 THEN '⚠️ Apenas uma coluna encontrada — verificar migration 028'
    ELSE '❌ FALTA — url_documento e nome_documento ausentes em solicitacoes_contratos'
  END AS resultado;


-- ============================================================
-- BLOCO 5: Migration 028 — RLS em todas as novas tabelas
-- ============================================================

-- 5.1  RLS ativo em todas as novas tabelas
SELECT
  '5.1 RLS ativo nas novas tabelas' AS check_item,
  c.relname AS tabela,
  CASE
    WHEN c.relrowsecurity THEN '✅ RLS ativo'
    ELSE '❌ RLS DESATIVADO — risco de vazamento de dados'
  END AS resultado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'usuarios_editoras',
    'solicitacoes_contratos',
    'solicitacoes_contratos_titulares',
    'solicitacoes_contratos_direitos',
    'solicitacoes_contratos_territorios',
    'solicitacoes_assinaturas',
    'solicitacoes_obras',
    'solicitacoes_obras_titulares',
    'solicitacoes_obras_direitos',
    'solicitacoes_obras_territorios',
    'workflow_aprovacoes',
    'solicitacoes_historico'
  )
ORDER BY c.relname;

-- 5.2  Listagem completa de policies criadas nas novas tabelas
SELECT
  '5.2 Policies nas novas tabelas (informativo)' AS check_item,
  tablename,
  policyname,
  cmd AS operacao
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'usuarios_editoras',
    'solicitacoes_contratos',
    'solicitacoes_contratos_titulares',
    'solicitacoes_contratos_direitos',
    'solicitacoes_contratos_territorios',
    'solicitacoes_assinaturas',
    'solicitacoes_obras',
    'solicitacoes_obras_titulares',
    'solicitacoes_obras_direitos',
    'solicitacoes_obras_territorios',
    'workflow_aprovacoes',
    'solicitacoes_historico'
  )
ORDER BY tablename, policyname;

-- 5.3  Contagem mínima de policies por tabela
-- (solicitacoes_contratos deve ter 4 policies; sub-tabelas 2 cada)
SELECT
  '5.3 Contagem de policies por tabela (mínimo esperado)' AS check_item,
  tablename,
  COUNT(*) AS total_policies,
  CASE
    WHEN tablename = 'solicitacoes_contratos' AND COUNT(*) >= 4 THEN '✅ OK'
    WHEN tablename = 'solicitacoes_obras'     AND COUNT(*) >= 4 THEN '✅ OK'
    WHEN tablename IN (
      'usuarios_editoras','workflow_aprovacoes','solicitacoes_historico'
    ) AND COUNT(*) >= 2 THEN '✅ OK'
    WHEN tablename NOT IN (
      'solicitacoes_contratos','solicitacoes_obras',
      'usuarios_editoras','workflow_aprovacoes','solicitacoes_historico'
    ) AND COUNT(*) >= 2 THEN '✅ OK'
    ELSE '⚠️ Menos policies que o esperado'
  END AS resultado
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'usuarios_editoras',
    'solicitacoes_contratos',
    'solicitacoes_contratos_titulares',
    'solicitacoes_contratos_direitos',
    'solicitacoes_contratos_territorios',
    'solicitacoes_assinaturas',
    'solicitacoes_obras',
    'solicitacoes_obras_titulares',
    'solicitacoes_obras_direitos',
    'solicitacoes_obras_territorios',
    'workflow_aprovacoes',
    'solicitacoes_historico'
  )
GROUP BY tablename
ORDER BY tablename;


-- ============================================================
-- BLOCO 6: FKs de rastreabilidade em contratos e obras
-- ============================================================

-- 6.1  contratos.solicitacao_id existe
SELECT
  '6.1 contratos.solicitacao_id existe' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'contratos'
        AND column_name = 'solicitacao_id'
    ) THEN '✅ OK'
    ELSE '❌ FALTA — ALTER TABLE contratos ADD COLUMN solicitacao_id não rodou'
  END AS resultado;

-- 6.2  obras.solicitacao_id existe
SELECT
  '6.2 obras.solicitacao_id existe' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'obras'
        AND column_name = 'solicitacao_id'
    ) THEN '✅ OK'
    ELSE '❌ FALTA — ALTER TABLE obras ADD COLUMN solicitacao_id não rodou'
  END AS resultado;

-- 6.3  Índices parciais de rastreabilidade
SELECT
  '6.3 Índices de rastreabilidade em contratos e obras' AS check_item,
  indexname,
  tablename,
  CASE WHEN indexname IN ('idx_contratos_solicitacao','idx_obras_solicitacao')
    THEN '✅ OK' ELSE '⚠️ inesperado' END AS resultado
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('idx_contratos_solicitacao','idx_obras_solicitacao')
ORDER BY indexname;


-- ============================================================
-- BLOCO 7: Índices principais das novas tabelas
-- ============================================================

SELECT
  '7. Índices principais da migration 028' AS check_item,
  esperado.nome AS indice,
  CASE WHEN i.indexname IS NOT NULL THEN '✅ OK' ELSE '❌ FALTA' END AS resultado
FROM (VALUES
  ('idx_sol_cont_tenant'),
  ('idx_sol_cont_editora'),
  ('idx_sol_cont_status'),
  ('idx_sol_cont_criado_por'),
  ('idx_sol_cont_tit_sol'),
  ('idx_sol_cont_tit_tit'),
  ('idx_sol_assin_sol'),
  ('idx_sol_assin_tit'),
  ('idx_sol_obra_tenant'),
  ('idx_sol_obra_editora'),
  ('idx_sol_obra_status'),
  ('idx_sol_obra_contrato'),
  ('idx_sol_obra_criado_por'),
  ('idx_sol_obra_tit_obra'),
  ('idx_sol_obra_tit_tit'),
  ('idx_workflow_tenant'),
  ('idx_workflow_entidade'),
  ('idx_workflow_aprovador'),
  ('idx_hist_tenant'),
  ('idx_hist_entidade'),
  ('idx_contratos_solicitacao'),
  ('idx_obras_solicitacao'),
  ('idx_usuarios_editoras_usuario'),
  ('idx_usuarios_editoras_editora'),
  ('idx_usuarios_editoras_tenant')
) AS esperado(nome)
LEFT JOIN pg_indexes i
  ON i.indexname = esperado.nome AND i.schemaname = 'public'
ORDER BY esperado.nome;


-- ============================================================
-- BLOCO 8: Imutabilidade do solicitacoes_historico
-- ============================================================

-- 8.1  Sem policies UPDATE/DELETE em solicitacoes_historico
SELECT
  '8.1 solicitacoes_historico: sem UPDATE nem DELETE policies' AS check_item,
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'solicitacoes_historico'
        AND cmd IN ('UPDATE','DELETE')
    ) THEN '✅ OK — log imutável garantido pelo DB'
    ELSE '❌ RISCO — há policy de UPDATE ou DELETE no histórico'
  END AS resultado;

-- 8.2  solicitacoes_historico tem apenas SELECT e INSERT
SELECT
  '8.2 Policies de solicitacoes_historico (deve ser SELECT + INSERT apenas)' AS check_item,
  policyname,
  cmd AS operacao,
  CASE
    WHEN cmd IN ('SELECT','INSERT') THEN '✅ OK'
    ELSE '❌ INDEVIDO — apenas SELECT e INSERT são permitidos'
  END AS resultado
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'solicitacoes_historico'
ORDER BY cmd;


-- ============================================================
-- BLOCO 9: Validação do fluxo de acesso (lógica de negócio)
-- ============================================================

-- 9.1  solicitacoes_contratos permite editora_administrada criar
SELECT
  '9.1 solicitacoes_contratos: editora_administrada pode inserir' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'solicitacoes_contratos'
        AND cmd = 'INSERT'
        AND with_check LIKE '%editora_administrada%'
    ) THEN '✅ OK — editora_administrada pode criar solicitações'
    ELSE '❌ FALTA — editora_administrada não tem INSERT em solicitacoes_contratos'
  END AS resultado;

-- 9.2  solicitacoes_contratos: apenas gestores podem deletar
SELECT
  '9.2 solicitacoes_contratos: apenas master/admin/super_admin deletam' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'solicitacoes_contratos'
        AND cmd = 'DELETE'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'solicitacoes_contratos'
        AND cmd = 'DELETE'
        AND qual LIKE '%editora_administrada%'
    ) THEN '✅ OK — editora_administrada não pode deletar'
    ELSE '❌ RISCO — editora_administrada pode deletar ou policy de DELETE ausente'
  END AS resultado;

-- 9.3  workflow_aprovacoes: editora_administrada só lê, não grava
SELECT
  '9.3 workflow_aprovacoes: editora_administrada apenas lê decisões' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'workflow_aprovacoes'
        AND cmd IN ('ALL','INSERT','UPDATE','DELETE')
        AND qual LIKE '%editora_administrada%'
    ) THEN '❌ RISCO — editora_administrada pode gravar em workflow_aprovacoes'
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'workflow_aprovacoes'
        AND cmd IN ('ALL','INSERT','UPDATE','DELETE')
        AND qual LIKE '%juridico%'
    ) THEN '✅ OK — apenas gestores/jurídico gravam'
    ELSE '⚠️ Verificar manualmente policies de workflow_aprovacoes'
  END AS resultado;

-- 9.4  Confirmação: editora_administrada fora de contratos e obras oficiais
SELECT
  '9.4 Resumo: editora_administrada fora de contratos+obras oficiais' AS check_item,
  tabela,
  policy,
  CASE
    WHEN qual LIKE '%editora_administrada%'
    THEN '❌ RISCO — editora_administrada ainda tem acesso write'
    ELSE '✅ OK — editora_administrada não tem acesso write aqui'
  END AS resultado
FROM (
  SELECT tablename AS tabela, policyname AS policy, qual
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('contratos','obras')
    AND cmd IN ('ALL','INSERT','UPDATE','DELETE')
) sub
ORDER BY tabela, policy;


-- ============================================================
-- BLOCO 10: Resumo final — contagem de problemas
-- ============================================================

SELECT '10. RESUMO — Como interpretar os resultados:' AS info,
       '✅ OK      → condição atendida, migration funcionou corretamente' AS legenda_ok,
       '❌ FALTA   → algo não foi criado, ação necessária antes de avançar' AS legenda_falta,
       '❌ RISCO   → problema de segurança, corrigir imediatamente' AS legenda_risco,
       '⚠️ aviso   → informativo, verificar manualmente' AS legenda_aviso,
       'ℹ️ info    → DIVERGÊNCIA ESPERADA E APROVADA — NÃO É FALHA' AS legenda_info;

-- Lembrete das 2 divergências aprovadas que aparecem com ℹ️ e NÃO contam como falha:
SELECT
  'DIVERGÊNCIAS ESPERADAS (não são falhas)' AS tipo,
  'solicitacoes_obras_autores' AS checklist_original,
  'ℹ️ RENOMEADA PARA solicitacoes_obras_titulares' AS status
UNION ALL
SELECT
  'DIVERGÊNCIAS ESPERADAS (não são falhas)',
  'solicitacoes_documentos',
  'ℹ️ INLINE EM solicitacoes_contratos (url_documento + nome_documento)';
