'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_FINANCEIRO, fmtBRL } from '@/lib/mock-bi'
import { TrendingUp, Download } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'a_pagar', label: 'A Pagar', count: 0 },
  { id: 'a_receber', label: 'A Receber', count: 0 },
  { id: 'fluxo_caixa', label: 'Fluxo de Caixa', count: BI_FINANCEIRO.por_mes.length },
  { id: 'programados', label: 'Programados', count: 0 },
  { id: 'impostos', label: 'Impostos', count: 0 },
  { id: 'inadimplencia', label: 'Inadimplência', count: 0 },
  { id: 'por_conta', label: 'Por Conta', count: BI_FINANCEIRO.por_conta.length },
  { id: 'por_mes', label: 'Por Mês', count: BI_FINANCEIRO.por_mes.length },
  { id: 'saldo_contas', label: 'Saldo Contas', count: BI_FINANCEIRO.por_conta.length },
]

export default function RelFinanceirosPage() {
  const [sub, setSub] = useState('por_mes')
  const [exportModal, setExportModal] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleExport(fmt: string) {
    setExportModal(fmt)
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const activeSub = SUBS.find(s => s.id === sub)!

  return (
    <div className="space-y-5">
      <PageHeader title="Relatório Financeiro" description="Fluxo de caixa, contas a pagar/receber e saldo por conta." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Saldo Total Contas" value={fmtBRL(BI_FINANCEIRO.saldo_total_contas)} accent="emerald" subtitle="em caixa" icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="A Pagar" value={fmtBRL(BI_FINANCEIRO.a_pagar_total)} accent="rose" subtitle="pendente" icon={<TrendingUp className="w-4 h-4 text-rose-400" />} />
        <KpiCard title="A Receber" value={fmtBRL(BI_FINANCEIRO.a_receber_total)} accent="sky" subtitle="em aberto" icon={<TrendingUp className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Fluxo do Mês" value={fmtBRL(BI_FINANCEIRO.fluxo_caixa_mes)} accent="violet" subtitle="—" icon={<TrendingUp className="w-4 h-4 text-violet-400" />} />
      </div>

      {/* Filtros universais */}
      <div className="flex flex-wrap gap-2">
        {UNIVERSAL_FILTERS.map(f => (
          <select key={f} className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white/50 focus:outline-none">
            <option>{f}: Todos</option>
          </select>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {SUBS.map(s => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-green-700 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
          >
            {s.label} <span className="ml-1 opacity-60">({s.count})</span>
          </button>
        ))}
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{activeSub.count} registro(s) — {activeSub.label}</p>
        <div className="flex gap-2">
          {(['PDF', 'Excel', 'CSV'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-300 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              {(sub === 'por_conta' || sub === 'saldo_contas') ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Banco</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Saldo Atual</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">% Total</th>
                </>
              ) : (sub === 'por_mes' || sub === 'fluxo_caixa') ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Mês</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Entradas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Saídas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Saldo</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Vencimento</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {(sub === 'por_conta' || sub === 'saldo_contas') && BI_FINANCEIRO.por_conta.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.banco}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-mono text-xs">{fmtBRL(row.saldo)}</td>
                <td className="px-4 py-3 text-right text-white/40 text-xs">
                  {((row.saldo / BI_FINANCEIRO.saldo_total_contas) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
            {(sub === 'por_mes' || sub === 'fluxo_caixa') && BI_FINANCEIRO.por_mes.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.mes}</td>
                <td className="px-4 py-3 text-right text-sky-400 font-mono text-xs">{fmtBRL(row.entradas)}</td>
                <td className="px-4 py-3 text-right text-rose-400 font-mono text-xs">{fmtBRL(row.saidas)}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-mono text-xs">{fmtBRL(row.saldo)}</td>
              </tr>
            ))}
            {sub !== 'por_conta' && sub !== 'saldo_contas' && sub !== 'por_mes' && sub !== 'fluxo_caixa' && (
              Array.from({ length: Math.min(activeSub.count, 8) }, (_, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/40 font-mono text-xs">FIN-{String(i + 1).padStart(3, '0')}</td>
                  <td className="px-4 py-3 text-white/70">{sub === 'a_pagar' ? 'Pagamento Royalties' : sub === 'a_receber' ? 'Recebimento Sync' : sub === 'impostos' ? 'ISS Serviços' : sub === 'programados' ? 'Pagto Programado' : 'Cobrança Pendente'} {i + 1}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{`${String((i % 28) + 1).padStart(2, '0')}/06/2026`}</td>
                  <td className="px-4 py-3 text-right text-white/70 font-mono text-xs">{fmtBRL(0)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${sub === 'a_pagar' || sub === 'programados' ? 'bg-amber-500/10 text-amber-400' : sub === 'inadimplencia' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {sub === 'a_pagar' ? 'a pagar' : sub === 'a_receber' ? 'a receber' : sub === 'programados' ? 'programado' : sub === 'inadimplencia' ? 'inadimplente' : 'pendente'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Export modal */}
      {exportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#12111e] border border-white/[0.08] rounded-2xl p-6 w-80 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Exportação {exportModal}</p>
              {exporting ? (
                <p className="text-white/40 text-sm mt-1">Gerando arquivo...</p>
              ) : (
                <p className="text-emerald-400 text-sm mt-1">Arquivo gerado com sucesso!</p>
              )}
            </div>
            {!exporting && (
              <button
                onClick={() => setExportModal(null)}
                className="w-full py-2 rounded-xl bg-green-700 text-white text-sm hover:bg-green-800 transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
