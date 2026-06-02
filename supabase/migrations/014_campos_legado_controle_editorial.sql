-- ============================================================
-- 014_campos_legado_controle_editorial.sql
-- Aplica campos de rastreabilidade CWR/BackOffice/Legado
-- nas tabelas existentes (obras, titulares, editoras,
-- obras_links_titulares).
--
-- Combina o conteudo de 012 + 013 em um unico script seguro.
-- REGRA: apenas ADD COLUMN IF NOT EXISTS — nunca altera
--        colunas ou indices existentes.
-- ============================================================

-- ── OBRAS — codigos legados e BackOffice ─────────────────────
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS codigo_interno_legado      TEXT,
  ADD COLUMN IF NOT EXISTS codigo_obra_cwr_original   TEXT,
  ADD COLUMN IF NOT EXISTS codigo_publisher_song       TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_song_id          TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_work_id          TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_status           TEXT NOT NULL DEFAULT 'nao_enviada',
  ADD COLUMN IF NOT EXISTS backoffice_last_sync_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS origem_importacao           TEXT NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN obras.codigo_interno_legado    IS 'Codigo legado do sistema anterior. Ex: AFW2. Nao e ISWC.';
COMMENT ON COLUMN obras.codigo_obra_cwr_original IS 'Submitter Work # exato como veio no NWR do CWR.';
COMMENT ON COLUMN obras.codigo_publisher_song    IS 'Codigo usado para matching com relatorios B-55.';
COMMENT ON COLUMN obras.backoffice_song_id       IS 'ID retornado pela BackOffice quando a obra entra como SONG passiva.';
COMMENT ON COLUMN obras.backoffice_work_id       IS 'ID retornado pela BackOffice quando a obra e validada como WORK ativa.';

CREATE INDEX IF NOT EXISTS idx_obras_codigo_legado        ON obras(codigo_interno_legado);
CREATE INDEX IF NOT EXISTS idx_obras_cwr_original         ON obras(codigo_obra_cwr_original);
CREATE INDEX IF NOT EXISTS idx_obras_backoffice_song      ON obras(backoffice_song_id);
CREATE INDEX IF NOT EXISTS idx_obras_backoffice_work      ON obras(backoffice_work_id);
CREATE INDEX IF NOT EXISTS idx_obras_backoffice_status    ON obras(backoffice_status);


-- ── TITULARES — codigos legados e CWR ───────────────────────
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS codigo_interno_legado      TEXT,
  ADD COLUMN IF NOT EXISTS codigo_autor_cwr_original  TEXT,
  ADD COLUMN IF NOT EXISTS codigo_sequence_cwr        TEXT,
  ADD COLUMN IF NOT EXISTS origem_importacao          TEXT NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN titulares.codigo_interno_legado     IS 'Codigo interno legado. Ex: HR01. Nao e CAE nem IPI.';
COMMENT ON COLUMN titulares.codigo_autor_cwr_original IS 'Writer code exato como veio no SWR do CWR.';
COMMENT ON COLUMN titulares.codigo_sequence_cwr       IS 'Sequence # do SWR dentro da obra (vinculo PWR).';

CREATE INDEX IF NOT EXISTS idx_titulares_codigo_legado  ON titulares(codigo_interno_legado);
CREATE INDEX IF NOT EXISTS idx_titulares_cwr_original   ON titulares(codigo_autor_cwr_original);


-- ── EDITORAS — tipo, controle e BackOffice ───────────────────
ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS codigo_publisher_cwr       TEXT,
  ADD COLUMN IF NOT EXISTS codigo_interno_legado      TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_publisher_id    TEXT,
  ADD COLUMN IF NOT EXISTS tipo_editora               TEXT NOT NULL DEFAULT 'master',
  ADD COLUMN IF NOT EXISTS controlada                 BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN editoras.tipo_editora   IS 'master | administrada | externa';
COMMENT ON COLUMN editoras.controlada     IS 'TRUE se a editora e controlada/gerida pelo tenant.';
COMMENT ON COLUMN editoras.codigo_publisher_cwr IS 'Publisher code usado nos registros SPU do CWR.';

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
  ADD COLUMN IF NOT EXISTS fonte_controle               TEXT NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN obras_links_titulares.writer_sequence_code    IS 'writer_seq do SWR no CWR.';
COMMENT ON COLUMN obras_links_titulares.publisher_sequence_code IS 'pub_seq do SPU no CWR.';
COMMENT ON COLUMN obras_links_titulares.pwr_writer_code         IS 'writer_seq do PWR que vincula este autor a editora.';
COMMENT ON COLUMN obras_links_titulares.pwr_publisher_code      IS 'pub_code do PWR.';
COMMENT ON COLUMN obras_links_titulares.fonte_controle          IS 'Como o controle foi determinado para esta linha.';

CREATE INDEX IF NOT EXISTS idx_olt_writer_seq  ON obras_links_titulares(writer_sequence_code);
CREATE INDEX IF NOT EXISTS idx_olt_pub_seq     ON obras_links_titulares(publisher_sequence_code);


-- ── TABELA AUXILIAR: backoffice_obras_status ─────────────────
CREATE TABLE IF NOT EXISTS backoffice_obras_status (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_id                 UUID REFERENCES obras(id) ON DELETE CASCADE,

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

COMMENT ON TABLE backoffice_obras_status IS 'Historico de envios/retornos BackOffice por obra. Nunca sobrescreve — sempre insere novo registro.';

CREATE INDEX IF NOT EXISTS idx_bo_status_obra       ON backoffice_obras_status(obra_id);
CREATE INDEX IF NOT EXISTS idx_bo_status_song_id    ON backoffice_obras_status(backoffice_song_id);
CREATE INDEX IF NOT EXISTS idx_bo_status_work_id    ON backoffice_obras_status(backoffice_work_id);
CREATE INDEX IF NOT EXISTS idx_bo_status_tenant     ON backoffice_obras_status(tenant_id);


-- ── TERRITORIOS (parametrizaveis por tenant) ─────────────────
CREATE TABLE IF NOT EXISTS territorios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo        TEXT NOT NULL,
  nome          TEXT NOT NULL,
  descricao     TEXT,
  cisac_code    TEXT,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_territorios_tenant ON territorios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_territorios_codigo ON territorios(codigo);


-- ── TIPOS DE DIREITO (parametrizaveis por tenant) ─────────────
CREATE TABLE IF NOT EXISTS tipos_direito (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo              TEXT NOT NULL,
  nome                TEXT NOT NULL,
  descricao           TEXT,
  entra_distribuicao  BOOLEAN NOT NULL DEFAULT TRUE,
  tipo_cwr            TEXT DEFAULT 'ambos',
  ordem               INTEGER NOT NULL DEFAULT 0,
  ativo               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_tipos_direito_tenant ON tipos_direito(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tipos_direito_codigo ON tipos_direito(codigo);


-- ── RLS para novas tabelas ────────────────────────────────────
ALTER TABLE backoffice_obras_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE territorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_direito ENABLE ROW LEVEL SECURITY;

-- Policies simples: usuario vê apenas registros do seu tenant
CREATE POLICY IF NOT EXISTS "bo_status_tenant_isolation"
  ON backoffice_obras_status FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "territorios_tenant_isolation"
  ON territorios FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "tipos_direito_tenant_isolation"
  ON tipos_direito FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid()));
