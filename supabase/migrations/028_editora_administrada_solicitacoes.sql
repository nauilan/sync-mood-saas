-- ============================================================
-- 028_editora_administrada_solicitacoes.sql
-- Fluxo completo da Editora Administrada:
--
-- REGRA CENTRAL:
--   Editora Administrada NUNCA cria/edita diretamente o catálogo oficial.
--   Tudo passa por solicitações → revisão → aprovação → conversão.
--   Dados são COPIADOS (não movidos) na conversão para oficial.
--   Histórico de solicitação é preservado integralmente.
--
-- ESTRUTURA:
--   ENUMs novos: status_sol_contrato, status_sol_obra, acao_workflow
--   solicitacoes_contratos          — cabeçalho do contrato em análise
--   solicitacoes_contratos_titulares — autores/coautores (N titulares por contrato)
--   solicitacoes_contratos_direitos  — direitos administrados (FK tipos_direito)
--   solicitacoes_contratos_territorios — territórios ISO
--   solicitacoes_assinaturas         — controle de assinatura por titular
--   solicitacoes_obras               — obra em análise
--   solicitacoes_obras_titulares     — autores/coautores da obra
--   solicitacoes_obras_direitos      — direitos da obra
--   solicitacoes_obras_territorios   — territórios da obra
--   workflow_aprovacoes              — decisões humanas com justificativa
--   solicitacoes_historico           — log imutável de mudanças de status
--   FK solicitacao_id em contratos e obras oficiais (rastreabilidade)
--
-- ROADMAP:
--   029_notificacoes_workflow.sql — notificações para usuários do fluxo
-- ============================================================

-- ── 1. ENUMs ────────────────────────────────────────────────

CREATE TYPE status_sol_contrato AS ENUM (
  'rascunho',              -- criado, ainda não enviado
  'aguardando_assinatura', -- enviado para assinatura dos titulares
  'assinado',              -- todas as assinaturas coletadas
  'pendente_validacao',    -- submetido para revisão da Org. Gestora
  'aprovado',              -- aprovado — habilita solicitação de obra
  'rejeitado',             -- rejeitado definitivamente
  'devolvido',             -- devolvido para correção (pode ser resubmetido)
  'convertido'             -- convertido em contrato oficial
);

CREATE TYPE status_sol_obra AS ENUM (
  'rascunho',          -- criada, ainda não enviada
  'pendente_validacao',-- submetida para revisão da Org. Gestora
  'aprovada',          -- aprovada para conversão em obra oficial
  'rejeitada',         -- rejeitada definitivamente
  'devolvida',         -- devolvida para correção
  'convertida'         -- convertida em obra oficial do catálogo
);

CREATE TYPE acao_workflow AS ENUM (
  'aprovado',
  'rejeitado',
  'devolvido',
  'solicitado_correcao',
  'comentario'
);

-- ── 2. solicitacoes_contratos ────────────────────────────────
CREATE TABLE IF NOT EXISTS solicitacoes_contratos (
  id                   UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID              NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
  editora_id           UUID              NOT NULL REFERENCES editoras(id)  ON DELETE RESTRICT,
  criado_por           UUID              NOT NULL REFERENCES usuarios(id)  ON DELETE RESTRICT,
  tipo_contrato        tipo_contrato     NOT NULL,
  titulo               TEXT              NOT NULL,
  observacoes          TEXT,
  status               status_sol_contrato NOT NULL DEFAULT 'rascunho',
  data_inicio          DATE,
  data_fim             DATE,
  -- documento: link externo ou upload futuro
  url_documento        TEXT,
  nome_documento       TEXT,
  -- rastreabilidade após conversão
  contrato_oficial_id  UUID              REFERENCES contratos(id)  ON DELETE SET NULL,
  editora_origem_id    UUID              REFERENCES editoras(id)   ON DELETE SET NULL,
  created_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  solicitacoes_contratos IS
  'Contratos em fluxo de aprovação criados por Editoras Administradas. '
  'Dados copiados para contratos oficiais após aprovação. Histórico preservado.';
COMMENT ON COLUMN solicitacoes_contratos.editora_id IS
  'Editora administrada que criou a solicitação.';
COMMENT ON COLUMN solicitacoes_contratos.contrato_oficial_id IS
  'Preenchido quando status=convertido — aponta para o contrato oficial gerado.';
COMMENT ON COLUMN solicitacoes_contratos.editora_origem_id IS
  'Rastreabilidade futura: editora de origem caso difira de editora_id.';

-- ── 3. solicitacoes_contratos_titulares ─────────────────────
-- Múltiplos autores/coautores por contrato.
-- percentual_autor + percentual_editora deve = 100,00 por linha.
CREATE TABLE IF NOT EXISTS solicitacoes_contratos_titulares (
  id                      UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id          UUID     NOT NULL REFERENCES solicitacoes_contratos(id) ON DELETE CASCADE,
  titular_id              UUID     NOT NULL REFERENCES titulares(id)              ON DELETE RESTRICT,
  papel                   TEXT     NOT NULL CHECK (papel IN (
                            'autor_principal', 'coautor', 'editora', 'cessionario'
                          )),
  percentual_participacao NUMERIC(6,2) NOT NULL
                            CHECK (percentual_participacao >= 0 AND percentual_participacao <= 100),
  percentual_autor        NUMERIC(6,2) NOT NULL
                            CHECK (percentual_autor   >= 0 AND percentual_autor   <= 100),
  percentual_editora      NUMERIC(6,2) NOT NULL
                            CHECK (percentual_editora >= 0 AND percentual_editora <= 100),
  ordem                   INTEGER  NOT NULL DEFAULT 0,
  CONSTRAINT split_soma_100 CHECK (ROUND(percentual_autor + percentual_editora, 2) = 100.00)
);

COMMENT ON COLUMN solicitacoes_contratos_titulares.percentual_participacao IS
  'Fatia deste titular na obra (ex: 50.00 = 50% da obra).';
COMMENT ON COLUMN solicitacoes_contratos_titulares.percentual_autor IS
  'Da parcela deste titular: % que vai para o autor. Soma com percentual_editora = 100.';
COMMENT ON COLUMN solicitacoes_contratos_titulares.percentual_editora IS
  'Da parcela deste titular: % que vai para a editora. Soma com percentual_autor = 100.';

-- ── 4. solicitacoes_contratos_direitos ──────────────────────
-- Direitos administrados via FK para tipos_direito (tenant_id nullable = global).
CREATE TABLE IF NOT EXISTS solicitacoes_contratos_direitos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id  UUID NOT NULL REFERENCES solicitacoes_contratos(id) ON DELETE CASCADE,
  tipo_direito_id UUID NOT NULL REFERENCES tipos_direito(id)          ON DELETE RESTRICT,
  UNIQUE (solicitacao_id, tipo_direito_id)
);

-- ── 5. solicitacoes_contratos_territorios ───────────────────
CREATE TABLE IF NOT EXISTS solicitacoes_contratos_territorios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes_contratos(id) ON DELETE CASCADE,
  codigo_pais    TEXT NOT NULL CHECK (LENGTH(codigo_pais) BETWEEN 2 AND 5),
  UNIQUE (solicitacao_id, codigo_pais)
);

COMMENT ON COLUMN solicitacoes_contratos_territorios.codigo_pais IS
  'ISO 3166-1 alpha-2 (BR, US, PT, AR…) ou WORLD para mundial.';

-- ── 6. solicitacoes_assinaturas ─────────────────────────────
-- Controla assinatura individual de cada titular no contrato.
CREATE TABLE IF NOT EXISTS solicitacoes_assinaturas (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id       UUID    NOT NULL REFERENCES solicitacoes_contratos(id) ON DELETE CASCADE,
  titular_id           UUID    NOT NULL REFERENCES titulares(id)              ON DELETE RESTRICT,
  status               TEXT    NOT NULL DEFAULT 'pendente'
                         CHECK (status IN ('pendente','enviado','assinado','recusado')),
  data_envio           TIMESTAMPTZ,
  data_assinatura      TIMESTAMPTZ,
  ip_assinatura        INET,           -- IPv4 ou IPv6 do dispositivo
  hash_documento       TEXT,           -- SHA-256 do arquivo assinado
  url_arquivo_assinado TEXT,
  observacoes          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (solicitacao_id, titular_id)
);

COMMENT ON COLUMN solicitacoes_assinaturas.ip_assinatura IS
  'IP do dispositivo no momento da assinatura (INET aceita IPv4 e IPv6).';
COMMENT ON COLUMN solicitacoes_assinaturas.hash_documento IS
  'SHA-256 do documento assinado — usado para auditoria de integridade.';

-- ── 7. solicitacoes_obras ────────────────────────────────────
-- Requer contrato com status IN ('aprovado','convertido') para ser criada.
-- Validação de negócio aplicada na camada de API/serviço.
CREATE TABLE IF NOT EXISTS solicitacoes_obras (
  id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID            NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
  editora_id              UUID            NOT NULL REFERENCES editoras(id)  ON DELETE RESTRICT,
  criado_por              UUID            NOT NULL REFERENCES usuarios(id)  ON DELETE RESTRICT,
  titulo                  TEXT            NOT NULL,
  titulo_alternativo      TEXT,
  iswc                    TEXT,
  genero                  TEXT,
  subgenero               TEXT,
  observacoes             TEXT,
  status                  status_sol_obra NOT NULL DEFAULT 'rascunho',
  -- contrato que habilita esta solicitação de obra
  solicitacao_contrato_id UUID            REFERENCES solicitacoes_contratos(id) ON DELETE SET NULL,
  -- rastreabilidade após conversão
  obra_oficial_id         UUID            REFERENCES obras(id)     ON DELETE SET NULL,
  editora_origem_id       UUID            REFERENCES editoras(id)  ON DELETE SET NULL,
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  solicitacoes_obras IS
  'Obras em fluxo de aprovação criadas por Editoras Administradas. '
  'Só se tornam obras oficiais após aprovação da Org. Gestora.';
COMMENT ON COLUMN solicitacoes_obras.solicitacao_contrato_id IS
  'Contrato de cessão/administração que habilitou esta solicitação de obra.';
COMMENT ON COLUMN solicitacoes_obras.obra_oficial_id IS
  'Preenchido quando status=convertida — aponta para a obra oficial do catálogo.';

-- ── 8. solicitacoes_obras_titulares ─────────────────────────
CREATE TABLE IF NOT EXISTS solicitacoes_obras_titulares (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_obra_id UUID         NOT NULL REFERENCES solicitacoes_obras(id) ON DELETE CASCADE,
  titular_id          UUID         NOT NULL REFERENCES titulares(id)          ON DELETE RESTRICT,
  funcao              funcao_autor NOT NULL,
  percentual_obra     NUMERIC(6,2) NOT NULL
                        CHECK (percentual_obra    >= 0 AND percentual_obra    <= 100),
  percentual_autor    NUMERIC(6,2) NOT NULL
                        CHECK (percentual_autor   >= 0 AND percentual_autor   <= 100),
  percentual_editora  NUMERIC(6,2) NOT NULL
                        CHECK (percentual_editora >= 0 AND percentual_editora <= 100),
  ordem               INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT split_obra_soma_100 CHECK (ROUND(percentual_autor + percentual_editora, 2) = 100.00)
);

-- ── 9. solicitacoes_obras_direitos ──────────────────────────
CREATE TABLE IF NOT EXISTS solicitacoes_obras_direitos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_obra_id UUID NOT NULL REFERENCES solicitacoes_obras(id) ON DELETE CASCADE,
  tipo_direito_id     UUID NOT NULL REFERENCES tipos_direito(id)      ON DELETE RESTRICT,
  UNIQUE (solicitacao_obra_id, tipo_direito_id)
);

-- ── 10. solicitacoes_obras_territorios ──────────────────────
CREATE TABLE IF NOT EXISTS solicitacoes_obras_territorios (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_obra_id UUID NOT NULL REFERENCES solicitacoes_obras(id) ON DELETE CASCADE,
  codigo_pais         TEXT NOT NULL CHECK (LENGTH(codigo_pais) BETWEEN 2 AND 5),
  UNIQUE (solicitacao_obra_id, codigo_pais)
);

COMMENT ON COLUMN solicitacoes_obras_territorios.codigo_pais IS
  'ISO 3166-1 alpha-2 (BR, US, PT, AR…) ou WORLD para mundial.';

-- ── 11. workflow_aprovacoes ──────────────────────────────────
-- Decisões humanas explícitas com justificativa.
-- Propósito: auditoria de escolhas deliberadas (diferente do histórico automático).
CREATE TABLE IF NOT EXISTS workflow_aprovacoes (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo_entidade         TEXT          NOT NULL
                          CHECK (tipo_entidade IN ('solicitacao_contrato','solicitacao_obra')),
  entidade_id           UUID          NOT NULL,
  acao                  acao_workflow NOT NULL,
  aprovador_id          UUID          REFERENCES usuarios(id) ON DELETE SET NULL,
  status_anterior       TEXT,
  status_novo           TEXT,
  observacao            TEXT,
  data_limite_resposta  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  workflow_aprovacoes IS
  'Decisões humanas no fluxo de aprovação. Registra ações deliberadas com justificativa. '
  'Diferente do historico (log automático de qualquer mudança de status).';
COMMENT ON COLUMN workflow_aprovacoes.data_limite_resposta IS
  'Prazo para resposta da contraparte (SLA interno configurável).';

-- ── 12. solicitacoes_historico ──────────────────────────────
-- Log imutável automático de toda mudança de status.
-- REGRA: nunca deletar/atualizar registros desta tabela.
CREATE TABLE IF NOT EXISTS solicitacoes_historico (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo_entidade  TEXT  NOT NULL
                   CHECK (tipo_entidade IN ('solicitacao_contrato','solicitacao_obra')),
  entidade_id    UUID  NOT NULL,
  status_anterior TEXT,
  status_novo    TEXT,
  usuario_id     UUID  REFERENCES usuarios(id) ON DELETE SET NULL,
  observacao     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE solicitacoes_historico IS
  'Log imutável automático de toda mudança de status em solicitações. '
  'REGRA: nunca deletar ou atualizar registros deste log.';

-- ── 13. FK de rastreabilidade em contratos e obras oficiais ──
-- Permite, via JOIN, saber qual solicitação originou um registro oficial.
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS solicitacao_id UUID
  REFERENCES solicitacoes_contratos(id) ON DELETE SET NULL;
ALTER TABLE obras     ADD COLUMN IF NOT EXISTS solicitacao_id UUID
  REFERENCES solicitacoes_obras(id)     ON DELETE SET NULL;

COMMENT ON COLUMN contratos.solicitacao_id IS
  'Referência à solicitação que originou este contrato oficial (rastreabilidade).';
COMMENT ON COLUMN obras.solicitacao_id IS
  'Referência à solicitação que originou esta obra oficial (rastreabilidade).';

-- ── 14. Índices ──────────────────────────────────────────────
-- solicitacoes_contratos
CREATE INDEX IF NOT EXISTS idx_sol_cont_tenant     ON solicitacoes_contratos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sol_cont_editora    ON solicitacoes_contratos(editora_id);
CREATE INDEX IF NOT EXISTS idx_sol_cont_status     ON solicitacoes_contratos(status);
CREATE INDEX IF NOT EXISTS idx_sol_cont_criado_por ON solicitacoes_contratos(criado_por);

-- solicitacoes_contratos_titulares
CREATE INDEX IF NOT EXISTS idx_sol_cont_tit_sol    ON solicitacoes_contratos_titulares(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_sol_cont_tit_tit    ON solicitacoes_contratos_titulares(titular_id);

-- solicitacoes_assinaturas
CREATE INDEX IF NOT EXISTS idx_sol_assin_sol       ON solicitacoes_assinaturas(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_sol_assin_tit       ON solicitacoes_assinaturas(titular_id);

-- solicitacoes_obras
CREATE INDEX IF NOT EXISTS idx_sol_obra_tenant     ON solicitacoes_obras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sol_obra_editora    ON solicitacoes_obras(editora_id);
CREATE INDEX IF NOT EXISTS idx_sol_obra_status     ON solicitacoes_obras(status);
CREATE INDEX IF NOT EXISTS idx_sol_obra_contrato   ON solicitacoes_obras(solicitacao_contrato_id);
CREATE INDEX IF NOT EXISTS idx_sol_obra_criado_por ON solicitacoes_obras(criado_por);

-- solicitacoes_obras_titulares
CREATE INDEX IF NOT EXISTS idx_sol_obra_tit_obra   ON solicitacoes_obras_titulares(solicitacao_obra_id);
CREATE INDEX IF NOT EXISTS idx_sol_obra_tit_tit    ON solicitacoes_obras_titulares(titular_id);

-- workflow_aprovacoes
CREATE INDEX IF NOT EXISTS idx_workflow_tenant     ON workflow_aprovacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_entidade   ON workflow_aprovacoes(entidade_id);
CREATE INDEX IF NOT EXISTS idx_workflow_aprovador  ON workflow_aprovacoes(aprovador_id);

-- solicitacoes_historico
CREATE INDEX IF NOT EXISTS idx_hist_tenant         ON solicitacoes_historico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hist_entidade       ON solicitacoes_historico(entidade_id);

-- contratos e obras oficiais
CREATE INDEX IF NOT EXISTS idx_contratos_solicitacao ON contratos(solicitacao_id)
  WHERE solicitacao_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obras_solicitacao     ON obras(solicitacao_id)
  WHERE solicitacao_id IS NOT NULL;

-- ── 15. RLS ──────────────────────────────────────────────────

-- ── 15a. solicitacoes_contratos ──────────────────────────────
ALTER TABLE solicitacoes_contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sol_cont_select" ON solicitacoes_contratos FOR SELECT
  USING (
    tenant_id = fn_meu_tenant_id()
    AND (
      fn_meu_role() IN ('super_admin','master','admin','juridico')
      OR (
        fn_meu_role() = 'editora_administrada'
        AND editora_id = ANY(fn_minhas_editoras_ids())
      )
    )
  );

CREATE POLICY "sol_cont_insert" ON solicitacoes_contratos FOR INSERT
  WITH CHECK (
    tenant_id = fn_meu_tenant_id()
    AND (
      fn_meu_role() IN ('super_admin','master','admin','juridico')
      OR (
        fn_meu_role() = 'editora_administrada'
        AND editora_id = ANY(fn_minhas_editoras_ids())
      )
    )
  );

-- editora_administrada só edita solicitações próprias em rascunho ou devolvidas
CREATE POLICY "sol_cont_update" ON solicitacoes_contratos FOR UPDATE
  USING (
    tenant_id = fn_meu_tenant_id()
    AND (
      fn_meu_role() IN ('super_admin','master','admin','juridico')
      OR (
        fn_meu_role() = 'editora_administrada'
        AND editora_id = ANY(fn_minhas_editoras_ids())
        AND status IN ('rascunho'::status_sol_contrato, 'devolvido'::status_sol_contrato)
      )
    )
  );

CREATE POLICY "sol_cont_delete" ON solicitacoes_contratos FOR DELETE
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('super_admin','master','admin')
  );

-- ── 15b. Sub-tabelas de solicitacoes_contratos ───────────────
-- RLS derivada via EXISTS → solicitacoes_contratos.editora_id
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'solicitacoes_contratos_titulares',
    'solicitacoes_contratos_direitos',
    'solicitacoes_contratos_territorios',
    'solicitacoes_assinaturas'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE %1$s ENABLE ROW LEVEL SECURITY;

       CREATE POLICY "rls_select_%1$s" ON %1$s FOR SELECT
         USING (
           EXISTS (
             SELECT 1 FROM solicitacoes_contratos sc
             WHERE sc.id = %1$s.solicitacao_id
               AND sc.tenant_id = fn_meu_tenant_id()
               AND (
                 fn_meu_role() IN (''super_admin'',''master'',''admin'',''juridico'')
                 OR (fn_meu_role() = ''editora_administrada'' AND sc.editora_id = ANY(fn_minhas_editoras_ids()))
               )
           )
         );

       CREATE POLICY "rls_write_%1$s" ON %1$s FOR ALL
         USING (
           EXISTS (
             SELECT 1 FROM solicitacoes_contratos sc
             WHERE sc.id = %1$s.solicitacao_id
               AND sc.tenant_id = fn_meu_tenant_id()
               AND (
                 fn_meu_role() IN (''super_admin'',''master'',''admin'',''juridico'')
                 OR (fn_meu_role() = ''editora_administrada'' AND sc.editora_id = ANY(fn_minhas_editoras_ids()))
               )
           )
         );',
      tbl
    );
  END LOOP;
END $$;

-- ── 15c. solicitacoes_obras ──────────────────────────────────
ALTER TABLE solicitacoes_obras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sol_obra_select" ON solicitacoes_obras FOR SELECT
  USING (
    tenant_id = fn_meu_tenant_id()
    AND (
      fn_meu_role() IN ('super_admin','master','admin','juridico','atendimento')
      OR (
        fn_meu_role() = 'editora_administrada'
        AND editora_id = ANY(fn_minhas_editoras_ids())
      )
    )
  );

CREATE POLICY "sol_obra_insert" ON solicitacoes_obras FOR INSERT
  WITH CHECK (
    tenant_id = fn_meu_tenant_id()
    AND (
      fn_meu_role() IN ('super_admin','master','admin','juridico','atendimento')
      OR (
        fn_meu_role() = 'editora_administrada'
        AND editora_id = ANY(fn_minhas_editoras_ids())
      )
    )
  );

-- editora_administrada só edita obras próprias em rascunho ou devolvidas
CREATE POLICY "sol_obra_update" ON solicitacoes_obras FOR UPDATE
  USING (
    tenant_id = fn_meu_tenant_id()
    AND (
      fn_meu_role() IN ('super_admin','master','admin','juridico','atendimento')
      OR (
        fn_meu_role() = 'editora_administrada'
        AND editora_id = ANY(fn_minhas_editoras_ids())
        AND status IN ('rascunho'::status_sol_obra, 'devolvida'::status_sol_obra)
      )
    )
  );

CREATE POLICY "sol_obra_delete" ON solicitacoes_obras FOR DELETE
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('super_admin','master','admin')
  );

-- ── 15d. Sub-tabelas de solicitacoes_obras ───────────────────
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'solicitacoes_obras_titulares',
    'solicitacoes_obras_direitos',
    'solicitacoes_obras_territorios'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE %1$s ENABLE ROW LEVEL SECURITY;

       CREATE POLICY "rls_select_%1$s" ON %1$s FOR SELECT
         USING (
           EXISTS (
             SELECT 1 FROM solicitacoes_obras so
             WHERE so.id = %1$s.solicitacao_obra_id
               AND so.tenant_id = fn_meu_tenant_id()
               AND (
                 fn_meu_role() IN (''super_admin'',''master'',''admin'',''juridico'',''atendimento'')
                 OR (fn_meu_role() = ''editora_administrada'' AND so.editora_id = ANY(fn_minhas_editoras_ids()))
               )
           )
         );

       CREATE POLICY "rls_write_%1$s" ON %1$s FOR ALL
         USING (
           EXISTS (
             SELECT 1 FROM solicitacoes_obras so
             WHERE so.id = %1$s.solicitacao_obra_id
               AND so.tenant_id = fn_meu_tenant_id()
               AND (
                 fn_meu_role() IN (''super_admin'',''master'',''admin'',''juridico'',''atendimento'')
                 OR (fn_meu_role() = ''editora_administrada'' AND so.editora_id = ANY(fn_minhas_editoras_ids()))
               )
           )
         );',
      tbl
    );
  END LOOP;
END $$;

-- ── 15e. workflow_aprovacoes ─────────────────────────────────
ALTER TABLE workflow_aprovacoes ENABLE ROW LEVEL SECURITY;

-- Todos do tenant podem visualizar o histórico de decisões
CREATE POLICY "workflow_select" ON workflow_aprovacoes FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());

-- Apenas gestores aprovam/rejeitam/devolvem
CREATE POLICY "workflow_write" ON workflow_aprovacoes FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('super_admin','master','admin','juridico')
  );

-- ── 15f. solicitacoes_historico ──────────────────────────────
-- Todos lêem; sistema/API insere. Nenhuma política UPDATE/DELETE
-- → bloqueado por padrão no RLS (imutabilidade garantida pelo DB).
ALTER TABLE solicitacoes_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hist_select" ON solicitacoes_historico FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());

-- Inserção permitida para todos os roles que interagem com o fluxo
CREATE POLICY "hist_insert" ON solicitacoes_historico FOR INSERT
  WITH CHECK (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN (
      'super_admin','master','admin','juridico',
      'atendimento','editora_administrada'
    )
  );
-- UPDATE e DELETE não têm política → bloqueados automaticamente pelo RLS
