-- =============================================================================
-- MIGRATION 044 — Auditoria Global
-- Cria: audit_logs
-- Campos extras: event_id (agrupa operacao), origem_execucao (usuario/sistema/...)
-- Soft delete: deleted_at + deleted_by nas 9 tabelas principais
-- Escopo fechado — nao inclui snapshots financeiros nem versionamento avancado
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. audit_logs — registro imutavel de todas as operacoes criticas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID REFERENCES tenants(id),
  usuario_id       UUID,

  -- event_id: agrupa todas as acoes de uma mesma operacao
  -- Ex: importacao BackOffice gera N linhas com o mesmo event_id
  event_id         UUID,

  -- origem_execucao: quem disparou a acao
  origem_execucao  TEXT NOT NULL DEFAULT 'usuario'
    CHECK (origem_execucao IN ('usuario', 'sistema', 'importacao', 'job', 'api')),

  -- O que aconteceu
  acao             TEXT NOT NULL,   -- criar | alterar | excluir | vincular | importar | aprovar | bloquear | distribuir | ...
  modulo           TEXT NOT NULL,   -- obras | negocios_editoriais | backoffice | recebimentos | distribuicao | contratos | cwr | ...

  -- Onde aconteceu
  tabela_afetada   TEXT,
  registro_id      TEXT,            -- UUID ou string do registro afetado

  -- O que mudou (JSONB para flexibilidade total)
  dados_anteriores JSONB,           -- estado antes da acao
  dados_novos      JSONB,           -- estado apos a acao

  -- Contexto tecnico
  ip               TEXT,
  user_agent       TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_al_tenant    ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_al_usuario   ON audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_al_event_id  ON audit_logs(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_al_acao      ON audit_logs(acao);
CREATE INDEX IF NOT EXISTS idx_al_modulo    ON audit_logs(modulo);
CREATE INDEX IF NOT EXISTS idx_al_tabela    ON audit_logs(tabela_afetada);
CREATE INDEX IF NOT EXISTS idx_al_registro  ON audit_logs(registro_id);
CREATE INDEX IF NOT EXISTS idx_al_created   ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_dados_ant ON audit_logs USING gin(dados_anteriores) WHERE dados_anteriores IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_al_dados_nov ON audit_logs USING gin(dados_novos)      WHERE dados_novos      IS NOT NULL;

COMMENT ON TABLE audit_logs IS
  'Registro imutavel de todas as operacoes criticas do Sync Mood. '
  'event_id agrupa todas as acoes de uma mesma operacao atomica. '
  'origem_execucao distingue acoes humanas de acoes automaticas do sistema. '
  'dados_anteriores + dados_novos permitem reconstruir qualquer estado historico. '
  'REGRA: nao deletar registros de audit_logs — e o historico oficial do sistema.';

COMMENT ON COLUMN audit_logs.event_id IS
  'Agrupa todas as linhas de uma mesma operacao. '
  'Ex: importacao BackOffice, distribuicao 1Q2026, processamento ONI. '
  'Permite reconstruir a operacao completa consultando por event_id.';

COMMENT ON COLUMN audit_logs.origem_execucao IS
  'usuario=acao humana via interface, sistema=automatico interno, '
  'importacao=pipeline de importacao de arquivos, job=scheduler/cron, api=integracao externa.';

-- -----------------------------------------------------------------------------
-- 2. Soft Delete — campos deleted_at + deleted_by nas tabelas principais
--    REGRA: DELETE fisico proibido. Excluir = setar deleted_at + deleted_by
--           + registrar em audit_logs com acao='excluir' e dados_anteriores.
-- -----------------------------------------------------------------------------
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE negocios_editoriais
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE recebimentos
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE recebimentos_itens
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE obras_backoffice
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE matching_rules
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Indices para filtrar registros nao deletados eficientemente
CREATE INDEX IF NOT EXISTS idx_obras_not_deleted           ON obras              (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_editoras_not_deleted        ON editoras            (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_titulares_not_deleted       ON titulares           (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_negocios_not_deleted        ON negocios_editoriais (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contratos_not_deleted       ON contratos           (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recebimentos_not_deleted    ON recebimentos        (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rec_itens_not_deleted       ON recebimentos_itens  (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_obras_bo_not_deleted        ON obras_backoffice    (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_matching_rules_not_deleted  ON matching_rules      (id) WHERE deleted_at IS NULL;
