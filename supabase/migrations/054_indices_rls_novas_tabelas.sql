-- Migration 054: RLS básico para autorizacoes e cobracas
-- Executar no Supabase SQL Editor

-- ── 1. RLS em autorizacoes ──────────────────────────────────────────────────
ALTER TABLE autorizacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_autorizacoes_tenant ON autorizacoes;
CREATE POLICY rls_autorizacoes_tenant ON autorizacoes
  USING (
    tenant_id = (
      SELECT tenant_id FROM usuarios
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- ── 2. RLS em cobracas ──────────────────────────────────────────────────────
ALTER TABLE cobracas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_cobracas_tenant ON cobracas;
CREATE POLICY rls_cobracas_tenant ON cobracas
  USING (
    tenant_id = (
      SELECT tenant_id FROM usuarios
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- ── 3. Índices complementares ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_autorizacoes_obra_id
  ON autorizacoes (obra_id);
CREATE INDEX IF NOT EXISTS idx_cobracas_data_vencimento
  ON cobracas (data_vencimento) WHERE data_vencimento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cobracas_created_at
  ON cobracas (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_created_at
  ON autorizacoes (created_at DESC);

-- ── Validação final ──────────────────────────────────────────────────────────
SELECT
  t.tablename,
  COUNT(p.policyname) AS policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.tablename IN ('autorizacoes','cobracas')
GROUP BY t.tablename;
