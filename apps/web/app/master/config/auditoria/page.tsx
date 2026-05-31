'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MOCK_AUDIT_LOGS, MOCK_USUARIOS } from '@/lib/mock-config'
import type { AuditLog } from '@/lib/types-config'
import { Activity, Download, X, Filter } from 'lucide-react'

const ACAO_COLORS: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-400',
  edit: 'bg-blue-500/10 text-blue-400',
  delete: 'bg-rose-500/10 text-rose-400',
  validate: 'bg-violet-500/10 text-violet-400',
  approve: 'bg-violet-500/10 text-violet-400',
  execute: 'bg-amber-500/10 text-amber-400',
  export: 'bg-sky-500/10 text-sky-400',
  import: 'bg-sky-500/10 text-sky-400',
  enviar: 'bg-emerald-500/10 text-emerald-400',
  bloquear: 'bg-rose-500/10 text-rose-400',
  execute_pagamento: 'bg-amber-500/10 text-amber-400',
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d atrás`
  if (hours > 0) return `${hours}h atrás`
  if (mins > 0) return `${mins}min atrás`
  return 'Agora'
}

const MODULOS = Array.from(new Set(MOCK_AUDIT_LOGS.map((l) => l.modulo))).sort()
const ACOES = Array.from(new Set(MOCK_AUDIT_LOGS.map((l) => l.acao))).sort()

export default function AuditoriaPage() {
  const [filterUsuario, setFilterUsuario] = useState('todos')
  const [filterModulo, setFilterModulo] = useState('todos')
  const [filterAcao, setFilterAcao] = useState('todos')
  const [filterDataDe, setFilterDataDe] = useState('')
  const [filterDataAte, setFilterDataAte] = useState('')
  const [exportModal, setExportModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  const logs: AuditLog[] = MOCK_AUDIT_LOGS.filter((log) => {
    if (filterUsuario !== 'todos' && log.usuario_id !== filterUsuario) return false
    if (filterModulo !== 'todos' && log.modulo !== filterModulo) return false
    if (filterAcao !== 'todos' && log.acao !== filterAcao) return false
    if (filterDataDe && new Date(log.timestamp) < new Date(filterDataDe)) return false
    if (filterDataAte && new Date(log.timestamp) > new Date(filterDataAte + 'T23:59:59')) return false
    return true
  })

  function handleExport() {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      setExported(true)
    }, 1500)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Auditoria / Logs"
          description={`Feed de auditoria de todas as ações do sistema. ${MOCK_AUDIT_LOGS.length} registros.`}
        />
        <button
          onClick={() => setExportModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/70 text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <Filter className="w-4 h-4 text-white/25 shrink-0" />

        <select
          value={filterUsuario}
          onChange={(e) => setFilterUsuario(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-violet-500/40 transition-colors"
        >
          <option value="todos">Usuário: Todos</option>
          {MOCK_USUARIOS.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>

        <select
          value={filterModulo}
          onChange={(e) => setFilterModulo(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-violet-500/40 transition-colors"
        >
          <option value="todos">Módulo: Todos</option>
          {MODULOS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={filterAcao}
          onChange={(e) => setFilterAcao(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-violet-500/40 transition-colors"
        >
          <option value="todos">Ação: Todas</option>
          {ACOES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filterDataDe}
          onChange={(e) => setFilterDataDe(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-violet-500/40 transition-colors"
          title="De"
        />
        <input
          type="date"
          value={filterDataAte}
          onChange={(e) => setFilterDataAte(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-violet-500/40 transition-colors"
          title="Até"
        />
      </div>

      {/* Results count */}
      <p className="text-xs text-white/30">
        {logs.length} registro{logs.length !== 1 ? 's' : ''} encontrado{logs.length !== 1 ? 's' : ''}
      </p>

      {/* Empty state */}
      {logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Activity className="w-10 h-10 text-white/20 mb-3" strokeWidth={1.5} />
          <p className="text-white/40 text-sm">Nenhum log encontrado com os filtros aplicados.</p>
        </div>
      )}

      {/* Feed */}
      {logs.length > 0 && (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
            >
              {/* Timeline dot */}
              <div className="mt-1 w-2 h-2 rounded-full bg-violet-500/40 shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Usuário */}
                  <span className="text-xs font-medium text-white/70">
                    {log.usuario_nome ?? 'Sistema'}
                  </span>
                  {/* Ação badge */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      ACAO_COLORS[log.acao] ?? 'bg-white/5 text-white/35'
                    }`}
                  >
                    {log.acao}
                  </span>
                  {/* Módulo */}
                  <span className="text-[10px] text-white/30">{log.modulo}</span>
                  {/* Entidade */}
                  {log.entidade_tipo && (
                    <span className="text-[10px] text-white/25">
                      {log.entidade_tipo}
                      {log.entidade_id ? ` #${log.entidade_id}` : ''}
                    </span>
                  )}
                </div>

                {/* Dados antes → depois */}
                {(log.dados_antes_json || log.dados_depois_json) && (
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/30 font-mono">
                    {log.dados_antes_json && (
                      <span className="truncate max-w-[200px]">
                        antes: {JSON.stringify(log.dados_antes_json)}
                      </span>
                    )}
                    {log.dados_antes_json && log.dados_depois_json && (
                      <span className="text-white/20">→</span>
                    )}
                    {log.dados_depois_json && (
                      <span className="truncate max-w-[200px]">
                        depois: {JSON.stringify(log.dados_depois_json)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamp & IP */}
              <div className="text-right shrink-0">
                <p className="text-[10px] text-white/40">{relativeTime(log.timestamp)}</p>
                {log.ip && (
                  <p className="text-[10px] text-white/20 mt-0.5 font-mono">{log.ip}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export Modal */}
      {exportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f0d1a] border border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-white/80">Exportar Logs CSV</p>
              <button
                onClick={() => { setExportModal(false); setExported(false) }}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-white/50">
                Será exportado um arquivo CSV com {logs.length} registro{logs.length !== 1 ? 's' : ''} conforme os filtros ativos.
              </p>
              {exported ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400">
                  <Download className="w-4 h-4 shrink-0" />
                  audit_logs_export.csv gerado com sucesso!
                </div>
              ) : (
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors disabled:opacity-60"
                >
                  <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                  {exporting ? 'Gerando...' : 'Exportar CSV'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
