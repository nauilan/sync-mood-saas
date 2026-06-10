-- Migration 052: Extensão da tabela autorizacoes para workflow real
-- A tabela já existe (009_autorizacoes_prestacao.sql) — apenas ADD COLUMN IF NOT EXISTS
-- Executar no Supabase SQL Editor

-- ── 1. Novos campos operacionais ────────────────────────────────────────────
ALTER TABLE autorizacoes
  -- Tipo de autorização (substituindo tipo_uso, mantendo compatibilidade)
  ADD COLUMN IF NOT EXISTS tipo_autorizacao TEXT
    CHECK (tipo_autorizacao IS NULL OR tipo_autorizacao IN (
      'sync', 'audiovisual', 'publicidade', 'gravacao',
      'uso_especial', 'performance', 'digital', 'outro'
    )),
  -- Workflow de aprovação
  ADD COLUMN IF NOT EXISTS status_workflow TEXT DEFAULT 'rascunho'
    CHECK (status_workflow IN (
      'rascunho', 'aguardando_aprovacao_admin', 'emitida', 'cancelada', 'expirada'
    )),
  -- Número sequencial único
  ADD COLUMN IF NOT EXISTS numero_autorizacao TEXT,
  -- Dados do licenciado (separados do campo livre existente)
  ADD COLUMN IF NOT EXISTS licenciado_nome     TEXT,
  ADD COLUMN IF NOT EXISTS licenciado_cnpj_cpf TEXT,
  ADD COLUMN IF NOT EXISTS licenciado_email    TEXT,
  -- Finalidade detalhada
  ADD COLUMN IF NOT EXISTS finalidade          TEXT,
  ADD COLUMN IF NOT EXISTS valor_licenca       NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS prazo_inicio        DATE,
  ADD COLUMN IF NOT EXISTS prazo_fim           DATE,
  -- Vínculos
  ADD COLUMN IF NOT EXISTS titular_id          UUID REFERENCES titulares(id),
  ADD COLUMN IF NOT EXISTS obra_titulo         TEXT,  -- denormalizado para exibição
  ADD COLUMN IF NOT EXISTS editora_administrada_id UUID REFERENCES editoras(id),
  -- Aprovação
  ADD COLUMN IF NOT EXISTS emitida_por         UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS emitida_em          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aprovada_por        UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS aprovada_em         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
  ADD COLUMN IF NOT EXISTS raw_payload         JSONB;

-- ── 2. Índice único no número_autorizacao ──────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_autorizacoes_numero
  ON autorizacoes (tenant_id, numero_autorizacao)
  WHERE numero_autorizacao IS NOT NULL;

-- ── 3. Índices operacionais ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_autorizacoes_status_workflow
  ON autorizacoes (status_workflow, tenant_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_tipo_autorizacao
  ON autorizacoes (tipo_autorizacao) WHERE tipo_autorizacao IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_autorizacoes_editora_administrada
  ON autorizacoes (editora_administrada_id) WHERE editora_administrada_id IS NOT NULL;

-- ── Validação ───────────────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'autorizacoes'
ORDER BY ordinal_position;
