-- Migration 047 — Titulares: colunas inline para contatos, endereço, bancário, funções
-- Executar no Supabase SQL Editor

-- 1. Contatos (e-mail, telefone, WhatsApp) como JSONB array
-- Estrutura: [{ tipo: 'email'|'whatsapp'|'telefone', valor: '...', principal: true|false }]
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS contatos JSONB DEFAULT '[]'::jsonb;

-- 2. Endereço como JSONB
-- Estrutura: { cep, logradouro, numero, complemento, bairro, cidade, estado, pais }
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS endereco JSONB;

-- 3. Dados bancários como JSONB
-- Estrutura: { banco, agencia, conta, conta_digito, tipo_conta, titular_conta, pix_chave, pix_tipo, operacao }
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS dados_bancarios JSONB;

-- 4. Funções como TEXT[] (array de strings ex: ['compositor','intreprete'])
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS funcoes TEXT[] DEFAULT '{}';

-- 5. Estado civil
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS estado_civil TEXT;

-- 6. Sexo (com CHECK)
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS sexo TEXT
  CHECK (sexo IS NULL OR sexo IN ('masculino', 'feminino', 'outro', 'nao_informado'));

-- 7. Sociedade autoral
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS sociedade_autoral TEXT;

-- 8. Pseudônimos como JSONB array
-- Estrutura: [{ pseudonimo: '...', principal: true|false }]
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS pseudonimos JSONB DEFAULT '[]'::jsonb;

-- 9. Documentos como JSONB array
-- Estrutura: [{ tipo: 'rg'|'cnh'|'...',  numero: '...', data_expiracao: '...' }]
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]'::jsonb;

-- 10. Código interno alfanumérico (complementa codigo_titular)
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS codigo_interno TEXT;

-- Índice GIN para busca dentro dos dados bancários
CREATE INDEX IF NOT EXISTS idx_titulares_dados_bancarios
  ON titulares USING GIN (dados_bancarios)
  WHERE dados_bancarios IS NOT NULL;

-- Índice GIN para busca dentro de contatos
CREATE INDEX IF NOT EXISTS idx_titulares_contatos
  ON titulares USING GIN (contatos)
  WHERE contatos IS NOT NULL;
