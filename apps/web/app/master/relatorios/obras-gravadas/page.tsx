'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_OBRAS_GRAVADAS } from '@/lib/mock-bi'
import { Disc, Download } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'com_fonogramas', label: 'Com Fonogramas', count: BI_OBRAS_GRAVADAS.total_fonogramas },
  { id: 'interpretes', label: 'Intérpretes', count: BI_OBRAS_GRAVADAS.total_interpretes },
  { id: 'isrcs', label: 'Com ISRC', count: BI_OBRAS_GRAVADAS.total_com_isrc },
  { id: 'gravadoras', label: 'Gravadoras', count: BI_OBRAS_GRAVADAS.total_gravadoras },
  { id: 'distribuidoras', label: 'Distribuidoras', count: BI_OBRAS_GRAVADAS.total_distribuidoras },
  { id: 'datas_lancamento', label: 'Datas Lançamento', count: BI_OBRAS_GRAVADAS.total_fonogramas },
  { id: 'sem_autorizacao', label: 'Sem Autorização', count: BI_OBRAS_GRAVADAS.total_sem_autorizacao },
  { id: 'sem_isrc', label: 'Sem ISRC', count: BI_OBRAS_GRAVADAS.total_sem_isrc },
  { id: 'sem_vinculo_fono', label: 'Sem Vínculo Fono', count: BI_OBRAS_GRAVADAS.total_sem_vinculo },
  { id: 'por_artista', label: 'Por Artista', count: BI_OBRAS_GRAVADAS.por_artista.length },
  { id: 'por_gravadora', label: 'Por Gravadora', count: BI_OBRAS_GRAVADAS.por_gravadora.length },
]

export default function RelObrasGravadasPage() {
  const [sub, setSub] = useState('com_fonogramas')
  const [exportModal, setExportModal] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleExport(fmt: string) {
    setExportModal(fmt)
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const activeSub = SUBS.find(s => s.id === sub)!
  const isGrouped = sub === 'por_artista' || sub === 'por_gravadora'

  function getStatusBadge(subId: string) {
    if (subId === 'sem_autorizacao') return 'bg-rose-500/10 text-rose-400'
    if (subId === 'sem_isrc') return 'bg-amber-500/10 text-amber-400'
    if (subId === 'sem_vinculo_fono') return 'bg-orange-500/10 text-orange-400'
    return 'bg-sky-500/10 text-sky-400'
  }

  function getStatusLabel(subId: string) {
    if (subId === 'sem_autorizacao') return 'sem autorização'
    if (subId === 'sem_isrc') return 'sem ISRC'
    if (subId === 'sem_vinculo_fono') return 'sem vínculo'
    return 'ativo'
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Relatório de Obras Gravadas" description="Fonogramas, ISRCs, gravadoras e distribuidoras do catálogo." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total Fonogramas" value={String(BI_OBRAS_GRAVADAS.total_fonogramas)} accent="sky" subtitle="registrados" icon={<Disc className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Com ISRC" value={String(BI_OBRAS_GRAVADAS.total_com_isrc)} accent="emerald" subtitle="identificados" icon={<Disc className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Sem ISRC" value={String(BI_OBRAS_GRAVADAS.total_sem_isrc)} accent="amber" subtitle="aguardando" icon={<Disc className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Sem Autorização" value={String(BI_OBRAS_GRAVADAS.total_sem_autorizacao)} accent="rose" subtitle="requerem atenção" icon={<Disc className="w-4 h-4 text-rose-400" />} />
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-sky-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-300 transition-all"
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    {sub === 'por_artista' ? 'Artista' : 'Gravadora'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Fonogramas</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">ISRC</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Intérprete</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Gravadora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Distribuidora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Lançamento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sub === 'por_artista' && BI_OBRAS_GRAVADAS.por_artista.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.artista}</td>
                <td className="px-4 py-3 text-right text-white/50">{row.count}</td>
              </tr>
            ))}
            {sub === 'por_gravadora' && BI_OBRAS_GRAVADAS.por_gravadora.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.gravadora}</td>
                <td className="px-4 py-3 text-right text-white/50">{row.count}</td>
              </tr>
            ))}
            {!isGrouped && Array.from({ length: Math.min(activeSub.count, 8) }, (_, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/40 font-mono text-xs">
                  {sub === 'sem_isrc' ? '—' : `BRA${String(2024 + (i % 3))}AB${String(i + 1).padStart(5, '0')}`}
                </td>
                <td className="px-4 py-3 text-white/70">Demo Artista {i + 1}</td>
                <td className="px-4 py-3 text-white/50">Universal Music</td>
                <td className="px-4 py-3 text-white/50">Spotify / Deezer</td>
                <td className="px-4 py-3 text-white/40 text-xs">{`${String((i % 28) + 1).padStart(2, '0')}/01/202${4 + (i % 3)}`}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${getStatusBadge(sub)}`}>
                    {getStatusLabel(sub)}
                  </span>
                </td>
              </tr>
            ))}
            {activeSub.count === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">
                  <Disc className="w-8 h-8 text-white/15 mx-auto mb-2" />
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
            <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-sky-400" />
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
                className="w-full py-2 rounded-xl bg-sky-600 text-white text-sm hover:bg-sky-700 transition-colors"
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
