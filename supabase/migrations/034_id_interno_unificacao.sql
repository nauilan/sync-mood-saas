-- =============================================================================
-- Migration 034: Unificar codigo_interno — dropar codigo_interno_cwr e
--                codigo_publisher_cwr de editoras e titulares
-- =============================================================================
-- Contexto:
--   Após análise de CWRs reais da Top Show Music ficou confirmado que
--   codigo_interno = codigo_interno_cwr. Exemplos:
--     JD01     = Luan Marcelo Gavlik (João Dalzoto)
--     HR01     = Henrique Alves dos Reis (Henrique Reis)
--     2646326  = Top Show Music Ltda ME
--     8961236  = P3 Editora Musical Ltda
--   Não existe distinção prática — é o mesmo identificador usado internamente
--   e nos arquivos CWR para matching, geração e relacionamento.
--
--   codigo_publisher_cwr também é removido: sem comprovação operacional de
--   que representa identificador distinto. Se surgir necessidade futura
--   (ECAD / CISAC / sociedades estrangeiras), criar estrutura específica.
-- =============================================================================

BEGIN;

-- ============================================================
-- 1. VERIFICAÇÕES DE SEGURANÇA
-- ============================================================

-- 1a. Editoras: garantir que nenhuma editora tem codigo_interno_cwr ≠ codigo_interno
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM editoras
  WHERE codigo_interno_cwr IS NOT NULL
    AND codigo_interno     IS NOT NULL
    AND codigo_interno_cwr != codigo_interno;

  IF cnt > 0 THEN
    RAISE EXCEPTION
      'ABORT: % editora(s) com codigo_interno_cwr diferente de codigo_interno. '
      'Revisar e corrigir antes de rodar esta migration.', cnt;
  END IF;

  -- Verificar duplicidade de codigo_interno_cwr dentro do mesmo tenant
  SELECT COUNT(*) INTO cnt
  FROM (
    SELECT tenant_id, codigo_interno_cwr
    FROM editoras
    WHERE codigo_interno_cwr IS NOT NULL
    GROUP BY tenant_id, codigo_interno_cwr
    HAVING COUNT(*) > 1
  ) dups;

  IF cnt > 0 THEN
    RAISE EXCEPTION
      'ABORT: Duplicidade de codigo_interno_cwr em editoras detectada. '
      'Limpar antes de continuar.';
  END IF;

  RAISE NOTICE 'Verificação editoras OK.';
END $$;

-- 1b. Titulares: garantir que nenhum titular tem codigo_interno_cwr ≠ codigo_interno
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  -- codigo_interno ainda não existe em titulares, então apenas verificar
  -- duplicidade no proprio campo codigo_interno_cwr
  SELECT COUNT(*) INTO cnt
  FROM (
    SELECT tenant_id, codigo_interno_cwr
    FROM titulares
    WHERE codigo_interno_cwr IS NOT NULL
    GROUP BY tenant_id, codigo_interno_cwr
    HAVING COUNT(*) > 1
  ) dups;

  IF cnt > 0 THEN
    RAISE EXCEPTION
      'ABORT: Duplicidade de codigo_interno_cwr em titulares detectada. '
      'Limpar antes de continuar.';
  END IF;

  RAISE NOTICE 'Verificação titulares OK.';
END $$;

-- ============================================================
-- 2. TABELA editoras
-- ============================================================

-- Dropar índices únicos dos campos que serão removidos
DROP INDEX IF EXISTS uq_editoras_codigo_interno_cwr;
DROP INDEX IF EXISTS uq_editoras_codigo_publisher_cwr;

-- Criar índice único em codigo_interno por tenant (se ainda não existir)
CREATE UNIQUE INDEX IF NOT EXISTS uq_editoras_codigo_interno
  ON editoras (tenant_id, codigo_interno)
  WHERE codigo_interno IS NOT NULL;

-- Dropar colunas duplicadas
ALTER TABLE editoras DROP COLUMN IF EXISTS codigo_interno_cwr;
ALTER TABLE editoras DROP COLUMN IF EXISTS codigo_publisher_cwr;

COMMENT ON COLUMN editoras.codigo_interno IS
  'ID Interno — identificador único da editora, usado também como código '
  'nos arquivos CWR. Exemplos reais: 2646326 (Top Show), 8961236 (P3).';

-- ============================================================
-- 3. TABELA titulares
-- ============================================================

-- Adicionar codigo_interno (novo campo oficial)
ALTER TABLE titulares ADD COLUMN IF NOT EXISTS codigo_interno TEXT;

-- Migrar dados: codigo_interno_cwr → codigo_interno
UPDATE titulares
SET    codigo_interno = codigo_interno_cwr
WHERE  codigo_interno IS NULL
  AND  codigo_interno_cwr IS NOT NULL;

-- Dropar índice único do campo antigo
DROP INDEX IF EXISTS uq_titulares_codigo_interno_cwr;

-- Criar índice único em codigo_interno por tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_titulares_codigo_interno
  ON titulares (tenant_id, codigo_interno)
  WHERE codigo_interno IS NOT NULL;

-- Dropar coluna duplicada
ALTER TABLE titulares DROP COLUMN IF EXISTS codigo_interno_cwr;

COMMENT ON COLUMN titulares.codigo_interno IS
  'ID Interno — identificador único do titular, usado também como código '
  'nos arquivos CWR. Exemplos reais: JD01, HR01 (autores), 2646326 (editora).';

-- ============================================================
-- 4. CONFIRMAÇÃO
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Migration 034 concluída com sucesso.';
  RAISE NOTICE 'editoras  : codigo_interno_cwr e codigo_publisher_cwr removidos.';
  RAISE NOTICE 'titulares : codigo_interno adicionado, codigo_interno_cwr removido.';
  RAISE NOTICE 'ID Interno = identificador único do sistema e dos arquivos CWR.';
  RAISE NOTICE '=================================================';
END $$;

COMMIT;
