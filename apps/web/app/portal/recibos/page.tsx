'use client'
import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { PortalNav } from '@/components/portal/portal-nav'
import { PORTAL_RECIBOS } from '@/lib/mock-portal-autor'
import { fmtBRL } from '@/lib/mock-bi'

const statusColor: Record<string, string> = {
  emitido: 'bg-sky-500/20 text-sky-300',
  pago: 'bg-emerald-500/20 text-emerald-300',
  cancelado: 'bg-red-500/20 text-red-300',
}

const statusLabel: Record<string, string> = {
  emitido: 'Emitido',
  pago: 'Pago',
  cancelado: 'Cancelado',
}

export default function PortalRecibosPage() {
  const [downloadModal, setDownloadModal] = useState<string | null>(null)

  return (
    <>
      <PortalNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">Recibos</h1>
          <p className="text-xs text-white/40 mt-0.5">{PORTAL_RECIBOS.length} recibos emitidos</p>
        </div>

        {/* Table */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Número</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Período</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Emissão</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Pagamento</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Valor</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Ret. IRPF</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Líquido</th>
                  <th className="text-center px-4 py-3 text-xs text-white/40 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {PORTAL_RECIBOS.map((rcb) => (
                  <tr key={rcb.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-white/20 shrink-0" />
                        <span className="text-xs font-mono text-white/70">{rcb.numero}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-white/50">{rcb.periodo}</td>
                    <td className="px-4 py-3.5 text-xs text-white/40">
                      {new Date(rcb.data_emissao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-white/40">
                      {new Date(rcb.data_pagamento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs text-white/60">{fmtBRL(rcb.valor)}</td>
                    <td className="px-4 py-3.5 text-right text-xs text-red-400/70">{fmtBRL(rcb.retencao_irpf)}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-semibold text-emerald-400">{fmtBRL(rcb.valor_liquido)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[rcb.status]}`}>
                        {statusLabel[rcb.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setDownloadModal(rcb.numero)}
                        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors ml-auto"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {downloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12101e] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Baixar Recibo</h2>
            <p className="text-xs text-white/50">
              O PDF do recibo <span className="font-mono text-white/70">{downloadModal}</span> foi preparado para download.
            </p>
            <button
              onClick={() => setDownloadModal(null)}
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
