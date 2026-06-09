-- ============================================================
-- LIMPEZA DE DADOS DE HOMOLOGAÇÃO
-- Executar no Supabase SQL Editor
-- Dados criados durante testes: HOMOLOGAÇÃO — TESTE 001 / CTR-HML-001
-- ============================================================

BEGIN;

-- 1. Identificar obra HML
DO $$
DECLARE
  v_obra_id   UUID;
  v_contrato_id UUID;
BEGIN

  SELECT id INTO v_obra_id
  FROM obras
  WHERE titulo ILIKE '%HOMOLOG%'
     OR titulo ILIKE '%TESTE 001%'
     OR codigo_obra ILIKE 'TSM-HML%'
  LIMIT 1;

  SELECT id INTO v_contrato_id
  FROM contratos
  WHERE numero_contrato ILIKE 'CTR-HML%'
     OR observacoes ILIKE '%homolog%'
  LIMIT 1;

  -- 2. Remover vínculos da obra
  IF v_obra_id IS NOT NULL THEN
    DELETE FROM obras_participantes       WHERE obra_id = v_obra_id;
    DELETE FROM obras_links_titulares     WHERE obra_id = v_obra_id;
    DELETE FROM obras_links              WHERE obra_id = v_obra_id;
    DELETE FROM fonogramas              WHERE obra_id = v_obra_id;
    DELETE FROM obras                   WHERE id      = v_obra_id;
    RAISE NOTICE 'Obra HML removida: %', v_obra_id;
  ELSE
    RAISE NOTICE 'Nenhuma obra HML encontrada.';
  END IF;

  -- 3. Remover contrato HML
  IF v_contrato_id IS NOT NULL THEN
    DELETE FROM contratos WHERE id = v_contrato_id;
    RAISE NOTICE 'Contrato HML removido: %', v_contrato_id;
  ELSE
    RAISE NOTICE 'Nenhum contrato HML encontrado.';
  END IF;

END $$;

COMMIT;

-- ============================================================
-- VERIFICAÇÃO PÓS-LIMPEZA
-- ============================================================
SELECT 'obras'     AS tabela, COUNT(*) FROM obras     WHERE titulo ILIKE '%homolog%' OR codigo_obra ILIKE 'TSM-HML%'
UNION ALL
SELECT 'contratos' AS tabela, COUNT(*) FROM contratos WHERE numero_contrato ILIKE 'CTR-HML%';
-- Esperado: 0 rows em ambas
