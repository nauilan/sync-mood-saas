-- Migration 040 — Origens de Receita — Camada Operacional
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- ARQUITETURA EM DOIS NÍVEIS:
--   Nível 1 — Direito Jurídico  (tipos_direito)          → fonte oficial de verdade
--   Nível 2 — Origem de Receita (origens_receita)        → camada operacional
--
-- REGRA CENTRAL:
--   Plataformas, empresas e fontes pagadoras NÃO são direitos.
--   Toda origem de receita DEVE apontar para um tipo_direito_id.
--   DSPs ficam com mapeamento_provisorio = TRUE porque a classificação correta
--   (repr_fonomecanica vs distribuicao_meios) depende do contrato de cada editora.
--
-- REGRA OBRIGATÓRIA:
--   Toda movimentação financeira deve possuir:
--     - origem_receita_id  (de onde veio o dinheiro)
--     - tipo_direito_id    (qual direito jurídico representa)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Criar tabela origens_receita ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS origens_receita (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        REFERENCES tenants(id) ON DELETE CASCADE,
  codigo                TEXT        NOT NULL,
  nome                  TEXT        NOT NULL,
  descricao             TEXT,
  tipo_origem           TEXT        CHECK (tipo_origem IN (
                          'dsp',
                          'sociedade',
                          'emissora',
                          'produtora',
                          'processador',
                          'acordo_direto',
                          'licenciamento',
                          'outros'
                        )),
  tipo_direito_id       UUID        REFERENCES tipos_direito(id),
  mapeamento_provisorio BOOLEAN     NOT NULL DEFAULT FALSE,
  nota_juridica         TEXT,
  ativo                 BOOLEAN     NOT NULL DEFAULT TRUE,
  ordem                 INT                  DEFAULT 99,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE origens_receita IS
  'Camada operacional de origens de receita. '
  'Cada origem DEVE apontar para tipo_direito_id (direito jurídico canônico). '
  'mapeamento_provisorio=TRUE: classificação pendente de revisão jurídica por contrato. '
  'REGRA: origem da receita informa de onde veio o dinheiro. '
  'O tipo_direito_id informa o que o contrato autoriza.';

COMMENT ON COLUMN origens_receita.mapeamento_provisorio IS
  'TRUE = o vínculo com tipo_direito_id é provisório e deve ser revisado por contrato. '
  'Especialmente DSPs: pode ser repr_fonomecanica ou distribuicao_meios dependendo do contrato.';

COMMENT ON COLUMN origens_receita.nota_juridica IS
  'Observação jurídica sobre o vínculo desta origem com o direito contratual.';

-- ─── 2. Índices ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_origens_receita_tenant      ON origens_receita (tenant_id);
CREATE INDEX IF NOT EXISTS idx_origens_receita_direito     ON origens_receita (tipo_direito_id);
CREATE INDEX IF NOT EXISTS idx_origens_receita_provisorio  ON origens_receita (mapeamento_provisorio) WHERE mapeamento_provisorio = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_origens_receita_codigo_global
  ON origens_receita (codigo)
  WHERE tenant_id IS NULL AND ativo = TRUE;

-- ─── 3. Seed global — origens de receita ─────────────────────────────────────
-- Insere apenas se não existir (idempotente)

INSERT INTO origens_receita
  (tenant_id, codigo, nome, tipo_origem, tipo_direito_id, mapeamento_provisorio, nota_juridica, ordem)
SELECT
  NULL,
  v.codigo,
  v.nome,
  v.tipo_origem,
  (SELECT id FROM tipos_direito WHERE tenant_id IS NULL AND codigo = v.direito_codigo AND ativo = TRUE LIMIT 1),
  v.provisorio,
  v.nota,
  v.ordem
FROM (VALUES
  -- ── DSPs — mapeamento_provisorio=TRUE ───────────────────────────────────────
  ('spotify',             'Spotify',                         'dsp',           'distribuicao_meios', TRUE,
   'Aguarda revisão jurídica por contrato — pode ser repr_fonomecanica ou distribuicao_meios dependendo do contrato vigente', 1),
  ('deezer',              'Deezer',                          'dsp',           'distribuicao_meios', TRUE,
   'Aguarda revisão jurídica por contrato — pode ser repr_fonomecanica ou distribuicao_meios dependendo do contrato vigente', 2),
  ('apple_music',         'Apple Music',                     'dsp',           'distribuicao_meios', TRUE,
   'Aguarda revisão jurídica por contrato — pode ser repr_fonomecanica ou distribuicao_meios dependendo do contrato vigente', 3),
  ('youtube_music',       'YouTube Music',                   'dsp',           'distribuicao_meios', TRUE,
   'Aguarda revisão jurídica por contrato — pode ser repr_fonomecanica ou distribuicao_meios dependendo do contrato vigente', 4),
  ('youtube_cms',         'YouTube Content ID',              'dsp',           'distribuicao_meios', TRUE,
   'Aguarda revisão jurídica por contrato — pode ser repr_fonomecanica ou distribuicao_meios dependendo do contrato vigente', 5),
  ('tiktok',              'TikTok',                          'dsp',           'distribuicao_meios', TRUE,
   'Aguarda revisão jurídica por contrato — pode ser repr_fonomecanica ou distribuicao_meios dependendo do contrato vigente', 6),
  ('amazon_music',        'Amazon Music',                    'dsp',           'distribuicao_meios', TRUE,
   'Aguarda revisão jurídica por contrato — pode ser repr_fonomecanica ou distribuicao_meios dependendo do contrato vigente', 7),

  -- ── Sociedades arrecadadoras ─────────────────────────────────────────────────
  ('ecad',                'ECAD',                            'sociedade',     'comunicacao_publico', FALSE,  NULL, 10),
  ('socinpro',            'SOCINPRO',                        'sociedade',     'comunicacao_publico', FALSE,  NULL, 11),

  -- ── Processador / BackOffice ─────────────────────────────────────────────────
  ('ubem_backoffice',     'UBEM / BackOffice',               'processador',   NULL, TRUE,
   'Origem de processamento — o direito jurídico deve ser identificado conforme a natureza da receita processada', 15),

  -- ── Produtoras / Emissoras ───────────────────────────────────────────────────
  ('netflix',             'Netflix',                         'produtora',     'inclusao_audiovisual', FALSE, NULL, 20),
  ('globo',               'Rede Globo',                      'emissora',      'inclusao_audiovisual', FALSE, NULL, 21),
  ('prime_video',         'Prime Video',                     'produtora',     'inclusao_audiovisual', FALSE, NULL, 22),

  -- ── Licenciamento / Sync ─────────────────────────────────────────────────────
  ('sync_audiovisual',    'Sync — Audiovisual',              'licenciamento', 'inclusao_audiovisual',  FALSE, NULL, 30),
  ('sync_publicidade',    'Sync — Publicidade',              'licenciamento', 'inclusao_publicitaria',  FALSE, NULL, 31),
  ('sync_cinema',         'Sync — Cinema',                   'licenciamento', 'inclusao_audiovisual',  FALSE, NULL, 32),
  ('licenciamento_direto','Licenciamento Direto',            'licenciamento', NULL, TRUE,
   'Direito jurídico depende do tipo de licença emitida — identificar por contrato', 33),
  ('acordo_direto',       'Acordo Direto',                   'acordo_direto', NULL, TRUE,
   'Direito jurídico depende do conteúdo do acordo — identificar por contrato', 34),

  -- ── Suporte físico e edição gráfica ─────────────────────────────────────────
  ('cd_fisico',           'CD / Vinil / Suporte Físico',     'dsp',           'repr_fonomecanica',   FALSE, NULL, 40),
  ('partitura_edicao',    'Partitura / Edição Gráfica',      'licenciamento', 'repr_grafica',         FALSE, NULL, 41)

) AS v(codigo, nome, tipo_origem, direito_codigo, provisorio, nota, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM origens_receita WHERE tenant_id IS NULL AND codigo = v.codigo
);
