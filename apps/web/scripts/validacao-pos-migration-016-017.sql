-- ════════════════════════════════════════════════════════════════════════
--  VALIDAÇÃO PÓS-MIGRATION 016 + 017 — Sync Mood
--  Cole e execute cada bloco no SQL Editor do Supabase Dashboard
--  Resultado esperado em cada query está nos comentários
-- ════════════════════════════════════════════════════════════════════════


-- ── BLOCO 1: Verificar tabelas criadas pela Migration 016 ────────────────────
-- Esperado: todas as 5 tabelas presentes com rowsecurity = true
SELECT
  tablename,
  rowsecurity AS rls_ativo
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'tipos_direito',
    'tipos_participante',
    'obras_links_titulares_direitos',
    'obras_analitico',
    'negocios_editoriais'
  )
ORDER BY tablename;

-- Resultado esperado:
-- negocios_editoriais          | true
-- obras_analitico              | true
-- obras_links_titulares_direitos | true
-- tipos_direito                | true
-- tipos_participante           | true


-- ── BLOCO 2: Verificar tabelas SEM RLS (deve retornar 0 linhas) ──────────────
-- Esperado: resultado VAZIO — todas as tabelas de negócio têm RLS
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT IN (
    'schema_migrations',
    'spatial_ref_sys'
  )
ORDER BY tablename;

-- Resultado esperado: (0 linhas)


-- ── BLOCO 3: Verificar seeds de tipos_direito ────────────────────────────────
-- Esperado: pelo menos 4 tipos globais (tenant_id IS NULL)
SELECT codigo, nome, tenant_id
FROM tipos_direito
ORDER BY tenant_id NULLS FIRST, codigo;

-- Resultado esperado (seeds globais da migration 016):
-- digital          | Fono Digital         | NULL
-- exec_publica     | Execução Pública     | NULL
-- mecanico         | Mecânicos            | NULL
-- sincronizacao    | Sincronização        | NULL


-- ── BLOCO 4: Verificar seeds de tipos_participante ───────────────────────────
-- Esperado: tipos básicos presentes
SELECT codigo, nome
FROM tipos_participante
ORDER BY codigo;

-- Resultado esperado:
-- autor | cessionario_pj | cessionario_pf | editora_administrada
-- editora_administradora | herdeiro | licenciante | subeditor_internacional


-- ── BLOCO 5: Verificar políticas RLS por tabela ──────────────────────────────
-- Esperado: pelo menos 1 policy por tabela listada
SELECT
  tablename,
  policyname,
  cmd AS operacao
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tipos_direito',
    'tipos_participante',
    'obras_links_titulares_direitos',
    'obras_analitico',
    'negocios_editoriais'
  )
ORDER BY tablename, cmd;


-- ── BLOCO 6: Verificar campos adicionados a recebimentos pela 016 ───────────
-- Esperado: colunas tipo_direito_id, territorio, competencia_inicio/fim,
--           fonte_pagadora_tipo, fonte_pagadora_codigo, versao_calculo presentes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'recebimentos'
  AND column_name IN (
    'tipo_direito_id',
    'territorio',
    'competencia_inicio',
    'competencia_fim',
    'fonte_pagadora_codigo',
    'fonte_pagadora_tipo',
    'valor_brl',
    'cotacao_brl',
    'moeda'
  )
ORDER BY column_name;


-- ── BLOCO 7: Verificar campos de obras_analitico ────────────────────────────
-- Esperado: todos os campos críticos do motor financeiro presentes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'obras_analitico'
  AND column_name IN (
    'id', 'obra_id', 'tenant_id',
    'titular_id', 'editora_id',
    'nome_participante', 'tipo_participante_codigo',
    'percentual_sobre_obra', 'percentual_sobre_origem',
    'origem_participante_id', 'obra_link_origem_id',
    'tipo_direito_id', 'territorio',
    'status_calculo', 'pendencia',
    'versao_calculo', 'invalidado_em',
    'calculado_por', 'negocio_editorial_id',
    'contrato_id', 'nivel_distribuicao'
  )
ORDER BY column_name;

-- Resultado esperado: 21 linhas (todos os campos acima)


-- ── BLOCO 8: Verificar campos de cc_obras_movimentos ────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cc_obras_movimentos'
  AND column_name IN (
    'analitico_linha_id',
    'tipo_direito_id',
    'territorio',
    'competencia_inicio',
    'competencia_fim',
    'fonte_pagadora_codigo',
    'fonte_pagadora_tipo',
    'status_movimento',
    'pendencia',
    'versao_calculo'
  )
ORDER BY column_name;

-- Resultado esperado: 10 linhas


-- ── BLOCO 9: TESTE COMPLETO DO CICLO — inserir dados de teste e validar ──────
-- ATENÇÃO: Execute apenas em homologação ou em tenant de teste.
-- Substitua 'SEU-TENANT-ID' pelo ID real do tenant de teste.

-- 9a. Inserir tipo de direito de teste (se ainda não existir pelo seed)
INSERT INTO tipos_direito (id, codigo, nome, tenant_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'digital', 'Fono Digital', NULL
)
ON CONFLICT (id) DO NOTHING;

-- 9b. Inserir tipo de participante de teste
INSERT INTO tipos_participante (id, codigo, nome)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'autor',                  'Autor'),
  ('00000000-0000-0000-0000-000000000011', 'editora_administrada',   'Editora Administrada'),
  ('00000000-0000-0000-0000-000000000012', 'editora_administradora', 'Editora Administradora')
ON CONFLICT (id) DO NOTHING;

-- 9c. Verificar se analítico de uma obra existe
-- (substitua pelo ID de uma obra real do banco)
SELECT
  oa.nome_participante,
  oa.tipo_participante_codigo,
  oa.percentual_sobre_obra,
  td.codigo AS tipo_direito,
  oa.territorio,
  oa.status_calculo,
  oa.pendencia,
  oa.versao_calculo,
  oa.invalidado_em
FROM obras_analitico oa
LEFT JOIN tipos_direito td ON td.id = oa.tipo_direito_id
WHERE oa.invalidado_em IS NULL
-- AND oa.obra_id = 'UUID-DA-OBRA'
ORDER BY oa.versao_calculo DESC, oa.nivel_distribuicao;


-- ── BLOCO 10: Verificar movimentos do CC Obra após processar recebimento ─────
-- Execute após rodar o botão ▶ na tela de Recebimentos
SELECT
  ccm.nome_participante,
  ccm.tipo_participante_codigo,
  ccm.percentual_sobre_obra,
  ccm.valor_bruto_participante,
  ccm.valor_liquido_participante,
  ccm.status_movimento,
  ccm.pendencia,
  td.codigo   AS tipo_direito,
  ccm.territorio,
  ccm.competencia_inicio,
  ccm.competencia_fim,
  ccm.fonte_pagadora_codigo,
  ccm.versao_calculo,
  ccm.analitico_linha_id
FROM cc_obras_movimentos ccm
LEFT JOIN tipos_direito td ON td.id = ccm.tipo_direito_id
-- WHERE ccm.recebimento_id = 'UUID-DO-RECEBIMENTO'
ORDER BY ccm.status_movimento, ccm.nome_participante;

-- Validações manuais esperadas:
-- 1. Soma de valor_bruto_participante = valor_bruto do recebimento ✓
-- 2. Linhas 'calculado' têm valor_liquido > 0 ✓
-- 3. Linhas 'retido_pendencia' têm valor_liquido = 0 ✓
-- 4. tipo_direito_id preenchido em todas as linhas ✓
-- 5. territorio preenchido em todas as linhas ✓
-- 6. analitico_linha_id aponta para obras_analitico.id real ✓

-- Verificação de soma:
SELECT
  SUM(valor_bruto_participante) AS soma_participantes,
  SUM(CASE WHEN status_movimento = 'distribuido'       THEN valor_bruto_participante ELSE 0 END) AS distribuido,
  SUM(CASE WHEN status_movimento = 'retido_pendencia'  THEN valor_bruto_participante ELSE 0 END) AS retido
FROM cc_obras_movimentos
-- WHERE recebimento_id = 'UUID-DO-RECEBIMENTO'
;

-- Resultado esperado:
-- soma_participantes = valor_bruto do recebimento
-- distribuido + retido = soma_participantes


-- ── BLOCO 11: Verificar idempotência (reprocessar não duplica) ───────────────
-- Execute PATCH no recebimento 2x e depois:
SELECT
  recebimento_id,
  COUNT(*) AS qtd_movimentos,
  SUM(valor_bruto_participante) AS soma
FROM cc_obras_movimentos
-- WHERE recebimento_id = 'UUID-DO-RECEBIMENTO'
GROUP BY recebimento_id;

-- Resultado esperado: sempre o mesmo número de linhas, independente de quantas
-- vezes o recebimento foi processado (DELETE antes do INSERT garante idempotência)


-- ── BLOCO 12: Verificar versionamento do analítico ───────────────────────────
-- Se a bridge for executada 2x, a primeira versão deve ter invalidado_em preenchido
SELECT
  versao_calculo,
  status_calculo,
  invalidado_em,
  COUNT(*) AS linhas
FROM obras_analitico
-- WHERE obra_id = 'UUID-DA-OBRA'
GROUP BY versao_calculo, status_calculo, invalidado_em
ORDER BY versao_calculo;

-- Resultado esperado:
-- v1 → invalidado_em IS NOT NULL (histórico)
-- v2 → invalidado_em IS NULL (vigente)
