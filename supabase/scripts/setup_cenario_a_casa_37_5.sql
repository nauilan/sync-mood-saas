-- =======================================================
-- SETUP CENÁRIO: A CASA — Roberto 50% → LR Edições 25%
-- → Top Show Music 60/40
--
-- Resultado esperado no Analítico:
--   Roberto Sampaio  = 37,5% (50% × 75%)
--   LR Edições       = 7,5%  (50% × 25% × 60%)
--   Top Show Music   = 5%    (50% × 25% × 40%)
--
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor)
-- =======================================================

DO $$
DECLARE
  v_tenant     UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_obra_id    UUID;
  v_lr_id      UUID;
  v_tsm_id     UUID;
  v_roberto_id UUID;
  v_link_id    UUID;
  v_td_fono    UUID;
BEGIN

  -- ── 0. Lookup obra A CASA ─────────────────────────────────────────────────
  SELECT id INTO v_obra_id
  FROM obras
  WHERE tenant_id = v_tenant
    AND titulo ILIKE '%CASA%'
  ORDER BY created_at
  LIMIT 1;

  IF v_obra_id IS NULL THEN
    RAISE EXCEPTION 'Obra A CASA não encontrada no tenant %', v_tenant;
  END IF;
  RAISE NOTICE 'Obra A CASA ID: %', v_obra_id;

  -- ── 1. Lookup/insert Top Show Music (administradora) ─────────────────────
  -- Tenta primeiro pelo UUID seed (migração 011)
  SELECT id INTO v_tsm_id FROM editoras
  WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';

  -- Fallback: busca por nome_fantasia
  IF v_tsm_id IS NULL THEN
    SELECT id INTO v_tsm_id FROM editoras
    WHERE tenant_id = v_tenant
      AND nome_fantasia ILIKE '%Top Show%'
    ORDER BY created_at
    LIMIT 1;
  END IF;

  IF v_tsm_id IS NULL THEN
    RAISE EXCEPTION 'Editora Top Show Music não encontrada. Verifique o cadastro.';
  END IF;
  RAISE NOTICE 'Top Show Music ID: %', v_tsm_id;

  -- ── 2. Lookup/insert LR Edições ──────────────────────────────────────────
  SELECT id INTO v_lr_id FROM editoras
  WHERE tenant_id = v_tenant
    AND nome_fantasia ILIKE '%LR%'
  ORDER BY created_at
  LIMIT 1;

  IF v_lr_id IS NULL THEN
    INSERT INTO editoras (
      tenant_id, razao_social, nome_fantasia, cnpj, pais,
      tipo_editora, controlada, status
    )
    VALUES (
      v_tenant,
      'LR Edicoes Musicais Ltda',
      'LR Edições',
      '33.333.333/0001-33',
      'BR',
      'administrada',
      true,
      'ativo'
    )
    RETURNING id INTO v_lr_id;
    RAISE NOTICE 'LR Edições criada com ID: %', v_lr_id;
  ELSE
    RAISE NOTICE 'LR Edições já existe — ID: %', v_lr_id;
  END IF;

  -- ── 3. Lookup/insert Roberto Sampaio ─────────────────────────────────────
  SELECT id INTO v_roberto_id FROM titulares
  WHERE tenant_id = v_tenant
    AND nome_completo ILIKE '%Roberto Sampaio%'
  ORDER BY created_at
  LIMIT 1;

  IF v_roberto_id IS NULL THEN
    INSERT INTO titulares (
      tenant_id, codigo_titular, tipo, pessoa,
      nome_completo, nome_artistico, status
    )
    VALUES (
      v_tenant, 'T-ROBERTO', 'autor', 'PF',
      'Roberto Sampaio', 'Roberto Sampaio', 'ativo'
    )
    ON CONFLICT (tenant_id, codigo_titular) DO NOTHING
    RETURNING id INTO v_roberto_id;

    -- se ON CONFLICT disparou, busca pelo código
    IF v_roberto_id IS NULL THEN
      SELECT id INTO v_roberto_id FROM titulares
      WHERE tenant_id = v_tenant AND codigo_titular = 'T-ROBERTO';
    END IF;
    RAISE NOTICE 'Roberto Sampaio criado/localizado com ID: %', v_roberto_id;
  ELSE
    RAISE NOTICE 'Roberto Sampaio já existe — ID: %', v_roberto_id;
  END IF;

  -- ── 4. Recriar link de A CASA ─────────────────────────────────────────────
  DELETE FROM obras_links WHERE obra_id = v_obra_id AND tenant_id = v_tenant;

  INSERT INTO obras_links (
    tenant_id, obra_id, numero_link, percentual_link, tipo_link, controlado, status
  )
  VALUES (v_tenant, v_obra_id, 1, 100, 'controlado', true, 'ativo')
  RETURNING id INTO v_link_id;
  RAISE NOTICE 'obras_links criado ID: %', v_link_id;

  -- ── 5. Roberto Sampaio: CA — 50% da obra, editora_original = LR Edições ──
  INSERT INTO obras_links_titulares (
    tenant_id, obra_link_id, obra_id,
    titular_id, editora_id, nome,
    funcao_no_link, papel,
    percentual_fonomecanico, percentual_exec_publica, percentual_sincronizacao,
    controlado, editora_original_id, status_controle
  )
  VALUES (
    v_tenant, v_link_id, v_obra_id,
    v_roberto_id, NULL, 'Roberto Sampaio',
    'CA', 'autor',
    50, 50, 50,
    true, v_lr_id,
    'nao_controlado'
  );

  -- ── 6. LR Edições: E — linha editorial (percentual 0, vem do contrato) ───
  INSERT INTO obras_links_titulares (
    tenant_id, obra_link_id, obra_id,
    editora_id, nome, funcao_no_link, papel,
    percentual_fonomecanico, percentual_exec_publica, percentual_sincronizacao,
    controlado, status_controle
  )
  VALUES (
    v_tenant, v_link_id, v_obra_id,
    v_lr_id, 'LR Edições', 'E', 'editora',
    0, 0, 0,
    true, 'controlado'
  );

  -- ── 7. Contrato: Roberto → LR (75% autor / 25% editorial) ────────────────
  DELETE FROM contratos
  WHERE tenant_id = v_tenant
    AND titular_id = v_roberto_id
    AND editora_id = v_lr_id;

  INSERT INTO contratos (
    tenant_id, titular_id, editora_id, tipo_contrato,
    percentual_autor, percentual_editora, status, data_inicio
  )
  VALUES (
    v_tenant, v_roberto_id, v_lr_id, 'administracao',
    75, 25, 'vigente', CURRENT_DATE - INTERVAL '1 year'
  );
  RAISE NOTICE 'Contrato Roberto → LR criado (75%% / 25%%)';

  -- ── 8. Tipo de Direito (busca na ordem: digital, fono_digital, DSP) ───────
  SELECT id INTO v_td_fono
  FROM tipos_direito
  WHERE tenant_id = v_tenant
    AND codigo IN ('FONO_DIGITAL', 'fono_digital', 'digital', 'DSP', 'DIGITAL')
  ORDER BY CASE codigo
    WHEN 'FONO_DIGITAL' THEN 1
    WHEN 'fono_digital' THEN 2
    WHEN 'DIGITAL'      THEN 3
    WHEN 'digital'      THEN 4
    WHEN 'DSP'          THEN 5
    ELSE 9
  END
  LIMIT 1;

  IF v_td_fono IS NULL THEN
    -- Fallback: qualquer tipo de direito ativo
    SELECT id INTO v_td_fono FROM tipos_direito
    WHERE tenant_id = v_tenant AND status = 'ativo'
    ORDER BY created_at LIMIT 1;
    RAISE NOTICE '⚠ Tipo Fono/Digital não encontrado — usando fallback: %', v_td_fono;
  ELSE
    RAISE NOTICE 'Tipo Direito ID: %', v_td_fono;
  END IF;

  -- ── 9. Negócio Editorial: LR Edições → Top Show (60/40, BR) ──────────────
  DELETE FROM negocios_editoriais
  WHERE tenant_id = v_tenant
    AND editora_administrada_id = v_lr_id
    AND editora_administradora_id = v_tsm_id;

  INSERT INTO negocios_editoriais (
    tenant_id, nome,
    editora_administrada_id, editora_administrada_nome,
    editora_administradora_id, editora_administradora_nome,
    percentual_administrada, percentual_administradora,
    tipo_direito_id, territorios, abrangencia_tipo,
    data_inicio, status
  )
  VALUES (
    v_tenant,
    'LR Edições → Top Show Music (Fono Digital BR)',
    v_lr_id, 'LR Edições',
    v_tsm_id, 'Top Show Music',
    60, 40,
    v_td_fono, '["brasil","BR"]'::jsonb, 'catalogo_inteiro',
    CURRENT_DATE - INTERVAL '1 year', 'ativo'
  );
  RAISE NOTICE 'Negócio Editorial criado (60%% LR / 40%% Top Show)';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Setup concluído com sucesso!';
  RAISE NOTICE 'Obra ID    : %', v_obra_id;
  RAISE NOTICE 'LR Edições : %', v_lr_id;
  RAISE NOTICE 'Top Show   : %', v_tsm_id;
  RAISE NOTICE 'Roberto    : %', v_roberto_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  1. Abra a obra A CASA no sistema';
  RAISE NOTICE '  2. Clique em "Analítico"';
  RAISE NOTICE '  3. Resultado esperado:';
  RAISE NOTICE '     Roberto Sampaio = 37,5%%';
  RAISE NOTICE '     LR Edições      = 7,5%%';
  RAISE NOTICE '     Top Show Music  = 5%%';

END $$;
