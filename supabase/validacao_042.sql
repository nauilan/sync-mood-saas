-- validacao_042.sql — Validação da Migration 042
-- Rodar no Supabase SQL Editor APÓS aplicar 042_fn_validar_direito_v2.sql
-- Requer negócios editoriais cadastrados para os testes [3] e [4].

-- ─── [1] Função existe com assinatura correta (7 parâmetros) ─────────────────
-- Esperado: 1 row com 7 parâmetros
SELECT proname, pronargs, proargnames
FROM pg_proc
WHERE proname = 'validar_direito_administrado'
  AND pronargs = 7;

-- ─── [2] Chamada com código antigo retorna erro gracioso (não existe nos direitos) ─
-- Esperado: permitido = false (fonodigital não está em nenhum negócio após Migration 041)
-- Substituir os UUIDs abaixo por IDs reais do seu banco
/*
SELECT validar_direito_administrado(
  '<UUID_editora_administrada>',
  '<UUID_administradora>',
  'fonodigital',       -- código legado — não deve estar nos direitos novos
  'brasil'
);
*/

-- ─── [3] Chamada com código jurídico novo — deve retornar sem erro ───────────
-- Esperado: retorna JSONB com permitido = true ou false (sem exceção)
-- Substituir os UUIDs abaixo por IDs reais
/*
SELECT validar_direito_administrado(
  '<UUID_editora_administrada>',
  '<UUID_administradora>',
  'comunicacao_publico',   -- código jurídico canônico
  'brasil'
);
*/

-- ─── [4] Chamada com p_obra_id = NULL → obra_coberta = null ──────────────────
-- Esperado: JSONB com obra_coberta = null
/*
SELECT validar_direito_administrado(
  '<UUID_editora_administrada>',
  '<UUID_administradora>',
  'comunicacao_publico',
  'brasil',
  CURRENT_DATE,
  NULL,
  NULL   -- p_obra_id = NULL
) ->> 'obra_coberta';
-- Esperado: NULL
*/

-- ─── [5] Chamada com editoras fictícias → retorno gracioso (não exception) ───
-- Esperado: permitido = false, negocio_editorial_id = null, obra_coberta = null
SELECT validar_direito_administrado(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'comunicacao_publico',
  'brasil'
);

-- ─── [6] Chamada com código de direito inexistente → retorno gracioso ─────────
-- Esperado: permitido = false (direito não encontrado nos arrays)
SELECT validar_direito_administrado(
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'codigo_que_nao_existe',
  'brasil'
);

-- ─── [7] Verificar COMMENT ON FUNCTION registrado ────────────────────────────
-- Esperado: texto longo com as 8 Regras Máximas
SELECT obj_description(
  (SELECT oid FROM pg_proc
   WHERE proname = 'validar_direito_administrado' AND pronargs = 7),
  'pg_proc'
) AS comentario_da_funcao;

-- ─── [8] Estrutura do JSONB de retorno (campos esperados) ────────────────────
-- Esperado: todos os campos presentes incluindo obra_coberta
SELECT
  jsonb_object_keys(
    validar_direito_administrado(
      '00000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000002'::uuid,
      'comunicacao_publico',
      'brasil'
    )
  ) AS campo_retornado
ORDER BY 1;
-- Esperado: direito_codigo, motivo, negocio_editorial_id, obra_coberta,
--           pct_administradora, pct_editora_original, permitido, territorio
