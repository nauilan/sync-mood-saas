'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { Download, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { MOCK_FLUXO_CAIXA, fmtBRL, fmtDate } from '@/lib/mock-financeiro-m11'

type Periodo = '30' | '60' | '90'

export default function FluxoCaixaPage() {
  const [periodo, setPeriodo] = useState<Periodo>('30')
  const [categoria, setCategoria] = useState('todas')

  const fluxoFiltrado = MOCK_FLUXO_CAIXA.filter(f => categoria === 'todas' || f.categoria === categoria)
  const categorias = Array.from(new Set(MOCK_FLUXO_CAIXA.map(f => f.categoria)))

  const totalEntradas = fluxoFiltrado.filter(f => f.tipo === 'entrada').reduce((s, f) => s + f.valor, 0)
  const totalSaidas = fluxoFiltrado.filter(f => f.tipo === 'saida').reduce((s, f) => s + f.valor, 0)
  const saldoFinal = fluxoFiltrado.length > 0 ? fluxoFiltrado[fluxoFiltrado.length - 1].saldo_acumulado : 0

  const maxVal = Math.max(...fluxoFiltrado.map(f => f.valor), 1)

  function mockExportCSV() {
    const rows = ['Data,Tipo,Categoria,Descricao,Valor,Saldo Acumulado', ...fluxoFiltrado.map(f => `${f.data},${f.tipo},${f.categoria},"${f.descricao ?? ''}",${f.valor},${f.saldo_acumulado}`)]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'fluxo-caixa.csv'; a.click()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fluxo de Caixa"
        description="Visão de entradas, saídas e saldo projetado."
        actions={
          <button onClick={mockExportCSV} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.10] text-xs text-white/50 hover:text-white/80 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Total Entradas" value={fmtBRL(totalEntradas)} accent="emerald" icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Total Saídas" value={fmtBRL(totalSaidas)} accent="rose" icon={<TrendingDown className="w-4 h-4 text-rose-400" />} />
        <KpiCard title="Saldo Final" value={fmtBRL(saldoFinal)} accent="violet" icon={<Activity className="w-4 h-4 text-violet-400" />} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {(['30', '60', '90'] as Periodo[]).map(p => (
            <button key={p} onClick={() => setPeriodo(p)} className={['h-8 px-3 rounded-lg text-xs font-medium transition-colors', periodo === p ? 'bg-violet-600 text-white' : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80'].join(' ')}>
              {p}d
            </button>
          ))}
        </div>
        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/60 outline-none">
          <option value="todas">Todas categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Bar chart */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white/60 mb-4">Movimentos — {fluxoFiltrado.length} transações</h3>
        <div className="flex items-end gap-1 h-28">
          {fluxoFiltrado.map((f, i) => {
            const h = Math.max(4, (f.valor / maxVal) * 100)
            return (
              <div key={i} className="flex-1 rounded-t min-h-[4px] transition-all"
                style={{ height: `${h}%`, backgroundColor: f.tipo === 'entrada' ? 'rgba(52,211,153,0.5)' : 'rgba(251,113,133,0.5)' }}
                title={`${f.data} · ${f.categoria} · ${fmtBRL(f.valor)}`}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-white/30"><span className="w-3 h-2 rounded bg-emerald-400/50" />Entradas</span>
          <span className="flex items-center gap-1 text-[10px] text-white/30"><span className="w-3 h-2 rounded bg-rose-400/50" />Saídas</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Data</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Categoria</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden lg:table-cell">Descrição</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden sm:table-cell">Saldo Acum.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {fluxoFiltrado.map(f => (
              <tr key={f.id} className="hover:bg-white/[0.02]">
                <td className="px-5 py-2.5 text-xs text-white/50 tabular-nums">{fmtDate(f.data)}</td>
                <td className="px-4 py-2.5">
                  <span className={['text-[10px] font-semibold px-1.5 py-0.5 rounded border', f.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'].join(' ')}>
                    {f.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                  </span>
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell text-xs text-white/50">{f.categoria}</td>
                <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-white/40">{f.descricao}</td>
                <td className={['px-4 py-2.5 text-right text-sm font-semibold tabular-nums', f.tipo === 'entrada' ? 'text-emerald-400' : 'text-rose-400'].join(' ')}>{fmtBRL(f.valor)}</td>
                <td className="px-4 py-2.5 text-right hidden sm:table-cell text-xs text-white/40 tabular-nums">{fmtBRL(f.saldo_acumulado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
