'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Download } from 'lucide-react'
import { PortalNav } from '@/components/portal/portal-nav'
import { PORTAL_DEMONSTRATIVOS } from '@/lib/mock-portal-autor'
import { fmtBRL } from '@/lib/mock-bi'

const statusColor: Record<string, string> = {
  disponivel: 'bg-emerald-500/20 text-emerald-300',
  processando: 'bg-sky-500/20 text-sky-300',
  pago: 'bg-violet-500/20 text-violet-300',
}

const statusLabel: Record<string, string> = {
  disponivel: 'Disponível',
  processando: 'Processando',
  pago: 'Pago',
}

export default function PortalDemonstrativoDetalhe({ params }: { params: { id: string } }) {
  const dem = PORTAL_DEMONSTRATIVOS.find((d) => d.id === params.id)
  const [pdfModal, setPdfModal] = useState(false)

  if (!dem) {
    return (
      <>
        <PortalNav />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-white/40">Demonstrativo não encontrado.</p>
          <Link href="/portal/demonstrativos" className="text-violet-400 hover:text-violet-300 text-sm mt-3 inline-block">
            ← Voltar para Demonstrativos
          </Link>
        </div>
      </>
    )
  }

  const rows = [
    { label: 'Valor Bruto', value: dem.valor_bruto, color: 'text-white/80' },
    { label: 'Descontos Administrativos', value: -dem.descontos, color: 'text-red-400' },
    { label: 'Recoupment', value: -dem.recoupment, color: 'text-amber-400' },
    { label: 'Retenção IRPF', value: -dem.retencoes_irpf, color: 'text-red-400' },
    { label: 'Retenção ISS', value: -dem.retencoes_iss, color: 'text-orange-400' },
    { label: 'Valor Líquido', value: dem.valor_liquido, color: 'text-emerald-400 font-bold text-base' },
  ]

  return (
    <>
      <PortalNav />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Back */}
        <div>
          <Link href="/portal/demonstrativos" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Demonstrativos
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">{dem.periodo_label}</h1>
              <p className="text-xs text-white/35 mt-0.5">
                Gerado em {new Date(dem.data_geracao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[dem.status]}`}>
              {statusLabel[dem.status]}
            </span>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white/80">Demonstrativo Financeiro</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {rows.map((row) => (
              row.value !== 0 || row.label === 'Valor Líquido' ? (
                <div key={row.label} className="px-5 py-3.5 flex items-center justify-between">
                  <span className="text-sm text-white/50">{row.label}</span>
                  <span className={`text-sm ${row.color}`}>
                    {fmtBRL(Math.abs(row.value))}
                    {row.value < 0 && row.label !== 'Valor Líquido' ? ' (-)' : ''}
                  </span>
                </div>
              ) : null
            ))}
            <div className="px-5 py-3.5 flex items-center justify-between bg-white/[0.02]">
              <span className="text-sm text-white/50">Saldo Anterior</span>
              <span className="text-sm text-white/60">{fmtBRL(dem.saldo_anterior)}</span>
            </div>
            <div className="px-5 py-4 flex items-center justify-between bg-violet-600/10">
              <span className="text-sm font-bold text-white/80">Saldo Atual</span>
              <span className="text-lg font-black text-violet-400">{fmtBRL(dem.saldo_atual)}</span>
            </div>
          </div>
        </div>

        {/* Obras Table */}
        {dem.obras.length > 0 && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white/80">Obras no Período</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Obra</th>
                    <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Bruto</th>
                    <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">% Autor</th>
                    <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Valor Autor</th>
                    <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Deduções</th>
                    <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {dem.obras.map((o) => (
                    <tr key={o.obra_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-xs text-white/80 font-medium">{o.titulo}</td>
                      <td className="px-4 py-3 text-right text-xs text-white/50">{fmtBRL(o.valor_bruto)}</td>
                      <td className="px-4 py-3 text-right text-xs text-violet-400">{o.percentual_autor}%</td>
                      <td className="px-4 py-3 text-right text-xs text-white/60">{fmtBRL(o.valor_autor)}</td>
                      <td className="px-4 py-3 text-right text-xs text-red-400/70">{fmtBRL(o.deducoes)}</td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-400">{fmtBRL(o.valor_liquido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PDF Preview */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white/80">PDF do Demonstrativo</h2>
          <div className="bg-white/[0.03] border border-white/[0.06] border-dashed rounded-xl p-10 flex flex-col items-center gap-3 text-center">
            <FileText className="w-10 h-10 text-white/15" />
            <p className="text-xs text-white/30">Visualização PDF disponível após geração</p>
          </div>
          <button
            onClick={() => setPdfModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4" /> Baixar PDF
          </button>
        </div>
      </div>

      {/* PDF Modal */}
      {pdfModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12101e] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">PDF Gerado</h2>
            <p className="text-xs text-white/50">O PDF do demonstrativo foi gerado com sucesso. Em produção, o download seria iniciado automaticamente.</p>
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
