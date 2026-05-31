-- ============================================================
-- 00103_modulo4_autorizacoes.sql — Modulo 4: Autorizacoes
-- Sync Mood Gestao Inteligente
-- ============================================================

-- ── autorizacoes_tipos_uso (seed table) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS autorizacoes_tipos_uso (
  codigo    TEXT PRIMARY KEY,
  nome      TEXT NOT NULL,
  categoria TEXT NOT NULL   -- 'sincronizacao' | 'publicidade' | 'fonograma' | 'incidental'
);

-- Seed conforme SPEC
INSERT INTO autorizacoes_tipos_uso (codigo, nome, categoria) VALUES
  ('abertura',      'Abertura',              'sincronizacao'),
  ('encerramento',  'Encerramento',          'sincronizacao'),
  ('tema',          'Tema',                  'sincronizacao'),
  ('fundo',         'Fundo',                 'sincronizacao'),
  ('performance',   'Performance',           'sincronizacao'),
  ('trailer',       'Trailer',               'sincronizacao'),
  ('teaser',        'Teaser',                'sincronizacao'),
  ('chamada',       'Chamada',               'sincronizacao'),
  ('vinheta',       'Vinheta',               'sincronizacao'),
  ('publicidade',   'Publicidade',           'publicidade'),
  ('incidental',    'Incidental',            'incidental')
ON CONFLICT (codigo) DO NOTHING;

-- ── autorizacoes ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS autorizacoes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_autorizacao          TEXT NOT NULL UNIQUE,   -- gerado automaticamente (e.g. AUTH-2026-00001)
  tipo                        TEXT NOT NULL
                              CHECK (tipo IN ('fonograma','videofonograma','sincronizacao','publicidade','incidental')),
  status                      TEXT NOT NULL DEFAULT 'rascunho'
                              CHECK (status IN (
                                'rascunho','em_analise','em_negociacao','aprovado',
                                'emitido','enviado','assinado','faturado','pago',
                                'vencido','cancelado','bloqueado'
                              )),
  tipo_negocio                TEXT NOT NULL DEFAULT 'recebido_editora'
                              CHECK (tipo_negocio IN (
                                'recebido_editora','sem_onus','recebido_autor','outros'
                              )),
  solicitante_id              UUID,                   -- titular solicitante
  licenciado_id               UUID,                   -- titular licenciado (cliente/emissora)
  data_solicitacao            DATE NOT NULL DEFAULT CURRENT_DATE,
  data_emissao                DATE,
  data_inicio                 DATE,
  data_fim                    DATE,
  territorio                  TEXT NOT NULL DEFAULT 'BR',
  exclusividade               BOOLEAN NOT NULL DEFAULT FALSE,
  exclusividade_periodo_meses INTEGER,
  valor_total                 NUMERIC(14,2),
  moeda                       TEXT NOT NULL DEFAULT 'BRL',
  observacoes                 TEXT,
  pdf_url                     TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── autorizacoes_obras (obras incluidas na autorizacao) ───────────────────────

CREATE TABLE IF NOT EXISTS autorizacoes_obras (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizacao_id          UUID NOT NULL REFERENCES autorizacoes(id) ON DELETE CASCADE,
  obra_id                 UUID NOT NULL REFERENCES obras(id),
  percentual_controlado   NUMERIC(6,3) NOT NULL DEFAULT 0,  -- % controlado calculado automaticamente
  percentual_autorizado   NUMERIC(6,3) NOT NULL DEFAULT 0,  -- % efetivamente autorizado (<=controlado — REGRA-MAE)
  tipo_uso                TEXT REFERENCES autorizacoes_tipos_uso(codigo),
  tempo_utilizacao        TEXT,         -- ex: '30 segundos', 'integral'
  valor                   NUMERIC(14,2),
  CONSTRAINT chk_pct_autorizado
    CHECK (percentual_autorizado <= percentual_controlado)   -- REGRA-MAE no banco
);

-- ── autorizacoes_links (links especificos vinculados a esta autorizacao) ──────

CREATE TABLE IF NOT EXISTS autorizacoes_links (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizacao_obra_id     UUID NOT NULL REFERENCES autorizacoes_obras(id) ON DELETE CASCADE,
  obra_link_id            UUID NOT NULL REFERENCES obras_links(id),
  percentual_link         NUMERIC(6,3) NOT NULL DEFAULT 0,   -- % do link na obra
  percentual_autorizado   NUMERIC(6,3) NOT NULL DEFAULT 0,   -- % autorizado do link
  valor_link              NUMERIC(14,2),
  status                  TEXT NOT NULL DEFAULT 'incluido'
                          CHECK (status IN ('incluido','excluido','bloqueado'))
);

-- ── autorizacoes_precificacao (tabela de precos referencia) ───────────────────

CREATE TABLE IF NOT EXISTS autorizacoes_precificacao (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_autorizacao    TEXT NOT NULL
                      CHECK (tipo_autorizacao IN ('fonograma','videofonograma','sincronizacao','publicidade','incidental')),
  tipo_uso            TEXT REFERENCES autorizacoes_tipos_uso(codigo),
  emissora            TEXT,         -- ex: 'Globo', 'Multishow', 'Record'
  canal               TEXT,         -- ex: 'TV Aberta', 'TV Fechada', 'Streaming'
  ano                 INTEGER,
  territorio          TEXT NOT NULL DEFAULT 'BR',
  valor_base          NUMERIC(14,2) NOT NULL,
  moeda               TEXT NOT NULL DEFAULT 'BRL',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed precificacao referencia (dados mock spec)
INSERT INTO autorizacoes_precificacao
  (tipo_autorizacao, tipo_uso, emissora, canal, ano, territorio, valor_base, moeda)
VALUES
  ('sincronizacao', 'tema',          'Globo',      'TV Aberta',   2026, 'BR', 85000.00,  'BRL'),
  ('sincronizacao', 'abertura',      'Globo',      'TV Aberta',   2026, 'BR', 55000.00,  'BRL'),
  ('sincronizacao', 'encerramento',  'Globo',      'TV Aberta',   2026, 'BR', 45000.00,  'BRL'),
  ('sincronizacao', 'fundo',         'Globo',      'TV Aberta',   2026, 'BR', 25000.00,  'BRL'),
  ('sincronizacao', 'fundo',         'Multishow',  'TV Fechada',  2026, 'BR', 12000.00,  'BRL'),
  ('sincronizacao', 'tema',          'Multishow',  'TV Fechada',  2026, 'BR', 22000.00,  'BRL'),
  ('sincronizacao', 'vinheta',       'Globo',      'TV Aberta',   2026, 'BR', 8500.00,   'BRL'),
  ('publicidade',   'publicidade',   'Globo',      'TV Aberta',   2026, 'BR', 120000.00, 'BRL'),
  ('publicidade',   'publicidade',   'Globo',      'Streaming',   2026, 'BR', 65000.00,  'BRL'),
  ('fonograma',     NULL,            NULL,          NULL,         2026, 'BR', 5000.00,   'BRL'),
  ('videofonograma',NULL,            NULL,          NULL,         2026, 'BR', 8000.00,   'BRL'),
  ('incidental',    'incidental',    'Globo',      'TV Aberta',   2026, 'BR', 3500.00,   'BRL')
ON CONFLICT DO NOTHING;

-- ── autorizacoes_documentos ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS autorizacoes_documentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizacao_id  UUID NOT NULL REFERENCES autorizacoes(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL,    -- ex: 'minuta', 'contrato_assinado', 'comprovante_pagamento'
  url             TEXT NOT NULL,
  hash            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_autorizacoes_tenant     ON autorizacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_status     ON autorizacoes(status);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_tipo       ON autorizacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_obras_auth ON autorizacoes_obras(autorizacao_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_obras_obra ON autorizacoes_obras(obra_id);

-- ── RLS (multi-tenant) ────────────────────────────────────────────────────────

ALTER TABLE autorizacoes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE autorizacoes_obras       ENABLE ROW LEVEL SECURITY;
ALTER TABLE autorizacoes_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE autorizacoes_tipos_uso   ENABLE ROW LEVEL SECURITY;
ALTER TABLE autorizacoes_precificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE autorizacoes_documentos  ENABLE ROW LEVEL SECURITY;

-- autorizacoes: tenant_id = auth.uid()
CREATE POLICY "autorizacoes_tenant" ON autorizacoes
  FOR ALL USING (tenant_id = auth.uid());

-- autorizacoes_obras via autorizacoes
CREATE POLICY "autorizacoes_obras_tenant" ON autorizacoes_obras
  FOR ALL USING (
    autorizacao_id IN (SELECT id FROM autorizacoes WHERE tenant_id = auth.uid())
  );

-- autorizacoes_links via autorizacoes_obras via autorizacoes
CREATE POLICY "autorizacoes_links_tenant" ON autorizacoes_links
  FOR ALL USING (
    autorizacao_obra_id IN (
      SELECT ao.id FROM autorizacoes_obras ao
      JOIN autorizacoes a ON a.id = ao.autorizacao_id
      WHERE a.tenant_id = auth.uid()
    )
  );

-- tipos_uso: leitura publica (seed table)
CREATE POLICY "autorizacoes_tipos_uso_read" ON autorizacoes_tipos_uso
  FOR SELECT USING (TRUE);

-- precificacao: leitura publica
CREATE POLICY "autorizacoes_precificacao_read" ON autorizacoes_precificacao
  FOR SELECT USING (TRUE);

-- autorizacoes_documentos via autorizacoes
CREATE POLICY "autorizacoes_documentos_tenant" ON autorizacoes_documentos
  FOR ALL USING (
    autorizacao_id IN (SELECT id FROM autorizacoes WHERE tenant_id = auth.uid())
  );
