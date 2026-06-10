-- Migration 051: Status editorial por participante de obra
-- Executar no Supabase SQL Editor

-- ── 1. Campos em obras_participantes ───────────────────────────────────────
ALTER TABLE obras_participantes
  ADD COLUMN IF NOT EXISTS status_editorial TEXT DEFAULT 'nao_controlado'
    CHECK (status_editorial IN (
      'controlado', 'nao_controlado', 'pendente_contrato',
      'controlado_por_outra_editora', 'em_validacao'
    )),
  ADD COLUMN IF NOT EXISTS editora_controladora_id UUID REFERENCES editoras(id),
  ADD COLUMN IF NOT EXISTS contrato_controle_id    UUID REFERENCES contratos(id),
  ADD COLUMN IF NOT EXISTS data_controle           TIMESTAMPTZ;

-- ── 2. Índices ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_op_status_editorial
  ON obras_participantes (status_editorial);
CREATE INDEX IF NOT EXISTS idx_op_editora_controladora
  ON obras_participantes (editora_controladora_id)
  WHERE editora_controladora_id IS NOT NULL;

-- ── Validação ───────────────────────────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'obras_participantes'
  AND column_name IN ('status_editorial','editora_controladora_id','contrato_controle_id')
ORDER BY column_name;
