'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_ROYALTIES_FUTUROS, fmtBRL } from '@/lib/mock-bi'
import { BarChart3, Download } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'apurados', label: 'Apurados', count: BI_ROYALTIES_FUTUROS.por_trimestre.length },
  { id: 'conciliados', label: 'Conciliados', count: BI_ROYALTIES_FUTUROS.por_trimestre.filter(t => t.status === 'pago' || t.status === 'conciliado').length },
  { id: 'previsto_q2', label: 'Previsto Q2', count: 1 },
  { id: 'previsto_q3', label: 'Previsto Q3', count: 1 },
  { id: 'pendente_liberacao', label: 'Pendente Liberação', count: 3 },
  { id: 'em_contestacao', label: 'Em Contestação', count: 2 },
  { id: 'bloqueados', label: 'Bloqueados', count: 2 },
]

const STATUS_STYLES: Record<string, string> = {
  pago: 'bg-emerald-500/10 text-emerald-400',
  conciliado: 'bg-sky-500/10 text-sky-400',
  previsto: 'bg-amber-500/10 text-amber-400',
  pendente: 'bg-orange-500/10 text-orange-400',
  bloqueado: 'bg-rose-500/10 text-rose-400',
  em_contestacao: 'bg-red-500/10 text-red-400',
}

export default function RelRoyaltiesFuturosPage() {
  const [sub, setSub] = useState('apurados')
  const [exportModal, setExportModal] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleExport(fmt: string) {
    setExportModal(fmt)
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const activeSub = SUBS.find(s => s.id === sub)!

  function getFilteredTrimestres() {
    if (sub === 'apurados') return BI_ROYALTIES_FUTUROS.por_trimestre
    if (sub === 'conciliados') return BI_ROYALTIES_FUTUROS.por_trimestre.filter(t => t.status === 'pago' || t.status === 'conciliado')
    if (sub === 'previsto_q2') return BI_ROYALTIES_FUTUROS.por_trimestre.filter(t => t.trimestre === '2026-Q2')
    if (sub === 'previsto_q3') return BI_ROYALTIES_FUTUROS.por_trimestre.filter(t => t.trimestre === '2026-Q3')
    if (sub === 'pendente_liberacao') return BI_ROYALTIES_FUTUROS.por_trimestre.filter(t => t.status === 'previsto')
    return BI_ROYALTIES_FUTUROS.por_trimestre
  }

  const rows = getFilteredTrimestres()

  return (
    <div className="space-y-5">
      <PageHeader title="Royalties Futuros" description="Apuração, previsão e liberação de royalties por trimestre." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total Apurados" value={fmtBRL(BI_ROYALTIES_FUTUROS.total_apurados)} accent="sky" subtitle="valor total" icon={<BarChart3 className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Conciliados" value={fmtBRL(BI_ROYALTIES_FUTUROS.total_conciliados)} accent="emerald" subtitle="confirmados" icon={<BarChart3 className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Pendente Liberação" value={fmtBRL(BI_ROYALTIES_FUTUROS.pendente_liberacao)} accent="amber" subtitle="aguardando" icon={<BarChart3 className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Bloqueados" value={fmtBRL(BI_ROYALTIES_FUTUROS.bloqueados)} accent="rose" subtitle="em revisão" icon={<BarChart3 className="w-4 h-4 text-rose-400" />} />
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-yellow-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-yellow-500/10 hover:border-yellow-500/30 hover:text-yellow-300 transition-all"
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
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Trimestre</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Variação</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row, i) => {
              const prev = i > 0 ? rows[i - 1].valor : null
              const variacao = prev ? ((row.valor - prev) / prev * 100) : null
              return (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/70 font-mono text-xs">{row.trimestre}</td>
                  <td className="px-4 py-3 text-right text-white/70 font-mono text-xs">{fmtBRL(row.valor)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_STYLES[row.status] ?? 'bg-white/10 text-white/50'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {variacao !== null ? (
                      <span className={variacao >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-white/30 text-sm">
                  <BarChart3 className="w-8 h-8 text-white/15 mx-auto mb-2" />
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Export modal */}
      {exportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#12111e] border border-white/[0.08] rounded-2xl p-6 w-80 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-yellow-400" />
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
                className="w-full py-2 rounded-xl bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition-colors"
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
