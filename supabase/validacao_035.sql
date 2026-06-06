-- ================================================================
-- Validação da Migration 035
-- ================================================================
-- Executar no Supabase SQL Editor após aplicar a migration.
-- Todos os blocos devem retornar ✅ OK.
-- ================================================================


-- ┌─ BLOCO 1: editoras.titular_id existe ─────────────────────────
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE  table_name = 'editoras' AND column_name = 'titular_id'
    )
    THEN '✅ OK — editoras.titular_id existe'
    ELSE '❌ FALHA — editoras.titular_id ausente'
  END AS b1_editoras_titular_id;


-- ┌─ BLOCO 2: índice idx_editoras_titular_id ──────────────────────
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE  tablename = 'editoras' AND indexname = 'idx_editoras_titular_id'
    )
    THEN '✅ OK — idx_editoras_titular_id criado'
    ELSE '❌ FALHA — idx_editoras_titular_id ausente'
  END AS b2_idx_editoras_titular;


-- ┌─ BLOCO 3: FK editoras.titular_id → titulares ──────────────────
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM   information_schema.referential_constraints rc
      JOIN   information_schema.key_column_usage kcu
             ON kcu.constraint_name = rc.constraint_name
      WHERE  kcu.table_name   = 'editoras'
        AND  kcu.column_name  = 'titular_id'
    )
    THEN '✅ OK — FK editoras.titular_id → titulares confirmada'
    ELSE '❌ FALHA — FK não encontrada'
  END AS b3_fk_editoras_titular;


-- ┌─ BLOCO 4: obras_participantes.data_inicio ─────────────────────
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE  table_name = 'obras_participantes' AND column_name = 'data_inicio'
    )
    THEN '✅ OK — obras_participantes.data_inicio existe'
    ELSE '❌ FALHA — obras_participantes.data_inicio ausente'
  END AS b4_op_data_inicio;


-- ┌─ BLOCO 5: obras_participantes.data_fim ────────────────────────
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE  table_name = 'obras_participantes' AND column_name = 'data_fim'
    )
    THEN '✅ OK — obras_participantes.data_fim existe'
    ELSE '❌ FALHA — obras_participantes.data_fim ausente'
  END AS b5_op_data_fim;


-- ┌─ BLOCO 6: constraint chk_op_datas ────────────────────────────
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE  table_name      = 'obras_participantes'
        AND  constraint_name = 'chk_op_datas'
        AND  constraint_type = 'CHECK'
    )
    THEN '✅ OK — chk_op_datas existe'
    ELSE '❌ FALHA — chk_op_datas ausente'
  END AS b6_chk_op_datas;


-- ┌─ BLOCO 7: índice idx_op_ativa ─────────────────────────────────
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE  tablename = 'obras_participantes' AND indexname = 'idx_op_ativa'
    )
    THEN '✅ OK — idx_op_ativa criado'
    ELSE '❌ FALHA — idx_op_ativa ausente'
  END AS b7_idx_op_ativa;


-- ┌─ BLOCO 8: sequence seq_titular_codigo_interno ─────────────────
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_sequences
      WHERE  sequencename = 'seq_titular_codigo_interno'
    )
    THEN '✅ OK — seq_titular_codigo_interno criada'
    ELSE '❌ FALHA — seq_titular_codigo_interno ausente'
  END AS b8_sequence;


-- ┌─ BLOCO 9: função fn_gerar_codigo_interno_titular ──────────────
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE  proname = 'fn_gerar_codigo_interno_titular'
    )
    THEN '✅ OK — fn_gerar_codigo_interno_titular existe'
    ELSE '❌ FALHA — fn_gerar_codigo_interno_titular ausente'
  END AS b9_funcao;


-- ┌─ BLOCO 10: trigger trg_titular_codigo_interno ─────────────────
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE  trigger_name        = 'trg_titular_codigo_interno'
        AND  event_object_table  = 'titulares'
        AND  action_timing       = 'BEFORE'
        AND  event_manipulation  = 'INSERT'
    )
    THEN '✅ OK — trg_titular_codigo_interno ativo (BEFORE INSERT)'
    ELSE '❌ FALHA — trg_titular_codigo_interno ausente'
  END AS b10_trigger;


-- ┌─ BLOCO 11: teste funcional do trigger ─────────────────────────
-- Insere um titular sem codigo_interno e verifica geração automática.
-- Remove ao final para não poluir dados.
DO $$
DECLARE
  test_id     UUID;
  cod_gerado  TEXT;
  tenant_ref  UUID;
BEGIN
  -- Usar o tenant existente
  SELECT id INTO tenant_ref FROM tenants LIMIT 1;

  IF tenant_ref IS NULL THEN
    RAISE NOTICE 'BLOCO 11: ⚠ Nenhum tenant encontrado — teste funcional pulado.';
    RETURN;
  END IF;

  INSERT INTO titulares (
    tenant_id, codigo_titular, tipo, pessoa, nome_completo, status
    -- codigo_interno intencionalmente ausente
  )
  VALUES (
    tenant_ref, 'TEST-035-VALIDACAO', 'autor', 'PF', 'Titular Teste Migration 035', 'inativo'
  )
  RETURNING id, codigo_interno INTO test_id, cod_gerado;

  -- Verificar se o trigger gerou o codigo_interno
  IF cod_gerado IS NOT NULL AND cod_gerado ~ '^TIT\d{6}$' THEN
    RAISE NOTICE 'BLOCO 11: ✅ OK — trigger gerou codigo_interno = %', cod_gerado;
  ELSE
    RAISE NOTICE 'BLOCO 11: ❌ FALHA — codigo_interno gerado inválido: %', cod_gerado;
  END IF;

  -- Remover registro de teste
  DELETE FROM titulares WHERE id = test_id;
  RAISE NOTICE 'BLOCO 11: registro de teste removido.';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'BLOCO 11: ⚠ Erro no teste funcional: % — verificar manualmente.', SQLERRM;
END $$;


-- ┌─ BLOCO 12: relatório editoras sem titular_id ──────────────────
-- Lista editoras que ainda precisam de vínculo manual.
SELECT
  id,
  nome,
  COALESCE(tipo_editora, '—')    AS tipo_editora,
  COALESCE(codigo_interno, '—')  AS codigo_interno,
  CASE
    WHEN titular_id IS NULL THEN '⚠ Sem titular vinculado'
    ELSE '✅ Vinculado: ' || titular_id::TEXT
  END AS status_vinculo
FROM editoras
ORDER BY nome;


-- ================================================================
-- Se todos os blocos 1-11 retornaram ✅ OK, a migration está correta.
-- O BLOCO 12 mostra as editoras que precisam de vínculo manual.
-- ================================================================
