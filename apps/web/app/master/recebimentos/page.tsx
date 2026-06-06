'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  Download, Upload, FileText, DollarSign, Globe, AlertCircle,
  CheckCircle2, Clock, Search, Eye, ChevronRight, Info,
  RefreshCw, Play, Plus,
} from 'lucide-react'
import {
  FONTE_LABELS, FONTE_COLORS,
  CATEGORIA_LABELS, CATEGORIA_COLORS,
  STATUS_RECEBIMENTO_LABELS, STATUS_RECEBIMENTO_COLORS,
} from '@/lib/types-recebimentos'
import type { FonteRecebimento, CategoriaRecebimento, StatusRecebimento } from '@/lib/types-recebimentos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBRL(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value)
}

function formatPeriodo(inicio: string, fim: string) {
  const fmt = (d: string) => {
    const date = new Date(d + 'T12:00:00Z')
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }
  return `${fmt(inicio)} – ${fmt(fim)}`
}

import { authFetch } from '@/lib/supabase/client'

// ── Tipos locais ──────────────────────────────────────────────────────────────

interface RecebimentoDB {
  id: string
  codigo: string
  obra_id: string | null
  fonte_pagadora_codigo: string
  fonte_pagadora_tipo: string | null
  categoria: string
  status: string
  territorio: string | null
  competencia_inicio: string
  competencia_fim: string
  valor_bruto: number
  valor_liquido: number
  moeda: string
  valor_brl: number
  observacoes: string | null
  created_at: string
  tipo_direito?: { id: string; codigo: string; nome: string } | null
}

interface KpisDB {
  total: number
  valor_total_brl: number
  operacional: number
  informativo: number
  distribuidos: number
  pendente_matching: number
}

// ── Mapas de compatibilidade com tipos antigos ───────────────────────────────
// O banco usa fonte_pagadora_codigo livre — mapeamos para as cores/labels
// do types-recebimentos quando há correspondência
function getFonteLabel(codigo: string): string {
  const mapa: Record<string, string> = {
    ECAD: 'ECAD / SOCINPRO',
    SOCINPRO: 'ECAD / SOCINPRO',
    ABRAMUS: 'ECAD / SOCINPRO',
    SPOTIFY: 'BackOffice Music Services',
    YOUTUBE: 'BackOffice Music Services',
    APPLE: 'BackOffice Music Services',
    DEEZER: 'BackOffice Music Services',
    SYNC: 'Sync',
    INTERNACIONAL: 'Internacional',
  }
  return mapa[codigo.toUpperCase()] ?? codigo
}

function getFonteCor(codigo: string): string {
  const mapa: Record<string, string> = {
    ECAD: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    SOCINPRO: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    ABRAMUS: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    SPOTIFY: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    YOUTUBE: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    APPLE: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    DEEZER: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    SYNC: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    INTERNACIONAL: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  }
  return mapa[codigo.toUpperCase()] ?? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
}

function getStatusLabel(status: string): string {
  const mapa: Record<string, string> = {
    importado:          'Importado',
    pendente_matching:  'Pend. Matching',
    em_conciliacao:     'Em Conciliação',
    conciliado:         'Conciliado',
    divergente:         'Divergente',
    distribuido:        'Distribuído',
    auditado:           'Auditado',
  }
  return mapa[status] ?? status
}

function getStatusCor(status: string): string {
  const mapa: Record<string, string> = {
    importado:          'bg-slate-500/20 text-slate-300 border-slate-500/30',
    pendente_matching:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
    em_conciliacao:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
    conciliado:         'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    divergente:         'bg-red-500/20 text-red-300 border-red-500/30',
    distribuido:        'bg-violet-500/20 text-violet-300 border-violet-500/30',
    auditado:           'bg-teal-500/20 text-teal-300 border-teal-500/30',
  }
  return mapa[status] ?? 'bg-white/10 text-white/50 border-white/10'
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RecebimentosPage() {
  const router = useRouter()
  const [recebimentos, setRecebimentos] = useState<RecebimentoDB[]>([])
  const [kpis, setKpis] = useState<KpisDB | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [processando, setProcessando] = useState<string | null>(null)

  const selectCls = 'h-8 bg-white/5 border border-white/[0.06] rounded-lg px-2.5 text-xs text-white/70 focus:outline-none cursor-pointer'

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/recebimentos?per_page=100')
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        throw new Error(`Erro ${res.status}`)
      }
      const json = await res.json()
      setRecebimentos(json.data ?? [])
      setKpis(json.kpis ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar recebimentos')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { carregar() }, [carregar])

  const lista = useMemo(() => {
    return recebimentos.filter(r => {
      if (search && !r.codigo.toLowerCase().includes(search.toLowerCase()) &&
          !r.fonte_pagadora_codigo.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus && r.status !== filterStatus) return false
      return true
    })
  }, [recebimentos, search, filterStatus])

  const processarCC = async (id: string) => {
    setProcessando(id)
    try {
      const res = await authFetch(`/api/recebimentos/${id}`, {
        method: 'PATCH',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao processar')
      await carregar()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao processar CC Obra')
    } finally {
      setProcessando(null)
    }
  }

  const kpiList = kpis ? [
    { label: 'Total',             value: kpis.total,                       color: 'text-white/80',    icon: FileText },
    { label: 'Valor Total BRL',   value: formatBRL(kpis.valor_total_brl),  color: 'text-emerald-300', icon: DollarSign },
    { label: 'Operacional',       value: kpis.operacional,                 color: 'text-violet-400',  icon: Globe },
    { label: 'Informativo',       value: kpis.informativo,                 color: 'text-slate-400',   icon: Info },
    { label: 'Pend. Matching',    value: kpis.pendente_matching,           color: 'text-amber-400',   icon: Clock },
    { label: 'Distribuídos',      value: kpis.distribuidos,                color: 'text-emerald-400', icon: CheckCircle2 },
  ] : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recebimentos"
        description="Gestão de recebimentos de royalties — ECAD, DSPs, Sync, Internacional e Acordos Diretos"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={carregar}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06] text-sm text-white/60 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/master/recebimentos/divergencias"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-sm text-red-300 font-semibold transition-colors"
            >
              <AlertCircle className="w-4 h-4" /> Divergências
            </Link>
            <Link
              href="/master/recebimentos/importar"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
            >
              <Upload className="w-4 h-4" /> Importar
            </Link>
          </div>
        }
      />

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpiList.map(stat => (
            <div key={stat.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                <p className="text-[10px] text-white/35">{stat.label}</p>
              </div>
              <p className={`text-xl font-bold ${stat.color} leading-tight`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros + Tabela */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white/5 border border-white/[0.06] rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Código ou fonte..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">Todos status</option>
            <option value="importado">Importado</option>
            <option value="pendente_matching">Pend. Matching</option>
            <option value="em_conciliacao">Em Conciliação</option>
            <option value="conciliado">Conciliado</option>
            <option value="divergente">Divergente</option>
            <option value="distribuido">Distribuído</option>
            <option value="auditado">Auditado</option>
          </select>
          <span className="text-xs text-white/30 ml-auto">{lista.length} registros</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-white/30 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Carregando recebimentos...
          </div>
        )}

        {/* Tabela */}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs font-semibold text-white/30 px-5 py-3 w-36">Código</th>
                  <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-40">Fonte</th>
                  <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-24">Direito</th>
                  <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-16">Territ.</th>
                  <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Competência</th>
                  <th className="text-right text-xs font-semibold text-white/30 px-4 py-3 w-36">Valor BRL</th>
                  <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-36">Status</th>
                  <th className="text-center text-xs font-semibold text-white/30 px-4 py-3 w-24">CC Obra</th>
                  <th className="px-5 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {lista.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-white/60">{r.codigo}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getFonteCor(r.fonte_pagadora_codigo)}`}>
                        {getFonteLabel(r.fonte_pagadora_codigo)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/50">
                        {r.tipo_direito?.codigo ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-white/40">{r.territorio ?? 'BR'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/50">
                        {formatPeriodo(r.competencia_inicio, r.competencia_fim)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold tabular-nums text-emerald-400">
                        {formatBRL(r.valor_brl)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusCor(r.status)}`}>
                        {getStatusLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {r.obra_id && r.status !== 'distribuido' && r.status !== 'auditado' ? (
                        <button
                          onClick={() => processarCC(r.id)}
                          disabled={processando === r.id}
                          title="Processar CC Obra"
                          className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors"
                        >
                          {processando === r.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Play className="w-3.5 h-3.5" />
                          }
                        </button>
                      ) : (
                        <span className="text-xs text-white/20">
                          {r.status === 'distribuido' || r.status === 'auditado' ? '✓' : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/master/recebimentos/${r.id}`}
                        className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && lista.length === 0 && !error && (
          <div className="flex flex-col items-center gap-2 py-12 text-white/30">
            <Download className="w-8 h-8" />
            <p className="text-sm">Nenhum recebimento encontrado</p>
            <p className="text-xs text-white/20">Importe um demonstrativo ou cadastre manualmente</p>
          </div>
        )}
      </div>
    </div>
  )
}
