-- Migration 039 — Tipos de Direito Jurídicos — Base Jurídica Contratual
-- ═══════════════════════════════════════════════════════════════════════════════
-- REGRA MÁXIMA: O contrato manda. O sistema se adapta ao contrato.
-- NOMENCLATURA:
--   codigo        = identificador técnico curto (ex: comunicacao_publico)
--   nome_curto    = label de interface (ex: Comunicação ao Público)
--   nome_juridico = verdade oficial — texto exato do contrato
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
  'TRUE = código operacional antigo (pré-039). Será desativado após Migration 041 validada.';

-- ─── 2. Inserir os 8 direitos jurídicos canônicos ────────────────────────────
-- Estrutura real da tabela (migration 016):
--   id, tenant_id, codigo, nome, descricao, ativo, ordem
-- + as 3 colunas adicionadas acima: nome_juridico, nome_curto, codigo_legado

INSERT INTO tipos_direito
  (tenant_id, codigo, nome, nome_juridico, nome_curto, descricao, ordem, ativo, codigo_legado)
SELECT NULL, v.codigo, v.nome_curto, v.nome_juridico, v.nome_curto, v.descricao, v.ordem, TRUE, FALSE
FROM (VALUES
  (
    'repr_grafica',
    'Reprodução Gráfica',
    'DIREITOS DE REPRODUÇÃO GRÁFICA (EDIÇÃO)',
    'Edição, impressão e distribuição de partituras, letras e obras gráficas musicais',
    1
  ),
  (
    'repr_fonomecanica',
    'Reprodução Fonomecânica',
    'DIREITOS DE REPRODUÇÃO FONOMECÂNICOS (VENDA E LOCAÇÃO DE GRAVAÇÕES SONORAS)',
    'Venda e locação de gravações sonoras em suportes físicos (CD, vinil, cassete etc.)',
    2
  ),
  (
    'inclusao_audiovisual',
    'Inclusão Audiovisual',
    'DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES AUDIOVISUAIS',
    'Uso em filmes, séries, documentários, jogos e demais produções audiovisuais',
    3
  ),
  (
    'inclusao_publicitaria',
    'Inclusão Publicitária',
    'DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES PUBLICITÁRIAS, GRÁFICAS, SONORAS OU AUDIOVISUAIS',
    'Uso em campanhas publicitárias, peças gráficas, sons e audiovisual publicitário',
    4
  ),
  (
    'distribuicao_meios',
    'Distribuição por Meios',
    'DIREITOS DE DISTRIBUIÇÃO MEDIANTE MEIOS ÓTICOS, CABO, SATÉLITES, REDES DE INFORMAÇÃO E DE COMPUTADORES, QUE PERMITAM AO USUÁRIO A SELEÇÃO DA OBRA OU QUE IMPORTE EM PAGAMENTO PELO USUÁRIO',
    'Distribuição via meios óticos, cabo, satélites, internet e redes onde o usuário seleciona ou paga pela obra',
    5
  ),
  (
    'inclusao_base_dados',
    'Inclusão em Base de Dados',
    'DIREITOS DE INCLUSÃO EM BASE DE DADOS OU QUALQUER FORMA DE ARMAZENAMENTO',
    'Uso em bancos de dados, sistemas de armazenamento, IA e qualquer forma de armazenamento',
    6
  ),
  (
    'comunicacao_publico',
    'Comunicação ao Público',
    'DIREITOS DE COMUNICAÇÃO AO PÚBLICO',
    'Execução pública em rádio, TV, shows, estabelecimentos comerciais e qualquer comunicação ao público',
    7
  ),
  (
    'autorizacoes_onus',
    'Autorizações com Ônus',
    'AUTORIZAÇÕES COM ÔNUS',
    'Autorizações especiais e demais modalidades de exploração com ônus financeiro ao autorizante',
    8
  )
) AS v(codigo, nome_curto, nome_juridico, descricao, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM tipos_direito WHERE tenant_id IS NULL AND codigo = v.codigo
);

-- ─── 3. Marcar os códigos operacionais antigos como legado ───────────────────
-- NÃO desativar aqui. ativo permanece TRUE.
-- Desativação ocorre em 041 após: JSONBs migrados + validação aprovada.

UPDATE tipos_direito
SET    codigo_legado = TRUE
WHERE  tenant_id IS NULL
  AND  codigo IN (
    'execucao_publica',
    'exec_publica',
    'fonodigital',
    'digital',
    'fonofisico',
    'mecanico',
    'sync',
    'sincronizacao',
    'licenciamento_direto',
    'licenciamento',
    'audiovisual',
    'publicidade',
    'base_dados',
    'dir_editoriais',
    'dir_futuros',
    'outros',
    'internacional'
  );

-- ─── 4. Atualizar nome_curto onde ainda NULL ──────────────────────────────────
UPDATE tipos_direito SET nome_curto = nome
WHERE tenant_id IS NULL AND codigo_legado = FALSE AND nome_curto IS NULL;

-- ─── 5. COMMENT ON TABLE ──────────────────────────────────────────────────────
COMMENT ON TABLE tipos_direito IS
  'Catálogo mestre de direitos autorais do Sync Mood. '
  'FONTE OFICIAL: contratos de cessão, administração, coedição e subedição. '
  'REGRA MÁXIMA: nome_juridico é o texto exato do contrato. Nunca simplificar. '
  '8 CANÔNICOS (codigo_legado=FALSE): repr_grafica, repr_fonomecanica, '
  'inclusao_audiovisual, inclusao_publicitaria, distribuicao_meios, '
  'inclusao_base_dados, comunicacao_publico, autorizacoes_onus. '
  'LEGADO (codigo_legado=TRUE): ativos temporariamente até Migration 041 validada.';

-- ─── 6. Índice único para novos códigos globais ──────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_tipos_direito_codigo_global_ativo
  ON tipos_direito (codigo)
  WHERE ativo = TRUE AND tenant_id IS NULL AND codigo_legado = FALSE;
