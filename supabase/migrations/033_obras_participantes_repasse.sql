-- ================================================================
-- Migration 033 — obras_participantes + obras_repasse
-- ================================================================
--
-- NOTAS ARQUITETURAIS REGISTRADAS:
--
-- [1] obras_participantes é camada TRANSITÓRIA.
--     No futuro, titulares + editoras convergem para "entidades".
--     O campo "papel" define o papel na obra, não a natureza do
--     cadastro. CA, E, SE, CO, AD, TR, AM são papéis, não tipos.
--
-- [2] AM não deve ser inserido manualmente no fluxo atual.
--     AM é derivado de negocios_editoriais em tempo de execução
--     (distribuição / geração CWR). Entra no CHECK apenas para
--     compatibilidade com o modelo futuro de entidades.
--
-- [3] Regra de resolução do AM:
--     - E = Top Show Music            → Top Show é E, sem AM.
--     - E ≠ Top Show + negócio ativo  → AM derivado via negocios_editoriais.
--     - E ≠ Top Show + sem negócio    → status = sem_administracao.
--
-- [4] Esta tabela NÃO substitui obras_links_titulares ainda.
--     obras_links_titulares permanece intacta por compatibilidade.
--     Migração de dados será feita após homologação do fluxo novo.
--
-- [5] PENDÊNCIA DE TELA — /master/editora (Organização Gestora):
--     Tela deve equivaler a cadastro PJ/editorial padrão + Sender.
--     Campos obrigatórios: razão social, CNPJ, endereço, contatos,
--     responsável, bancário, PIX, código interno, ECAD, CAE, IPI,
--     CWR interno, CWR publisher + sender_code, sender_name, sender_type.
--     Top Show Music = uma única entidade, não duplicar cadastro.
--
-- [6] collect_performing e collect_mechanical em negocios_editoriais
--     são pendência do módulo CWR — não entram nesta migration.
--
-- [7] Ambas as tabelas são multi-tenant (tenant_id + RLS + policies).
--     obras_repasse impacta diretamente conta corrente e distribuição.
--
-- [8] Soma de percentuais por obra validada na camada de aplicação.
--     Soma de percentual_sobre_parte por participante idem.
-- ================================================================


-- ── ENUM resolucao_editorial ──────────────────────────────────
DO $$ BEGIN
  CREATE TYPE resolucao_editorial AS ENUM (
    'ok',                -- E/SE/AM resolvido (própria Top Show, ou negócio ativo)
    'sem_administracao', -- E externa sem negócio editorial ativo
    'pendente_revisao'   -- aguardando validação manual
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Tabela obras_participantes ────────────────────────────────
-- Registra os participantes DIRETOS de uma obra.
-- Papéis válidos: CA, E, SE, CO, AD, TR, AM
-- AM não é inserido manualmente — entra apenas via snapshot CWR
-- ou quando a refatoração "entidades" for concluída.

CREATE TABLE IF NOT EXISTS obras_participantes (
  id                         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                  UUID         NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
  obra_id                    UUID         NOT NULL REFERENCES obras(id)    ON DELETE CASCADE,

  -- participante: titular (CA/CO/AD/TR) OU editora (E/SE/AM)
  -- exatamente um dos dois preenchido por linha
  titular_id                 UUID         REFERENCES titulares(id) ON DELETE RESTRICT,
  editora_id                 UUID         REFERENCES editoras(id)  ON DELETE RESTRICT,

  papel                      TEXT         NOT NULL
                             CHECK (papel IN ('CA','E','SE','CO','AD','TR','AM')),
  -- CA = Compositor/Autor        | CO = Co-autor / Co-editor
  -- E  = Editora Original        | AD = Adaptador
  -- SE = Sub-editor              | TR = Tradutor / Versionista
  -- AM = Administrador (derivado)|

  percentual                 NUMERIC(8,4) NOT NULL
                             CHECK (percentual > 0 AND percentual <= 100),

  -- Obrigatório quando papel IN ('E','SE','AM') — resolve quem administra.
  -- Deve ser NULL para CA, CO, AD, TR.
  status_resolucao_editorial resolucao_editorial,

  contrato_id                UUID         REFERENCES contratos(id) ON DELETE SET NULL,

  created_at                 TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT now(),

  -- exatamente uma entidade por linha
  CONSTRAINT chk_op_uma_entidade CHECK (
    (titular_id IS NOT NULL AND editora_id IS NULL) OR
    (titular_id IS NULL     AND editora_id IS NOT NULL)
  ),

  -- E / SE / AM → obrigatoriamente editora; CA / CO / AD / TR → obrigatoriamente titular
  CONSTRAINT chk_op_papel_entidade CHECK (
    (papel IN ('E','SE','AM')       AND editora_id IS NOT NULL AND titular_id IS NULL) OR
    (papel IN ('CA','CO','AD','TR') AND titular_id IS NOT NULL AND editora_id IS NULL)
  ),

  -- E / SE / AM → status_resolucao_editorial NOT NULL (obrigatório)
  -- demais papéis → status_resolucao_editorial deve ser NULL
  CONSTRAINT chk_op_resolucao CHECK (
    (papel IN ('E','SE','AM')      AND status_resolucao_editorial IS NOT NULL) OR
    (papel NOT IN ('E','SE','AM')  AND status_resolucao_editorial IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_op_tenant     ON obras_participantes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_op_obra       ON obras_participantes(obra_id);
CREATE INDEX IF NOT EXISTS idx_op_titular    ON obras_participantes(titular_id)  WHERE titular_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_op_editora    ON obras_participantes(editora_id)  WHERE editora_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_op_papel      ON obras_participantes(papel);
CREATE INDEX IF NOT EXISTS idx_op_resolucao  ON obras_participantes(status_resolucao_editorial)
                                             WHERE status_resolucao_editorial IS NOT NULL;


-- ── Tabela obras_repasse ──────────────────────────────────────
-- Cadeia de repasse dentro da parte de um participante direto.
-- Uso principal: divisão da parte do CA entre cessionários,
-- licenciantes, herdeiros, representantes e outros beneficiários.
-- Soma de percentual_sobre_parte por participante_obra_id
-- validada na camada de aplicação (não trigger).

CREATE TABLE IF NOT EXISTS obras_repasse (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID         NOT NULL REFERENCES tenants(id)              ON DELETE CASCADE,
  participante_obra_id     UUID         NOT NULL REFERENCES obras_participantes(id)  ON DELETE CASCADE,

  -- beneficiário: titular (PF/PJ) OU editora
  -- exatamente um dos dois preenchido por linha
  titular_beneficiario_id  UUID         REFERENCES titulares(id) ON DELETE RESTRICT,
  editora_beneficiaria_id  UUID         REFERENCES editoras(id)  ON DELETE RESTRICT,

  tipo_relacao             TEXT         NOT NULL
                           CHECK (tipo_relacao IN (
                             'titular_original',
                             'cessionario_pf',
                             'cessionario_pj',
                             'licenciante',
                             'herdeiro',
                             'representante',
                             'procurador'
                           )),

  percentual_sobre_parte   NUMERIC(8,4) NOT NULL
                           CHECK (percentual_sobre_parte > 0 AND percentual_sobre_parte <= 100),

  contrato_id              UUID         REFERENCES contratos(id) ON DELETE SET NULL,
  data_inicio              DATE,
  data_fim                 DATE,
  ativo                    BOOLEAN      NOT NULL DEFAULT true,

  created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT chk_or_um_beneficiario CHECK (
    (titular_beneficiario_id IS NOT NULL AND editora_beneficiaria_id IS NULL) OR
    (titular_beneficiario_id IS NULL     AND editora_beneficiaria_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_or_tenant       ON obras_repasse(tenant_id);
CREATE INDEX IF NOT EXISTS idx_or_participante ON obras_repasse(participante_obra_id);
CREATE INDEX IF NOT EXISTS idx_or_titular      ON obras_repasse(titular_beneficiario_id) WHERE titular_beneficiario_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_or_editora      ON obras_repasse(editora_beneficiaria_id) WHERE editora_beneficiaria_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_or_ativo        ON obras_repasse(ativo) WHERE ativo = true;


-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE obras_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_repasse       ENABLE ROW LEVEL SECURITY;

-- obras_participantes — SELECT: todos os roles do tenant
CREATE POLICY "op_select" ON obras_participantes FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());

-- obras_participantes — WRITE: master, admin, super_admin, juridico
CREATE POLICY "op_write" ON obras_participantes FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('master', 'admin', 'super_admin', 'juridico')
  );

-- obras_repasse — SELECT: todos os roles do tenant
CREATE POLICY "or_select" ON obras_repasse FOR SELECT
  USING (tenant_id = fn_meu_tenant_id());

-- obras_repasse — WRITE: master, admin, super_admin, juridico, financeiro
-- financeiro incluído pois obras_repasse impacta distribuição e CC titular
CREATE POLICY "or_write" ON obras_repasse FOR ALL
  USING (
    tenant_id = fn_meu_tenant_id()
    AND fn_meu_role() IN ('master', 'admin', 'super_admin', 'juridico', 'financeiro')
  );
