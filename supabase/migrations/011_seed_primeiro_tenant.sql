-- ============================================================
-- 011_seed_primeiro_tenant.sql
-- Execute APÓS criar o primeiro usuário no Supabase Auth
-- Substitua os valores abaixo antes de executar
-- ============================================================

-- 1. Criar o tenant master
INSERT INTO tenants (id, nome, slug, plano, ativo)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',  -- troque por um UUID real
  'Top Show Music',
  'topshow',
  'pro',
  TRUE
);

-- 2. Criar a editora principal
INSERT INTO editoras (id, tenant_id, razao_social, nome_fantasia, cnpj, pais, status)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'TOP SHOW MUSIC LIMIT',
  'Top Show Music',
  '00.000.000/0001-00',  -- preencher com CNPJ real
  'BR',
  'ativo'
);

-- 3. Vincular editora ao tenant
UPDATE tenants
SET editora_master_id = 'bbbbbbbb-0000-0000-0000-000000000001'
WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- 4. Criar o usuário master
-- ATENÇÃO: substitua 'SEU-AUTH-USER-ID' pelo UUID retornado pelo Supabase Auth
-- após criar o usuário em Authentication > Users no dashboard do Supabase
INSERT INTO usuarios (
  id, tenant_id, auth_user_id, email, nome, role, editora_id, ativo
)
VALUES (
  gen_random_uuid(),
  'aaaaaaaa-0000-0000-0000-000000000001',
  'SEU-AUTH-USER-ID',                        -- ← PREENCHER
  'admin@topshowmusic.com.br',               -- ← PREENCHER
  'Administrador Master',                    -- ← PREENCHER
  'master',
  'bbbbbbbb-0000-0000-0000-000000000001',
  TRUE
);

-- 5. Criar perfis padrão
INSERT INTO perfis (tenant_id, nome, role, permissoes, ativo) VALUES
('aaaaaaaa-0000-0000-0000-000000000001', 'Master',              'master',             '{"all": true}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Administrador',       'admin',              '{"all": true}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Editora Administrada','editora_administrada','{"obras": ["read","write"], "titulares": ["read","write"], "contratos": ["read","write"], "relatorios": ["read"]}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Autor / Titular',     'autor',              '{"portal": ["read"], "cc_titular": ["read"], "prestacao_contas": ["read"]}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Financeiro',          'financeiro',         '{"financeiro": ["read","write"], "distribuicao": ["read","write"], "cc_obra": ["read","write"], "cc_titular": ["read","write"]}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Jurídico',            'juridico',           '{"contratos": ["read","write"], "autorizacoes": ["read","write"], "modelos_juridicos": ["read","write"]}', TRUE),
('aaaaaaaa-0000-0000-0000-000000000001', 'Atendimento',         'atendimento',        '{"titulares": ["read","write"], "obras": ["read"], "contratos": ["read"]}', TRUE);
