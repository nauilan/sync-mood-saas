-- ============================================================
-- BLOCO 5: Evolucao CWR / Legado / BackOffice
-- Sync Mood SaaS — Adiciona campos SEM quebrar estrutura existente
-- Execute no SQL Editor do Supabase APOS os blocos 1-4
-- ============================================================

-- ── 1. OBRAS: campos legado + BackOffice ─────────────────────
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS codigo_interno_legado    TEXT,
  ADD COLUMN IF NOT EXISTS codigo_obra_cwr_original TEXT,
  ADD COLUMN IF NOT EXISTS codigo_publisher_song    TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_song_id       TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_work_id       TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_status        TEXT DEFAULT 'nao_enviada',
  ADD COLUMN IF NOT EXISTS backoffice_last_sync_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS origem_importacao        TEXT DEFAULT 'manual';

-- Índices para busca rápida por código legado
CREATE INDEX IF NOT EXISTS idx_obras_codigo_legado     ON obras(codigo_interno_legado)     WHERE codigo_interno_legado IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obras_cwr_original      ON obras(codigo_obra_cwr_original)  WHERE codigo_obra_cwr_original IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obras_bo_song_id        ON obras(backoffice_song_id)         WHERE backoffice_song_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obras_bo_work_id        ON obras(backoffice_work_id)         WHERE backoffice_work_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obras_bo_status         ON obras(backoffice_status);

-- ── 2. TITULARES: campos legado CWR ──────────────────────────
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS codigo_interno_legado       TEXT,
  ADD COLUMN IF NOT EXISTS codigo_autor_cwr_original   TEXT,
  ADD COLUMN IF NOT EXISTS codigo_titular_sistema_antigo TEXT,
  ADD COLUMN IF NOT EXISTS codigo_sequence_cwr         TEXT,
  ADD COLUMN IF NOT EXISTS origem_importacao           TEXT DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_titulares_legado ON titulares(codigo_interno_legado) WHERE codigo_interno_legado IS NOT NULL;

-- ── 3. EDITORAS: campos CWR + controle editorial ─────────────
ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS codigo_interno_legado    TEXT,
  ADD COLUMN IF NOT EXISTS codigo_publisher_cwr     TEXT,
  ADD COLUMN IF NOT EXISTS codigo_sequence_cwr      TEXT,
  ADD COLUMN IF NOT EXISTS backoffice_publisher_id  TEXT,
  ADD COLUMN IF NOT EXISTS controlada               BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tipo_editora             TEXT NOT NULL DEFAULT 'externa';
  -- tipo_editora: 'master' | 'administrada' | 'externa'

CREATE INDEX IF NOT EXISTS idx_editoras_controlada     ON editoras(controlada);
CREATE INDEX IF NOT EXISTS idx_editoras_tipo           ON editoras(tipo_editora);
CREATE INDEX IF NOT EXISTS idx_editoras_pub_cwr        ON editoras(codigo_publisher_cwr) WHERE codigo_publisher_cwr IS NOT NULL;

-- Marcar a editora master (Top Show) como controlada
-- (ajustar o nome_fantasia conforme necessario)
UPDATE editoras
SET tipo_editora = 'master', controlada = TRUE
WHERE lower(nome_fantasia) LIKE '%top show%'
   OR lower(razao_social)  LIKE '%top show%';

-- ── 4. OBRAS_LINKS_TITULARES: campos sequenciais CWR ─────────
ALTER TABLE obras_links_titulares
  ADD COLUMN IF NOT EXISTS writer_sequence_code        TEXT,
  ADD COLUMN IF NOT EXISTS publisher_sequence_code     TEXT,
  ADD COLUMN IF NOT EXISTS pwr_writer_code             TEXT,
  ADD COLUMN IF NOT EXISTS pwr_publisher_code          TEXT,
  ADD COLUMN IF NOT EXISTS codigo_vinculo_cwr_original TEXT,
  ADD COLUMN IF NOT EXISTS codigo_interno_legado_titular TEXT,
  ADD COLUMN IF NOT EXISTS codigo_interno_legado_editora TEXT,
  ADD COLUMN IF NOT EXISTS fonte_controle              TEXT DEFAULT 'manual';
  -- fonte_controle: 'contrato' | 'cwr' | 'editora_administrada' | 'manual' | 'sistema_antigo'

-- ── 5. OBRAS_LINKS: campo percentual_total ───────────────────
ALTER TABLE obras_links
  ADD COLUMN IF NOT EXISTS percentual_nao_controlado NUMERIC(7,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_participantes       INTEGER DEFAULT 0;

-- ── 6. NOVA TABELA: backoffice_obras_status ──────────────────
CREATE TABLE IF NOT EXISTS backoffice_obras_status (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_id                 UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  codigo_interno_legado   TEXT,
  codigo_obra_sync_mood   TEXT,
  codigo_obra_cwr_original TEXT,
  backoffice_song_id      TEXT,
  backoffice_work_id      TEXT,
  backoffice_status       TEXT NOT NULL DEFAULT 'nao_enviada',
  statement_song_code     TEXT,
  data_envio              TIMESTAMPTZ,
  data_retorno            TIMESTAMPTZ,
  mensagem_retorno        TEXT,
  erros                   JSONB DEFAULT '[]',
  avisos                  JSONB DEFAULT '[]',
  arquivo_exportacao_id   UUID REFERENCES importacoes_log(id) ON DELETE SET NULL,
  arquivo_retorno_id      UUID REFERENCES importacoes_log(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_bo_obras_status_updated_at
  BEFORE UPDATE ON backoffice_obras_status
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_bo_obras_tenant     ON backoffice_obras_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bo_obras_obra       ON backoffice_obras_status(obra_id);
CREATE INDEX IF NOT EXISTS idx_bo_obras_song_id    ON backoffice_obras_status(backoffice_song_id)  WHERE backoffice_song_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bo_obras_work_id    ON backoffice_obras_status(backoffice_work_id)  WHERE backoffice_work_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bo_obras_status     ON backoffice_obras_status(backoffice_status);

-- RLS para nova tabela
ALTER TABLE backoffice_obras_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_select_bo_obras_status" ON backoffice_obras_status FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());
CREATE POLICY "rls_write_bo_obras_status" ON backoffice_obras_status FOR ALL
  USING (tenant_id = fn_meu_tenant_id() AND fn_meu_role() IN ('master','admin','editora_administrada','financeiro'));

-- ── 7. CONFIRMAR ─────────────────────────────────────────────
SELECT
  'obras'                  AS tabela, count(*) AS colunas
  FROM information_schema.columns WHERE table_name = 'obras'
UNION ALL SELECT
  'titulares',             count(*) FROM information_schema.columns WHERE table_name = 'titulares'
UNION ALL SELECT
  'editoras',              count(*) FROM information_schema.columns WHERE table_name = 'editoras'
UNION ALL SELECT
  'obras_links_titulares', count(*) FROM information_schema.columns WHERE table_name = 'obras_links_titulares'
UNION ALL SELECT
  'backoffice_obras_status', count(*) FROM information_schema.columns WHERE table_name = 'backoffice_obras_status'
ORDER BY tabela;
