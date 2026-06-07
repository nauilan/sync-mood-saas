-- ═══════════════════════════════════════════════════════════════════════════════
-- VALIDAÇÃO 038 — fn_validar_direito_administrado
-- ═══════════════════════════════════════════════════════════════════════════════
-- Cole este script no SQL Editor do Supabase e confira todos os blocos.

-- [1] Função existe no banco
SELECT
  CASE WHEN COUNT(*) = 1
    THEN '✅ OK — função validar_direito_administrado criada'
    ELSE '❌ PENDENTE — função não encontrada. Rode a migration 038.'
  END AS resultado_funcao
FROM pg_proc
WHERE proname = 'validar_direito_administrado';

-- [2] Assinatura completa da função (verificação visual)
SELECT
  pg_get_function_arguments(p.oid) AS argumentos,
  pg_get_function_result(p.oid)    AS retorno
FROM pg_proc p
WHERE p.proname = 'validar_direito_administrado';

-- [3] Teste de negócio inexistente — deve retornar permitido=false
SELECT validar_direito_administrado(
  '00000000-0000-0000-0000-000000000001'::uuid,   -- editora_original_id fictício
  '00000000-0000-0000-0000-000000000002'::uuid,   -- administradora_id fictício
  'execucao_publica',
  'brasil',
  CURRENT_DATE,
  NULL                                            -- p_tenant_id=NULL: sem filtro de tenant (teste)
) AS teste_negocio_inexistente;
-- Esperado: { "permitido": false, "motivo": "Nenhum negócio editorial ativo..." }

-- [4] Normalização de território — verificação manual dos casos
-- Executar individualmente se houver negócios reais cadastrados:
-- SELECT validar_direito_administrado(id_editora, id_top_show, 'fonodigital', 'brasil');
-- SELECT validar_direito_administrado(id_editora, id_top_show, 'fonodigital', 'BR');
-- SELECT validar_direito_administrado(id_editora, id_top_show, 'fonodigital', 'ar');
-- SELECT validar_direito_administrado(id_editora, id_top_show, 'fonodigital', 'US');

-- [5] Verificar que os campos direitos_brasil/exterior existem em negocios_editoriais
-- (confirma que a migration 037 foi aplicada antes da 038)
SELECT
  CASE WHEN COUNT(*) = 4
    THEN '✅ OK — colunas da migration 037 presentes (pré-requisito da 038)'
    ELSE '❌ ATENÇÃO — migration 037 não aplicada. direitos_brasil/exterior ausentes.'
  END AS resultado_prereq_037
FROM information_schema.columns
WHERE table_name  = 'negocios_editoriais'
  AND column_name IN ('direitos_brasil','direitos_exterior','percentuais_brasil','percentuais_exterior');

-- [6] Lembrete de uso nos módulos futuros
SELECT
  '⚠️  LEMBRETE: Todos os módulos que geram receita, licença, cobrança ou distribuição '
  'DEVEM chamar validar_direito_administrado() antes de prosseguir. '
  'Se permitido=false, bloquear ou enviar para fila de pendências.' AS regra_obrigatoria;
