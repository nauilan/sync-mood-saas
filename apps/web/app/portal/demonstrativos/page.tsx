'use client'
import Link from 'next/link'
import { FileText } from 'lucide-react'
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

export default function PortalDemonstrativosPage() {
  return (
    <>
      <PortalNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">Demonstrativos</h1>
          <p className="text-xs text-white/40 mt-0.5">Histórico de demonstrativos trimestrais</p>
        </div>

        {/* Table */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Período</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Bruto</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Descontos</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Recoupment</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">IRPF</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">ISS</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Líquido</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Saldo Atual</th>
                  <th className="text-center px-4 py-3 text-xs text-white/40 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {PORTAL_DEMONSTRATIVOS.map((dem) => (
                  <tr key={dem.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-white/80 font-medium text-xs">{dem.periodo_label}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        Gerado em {new Date(dem.data_geracao).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs text-white/60">{fmtBRL(dem.valor_bruto)}</td>
                    <td className="px-4 py-3.5 text-right text-xs text-red-400/70">{fmtBRL(dem.descontos)}</td>
                    <td className="px-4 py-3.5 text-right text-xs text-amber-400/70">
                      {dem.recoupment > 0 ? fmtBRL(dem.recoupment) : <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs text-red-400/70">{fmtBRL(dem.retencoes_irpf)}</td>
                    <td className="px-4 py-3.5 text-right text-xs text-orange-400/70">{fmtBRL(dem.retencoes_iss)}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-semibold text-emerald-400">{fmtBRL(dem.valor_liquido)}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-bold text-violet-400">{fmtBRL(dem.saldo_atual)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[dem.status]}`}>
                        {statusLabel[dem.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/portal/demonstrativos/${dem.id}`} className="text-xs text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap">
                        Ver detalhe →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
