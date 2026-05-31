'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Banknote,
} from 'lucide-react'
import { KPI_FINANCEIRO, MOCK_PAGAMENTOS, MOCK_RECEBIMENTOS_FIN, MOCK_FLUXO_CAIXA, MOCK_CONTAS_BANCARIAS, fmtBRL } from '@/lib/mock-financeiro-m11'

export default function FinanceiroDashboardPage() {
  const pagamentosVencendo = MOCK_PAGAMENTOS.filter(p =>
    p.status === 'programado' && p.data_programada && p.data_programada <= '2026-05-28'
  )
  const recebimentosAtrasados = MOCK_RECEBIMENTOS_FIN.filter(r => r.status === 'inadimplente')
  const falhas = MOCK_PAGAMENTOS.filter(p => p.status === 'falhou')

  // Fluxo últimos 15 dias (entradas vs saidas)
  const fluxoRecente = MOCK_FLUXO_CAIXA.slice(-10)

  const maxFluxo = Math.max(...MOCK_FLUXO_CAIXA.map(f => f.valor), 1)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Financeiro"
        description="Visão executiva de fluxo, pagamentos, recebimentos e contas bancárias."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="A Pagar (30d)" value={fmtBRL(KPI_FINANCEIRO.a_pagar_30d)} accent="rose" subtitle="programados e em processo" icon={<TrendingDown className="w-4 h-4 text-rose-400" />} />
        <KpiCard title="A Receber (30d)" value={fmtBRL(KPI_FINANCEIRO.a_receber_30d)} accent="emerald" subtitle="previstos" icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Fluxo Caixa Hoje" value={fmtBRL(KPI_FINANCEIRO.fluxo_caixa_hoje)} accent="sky" subtitle="saldo do dia" icon={<DollarSign className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Saldo Total Contas" value={fmtBRL(KPI_FINANCEIRO.saldo_total_contas)} accent="violet" subtitle="—" icon={<Banknote className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Inadimplência" value={fmtBRL(KPI_FINANCEIRO.inadimplencia)} accent="amber" subtitle="recebimentos vencidos" icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="IR Retido (Mês)" value={fmtBRL(KPI_FINANCEIRO.impostos_retidos_mes)} accent="amber" subtitle="—" icon={<CreditCard className="w-4 h-4 text-orange-400" />} />
      </div>

      {/* Alertas */}
      {(pagamentosVencendo.length > 0 || recebimentosAtrasados.length > 0 || falhas.length > 0) && (
        <div className="space-y-2">
          {pagamentosVencendo.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/80">{pagamentosVencendo.length} pagamento(s) programado(s) vencendo nos próximos 7 dias.</p>
            </div>
          )}
          {recebimentosAtrasados.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-400/80">{recebimentosAtrasados.length} recebimento(s) em atraso (inadimplente).</p>
            </div>
          )}
          {falhas.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-400/80">{falhas.length} pagamento(s) falharam — verifique Contas a Pagar.</p>
            </div>
          )}
        </div>
      )}

      {/* Contas bancárias */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_CONTAS_BANCARIAS.map(cb => (
          <Link
            key={cb.id}
            href="/master/financeiro-m11/contas-bancarias"
            className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 hover:border-violet-500/20 transition-colors"
          >
            <p className="text-[10px] text-white/30 mb-0.5">{cb.banco}</p>
            <p className="text-lg font-bold text-white/80 tabular-nums">{fmtBRL(cb.saldo_atual, cb.moeda ?? 'BRL')}</p>
            <p className="text-[10px] text-white/30">{cb.tipo} · {cb.moeda ?? 'BRL'}</p>
          </Link>
        ))}
      </div>

      {/* Fluxo caixa próximos 30d — bar chart */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white/70 mb-4">Fluxo de Caixa — próximos 30 dias</h3>
        <div className="flex items-end gap-1 h-24">
          {MOCK_FLUXO_CAIXA.map((f, i) => {
            const h = Math.max(4, (f.valor / maxFluxo) * 100)
            return (
              <div key={i} className="flex-1 rounded-t min-h-[4px]" style={{ height: `${h}%`, backgroundColor: f.tipo === 'entrada' ? 'rgba(52,211,153,0.4)' : 'rgba(251,113,133,0.4)' }} title={`${f.descricao}: ${fmtBRL(f.valor)}`} />
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-white/30"><span className="w-3 h-2 rounded bg-emerald-500/40 inline-block" />Entradas</span>
          <span className="flex items-center gap-1 text-[10px] text-white/30"><span className="w-3 h-2 rounded bg-rose-500/40 inline-block" />Saídas</span>
        </div>
      </div>

      {/* Links rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { href: '/master/financeiro-m11/contas-pagar', label: 'Contas a Pagar', icon: <TrendingDown className="w-4 h-4 text-rose-400" /> },
          { href: '/master/financeiro-m11/contas-receber', label: 'Contas a Receber', icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
          { href: '/master/financeiro-m11/fluxo-caixa', label: 'Fluxo de Caixa', icon: <DollarSign className="w-4 h-4 text-sky-400" /> },
          { href: '/master/financeiro-m11/conciliacao-bancaria', label: 'Conciliação Bancária', icon: <CreditCard className="w-4 h-4 text-violet-400" /> },
          { href: '/master/financeiro-m11/contas-bancarias', label: 'Contas Bancárias', icon: <Banknote className="w-4 h-4 text-amber-400" /> },
        ].map(link => (
          <Link key={link.href} href={link.href} className="flex items-center justify-between p-4 bg-[#0d1526] border border-white/[0.06] rounded-xl hover:border-violet-500/20 transition-colors group">
            <div className="flex items-center gap-2.5">
              {link.icon}
              <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{link.label}</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-violet-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
