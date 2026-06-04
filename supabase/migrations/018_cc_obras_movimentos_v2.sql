-- ════════════════════════════════════════════════════════════════════════════
--  018_cc_obras_movimentos_v2.sql
--
--  Adiciona as colunas necessárias para o motor financeiro CC Obra v2.
--
--  A tabela cc_obras_movimentos (criada na 008) foi desenhada como ledger
--  contábil (saldo_anterior / saldo_posterior). A lógica v2 opera no nível
--  de participante, então precisamos:
--
--  1. Adicionar colunas de participante e rastreabilidade financeira.
--  2. Tornar cc_obra_id e tipo nullable (o v2 não usa ledger — usa distribuição
--     direta por analítico).
--  3. Tornar saldo_anterior e saldo_posterior nullable (não calculados no v2).
--
--  COMPATIBILIDADE: registros antigos (v1) continuam com os campos originais
--  preenchidos. Registros novos (v2) preenchem os novos campos.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Relaxar constraints NOT NULL das colunas legadas ──────────────────────
ALTER TABLE cc_obras_movimentos
  ALTER COLUMN cc_obra_id      DROP NOT NULL,
  ALTER COLUMN tipo            DROP NOT NULL,
  ALTER COLUMN valor           DROP NOT NULL,
  ALTER COLUMN saldo_anterior  DROP NOT NULL,
  ALTER COLUMN saldo_posterior DROP NOT NULL;

-- ── 2. Adicionar colunas do motor v2 ─────────────────────────────────────────
ALTER TABLE cc_obras_movimentos
  ADD COLUMN IF NOT EXISTS nome_participante         TEXT,
  ADD COLUMN IF NOT EXISTS tipo_participante_codigo  TEXT,
  ADD COLUMN IF NOT EXISTS titular_id                UUID REFERENCES titulares(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS editora_id                UUID REFERENCES editoras(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS percentual_sobre_obra     NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS valor_bruto_participante  NUMERIC(18,6),
  ADD COLUMN IF NOT EXISTS valor_liquido_participante NUMERIC(18,6),
  ADD COLUMN IF NOT EXISTS status_movimento          TEXT DEFAULT 'distribuido',
  ADD COLUMN IF NOT EXISTS pendencia                 TEXT,
  ADD COLUMN IF NOT EXISTS analitico_linha_id        UUID REFERENCES obras_analitico(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fonte_pagadora_codigo     TEXT,
  ADD COLUMN IF NOT EXISTS fonte_pagadora_tipo       TEXT,
  ADD COLUMN IF NOT EXISTS versao_calculo            INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS calculado_por             TEXT DEFAULT 'cc_obra_v2',
  ADD COLUMN IF NOT EXISTS updated_at               TIMESTAMPTZ DEFAULT NOW();

-- ── 3. Índices para consultas do motor v2 ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cc_obr_mov_titular    ON cc_obras_movimentos(titular_id);
CREATE INDEX IF NOT EXISTS idx_cc_obr_mov_editora    ON cc_obras_movimentos(editora_id);
CREATE INDEX IF NOT EXISTS idx_cc_obr_mov_status     ON cc_obras_movimentos(status_movimento);
CREATE INDEX IF NOT EXISTS idx_cc_obr_mov_analitico  ON cc_obras_movimentos(analitico_linha_id);
CREATE INDEX IF NOT EXISTS idx_cc_obr_mov_fonte      ON cc_obras_movimentos(fonte_pagadora_codigo);
CREATE INDEX IF NOT EXISTS idx_cc_obr_mov_versao     ON cc_obras_movimentos(versao_calculo);

-- ── 4. Verificação final ─────────────────────────────────────────────────────
-- Cole no SQL Editor após executar para confirmar:
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'cc_obras_movimentos'
--   AND column_name IN (
--     'nome_participante','tipo_participante_codigo',
--     'percentual_sobre_obra','valor_bruto_participante',
--     'valor_liquido_participante','status_movimento',
--     'pendencia','analitico_linha_id',
--     'fonte_pagadora_codigo','versao_calculo'
--   )
-- ORDER BY column_name;
-- Esperado: 10 linhas
