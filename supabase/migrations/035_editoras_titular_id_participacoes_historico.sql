-- ================================================================
-- Migration 035 — editoras.titular_id + obras_participantes.data_inicio/data_fim
--                + auto-geração codigo_interno em titulares (sequence + trigger)
-- ================================================================
--
-- NOTAS ARQUITETURAIS (OBRIGATÓRIAS):
--
-- [1] REGRA 2 — Titular como entidade mestre:
--     Toda editora obrigatoriamente possui um titular correspondente.
--     Estrutura: titulares ← editoras (via editoras.titular_id)
--     FK inicialmente nullable. NOT NULL será exigido apenas após
--     vinculação manual de todas as editoras existentes (Top Show,
--     EDI, LR, P3, Lamu). Ver Bloco 6 para o relatório de pendências.
--
-- [2] REGRA 4 — Participações históricas:
--     obras_participantes.data_inicio / data_fim adicionados.
--     Uma obra pode trocar editora, administrador, percentual durante
--     sua vida útil. NUNCA sobrescrever participações antigas — sempre
--     encerrar a linha anterior (SET data_fim = hoje) e criar nova.
--     Linhas existentes ficam com NULL em ambos os campos:
--     - NULL data_inicio = vigência desde a criação da obra.
--     - NULL data_fim    = participação ativa (corrente).
--
-- [3] Auto-geração de codigo_interno em titulares:
--     Padrão: TIT000001, TIT000002, TIT000003 ...
--     Trigger BEFORE INSERT: se codigo_interno for NULL ou vazio,
--     gera via sequence atômica (sem race condition).
--     Se vier preenchido (CWR ou usuário), o valor é mantido.
--     DIFERENTE de codigo_titular (gerado na aplicação via COUNT+1).
--
-- [4] obras.codigo_obra já é o ID Interno da obra (ex: TSM0001).
--     NÃO criar campo codigo_interno duplicado em obras.
--     UI deve exibir codigo_obra com label "ID Interno da Obra".
--     Gap: API de obras passa ...rest sem gerar codigo_obra — corrigir
--     na UI antes de cadastrar obras reais (fora do escopo desta migration).
--
-- [5] editoras.tipo_editora mantido por compatibilidade, mas NÃO orienta
--     regras de negócio. Papel (E/AM/SE) definido em obras_participantes.
--     Valor 'administrada' na UI já foi renomeado para 'Parceira' visualmente.
--
-- [6] titulares.editora_id (FK antiga, inversa) e
--     titulares.editora_vinculada_id (migration 031) PERMANECEM.
--     Serão depreciados quando a refatoração "entidades" for concluída.
--
-- ================================================================
-- ROLLBACK (executar em caso de falha após BEGIN/antes de COMMIT):
--
--   ALTER TABLE editoras DROP COLUMN IF EXISTS titular_id;
--   DROP INDEX IF EXISTS idx_editoras_titular_id;
--   ALTER TABLE obras_participantes DROP COLUMN IF EXISTS data_inicio;
--   ALTER TABLE obras_participantes DROP COLUMN IF EXISTS data_fim;
--   ALTER TABLE obras_participantes DROP CONSTRAINT IF EXISTS chk_op_datas;
--   DROP INDEX IF EXISTS idx_op_ativa;
--   DROP TRIGGER IF EXISTS trg_titular_codigo_interno ON titulares;
--   DROP FUNCTION IF EXISTS fn_gerar_codigo_interno_titular();
--   DROP SEQUENCE IF EXISTS seq_titular_codigo_interno;
--
-- ================================================================

BEGIN;

-- ============================================================
-- 1. VERIFICAÇÕES DE SEGURANÇA
-- ============================================================

DO $$
BEGIN
  -- 1a. Garantir que migration 033 foi aplicada
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'obras_participantes'
  ) THEN
    RAISE EXCEPTION
      'ABORT: obras_participantes não existe. Aplicar migration 033 antes de prosseguir.';
  END IF;

  -- 1b. Garantir que tabela titulares existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'titulares'
  ) THEN
    RAISE EXCEPTION 'ABORT: tabela titulares não encontrada.';
  END IF;

  -- 1c. Garantir que tabela editoras existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'editoras'
  ) THEN
    RAISE EXCEPTION 'ABORT: tabela editoras não encontrada.';
  END IF;

  -- 1d. Confirmar que codigo_interno já existe em titulares (migration 034 aplicada)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'titulares' AND column_name = 'codigo_interno'
  ) THEN
    RAISE EXCEPTION
      'ABORT: titulares.codigo_interno não encontrado. Aplicar migration 034 antes.';
  END IF;

  RAISE NOTICE 'Verificações de segurança: OK';
END $$;


-- ============================================================
-- 2. editoras.titular_id — FK para titulares (Regra 2)
-- ============================================================

ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS titular_id UUID
  REFERENCES titulares(id) ON DELETE RESTRICT;

-- Índice parcial — só indexa linhas com vínculo preenchido
CREATE INDEX IF NOT EXISTS idx_editoras_titular_id
  ON editoras(titular_id)
  WHERE titular_id IS NOT NULL;

COMMENT ON COLUMN editoras.titular_id IS
  'FK para titulares.id — toda editora é também um titular (Regra 2). '
  'Nullable inicialmente; NOT NULL será exigido após vinculação manual de todas '
  'as editoras existentes. ON DELETE RESTRICT: impede remoção do titular enquanto '
  'houver editora vinculada. Relação: titulares ← editoras.';


-- ============================================================
-- 3. obras_participantes — histórico de participação (Regra 4)
-- ============================================================

ALTER TABLE obras_participantes
  ADD COLUMN IF NOT EXISTS data_inicio DATE;

ALTER TABLE obras_participantes
  ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Constraint: quando ambas preenchidas, data_fim deve ser posterior a data_inicio
ALTER TABLE obras_participantes
  DROP CONSTRAINT IF EXISTS chk_op_datas;

ALTER TABLE obras_participantes
  ADD CONSTRAINT chk_op_datas CHECK (
    data_fim IS NULL
    OR data_inicio IS NULL
    OR data_fim > data_inicio
  );

-- Índice parcial para consultas de participação ATIVA (data_fim IS NULL)
CREATE INDEX IF NOT EXISTS idx_op_ativa
  ON obras_participantes(obra_id, papel, data_fim)
  WHERE data_fim IS NULL;

COMMENT ON COLUMN obras_participantes.data_inicio IS
  'Início da vigência desta participação na obra. '
  'NULL = vigência desde a criação / data desconhecida (linhas históricas).';

COMMENT ON COLUMN obras_participantes.data_fim IS
  'Fim da vigência desta participação. NULL = participação ativa (corrente). '
  'Regra: ao substituir uma participação, SET data_fim = hoje na linha anterior '
  'e INSERT nova linha — nunca sobrescrever a linha existente.';


-- ============================================================
-- 4. Sequence + trigger — auto-geração de codigo_interno em titulares
-- ============================================================

-- Sequence global atômica (sem race condition — diferente do codigo_titular)
CREATE SEQUENCE IF NOT EXISTS seq_titular_codigo_interno
  START     1
  INCREMENT 1
  NO MAXVALUE
  NO CYCLE
  CACHE 1;

-- Função de geração automática
CREATE OR REPLACE FUNCTION fn_gerar_codigo_interno_titular()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Só gera se o chamador não forneceu codigo_interno
  IF NEW.codigo_interno IS NULL OR TRIM(NEW.codigo_interno) = '' THEN
    NEW.codigo_interno :=
      'TIT' || LPAD(nextval('seq_titular_codigo_interno')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_gerar_codigo_interno_titular() IS
  'Gera codigo_interno automático (TIT000001, TIT000002...) no INSERT de um titular '
  'quando o campo não for fornecido. Se o ID vier do CWR ou for informado pelo usuário, '
  'o valor é preservado sem alteração.';

-- Trigger BEFORE INSERT
DROP TRIGGER IF EXISTS trg_titular_codigo_interno ON titulares;

CREATE TRIGGER trg_titular_codigo_interno
  BEFORE INSERT ON titulares
  FOR EACH ROW
  EXECUTE FUNCTION fn_gerar_codigo_interno_titular();

COMMENT ON SEQUENCE seq_titular_codigo_interno IS
  'Sequência para auto-geração atômica de codigo_interno em titulares. '
  'Padrão: TIT000001 ... TIT999999. Garante unicidade sem race condition.';


-- ============================================================
-- 5. Sincronizar sequence com titulares que já têm TIT######
-- ============================================================

DO $$
DECLARE
  max_seq BIGINT;
BEGIN
  SELECT COALESCE(
    MAX(
      NULLIF(
        REGEXP_REPLACE(codigo_interno, '[^0-9]', '', 'g'),
        ''
      )::BIGINT
    ),
    0
  ) INTO max_seq
  FROM titulares
  WHERE codigo_interno ~ '^TIT\d+$';

  IF max_seq > 0 THEN
    PERFORM setval('seq_titular_codigo_interno', max_seq, true);
    RAISE NOTICE 'Sequence sincronizada: próximo valor = %.', max_seq + 1;
  ELSE
    RAISE NOTICE 'Nenhum TIT###### existente. Sequence começa em 1 (TIT000001).';
  END IF;
END $$;


-- ============================================================
-- 6. RELATÓRIO — editoras sem titular_id (vínculo manual pendente)
-- ============================================================

DO $$
DECLARE
  rec RECORD;
  cnt INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================================';
  RAISE NOTICE 'RELATÓRIO: editoras sem titular_id (ação necessária)';
  RAISE NOTICE '======================================================';

  FOR rec IN
    SELECT id, nome, tipo_editora, codigo_interno
    FROM   editoras
    WHERE  titular_id IS NULL
    ORDER  BY nome
  LOOP
    RAISE NOTICE '  - ID: % | Nome: % | tipo: % | cod_interno: %',
      rec.id,
      rec.nome,
      COALESCE(rec.tipo_editora, '—'),
      COALESCE(rec.codigo_interno, '—');
    cnt := cnt + 1;
  END LOOP;

  IF cnt = 0 THEN
    RAISE NOTICE '  (Nenhuma editora sem vínculo — OK)';
  ELSE
    RAISE NOTICE '------------------------------------------------------';
    RAISE NOTICE 'AÇÃO: % editora(s) precisam de titular_id.', cnt;
    RAISE NOTICE 'Vincular via SQL Editor:';
    RAISE NOTICE '  UPDATE editoras';
    RAISE NOTICE '    SET    titular_id = (SELECT id FROM titulares WHERE nome_completo = ''<nome>'' LIMIT 1)';
    RAISE NOTICE '    WHERE  id = ''<uuid_editora>'';';
    RAISE NOTICE 'Após vincular todas, alterar para NOT NULL:';
    RAISE NOTICE '  ALTER TABLE editoras ALTER COLUMN titular_id SET NOT NULL;';
  END IF;
  RAISE NOTICE '======================================================';
  RAISE NOTICE '';
END $$;


-- ============================================================
-- 7. CONFIRMAÇÃO FINAL
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Migration 035 — CONCLUÍDA COM SUCESSO';
  RAISE NOTICE '-------------------------------------------------';
  RAISE NOTICE 'editoras            : titular_id UUID nullable adicionado.';
  RAISE NOTICE 'obras_participantes : data_inicio + data_fim adicionados.';
  RAISE NOTICE 'titulares           : trigger auto-geração codigo_interno ativo.';
  RAISE NOTICE '-------------------------------------------------';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Vincular manualmente: Top Show, EDI, LR, P3, Lamu → titular_id.';
  RAISE NOTICE '2. Após vínculo total: ALTER editoras.titular_id SET NOT NULL.';
  RAISE NOTICE '3. UI /master/obras: exibir codigo_obra com label "ID Interno da Obra".';
  RAISE NOTICE '4. API de obras: corrigir auto-geração de codigo_obra antes de obras reais.';
  RAISE NOTICE '5. Não cadastrar obras reais até fechar a refatoração de entidades.';
  RAISE NOTICE '=================================================';
END $$;

COMMIT;
