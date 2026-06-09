'use client'

import Link from 'next/link'
import {
  DollarSign, TrendingUp, CheckCircle2, AlertTriangle,
  Target, FileText, ChevronRight,
  Calendar, PieChart, CreditCard, Wallet, Receipt,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const FINANCEIRO_KPIS = [
  {
    label: 'Saldo a Distribuir',
    value: 'R$ 148.230,00',
    sub: 'aguardando distribuicao',
    icon: DollarSign,
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  {
    label: 'Recebimentos do Periodo',
    value: 'R$ 67.667,38',
    sub: '2Q2026 — em aberto',
    icon: TrendingUp,
    color: 'text-sky-400',
    border: 'border-sky-500/20',
  },
  {
    label: 'Distribuicoes Processadas',
    value: '3',
    sub: 'nos ultimos 90 dias',
    icon: CheckCircle2,
    color: 'text-violet-400',
    border: 'border-violet-500/20',
  },
  {
    label: 'Valores Bloqueados',
    value: 'R$ 4.320,00',
    sub: 'pendentes de validacao juridica',
    icon: AlertTriangle,
    color: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  {
    label: 'ONIs com Potencial Financeiro',
    value: '9',
    sub: 'obras sem identificacao com valor',
    icon: Target,
    color: 'text-rose-400',
    border: 'border-rose-500/20',
  },
  {
    label: 'Prestacao de Contas Pendentes',
    value: '2',
    sub: 'demonstrativos nao enviados',
    icon: FileText,
    color: 'text-orange-400',
    border: 'border-orange-500/20',
  },
]

const MODULE_SHORTCUTS = [
  {
    href: '/master/financeiro/periodos',
    label: 'Periodos de Pagamento',
    icon: Calendar,
    accent: 'text-sky-300',
    border: 'border-sky-500/20',
    bg: 'bg-sky-500/15',
    sub: 'Mensal · Trimestral · Personalizado',
  },
  {
    href: '/master/recebimentos',
    label: 'Recebimentos',
    icon: DollarSign,
    accent: 'text-emerald-300',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/15',
    sub: 'UBEM · ECAD · Globo · Netflix',
  },
  {
    href: '/master/recebimentos/divergencias',
    label: 'Conferencia',
    icon: CheckCircle2,
    accent: 'text-violet-300',
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/15',
    sub: 'Recibo vs. Statements',
  },
  {
    href: '/master/distribuicao',
    label: 'Distribuicoes',
    icon: PieChart,
    accent: 'text-amber-300',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/15',
    sub: 'Apos conferencia validada',
  },
  {
    href: '/master/cc-obra',
    label: 'Conta Corrente — Obras',
    icon: CreditCard,
    accent: 'text-sky-300',
    border: 'border-sky-500/20',
    bg: 'bg-sky-500/15',
    sub: 'Creditos por obra',
  },
  {
    href: '/master/cc-titular',
    label: 'Conta Corrente — Titulares',
    icon: Wallet,
    accent: 'text-rose-300',
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/15',
    sub: 'Carteira financeira do titular',
  },
  {
    href: '/master/prestacao-contas',
    label: 'Prestacao de Contas',
    icon: Receipt,
    accent: 'text-white/70',
    border: 'border-white/10',
    bg: 'bg-white/[0.06]',
    sub: 'Demonstrativos e recibos',
  },
  {
    href: '/master/financeiro-m11/contas-pagar',
    label: 'Adiantamentos',
    icon: Wallet,
    accent: 'text-orange-300',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/15',
    sub: 'Antecipacoes ao titular',
  },
  {
    href: '/master/financeiro-m11/contas-receber',
    label: 'Comissoes',
    icon: TrendingUp,
    accent: 'text-teal-300',
    border: 'border-teal-500/20',
    bg: 'bg-teal-500/15',
    sub: 'Agentes · Captadores · Representantes',
  },
]

const FLUXO = [
  { step: '01', label: 'Periodo', sub: 'Abrir periodo de apuracao', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  { step: '02', label: 'Recebimento', sub: 'Registrar pagamento recebido', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { step: '03', label: 'Conferencia', sub: 'Validar recibo vs. statements', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { step: '04', label: 'Distribuicao', sub: 'Aplicar negocio editorial', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { step: '05', label: 'Conta Corrente', sub: 'Creditar obras e titulares', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { step: '06', label: 'Prestacao', sub: 'Gerar demonstrativos', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
]

export default function FinanceiroDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro — Dashboard"
        description="Central do Dinheiro: recebimentos, conferencia, distribuicao, conta corrente e prestacao de contas."
      />

      {/* 6 KPIs */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
          Indicadores Financeiros
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {FINANCEIRO_KPIS.map(kpi => (
            <div
              key={kpi.label}
              className={`bg-[#0d1526] border ${kpi.border} rounded-xl p-3 flex flex-col gap-1`}
            >
              <div className="flex items-center gap-1.5">
                <kpi.icon className={`w-3 h-3 ${kpi.color}`} />
                <p className="text-[9px] text-white/35 leading-tight">{kpi.label}</p>
              </div>
              <p className={`text-lg font-bold ${kpi.color} leading-tight`}>{kpi.value}</p>
              <p className="text-[9px] text-white/25 leading-tight">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fluxo operacional */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
          Fluxo Operacional
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FLUXO.map((f, i) => (
            <div key={f.step} className="flex items-center gap-2 shrink-0">
              <div className={`border rounded-xl px-3 py-2 text-center min-w-[90px] ${f.color}`}>
                <p className="text-[9px] font-bold opacity-60">{f.step}</p>
                <p className="text-xs font-semibold leading-tight">{f.label}</p>
                <p className="text-[9px] opacity-60 leading-tight mt-0.5">{f.sub}</p>
              </div>
              {i < FLUXO.length - 1 && (
                <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modulos */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
          Modulos Financeiros
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {MODULE_SHORTCUTS.map(mod => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className={`group bg-[#0d1526] border ${mod.border} rounded-xl p-4 flex flex-col gap-2.5 hover:bg-white/[0.02] transition-all`}
              >
                <div className={`${mod.bg} rounded-lg p-2.5 w-fit`}>
                  <Icon className={`w-4 h-4 ${mod.accent}`} />
                </div>
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className={`text-xs font-semibold ${mod.accent} leading-tight`}>{mod.label}</p>
                    <p className="text-[10px] text-white/25 mt-0.5 leading-tight">{mod.sub}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Regra */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-white/40 mb-2 uppercase tracking-wider">Regra do Modulo</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
            <p className="text-xs font-bold text-emerald-400 mb-1">FINANCEIRO processa DINHEIRO</p>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Recebimentos, distribuicao, conta corrente e prestacao de contas.
              Toda receita que entra aqui ja passou pela validacao juridica do BackOffice.
            </p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
            <p className="text-xs font-bold text-amber-400 mb-1">Nenhum valor sem direito juridico</p>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Todo recebimento precisa de <code className="text-amber-300/70">origem_receita_id</code> e{' '}
              <code className="text-amber-300/70">tipo_direito_id</code> identificados antes de entrar na Conta Corrente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
