-- =======================================================================
-- SCRIPT CONSOLIDADO: pendentes 012 + 059
-- Executar UMA VEZ no Supabase SQL Editor do projeto tigubwxotanaznqqxogf
-- Todos os ADD COLUMN usam IF NOT EXISTS — safe para re-execução.
-- =======================================================================

-- ── OBRAS — códigos legados, rastreabilidade CWR e BackOffice ─────────
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS codigo_interno_legado       TEXT,
  ADD COLUMN IF NOT EXISTS codigo_obra_cwr_original    TEXT,
  ADD COLUMN IF NOT EXISTS codigo_publisher_song        TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_song_id           TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_work_id           TEXT,
  ADD COLUMN IF NOT EXISTS origem_importacao            TEXT NOT NULL DEFAULT 'manual';

-- backoffice_status: novo enum expandido (sem CHECK antigo que restringia valores)
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS backoffice_status            TEXT NOT NULL DEFAULT 'nao_enviada';

ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS backoffice_last_sync_at      TIMESTAMPTZ;

-- Migration 059: campos operacionais BackOffice
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

-- Comentários
COMMENT ON COLUMN obras.codigo_interno_legado      IS 'Código legado do sistema anterior. Ex: AFW2. Não é ISWC.';
COMMENT ON COLUMN obras.codigo_obra_cwr_original   IS 'Submitter Work # exato como veio no NWR do CWR.';
COMMENT ON COLUMN obras.backoffice_song_id         IS 'ID retornado pela BackOffice quando a obra entra como SONG passiva.';
COMMENT ON COLUMN obras.backoffice_work_id         IS 'ID retornado pela BackOffice quando a obra é validada como WORK ativa.';
COMMENT ON COLUMN obras.backoffice_status          IS 'Status da obra no ciclo BackOffice. Valores: nao_enviada | pronta_para_envio | enviada | processando | aceita | aceita_com_alerta | rejeitada | pendente_correcao | em_conflito | baixada | substituida';
COMMENT ON COLUMN obras.backoffice_data_ultimo_envio   IS 'Data/hora do último arquivo enviado ao BackOffice';
COMMENT ON COLUMN obras.backoffice_data_ultimo_retorno IS 'Data/hora do último retorno/log recebido do BackOffice';
COMMENT ON COLUMN obras.backoffice_ultimo_arquivo      IS 'Nome/referência do último arquivo enviado (SWI, ISRC, etc.)';
COMMENT ON COLUMN obras.backoffice_ultimo_log          IS 'Último log ou mensagem de retorno do BackOffice';
COMMENT ON COLUMN obras.backoffice_song_linkages       IS 'Histórico de Manual Song Linkage [{songcode, bo_work_id, isrc, data, status, obs}]';
COMMENT ON COLUMN obras.backoffice_counter_claims      IS 'Counter claims/disputas [{tipo, territorio, pct, partes, status, ticket}]';
COMMENT ON COLUMN obras.backoffice_tickets             IS 'Tickets BackOffice [{numero, tipo, area, status, data_abertura, data_fechamento}]';
COMMENT ON COLUMN obras.backoffice_alta_baixa          IS 'Histórico de alta e baixa de catálogo [{tipo, territorio, data, ticket, status}]';

-- Índices obras
CREATE INDEX IF NOT EXISTS idx_obras_codigo_legado     ON obras(codigo_interno_legado);
CREATE INDEX IF NOT EXISTS idx_obras_cwr_original      ON obras(codigo_obra_cwr_original);
CREATE INDEX IF NOT EXISTS idx_obras_backoffice_song   ON obras(backoffice_song_id);
CREATE INDEX IF NOT EXISTS idx_obras_backoffice_work   ON obras(backoffice_work_id);
CREATE INDEX IF NOT EXISTS idx_obras_backoffice_status ON obras(backoffice_status);


-- ── TITULARES — rastreabilidade CWR ──────────────────────────────────
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS codigo_interno_legado       TEXT,
  ADD COLUMN IF NOT EXISTS codigo_autor_cwr_original   TEXT,
  ADD COLUMN IF NOT EXISTS codigo_sequence_cwr         TEXT,
  ADD COLUMN IF NOT EXISTS cae_historico               JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS origem_importacao           TEXT NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN titulares.codigo_interno_legado     IS 'Código interno legado. Ex: HR01. Não é CAE nem IPI.';
COMMENT ON COLUMN titulares.codigo_autor_cwr_original IS 'Writer code exato como veio no SWR do CWR.';
COMMENT ON COLUMN titulares.cae_historico             IS 'Array de CAEs históricos [{cae, ipi, inicio, fim}].';

CREATE INDEX IF NOT EXISTS idx_titulares_codigo_legado ON titulares(codigo_interno_legado);
CREATE INDEX IF NOT EXISTS idx_titulares_cwr_original  ON titulares(codigo_autor_cwr_original);


-- ── EDITORAS — tipo, controle e BackOffice ────────────────────────────
ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS codigo_publisher_cwr       TEXT,
  ADD COLUMN IF NOT EXISTS codigo_interno_legado      TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_publisher_id    TEXT,
  ADD COLUMN IF NOT EXISTS tipo_editora               TEXT NOT NULL DEFAULT 'master',
  ADD COLUMN IF NOT EXISTS controlada                 BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN editoras.tipo_editora             IS 'master | administrada | externa';
COMMENT ON COLUMN editoras.controlada               IS 'TRUE se a editora é controlada/gerida pelo tenant.';
COMMENT ON COLUMN editoras.codigo_publisher_cwr     IS 'Publisher code usado nos registros SPU do CWR.';

CREATE INDEX IF NOT EXISTS idx_editoras_publisher_cwr ON editoras(codigo_publisher_cwr);
CREATE INDEX IF NOT EXISTS idx_editoras_codigo_legado ON editoras(codigo_interno_legado);


-- ── OBRAS_LINKS_TITULARES — rastreabilidade PWR ──────────────────────
ALTER TABLE obras_links_titulares
  ADD COLUMN IF NOT EXISTS writer_sequence_code          TEXT,
  ADD COLUMN IF NOT EXISTS publisher_sequence_code       TEXT,
  ADD COLUMN IF NOT EXISTS pwr_writer_code               TEXT,
  ADD COLUMN IF NOT EXISTS pwr_publisher_code            TEXT,
  ADD COLUMN IF NOT EXISTS codigo_vinculo_cwr_original   TEXT,
  ADD COLUMN IF NOT EXISTS codigo_interno_legado_titular TEXT,
  ADD COLUMN IF NOT EXISTS codigo_interno_legado_editora TEXT,
  ADD COLUMN IF NOT EXISTS fonte_controle                TEXT NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN obras_links_titulares.writer_sequence_code    IS 'writer_seq do SWR no CWR (2 chars, ex: 01).';
COMMENT ON COLUMN obras_links_titulares.pwr_writer_code         IS 'writer_seq do PWR que vincula este autor à editora.';
COMMENT ON COLUMN obras_links_titulares.fonte_controle          IS 'Como o controle foi determinado para esta linha.';

CREATE INDEX IF NOT EXISTS idx_olt_writer_seq ON obras_links_titulares(writer_sequence_code);
CREATE INDEX IF NOT EXISTS idx_olt_pub_seq    ON obras_links_titulares(publisher_sequence_code);


-- ── TABELA AUXILIAR: backoffice_obras_status ─────────────────────────
CREATE TABLE IF NOT EXISTS backoffice_obras_status (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_id                 UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,

  codigo_obra_sync_mood   TEXT,
  codigo_interno_legado   TEXT,
  codigo_obra_cwr         TEXT,
  backoffice_song_id      TEXT,
  backoffice_work_id      TEXT,
  statement_song_code     TEXT,

  status                  TEXT NOT NULL DEFAULT 'nao_enviada',

  data_envio              TIMESTAMPTZ,
  data_retorno            TIMESTAMPTZ,
  mensagem_retorno        TEXT,
  erros                   JSONB DEFAULT '[]',
  avisos                  JSONB DEFAULT '[]',

  arquivo_exportacao_id   UUID REFERENCES importacoes_log(id) ON DELETE SET NULL,
  arquivo_retorno_id      UUID REFERENCES importacoes_log(id) ON DELETE SET NULL,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE backoffice_obras_status IS 'Histórico de envios/retornos BackOffice por obra. Nunca sobrescreve — sempre insere novo registro.';

CREATE INDEX IF NOT EXISTS idx_bo_status_obra    ON backoffice_obras_status(obra_id);
CREATE INDEX IF NOT EXISTS idx_bo_status_song_id ON backoffice_obras_status(backoffice_song_id);
CREATE INDEX IF NOT EXISTS idx_bo_status_tenant  ON backoffice_obras_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bo_status_status  ON backoffice_obras_status(status);
