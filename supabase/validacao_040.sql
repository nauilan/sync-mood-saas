-- validacao_040.sql — Validação da Migration 040
-- Rodar no Supabase SQL Editor APÓS aplicar 040_origens_receita.sql
-- Todos os blocos devem retornar o resultado esperado descrito nos comentários.

-- ─── [1] Tabela origens_receita existe e tem >= 20 rows globais ─────────────
-- Esperado: count >= 20
SELECT COUNT(*) AS total_origens_globais
FROM origens_receita
WHERE tenant_id IS NULL;

-- ─── [2] DSPs com mapeamento_provisorio = TRUE ───────────────────────────────
-- Esperado: 7 rows (spotify, deezer, apple_music, youtube_music, youtube_cms, tiktok, amazon_music)
SELECT codigo, nome, tipo_origem, mapeamento_provisorio
FROM origens_receita
WHERE tenant_id IS NULL
  AND codigo IN ('spotify','deezer','apple_music','youtube_music','youtube_cms','tiktok','amazon_music')
ORDER BY ordem;

-- ─── [3] ecad e socinpro → comunicacao_publico ──────────────────────────────
-- Esperado: 2 rows com tipo_direito.codigo = 'comunicacao_publico'
SELECT o.codigo, o.nome, td.codigo AS direito_codigo, o.mapeamento_provisorio
FROM origens_receita o
JOIN tipos_direito td ON td.id = o.tipo_direito_id
WHERE o.tenant_id IS NULL
  AND o.codigo IN ('ecad','socinpro');

-- ─── [4] netflix, globo, prime_video, sync_audiovisual, sync_cinema → inclusao_audiovisual ─
-- Esperado: 5 rows com direito_codigo = 'inclusao_audiovisual'
SELECT o.codigo, o.nome, td.codigo AS direito_codigo
FROM origens_receita o
JOIN tipos_direito td ON td.id = o.tipo_direito_id
WHERE o.tenant_id IS NULL
  AND o.codigo IN ('netflix','globo','prime_video','sync_audiovisual','sync_cinema');

-- ─── [5] sync_publicidade → inclusao_publicitaria ───────────────────────────
-- Esperado: 1 row com direito_codigo = 'inclusao_publicitaria'
SELECT o.codigo, o.nome, td.codigo AS direito_codigo
FROM origens_receita o
JOIN tipos_direito td ON td.id = o.tipo_direito_id
WHERE o.tenant_id IS NULL
  AND o.codigo = 'sync_publicidade';

-- ─── [6] cd_fisico → repr_fonomecanica ──────────────────────────────────────
-- Esperado: 1 row com direito_codigo = 'repr_fonomecanica'
SELECT o.codigo, o.nome, td.codigo AS direito_codigo
FROM origens_receita o
JOIN tipos_direito td ON td.id = o.tipo_direito_id
WHERE o.tenant_id IS NULL
  AND o.codigo = 'cd_fisico';

-- ─── [7] partitura_edicao → repr_grafica ────────────────────────────────────
-- Esperado: 1 row com direito_codigo = 'repr_grafica'
SELECT o.codigo, o.nome, td.codigo AS direito_codigo
FROM origens_receita o
JOIN tipos_direito td ON td.id = o.tipo_direito_id
WHERE o.tenant_id IS NULL
  AND o.codigo = 'partitura_edicao';

-- ─── [8] Origens com tipo_direito_id = NULL (provisórias sem classificação) ──
-- Esperado: ubem_backoffice, licenciamento_direto, acordo_direto
SELECT codigo, nome, tipo_origem, mapeamento_provisorio
FROM origens_receita
WHERE tenant_id IS NULL
  AND tipo_direito_id IS NULL;

-- ─── [9] Todas as colunas da tabela existem ─────────────────────────────────
-- Esperado: todas as colunas listadas presentes
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'origens_receita'
ORDER BY ordinal_position;
