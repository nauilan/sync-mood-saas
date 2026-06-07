export interface NavItem {
  label: string
  href: string
  iconName: string
  badge?: number | string
}
export interface NavSection {
  title: string
  items: NavItem[]
}

// Sync Mood Gestao Inteligente — Master nav
export const MASTER_NAV: NavSection[] = [
  { title: 'Principal', items: [
    { label: 'Visao Geral', href: '/master/dashboard', iconName: 'LayoutDashboard' },
  ]},
  { title: 'M1 Cadastros', items: [
    { label: 'Titulares', href: '/master/titulares', iconName: 'Users' },
    { label: 'Editoras', href: '/master/editoras', iconName: 'Building2' },
    { label: 'Organizacao Gestora', href: '/master/editora', iconName: 'Settings' },
  ]},
  { title: 'M2 Contratos', items: [
    { label: 'Contratos', href: '/master/contratos', iconName: 'FileText' },
    { label: 'Negocios entre Editoras', href: '/master/negocios-editoriais', iconName: 'Building2' },
    { label: 'Modelos Juridicos', href: '/master/contratos/modelos', iconName: 'BookOpen' },
    { label: 'Alertas Exclusividade', href: '/master/contratos/alertas', iconName: 'ShieldAlert' },
  ]},
  { title: 'M3 Obras', items: [
    { label: 'Obras', href: '/master/obras', iconName: 'Music' },
    { label: 'Catalogo (Nova Obra)', href: '/master/obras/nova', iconName: 'ListMusic' },
  ]},
  { title: 'M4 Autorizacoes', items: [
    { label: 'Autorizacoes', href: '/master/autorizacoes', iconName: 'Shield' },
    { label: 'Orcamentos', href: '/master/autorizacoes/orcamentos', iconName: 'FileEdit' },
    { label: 'Cobrancas', href: '/master/autorizacoes/cobrancas', iconName: 'Receipt' },
    { label: 'Tipos de Uso', href: '/master/autorizacoes/tipos-uso', iconName: 'Tags' },
    { label: 'Precificacao', href: '/master/autorizacoes/precificacao', iconName: 'DollarSign' },
    { label: 'Nova Autorizacao', href: '/master/autorizacoes/nova', iconName: 'FilePlus' },
  ]},
  { title: 'M5 Importacoes', items: [
    { label: 'Importar DSPs (Royalties)', href: '/master/backoffice/importacao', iconName: 'FileInput' },
    { label: 'Importar CWR (Catalogo)', href: '/master/backoffice/importacao-cwr', iconName: 'FileCode2' },
    { label: 'Importar Recebimentos', href: '/master/recebimentos/importar', iconName: 'Download' },
    { label: 'Importar TV / Audiovisual', href: '/master/tv/importacoes', iconName: 'Tv' },
    { label: 'Nova Importacao TV', href: '/master/tv/importacoes/nova', iconName: 'FilePlus' },
  ]},
  { title: 'M5 Exportacoes', items: [
    { label: 'Exportacoes CWR', href: '/master/backoffice/exportacoes', iconName: 'Upload' },
    { label: 'Nova Exportacao CWR', href: '/master/backoffice/exportacoes/nova', iconName: 'FilePlus' },
  ]},

  // -----------------------------------------------------------------------
  // BACKOFFICE — INFORMACAO
  // Responsavel por: identificacao, matching, Song Codes, ONI, logs, juridico
  // -----------------------------------------------------------------------
  { title: 'BackOffice — Informacao', items: [
    { label: 'Dashboard', href: '/master/backoffice', iconName: 'Database' },
    { label: 'Catalogo BackOffice', href: '/master/backoffice/catalogo', iconName: 'BookOpen' },
    { label: 'Importacao de Arquivos', href: '/master/backoffice/importacao', iconName: 'FileInput' },
    { label: 'Analise de Lancamentos', href: '/master/backoffice/matching', iconName: 'Shuffle' },
    { label: 'ONI — Obras Nao Identificadas', href: '/master/backoffice/match-lista-oni', iconName: 'Target' },
    { label: 'Logs de Processamento', href: '/master/backoffice/logs', iconName: 'ScrollText' },
    { label: 'Pendencias Juridicas', href: '/master/backoffice/pendencias-juridicas', iconName: 'AlertTriangle' },
  ]},

  // -----------------------------------------------------------------------
  // FINANCEIRO — DINHEIRO
  // Responsavel por: recebimentos, distribuicao, conta corrente, prestacao
  // -----------------------------------------------------------------------
  { title: 'Financeiro — Dinheiro', items: [
    { label: 'Periodos de Pagamento', href: '/master/financeiro/periodos', iconName: 'Calendar' },
    { label: 'Recebimentos', href: '/master/recebimentos', iconName: 'DollarSign' },
    { label: 'Conferencia', href: '/master/recebimentos/divergencias', iconName: 'CheckCircle2' },
    { label: 'Distribuicoes', href: '/master/distribuicao', iconName: 'PieChart' },
    { label: 'Conta Corrente', href: '/master/cc-obra', iconName: 'CreditCard' },
    { label: 'Prestacao de Contas', href: '/master/prestacao-contas', iconName: 'FileText' },
    { label: 'Adiantamentos', href: '/master/financeiro-m11/contas-pagar', iconName: 'Wallet' },
    { label: 'Comissoes', href: '/master/financeiro-m11/contas-receber', iconName: 'TrendingUp' },
  ]},

  { title: 'M6 TV Audiovisual', items: [
    { label: 'TV Dashboard', href: '/master/tv/dashboard', iconName: 'BarChart3' },
    { label: 'Execucoes TV', href: '/master/tv/execucoes', iconName: 'Tv' },
    { label: 'Divergencias TV', href: '/master/tv/divergencias', iconName: 'AlertTriangle' },
    { label: 'Precificacao TV', href: '/master/tv/precificacao', iconName: 'DollarSign' },
    { label: 'Autorizacoes TV', href: '/master/tv/autorizacoes', iconName: 'Shield' },
    { label: 'Cobranca TV', href: '/master/tv/cobranca', iconName: 'TrendingUp' },
    { label: 'TV Home', href: '/master/tv', iconName: 'Tv' },
  ]},
  { title: 'M7 Conciliacao', items: [
    { label: 'Conciliacoes', href: '/master/conciliacao', iconName: 'Activity' },
    { label: 'Divergencias Conc.', href: '/master/conciliacao/divergencias', iconName: 'AlertTriangle' },
  ]},
  { title: 'M12-13 Relatorios & BI', items: [
    { label: 'Relatorios', href: '/master/relatorios', iconName: 'BarChart3' },
    { label: 'Obras', href: '/master/relatorios/obras', iconName: 'Music' },
    { label: 'Obras Gravadas', href: '/master/relatorios/obras-gravadas', iconName: 'Mic2' },
    { label: 'Titulares', href: '/master/relatorios/titulares', iconName: 'Users' },
    { label: 'Contratos', href: '/master/relatorios/contratos', iconName: 'FileText' },
    { label: 'Autorizacoes', href: '/master/relatorios/autorizacoes', iconName: 'Shield' },
    { label: 'Recebimentos', href: '/master/relatorios/recebimentos', iconName: 'Download' },
    { label: 'CC Obras', href: '/master/relatorios/cc-obras', iconName: 'Music' },
    { label: 'CC Titulares', href: '/master/relatorios/cc-titulares', iconName: 'Users' },
    { label: 'Financeiros', href: '/master/relatorios/financeiros', iconName: 'DollarSign' },
    { label: 'Royalties Futuros', href: '/master/relatorios/royalties-futuros', iconName: 'TrendingUp' },
    { label: 'BI Estrategico', href: '/master/relatorios/bi-estrategico', iconName: 'Sparkles' },
    { label: 'Auditoria Relatorios', href: '/master/relatorios/auditoria', iconName: 'ShieldAlert' },
  ]},

  // -----------------------------------------------------------------------
  // ADMINISTRACAO — inclui Auditoria Global (Migration 044)
  // -----------------------------------------------------------------------
  { title: 'Administracao', items: [
    { label: 'Auditoria', href: '/master/admin/auditoria', iconName: 'ShieldAlert' },
    { label: 'Configuracoes', href: '/master/configuracoes', iconName: 'Settings' },
    { label: 'Usuarios', href: '/master/configuracoes/usuarios', iconName: 'Users' },
    { label: 'Perfis', href: '/master/configuracoes/perfis', iconName: 'Shield' },
    { label: 'Permissoes', href: '/master/configuracoes/permissoes', iconName: 'ShieldAlert' },
    { label: 'Modelos Autorizacao', href: '/master/configuracoes/modelos-autorizacao', iconName: 'BookOpen' },
    { label: 'Parametros', href: '/master/configuracoes/parametros', iconName: 'Settings' },
    { label: 'Tipos Direitos', href: '/master/configuracoes/tipos-direitos', iconName: 'Tags' },
    { label: 'Integracoes', href: '/master/configuracoes/integracoes', iconName: 'Puzzle' },
  ]},
]

export const EDITORA_NAV: NavSection[] = [
  { title: 'Principal', items: [
    { label: 'Dashboard', href: '/editora/dashboard', iconName: 'LayoutDashboard' },
    { label: 'Titulares', href: '/editora/titulares', iconName: 'Users' },
    { label: 'Contratos', href: '/editora/contratos', iconName: 'FileText' },
    { label: 'Obras', href: '/editora/obras', iconName: 'Music' },
  ]},
  { title: 'Operacional', items: [
    { label: 'Importacao', href: '/editora/importacao', iconName: 'Download' },
    { label: 'Distribuicao', href: '/editora/distribuicao', iconName: 'PieChart' },
    { label: 'Demonstrativos', href: '/editora/demonstrativos', iconName: 'Receipt' },
  ]},
  { title: 'Financeiro', items: [
    { label: 'Adiantamentos', href: '/editora/adiantamentos', iconName: 'Wallet' },
    { label: 'Financeiro', href: '/editora/financeiro', iconName: 'CreditCard' },
  ]},
  { title: 'Admin', items: [
    { label: 'BI / Relatorios', href: '/editora/bi', iconName: 'BarChart3' },
    { label: 'Configuracoes', href: '/editora/configuracoes', iconName: 'Settings' },
  ]},
]

export const TITULAR_NAV: NavSection[] = [
  { title: 'Inicio', items: [
    { label: 'Dashboard', href: '/titular/dashboard', iconName: 'LayoutDashboard' },
    { label: 'Notificacoes', href: '/titular/notificacoes', iconName: 'Bell' },
  ]},
  { title: 'Meus Dados', items: [
    { label: 'Meu Perfil', href: '/titular/perfil', iconName: 'Users' },
    { label: 'Meus Contratos', href: '/titular/contratos', iconName: 'FileText' },
    { label: 'Minhas Obras', href: '/titular/obras', iconName: 'Music' },
  ]},
  { title: 'Financeiro', items: [
    { label: 'Conta Corrente', href: '/titular/conta-corrente', iconName: 'CreditCard' },
    { label: 'Demonstrativos', href: '/titular/demonstrativos', iconName: 'Receipt' },
    { label: 'Meus Recibos', href: '/titular/recibos', iconName: 'BookOpen' },
    { label: 'Adiantamentos', href: '/titular/adiantamentos', iconName: 'Wallet' },
  ]},
  { title: 'Mais', items: [
    { label: 'Estatisticas', href: '/titular/estatisticas', iconName: 'BarChart3' },
    { label: 'Documentos Fiscais', href: '/titular/fiscal', iconName: 'Shield' },
  ]},
]
