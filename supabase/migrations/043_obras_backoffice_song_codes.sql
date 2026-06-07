-- =============================================================================
-- MIGRATION 043 — BackOffice / Financeiro
-- Cria: obras_backoffice, recebimentos_itens, matching_rules
-- Altera: match_lista_oni (status_oni + campos)
-- Cria: v_catalogo_backoffice
-- Regra: BackOffice = Informacao | Financeiro = Dinheiro
-- BO_SONGCODE → OBRA_ID → ID_INTERNO é a chave de identificacao digital
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. obras_backoffice
--    Vinculo historico entre obras e identificadores externos (BackOffice/DSPs)
--    REGRA: nunca UPDATE — desativar antigo (ativo=FALSE, substituido_por=novo)
--           e criar novo registro. Historico completo preservado para auditoria.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS obras_backoffice (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES tenants(id),
  obra_id             UUID NOT NULL REFERENCES obras(id),
  bo_songcode         TEXT,
  sources_songcode    TEXT,
  publishers_songcode TEXT,
  canal               TEXT,          -- 'backoffice' | 'spotify' | 'youtube' | etc.
  -- Ajuste 2: historico imutavel — substituido_por aponta para o registro novo
  substituido_por     UUID REFERENCES obras_backoffice(id),
  data_vinculo        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario_vinculo     UUID,
  observacao          TEXT,
  ativo               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookup: bo_songcode → obra (unico por tenant, somente ativo)
CREATE UNIQUE INDEX IF NOT EXISTS uq_bo_songcode_per_tenant
  ON obras_backoffice(tenant_id, bo_songcode)
  WHERE bo_songcode IS NOT NULL AND ativo = TRUE;

CREATE INDEX IF NOT EXISTS idx_obras_bo_obra_id     ON obras_backoffice(obra_id);
CREATE INDEX IF NOT EXISTS idx_obras_bo_songcode    ON obras_backoffice(bo_songcode) WHERE bo_songcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obras_bo_substituido ON obras_backoffice(substituido_por) WHERE substituido_por IS NOT NULL;

COMMENT ON TABLE obras_backoffice IS
  'Vinculos entre obras e identificadores externos (BackOffice/UBEM/DSPs). '
  'REGRA: nunca UPDATE — ao alterar um song code, desativar o registro antigo '
  '(ativo=FALSE, substituido_por=novo_id) e criar novo registro. '
  'O historico completo de vinculos e preservado para auditoria. '
  'BO_SONGCODE → OBRA_ID → ID_INTERNO e a chave primaria de identificacao digital.';

-- -----------------------------------------------------------------------------
-- 2. recebimentos_itens
--    Linhas financeiras de um recebimento — rastreabilidade ate o arquivo original
--    importacao_id: qual arquivo gerou esta linha
--    raw_payload: linha exata do arquivo (nunca perder)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recebimentos_itens (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID REFERENCES tenants(id),
  recebimento_id       UUID NOT NULL REFERENCES recebimentos(id),
  -- Ajuste 1: rastreabilidade — arquivo de origem
  importacao_id        UUID REFERENCES importacoes(id),

  -- Identificacao da obra (pos-matching)
  origem_receita_id    UUID REFERENCES origens_receita(id),
  tipo_direito_id      UUID REFERENCES tipos_direito(id),
  obra_id              UUID REFERENCES obras(id),
  bo_songcode          TEXT,

  -- Dados financeiros
  valor_bruto          NUMERIC(15,2),
  valor_liquido        NUMERIC(15,2),
  moeda                TEXT NOT NULL DEFAULT 'BRL',
  quantidade_execucoes INTEGER,
  territorio           TEXT,
  periodo_origem       TEXT,

  -- Status juridico (Motor de Autorizacao)
  status_juridico      TEXT NOT NULL DEFAULT 'pendente_identificacao'
    CHECK (status_juridico IN (
      'pendente_identificacao',
      'pendente_validacao',
      'pendente_revisao_juridica',
      'autorizado',
      'bloqueado'
    )),

  -- Campos originais do arquivo (auditoria — nunca perder a informacao original)
  statement_line_id    TEXT,
  source_name          TEXT,
  source_type          TEXT,
  statement_period     TEXT,
  royalty_type         TEXT,
  usage_type           TEXT,
  raw_payload          JSONB,   -- linha exata do arquivo importado

  observacoes          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ri_recebimento  ON recebimentos_itens(recebimento_id);
CREATE INDEX IF NOT EXISTS idx_ri_importacao   ON recebimentos_itens(importacao_id) WHERE importacao_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ri_obra         ON recebimentos_itens(obra_id) WHERE obra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ri_status       ON recebimentos_itens(status_juridico);
CREATE INDEX IF NOT EXISTS idx_ri_bo_songcode  ON recebimentos_itens(bo_songcode) WHERE bo_songcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ri_raw          ON recebimentos_itens USING gin(raw_payload) WHERE raw_payload IS NOT NULL;

COMMENT ON TABLE recebimentos_itens IS
  'Linhas financeiras de um recebimento. Cadeia de rastreabilidade: '
  'importacao_id → importacoes (qual arquivo), '
  'recebimento_id → recebimentos (qual recebimento), '
  'raw_payload → linha original (o que veio no arquivo). '
  'Nenhum dado original deve ser descartado.';

-- -----------------------------------------------------------------------------
-- 3. matching_rules — camada de aprendizado permanente
--    Quando operador vincula uma obra em Analise de Lancamentos, o sistema
--    cria automaticamente uma regra aqui.
--    Proxima linha com mesmo valor de tipo_regra → auto-match sem intervencao.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matching_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id),
  obra_id       UUID NOT NULL REFERENCES obras(id),
  tipo_regra    TEXT NOT NULL CHECK (tipo_regra IN (
    'bo_songcode',
    'sources_songcode',
    'publishers_songcode',
    'isrc',
    'iswc',
    'id_interno',
    'titulo_autor'
  )),
  valor_regra   TEXT NOT NULL,
  confianca     SMALLINT NOT NULL DEFAULT 100 CHECK (confianca BETWEEN 1 AND 100),
  origem        TEXT NOT NULL DEFAULT 'operador'
    CHECK (origem IN ('automatico', 'operador', 'importacao')),
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  usuario_id    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_matching_rule
  ON matching_rules(tenant_id, tipo_regra, valor_regra)
  WHERE ativo = TRUE;

CREATE INDEX IF NOT EXISTS idx_mr_obra  ON matching_rules(obra_id);
CREATE INDEX IF NOT EXISTS idx_mr_tipo  ON matching_rules(tipo_regra);

COMMENT ON TABLE matching_rules IS
  'Camada de aprendizado permanente do modulo Analise de Lancamentos. '
  'Quando o operador vincula uma obra manualmente, o sistema cria uma regra aqui. '
  'Proxima linha com o mesmo valor de tipo_regra → auto-match, sem intervencao. '
  'Suporta 7 tipos de identificador: bo_songcode, sources_songcode, '
  'publishers_songcode, isrc, iswc, id_interno, titulo_autor.';

-- -----------------------------------------------------------------------------
-- 4. match_lista_oni — fila de acoes com 6 estados (Ajuste 4)
-- -----------------------------------------------------------------------------
ALTER TABLE match_lista_oni
  ADD COLUMN IF NOT EXISTS status_oni TEXT NOT NULL DEFAULT 'importada'
    CHECK (status_oni IN (
      'importada',
      'possivel_match',
      'em_analise',
      'confirmada',
      'enviada_backoffice',
      'aceita_backoffice'
    )),
  ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS data_envio_bo  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_aceite_bo TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_oni_status ON match_lista_oni(status_oni);

COMMENT ON COLUMN match_lista_oni.status_oni IS
  'Fila de acoes da ONI: importada → possivel_match → em_analise → '
  'confirmada → enviada_backoffice → aceita_backoffice';

-- -----------------------------------------------------------------------------
-- 5. v_catalogo_backoffice — semaforo + cobertura juridica (Ajuste 3)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_catalogo_backoffice AS
SELECT
  o.id                                                                     AS obra_id,
  o.titulo,
  o.id_interno,
  -- Indicadores operacionais
  EXISTS(
    SELECT 1 FROM obras_backoffice ob
    WHERE ob.obra_id = o.id AND ob.ativo = TRUE
  )                                                                        AS tem_songcode,
  EXISTS(
    SELECT 1 FROM gravacoes g
    WHERE g.obra_id = o.id
  )                                                                        AS tem_isrc,
  EXISTS(
    SELECT 1 FROM recebimentos_itens ri
    WHERE ri.obra_id = o.id AND ri.status_juridico = 'autorizado'
  )                                                                        AS recebe_royalties,
  EXISTS(
    SELECT 1 FROM match_lista_oni mlo
    WHERE mlo.obra_id = o.id
      AND mlo.status_oni NOT IN ('confirmada','aceita_backoffice')
  )                                                                        AS possui_oni,
  EXISTS(
    SELECT 1 FROM recebimentos_itens ri
    WHERE ri.obra_id = o.id
      AND ri.status_juridico IN ('pendente_identificacao','pendente_validacao','bloqueado')
  )                                                                        AS possui_pendencia,
  -- Ajuste 3: cobertura juridica
  (
    SELECT ne.id FROM negocios_editoriais ne
    JOIN obras_participacoes op ON op.editora_id = ne.editora_administrada_id
    WHERE op.obra_id = o.id AND ne.status = 'ativo' LIMIT 1
  )                                                                        AS negocio_editorial_id,
  (
    SELECT jsonb_array_length(COALESCE(ne.direitos_brasil, '[]'::jsonb))
    FROM negocios_editoriais ne
    JOIN obras_participacoes op ON op.editora_id = ne.editora_administrada_id
    WHERE op.obra_id = o.id AND ne.status = 'ativo' LIMIT 1
  )                                                                        AS qt_direitos_brasil,
  (
    SELECT jsonb_array_length(COALESCE(ne.direitos_exterior, '[]'::jsonb))
    FROM negocios_editoriais ne
    JOIN obras_participacoes op ON op.editora_id = ne.editora_administrada_id
    WHERE op.obra_id = o.id AND ne.status = 'ativo' LIMIT 1
  )                                                                        AS qt_direitos_exterior,
  -- Semaforo: completo / atencao / pendente
  CASE
    WHEN EXISTS(
           SELECT 1 FROM recebimentos_itens ri
           WHERE ri.obra_id = o.id
             AND ri.status_juridico IN ('pendente_identificacao','bloqueado')
         )
         OR NOT EXISTS(
           SELECT 1 FROM negocios_editoriais ne
           JOIN obras_participacoes op ON op.editora_id = ne.editora_administrada_id
           WHERE op.obra_id = o.id AND ne.status = 'ativo'
         )
      THEN 'pendente'
    WHEN NOT EXISTS(
           SELECT 1 FROM obras_backoffice ob
           WHERE ob.obra_id = o.id AND ob.ativo = TRUE
         )
         OR NOT EXISTS(
           SELECT 1 FROM gravacoes g WHERE g.obra_id = o.id
         )
      THEN 'atencao'
    ELSE 'completo'
  END                                                                      AS status_catalogo
FROM obras o;

COMMENT ON VIEW v_catalogo_backoffice IS
  'Visao operacional do catalogo BackOffice. '
  'status_catalogo: completo (verde) | atencao (amarelo) | pendente (vermelho). '
  'Inclui cobertura juridica: negocio_editorial_id, qt_direitos_brasil, qt_direitos_exterior.';
