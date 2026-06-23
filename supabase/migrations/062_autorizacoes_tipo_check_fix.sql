-- Migration 062: Corrige o CHECK constraint de tipo_autorizacao
-- para incluir os tipos reais usados pelo frontend
-- Executar no Supabase SQL Editor

-- Remover CHECK antigo (valores legados: sync, audiovisual, etc.)
ALTER TABLE autorizacoes
  DROP CONSTRAINT IF EXISTS autorizacoes_tipo_autorizacao_check;

-- Adicionar novo CHECK com todos os tipos válidos
ALTER TABLE autorizacoes
  ADD CONSTRAINT autorizacoes_tipo_autorizacao_check
  CHECK (tipo_autorizacao IS NULL OR tipo_autorizacao IN (
    -- valores novos (frontend)
    'fonograma', 'sincronizacao', 'publicidade', 'tv',
    'edicao_grafica', 'incidental', 'versao',
    -- valores legados (compatibilidade)
    'sync', 'audiovisual', 'gravacao',
    'uso_especial', 'performance', 'digital', 'outro'
  ));

-- Adicionar coluna deleted_at se ainda não existir (necessária para soft-delete)
ALTER TABLE autorizacoes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Adicionar prazo_indeterminado como alias moderno (o campo legado é prazo_indeter)
ALTER TABLE autorizacoes
  ADD COLUMN IF NOT EXISTS prazo_indeterminado BOOLEAN DEFAULT FALSE;

-- Adicionar observacoes se não existir
ALTER TABLE autorizacoes
  ADD COLUMN IF NOT EXISTS observacoes TEXT;
