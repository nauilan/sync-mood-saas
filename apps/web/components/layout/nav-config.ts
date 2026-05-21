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
export const MASTER_NAV: NavSection[] = [
  { title: 'Principal', items: [{ label: 'Dashboard', href: '/master/dashboard', iconName: 'LayoutDashboard' }] },
  { title: 'M1 Cadastros', items: [
    { label: 'Titulares', href: '/master/titulares', iconName: 'Users' },
    { label: 'Editora (Tenant)', href: '/master/cadastro-editora', iconName: 'Building2' },
    { label: 'Contratos-Tipo', href: '/master/contratos-tipo', iconName: 'BookOpen' },
  ]},
  { title: 'M2 Contratos', items: [
    { label: 'Gestao de Contratos', href: '/master/contratos', iconName: 'FileText' },
    { label: 'Motor Contratual', href: '/master/contratos/novo', iconName: 'GitBranch' },
    { label: 'Modelos de Contrato', href: '/master/modelos-contrato', iconName: 'BookOpen' },
    { label: 'Arquivos / Assinaturas', href: '/master/contratos/arquivos', iconName: 'Shield' },
  ]},
  { title: 'M3 Catalogo', items: [
    { label: 'Cadastro de Obras', href: '/master/obras', iconName: 'Music' },
    { label: 'Fonogramas (ISRCs)', href: '/master/fonogramas', iconName: 'Music' },
  ]},
  { title: 'M4 Operacional', items: [
    { label: 'Importacao Relatorios', href: '/master/importacao', iconName: 'Download' },
    { label: 'Distribuicao Royalties', href: '/master/distribuicao', iconName: 'PieChart' },
    { label: 'Demonstrativos', href: '/master/demonstrativos', iconName: 'Receipt' },
  ]},
  { title: 'M5 Financeiro', items: [
    { label: 'Adiantamentos', href: '/master/adiantamentos', iconName: 'Wallet' },
    { label: 'Contas a Pagar', href: '/master/contas-pagar', iconName: 'CreditCard' },
    { label: 'Conciliacao Bancaria', href: '/master/conciliacao', iconName: 'TrendingUp' },
  ]},
  { title: 'M6 Exportacoes', items: [
    { label: 'Export Socinpro', href: '/master/export/socinpro', iconName: 'Send' },
    { label: 'Export Backoffice', href: '/master/export/backoffice', iconName: 'Send' },
  ]},
  { title: 'Inteligencia', items: [
    { label: 'BI / Relatorios', href: '/master/bi', iconName: 'BarChart3' },
  ]},
  { title: 'Admin', items: [
    { label: 'Configuracoes', href: '/master/configuracoes', iconName: 'Settings' },
    { label: 'Comunicacao', href: '/master/comunicacao', iconName: 'MessageSquare' },
  ]},
]
export const EDITORA_NAV: NavSection[] = [
  { title: 'Principal', items: [{ label: 'Dashboard', href: '/editora/dashboard', iconName: 'LayoutDashboard' }] },
  { title: 'Cadastros', items: [
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