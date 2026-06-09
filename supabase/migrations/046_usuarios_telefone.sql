-- Migration 046 — Adiciona campos complementares à tabela usuarios
-- Coluna telefone: usada na criação de usuários pelo Master

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS telefone TEXT;

COMMENT ON COLUMN usuarios.telefone IS 'Telefone de contato do usuário (opcional)';
