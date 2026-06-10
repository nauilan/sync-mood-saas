-- Migration 049: adiciona valores ao enum status_contrato para suporte D4Sign
-- Run em: Supabase SQL Editor

-- Adiciona novos valores ao enum (se ainda não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'aguardando_assinatura'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_contrato')
  ) THEN
    ALTER TYPE status_contrato ADD VALUE 'aguardando_assinatura';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'em_assinatura'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_contrato')
  ) THEN
    ALTER TYPE status_contrato ADD VALUE 'em_assinatura';
  END IF;
END$$;

-- Validação
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_contrato')
ORDER BY enumsortorder;
