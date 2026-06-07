'use client'

import { PageHeader } from '@/components/ui/page-header'
import { Calendar, Plus, DollarSign, CheckCircle2, Clock, ChevronRight } from 'lucide-react'

const MOCK_PERIODOS = [
  { id: '1', codigo: '1Q2026', descricao: 'Primeiro Trimestre 2026', tipo: 'trimestral', inicio: '01/01/2026', fim: '31/03/2026', recebimentos: 3, valor_total: 'R$ 148.230,00', status: 'fechado' },
  { id: '2', codigo: '02M2026', descricao: 'Fevereiro 2026', tipo: 'mensal', inicio: '01/02/2026', fim: '28/02/2026', recebimentos: 2, valor_total: 'R$ 67.667,38', status: 'fechado' },
  { id: '3', codigo: '03M2026', descricao: 'Marco 2026', tipo: 'mensal', inicio: '01/03/2026', fim: '31/03/2026', recebimentos: 1, valor_total: 'R$ 38.739,70', status: 'fechado' },
  { id: '4', codigo: '2Q2026', descricao: 'Segundo Trimestre 2026', tipo: 'trimestral', inicio: '01/04/2026', fim: '30/06/2026', recebimentos: 0, valor_total: '—', status: 'aberto' },
  { id: '5', codigo: '04M2026', descricao: 'Abril 2026', tipo: 'mensal', inicio: '01/04/2026', fim: '30/04/2026', recebimentos: 0, valor_total: '—', status: 'aberto' },
]

const TIPO_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  personalizado: 'Personalizado',
}
const STATUS_COLORS: Record<string, string> = {
  fechado: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  aberto: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  processando: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
}
const STATUS_LABELS: Record<string, string> = {
  fechado: 'Fechado',
  aberto: 'Aberto',
  processando: 'Processando',
}

export default function PeriodosPagamentoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Periodos de Pagamento"
        description="Organize os recebimentos por periodo. Formatos: 01M2026 (mensal), 1Q2026 (trimestral), Personalizado."
      />

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {['Todos', 'Mensal', 'Trimestral', 'Personalizado'].map(tab => (
            <button
              key={tab}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${tab === 'Todos' ? 'bg-sky-600 text-white' : 'bg-white/[0.04] text-white/50 hover:text-white/70 hover:bg-white/[0.06]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          Novo Periodo
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Periodos Ativos', value: '5', icon: Calendar, color: 'text-sky-400' },
          { label: 'Periodos Fechados', value: '3', icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Recebimentos Vinculados', value: '6', icon: DollarSign, color: 'text-amber-400' },
          { label: 'Periodos em Aberto', value: '2', icon: Clock, color: 'text-white/60' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <stat.icon className={`w-3 h-3 ${stat.color}`} />
              <p className="text-[10px] text-white/35">{stat.label}</p>
            </div>
            <p className={`text-xl font-bold ${stat.color} leading-tight`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_100px_100px_100px_120px_40px] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
          {['Codigo', 'Descricao', 'Tipo', 'Inicio', 'Fim', 'Status', ''].map(h => (
            <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {MOCK_PERIODOS.map((p, idx) => (
          <div
            key={p.id}
            className={`grid grid-cols-[110px_1fr_100px_100px_100px_120px_40px] gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors ${idx < MOCK_PERIODOS.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
          >
            <p className="text-sm font-mono font-bold text-sky-400">{p.codigo}</p>
            <div>
              <p className="text-sm text-white/80">{p.descricao}</p>
              {p.recebimentos > 0 && (
                <p className="text-[10px] text-white/30 mt-0.5">{p.recebimentos} recebimento(s) · {p.valor_total}</p>
              )}
            </div>
            <span className="text-xs text-white/50">{TIPO_LABELS[p.tipo]}</span>
            <p className="text-xs text-white/50">{p.inicio}</p>
            <p className="text-xs text-white/50">{p.fim}</p>
            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[p.status]}`}>
              {STATUS_LABELS[p.status]}
            </span>
            <button className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-white/50 mb-2">Formatos de periodo suportados</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { codigo: '01M2026', desc: 'Janeiro 2026', tipo: 'Mensal' },
            { codigo: '1Q2026', desc: 'Trimestre 1 2026', tipo: 'Trimestral' },
            { codigo: 'CUSTOM', desc: 'Periodo livre', tipo: 'Personalizado' },
          ].map(f => (
            <div key={f.codigo} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">
              <p className="text-sm font-mono font-bold text-sky-400">{f.codigo}</p>
              <p className="text-xs text-white/50 mt-0.5">{f.desc}</p>
              <p className="text-[10px] text-white/25 mt-1">{f.tipo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
