-- Migration 055 — cwr_importacoes_titulares
-- Staging de titulares encontrados/criados durante importação CWR.
-- Cada linha = um titular identificado em uma obra do CWR.
-- Serve de base para:
--   - Relatório por importação (encontrados / criados / conflitos / ignorados)
--   - Fila de revisão /master/titulares?status=pre_cadastro
--   - Auditoria de complementação de dados sem sobrescrever cadastro manual

CREATE TABLE IF NOT EXISTS cwr_importacoes_titulares (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vínculo com a importação e a obra de origem
  importacao_id       UUID        NOT NULL,
  obra_importacao_id  UUID,
  obra_id             UUID,

  -- Titular resolvido (NULL quando ignorado ou sem match)
  titular_id          UUID,

  -- Dados brutos do CWR
  nome_cwr            TEXT        NOT NULL,
  ipi_cae             TEXT,
  ip_name_number      TEXT,
  papel_cwr           TEXT,           -- código CWR original (CA, E, AM, SWR, SPU…)
  tipo_cwr            TEXT,           -- autor | editora | editora_administrada
  controlled          BOOLEAN     DEFAULT false,

  -- Percentuais efetivamente usados na integração
  pr_pct              NUMERIC(7,4),   -- execução pública
  mr_pct              NUMERIC(7,4),   -- controle editorial
  sr_pct              NUMERIC(7,4),   -- sincronização

  -- Origem do percentual: SWR | SPT | SPU
  fonte_percentual    TEXT,

  -- Resultado do matching
  match_status        TEXT        NOT NULL DEFAULT 'ignorado',
  -- encontrado          → match por IPI/CAE; confiança máxima; integrado automaticamente
  -- em_revisao          → match por nome (score 85); requer revisão humana antes de homologar
  -- criado_pre_cadastro → titular não existia; criado com status=pre_cadastro em titulares
  -- conflito            → múltiplos candidatos; requer decisão manual
  -- ignorado            → sem nome válido ou sem possibilidade de match

  match_criterio      TEXT,
  -- ipi_cae      → match por IPI/CAE (confiança máxima)
  -- ip_name_number → match por IP Name Number
  -- nome         → match por nome normalizado (fallback)
  -- id_interno   → match por código interno do sistema
  -- manual       → vinculado manualmente pelo usuário

  match_score         INTEGER,        -- 100=IPI, 85=nome, 0=sem match

  -- Payload completo do registro no snapshot CWR (para auditoria)
  dados_raw           JSONB,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Índices operacionais
CREATE INDEX IF NOT EXISTS idx_cwr_imp_tit_importacao  ON cwr_importacoes_titulares (importacao_id);
CREATE INDEX IF NOT EXISTS idx_cwr_imp_tit_obra        ON cwr_importacoes_titulares (obra_id);
CREATE INDEX IF NOT EXISTS idx_cwr_imp_tit_titular     ON cwr_importacoes_titulares (titular_id);
CREATE INDEX IF NOT EXISTS idx_cwr_imp_tit_status      ON cwr_importacoes_titulares (match_status);
CREATE INDEX IF NOT EXISTS idx_cwr_imp_tit_obra_imp    ON cwr_importacoes_titulares (obra_importacao_id);

-- Unique: evita duplicidade de mesma (obra, nome, papel) na mesma importação.
-- O route usa upsert ON CONFLICT DO NOTHING → CWR com registros duplicados não quebra.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cwr_imp_tit_obra_nome_papel
  ON cwr_importacoes_titulares (importacao_id, obra_id, nome_cwr, papel_cwr);

-- Comentários
COMMENT ON TABLE cwr_importacoes_titulares IS
  'Staging de titulares (autores e editoras) identificados em cada obra de uma importação CWR. '
  'Uma linha por titular por obra. Base da fila de revisão de pré-cadastros.';

COMMENT ON COLUMN cwr_importacoes_titulares.match_status IS
  'encontrado=match IPI (confiança máxima); em_revisao=match nome (requer revisão humana); '
  'criado_pre_cadastro=titular criado com status=pre_cadastro, origem_importacao=cwr; '
  'conflito=múltiplos candidatos; ignorado=sem match possível';

COMMENT ON COLUMN cwr_importacoes_titulares.fonte_percentual IS
  'SWR=percentual de autor (SWR record); SPT=percentual territorial de publisher; SPU=percentual editorial base';
