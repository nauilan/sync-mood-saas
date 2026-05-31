'use client'
import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight, LayoutGrid, List } from 'lucide-react'
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

export default function PortalObrasPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid')

  return (
    <>
      <PortalNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Minhas Obras</h1>
            <p className="text-xs text-white/40 mt-0.5">{PORTAL_OBRAS.length} obras cadastradas</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-xl transition-all ${view === 'grid' ? 'bg-violet-600 text-white' : 'bg-white/[0.04] text-white/40 hover:text-white/70'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-2 rounded-xl transition-all ${view === 'table' ? 'bg-violet-600 text-white' : 'bg-white/[0.04] text-white/40 hover:text-white/70'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PORTAL_OBRAS.map((obra) => (
              <Link key={obra.id} href={`/portal/obras/${obra.id}`}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:border-violet-500/30 hover:bg-white/[0.06] transition-all group space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[obra.status]}`}>
                    {statusLabel[obra.status]}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{obra.titulo}</h3>
                  {obra.iswc ? (
                    <p className="text-xs text-white/40 mt-0.5 font-mono">{obra.iswc}</p>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium mt-1 inline-block">
                      ISWC Pendente
                    </span>
                  )}
                </div>
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-violet-400">{obra.percentual_proprio}%</span>
                    <span className="text-xs text-white/30 ml-1">participação</span>
                  </div>
                  <div className="text-right text-xs text-white/35">
                    <p>{obra.coautores.length} coautor{obra.coautores.length !== 1 ? 'es' : ''}</p>
                    <p>{obra.fonogramas_count} fonograma{obra.fonogramas_count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <p className="text-xs text-white/30">{obra.editora_nome}</p>
                <div className="flex items-center justify-end text-violet-400/60 group-hover:text-violet-400 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Título</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">ISWC</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Participação</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Coautores</th>
                  <th className="text-center px-4 py-3 text-xs text-white/40 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Fonogramas</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {PORTAL_OBRAS.map((obra) => (
                  <tr key={obra.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-white/80 font-medium">{obra.titulo}</p>
                      <p className="text-xs text-white/30">{obra.editora_nome}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {obra.iswc ? (
                        <span className="text-xs font-mono text-white/50">{obra.iswc}</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                          ISWC Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-violet-400 font-bold">{obra.percentual_proprio}%</span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-white/50 text-xs">{obra.coautores.length}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[obra.status]}`}>
                        {statusLabel[obra.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-white/50 text-xs">{obra.fonogramas_count}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/portal/obras/${obra.id}`} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                        Detalhe →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
