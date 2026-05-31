'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_AUDITORIA } from '@/lib/mock-bi'
import { Shield, Download, Clock, User } from 'lucide-react'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'alteracoes_cadastro', label: 'Alt. Cadastro', count: BI_AUDITORIA.alteracoes_cadastro },
  { id: 'alteracoes_bancarias', label: 'Alt. Bancárias', count: BI_AUDITORIA.alteracoes_bancarias },
  { id: 'alteracoes_contratuais', label: 'Alt. Contratuais', count: BI_AUDITORIA.alteracoes_contratuais },
  { id: 'alteracoes_percentuais', label: 'Alt. Percentuais', count: BI_AUDITORIA.alteracoes_percentuais },
  { id: 'alteracoes_obras', label: 'Alt. Obras', count: BI_AUDITORIA.alteracoes_obras },
  { id: 'exportacoes_realizadas', label: 'Exportações', count: BI_AUDITORIA.exportacoes },
  { id: 'importacoes_realizadas', label: 'Importações', count: BI_AUDITORIA.importacoes },
  { id: 'usuarios_responsaveis', label: 'Por Usuário', count: BI_AUDITORIA.por_usuario.length },
]

const ACAO_STYLES: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-400',
  edit: 'bg-sky-500/10 text-sky-400',
  validate: 'bg-violet-500/10 text-violet-400',
  execute: 'bg-amber-500/10 text-amber-400',
  execute_pagamento: 'bg-orange-500/10 text-orange-400',
  delete: 'bg-rose-500/10 text-rose-400',
  export: 'bg-blue-500/10 text-blue-400',
  import: 'bg-indigo-500/10 text-indigo-400',
}

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function RelAuditoriaPage() {
  const [sub, setSub] = useState('alteracoes_cadastro')
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
      <PageHeader title="Auditoria" description="Log completo de alterações, exportações e acessos por usuário." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total de Logs" value={String(BI_AUDITORIA.total_logs)} accent="sky" subtitle="registros" icon={<Shield className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Alt. Cadastro" value={String(BI_AUDITORIA.alteracoes_cadastro)} accent="violet" subtitle="neste período" icon={<Shield className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Alt. Contratuais" value={String(BI_AUDITORIA.alteracoes_contratuais)} accent="amber" subtitle="contratos" icon={<Shield className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Alt. Bancárias" value={String(BI_AUDITORIA.alteracoes_bancarias)} accent="rose" subtitle="dados financeiros" icon={<Shield className="w-4 h-4 text-rose-400" />} />
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-orange-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
          >
            {s.label} <span className="ml-1 opacity-60">({s.count})</span>
          </button>
        ))}
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{activeSub.count} registro(s) — {activeSub.label}</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-300 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Logs CSV
          </button>
          {(['PDF', 'Excel'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-300 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Logs feed (recent) — shown when sub is not 'usuarios_responsaveis' and count is small */}
      {sub !== 'usuarios_responsaveis' && BI_AUDITORIA.logs_recentes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/30 uppercase tracking-wider">Registros Recentes</p>
          <div className="rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
            {BI_AUDITORIA.logs_recentes.map(log => (
              <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white/70">{log.usuario}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${ACAO_STYLES[log.acao] ?? 'bg-white/10 text-white/50'}`}>
                      {log.acao}
                    </span>
                    <span className="text-xs text-white/40 truncate">{log.modulo}</span>
                  </div>
                  <p className="text-xs text-white/35 mt-0.5 font-mono truncate">{log.entidade}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-white/30 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </div>
                  {log.ip && <p className="text-white/20 text-xs font-mono mt-0.5">{log.ip}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table: all subs */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              {sub === 'usuarios_responsaveis' ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Usuário</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Total de Ações</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">% Total</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Módulo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Ação</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Entidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Data/Hora</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sub === 'usuarios_responsaveis' && BI_AUDITORIA.por_usuario.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/70">{row.usuario}</td>
                <td className="px-4 py-3 text-right text-orange-400 font-mono text-xs">{row.count}</td>
                <td className="px-4 py-3 text-right text-white/40 text-xs">
                  {((row.count / BI_AUDITORIA.total_logs) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
            {sub !== 'usuarios_responsaveis' && Array.from({ length: Math.min(activeSub.count, 8) }, (_, i) => {
              const recentLog = BI_AUDITORIA.logs_recentes[i % BI_AUDITORIA.logs_recentes.length]
              return (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/40 font-mono text-xs">alog-{String(i + 1).padStart(3, '0')}</td>
                  <td className="px-4 py-3 text-white/70">{recentLog.usuario}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{recentLog.modulo}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${ACAO_STYLES[sub === 'exportacoes_realizadas' ? 'export' : sub === 'importacoes_realizadas' ? 'import' : 'edit'] ?? 'bg-white/10 text-white/50'}`}>
                      {sub === 'exportacoes_realizadas' ? 'export' : sub === 'importacoes_realizadas' ? 'import' : 'edit'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 font-mono text-xs truncate max-w-[160px]">{recentLog.entidade}</td>
                  <td className="px-4 py-3 text-white/35 text-xs">{formatTimestamp(recentLog.timestamp)}</td>
                </tr>
              )
            })}
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
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-orange-400" />
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
                className="w-full py-2 rounded-xl bg-orange-600 text-white text-sm hover:bg-orange-700 transition-colors"
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
