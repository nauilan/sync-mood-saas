ALTER TABLE exportacoes
ADD COLUMN IF NOT EXISTS cwr_version TEXT NOT NULL DEFAULT '2.1';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exportacoes_cwr_version_check'
  ) THEN
    ALTER TABLE exportacoes
    ADD CONSTRAINT exportacoes_cwr_version_check
    CHECK (cwr_version IN ('2.1', '2.2'));
  END IF;
END $$;