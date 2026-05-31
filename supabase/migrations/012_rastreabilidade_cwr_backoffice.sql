-- ============================================================
-- 012_rastreabilidade_cwr_backoffice.sql
-- Adiciona campos de rastreabilidade CWR/BackOffice/Legado
-- nas tabelas existentes (obras, titulares, editoras,
-- obras_links_titulares).
--
-- REGRA: apenas ADD COLUMN IF NOT EXISTS — nunca altera
--        colunas ou índices existentes.
-- ============================================================

-- ── OBRAS — códigos legados e BackOffice ─────────────────────
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS codigo_interno_legado      TEXT,
  ADD COLUMN IF NOT EXISTS codigo_obra_cwr_original   TEXT,
  ADD COLUMN IF NOT EXISTS codigo_publisher_song       TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_song_id          TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_work_id          TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_status           TEXT NOT NULL DEFAULT 'nao_enviada'
    CHECK (backoffice_status IN ('nao_enviada','enviada','song','work','divergente','rejeitada')),
  ADD COLUMN IF NOT EXISTS backoffice_last_sync_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS origem_importacao           TEXT NOT NULL DEFAULT 'manual'
    CHECK (origem_importacao IN ('manual','cwr','swi','backoffice','migracao_legado'));

COMMENT ON COLUMN obras.codigo_interno_legado    IS 'Código legado do sistema anterior. Ex: AFW2. Não é ISWC.';
COMMENT ON COLUMN obras.codigo_obra_cwr_original IS 'Submitter Work # exato como veio no NWR do CWR.';
COMMENT ON COLUMN obras.codigo_publisher_song    IS 'Código usado para matching com relatórios B-55.';
COMMENT ON COLUMN obras.backoffice_song_id       IS 'ID retornado pela BackOffice quando a obra entra como SONG passiva.';
COMMENT ON COLUMN obras.backoffice_work_id       IS 'ID retornado pela BackOffice quando a obra é validada como WORK ativa.';

-- Índices de busca pelos novos campos
CREATE INDEX IF NOT EXISTS idx_obras_codigo_legado        ON obras(codigo_interno_legado);
CREATE INDEX IF NOT EXISTS idx_obras_cwr_original         ON obras(codigo_obra_cwr_original);
CREATE INDEX IF NOT EXISTS idx_obras_publisher_song       ON obras(codigo_publisher_song);
CREATE INDEX IF NOT EXISTS idx_obras_backoffice_song      ON obras(backoffice_song_id);
CREATE INDEX IF NOT EXISTS idx_obras_backoffice_work      ON obras(backoffice_work_id);
CREATE INDEX IF NOT EXISTS idx_obras_backoffice_status    ON obras(backoffice_status);


-- ── TITULARES — códigos legados e CWR ───────────────────────
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS codigo_interno_legado      TEXT,
  ADD COLUMN IF NOT EXISTS codigo_autor_cwr_original  TEXT,
  ADD COLUMN IF NOT EXISTS codigo_sequence_cwr        TEXT,
  ADD COLUMN IF NOT EXISTS cae_historico              JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS origem_importacao          TEXT NOT NULL DEFAULT 'manual'
    CHECK (origem_importacao IN ('manual','cwr','contrato','migracao_legado'));

COMMENT ON COLUMN titulares.codigo_interno_legado     IS 'Código interno legado. Ex: HR01. Não é CAE nem IPI.';
COMMENT ON COLUMN titulares.codigo_autor_cwr_original IS 'Writer code exato como veio no SWR do CWR.';
COMMENT ON COLUMN titulares.codigo_sequence_cwr       IS 'Sequence # do SWR dentro da obra (vínculo PWR).';
COMMENT ON COLUMN titulares.cae_historico             IS 'Array de CAEs históricos [{cae, ipi, inicio, fim}].';

CREATE INDEX IF NOT EXISTS idx_titulares_codigo_legado  ON titulares(codigo_interno_legado);
CREATE INDEX IF NOT EXISTS idx_titulares_cwr_original   ON titulares(codigo_autor_cwr_original);


-- ── EDITORAS — tipo, controle e BackOffice ───────────────────
ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS codigo_publisher_cwr       TEXT,
  ADD COLUMN IF NOT EXISTS codigo_interno_legado      TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_publisher_id    TEXT,
  ADD COLUMN IF NOT EXISTS tipo_editora               TEXT NOT NULL DEFAULT 'master'
    CHECK (tipo_editora IN ('master','administrada','externa')),
  ADD COLUMN IF NOT EXISTS controlada                 BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN editoras.tipo_editora   IS 'master | administrada | externa';
COMMENT ON COLUMN editoras.controlada     IS 'TRUE se a editora é controlada/gerida pelo tenant.';
COMMENT ON COLUMN editoras.codigo_publisher_cwr IS 'Publisher code usado nos registros SPU do CWR.';

-- Quando editora_master_id é esta editora, é sempre master
-- Editoras administradas devem ser marcadas manualmente ou via importação CWR

CREATE INDEX IF NOT EXISTS idx_editoras_publisher_cwr   ON editoras(codigo_publisher_cwr);
CREATE INDEX IF NOT EXISTS idx_editoras_codigo_legado   ON editoras(codigo_interno_legado);
CREATE INDEX IF NOT EXISTS idx_editoras_tipo            ON editoras(tipo_editora);


-- ── OBRAS_LINKS_TITULARES — rastreabilidade PWR ──────────────
ALTER TABLE obras_links_titulares
  ADD COLUMN IF NOT EXISTS writer_sequence_code         TEXT,
  ADD COLUMN IF NOT EXISTS publisher_sequence_code      TEXT,
  ADD COLUMN IF NOT EXISTS pwr_writer_code              TEXT,
  ADD COLUMN IF NOT EXISTS pwr_publisher_code           TEXT,
  ADD COLUMN IF NOT EXISTS codigo_vinculo_cwr_original  TEXT,
  ADD COLUMN IF NOT EXISTS codigo_interno_legado_titular TEXT,
  ADD COLUMN IF NOT EXISTS codigo_interno_legado_editora TEXT,
  ADD COLUMN IF NOT EXISTS fonte_controle               TEXT NOT NULL DEFAULT 'manual'
    CHECK (fonte_controle IN ('manual','cwr','editora_administrada','contrato','sistema_antigo'));

COMMENT ON COLUMN obras_links_titulares.writer_sequence_code    IS 'writer_seq do SWR no CWR (2 chars, ex: 01).';
COMMENT ON COLUMN obras_links_titulares.publisher_sequence_code IS 'pub_seq do SPU no CWR (2 chars, ex: 01).';
COMMENT ON COLUMN obras_links_titulares.pwr_writer_code         IS 'writer_seq do PWR que vincula este autor à editora.';
COMMENT ON COLUMN obras_links_titulares.pwr_publisher_code      IS 'pub_code do PWR (até 14 chars).';
COMMENT ON COLUMN obras_links_titulares.fonte_controle          IS 'Como o controle foi determinado para esta linha.';

CREATE INDEX IF NOT EXISTS idx_olt_writer_seq  ON obras_links_titulares(writer_sequence_code);
CREATE INDEX IF NOT EXISTS idx_olt_pub_seq     ON obras_links_titulares(publisher_sequence_code);


-- ── TABELA AUXILIAR: backoffice_obras_status ─────────────────
-- Histórico completo de envios/retornos da BackOffice por obra.
-- Mantém trilha de auditoria sem sobrescrever dados anteriores.
CREATE TABLE IF NOT EXISTS backoffice_obras_status (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_id                 UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,

  -- Identificadores
  codigo_obra_sync_mood   TEXT,
  codigo_interno_legado   TEXT,
  codigo_obra_cwr         TEXT,
  backoffice_song_id      TEXT,
  backoffice_work_id      TEXT,
  statement_song_code     TEXT,

  -- Status no ciclo BackOffice
  status                  TEXT NOT NULL DEFAULT 'nao_enviada'
    CHECK (status IN ('nao_enviada','enviada','song','work','divergente','rejeitada')),

  -- Datas de sincronização
  data_envio              TIMESTAMPTZ,
  data_retorno            TIMESTAMPTZ,

  -- Retorno/feedback
  mensagem_retorno        TEXT,
  erros                   JSONB DEFAULT '[]',
  avisos                  JSONB DEFAULT '[]',

  -- Arquivos relacionados
  arquivo_exportacao_id   UUID REFERENCES importacoes_log(id) ON DELETE SET NULL,
  arquivo_retorno_id      UUID REFERENCES importacoes_log(id) ON DELETE SET NULL,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE backoffice_obras_status IS 'Histórico de envios/retornos BackOffice por obra. Nunca sobrescreve — sempre insere novo registro.';

CREATE INDEX IF NOT EXISTS idx_bo_status_obra       ON backoffice_obras_status(obra_id);
CREATE INDEX IF NOT EXISTS idx_bo_status_song_id    ON backoffice_obras_status(backoffice_song_id);
CREATE INDEX IF NOT EXISTS idx_bo_status_work_id    ON backoffice_obras_status(backoffice_work_id);
CREATE INDEX IF NOT EXISTS idx_bo_status_tenant     ON backoffice_obras_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bo_status_status     ON backoffice_obras_status(status);
