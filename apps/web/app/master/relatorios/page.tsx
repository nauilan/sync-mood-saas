'use client'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { BI_AGREGADO } from '@/lib/mock-bi'
import { Music, Disc, Users, FileText, Shield, DollarSign, TrendingUp, Wallet, BarChart3, Sparkles, Search } from 'lucide-react'

const CATS = [
  { id: 'obras', label: 'Obras', desc: 'Cadastradas, ativas, pendentes', icon: Music, color: 'violet', count: BI_AGREGADO.obras.total_cadastradas, href: '/master/relatorios/obras' },
  { id: 'obras-gravadas', label: 'Obras Gravadas', desc: 'Fonogramas, ISRCs, gravadoras', icon: Disc, color: 'sky', count: BI_AGREGADO.obras_gravadas.total_fonogramas, href: '/master/relatorios/obras-gravadas' },
  { id: 'titulares', label: 'Titulares', desc: 'Autores, editoras, cessionários', icon: Users, color: 'emerald', count: BI_AGREGADO.titulares.total, href: '/master/relatorios/titulares' },
  { id: 'contratos', label: 'Contratos', desc: 'Ativos, pendentes, a vencer', icon: FileText, color: 'amber', count: BI_AGREGADO.contratos.total, href: '/master/relatorios/contratos' },
  { id: 'autorizacoes', label: 'Autorizações', desc: 'Emitidas, pendentes, pagas', icon: Shield, color: 'rose', count: BI_AGREGADO.autorizacoes.total, href: '/master/relatorios/autorizacoes' },
  { id: 'recebimentos', label: 'Recebimentos', desc: 'DSP, sync, internacional', icon: DollarSign, color: 'blue', count: BI_AGREGADO.recebimentos.total_registros, href: '/master/relatorios/recebimentos' },
  { id: 'cc-obra', label: 'CC Obras', desc: 'Saldo, entradas, distribuídos', icon: Music, color: 'purple', count: BI_AGREGADO.cc_obra.total_obras_com_cc, href: '/master/relatorios/cc-obra' },
  { id: 'cc-titular', label: 'CC Titulares', desc: 'Saldo, créditos, débitos', icon: Wallet, color: 'indigo', count: BI_AGREGADO.cc_titular.total_titulares_com_cc, href: '/master/relatorios/cc-titular' },
  { id: 'financeiros', label: 'Financeiros', desc: 'A pagar, a receber, fluxo', icon: TrendingUp, color: 'green', count: 9, href: '/master/relatorios/financeiros' },
  { id: 'royalties-futuros', label: 'Royalties Futuros', desc: 'Apurados, previstos, bloqueados', icon: BarChart3, color: 'yellow', count: 7, href: '/master/relatorios/royalties-futuros' },
  { id: 'bi-estrategico', label: 'BI Estratégico', desc: 'Rentabilidade, DSPs, crescimento', icon: Sparkles, color: 'fuchsia', count: 11, href: '/master/relatorios/bi-estrategico' },
  { id: 'auditoria', label: 'Auditoria', desc: 'Alterações, exportações, usuários', icon: Shield, color: 'orange', count: BI_AGREGADO.auditoria.total_logs, href: '/master/relatorios/auditoria' },
]

const COLOR_MAP: Record<string, string> = {
  violet: 'border-violet-500/20 hover:border-violet-500/40',
  sky: 'border-sky-500/20 hover:border-sky-500/40',
  emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
  amber: 'border-amber-500/20 hover:border-amber-500/40',
  rose: 'border-rose-500/20 hover:border-rose-500/40',
  blue: 'border-blue-500/20 hover:border-blue-500/40',
  purple: 'border-purple-500/20 hover:border-purple-500/40',
  indigo: 'border-indigo-500/20 hover:border-indigo-500/40',
  green: 'border-green-500/20 hover:border-green-500/40',
  yellow: 'border-yellow-500/20 hover:border-yellow-500/40',
  fuchsia: 'border-fuchsia-500/20 hover:border-fuchsia-500/40',
  orange: 'border-orange-500/20 hover:border-orange-500/40',
}

export default function RelatoriosLandingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios & BI" description="Central de relatórios operacionais, gerenciais e estratégicos." />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-violet-500/40"
            placeholder="Buscar relatório..."
          />
        </div>
        <select className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/60 focus:outline-none">
          <option>Período: Todos</option>
          <option>2026-Q1</option>
          <option>2025-Q4</option>
          <option>Últimos 12 meses</option>
        </select>
        <select className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/60 focus:outline-none">
          <option>Editora: Todas</option>
          <option>Top Show Music</option>
          <option>Edi Music</option>
        </select>
        <select className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/60 focus:outline-none">
          <option>Moeda: BRL</option>
          <option>USD</option>
          <option>EUR</option>
        </select>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATS.map(cat => {
          const Icon = cat.icon
          return (
            <Link
              key={cat.id}
              href={cat.href}
              className={`group flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.03] border ${COLOR_MAP[cat.color]} transition-all duration-200 hover:bg-white/[0.05]`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white/50" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-mono text-white/25">{cat.count}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{cat.label}</p>
                <p className="text-xs text-white/35 mt-0.5">{cat.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
