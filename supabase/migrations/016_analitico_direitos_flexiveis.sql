-- ============================================================
-- 016_analitico_direitos_flexiveis.sql
--
-- Fundação financeira do Sync Mood:
--   - Tabelas de domínio: tipos_direito, tipos_participante
--   - Direitos flexíveis por titular/link (substitui colunas fixas gradualmente)
--   - Analítico persistido com versionamento, cadeia e rastreabilidade
--   - Campos tipo_direito_id, territorio, competencia_inicio/fim em
--     recebimentos, cc_obras_movimentos, distribuicao_itens
--   - Ajuste em negocios_editoriais: grupo_obras + tipo_direito_id
--
-- COMPATIBILIDADE:
--   As colunas percentual_exec_publica, percentual_fonomecanico e
--   percentual_sincronizacao em obras_links_titulares NÃO são removidas.
--   A nova tabela obras_links_titulares_direitos funciona em paralelo
--   até migração completa.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- PARTE 1A — TIPOS_DIREITO
-- Tabela de referência para tipos de direito.
-- tenant_id NULL = tipo global disponível para todos os tenants.
-- Novos tipos: INSERT, sem necessidade de migration futura.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_direito (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID    REFERENCES tenants(id) ON DELETE CASCADE,
  codigo      TEXT    NOT NULL,
  nome        TEXT    NOT NULL,
  descricao   TEXT,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  ordem       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, codigo)
);

-- Tipos globais (tenant_id NULL = disponível para todos)
INSERT INTO tipos_direito (id, tenant_id, codigo, nome, descricao, ordem) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'exec_publica',  'Execução Pública',
    'Direito de comunicação ao público — ECAD/SOCINPRO. NÃO entra no CC Obra.', 1),
  ('00000000-0000-0000-0000-000000000002', NULL, 'digital',       'Fono Digital (DSP)',
    'Streaming e download em plataformas digitais (Spotify, Apple Music, YouTube, etc.)', 2),
  ('00000000-0000-0000-0000-000000000003', NULL, 'sincronizacao', 'Sincronização',
    'Uso de obra em produções audiovisuais, comerciais e publicidade.', 3),
  ('00000000-0000-0000-0000-000000000004', NULL, 'mecanico',      'Mecânico',
    'Reprodução física e digital de fonogramas (CD, vinil, ringtone).', 4),
  ('00000000-0000-0000-0000-000000000005', NULL, 'audiovisual',   'Audiovisual',
    'Licenciamento para filmes, séries, documentários.', 5),
  ('00000000-0000-0000-0000-000000000006', NULL, 'publicidade',   'Publicidade',
    'Uso em peças publicitárias (TV, rádio, digital).', 6),
  ('00000000-0000-0000-0000-000000000007', NULL, 'internacional', 'Internacional',
    'Receitas oriundas de exploração fora do Brasil.', 7),
  ('00000000-0000-0000-0000-000000000008', NULL, 'licenciamento', 'Licenciamento',
    'Licenciamentos pontuais não cobertos por outras categorias.', 8),
  ('00000000-0000-0000-0000-000000000009', NULL, 'base_dados',    'Base de Dados',
    'Uso em bases de dados, catálogos e plataformas editoriais.', 9),
  ('00000000-0000-0000-0000-000000000010', NULL, 'outros',        'Outros',
    'Demais receitas não classificadas nas categorias acima.', 10)
ON CONFLICT (tenant_id, codigo) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tipos_direito_tenant ON tipos_direito(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tipos_direito_codigo ON tipos_direito(codigo);
CREATE INDEX IF NOT EXISTS idx_tipos_direito_ativo  ON tipos_direito(ativo);


-- ────────────────────────────────────────────────────────────
-- PARTE 1B — TIPOS_PARTICIPANTE
-- Tabela de domínio que substitui o CHECK fixo em obras_analitico.
-- Novos tipos de participante: INSERT, sem migration futura.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_participante (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      TEXT    NOT NULL UNIQUE,
  nome        TEXT    NOT NULL,
  descricao   TEXT,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  ordem       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tipos_participante (codigo, nome, descricao, ordem) VALUES
  ('autor',                  'Autor',
    'Criador original da obra — CA no CWR.', 1),
  ('editora_administrada',   'Editora Administrada',
    'Editora Original (E) que possui contrato direto com o autor.', 2),
  ('editora_administradora', 'Editora Administradora',
    'Editora que administra o catálogo da Editora Administrada — AM no CWR.', 3),
  ('coeditora',              'Coeditora',
    'Editora com participação editorial própria no mesmo link.', 4),
  ('subeditora',             'Subeditora Internacional',
    'Editora que representa a obra em território estrangeiro.', 5),
  ('cessionario_pj',         'Cessionário PJ',
    'Pessoa jurídica que recebeu cessão de direitos do autor.', 6),
  ('cessionario_pf',         'Cessionário PF',
    'Pessoa física que recebeu cessão de direitos do autor.', 7),
  ('licenciante',            'Licenciante',
    'Detentor de licença temporária sobre a obra ou parte dela.', 8),
  ('herdeiro',               'Herdeiro',
    'Herdeiro legal do autor ou titular.', 9),
  ('outro',                  'Outro',
    'Participante não enquadrado nas categorias acima.', 10)
ON CONFLICT (codigo) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tipos_participante_codigo ON tipos_participante(codigo);


-- ────────────────────────────────────────────────────────────
-- PARTE 2 — OBRAS_LINKS_TITULARES_DIREITOS
-- Substitui gradualmente as colunas fixas:
--   percentual_exec_publica, percentual_fonomecanico, percentual_sincronizacao
-- As colunas fixas PERMANECEM em obras_links_titulares para compatibilidade.
-- Uma linha por titular/link × tipo de direito.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS obras_links_titulares_direitos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_link_titular_id  UUID NOT NULL REFERENCES obras_links_titulares(id) ON DELETE CASCADE,
  obra_id               UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  tipo_direito_id       UUID NOT NULL REFERENCES tipos_direito(id),
  percentual            NUMERIC(7,4) NOT NULL DEFAULT 0
                          CHECK (percentual >= 0 AND percentual <= 100),
  controlado            BOOLEAN NOT NULL DEFAULT FALSE,
  fonte                 TEXT NOT NULL DEFAULT 'manual'
                          CHECK (fonte IN ('cwr','contrato','manual','calculado')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (obra_link_titular_id, tipo_direito_id)
);

CREATE TRIGGER trg_olt_direitos_updated_at
  BEFORE UPDATE ON obras_links_titulares_direitos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_olt_direitos_link  ON obras_links_titulares_direitos(obra_link_titular_id);
CREATE INDEX IF NOT EXISTS idx_olt_direitos_obra  ON obras_links_titulares_direitos(obra_id);
CREATE INDEX IF NOT EXISTS idx_olt_direitos_tipo  ON obras_links_titulares_direitos(tipo_direito_id);

ALTER TABLE obras_links_titulares_direitos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_olt_direitos" ON obras_links_titulares_direitos
  USING (tenant_id = (
    SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1
  ));


-- ────────────────────────────────────────────────────────────
-- PARTE 3 — OBRAS_ANALITICO
-- Resultado persistido da função bridge.
-- Uma linha por obra × link × participante × tipo_direito × territorio.
--
-- CAMPOS PRINCIPAIS:
--   percentual_sobre_obra   → usado pelo CC Obra para calcular valor a pagar
--   percentual_sobre_origem → auditoria de cadeia (ex: 40% da parte da Lojas Mil)
--   origem_participante_id  → FK auto-referencial: participante pai na cadeia
--   obra_link_origem_id     → link do autor/editora que originou esta derivação
--   nivel_distribuicao      → 0=raiz, 1=derivado direto, 2=derivado de derivado
--   versao_calculo          → incrementa a cada reprocessamento
--   invalidado_em           → NULL=vigente; preenchida=versão histórica
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS obras_analitico (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  obra_id                 UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,

  -- Link da obra ao qual este participante pertence
  obra_link_id            UUID REFERENCES obras_links(id) ON DELETE SET NULL,

  -- Link de origem: de qual autor/link surgiu esta participação derivada
  -- Ex: linha da Top Show aponta para o link do Roberto (origem da cessão editorial)
  obra_link_origem_id     UUID REFERENCES obras_links(id) ON DELETE SET NULL,

  -- Participante final
  titular_id              UUID REFERENCES titulares(id) ON DELETE SET NULL,
  editora_id              UUID REFERENCES editoras(id) ON DELETE SET NULL,
  nome_participante       TEXT NOT NULL,

  -- Tipo do participante: código textual (ex: 'autor', 'editora_administrada')
  -- Corresponde a tipos_participante.codigo — sem FK para performance de insert em lote.
  -- Validação semântica feita pela bridge; integridade via tipos_participante.codigo UNIQUE.
  tipo_participante_codigo TEXT NOT NULL DEFAULT 'outro',

  -- Percentuais
  -- percentual_sobre_obra: o que move o dinheiro no CC Obra
  -- Ex: Roberto = 37.5%, Lojas Mil = 15%, Top Show = 10%
  percentual_sobre_obra   NUMERIC(7,4) NOT NULL DEFAULT 0
                            CHECK (percentual_sobre_obra >= 0 AND percentual_sobre_obra <= 100),

  -- percentual_sobre_origem: para auditoria
  -- Ex: Top Show tem 40% sobre a parte da Lojas Mil (25% da obra)
  -- percentual_sobre_obra = 10%, percentual_sobre_origem = 40%
  percentual_sobre_origem NUMERIC(7,4),

  -- Cadeia de distribuição
  origem_participante_id  UUID REFERENCES obras_analitico(id) ON DELETE SET NULL,
  nivel_distribuicao      INTEGER NOT NULL DEFAULT 0,
  -- 0 = raiz (autor ou editora administrada sem administradora)
  -- 1 = derivado direto (administradora, cessionário do autor)
  -- 2 = derivado de derivado (subeditora, herdeiro de cessionário)

  -- Direito, território e competência
  tipo_direito_id         UUID REFERENCES tipos_direito(id),
  territorio              TEXT NOT NULL DEFAULT 'BR',
  competencia_inicio      DATE,
  competencia_fim         DATE,

  -- Contratos e negócios que originaram este cálculo
  contrato_id             UUID REFERENCES contratos(id) ON DELETE SET NULL,
  negocio_editorial_id    UUID REFERENCES negocios_editoriais(id) ON DELETE SET NULL,

  -- Status e pendências
  status_calculo          TEXT NOT NULL DEFAULT 'calculado'
    CHECK (status_calculo IN ('calculado','pendente','erro','reprocessar')),
  pendencia               TEXT,
  -- Preenchida quando status != 'calculado'
  -- Ex: "Negócio editorial não localizado para Digital / BR / 2025-11"
  --     "Contrato editorial vencido em 31/12/2024"

  -- Versionamento e histórico
  versao_calculo          INTEGER NOT NULL DEFAULT 1,
  invalidado_em           TIMESTAMPTZ,
  -- NULL = linha vigente (use na CC Obra, distribuição, BI)
  -- Preenchida = versão histórica, mantida para auditoria
  calculado_em            TIMESTAMPTZ DEFAULT NOW(),
  calculado_por           TEXT DEFAULT 'bridge_v1',

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_obras_analitico_updated_at
  BEFORE UPDATE ON obras_analitico
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índices de acesso frequente
CREATE INDEX IF NOT EXISTS idx_analitico_obra          ON obras_analitico(obra_id);
CREATE INDEX IF NOT EXISTS idx_analitico_link          ON obras_analitico(obra_link_id);
CREATE INDEX IF NOT EXISTS idx_analitico_link_origem   ON obras_analitico(obra_link_origem_id);
CREATE INDEX IF NOT EXISTS idx_analitico_titular       ON obras_analitico(titular_id);
CREATE INDEX IF NOT EXISTS idx_analitico_editora       ON obras_analitico(editora_id);
CREATE INDEX IF NOT EXISTS idx_analitico_tipo          ON obras_analitico(tipo_participante_codigo);
CREATE INDEX IF NOT EXISTS idx_analitico_direito       ON obras_analitico(tipo_direito_id);
CREATE INDEX IF NOT EXISTS idx_analitico_territorio    ON obras_analitico(territorio);
CREATE INDEX IF NOT EXISTS idx_analitico_status        ON obras_analitico(status_calculo);
CREATE INDEX IF NOT EXISTS idx_analitico_origem        ON obras_analitico(origem_participante_id);
CREATE INDEX IF NOT EXISTS idx_analitico_competencia   ON obras_analitico(competencia_inicio, competencia_fim);

-- Índice parcial: cobre a query mais frequente (analítico VIGENTE por obra/direito/território)
CREATE INDEX IF NOT EXISTS idx_analitico_vigente
  ON obras_analitico(obra_id, tipo_direito_id, territorio)
  WHERE invalidado_em IS NULL;

ALTER TABLE obras_analitico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_analitico" ON obras_analitico
  USING (tenant_id = (
    SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1
  ));


-- ────────────────────────────────────────────────────────────
-- PARTE 4 — RECEBIMENTOS: campos necessários para a bridge
-- Sem tipo_direito_id + territorio + competencia a bridge não
-- consegue localizar qual regra editorial aplicar.
-- fonte_pagadora_* em TEXT por ora; migra para FK quando
-- o cadastro de fontes pagadoras for criado.
-- ────────────────────────────────────────────────────────────
ALTER TABLE recebimentos
  ADD COLUMN IF NOT EXISTS tipo_direito_id       UUID REFERENCES tipos_direito(id),
  ADD COLUMN IF NOT EXISTS territorio            TEXT DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS competencia_inicio    DATE,
  ADD COLUMN IF NOT EXISTS competencia_fim       DATE,
  ADD COLUMN IF NOT EXISTS fonte_pagadora_codigo TEXT,
  -- código padronizado: 'spotify', 'youtube', 'ubem', 'backoffice_music', etc.
  ADD COLUMN IF NOT EXISTS fonte_pagadora_nome   TEXT,
  -- nome display para BI: 'Spotify', 'YouTube Music', 'UBEM', etc.
  ADD COLUMN IF NOT EXISTS fonte_pagadora_tipo   TEXT;
  -- categoria: 'dsp', 'sociedade', 'licenciante', 'sincronia', 'outro'

CREATE INDEX IF NOT EXISTS idx_recebimentos_direito     ON recebimentos(tipo_direito_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_territorio  ON recebimentos(territorio);
CREATE INDEX IF NOT EXISTS idx_recebimentos_competencia ON recebimentos(competencia_inicio, competencia_fim);
CREATE INDEX IF NOT EXISTS idx_recebimentos_fpagadora   ON recebimentos(fonte_pagadora_codigo);


-- ────────────────────────────────────────────────────────────
-- PARTE 5 — CC_OBRAS_MOVIMENTOS
-- Cada movimentação fica vinculada ao tipo de direito,
-- território e competência que a originou.
-- ────────────────────────────────────────────────────────────
ALTER TABLE cc_obras_movimentos
  ADD COLUMN IF NOT EXISTS tipo_direito_id    UUID REFERENCES tipos_direito(id),
  ADD COLUMN IF NOT EXISTS territorio         TEXT DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS competencia_inicio DATE,
  ADD COLUMN IF NOT EXISTS competencia_fim    DATE;

CREATE INDEX IF NOT EXISTS idx_cc_obr_mov_direito      ON cc_obras_movimentos(tipo_direito_id);
CREATE INDEX IF NOT EXISTS idx_cc_obr_mov_territorio   ON cc_obras_movimentos(territorio);
CREATE INDEX IF NOT EXISTS idx_cc_obr_mov_competencia  ON cc_obras_movimentos(competencia_inicio, competencia_fim);


-- ────────────────────────────────────────────────────────────
-- PARTE 6 — DISTRIBUICAO_ITENS
-- Rastreabilidade completa: cada item da distribuição indica
-- qual direito, território e competência gerou o valor.
-- ────────────────────────────────────────────────────────────
ALTER TABLE distribuicao_itens
  ADD COLUMN IF NOT EXISTS tipo_direito_id    UUID REFERENCES tipos_direito(id),
  ADD COLUMN IF NOT EXISTS territorio         TEXT DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS competencia_inicio DATE,
  ADD COLUMN IF NOT EXISTS competencia_fim    DATE;

CREATE INDEX IF NOT EXISTS idx_dist_itens_direito     ON distribuicao_itens(tipo_direito_id);
CREATE INDEX IF NOT EXISTS idx_dist_itens_territorio  ON distribuicao_itens(territorio);
CREATE INDEX IF NOT EXISTS idx_dist_itens_competencia ON distribuicao_itens(competencia_inicio, competencia_fim);


-- ────────────────────────────────────────────────────────────
-- PARTE 7 — NEGOCIOS_EDITORIAIS
-- Adiciona 'grupo_obras' na abrangência (estava faltando).
-- Adiciona tipo_direito_id para permitir percentuais diferentes
-- por tipo de direito no mesmo negócio.
-- Ex: Digital BR = 60/40, Sync = 70/30 → duas linhas, mesmo par de editoras.
-- ────────────────────────────────────────────────────────────

-- Recriar constraint com o novo valor 'grupo_obras'
ALTER TABLE negocios_editoriais
  DROP CONSTRAINT IF EXISTS negocios_editoriais_abrangencia_tipo_check;

ALTER TABLE negocios_editoriais
  ADD CONSTRAINT negocios_editoriais_abrangencia_tipo_check
    CHECK (abrangencia_tipo IN (
      'catalogo_inteiro',
      'obras_especificas',
      'autor_especifico',
      'grupo_autores',
      'grupo_obras'
    ));

-- Tipo de direito específico (NULL = vale para todos os tipos)
ALTER TABLE negocios_editoriais
  ADD COLUMN IF NOT EXISTS tipo_direito_id UUID REFERENCES tipos_direito(id);

CREATE INDEX IF NOT EXISTS idx_negocios_direito ON negocios_editoriais(tipo_direito_id);
