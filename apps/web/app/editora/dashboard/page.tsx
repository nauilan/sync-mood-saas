import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Music, Users, FileText, TrendingUp, Plus } from 'lucide-react'

export const metadata = { title: 'Dashboard | Sync Mood' }

export default async function EditoraDashboardPage() {
  const kpis = { total_obras: 124, receita_mes: 12480, titulares_ativos: 8, demonstrativos_pendentes: 1 }
  const topObras = [
    { titulo: 'Passarinho', receita: 8400, canal: 'Streaming' },
    { titulo: 'Chuva Fina', receita: 4200, canal: 'Sync TV' },
    { titulo: 'Sol da Manha', receita: 2800, canal: 'Streaming' },
    { titulo: 'Tempo Livre', receita: 1900, canal: 'Radio' },
    { titulo: 'Noite Azul', receita: 980, canal: 'Streaming' },
  ]
  const canalColors: Record<string, 'emerald' | 'amber' | 'sky'> = {
    Streaming: 'emerald', 'Sync TV': 'amber', Radio: 'sky',
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visao geral da sua editora"
        actions={
          <a href="/editora/obras/nova" className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nova Obra
          </a>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Obras no catalogo" value={kpis.total_obras} accent="emerald" icon={<Music className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Receita este mes" value={formatCurrency(kpis.receita_mes)} trend={6.2} accent="violet" icon={<TrendingUp className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Titulares ativos" value={kpis.titulares_ativos} accent="sky" icon={<Users className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Demonstrativos pendentes" value={kpis.demonstrativos_pendentes} subtitle="Aprovar / contestar" accent="amber" icon={<FileText className="w-4 h-4 text-amber-400" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Top 5 Obras</h2>
            <a href="/editora/obras" className="text-xs text-violet-400 hover:text-violet-300">Ver todas</a>
          </div>
          <div className="space-y-3">
            {topObras.map((obra, i) => (
              <div key={obra.titulo} className="flex items-center gap-3">
                <span className="text-xs font-bold text-white/20 w-4 shrink-0">{i + 1}</span>
                <p className="flex-1 text-sm text-white/80 truncate">{obra.titulo}</p>
                <Badge variant={canalColors[obra.canal] ?? 'slate'}>{obra.canal}</Badge>
                <span className="text-xs font-semibold text-white/70 shrink-0">{formatCurrency(obra.receita)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Ultimas Importacoes</h2>
            <a href="/editora/importacao" className="text-xs text-violet-400 hover:text-violet-300">Ver todas</a>
          </div>
          <div className="space-y-3">
            {[
              { origem: 'Socinpro', periodo: 'Abr/25', valor: 3200 },
              { origem: 'Spotify/DSP', periodo: 'Mar/25', valor: 1840 },
              { origem: 'Sync Globo', periodo: 'Fev/25', valor: 4500 },
            ].map((imp) => (
              <div key={imp.periodo + imp.origem} className="flex items-center gap-3 p-2.5 bg-white/[0.03] rounded-lg">
                <div className="flex-1"><p className="text-sm text-white/80">{imp.origem}</p><p className="text-xs text-white/40">{imp.periodo}</p></div>
                <Badge variant="emerald">Confirmada</Badge>
                <span className="text-xs font-semibold text-emerald-400">{formatCurrency(imp.valor)}</span>
              </div>
            ))}
            <a href="/editora/importacao/nova" className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-white/[0.06] text-xs text-white/30 hover:text-white/60 hover:border-white/10 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Importar novo relatorio
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}