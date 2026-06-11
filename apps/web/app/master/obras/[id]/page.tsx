'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Edit, AlignLeft, Mic2, FileText, Link2, Activity, AlertTriangle,
  CheckCircle2, ChevronRight, ExternalLink, Music, Users2, Globe2, DollarSign, Users,
  BookOpen, Loader2, BarChart3, Clock, Plus,
} from 'lucide-react'
import { STATUS_OBRA_LABELS, STATUS_OBRA_COLORS, PAPEL_TITULAR_LABELS, PAPEL_TITULAR_COLORS, normalizarLinksObra, type StatusObra } from '@/lib/types-obras'
import { formatarPercentual } from '@/lib/percentual'
import { authFetch } from '@/lib/supabase/client'
import { fmtBRL, fmtDate } from '@/lib/mock-cc'

const TABS = [
  { id: 'resumo',         label: 'Resumo',              icon: Music },
  { id: 'integrantes',    label: 'Integrantes da Obra',  icon: Users2 },
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

export default function ObraDetailPage({ params }: { params: { id: string } }) {
  const [obra, setObra] = useState<any>(null)
  const [links, setLinks] = useState<any[]>([])
  const [fonogramas, setFonogramas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('resumo')
  const [ativando, setAtivando] = useState(false)

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, obra])

  async function loadCompletude() {
    setCompletudeLdg(true)
    try {
      const res = await authFetch(`/api/obras/${params.id}/completude`)
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
      const res = await authFetch(`/api/obras/${params.id}/historico`)
      if (res.ok) { const d = await res.json(); setHistorico(d.data ?? []) }
    } catch (e) { console.error('[historico]', e) }
    finally { setHistoricoLdg(false) }
  }

  async function loadExportacoes() {
    setExportacoesLdg(true)
    try {
      const res = await authFetch(`/api/exportacoes?obra_id=${params.id}`)
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
      const res = await authFetch(`/api/obras/${params.id}`, {
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

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [obraRes, linksRes, fonoRes] = await Promise.all([
          authFetch(`/api/obras/${params.id}`),
          authFetch(`/api/obras/${params.id}/links`),
          authFetch(`/api/obras/${params.id}/fonogramas`),
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
  }, [params.id])

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
          {obra.codigo_interno_legado && obra.codigo_interno_legado !== (obra.codigo ?? obra.codigo_obra) && (
            <><span className="text-xs text-white/30">|</span>
            <span className="text-[10px] font-mono bg-violet-500/10 text-violet-300 rounded px-1.5 py-0.5"
              title="Código interno legado (CWR/sistema antigo)">
              {obra.codigo_interno_legado}
            </span></>
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
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold text-xs w-12">Link</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-semibold text-xs">Nome</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold text-xs w-28">IPI / Cód.</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold text-xs w-16">Cat.</th>
                    <th className="text-right px-5 py-2.5 text-white/30 font-semibold text-xs w-24">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {links.flatMap((link: any) =>
                    (link.titulares ?? []).map((t: any) => (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-[10px] font-bold text-white">
                            {link.ordem}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${t.controlado ? 'text-white/80' : 'text-white/55'}`}>
                            {t.nome}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-sm text-violet-400/80">
                            {t.ipi || t.cae || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <SiglaBadge papel={t.papel} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-semibold tabular-nums text-sky-300/90 text-sm">
                            {formatarPercentual(t.percentual)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                  {links.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-white/30">
                        Nenhum integrante vinculado.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.08]">
                    <td colSpan={4} className="px-4 py-2 text-right text-xs text-white/25 font-medium">Total</td>
                    <td className="px-5 py-2 text-right font-bold tabular-nums text-xs text-white/50">
                      {formatarPercentual(links.flatMap((l: any) => l.titulares ?? []).reduce((s: number, t: any) => s + t.percentual, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
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
          </div>
          {fonogramas.length === 0 ? (
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
