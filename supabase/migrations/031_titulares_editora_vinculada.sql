-- ============================================================
-- 031_titulares_editora_vinculada.sql
-- Vínculo opcional entre titular (tipo='editora') e cadastro
-- oficial na tabela editoras.
--
-- Motivo:
--   Uma editora pode ser tanto um "titular de direitos" (registrada
--   em titulares) quanto uma "empresa editorial" (registrada em
--   editoras). Quando ambos existem para a mesma entidade real,
--   o sistema precisa saber que são a mesma entidade para:
--     - consistência de dados CWR/CAE/IPI entre as duas tabelas;
--     - evitar duplicidade no matching de importação CWR;
--     - exibir o vínculo correto em obras, contratos e negócios.
--
-- Regras:
--   - Vínculo é OPCIONAL — um titular pode existir sem editora vinculada.
--   - Não transforma todo usuário/editora em titular automaticamente.
--   - ON DELETE SET NULL: se a editora for excluída, o titular
--     permanece mas o vínculo é removido.
-- ============================================================

ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS editora_vinculada_id UUID
    REFERENCES editoras(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_titulares_editora_vinculada
  ON titulares(editora_vinculada_id);

COMMENT ON COLUMN titulares.editora_vinculada_id IS
  'Quando o titular for uma editora (tipo=editora), vincula ao registro '
  'oficial em editoras. Evita duplicidade de cadastro e mantém consistência '
  'dos identificadores CWR/CAE/IPI entre as duas entidades. '
  'Vínculo opcional — ON DELETE SET NULL.';
