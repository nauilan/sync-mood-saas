-- Migration: adicionar campo metodo_assinatura na tabela contratos
-- Contexto: suporte ao fluxo de assinatura manual fora do D4Sign.
-- O DEFAULT 'd4sign' é para fluxo futuro, não retroativo:
-- contratos existentes recebem 'd4sign' mas podem não ter uuid_d4sign preenchido —
-- isso é aceitável, pois o campo serve apenas para diferenciar novos contratos criados
-- com o método manual do fluxo padrão D4Sign.
-- Safe para rodar em produção: ADD COLUMN IF NOT EXISTS com DEFAULT, sem lock prolongado.

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS metodo_assinatura TEXT DEFAULT 'd4sign'
    CHECK (metodo_assinatura IN ('d4sign', 'manual'));

COMMENT ON COLUMN contratos.metodo_assinatura IS
  'Método de assinatura: d4sign (padrão digital via D4Sign) ou manual (PDF assinado fora do sistema e enviado via upload).';
