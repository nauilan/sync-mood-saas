'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Music, Plus, Upload, Search, ChevronRight, Users,
  AlertCircle, CheckCircle2, Mic2, X, FileCheck2,
  AlignLeft, Link2, Hash, Globe, Calendar, Clock,
  ExternalLink, Edit3, Copy, ChevronDown, ChevronUp,
  Send, Database, Tag, ShieldCheck, ShieldAlert, Loader2,
} from 'lucide-react'
import { MOCK_OBRAS, MOCK_OBRAS_LINKS, MOCK_OBRAS_FONOGRAMAS, KPI_OBRAS } from '@/lib/mock-obras'
import { STORE_KEYS } from '@/lib/store'
import { useSupabaseQuery } from '@/lib/hooks/use-supabase-query'
import { MOCK_EDITORAS } from '@/lib/mock-cadastros'
import { STATUS_OBRA_LABELS, STATUS_OBRA_COLORS, normalizarLinksObra } from '@/lib/types-obras'
import type { StatusObra } from '@/lib/types-obras'

const AVATARES_CORES = [
  'bg-violet-600', 'bg-amber-600', 'bg-emerald-600',
  'bg-sky-600', 'bg-rose-600', 'bg-indigo-600',
]

function AvatarTitular({ nome, idx }: { nome: string; idx: number }) {
  const initials = nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span title={nome}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white ring-2 ring-[#0d1526] -ml-1.5 first:ml-0 ${AVATARES_CORES[idx % AVATARES_CORES.length]}`}>
      {initials}
    </span>
  )
}

function IswcBadge({ iswc }: { iswc?: string | null }) {
  if (iswc) return <span className="text-xs font-mono text-emerald-400">{iswc}</span>
  return <span className="text-xs text-white/25 italic">Pendente</span>
}

function PctBadge({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs tabular-nums text-white/60">{value.toFixed(0)}%</span>
    </div>
  )
}

const BO_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  nao_enviada: { label: 'Não enviada', color: 'text-white/30', icon: <Database className="w-3 h-3" /> },
  enviada:     { label: 'Enviada',     color: 'text-amber-400', icon: <Send className="w-3 h-3" /> },
  song:        { label: 'Song',        color: 'text-sky-400',   icon: <Loader2 className="w-3 h-3" /> },
  work:        { label: 'Work ✓',      color: 'text-emerald-400', icon: <ShieldCheck className="w-3 h-3" /> },
  divergente:  { label: 'Divergente',  color: 'text-amber-500', icon: <ShieldAlert className="w-3 h-3" /> },
  rejeitada:   { label: 'Rejeitada',   color: 'text-rose-400',  icon: <ShieldAlert className="w-3 h-3" /> },
}

function BackOfficeBadge({ status }: { status?: string | null }) {
  const s = status ?? 'nao_enviada'
  const bo = BO_STATUS[s] ?? BO_STATUS.nao_enviada
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${bo.color}`}>
      {bo.icon}{bo.label}
    </span>
  )
}

const STATUS_OPTIONS: { value: StatusObra | ''; label: string }[] = [
  { value: '', label: 'Todos status' },
  { value: 'ativa', label: 'Ativa' },
  { value: 'validada', label: 'Validada' },
  { value: 'pre_cadastro', label: 'Pre-cadastro' },
  { value: 'bloqueada', label: 'Bloqueada' },
  { value: 'divergente', label: 'Divergente' },
]

// ─── Highlight texto da busca ─────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-violet-500/30 text-violet-200 rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

// ─── Drawer de detalhes da obra ──────────────────────────────────────────────
function ObraDrawer({ obra, onClose }: { obra: any; onClose: () => void }) {
  const [tab, setTab] = useState<'info' | 'titulares' | 'fonogramas' | 'letra'>('info')
  const [letraExpanded, setLetraExpanded] = useState(false)
  const links = normalizarLinksObra(obra._links ?? MOCK_OBRAS_LINKS[obra.id] ?? [])
  const fonogramas = MOCK_OBRAS_FONOGRAMAS?.[obra.id] ?? []
  const editora = MOCK_EDITORAS.find(e => e.id === obra.editora_id)
  const editoraNome = editora?.nome_fantasia
    ?? links.flatMap((l: any) => l.titulares ?? [])
        .find((t: any) => ['editora_original', 'administradora'].includes(t.papel))?.nome
    ?? null

  const TABS = [
    { id: 'info',       label: 'Informações',  icon: Hash },
    { id: 'titulares',  label: 'Titulares',    icon: Users },
    { id: 'fonogramas', label: 'Fonogramas',   icon: Mic2 },
    { id: 'letra',      label: 'Letra',        icon: AlignLeft },
  ] as const

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-[#080f1e] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden">

        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <Music className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate">{obra.titulo}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs font-mono text-white/35">{obra.codigo}</span>
              {obra.codigo_interno_legado && obra.codigo_interno_legado !== obra.codigo && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                  <Tag className="w-2.5 h-2.5" />{obra.codigo_interno_legado}
                </span>
              )}
              {obra.iswc && <span className="text-xs font-mono text-emerald-400">{obra.iswc}</span>}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_OBRA_COLORS[obra.status as StatusObra]}`}>
                {STATUS_OBRA_LABELS[obra.status as StatusObra]}
              </span>
              <BackOfficeBadge status={obra.backoffice_status} />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href="/master/obras/nova"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 hover:text-violet-400 transition-colors"
              title="Editar obra">
              <Edit3 className="w-4 h-4" />
            </Link>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 hover:text-white/70 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold transition-colors
                ${tab === t.id ? 'bg-violet-600/20 text-violet-300' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Título', value: obra.titulo },
                  { label: 'Código Sync Mood', value: obra.codigo, mono: true },
                  { label: 'Cód. Legado (CWR)', value: obra.codigo_interno_legado || '—', mono: true },
                  { label: 'Cód. CWR Original', value: obra.codigo_obra_cwr_original || '—', mono: true },
                  { label: 'Título Alternativo', value: obra.titulo_alternativo || '—' },
                  { label: 'Subtítulo', value: obra.subtitulo || '—' },
                  { label: 'Idioma', value: obra.idioma || '—', icon: Globe },
                  { label: 'Gênero', value: obra.genero || '—' },
                  { label: 'Ano de Criação', value: obra.ano_criacao || '—', icon: Calendar },
                  { label: 'Duração', value: obra.duracao || '—', icon: Clock },
                  { label: 'ISWC', value: obra.iswc || 'Pendente', mono: true },
                  { label: 'Editora', value: editora?.nome_fantasia || editoraNome || '—' },
                  { label: 'BackOffice Song ID', value: obra.backoffice_song_id || '—', mono: true },
                  { label: 'BackOffice Work ID', value: obra.backoffice_work_id || '—', mono: true },
                ].map(item => (
                  <div key={item.label} className="bg-white/[0.03] rounded-xl p-3 space-y-0.5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wide">{item.label}</p>
                    <p className={`text-sm text-white/80 font-medium ${item.mono ? 'font-mono' : ''}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/40">Percentual Controlado</p>
                  <span className="text-sm font-bold text-violet-400">{obra._percentual_controlado ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${obra._percentual_controlado ?? 0}%` }} />
                </div>
              </div>
              <div className={`rounded-xl p-4 flex items-center gap-3 ${obra.contrato_file ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.03]'}`}>
                <FileCheck2 className={`w-5 h-5 shrink-0 ${obra.contrato_file ? 'text-emerald-400' : 'text-white/20'}`} />
                <div>
                  <p className={`text-sm font-semibold ${obra.contrato_file ? 'text-emerald-400' : 'text-white/30'}`}>
                    {obra.contrato_file ? obra.contrato_file : 'Sem contrato anexado'}
                  </p>
                  <p className="text-xs text-white/30">{obra.contrato_file ? 'PDF assinado verificado' : 'Necessário para validação'}</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'titulares' && (
            <div className="space-y-3">
              {links.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-white/25">
                  <Users className="w-8 h-8" />
                  <p className="text-sm">Nenhum link cadastrado</p>
                </div>
              )}
              {links.map((link: any, li: number) => (
                <div key={link.id || li} className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="text-xs font-semibold text-white/60">{link.descricao || `Link ${li + 1}`}</span>
                    {link.controlado && (
                      <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                        Controlado {link.percentual_controlado}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {(link.titulares ?? []).map((t: any, ti: number) => (
                      <div key={t.id || ti} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${AVATARES_CORES[ti % AVATARES_CORES.length]}`}>
                          {t.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/80 font-medium truncate">{t.nome}</p>
                          {t.ipi && <p className="text-[10px] font-mono text-white/30">{t.ipi}</p>}
                        </div>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 shrink-0">{t.papel}</span>
                        <span className="text-xs font-bold text-violet-400 tabular-nums shrink-0 w-10 text-right">{t.percentual ?? 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'fonogramas' && (
            <div className="space-y-2">
              {fonogramas.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-white/25">
                  <Mic2 className="w-8 h-8" />
                  <p className="text-sm">Nenhum fonograma cadastrado</p>
                </div>
              )}
              {fonogramas.map((f: any, i: number) => (
                <div key={f.id || i} className="bg-white/[0.03] rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                    <Mic2 className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 font-medium truncate">{f.titulo || f.nome || `Fonograma ${i + 1}`}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {f.isrc && <span className="text-[10px] font-mono text-emerald-400">{f.isrc}</span>}
                      {f.duracao && <span className="text-[10px] text-white/30">{f.duracao}</span>}
                      {f.artista && <span className="text-[10px] text-white/30">{f.artista}</span>}
                    </div>
                  </div>
                  {f.ano && <span className="text-xs text-white/30 shrink-0">{f.ano}</span>}
                </div>
              ))}
            </div>
          )}

          {tab === 'letra' && (
            <div className="space-y-3">
              {obra.letra ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/40">{obra.letra.length} caracteres · {obra.letra.split('\n').length} linhas</p>
                    <button onClick={() => navigator.clipboard?.writeText(obra.letra)}
                      className="flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/40 hover:text-white/70 transition-colors">
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                  </div>
                  <div className={`bg-white/[0.03] rounded-xl p-4 overflow-hidden transition-all ${letraExpanded ? '' : 'max-h-80'}`}>
                    <pre className="text-sm text-white/70 font-mono whitespace-pre-wrap leading-relaxed">{obra.letra}</pre>
                  </div>
                  {obra.letra.split('\n').length > 15 && (
                    <button onClick={() => setLetraExpanded(x => !x)}
                      className="flex items-center gap-1.5 w-full justify-center h-8 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/40 hover:text-white/70 transition-colors">
                      {letraExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Recolher</> : <><ChevronDown className="w-3.5 h-3.5" /> Ver completo</>}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-white/25">
                  <AlignLeft className="w-8 h-8" />
                  <p className="text-sm">Letra não cadastrada</p>
                  <p className="text-xs text-white/20">Disponível após upload do contrato (extração por IA)</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] flex items-center gap-2">
          <button onClick={onClose}
            className="flex-1 h-9 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors">
            Fechar
          </button>
          <Link href="/master/obras/nova"
            className="flex items-center justify-center gap-1.5 flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Editar Obra
          </Link>
        </div>
      </div>
    </>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ObrasPage() {
  const [search, setSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filterStatus, setFilterStatus] = useState<StatusObra | ''>('')
  const [filterEditora, setFilterEditora] = useState('')
  const [filterIswc, setFilterIswc] = useState<'todos' | 'com' | 'sem'>('todos')
  const [filterFono, setFilterFono] = useState<'todos' | 'com' | 'sem'>('todos')
  const [obraAtiva, setObraAtiva] = useState<any>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Carrega obras: Supabase → localStorage → mock
  const { data: obrasData } = useSupabaseQuery<any>({
    table: 'obras',
    storeKey: STORE_KEYS.obras,
    fallback: MOCK_OBRAS,
    orderBy: { column: 'titulo', ascending: true },
  })

  // Catálogo unificado: deduplicado por codigo
  const catalogoCompleto = useMemo(() => {
    const map = new Map<string, any>()
    obrasData.forEach(o => map.set(o.codigo ?? o.codigo_obra ?? o.id, o))
    return Array.from(map.values())
  }, [obrasData])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sugestões de autocomplete (máx 8)
  const suggestions = useMemo(() => {
    if (!search || search.length < 1) return []
    const q = search.toLowerCase()
    return catalogoCompleto.filter(o =>
      o.titulo.toLowerCase().includes(q) || o.codigo.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [search, catalogoCompleto])

  const obras = useMemo(() => {
    return catalogoCompleto.filter(o => {
      if (search && !o.titulo.toLowerCase().includes(search.toLowerCase()) && !o.codigo.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus && o.status !== filterStatus) return false
      if (filterEditora && o.editora_id !== filterEditora) return false
      if (filterIswc === 'com' && !o.iswc) return false
      if (filterIswc === 'sem' && o.iswc) return false
      if (filterFono === 'com' && (o._fonogramas_count ?? 0) === 0) return false
      if (filterFono === 'sem' && (o._fonogramas_count ?? 0) > 0) return false
      return true
    })
  }, [search, filterStatus, filterEditora, filterIswc, filterFono, catalogoCompleto])

  const selectCls = 'h-8 bg-white/5 border border-white/[0.06] rounded-lg px-2.5 text-xs text-white/70 focus:outline-none cursor-pointer'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Obras & Catalogo"
        description="Catalogo musical com estrutura de links de participacao e controle editorial"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/master/obras/importar-cwr"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-sky-600/20 border border-sky-500/40 hover:bg-sky-600/30 text-sm text-sky-300 font-semibold transition-colors">
              <Upload className="w-4 h-4" /> Importar CWR
            </Link>
            <Link href="/master/obras/nova"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Nova Obra
            </Link>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Obras', value: KPI_OBRAS.total, color: 'text-white/80', icon: Music },
          { label: 'Ativas', value: KPI_OBRAS.ativas, color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Pre-cadastro', value: KPI_OBRAS.pre_cadastro, color: 'text-violet-400', icon: AlertCircle },
          { label: 'Sem ISWC', value: KPI_OBRAS.sem_iswc, color: 'text-amber-400', icon: AlertCircle },
          { label: 'Com Fonograma', value: KPI_OBRAS.com_fonograma, color: 'text-sky-400', icon: Mic2 },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <p className="text-[11px] text-white/40">{stat.label}</p>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros + Tabela */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl flex flex-col">

        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">

          {/* Campo de busca com autocomplete */}
          <div ref={searchRef} className="relative flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 bg-white/5 border border-white/[0.06] rounded-lg px-3 h-8">
              <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por título ou código..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
              />
              {search && (
                <button onClick={() => { setSearch(''); setShowSuggestions(false) }}
                  className="text-white/25 hover:text-white/60 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown de sugestões */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0d1526] border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden">
                <div className="px-3 py-1.5 border-b border-white/[0.06]">
                  <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
                    {suggestions.length} sugestão{suggestions.length !== 1 ? 'ões' : ''}
                  </p>
                </div>
                {suggestions.map(obra => {
                  const links = normalizarLinksObra(obra._links ?? MOCK_OBRAS_LINKS[obra.id] ?? [])
                  const autores = links.flatMap((l: any) =>
                    l.titulares?.filter((t: any) => ['compositor', 'autor', 'CA'].includes(t.papel)) ?? []
                  )
                  return (
                    <button
                      key={obra.id}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setSearch(obra.titulo)
                        setShowSuggestions(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-violet-500/10 transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20">
                        <Music className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/80 truncate">
                          <Highlight text={obra.titulo} query={search} />
                        </p>
                        <p className="text-[10px] text-white/35 font-mono">
                          <Highlight text={obra.codigo} query={search} />
                          {autores.length > 0 && (
                            <span className="font-sans ml-2 text-white/25">
                              · {autores.slice(0, 2).map((a: any) => a.nome.split(' ')[0]).join(', ')}
                              {autores.length > 2 && ` +${autores.length - 2}`}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_OBRA_COLORS[obra.status as StatusObra] ?? ''}`}>
                        {STATUS_OBRA_LABELS[obra.status as StatusObra] ?? obra.status}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusObra | '')} className={selectCls}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filterEditora} onChange={e => setFilterEditora(e.target.value)} className={selectCls}>
            <option value="">Todas editoras</option>
            {MOCK_EDITORAS.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia}</option>)}
          </select>
          <select value={filterIswc} onChange={e => setFilterIswc(e.target.value as 'todos' | 'com' | 'sem')} className={selectCls}>
            <option value="todos">ISWC: todos</option>
            <option value="com">Com ISWC</option>
            <option value="sem">Sem ISWC</option>
          </select>
          <select value={filterFono} onChange={e => setFilterFono(e.target.value as 'todos' | 'com' | 'sem')} className={selectCls}>
            <option value="todos">Fonograma: todos</option>
            <option value="com">Com fonograma</option>
            <option value="sem">Sem fonograma</option>
          </select>
          <span className="text-xs text-white/30 ml-auto">{obras.length} obras</span>
        </div>

        {/* Tabela com scroll independente */}
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <table className="w-full text-sm min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-[#0d1526]">
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-semibold text-white/30 px-5 py-3 w-28">Codigo</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Titulo</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Autores</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Editora</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">ISWC</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Status</th>
                <th className="text-center text-xs font-semibold text-white/30 px-4 py-3">Fonogramas</th>
                <th className="text-center text-xs font-semibold text-white/30 px-4 py-3">Ctrl %</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {obras.map(obra => {
                const links = normalizarLinksObra(obra._links ?? MOCK_OBRAS_LINKS[obra.id] ?? [])
                const editora = MOCK_EDITORAS.find(e => e.id === obra.editora_id)
                const editoraNome = editora?.nome_fantasia
                  ?? links.flatMap((l: any) => l.titulares ?? [])
                      .find((t: any) => ['editora_original', 'administradora'].includes(t.papel))?.nome
                  ?? null
                const autores = links.flatMap((l: any) => l.titulares?.filter((t: any) => ['compositor', 'autor', 'CA'].includes(t.papel)) ?? [])
                const isAtiva = obraAtiva?.id === obra.id

                return (
                  <tr
                    key={obra.id}
                    onClick={() => setObraAtiva(isAtiva ? null : obra)}
                    className={`hover:bg-white/[0.03] transition-colors group cursor-pointer
                      ${isAtiva ? 'bg-violet-500/10 border-l-2 border-violet-500' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="text-xs font-mono text-white/40">{obra.codigo}</span>
                        {obra.codigo_interno_legado && obra.codigo_interno_legado !== obra.codigo && (
                          <div className="mt-0.5">
                            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-1 py-0.5 rounded">
                              {obra.codigo_interno_legado}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isAtiva ? 'bg-violet-500/30' : 'bg-violet-500/10'}`}>
                          <Music className={`w-3.5 h-3.5 ${isAtiva ? 'text-violet-300' : 'text-violet-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-white/80 text-sm">{obra.titulo}</p>
                          {obra.genero && <p className="text-[11px] text-white/30">{obra.genero} · {obra.idioma}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center">
                        {autores.slice(0, 4).map((t: any, i: number) => (
                          <AvatarTitular key={t.id} nome={t.nome} idx={i} />
                        ))}
                        {autores.length > 4 && (
                          <span className="ml-1.5 text-[10px] text-white/40">+{autores.length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/50">{editoraNome ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <IswcBadge iswc={obra.iswc} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_OBRA_COLORS[obra.status as StatusObra] ?? ''}`}>
                        {STATUS_OBRA_LABELS[obra.status as StatusObra] ?? obra.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Mic2 className="w-3 h-3 text-white/30" />
                        <span className="text-xs text-white/50">{obra._fonogramas_count ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <PctBadge value={obra._percentual_controlado ?? 0} color="bg-violet-500" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight className={`w-4 h-4 transition-colors ml-auto ${isAtiva ? 'text-violet-400 rotate-90' : 'text-white/20 group-hover:text-violet-400'}`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {obras.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-white/30">
              <Music className="w-8 h-8" />
              <p className="text-sm">Nenhuma obra encontrada</p>
            </div>
          )}
        </div>
      </div>

      {obraAtiva && (
        <ObraDrawer obra={obraAtiva} onClose={() => setObraAtiva(null)} />
      )}
    </div>
  )
}
