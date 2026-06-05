-- ============================================================
-- TESTE DO CICLO FINANCEIRO — Sync Mood
-- Cenário: Obra "A CASA" — CA=75%, E=25%, Negócio E→AM 60/40
-- Resultado esperado: Autor=75%, P3=15%, TopShow=10%
-- Execute no Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  v_tenant      UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_ed_adm      UUID := gen_random_uuid();   -- P3 Editora (administrada)
  v_ed_admr     UUID := gen_random_uuid();   -- Top Show Music (administradora)
  v_obra        UUID := gen_random_uuid();
  v_link        UUID := gen_random_uuid();
  v_tit_ca      UUID := gen_random_uuid();   -- Titular autor (CA)
  v_tit_e       UUID := gen_random_uuid();   -- Titular editora (E)
  v_negocio     UUID := gen_random_uuid();
  v_receb       UUID := gen_random_uuid();
BEGIN

  -- ── 1. Editoras ──────────────────────────────────────────────
  INSERT INTO editoras (id, tenant_id, razao_social, nome_fantasia, status)
  VALUES
    (v_ed_adm,  v_tenant, 'P3 Editora Musical LTDA',   'P3 Editora',     'ativo'),
    (v_ed_admr, v_tenant, 'Top Show Music Editoracao',  'Top Show Music', 'ativo')
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Obra ──────────────────────────────────────────────────
  INSERT INTO obras (id, tenant_id, editora_id, codigo_obra, titulo,
                     status, origem_cadastro)
  VALUES (v_obra, v_tenant, v_ed_adm, 'TSM-TESTE-001', 'A CASA',
          'ativa', 'manual')
  ON CONFLICT (tenant_id, codigo_obra) DO NOTHING;

  -- ── 3. Link da obra ──────────────────────────────────────────
  INSERT INTO obras_links (id, tenant_id, obra_id, numero_link,
                            percentual_link, tipo_link, controlado, status)
  VALUES (v_link, v_tenant, v_obra, 1, 100.0000, 'controlado', TRUE, 'ativo')
  ON CONFLICT (obra_id, numero_link) DO NOTHING;

  -- ── 4a. Titular CA (Roberto Sampaio / autor) — 75% ───────────
  INSERT INTO obras_links_titulares
    (id, tenant_id, obra_link_id, obra_id,
     nome, funcao_no_link, papel,
     percentual_exec_publica, percentual_fonomecanico, percentual_sincronizacao,
     controlado, status_controle)
  VALUES
    (v_tit_ca, v_tenant, v_link, v_obra,
     'Roberto Sampaio', 'CA', 'autor',
     75.0000, 75.0000, 75.0000,
     TRUE, 'controlado')
  ON CONFLICT DO NOTHING;

  -- ── 4b. Titular E (P3 Editora) — 25%, vinculado ao editora_id ─
  INSERT INTO obras_links_titulares
    (id, tenant_id, obra_link_id, obra_id,
     nome, funcao_no_link, papel,
     percentual_exec_publica, percentual_fonomecanico, percentual_sincronizacao,
     editora_id, controlado, status_controle)
  VALUES
    (v_tit_e, v_tenant, v_link, v_obra,
     'P3 Editora', 'E', 'editora',
     25.0000, 25.0000, 25.0000,
     v_ed_adm, TRUE, 'controlado')
  ON CONFLICT DO NOTHING;

  -- ── 5. Negócio editorial: P3 → Top Show (60/40) ──────────────
  INSERT INTO negocios_editoriais
    (id, tenant_id, nome,
     editora_administrada_id,   editora_administrada_nome,
     editora_administradora_id, editora_administradora_nome,
     percentual_administrada, percentual_administradora,
     receitas_aplicaveis, abrangencia_tipo, territorios,
     data_inicio, status)
  VALUES
    (v_negocio, v_tenant, 'P3 Editora → Top Show Music (60/40)',
     v_ed_adm,  'P3 Editora',
     v_ed_admr, 'Top Show Music',
     60.0000, 40.0000,
     '["digital","exec_publica","sincronizacao","mecanico","audiovisual","publicidade","internacional","licenciamento","base_dados","outros"]',
     'catalogo_inteiro', '["mundial"]',
     '2020-01-01', 'ativo')
  ON CONFLICT DO NOTHING;

  -- ── 6. Recebimento teste (Spotify/Digital/BR/Jan 2025) ────────
  INSERT INTO recebimentos
    (id, tenant_id, obra_id, fonte, status,
     valor_bruto, moeda,
     source, song_title,
     tipo_direito_id, territorio,
     competencia_inicio, competencia_fim,
     fonte_pagadora_codigo, fonte_pagadora_nome, fonte_pagadora_tipo)
  VALUES
    (v_receb, v_tenant, v_obra,
     'backoffice_music_services', 'importado',
     1000.00, 'BRL',
     'Spotify', 'A CASA',
     '00000000-0000-0000-0000-000000000002',   -- tipo_direito = digital
     'BR',
     '2025-01-01', '2025-01-31',
     'SPOTIFY', 'Spotify', 'dsp')
  ON CONFLICT DO NOTHING;

  -- ── Saída ──────────────────────────────────────────────────────
  RAISE NOTICE '=== DADOS DE TESTE INSERIDOS ===';
  RAISE NOTICE 'Obra ID        : %', v_obra;
  RAISE NOTICE 'Recebimento ID : %', v_receb;
  RAISE NOTICE '';
  RAISE NOTICE 'Próximo passo:';
  RAISE NOTICE '  POST /api/obras/<obra_id>/analitico';
  RAISE NOTICE '  Authorization: Bearer <token>';
  RAISE NOTICE '';
  RAISE NOTICE 'Resultado esperado:';
  RAISE NOTICE '  Roberto Sampaio (autor)    = 75%%';
  RAISE NOTICE '  P3 Editora (administrada)  = 15%%  (25 x 60%%)';
  RAISE NOTICE '  Top Show Music (admradora) = 10%%  (25 x 40%%)';
  RAISE NOTICE '  TOTAL                      = 100%%';

END $$;

-- ── Verificação imediata ──────────────────────────────────────────────────────
SELECT tabela, cnt FROM (
  SELECT 'editoras'              AS tabela, count(*) AS cnt FROM editoras             WHERE tenant_id='aaaaaaaa-0000-0000-0000-000000000001'
  UNION ALL
  SELECT 'obras',                           count(*)        FROM obras                WHERE tenant_id='aaaaaaaa-0000-0000-0000-000000000001'
  UNION ALL
  SELECT 'obras_links',                     count(*)        FROM obras_links          WHERE tenant_id='aaaaaaaa-0000-0000-0000-000000000001'
  UNION ALL
  SELECT 'obras_links_titulares',           count(*)        FROM obras_links_titulares WHERE tenant_id='aaaaaaaa-0000-0000-0000-000000000001'
  UNION ALL
  SELECT 'negocios_editoriais',             count(*)        FROM negocios_editoriais  WHERE tenant_id='aaaaaaaa-0000-0000-0000-000000000001'
  UNION ALL
  SELECT 'recebimentos',                    count(*)        FROM recebimentos         WHERE tenant_id='aaaaaaaa-0000-0000-0000-000000000001'
) t;
