'use client'
import { useState } from 'react'
import { PortalNav } from '@/components/portal/portal-nav'
import { PORTAL_INFORMES } from '@/lib/mock-portal-autor'
import { fmtBRL } from '@/lib/mock-bi'
import { FileText, Building2 } from 'lucide-react'

export default function PortalInformeRendimentosPage() {
  const [selectedAno, setSelectedAno] = useState<number>(PORTAL_INFORMES[0]?.ano ?? new Date().getFullYear())
  const [pdfModal, setPdfModal] = useState(false)

  const informe = PORTAL_INFORMES.find((inf) => inf.ano === selectedAno)

  return (
    <>
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Informe de Rendimentos</h1>
            <p className="text-xs text-white/40 mt-0.5">Dados para declaração no programa IRPF</p>
          </div>
          <div className="flex items-center gap-2">
            {PORTAL_INFORMES.map((inf) => (
              <button
                key={inf.ano}
                onClick={() => setSelectedAno(inf.ano)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedAno === inf.ano
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/70'
                }`}
              >
                {inf.ano}
              </button>
            ))}
          </div>
        </div>

        {informe && (
          <>
            {/* Fonte Pagadora + CPF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-white/30" />
                  <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Fonte Pagadora</span>
                </div>
                <p className="text-sm font-semibold text-white/80">{informe.fonte_pagadora_nome}</p>
                <p className="text-xs font-mono text-white/40">CNPJ: {informe.fonte_pagadora_cnpj}</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-white/30" />
                  <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Beneficiário</span>
                </div>
                <p className="text-sm font-semibold text-white/80">{informe.titular_nome}</p>
                <p className="text-xs font-mono text-white/40">CPF: {informe.titular_cpf}</p>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                <p className="text-xs text-emerald-400/70 mb-1">Total Pago</p>
                <p className="text-2xl font-black text-emerald-400">{fmtBRL(informe.total_pago)}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                <p className="text-xs text-red-400/70 mb-1">Total IRPF Retido</p>
                <p className="text-2xl font-black text-red-400">{fmtBRL(informe.total_irpf_retido)}</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                <p className="text-xs text-orange-400/70 mb-1">Total ISS Retido</p>
                <p className="text-2xl font-black text-orange-400">{fmtBRL(informe.total_iss_retido)}</p>
              </div>
            </div>

            {/* Monthly breakdown */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white/80">Competências Mensais</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Mês</th>
                      <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Bruto</th>
                      <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">IRPF</th>
                      <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">ISS</th>
                      <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {informe.competencias.map((comp) => (
                      <tr key={comp.mes} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-xs text-white/70 font-medium">{comp.mes_label}</td>
                        <td className="px-4 py-3 text-right text-xs text-white/60">{fmtBRL(comp.valor_bruto)}</td>
                        <td className="px-4 py-3 text-right text-xs text-red-400/70">{fmtBRL(comp.irpf_retido)}</td>
                        <td className="px-4 py-3 text-right text-xs text-orange-400/70">{fmtBRL(comp.iss_retido)}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-400">{fmtBRL(comp.valor_liquido)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generate PDF */}
            <button
              onClick={() => setPdfModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors font-medium"
            >
              <FileText className="w-4 h-4" /> Gerar PDF para IR
            </button>
          </>
        )}
      </div>

      {/* PDF Modal */}
      {pdfModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12101e] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">PDF Gerado</h2>
            <p className="text-xs text-white/50">
              PDF gerado. Use os valores acima para declarar no programa IRPF.
            </p>
            <button
              onClick={() => setPdfModal(false)}
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
