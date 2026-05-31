'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { AlertTriangle, Search } from 'lucide-react'
import { MOCK_CONTESTACOES, MOCK_PRESTACOES } from '@/lib/mock-prestacao'
import { STATUS_CONTESTACAO_LABELS, STATUS_CONTESTACAO_COLORS, type StatusContestacao } from '@/lib/types-prestacao'

export default function ContestacoesFiPage() {
  const [filtro, setFiltro] = useState<StatusContestacao | 'todas'>('todas')

  const filtered = MOCK_CONTESTACOES.filter(c => filtro === 'todas' || c.status === filtro)
  const abertas = MOCK_CONTESTACOES.filter(c => c.status === 'aberta').length
  const emAnalise = MOCK_CONTESTACOES.filter(c => c.status === 'em_analise').length
  const procedentes = MOCK_CONTESTACOES.filter(c => c.status === 'procedente').length
  const resolvidas = MOCK_CONTESTACOES.filter(c => c.status === 'resolvida').length

  return (
    <div className="space-y-6">
      <PageHeader title="Fila de Contestações" description="Contestações abertas pelos titulares sobre valores das prestações." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Abertas" value={abertas} accent="rose" icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} />
        <KpiCard title="Em Análise" value={emAnalise} accent="amber" icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Procedentes" value={procedentes} accent="amber" icon={<AlertTriangle className="w-4 h-4 text-orange-400" />} />
        <KpiCard title="Resolvidas" value={resolvidas} accent="emerald" icon={<AlertTriangle className="w-4 h-4 text-emerald-400" />} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['todas', 'aberta', 'em_analise', 'procedente', 'improcedente', 'resolvida'] as const).map(s => (
          <button key={s} onClick={() => setFiltro(s)} className={['h-8 px-3 rounded-lg text-xs font-medium transition-colors', filtro === s ? 'bg-violet-600 text-white' : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80'].join(' ')}>
            {s === 'todas' ? 'Todas' : STATUS_CONTESTACAO_LABELS[s as StatusContestacao]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-[#0d1526] border border-emerald-500/10 rounded-xl p-8 text-center">
            <p className="text-emerald-400 text-sm font-semibold">Nenhuma contestação encontrada</p>
          </div>
        )}
        {filtered.map(c => {
          const prestacao = MOCK_PRESTACOES.find(p => p.id === c.prestacao_id)
          return (
            <div key={c.id} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white/80">{c.motivo}</p>
                    <p className="text-xs text-white/40">{c.titular_nome} · {prestacao?.codigo ?? c.prestacao_id}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_CONTESTACAO_COLORS[c.status]}`}>
                  {STATUS_CONTESTACAO_LABELS[c.status]}
                </span>
              </div>
              {c.descricao && <p className="text-xs text-white/50 ml-7">{c.descricao}</p>}
              <div className="flex items-center justify-between ml-7">
                <p className="text-[10px] text-white/30">Aberta em {new Date(c.criada_em).toLocaleDateString('pt-BR')}</p>
                <div className="flex items-center gap-2">
                  {(c.status === 'aberta' || c.status === 'em_analise') && (
                    <>
                      <button className="h-7 px-3 rounded-lg border border-white/[0.10] text-xs text-white/40 hover:text-white/70 transition-colors">Marcar Procedente</button>
                      <button className="h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors">Resolver</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
