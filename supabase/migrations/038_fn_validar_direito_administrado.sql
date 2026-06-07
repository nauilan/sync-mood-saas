-- Migration 038 — Função Central de Validação de Direitos Administrados
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- REGRA ARQUITETURAL FUNDAMENTAL — DEVE SER LIDA POR TODOS OS MÓDULOS:
--
--   Os campos direitos_brasil / direitos_exterior NÃO são apenas informação visual.
--   Eles são uma TRAVA OPERACIONAL do sistema.
--
--   Se um direito NÃO está marcado para um território:
--   ✗ Não pode cobrar receita desse direito/território
--   ✗ Não pode importar recebimento de BackOffice para esse negócio
--   ✗ Não pode gerar distribuição vinculada a esse negócio
--   ✗ Não pode emitir licença em nome do catálogo daquela editora
--   ✗ Não pode gerar conta corrente para esse direito
--   ✗ Não aparece como AM no CWR para esse território/direito
--
--   Se o direito ESTÁ marcado:
--   ✓ Aplicar os percentuais específicos daquele direito/território
--   ✓ Se não houver percentual específico, usar o percentual padrão do negócio
--   ✓ Os percentuais incidem SOMENTE sobre a parcela editorial da editora original
--
-- HIERARQUIA FINANCEIRA (não confundir):
--   1. Percentual autoral da obra          (autor vs. editora)
--   2. Percentual editorial da editora     (depois dos autores)
--   3. Percentual de administração         (editora original vs. administradora)
--   Esta função opera apenas sobre o nível 3.
--
-- MÓDULOS QUE DEVEM CHAMAR ESTA FUNÇÃO:
--   - Importação de receitas BackOffice / UBEM
--   - Recebimentos manuais
--   - Contratos confeccionados no sistema
--   - Inclusão de obras em fonogramas
--   - Emissão de licenças (sync, audiovisual, publicidade)
--   - Conta corrente da obra
--   - Distribuição para titulares
--   - Geração / validação de CWR
--   - Painel Analítico
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION validar_direito_administrado(
  p_editora_original_id   UUID,
  p_administradora_id     UUID,
  p_direito_codigo        TEXT,
  p_territorio            TEXT,   -- 'brasil' | 'exterior' | código ISO (ex: 'AR', 'US')
  p_data_referencia       DATE    DEFAULT CURRENT_DATE,
  p_tenant_id             UUID    DEFAULT NULL
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
      'direito_codigo',        p_direito_codigo
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
                                 || ' no negócio editorial '
                                 || v_negocio.nome,
      'pct_editora_original',  NULL,
      'pct_administradora',    NULL,
      'negocio_editorial_id',  v_negocio.id,
      'territorio',            v_territorio_chave,
      'direito_codigo',        p_direito_codigo
    );
  END IF;

  -- ── 5. Obter percentuais — específico por direito ou padrão do negócio ────
  IF v_percentuais IS NOT NULL AND v_percentuais ? p_direito_codigo THEN
    -- Percentual específico cadastrado para este direito/território
    v_pct_orig := (v_percentuais -> p_direito_codigo ->> 'administrada')::NUMERIC;
    v_pct_admr := (v_percentuais -> p_direito_codigo ->> 'administradora')::NUMERIC;
  ELSE
    -- Fallback: percentual padrão do contrato
    v_pct_orig := v_negocio.percentual_administrada;
    v_pct_admr := v_negocio.percentual_administradora;
  END IF;

  -- ── 6. Retornar resultado autorizado ──────────────────────────────────────
  RETURN jsonb_build_object(
    'permitido',             TRUE,
    'motivo',                'Autorizado — negócio editorial ativo: ' || v_negocio.nome,
    'pct_editora_original',  v_pct_orig,
    'pct_administradora',    v_pct_admr,
    'negocio_editorial_id',  v_negocio.id,
    'territorio',            v_territorio_chave,
    'direito_codigo',        p_direito_codigo
  );

END;
$$;

COMMENT ON FUNCTION validar_direito_administrado IS
  'Trava operacional central do Sync Mood. '
  'Valida se uma administradora pode representar um direito específico de uma editora original '
  'em um território e data, retornando os percentuais aplicáveis. '
  'p_tenant_id: obrigatório quando chamado via service_role (bypassa RLS). '
  'OBRIGATÓRIO em todos os módulos que geram receita, licença, cobrança, importação ou distribuição. '
  'Retorna JSONB: { permitido, motivo, pct_editora_original, pct_administradora, negocio_editorial_id, territorio, direito_codigo }';
