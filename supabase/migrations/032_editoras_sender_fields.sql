-- Migration 032 — Campos CWR Remetente na tabela editoras
-- Apenas a Organização Gestora usará estes campos.
-- Editoras administradas os terão como NULL.

ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS sender_code  VARCHAR(12),
  ADD COLUMN IF NOT EXISTS sender_name  VARCHAR(120),
  ADD COLUMN IF NOT EXISTS sender_type  VARCHAR(10) DEFAULT 'PB';

COMMENT ON COLUMN editoras.sender_code IS 'Sender Code CISAC — exclusivo da Organização Gestora/remetente CWR';
COMMENT ON COLUMN editoras.sender_name IS 'Sender Name no cabeçalho HDR do CWR';
COMMENT ON COLUMN editoras.sender_type IS 'Sender Type: PB (publisher) ou SO (society). Default PB';
