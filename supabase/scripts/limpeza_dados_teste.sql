-- =======================================================
-- LIMPEZA DOS DADOS DE TESTE
-- Execute APÓS conferir o script de conferência
--
-- O QUE É APAGADO:
--   obras, obras_links, obras_links_titulares (cascade)
--   obras_links_titulares_direitos (cascade)
--   obras_analitico
--   titulares
--   contratos
--   recebimentos
--   cc_obras_movimentos
--   distribuicao_itens
--   negocios_editoriais (confirmado pelo usuário em 05/06/2026)
--   backoffice_obras_status
--
-- O QUE É MANTIDO:
--   tenants
--   usuarios
--   editoras  ← mantidas para reuso no cadastro real
--   tipos_direito (globais — tenant_id IS NULL, não são afetados)
--   tipos_participante
--   migrations (não são dados)
-- =======================================================

DO $$
DECLARE
  v_tenant     UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  n_cc         INT;
  n_analitico  INT;
  n_recebs     INT;
  n_contratos  INT;
  n_links      INT;
  n_obras      INT;
  n_titulares  INT;
  n_negocios   INT;
BEGIN

  -- ── CC Obras Movimentos ──────────────────────────────────────────────────
  SELECT COUNT(*) INTO n_cc FROM cc_obras_movimentos WHERE tenant_id = v_tenant;
  DELETE FROM cc_obras_movimentos WHERE tenant_id = v_tenant;
  RAISE NOTICE 'cc_obras_movimentos apagados: %', n_cc;

  -- ── Obras Analítico ──────────────────────────────────────────────────────
  SELECT COUNT(*) INTO n_analitico FROM obras_analitico WHERE tenant_id = v_tenant;
  DELETE FROM obras_analitico WHERE tenant_id = v_tenant;
  RAISE NOTICE 'obras_analitico apagados: %', n_analitico;

  -- ── Recebimentos (e distribuicao_itens via FK) ───────────────────────────
  SELECT COUNT(*) INTO n_recebs FROM recebimentos WHERE tenant_id = v_tenant;
  DELETE FROM distribuicao_itens
  WHERE recebimento_id IN (
    SELECT id FROM recebimentos WHERE tenant_id = v_tenant
  );
  DELETE FROM recebimentos WHERE tenant_id = v_tenant;
  RAISE NOTICE 'recebimentos apagados: %', n_recebs;

  -- ── Contratos ────────────────────────────────────────────────────────────
  SELECT COUNT(*) INTO n_contratos FROM contratos WHERE tenant_id = v_tenant;
  DELETE FROM contratos WHERE tenant_id = v_tenant;
  RAISE NOTICE 'contratos apagados: %', n_contratos;

  -- ── Obras (cascade apaga links, titulares do link, direitos do link) ─────
  SELECT COUNT(*) INTO n_links FROM obras_links WHERE tenant_id = v_tenant;
  SELECT COUNT(*) INTO n_obras FROM obras WHERE tenant_id = v_tenant;
  DELETE FROM obras WHERE tenant_id = v_tenant;
  RAISE NOTICE 'obras apagadas: %  |  links removidos via cascade: %', n_obras, n_links;

  -- ── Titulares ────────────────────────────────────────────────────────────
  SELECT COUNT(*) INTO n_titulares FROM titulares WHERE tenant_id = v_tenant;
  DELETE FROM titulares WHERE tenant_id = v_tenant;
  RAISE NOTICE 'titulares apagados: %', n_titulares;

  -- ── Negócios Editoriais (confirmado para apagar — dados de teste) ─────────
  SELECT COUNT(*) INTO n_negocios FROM negocios_editoriais WHERE tenant_id = v_tenant;
  DELETE FROM negocios_editoriais WHERE tenant_id = v_tenant;
  RAISE NOTICE 'negocios_editoriais apagados: %', n_negocios;

  -- ── BackOffice status (se existir) ───────────────────────────────────────
  BEGIN
    DELETE FROM backoffice_obras_status WHERE tenant_id = v_tenant;
    RAISE NOTICE 'backoffice_obras_status limpo';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'backoffice_obras_status: tabela nao existe (ok)';
  END;

  -- ── Verificação final ────────────────────────────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '✅ Limpeza concluída. Estado atual:';
  RAISE NOTICE '   obras              : %', (SELECT COUNT(*) FROM obras              WHERE tenant_id = v_tenant);
  RAISE NOTICE '   titulares          : %', (SELECT COUNT(*) FROM titulares          WHERE tenant_id = v_tenant);
  RAISE NOTICE '   contratos          : %', (SELECT COUNT(*) FROM contratos          WHERE tenant_id = v_tenant);
  RAISE NOTICE '   recebimentos       : %', (SELECT COUNT(*) FROM recebimentos       WHERE tenant_id = v_tenant);
  RAISE NOTICE '   obras_analitico    : %', (SELECT COUNT(*) FROM obras_analitico    WHERE tenant_id = v_tenant);
  RAISE NOTICE '   cc_obras_movimentos: %', (SELECT COUNT(*) FROM cc_obras_movimentos WHERE tenant_id = v_tenant);
  RAISE NOTICE '   negocios_editoriais: %', (SELECT COUNT(*) FROM negocios_editoriais WHERE tenant_id = v_tenant);
  RAISE NOTICE '';
  RAISE NOTICE '   MANTIDOS:';
  RAISE NOTICE '   editoras           : %', (SELECT COUNT(*) FROM editoras           WHERE tenant_id = v_tenant);
  RAISE NOTICE '   tipos_direito glob : %', (SELECT COUNT(*) FROM tipos_direito      WHERE tenant_id IS NULL);
  RAISE NOTICE '';
  RAISE NOTICE '→ Próximos passos:';
  RAISE NOTICE '   1. Cadastrar editoras reais (se necessário)';
  RAISE NOTICE '   2. Cadastrar negócios editoriais reais pela UI';
  RAISE NOTICE '   3. Reimportar CWR real';
  RAISE NOTICE '   4. Executar bridge → validar analítico';

END $$;
