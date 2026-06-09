-- Migration 046: Add sexo column to titulares table
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS sexo TEXT
    CHECK (
      sexo IS NULL OR sexo IN (
        'masculino',
        'feminino',
        'outro',
        'nao_informado'
      )
    );

COMMENT ON COLUMN titulares.sexo IS
  'Sexo declarado: masculino | feminino | outro | nao_informado';
