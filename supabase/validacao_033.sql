-- ================================================================
-- Validação da Migration 033 — obras_participantes + obras_repasse
-- Execute no SQL Editor do Supabase após aplicar a migration.
-- Cada bloco retorna OK ou FALTA/ERRO para facilitar diagnóstico.
-- ================================================================


-- ── BLOCO 1 — ENUM resolucao_editorial ───────────────────────
SELECT
  CASE WHEN COUNT(*) = 3 THEN '✅ OK — ENUM resolucao_editorial com 3 valores'
       ELSE '❌ FALTA — ENUM resolucao_editorial incompleto (esperado: ok, sem_administracao, pendente_revisao)'
  END AS resultado
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'resolucao_editorial';


-- ── BLOCO 2 — Tabela obras_participantes existe ───────────────
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'obras_participantes'
  ) THEN '✅ OK — tabela obras_participantes existe'
  ELSE '❌ FALTA — tabela obras_participantes não encontrada'
  END AS resultado;


-- ── BLOCO 3 — Colunas de obras_participantes ─────────────────
SELECT
  column_name,
  data_type,
  is_nullable,
  CASE WHEN column_name = 'tenant_id' AND is_nullable = 'NO'  THEN '✅ OK'
       WHEN column_name = 'obra_id'   AND is_nullable = 'NO'  THEN '✅ OK'
       WHEN column_name = 'papel'     AND is_nullable = 'NO'  THEN '✅ OK'
       WHEN column_name = 'percentual' AND is_nullable = 'NO' THEN '✅ OK'
       WHEN column_name IN ('titular_id','editora_id','status_resolucao_editorial','contrato_id')
            AND is_nullable = 'YES' THEN '✅ OK (nullable)'
       ELSE '⚠️ verificar'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'obras_participantes'
ORDER BY ordinal_position;


-- ── BLOCO 4 — Tabela obras_repasse existe ─────────────────────
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'obras_repasse'
  ) THEN '✅ OK — tabela obras_repasse existe'
  ELSE '❌ FALTA — tabela obras_repasse não encontrada'
  END AS resultado;


-- ── BLOCO 5 — Colunas de obras_repasse ───────────────────────
SELECT
  column_name,
  data_type,
  is_nullable,
  CASE WHEN column_name = 'tenant_id'             AND is_nullable = 'NO'  THEN '✅ OK'
       WHEN column_name = 'participante_obra_id'   AND is_nullable = 'NO'  THEN '✅ OK'
       WHEN column_name = 'tipo_relacao'            AND is_nullable = 'NO'  THEN '✅ OK'
       WHEN column_name = 'percentual_sobre_parte'  AND is_nullable = 'NO'  THEN '✅ OK'
       WHEN column_name = 'ativo'                   AND is_nullable = 'NO'  THEN '✅ OK'
       WHEN column_name IN ('titular_beneficiario_id','editora_beneficiaria_id',
                            'contrato_id','data_inicio','data_fim')
            AND is_nullable = 'YES' THEN '✅ OK (nullable)'
       ELSE '⚠️ verificar'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'obras_repasse'
ORDER BY ordinal_position;


-- ── BLOCO 6 — Constraints de obras_participantes ─────────────
SELECT
  conname AS constraint_name,
  CASE WHEN conname IN (
    'chk_op_uma_entidade',
    'chk_op_papel_entidade',
    'chk_op_resolucao'
  ) THEN '✅ OK'
  ELSE '⚠️ constraint extra ou renomeada'
  END AS status
FROM pg_constraint
WHERE conrelid = 'obras_participantes'::regclass
  AND contype = 'c';


-- ── BLOCO 7 — Constraint de obras_repasse ─────────────────────
SELECT
  conname AS constraint_name,
  CASE WHEN conname = 'chk_or_um_beneficiario' THEN '✅ OK'
       ELSE '⚠️ constraint extra ou renomeada'
  END AS status
FROM pg_constraint
WHERE conrelid = 'obras_repasse'::regclass
  AND contype = 'c';


-- ── BLOCO 8 — Índices de obras_participantes ─────────────────
WITH esperados AS (
  SELECT unnest(ARRAY[
    'idx_op_tenant','idx_op_obra','idx_op_titular',
    'idx_op_editora','idx_op_papel','idx_op_resolucao'
  ]) AS nome
)
SELECT
  e.nome,
  CASE WHEN i.indexname IS NOT NULL THEN '✅ OK'
       ELSE '❌ FALTA'
  END AS status
FROM esperados e
LEFT JOIN pg_indexes i
  ON i.tablename = 'obras_participantes'
 AND i.indexname = e.nome;


-- ── BLOCO 9 — Índices de obras_repasse ───────────────────────
WITH esperados AS (
  SELECT unnest(ARRAY[
    'idx_or_tenant','idx_or_participante','idx_or_titular',
    'idx_or_editora','idx_or_ativo'
  ]) AS nome
)
SELECT
  e.nome,
  CASE WHEN i.indexname IS NOT NULL THEN '✅ OK'
       ELSE '❌ FALTA'
  END AS status
FROM esperados e
LEFT JOIN pg_indexes i
  ON i.tablename = 'obras_repasse'
 AND i.indexname = e.nome;


-- ── BLOCO 10 — RLS ativo ──────────────────────────────────────
SELECT
  relname AS tabela,
  CASE WHEN relrowsecurity THEN '✅ RLS ativo'
       ELSE '❌ RLS INATIVO'
  END AS status
FROM pg_class
WHERE relname IN ('obras_participantes', 'obras_repasse')
  AND relkind = 'r';


-- ── BLOCO 11 — Policies ───────────────────────────────────────
WITH esperadas AS (
  SELECT unnest(ARRAY['op_select','op_write','or_select','or_write']) AS nome
)
SELECT
  e.nome,
  CASE WHEN p.policyname IS NOT NULL THEN '✅ OK'
       ELSE '❌ FALTA'
  END AS status
FROM esperadas e
LEFT JOIN pg_policies p
  ON p.policyname = e.nome
 AND p.tablename IN ('obras_participantes','obras_repasse')
 AND p.schemaname = 'public';


-- ── BLOCO 12 — obras_links_titulares intacta ─────────────────
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'obras_links_titulares'
  ) THEN '✅ OK — obras_links_titulares intacta (compatibilidade mantida)'
  ELSE '❌ RISCO — obras_links_titulares não encontrada'
  END AS resultado;


-- ── BLOCO 13 — Teste de integridade do CHECK papel (deve falhar) ──
-- Este bloco tenta inserir um papel inválido.
-- O banco DEVE rejeitar com erro de constraint.
-- Se retornar erro → constraint funcionando corretamente.
-- Execute manualmente se quiser confirmar a constraint ativa.
/*
INSERT INTO obras_participantes (tenant_id, obra_id, editora_id, papel, percentual, status_resolucao_editorial)
VALUES (
  (SELECT id FROM tenants LIMIT 1),
  (SELECT id FROM obras LIMIT 1),
  (SELECT id FROM editoras LIMIT 1),
  'INVALIDO',   -- deve ser rejeitado
  50,
  'ok'
);
-- Esperado: ERROR: new row violates check constraint "obras_participantes_papel_check"
*/


-- ── BLOCO 14 — Teste do CHECK chk_op_resolucao (deve falhar) ──
-- Tenta inserir CA com status_resolucao_editorial preenchido.
-- O banco DEVE rejeitar.
/*
INSERT INTO obras_participantes (tenant_id, obra_id, titular_id, papel, percentual, status_resolucao_editorial)
VALUES (
  (SELECT id FROM tenants LIMIT 1),
  (SELECT id FROM obras LIMIT 1),
  (SELECT id FROM titulares LIMIT 1),
  'CA',
  50,
  'ok'   -- CA não pode ter status_resolucao_editorial
);
-- Esperado: ERROR: new row violates check constraint "chk_op_resolucao"
*/


-- ── RESUMO ────────────────────────────────────────────────────
SELECT '=== FIM DA VALIDACAO 033 ===' AS info,
       'Verifique os blocos acima. Todos devem retornar OK.' AS instrucao,
       'Blocos 13 e 14 sao testes manuais opcionais comentados.' AS nota;
