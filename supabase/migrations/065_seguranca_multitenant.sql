-- ============================================================
-- Migration 065 — Blindagem Multi-Tenant
-- 1. Corrigir view v_obra_integrantes (sem filtro de tenant)
-- 2. Criar tabela tenant_planos (licenciamento)
-- NOTE: audit_logs já existe na migration 044 — não recriar
-- ============================================================

-- ── 1. CORRIGIR VIEW v_obra_integrantes ─────────────────────
-- A view anterior não filtrava por tenant. Adicionamos tenant_id
-- para que toda API possa encapsular com .eq('tenant_id', ...).
DROP VIEW IF EXISTS v_obra_integrantes;

CREATE VIEW v_obra_integrantes AS
SELECT
  olt.tenant_id,
  olt.id,
  olt.obra_id,
  o.titulo                          AS obra_titulo,
  olt.obra_link_id,
  ol.percentual_link,
  ol.tipo_link,
  olt.titular_id,
  t.nome_completo                   AS titular_nome,
  t.nome_artistico                  AS titular_pseudonimo,
  olt.funcao_no_link,
  olt.papel,
  olt.percentual_exec_publica,
  olt.percentual_fonomecanico,
  olt.percentual_sincronizacao,
  olt.controlado,
  olt.status_controle,
  olt.contrato_id,
  olt.editora_id,
  e.nome_fantasia                   AS editora_nome,
  olt.editora_administradora_id,
  ea.nome_fantasia                  AS editora_administradora_nome
FROM obras_links_titulares olt
JOIN obras_links ol  ON ol.id    = olt.obra_link_id
JOIN obras      o    ON o.id     = olt.obra_id
LEFT JOIN titulares t ON t.id    = olt.titular_id
LEFT JOIN editoras  e  ON e.id   = olt.editora_id
LEFT JOIN editoras  ea ON ea.id  = olt.editora_administradora_id;

COMMENT ON VIEW v_obra_integrantes IS
  'REGRA: nunca expor diretamente ao frontend. Sempre encapsular via API com .eq(tenant_id).';

-- ── 2. TABELA tenant_planos ──────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_planos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL UNIQUE,
  plano                 TEXT NOT NULL DEFAULT 'basico'
                          CHECK (plano IN ('basico','profissional','enterprise','interno')),
  status_licenca        TEXT NOT NULL DEFAULT 'ativa'
                          CHECK (status_licenca IN ('ativa','suspensa','cancelada','trial')),
  -- Limites (NULL = ilimitado)
  max_usuarios          INT,
  max_obras             INT,
  max_contratos         INT,
  max_storage_mb        INT,
  max_cwr_importacoes   INT,
  max_autorizacoes_mes  INT,
  max_chamadas_ia_mes   INT,
  -- Consumo atual (resetar mensalmente via cron ou function)
  uso_autorizacoes_mes  INT NOT NULL DEFAULT 0,
  uso_chamadas_ia_mes   INT NOT NULL DEFAULT 0,
  -- Datas
  licenca_inicio        DATE NOT NULL DEFAULT CURRENT_DATE,
  licenca_fim           DATE,
  trial_fim             DATE,
  -- Metadados
  nome_plano_display    TEXT,
  observacoes           TEXT,
  criado_em             TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role full access" ON tenant_planos USING (true);

-- ── 3. Inserir plano "interno" para tenants existentes ───────
INSERT INTO tenant_planos (tenant_id, plano, status_licenca, nome_plano_display)
SELECT DISTINCT tenant_id, 'interno', 'ativa', 'Uso Interno'
FROM (
  SELECT tenant_id FROM obras         WHERE tenant_id IS NOT NULL
  UNION
  SELECT tenant_id FROM titulares     WHERE tenant_id IS NOT NULL
  UNION
  SELECT tenant_id FROM contratos     WHERE tenant_id IS NOT NULL
  UNION
  SELECT tenant_id FROM autorizacoes  WHERE tenant_id IS NOT NULL
) t
ON CONFLICT (tenant_id) DO NOTHING;
