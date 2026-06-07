-- ============================================================
-- validacao_036.sql
-- Valida migration 036 — percentuais_por_receita em negocios_editoriais
-- ============================================================

-- ITEM 1: coluna existe
SELECT
  CASE WHEN COUNT(*) = 1
    THEN '✅ ITEM 1 OK — coluna percentuais_por_receita existe'
    ELSE '❌ ITEM 1 ERRO — coluna não encontrada'
  END AS resultado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'negocios_editoriais'
  AND column_name  = 'percentuais_por_receita';

-- ITEM 2: tipo é jsonb
SELECT
  CASE WHEN data_type = 'jsonb'
    THEN '✅ ITEM 2 OK — tipo JSONB correto'
    ELSE '❌ ITEM 2 ERRO — tipo incorreto: ' || data_type
  END AS resultado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'negocios_editoriais'
  AND column_name  = 'percentuais_por_receita';

-- ITEM 3: default é null (coluna anulável)
SELECT
  CASE WHEN is_nullable = 'YES'
    THEN '✅ ITEM 3 OK — coluna é nullable (DEFAULT NULL)'
    ELSE '❌ ITEM 3 ERRO — coluna NOT NULL inesperado'
  END AS resultado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'negocios_editoriais'
  AND column_name  = 'percentuais_por_receita';

-- ITEM 4: índice parcial existe
SELECT
  CASE WHEN COUNT(*) >= 1
    THEN '✅ ITEM 4 OK — índice idx_negocios_ppr existe'
    ELSE '❌ ITEM 4 ERRO — índice não encontrado'
  END AS resultado
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename  = 'negocios_editoriais'
  AND indexname  = 'idx_negocios_ppr';

-- ITEM 5: constraint chk_percentuais_somam_100 permanece intacta
SELECT
  CASE WHEN COUNT(*) >= 1
    THEN '✅ ITEM 5 OK — constraint chk_percentuais_somam_100 intacta'
    ELSE '❌ ITEM 5 ERRO — constraint não encontrada (foi removida?)'
  END AS resultado
FROM information_schema.table_constraints
WHERE table_schema     = 'public'
  AND table_name       = 'negocios_editoriais'
  AND constraint_name  = 'chk_percentuais_somam_100';

-- ITEM 6: nenhum registro existente foi corrompido
SELECT
  CASE WHEN COUNT(*) = 0
    THEN '✅ ITEM 6 OK — nenhum registro com percentuais_por_receita preenchido (esperado após migration limpa)'
    ELSE '⚠ ITEM 6 INFO — ' || COUNT(*) || ' registro(s) já com percentuais_por_receita (verifique manualmente)'
  END AS resultado
FROM negocios_editoriais
WHERE percentuais_por_receita IS NOT NULL;

-- ITEM 7: listagem completa das colunas de percentual (confirmar coexistência)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'negocios_editoriais'
  AND column_name  IN ('percentual_administrada', 'percentual_administradora', 'percentuais_por_receita')
ORDER BY column_name;
