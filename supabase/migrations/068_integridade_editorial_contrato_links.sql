ALTER TABLE obras_links_titulares
  ADD COLUMN IF NOT EXISTS percentual_controle_brasil NUMERIC,
  ADD COLUMN IF NOT EXISTS percentual_controle_exterior NUMERIC,
  ADD COLUMN IF NOT EXISTS data_contrato DATE,
  ADD COLUMN IF NOT EXISTS tipo_contrato TEXT,
  ADD COLUMN IF NOT EXISTS territorio_contrato TEXT,
  ADD COLUMN IF NOT EXISTS prazo_contrato TEXT,
  ADD COLUMN IF NOT EXISTS validacao_contratual_origem TEXT
    CHECK (validacao_contratual_origem IN ('contrato','declaratoria','cwr_validado')),
  ADD COLUMN IF NOT EXISTS validado_por_usuario_id UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS validado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS referencia_documental TEXT,
  ADD COLUMN IF NOT EXISTS observacao_validacao TEXT;

ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS validacao_editorial_origem TEXT
    CHECK (validacao_editorial_origem IN ('contrato','declaratoria','cwr_validado')),
  ADD COLUMN IF NOT EXISTS validacao_editorial_referencia TEXT,
  ADD COLUMN IF NOT EXISTS validacao_editorial_usuario_id UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS validacao_editorial_em TIMESTAMPTZ;