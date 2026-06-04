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

// Sync Mood Gestão Inteligente — Master nav
export const MASTER_NAV: NavSection[] = [
  { title: 'Principal', items: [
    { label: 'Visao Geral', href: '/master/dashboard', iconName: 'LayoutDashboard' },
  ]},
  { title: 'M1 Cadastros', items: [
    { label: 'Titulares', href: '/master/titulares', iconName: 'Users' },
    { label: 'Editoras Administradas', href: '/master/editoras', iconName: 'Building2' },
    { label: 'Editoras / Master', href: '/master/editora', iconName: 'Settings' },
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
  { title: 'M5 BackOffice', items: [
    { label: 'BackOffice', href: '/master/backoffice', iconName: 'Database' },
    { label: 'Matching de Obras', href: '/master/backoffice/matching', iconName: 'Shuffle' },
    { label: 'Match Lista ONI', href: '/master/backoffice/match-lista-oni', iconName: 'Target' },
    { label: 'Relatorios BackOffice', href: '/master/backoffice/relatorios', iconName: 'BarChart3' },
    { label: 'Config BackOffice', href: '/master/backoffice/configuracoes', iconName: 'Settings' },
  ]},
  { title: 'M6 Recebimentos', items: [
    { label: 'Recebimentos', href: '/master/recebimentos', iconName: 'DollarSign' },
    { label: 'SOCINPRO / ECAD', href: '/master/recebimentos/socinpro', iconName: 'Radio' },
    { label: 'Divergencias', href: '/master/recebimentos/divergencias', iconName: 'AlertTriangle' },
    { label: 'Fontes', href: '/master/recebimentos/fontes', iconName: 'Settings' },
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
  { title: 'M8 Distribuicao', items: [
    { label: 'Distribuicoes',     href: '/master/distribuicao',              iconName: 'PieChart' },
    { label: 'Periodos',          href: '/master/distribuicao/periodos',     iconName: 'Calendar' },
    { label: 'Nova Distribuicao', href: '/master/distribuicao/nova',         iconName: 'FilePlus' },
    { label: 'Previa',            href: '/master/distribuicao/previa',       iconName: 'Eye' },
    { label: 'Encerramento',      href: '/master/distribuicao/encerramento', iconName: 'Lock' },
    { label: 'Recoupment',        href: '/master/distribuicao/recoupment',   iconName: 'TrendingUp' },
  ]},
  { title: 'M9 Conta Corrente', items: [
    { label: 'CC Obras', href: '/master/cc-obra', iconName: 'Music' },
    { label: 'CC Titulares', href: '/master/cc-titular', iconName: 'Users' },
    { label: 'Dashboard Obras', href: '/master/cc-obra/dashboard', iconName: 'BarChart3' },
    { label: 'Dashboard Titulares', href: '/master/cc-titular/dashboard', iconName: 'BarChart3' },
  ]},
  { title: 'M10 Prestacao de Contas', items: [
    { label: 'Prestacoes', href: '/master/prestacao-contas', iconName: 'FileText' },
    { label: 'Nova Prestacao', href: '/master/prestacao-contas/nova', iconName: 'Plus' },
    { label: 'Contestacoes', href: '/master/prestacao-contas/contestacoes', iconName: 'AlertTriangle' },
    { label: 'Automacao', href: '/master/prestacao-contas/automacao', iconName: 'Settings' },
  ]},
  { title: 'M11 Financeiro', items: [
    { label: 'Dashboard Financeiro', href: '/master/financeiro-m11', iconName: 'DollarSign' },
    { label: 'Contas a Pagar', href: '/master/financeiro-m11/contas-pagar', iconName: 'TrendingDown' },
    { label: 'Contas a Receber', href: '/master/financeiro-m11/contas-receber', iconName: 'TrendingUp' },
    { label: 'Fluxo de Caixa', href: '/master/financeiro-m11/fluxo-caixa', iconName: 'Activity' },
    { label: 'Conciliacao Bancaria', href: '/master/financeiro-m11/conciliacao-bancaria', iconName: 'CreditCard' },
    { label: 'Contas Bancarias', href: '/master/financeiro-m11/contas-bancarias', iconName: 'Banknote' },
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
    { label: 'Auditoria', href: '/master/relatorios/auditoria', iconName: 'ShieldAlert' },
  ]},
  { title: 'M14 Configuracoes', items: [
    { label: 'Configuracoes', href: '/master/configuracoes', iconName: 'Settings' },
    { label: 'Usuarios', href: '/master/configuracoes/usuarios', iconName: 'Users' },
    { label: 'Perfis', href: '/master/configuracoes/perfis', iconName: 'Shield' },
    { label: 'Permissoes', href: '/master/configuracoes/permissoes', iconName: 'ShieldAlert' },
    { label: 'Modelos Autorizacao', href: '/master/configuracoes/modelos-autorizacao', iconName: 'BookOpen' },
    { label: 'Parametros', href: '/master/configuracoes/parametros', iconName: 'Settings' },
    { label: 'Tipos Direitos', href: '/master/configuracoes/tipos-direitos', iconName: 'Tags' },
    { label: 'Integracoes', href: '/master/configuracoes/integracoes', iconName: 'Puzzle' },
    { label: 'Auditoria Config', href: '/master/configuracoes/auditoria', iconName: 'Activity' },
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
