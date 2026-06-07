-- Migration 042 — validar_direito_administrado() v2 — Motor de Autorização
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Esta migration evolui a função para:
--   1. Aceitar p_direito_codigo com os 8 códigos jurídicos canônicos
--   2. Aceitar p_obra_id para validação por obra específica
--      (respeita abrangencia_tipo do negócio editorial)
--   3. Retornar obra_coberta no JSONB de resultado
--
-- NOVA ASSINATURA (backward compatible — todos os parâmetros novos têm DEFAULT):
--   validar_direito_administrado(
--     p_editora_original_id, p_administradora_id,
--     p_direito_codigo, p_territorio,
--     p_data_referencia DEFAULT CURRENT_DATE,
--     p_tenant_id       DEFAULT NULL,
--     p_obra_id         DEFAULT NULL   ← NOVO
--   )
--
-- LÓGICA p_obra_id + abrangencia_tipo:
--   'catalogo_inteiro'   → qualquer obra do catálogo é coberta
--   'obras_especificas'  → p_obra_id IN abrangencia_ids
--   'grupo_obras'        → p_obra_id IN abrangencia_ids
--   'autor_especifico'   → autor principal da obra IN abrangencia_ids
--   'grupo_autores'      → qualquer autor da obra IN abrangencia_ids
--   p_obra_id IS NULL    → obra_coberta retorna NULL (sem validação por obra)
--
-- MOTOR DE AUTORIZAÇÃO — MÓDULOS OBRIGADOS A USAR ESTA FUNÇÃO:
--   BackOffice, Recebimentos, Distribuição, Contratos, Licenciamento,
--   Sync, Audiovisual, Publicidade, Conta Corrente, Relatórios, BI, CWR.
--
-- 8 REGRAS MÁXIMAS DO SISTEMA:
--   1. O contrato manda. O sistema se adapta ao contrato.
--   2. nome_juridico é a verdade oficial. Nunca simplificar nomenclatura contratual.
--   3. Origens de receita apenas informam de onde veio o dinheiro.
--   4. O direito jurídico informa o que o contrato autoriza.
--   5. tipo_direito_id é obrigatório em todo módulo de licença/sync/autorização.
--   6. Nenhuma cobrança/licença/distribuição sem tipo_direito_id identificado.
--   7. DSPs com mapeamento_provisorio=TRUE — nunca assumir automaticamente o direito.
--   8. Negócio Editorial é a trava principal — sempre validar antes de operar.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION validar_direito_administrado(
  p_editora_original_id   UUID,
  p_administradora_id     UUID,
  p_direito_codigo        TEXT,         -- código jurídico canônico (ex: 'comunicacao_publico')
  p_territorio            TEXT,         -- 'brasil' | 'exterior' | código ISO (ex: 'AR', 'US')
  p_data_referencia       DATE    DEFAULT CURRENT_DATE,
  p_tenant_id             UUID    DEFAULT NULL,
  p_obra_id               UUID    DEFAULT NULL   -- validação por obra específica
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
-- SECURITY INVOKER: as API routes usam service_role (bypassa RLS),
-- por isso p_tenant_id é filtrado explicitamente no WHERE quando fornecido.
AS $$
DECLARE
  v_negocio          RECORD;
  v_territorio_chave TEXT;      -- 'brasil' ou 'exterior' normalizado
  v_direitos         JSONB;     -- array de códigos para o território
  v_percentuais      JSONB;     -- objeto de percentuais específicos por direito
  v_pct_orig         NUMERIC;
  v_pct_admr         NUMERIC;
  v_obra_coberta     BOOLEAN;   -- NULL quando p_obra_id não fornecido
  v_obra_participantes JSONB;   -- participantes da obra (para validação por autor)
BEGIN

  -- ── 1. Normalizar território ─────────────────────────────────────────────
  v_territorio_chave := CASE
    WHEN lower(trim(p_territorio)) IN ('brasil','br','brazil') THEN 'brasil'
    ELSE 'exterior'
  END;

  -- ── 2. Localizar negócio editorial ativo com vigência válida ─────────────
  SELECT *
    INTO v_negocio
    FROM negocios_editoriais
   WHERE editora_administrada_id   = p_editora_original_id
     AND editora_administradora_id = p_administradora_id
     AND status = 'ativo'
     AND data_inicio <= p_data_referencia
     AND (data_fim IS NULL OR data_fim >= p_data_referencia)
     AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
   ORDER BY data_inicio DESC
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'permitido',             FALSE,
      'motivo',                'Nenhum negócio editorial ativo encontrado entre as editoras informadas na data ' || p_data_referencia::TEXT,
      'pct_editora_original',  NULL,
      'pct_administradora',    NULL,
      'negocio_editorial_id',  NULL,
      'territorio',            v_territorio_chave,
      'direito_codigo',        p_direito_codigo,
      'obra_coberta',          NULL
    );
  END IF;

  -- ── 3. Selecionar array e percentuais conforme território ─────────────────
  IF v_territorio_chave = 'brasil' THEN
    v_direitos    := COALESCE(v_negocio.direitos_brasil,   '[]'::jsonb);
    v_percentuais := v_negocio.percentuais_brasil;
  ELSE
    v_direitos    := COALESCE(v_negocio.direitos_exterior, '[]'::jsonb);
    v_percentuais := v_negocio.percentuais_exterior;
  END IF;

  -- ── 4. Verificar se o direito está autorizado para este território ─────────
  IF NOT (v_direitos @> to_jsonb(p_direito_codigo)) THEN
    RETURN jsonb_build_object(
      'permitido',             FALSE,
      'motivo',                'Direito "' || p_direito_codigo || '" não está autorizado para o território '
                                 || v_territorio_chave
                                 || ' no negócio editorial "'
                                 || v_negocio.nome || '"',
      'pct_editora_original',  NULL,
      'pct_administradora',    NULL,
      'negocio_editorial_id',  v_negocio.id,
      'territorio',            v_territorio_chave,
      'direito_codigo',        p_direito_codigo,
      'obra_coberta',          NULL
    );
  END IF;

  -- ── 5. Validação por obra específica (p_obra_id) ──────────────────────────
  v_obra_coberta := NULL;  -- default: sem validação por obra

  IF p_obra_id IS NOT NULL THEN
    v_obra_coberta := FALSE;  -- assume não coberta até provar o contrário

    CASE COALESCE(v_negocio.abrangencia_tipo, 'catalogo_inteiro')

      WHEN 'catalogo_inteiro' THEN
        -- Qualquer obra do catálogo é coberta
        v_obra_coberta := TRUE;

      WHEN 'obras_especificas', 'grupo_obras' THEN
        -- Obra deve estar explicitamente na lista
        SELECT EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(v_negocio.abrangencia_ids, '[]'::jsonb)) AS obra_id
          WHERE obra_id::UUID = p_obra_id
        ) INTO v_obra_coberta;

      WHEN 'autor_especifico' THEN
        -- Autor principal da obra deve estar na lista
        SELECT EXISTS (
          SELECT 1
          FROM obras_participantes op
          WHERE op.obra_id = p_obra_id
            AND op.papel IN ('A', 'CA')
            AND op.titular_id::TEXT IN (
              SELECT jsonb_array_elements_text(COALESCE(v_negocio.abrangencia_ids, '[]'::jsonb))
            )
        ) INTO v_obra_coberta;

      WHEN 'grupo_autores' THEN
        -- Qualquer autor da obra deve estar na lista
        SELECT EXISTS (
          SELECT 1
          FROM obras_participantes op
          WHERE op.obra_id = p_obra_id
            AND op.titular_id::TEXT IN (
              SELECT jsonb_array_elements_text(COALESCE(v_negocio.abrangencia_ids, '[]'::jsonb))
            )
        ) INTO v_obra_coberta;

      ELSE
        -- Tipo desconhecido → catalogo_inteiro (fallback seguro)
        v_obra_coberta := TRUE;

    END CASE;

    IF NOT v_obra_coberta THEN
      RETURN jsonb_build_object(
        'permitido',             FALSE,
        'motivo',                'Obra não está coberta pelo negócio editorial "' || v_negocio.nome || '"'
                                   || ' (abrangencia_tipo: ' || COALESCE(v_negocio.abrangencia_tipo, 'catalogo_inteiro') || ')',
        'pct_editora_original',  NULL,
        'pct_administradora',    NULL,
        'negocio_editorial_id',  v_negocio.id,
        'territorio',            v_territorio_chave,
        'direito_codigo',        p_direito_codigo,
        'obra_coberta',          FALSE
      );
    END IF;
  END IF;

  -- ── 6. Obter percentuais — específico por direito ou padrão do negócio ────
  IF v_percentuais IS NOT NULL AND v_percentuais ? p_direito_codigo THEN
    -- Percentual específico cadastrado para este direito/território
    v_pct_orig := (v_percentuais -> p_direito_codigo ->> 'administrada')::NUMERIC;
    v_pct_admr := (v_percentuais -> p_direito_codigo ->> 'administradora')::NUMERIC;
  ELSE
    -- Fallback: percentual padrão do contrato
    v_pct_orig := v_negocio.percentual_administrada;
    v_pct_admr := v_negocio.percentual_administradora;
  END IF;

  -- ── 7. Retornar resultado autorizado ──────────────────────────────────────
  RETURN jsonb_build_object(
    'permitido',             TRUE,
    'motivo',                'Autorizado — negócio editorial ativo: "' || v_negocio.nome || '"',
    'pct_editora_original',  v_pct_orig,
    'pct_administradora',    v_pct_admr,
    'negocio_editorial_id',  v_negocio.id,
    'territorio',            v_territorio_chave,
    'direito_codigo',        p_direito_codigo,
    'obra_coberta',          v_obra_coberta
  );

END;
$$;

-- ─── COMMENT ON FUNCTION — 8 Regras Máximas + Motor de Autorização ───────────

COMMENT ON FUNCTION validar_direito_administrado IS
  'MOTOR DE AUTORIZAÇÃO CENTRAL DO SYNC MOOD — v2 (Migration 042). '
  'Valida se uma administradora pode representar um direito jurídico de uma editora original '
  'em um território, data e obra específica, retornando os percentuais aplicáveis. '

  'PARÂMETROS: '
  '  p_editora_original_id: UUID da editora administrada/original. '
  '  p_administradora_id:   UUID da editora administradora/gestora. '
  '  p_direito_codigo:      Código jurídico canônico (ex: comunicacao_publico, distribuicao_meios). '
  '  p_territorio:          brasil | exterior | código ISO. '
  '  p_data_referencia:     Data de referência (DEFAULT CURRENT_DATE). '
  '  p_tenant_id:           Obrigatório quando chamado via service_role (bypassa RLS). '
  '  p_obra_id:             Obra específica (DEFAULT NULL = sem validação por obra). '

  'RETORNO JSONB: '
  '  { permitido, motivo, pct_editora_original, pct_administradora, '
  '    negocio_editorial_id, territorio, direito_codigo, obra_coberta }. '
  '  obra_coberta: TRUE/FALSE quando p_obra_id fornecido; NULL quando omitido. '

  '8 REGRAS MÁXIMAS DO SYNC MOOD: '
  '  1. O contrato manda. O sistema se adapta ao contrato. '
  '  2. nome_juridico é a verdade oficial. Nunca simplificar nomenclatura contratual. '
  '  3. Origens de receita apenas informam de onde veio o dinheiro. '
  '  4. O direito jurídico informa o que o contrato autoriza. '
  '  5. tipo_direito_id é obrigatório em todo módulo de licença/sync/autorização. '
  '  6. Nenhuma cobrança/licença/distribuição sem tipo_direito_id identificado. '
  '  7. DSPs com mapeamento_provisorio=TRUE — nunca assumir o direito automaticamente. '
  '  8. Negócio Editorial é a trava principal — sempre validar antes de operar. '

  'MÓDULOS OBRIGADOS (adoção gradual — pós Migration 042): '
  '  BackOffice, Recebimentos, Distribuição, Contratos, Licenciamento, '
  '  Sync, Audiovisual, Publicidade, Conta Corrente, Relatórios, BI, CWR.';
