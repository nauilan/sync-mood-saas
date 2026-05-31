'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_CC_TITULAR, fmtBRL } from '@/lib/mock-bi'
import { Wallet, Download } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'saldo_total', label: 'Saldo Total', count: BI_CC_TITULAR.total_titulares_com_cc },
  { id: 'disponivel', label: 'Disponível', count: BI_CC_TITULAR.total_titulares_com_cc },
  { id: 'bloqueado', label: 'Bloqueado', count: BI_CC_TITULAR.total_titulares_com_cc },
  { id: 'creditos', label: 'Créditos', count: BI_CC_TITULAR.total_titulares_com_cc },
  { id: 'debitos', label: 'Débitos', count: BI_CC_TITULAR.total_titulares_com_cc },
  { id: 'retencoes', label: 'Retenções', count: BI_CC_TITULAR.total_titulares_com_cc },
  { id: 'futuros_previstos', label: 'Futuros Previstos', count: BI_CC_TITULAR.total_titulares_com_cc },
  { id: 'por_titular', label: 'Por Titular', count: BI_CC_TITULAR.por_titular.length },
  { id: 'top5_saldo', label: 'Top 5 Saldo', count: BI_CC_TITULAR.top5_saldo.length },
  { id: 'inadimplentes', label: 'Inadimplentes', count: 2 },
]

export default function RelCcTitularPage() {
  const [sub, setSub] = useState('top5_saldo')
  const [exportModal, setExportModal] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleExport(fmt: string) {
    setExportModal(fmt)
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const activeSub = SUBS.find(s => s.id === sub)!

  function getColumnValue(subId: string): string {
    if (subId === 'creditos') return 'Créditos'
    if (subId === 'debitos') return 'Débitos'
    if (subId === 'retencoes') return 'Retenções'
    if (subId === 'disponivel') return 'Disponível'
    if (subId === 'bloqueado') return 'Bloqueado'
    if (subId === 'futuros_previstos') return 'Previsto'
    return 'Saldo'
  }

  function getColumnMockValue(subId: string, i: number): number {
    const base = 5000 + i * 3200
    if (subId === 'creditos') return base * 4
    if (subId === 'debitos') return base * 3
    if (subId === 'retencoes') return base * 0.5
    if (subId === 'futuros_previstos') return base * 1.2
    return base
  }

  return (
    <div className="space-y-5">
      <PageHeader title="CC Titulares" description="Contas correntes dos titulares: saldo, créditos e débitos." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Titulares c/ CC" value={String(BI_CC_TITULAR.total_titulares_com_cc)} accent="violet" subtitle="com conta corrente" icon={<Wallet className="w-4 h-4 text-indigo-400" />} />
        <KpiCard title="Saldo Total" value={fmtBRL(BI_CC_TITULAR.saldo_total)} accent="emerald" subtitle="em carteira" icon={<Wallet className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Saldo Disponível" value={fmtBRL(BI_CC_TITULAR.saldo_disponivel)} accent="sky" subtitle="liberado p/ pagamento" icon={<Wallet className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Bloqueado" value={fmtBRL(BI_CC_TITULAR.saldo_bloqueado)} accent="amber" subtitle="em retenção" icon={<Wallet className="w-4 h-4 text-amber-400" />} />
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-indigo-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-300 transition-all"
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
              {sub === 'top5_saldo' ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Posição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Titular</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Saldo</th>
                </>
              ) : sub === 'por_titular' ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Titular</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Saldo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Disponível</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Bloqueado</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Titular</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">{getColumnValue(sub)}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sub === 'top5_saldo' && BI_CC_TITULAR.top5_saldo.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/40 font-mono text-xs">#{i + 1}</td>
                <td className="px-4 py-3 text-white/70">{row.titular}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-mono text-xs">{fmtBRL(row.saldo)}</td>
              </tr>
            ))}
            {sub === 'por_titular' && BI_CC_TITULAR.por_titular.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.titular}</td>
                <td className="px-4 py-3 text-right text-white/70 font-mono text-xs">{fmtBRL(row.saldo)}</td>
                <td className="px-4 py-3 text-right text-sky-400 font-mono text-xs">{fmtBRL(row.disponivel)}</td>
                <td className="px-4 py-3 text-right text-amber-400 font-mono text-xs">{fmtBRL(row.bloqueado)}</td>
              </tr>
            ))}
            {sub !== 'top5_saldo' && sub !== 'por_titular' && Array.from({ length: Math.min(activeSub.count, 8) }, (_, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/40 font-mono text-xs">CC-TIT-{String(i + 1).padStart(3, '0')}</td>
                <td className="px-4 py-3 text-white/70">Titular Demo {i + 1}</td>
                <td className="px-4 py-3 text-white/50">Autor</td>
                <td className="px-4 py-3 text-right text-white/70 font-mono text-xs">{fmtBRL(getColumnMockValue(sub, i))}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${sub === 'bloqueado' ? 'bg-amber-500/10 text-amber-400' : sub === 'inadimplentes' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {sub === 'bloqueado' ? 'bloqueado' : sub === 'inadimplentes' ? 'inadimplente' : 'ativo'}
                  </span>
                </td>
              </tr>
            ))}
            {activeSub.count === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">
                  <Wallet className="w-8 h-8 text-white/15 mx-auto mb-2" />
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
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-indigo-400" />
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
                className="w-full py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
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
