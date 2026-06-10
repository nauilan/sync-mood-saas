-- Migration 053: Tabela cobracas (nova)
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cobracas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  editora_id           UUID REFERENCES editoras(id) ON DELETE SET NULL,
  autorizacao_id       UUID REFERENCES autorizacoes(id) ON DELETE SET NULL,
  obra_id              UUID REFERENCES obras(id) ON DELETE SET NULL,
  titular_id           UUID REFERENCES titulares(id) ON DELETE SET NULL,

  numero_cobranca      TEXT NOT NULL,
  tipo                 TEXT NOT NULL DEFAULT 'licenciamento'
    CHECK (tipo IN (
      'licenciamento', 'royalty', 'sincronizacao',
      'performance', 'mecanica', 'digital', 'outro'
    )),
  status               TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status IN (
      'rascunho', 'emitida', 'paga', 'vencida', 'cancelada', 'em_disputa'
    )),

  valor_bruto          NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_liquido        NUMERIC(15,2),
  percentual_comissao  NUMERIC(5,2),
  moeda                TEXT DEFAULT 'BRL',

  licenciado_nome      TEXT,
  licenciado_cnpj_cpf  TEXT,
  licenciado_email     TEXT,

  data_emissao         DATE,
  data_vencimento      DATE,
  data_pagamento       DATE,
  periodo_referencia   TEXT,
  territorio           TEXT DEFAULT 'BR',

  observacoes          TEXT,
  raw_payload          JSONB,

  emitida_por          UUID REFERENCES usuarios(id),
  editora_administrada_id UUID REFERENCES editoras(id),

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,
  deleted_by           UUID REFERENCES usuarios(id),

  UNIQUE (tenant_id, numero_cobranca)
);

-- ── Índices ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cobracas_tenant      ON cobracas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_cobracas_editora      ON cobracas (editora_id);
CREATE INDEX IF NOT EXISTS idx_cobracas_status       ON cobracas (status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_cobracas_obra         ON cobracas (obra_id) WHERE obra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cobracas_autorizacao  ON cobracas (autorizacao_id) WHERE autorizacao_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cobracas_administrada ON cobracas (editora_administrada_id) WHERE editora_administrada_id IS NOT NULL;

-- ── Validação ───────────────────────────────────────────────────────────────
SELECT COUNT(*) AS colunas_cobracas FROM information_schema.columns
WHERE table_name = 'cobracas';
