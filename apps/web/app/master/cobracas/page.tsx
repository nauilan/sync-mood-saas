'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Plus, Search, Receipt, CheckCircle2, Clock, AlertCircle, RefreshCw,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

const TIPO_LABELS: Record<string, string> = {
  licenciamento: 'Licenciamento', royalty: 'Royalty', sincronizacao: 'Sincronização',
  performance: 'Performance', mecanica: 'Mecânica', digital: 'Digital', outro: 'Outro',
}
const TIPO_COLORS: Record<string, string> = {
  licenciamento: 'bg-violet-500/20 text-violet-300',
  royalty:       'bg-sky-500/20 text-sky-300',
  sincronizacao: 'bg-amber-500/20 text-amber-300',
  performance:   'bg-emerald-500/20 text-emerald-300',
  mecanica:      'bg-indigo-500/20 text-indigo-300',
  digital:       'bg-pink-500/20 text-pink-300',
  outro:         'bg-white/10 text-white/50',
}
const STATUS_LABELS: Record<string, string> = {
  rascunho:   'Rascunho',
  emitida:    'Emitida',
  paga:       'Paga',
  vencida:    'Vencida',
  cancelada:  'Cancelada',
  em_disputa: 'Em Disputa',
}
const STATUS_COLORS: Record<string, string> = {
  rascunho:   'bg-white/10 text-white/50',
  emitida:    'bg-sky-500/20 text-sky-300',
  paga:       'bg-emerald-500/20 text-emerald-300',
  vencida:    'bg-rose-500/20 text-rose-300',
  cancelada:  'bg-gray-500/20 text-gray-400',
  em_disputa: 'bg-amber-500/20 text-amber-300',
}

function fmtBRL(v?: number | null) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
}
function fmtDate(d?: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
}

interface Cobranca {
  id: string
  numero_cobranca?: string
  tipo?: string
  status?: string
  valor_bruto?: number
  valor_liquido?: number
  moeda?: string
  licenciado_nome?: string
  data_emissao?: string
  data_vencimento?: string
  obra?: { titulo?: string }
  editora?: { nome?: string }
}

interface KPIs {
  total: number
  emitidas: number
  pagas: number
  vencidas: number
}

export default function CobraçasPage() {
  const [loading, setLoading]       = useState(true)
  const [cobracas, setCobracas]     = useState<Cobranca[]>([])
  const [kpis, setKpis]             = useState<KPIs>({ total: 0, emitidas: 0, pagas: 0, vencidas: 0 })
  const [search, setSearch]         = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [error, setError]           = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ per_page: '200' })
      if (filterTipo)   params.set('tipo', filterTipo)
      if (filterStatus) params.set('status', filterStatus)
      const res = await authFetch(`/api/cobracas?${params}`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const json = await res.json()
      setCobracas(json.data ?? [])
      if (json.kpis) setKpis(json.kpis)
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar cobranças')
    } finally {
      setLoading(false)
    }
  }, [filterTipo, filterStatus])

  useEffect(() => { load() }, [load])

  const filtered = cobracas.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.numero_cobranca?.toLowerCase().includes(q) ||
      c.licenciado_nome?.toLowerCase().includes(q) ||
      c.obra?.titulo?.toLowerCase().includes(q)
    )
  })

  const selectCls = 'h-8 bg-white/5 border border-white/[0.06] rounded-lg px-2.5 text-xs text-white/70 focus:outline-none cursor-pointer'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobranças"
        description="Gestão de cobranças de licenciamentos, royalties e demais receitas musicais"
        actions={
          <button
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
            onClick={() => alert('Em implementação: drawer de nova cobrança')}
          >
            <Plus className="w-4 h-4" /> Nova Cobrança
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: kpis.total,    color: 'text-white/80',    icon: Receipt },
          { label: 'Emitidas', value: kpis.emitidas, color: 'text-sky-400',     icon: Clock },
          { label: 'Pagas',    value: kpis.pagas,    color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Vencidas', value: kpis.vencidas, color: 'text-rose-400',    icon: AlertCircle },
        ].map(s => (
          <div key={s.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <s.icon className={`w-3 h-3 ${s.color}`} />
              <p className="text-[10px] text-white/35">{s.label}</p>
            </div>
            <p className={`text-xl font-bold ${s.color} leading-tight`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros + Tabela */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white/5 border border-white/[0.06] rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Número, licenciado ou obra..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className={selectCls}>
            <option value="">Todos os tipos</option>
            {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={load} className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-white/30 ml-auto">{filtered.length} registros</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/30 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-rose-400 text-sm">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Número', 'Tipo', 'Obra', 'Licenciado', 'Emissão', 'Vencimento', 'Valor Bruto', 'Status', ''].map(h => (
                      <th key={h} className="text-left text-[10px] font-medium text-white/30 uppercase tracking-wider px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-white/70">{c.numero_cobranca ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {c.tipo ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${TIPO_COLORS[c.tipo] ?? 'bg-white/10 text-white/50'}`}>
                            {TIPO_LABELS[c.tipo] ?? c.tipo}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/70 max-w-[140px] truncate">{c.obra?.titulo ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-white/70 max-w-[140px] truncate">{c.licenciado_nome ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-white/50">{fmtDate(c.data_emissao)}</td>
                      <td className="px-4 py-3 text-xs text-white/50">{fmtDate(c.data_vencimento)}</td>
                      <td className="px-4 py-3 text-xs text-white/70">{fmtBRL(c.valor_bruto)}</td>
                      <td className="px-4 py-3">
                        {c.status ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[c.status] ?? 'bg-white/10 text-white/50'}`}>
                            {STATUS_LABELS[c.status] ?? c.status}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/master/cobracas/${c.id}`} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-white/30">
                <Receipt className="w-8 h-8" />
                <p className="text-sm">Nenhuma cobrança encontrada</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
