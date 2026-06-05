-- ============================================================
-- 022_status_contrato_novos_valores.sql
-- Adiciona valores ao enum status_contrato para alinhar
-- banco, API, wizard e bridge.
--
-- Enum atual: ativo | encerrado | suspenso | em_analise
-- Bridge aceita: vigente | assinado | ativo
-- Wizard cria com: rascunho (novo) ou assinado (ao finalizar)
-- ============================================================

ALTER TYPE status_contrato ADD VALUE IF NOT EXISTS 'vigente';
ALTER TYPE status_contrato ADD VALUE IF NOT EXISTS 'assinado';
ALTER TYPE status_contrato ADD VALUE IF NOT EXISTS 'rascunho';
