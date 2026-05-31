'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_CC_OBRA, fmtBRL } from '@/lib/mock-bi'
import { Music, Download } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'saldo', label: 'Saldo', count: BI_CC_OBRA.total_obras_com_cc },
  { id: 'entradas', label: 'Entradas', count: BI_CC_OBRA.total_obras_com_cc },
  { id: 'distribuidos', label: 'Distribuídos', count: BI_CC_OBRA.total_obras_com_cc },
  { id: 'recoupment', label: 'Recoupment', count: BI_CC_OBRA.por_obra.length },
  { id: 'por_obra', label: 'Por Obra (Detalhado)', count: BI_CC_OBRA.por_obra.length },
  { id: 'top5_saldo', label: 'Top 5 Saldo', count: BI_CC_OBRA.top5_saldo.length },
  { id: 'em_aberto', label: 'Em Aberto', count: BI_CC_OBRA.total_obras_com_cc },
]

export default function RelCcObraPage() {
  const [sub, setSub] = useState('top5_saldo')
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
      <PageHeader title="CC Obras" description="Contas correntes das obras: saldo, entradas e distribuições." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Obras c/ CC" value={String(BI_CC_OBRA.total_obras_com_cc)} accent="violet" subtitle="com conta corrente" icon={<Music className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Saldo Total" value={fmtBRL(BI_CC_OBRA.saldo_total)} accent="emerald" subtitle="em carteira" icon={<Music className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Entradas" value={fmtBRL(BI_CC_OBRA.entradas_total)} accent="sky" subtitle="recebido total" icon={<Music className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Recoupment Aberto" value={fmtBRL(BI_CC_OBRA.recoupment_aberto)} accent="amber" subtitle="a ser recuperado" icon={<Music className="w-4 h-4 text-amber-400" />} />
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-purple-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-300 transition-all"
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Obra</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Saldo</th>
                </>
              ) : sub === 'por_obra' ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Obra</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Entradas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Distribuído</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Saldo</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Editora</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">
                    {sub === 'entradas' ? 'Entradas' : sub === 'distribuidos' ? 'Distribuído' : sub === 'recoupment' ? 'Recoupment' : 'Saldo'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sub === 'top5_saldo' && BI_CC_OBRA.top5_saldo.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/40 font-mono text-xs">#{i + 1}</td>
                <td className="px-4 py-3 text-white/70">{row.obra}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-mono text-xs">{fmtBRL(row.saldo)}</td>
              </tr>
            ))}
            {sub === 'por_obra' && BI_CC_OBRA.por_obra.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.obra}</td>
                <td className="px-4 py-3 text-right text-sky-400 font-mono text-xs">{fmtBRL(row.entradas)}</td>
                <td className="px-4 py-3 text-right text-violet-400 font-mono text-xs">{fmtBRL(row.distribuido)}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-mono text-xs">{fmtBRL(row.saldo)}</td>
              </tr>
            ))}
            {sub !== 'top5_saldo' && sub !== 'por_obra' && Array.from({ length: Math.min(activeSub.count, 8) }, (_, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/40 font-mono text-xs">CC-OBR-{String(i + 1).padStart(3, '0')}</td>
                <td className="px-4 py-3 text-white/70">Obra Demo {i + 1}</td>
                <td className="px-4 py-3 text-white/50">Top Show Music</td>
                <td className="px-4 py-3 text-right text-white/70 font-mono text-xs">{fmtBRL(0)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">ativo</span>
                </td>
              </tr>
            ))}
            {activeSub.count === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">
                  <Music className="w-8 h-8 text-white/15 mx-auto mb-2" />
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
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-purple-400" />
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
                className="w-full py-2 rounded-xl bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors"
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
