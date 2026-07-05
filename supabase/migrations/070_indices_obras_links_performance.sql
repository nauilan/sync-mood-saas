-- Migration 070: índices compostos para melhorar performance do espelho de obra
-- Sem esses índices, queries filtradas por tenant_id fazem Seq Scan completo
-- com volumes maiores (>50k obras). IF NOT EXISTS = idempotente, seguro re-executar.

CREATE INDEX IF NOT EXISTS idx_obras_links_tenant_obra
  ON obras_links(tenant_id, obra_id);

CREATE INDEX IF NOT EXISTS idx_olt_tenant_link
  ON obras_links_titulares(tenant_id, obra_link_id);
