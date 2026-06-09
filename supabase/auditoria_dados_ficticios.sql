-- ============================================================
-- AUDITORIA DE DADOS FICTÍCIOS / TESTE / HOMOLOGAÇÃO
-- Sync Mood — Execute no Supabase SQL Editor
-- Objetivo: identificar registros de teste antes do uso real
-- ============================================================

-- Padrões buscados:
--   TESTE, HOMOLOG, DEMO, MOCK, FICTÍCIO, EXEMPLO, SAMPLE,
--   LOREM, TEMP, RASCUNHO, HML, TSM-HML, CTR-HML, BRT2606

-- ============================================================
-- [1] TITULARES
-- ============================================================
SELECT
  'titulares' AS tabela,
  id,
  nome_completo,
  cpf_cnpj,
  codigo_titular,
  status,
  created_at
FROM titulares
WHERE
  upper(nome_completo)  ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%MOCK%','%FICTICI%','%EXEMPLO%','%SAMPLE%','%LOREM%','%TEMP%','%RASCUNHO%','%HML%'])
  OR upper(codigo_titular) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%HML%','%DEMO%','%MOCK%'])
  OR cpf_cnpj IN ('000.000.000-00','123.456.789-00','111.222.333-44','222.333.444-55','333.444.555-66')
ORDER BY created_at DESC;

-- ============================================================
-- [2] EDITORAS
-- ============================================================
SELECT
  'editoras' AS tabela,
  id,
  razao_social,
  nome_fantasia,
  cnpj,
  codigo_interno,
  status,
  created_at
FROM editoras
WHERE
  upper(razao_social)   ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%MOCK%','%FICTICI%','%EXEMPLO%','%SAMPLE%','%LOREM%','%TEMP%','%RASCUNHO%','%HML%'])
  OR upper(nome_fantasia) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%MOCK%','%HML%'])
  OR upper(codigo_interno) ILIKE ANY(ARRAY['%HML%','%TESTE%','%DEMO%'])
ORDER BY created_at DESC;

-- ============================================================
-- [3] NEGOCIOS_EDITORIAIS
-- ============================================================
SELECT
  'negocios_editoriais' AS tabela,
  id,
  nome,
  status,
  created_at
FROM negocios_editoriais
WHERE
  upper(nome) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%MOCK%','%FICTICI%','%EXEMPLO%','%HML%'])
ORDER BY created_at DESC;

-- ============================================================
-- [4] CONTRATOS
-- ============================================================
SELECT
  'contratos' AS tabela,
  id,
  numero,
  tipo,
  status,
  observacoes,
  created_at,
  deleted_at
FROM contratos
WHERE
  upper(numero)      ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%HML%','%CTR-HML%'])
  OR upper(observacoes) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%HML%'])
ORDER BY created_at DESC;

-- ============================================================
-- [5] OBRAS
-- ============================================================
SELECT
  'obras' AS tabela,
  id,
  codigo_obra,
  titulo,
  status,
  origem_cadastro,
  contrato_origem_id,
  created_at,
  deleted_at
FROM obras
WHERE
  upper(titulo)      ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%MOCK%','%FICTICI%','%EXEMPLO%','%SAMPLE%','%LOREM%','%HML%','%TSM-HML%'])
  OR upper(codigo_obra) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%HML%','%DEMO%'])
ORDER BY created_at DESC;

-- ============================================================
-- [6] FONOGRAMAS
-- ============================================================
SELECT
  'fonogramas' AS tabela,
  f.id,
  f.titulo_fonograma,
  f.isrc,
  f.interprete,
  o.titulo AS obra_titulo,
  f.status,
  f.created_at,
  f.deleted_at
FROM fonogramas f
JOIN obras o ON o.id = f.obra_id
WHERE
  upper(f.titulo_fonograma) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%HML%','%MOCK%'])
  OR upper(f.isrc) ILIKE ANY(ARRAY['%TESTE%','%HML%','%BRT2606%'])
  OR upper(o.titulo) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%HML%'])
ORDER BY f.created_at DESC;

-- ============================================================
-- [7] OBRAS_PARTICIPANTES (vinculados a obras suspeitas)
-- ============================================================
SELECT
  'obras_participantes' AS tabela,
  op.id,
  op.obra_id,
  op.papel,
  op.percentual,
  o.titulo AS obra_titulo,
  o.codigo_obra,
  op.created_at
FROM obras_participantes op
JOIN obras o ON o.id = op.obra_id
WHERE
  upper(o.titulo) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%HML%','%MOCK%'])
ORDER BY op.created_at DESC;

-- ============================================================
-- [8] OBRAS_LINKS (vinculados a obras suspeitas)
-- ============================================================
SELECT
  'obras_links' AS tabela,
  ol.id,
  ol.obra_id,
  ol.numero_link,
  ol.tipo_link,
  o.titulo AS obra_titulo
FROM obras_links ol
JOIN obras o ON o.id = ol.obra_id
WHERE
  upper(o.titulo) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%HML%','%MOCK%'])
ORDER BY ol.created_at DESC;

-- ============================================================
-- [9] OBRAS_LINKS_TITULARES (vinculados a obras suspeitas)
-- ============================================================
SELECT
  'obras_links_titulares' AS tabela,
  olt.id,
  olt.obra_id,
  olt.nome,
  olt.funcao_no_link,
  olt.percentual_exec_publica,
  o.titulo AS obra_titulo
FROM obras_links_titulares olt
JOIN obras o ON o.id = olt.obra_id
WHERE
  upper(o.titulo) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%HML%','%MOCK%'])
ORDER BY olt.created_at DESC;

-- ============================================================
-- [10] IMPORTACOES / IMPORTACOES_LOG
-- ============================================================
SELECT
  'importacoes' AS tabela,
  id,
  tipo,
  arquivo_nome,
  status,
  created_at
FROM importacoes
WHERE
  upper(arquivo_nome) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%HML%','%MOCK%','%SAMPLE%'])
ORDER BY created_at DESC;

-- ============================================================
-- [11] AUDIT_LOGS — verificar se existem registros
-- ============================================================
SELECT
  'audit_logs' AS tabela,
  COUNT(*)               AS total_registros,
  MIN(created_at)        AS primeiro_log,
  MAX(created_at)        AS ultimo_log
FROM audit_logs;

-- Logs gerados por operações de homologação (se houver)
SELECT
  id,
  modulo,
  acao,
  tabela_afetada,
  registro_id,
  origem_execucao,
  created_at
FROM audit_logs
WHERE
  dados_novos::text ILIKE ANY(ARRAY['%HOMOLOG%','%HML%','%TESTE%','%DEMO%'])
  OR dados_anteriores::text ILIKE ANY(ARRAY['%HOMOLOG%','%HML%','%TESTE%','%DEMO%'])
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================
-- [12] RECEBIMENTOS
-- ============================================================
SELECT
  'recebimentos' AS tabela,
  id,
  descricao,
  status,
  valor_total,
  created_at
FROM recebimentos
WHERE
  upper(descricao) ILIKE ANY(ARRAY['%TESTE%','%HOMOLOG%','%DEMO%','%HML%','%MOCK%'])
ORDER BY created_at DESC;

-- ============================================================
-- [13] CONTAGEM GERAL — quantos registros existem em cada tabela principal
-- ============================================================
SELECT tabela, total FROM (
  SELECT 'titulares'         AS tabela, COUNT(*) AS total FROM titulares      UNION ALL
  SELECT 'editoras',                    COUNT(*)           FROM editoras       UNION ALL
  SELECT 'negocios_editoriais',         COUNT(*)           FROM negocios_editoriais UNION ALL
  SELECT 'contratos',                   COUNT(*)           FROM contratos      UNION ALL
  SELECT 'obras',                       COUNT(*)           FROM obras          UNION ALL
  SELECT 'obras_links',                 COUNT(*)           FROM obras_links    UNION ALL
  SELECT 'obras_links_titulares',       COUNT(*)           FROM obras_links_titulares UNION ALL
  SELECT 'obras_participantes',         COUNT(*)           FROM obras_participantes UNION ALL
  SELECT 'fonogramas',                  COUNT(*)           FROM fonogramas     UNION ALL
  SELECT 'audit_logs',                  COUNT(*)           FROM audit_logs     UNION ALL
  SELECT 'importacoes',                 COUNT(*)           FROM importacoes    UNION ALL
  SELECT 'recebimentos',                COUNT(*)           FROM recebimentos
) t
ORDER BY tabela;

-- ============================================================
-- [14] LIMPEZA — Execute SOMENTE após confirmar os IDs acima
-- Substitua <ID_OBRA> e <ID_CONTRATO> pelos IDs encontrados
-- ============================================================
-- /*
-- DO $$
-- DECLARE
--   v_obra_id     UUID := '<ID_OBRA_HOMOLOGACAO>';
--   v_contrato_id UUID := '<ID_CONTRATO_HML>';
-- BEGIN
--   -- Apaga em cascata (obras_participantes, obras_links_titulares,
--   -- obras_links e fonogramas seguem ON DELETE CASCADE da obra)
--   DELETE FROM contrato_obras WHERE obra_id = v_obra_id;
--   UPDATE obras SET contrato_origem_id = NULL
--     WHERE id = v_obra_id AND contrato_origem_id = v_contrato_id;
--   DELETE FROM obras WHERE id = v_obra_id;
--   -- Após apagar a obra, apaga o contrato
--   DELETE FROM contratos WHERE id = v_contrato_id;
--   RAISE NOTICE 'Limpeza concluída. Obra: % | Contrato: %', v_obra_id, v_contrato_id;
-- END $$;
-- */
