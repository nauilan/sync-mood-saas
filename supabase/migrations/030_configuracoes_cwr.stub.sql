-- ============================================================
-- 030_configuracoes_cwr.stub.sql
-- ⚠️  ROADMAP — NÃO APLICAR AINDA
-- ⚠️  Este arquivo documenta a estrutura futura do módulo CWR.
-- ⚠️  Somente aplicar quando o módulo CWR for iniciado.
-- ============================================================
--
-- REGRAS ESTRUTURAIS REGISTRADAS EM 2026-06-06
--
-- 1. SENDER CODE CISAC
--    - Somente a Organização Gestora (Top Show Music) possui Sender Code.
--    - Editoras administradas NÃO possuem Sender Code individual.
--    - O Sender Code fica NESTA tabela, vinculado à editora master do tenant.
--    - EDI Music, LR Edições, P3 e Lamu aparecem nos registros das obras
--      como publishers/titulares, mas NUNCA como remetentes do arquivo CWR.
--
-- 2. MODELO CWR
--    Cabeçalho do arquivo (HDR):
--      - sender_code  = Top Show Music
--      - sender_name  = Top Show Music
--      - sender_id    = CAE/IPI da Top Show
--    Registros das obras (NWR, PWR, SWR, etc.):
--      - publisher original = editora da obra (EDI, LR, P3, Lamu ou Top Show)
--      - administrator      = Top Show Music (quando houver negócio editorial)
--      - percentuais        = conforme negócios editoriais cadastrados
--
-- 3. IDENTIFICADORES ESTRATÉGICOS (não alterar livremente após vínculos)
--    Campos que exigem perfil master + log de auditoria para alteração:
--    editoras: codigo_interno, codigo_interno_cwr, codigo_publisher_cwr, codigo_cae, codigo_ipi
--    titulares: codigo_titular, codigo_interno_cwr, codigo_cae, codigo_ipi
--    Log a registrar: campo, valor_anterior, novo_valor, usuario_id, alterado_em, motivo
--
-- ============================================================
-- SQL DA TABELA (não executar agora)
-- ============================================================

/*
CREATE TABLE configuracoes_cwr (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  editora_master_id     UUID NOT NULL REFERENCES editoras(id) ON DELETE RESTRICT,

  -- Identificação do remetente (Sender) no arquivo CWR
  sender_code           TEXT NOT NULL,          -- ex: TLS (código CISAC da Org. Gestora)
  sender_id             TEXT,                   -- ID numérico do sender, se exigido
  sender_name           TEXT NOT NULL,          -- nome completo do remetente
  sender_type           TEXT DEFAULT 'PB',      -- PB = Publisher, SO = Society
  society_code          TEXT,                   -- código da sociedade (ECAD = 055)

  -- CAE/IPI do remetente usados no cabeçalho CWR
  cae_remetente         TEXT,
  ipi_remetente         TEXT,

  -- Versão do padrão CWR a ser gerado
  versao_cwr            TEXT NOT NULL DEFAULT '2.1',  -- 2.0 | 2.1 | 2.2 | 3.0

  -- Controle
  ativo                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Um tenant só deve ter uma configuração ativa por vez
  UNIQUE(tenant_id)
);

COMMENT ON TABLE configuracoes_cwr IS
  'Configurações do módulo CWR por tenant. '
  'O sender_code pertence exclusivamente à Organização Gestora. '
  'Editoras administradas não possuem sender_code individual.';

COMMENT ON COLUMN configuracoes_cwr.sender_code IS
  'Sender Code CISAC da Organização Gestora. '
  'Usado no cabeçalho HDR do arquivo CWR. '
  'Não compartilhado com editoras administradas.';

COMMENT ON COLUMN configuracoes_cwr.versao_cwr IS
  'Versão do padrão CWR a ser gerado: 2.0, 2.1, 2.2 ou 3.0. '
  'ECAD atualmente aceita 2.1.';

CREATE TRIGGER trg_configuracoes_cwr_updated_at
  BEFORE UPDATE ON configuracoes_cwr
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_configuracoes_cwr_tenant ON configuracoes_cwr(tenant_id);
*/

-- ============================================================
-- ROADMAP: tabela de auditoria de alterações em identificadores estratégicos
-- ============================================================
/*
CREATE TABLE auditoria_codigos_estrategicos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,
  tabela        TEXT NOT NULL,       -- 'editoras' | 'titulares'
  registro_id   UUID NOT NULL,       -- id do registro alterado
  campo         TEXT NOT NULL,       -- ex: 'codigo_interno_cwr'
  valor_anterior TEXT,
  novo_valor    TEXT,
  usuario_id    UUID,
  alterado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motivo        TEXT
);

COMMENT ON TABLE auditoria_codigos_estrategicos IS
  'Histórico imutável de alterações nos identificadores estratégicos '
  '(codigo_interno, codigo_interno_cwr, codigo_publisher_cwr, codigo_cae, codigo_ipi). '
  'Somente perfil master pode alterar esses campos após vínculos existirem. '
  'INSERT permitido. UPDATE e DELETE bloqueados por policy.';
*/
