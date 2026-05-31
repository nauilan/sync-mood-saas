-- ============================================================
-- Migration 00112 — Módulo 14: Configurações, Usuários, Perfis
-- Sync Mood Gestão Inteligente — Onda 7
-- ============================================================

-- usuarios_sistema
CREATE TABLE IF NOT EXISTS usuarios_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- usuarios_perfis
CREATE TYPE IF NOT EXISTS perfil_codigo_enum AS ENUM (
  'master', 'administrada', 'autor', 'financeiro', 'juridico', 'operacional'
);

CREATE TABLE IF NOT EXISTS usuarios_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
  editora_id TEXT NOT NULL,
  perfil_codigo perfil_codigo_enum NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- permissoes
CREATE TABLE IF NOT EXISTS permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  modulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  perfil_padrao_codigos TEXT[] NOT NULL DEFAULT '{}'
);

-- perfis_permissoes
CREATE TABLE IF NOT EXISTS perfis_permissoes (
  perfil_codigo perfil_codigo_enum NOT NULL,
  permissao_id UUID NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
  concedida BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (perfil_codigo, permissao_id)
);

-- modelos_contrato_config
CREATE TABLE IF NOT EXISTS modelos_contrato_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo_contrato TEXT NOT NULL,
  conteudo_template TEXT NOT NULL DEFAULT '',
  variaveis_json JSONB NOT NULL DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  editora_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- modelos_autorizacao_config
CREATE TABLE IF NOT EXISTS modelos_autorizacao_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo_autorizacao TEXT NOT NULL,
  template_text TEXT NOT NULL DEFAULT '',
  variaveis_json JSONB NOT NULL DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  editora_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- parametros_financeiros
CREATE TABLE IF NOT EXISTS parametros_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT NOT NULL,
  editora_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tipos_direitos_config
CREATE TYPE IF NOT EXISTS territorio_enum AS ENUM ('BR', 'EXT', 'GLOBAL');

CREATE TABLE IF NOT EXISTS tipos_direitos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  territorio territorio_enum NOT NULL,
  categoria TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- integracoes_externas
CREATE TYPE IF NOT EXISTS integracao_tipo_enum AS ENUM (
  'd4sign', 'docusign', 'icp_brasil', 'socinpro', 'backoffice_ms',
  'whatsapp_api', 'email_api', 'pix_api', 'banco_api'
);
CREATE TYPE IF NOT EXISTS integracao_status_enum AS ENUM ('ativa', 'inativa', 'erro');

CREATE TABLE IF NOT EXISTS integracoes_externas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo integracao_tipo_enum NOT NULL,
  status integracao_status_enum NOT NULL DEFAULT 'inativa',
  config_json JSONB NOT NULL DEFAULT '{}',
  ultimo_teste TIMESTAMPTZ,
  last_error TEXT,
  editora_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
  editora_id TEXT NOT NULL,
  modulo TEXT NOT NULL,
  acao TEXT NOT NULL,
  entidade_tipo TEXT NOT NULL,
  entidade_id TEXT,
  dados_antes_json JSONB,
  dados_depois_json JSONB,
  ip TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS POLICIES (multi-tenant)
-- ============================================================

ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_contrato_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_autorizacao_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_direitos_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE integracoes_externas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Master pode ver tudo
CREATE POLICY "master_all_usuarios_sistema" ON usuarios_sistema
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios_perfis up WHERE up.usuario_id = auth.uid()::uuid AND up.perfil_codigo = 'master' AND up.ativo = true)
  );

CREATE POLICY "master_all_usuarios_perfis" ON usuarios_perfis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios_perfis up WHERE up.usuario_id = auth.uid()::uuid AND up.perfil_codigo = 'master' AND up.ativo = true)
  );

CREATE POLICY "all_read_permissoes" ON permissoes
  FOR SELECT USING (true);

CREATE POLICY "master_write_permissoes" ON permissoes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios_perfis up WHERE up.usuario_id = auth.uid()::uuid AND up.perfil_codigo = 'master' AND up.ativo = true)
  );

CREATE POLICY "all_read_perfis_permissoes" ON perfis_permissoes
  FOR SELECT USING (true);

CREATE POLICY "tenant_modelos_contrato" ON modelos_contrato_config
  FOR ALL USING (
    editora_id IN (
      SELECT up.editora_id FROM usuarios_perfis up WHERE up.usuario_id = auth.uid()::uuid AND up.ativo = true
    )
  );

CREATE POLICY "tenant_modelos_autorizacao" ON modelos_autorizacao_config
  FOR ALL USING (
    editora_id IN (
      SELECT up.editora_id FROM usuarios_perfis up WHERE up.usuario_id = auth.uid()::uuid AND up.ativo = true
    )
  );

CREATE POLICY "tenant_parametros_financeiros" ON parametros_financeiros
  FOR ALL USING (
    editora_id IN (
      SELECT up.editora_id FROM usuarios_perfis up WHERE up.usuario_id = auth.uid()::uuid AND up.ativo = true
    )
  );

CREATE POLICY "all_read_tipos_direitos" ON tipos_direitos_config
  FOR SELECT USING (true);

CREATE POLICY "master_write_tipos_direitos" ON tipos_direitos_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios_perfis up WHERE up.usuario_id = auth.uid()::uuid AND up.perfil_codigo = 'master' AND up.ativo = true)
  );

CREATE POLICY "tenant_integracoes" ON integracoes_externas
  FOR ALL USING (
    editora_id IN (
      SELECT up.editora_id FROM usuarios_perfis up WHERE up.usuario_id = auth.uid()::uuid AND up.ativo = true
    )
  );

CREATE POLICY "tenant_audit_logs" ON audit_logs
  FOR SELECT USING (
    editora_id IN (
      SELECT up.editora_id FROM usuarios_perfis up WHERE up.usuario_id = auth.uid()::uuid AND up.ativo = true
    )
  );

-- ============================================================
-- SEEDS
-- ============================================================

-- Tipos de Direitos (15 BR + 7 EXT)
INSERT INTO tipos_direitos_config (codigo, nome, territorio, categoria, ativo) VALUES
  ('BR-a', 'Reprodução Gráfica (Edição)', 'BR', 'patrimonial', true),
  ('BR-b', 'Reprodução Fonomecânica', 'BR', 'patrimonial', true),
  ('BR-c', 'Inclusão/Adaptação Audiovisual', 'BR', 'patrimonial', true),
  ('BR-d', 'Inclusão/Adaptação Publicitária', 'BR', 'patrimonial', true),
  ('BR-e', 'Distribuição por Meios Digitais', 'BR', 'patrimonial', true),
  ('BR-f', 'Inclusão em Base de Dados', 'BR', 'patrimonial', true),
  ('BR-g', 'Comunicação ao Público', 'BR', 'patrimonial', true),
  ('BR-h', 'Autorizações com Ônus', 'BR', 'patrimonial', true),
  ('EXT-a', 'Reprodução Gráfica Exterior', 'EXT', 'patrimonial', true),
  ('EXT-b', 'Reprodução Fonomecânica Exterior', 'EXT', 'patrimonial', true),
  ('EXT-c', 'Inclusão Audiovisual Exterior', 'EXT', 'patrimonial', true),
  ('EXT-d', 'Inclusão Publicitária Exterior', 'EXT', 'patrimonial', true),
  ('EXT-e', 'Distribuição Digital Exterior', 'EXT', 'patrimonial', true),
  ('EXT-f', 'Base de Dados Exterior', 'EXT', 'patrimonial', true),
  ('EXT-g', 'Comunicação ao Público Exterior', 'EXT', 'patrimonial', true)
ON CONFLICT (codigo) DO NOTHING;

-- Parâmetros financeiros padrão
INSERT INTO parametros_financeiros (chave, valor, descricao, editora_id) VALUES
  ('taxa_administrativa_padrao', '10.00', 'Taxa administrativa padrão (%)', 'ed-tsm'),
  ('comissao_subeditor_padrao', '15.00', 'Comissão subeditora padrão (%)', 'ed-tsm'),
  ('irpf_aliquota', '15.00', 'Alíquota IRPF padrão para PF (%)', 'ed-tsm'),
  ('iss_aliquota', '5.00', 'Alíquota ISS (%)', 'ed-tsm'),
  ('taxa_recoupment_juros', '0.00', 'Juros sobre recoupment (%)', 'ed-tsm')
ON CONFLICT (chave) DO NOTHING;

-- Permissões (60+)
INSERT INTO permissoes (codigo, modulo, descricao, perfil_padrao_codigos) VALUES
  ('cadastros.titulares.view', 'M1 Cadastros', 'Visualizar titulares', ARRAY['master','administrada','operacional','financeiro','juridico']),
  ('cadastros.titulares.create', 'M1 Cadastros', 'Criar titulares', ARRAY['master','administrada','operacional']),
  ('cadastros.titulares.edit', 'M1 Cadastros', 'Editar titulares', ARRAY['master','administrada','operacional']),
  ('cadastros.titulares.delete', 'M1 Cadastros', 'Excluir titulares', ARRAY['master']),
  ('cadastros.editoras.view', 'M1 Cadastros', 'Visualizar editoras', ARRAY['master','financeiro','juridico']),
  ('cadastros.editoras.create', 'M1 Cadastros', 'Criar editoras', ARRAY['master']),
  ('cadastros.editoras.edit', 'M1 Cadastros', 'Editar editoras', ARRAY['master']),
  ('contratos.view', 'M2 Contratos', 'Visualizar contratos', ARRAY['master','administrada','juridico']),
  ('contratos.create', 'M2 Contratos', 'Criar contratos', ARRAY['master','administrada','juridico']),
  ('contratos.edit', 'M2 Contratos', 'Editar contratos', ARRAY['master','juridico']),
  ('contratos.validate', 'M2 Contratos', 'Validar contratos', ARRAY['master']),
  ('contratos.delete', 'M2 Contratos', 'Excluir contratos', ARRAY['master']),
  ('contratos.modelos.view', 'M2 Contratos', 'Visualizar modelos de contrato', ARRAY['master','juridico']),
  ('contratos.modelos.edit', 'M2 Contratos', 'Editar modelos de contrato', ARRAY['master']),
  ('obras.view', 'M3 Obras', 'Visualizar obras', ARRAY['master','administrada','operacional','financeiro','juridico','autor']),
  ('obras.create', 'M3 Obras', 'Criar obras', ARRAY['master','administrada','operacional']),
  ('obras.edit', 'M3 Obras', 'Editar obras', ARRAY['master','operacional']),
  ('obras.delete', 'M3 Obras', 'Excluir obras', ARRAY['master']),
  ('obras.exportar', 'M3 Obras', 'Exportar catálogo de obras', ARRAY['master','operacional']),
  ('autorizacoes.view', 'M4 Autorizações', 'Visualizar autorizações', ARRAY['master','administrada','juridico']),
  ('autorizacoes.create', 'M4 Autorizações', 'Criar autorizações', ARRAY['master','juridico']),
  ('autorizacoes.edit', 'M4 Autorizações', 'Editar autorizações', ARRAY['master','juridico']),
  ('autorizacoes.approve', 'M4 Autorizações', 'Aprovar autorizações', ARRAY['master']),
  ('autorizacoes.delete', 'M4 Autorizações', 'Excluir autorizações', ARRAY['master']),
  ('backoffice.view', 'M5 BackOffice', 'Visualizar exportações backoffice', ARRAY['master','operacional']),
  ('backoffice.execute', 'M5 BackOffice', 'Executar exportações backoffice', ARRAY['master','operacional']),
  ('recebimentos.view', 'M6 Recebimentos', 'Visualizar recebimentos', ARRAY['master','financeiro']),
  ('recebimentos.importar', 'M6 Recebimentos', 'Importar recebimentos', ARRAY['master','financeiro']),
  ('recebimentos.divergencias.resolve', 'M6 Recebimentos', 'Resolver divergências', ARRAY['master','financeiro']),
  ('tv.view', 'M6 TV', 'Visualizar módulo TV', ARRAY['master','financeiro','operacional']),
  ('tv.importar', 'M6 TV', 'Importar execuções TV', ARRAY['master','operacional']),
  ('tv.cobranca', 'M6 TV', 'Executar cobrança TV', ARRAY['master','financeiro']),
  ('conciliacao.view', 'M7 Conciliação', 'Visualizar conciliações', ARRAY['master','financeiro']),
  ('conciliacao.execute', 'M7 Conciliação', 'Executar conciliação', ARRAY['master','financeiro']),
  ('distribuicao.view', 'M8 Distribuição', 'Visualizar distribuições', ARRAY['master','financeiro']),
  ('distribuicao.execute', 'M8 Distribuição', 'Executar distribuição', ARRAY['master','financeiro']),
  ('cc_obra.view', 'M9 Conta Corrente', 'Visualizar CC de obras', ARRAY['master','financeiro']),
  ('cc_titular.view', 'M9 Conta Corrente', 'Visualizar CC de titulares', ARRAY['master','financeiro','autor']),
  ('prestacao.view', 'M10 Prestação de Contas', 'Visualizar prestações de contas', ARRAY['master','financeiro','autor']),
  ('prestacao.create', 'M10 Prestação de Contas', 'Criar prestações de contas', ARRAY['master','financeiro']),
  ('prestacao.enviar', 'M10 Prestação de Contas', 'Enviar prestações de contas', ARRAY['master','financeiro']),
  ('financeiro.view', 'M11 Financeiro', 'Visualizar financeiro', ARRAY['master','financeiro']),
  ('financeiro.pagamentos.view', 'M11 Financeiro', 'Visualizar pagamentos', ARRAY['master','financeiro']),
  ('financeiro.pagamentos.execute', 'M11 Financeiro', 'Executar pagamentos PIX/TED', ARRAY['master','financeiro']),
  ('financeiro.contas.view', 'M11 Financeiro', 'Visualizar contas bancárias', ARRAY['master','financeiro']),
  ('relatorios.view', 'M12-13 Relatórios', 'Visualizar relatórios', ARRAY['master','financeiro','juridico','operacional']),
  ('relatorios.export', 'M12-13 Relatórios', 'Exportar relatórios', ARRAY['master','financeiro']),
  ('relatorios.bi_estrategico', 'M12-13 Relatórios', 'Acesso ao BI Estratégico', ARRAY['master']),
  ('relatorios.auditoria', 'M12-13 Relatórios', 'Acesso a relatórios de auditoria', ARRAY['master']),
  ('config.usuarios.view', 'M14 Configurações', 'Visualizar usuários', ARRAY['master']),
  ('config.usuarios.create', 'M14 Configurações', 'Criar usuários', ARRAY['master']),
  ('config.usuarios.edit', 'M14 Configurações', 'Editar usuários', ARRAY['master']),
  ('config.usuarios.bloquear', 'M14 Configurações', 'Bloquear usuários', ARRAY['master']),
  ('config.perfis.view', 'M14 Configurações', 'Visualizar perfis', ARRAY['master']),
  ('config.perfis.edit', 'M14 Configurações', 'Editar perfis e permissões', ARRAY['master']),
  ('config.parametros.view', 'M14 Configurações', 'Visualizar parâmetros', ARRAY['master','financeiro']),
  ('config.parametros.edit', 'M14 Configurações', 'Editar parâmetros financeiros', ARRAY['master']),
  ('config.integracoes.view', 'M14 Configurações', 'Visualizar integrações', ARRAY['master']),
  ('config.integracoes.edit', 'M14 Configurações', 'Configurar integrações', ARRAY['master']),
  ('config.auditoria.view', 'M14 Configurações', 'Visualizar audit logs', ARRAY['master']),
  ('portal.obras.view', 'Portal Autor', 'Ver próprias obras no portal', ARRAY['autor']),
  ('portal.recebimentos.view', 'Portal Autor', 'Ver recebimentos no portal', ARRAY['autor']),
  ('portal.demonstrativos.view', 'Portal Autor', 'Ver demonstrativos no portal', ARRAY['autor']),
  ('portal.recibos.view', 'Portal Autor', 'Ver recibos no portal', ARRAY['autor']),
  ('portal.royalties_futuros.view', 'Portal Autor', 'Ver royalties futuros no portal', ARRAY['autor']),
  ('portal.informe_rendimentos.view', 'Portal Autor', 'Ver informe de rendimentos', ARRAY['autor'])
ON CONFLICT (codigo) DO NOTHING;
