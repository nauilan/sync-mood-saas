import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Music, Users, FileText, TrendingUp, Download, AlertCircle, Activity } from 'lucide-react'

export const metadata = { title: 'Dashboard Master | Sync Mood' }

export default async function MasterDashboardPage() {
  const kpis = { total_obras: 847, receita_mes: 48320, titulares_ativos: 23, demonstrativos_pendentes: 2 }
  const activity = [
    { id: '1', text: 'Demonstrativo Mai/25 gerado', sub: 'Carlos Drummond', time: 'Hoje', badge: 'violet' as const },
    { id: '2', text: 'Importacao Spotify confirmada', sub: 'R\$ 1.840 - 3 obras', time: '2h', badge: 'emerald' as const },
    { id: '3', text: 'Adiantamento recoupment', sub: 'Pedro Compositor', time: 'Ontem', badge: 'amber' as const },
    { id: '4', text: 'Contrato renovado', sub: 'Joao Silva - 12 meses', time: '3d', badge: 'sky' as const },
  ]
  return (
    <div className="space-y-6 animate-[fade-in-up_0.3s_cubic-bezier(0.16,1,0.3,1)_both]">
      <PageHeader title="Dashboard" description="Visao geral da editora"
        actions={
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-white/55 hover:text-white/80 hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-150">
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} /> Exportar
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total de Obras" value={kpis.total_obras} trend={12} accent="emerald" icon={<Music className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />} />
        <KpiCard title="Receita este mes" value={formatCurrency(kpis.receita_mes)} trend={8.3} accent="violet" icon={<TrendingUp className="w-4 h-4 text-violet-400" strokeWidth={1.5} />} />
        <KpiCard title="Titulares ativos" value={kpis.titulares_ativos} accent="sky" icon={<Users className="w-4 h-4 text-sky-400" strokeWidth={1.5} />} />
        <KpiCard title="Demonstrativos pendentes" value={kpis.demonstrativos_pendentes} subtitle="Aguardando aprovacao" accent="amber" icon={<FileText className="w-4 h-4 text-amber-400" strokeWidth={1.5} />} />
      </div>

      {/* Alert banner */}
      <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-2xl p-4 shadow-[inset_0_1px_0_rgb(251_191_36_/_0.06)]">
        <div className="flex items-center gap-2 mb-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-amber-300">Acoes necessarias</span>
        </div>
        <ul className="space-y-1.5">
          <li className="text-xs text-white/55 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block shrink-0" />Banda Fluxo — contrato vence em 12 dias</li>
          <li className="text-xs text-white/55 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />4 obras sem ISWC cadastrado</li>
          <li className="text-xs text-white/55 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />2 demonstrativos aguardando aprovacao</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-[#0d1526] border border-white/[0.06] rounded-2xl p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-white/30" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-white">Atividade Recente</h2>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-[pulse-dot_2s_ease-in-out_infinite]" />
              ao vivo
            </span>
          </div>
          <ul className="space-y-3">
            {activity.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-2 border-b border-white/[0.03] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 leading-snug">{item.text}</p>
                  <p className="text-xs text-white/35 mt-0.5">{item.sub}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={item.badge}>{item.badge}</Badge>
                  <span className="text-xs text-white/20 tabular-nums">{item.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick access */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-white mb-4">Acesso Rapido</h2>
          <div className="space-y-1.5">
            {[
              { label: 'Nova Obra', href: '/master/obras/nova' },
              { label: 'Importar Relatorio', href: '/master/importacao' },
              { label: 'Criar Lote Distribuicao', href: '/master/distribuicao/novo' },
              { label: 'Gerar Demonstrativo', href: '/master/demonstrativos/gerar' },
              { label: 'Export Socinpro', href: '/master/export/socinpro' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.06] text-sm text-white/60 hover:text-white/85 transition-all duration-150 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 shrink-0" />
                {link.label}
                <span className="ml-auto text-white/20 group-hover:text-white/50 text-xs transition-colors">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
