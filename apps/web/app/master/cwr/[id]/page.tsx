'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Loader2, AlertTriangle, CheckCircle2, ArrowLeft,
  Music, Users, Building2, AlertOctagon, BarChart3,
  FileCode2, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

// ─── helpers ──────────────────────────────────────────────────────────────────

const MATCH_BADGE: Record<string, { label: string; cls: string }> = {
  nova:      { label: 'Nova',      cls: 'bg-emerald-500/15 text-emerald-400' },
  vinculada: { label: 'Vinculada', cls: 'bg-sky-500/15 text-sky-400'        },
  conflito:  { label: 'Conflito',  cls: 'bg-rose-500/15 text-rose-400'      },
  divergente:{ label: 'Divergente',cls: 'bg-amber-500/15 text-amber-400'    },
  ignorada:  { label: 'Ignorada',  cls: 'bg-slate-500/15 text-slate-400'    },
}

const EDITORIAL_BADGE: Record<string, { label: string; cls: string }> = {
  controlado:          { label: 'Controlado',          cls: 'text-emerald-400' },
  em_validacao:        { label: 'Em Validação',        cls: 'text-amber-400'   },
  nao_controlado:      { label: 'Não Controlado',      cls: 'text-rose-400'    },
  administrado_externo:{ label: 'Adm. Externo',        cls: 'text-sky-400'     },
}

const STATUS_IMP: Record<string, string> = {
  pendente:   'bg-slate-500/15 text-slate-400',
  em_analise: 'bg-amber-500/15 text-amber-400',
  confirmado: 'bg-emerald-500/15 text-emerald-400',
  descartado: 'bg-rose-500/15 text-rose-400',
}

function ObraCard({ obra, showConfirm }: { obra: any; showConfirm?: boolean }) {
  const [open, setOpen] = useState(false)
  const cwr = obra.snapshot_cwr ?? {}
  const mb = MATCH_BADGE[obra.match_tipo] ?? { label: obra.match_tipo, cls: 'bg-white/5 text-white/40' }
  const eb = EDITORIAL_BADGE[obra.status_editorial] ?? { label: obra.status_editorial, cls: 'text-white/40' }

  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Music className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="text-sm text-white font-medium truncate">{cwr.titulo ?? '—'}</span>
          {cwr.iswc && (
            <span className="text-[10px] font-mono text-white/30 shrink-0">{cwr.iswc}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${mb.cls}`}>{mb.label}</span>
          <span className={`text-[10px] font-semibold ${eb.cls}`}>{eb.label}</span>
          <span className="text-xs text-white/20">{obra.match_score ?? 0}%</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
          {/* Autores */}
          {(cwr.autores ?? []).length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Autores
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(cwr.autores as any[]).map((a: any, i: number) => (
                  <span key={i} className="text-xs bg-white/[0.04] text-white/60 px-2 py-0.5 rounded">
                    {a.nome} {a.percentual_pr ? `(${a.percentual_pr}%)` : ''} {a.ipi ? `— IPI ${a.ipi}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Editoras */}
          {(cwr.editoras ?? []).length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase mb-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Editoras
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(cwr.editoras as any[]).map((e: any, i: number) => (
                  <span key={i} className="text-xs bg-white/[0.04] text-white/60 px-2 py-0.5 rounded">
                    {e.nome} {e.percentual_pr ? `(${e.percentual_pr}%)` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fonogramas */}
          {(cwr.fonogramas ?? []).length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase mb-1.5">Fonogramas</p>
              <div className="space-y-1">
                {(cwr.fonogramas as any[]).map((f: any, i: number) => (
                  <div key={i} className="text-[11px] text-white/50 flex items-center gap-2">
                    <span className="font-mono text-violet-300/60">{f.isrc ?? '—'}</span>
                    <span>{f.interprete ?? '—'}</span>
                    {f.versao && <span className="text-white/30">{f.versao}</span>}
                    {f.ano && <span className="text-white/30">{f.ano}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Títulos alternativos */}
          {(cwr.titulos_alt ?? []).length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase mb-1">Títulos Alternativos</p>
              <div className="flex flex-wrap gap-1.5">
                {(cwr.titulos_alt as string[]).map((t, i) => (
                  <span key={i} className="text-[11px] bg-white/[0.03] text-white/40 px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Critério de match */}
          {obra.match_criterio && (
            <p className="text-[10px] text-white/25">
              Match por: <span className="text-white/40">{obra.match_criterio}</span>
              {obra.obra_id && <span className="ml-2 font-mono text-white/20">obra #{obra.obra_id.slice(0, 8)}</span>}
            </p>
          )}

          {showConfirm && obra.match_tipo === 'nova' && (
            <div className="mt-1 pt-2 border-t border-white/[0.04] text-[10px] text-white/30">
              Será criada como <span className="text-amber-400 font-semibold">pré-cadastro</span> ao confirmar a importação.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'novas',      label: 'Obras Novas',    icon: Music          },
  { key: 'vinculadas', label: 'Vinculadas',      icon: CheckCircle2  },
  { key: 'conflitos',  label: 'Conflitos',       icon: AlertOctagon  },
  { key: 'relatorio',  label: 'Relatório',       icon: BarChart3     },
] as const

type TabKey = typeof TABS[number]['key']

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CwrDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]   = useState('')
  const [tab, setTab]     = useState<TabKey>('novas')
  const [confirming, setConfirming] = useState(false)
  const [confirmaErro, setConfirmaErro] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [reprocessando, setReprocessando] = useState(false)
  const [reprocessErro, setReprocessErro] = useState('')
  const [reprocessStats, setReprocessStats] = useState<Record<string, number> | null>(null)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    setErro('')
    try {
      const res = await authFetch(`/api/cwr/${id}`)
      if (res.status === 401) { setErro('Sessão expirada. Faça login novamente.'); return }
      if (res.status === 404) { setErro('Importação não encontrada. O registro pode ter sido removido — faça um novo upload.'); return }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setErro(d.error ?? `Erro ${res.status} ao carregar importação.`)
        return
      }
      setData(await res.json())
    } catch { setErro('Falha na requisição. Verifique sua conexão.') }
    finally { setLoading(false) }
  }

  async function reprocessar() {
    setReprocessErro('')
    setReprocessStats(null)
    setReprocessando(true)
    try {
      const res = await authFetch(`/api/cwr/${id}/reprocessar`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { setReprocessErro(d.error ?? 'Erro ao reprocessar.'); return }
      setReprocessStats(d.stats)
      load()
    } catch { setReprocessErro('Falha na requisição.') }
    finally { setReprocessando(false) }
  }

  async function confirmar() {
    setConfirmaErro('')
    setConfirming(true)
    try {
      const res = await authFetch(`/api/cwr/${id}/confirmar`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { setConfirmaErro(d.error ?? 'Erro ao confirmar.'); return }
      setConfirmado(true)
      load()
    } catch { setConfirmaErro('Falha na requisição.') }
    finally { setConfirming(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-white/30 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" /> Carregando importação...
      </div>
    )
  }

  if (erro || !data) {
    const isExpired = erro?.includes('expirada')
    return (
      <div className="space-y-4">
        <a href="/master/cwr" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </a>
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {erro || 'Importação não encontrada.'}
        </div>
        <div className="flex gap-3">
          {isExpired && (
            <a href="/auth/login" className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors">
              Fazer login
            </a>
          )}
          <a href="/master/cwr" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.10] text-white/70 text-xs font-semibold rounded-lg transition-colors">
            <FileCode2 className="w-3.5 h-3.5" /> Novo upload CWR
          </a>
        </div>
      </div>
    )
  }

  const imp = data.importacao
  const obras: any[] = data.obras ?? []
  const conflitos: any[] = data.conflitos ?? []
  const r = imp.relatorio ?? {}

  const obrasFiltradas: Record<TabKey, any[]> = {
    novas:      obras.filter(o => o.match_tipo === 'nova'),
    vinculadas: obras.filter(o => o.match_tipo === 'vinculada'),
    conflitos:  obras.filter(o => o.match_tipo === 'conflito' || o.match_tipo === 'divergente'),
    relatorio:  [],
  }

  // Parser v2 = reprocessado com offsets corretos (campo relatorio.parser_versao)
  const parserAtualizado = r.parser_versao >= 2
  const podeConfirmar = imp.status === 'em_analise' && parserAtualizado

  const COUNTERS = [
    { key: 'obras_lidas',                    label: 'Obras lidas',                  cls: 'text-white/70'   },
    { key: 'obras_novas',                    label: 'Obras novas',                  cls: 'text-emerald-400' },
    { key: 'obras_vinculadas',               label: 'Obras vinculadas',             cls: 'text-sky-400'    },
    { key: 'obras_ignoradas',                label: 'Obras ignoradas',              cls: 'text-white/40'   },
    { key: 'obras_divergentes',              label: 'Obras divergentes',            cls: 'text-amber-400'  },
    { key: 'titulares_novos',                label: 'Titulares novos',              cls: 'text-emerald-400' },
    { key: 'titulares_vinculados',           label: 'Titulares vinculados',         cls: 'text-sky-400'    },
    { key: 'editoras_novas',                 label: 'Editoras novas',               cls: 'text-emerald-400' },
    { key: 'editoras_vinculadas',            label: 'Editoras vinculadas',          cls: 'text-sky-400'    },
    { key: 'negocios_editoriais_criados',    label: 'Negócios editoriais',          cls: 'text-violet-400' },
    { key: 'fonogramas_criados',             label: 'Fonogramas criados',           cls: 'text-emerald-400' },
    { key: 'fonogramas_vinculados',          label: 'Fonogramas vinculados',        cls: 'text-sky-400'    },
    { key: 'participantes_controlados',      label: 'Participantes controlados',    cls: 'text-emerald-400' },
    { key: 'participantes_nao_controlados',  label: 'Participantes não controlados',cls: 'text-rose-400'   },
    { key: 'participantes_administrado_externo', label: 'Participantes adm. externo', cls: 'text-sky-400' },
    { key: 'conflitos_editoriais',           label: 'Conflitos editoriais',         cls: 'text-rose-400'   },
  ]

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <PageHeader
        title={imp.nome_arquivo}
        description={`Importação CWR — ${new Date(imp.created_at).toLocaleDateString('pt-BR')}`}
        actions={
          <div className="flex items-center gap-3">
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${STATUS_IMP[imp.status] ?? 'bg-white/5 text-white/40'}`}>
              {imp.status}
            </span>
            {imp.status !== 'confirmado' && (
              <button
                onClick={reprocessar}
                disabled={reprocessando}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                title="Re-parsear com o parser corrigido (offsets CWR 2.1)"
              >
                {reprocessando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {reprocessando ? 'Reprocessando...' : 'Reprocessar'}
              </button>
            )}
            {podeConfirmar && !confirmado && (
              <button
                onClick={confirmar}
                disabled={confirming}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {confirming ? 'Confirmando...' : 'Confirmar Importação'}
              </button>
            )}
          </div>
        }
      />

      <a href="/master/cwr" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Todas as importações
      </a>

      {/* Banner: parser desatualizado */}
      {!parserAtualizado && imp.status !== 'confirmado' && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Parser desatualizado</p>
            <p className="text-xs text-amber-300/70 mt-0.5">
              Esta importação foi processada com o parser antigo (offsets incorretos).
              Clique em <strong>Reprocessar</strong> para corrigir títulos, autores, ISWCs, ISRCs e percentuais antes de confirmar.
              O botão <strong>Confirmar Importação</strong> ficará disponível após o reprocessamento.
            </p>
          </div>
        </div>
      )}

      {/* Métricas de reprocessamento */}
      {reprocessStats && (
        <div className="flex items-start gap-3 px-4 py-3 bg-violet-500/10 border border-violet-500/25 rounded-lg text-violet-300 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Reprocessamento concluído</p>
            <p className="text-xs text-violet-300/70 mt-0.5">
              {reprocessStats.obras_lidas} obras · {reprocessStats.iswcs_recuperados} ISWCs · {reprocessStats.isrcs_recuperados} ISRCs · {reprocessStats.erros_parse} erros de parse
            </p>
          </div>
        </div>
      )}

      {confirmado && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Importação confirmada. Obras novas criadas como pré-cadastro.
        </div>
      )}

      {reprocessErro && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Erro no reprocessamento: {reprocessErro}
        </div>
      )}
      {confirmaErro && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {confirmaErro}
        </div>
      )}

      {/* Resumo rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { n: obras.filter(o => o.match_tipo === 'nova').length,       label: 'Obras Novas',    cls: 'text-emerald-400' },
          { n: obras.filter(o => o.match_tipo === 'vinculada').length,  label: 'Vinculadas',     cls: 'text-sky-400'    },
          { n: conflitos.length + obras.filter(o => o.match_tipo === 'conflito' || o.match_tipo === 'divergente').length, label: 'Conflitos', cls: 'text-rose-400' },
          { n: obras.length,                                            label: 'Total Obras CWR',cls: 'text-white/60'   },
        ].map(({ n, label, cls }) => (
          <div key={label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl px-5 py-4 text-center">
            <p className={`text-3xl font-bold tabular-nums ${cls}`}>{n}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06]">
        <div className="flex gap-0">
          {TABS.map(t => {
            const count =
              t.key === 'novas'      ? obrasFiltradas.novas.length
            : t.key === 'vinculadas' ? obrasFiltradas.vinculadas.length
            : t.key === 'conflitos'  ? obrasFiltradas.conflitos.length
            : null
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-violet-500/20 text-violet-300' : 'bg-white/[0.06] text-white/30'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Obras Novas */}
      {tab === 'novas' && (
        <div className="space-y-2">
          {obrasFiltradas.novas.length === 0 ? (
            <p className="text-sm text-white/30 py-8 text-center">Nenhuma obra nova nesta importação.</p>
          ) : (
            <>
              <p className="text-xs text-white/30 px-1">
                {obrasFiltradas.novas.length} obra(s) serão criadas como <span className="text-amber-400">pré-cadastro</span> ao confirmar.
              </p>
              {obrasFiltradas.novas.map((o: any) => <ObraCard key={o.id} obra={o} showConfirm />)}
            </>
          )}
        </div>
      )}

      {/* Obras Vinculadas */}
      {tab === 'vinculadas' && (
        <div className="space-y-2">
          {obrasFiltradas.vinculadas.length === 0 ? (
            <p className="text-sm text-white/30 py-8 text-center">Nenhuma obra vinculada nesta importação.</p>
          ) : (
            <>
              <p className="text-xs text-white/30 px-1">
                {obrasFiltradas.vinculadas.length} obra(s) identificadas no sistema. Campos vazios serão preenchidos ao confirmar.
              </p>
              {obrasFiltradas.vinculadas.map((o: any) => <ObraCard key={o.id} obra={o} />)}
            </>
          )}
        </div>
      )}

      {/* Conflitos */}
      {tab === 'conflitos' && (
        <div className="space-y-3">
          {obrasFiltradas.conflitos.length === 0 && conflitos.length === 0 ? (
            <p className="text-sm text-white/30 py-8 text-center">Nenhum conflito editorial nesta importação.</p>
          ) : (
            <>
              {obrasFiltradas.conflitos.length > 0 && (
                <div>
                  <p className="text-xs text-rose-400/80 px-1 mb-2 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    {obrasFiltradas.conflitos.length} obra(s) bloqueadas — exigem revisão humana antes da confirmação.
                  </p>
                  {obrasFiltradas.conflitos.map((o: any) => <ObraCard key={o.id} obra={o} />)}
                </div>
              )}
              {conflitos.map((c: any) => (
                <div key={c.id} className="bg-rose-500/[0.05] border border-rose-500/20 rounded-lg px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-xs font-semibold text-rose-300">{c.tipo?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-xs text-white/50 pl-5">{c.descricao}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Relatório */}
      {tab === 'relatorio' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              Relatório Final — 16 Contadores
            </h3>
          </div>
          {Object.keys(r).length === 0 ? (
            <p className="text-xs text-white/30 py-8 text-center">
              Relatório disponível após confirmação da importação.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {COUNTERS.map(({ key, label, cls }) => (
                <div key={key} className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-white/50">{label}</span>
                  <span className={`text-sm font-bold tabular-nums ${cls}`}>
                    {r[key] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
