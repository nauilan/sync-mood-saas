'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import {
  Search, Music, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, ChevronRight, BarChart3, Eye,
} from 'lucide-react'
import { KPI_PREVIA, MOCK_PREVIA_OBRA } from '@/lib/mock-distribuicao-previa'
import { getAccessToken } from '@/lib/supabase/client'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR')
}

// Extrai campos chave da descrição pipe-delimited
function getMeta(desc?: string): { editora?: string; periodo?: string; fonte?: string } {
  if (!desc) return {}
  const parts = desc.split(' | ')
  const get = (label: string) => {
    const p = parts.find(x => x.startsWith(label + ':'))
    return p ? p.slice(label.length + 1).trim() : undefined
  }
  return { editora: get('Editora'), periodo: get('Período'), fonte: get('Fonte') }
}

function BloqueioIndicator({ count }: { count: number }) {
  if (count === 0) return <span className="text-xs text-white/25">—</span>
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
      <AlertTriangle className="w-3 h-3" />
      {count} bloqueio{count > 1 ? 's' : ''}
    </span>
  )
}

export default function CCObraPage() {
  const [search, setSearch] = useState('')
  const [ccObras, setCcObras] = useState<any[]>([])
  const [kpis, setKpis] = useState({ saldo_total_obras: 0, total_entradas_mes: 0, total_distribuido_mes: 0, obras_com_bloqueio: 0 })
  const [loading, setLoading] = useState(true)
  const [fonte, setFonte] = useState<'api' | 'vazio'>('vazio')

  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const token = getAccessToken()
    if (!token) { setLoading(false); setDebugInfo('NO_TOKEN'); return }
    fetch('/api/cc-obra?per_page=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        setDebugInfo(JSON.stringify({ raw: json._debug, dataLen: json.data?.length ?? 'undef', status: json.error ?? 'ok' }))
        if (json.data) {
          setCcObras(json.data)
          if (json.kpis) setKpis(json.kpis)
          setFonte('api')
        }
      })
      .catch(e => setDebugInfo('CATCH: ' + e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return ccObras
    return ccObras.filter(o =>
      o.obra_titulo?.toLowerCase().includes(q) || o.obra_codigo?.toLowerCase().includes(q)
    )
  }, [ccObras, search])

  // Mapa de previas por obra_codigo
  const previaMap = new Map(MOCK_PREVIA_OBRA.map(p => [p.obra_codigo, p.valor_previsto]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conta Corrente de Obras"
        description="Origem: negócios jurídicos vigentes (Autor × Editora · Autor × Cessionário · Autor × Licenciante). Receita bruta → separa Editora(s) → separa Cessionários/Licenciantes → saldo ao Autor."
        actions={
          <Link
            href="/master/cc-obra/dashboard"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Saldo Total Obras"
          value={fmtBRL(kpis.saldo_total_obras)}
          subtitle="saldo acumulado nas obras"
          accent="emerald"
          icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          title="Entradas este mês"
          value={fmtBRL(kpis.total_entradas_mes)}
          subtitle="DSP + Sync este mês"
          accent="sky"
          icon={<TrendingUp className="w-4 h-4 text-sky-400" />}
        />
        <KpiCard
          title="Distribuído este mês"
          value={fmtBRL(kpis.total_distribuido_mes)}
          subtitle="enviado aos titulares"
          accent="violet"
          icon={<TrendingDown className="w-4 h-4 text-violet-400" />}
        />
        <KpiCard
          title="Obras c/ Bloqueio"
          value={kpis.obras_com_bloqueio}
          subtitle="necessitam atenção"
          accent="rose"
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
        />
        <KpiCard
          title="Previsto Próx. Dist."
          value={fmtBRL(KPI_PREVIA.total_previsto)}
          subtitle={`Prévia ${KPI_PREVIA.periodo} · ${KPI_PREVIA.obras_identificadas} obras`}
          accent="sky"
          icon={<Eye className="w-4 h-4 text-sky-400" />}
        />
      </div>

      {/* Banner prévia */}
      <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Eye className="w-4 h-4 text-sky-400 shrink-0" />
          <p className="text-xs text-sky-300">
            <span className="font-semibold">Distribuição Prévia {KPI_PREVIA.periodo}</span> — {fmtBRL(KPI_PREVIA.total_previsto)} previstos para {KPI_PREVIA.obras_identificadas} obras.
            O valor previsto por obra aparece na coluna <span className="font-mono">Previsto</span>.
          </p>
        </div>
        <Link href="/master/distribuicao" className="text-xs text-sky-400 hover:text-sky-300 font-semibold whitespace-nowrap transition-colors">
          Efetuar distribuição →
        </Link>
      </div>

      {/* DEBUG TEMPORÁRIO */}
      {debugInfo && (
        <div className="text-xs font-mono bg-yellow-900/30 border border-yellow-500/30 text-yellow-300 rounded px-3 py-2 break-all">
          DEBUG: {debugInfo}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
        <input
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors"
          placeholder="Buscar obra..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Obra</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-emerald-500/60 uppercase tracking-wider">Saldo Atual</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-sky-500/60 uppercase tracking-wider hidden sm:table-cell">Previsto</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-violet-500/60 uppercase tracking-wider hidden lg:table-cell">Distribuído</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-amber-500/60 uppercase tracking-wider hidden md:table-cell">Pendente</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden xl:table-cell">Última Mov.</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-rose-500/60 uppercase tracking-wider hidden sm:table-cell">Bloqueios</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-white/30">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-white/30">Nenhuma conta corrente encontrada.</td></tr>
            ) : filtered.map(obra => {
              const meta = getMeta(obra.movimentos[0]?.descricao)
              return (
              <tr key={obra.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/85">{obra.obra_titulo}</p>
                      <p className="text-[10px] text-white/35 font-mono">{obra.obra_codigo}{obra.obra_iswc ? ` · ${obra.obra_iswc}` : ''}</p>
                      {(meta.editora || meta.periodo || meta.fonte) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {meta.editora && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded px-1.5 py-0.5">
                              <span className="text-sky-300/50">Ed:</span> {meta.editora}
                            </span>
                          )}
                          {meta.periodo && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-white/[0.04] border border-white/[0.08] text-white/50 rounded px-1.5 py-0.5">
                              {meta.periodo}
                            </span>
                          )}
                          {meta.fonte && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded px-1.5 py-0.5">
                              {meta.fonte}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={['text-sm font-bold tabular-nums', obra.saldo_atual > 0 ? 'text-emerald-400' : 'text-white/30'].join(' ')}>
                    {fmtBRL(obra.saldo_atual)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                  {(() => {
                    const prev = previaMap.get(obra.obra_codigo)
                    return prev
                      ? <span className="text-xs font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-full px-2 py-0.5 tabular-nums">+{fmtBRL(prev)}</span>
                      : <span className="text-xs text-white/20">—</span>
                  })()}
                </td>
                <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                  <span className="text-sm text-white/55 tabular-nums">{fmtBRL(obra.saldo_distribuido)}</span>
                </td>
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  {obra.saldo_pendente > 0 ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tabular-nums">
                      {fmtBRL(obra.saldo_pendente)}
                    </span>
                  ) : <span className="text-xs text-white/25">—</span>}
                </td>
                <td className="px-4 py-3.5 hidden xl:table-cell">
                  <span className="text-xs text-white/40">{obra.data_ultima_movimentacao ? fmtDate(obra.data_ultima_movimentacao) : '—'}</span>
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  <BloqueioIndicator count={(obra.bloqueios ?? []).length} />
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/master/cc-obra/${obra.obra_id}`}
                    className="flex items-center justify-end gap-1 text-xs text-white/25 group-hover:text-violet-400 transition-colors"
                  >
                    Ver detalhe <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-white/30">{filtered.length} obra(s) · ECAD/Sociedades não entram na CC da Obra — apenas informativos.</p>
        </div>
      </div>
    </div>
  )
}
