-- ============================================================
-- 001_enums.sql — Sync Mood Gestão Inteligente
-- Todos os ENUM types do sistema
-- ============================================================

CREATE TYPE pessoa_tipo           AS ENUM ('PF', 'PJ');
CREATE TYPE status_geral          AS ENUM ('ativo', 'inativo');
CREATE TYPE tipo_titular          AS ENUM ('autor', 'compositor', 'interprete', 'produtor', 'editora', 'gravadora', 'cessionario');
CREATE TYPE tipo_conta_bancaria   AS ENUM ('corrente', 'poupanca', 'pagamento');
CREATE TYPE tipo_contrato         AS ENUM ('cessao', 'administracao', 'coedicao', 'subedicao', 'licenciamento', 'autorizacao');
CREATE TYPE status_contrato       AS ENUM ('ativo', 'encerrado', 'suspenso', 'em_analise');
CREATE TYPE direito_tipo          AS ENUM ('execucao_publica', 'reproducao', 'sincronizacao', 'digital', 'internacional');
CREATE TYPE status_obra           AS ENUM (
  'ativa', 'inativa', 'em_analise', 'rascunho', 'pre_cadastro',
  'pendente_contrato', 'pendente_percentual', 'pendente_validacao',
  'validada', 'enviada_sociedade', 'aguardando_retorno', 'bloqueada'
);
CREATE TYPE versao_fonograma      AS ENUM ('original', 'ao_vivo', 'remix', 'acustico', 'outro');
CREATE TYPE funcao_autor          AS ENUM ('autor', 'compositor', 'versionista', 'adaptador');
CREATE TYPE role_usuario          AS ENUM ('master', 'editora_administrada', 'autor', 'financeiro', 'juridico', 'atendimento', 'admin');
CREATE TYPE plano_tenant          AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE tipo_link             AS ENUM ('controlado', 'parcialmente_controlado', 'direto_sem_editora', 'editora_administrada', 'cessionario');
CREATE TYPE funcao_link           AS ENUM ('CA', 'V', 'SA', 'E', 'AM', 'SE', 'C', 'CE', 'A', 'I', 'M', 'T', 'AD', 'H');
CREATE TYPE status_controle       AS ENUM ('controlado', 'nao_controlado', 'contrato_pendente', 'contrato_validado', 'direto_pela_sociedade', 'administrado_por_terceiro', 'bloqueado');
CREATE TYPE origem_cadastro_obra  AS ENUM ('contrato_sistema', 'manual', 'migracao');
CREATE TYPE status_iswc           AS ENUM ('pendente', 'aguardando_retorno', 'recebido');
CREATE TYPE tipo_periodo_dist     AS ENUM ('mensal', 'trimestral');
CREATE TYPE status_periodo_dist   AS ENUM ('aberto', 'em_processamento', 'encerrado', 'cancelado');
CREATE TYPE status_distribuicao   AS ENUM ('previa', 'calculando', 'aprovacao', 'aprovada', 'executada', 'estornada');
CREATE TYPE tipo_movimento_obra   AS ENUM ('entrada', 'distribuicao', 'recoupment', 'retencao', 'taxa_administrativa', 'estorno', 'ajuste', 'bloqueio', 'liberacao');
CREATE TYPE tipo_movimento_tit    AS ENUM ('credito', 'debito', 'retencao', 'recoupment', 'pagamento', 'estorno', 'bloqueio', 'ajuste');
CREATE TYPE fonte_recebimento     AS ENUM ('ecad_socinpro', 'backoffice_music_services', 'sync', 'internacional', 'acordo_direto');
CREATE TYPE status_recebimento    AS ENUM ('importado', 'pendente_matching', 'em_conciliacao', 'conciliado', 'divergente', 'distribuido', 'auditado');
CREATE TYPE formato_importacao    AS ENUM ('pdf', 'xls', 'xlsx', 'csv', 'txt', 'xml');
CREATE TYPE tipo_importacao_log   AS ENUM ('CWR', 'DSP_TXT', 'XLSX', 'outro');
CREATE TYPE status_importacao     AS ENUM ('sucesso', 'parcial', 'erro');
