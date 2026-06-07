-- Migration 041 — Migração de Códigos Jurídicos + FKs em Tabelas Financeiras
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Esta migration:
--   A) Migra os JSONBs direitos_brasil/exterior e percentuais_brasil/exterior
--      de negocios_editoriais: substitui códigos operacionais antigos pelos 8 jurídicos
--   B) Adiciona origem_receita_id em tabelas financeiras (nullable)
--   C) Adiciona tipo_direito_id em contratos e autorizacoes (nullable)
--   D) Marca receitas_aplicaveis como DEPRECADO
--   E) Índices de apoio
--
-- PASSO FINAL (executar APÓS validacao_041.sql confirmar 0 linhas com códigos antigos):
--   UPDATE tipos_direito SET ativo = FALSE WHERE codigo_legado = TRUE;
--   (incluído ao final, COMENTADO — descomentar após aprovação da validação)
--
-- MAPEAMENTO DE CÓDIGOS:
--   execucao_publica     → comunicacao_publico
--   fonodigital          → distribuicao_meios        (provisório)
--   fonofisico           → repr_fonomecanica
--   sync                 → inclusao_audiovisual + inclusao_publicitaria  (expansão)
--   audiovisual          → inclusao_audiovisual
--   publicidade          → inclusao_publicitaria
--   licenciamento_direto → autorizacoes_onus          (fallback + pendência de revisão)
--   base_dados           → inclusao_base_dados
--   dir_editoriais       → repr_grafica
--   dir_futuros          → autorizacoes_onus
--   outros               → autorizacoes_onus
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── A. Migrar direitos_brasil e direitos_exterior ────────────────────────────
-- Substitui cada código legado pelo(s) código(s) jurídico(s) correspondente(s).
-- 'sync' é expandido para ambos (inclusao_audiovisual + inclusao_publicitaria).

UPDATE negocios_editoriais
SET direitos_brasil = (
  SELECT jsonb_agg(DISTINCT novo_codigo ORDER BY novo_codigo)
  FROM (
    SELECT
      CASE old_code
        WHEN 'execucao_publica'     THEN 'comunicacao_publico'
        WHEN 'fonodigital'          THEN 'distribuicao_meios'
        WHEN 'fonofisico'           THEN 'repr_fonomecanica'
        WHEN 'sync'                 THEN 'inclusao_audiovisual'
        WHEN 'audiovisual'          THEN 'inclusao_audiovisual'
        WHEN 'publicidade'          THEN 'inclusao_publicitaria'
        WHEN 'licenciamento_direto' THEN 'autorizacoes_onus'
        WHEN 'base_dados'           THEN 'inclusao_base_dados'
        WHEN 'dir_editoriais'       THEN 'repr_grafica'
        WHEN 'dir_futuros'          THEN 'autorizacoes_onus'
        WHEN 'outros'               THEN 'autorizacoes_onus'
        ELSE old_code  -- manter código novo se já migrado
      END AS novo_codigo
    FROM jsonb_array_elements_text(direitos_brasil) AS old_code
    UNION ALL
    -- expansão de 'sync' para inclusao_publicitaria também
    SELECT 'inclusao_publicitaria'
    FROM jsonb_array_elements_text(direitos_brasil) AS old_code
    WHERE old_code = 'sync'
  ) sub
  WHERE novo_codigo IS NOT NULL
)
WHERE direitos_brasil IS NOT NULL AND direitos_brasil != '[]'::jsonb;

UPDATE negocios_editoriais
SET direitos_exterior = (
  SELECT jsonb_agg(DISTINCT novo_codigo ORDER BY novo_codigo)
  FROM (
    SELECT
      CASE old_code
        WHEN 'execucao_publica'     THEN 'comunicacao_publico'
        WHEN 'fonodigital'          THEN 'distribuicao_meios'
        WHEN 'fonofisico'           THEN 'repr_fonomecanica'
        WHEN 'sync'                 THEN 'inclusao_audiovisual'
        WHEN 'audiovisual'          THEN 'inclusao_audiovisual'
        WHEN 'publicidade'          THEN 'inclusao_publicitaria'
        WHEN 'licenciamento_direto' THEN 'autorizacoes_onus'
        WHEN 'base_dados'           THEN 'inclusao_base_dados'
        WHEN 'dir_editoriais'       THEN 'repr_grafica'
        WHEN 'dir_futuros'          THEN 'autorizacoes_onus'
        WHEN 'outros'               THEN 'autorizacoes_onus'
        ELSE old_code
      END AS novo_codigo
    FROM jsonb_array_elements_text(direitos_exterior) AS old_code
    UNION ALL
    SELECT 'inclusao_publicitaria'
    FROM jsonb_array_elements_text(direitos_exterior) AS old_code
    WHERE old_code = 'sync'
  ) sub
  WHERE novo_codigo IS NOT NULL
)
WHERE direitos_exterior IS NOT NULL AND direitos_exterior != '[]'::jsonb;

-- ─── Migrar chaves dos objetos percentuais_brasil e percentuais_exterior ──────
-- Renomeia as chaves do JSONB objeto preservando os valores.

UPDATE negocios_editoriais
SET percentuais_brasil = (
  SELECT jsonb_object_agg(
    CASE chave
      WHEN 'execucao_publica'     THEN 'comunicacao_publico'
      WHEN 'fonodigital'          THEN 'distribuicao_meios'
      WHEN 'fonofisico'           THEN 'repr_fonomecanica'
      WHEN 'sync'                 THEN 'inclusao_audiovisual'
      WHEN 'audiovisual'          THEN 'inclusao_audiovisual'
      WHEN 'publicidade'          THEN 'inclusao_publicitaria'
      WHEN 'licenciamento_direto' THEN 'autorizacoes_onus'
      WHEN 'base_dados'           THEN 'inclusao_base_dados'
      WHEN 'dir_editoriais'       THEN 'repr_grafica'
      WHEN 'dir_futuros'          THEN 'autorizacoes_onus'
      WHEN 'outros'               THEN 'autorizacoes_onus'
      ELSE chave
    END,
    valor
  )
  FROM jsonb_each(percentuais_brasil) AS kv(chave, valor)
)
WHERE percentuais_brasil IS NOT NULL AND percentuais_brasil != 'null'::jsonb;

UPDATE negocios_editoriais
SET percentuais_exterior = (
  SELECT jsonb_object_agg(
    CASE chave
      WHEN 'execucao_publica'     THEN 'comunicacao_publico'
      WHEN 'fonodigital'          THEN 'distribuicao_meios'
      WHEN 'fonofisico'           THEN 'repr_fonomecanica'
      WHEN 'sync'                 THEN 'inclusao_audiovisual'
      WHEN 'audiovisual'          THEN 'inclusao_audiovisual'
      WHEN 'publicidade'          THEN 'inclusao_publicitaria'
      WHEN 'licenciamento_direto' THEN 'autorizacoes_onus'
      WHEN 'base_dados'           THEN 'inclusao_base_dados'
      WHEN 'dir_editoriais'       THEN 'repr_grafica'
      WHEN 'dir_futuros'          THEN 'autorizacoes_onus'
      WHEN 'outros'               THEN 'autorizacoes_onus'
      ELSE chave
    END,
    valor
  )
  FROM jsonb_each(percentuais_exterior) AS kv(chave, valor)
)
WHERE percentuais_exterior IS NOT NULL AND percentuais_exterior != 'null'::jsonb;

-- ─── B. Adicionar origem_receita_id nas tabelas financeiras ──────────────────
-- Todas nullable nesta migration. NOT NULL em migration futura após preenchimento histórico.

ALTER TABLE recebimentos
  ADD COLUMN IF NOT EXISTS origem_receita_id UUID REFERENCES origens_receita(id);

ALTER TABLE cc_obras_movimentos
  ADD COLUMN IF NOT EXISTS origem_receita_id UUID REFERENCES origens_receita(id);

ALTER TABLE distribuicao_itens
  ADD COLUMN IF NOT EXISTS origem_receita_id UUID REFERENCES origens_receita(id);

ALTER TABLE obras_analitico
  ADD COLUMN IF NOT EXISTS origem_receita_id UUID REFERENCES origens_receita(id);

-- ─── C. Adicionar tipo_direito_id em contratos e autorizacoes ─────────────────
-- Faltavam — agora recebem a FK para o direito jurídico.

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS tipo_direito_id UUID REFERENCES tipos_direito(id);

ALTER TABLE autorizacoes
  ADD COLUMN IF NOT EXISTS tipo_direito_id UUID REFERENCES tipos_direito(id);

-- ─── D. Marcar receitas_aplicaveis como DEPRECADO ─────────────────────────────
COMMENT ON COLUMN negocios_editoriais.receitas_aplicaveis IS
  'DEPRECADO — substituído por direitos_brasil + direitos_exterior (Migration 037/041). '
  'Mantido apenas para leitura legada. Não usar em novos módulos.';

-- ─── E. Índices ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_recebimentos_origem
  ON recebimentos (origem_receita_id);

CREATE INDEX IF NOT EXISTS idx_recebimentos_direito_juridico
  ON recebimentos (tipo_direito_id);

CREATE INDEX IF NOT EXISTS idx_ccom_origem
  ON cc_obras_movimentos (origem_receita_id);

CREATE INDEX IF NOT EXISTS idx_distribuicao_itens_origem
  ON distribuicao_itens (origem_receita_id);

CREATE INDEX IF NOT EXISTS idx_obras_analitico_origem
  ON obras_analitico (origem_receita_id);

-- ─── PASSO FINAL — Desativar 11 códigos legado ───────────────────────────────
-- EXECUTAR SOMENTE APÓS validacao_041.sql confirmar:
--   - 0 linhas em direitos_brasil contendo códigos antigos
--   - 0 linhas em direitos_exterior contendo códigos antigos
--   - 0 linhas em percentuais_brasil com chaves antigas
--   - 0 linhas em percentuais_exterior com chaves antigas
--
-- UPDATE tipos_direito
-- SET    ativo = FALSE
-- WHERE  codigo_legado = TRUE;
