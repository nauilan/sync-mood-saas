// ============================================================
// mock-config.ts — Módulo 14: Configurações, Usuários, Perfis
// Sync Mood Gestão Inteligente — DEMO_MODE Onda 7
// ============================================================

import type {
  UsuarioSistema, UsuarioPerfil, Permissao, PerfilCompleto,
  PerfilPermissao, ModeloContratoConfig, ModeloAutorizacaoConfig,
  ParametroFinanceiro, TipoDireitoConfig, IntegracaoExterna, AuditLog,
  PerfilCodigo,
} from './types-config'

// ============================================================
// USUÁRIOS DO SISTEMA
// ============================================================

export const MOCK_USUARIOS: UsuarioSistema[] = []

// ============================================================
// PERFIS DOS USUÁRIOS
// ============================================================

export const MOCK_USUARIOS_PERFIS: UsuarioPerfil[] = []

// ============================================================
// PERFIS COMPLETOS
// ============================================================

export const MOCK_PERFIS: PerfilCompleto[] = [
  {
    codigo: 'master',
    nome: 'Master / Administradora',
    descricao: 'Acesso total ao sistema. Valida contratos, consolida catálogo, exporta, distribui.',
    cor: 'violet',
    icone: 'Crown',
    permissoes: [],
  },
  {
    codigo: 'administrada',
    nome: 'Editora Administrada',
    descricao: 'Acesso ao próprio catálogo, autores, contratos e relatórios. Validação final pelo master.',
    cor: 'blue',
    icone: 'Building2',
    permissoes: [],
  },
  {
    codigo: 'autor',
    nome: 'Autor / Compositor',
    descricao: 'Acesso apenas ao Portal do Autor: obras, recebimentos, demonstrativos, royalties futuros.',
    cor: 'emerald',
    icone: 'Music',
    permissoes: [],
  },
  {
    codigo: 'financeiro',
    nome: 'Financeiro',
    descricao: 'Recebimentos, distribuição, conta corrente, financeiro e relatórios financeiros.',
    cor: 'amber',
    icone: 'DollarSign',
    permissoes: [],
  },
  {
    codigo: 'juridico',
    nome: 'Jurídico',
    descricao: 'Contratos, autorizações, documentos, modelos jurídicos.',
    cor: 'sky',
    icone: 'Scale',
    permissoes: [],
  },
  {
    codigo: 'operacional',
    nome: 'Operacional',
    descricao: 'Cadastros, obras, exportações backoffice.',
    cor: 'rose',
    icone: 'Settings',
    permissoes: [],
  },
]

// ============================================================
// PERMISSÕES (amostra representativa)
// ============================================================

export const MOCK_PERMISSOES: Permissao[] = [
  { id: 'perm-001', codigo: 'cadastros.titulares.view', modulo: 'M1 Cadastros', descricao: 'Visualizar titulares', perfil_padrao_codigos: ['master','administrada','operacional','financeiro','juridico'] },
  { id: 'perm-002', codigo: 'cadastros.titulares.create', modulo: 'M1 Cadastros', descricao: 'Criar titulares', perfil_padrao_codigos: ['master','administrada','operacional'] },
  { id: 'perm-003', codigo: 'cadastros.titulares.edit', modulo: 'M1 Cadastros', descricao: 'Editar titulares', perfil_padrao_codigos: ['master','administrada','operacional'] },
  { id: 'perm-004', codigo: 'cadastros.titulares.delete', modulo: 'M1 Cadastros', descricao: 'Excluir titulares', perfil_padrao_codigos: ['master'] },
  { id: 'perm-005', codigo: 'cadastros.editoras.view', modulo: 'M1 Cadastros', descricao: 'Visualizar editoras', perfil_padrao_codigos: ['master','financeiro','juridico'] },
  { id: 'perm-006', codigo: 'cadastros.editoras.create', modulo: 'M1 Cadastros', descricao: 'Criar editoras', perfil_padrao_codigos: ['master'] },
  { id: 'perm-007', codigo: 'cadastros.editoras.edit', modulo: 'M1 Cadastros', descricao: 'Editar editoras', perfil_padrao_codigos: ['master'] },
  { id: 'perm-008', codigo: 'contratos.view', modulo: 'M2 Contratos', descricao: 'Visualizar contratos', perfil_padrao_codigos: ['master','administrada','juridico'] },
  { id: 'perm-009', codigo: 'contratos.create', modulo: 'M2 Contratos', descricao: 'Criar contratos', perfil_padrao_codigos: ['master','administrada','juridico'] },
  { id: 'perm-010', codigo: 'contratos.edit', modulo: 'M2 Contratos', descricao: 'Editar contratos', perfil_padrao_codigos: ['master','juridico'] },
  { id: 'perm-011', codigo: 'contratos.validate', modulo: 'M2 Contratos', descricao: 'Validar contratos', perfil_padrao_codigos: ['master'] },
  { id: 'perm-012', codigo: 'contratos.delete', modulo: 'M2 Contratos', descricao: 'Excluir contratos', perfil_padrao_codigos: ['master'] },
  { id: 'perm-013', codigo: 'contratos.modelos.view', modulo: 'M2 Contratos', descricao: 'Visualizar modelos de contrato', perfil_padrao_codigos: ['master','juridico'] },
  { id: 'perm-014', codigo: 'contratos.modelos.edit', modulo: 'M2 Contratos', descricao: 'Editar modelos de contrato', perfil_padrao_codigos: ['master'] },
  { id: 'perm-015', codigo: 'obras.view', modulo: 'M3 Obras', descricao: 'Visualizar obras', perfil_padrao_codigos: ['master','administrada','operacional','financeiro','juridico','autor'] },
  { id: 'perm-016', codigo: 'obras.create', modulo: 'M3 Obras', descricao: 'Criar obras', perfil_padrao_codigos: ['master','administrada','operacional'] },
  { id: 'perm-017', codigo: 'obras.edit', modulo: 'M3 Obras', descricao: 'Editar obras', perfil_padrao_codigos: ['master','operacional'] },
  { id: 'perm-018', codigo: 'obras.delete', modulo: 'M3 Obras', descricao: 'Excluir obras', perfil_padrao_codigos: ['master'] },
  { id: 'perm-019', codigo: 'obras.exportar', modulo: 'M3 Obras', descricao: 'Exportar catálogo de obras', perfil_padrao_codigos: ['master','operacional'] },
  { id: 'perm-020', codigo: 'autorizacoes.view', modulo: 'M4 Autorizações', descricao: 'Visualizar autorizações', perfil_padrao_codigos: ['master','administrada','juridico'] },
  { id: 'perm-021', codigo: 'autorizacoes.create', modulo: 'M4 Autorizações', descricao: 'Criar autorizações', perfil_padrao_codigos: ['master','juridico'] },
  { id: 'perm-022', codigo: 'autorizacoes.edit', modulo: 'M4 Autorizações', descricao: 'Editar autorizações', perfil_padrao_codigos: ['master','juridico'] },
  { id: 'perm-023', codigo: 'autorizacoes.approve', modulo: 'M4 Autorizações', descricao: 'Aprovar autorizações', perfil_padrao_codigos: ['master'] },
  { id: 'perm-024', codigo: 'autorizacoes.delete', modulo: 'M4 Autorizações', descricao: 'Excluir autorizações', perfil_padrao_codigos: ['master'] },
  { id: 'perm-025', codigo: 'backoffice.view', modulo: 'M5 BackOffice', descricao: 'Visualizar exportações backoffice', perfil_padrao_codigos: ['master','operacional'] },
  { id: 'perm-026', codigo: 'backoffice.execute', modulo: 'M5 BackOffice', descricao: 'Executar exportações backoffice', perfil_padrao_codigos: ['master','operacional'] },
  { id: 'perm-027', codigo: 'recebimentos.view', modulo: 'M6 Recebimentos', descricao: 'Visualizar recebimentos', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-028', codigo: 'recebimentos.importar', modulo: 'M6 Recebimentos', descricao: 'Importar recebimentos', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-029', codigo: 'recebimentos.divergencias.resolve', modulo: 'M6 Recebimentos', descricao: 'Resolver divergências', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-030', codigo: 'tv.view', modulo: 'M6 TV', descricao: 'Visualizar módulo TV', perfil_padrao_codigos: ['master','financeiro','operacional'] },
  { id: 'perm-031', codigo: 'tv.importar', modulo: 'M6 TV', descricao: 'Importar execuções TV', perfil_padrao_codigos: ['master','operacional'] },
  { id: 'perm-032', codigo: 'tv.cobranca', modulo: 'M6 TV', descricao: 'Executar cobrança TV', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-033', codigo: 'conciliacao.view', modulo: 'M7 Conciliação', descricao: 'Visualizar conciliações', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-034', codigo: 'conciliacao.execute', modulo: 'M7 Conciliação', descricao: 'Executar conciliação', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-035', codigo: 'distribuicao.view', modulo: 'M8 Distribuição', descricao: 'Visualizar distribuições', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-036', codigo: 'distribuicao.execute', modulo: 'M8 Distribuição', descricao: 'Executar distribuição', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-037', codigo: 'cc_obra.view', modulo: 'M9 Conta Corrente', descricao: 'Visualizar CC de obras', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-038', codigo: 'cc_titular.view', modulo: 'M9 Conta Corrente', descricao: 'Visualizar CC de titulares', perfil_padrao_codigos: ['master','financeiro','autor'] },
  { id: 'perm-039', codigo: 'prestacao.view', modulo: 'M10 Prestação', descricao: 'Visualizar prestações de contas', perfil_padrao_codigos: ['master','financeiro','autor'] },
  { id: 'perm-040', codigo: 'prestacao.create', modulo: 'M10 Prestação', descricao: 'Criar prestações de contas', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-041', codigo: 'prestacao.enviar', modulo: 'M10 Prestação', descricao: 'Enviar prestações de contas', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-042', codigo: 'financeiro.view', modulo: 'M11 Financeiro', descricao: 'Visualizar financeiro', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-043', codigo: 'financeiro.pagamentos.view', modulo: 'M11 Financeiro', descricao: 'Visualizar pagamentos', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-044', codigo: 'financeiro.pagamentos.execute', modulo: 'M11 Financeiro', descricao: 'Executar pagamentos PIX/TED', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-045', codigo: 'financeiro.contas.view', modulo: 'M11 Financeiro', descricao: 'Visualizar contas bancárias', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-046', codigo: 'relatorios.view', modulo: 'M12-13 Relatórios', descricao: 'Visualizar relatórios', perfil_padrao_codigos: ['master','financeiro','juridico','operacional'] },
  { id: 'perm-047', codigo: 'relatorios.export', modulo: 'M12-13 Relatórios', descricao: 'Exportar relatórios', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-048', codigo: 'relatorios.bi_estrategico', modulo: 'M12-13 Relatórios', descricao: 'Acesso ao BI Estratégico', perfil_padrao_codigos: ['master'] },
  { id: 'perm-049', codigo: 'relatorios.auditoria', modulo: 'M12-13 Relatórios', descricao: 'Acesso a relatórios de auditoria', perfil_padrao_codigos: ['master'] },
  { id: 'perm-050', codigo: 'config.usuarios.view', modulo: 'M14 Configurações', descricao: 'Visualizar usuários', perfil_padrao_codigos: ['master'] },
  { id: 'perm-051', codigo: 'config.usuarios.create', modulo: 'M14 Configurações', descricao: 'Criar usuários', perfil_padrao_codigos: ['master'] },
  { id: 'perm-052', codigo: 'config.usuarios.edit', modulo: 'M14 Configurações', descricao: 'Editar usuários', perfil_padrao_codigos: ['master'] },
  { id: 'perm-053', codigo: 'config.usuarios.bloquear', modulo: 'M14 Configurações', descricao: 'Bloquear usuários', perfil_padrao_codigos: ['master'] },
  { id: 'perm-054', codigo: 'config.perfis.view', modulo: 'M14 Configurações', descricao: 'Visualizar perfis', perfil_padrao_codigos: ['master'] },
  { id: 'perm-055', codigo: 'config.perfis.edit', modulo: 'M14 Configurações', descricao: 'Editar perfis e permissões', perfil_padrao_codigos: ['master'] },
  { id: 'perm-056', codigo: 'config.parametros.view', modulo: 'M14 Configurações', descricao: 'Visualizar parâmetros', perfil_padrao_codigos: ['master','financeiro'] },
  { id: 'perm-057', codigo: 'config.parametros.edit', modulo: 'M14 Configurações', descricao: 'Editar parâmetros financeiros', perfil_padrao_codigos: ['master'] },
  { id: 'perm-058', codigo: 'config.integracoes.view', modulo: 'M14 Configurações', descricao: 'Visualizar integrações', perfil_padrao_codigos: ['master'] },
  { id: 'perm-059', codigo: 'config.integracoes.edit', modulo: 'M14 Configurações', descricao: 'Configurar integrações', perfil_padrao_codigos: ['master'] },
  { id: 'perm-060', codigo: 'config.auditoria.view', modulo: 'M14 Configurações', descricao: 'Visualizar audit logs', perfil_padrao_codigos: ['master'] },
  { id: 'perm-061', codigo: 'portal.obras.view', modulo: 'Portal Autor', descricao: 'Ver próprias obras no portal', perfil_padrao_codigos: ['autor'] },
  { id: 'perm-062', codigo: 'portal.recebimentos.view', modulo: 'Portal Autor', descricao: 'Ver recebimentos no portal', perfil_padrao_codigos: ['autor'] },
  { id: 'perm-063', codigo: 'portal.demonstrativos.view', modulo: 'Portal Autor', descricao: 'Ver demonstrativos no portal', perfil_padrao_codigos: ['autor'] },
  { id: 'perm-064', codigo: 'portal.recibos.view', modulo: 'Portal Autor', descricao: 'Ver recibos no portal', perfil_padrao_codigos: ['autor'] },
  { id: 'perm-065', codigo: 'portal.royalties_futuros.view', modulo: 'Portal Autor', descricao: 'Ver royalties futuros no portal', perfil_padrao_codigos: ['autor'] },
  { id: 'perm-066', codigo: 'portal.informe_rendimentos.view', modulo: 'Portal Autor', descricao: 'Ver informe de rendimentos', perfil_padrao_codigos: ['autor'] },
]

// ============================================================
// MODELOS DE CONTRATO
// ============================================================

export const MOCK_MODELOS_CONTRATO: ModeloContratoConfig[] = [
  { id: 'mc-001', codigo: 'CESSAO-PARCIAL-BR', nome: 'Cessão Parcial BR (Padrão)', tipo_contrato: 'cessao_parcial', conteudo_template: 'Pelo presente instrumento particular, {{NOME_AUTOR}}, portador do CPF {{CPF_AUTOR}}, cede parcialmente os direitos patrimoniais da obra {{TITULO_OBRA}} à {{NOME_EDITORA}}, CNPJ {{CNPJ_EDITORA}}, nos termos a seguir definidos...', variaveis_json: { NOME_AUTOR: 'string', CPF_AUTOR: 'string', TITULO_OBRA: 'string', NOME_EDITORA: 'string', CNPJ_EDITORA: 'string', PERCENTUAL_AUTORES: 'number', PERCENTUAL_EDITORA: 'number' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-01-15T10:00:00Z' },
  { id: 'mc-002', codigo: 'CESSAO-TOTAL', nome: 'Cessão Total (Compra de Catálogo)', tipo_contrato: 'cessao_total', conteudo_template: 'Pelo presente instrumento, {{NOME_CEDENTE}} transfere integralmente todos os direitos patrimoniais...', variaveis_json: { NOME_CEDENTE: 'string', VALOR_COMPRA: 'number' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-01-15T10:00:00Z' },
  { id: 'mc-003', codigo: 'LICENCIAMENTO', nome: 'Licenciamento por Período', tipo_contrato: 'licenciamento', conteudo_template: 'Licenciamento da obra {{TITULO_OBRA}} pelo período de {{PRAZO_MESES}} meses...', variaveis_json: { TITULO_OBRA: 'string', PRAZO_MESES: 'number' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-01-15T10:00:00Z' },
  { id: 'mc-004', codigo: 'ADM-EDITORIAL', nome: 'Administração Editorial', tipo_contrato: 'administracao_editorial', conteudo_template: 'A {{NOME_ADMINISTRADORA}} se compromete a administrar editorialmente as obras de {{NOME_EDITORA_ORIGINAL}}...', variaveis_json: { NOME_ADMINISTRADORA: 'string', NOME_EDITORA_ORIGINAL: 'string' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-01-15T10:00:00Z' },
  { id: 'mc-005', codigo: 'COEDICAO', nome: 'Coedição Editorial', tipo_contrato: 'coedicao', conteudo_template: 'As editoras {{EDITORA_A}} e {{EDITORA_B}} celebram coedição da obra {{TITULO_OBRA}}...', variaveis_json: { EDITORA_A: 'string', EDITORA_B: 'string', TITULO_OBRA: 'string' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-06-01T10:00:00Z' },
  { id: 'mc-006', codigo: 'SUBEDICAO', nome: 'Subedição Internacional', tipo_contrato: 'subedicao', conteudo_template: 'A subeditora {{NOME_SUBEDITORA}} representa o catálogo no território {{TERRITORIO}}...', variaveis_json: { NOME_SUBEDITORA: 'string', TERRITORIO: 'string' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-06-01T10:00:00Z' },
  { id: 'mc-007', codigo: 'CESSAO-INTL', nome: 'Cessão Internacional', tipo_contrato: 'cessao_internacional', conteudo_template: 'Cessão dos direitos do EXTERIOR para a obra {{TITULO_OBRA}}...', variaveis_json: { TITULO_OBRA: 'string' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-06-01T10:00:00Z' },
  { id: 'mc-008', codigo: 'CESSIONARIO-PJ', nome: 'Cessão Cessionário PJ', tipo_contrato: 'cessionario_pj', conteudo_template: 'O autor {{NOME_AUTOR}} cede os recebimentos para a PJ {{NOME_PJ}}, CNPJ {{CNPJ_PJ}}...', variaveis_json: { NOME_AUTOR: 'string', NOME_PJ: 'string', CNPJ_PJ: 'string' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-06-01T10:00:00Z' },
  { id: 'mc-009', codigo: 'EXCLUSIVIDADE-AUTORAL', nome: 'Exclusividade Autoral', tipo_contrato: 'exclusividade_autoral', conteudo_template: 'O autor {{NOME_AUTOR}} se compromete a registrar todas suas obras exclusivamente pela {{NOME_EDITORA}} pelo prazo de {{PRAZO_ANOS}} anos...', variaveis_json: { NOME_AUTOR: 'string', NOME_EDITORA: 'string', PRAZO_ANOS: 'number' }, ativo: true, editora_id: 'ed-tsm', created_at: '2021-01-01T10:00:00Z' },
]

// ============================================================
// MODELOS DE AUTORIZAÇÃO
// ============================================================

export const MOCK_MODELOS_AUTORIZACAO: ModeloAutorizacaoConfig[] = [
  { id: 'ma-001', codigo: 'AUT-FONOGRAMA', nome: 'Autorização de Inclusão em Fonograma', tipo_autorizacao: 'fonograma', template_text: 'Autorizamos a inclusão da obra {{TITULO_OBRA}} no fonograma do intérprete {{INTERPRETE}}, gravadora {{GRAVADORA}}...', variaveis_json: { TITULO_OBRA: 'string', INTERPRETE: 'string', GRAVADORA: 'string' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-01-15T10:00:00Z' },
  { id: 'ma-002', codigo: 'AUT-SYNC', nome: 'Autorização de Sincronização Audiovisual', tipo_autorizacao: 'sincronizacao', template_text: 'Autorizamos a sincronização da obra {{TITULO_OBRA}} no projeto audiovisual {{TITULO_PROJETO}} da produtora {{PRODUTORA}}...', variaveis_json: { TITULO_OBRA: 'string', TITULO_PROJETO: 'string', PRODUTORA: 'string' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-01-15T10:00:00Z' },
  { id: 'ma-003', codigo: 'AUT-PUBLICIDADE', nome: 'Autorização de Uso Publicitário', tipo_autorizacao: 'publicidade', template_text: 'Autorizamos o uso da obra {{TITULO_OBRA}} na campanha publicitária da marca {{MARCA}} pela agência {{AGENCIA}}...', variaveis_json: { TITULO_OBRA: 'string', MARCA: 'string', AGENCIA: 'string' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-01-15T10:00:00Z' },
  { id: 'ma-004', codigo: 'AUT-VIDEOFONOGRAMA', nome: 'Autorização de Inclusão em Videofonograma', tipo_autorizacao: 'videofonograma', template_text: 'Autorizamos a inclusão da obra {{TITULO_OBRA}} no videoclipe do intérprete {{INTERPRETE}}...', variaveis_json: { TITULO_OBRA: 'string', INTERPRETE: 'string' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-06-01T10:00:00Z' },
  { id: 'ma-005', codigo: 'AUT-INCIDENTAL', nome: 'Autorização de Uso Incidental', tipo_autorizacao: 'incidental', template_text: 'Autorizamos o uso incidental/secundário da obra {{TITULO_OBRA}} no conteúdo {{TITULO_CONTEUDO}}...', variaveis_json: { TITULO_OBRA: 'string', TITULO_CONTEUDO: 'string' }, ativo: true, editora_id: 'ed-tsm', created_at: '2020-06-01T10:00:00Z' },
]

// ============================================================
// PARÂMETROS FINANCEIROS
// ============================================================

export const MOCK_PARAMETROS: ParametroFinanceiro[] = [
  { id: 'par-001', chave: 'taxa_administrativa_padrao', valor: '10.00', descricao: 'Taxa administrativa padrão (%)', editora_id: 'ed-tsm', updated_at: '2026-01-01T10:00:00Z' },
  { id: 'par-002', chave: 'comissao_subeditor_padrao', valor: '15.00', descricao: 'Comissão subeditora padrão (%)', editora_id: 'ed-tsm', updated_at: '2026-01-01T10:00:00Z' },
  { id: 'par-003', chave: 'irpf_aliquota', valor: '15.00', descricao: 'Alíquota IRPF padrão para PF (%)', editora_id: 'ed-tsm', updated_at: '2026-01-01T10:00:00Z' },
  { id: 'par-004', chave: 'iss_aliquota', valor: '5.00', descricao: 'Alíquota ISS (%)', editora_id: 'ed-tsm', updated_at: '2026-01-01T10:00:00Z' },
  { id: 'par-005', chave: 'taxa_recoupment_juros', valor: '0.00', descricao: 'Juros sobre recoupment (%)', editora_id: 'ed-tsm', updated_at: '2026-01-01T10:00:00Z' },
]

// ============================================================
// TIPOS DE DIREITOS
// ============================================================

export const MOCK_TIPOS_DIREITOS: TipoDireitoConfig[] = [
  { id: 'td-001', codigo: 'BR-a', nome: 'Reprodução Gráfica (Edição)', territorio: 'BR', categoria: 'patrimonial', ativo: true },
  { id: 'td-002', codigo: 'BR-b', nome: 'Reprodução Fonomecânica', territorio: 'BR', categoria: 'patrimonial', ativo: true },
  { id: 'td-003', codigo: 'BR-c', nome: 'Inclusão/Adaptação Audiovisual', territorio: 'BR', categoria: 'patrimonial', ativo: true },
  { id: 'td-004', codigo: 'BR-d', nome: 'Inclusão/Adaptação Publicitária', territorio: 'BR', categoria: 'patrimonial', ativo: true },
  { id: 'td-005', codigo: 'BR-e', nome: 'Distribuição por Meios Digitais', territorio: 'BR', categoria: 'patrimonial', ativo: true },
  { id: 'td-006', codigo: 'BR-f', nome: 'Inclusão em Base de Dados', territorio: 'BR', categoria: 'patrimonial', ativo: true },
  { id: 'td-007', codigo: 'BR-g', nome: 'Comunicação ao Público', territorio: 'BR', categoria: 'patrimonial', ativo: true },
  { id: 'td-008', codigo: 'BR-h', nome: 'Autorizações com Ônus', territorio: 'BR', categoria: 'patrimonial', ativo: true },
  { id: 'td-009', codigo: 'EXT-a', nome: 'Reprodução Gráfica Exterior', territorio: 'EXT', categoria: 'patrimonial', ativo: true },
  { id: 'td-010', codigo: 'EXT-b', nome: 'Reprodução Fonomecânica Exterior', territorio: 'EXT', categoria: 'patrimonial', ativo: true },
  { id: 'td-011', codigo: 'EXT-c', nome: 'Inclusão Audiovisual Exterior', territorio: 'EXT', categoria: 'patrimonial', ativo: true },
  { id: 'td-012', codigo: 'EXT-d', nome: 'Inclusão Publicitária Exterior', territorio: 'EXT', categoria: 'patrimonial', ativo: true },
  { id: 'td-013', codigo: 'EXT-e', nome: 'Distribuição Digital Exterior', territorio: 'EXT', categoria: 'patrimonial', ativo: true },
  { id: 'td-014', codigo: 'EXT-f', nome: 'Base de Dados Exterior', territorio: 'EXT', categoria: 'patrimonial', ativo: true },
  { id: 'td-015', codigo: 'EXT-g', nome: 'Comunicação ao Público Exterior', territorio: 'EXT', categoria: 'patrimonial', ativo: true },
]

// ============================================================
// INTEGRAÇÕES EXTERNAS
// ============================================================

export const MOCK_INTEGRACOES: IntegracaoExterna[] = [
  { id: 'int-001', nome: 'D4SIGN Assinatura Digital', tipo: 'd4sign', status: 'ativa', config_json: { api_key: '***', webhook_url: 'https://api.topshowmusic.com.br/webhooks/d4sign', ambiente: 'producao' }, ultimo_teste: '2026-05-21T08:00:00Z', editora_id: 'ed-tsm', created_at: '2022-01-01T10:00:00Z' },
  { id: 'int-002', nome: 'DocuSign', tipo: 'docusign', status: 'inativa', config_json: { account_id: '***', client_id: '***' }, ultimo_teste: '2025-12-01T10:00:00Z', editora_id: 'ed-tsm', created_at: '2022-01-01T10:00:00Z' },
  { id: 'int-003', nome: 'SOCINPRO API', tipo: 'socinpro', status: 'erro', config_json: { endpoint: 'https://api.socinpro.org.br/v1', token: '***' }, ultimo_teste: '2026-05-20T15:00:00Z', last_error: 'HTTP 503 — Serviço temporariamente indisponível. Retry em 30min.', editora_id: 'ed-tsm', created_at: '2022-06-01T10:00:00Z' },
  { id: 'int-004', nome: 'BackOffice Music Services', tipo: 'backoffice_ms', status: 'ativa', config_json: { endpoint: 'https://api.backofficemusic.com/v2', api_key: '***', encoding: 'CWR2.1' }, ultimo_teste: '2026-05-21T08:30:00Z', editora_id: 'ed-tsm', created_at: '2021-01-01T10:00:00Z' },
  { id: 'int-005', nome: 'WhatsApp Business API', tipo: 'whatsapp_api', status: 'ativa', config_json: { phone_number_id: '***', token: '***', template_prestacao: 'prestacao_contas_v2' }, ultimo_teste: '2026-05-21T09:00:00Z', editora_id: 'ed-tsm', created_at: '2022-09-01T10:00:00Z' },
  { id: 'int-006', nome: 'Email API (SendGrid)', tipo: 'email_api', status: 'ativa', config_json: { api_key: '***', from: 'noreply@topshowmusic.com.br', template_id: 'prestacao-v3' }, ultimo_teste: '2026-05-21T09:00:00Z', editora_id: 'ed-tsm', created_at: '2021-06-01T10:00:00Z' },
  { id: 'int-007', nome: 'PIX — Banco do Brasil', tipo: 'pix_api', status: 'ativa', config_json: { client_id: '***', client_secret: '***', banco: 'BB', tipo: 'pix' }, ultimo_teste: '2026-05-21T08:45:00Z', editora_id: 'ed-tsm', created_at: '2022-01-01T10:00:00Z' },
  { id: 'int-008', nome: 'Banco Itaú API', tipo: 'banco_api', status: 'ativa', config_json: { client_id: '***', agencia: '0001', conta: '12345-6', tipo: 'ted_pix' }, ultimo_teste: '2026-05-21T08:45:00Z', editora_id: 'ed-tsm', created_at: '2022-03-01T10:00:00Z' },
]

// ============================================================
// AUDIT LOGS (25 recentes)
// ============================================================

export const MOCK_AUDIT_LOGS: AuditLog[] = []

// Mapeamento de perfil para usuário demo
export const DEMO_PERFIL_USUARIOS: Record<PerfilCodigo, string> = {
  master: 'usr-001',
  administrada: 'usr-002',
  autor: 'usr-003',
  financeiro: 'usr-005',
  juridico: 'usr-006',
  operacional: 'usr-007',
}

export const DEMO_PERFIL_NOMES: Record<PerfilCodigo, string> = {
  master: 'Marina Lopes',
  administrada: 'Roberto Dias (Edi Music)',
  autor: 'Nauilan Barbosa',
  financeiro: 'Carla Mendes',
  juridico: 'Lucas Andrade',
  operacional: 'Patricia Costa',
}

