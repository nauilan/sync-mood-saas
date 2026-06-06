-- =============================================================================
-- Validação da Migration 034
-- Executar no SQL Editor do Supabase após aplicar 034_id_interno_unificacao.sql
-- =============================================================================

-- ─── 1. editoras: colunas removidas ───────────────────────────────────────
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ OK — editoras.codigo_interno_cwr removido'
    ELSE '❌ FALHA — coluna codigo_interno_cwr ainda existe em editoras'
  END AS resultado
FROM information_schema.columns
WHERE table_name = 'editoras'
  AND column_name = 'codigo_interno_cwr';

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ OK — editoras.codigo_publisher_cwr removido'
    ELSE '❌ FALHA — coluna codigo_publisher_cwr ainda existe em editoras'
  END AS resultado
FROM information_schema.columns
WHERE table_name = 'editoras'
  AND column_name = 'codigo_publisher_cwr';

-- ─── 2. editoras: codigo_interno existe ───────────────────────────────────
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ OK — editoras.codigo_interno existe'
    ELSE '❌ FALHA — coluna codigo_interno não encontrada em editoras'
  END AS resultado
FROM information_schema.columns
WHERE table_name = 'editoras'
  AND column_name = 'codigo_interno';

-- ─── 3. editoras: índice único por tenant ─────────────────────────────────
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ OK — uq_editoras_codigo_interno criado'
    ELSE '❌ FALHA — índice uq_editoras_codigo_interno ausente'
  END AS resultado
FROM pg_indexes
WHERE tablename = 'editoras'
  AND indexname = 'uq_editoras_codigo_interno';

-- ─── 4. titulares: coluna removida ────────────────────────────────────────
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ OK — titulares.codigo_interno_cwr removido'
    ELSE '❌ FALHA — coluna codigo_interno_cwr ainda existe em titulares'
  END AS resultado
FROM information_schema.columns
WHERE table_name = 'titulares'
  AND column_name = 'codigo_interno_cwr';

-- ─── 5. titulares: codigo_interno existe ──────────────────────────────────
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ OK — titulares.codigo_interno existe'
    ELSE '❌ FALHA — coluna codigo_interno não encontrada em titulares'
  END AS resultado
FROM information_schema.columns
WHERE table_name = 'titulares'
  AND column_name = 'codigo_interno';

-- ─── 6. titulares: índice único por tenant ────────────────────────────────
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ OK — uq_titulares_codigo_interno criado'
    ELSE '❌ FALHA — índice uq_titulares_codigo_interno ausente'
  END AS resultado
FROM pg_indexes
WHERE tablename = 'titulares'
  AND indexname = 'uq_titulares_codigo_interno';

-- ─── 7. Ausência de duplicidade em editoras.codigo_interno ────────────────
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ OK — sem duplicidade em editoras.codigo_interno'
    ELSE '❌ FALHA — duplicidade detectada em editoras.codigo_interno'
  END AS resultado
FROM (
  SELECT tenant_id, codigo_interno
  FROM editoras
  WHERE codigo_interno IS NOT NULL
  GROUP BY tenant_id, codigo_interno
  HAVING COUNT(*) > 1
) dups;

-- ─── 8. Ausência de duplicidade em titulares.codigo_interno ───────────────
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ OK — sem duplicidade em titulares.codigo_interno'
    ELSE '❌ FALHA — duplicidade detectada em titulares.codigo_interno'
  END AS resultado
FROM (
  SELECT tenant_id, codigo_interno
  FROM titulares
  WHERE codigo_interno IS NOT NULL
  GROUP BY tenant_id, codigo_interno
  HAVING COUNT(*) > 1
) dups;

-- ─── 9. Relatório atual das editoras (ID Interno + identif.) ──────────────
SELECT
  nome_fantasia,
  tipo_editora,
  codigo_interno    AS "ID Interno",
  codigo_cae        AS "CAE",
  codigo_ipi        AS "IPI",
  codigo_ecad       AS "ECAD",
  sender_code       AS "Sender ID Code",
  status
FROM editoras
ORDER BY tipo_editora, nome_fantasia;

-- ─── 10. Relatório atual dos titulares com ID Interno ─────────────────────
SELECT
  nome_completo,
  nome_artistico,
  codigo_interno    AS "ID Interno",
  codigo_cae        AS "CAE",
  codigo_ipi        AS "IPI",
  codigo_titular    AS "Código Titular",
  status
FROM titulares
WHERE codigo_interno IS NOT NULL
ORDER BY nome_completo;
