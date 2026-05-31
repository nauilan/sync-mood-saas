'use client'
import Link from 'next/link'
import { ArrowLeft, Music2, CheckCircle, XCircle } from 'lucide-react'
import { PortalNav } from '@/components/portal/portal-nav'
import { PORTAL_OBRAS } from '@/lib/mock-portal-autor'

const statusColor: Record<string, string> = {
  ativa: 'bg-emerald-500/20 text-emerald-300',
  pendente: 'bg-amber-500/20 text-amber-300',
  bloqueada: 'bg-red-500/20 text-red-300',
  em_analise: 'bg-sky-500/20 text-sky-300',
}

const statusLabel: Record<string, string> = {
  ativa: 'Ativa',
  pendente: 'Pendente',
  bloqueada: 'Bloqueada',
  em_analise: 'Em análise',
}

export default function PortalObraDetalhe({ params }: { params: { id: string } }) {
  const obra = PORTAL_OBRAS.find((o) => o.id === params.id)

  if (!obra) {
    return (
      <>
        <PortalNav />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-white/40">Obra não encontrada.</p>
          <Link href="/portal/obras" className="text-violet-400 hover:text-violet-300 text-sm mt-3 inline-block">
            ← Voltar para Obras
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PortalNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Back + Header */}
        <div>
          <Link href="/portal/obras" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Obras
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Music2 className="w-6 h-6 text-violet-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{obra.titulo}</h1>
              {obra.titulo_alternativo && (
                <p className="text-sm text-white/30 mt-0.5">Alt: {obra.titulo_alternativo}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {obra.iswc ? (
                  <span className="text-xs font-mono text-white/50 bg-white/[0.06] px-2 py-1 rounded-lg">{obra.iswc}</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">ISWC Pendente</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[obra.status]}`}>
                  {statusLabel[obra.status]}
                </span>
                <span className="text-xs text-white/30">{obra.editora_nome}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minha Participação */}
        <div className="bg-violet-600/10 border border-violet-500/20 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider text-xs">Minha Participação</h2>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-violet-400">{obra.percentual_proprio}%</span>
            <span className="text-white/40 text-sm mb-2">dos direitos autorais</span>
          </div>
          <p className="text-xs text-white/30 mt-2">
            {obra.autorizacoes_count} autorização{obra.autorizacoes_count !== 1 ? 'ões' : ''} vinculada{obra.autorizacoes_count !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Coautores */}
        {obra.coautores.length > 0 && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white/80">Coautores</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Nome</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Percentual</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Editora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {obra.coautores.map((co, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-white/80 font-medium">{co.nome}</p>
                      {co.nome_artistico && <p className="text-xs text-white/30">{co.nome_artistico}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-violet-400 font-bold">{co.percentual}%</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40">
                      {co.editora ?? <span className="text-white/20">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Fonogramas */}
        {obra.fonogramas && obra.fonogramas.length > 0 && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white/80">
                Fonogramas <span className="text-white/30 font-normal ml-1">({obra.fonogramas.length})</span>
              </h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {obra.fonogramas.map((fon) => (
                <div key={fon.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-white/90">{fon.interprete}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {fon.isrc && (
                          <span className="text-xs font-mono text-white/40 bg-white/[0.05] px-2 py-0.5 rounded-lg">{fon.isrc}</span>
                        )}
                        {fon.gravadora && (
                          <span className="text-xs text-white/35">{fon.gravadora}</span>
                        )}
                        {fon.data_lancamento && (
                          <span className="text-xs text-white/25">{fon.data_lancamento}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {fon.autorizacao_vinculada ? (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                          <CheckCircle className="w-3 h-3" /> Autorizado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                          <XCircle className="w-3 h-3" /> Sem autorização
                        </span>
                      )}
                    </div>
                  </div>
                  {fon.plataformas.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {fon.plataformas.map((pl) => (
                        <span key={pl} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 font-medium">
                          {pl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
