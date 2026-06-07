-- ================================================================
-- VALIDAÇÃO FINAL — Base de Editoras / Titulares / Negócios Editoriais
-- Executar no Supabase SQL Editor antes de cadastrar Negócios Editoriais.
-- ================================================================


-- ┌─ ITEM 1: editoras vinculadas aos seus titulares ────────────────
-- REGRA: 100% das editoras devem ter titular_id preenchido.
-- Inclusive a Organização Gestora (Top Show Music).
SELECT
  '📋 ITEM 1 — Vínculo editora → titular (100% obrigatório)' AS item,
  COUNT(*)                                  AS total_editoras,
  COUNT(titular_id)                         AS com_titular_vinculado,
  COUNT(*) - COUNT(titular_id)              AS sem_titular_vinculado,
  CASE
    WHEN COUNT(*) = COUNT(titular_id)
      THEN '✅ OK — 100% das editoras vinculadas ao titular mestre'
    ELSE '❌ PENDÊNCIA — ' || (COUNT(*) - COUNT(titular_id))::TEXT
      || ' editora(s) sem titular_id (incluindo gestora se aplicável)'
  END AS status
FROM editoras;


-- ┌─ ITEM 2: editoras sem titular_id (detalhe) ────────────────────
-- Esperado: ZERO linhas. Nenhuma editora deve ficar sem titular_id.
-- Se Top Show (master) aparecer aqui, criar o titular mestre dela
-- e rodar: UPDATE editoras SET titular_id = '<uuid>' WHERE tipo_editora = 'master'
SELECT
  '📋 ITEM 2 — Editoras sem titular_id' AS item,
  id,
  razao_social,
  COALESCE(nome_fantasia, '—')  AS nome_fantasia,
  tipo_editora,
  COALESCE(codigo_interno, '—') AS codigo_interno,
  CASE
    WHEN tipo_editora = 'master'
      THEN '⚠ PENDÊNCIA CRÍTICA — gestora (master) sem titular mestre'
    ELSE '⚠ PENDÊNCIA — editora administrada sem titular vinculado'
  END AS status
FROM editoras
WHERE titular_id IS NULL
ORDER BY tipo_editora DESC, razao_social;
-- Resultado esperado: zero linhas.


-- ┌─ ITEM 3: titular duplicado (duas editoras apontando pro mesmo) ─
-- Não pode haver dois registros de editora com o mesmo titular_id.
SELECT
  '📋 ITEM 3 — Titulares compartilhados entre editoras' AS item,
  titular_id,
  COUNT(*) AS qtd_editoras,
  STRING_AGG(COALESCE(razao_social, id::TEXT), ', ') AS editoras
FROM editoras
WHERE titular_id IS NOT NULL
GROUP BY titular_id
HAVING COUNT(*) > 1;
-- Resultado esperado: zero linhas (cada titular vinculado a uma única editora).
-- Se retornar linhas → duplicidade detectada.


-- ┌─ ITEM 4: codigo_interno preenchido em titulares e editoras ─────
SELECT
  '📋 ITEM 4a — Titulares sem codigo_interno' AS item,
  id,
  nome_completo,
  status
FROM titulares
WHERE TRIM(COALESCE(codigo_interno, '')) = ''
ORDER BY nome_completo;
-- Esperado: zero linhas.

SELECT
  '📋 ITEM 4b — Editoras sem codigo_interno' AS item,
  id,
  razao_social,
  tipo_editora
FROM editoras
WHERE TRIM(COALESCE(codigo_interno, '')) = ''
ORDER BY razao_social;
-- Esperado: zero linhas.


-- ┌─ ITEM 5: duplicidade CRUZADA de codigo_interno (editoras × titulares) ─
-- Regra: se o mesmo codigo_interno existe em uma editora E num titular
-- que NÃO é o titular vinculado a essa editora → há risco de colisão.
-- (Se editora.titular_id → titular e ambos têm o mesmo código, isso é
--  correto pois representam a mesma entidade.)
SELECT
  '📋 ITEM 5 — Colisão cruzada codigo_interno' AS item,
  e.codigo_interno,
  e.razao_social                             AS editora,
  t.nome_completo                            AS titular_conflitante,
  CASE
    WHEN e.titular_id = t.id
      THEN '✅ Mesmo par editora↔titular — correto'
    ELSE '⚠ COLISÃO — codigo_interno existe em editora e em titular NÃO vinculado'
  END AS status
FROM editoras e
JOIN titulares t ON t.codigo_interno = e.codigo_interno
WHERE e.codigo_interno IS NOT NULL
ORDER BY e.codigo_interno;
-- Esperado: todos os registros com status ✅ ou zero linhas.


-- ┌─ ITEM 6: sender_code = TSL somente na Organização Gestora ─────
-- O campo correto no banco é sender_code (não sender_id_code).
SELECT
  '📋 ITEM 6a — sender_code existe na tabela editoras' AS item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'editoras' AND column_name = 'sender_code'
    )
    THEN '✅ OK — campo sender_code encontrado'
    ELSE '❌ FALHA — campo sender_code não encontrado'
  END AS status;

SELECT
  '📋 ITEM 6b — sender_code preenchido apenas na gestora' AS item,
  id,
  razao_social,
  tipo_editora,
  sender_code,
  CASE
    WHEN tipo_editora = 'master' AND sender_code IS NOT NULL
      THEN '✅ OK — gestora com sender_code'
    WHEN tipo_editora = 'master' AND sender_code IS NULL
      THEN '⚠ PENDÊNCIA — gestora sem sender_code cadastrado'
    WHEN tipo_editora != 'master' AND sender_code IS NOT NULL
      THEN '❌ RISCO — editora não-gestora com sender_code preenchido'
    ELSE '✅ OK — sem sender_code (correto para administrada)'
  END AS status
FROM editoras
ORDER BY tipo_editora DESC, razao_social;


-- ┌─ ITEM 7: tipo_editora = administrada não usado como regra estrutural ─
-- Verificar se existe alguma view, função ou procedure que use tipo_editora
-- como condição de negócio (risco arquitetural).
SELECT
  '📋 ITEM 7 — Funções/views que referenciam tipo_editora' AS item,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_definition ILIKE '%tipo_editora%'
  AND routine_schema = 'public'
ORDER BY routine_name;
-- Se retornar linhas → revisar para remover dependência de tipo_editora como regra.


-- ┌─ ITEM 8: UI labels "ID Interno" ───────────────────────────────
-- Não verificável por SQL. Confirmar visualmente na interface:
-- - Tela Titulares: deve mostrar "ID Interno", não "Código Interno CWR".
-- - Tela Editoras: idem.
-- - Tela Organização Gestora: deve mostrar "ID Interno" + "Sender ID Code".
SELECT '📋 ITEM 8 — Labels UI: verificação manual necessária. Campos removidos: codigo_interno_cwr, codigo_publisher_cwr.' AS observacao;


-- ┌─ ITEM 9: obras_participantes possui data_inicio e data_fim ─────
SELECT
  '📋 ITEM 9a — obras_participantes.data_inicio' AS item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'obras_participantes' AND column_name = 'data_inicio'
    )
    THEN '✅ OK — data_inicio existe'
    ELSE '❌ FALHA — data_inicio ausente (aplicar migration 035)'
  END AS status;

SELECT
  '📋 ITEM 9b — obras_participantes.data_fim' AS item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'obras_participantes' AND column_name = 'data_fim'
    )
    THEN '✅ OK — data_fim existe'
    ELSE '❌ FALHA — data_fim ausente (aplicar migration 035)'
  END AS status;


-- ┌─ ITEM 10: negocios_editoriais — estrutura completa ─────────────
-- 10a: tabela existe e é acessível
SELECT
  '📋 ITEM 10a — tabela negocios_editoriais existe' AS item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'negocios_editoriais' AND table_schema = 'public'
    )
    THEN '✅ OK — tabela existe'
    ELSE '❌ FALHA — tabela não encontrada'
  END AS status;

-- 10b: colunas obrigatórias
SELECT
  '📋 ITEM 10b — colunas obrigatórias de negocios_editoriais' AS item,
  column_name,
  data_type,
  is_nullable,
  '✅ OK' AS status
FROM information_schema.columns
WHERE table_name = 'negocios_editoriais'
  AND column_name IN (
    'id','tenant_id','nome','status',
    'editora_administrada_id','editora_administradora_id',
    'percentual_administrada','percentual_administradora',
    'receitas_aplicaveis','abrangencia_tipo','territorios',
    'data_inicio','data_fim','created_at','updated_at'
  )
ORDER BY column_name;
-- Esperado: 15 linhas (uma por coluna listada).

-- 10c: FKs para editoras
SELECT
  '📋 ITEM 10c — FKs negocios_editoriais → editoras' AS item,
  kcu.column_name,
  ccu.table_name  AS ref_tabela,
  ccu.column_name AS ref_coluna,
  '✅ OK' AS status
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu
     ON kcu.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu
     ON ccu.constraint_name = rc.unique_constraint_name
WHERE kcu.table_name = 'negocios_editoriais'
ORDER BY kcu.column_name;

-- 10d: constraint de soma de percentuais = 100
SELECT
  '📋 ITEM 10d — CHECK percentuais somam 100' AS item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name      = 'negocios_editoriais'
        AND constraint_name = 'chk_percentuais_somam_100'
        AND constraint_type = 'CHECK'
    )
    THEN '✅ OK — chk_percentuais_somam_100 ativo'
    ELSE '⚠ PENDÊNCIA — constraint de percentuais não encontrada'
  END AS status;

-- 10e: RLS habilitado
SELECT
  '📋 ITEM 10e — RLS em negocios_editoriais' AS item,
  CASE
    WHEN relrowsecurity = TRUE
      THEN '✅ OK — RLS habilitado'
    ELSE '⚠ ATENÇÃO — RLS desabilitado em negocios_editoriais'
  END AS status
FROM pg_class
WHERE relname = 'negocios_editoriais'
  AND relkind = 'r';

-- 10f: dados existentes (contar registros)
SELECT
  '📋 ITEM 10f — Registros em negocios_editoriais' AS item,
  COUNT(*) AS total_registros,
  CASE
    WHEN COUNT(*) = 0 THEN '📭 Tabela vazia — pronta para cadastro'
    ELSE '📦 Já existem ' || COUNT(*)::TEXT || ' negócio(s) cadastrado(s)'
  END AS status
FROM negocios_editoriais;


-- ┌─ RESUMO FINAL ──────────────────────────────────────────────────
SELECT
  '════ RESUMO ════'                    AS separador,
  COUNT(*)                              AS total_editoras,
  COUNT(titular_id)                     AS com_titular,
  COUNT(*) FILTER (WHERE tipo_editora = 'master') AS gestoras,
  COUNT(*) FILTER (
    WHERE tipo_editora != 'master'
      AND titular_id IS NULL
  )                                     AS administradas_sem_titular,
  COUNT(*) FILTER (
    WHERE TRIM(COALESCE(codigo_interno,'')) = ''
  )                                     AS sem_codigo_interno
FROM editoras;
