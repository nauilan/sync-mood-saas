-- ============================================================
-- 00102_modulo3_obras.sql — Modulo 3: Obras e Catalogo
-- Sync Mood Gestao Inteligente
-- ============================================================

-- ── obras ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS obras (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo              TEXT NOT NULL,
  titulo              TEXT NOT NULL,
  titulo_original     TEXT,
  iswc                TEXT,                -- NULL ate retorno da sociedade (pos-cadastro SOCINPRO)
  idioma              TEXT NOT NULL DEFAULT 'Portugues',
  genero              TEXT,
  duracao             INTEGER,             -- segundos
  ano_criacao         INTEGER,
  status              TEXT NOT NULL DEFAULT 'pre_cadastro'
                      CHECK (status IN ('pre_cadastro','validada','ativa','bloqueada','divergente')),
  editora_id          UUID,               -- editora responsavel principal
  contrato_origem_id  UUID,               -- contrato que originou a obra (nullable)
  observacoes         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── obras_titulos (titulos alternativos) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS obras_titulos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id     UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  principal   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── obras_letras ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS obras_letras (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id         UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  letra_completa  TEXT NOT NULL,
  idioma          TEXT NOT NULL DEFAULT 'Portugues',
  versao          TEXT NOT NULL DEFAULT '1.0',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── obras_links (links de participacao e controle) ───────────────────────────

CREATE TABLE IF NOT EXISTS obras_links (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id                 UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  ordem                   INTEGER NOT NULL DEFAULT 1,
  descricao               TEXT,
  controlado              BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = este link e administrado pela editora master
  percentual_controlado   NUMERIC(6,3) NOT NULL DEFAULT 0, -- percentual que a admin controla neste link
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── obras_links_titulares (participantes de cada link) ───────────────────────

CREATE TABLE IF NOT EXISTS obras_links_titulares (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id         UUID NOT NULL REFERENCES obras_links(id) ON DELETE CASCADE,
  titular_id      UUID,                -- FK para titulares (nullable para legados)
  nome            TEXT NOT NULL,
  papel           TEXT NOT NULL
                  CHECK (papel IN (
                    'autor','compositor','versionista','adaptador',
                    'editora_original','administradora','subeditora',
                    'interprete_referencia'
                  )),
  percentual      NUMERIC(6,3) NOT NULL DEFAULT 0,
  sociedade       TEXT,
  cae             TEXT,
  ipi             TEXT,
  controlado      BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = este titular e controlado pela editora
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── fonogramas ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fonogramas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id             UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  isrc                TEXT,                    -- NULL ate cadastro junto a gravadora
  titulo_fonograma    TEXT NOT NULL,
  interprete          TEXT NOT NULL,
  gravadora_id        UUID,
  produtor            TEXT,
  data_lancamento     DATE,
  plataformas_json    JSONB DEFAULT '[]'::JSONB,
  duracao             INTEGER,                 -- segundos
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── obras_contratos (relacao N:N obra <> contrato) ───────────────────────────

CREATE TABLE IF NOT EXISTS obras_contratos (
  obra_id             UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  contrato_id         UUID NOT NULL,
  percentual_aplicado NUMERIC(6,3),
  PRIMARY KEY (obra_id, contrato_id)
);

-- ── obras_exportacoes_log ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS obras_exportacoes_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id     UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  destino     TEXT NOT NULL,           -- ex: 'SOCINPRO', 'CWR', 'BackOffice'
  data        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status      TEXT NOT NULL DEFAULT 'enviado'
              CHECK (status IN ('enviado','confirmado','erro','aguardando_retorno'))
);

-- ── obras_divergencias ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS obras_divergencias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id     UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,           -- ex: 'percentual', 'iswc', 'titular', 'contrato'
  descricao   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'aberta'
              CHECK (status IN ('aberta','em_analise','resolvida','ignorada')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_obras_tenant     ON obras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_obras_status     ON obras(status);
CREATE INDEX IF NOT EXISTS idx_obras_editora    ON obras(editora_id);
CREATE INDEX IF NOT EXISTS idx_obras_iswc       ON obras(iswc) WHERE iswc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obras_links_obra ON obras_links(obra_id);
CREATE INDEX IF NOT EXISTS idx_fonogramas_obra  ON fonogramas(obra_id);

-- ── RLS (multi-tenant) ────────────────────────────────────────────────────────

ALTER TABLE obras                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_titulos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_letras          ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_links           ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_links_titulares ENABLE ROW LEVEL SECURITY;
ALTER TABLE fonogramas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_contratos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_exportacoes_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_divergencias    ENABLE ROW LEVEL SECURITY;

-- obras: tenant_id = auth.uid()
CREATE POLICY "obras_tenant" ON obras
  FOR ALL USING (tenant_id = auth.uid());

-- obras_titulos via obras
CREATE POLICY "obras_titulos_tenant" ON obras_titulos
  FOR ALL USING (
    obra_id IN (SELECT id FROM obras WHERE tenant_id = auth.uid())
  );

-- obras_letras via obras
CREATE POLICY "obras_letras_tenant" ON obras_letras
  FOR ALL USING (
    obra_id IN (SELECT id FROM obras WHERE tenant_id = auth.uid())
  );

-- obras_links via obras
CREATE POLICY "obras_links_tenant" ON obras_links
  FOR ALL USING (
    obra_id IN (SELECT id FROM obras WHERE tenant_id = auth.uid())
  );

-- obras_links_titulares via obras_links via obras
CREATE POLICY "obras_links_titulares_tenant" ON obras_links_titulares
  FOR ALL USING (
    link_id IN (
      SELECT ol.id FROM obras_links ol
      JOIN obras o ON o.id = ol.obra_id
      WHERE o.tenant_id = auth.uid()
    )
  );

-- fonogramas via obras
CREATE POLICY "fonogramas_tenant" ON fonogramas
  FOR ALL USING (
    obra_id IN (SELECT id FROM obras WHERE tenant_id = auth.uid())
  );

-- obras_contratos via obras
CREATE POLICY "obras_contratos_tenant" ON obras_contratos
  FOR ALL USING (
    obra_id IN (SELECT id FROM obras WHERE tenant_id = auth.uid())
  );

-- obras_exportacoes_log via obras
CREATE POLICY "obras_exportacoes_log_tenant" ON obras_exportacoes_log
  FOR ALL USING (
    obra_id IN (SELECT id FROM obras WHERE tenant_id = auth.uid())
  );

-- obras_divergencias via obras
CREATE POLICY "obras_divergencias_tenant" ON obras_divergencias
  FOR ALL USING (
    obra_id IN (SELECT id FROM obras WHERE tenant_id = auth.uid())
  );
