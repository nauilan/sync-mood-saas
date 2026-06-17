-- Migration 059 — campos adicionais em fonogramas (referência ao sistema legado)
-- Campos: titulo_album, produtor_album, codigo_catalogo, ean, titulo_versao,
--         formato_audio, tecnica_digital, tipo_midia

ALTER TABLE fonogramas
  ADD COLUMN IF NOT EXISTS titulo_album    TEXT,
  ADD COLUMN IF NOT EXISTS produtor_album  TEXT,
  ADD COLUMN IF NOT EXISTS codigo_catalogo TEXT,
  ADD COLUMN IF NOT EXISTS ean             TEXT,
  ADD COLUMN IF NOT EXISTS titulo_versao   TEXT,
  ADD COLUMN IF NOT EXISTS formato_audio   BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tecnica_digital BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tipo_midia      TEXT;
