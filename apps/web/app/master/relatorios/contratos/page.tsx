'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_CONTRATOS, fmtBRL } from '@/lib/mock-bi'
import { FileText, Download } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'ativos', label: 'Ativos', count: BI_CONTRATOS.total_ativos },
  { id: 'pendentes', label: 'Pendentes', count: BI_CONTRATOS.total_pendentes },
  { id: 'vencidos', label: 'Vencidos', count: BI_CONTRATOS.total_vencidos },
  { id: 'a_vencer', label: 'A Vencer (30d)', count: BI_CONTRATOS.total_a_vencer_30d },
  { id: 'assinados', label: 'Assinados', count: BI_CONTRATOS.total_assinados },
  { id: 'aguardando_assinatura', label: 'Aguardando Assinatura', count: BI_CONTRATOS.total_aguardando_assinatura },
  { id: 'por_editora', label: 'Por Editora', count: BI_CONTRATOS.por_editora.length },
  { id: 'por_autor', label: 'Por Autor', count: BI_CONTRATOS.por_autor.length },
  { id: 'por_obra', label: 'Por Obra', count: BI_CONTRATOS.por_obra.length },
  { id: 'com_adiantamento', label: 'Com Adiantamento', count: BI_CONTRATOS.total_com_adiantamento },
  { id: 'com_recoupment', label: 'Com Recoupment', count: BI_CONTRATOS.total_com_recoupment },
]

export default function RelContratosPage() {
  const [sub, setSub] = useState('ativos')
  const [exportModal, setExportModal] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleExport(fmt: string) {
    setExportModal(fmt)
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const activeSub = SUBS.find(s => s.id === sub)!
  const isGrouped = sub === 'por_editora' || sub === 'por_autor' || sub === 'por_obra'

  function getStatusBadge(subId: string) {
    if (subId === 'ativos' || subId === 'assinados') return 'bg-emerald-500/10 text-emerald-400'
    if (subId === 'pendentes' || subId === 'aguardando_assinatura') return 'bg-amber-500/10 text-amber-400'
    if (subId === 'vencidos') return 'bg-rose-500/10 text-rose-400'
    if (subId === 'a_vencer') return 'bg-orange-500/10 text-orange-400'
    if (subId === 'com_adiantamento' || subId === 'com_recoupment') return 'bg-violet-500/10 text-violet-400'
    return 'bg-emerald-500/10 text-emerald-400'
  }

  function getStatusLabel(subId: string) {
    if (subId === 'ativos') return 'ativo'
    if (subId === 'pendentes') return 'pendente'
    if (subId === 'vencidos') return 'vencido'
    if (subId === 'a_vencer') return 'a vencer'
    if (subId === 'assinados') return 'assinado'
    if (subId === 'aguardando_assinatura') return 'aguardando'
    if (subId === 'com_adiantamento') return 'com adiantamento'
    if (subId === 'com_recoupment') return 'com recoupment'
    return 'ativo'
  }

  function getGroupLabel() {
    if (sub === 'por_editora') return 'Editora'
    if (sub === 'por_autor') return 'Autor'
    return 'Obra'
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Relatório de Contratos" description="Contratos ativos, pendentes e histórico por período." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total Contratos" value={String(BI_CONTRATOS.total)} accent="amber" subtitle="no sistema" icon={<FileText className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Ativos" value={String(BI_CONTRATOS.total_ativos)} accent="emerald" subtitle="vigentes" icon={<FileText className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="A Vencer (30d)" value={String(BI_CONTRATOS.total_a_vencer_30d)} accent="rose" subtitle="requerem renovação" icon={<FileText className="w-4 h-4 text-rose-400" />} />
        <KpiCard title="Adiantamentos" value={fmtBRL(BI_CONTRATOS.valor_total_adiantamentos)} accent="violet" subtitle="total em aberto" icon={<FileText className="w-4 h-4 text-violet-400" />} />
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-amber-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-300 transition-all"
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
              {isGrouped ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">{getGroupLabel()}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Contratos</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Autor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Editora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sub === 'por_editora' && BI_CONTRATOS.por_editora.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.editora}</td>
                <td className="px-4 py-3 text-right text-white/50">{row.count}</td>
              </tr>
            ))}
            {sub === 'por_autor' && BI_CONTRATOS.por_autor.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.autor}</td>
                <td className="px-4 py-3 text-right text-white/50">{row.count}</td>
              </tr>
            ))}
            {sub === 'por_obra' && BI_CONTRATOS.por_obra.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.obra}</td>
                <td className="px-4 py-3 text-right text-white/50">{row.count}</td>
              </tr>
            ))}
            {!isGrouped && Array.from({ length: Math.min(activeSub.count, 8) }, (_, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/40 font-mono text-xs">CTR-{String(i + 1).padStart(3, '0')}</td>
                <td className="px-4 py-3 text-white/50">Edição Musical</td>
                <td className="px-4 py-3 text-white/70">Obra Demo {i + 1}</td>
                <td className="px-4 py-3 text-white/50">Autor Demo {i + 1}</td>
                <td className="px-4 py-3 text-white/50">Top Show Music</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${getStatusBadge(sub)}`}>
                    {getStatusLabel(sub)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-white/50 font-mono text-xs">{fmtBRL(0)}</td>
              </tr>
            ))}
            {activeSub.count === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-white/30 text-sm">
                  <FileText className="w-8 h-8 text-white/15 mx-auto mb-2" />
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
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-amber-400" />
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
                className="w-full py-2 rounded-xl bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors"
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
