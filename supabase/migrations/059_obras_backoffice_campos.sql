-- Migration 059: Campos operacionais BackOffice em obras
-- Executar no Supabase SQL Editor antes do deploy.
-- Colunas já existentes (não recriadas): backoffice_song_id, backoffice_work_id, backoffice_status

ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS backoffice_data_ultimo_envio   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS backoffice_data_ultimo_retorno TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS backoffice_ultimo_arquivo      TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_ultimo_log          TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_song_linkages       JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS backoffice_oni_codes           JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS backoffice_counter_claims      JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS backoffice_tickets             JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS backoffice_alta_baixa          JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN obras.backoffice_data_ultimo_envio   IS 'Data/hora do último arquivo enviado ao BackOffice';
COMMENT ON COLUMN obras.backoffice_data_ultimo_retorno IS 'Data/hora do último retorno/log recebido do BackOffice';
COMMENT ON COLUMN obras.backoffice_ultimo_arquivo      IS 'Nome/referência do último arquivo enviado (SWI, ISRC, etc.)';
COMMENT ON COLUMN obras.backoffice_ultimo_log          IS 'Último log ou mensagem de retorno do BackOffice';
COMMENT ON COLUMN obras.backoffice_song_linkages       IS 'Histórico de Manual Song Linkage [{songcode, bo_work_id, isrc, data, status, obs}]';
COMMENT ON COLUMN obras.backoffice_oni_codes           IS 'ONI codes vinculados [{oni_code, data_envio, status}]';
COMMENT ON COLUMN obras.backoffice_counter_claims      IS 'Counter claims/disputas [{tipo, territorio, pct, partes, status, ticket}]';
COMMENT ON COLUMN obras.backoffice_tickets             IS 'Tickets BackOffice [{numero, tipo, area, status, data_abertura, data_fechamento}]';
COMMENT ON COLUMN obras.backoffice_alta_baixa          IS 'Histórico de alta e baixa de catálogo [{tipo, territorio, data, ticket, status}]';
