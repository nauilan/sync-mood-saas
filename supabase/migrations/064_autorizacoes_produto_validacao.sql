-- Migration 064: dados_produto, dados_especificos e validada_em em autorizacoes
-- dados_especificos: campos específicos por tipo (fonograma, sync, publicidade, etc.)
-- dados_produto:     produto fonográfico (intérprete, formatos físico/digital, ISRCs)
-- validada_em:       preenchido ao confirmar pagamento (pago_editora/pago_autor) ou
--                    imediatamente na emissão para sem_onus

ALTER TABLE autorizacoes
  ADD COLUMN IF NOT EXISTS dados_especificos JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dados_produto     JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS validada_em       TIMESTAMPTZ;

COMMENT ON COLUMN autorizacoes.dados_especificos IS
  'Campos específicos por tipo de autorização (produtor, distribuidora, plataformas, etc.)';

COMMENT ON COLUMN autorizacoes.dados_produto IS
  'Produto fonográfico: interprete_nome, interprete_id, formatos_fisicos[], formatos_digitais[], isrcs[]';

COMMENT ON COLUMN autorizacoes.validada_em IS
  'Timestamp de validação: sem_onus = imediato na emissão; pago_editora/pago_autor = após confirmar-pagamento';
