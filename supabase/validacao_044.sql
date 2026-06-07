-- =============================================================================
-- VALIDACAO 044 — Auditoria Global
-- Executar no SQL Editor do Supabase APOS aplicar 044_audit_logs.sql
-- Todos os blocos devem retornar os resultados esperados antes de prosseguir.
-- =============================================================================

-- [1] Tabela audit_logs criada
-- Esperado: 1 row
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'audit_logs';

-- [2] Colunas event_id e origem_execucao presentes
-- Esperado: 2 rows
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
  AND column_name IN ('event_id', 'origem_execucao')
ORDER BY column_name;

-- [3] 10 indices em audit_logs
-- Esperado: 10 rows (idx_al_*)
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'audit_logs'
ORDER BY indexname;

-- [4] dados_anteriores e dados_novos sao JSONB
-- Esperado: 2 rows com data_type = 'jsonb'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
  AND column_name IN ('dados_anteriores', 'dados_novos')
ORDER BY column_name;

-- [5] deleted_at e deleted_by nas 9 tabelas principais
-- Esperado: 18 rows (9 tabelas x 2 colunas)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'obras', 'editoras', 'titulares', 'negocios_editoriais', 'contratos',
    'recebimentos', 'recebimentos_itens', 'obras_backoffice', 'matching_rules'
  )
  AND column_name IN ('deleted_at', 'deleted_by')
ORDER BY table_name, column_name;

-- [6] CHECK de origem_execucao com 5 valores (informativo)
SELECT constraint_name, check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'audit_logs'
  AND tc.constraint_type = 'CHECK'
  AND cc.check_clause LIKE '%origem_execucao%';

-- [BONUS] Estrutura completa da tabela audit_logs
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- [BONUS] Indices de soft delete criados
-- Esperado: 9 rows (idx_*_not_deleted)
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%not_deleted%'
ORDER BY tablename;
