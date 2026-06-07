-- ============================================================
-- 036_negocios_percentuais_por_receita.sql
--
-- Adiciona suporte a percentuais diferenciados por tipo de receita
-- em negocios_editoriais.
--
-- Regra de negócio:
--   - Se percentuais_por_receita for NULL:
--       usa os campos percentual_administrada / percentual_administradora
--       como percentual padrão (comportamento atual, não quebrado).
--   - Se estiver preenchido:
--       os valores por receita sobrepõem o percentual padrão para cada
--       tipo especificado.
--
-- Estrutura esperada do JSON:
-- {
--   "streaming":         { "administradora": 20, "administrada": 80 },
--   "mecanico":          { "administradora": 25, "administrada": 75 },
--   "execucao_publica":  { "administradora":  0, "administrada": 100 },
--   "sync":              { "administradora": 30, "administrada": 70 },
--   "internacional":     { "administradora": 50, "administrada": 50 },
--   "outros":            { "administradora": 20, "administrada": 80 }
-- }
--
-- Cada chave presente DEVE ter administradora + administrada = 100.
-- A validação de soma por chave é feita na camada de aplicação/UI.
-- A constraint chk_percentuais_somam_100 permanece intacta.
-- ============================================================

ALTER TABLE negocios_editoriais
  ADD COLUMN IF NOT EXISTS percentuais_por_receita JSONB DEFAULT NULL;

COMMENT ON COLUMN negocios_editoriais.percentuais_por_receita IS
  'Percentuais contratuais por tipo de receita. '
  'NULL = usar percentual_administrada / percentual_administradora (padrão da linha). '
  'Quando preenchido, sobrepõe o percentual padrão para cada tipo especificado. '
  'Tipos suportados: streaming, mecanico, execucao_publica, sync, internacional, outros. '
  'Cada entrada deve ter administradora + administrada = 100. '
  'Validação de soma realizada na camada de aplicação.';

-- Índice parcial — consultado pelo Analítico ao verificar se há percentuais específicos
CREATE INDEX IF NOT EXISTS idx_negocios_ppr
  ON negocios_editoriais(id)
  WHERE percentuais_por_receita IS NOT NULL;
