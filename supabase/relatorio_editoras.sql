-- ============================================================
-- relatorio_editoras.sql
-- Rodar no Supabase após concluir o cadastro das 5 editoras.
-- Valida: dados, unicidade, ausência de duplicidades.
-- ============================================================

-- ── 1. LISTAGEM COMPLETA DAS EDITORAS ───────────────────────
SELECT
  id,
  nome_fantasia,
  razao_social,
  tipo_editora,
  codigo_interno,
  codigo_interno_cwr,
  codigo_publisher_cwr,
  codigo_cae,
  codigo_ipi,
  codigo_ecad,
  status,
  deleted_at
FROM editoras
WHERE deleted_at IS NULL
ORDER BY
  CASE tipo_editora WHEN 'master' THEN 0 ELSE 1 END,
  nome_fantasia;

-- ── 2. VERIFICAR DUPLICIDADE EM CADA CÓDIGO ─────────────────
-- Deve retornar 0 linhas. Se retornar algo, há duplicidade.

SELECT 'codigo_interno' AS campo, tenant_id, codigo_interno AS valor, COUNT(*) AS total
FROM editoras WHERE codigo_interno IS NOT NULL AND deleted_at IS NULL
GROUP BY tenant_id, codigo_interno HAVING COUNT(*) > 1

UNION ALL

SELECT 'codigo_interno_cwr', tenant_id, codigo_interno_cwr, COUNT(*)
FROM editoras WHERE codigo_interno_cwr IS NOT NULL AND deleted_at IS NULL
GROUP BY tenant_id, codigo_interno_cwr HAVING COUNT(*) > 1

UNION ALL

SELECT 'codigo_publisher_cwr', tenant_id, codigo_publisher_cwr, COUNT(*)
FROM editoras WHERE codigo_publisher_cwr IS NOT NULL AND deleted_at IS NULL
GROUP BY tenant_id, codigo_publisher_cwr HAVING COUNT(*) > 1

UNION ALL

SELECT 'codigo_cae', tenant_id, codigo_cae, COUNT(*)
FROM editoras WHERE codigo_cae IS NOT NULL AND deleted_at IS NULL
GROUP BY tenant_id, codigo_cae HAVING COUNT(*) > 1

UNION ALL

SELECT 'codigo_ipi', tenant_id, codigo_ipi, COUNT(*)
FROM editoras WHERE codigo_ipi IS NOT NULL AND deleted_at IS NULL
GROUP BY tenant_id, codigo_ipi HAVING COUNT(*) > 1;

-- ── 3. CONFIRMAR TIPOS ──────────────────────────────────────
-- Esperado: exatamente 1 master (Top Show) e as demais como administrada
SELECT tipo_editora, COUNT(*) AS total
FROM editoras WHERE deleted_at IS NULL
GROUP BY tipo_editora;

-- ── 4. CAMPOS VAZIOS (AVISO) ─────────────────────────────────
-- Não é erro, apenas informativo para ver quais editoras ainda precisam de dados
SELECT nome_fantasia,
  CASE WHEN codigo_interno        IS NULL THEN 'falta' ELSE 'ok' END AS c_interno,
  CASE WHEN codigo_interno_cwr    IS NULL THEN 'falta' ELSE 'ok' END AS c_interno_cwr,
  CASE WHEN codigo_publisher_cwr  IS NULL THEN 'falta' ELSE 'ok' END AS c_publisher_cwr,
  CASE WHEN codigo_cae            IS NULL THEN 'falta' ELSE 'ok' END AS cae,
  CASE WHEN codigo_ipi            IS NULL THEN 'falta' ELSE 'ok' END AS ipi,
  CASE WHEN codigo_ecad           IS NULL THEN 'falta' ELSE 'ok' END AS ecad
FROM editoras
WHERE deleted_at IS NULL
ORDER BY tipo_editora, nome_fantasia;

-- ── 5. CONFIRMAR QUE NENHUMA EDITORA TEM sender_code ────────
-- Esta coluna não deve existir. Se retornar erro "column not found", está correto.
-- Se retornar linhas, investigar.
SELECT nome_fantasia FROM editoras WHERE deleted_at IS NULL
  AND (dados_bancarios->>'sender_code') IS NOT NULL;
