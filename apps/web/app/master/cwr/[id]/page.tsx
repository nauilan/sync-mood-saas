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

// ─── sub-componentes corpo autoral ────────────────────────────────────────────

function PctCell({ pr, mr, sr }: { pr: number; mr: number; sr: number }) {
  const items = [
    pr > 0 && `PR ${pr}%`,
    mr > 0 && `MR ${mr}%`,
    sr > 0 && `SR ${sr}%`,
  ].filter(Boolean)
  if (!items.length) return null
  return (
    <span className="text-[10px] text-white/30 font-mono whitespace-nowrap">
      {items.join(' · ')}
    </span>
  )
}

function PapelTag({ papel, cor }: { papel: string; cor: 'violet' | 'sky' | 'slate' }) {
  const cls = {
    violet: 'bg-violet-500/15 text-violet-400',
    sky:    'bg-sky-500/15 text-sky-400',
    slate:  'bg-slate-500/15 text-slate-400',
  }[cor]
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0 ${cls}`}>
      {papel}
    </span>
  )
}

function ObraCard({ obra, showConfirm }: { obra: any; showConfirm?: boolean }) {
  const [open, setOpen] = useState(false)
  const cwr = obra.snapshot_cwr ?? {}
  const mb = MATCH_BADGE[obra.match_tipo] ?? { label: obra.match_tipo, cls: 'bg-white/5 text-white/40' }
  const eb = EDITORIAL_BADGE[obra.status_editorial] ?? { label: obra.status_editorial, cls: 'text-white/40' }

  const autores:    any[]    = cwr.autores    ?? []
  const editoras:   any[]    = cwr.editoras   ?? []
  const fonogramas: any[]    = cwr.fonogramas ?? []
  const pwrLinks:   any[]    = cwr.pwr_links  ?? []
  const titAlt:     string[] = cwr.titulos_alt ?? []

  // Mapas de IPI para lookup rápido
  const autorByIpi  = new Map(autores.filter((a: any) => a.ipi).map((a: any) => [a.ipi, a]))
  const edByIpi     = new Map(editoras.filter((e: any) => e.ipi).map((e: any) => [e.ipi, e]))

  // Links controlados: agrupa autor + editora via pwr_links
  const linkGroups = pwrLinks.map((p: any) => ({
    autor:    autorByIpi.get(p.writer_ip)    ?? null,
    editora:  edByIpi.get(p.publisher_ip)    ?? null,
    writerIp: p.writer_ip,
    pubIp:    p.publisher_ip,
    pubNome:  p.publisher_nome,
  })).filter((g: any) => g.autor || g.editora)

  const ipisComLink = new Set([
    ...linkGroups.map((g: any) => g.writerIp).filter(Boolean),
    ...linkGroups.map((g: any) => g.pubIp).filter(Boolean),
  ])

  // Autores/editoras controlados sem pwr_link (fallback quando não há pwr_links)
  const autoresSemLink  = autores.filter((a: any) => !ipisComLink.has(a.ipi))
  const editorasSemLink = editoras.filter((e: any) => !ipisComLink.has(e.ipi))

  const autCtrl    = autoresSemLink.filter((a: any) => a.controlled !== false)
  const autNaoCtrl = autoresSemLink.filter((a: any) => a.controlled === false)
  const edCtrl     = editorasSemLink.filter((e: any) => e.controlled !== false)
  const edNaoCtrl  = editorasSemLink.filter((e: any) => e.controlled === false)

  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg overflow-hidden">
      {/* ── cabeçalho ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Music className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="text-sm text-white font-medium truncate">{cwr.titulo ?? '—'}</span>
          {cwr.iswc && (
            <span className="text-[10px] font-mono text-violet-300/50 shrink-0">{cwr.iswc}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${mb.cls}`}>{mb.label}</span>
          <span className={`text-[10px] font-semibold ${eb.cls}`}>{eb.label}</span>
          <span className="text-xs text-white/20">{obra.match_score ?? 0}%</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
        </div>
      </button>

      {/* ── corpo expandido ── */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04] pt-3">

          {/* Info geral */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px]">
            <span className="text-white/30">
              Código CWR: <span className="font-mono text-white/50">{cwr.submitter_work_no || '—'}</span>
            </span>
            {cwr.iswc && (
              <span className="text-white/30">
                ISWC: <span className="font-mono text-violet-300/60">{cwr.iswc}</span>
              </span>
            )}
            {cwr.lang && (
              <span className="text-white/30">
                Idioma: <span className="text-white/50">{cwr.lang}</span>
              </span>
            )}
            {cwr.categoria && (
              <span className="text-white/30">
                Categoria: <span className="text-white/50">{cwr.categoria}</span>
              </span>
            )}
          </div>

          {/* Títulos alternativos */}
          {titAlt.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {titAlt.map((t, i) => (
                <span key={i} className="text-[10px] bg-white/[0.03] text-white/35 px-2 py-0.5 rounded border border-white/[0.05]">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* ─── Links controlados (autor + editora no mesmo bloco) ─── */}
          {linkGroups.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase mb-2 flex items-center gap-1.5">
                <FileCode2 className="w-3 h-3" /> Links Controlados
              </p>
              <div className="space-y-2">
                {linkGroups.map((lg: any, i: number) => (
                  <div key={i} className="bg-white/[0.025] border border-white/[0.05] rounded-md overflow-hidden">
                    {lg.autor && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs">
                        <Users className="w-3 h-3 text-violet-400 shrink-0" />
                        <span className="text-white/75 font-medium flex-1 min-w-0 truncate">{lg.autor.nome}</span>
                        <PapelTag papel={lg.autor.papel || 'CA'} cor="violet" />
                        {lg.autor.ipi && (
                          <span className="text-[10px] text-white/25 font-mono hidden sm:block">IPI {lg.autor.ipi}</span>
                        )}
                        <PctCell pr={lg.autor.pr_pct ?? 0} mr={lg.autor.mr_pct ?? 0} sr={lg.autor.sr_pct ?? 0} />
                      </div>
                    )}
                    {lg.editora && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs border-t border-white/[0.04] bg-white/[0.01] pl-6">
                        <Building2 className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="text-white/60 flex-1 min-w-0 truncate">{lg.editora.nome}</span>
                        <PapelTag papel={lg.editora.tipo || lg.editora.papel || 'E'} cor="sky" />
                        {lg.editora.ipi && (
                          <span className="text-[10px] text-white/25 font-mono hidden sm:block">IPI {lg.editora.ipi}</span>
                        )}
                        <PctCell pr={lg.editora.pr_pct ?? 0} mr={lg.editora.mr_pct ?? 0} sr={lg.editora.sr_pct ?? 0} />
                      </div>
                    )}
                    {!lg.editora && (
                      <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] border-t border-white/[0.03] bg-white/[0.01] pl-6 text-white/25 italic">
                        <Building2 className="w-3 h-3 shrink-0" />
                        {lg.pubNome || 'Editora não identificada'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Autores/editoras controlados sem pwr_link ─── */}
          {(autCtrl.length > 0 || edCtrl.length > 0) && (
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase mb-2 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-violet-400" /> Autores Controlados
              </p>
              <div className="space-y-1">
                {autCtrl.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/[0.025] border border-white/[0.05] rounded-md text-xs">
                    <Users className="w-3 h-3 text-violet-400 shrink-0" />
                    <span className="text-white/75 font-medium flex-1 min-w-0 truncate">{a.nome}</span>
                    <PapelTag papel={a.papel || 'CA'} cor="violet" />
                    {a.ipi && <span className="text-[10px] text-white/25 font-mono hidden sm:block">IPI {a.ipi}</span>}
                    <PctCell pr={a.pr_pct ?? 0} mr={a.mr_pct ?? 0} sr={a.sr_pct ?? 0} />
                  </div>
                ))}
                {edCtrl.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/[0.025] border border-white/[0.05] rounded-md text-xs pl-5">
                    <Building2 className="w-3 h-3 text-sky-400 shrink-0" />
                    <span className="text-white/60 flex-1 min-w-0 truncate">{e.nome}</span>
                    <PapelTag papel={e.tipo || e.papel || 'E'} cor="sky" />
                    {e.ipi && <span className="text-[10px] text-white/25 font-mono hidden sm:block">IPI {e.ipi}</span>}
                    <PctCell pr={e.pr_pct ?? 0} mr={e.mr_pct ?? 0} sr={e.sr_pct ?? 0} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Autores/editoras NÃO controlados ─── */}
          {(autNaoCtrl.length > 0 || edNaoCtrl.length > 0) && (
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase mb-2 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-white/30" /> Não Controlados
              </p>
              <div className="space-y-1">
                {autNaoCtrl.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.015] border border-white/[0.04] rounded-md text-xs">
                    <Users className="w-3 h-3 text-white/25 shrink-0" />
                    <span className="text-white/45 flex-1 min-w-0 truncate">{a.nome}</span>
                    <PapelTag papel={a.papel || 'OA'} cor="slate" />
                    {a.ipi && <span className="text-[10px] text-white/20 font-mono hidden sm:block">IPI {a.ipi}</span>}
                    <PctCell pr={a.pr_pct ?? 0} mr={a.mr_pct ?? 0} sr={a.sr_pct ?? 0} />
                  </div>
                ))}
                {edNaoCtrl.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.015] border border-white/[0.04] rounded-md text-xs pl-5">
                    <Building2 className="w-3 h-3 text-white/25 shrink-0" />
                    <span className="text-white/45 flex-1 min-w-0 truncate">{e.nome}</span>
                    <PapelTag papel={e.tipo || e.papel || 'OE'} cor="slate" />
                    {e.ipi && <span className="text-[10px] text-white/20 font-mono hidden sm:block">IPI {e.ipi}</span>}
                    <PctCell pr={e.pr_pct ?? 0} mr={e.mr_pct ?? 0} sr={e.sr_pct ?? 0} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Fonogramas ─── */}
          {fonogramas.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 font-semibold uppercase mb-2">Fonogramas</p>
              <div className="space-y-1">
                {fonogramas.map((f: any, i: number) => (
                  <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] px-3 py-1.5 bg-white/[0.015] rounded border border-white/[0.04]">
                    {f.isrc
                      ? <span className="font-mono text-violet-300/70">{f.isrc}</span>
                      : <span className="font-mono text-white/20">sem ISRC</span>
                    }
                    {f.interprete && <span className="text-white/55">{f.interprete}</span>}
                    {f.versao    && <span className="text-white/30 text-[10px]">{f.versao}</span>}
                    {f.ano       && <span className="text-white/30 text-[10px]">{f.ano}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Rodapé ─── */}
          {obra.match_criterio && (
            <p className="text-[10px] text-white/25">
              Match: <span className="text-white/35">{obra.match_criterio}</span>
              {obra.obra_id && <span className="ml-2 font-mono text-white/20">id {obra.obra_id.slice(0, 8)}</span>}
            </p>
          )}

          {showConfirm && obra.match_tipo === 'nova' && (
            <div className="pt-2 border-t border-white/[0.04] text-[10px] text-white/30">
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

  const [integrando, setIntegrando] = useState(false)
  const [integraMsg, setIntegraMsg] = useState('')

  const [populando, setPopulando] = useState(false)
  const [populaMsg, setPopulaMsg] = useState('')

  useEffect(() => { load() }, [id])

  async function integrarCatalogo() {
    setIntegraMsg('')
    setIntegrando(true)
    try {
      const res = await authFetch(`/api/cwr/${id}/integrar`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { setIntegraMsg(d.error ?? 'Erro ao integrar.'); return }
      setIntegraMsg(
        `✓ Integração concluída: ${d.obras_integradas} obras · ` +
        `${d.titulares_criados} titulares criados · ${d.titulares_vinculados} vinculados · ` +
        `${d.participacoes_gravadas} participações · ${d.fonogramas_criados} fonogramas` +
        ` | AM: ${d.obras_sem_am ?? 0} sem AM · ${d.obras_am_definido ?? 0} definido · ${d.obras_am_pendente ?? 0} pendente`
      )
    } catch { setIntegraMsg('Falha na requisição.') }
    finally { setIntegrando(false) }
  }

  async function popularLinks() {
    setPopulaMsg('')
    setPopulando(true)
    try {
      const res = await authFetch(`/api/cwr/${id}/popular-links`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { setPopulaMsg(d.error ?? 'Erro ao popular titulares.'); return }
      setPopulaMsg(`✓ ${d.titulares_criados} titulares gravados em ${d.links_criados} obras.`)
    } catch { setPopulaMsg('Falha na requisição.') }
    finally { setPopulando(false) }
  }

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

  // ── Indicadores AM por obra (computado do snapshot) ───────────────────────
  // Cenário A: sem AM  |  Cenário B/C: AM definido  |  Pendente: AM com pct=0
  const categoriasAm = obras.reduce(
    (acc: { sem_am: number; am_definido: number; am_pendente: number }, o: any) => {
      const eds: any[] = o.snapshot_cwr?.editoras ?? []
      const amEntries = eds.filter((e: any) => {
        const p = (e.tipo ?? e.papel ?? '').toUpperCase().trim()
        return p === 'AM' || p === 'AQ'
      })
      if (amEntries.length === 0) {
        acc.sem_am++
      } else {
        const temPctAm = amEntries.some(
          (e: any) => (Number(e.pr_pct)||0) > 0 || (Number(e.mr_pct)||0) > 0
        )
        if (temPctAm) acc.am_definido++
        else          acc.am_pendente++
      }
      return acc
    },
    { sem_am: 0, am_definido: 0, am_pendente: 0 }
  )
  // Mantém compatibilidade com refs antigas
  const amPendentesCount = categoriasAm.am_pendente

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
            {imp.status === 'confirmado' && (
              <button
                onClick={integrarCatalogo}
                disabled={integrando}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                title="Criar titulares, editoras, participações e fonogramas reais no banco"
              >
                {integrando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                {integrando ? 'Integrando...' : 'Integrar ao Catálogo'}
              </button>
            )}
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
      {integraMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${integraMsg.startsWith('✓') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
          {integraMsg.startsWith('✓') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {integraMsg}
        </div>
      )}
      {populaMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${populaMsg.startsWith('✓') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
          {populaMsg.startsWith('✓') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {populaMsg}
        </div>
      )}
      {/* Indicadores de administradora por obra */}
      {imp.status === 'confirmado' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700">
            <span className="text-xs text-zinc-400">Sem AM</span>
            <span className="text-lg font-bold text-zinc-200">{categoriasAm.sem_am}</span>
            <span className="text-xs text-zinc-500">obras</span>
          </div>
          <div className="flex flex-col items-center justify-center px-3 py-2 bg-emerald-900/20 rounded-lg border border-emerald-700/30">
            <span className="text-xs text-emerald-400">AM definido</span>
            <span className="text-lg font-bold text-emerald-300">{categoriasAm.am_definido}</span>
            <span className="text-xs text-emerald-500">obras</span>
          </div>
          <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border ${categoriasAm.am_pendente > 0 ? 'bg-amber-900/20 border-amber-700/30' : 'bg-zinc-800 border-zinc-700'}`}>
            <span className={`text-xs ${categoriasAm.am_pendente > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>AM pendente</span>
            <span className={`text-lg font-bold ${categoriasAm.am_pendente > 0 ? 'text-amber-300' : 'text-zinc-200'}`}>{categoriasAm.am_pendente}</span>
            <span className={`text-xs ${categoriasAm.am_pendente > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>obras</span>
          </div>
        </div>
      )}

      {confirmaErro && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {confirmaErro}
        </div>
      )}

      {/* Alerta: administradoras com percentual pendente */}
      {imp.status === 'confirmado' && amPendentesCount > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Administradoras com percentual pendente ({amPendentesCount} obras)</p>
            <p className="text-xs text-amber-300/70 mt-0.5">
              Papel AM detectado com todos os percentuais zerados no CWR — padrão para
              administradoras cujo share é definido por contrato, não pelo arquivo NWR.
              Essas participações <strong>não serão criadas na integração</strong>.
              Defina o percentual por regra administrativa após importar.
            </p>
          </div>
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
