-- ═══════════════════════════════════════════════════════════════════════════════
-- VALIDAÇÃO 037 — Direitos Administrados por Território
-- ═══════════════════════════════════════════════════════════════════════════════
-- Cole este script no SQL Editor do Supabase e confira os 5 blocos.

-- [1] Novas colunas existem em negocios_editoriais
SELECT
  CASE WHEN COUNT(*) = 4
    THEN '✅ OK — 4 colunas adicionadas (direitos_brasil, direitos_exterior, percentuais_brasil, percentuais_exterior)'
    ELSE '❌ PENDENTE — esperadas 4 colunas, encontradas ' || COUNT(*) || '. Rode a migration 037.'
  END AS resultado_colunas
FROM information_schema.columns
WHERE table_name = 'negocios_editoriais'
  AND column_name IN ('direitos_brasil','direitos_exterior','percentuais_brasil','percentuais_exterior');

-- [2] Índices GIN existem
SELECT
  CASE WHEN COUNT(*) >= 2
    THEN '✅ OK — índices GIN presentes'
    ELSE '❌ PENDENTE — índices GIN ausentes. Encontrados: ' || COUNT(*) || '/2'
  END AS resultado_indices
FROM pg_indexes
WHERE tablename = 'negocios_editoriais'
  AND indexname IN ('idx_neg_direitos_brasil','idx_neg_direitos_exterior');

-- [3] Exatamente 11 direitos globais ativos inseridos
SELECT
  CASE WHEN COUNT(*) = 11
    THEN '✅ OK — 11 direitos globais ativos'
    ELSE '❌ PENDENTE — esperados 11, encontrados ' || COUNT(*) || '. Verifique o INSERT.'
  END AS resultado_direitos_globais
FROM tipos_direito
WHERE tenant_id IS NULL AND ativo = TRUE;

-- [4] 'internacional' desativado (não é direito, é território)
SELECT
  CASE WHEN COUNT(*) = 0
    THEN '✅ OK — tipo "internacional" não está ativo'
    ELSE '❌ RISCO — "internacional" ainda ativo. Execute: UPDATE tipos_direito SET ativo=FALSE WHERE tenant_id IS NULL AND codigo=''internacional'';'
  END AS resultado_internacional
FROM tipos_direito
WHERE tenant_id IS NULL AND codigo = 'internacional' AND ativo = TRUE;

-- [5] Lista visual dos 11 direitos globais (verificação manual)
SELECT
  ordem,
  codigo,
  nome,
  tipo_cwr,
  ativo
FROM tipos_direito
WHERE tenant_id IS NULL
ORDER BY ordem;
