'use client'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  MOCK_USUARIOS,
  MOCK_PERFIS,
  MOCK_MODELOS_CONTRATO,
  MOCK_MODELOS_AUTORIZACAO,
  MOCK_PARAMETROS,
  MOCK_TIPOS_DIREITOS,
  MOCK_INTEGRACOES,
  MOCK_AUDIT_LOGS,
} from '@/lib/mock-config'
import { Users, Shield, FileText, BookOpen, DollarSign, Music, Globe, Activity } from 'lucide-react'

const CARDS = [
  {
    title: 'Usuários',
    desc: 'Cadastro e gestão de usuários do sistema',
    icon: Users,
    count: MOCK_USUARIOS.length,
    href: '/master/config/usuarios',
    color: 'violet',
  },
  {
    title: 'Perfis e Permissões',
    desc: 'Perfis de acesso e controle granular',
    icon: Shield,
    count: MOCK_PERFIS.length,
    href: '/master/config/perfis',
    color: 'blue',
  },
  {
    title: 'Modelos de Contrato',
    desc: 'Templates de contratos editáveis',
    icon: FileText,
    count: MOCK_MODELOS_CONTRATO.length,
    href: '/master/config/modelos-contrato',
    color: 'emerald',
  },
  {
    title: 'Modelos de Autorização',
    desc: 'Templates de autorizações editáveis',
    icon: BookOpen,
    count: MOCK_MODELOS_AUTORIZACAO.length,
    href: '/master/config/modelos-autorizacao',
    color: 'sky',
  },
  {
    title: 'Parâmetros Financeiros',
    desc: 'IRPF, ISS, taxas e comissões',
    icon: DollarSign,
    count: MOCK_PARAMETROS.length,
    href: '/master/config/parametros',
    color: 'amber',
  },
  {
    title: 'Tipos de Direitos',
    desc: '15 tipos BR + EXT com toggle ativo',
    icon: Music,
    count: MOCK_TIPOS_DIREITOS.length,
    href: '/master/config/tipos-direitos',
    color: 'rose',
  },
  {
    title: 'Integrações Externas',
    desc: 'D4SIGN, SOCINPRO, PIX, WhatsApp etc.',
    icon: Globe,
    count: MOCK_INTEGRACOES.length,
    href: '/master/config/integracoes',
    color: 'purple',
  },
  {
    title: 'Auditoria / Logs',
    desc: 'Feed de auditoria de todas as ações',
    icon: Activity,
    count: MOCK_AUDIT_LOGS.length,
    href: '/master/config/auditoria',
    color: 'orange',
  },
]

const COLOR_BORDER: Record<string, string> = {
  violet: 'border-violet-500/20 hover:border-violet-500/40',
  blue: 'border-blue-500/20 hover:border-blue-500/40',
  emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
  sky: 'border-sky-500/20 hover:border-sky-500/40',
  amber: 'border-amber-500/20 hover:border-amber-500/40',
  rose: 'border-rose-500/20 hover:border-rose-500/40',
  purple: 'border-purple-500/20 hover:border-purple-500/40',
  orange: 'border-orange-500/20 hover:border-orange-500/40',
}

export default function ConfigLandingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Central de configurações do sistema Sync Mood."
      />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.03] border ${COLOR_BORDER[card.color]} transition-all duration-200 hover:bg-white/[0.05]`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white/50" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-mono text-white/25">{card.count}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                  {card.title}
                </p>
                <p className="text-xs text-white/35 mt-0.5">{card.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
