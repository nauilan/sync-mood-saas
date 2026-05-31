'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_OBRAS } from '@/lib/mock-bi'
import { Music, Download } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'cadastradas', label: 'Cadastradas', count: BI_OBRAS.total_cadastradas },
  { id: 'ativas', label: 'Ativas', count: BI_OBRAS.total_ativas },
  { id: 'pendentes', label: 'Pendentes', count: BI_OBRAS.total_pendentes },
  { id: 'bloqueadas', label: 'Bloqueadas', count: BI_OBRAS.total_bloqueadas },
  { id: 'sem_iswc', label: 'Sem ISWC', count: BI_OBRAS.total_sem_iswc },
  { id: 'sem_contrato', label: 'Sem Contrato', count: BI_OBRAS.total_sem_contrato },
  { id: 'por_editora', label: 'Por Editora', count: BI_OBRAS.por_editora.length },
  { id: 'por_autor', label: 'Por Autor', count: BI_OBRAS.por_autor.length },
  { id: 'por_percentual', label: 'Por Percentual', count: BI_OBRAS.por_percentual.length },
  { id: 'por_sociedade', label: 'Por Sociedade', count: BI_OBRAS.por_sociedade.length },
  { id: 'com_divergencia', label: 'Com Divergência', count: BI_OBRAS.com_divergencia },
]

export default function RelObrasPage() {
  const [sub, setSub] = useState('cadastradas')
  const [exportModal, setExportModal] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleExport(fmt: string) {
    setExportModal(fmt)
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const activeSub = SUBS.find(s => s.id === sub)!
  const isPorGroup = sub.startsWith('por_')

  function getStatusBadge(subId: string) {
    if (subId === 'ativas') return 'bg-emerald-500/10 text-emerald-400'
    if (subId === 'pendentes') return 'bg-amber-500/10 text-amber-400'
    if (subId === 'bloqueadas') return 'bg-rose-500/10 text-rose-400'
    return 'bg-violet-500/10 text-violet-400'
  }

  function getStatusLabel(subId: string) {
    if (subId === 'ativas') return 'ativa'
    if (subId === 'pendentes') return 'pendente'
    if (subId === 'bloqueadas') return 'bloqueada'
    return 'cadastrada'
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Relatório de Obras" description="Análise completa do catálogo de obras cadastradas." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total Cadastradas" value={String(BI_OBRAS.total_cadastradas)} accent="violet" subtitle="no catálogo" icon={<Music className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Ativas" value={String(BI_OBRAS.total_ativas)} accent="emerald" subtitle="com contrato ativo" icon={<Music className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Sem ISWC" value={String(BI_OBRAS.total_sem_iswc)} accent="amber" subtitle="aguardando SOCINPRO" icon={<Music className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Com Divergência" value={String(BI_OBRAS.com_divergencia)} accent="rose" subtitle="requerem atenção" icon={<Music className="w-4 h-4 text-rose-400" />} />
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-violet-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300 transition-all"
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
              {isPorGroup ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    {sub === 'por_editora' ? 'Editora' : sub === 'por_autor' ? 'Autor' : sub === 'por_percentual' ? 'Faixa' : 'Sociedade'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Obras</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Editora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">ISWC</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sub === 'por_editora' && BI_OBRAS.por_editora.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.editora}</td>
                <td className="px-4 py-3 text-right text-white/50">{row.count}</td>
              </tr>
            ))}
            {sub === 'por_autor' && BI_OBRAS.por_autor.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.autor}</td>
                <td className="px-4 py-3 text-right text-white/50">{row.count}</td>
              </tr>
            ))}
            {sub === 'por_percentual' && BI_OBRAS.por_percentual.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.faixa}</td>
                <td className="px-4 py-3 text-right text-white/50">{row.count}</td>
              </tr>
            ))}
            {sub === 'por_sociedade' && BI_OBRAS.por_sociedade.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.sociedade}</td>
                <td className="px-4 py-3 text-right text-white/50">{row.count}</td>
              </tr>
            ))}
            {!isPorGroup && Array.from({ length: Math.min(activeSub.count, 8) }, (_, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/40 font-mono text-xs">TSM-OBR-{String(i + 1).padStart(3, '0')}</td>
                <td className="px-4 py-3 text-white/70">Obra Demo {i + 1}</td>
                <td className="px-4 py-3 text-white/50">Top Show Music</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${getStatusBadge(sub)}`}>
                    {getStatusLabel(sub)}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/40 font-mono text-xs">
                  {sub === 'sem_iswc' ? '—' : `T-12345678${i + 1}-0`}
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
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-violet-400" />
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
                className="w-full py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"
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
