-- migration 025: adiciona codigo_interno à tabela editoras
-- Código interno do Sync Mood para identificação operacional da editora.
-- Separado de:
--   codigo_interno_cwr   = código gerado pelo Sync Mood para arquivos CWR (ex: TS01)
--   codigo_publisher_cwr = código importado de um arquivo CWR externo
-- Exemplos de uso: TOPSHOW, EDI001, LR001, P3MUS

ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS codigo_interno TEXT;

COMMENT ON COLUMN editoras.codigo_interno IS
  'Código interno do Sync Mood para identificação da editora (ex: TOPSHOW, EDI001, LR001). '
  'Diferente de codigo_interno_cwr (para geração de arquivo CWR) e codigo_publisher_cwr (importado de CWR externo).';
