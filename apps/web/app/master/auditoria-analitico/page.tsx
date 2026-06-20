'use client'

import { useState, useEffect, useMemo } from 'react'
import { authFetch } from '@/lib/supabase/client'
import {
  Scale, CheckCircle2, AlertTriangle, XCircle, HelpCircle,
  Loader2, RefreshCw, ArrowRight, Search,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface AuditoriaRow {
  obra_id: string
  titulo: string
  codigo: string
  link: number
  e_nome: string
  am_nome: string
  e_pr: number
  am_pr: number
  total_pr_ctrl: number
  pct_e_analitico: number | null
  pct_am_analitico: number | null
  pct_e_publisher: number | null
  pct_am_publisher: number | null
  negocio_id: string | null
  negocio_nome: string | null
  negocio_pct_e: number | null
  negocio_pct_am: number | null
  diferenca: number | null
  status: 'ok' | 'divergente' | 'sem_negocio' | 'sem_e' | 'sem_dados'
}

interface Summary {
  total: number
  ok: number
  divergente: number
  sem_negocio: number
  sem_e: number
}

type FiltroStatus = 'todos' | 'divergente' | 'sem_negocio' | 'ok' | 'sem_e'

// ─── Helpers visuais ──────────────────────────────────────────────────────────
function pct(v: number | null, dec = 2) {
  if (v == null) return <span className="text-white/25">—</span>
  return `${v.toFixed(dec)}%`
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    ok:          { label: 'OK',          cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
    divergente:  { label: 'Divergente',  cls: 'bg-rose-500/15    text-rose-400    border-rose-500/30',    icon: <XCircle      className="w-3 h-3" /> },
    sem_negocio: { label: 'Sem Negócio', cls: 'bg-amber-500/15   text-amber-400   border-amber-500/30',   icon: <AlertTriangle className="w-3 h-3" /> },
    sem_e:       { label: 'Sem E',       cls: 'bg-sky-500/15     text-sky-400     border-sky-500/30',     icon: <HelpCircle   className="w-3 h-3" /> },
    sem_dados:   { label: 'Sem Dados',   cls: 'bg-white/5        text-white/40    border-white/10',        icon: <HelpCircle   className="w-3 h-3" /> },
  }
  const c = cfg[status] ?? cfg.sem_dados
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  )
}

function DifBadge({ val }: { val: number | null }) {
  if (val == null) return <span className="text-white/25">—</span>
  const cls = val <= 0.5 ? 'text-emerald-400' : val <= 5 ? 'text-amber-400' : 'text-rose-400'
  return <span className={`font-semibold tabular-nums ${cls}`}>{val.toFixed(2)}pp</span>
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AuditoriaAnaliticoPage() {
  const [loading,     setLoading]     = useState(true)
  const [erro,        setErro]        = useState('')
  const [summary,     setSummary]     = useState<Summary | null>(null)
  const [resultados,  setResultados]  = useState<AuditoriaRow[]>([])
  const [filtro,      setFiltro]      = useState<FiltroStatus>('todos')
  const [busca,       setBusca]       = useState('')

  async function carregar() {
    setLoading(true); setErro('')
    try {
      const res = await authFetch('/api/auditoria-analitico')
      if (!res.ok) { setErro('Erro ao carregar auditoria'); return }
      const d = await res.json()
      setSummary(d.summary)
      setResultados(d.resultados)
    } catch (e: any) {
      setErro(e.message ?? 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const rows = useMemo(() => {
    let r = resultados
    if (filtro !== 'todos') r = r.filter(x => x.status === filtro)
    if (busca.trim()) {
      const q = busca.trim().toLowerCase()
      r = r.filter(x =>
        x.titulo.toLowerCase().includes(q) ||
        x.codigo.toLowerCase().includes(q) ||
        x.am_nome.toLowerCase().includes(q) ||
        x.e_nome.toLowerCase().includes(q)
      )
    }
    return r
  }, [resultados, filtro, busca])

  const FILTROS: { id: FiltroStatus; label: string; count: number; cls: string }[] = [
    { id: 'todos',       label: 'Todos',       count: summary?.total ?? 0,       cls: 'text-white/60'     },
    { id: 'divergente',  label: 'Divergentes', count: summary?.divergente ?? 0,  cls: 'text-rose-400'     },
    { id: 'sem_negocio', label: 'Sem Negócio', count: summary?.sem_negocio ?? 0, cls: 'text-amber-400'    },
    { id: 'ok',          label: 'OK',          count: summary?.ok ?? 0,          cls: 'text-emerald-400'  },
    { id: 'sem_e',       label: 'Sem E',       count: summary?.sem_e ?? 0,       cls: 'text-sky-400'      },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-bold text-white">Auditoria Analítico × Negócio entre Editoras</h1>
          </div>
          <p className="text-sm text-white/40">
            Confronta os percentuais analíticos derivados do CWR com os contratos cadastrados em Negócio entre Editoras.
            Fórmula: <span className="font-mono text-violet-300/70">% AM CWR = AM_PR / (E_PR + AM_PR) × 100</span>
          </p>
        </div>
        <button
          onClick={carregar}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/60 text-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total links auditados', value: summary.total,       cls: 'text-white'        },
            { label: 'Divergentes',           value: summary.divergente,  cls: 'text-rose-400'     },
            { label: 'Sem negócio cadastrado',value: summary.sem_negocio, cls: 'text-amber-400'    },
            { label: 'OK — Coincidentes',     value: summary.ok,          cls: 'text-emerald-400'  },
          ].map(c => (
            <div key={c.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[11px] text-white/35 mb-1">{c.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${c.cls}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros + busca */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white/[0.05] rounded-lg p-0.5">
          {FILTROS.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1.5
                ${filtro === f.id ? 'bg-violet-600 text-white' : `${f.cls} hover:text-white/80`}`}
            >
              {f.label}
              <span className={`${filtro === f.id ? 'bg-white/20' : 'bg-white/[0.08]'} text-[10px] rounded px-1.5 py-0.5 tabular-nums`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-[#0d1526] border border-white/[0.06] rounded-lg px-3 py-1.5 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-white/30" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar obra, código, editora…"
            className="bg-transparent text-xs text-white/70 placeholder:text-white/25 outline-none w-full"
          />
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-sm text-rose-400">{erro}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-white/30 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Analisando catálogo…
        </div>
      )}

      {/* Tabela */}
      {!loading && !erro && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-2.5 text-white/30 font-semibold text-xs">Obra</th>
                  <th className="text-center px-3 py-2.5 text-white/30 font-semibold text-xs w-10">Link</th>
                  <th className="text-left px-3 py-2.5 text-white/30 font-semibold text-xs">Editora Original (E)</th>
                  <th className="text-left px-3 py-2.5 text-white/30 font-semibold text-xs">Administradora (AM)</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-white/30 font-semibold" title="% da E no total controlado do link">E anal.</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-white/30 font-semibold" title="% da AM no total controlado do link">AM anal.</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-sky-400/60 font-semibold" title="% da E dentro da fatia editorial (E+AM = 100%)">E / pub.</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-sky-400/60 font-semibold" title="% da AM dentro da fatia editorial (E+AM = 100%)">AM / pub.</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-violet-400/60 font-semibold" title="% conforme negócio cadastrado — editora original">E negócio</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-violet-400/60 font-semibold" title="% conforme negócio cadastrado — administradora">AM negócio</th>
                  <th className="text-right px-3 py-2.5 text-white/30 font-semibold text-xs">Diferença</th>
                  <th className="text-center px-4 py-2.5 text-white/30 font-semibold text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-xs text-white/30">
                      Nenhum resultado encontrado.
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={`${r.obra_id}-${r.link}-${i}`} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors
                    ${r.status === 'divergente' ? 'bg-rose-500/[0.03]' : ''}`}>
                    <td className="px-4 py-3">
                      <a href={`/master/obras/${r.obra_id}`} className="group flex items-center gap-1.5">
                        <span className="font-medium text-white/80 group-hover:text-violet-300 transition-colors text-xs leading-snug">
                          {r.titulo}
                        </span>
                        <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                      </a>
                      <span className="text-[10px] font-mono text-white/30">{r.codigo}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-600/30 text-[10px] font-bold text-violet-300">
                        {r.link}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-white/60 max-w-[140px] truncate" title={r.e_nome}>{r.e_nome}</td>
                    <td className="px-3 py-3 text-xs text-white/60 max-w-[140px] truncate" title={r.am_nome}>{r.am_nome}</td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-sky-300/70">{pct(r.pct_e_analitico)}</td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-sky-300/70">{pct(r.pct_am_analitico)}</td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-sky-300 font-semibold">{pct(r.pct_e_publisher)}</td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-sky-300 font-semibold">{pct(r.pct_am_publisher)}</td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-violet-300/80">{pct(r.negocio_pct_e)}</td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-violet-300/80">{pct(r.negocio_pct_am)}</td>
                    <td className="px-3 py-3 text-right"><DifBadge val={r.diferenca} /></td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.01] flex flex-wrap gap-4 text-[10px] text-white/30">
            <span><span className="text-sky-400">E / pub.</span> e <span className="text-sky-400">AM / pub.</span> = % derivado do CWR: cada um dentro da fatia editorial (E+AM=100%)</span>
            <span><span className="text-violet-400">E negócio</span> e <span className="text-violet-400">AM negócio</span> = % conforme contrato em Negócio entre Editoras</span>
            <span><span className="text-white/50">Diferença</span> = |AM CWR − AM Negócio| — tolerância ≤ 0,5pp = OK</span>
          </div>
        </div>
      )}

      {/* Info metodologia */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 text-xs text-white/40 space-y-1">
        <p className="font-semibold text-white/60 mb-2">Metodologia da auditoria</p>
        <p><span className="text-white/55">Analítico derivado do CWR:</span> para cada link com AM, calcula <code className="text-violet-300/70">AM_PR / (E_PR + AM_PR) × 100</code>. Representa a taxa administrativa implícita nos dados CWR.</p>
        <p><span className="text-white/55">Negócio cadastrado:</span> valor de <code className="text-violet-300/70">percentual_administradora</code> do contrato ativo em Negócios entre Editoras, cruzado pelo nome da AM.</p>
        <p><span className="text-white/55">Divergente:</span> diferença {'>'} 0,5 pontos percentuais. Pode indicar dados de importação legada ou contrato desatualizado.</p>
        <p><span className="text-white/55">Sem Negócio:</span> não encontrou contrato ativo para essa administradora. Cadastre em <a href="/master/negocios-editoriais" className="text-violet-400 hover:underline">Negócios entre Editoras</a>.</p>
        <p><span className="text-white/55">Sem E:</span> link tem AM mas não tem Editora Original — estrutura de administração direta (raro).</p>
      </div>
    </div>
  )
}
