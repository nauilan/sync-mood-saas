'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  Edit, AlignLeft, Mic2, FileText, Link2, Activity, AlertTriangle,
  CheckCircle2, ChevronRight, ExternalLink, Music, Users2, Globe2, DollarSign, Users,
  BookOpen, Loader2, BarChart3, Clock, Plus, Headphones, X, Save, RefreshCw,
  CheckSquare, Square,
} from 'lucide-react'
import { STATUS_OBRA_LABELS, STATUS_OBRA_COLORS, PAPEL_TITULAR_LABELS, PAPEL_TITULAR_COLORS, normalizarLinksObra, type StatusObra } from '@/lib/types-obras'
import { formatarPercentual } from '@/lib/percentual'
import { authFetch } from '@/lib/supabase/client'
import { fmtBRL, fmtDate } from '@/lib/mock-cc'

const TABS = [
  { id: 'resumo',         label: 'Resumo',              icon: Music },
  { id: 'integrantes',    label: 'Integrantes da Obra',  icon: Users2 },
  { id: 'interpretes',    label: 'Intérpretes',          icon: Headphones },
  { id: 'completude',     label: 'Completude',           icon: BarChart3 },
  { id: 'conta_corrente', label: 'Conta Corrente',       icon: DollarSign },
  { id: 'letra',          label: 'Letra',               icon: AlignLeft },
  { id: 'fonogramas',     label: 'Fonogramas',           icon: Mic2 },
  { id: 'contratos',      label: 'Contratos',            icon: FileText },
  { id: 'exportacoes',    label: 'Exportações',          icon: Activity },
  { id: 'historico',      label: 'Histórico',            icon: Clock },
  { id: 'divergencias',   label: 'Divergências',         icon: AlertTriangle },
]

// Parseia o campo descricao em campos estruturados
function parseDescricao(desc?: string) {
  if (!desc) return null
  const parts = desc.split(' | ')
  const header = parts[0]
  const fields: { label: string; value: string }[] = []
  for (const part of parts.slice(1)) {
    const i = part.indexOf(':')
    if (i > -1) fields.push({ label: part.slice(0, i).trim(), value: part.slice(i + 1).trim() })
  }
  return { header, fields }
}

// Badge de status de catálogo da obra
const STATUS_CATALOGO_CONFIG: Record<string, { label: string; cls: string }> = {
  pre_cadastro:            { label: 'Pré-cadastro',       cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  aguardando_contrato:     { label: 'Ag. Contrato',       cls: 'bg-white/5 text-white/40 border border-white/10' },
  aguardando_validacao_admin: { label: 'Ag. Aprovação',   cls: 'bg-orange-500/15 text-orange-300 border border-orange-500/30' },
  catalogo_ativo:          { label: 'Catálogo Ativo',     cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  pendente_ajuste:         { label: 'Pendente Ajuste',    cls: 'bg-orange-500/15 text-orange-300 border border-orange-500/30' },
  rejeitada:               { label: 'Rejeitada',          cls: 'bg-red-500/15 text-red-300 border border-red-500/30' },
  inativa:                 { label: 'Inativa',            cls: 'bg-white/5 text-white/30 border border-white/10' },
}

function StatusCatalogoBadge({ status }: { status?: string }) {
  if (!status) return null
  const cfg = STATUS_CATALOGO_CONFIG[status] ?? { label: status, cls: 'bg-white/5 text-white/40 border border-white/10' }
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// Siglas de categoria → badge color
const SIGLA_COLOR: Record<string, string> = {
  CA: 'bg-violet-600 text-white',
  E:  'bg-sky-600 text-white',
  SE: 'bg-indigo-600 text-white',
  AM: 'bg-amber-600 text-white',
  V:  'bg-emerald-600 text-white',
  AD: 'bg-rose-600 text-white',
  AR: 'bg-pink-600 text-white',
}

function papelToSigla(papel: string): string {
  const map: Record<string, string> = {
    compositor: 'CA', autor_ca: 'CA', autor: 'CA',
    editora: 'E', editora_original: 'E',
    subeditora: 'SE',
    administradora: 'AM', editora_administradora: 'AM',
    versionista: 'V', adaptador: 'AD', arranjador: 'AR',
  }
  return map[papel] ?? papel.toUpperCase().slice(0, 3)
}

function SiglaBadge({ papel }: { papel: string }) {
  const sigla = papelToSigla(papel)
  const color = SIGLA_COLOR[sigla] ?? 'bg-white/10 text-white/60'
  return (
    <span className={`inline-flex items-center justify-center w-7 h-6 rounded text-[10px] font-bold ${color}`}>
      {sigla}
    </span>
  )
}

function ControleBadge({ pct, label, color }: { pct: number; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-start px-4 py-3 rounded-xl border min-w-[160px] ${color}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-xl font-bold tabular-nums">{formatarPercentual(pct)}</span>
      <div className="w-full h-1 bg-black/20 rounded-full mt-1.5 overflow-hidden">
        <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

export default function ObraDetailPage() {
  const router = useRouter()
  const rawParams = useParams()
  const obraId = rawParams?.id as string
  const [obra, setObra] = useState<any>(null)
  const [links, setLinks] = useState<any[]>([])
  const [fonogramas, setFonogramas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('resumo')
  const [ativando, setAtivando] = useState(false)

  // ── Intérpretes ─────────────────────────────────────────────────────────────
  const [interpretes, setInterpretes] = useState<any[]>([])
  const [interpretesLoading, setInterpretesLdg] = useState(false)
  const [interpretesCarregado, setInterpretesCarregado] = useState(false)
  const [novoInterp, setNovoInterp] = useState({ nome_artistico: '', nome_civil: '', tipo: 'principal' })
  const [interpSaving, setInterpSaving] = useState(false)

  // ── Formulário de novo fonograma ────────────────────────────────────────────
  const [showFonoForm, setShowFonoForm] = useState(false)
  const [novoFono, setNovoFono] = useState({ titulo_fonograma: '', interprete: '', isrc: '', versao: 'original', ano_gravacao: '', gravadora: '' })
  const [fonoSaving, setFonoSaving] = useState(false)
  const [fonoErr, setFonoErr] = useState('')

  // ── Edição inline dos dados editoriais (resumo) ─────────────────────────────
  const [editResumo, setEditResumo] = useState(false)
  const [resumoDraft, setResumoDraft] = useState<Record<string, any>>({})
  const [resumoSaving, setResumoSaving] = useState(false)

  // ── Completude ──────────────────────────────────────────────────────────────
  const [completude, setCompletude] = useState<any>(null)
  const [completudeLoading, setCompletudeLdg] = useState(false)

  // ── Histórico ───────────────────────────────────────────────────────────────
  const [historico, setHistorico] = useState<any[]>([])
  const [historicoLoading, setHistoricoLdg] = useState(false)

  // ── Exportações por obra ────────────────────────────────────────────────────
  const [exportacoesObra, setExportacoesObra] = useState<any[]>([])
  const [exportacoesLdg, setExportacoesLdg] = useState(false)
  const [exportacoesCarregado, setExportacoesCarregado] = useState(false)

  // Lazy loaders por tab
  useEffect(() => {
    if (!obra) return
    if (activeTab === 'completude' && !completude && !completudeLoading) {
      loadCompletude()
    }
    if (activeTab === 'historico' && historico.length === 0 && !historicoLoading) {
      loadHistorico()
    }
    if (activeTab === 'exportacoes' && !exportacoesCarregado && !exportacoesLdg) {
      loadExportacoes()
    }
    if (activeTab === 'interpretes' && !interpretesCarregado && !interpretesLoading) {
      loadInterpretes()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, obra])

  async function loadCompletude() {
    setCompletudeLdg(true)
    try {
      const res = await authFetch(`/api/obras/${obraId}/completude`)
      if (res.ok) {
        const d = await res.json()
        setCompletude(d.data)
        if (d.data?.score !== undefined) setObra((prev: any) => ({ ...prev, completude_score: d.data.score }))
      }
    } catch (e) { console.error('[completude]', e) }
    finally { setCompletudeLdg(false) }
  }

  async function loadHistorico() {
    setHistoricoLdg(true)
    try {
      const res = await authFetch(`/api/obras/${obraId}/historico`)
      if (res.ok) { const d = await res.json(); setHistorico(d.data ?? []) }
    } catch (e) { console.error('[historico]', e) }
    finally { setHistoricoLdg(false) }
  }

  async function loadExportacoes() {
    setExportacoesLdg(true)
    try {
      const res = await authFetch(`/api/exportacoes?obra_id=${obraId}`)
      if (res.ok) { const d = await res.json(); setExportacoesObra(d.data ?? []) }
      setExportacoesCarregado(true)
    } catch (e) { console.error('[exportacoes]', e) }
    finally { setExportacoesLdg(false) }
  }

  // Ativar obra no catálogo (pre_cadastro → catalogo_ativo)
  async function ativarNoCatalogo() {
    if (ativando) return
    const ok = window.confirm('Confirmar ativação da obra no catálogo? Esta ação indica que os dados foram revisados e a obra está pronta para exportação.')
    if (!ok) return
    setAtivando(true)
    try {
      const res = await authFetch(`/api/obras/${obraId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status_catalogo: 'catalogo_ativo' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Erro ao ativar obra')
      setObra((prev: any) => ({ ...prev, status_catalogo: 'catalogo_ativo' }))
    } catch (err) {
      alert('Erro ao ativar obra: ' + String(err))
    } finally {
      setAtivando(false)
    }
  }

  // ── Intérpretes ──────────────────────────────────────────────────────────────
  async function loadInterpretes() {
    setInterpretesLdg(true)
    try {
      const res = await authFetch(`/api/obras/${obraId}/interpretes`)
      if (res.ok) { const d = await res.json(); setInterpretes(d.data ?? []) }
      setInterpretesCarregado(true)
    } catch (e) { console.error('[interpretes]', e) }
    finally { setInterpretesLdg(false) }
  }

  async function addInterprete() {
    if (!novoInterp.nome_artistico.trim() || interpSaving) return
    setInterpSaving(true)
    try {
      const res = await authFetch(`/api/obras/${obraId}/interpretes`, {
        method: 'POST',
        body: JSON.stringify(novoInterp),
      })
      const d = await res.json()
      if (!res.ok) { alert(d.error ?? 'Erro ao adicionar intérprete'); return }
      setInterpretes(prev => [...prev, d.data])
      setNovoInterp({ nome_artistico: '', nome_civil: '', tipo: 'principal' })
    } catch (e) { alert('Erro: ' + String(e)) }
    finally { setInterpSaving(false) }
  }

  async function removeInterprete(iid: string) {
    if (!window.confirm('Remover este intérprete?')) return
    const res = await authFetch(`/api/obras/${obraId}/interpretes?iid=${iid}`, { method: 'DELETE' })
    if (res.ok) setInterpretes(prev => prev.filter((i: any) => i.id !== iid))
    else { const d = await res.json(); alert(d.error ?? 'Erro ao remover') }
  }

  // ── Novo fonograma ───────────────────────────────────────────────────────────
  async function addFonograma() {
    if (fonoSaving) return
    setFonoErr('')
    setFonoSaving(true)
    try {
      const res = await authFetch(`/api/obras/${obraId}/fonogramas`, {
        method: 'POST',
        body: JSON.stringify(novoFono),
      })
      const d = await res.json()
      if (!res.ok) { setFonoErr(d.error ?? 'Erro ao criar fonograma'); return }
      setFonogramas(prev => [...prev, d.data])
      setNovoFono({ titulo_fonograma: '', interprete: '', isrc: '', versao: 'original', ano_gravacao: '', gravadora: '' })
      setShowFonoForm(false)
    } catch (e) { setFonoErr('Erro: ' + String(e)) }
    finally { setFonoSaving(false) }
  }

  async function removeFonograma(fid: string) {
    if (!window.confirm('Remover este fonograma?')) return
    const res = await authFetch(`/api/obras/${obraId}/fonogramas?fid=${fid}`, { method: 'DELETE' })
    if (res.ok) setFonogramas(prev => prev.filter((f: any) => f.id !== fid))
    else { const d = await res.json(); alert(d.error ?? 'Erro ao remover') }
  }

  // ── Salvar dados editoriais (resumo edit) ────────────────────────────────────
  async function saveResumo() {
    if (resumoSaving) return
    setResumoSaving(true)
    try {
      const res = await authFetch(`/api/obras/${obraId}`, {
        method: 'PATCH',
        body: JSON.stringify(resumoDraft),
      })
      const d = await res.json()
      if (!res.ok) { alert(d.error ?? 'Erro ao salvar'); return }
      setObra((prev: any) => ({ ...prev, ...resumoDraft }))
      setEditResumo(false)
      setResumoDraft({})
    } catch (e) { alert('Erro: ' + String(e)) }
    finally { setResumoSaving(false) }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [obraRes, linksRes, fonoRes] = await Promise.all([
          authFetch(`/api/obras/${obraId}`),
          authFetch(`/api/obras/${obraId}/links`),
          authFetch(`/api/obras/${obraId}/fonogramas`),
        ])
        if (obraRes.ok) {
          const d = await obraRes.json()
          setObra(d.data ?? null)
        }
        if (linksRes.ok) {
          const d = await linksRes.json()
          setLinks(normalizarLinksObra(d.data ?? []))
        }
        if (fonoRes.ok) {
          const d = await fonoRes.json()
          setFonogramas(d.data ?? [])
        }
      } catch (e) {
        console.error('[obra/detail]', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [obraId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/30 text-sm">
        Carregando...
      </div>
    )
  }

  if (!obra) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-white/40">
        <Music className="w-10 h-10" />
        <p className="text-sm">Obra nao encontrada</p>
        <Link href="/master/obras" className="text-xs text-violet-400 hover:text-violet-300">
          Voltar para Obras
        </Link>
      </div>
    )
  }

  // Resolve editora a partir dos integrantes (editora_original ou administradora)
  const editoraNome = links
    .flatMap((l: any) => l.titulares ?? [])
    .find((t: any) => ['editora_original', 'administradora'].includes(t.papel))
    ?.nome ?? null

  const PAPEIS_AUTOR_SET = ['autor', 'compositor', 'versionista', 'adaptador']
  const PAPEIS_EDITORA_SET = ['editora_original', 'administradora', 'subeditora']
  const isOwrLink = (titulares: any[]): boolean => {
    const autores = titulares.filter(t => PAPEIS_AUTOR_SET.includes(t.papel ?? ''))
    if (autores.length === 0) return false
    const hasEditora = titulares.some(t =>
      PAPEIS_EDITORA_SET.includes(t.papel ?? '') ||
      ['E', 'AM', 'SE', 'AQ'].includes((t.papel ?? '').toUpperCase())
    )
    return !hasEditora
  }
  const pcControlado = parseFloat(
    links.reduce((total: number, link: any) => {
      const lt = link.titulares ?? []
      if (isOwrLink(lt)) return total
      return total + lt.reduce((s: number, t: any) =>
        s + (t.percentual_exec_publica ?? t.percentual ?? 0), 0)
    }, 0).toFixed(2)
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title={obra.titulo}
        description={`Codigo: ${obra.codigo ?? obra.codigo_obra}${obra.iswc ? '  |  ISWC: ' + obra.iswc : '  |  ISWC: Pendente'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/master/obras" className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors flex items-center">
              Voltar
            </Link>
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors">
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        }
      />

      {/* Status bar */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 space-y-3">

        {/* ── ID INTERNO DA OBRA ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-2 pb-3 border-b border-white/[0.06]">
          <div>
            <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-0.5">ID Interno · SONG_CODE</p>
            <p className="text-base font-mono font-bold text-white tracking-wide">{obra.codigo_obra ?? obra.codigo ?? '—'}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">ISWC</p>
            <p className={`text-sm font-mono font-semibold ${obra.iswc ? 'text-emerald-400' : 'text-amber-400/60'}`}>{obra.iswc ?? 'Pendente'}</p>
          </div>
          {obra.codigo_interno_legado && obra.codigo_interno_legado !== (obra.codigo ?? obra.codigo_obra) && (
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Cód. Legado</p>
              <p className="text-sm font-mono text-violet-300">{obra.codigo_interno_legado}</p>
            </div>
          )}
          {obra.codigo_obra_cwr_original && (
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">Cód. CWR Original</p>
              <p className="text-sm font-mono text-white/50">{obra.codigo_obra_cwr_original}</p>
            </div>
          )}
          {obra.backoffice_song_id && (
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">BackOffice Song ID</p>
              <p className="text-sm font-mono text-sky-300">{obra.backoffice_song_id}</p>
            </div>
          )}
          {obra.backoffice_work_id && (
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">BackOffice Work ID</p>
              <p className="text-sm font-mono text-sky-300">{obra.backoffice_work_id}</p>
            </div>
          )}
        </div>
        {/* ────────────────────────────────────────────────────────────────── */}

        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_OBRA_COLORS[obra.status as StatusObra] ?? 'bg-white/10 text-white/50'}`}>
            {STATUS_OBRA_LABELS[obra.status as StatusObra] ?? obra.status}
          </span>
          {/* Badge de status do catálogo */}
          <StatusCatalogoBadge status={obra.status_catalogo} />
          {obra.genero && <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50">{obra.genero}</span>}
          <span className="text-xs text-white/30">|</span>
          <span className="text-xs text-white/40">{obra.idioma}</span>
          {obra.ano_criacao && <><span className="text-xs text-white/30">|</span><span className="text-xs text-white/40">{obra.ano_criacao}</span></>}
          <span className="text-xs text-white/30">|</span>
          <span className={`text-xs font-semibold ${obra.iswc ? 'text-emerald-400' : 'text-amber-400'}`}>
            ISWC: {obra.iswc ?? 'Pendente'}
          </span>
          {editoraNome && (
            <><span className="text-xs text-white/30">|</span>
            <span className="text-xs text-white/40">Editora: <span className="text-white/60">{editoraNome}</span></span></>
          )}
          {obra.backoffice_status && obra.backoffice_status !== 'nao_enviada' && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              obra.backoffice_status === 'work_ativa' ? 'bg-emerald-500/10 text-emerald-300' :
              obra.backoffice_status === 'song_passiva' ? 'bg-sky-500/10 text-sky-300' :
              obra.backoffice_status === 'rejeitada' ? 'bg-red-500/10 text-red-400' :
              'bg-amber-500/10 text-amber-300'
            }`}>
              BO: {obra.backoffice_status.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <ControleBadge pct={pcControlado} label="Percentual Controlado" color="bg-violet-500/10 border-violet-500/20 text-violet-300" />
          <ControleBadge pct={fonogramas.length > 0 ? 100 : 0} label={`Fonogramas (${fonogramas.length})`} color="bg-sky-500/10 border-sky-500/20 text-sky-300" />
          <ControleBadge pct={0} label="Autorizacoes (0)" color="bg-emerald-500/10 border-emerald-500/20 text-emerald-300" />
        </div>
      </div>

      {/* Bloco de ação: pré-cadastro aguardando ativação */}
      {obra.status_catalogo === 'pre_cadastro' && (
        <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl px-5 py-4 flex items-start gap-4">
          <BookOpen className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">Esta obra está em pré-cadastro</p>
            <p className="text-xs text-amber-300/60 mt-0.5">
              Revise os dados abaixo — participantes, fonogramas, ISWC — e ative quando estiver pronta para o catálogo oficial.
            </p>
          </div>
          <button
            onClick={ativarNoCatalogo}
            disabled={ativando}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs text-white font-semibold transition-colors shrink-0"
          >
            {ativando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {ativando ? 'Ativando...' : 'Ativar no Catálogo'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-white/[0.06] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 h-9 px-4 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
              ${activeTab === tab.id
                ? 'border-violet-500 text-white'
                : 'border-transparent text-white/40 hover:text-white/70'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Resumo */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Dados da Obra</h3>
            {[
              { label: 'Titulo',           value: obra.titulo },
              { label: 'Titulo Original',  value: obra.titulo_original ?? '—' },
              { label: 'Codigo Sync Mood', value: obra.codigo ?? obra.codigo_obra ?? '—' },
              { label: 'Codigo Legado',    value: obra.codigo_interno_legado ?? '—', mono: true },
              { label: 'Codigo CWR Orig.', value: obra.codigo_obra_cwr_original ?? '—', mono: true },
              { label: 'ISWC',             value: obra.iswc ?? 'Pendente SOCINPRO' },
              { label: 'Idioma',           value: obra.idioma ?? '—' },
              { label: 'Genero',           value: obra.genero ?? '—' },
              { label: 'Ano de Criacao',   value: obra.ano_criacao?.toString() ?? '—' },
              { label: 'Duracao',          value: obra.duracao ? `${Math.floor(obra.duracao/60)}:${String(obra.duracao%60).padStart(2,'0')}` : '—' },
              { label: 'Origem',           value: obra.origem_importacao ?? 'manual' },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-xs text-white/35">{f.label}</span>
                <span className={`text-xs text-white/70 font-medium ${(f as {mono?: boolean}).mono ? 'font-mono bg-white/5 px-1.5 py-0.5 rounded' : ''}`}>{f.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Controle & BackOffice</h3>
            {[
              { label: 'Status',               value: STATUS_OBRA_LABELS[obra.status as StatusObra] ?? obra.status },
              { label: 'Editora Responsavel',  value: editoraNome ?? '—' },
              { label: 'Links de Participacao',value: String(links.length) },
              { label: 'Links Controlados',    value: String(links.filter((l: any) => l.controlado).length) },
              { label: '% Controlado',         value: `${pcControlado.toFixed(3)}%` },
              { label: 'Fonogramas',           value: String(fonogramas.length) },
              { label: 'Autorizacoes',         value: '0' },
              { label: 'BackOffice Song ID',   value: obra.backoffice_song_id ?? '—', mono: true },
              { label: 'BackOffice Work ID',   value: obra.backoffice_work_id ?? '—', mono: true },
              { label: 'Status BackOffice',    value: obra.backoffice_status ?? 'nao_enviada' },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-xs text-white/35">{f.label}</span>
                <span className={`text-xs text-white/70 font-medium ${(f as {mono?: boolean}).mono ? 'font-mono bg-white/5 px-1.5 py-0.5 rounded text-[11px]' : ''}`}>{f.value}</span>
              </div>
            ))}
          </div>
          {/* Painel editorial editável */}
          <div className="lg:col-span-2 bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Dados Editoriais</h3>
              {!editResumo ? (
                <button
                  onClick={() => { setEditResumo(true); setResumoDraft({ iswc: obra.iswc ?? '', iswc_anterior: obra.iswc_anterior ?? '', iswc_alternativo: obra.iswc_alternativo ?? '', status_iswc: obra.status_iswc ?? 'pendente', territorio: obra.territorio ?? '', direitos_administrados: obra.direitos_administrados ?? {} }) }}
                  className="inline-flex items-center gap-1.5 h-7 px-3 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/70 rounded-lg transition-colors"
                >
                  <Edit className="w-3 h-3" /> Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={saveResumo}
                    disabled={resumoSaving}
                    className="inline-flex items-center gap-1.5 h-7 px-3 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {resumoSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Salvar
                  </button>
                  <button
                    onClick={() => { setEditResumo(false); setResumoDraft({}) }}
                    className="h-7 px-3 text-xs text-white/40 hover:text-white/60 border border-white/10 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
            <div className="p-5">
              {editResumo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">ISWC Principal</label>
                      <input
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        placeholder="T-000.000.000-0"
                        value={resumoDraft.iswc ?? ''}
                        onChange={e => setResumoDraft(p => ({ ...p, iswc: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">ISWC Anterior</label>
                      <input
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        placeholder="—"
                        value={resumoDraft.iswc_anterior ?? ''}
                        onChange={e => setResumoDraft(p => ({ ...p, iswc_anterior: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Status ISWC</label>
                      <select
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                        value={resumoDraft.status_iswc ?? 'pendente'}
                        onChange={e => setResumoDraft(p => ({ ...p, status_iswc: e.target.value }))}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="aguardando_retorno">Aguardando Retorno</option>
                        <option value="aguardando_registro">Aguardando Registro</option>
                        <option value="recebido">Registrado</option>
                        <option value="conflito_iswc">Conflito de ISWC</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Território</label>
                    <input
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      placeholder="Mundial / Brasil / América Latina..."
                      value={resumoDraft.territorio ?? ''}
                      onChange={e => setResumoDraft(p => ({ ...p, territorio: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Direitos Administrados</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { key: 'execucao_publica', label: 'Execução Pública (PR)' },
                        { key: 'sincronizacao', label: 'Sincronização' },
                        { key: 'fonomecanico', label: 'Fonomecânico (MR)' },
                        { key: 'digital', label: 'Digital' },
                        { key: 'grafico', label: 'Edição Gráfica' },
                        { key: 'internacional', label: 'Internacional' },
                      ].map(d => {
                        const checked = resumoDraft.direitos_administrados?.[d.key] ?? false
                        return (
                          <label key={d.key} className="flex items-center gap-2 cursor-pointer">
                            <button
                              type="button"
                              onClick={() => setResumoDraft(p => ({
                                ...p,
                                direitos_administrados: { ...(p.direitos_administrados ?? {}), [d.key]: !checked }
                              }))}
                              className="text-violet-400 hover:text-violet-300"
                            >
                              {checked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-40" />}
                            </button>
                            <span className="text-xs text-white/60">{d.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                  {[
                    { label: 'ISWC', value: obra.iswc ?? 'Pendente', color: obra.iswc ? 'text-emerald-400 font-mono' : 'text-amber-400' },
                    { label: 'ISWC Anterior', value: obra.iswc_anterior ?? '—', color: 'text-white/55 font-mono' },
                    { label: 'ISWC Alternativo', value: obra.iswc_alternativo ?? '—', color: 'text-white/55 font-mono' },
                    { label: 'Status ISWC', value: obra.status_iswc ?? 'pendente', color: 'text-white/55' },
                    { label: 'Território', value: obra.territorio ?? 'Não definido', color: 'text-white/55' },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-white/30 mb-0.5">{f.label}</p>
                      <p className={f.color}>{f.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {obra.observacoes && (
            <div className="lg:col-span-2 bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-xs font-semibold text-white/50 mb-2">Observacoes</h3>
              <p className="text-sm text-white/60 leading-relaxed">{obra.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Integrantes da Obra */}
      {activeTab === 'integrantes' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs text-white/40">
              {links.length} link{links.length !== 1 ? 's' : ''} · {links.filter((l: any) => l.controlado).length} controlado{links.filter((l: any) =>l.controlado).length!==1?'s':''}
            </span>
            <span className="text-xs text-violet-400 font-semibold ml-auto">{pcControlado.toFixed(2)}% controlado</span>
          </div>

          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-white">Integrantes da Obra</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-center px-3 py-2.5 text-white/30 font-semibold text-xs w-12">Link</th>
                    <th className="text-left px-3 py-2.5 text-white/30 font-semibold text-xs">Nome</th>
                    <th className="text-center px-3 py-2.5 text-white/30 font-semibold text-xs w-16">Cat.</th>
                    <th className="text-center px-3 py-2.5 text-white/30 font-semibold text-xs w-16">Controle</th>
                    <th className="text-right px-3 py-2.5 text-white/30 font-semibold text-xs w-20">PR</th>
                    <th className="text-right px-3 py-2.5 text-white/30 font-semibold text-xs w-20">MR</th>
                    <th className="text-right px-3 py-2.5 text-white/30 font-semibold text-xs w-20">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {links.flatMap((link: any) =>
                    (link.titulares ?? []).map((t: any) => {
                      const sc = t.status_controle ?? ''
                      const scColor = sc === 'controlado' ? 'text-emerald-400' : sc === 'nao_controlado' ? 'text-white/35' : 'text-amber-400'
                      const scLabel = sc === 'controlado' ? 'Controlado' : sc === 'nao_controlado' ? 'Não ctrl.' : sc === 'contrato_pendente' ? 'Pendente' : sc || '—'
                      return (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-[10px] font-bold text-white">
                              {link.numero_link ?? link.ordem ?? '?'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`font-medium ${t.controlado ? 'text-white/80' : 'text-white/55'}`}>
                              {t.nome}
                            </span>
                            {(t.ipi || t.cae) && (
                              <span className="block text-[10px] font-mono text-white/30">{t.ipi || t.cae}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <SiglaBadge papel={t.papel} />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`text-[10px] font-semibold ${scColor}`}>{scLabel}</span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-semibold tabular-nums text-sky-300/90 text-xs">
                              {t.percentual_exec_publica != null ? formatarPercentual(t.percentual_exec_publica) : <span className="text-white/25">—</span>}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-semibold tabular-nums text-violet-300/90 text-xs">
                              {t.percentual_fonomecanico != null ? formatarPercentual(t.percentual_fonomecanico) : <span className="text-white/25">—</span>}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-semibold tabular-nums text-teal-300/70 text-xs">
                              {t.percentual_sincronizacao != null ? formatarPercentual(t.percentual_sincronizacao) : <span className="text-white/25">—</span>}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                  {links.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-white/30">
                        Nenhum integrante vinculado.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.08]">
                    <td colSpan={4} className="px-3 py-2 text-right text-xs text-white/25 font-medium">Total PR / MR / SR</td>
                    <td className="px-3 py-2 text-right text-xs font-bold tabular-nums text-sky-300/70">
                      {formatarPercentual(links.flatMap((l: any) => l.titulares ?? []).reduce((s: number, t: any) => s + (t.percentual_exec_publica ?? 0), 0))}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-bold tabular-nums text-violet-300/70">
                      {formatarPercentual(links.flatMap((l: any) => l.titulares ?? []).reduce((s: number, t: any) => s + (t.percentual_fonomecanico ?? 0), 0))}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-bold tabular-nums text-teal-300/60">
                      {formatarPercentual(links.flatMap((l: any) => l.titulares ?? []).reduce((s: number, t: any) => s + (t.percentual_sincronizacao ?? 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Intérpretes */}
      {activeTab === 'interpretes' && (
        <div className="space-y-4">
          {/* Formulário de adição */}
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Adicionar Intérprete</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                className="col-span-1 sm:col-span-2 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Nome artístico *"
                value={novoInterp.nome_artistico}
                onChange={e => setNovoInterp(p => ({ ...p, nome_artistico: e.target.value }))}
              />
              <input
                className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Nome civil (opcional)"
                value={novoInterp.nome_civil}
                onChange={e => setNovoInterp(p => ({ ...p, nome_civil: e.target.value }))}
              />
              <select
                className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={novoInterp.tipo}
                onChange={e => setNovoInterp(p => ({ ...p, tipo: e.target.value }))}
              >
                <option value="principal">Principal</option>
                <option value="feat">Feat.</option>
                <option value="participacao">Participação</option>
                <option value="grupo">Grupo</option>
                <option value="banda">Banda</option>
                <option value="convidado">Convidado</option>
              </select>
            </div>
            <button
              onClick={addInterprete}
              disabled={!novoInterp.nome_artistico.trim() || interpSaving}
              className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 text-xs bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 rounded-lg transition-colors disabled:opacity-50"
            >
              {interpSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Adicionar
            </button>
          </div>

          {/* Lista de intérpretes */}
          {interpretesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>
          ) : interpretes.length === 0 ? (
            <p className="text-center py-8 text-xs text-white/30">Nenhum intérprete vinculado ainda.</p>
          ) : (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-2.5 text-white/30 font-semibold text-xs">Nome Artístico</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-semibold text-xs">Nome Civil</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold text-xs">Tipo</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold text-xs">Titular</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {interpretes.map((i: any) => (
                    <tr key={i.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-white/80">{i.nome_artistico}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">{i.nome_civil || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 uppercase">
                          {i.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-white/40">
                        {i.titulares?.nome_completo ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => removeInterprete(i.id)} className="text-rose-400/50 hover:text-rose-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Letra */}
      {activeTab === 'letra' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Letra da Obra</h3>
          {obra?.letra ? (
            <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
              {obra.letra}
            </pre>
          ) : (
            <div className="text-white/40 text-sm italic py-8 text-center">
              Letra não cadastrada para esta obra.
            </div>
          )}
        </div>
      )}

      {/* Tab: Fonogramas */}
      {activeTab === 'fonogramas' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Fonogramas ({fonogramas.length})</h3>
            <button
              onClick={() => setShowFonoForm(f => !f)}
              className="ml-auto inline-flex items-center gap-1.5 h-7 px-3 text-xs bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" /> Novo Fonograma
            </button>
          </div>

          {/* Formulário de novo fonograma */}
          {showFonoForm && (
            <div className="px-5 pb-4">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Novo Fonograma</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    className="sm:col-span-2 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Título do fonograma"
                    value={novoFono.titulo_fonograma}
                    onChange={e => setNovoFono(p => ({ ...p, titulo_fonograma: e.target.value }))}
                  />
                  <select
                    className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={novoFono.versao}
                    onChange={e => setNovoFono(p => ({ ...p, versao: e.target.value }))}
                  >
                    <option value="original">Original</option>
                    <option value="ao_vivo">Ao Vivo</option>
                    <option value="remix">Remix</option>
                    <option value="acustico">Acústico</option>
                    <option value="outro">Outro</option>
                  </select>
                  <input
                    className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Intérprete"
                    value={novoFono.interprete}
                    onChange={e => setNovoFono(p => ({ ...p, interprete: e.target.value }))}
                  />
                  <input
                    className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="ISRC (ex: BRSM12500001)"
                    value={novoFono.isrc}
                    onChange={e => setNovoFono(p => ({ ...p, isrc: e.target.value.toUpperCase() }))}
                  />
                  <input
                    className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Gravadora"
                    value={novoFono.gravadora}
                    onChange={e => setNovoFono(p => ({ ...p, gravadora: e.target.value }))}
                  />
                  <input
                    className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Ano de gravação"
                    type="number"
                    min="1900"
                    max="2099"
                    value={novoFono.ano_gravacao}
                    onChange={e => setNovoFono(p => ({ ...p, ano_gravacao: e.target.value }))}
                  />
                </div>
                {fonoErr && <p className="text-xs text-rose-400">{fonoErr}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={addFonograma}
                    disabled={fonoSaving}
                    className="inline-flex items-center gap-1.5 h-8 px-4 text-xs bg-violet-600/25 hover:bg-violet-600/35 border border-violet-500/30 text-violet-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {fonoSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Salvar Fonograma
                  </button>
                  <button
                    onClick={() => { setShowFonoForm(false); setFonoErr('') }}
                    className="h-8 px-3 text-xs text-white/40 hover:text-white/60 border border-white/10 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {fonogramas.length === 0 && !showFonoForm ? (
            <div className="py-8 text-center text-xs text-white/30">Nenhum fonograma cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-5 py-2.5 text-white/30 font-semibold">Título Fonograma</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-semibold">Intérprete</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold">ISRC</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Versão</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Ano</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {fonogramas.map((f: any) => (
                    <tr key={f.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-medium text-white/70">{f.titulo_fonograma || '—'}</td>
                      <td className="px-4 py-3 text-white/55">
                        {f.interprete
                          ? <span className="bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded-full text-[11px] font-medium">{f.interprete}</span>
                          : <span className="text-white/25 italic">Não informado</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {f.isrc
                          ? <span className="font-mono text-violet-300/80 text-[11px] bg-violet-500/10 px-2 py-0.5 rounded">{f.isrc}</span>
                          : <span className="text-amber-400/60 italic">Pendente</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-white/40">{f.versao ?? '—'}</td>
                      <td className="px-4 py-3 text-center text-white/40">{f.ano_gravacao ?? f.data_lancamento?.substring(0, 4) ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => removeFonograma(f.id)} className="text-rose-400/40 hover:text-rose-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Contratos */}
      {activeTab === 'contratos' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Contratos Vinculados</h3>
          {obra.contrato_origem_id ? (
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <div>
                <p className="text-sm text-white/70 font-medium">Contrato de Origem</p>
                <p className="text-xs font-mono text-white/40">{obra.contrato_origem_id}</p>
              </div>
              <Link href={`/master/contratos/${obra.contrato_origem_id}`}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                Ver <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-white/30">Nenhum contrato vinculado.</div>
          )}
        </div>
      )}

      {/* Tab: Completude */}
      {activeTab === 'completude' && (
        <div className="space-y-4">
          {completudeLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-white/30 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Calculando completude...
            </div>
          ) : completude ? (
            <>
              {/* Card score */}
              <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-violet-400" /> Completude Editorial
                  </h3>
                  <span className={`text-2xl font-bold tabular-nums ${completude.score === 100 ? 'text-emerald-400' : completude.score >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {completude.score}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all ${completude.score === 100 ? 'bg-emerald-500' : completude.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${completude.score}%` }}
                  />
                </div>
                <p className="text-xs text-white/30 mb-4">{completude.checks_ok} de {completude.total_checks} verificações aprovadas</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['cwr', 'socinpro', 'backoffice'] as const).map(d => (
                    <div key={d} className={`p-3 rounded-lg border ${completude.por_destino[d].ok ? 'border-emerald-500/20 bg-emerald-500/[0.05]' : 'border-rose-500/20 bg-rose-500/[0.05]'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {completude.por_destino[d].ok
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                        <span className="text-xs font-semibold text-white/70 uppercase">{d === 'backoffice' ? 'BackOffice' : d.toUpperCase()}</span>
                      </div>
                      <p className="text-[11px] text-white/40">
                        {completude.por_destino[d].ok ? 'Pronto' : `${completude.por_destino[d].pendencias.length} pendência${completude.por_destino[d].pendencias.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pendências */}
              {completude.pendencias.length > 0 && (
                <div className="bg-[#0d1526] border border-rose-500/20 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-rose-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {completude.pendencias.length} Pendência{completude.pendencias.length !== 1 ? 's' : ''} para Resolver
                  </h4>
                  <div className="space-y-2">
                    {completude.pendencias.map((p: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 bg-rose-500/[0.04] rounded-lg border border-rose-500/10">
                        <span className="text-rose-400/60 text-[10px] font-mono mt-0.5 shrink-0 w-28 truncate">{p.campo}</span>
                        <span className="text-xs text-white/60 flex-1">{p.mensagem}</span>
                        <div className="flex gap-1 shrink-0">
                          {p.destinos.map((d: string) => (
                            <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 font-semibold uppercase">{d}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completude.score === 100 && (
                <div className="bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-300">Obra completa</p>
                  <p className="text-xs text-emerald-400/60 mt-1">Todos os campos obrigatórios preenchidos. Obra pronta para exportação.</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-10 text-center">
              <BarChart3 className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/30">Completude não calculada ainda.</p>
              <button onClick={loadCompletude} className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Calcular agora
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Exportacoes (wired) */}
      {activeTab === 'exportacoes' && (
        <div className="space-y-4">

          {/* Preparação BackOffice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* SWI File */}
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-semibold text-white">SWI File</h3>
                  <p className="text-[11px] text-white/30 mt-0.5">Song Work Information — BackOffice</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold tracking-wide">PLANEJADO</span>
              </div>
              <div className="px-5 py-4 space-y-0 text-xs">
                {([
                  { campo: 'SONG_CODE', fonte: 'codigo_obra',               valor: obra?.codigo_obra ?? '—' },
                  { campo: 'TITLE',     fonte: 'titulo',                     valor: obra?.titulo ?? '—' },
                  { campo: 'ISWC',      fonte: 'iswc',                       valor: obra?.iswc ?? 'Pendente' },
                  { campo: 'TERRITORY', fonte: 'territorio',                  valor: obra?.territorio ?? 'Não definido' },
                  { campo: 'AUTHORS',   fonte: 'obras_links_titulares (CA/C/A)',
                    valor: `${links.flatMap((l: any) => l.titulares ?? []).filter((t: any) => ['CA','C','A','V','AD'].includes((t.funcao_no_link ?? t.papel ?? '').toUpperCase())).length} autor(es)` },
                  { campo: 'PUBLISHERS',fonte: 'obras_links_titulares (E/AM)',
                    valor: `${links.flatMap((l: any) => l.titulares ?? []).filter((t: any) => ['E','AM','SE'].includes((t.funcao_no_link ?? t.papel ?? '').toUpperCase())).length} editora(s)` },
                ] as {campo: string; fonte: string; valor: string}[]).map(r => (
                  <div key={r.campo} className="flex items-center gap-2 py-2 border-b border-white/[0.03] last:border-0">
                    <span className="font-mono text-sky-300 w-28 shrink-0">{r.campo}</span>
                    <span className="text-white/20 shrink-0 text-[10px]">←</span>
                    <span className="text-white/35 flex-1 truncate">{r.fonte}</span>
                    <span className="font-mono text-white/65 text-right shrink-0 max-w-[140px] truncate">{r.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ISRC File */}
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-semibold text-white">ISRC File</h3>
                  <p className="text-[11px] text-white/30 mt-0.5">International Standard Recording Code — BackOffice</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold tracking-wide">PLANEJADO</span>
              </div>
              <div className="px-5 py-4 text-xs">
                {fonogramas.length === 0 ? (
                  <p className="text-white/30 py-4 text-center">Nenhum fonograma cadastrado. Adicione na aba Fonogramas.</p>
                ) : (
                  <div className="space-y-0">
                    {fonogramas.slice(0, 6).map((f: any) => (
                      <div key={f.id} className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0">
                        <span className={`font-mono shrink-0 ${f.isrc ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {f.isrc ?? 'ISRC pendente'}
                        </span>
                        <span className="text-white/45 flex-1 truncate">{f.titulo_fonograma ?? f.interprete ?? '—'}</span>
                        <span className="text-white/25 shrink-0 text-[11px]">{f.versao ?? 'original'}</span>
                      </div>
                    ))}
                    {fonogramas.length > 6 && (
                      <p className="text-white/25 text-center pt-2">+ {fonogramas.length - 6} fonograma(s)</p>
                    )}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-white/30">SONG_CODE</span>
                  <span className="font-mono text-sky-300">{obra?.codigo_obra ?? '—'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Nota de mapeamento */}
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl px-5 py-3">
            <p className="text-[11px] text-white/30 leading-relaxed">
              <span className="text-white/50 font-semibold">Código interno da obra</span> ({obra?.codigo_obra ?? '—'}) é o SONG_CODE principal do Sync Mood e será usado em exportações BackOffice, arquivos ISRC, retornos de pagamentos e conciliação.
              Campos mantidos separados: <span className="font-mono text-white/45">ISWC</span> · <span className="font-mono text-white/45">Código Legado ({obra?.codigo_interno_legado ?? '—'})</span> · <span className="font-mono text-white/45">Código CWR ({obra?.codigo_obra_cwr_original ?? '—'})</span> · <span className="font-mono text-white/45">BackOffice Song ID ({obra?.backoffice_song_id ?? '—'})</span> · <span className="font-mono text-white/45">BackOffice Work ID ({obra?.backoffice_work_id ?? '—'})</span>.
            </p>
          </div>

          {/* Histórico de Exportações */}
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Histórico de Exportações</h3>
              <a href="/master/exportacoes" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Ver todas <ChevronRight className="inline w-3 h-3" />
              </a>
            </div>
            {exportacoesLdg ? (
              <div className="flex items-center justify-center py-8 gap-2 text-white/30 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando...
              </div>
            ) : exportacoesObra.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/30">Nenhuma exportação registrada para esta obra.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left px-5 py-2.5 text-white/30 font-semibold">Exportação</th>
                      <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Destino</th>
                      <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Formato</th>
                      <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Status Obra</th>
                      <th className="text-right px-5 py-2.5 text-white/30 font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {exportacoesObra.map((e: any) => (
                      <tr key={e.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3">
                          <a href={`/master/exportacoes/${e.exportacao_id}`} className="font-mono text-violet-400 hover:text-violet-300">
                            {e.codigo ?? e.exportacao_id?.slice(0, 8)}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase">{e.destino ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-white/40">{e.formato ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            e.status_obra === 'aceita' ? 'bg-emerald-500/10 text-emerald-400' :
                            e.status_obra === 'rejeitada' ? 'bg-rose-500/10 text-rose-400' :
                            'bg-white/5 text-white/40'
                          }`}>{e.status_obra ?? 'incluída'}</span>
                        </td>
                        <td className="px-5 py-3 text-right text-white/30">
                          {e.criado_em ? new Date(e.criado_em).toLocaleDateString('pt-BR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Historico */}
      {activeTab === 'historico' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" /> Histórico de Alterações
            </h3>
            <span className="text-xs text-white/30">{historico.length} registro{historico.length !== 1 ? 's' : ''}</span>
          </div>
          {historicoLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-white/30 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando...
            </div>
          ) : historico.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/30">Nenhuma alteração registrada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-5 py-2.5 text-white/30 font-semibold">Campo</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-semibold">Anterior</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-semibold">Novo</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Origem</th>
                    <th className="text-right px-5 py-2.5 text-white/30 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {historico.map((h: any) => (
                    <tr key={h.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <span className="font-mono text-[11px] text-violet-300/70 bg-violet-500/10 px-1.5 py-0.5 rounded">{h.campo}</span>
                      </td>
                      <td className="px-4 py-3 text-white/35 max-w-[180px] truncate">{h.valor_anterior ?? '—'}</td>
                      <td className="px-4 py-3 text-white/70 max-w-[180px] truncate font-medium">{h.valor_novo ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${h.origem === 'sistema' ? 'bg-sky-500/10 text-sky-400' : 'bg-white/[0.04] text-white/30'}`}>
                          {h.origem}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-white/30 tabular-nums whitespace-nowrap">
                        {h.created_at ? new Date(h.created_at).toLocaleString('pt-BR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Conta Corrente */}
      {activeTab === 'conta_corrente' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-10 text-center text-white/30 text-sm">
          Nenhum recebimento distribuído para esta obra ainda.
        </div>
      )}

      {/* Tab: Divergencias */}
      {activeTab === 'divergencias' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Divergencias</h3>
          <div className="py-8 text-center text-xs text-white/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
            Nenhuma divergencia aberta.
          </div>
        </div>
      )}
    </div>
  )
}
