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
--    - Editoras administradas (EDI Music, LR, P3, Lamu) NÃO possuem
--      Sender Code individual, salvo se futuramente enviarem CWR próprio.
--    - O Sender Code NÃO fica no cadastro comum de editoras.
--      Fica exclusivamente na tabela configuracoes_cwr, vinculada à Org. Gestora.
--
-- 2. MODELO DO REGISTRO HDR (cabeçalho do arquivo CWR)
--
--    HDR | Sender Type | Sender ID | Sender Name | Sender Code | ...
--
--    - Sender Type  = 'PB'                        (Publisher)
--    - Sender ID    = ipi_remetente da Top Show   (IPI Name Number, 9 dígitos)
--                     ⚠️  NÃO é um campo separado — é derivado de ipi_remetente
--    - Sender Name  = sender_name (nome da Top Show Music)
--    - Sender Code  = sender_code (código CISAC atribuído à Top Show)
--
--    Regra: sender_id no HDR = ipi_remetente.
--    Não armazenar sender_id como campo separado — evita redundância e inconsistência.
--
-- 3. REGISTROS DAS OBRAS (NWR, PWR, SWR, etc.)
--    - Publisher original = editora real da obra (Top Show, EDI, LR, P3 ou Lamu)
--    - Administrator      = Top Show Music (quando houver negócio editorial de administração)
--    - Percentuais        = conforme negócios editoriais cadastrados no sistema
--    - O Sender (Top Show) não substitui o publisher real da obra nos registros internos
--
-- 4. IDENTIFICADORES ESTRATÉGICOS (não alterar livremente após vínculos)
--    Campos que exigem perfil master + log de auditoria para alteração:
--    editoras:  codigo_interno, codigo_interno_cwr, codigo_publisher_cwr, codigo_cae, codigo_ipi
--    titulares: codigo_titular, codigo_interno_cwr, codigo_cae, codigo_ipi
--    Log a registrar: tabela, campo, valor_anterior, novo_valor, usuario_id, alterado_em, motivo
--
-- ============================================================
-- SQL DA TABELA configuracoes_cwr (não executar agora)
-- ============================================================

/*
CREATE TABLE configuracoes_cwr (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Referência à Organização Gestora (editora master do tenant)
  -- Somente a Org. Gestora envia CWR — editoras administradas não possuem esta config
  editora_master_id     UUID NOT NULL REFERENCES editoras(id) ON DELETE RESTRICT,

  -- ── CAMPOS DO REGISTRO HDR ───────────────────────────────
  -- sender_code: código CISAC atribuído à Org. Gestora
  sender_code           TEXT NOT NULL,
  -- sender_name: nome do remetente conforme aparece no HDR
  sender_name           TEXT NOT NULL,
  -- sender_type: PB = Publisher | SO = Society
  sender_type           TEXT NOT NULL DEFAULT 'PB'
                        CHECK (sender_type IN ('PB', 'SO')),

  -- ── IPI E CAE DO REMETENTE ───────────────────────────────
  -- ipi_remetente: IPI Name Number da Org. Gestora
  --   → usado como Sender ID no campo HDR (9 dígitos, zero-padded na geração)
  --   → também usado nos registros PWR quando a Top Show é publisher/administrator
  ipi_remetente         TEXT,
  -- cae_remetente: CAE da Org. Gestora (compatibilidade com CWR legado / ECAD)
  cae_remetente         TEXT,

  -- ── VERSÃO CWR ───────────────────────────────────────────
  -- versao_cwr: versão do padrão a ser gerado
  --   ECAD atualmente aceita 2.1
  versao_cwr            TEXT NOT NULL DEFAULT '2.1'
                        CHECK (versao_cwr IN ('2.0', '2.1', '2.2', '3.0')),

  -- ── CONTROLE ─────────────────────────────────────────────
  ativo                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Um tenant só deve ter uma configuração CWR ativa por vez
  UNIQUE(tenant_id)
);

-- ── COMMENTS ─────────────────────────────────────────────────

COMMENT ON TABLE configuracoes_cwr IS
  'Configurações do módulo CWR por tenant. '
  'Vinculada exclusivamente à Organização Gestora (editora master). '
  'Editoras administradas não possuem esta configuração, '
  'salvo se futuramente enviarem CWR de forma independente.';

COMMENT ON COLUMN configuracoes_cwr.sender_code IS
  'Sender Code CISAC da Organização Gestora. '
  'Identifica quem está enviando o arquivo CWR. '
  'Não compartilhado com EDI Music, LR, P3 ou Lamu.';

COMMENT ON COLUMN configuracoes_cwr.ipi_remetente IS
  'IPI Name Number da Organização Gestora. '
  'Usado como Sender ID no registro HDR do arquivo CWR (derivado — não armazenar sender_id separado). '
  'Também identifica a Org. Gestora nos registros PWR como publisher/administrator.';

COMMENT ON COLUMN configuracoes_cwr.cae_remetente IS
  'CAE da Organização Gestora. '
  'Compatibilidade com versões legadas do CWR e exigências do ECAD.';

COMMENT ON COLUMN configuracoes_cwr.versao_cwr IS
  'Versão do padrão CWR a ser gerado: 2.0, 2.1, 2.2 ou 3.0. '
  'ECAD atualmente exige 2.1.';

COMMENT ON COLUMN configuracoes_cwr.sender_type IS
  'PB = Publisher (padrão para editoras). '
  'SO = Society (para quando o remetente for uma sociedade autoral).';

-- ── TRIGGER E ÍNDICE ─────────────────────────────────────────

CREATE TRIGGER trg_configuracoes_cwr_updated_at
  BEFORE UPDATE ON configuracoes_cwr
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_configuracoes_cwr_tenant        ON configuracoes_cwr(tenant_id);
CREATE INDEX idx_configuracoes_cwr_editora_master ON configuracoes_cwr(editora_master_id);
*/

-- ============================================================
-- SQL DA TABELA auditoria_codigos_estrategicos (não executar agora)
-- Registra histórico imutável de alterações nos identificadores estratégicos.
-- ============================================================

/*
CREATE TABLE auditoria_codigos_estrategicos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL,
  tabela         TEXT NOT NULL,        -- 'editoras' | 'titulares'
  registro_id    UUID NOT NULL,        -- id do registro alterado
  campo          TEXT NOT NULL,        -- ex: 'codigo_interno_cwr', 'codigo_cae'
  valor_anterior TEXT,
  novo_valor     TEXT,
  usuario_id     UUID,
  alterado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motivo         TEXT                  -- justificativa obrigatória para alteração
);

COMMENT ON TABLE auditoria_codigos_estrategicos IS
  'Histórico imutável de alterações nos identificadores estratégicos. '
  'Campos cobertos — editoras: codigo_interno, codigo_interno_cwr, '
  'codigo_publisher_cwr, codigo_cae, codigo_ipi. '
  'Titulares: codigo_titular, codigo_interno_cwr, codigo_cae, codigo_ipi. '
  'Somente perfil master pode alterar esses campos após vínculos existirem. '
  'INSERT permitido. UPDATE e DELETE bloqueados por RLS policy.';

CREATE INDEX idx_audit_codigos_registro ON auditoria_codigos_estrategicos(registro_id);
CREATE INDEX idx_audit_codigos_tabela   ON auditoria_codigos_estrategicos(tabela, tenant_id);
*/
