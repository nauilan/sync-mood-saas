'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  CheckCircle2, AlertCircle, Clock, Search, Filter,
  ThumbsUp, ThumbsDown, Edit2, Send,
} from 'lucide-react'
import { MOCK_LINHAS_ROYALTY } from '@/lib/mock-backoffice-import'
import {
  STATUS_MATCHING_LABELS,
  STATUS_MATCHING_COLORS,
  TIPO_DIREITO_LABELS,
} from '@/lib/types-backoffice-import'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

export default function MatchingPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [linhas, setLinhas] = useState(MOCK_LINHAS_ROYALTY)

  const filtered = linhas.filter(l => {
    if (filterStatus && l.status_matching !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return l.titulo_bo.toLowerCase().includes(q) || l.autores_bo.toLowerCase().includes(q)
    }
    return true
  })

  const totais = {
    validado: linhas.filter(l => l.status_matching === 'validado').length,
    identificado: linhas.filter(l => l.status_matching === 'identificado').length,
    possivel: linhas.filter(l => l.status_matching === 'possivel').length,
    nao_identificado: linhas.filter(l => l.status_matching === 'nao_identificado').length,
  }

  function handleValidar(id: string) {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, status_matching: 'validado' as const } : l))
  }
  function handleRejeitar(id: string) {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, status_matching: 'rejeitado' as const } : l))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matching de Obras"
        description="Cruze automaticamente as linhas de royalties recebidos com o catálogo da editora. Valide ou corrija os matches manualmente."
      />

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Validados', count: totais.validado, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
          { label: 'Identificados', count: totais.identificado, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Possível Match', count: totais.possivel, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'Não Identificados', count: totais.nao_identificado, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${s.color}`}>
            <p className={`text-lg font-bold leading-none ${s.color.split(' ')[0]}`}>{s.count}</p>
            <p className="text-[11px] text-white/50">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título ou autor..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-violet-500/40"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/70 focus:outline-none"
        >
          <option value="">Todos Status</option>
          {Object.entries(STATUS_MATCHING_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors">
          <Send className="w-3.5 h-3.5" /> Enviar para Conta Corrente
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_90px_90px_120px_100px_120px] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
          {['Obra (BackOffice)', 'Obra no Catálogo', 'Tipo', 'Royalty Líq.', 'Score', 'Status', 'Ações'].map(h => (
            <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-10 text-center text-white/30 text-sm">Nenhuma linha encontrada.</div>
        )}

        {filtered.map((linha, idx) => (
          <div
            key={linha.id}
            className={`grid grid-cols-[2fr_1fr_90px_90px_120px_100px_120px] gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors ${
              idx < filtered.length - 1 ? 'border-b border-white/[0.03]' : ''
            }`}
          >
            {/* Obra BO */}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{linha.titulo_bo}</p>
              <p className="text-[10px] text-white/40 truncate">{linha.autores_bo}</p>
              {linha.interprete && <p className="text-[10px] text-white/25">Interp: {linha.interprete}</p>}
            </div>
            {/* Catálogo match */}
            <div className="min-w-0">
              {linha.obra_titulo_match ? (
                <p className="text-xs text-emerald-400 truncate">{linha.obra_titulo_match}</p>
              ) : (
                <p className="text-xs text-white/20 italic">—</p>
              )}
            </div>
            {/* Tipo */}
            <span className="text-[10px] text-white/50">{TIPO_DIREITO_LABELS[linha.tipo_direito]}</span>
            {/* Royalty */}
            <p className="text-xs font-semibold text-white/70">{fmt(linha.royalty_liquido)}</p>
            {/* Score */}
            <div>
              {linha.score_matching != null ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${linha.score_matching >= 90 ? 'bg-emerald-500' : linha.score_matching >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${linha.score_matching}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/40">{linha.score_matching}%</span>
                </div>
              ) : <span className="text-[10px] text-white/20">—</span>}
            </div>
            {/* Status */}
            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit ${STATUS_MATCHING_COLORS[linha.status_matching]}`}>
              {STATUS_MATCHING_LABELS[linha.status_matching]}
            </span>
            {/* Ações */}
            <div className="flex gap-1">
              {(linha.status_matching === 'identificado' || linha.status_matching === 'possivel') && (
                <>
                  <button
                    onClick={() => handleValidar(linha.id)}
                    className="flex items-center gap-1 h-6 px-2 rounded bg-emerald-600/20 border border-emerald-500/30 text-[10px] text-emerald-400 hover:bg-emerald-600/40 transition-colors"
                    title="Validar"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRejeitar(linha.id)}
                    className="flex items-center gap-1 h-6 px-2 rounded bg-red-600/20 border border-red-500/30 text-[10px] text-red-400 hover:bg-red-600/40 transition-colors"
                    title="Rejeitar"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </>
              )}
              <button
                className="flex items-center gap-1 h-6 px-2 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
                title="Editar"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="bg-sky-500/[0.06] border border-sky-500/20 rounded-xl p-4">
        <p className="text-[11px] font-semibold text-sky-400 mb-2">Regras de Matching Automático</p>
        <ul className="text-[11px] text-white/40 space-y-0.5 list-disc list-inside">
          <li>Score ≥ 90%: Match por ISWC, ISRC ou título + autor exato → <span className="text-emerald-400">Identificado</span></li>
          <li>Score 60-89%: Match por similaridade de título + autor → <span className="text-amber-400">Possível Match</span> (requer validação manual)</li>
          <li>Score &lt; 60%: Obra não reconhecida → <span className="text-red-400">Não Identificado (ONI)</span></li>
          <li>Validado manualmente: liberado para lançamento em Conta Corrente</li>
        </ul>
      </div>
    </div>
  )
}
