'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import {
  Mic2, Search, Hash, RefreshCw, AlertCircle,
  CheckCircle2, Disc, Calendar,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

interface FonogramaRow {
  id: string
  obra_id: string
  isrc?: string | null
  titulo_fonograma: string
  interprete: string
  versao?: string | null
  duracao_segundos?: number | null
  ano_gravacao?: number | null
  gravadora?: string | null
  produtor_fonografico?: string | null
  data_lancamento?: string | null
  pais?: string | null
  plataformas?: string[] | null
  status: string
  obras?: { id: string; titulo: string; codigo_obra: string; iswc?: string | null } | null
}

const VERSAO_LABELS: Record<string, string> = {
  original:  'Original',
  ao_vivo:   'Ao Vivo',
  remix:     'Remix',
  acustico:  'Acústico',
  outro:     'Outro',
}

function formatDuracao(seg?: number | null): string {
  if (!seg) return '—'
  const m = Math.floor(seg / 60)
  const s = String(seg % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function GracoesPage() {
  const [fonogramas, setFonogramas] = useState<FonogramaRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [total, setTotal]           = useState(0)
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus] = useState('ativo')
  const [page, setPage]             = useState(1)
  const LIMIT = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        limit:  String(LIMIT),
        page:   String(page),
      })
      if (search.trim()) {
        if (/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/i.test(search.trim())) {
          params.set('isrc', search.trim())
        } else {
          params.set('interprete', search.trim())
        }
      }
      const res = await authFetch(`/api/fonogramas?${params}`)
      const json = await res.json()
      setFonogramas(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch {
      setFonogramas([])
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, page])

  useEffect(() => { load() }, [load])

  // KPIs locais (da fatia carregada — para KPIs globais seria um endpoint dedicado)
  const comISRC  = fonogramas.filter(f => f.isrc).length
  const semISRC  = fonogramas.filter(f => !f.isrc).length

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6 px-4 py-6 max-w-[1400px]">
      <PageHeader
        title="Gravações / ISRC"
        description="Fonogramas cadastrados no catálogo"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total"    value={total}   icon={<Disc className="w-4 h-4 text-sky-400" />}     accent="sky" />
        <KpiCard title="Com ISRC" value={comISRC} icon={<Hash className="w-4 h-4 text-emerald-400" />} accent="emerald" />
        <KpiCard title="Sem ISRC" value={semISRC} icon={<AlertCircle className="w-4 h-4 text-amber-400" />} accent="amber" />
        <KpiCard title="Ativos"   value={fonogramas.filter(f => f.status === 'ativo').length}
          icon={<CheckCircle2 className="w-4 h-4 text-violet-400" />} accent="violet" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por ISRC ou intérprete..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 focus:outline-none focus:border-sky-500/50"
        >
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="pendente">Pendentes</option>
        </select>

        <button
          onClick={() => load()}
          className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left text-[10px] font-semibold text-white/35 uppercase tracking-wider px-4 py-3">ISRC</th>
                <th className="text-left text-[10px] font-semibold text-white/35 uppercase tracking-wider px-4 py-3">Título / Intérprete</th>
                <th className="text-left text-[10px] font-semibold text-white/35 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Obra</th>
                <th className="text-left text-[10px] font-semibold text-white/35 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Gravadora</th>
                <th className="text-left text-[10px] font-semibold text-white/35 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Versão</th>
                <th className="text-left text-[10px] font-semibold text-white/35 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Ano</th>
                <th className="text-left text-[10px] font-semibold text-white/35 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Duração</th>
                <th className="text-left text-[10px] font-semibold text-white/35 uppercase tracking-wider px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-white/25 text-sm">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && fonogramas.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center gap-3 py-14 text-white/25">
                      <Mic2 className="w-10 h-10" />
                      <p className="text-sm">Nenhum fonograma encontrado</p>
                      <p className="text-xs">Cadastre fonogramas a partir do drawer de obras</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && fonogramas.map(f => (
                <tr key={f.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  {/* ISRC */}
                  <td className="px-4 py-3">
                    {f.isrc ? (
                      <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        {f.isrc}
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-400/60 italic">Sem ISRC</span>
                    )}
                  </td>

                  {/* Título / Intérprete */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-white/85 font-medium truncate max-w-[200px]">
                      {f.titulo_fonograma}
                    </p>
                    <p className="text-[11px] text-white/40 truncate max-w-[200px]">
                      {f.interprete}
                    </p>
                  </td>

                  {/* Obra */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {f.obras ? (
                      <div>
                        <p className="text-[11px] text-violet-400 font-mono">{f.obras.codigo_obra}</p>
                        <p className="text-xs text-white/40 truncate max-w-[160px]">{f.obras.titulo}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
                    )}
                  </td>

                  {/* Gravadora */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-white/50">{f.gravadora ?? '—'}</span>
                  </td>

                  {/* Versão */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-[11px] text-white/50">
                      {VERSAO_LABELS[f.versao ?? ''] ?? f.versao ?? 'Original'}
                    </span>
                  </td>

                  {/* Ano */}
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {f.ano_gravacao ?? '—'}
                    </span>
                  </td>

                  {/* Duração */}
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-xs text-white/40 font-mono">
                      {formatDuracao(f.duracao_segundos)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      f.status === 'ativo'    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      f.status === 'inativo'  ? 'bg-white/5 text-white/30 border-white/10' :
                                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {f.status === 'ativo' ? 'Ativo' : f.status === 'inativo' ? 'Inativo' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] bg-white/[0.01]">
            <p className="text-xs text-white/30">
              {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} de {total}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="h-7 px-3 rounded-lg text-xs text-white/50 hover:text-white/80 disabled:opacity-30 bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-7 px-3 rounded-lg text-xs text-white/50 hover:text-white/80 disabled:opacity-30 bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
