-- Migration 039 — Tipos de Direito Jurídicos — Base Jurídica Contratual
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- REGRA MÁXIMA DO SYNC MOOD:
--   O contrato manda. O sistema se adapta ao contrato, não o contrário.
--
-- Esta migration:
--   1. Adiciona colunas nome_juridico, nome_curto, codigo_legado em tipos_direito
--   2. Insere os 8 direitos jurídicos canônicos com nome_juridico = texto exato do contrato
--   3. Marca os 11 códigos operacionais antigos como codigo_legado = TRUE
--      (ativo permanece TRUE — só será desativado após Migration 041 validada)
--
-- NOMENCLATURA:
--   codigo        = identificador técnico curto (ex: comunicacao_publico)
--   nome_curto    = label de interface (ex: Comunicação ao Público)
--   nome_juridico = verdade oficial — texto exato do contrato
--
-- REGRA GLOBAL PARA LICENÇAS (Ajuste 3 aprovado):
--   Toda estrutura de licenciamento, sincronização, autorização, cobrança ou
--   distribuição deve possuir obrigatoriamente tipo_direito_id.
--   Nenhum módulo futuro pode nascer sem tipo_direito_id identificado.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Adicionar colunas à tabela tipos_direito ─────────────────────────────

ALTER TABLE tipos_direito
  ADD COLUMN IF NOT EXISTS nome_juridico TEXT,
  ADD COLUMN IF NOT EXISTS nome_curto    TEXT,
  ADD COLUMN IF NOT EXISTS codigo_legado BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN tipos_direito.nome_juridico IS
  'Texto exato do contrato. Fonte oficial de verdade do sistema. Nunca simplificar ou reescrever.';
COMMENT ON COLUMN tipos_direito.nome_curto IS
  'Nome amigável para interface. Exibição apenas — o vínculo jurídico é sempre com nome_juridico.';
COMMENT ON COLUMN tipos_direito.codigo_legado IS
  'TRUE = código operacional antigo (11 direitos pré-039). Será desativado após Migration 041 validada.';

-- ─── 2. Inserir os 8 direitos jurídicos canônicos ────────────────────────────
-- Baseados exatamente nos contratos de cessão, administração, coedição e subedição.

INSERT INTO tipos_direito
  (tenant_id, codigo, nome, nome_juridico, nome_curto, descricao, entra_distribuicao, tipo_cwr, ordem, ativo, codigo_legado)
SELECT NULL, v.codigo, v.nome_curto, v.nome_juridico, v.nome_curto, v.descricao, TRUE, v.tipo_cwr, v.ordem, TRUE, FALSE
FROM (VALUES
  (
    'repr_grafica',
    'Reprodução Gráfica',
    'DIREITOS DE REPRODUÇÃO GRÁFICA (EDIÇÃO)',
    'Edição, impressão e distribuição de partituras, letras e obras gráficas musicais',
    'nenhum',
    1
  ),
  (
    'repr_fonomecanica',
    'Reprodução Fonomecânica',
    'DIREITOS DE REPRODUÇÃO FONOMECÂNICOS (VENDA E LOCAÇÃO DE GRAVAÇÕES SONORAS)',
    'Venda e locação de gravações sonoras em suportes físicos (CD, vinil, cassete etc.)',
    'MR',
    2
  ),
  (
    'inclusao_audiovisual',
    'Inclusão Audiovisual',
    'DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES AUDIOVISUAIS',
    'Uso em filmes, séries, documentários, jogos e demais produções audiovisuais',
    'ambos',
    3
  ),
  (
    'inclusao_publicitaria',
    'Inclusão Publicitária',
    'DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES PUBLICITÁRIAS, GRÁFICAS, SONORAS OU AUDIOVISUAIS',
    'Uso em campanhas publicitárias, peças gráficas, sons e audiovisual publicitário',
    'ambos',
    4
  ),
  (
    'distribuicao_meios',
    'Distribuição por Meios',
    'DIREITOS DE DISTRIBUIÇÃO MEDIANTE MEIOS ÓTICOS, CABO, SATÉLITES, REDES DE INFORMAÇÃO E DE COMPUTADORES, QUE PERMITAM AO USUÁRIO A SELEÇÃO DA OBRA OU QUE IMPORTE EM PAGAMENTO PELO USUÁRIO',
    'Distribuição via meios óticos, cabo, satélites, internet e redes de computadores onde o usuário seleciona ou paga pela obra',
    'MR',
    5
  ),
  (
    'inclusao_base_dados',
    'Inclusão em Base de Dados',
    'DIREITOS DE INCLUSÃO EM BASE DE DADOS OU QUALQUER FORMA DE ARMAZENAMENTO',
    'Uso em bancos de dados, sistemas de armazenamento, IA e qualquer forma de armazenamento',
    'nenhum',
    6
  ),
  (
    'comunicacao_publico',
    'Comunicação ao Público',
    'DIREITOS DE COMUNICAÇÃO AO PÚBLICO',
    'Execução pública em rádio, TV, shows, estabelecimentos comerciais e qualquer comunicação ao público',
    'PR',
    7
  ),
  (
    'autorizacoes_onus',
    'Autorizações com Ônus',
    'AUTORIZAÇÕES COM ÔNUS',
    'Autorizações especiais e demais modalidades de exploração com ônus financeiro ao autorizante',
    'ambos',
    8
  )
) AS v(codigo, nome_curto, nome_juridico, descricao, tipo_cwr, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM tipos_direito WHERE tenant_id IS NULL AND codigo = v.codigo
);

-- ─── 3. Marcar os 11 códigos operacionais antigos como legado ────────────────
-- NÃO desativar aqui. ativo permanece TRUE.
-- A desativação ocorre em 041 após: JSONBs migrados + validação aprovada.

UPDATE tipos_direito
SET    codigo_legado = TRUE
WHERE  tenant_id IS NULL
  AND  codigo IN (
    'execucao_publica',
    'fonodigital',
    'fonofisico',
    'sync',
    'licenciamento_direto',
    'audiovisual',
    'publicidade',
    'base_dados',
    'dir_editoriais',
    'dir_futuros',
    'outros'
  );

-- ─── 4. Atualizar nome_curto nos 8 novos (redundante mas explícito) ───────────
UPDATE tipos_direito SET nome_curto = nome
WHERE tenant_id IS NULL AND codigo_legado = FALSE AND nome_curto IS NULL;

-- ─── 5. COMMENT ON TABLE — Regras Arquiteturais Máximas ──────────────────────
COMMENT ON TABLE tipos_direito IS
  'Catálogo mestre de direitos autorais do Sync Mood. '
  'FONTE OFICIAL DE VERDADE: os contratos de cessão, administração, coedição e subedição. '
  'REGRA MÁXIMA: nome_juridico é o texto exato do contrato. Nunca simplificar ou reescrever. '
  'REGRA GLOBAL DE LICENÇAS: todo módulo de licença, sync, autorização, cobrança ou distribuição '
  'deve possuir tipo_direito_id. Nenhum módulo nasce sem direito jurídico identificado. '
  '8 DIREITOS CANÔNICOS (codigo_legado=FALSE): '
  '  repr_grafica, repr_fonomecanica, inclusao_audiovisual, inclusao_publicitaria, '
  '  distribuicao_meios, inclusao_base_dados, comunicacao_publico, autorizacoes_onus. '
  '11 CÓDIGOS LEGADO (codigo_legado=TRUE): ativos temporariamente até Migration 041 validada.';

-- ─── 6. Índice único para novos códigos globais ──────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_tipos_direito_codigo_global_ativo
  ON tipos_direito (codigo)
  WHERE ativo = TRUE AND tenant_id IS NULL AND codigo_legado = FALSE;
