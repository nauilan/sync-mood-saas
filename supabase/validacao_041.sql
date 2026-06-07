-- validacao_041.sql — Validação da Migration 041
-- Rodar no Supabase SQL Editor APÓS aplicar 041_migracao_codigos_juridicos.sql
-- TODOS os blocos [1] e [2] devem retornar 0 rows antes de desativar os códigos legado.

-- ─── [1] CRÍTICO: Nenhum código antigo em direitos_brasil ────────────────────
-- Esperado: 0 rows
SELECT id, nome,
       elem AS codigo_antigo_encontrado
FROM negocios_editoriais,
     jsonb_array_elements_text(direitos_brasil) AS elem
WHERE elem IN (
  'execucao_publica','fonodigital','fonofisico','sync',
  'licenciamento_direto','audiovisual','publicidade',
  'base_dados','dir_editoriais','dir_futuros','outros'
);

-- ─── [2] CRÍTICO: Nenhum código antigo em direitos_exterior ──────────────────
-- Esperado: 0 rows
SELECT id, nome,
       elem AS codigo_antigo_encontrado
FROM negocios_editoriais,
     jsonb_array_elements_text(direitos_exterior) AS elem
WHERE elem IN (
  'execucao_publica','fonodigital','fonofisico','sync',
  'licenciamento_direto','audiovisual','publicidade',
  'base_dados','dir_editoriais','dir_futuros','outros'
);

-- ─── [3] CRÍTICO: Nenhuma chave antiga em percentuais_brasil ─────────────────
-- Esperado: 0 rows
SELECT id, nome, key AS chave_antiga
FROM negocios_editoriais,
     jsonb_object_keys(COALESCE(percentuais_brasil,'{}')) AS key
WHERE key IN (
  'execucao_publica','fonodigital','fonofisico','sync',
  'licenciamento_direto','audiovisual','publicidade',
  'base_dados','dir_editoriais','dir_futuros','outros'
);

-- ─── [4] CRÍTICO: Nenhuma chave antiga em percentuais_exterior ───────────────
-- Esperado: 0 rows
SELECT id, nome, key AS chave_antiga
FROM negocios_editoriais,
     jsonb_object_keys(COALESCE(percentuais_exterior,'{}')) AS key
WHERE key IN (
  'execucao_publica','fonodigital','fonofisico','sync',
  'licenciamento_direto','audiovisual','publicidade',
  'base_dados','dir_editoriais','dir_futuros','outros'
);

-- ─── [5] Colunas origem_receita_id adicionadas nas tabelas financeiras ────────
-- Esperado: 4 rows
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name  = 'origem_receita_id'
  AND table_name   IN ('recebimentos','cc_obras_movimentos','distribuicao_itens','obras_analitico')
ORDER BY table_name;

-- ─── [6] tipo_direito_id adicionado em contratos e autorizacoes ──────────────
-- Esperado: 2 rows
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name  = 'tipo_direito_id'
  AND table_name   IN ('contratos','autorizacoes')
ORDER BY table_name;

-- ─── [7] receitas_aplicaveis tem COMMENT de deprecação ───────────────────────
-- Esperado: 1 row com texto de deprecação
SELECT col_description(
  (SELECT oid FROM pg_class WHERE relname = 'negocios_editoriais'),
  (SELECT attnum FROM pg_attribute
   WHERE attrelid = (SELECT oid FROM pg_class WHERE relname = 'negocios_editoriais')
     AND attname = 'receitas_aplicaveis')
) AS comentario_receitas_aplicaveis;

-- ─── [8] Snapshot dos direitos_brasil migrados nos negócios existentes ────────
-- Informativo — verificar que os códigos novos aparecem
SELECT id, nome,
       direitos_brasil,
       direitos_exterior
FROM negocios_editoriais
WHERE (direitos_brasil != '[]'::jsonb OR direitos_exterior != '[]'::jsonb)
ORDER BY created_at;

-- ─── PASSO FINAL — SE TODOS OS BLOCOS ACIMA PASSARAM (0 rows nos [1-4]) ───────
-- Descomente a linha abaixo e execute separadamente:
--
-- UPDATE tipos_direito SET ativo = FALSE WHERE codigo_legado = TRUE;
--
-- Depois confirme:
-- SELECT codigo, ativo, codigo_legado FROM tipos_direito WHERE codigo_legado = TRUE ORDER BY codigo;
-- Esperado: 11 rows com ativo = FALSE
