-- =============================================================================
-- VALIDACAO 043 — BackOffice / Financeiro
-- Executar no SQL Editor do Supabase APOS aplicar 043_obras_backoffice_song_codes.sql
-- Todos os blocos devem retornar os resultados esperados antes de prosseguir.
-- =============================================================================

-- [1] 3 tabelas + 1 view criadas
-- Esperado: 4 rows
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('obras_backoffice', 'recebimentos_itens', 'matching_rules')
UNION ALL
SELECT table_name, 'VIEW' AS table_type
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'v_catalogo_backoffice'
ORDER BY table_name;

-- [2] Campo importacao_id em recebimentos_itens
-- Esperado: 1 row
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'recebimentos_itens'
  AND column_name = 'importacao_id';

-- [3] Campo substituido_por em obras_backoffice (auto-referencial)
-- Esperado: 1 row
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'obras_backoffice'
  AND column_name = 'substituido_por';

-- [4] status_oni em match_lista_oni com 6 valores no CHECK
-- Esperado: 1 row
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'match_lista_oni'
  AND column_name = 'status_oni';

-- [5] Indice unico uq_matching_rule
-- Esperado: 1 row
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'matching_rules'
  AND indexname = 'uq_matching_rule';

-- [6] 7 campos de auditoria em recebimentos_itens
-- Esperado: 7 rows
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'recebimentos_itens'
  AND column_name IN (
    'statement_line_id', 'source_name', 'source_type',
    'statement_period', 'royalty_type', 'usage_type', 'raw_payload'
  )
ORDER BY column_name;

-- [7] raw_payload e JSONB
-- Esperado: 1 row com data_type = 'jsonb'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'recebimentos_itens'
  AND column_name = 'raw_payload';

-- [8] 7 tipos de tipo_regra em matching_rules (informativo)
SELECT constraint_name, check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'matching_rules'
  AND tc.constraint_type = 'CHECK';

-- [9] v_catalogo_backoffice retorna as 4 colunas de cobertura juridica
-- Esperado: 4 rows
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_catalogo_backoffice'
  AND column_name IN (
    'negocio_editorial_id',
    'qt_direitos_brasil',
    'qt_direitos_exterior',
    'status_catalogo'
  )
ORDER BY column_name;

-- [10] Totais de indices por tabela (informativo)
SELECT tablename, COUNT(*) AS qt_indices
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'obras_backoffice',
    'recebimentos_itens',
    'matching_rules',
    'match_lista_oni'
  )
GROUP BY tablename
ORDER BY tablename;

-- [BONUS] Verificar novos campos em match_lista_oni
-- Esperado: 4 rows
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'match_lista_oni'
  AND column_name IN ('status_oni', 'valor_estimado', 'data_envio_bo', 'data_aceite_bo')
ORDER BY column_name;
