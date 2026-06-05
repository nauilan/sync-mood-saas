-- migration 024: adiciona campos CWR e identificação à tabela editoras
-- codigo_interno_cwr: código interno usado no arquivo CWR (ex: TS01)
-- pais_registro: país de registro da editora (padrão BR)
-- codigo_ecad: código de cadastro no ECAD

ALTER TABLE editoras
  ADD COLUMN IF NOT EXISTS codigo_interno_cwr  TEXT,
  ADD COLUMN IF NOT EXISTS pais_registro       TEXT DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS codigo_ecad         TEXT;

COMMENT ON COLUMN editoras.codigo_interno_cwr IS 'Código interno usado no arquivo CWR para identificar a editora (ex: TS01, ED01)';
COMMENT ON COLUMN editoras.pais_registro      IS 'País de registro da editora (ISO 3166-1 alpha-2, ex: BR, US)';
COMMENT ON COLUMN editoras.codigo_ecad        IS 'Código de cadastro da editora no ECAD';
