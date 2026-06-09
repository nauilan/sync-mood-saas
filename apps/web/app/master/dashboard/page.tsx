'use client'

import { useEffect, useState } from 'react'
import { MOCK_INTEGRACOES } from '@/lib/mock-config'
import { fmtBRL } from '@/lib/mock-bi'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import {
  Users, Music, FileText, DollarSign, Shield,
  AlertTriangle, Wallet, CreditCard, TrendingUp, Tv,
  CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

function statusIcon(status: string) {
  if (status === 'ativa') return <CheckCircle2 className="w-3 h-3 text-emerald-400" />
  if (status === 'erro') return <XCircle className="w-3 h-3 text-rose-400" />
  return <AlertCircle className="w-3 h-3 text-amber-400" />
}

function statusBadgeClass(status: string) {
  if (status === 'ativa') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  if (status === 'erro') return 'bg-rose-500/10 border-rose-500/20 text-rose-400'
  return 'bg-amber-500/10 border-amber-500/20 text-amber-400'
}

interface DashKpis {
  totalObras: number
  totalTitulares: number
  totalGravacoes: number
  totalContratos: number
}

export default function MasterDashboardPage() {
  const [kpis, setKpis] = useState<DashKpis>({
    totalObras: 0,
    totalTitulares: 0,
    totalGravacoes: 0,
    totalContratos: 0,
  })
  const [topObras, setTopObras] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      authFetch('/api/titulares?per_page=1').then(r => r.json()).catch(() => ({})),
      authFetch('/api/obras?per_page=5').then(r => r.json()).catch(() => ({})),
      authFetch('/api/fonogramas?per_page=1').then(r => r.json()).catch(() => ({})),
      authFetch('/api/contratos?per_page=1').then(r => r.json()).catch(() => ({})),
    ]).then(([tit, obs, fono, contr]) => {
      setKpis({
        totalTitulares: tit.total ?? 0,
        totalObras:     obs.total ?? 0,
        totalGravacoes: fono.total ?? 0,
        totalContratos: contr.total ?? 0,
      })
      if (obs.data?.length > 0) setTopObras(obs.data)
    })
  }, [])

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 space-y-6 animate-[fade-in-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">

      <PageHeader
        title="Dashboard Global"
        description="Visão executiva cross-módulos — Sync Mood Gestão Inteligente"
      />

      {/* ── Bento Grid: 8 KPI Cards (4 cols × 2 rows) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Titulares"
          value={kpis.totalTitulares}
          subtitle={kpis.totalTitulares > 0 ? `${kpis.totalTitulares} cadastrados` : '—'}
          accent="emerald"
          icon={<Users className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />}
        />
        <KpiCard
          title="Total Obras"
          value={kpis.totalObras}
          subtitle={kpis.totalObras > 0 ? `${kpis.totalObras} cadastradas` : '—'}
          accent="violet"
          icon={<Music className="w-4 h-4 text-violet-400" strokeWidth={1.5} />}
        />
        <KpiCard
          title="Gravações"
          value={kpis.totalGravacoes}
          subtitle={kpis.totalGravacoes > 0 ? `${kpis.totalGravacoes} fonogramas` : '—'}
          accent="sky"
          icon={<FileText className="w-4 h-4 text-sky-400" strokeWidth={1.5} />}
        />
        <KpiCard
          title="Contratos"
          value={kpis.totalContratos}
          subtitle={kpis.totalContratos > 0 ? `${kpis.totalContratos} contratos` : '—'}
          accent="amber"
          icon={<DollarSign className="w-4 h-4 text-amber-400" strokeWidth={1.5} />}
        />
        <KpiCard
          title="Autorizações Pendentes"
          value={0}
          subtitle="—"
          accent="rose"
          icon={<Shield className="w-4 h-4 text-rose-400" strokeWidth={1.5} />}
        />
        <KpiCard
          title="Divergências Abertas"
          value={0}
          subtitle="—"
          accent="amber"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={1.5} />}
        />
        <KpiCard
          title="Saldo Total CC"
          value={fmtBRL(0)}
          subtitle="—"
          accent="sky"
          icon={<Wallet className="w-4 h-4 text-sky-400" strokeWidth={1.5} />}
        />
        <KpiCard
          title="A Pagar 7 dias"
          value={fmtBRL(0)}
          subtitle="—"
          accent="violet"
          icon={<CreditCard className="w-4 h-4 text-violet-400" strokeWidth={1.5} />}
        />
      </div>

      {/* ── Bottom sections: 3-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top 5 Obras */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-white/80">Obras Cadastradas</h2>
          </div>
          <ul className="space-y-2.5">
            {topObras.length === 0 && (
              <li className="text-xs text-white/30 text-center py-4">Sem obras cadastradas</li>
            )}
            {topObras.map((item: any, i: number) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-white/20 w-4 shrink-0 tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/70 truncate">{item.titulo}</p>
                  <p className="text-[10px] text-white/30">{item.codigo_obra ?? '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    item.status === 'ativa' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'
                  }`}>{item.status ?? '—'}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Top 5 Emissoras TV */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
              <Tv className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-white/80">Top 5 Emissoras TV</h2>
          </div>
          <ul className="space-y-2.5">
            <li className="text-xs text-white/30 text-center py-4">Sem dados de execução TV</li>
          </ul>
        </div>

        {/* Integrações */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-white/80">Integrações</h2>
          </div>
          <div className="space-y-2">
            {MOCK_INTEGRACOES.map(integ => (
              <div
                key={integ.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${statusBadgeClass(integ.status)}`}
              >
                {statusIcon(integ.status)}
                <span className="text-xs font-medium flex-1 truncate">{integ.nome}</span>
                <span className="text-[10px] capitalize opacity-70">{integ.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
