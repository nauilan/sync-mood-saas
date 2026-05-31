'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_RECEBIMENTOS, fmtBRL } from '@/lib/mock-bi'
import { DollarSign, Download } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'backoffice_dsp', label: 'Backoffice DSP', count: 0, valor: BI_RECEBIMENTOS.backoffice_dsp },
  { id: 'sync', label: 'Sync', count: 0, valor: BI_RECEBIMENTOS.sync },
  { id: 'internacional', label: 'Internacional', count: 0, valor: BI_RECEBIMENTOS.internacional },
  { id: 'acordos_diretos', label: 'Acordos Diretos', count: 0, valor: BI_RECEBIMENTOS.acordos_diretos },
  { id: 'ecad_informativo', label: 'ECAD Informativo', count: 0, valor: BI_RECEBIMENTOS.ecad_informativo },
  { id: 'por_obra', label: 'Por Obra', count: BI_RECEBIMENTOS.por_obra.length, valor: 0 },
  { id: 'por_fonte', label: 'Por Fonte', count: BI_RECEBIMENTOS.por_fonte.length, valor: 0 },
  { id: 'por_periodo', label: 'Por Período', count: BI_RECEBIMENTOS.por_periodo.length, valor: 0 },
  { id: 'divergencias', label: 'Divergências', count: BI_RECEBIMENTOS.divergencias_abertas, valor: 0 },
  { id: 'sem_conciliacao', label: 'Sem Conciliação', count: 0, valor: 0 },
  { id: 'a_distribuir', label: 'A Distribuir', count: 0, valor: 0 },
]

export default function RelRecebimentosPage() {
  const [sub, setSub] = useState('por_fonte')
  const [exportModal, setExportModal] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleExport(fmt: string) {
    setExportModal(fmt)
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const activeSub = SUBS.find(s => s.id === sub)!
  const isValueGroup = ['backoffice_dsp', 'sync', 'internacional', 'acordos_diretos', 'ecad_informativo'].includes(sub)
  const isArrayGroup = ['por_obra', 'por_fonte', 'por_periodo'].includes(sub)

  return (
    <div className="space-y-5">
      <PageHeader title="Relatório de Recebimentos" description="Receitas por fonte, obra, período e status de conciliação." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total Registros" value={String(BI_RECEBIMENTOS.total_registros)} accent="sky" subtitle="recebimentos" icon={<DollarSign className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Valor Total" value={fmtBRL(BI_RECEBIMENTOS.valor_total)} accent="emerald" subtitle="acumulado" icon={<DollarSign className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Backoffice DSP" value={fmtBRL(BI_RECEBIMENTOS.backoffice_dsp)} accent="violet" subtitle="streaming digital" icon={<DollarSign className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Divergências" value={String(BI_RECEBIMENTOS.divergencias_abertas)} accent="rose" subtitle="em aberto" icon={<DollarSign className="w-4 h-4 text-rose-400" />} />
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
          >
            {s.label}
            {isValueGroup && s.id === sub ? (
              <span className="ml-1 opacity-60 font-mono text-xs">({fmtBRL(s.valor).replace('R$\u00a0', 'R$')})</span>
            ) : (
              <span className="ml-1 opacity-60">({s.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">
          {isValueGroup ? fmtBRL(activeSub.valor) : `${activeSub.count} registro(s)`} — {activeSub.label}
        </p>
        <div className="flex gap-2">
          {(['PDF', 'Excel', 'CSV'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-300 transition-all"
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
              {sub === 'por_obra' && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Obra</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor Recebido</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">% Total</th>
                </>
              )}
              {sub === 'por_fonte' && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Fonte</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">% Total</th>
                </>
              )}
              {sub === 'por_periodo' && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Período</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                </>
              )}
              {(isValueGroup || (!isArrayGroup && !isValueGroup)) && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Referência</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Fonte</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Período</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sub === 'por_obra' && BI_RECEBIMENTOS.por_obra.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.obra}</td>
                <td className="px-4 py-3 text-right text-white/70 font-mono text-xs">{fmtBRL(row.valor)}</td>
                <td className="px-4 py-3 text-right text-white/40 text-xs">
                  {((row.valor / BI_RECEBIMENTOS.valor_total) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
            {sub === 'por_fonte' && BI_RECEBIMENTOS.por_fonte.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.fonte}</td>
                <td className="px-4 py-3 text-right text-white/70 font-mono text-xs">{fmtBRL(row.valor)}</td>
                <td className="px-4 py-3 text-right text-white/40 text-xs">
                  {((row.valor / BI_RECEBIMENTOS.valor_total) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
            {sub === 'por_periodo' && BI_RECEBIMENTOS.por_periodo.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.periodo}</td>
                <td className="px-4 py-3 text-right text-white/70 font-mono text-xs">{fmtBRL(row.valor)}</td>
              </tr>
            ))}
            {(isValueGroup || (!isArrayGroup && !isValueGroup)) && Array.from({ length: Math.min(activeSub.count || 6, 8) }, (_, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/40 font-mono text-xs">REC-{String(i + 1).padStart(4, '0')}</td>
                <td className="px-4 py-3 text-white/50">{activeSub.label}</td>
                <td className="px-4 py-3 text-white/70">Obra Demo {i + 1}</td>
                <td className="px-4 py-3 text-white/40 text-xs">2026-Q1</td>
                <td className="px-4 py-3 text-right text-white/70 font-mono text-xs">{fmtBRL(0)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${sub === 'divergencias' ? 'bg-rose-500/10 text-rose-400' : sub === 'sem_conciliacao' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {sub === 'divergencias' ? 'divergência' : sub === 'sem_conciliacao' ? 'sem conciliação' : 'conciliado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export modal */}
      {exportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#12111e] border border-white/[0.08] rounded-2xl p-6 w-80 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-blue-400" />
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
                className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
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
