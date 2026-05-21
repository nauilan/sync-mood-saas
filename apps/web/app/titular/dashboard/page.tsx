import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

export const metadata = { title: 'Meu Dashboard | Sync Mood' }

export default async function TitularDashboardPage() {
  const saldo = 12480.50
  const recebimentos = [
    { origem: 'Socinpro', periodo: 'Abr/25', valor: 3200, tipo: 'sky' as const },
    { origem: 'Spotify/DSP', periodo: 'Mar/25', valor: 1840, tipo: 'emerald' as const },
    { origem: 'Sync Globo', periodo: 'Fev/25', valor: 4500, tipo: 'amber' as const },
  ]
  const adiantamentos = [
    { numero: '#001', total: 10000, recuperado: 7300 },
    { numero: '#002', total: 5000, recuperado: 600 },
  ]
  return (
    <div className="space-y-6">
      <PageHeader title="Meu Painel" description="Acompanhe seus royalties e demonstrativos" />
      <div className="bg-gradient-to-br from-violet-600/20 to-emerald-600/10 border border-violet-500/20 rounded-2xl p-6">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Saldo Atual</p>
        <p className="text-4xl font-bold text-emerald-400">{formatCurrency(saldo)}</p>
        <p className="text-sm text-white/40 mt-1">Disponivel para pagamento</p>
        <div className="flex gap-4 mt-4">
          <div><p className="text-xs text-white/40">Acumulado 2025</p><p className="text-sm font-semibold text-white/80">{formatCurrency(34920)}</p></div>
          <div><p className="text-xs text-white/40">Retido (IR)</p><p className="text-sm font-semibold text-white/80">{formatCurrency(2100)}</p></div>
        </div>
        <a href="/titular/conta-corrente" className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors">
          <TrendingUp className="w-3.5 h-3.5" /> Ver extrato completo
        </a>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Ultimos Recebimentos</h2>
            <a href="/titular/conta-corrente" className="text-xs text-violet-400 hover:text-violet-300">Ver todos</a>
          </div>
          <div className="space-y-3">
            {recebimentos.map((r) => (
              <div key={r.origem + r.periodo} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                <div className="flex-1"><p className="text-sm text-white/80">{r.origem}</p><p className="text-xs text-white/40">{r.periodo}</p></div>
                <Badge variant={r.tipo}>{r.tipo === 'sky' ? 'Informativo' : r.tipo === 'emerald' ? 'Operacional' : 'Sync'}</Badge>
                <span className="text-xs font-semibold text-emerald-400">+{formatCurrency(r.valor)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Adiantamentos em Aberto</h2>
            <a href="/titular/adiantamentos" className="text-xs text-violet-400 hover:text-violet-300">Ver todos</a>
          </div>
          <div className="space-y-4">
            {adiantamentos.map((a) => {
              const pct = Math.round((a.recuperado / a.total) * 100)
              const barColor = pct > 50 ? 'bg-emerald-500' : 'bg-amber-500'
              return (
                <div key={a.numero}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-white/60">Adiantamento {a.numero}</span>
                    <span className="text-xs text-white/40">{pct}% recouped</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={['h-full rounded-full', barColor].join(' ')} style={{ width: pct + '%' }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/30">{formatCurrency(a.recuperado)} recuperado</span>
                    <span className="text-[10px] text-white/30">{formatCurrency(a.total)} total</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}