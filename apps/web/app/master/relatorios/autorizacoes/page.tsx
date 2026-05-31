'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_AUTORIZACOES, fmtBRL } from '@/lib/mock-bi'
import { Shield, Download } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'emitidas', label: 'Emitidas', count: BI_AUTORIZACOES.total_emitidas },
  { id: 'pendentes', label: 'Pendentes', count: BI_AUTORIZACOES.total_pendentes },
  { id: 'assinadas', label: 'Assinadas', count: BI_AUTORIZACOES.total_assinadas },
  { id: 'faturadas', label: 'Faturadas', count: BI_AUTORIZACOES.total_faturadas },
  { id: 'pagas', label: 'Pagas', count: BI_AUTORIZACOES.total_pagas },
  { id: 'ativas', label: 'Ativas', count: BI_AUTORIZACOES.total_ativas },
  { id: 'vencidas', label: 'Vencidas', count: BI_AUTORIZACOES.total_vencidas },
  { id: 'canceladas', label: 'Canceladas', count: BI_AUTORIZACOES.total_canceladas },
  { id: 'por_tipo', label: 'Por Tipo', count: BI_AUTORIZACOES.por_tipo.length },
  { id: 'por_obra', label: 'Por Obra', count: BI_AUTORIZACOES.total_emitidas },
]

export default function RelAutorizacoesPage() {
  const [sub, setSub] = useState('emitidas')
  const [exportModal, setExportModal] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleExport(fmt: string) {
    setExportModal(fmt)
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const activeSub = SUBS.find(s => s.id === sub)!

  function getStatusBadge(subId: string) {
    if (subId === 'pagas' || subId === 'assinadas' || subId === 'ativas') return 'bg-emerald-500/10 text-emerald-400'
    if (subId === 'pendentes' || subId === 'faturadas') return 'bg-amber-500/10 text-amber-400'
    if (subId === 'vencidas' || subId === 'canceladas') return 'bg-rose-500/10 text-rose-400'
    return 'bg-rose-500/10 text-rose-400'
  }

  function getStatusLabel(subId: string) {
    if (subId === 'emitidas') return 'emitida'
    if (subId === 'pendentes') return 'pendente'
    if (subId === 'assinadas') return 'assinada'
    if (subId === 'faturadas') return 'faturada'
    if (subId === 'pagas') return 'paga'
    if (subId === 'ativas') return 'ativa'
    if (subId === 'vencidas') return 'vencida'
    if (subId === 'canceladas') return 'cancelada'
    return 'emitida'
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Relatório de Autorizações" description="Licenças emitidas, pendentes e histórico de pagamentos." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total Autorizações" value={String(BI_AUTORIZACOES.total)} accent="rose" subtitle="no sistema" icon={<Shield className="w-4 h-4 text-rose-400" />} />
        <KpiCard title="Ativas" value={String(BI_AUTORIZACOES.total_ativas)} accent="emerald" subtitle="em vigência" icon={<Shield className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Pendentes" value={String(BI_AUTORIZACOES.total_pendentes)} accent="amber" subtitle="aguardando" icon={<Shield className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Receita Total" value={fmtBRL(BI_AUTORIZACOES.receita_total)} accent="violet" subtitle="gerada em autorizações" icon={<Shield className="w-4 h-4 text-violet-400" />} />
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-rose-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition-all"
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
              {sub === 'por_tipo' ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Qtd</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">% Receita</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sub === 'por_tipo' && BI_AUTORIZACOES.por_tipo.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.tipo}</td>
                <td className="px-4 py-3 text-right text-white/50">{row.count}</td>
                <td className="px-4 py-3 text-right text-white/70 font-mono text-xs">{fmtBRL(row.valor)}</td>
                <td className="px-4 py-3 text-right text-white/40 text-xs">
                  {((row.valor / BI_AUTORIZACOES.receita_total) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
            {sub !== 'por_tipo' && Array.from({ length: Math.min(activeSub.count, 8) }, (_, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/40 font-mono text-xs">AUT-{String(i + 1).padStart(3, '0')}</td>
                <td className="px-4 py-3 text-white/70">Obra Demo {i + 1}</td>
                <td className="px-4 py-3 text-white/50">Sincronização</td>
                <td className="px-4 py-3 text-white/50">TV Globo</td>
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
                <td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">
                  <Shield className="w-8 h-8 text-white/15 mx-auto mb-2" />
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
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-rose-400" />
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
                className="w-full py-2 rounded-xl bg-rose-600 text-white text-sm hover:bg-rose-700 transition-colors"
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
