-- ============================================================
-- 020_multifonte_validacao_humana.sql
--
-- Prepara obras_links_titulares para suportar múltiplas origens
-- de formação da obra sem alterar a bridge, o Analítico,
-- o CC Obra ou o motor financeiro.
--
-- CAMPOS ADICIONADOS:
--   status_validacao_humana  — controla se a linha exige revisão
--   observacao_validacao     — texto livre do validador humano
--
-- CAMPOS JÁ EXISTENTES (não duplicar):
--   fonte_controle           — 'cwr'|'contrato'|'editora_administrada'|'manual'
--   status_controle          — enum controlado|nao_controlado|pendente|...
--   contrato_id              — FK → contratos
--
-- HIERARQUIA DE FONTES (implementada futuramente pelo resolvedor_links):
--   1. Contrato assinado e validado por humano
--   2. Cadastro manual validado por humano
--   3. CWR
--   4. Pendência para revisão
--
-- PAPEL DA IA:
--   A IA não é uma fonte de dados — é uma ferramenta de extração.
--   A IA lê documentos anexados (contrato PDF, letra, etc.) e sugere campos.
--   Toda sugestão da IA fica como 'pendente_validacao' até aprovação humana.
--   Após validação humana, a linha passa a ser tratada como 'manual' ou 'contrato'.
--   A IA nunca tem autoridade de validação.
--
-- Execute no Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE obras_links_titulares
  ADD COLUMN IF NOT EXISTS status_validacao_humana TEXT NOT NULL DEFAULT 'nao_requerida'
    CONSTRAINT chk_olt_status_validacao CHECK (status_validacao_humana IN (
      'nao_requerida',        -- padrão: CWR e contratos automáticos não exigem revisão
      'pendente_validacao',   -- cadastro manual ou extração por IA aguardando aprovação humana
      'validado',             -- aprovado explicitamente por operador
      'rejeitado'             -- rejeitado, linha aguarda correção antes de entrar na bridge
    )),

  ADD COLUMN IF NOT EXISTS observacao_validacao TEXT;
  -- texto livre: motivo da validação/rejeição, divergência detectada,
  -- nome do validador, referência ao contrato físico, etc.

-- Índice para consultas de pendências (relatório de inconsistências futuro)
CREATE INDEX IF NOT EXISTS idx_olt_validacao_humana
  ON obras_links_titulares (tenant_id, status_validacao_humana)
  WHERE status_validacao_humana != 'nao_requerida';

-- Comentários técnicos
COMMENT ON COLUMN obras_links_titulares.status_validacao_humana IS
  'Controla exigência de revisão humana antes de a linha entrar na bridge. '
  'CWR: nao_requerida. Contrato automático: nao_requerida. '
  'Cadastro manual ou extração por IA: pendente_validacao até aprovação humana. '
  'A IA apenas extrai informações de documentos — nunca valida nem aprova. '
  'A linha só avança para validado após confirmação explícita de um operador humano.';

COMMENT ON COLUMN obras_links_titulares.observacao_validacao IS
  'Texto livre para auditoria: motivo da validação ou rejeição, '
  'divergência detectada entre fontes, referência ao documento físico.';

-- Verificação após execução
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 020 aplicada com sucesso.';
  RAISE NOTICE 'Campos adicionados em obras_links_titulares:';
  RAISE NOTICE '  status_validacao_humana  TEXT DEFAULT nao_requerida';
  RAISE NOTICE '  observacao_validacao     TEXT nullable';
  RAISE NOTICE '';
  RAISE NOTICE 'Registros existentes: status_validacao_humana = nao_requerida (sem impacto).';
  RAISE NOTICE 'Bridge, Analítico, CC Obra e Distribuição: sem alteração.';
END $$;
