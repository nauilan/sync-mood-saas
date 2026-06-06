-- ============================================================
-- validacao_029.sql
-- Execute no Supabase SQL Editor APÓS aplicar a migration 029.
-- Interprete o resultado pela coluna "status":
--   OK      = correto
--   FALTA   = algo não foi criado/encontrado
--   RISCO   = duplicidade encontrada — NÃO prosseguir
-- ============================================================

-- ── 1. CAMPOS NOVOS EM EDITORAS ─────────────────────────────
SELECT
  'editoras.codigo_publisher_cwr' AS campo,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'editoras' AND column_name = 'codigo_publisher_cwr'
  ) THEN 'OK' ELSE 'FALTA' END AS status,
  'novo campo para código publisher importado de CWR externo' AS descricao;

-- ── 2. CAMPOS NOVOS EM TITULARES ─────────────────────────────
SELECT campo, status, descricao FROM (VALUES
  ('titulares.codigo_interno_cwr',  (SELECT CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titulares' AND column_name = 'codigo_interno_cwr')
    THEN 'OK' ELSE 'FALTA' END),   'código CWR do titular preservado da fonte'),
  ('titulares.origem_importacao',   (SELECT CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titulares' AND column_name = 'origem_importacao')
    THEN 'OK' ELSE 'FALTA' END),   'origem do cadastro: manual | cwr | api'),
  ('titulares.importacao_id',       (SELECT CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titulares' AND column_name = 'importacao_id')
    THEN 'OK' ELSE 'FALTA' END),   'ID da importação CWR de origem')
) AS t(campo, status, descricao);

-- ── 3. ENUM status_geral — novos valores ─────────────────────
SELECT
  enumlabel AS valor_enum,
  CASE WHEN enumlabel IN ('pre_cadastro', 'pendente_validacao')
    THEN 'OK' ELSE 'ignorar' END AS status
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'status_geral'
ORDER BY enumsortorder;

-- ── 4. ÍNDICES UNIQUE EM EDITORAS ────────────────────────────
SELECT indexname,
  CASE WHEN indexname IS NOT NULL THEN 'OK' ELSE 'FALTA' END AS status
FROM (VALUES
  ('uq_editoras_codigo_interno_cwr'),
  ('uq_editoras_codigo_publisher_cwr'),
  ('uq_editoras_codigo_cae'),
  ('uq_editoras_codigo_ipi')
) AS esperado(indexname)
LEFT JOIN pg_indexes pi USING(indexname)
WHERE pi.tablename = 'editoras' OR pi.tablename IS NULL;

-- ── 5. ÍNDICES UNIQUE EM TITULARES ───────────────────────────
SELECT indexname,
  CASE WHEN pi.indexname IS NOT NULL THEN 'OK' ELSE 'FALTA' END AS status
FROM (VALUES
  ('uq_titulares_codigo_interno_cwr'),
  ('uq_titulares_codigo_cae'),
  ('uq_titulares_codigo_ipi')
) AS esperado(indexname)
LEFT JOIN pg_indexes pi USING(indexname)
WHERE pi.tablename = 'titulares' OR pi.tablename IS NULL;

-- ── 6. ÍNDICES AUXILIARES EM TITULARES ───────────────────────
SELECT indexname,
  CASE WHEN pi.indexname IS NOT NULL THEN 'OK' ELSE 'FALTA' END AS status
FROM (VALUES
  ('idx_titulares_origem_importacao'),
  ('idx_titulares_importacao_id')
) AS esperado(indexname)
LEFT JOIN pg_indexes pi USING(indexname)
WHERE pi.tablename = 'titulares' OR pi.tablename IS NULL;

-- ── 7. VERIFICAÇÃO DE DUPLICIDADE RESIDUAL ───────────────────
-- Se retornar linhas com status RISCO, não prossiga.

SELECT 'editoras.codigo_interno_cwr' AS campo,
  COUNT(*) AS grupos_duplicados,
  CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'RISCO' END AS status
FROM (
  SELECT tenant_id, codigo_interno_cwr
  FROM editoras
  WHERE codigo_interno_cwr IS NOT NULL AND deleted_at IS NULL
  GROUP BY tenant_id, codigo_interno_cwr HAVING COUNT(*) > 1
) t;

SELECT 'editoras.codigo_publisher_cwr' AS campo,
  COUNT(*) AS grupos_duplicados,
  CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'RISCO' END AS status
FROM (
  SELECT tenant_id, codigo_publisher_cwr
  FROM editoras
  WHERE codigo_publisher_cwr IS NOT NULL AND deleted_at IS NULL
  GROUP BY tenant_id, codigo_publisher_cwr HAVING COUNT(*) > 1
) t;

SELECT 'editoras.codigo_cae' AS campo,
  COUNT(*) AS grupos_duplicados,
  CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'RISCO' END AS status
FROM (
  SELECT tenant_id, codigo_cae
  FROM editoras
  WHERE codigo_cae IS NOT NULL AND deleted_at IS NULL
  GROUP BY tenant_id, codigo_cae HAVING COUNT(*) > 1
) t;

SELECT 'editoras.codigo_ipi' AS campo,
  COUNT(*) AS grupos_duplicados,
  CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'RISCO' END AS status
FROM (
  SELECT tenant_id, codigo_ipi
  FROM editoras
  WHERE codigo_ipi IS NOT NULL AND deleted_at IS NULL
  GROUP BY tenant_id, codigo_ipi HAVING COUNT(*) > 1
) t;

SELECT 'titulares.codigo_cae' AS campo,
  COUNT(*) AS grupos_duplicados,
  CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'RISCO' END AS status
FROM (
  SELECT tenant_id, codigo_cae
  FROM titulares
  WHERE codigo_cae IS NOT NULL AND deleted_at IS NULL
  GROUP BY tenant_id, codigo_cae HAVING COUNT(*) > 1
) t;

SELECT 'titulares.codigo_ipi' AS campo,
  COUNT(*) AS grupos_duplicados,
  CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'RISCO' END AS status
FROM (
  SELECT tenant_id, codigo_ipi
  FROM titulares
  WHERE codigo_ipi IS NOT NULL AND deleted_at IS NULL
  GROUP BY tenant_id, codigo_ipi HAVING COUNT(*) > 1
) t;

-- ── 8. COMENTÁRIO LEGADO — titulares.ipi ─────────────────────
-- Confirma que o campo legado existe e o campo oficial também.
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titulares' AND column_name = 'ipi')
    THEN 'OK — campo legado ipi existe (compatibilidade)' ELSE 'ausente' END AS campo_ipi_legado,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titulares' AND column_name = 'codigo_ipi')
    THEN 'OK — campo oficial codigo_ipi existe' ELSE 'FALTA' END AS campo_ipi_oficial;

-- ── RESUMO ──────────────────────────────────────────────────
-- Se todos os status acima mostrarem OK:
--   Migration 029 aplicada com sucesso.
--   Sistema pronto para cadastro das editoras reais pela interface.
--
-- Se algum campo mostrar FALTA:
--   A migration não foi aplicada ou falhou parcialmente. Re-aplicar.
--
-- Se algum campo mostrar RISCO:
--   Há duplicidade no banco — corrigir manualmente antes de prosseguir.
--   Não cadastrar editoras reais até resolver.
