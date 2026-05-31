-- ============================================================
-- 007_recebimentos_importacoes.sql
-- ============================================================

-- ── IMPORTACOES_LOG ──────────────────────────────────────────
-- Auditoria de cada arquivo importado (CWR, DSP TXT, etc.)
CREATE TABLE importacoes_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  arquivo               TEXT NOT NULL,
  statement_id          TEXT,                                      -- ex: ST492347 (anti-duplicação)
  tipo                  tipo_importacao_log NOT NULL,
  status                status_importacao NOT NULL DEFAULT 'sucesso',
  obras_importadas      INTEGER DEFAULT 0,
  titulares_importados  INTEGER DEFAULT 0,
  total_valor           NUMERIC(18,6) DEFAULT 0,
  publisher             TEXT,
  source                TEXT,                                      -- DSP: Spotify, YouTube, etc.
  periodo_inicio        DATE,
  periodo_fim           DATE,
  detalhes              TEXT,
  usuario_id            UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_importacoes_tenant       ON importacoes_log(tenant_id);
CREATE INDEX idx_importacoes_statement    ON importacoes_log(statement_id);
CREATE INDEX idx_importacoes_tipo         ON importacoes_log(tipo);
CREATE INDEX idx_importacoes_created      ON importacoes_log(created_at DESC);

-- ── RECEBIMENTOS ─────────────────────────────────────────────
CREATE TABLE recebimentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  editora_id        UUID REFERENCES editoras(id) ON DELETE SET NULL,
  importacao_id     UUID REFERENCES importacoes_log(id) ON DELETE SET NULL,
  obra_id           UUID REFERENCES obras(id) ON DELETE SET NULL,

  -- Metadados do arquivo B-55
  statement_id      TEXT,
  publisher         TEXT,
  source            TEXT,                                          -- DSP
  song_code         TEXT,                                          -- Publisher_SongCode
  song_title        TEXT,
  start_date        DATE,
  end_date          DATE,

  -- Valores
  valor_bruto       NUMERIC(18,6) NOT NULL DEFAULT 0,
  moeda             TEXT NOT NULL DEFAULT 'USD',
  valor_brl         NUMERIC(18,6),                                 -- convertido se necessário

  -- Status
  fonte             fonte_recebimento NOT NULL DEFAULT 'backoffice_music_services',
  status            status_recebimento NOT NULL DEFAULT 'importado',
  periodo_dist_id   UUID,                                          -- FK periodos_distribuicao (adicionado depois)
  matched_em        TIMESTAMPTZ,
  distribuido_em    TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_recebimentos_updated_at BEFORE UPDATE ON recebimentos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_recebimentos_tenant      ON recebimentos(tenant_id);
CREATE INDEX idx_recebimentos_obra        ON recebimentos(obra_id);
CREATE INDEX idx_recebimentos_song_code   ON recebimentos(song_code);
CREATE INDEX idx_recebimentos_statement   ON recebimentos(statement_id);
CREATE INDEX idx_recebimentos_status      ON recebimentos(status);
CREATE INDEX idx_recebimentos_periodo     ON recebimentos(periodo_dist_id);
