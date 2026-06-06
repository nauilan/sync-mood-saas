-- ============================================================
-- 029_cwr_unicidade_codigos.sql
-- Garante unicidade dos códigos CWR em editoras e titulares.
-- Adiciona campos para pré-cadastro de titulares via importação CWR.
-- NÃO altera Bridge, CC Obra, CC Titular, contratos ou CWR.
-- ============================================================

-- ============================================================
-- PARTE 0 — VERIFICAÇÃO DE SEGURANÇA
-- Aborta com mensagem clara se houver duplicidade nos campos
-- que receberão UNIQUE index. Novos campos (codigo_publisher_cwr,
-- titulares.codigo_interno_cwr) são ignorados pois ainda não existem.
-- ============================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN

  -- editoras.codigo_interno_cwr
  SELECT COUNT(*) INTO v_count FROM (
    SELECT tenant_id, codigo_interno_cwr
    FROM editoras
    WHERE codigo_interno_cwr IS NOT NULL AND deleted_at IS NULL
    GROUP BY tenant_id, codigo_interno_cwr
    HAVING COUNT(*) > 1
  ) t;
  IF v_count > 0 THEN
    RAISE EXCEPTION
      'MIGRATION 029 ABORTADA: editoras.codigo_interno_cwr possui % grupo(s) duplicado(s) por tenant. '
      'Corrija os dados antes de aplicar esta migration.',
      v_count;
  END IF;

  -- editoras.codigo_cae
  SELECT COUNT(*) INTO v_count FROM (
    SELECT tenant_id, codigo_cae
    FROM editoras
    WHERE codigo_cae IS NOT NULL AND deleted_at IS NULL
    GROUP BY tenant_id, codigo_cae
    HAVING COUNT(*) > 1
  ) t;
  IF v_count > 0 THEN
    RAISE EXCEPTION
      'MIGRATION 029 ABORTADA: editoras.codigo_cae possui % grupo(s) duplicado(s) por tenant. '
      'Corrija os dados antes de aplicar esta migration.',
      v_count;
  END IF;

  -- editoras.codigo_ipi
  SELECT COUNT(*) INTO v_count FROM (
    SELECT tenant_id, codigo_ipi
    FROM editoras
    WHERE codigo_ipi IS NOT NULL AND deleted_at IS NULL
    GROUP BY tenant_id, codigo_ipi
    HAVING COUNT(*) > 1
  ) t;
  IF v_count > 0 THEN
    RAISE EXCEPTION
      'MIGRATION 029 ABORTADA: editoras.codigo_ipi possui % grupo(s) duplicado(s) por tenant. '
      'Corrija os dados antes de aplicar esta migration.',
      v_count;
  END IF;

  -- titulares.codigo_cae
  SELECT COUNT(*) INTO v_count FROM (
    SELECT tenant_id, codigo_cae
    FROM titulares
    WHERE codigo_cae IS NOT NULL AND deleted_at IS NULL
    GROUP BY tenant_id, codigo_cae
    HAVING COUNT(*) > 1
  ) t;
  IF v_count > 0 THEN
    RAISE EXCEPTION
      'MIGRATION 029 ABORTADA: titulares.codigo_cae possui % grupo(s) duplicado(s) por tenant. '
      'Corrija os dados antes de aplicar esta migration.',
      v_count;
  END IF;

  -- titulares.codigo_ipi  (campo oficial — campo legado 'ipi' ignorado)
  SELECT COUNT(*) INTO v_count FROM (
    SELECT tenant_id, codigo_ipi
    FROM titulares
    WHERE codigo_ipi IS NOT NULL AND deleted_at IS NULL
    GROUP BY tenant_id, codigo_ipi
    HAVING COUNT(*) > 1
  ) t;
  IF v_count > 0 THEN
    RAISE EXCEPTION
      'MIGRATION 029 ABORTADA: titulares.codigo_ipi possui % grupo(s) duplicado(s) por tenant. '
      'Corrija os dados antes de aplicar esta migration.',
      v_count;
  END IF;

  RAISE NOTICE 'Migration 029 — verificacao de duplicidades OK. Prosseguindo.';
END $$;

-- ============================================================
-- PARTE 1 — EDITORAS: novo campo + unicidade dos códigos CWR
-- ============================================================

-- campo novo: código de publisher importado de arquivo CWR externo
-- diferente de codigo_interno_cwr (gerado pelo Sync Mood para exportar CWR)
ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS codigo_publisher_cwr TEXT;

COMMENT ON COLUMN editoras.codigo_publisher_cwr IS
  'Código de publisher importado de arquivo CWR externo. '
  'Diferente de codigo_interno_cwr, que é gerado pelo Sync Mood para exportação. '
  'Na importação CWR: se este código já existir → vincula. Se não existir → cria novo registro.';

-- unicidade parcial por tenant — ativo e preenchido
-- regra CWR: mesmo código no mesmo tenant = mesma editora
CREATE UNIQUE INDEX IF NOT EXISTS uq_editoras_codigo_interno_cwr
  ON editoras(tenant_id, codigo_interno_cwr)
  WHERE codigo_interno_cwr IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_editoras_codigo_publisher_cwr
  ON editoras(tenant_id, codigo_publisher_cwr)
  WHERE codigo_publisher_cwr IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_editoras_codigo_cae
  ON editoras(tenant_id, codigo_cae)
  WHERE codigo_cae IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_editoras_codigo_ipi
  ON editoras(tenant_id, codigo_ipi)
  WHERE codigo_ipi IS NOT NULL AND deleted_at IS NULL;

-- ============================================================
-- PARTE 2 — TITULARES: campos para pré-cadastro via CWR
-- ============================================================

-- código do titular no arquivo CWR (writer identifier, publisher sequence, etc.)
-- preservado da fonte — não sobrescreve codigo_titular (controle interno manual)
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS codigo_interno_cwr TEXT;

COMMENT ON COLUMN titulares.codigo_interno_cwr IS
  'Código do titular conforme consta no arquivo CWR importado. '
  'Não substitui codigo_titular (controle interno do Sync Mood). '
  'Na importação CWR: se código já existir → vincula ao titular existente. '
  'Se não existir → cria pré-cadastro com status pre_cadastro.';

-- origem do cadastro: manual (interface), cwr (importação), api (integração futura)
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS origem_importacao TEXT DEFAULT 'manual'
  CHECK (origem_importacao IN ('manual', 'cwr', 'api'));

COMMENT ON COLUMN titulares.origem_importacao IS
  'Origem do cadastro: '
  'manual = cadastrado pela interface do Sync Mood, '
  'cwr = gerado por importação de arquivo CWR (entra como pre_cadastro), '
  'api = integração externa futura.';

-- ID da importação que originou o registro (rastreabilidade)
-- sem FK por enquanto — tabela importacoes_cwr será criada no módulo CWR
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS importacao_id UUID;

COMMENT ON COLUMN titulares.importacao_id IS
  'ID da importação de origem (referência futura à tabela importacoes_cwr). '
  'Permite rastrear de qual arquivo CWR veio o pré-cadastro.';

-- Observação sobre campo legado:
-- titulares.ipi (TEXT) existe desde a migration 004 e é mantido por compatibilidade.
-- O campo oficial para IPI do titular é titulares.codigo_ipi.
-- Nenhum novo código deve gravar em titulares.ipi — usar sempre codigo_ipi.
COMMENT ON COLUMN titulares.ipi IS
  '[LEGADO] Campo mantido apenas por compatibilidade com dados históricos. '
  'Usar titulares.codigo_ipi para novos registros e importações CWR.';

-- novos valores no ENUM status_geral para pré-cadastro CWR
DO $$ BEGIN
  ALTER TYPE status_geral ADD VALUE IF NOT EXISTS 'pre_cadastro';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE status_geral ADD VALUE IF NOT EXISTS 'pendente_validacao';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- unicidade parcial por tenant em titulares
CREATE UNIQUE INDEX IF NOT EXISTS uq_titulares_codigo_interno_cwr
  ON titulares(tenant_id, codigo_interno_cwr)
  WHERE codigo_interno_cwr IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_titulares_codigo_cae
  ON titulares(tenant_id, codigo_cae)
  WHERE codigo_cae IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_titulares_codigo_ipi
  ON titulares(tenant_id, codigo_ipi)
  WHERE codigo_ipi IS NOT NULL AND deleted_at IS NULL;

-- índices auxiliares
CREATE INDEX IF NOT EXISTS idx_titulares_origem_importacao ON titulares(origem_importacao);
CREATE INDEX IF NOT EXISTS idx_titulares_importacao_id     ON titulares(importacao_id);
