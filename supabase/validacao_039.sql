-- validacao_039.sql — Validação da Migration 039
-- Rodar no Supabase SQL Editor APÓS aplicar 039_tipos_direito_juridicos.sql
-- Todos os blocos devem retornar o resultado esperado descrito nos comentários.

-- ─── [1] Os 8 novos direitos jurídicos existem, ativos e com nome_juridico ────
-- Esperado: 8 rows, todos com nome_juridico NOT NULL e codigo_legado = FALSE
SELECT codigo, nome_curto, LEFT(nome_juridico, 60) AS nome_juridico_resumo, codigo_legado, ativo
FROM tipos_direito
WHERE tenant_id IS NULL
  AND codigo IN (
    'repr_grafica','repr_fonomecanica','inclusao_audiovisual',
    'inclusao_publicitaria','distribuicao_meios','inclusao_base_dados',
    'comunicacao_publico','autorizacoes_onus'
  )
ORDER BY ordem;

-- ─── [2] nome_juridico NÃO é NULL em nenhum dos 8 novos direitos ─────────────
-- Esperado: 0 rows
SELECT codigo, nome_juridico
FROM tipos_direito
WHERE tenant_id IS NULL
  AND codigo_legado = FALSE
  AND nome_juridico IS NULL;

-- ─── [3] Os 11 códigos legado existem, codigo_legado=TRUE, ativo=TRUE ─────────
-- Esperado: 11 rows (todos legado, todos ativos por ora)
SELECT codigo, codigo_legado, ativo
FROM tipos_direito
WHERE tenant_id IS NULL
  AND codigo IN (
    'execucao_publica','fonodigital','fonofisico','sync',
    'licenciamento_direto','audiovisual','publicidade',
    'base_dados','dir_editoriais','dir_futuros','outros'
  )
ORDER BY codigo;

-- ─── [4] Não existe coluna pct_autor_brasil na tabela (não pertence ao direito) ─
-- Esperado: 0 rows
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'tipos_direito'
  AND column_name  IN ('pct_autor_brasil','pct_editora_brasil','pct_autor_exterior','pct_editora_exterior');

-- ─── [5] As 3 colunas novas existem ─────────────────────────────────────────
-- Esperado: 3 rows (nome_juridico, nome_curto, codigo_legado)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'tipos_direito'
  AND column_name  IN ('nome_juridico','nome_curto','codigo_legado')
ORDER BY column_name;

-- ─── [6] Total de direitos ativos globais após a migration ──────────────────
-- Esperado: 19 (11 legado + 8 novos) — todos ativos por ora
SELECT
  COUNT(*)                                                              AS total_ativos,
  COUNT(*) FILTER (WHERE codigo_legado = FALSE)                        AS novos_juridicos,
  COUNT(*) FILTER (WHERE codigo_legado = TRUE)                         AS legado_ativos
FROM tipos_direito
WHERE tenant_id IS NULL AND ativo = TRUE;
