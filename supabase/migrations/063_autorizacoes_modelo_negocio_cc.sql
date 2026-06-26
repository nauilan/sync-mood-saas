-- Migration 063: modelo_negocio em autorizacoes
-- Regras de conta corrente de obras por modelo de negocio:
--   pago_editora  → confirmar pagamento gera entrada em cc_obras_movimentos
--   pago_autor    → pagamento direto ao autor, não alimenta cc_obras
--   sem_onus      → sem valor, não alimenta cc_obras

ALTER TABLE autorizacoes
  ADD COLUMN IF NOT EXISTS modelo_negocio TEXT DEFAULT 'pago_editora',
  ADD COLUMN IF NOT EXISTS data_pagamento_confirmado TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS cc_movimento_id UUID REFERENCES cc_obras_movimentos(id) ON DELETE SET NULL;

-- Backfill para autorizacoes existentes
UPDATE autorizacoes SET modelo_negocio = 'pago_editora' WHERE modelo_negocio IS NULL;

COMMENT ON COLUMN autorizacoes.modelo_negocio IS
  'pago_editora = licenciado paga editora (gera CC obra); pago_autor = paga direto ao autor (sem CC obra); sem_onus = sem cobrança (sem CC obra)';
