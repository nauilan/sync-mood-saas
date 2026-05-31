'use client'
import { useState } from 'react'
import { AlertCircle, Download } from 'lucide-react'
import { PortalNav } from '@/components/portal/portal-nav'
import { PORTAL_RECEBIMENTOS } from '@/lib/mock-portal-autor'
import { fmtBRL } from '@/lib/mock-bi'

const statusColor: Record<string, string> = {
  pago: 'bg-emerald-500/20 text-emerald-300',
  pendente: 'bg-amber-500/20 text-amber-300',
  bloqueado: 'bg-red-500/20 text-red-300',
  em_analise: 'bg-sky-500/20 text-sky-300',
}

const statusLabel: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  bloqueado: 'Bloqueado',
  em_analise: 'Em análise',
}

const allPeriodos = Array.from(new Set(PORTAL_RECEBIMENTOS.map((r) => r.periodo)))
const allFontes = Array.from(new Set(PORTAL_RECEBIMENTOS.map((r) => r.fonte_tipo)))

const fonteTipoLabel: Record<string, string> = {
  ecad_socinpro: 'ECAD/SOCINPRO',
  backoffice_dsp: 'BackOffice DSP',
  sync: 'Sincronização',
  internacional: 'Internacional',
  acordo_direto: 'Acordo Direto',
}

export default function PortalRecebimentosPage() {
  const [periodo, setPeriodo] = useState('')
  const [fonte, setFonte] = useState('')
  const [csvModal, setCsvModal] = useState(false)

  const filtered = PORTAL_RECEBIMENTOS.filter((r) => {
    if (periodo && r.periodo !== periodo) return false
    if (fonte && r.fonte_tipo !== fonte) return false
    return true
  })

  return (
    <>
      <PortalNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Recebimentos</h1>
            <p className="text-xs text-white/40 mt-0.5">Histórico de todos os recebimentos</p>
          </div>
          <button
            onClick={() => setCsvModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.08] transition-all"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>

        {/* ECAD Info */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80">
            <strong className="text-amber-300">Valores ECAD são informativos</strong> — a distribuição é gerida diretamente pelo ECAD junto às sociedades de arrecadação. Esses valores não transitam pela editora.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-violet-500/40"
          >
            <option value="">Todos os períodos</option>
            {allPeriodos.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={fonte}
            onChange={(e) => setFonte(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-violet-500/40"
          >
            <option value="">Todas as fontes</option>
            {allFontes.map((f) => (
              <option key={f} value={f}>{fonteTipoLabel[f] ?? f}</option>
            ))}
          </select>
          <span className="text-xs text-white/30">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Obra</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Fonte</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Período</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Bruto</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Líquido</th>
                  <th className="text-center px-4 py-3 text-xs text-white/40 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Data Pag.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((rec) => (
                  <tr
                    key={rec.id}
                    className={`hover:bg-white/[0.02] transition-colors ${rec.is_ecad_informativo ? 'border-l-2 border-amber-500/50' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-white/80 font-medium text-xs">{rec.obra_titulo}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-white/50 max-w-[160px] truncate">{rec.fonte}</td>
                    <td className="px-4 py-3.5">
                      {rec.is_ecad_informativo ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-medium">ECAD</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 font-medium">
                          {fonteTipoLabel[rec.fonte_tipo] ?? rec.fonte_tipo}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-white/50">{rec.periodo}</td>
                    <td className="px-4 py-3.5 text-right text-xs text-white/60">{fmtBRL(rec.valor_bruto)}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-semibold text-emerald-400">{fmtBRL(rec.valor_liquido)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[rec.status]}`}>
                        {statusLabel[rec.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs text-white/35">
                      {rec.data_pagamento ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CSV Modal */}
      {csvModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12101e] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-sm font-semibold text-white">Exportar CSV</h2>
            <p className="text-xs text-white/50">O arquivo CSV com todos os recebimentos foi gerado com sucesso.</p>
            <button
              onClick={() => setCsvModal(false)}
              className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
