-- =======================================================
-- CONFERÊNCIA DOS DADOS ATUAIS
-- Execute no Supabase SQL Editor ANTES da limpeza
-- Nenhuma linha é alterada — apenas leitura
-- =======================================================

\echo '=== TENANT ==='
SELECT id, nome, slug, plano FROM tenants;

\echo '=== USUÁRIOS ==='
SELECT id, email, nome, role, ativo FROM usuarios
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '=== EDITORAS (serão mantidas) ==='
SELECT id, nome_fantasia, razao_social, cnpj, tipo_editora, controlada, status
FROM editoras
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'
ORDER BY created_at;

\echo '=== TITULARES (serão APAGADOS) ==='
SELECT id, codigo_titular, nome_completo, tipo, status
FROM titulares
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'
ORDER BY created_at;
SELECT COUNT(*) AS total_titulares FROM titulares
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '=== OBRAS (serão APAGADAS) ==='
SELECT id, titulo, iswc, status, created_at
FROM obras
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'
ORDER BY created_at;
SELECT COUNT(*) AS total_obras FROM obras
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '=== OBRAS LINKS (serão APAGADOS via cascade) ==='
SELECT COUNT(*) AS total_links FROM obras_links
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '=== OBRAS LINKS TITULARES (serão APAGADOS via cascade) ==='
SELECT COUNT(*) AS total_links_titulares FROM obras_links_titulares
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '=== CONTRATOS (serão APAGADOS) ==='
SELECT id, tipo_contrato, percentual_autor, percentual_editora, status, data_inicio
FROM contratos
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'
ORDER BY created_at;
SELECT COUNT(*) AS total_contratos FROM contratos
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '=== NEGÓCIOS EDITORIAIS (serão MANTIDOS — são configuração) ==='
SELECT id, nome, editora_administrada_nome, editora_administradora_nome,
       percentual_administrada, percentual_administradora, status
FROM negocios_editoriais
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'
ORDER BY created_at;

\echo '=== RECEBIMENTOS (serão APAGADOS) ==='
SELECT id, descricao, valor_bruto, valor_liquido, status, competencia, created_at
FROM recebimentos
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'
ORDER BY created_at;
SELECT COUNT(*) AS total_recebimentos FROM recebimentos
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '=== OBRAS ANALÍTICO (serão APAGADOS) ==='
SELECT COUNT(*) AS total_analitico FROM obras_analitico
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '=== CC OBRAS MOVIMENTOS (serão APAGADOS) ==='
SELECT COUNT(*) AS total_cc_movimentos FROM cc_obras_movimentos
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '=== TIPOS DE DIREITO (serão MANTIDOS — são configuração) ==='
SELECT id, codigo, nome, status FROM tipos_direito
WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001'
ORDER BY codigo;

\echo '=== RESUMO FINAL ==='
SELECT
  (SELECT COUNT(*) FROM obras             WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS obras,
  (SELECT COUNT(*) FROM obras_links       WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS links,
  (SELECT COUNT(*) FROM obras_links_titulares WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS links_titulares,
  (SELECT COUNT(*) FROM titulares         WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS titulares,
  (SELECT COUNT(*) FROM contratos         WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS contratos,
  (SELECT COUNT(*) FROM recebimentos      WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS recebimentos,
  (SELECT COUNT(*) FROM obras_analitico   WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS analitico,
  (SELECT COUNT(*) FROM cc_obras_movimentos WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS cc_movimentos,
  (SELECT COUNT(*) FROM editoras          WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS editoras,
  (SELECT COUNT(*) FROM negocios_editoriais WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS negocios_editoriais,
  (SELECT COUNT(*) FROM tipos_direito     WHERE tenant_id = 'aaaaaaaa-0000-0000-0000-000000000001') AS tipos_direito;
