'use client'
import Link from 'next/link'
import { CheckCircle, TrendingUp, DollarSign, Clock, Music2 } from 'lucide-react'
import { PortalNav } from '@/components/portal/portal-nav'
import { PORTAL_KPIS, PORTAL_RECEBIMENTOS, PORTAL_PERFIL } from '@/lib/mock-portal-autor'
import { fmtBRL } from '@/lib/mock-bi'

const KPI_CARDS = [
  {
    label: 'Saldo Disponível',
    value: PORTAL_KPIS.saldo_disponivel,
    color: 'emerald',
    icon: CheckCircle,
    sub: 'Disponível para saque',
  },
  {
    label: 'Saldo Bloqueado',
    value: PORTAL_KPIS.saldo_bloqueado,
    color: 'amber',
    icon: Clock,
    sub: 'Aguardando liberação',
  },
  {
    label: 'Recebimentos 12m',
    value: PORTAL_KPIS.recebimentos_12m,
    color: 'violet',
    icon: DollarSign,
    sub: 'Últimos 12 meses',
  },
  {
    label: 'Royalties Futuros',
    value: PORTAL_KPIS.royalties_futuros_previstos,
    color: 'sky',
    icon: TrendingUp,
    sub: 'Previsão próximos 2 trim.',
  },
]

const colorMap: Record<string, { ring: string; text: string; bg: string; badge: string }> = {
  emerald: { ring: 'ring-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/20 text-emerald-300' },
  amber: { ring: 'ring-amber-500/20', text: 'text-amber-400', bg: 'bg-amber-500/10', badge: 'bg-amber-500/20 text-amber-300' },
  violet: { ring: 'ring-violet-500/20', text: 'text-violet-400', bg: 'bg-violet-500/10', badge: 'bg-violet-500/20 text-violet-300' },
  sky: { ring: 'ring-sky-500/20', text: 'text-sky-400', bg: 'bg-sky-500/10', badge: 'bg-sky-500/20 text-sky-300' },
}

const statusMap: Record<string, string> = {
  pago: 'bg-emerald-500/20 text-emerald-300',
  pendente: 'bg-amber-500/20 text-amber-300',
  bloqueado: 'bg-red-500/20 text-red-300',
  em_analise: 'bg-sky-500/20 text-sky-300',
}

const statusLabel: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  bloqueado: 'Bloqueado',
  em_analise: 'Em análise',
}

export default function PortalDashboardPage() {
  const ultimasMovimentacoes = PORTAL_RECEBIMENTOS.slice(0, 5)

  return (
    <>
      <PortalNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            NB
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{PORTAL_PERFIL.nome}</h2>
            <p className="text-sm text-white/40">
              Pseudônimo: <span className="text-white/60">{PORTAL_PERFIL.nome_artistico}</span>
              <span className="mx-2 text-white/20">·</span>
              Editora: <span className="text-violet-300">{PORTAL_PERFIL.editora_nome}</span>
            </p>
            <p className="text-xs text-white/30 mt-1">
              CAE: {PORTAL_PERFIL.cae} · IPI: {PORTAL_PERFIL.ipi}
            </p>
          </div>
          <div className="ml-auto shrink-0">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
              DEMO MODE
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map((kpi) => {
            const c = colorMap[kpi.color]
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className={`bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 ring-1 ${c.ring}`}>
                <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <p className="text-xs text-white/40 mb-1">{kpi.label}</p>
                <p className={`text-xl font-bold ${c.text}`}>{fmtBRL(kpi.value)}</p>
                <p className="text-xs text-white/25 mt-1">{kpi.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Últimas Movimentações */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">Últimas Movimentações</h3>
            <Link href="/portal/recebimentos" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {ultimasMovimentacoes.map((rec) => (
              <div key={rec.id} className={`px-5 py-3.5 flex items-center gap-4 ${rec.is_ecad_informativo ? 'border-l-2 border-amber-500/60' : ''}`}>
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Music2 className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate font-medium">{rec.obra_titulo}</p>
                  <p className="text-xs text-white/35 truncate">{rec.fonte} · {rec.periodo}</p>
                </div>
                {rec.is_ecad_informativo && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium shrink-0">
                    ECAD
                  </span>
                )}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-emerald-400">{fmtBRL(rec.valor_liquido)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusMap[rec.status]}`}>
                    {statusLabel[rec.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pendências */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Pendências</h3>
          {PORTAL_PERFIL.pendencias.length === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-emerald-300 font-medium">Sem pendências</p>
                <p className="text-xs text-white/30">Tudo em ordem por aqui.</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {PORTAL_PERFIL.pendencias.map((p, i) => (
                <li key={i} className="text-sm text-amber-300 bg-amber-500/10 rounded-xl px-4 py-3">{p.mensagem}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
