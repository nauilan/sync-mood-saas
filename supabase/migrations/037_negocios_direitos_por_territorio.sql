-- Migration 037 — Direitos Administrados por Território nos Negócios Editoriais
-- Adiciona direitos_brasil, direitos_exterior, percentuais_brasil, percentuais_exterior
-- e atualiza o catálogo mestre de tipos_direito com os 11 direitos oficiais.
--
-- REGRA ARQUITETURAL:
--   "Direitos Internacionais" não é um tipo de direito — é um território.
--   O catálogo oficial possui exatamente 11 direitos.
--   A separação Brasil/Exterior permite contratos com coberturas diferentes por território.

-- ─── 1. Novos campos em negocios_editoriais ───────────────────────────────────
ALTER TABLE negocios_editoriais
  ADD COLUMN IF NOT EXISTS direitos_brasil   JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS direitos_exterior JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS percentuais_brasil   JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS percentuais_exterior JSONB DEFAULT NULL;

COMMENT ON COLUMN negocios_editoriais.direitos_brasil IS
  'Códigos dos direitos administrados no Brasil. Ex: ["execucao_publica","fonodigital"]';
COMMENT ON COLUMN negocios_editoriais.direitos_exterior IS
  'Códigos dos direitos administrados no Exterior. Ex: ["fonodigital","sync"]';
COMMENT ON COLUMN negocios_editoriais.percentuais_brasil IS
  'Percentuais por direito para Brasil. Ex: {"execucao_publica":{"administrada":60,"administradora":40}}';
COMMENT ON COLUMN negocios_editoriais.percentuais_exterior IS
  'Percentuais por direito para Exterior. Substitui percentual padrão por tipo de direito.';

-- ─── 2. Índices GIN ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_neg_direitos_brasil
  ON negocios_editoriais USING GIN (direitos_brasil);

CREATE INDEX IF NOT EXISTS idx_neg_direitos_exterior
  ON negocios_editoriais USING GIN (direitos_exterior);

-- ─── 3. Catálogo oficial de 11 direitos globais em tipos_direito ─────────────
-- Usa WHERE NOT EXISTS porque UNIQUE(tenant_id, codigo) não detecta conflito
-- quando tenant_id IS NULL (padrão SQL: NULL != NULL).

INSERT INTO tipos_direito (tenant_id, codigo, nome, descricao, entra_distribuicao, tipo_cwr, ordem, ativo)
SELECT NULL, v.codigo, v.nome, v.descricao, TRUE, v.tipo_cwr, v.ordem, TRUE
FROM (VALUES
  ('execucao_publica',     'Execução Pública',                         'Direito de execução pública em rádio, TV, shows e estabelecimentos comerciais', 'PR',    1),
  ('fonodigital',          'Fonomecânico Digital (DSP)',                'Streaming, download digital, plataformas DSP (Spotify, Apple Music etc.)',       'MR',    2),
  ('fonofisico',           'Fonomecânico Físico',                       'CD, vinil, cassete e demais suportes físicos',                                   'MR',    3),
  ('sync',                 'Sincronização',                             'Uso em filmes, séries, publicidade, jogos e outros conteúdos audiovisuais',       'ambos', 4),
  ('licenciamento_direto', 'Licenciamento Direto',                      'Licenciamentos negociados diretamente pelo editor sem intermediação de sociedade','ambos', 5),
  ('audiovisual',          'Audiovisual',                               'Direitos relacionados a obras audiovisuais (além de sync)',                       'ambos', 6),
  ('publicidade',          'Publicidade',                               'Uso em campanhas publicitárias',                                                 'ambos', 7),
  ('base_dados',           'Base de Dados',                             'Uso em bancos de dados, inteligência artificial e sistemas de informação',        'nenhum',8),
  ('dir_editoriais',       'Direitos Editoriais (Letras e Partituras)', 'Edição, impressão e distribuição de letras e partituras',                        'nenhum',9),
  ('dir_futuros',          'Direitos Futuros / Novas Modalidades',      'Novas formas de exploração ainda não regulamentadas',                            'ambos', 10),
  ('outros',               'Outros',                                    'Demais direitos não classificados nas categorias anteriores',                    'ambos', 11)
) AS v(codigo, nome, descricao, tipo_cwr, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM tipos_direito WHERE tenant_id IS NULL AND codigo = v.codigo
);

-- ─── 4. Desativar 'internacional' se existir (não é direito, é território) ───
UPDATE tipos_direito
SET ativo = FALSE
WHERE tenant_id IS NULL AND codigo = 'internacional';
