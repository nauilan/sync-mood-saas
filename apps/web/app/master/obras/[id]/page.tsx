'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  Edit, AlignLeft, Mic2, FileText, Link2, Activity, AlertTriangle,
  CheckCircle2, ChevronRight, ExternalLink, Music, Users2, Globe2, DollarSign, Users,
  BookOpen, Loader2, BarChart3, Clock, Plus, Headphones, X, Save, RefreshCw,
  CheckSquare, Square, Zap, Shield, Trash2,
} from 'lucide-react'
import { STATUS_OBRA_LABELS, STATUS_OBRA_COLORS, PAPEL_TITULAR_LABELS, PAPEL_TITULAR_COLORS, normalizarLinksObra, type StatusObra } from '@/lib/types-obras'
import { formatarPercentual } from '@/lib/percentual'
import { authFetch } from '@/lib/supabase/client'
import { fmtBRL, fmtDate } from '@/lib/mock-cc'
import { DeleteObraModal } from '@/components/ui/delete-obra-modal'

const TABS = [
  { id: 'resumo',         label: 'Resumo',              icon: Music },
  { id: 'integrantes',    label: 'Integrantes da Obra',  icon: Users2 },
  { id: 'interpretes',    label: 'Intérpretes',          icon: Headphones },
  { id: 'completude',     label: 'Completude',           icon: BarChart3 },
  { id: 'conta_corrente', label: 'Conta Corrente',       icon: DollarSign },
  { id: 'letra',          label: 'Letra',               icon: AlignLeft },
  { id: 'fonogramas',     label: 'Fonogramas',           icon: Mic2 },
  { id: 'contratos',      label: 'Contratos',            icon: FileText },
  { id: 'backoffice',     label: 'BackOffice',           icon: Zap },
  { id: 'exportacoes',    label: 'Exportações',          icon: Activity },
  { id: 'historico',      label: 'Histórico',            icon: Clock },
  { id: 'divergencias',   label: 'Divergências',         icon: AlertTriangle },
]

// BackOffice status config
const BO_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  nao_enviada:       { label: 'Não enviada',       cls: 'bg-white/8 text-white/45' },
  pronta_para_envio: { label: 'Pronta p/ envio',   cls: 'bg-sky-500/15 text-sky-400' },
  enviada:           { label: 'Enviada',            cls: 'bg-violet-500/15 text-violet-400' },
  processando:       { label: 'Processando',        cls: 'bg-amber-500/15 text-amber-400' },
  aceita:            { label: 'Aceita',             cls: 'bg-emerald-500/15 text-emerald-400' },
  aceita_com_alerta: { label: 'Aceita c/ alerta',  cls: 'bg-yellow-500/15 text-yellow-400' },
  rejeitada:         { label: 'Rejeitada',          cls: 'bg-red-500/20 text-red-400' },
  pendente_correcao: { label: 'Pendente correção',  cls: 'bg-orange-500/15 text-orange-400' },
  em_conflito:       { label: 'Em conflito',        cls: 'bg-red-500/25 text-red-300' },
  baixada:           { label: 'Baixada',            cls: 'bg-white/6 text-white/30' },
  substituida:       { label: 'Substituída',        cls: 'bg-white/6 text-white/25' },
}

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

// Tipos de direito por território para a tabela de integrantes
const BR_TIPOS_DIREITO = [
  { key: 'pct_repr_grafica',          label: 'Rep. Gráfica' },
  { key: 'pct_repr_fonomecanica',     label: 'Fono.' },
  { key: 'pct_inclusao_audiovisual',  label: 'Audiovisual' },
  { key: 'pct_inclusao_publicitaria', label: 'Publicidade' },
  { key: 'pct_distribuicao_meios',    label: 'Digital' },
  { key: 'pct_inclusao_base_dados',   label: 'Base Dados' },
  { key: 'pct_comunicacao_publico',   label: 'Com. Público' },
  { key: 'pct_autorizacoes_onus',     label: 'Aut. Ônus' },
]
const EXT_TIPOS_DIREITO = [
  { key: 'pct_ext_repr_grafica',          label: 'Rep. Gráfica' },
  { key: 'pct_ext_repr_fonomecanica',     label: 'Fono.' },
  { key: 'pct_ext_inclusao_audiovisual',  label: 'Audiovisual' },
  { key: 'pct_ext_inclusao_publicitaria', label: 'Publicidade' },
  { key: 'pct_ext_distribuicao_meios',    label: 'Digital' },
  { key: 'pct_ext_inclusao_base_dados',   label: 'Base Dados' },
  { key: 'pct_ext_comunicacao_publico',   label: 'Com. Público' },
]

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

function TabContratos({ obraId, statusContrato, motivoRecontracao }: {
  obraId: string
  statusContrato?: string
  motivoRecontracao?: string
}) {
  const [contratos, setContratos] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const [extrairLetra, setExtrairLetra] = React.useState(true)
  const [letraExtraida, setLetraExtraida] = React.useState<string | null>(null)
  const [letraEditada, setLetraEditada] = React.useState('')
  const [arquivo, setArquivo] = React.useState<File | null>(null)
  const [msg, setMsg] = React.useState<{tipo: 'ok'|'erro', texto: string} | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const authFetchLocal = (url: string, opts?: RequestInit) => {
    const raw = document.cookie.split(';').map(c => c.trim())
    const chunks: string[] = []
    for (const c of raw) {
      const m = c.match(/^sb-[^-]+-auth-token\.(\d+)=(.*)$/)
      if (m) { chunks[parseInt(m[1])] = m[2]; continue }
      const m2 = c.match(/^sb-[^-]+-auth-token=(.*)$/)
      if (m2 && !c.match(/\.\d+=/)) chunks[0] = m2[1]
    }
    const joined = chunks.filter(Boolean).join('')
    let token = ''
    try { token = JSON.parse(decodeURIComponent(joined))?.access_token ?? '' } catch { try { token = JSON.parse(joined)?.access_token ?? '' } catch { /**/ } }
    return fetch(url, { ...opts, headers: { ...(opts?.headers ?? {}), Authorization: `Bearer ${token}` } })
  }

  React.useEffect(() => {
    authFetchLocal(`/api/obras/${obraId}/contrato-manual`)
      .then(r => r.json())
      .then(d => setContratos(d.data ?? []))
      .finally(() => setLoading(false))
  }, [obraId])

  async function handleUpload() {
    if (!arquivo) return
    setUploading(true)
    setMsg(null)
    const fd = new FormData()
    fd.append('arquivo', arquivo)
    fd.append('extrair_letra', String(extrairLetra))
    fd.append('substituir_vigente', 'false')
    try {
      const r = await authFetchLocal(`/api/obras/${obraId}/contrato-manual`, { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { setMsg({ tipo: 'erro', texto: d.error ?? 'Erro no upload' }); return }
      setMsg({ tipo: 'ok', texto: d.mensagem ?? 'Contrato salvo com sucesso!' })
      if (d.letra_extraida) { setLetraExtraida(d.letra_extraida); setLetraEditada(d.letra_extraida) }
      setArquivo(null)
      // Recarregar lista
      authFetchLocal(`/api/obras/${obraId}/contrato-manual`).then(r => r.json()).then(d => setContratos(d.data ?? []))
    } finally {
      setUploading(false)
    }
  }

  const precisaContrato = ['sem_contrato','recontratacao_pendente'].includes(statusContrato ?? '')

  return (
    <div className="space-y-6">
      {/* Status atual */}
      {motivoRecontracao && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
          <strong>Motivo da recontratação:</strong> {motivoRecontracao}
        </div>
      )}

      {/* Lista de contratos */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 mb-3">Contratos Vinculados</h3>
        {loading ? (
          <p className="text-white/30 text-sm">Carregando...</p>
        ) : contratos.length === 0 ? (
          <p className="text-white/30 text-sm">Nenhum contrato manual anexado.</p>
        ) : (
          <div className="space-y-2">
            {contratos.map((c: any) => (
              <div key={c.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{c.arquivo_nome ?? 'Contrato'}</p>
                  <p className="text-white/40 text-xs mt-0.5">{c.tipo} · {new Date(c.criado_em).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.vigente ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">VIGENTE</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/40">SUBSTITUÍDO</span>
                  )}
                  {c.arquivo_url && (
                    <a href={c.arquivo_url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-colors">
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload novo contrato */}
      {precisaContrato && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Anexar Contrato Manual</h3>
          <div
            className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 transition-colors mb-4"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setArquivo(f) }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
              onChange={e => setArquivo(e.target.files?.[0] ?? null)} />
            {arquivo ? (
              <p className="text-white/70 text-sm font-medium">{arquivo.name}</p>
            ) : (
              <p className="text-white/30 text-sm">Arraste o PDF/DOCX do contrato ou clique para selecionar</p>
            )}
          </div>

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={extrairLetra} onChange={e => setExtrairLetra(e.target.checked)}
              className="w-4 h-4 rounded accent-violet-500" />
            <span className="text-sm text-white/60">Extrair texto poético (letra) do contrato via IA</span>
          </label>

          {msg && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${msg.tipo === 'ok' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
              {msg.texto}
            </div>
          )}

          <button onClick={handleUpload} disabled={!arquivo || uploading}
            className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold text-sm disabled:opacity-40 hover:bg-violet-500 transition-colors">
            {uploading ? 'Enviando...' : 'Salvar Contrato'}
          </button>
        </div>
      )}

      {/* Letra extraída para revisão */}
      {letraExtraida && (
        <div className="bg-white/[0.02] border border-violet-500/20 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-violet-300 mb-2">Texto Poético Extraído — Revise antes de salvar</h3>
          <textarea
            value={letraEditada}
            onChange={e => setLetraEditada(e.target.value)}
            rows={10}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white/80 text-sm font-mono resize-y focus:outline-none focus:border-violet-500/50"
          />
          <button
            onClick={async () => {
              await authFetchLocal(`/api/obras/${obraId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ letra: letraEditada }),
              })
              setLetraExtraida(null)
              setMsg({ tipo: 'ok', texto: 'Letra salva na obra com sucesso!' })
            }}
            className="mt-3 px-4 py-2 rounded-lg bg-violet-600 text-white font-bold text-sm hover:bg-violet-500 transition-colors"
          >
            Usar como letra da obra
          </button>
        </div>
      )}
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
  const [showDelete, setShowDelete] = useState(false)

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
  // BackOffice edit state
  const [boEdit,    setBoEdit]    = useState(false)
  const [boDraft,   setBoDraft]   = useState<Record<string,string>>({})
  const [boSaving,  setBoSaving]  = useState(false)

  // ── Modal de recontratação ───────────────────────────────────────────────────
  const [modalRecontratacao, setModalRecontratacao] = React.useState<{campos: string[]} | null>(null)

  // ── Modo Analítico/Sintético (aba Integrantes) ───────────────────────────────
  const [modoAnalitico, setModoAnalitico] = useState(false)
  const [analiticoRows, setAnaliticoRows] = useState<any[]>([])
  const [analiticoLoading, setAnaliticoLoading] = useState(false)
  const [analiticoErro, setAnaliticoErro] = useState('')
  const [negocios, setNegocios] = useState<any[]>([])
  const [calcPctLoading, setCalcPctLoading] = useState<Record<string, boolean>>({})

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
  const [saneamento, setSaneamento] = useState<any>(null)
  const [saneamentoLoading, setSaneamentoLdg] = useState(false)
  const [saneamentoSaving, setSaneamentoSaving] = useState(false)
  const [saneamentoMsg, setSaneamentoMsg] = useState('')

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
    if (activeTab === 'saneamento' && !saneamento && !saneamentoLoading) {
      loadSaneamento()
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

  async function loadSaneamento() {
    setSaneamentoLdg(true)
    setSaneamentoMsg('')
    try {
      const res = await authFetch(`/api/obras/${obraId}/saneamento`)
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error ?? 'Erro ao carregar saneamento')
      setSaneamento(d.data ?? null)
      if (d.data?.integridade?.status) {
        setObra((prev: any) => ({ ...prev, status_integridade: d.data.integridade.status }))
      }
    } catch (e) {
      setSaneamentoMsg(String(e))
    } finally {
      setSaneamentoLdg(false)
    }
  }

  async function salvarSaneamentoLink(linkId: string, patch: Record<string, any>) {
    setSaneamentoSaving(true)
    setSaneamentoMsg('')
    try {
      const res = await authFetch(`/api/obras/${obraId}/saneamento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: linkId, ...patch }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error ?? 'Erro ao salvar saneamento')
      setSaneamento(d.data ?? null)
      if (d.data?.integridade?.status) {
        setObra((prev: any) => ({ ...prev, status_integridade: d.data.integridade.status }))
      }
      setSaneamentoMsg('Saneamento salvo com sucesso.')
    } catch (e) {
      setSaneamentoMsg(String(e))
    } finally {
      setSaneamentoSaving(false)
    }
  }

  async function calcularDireitos(linkId: string) {
    setCalcPctLoading(prev => ({ ...prev, [linkId]: true }))
    try {
      const res = await authFetch(`/api/obras/${obraId}/links/calcular-pct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: linkId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error ?? 'Erro ao calcular tipos de direito')
        return
      }
      // Refresh links após cálculo
      const linksRes = await authFetch(`/api/obras/${obraId}/links`)
      if (linksRes.ok) {
        const d = await linksRes.json()
        setLinks(normalizarLinksObra(d.data ?? []))
      }
    } catch (e) {
      console.error('[calcularDireitos]', e)
      alert('Erro inesperado ao calcular tipos de direito')
    } finally {
      setCalcPctLoading(prev => ({ ...prev, [linkId]: false }))
    }
  }

  async function loadAnalitico(recalcular = false) {
    if (analiticoLoading) return
    setAnaliticoLoading(true)
    setAnaliticoErro('')
    try {
      if (recalcular) {
        const calc = await authFetch(`/api/obras/${obraId}/analitico`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ territorios: ['BR', 'EXT'] }),
        })
        const calcJson = await calc.json().catch(() => ({}))
        if (!calc.ok) throw new Error(calcJson.error ?? 'Erro ao calcular Analítico')
      }

      const res = await authFetch(`/api/obras/${obraId}/analitico`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar Analítico')
      setAnaliticoRows(data.data ?? [])
    } catch (e) {
      setAnaliticoErro(String(e))
    } finally {
      setAnaliticoLoading(false)
    }
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
        body: JSON.stringify({ status: 'ativa', status_catalogo: 'catalogo_ativo' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Erro ao ativar obra')
      setObra((prev: any) => ({ ...prev, status: 'ativa', status_catalogo: 'catalogo_ativo' }))
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
      console.info('[obra-patch-debug][frontend][before]', {
        obraId,
        draftKeys: Object.keys(resumoDraft),
        subtitulo: resumoDraft.subtitulo ?? null,
        titulo: resumoDraft.titulo ?? null,
        titulo_alternativo: resumoDraft.titulo_alternativo ?? null,
      })
      const res = await authFetch(`/api/obras/${obraId}`, {
        method: 'PATCH',
        body: JSON.stringify(resumoDraft),
      })
      const d = await res.json()
      console.info('[obra-patch-debug][frontend][after]', {
        obraId,
        ok: res.ok,
        status: res.status,
        error: d.error ?? null,
        responseSubtitulo: d.data?.subtitulo ?? null,
        responseUpdatedAt: d.data?.updated_at ?? null,
      })
      if (!res.ok) { alert(d.error ?? 'Erro ao salvar'); return }
      setObra((prev: any) => ({ ...prev, ...resumoDraft }))
      setEditResumo(false)
      setResumoDraft({})
      if (d.recontratacao_exigida) {
        setModalRecontratacao({ campos: d.data?.motivo_recontracao?.split(': ')[1]?.split(', ') ?? [] })
      }
    } catch (e) { alert('Erro: ' + String(e)) }
    finally { setResumoSaving(false) }
  }

  // ── Salvar campos BackOffice ─────────────────────────────────────────────────
  async function saveBoFields() {
    if (boSaving || !Object.keys(boDraft).length) return
    setBoSaving(true)
    try {
      const res = await authFetch(`/api/obras/${obraId}`, {
        method: 'PATCH',
        body: JSON.stringify(boDraft),
      })
      const d = await res.json()
      if (!res.ok) { alert(d.error ?? 'Erro ao salvar'); return }
      setObra((prev: any) => ({ ...prev, ...boDraft }))
      setBoEdit(false)
      setBoDraft({})
    } catch (e) { alert('Erro: ' + String(e)) }
    finally { setBoSaving(false) }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // ── Caminho crítico: obra + links (bloqueia o render) ──────────────
        const obraRes = await authFetch(`/api/obras/${obraId}?include=links`)
        if (obraRes.ok) {
          const d = await obraRes.json()
          setObra(d.data ?? null)
          setLinks(normalizarLinksObra(d.data?.links ?? []))
        }
      } catch (e) {
        console.error('[obra/detail]', e)
      } finally {
        // Libera o render ASSIM QUE a obra chega — não espera os outros fetches
        setLoading(false)
      }

      // ── Background: fonogramas + negócios + intérpretes em paralelo ──────
      // Não bloqueiam o render — a página já está visível
      Promise.all([
        authFetch(`/api/obras/${obraId}/fonogramas`),
        authFetch('/api/negocios-editoriais?status=ativo&limit=500'),
        authFetch(`/api/obras/${obraId}/interpretes`),
      ]).then(async ([fonoRes, negociosRes, interpRes]) => {
        if (fonoRes.ok)     { const d = await fonoRes.json();     setFonogramas(d.data ?? []) }
        if (negociosRes.ok) { const d = await negociosRes.json(); setNegocios(d.negocios ?? []) }
        if (interpRes.ok)   { const d = await interpRes.json();   setInterpretes(d.data ?? []); setInterpretesCarregado(true) }
      }).catch(e => console.error('[obra/detail/bg]', e))
    }
    load()
  }, [obraId])

  // ── Memoize: computações sobre `links` rodam APENAS quando links mudam ──────
  const PAPEIS_AUTOR_SET  = ['autor', 'compositor', 'versionista', 'adaptador']
  const PAPEIS_EDITORA_SET = ['editora_original', 'administradora', 'subeditora']

  const editoraNome = useMemo(() =>
    links
      .flatMap((l: any) => l.titulares ?? [])
      .find((t: any) => ['editora_original', 'administradora'].includes(t.papel))
      ?.nome ?? null
  , [links])

  const pcControlado = useMemo(() => {
    const isOwrLink = (titulares: any[]): boolean => {
      const autores = titulares.filter(t => PAPEIS_AUTOR_SET.includes(t.papel ?? ''))
      if (autores.length === 0) return false
      return !titulares.some(t =>
        PAPEIS_EDITORA_SET.includes(t.papel ?? '') ||
        ['E', 'AM', 'SE', 'AQ'].includes((t.papel ?? '').toUpperCase())
      )
    }
    return parseFloat(
      links.reduce((total: number, link: any) => {
        const lt = link.titulares ?? []
        if (isOwrLink(lt)) return total
        return total + lt.reduce((s: number, t: any) =>
          s + (t.percentual_exec_publica ?? t.percentual ?? 0), 0)
      }, 0).toFixed(2)
    )
  }, [links])

  const getAnaliticoPct = (t: any, linkId: string, codigoDireito: string, territorio = 'BR'): number | null => {
    const fn = (t.funcao_no_link ?? '').toUpperCase()
    const papel = (t.papel ?? '').toLowerCase()
    const tipoEsperado =
      ['CA', 'A', 'C', 'PA', 'ES'].includes(fn) || ['autor', 'compositor', 'versionista', 'adaptador'].includes(papel)
        ? 'autor'
        : (['AM', 'SA'].includes(fn) || papel === 'administradora')
          ? 'editora_administradora'
          : (['E', 'SE'].includes(fn) || papel === 'editora_original' || papel === 'subeditora')
            ? 'editora_administrada'
            : null

    if (!tipoEsperado) return null

    const row = analiticoRows.find((r: any) =>
      r.obra_link_id === linkId &&
      r.territorio === territorio &&
      r.tipos_direito?.codigo === codigoDireito &&
      r.tipo_participante_codigo === tipoEsperado &&
      (
        (t.titular_id && r.titular_id === t.titular_id) ||
        (t.editora_id && r.editora_id === t.editora_id) ||
        r.nome_participante === t.nome
      )
    )

    return row ? Number(row.percentual_sobre_obra ?? 0) : null
  }

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

  return (
    <div className="space-y-5">

      {/* Modal de exclusão com 2 etapas */}
      {showDelete && obra && (
        <DeleteObraModal
          obra={{
            id: obraId,
            titulo: obra.titulo,
            contrato_origem_id: obra.contrato_origem_id ?? null,
            contrato_numero:    obra.contrato_numero ?? null,
            contrato_obras_count: obra.contrato_obras_count ?? null,
          }}
          onClose={() => setShowDelete(false)}
        />
      )}

      <PageHeader
        title={obra.titulo}
        description={`Codigo: ${obra.codigo ?? obra.codigo_obra}${obra.iswc ? '  |  ISWC: ' + obra.iswc : '  |  ISWC: Pendente'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/master/obras" className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors flex items-center">
              Voltar
            </Link>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 font-semibold transition-colors"
              title="Apagar obra"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
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
          {/* Badge de status contratual */}
          {obra.status_contrato === 'sem_contrato' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20">
              SEM CONTRATO
            </span>
          )}
          {obra.status_contrato === 'recontratacao_pendente' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">
              RECONTRATAÇÃO PENDENTE
            </span>
          )}
          {obra.status_contrato === 'contrato_manual' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20">
              CONTRATO MANUAL
            </span>
          )}
          {(obra.status_contrato === 'contrato_sistema' || obra.status_contrato === 'valido') && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
              CONTRATO VÁLIDO
            </span>
          )}
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
            onClick={() => React.startTransition(() => setActiveTab(tab.id))}
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
                    <select
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                      value={resumoDraft.territorio ?? ''}
                      onChange={e => setResumoDraft(p => ({ ...p, territorio: e.target.value }))}
                    >
                      <option value="">— Selecionar —</option>
                      <option value="BR">BR — Brasil</option>
                      <option value="2WL">2WL — Mundo (World)</option>
                    </select>
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
                    { label: 'Território', value: obra.territorio === 'BR' ? 'BR — Brasil' : obra.territorio === '2WL' ? '2WL — Mundo' : obra.territorio ?? 'Não definido', color: 'text-white/55' },
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
            <span className="text-xs text-violet-400 font-semibold">{pcControlado.toFixed(2)}% controlado</span>
            <Link
              href={`/master/obras/${obraId}/execucao-publica`}
              className="ml-auto flex items-center gap-1 text-xs text-white/40 hover:text-violet-400 transition-colors border border-white/[0.08] hover:border-violet-500/30 rounded-lg px-2.5 py-1"
            >
              <Activity className="w-3 h-3" />
              Execução Pública
            </Link>
          </div>

          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Integrantes da Obra</h3>
              <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-lg p-0.5">
                <button
                  onClick={() => setModoAnalitico(false)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${!modoAnalitico ? 'bg-violet-600 text-white shadow' : 'text-white/40 hover:text-white/70'}`}
                >Sintético</button>
                <button
                  onClick={() => { setModoAnalitico(true); loadAnalitico(true) }}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${modoAnalitico ? 'bg-violet-600 text-white shadow' : 'text-white/40 hover:text-white/70'}`}
                >Analítico</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-center px-3 py-2.5 text-white/30 font-semibold text-xs w-12">Link</th>
                    <th className="text-left px-3 py-2.5 text-white/30 font-semibold text-xs">Nome</th>
                    <th className="text-left px-3 py-2.5 text-white/30 font-semibold text-xs w-24">ID / Código</th>
                    <th className="text-center px-3 py-2.5 text-white/30 font-semibold text-xs w-16">Cat.</th>
                    <th className="text-center px-3 py-2.5 text-white/30 font-semibold text-xs w-16">Controle</th>
                    <th className="text-right px-3 py-2.5 text-white/30 font-semibold text-xs w-20">PR</th>
                    <th className="text-right px-3 py-2.5 text-white/30 font-semibold text-xs w-20">{modoAnalitico ? '% Ecôn.' : 'MR'}</th>
                    <th className="text-right px-3 py-2.5 text-white/30 font-semibold text-xs w-20">{modoAnalitico ? '% Ecôn.' : 'SR'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(() => {
                    // ── Renderização por link: um CA por link com sua E e AM ──
                    // Sintético MR/SR: total do link exibido na linha do AM (ou E se sem AM)
                    // Analítico MR/SR: ratio de cada participante dentro do link
                    //   CA% = CA.PR / linkTotalPR  (ex: 18,75/25 = 75%)
                    //   E%  = E.PR  / linkTotalPR  (ex: 5/25    = 20%)
                    //   AM% = AM.PR / linkTotalPR  (ex: 1,25/25 = 5%)
                    //   OWR: — (não participa de distribuição editorial)
                    return links.flatMap((link: any) => {
                      const titulares = link.titulares ?? []

                      // Contexto editorial DESTE link (funcao_no_link OU papel como fallback)
                      const xIsAM2 = (x: any) => {
                        const fn = (x.funcao_no_link ?? '').toUpperCase()
                        const p  = (x.papel ?? '').toLowerCase()
                        return ['AM','SA'].includes(fn) || p === 'administradora'
                      }
                      const xIsE2 = (x: any) => {
                        const fn = (x.funcao_no_link ?? '').toUpperCase()
                        const p  = (x.papel ?? '').toLowerCase()
                        return ['E','SE'].includes(fn) || p === 'editora_original' || p === 'subeditora'
                      }
                      const hasAM = titulares.some(xIsAM2)

                      // Totais PR/MR/SR do link
                      const linkTotalPR = titulares.reduce((s: number, x: any) => s + (x.percentual_exec_publica  ?? 0), 0)
                      const linkTotalMR = titulares.reduce((s: number, x: any) => s + (x.percentual_fonomecanico  ?? 0), 0)
                      const linkTotalSR = titulares.reduce((s: number, x: any) => s + (x.percentual_sincronizacao ?? 0), 0)
                      // Sintético outros direitos = TOTAL PR do link (AM absorve tudo; E absorve se sem AM)
                      const sinteticoMR = linkTotalPR
                      const sinteticoSR = linkTotalPR

                      return titulares.map((t: any) => {
                        const sc = t.status_controle ?? ''
                        const fn = (t.funcao_no_link ?? '').toUpperCase()
                        const scColor = sc === 'controlado' ? 'text-emerald-400' : sc === 'nao_controlado' ? 'text-white/35' : 'text-amber-400'
                        const scLabel = sc === 'controlado' ? 'Controlado' : sc === 'nao_controlado' ? 'Não ctrl.' : sc === 'contrato_pendente' ? 'Pendente' : sc || '—'

                        const isE   = xIsE2(t)
                        const isAM  = xIsAM2(t)
                        const isOWR = fn === 'OWR' || (t.papel ?? '').toLowerCase() === 'owr'

                        let mr_display: number | null = null
                        let sr_display: number | null = null

                        if (modoAnalitico) {
                          mr_display = !isOWR ? getAnaliticoPct(t, link.id, 'repr_fonomecanica', 'BR') : null
                          sr_display = !isOWR ? getAnaliticoPct(t, link.id, 'inclusao_audiovisual', 'BR') : null
                        } else {
                          // Sintético outros direitos: total do link na linha do AM ou E
                          if (isAM) {
                            mr_display = sinteticoMR
                            sr_display = sinteticoSR
                          } else if (isE && !hasAM) {
                            mr_display = sinteticoMR
                            sr_display = sinteticoSR
                          }
                          // CA, OWR, E-quando-há-AM: null (exibido como —)
                        }

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
                            <td className="px-3 py-3">
                              {t.codigo_interno
                                ? <span className="text-[11px] font-mono text-amber-400/70">{t.codigo_interno}</span>
                                : <span className="text-white/20">—</span>
                              }
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
                                {mr_display != null ? formatarPercentual(mr_display) : <span className="text-white/25">—</span>}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="font-semibold tabular-nums text-teal-300/70 text-xs">
                                {sr_display != null ? formatarPercentual(sr_display) : <span className="text-white/25">—</span>}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    })
                  })()}
                  {links.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-xs text-white/30">
                        Nenhum integrante vinculado.
                      </td>
                    </tr>
                  )}
                  {modoAnalitico && analiticoLoading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 text-center text-xs text-violet-300">
                        Calculando Analítico...
                      </td>
                    </tr>
                  )}
                  {modoAnalitico && analiticoErro && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 text-center text-xs text-red-300">
                        {analiticoErro}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.08]">
                    <td colSpan={4} className="px-3 py-2 text-right text-xs text-white/25 font-medium">
                      {modoAnalitico ? '% por link (anal.)' : 'Total PR / MR / SR'}</td>
                    <td className="px-3 py-2 text-right text-xs font-bold tabular-nums text-sky-300/70">
                      {formatarPercentual(links.flatMap((l: any) => l.titulares ?? []).reduce((s: number, t: any) => s + (t.percentual_exec_publica ?? 0), 0))}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-bold tabular-nums text-violet-300/70">
                      {modoAnalitico
                        ? <span className="text-white/25 font-normal">100% × {links.length}</span>
                        : formatarPercentual(links.flatMap((l: any) => l.titulares ?? []).reduce((s: number, t: any) => s + (t.percentual_fonomecanico ?? 0), 0))}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-bold tabular-nums text-teal-300/60">
                      {modoAnalitico
                        ? <span className="text-white/25 font-normal">100% × {links.length}</span>
                        : formatarPercentual(links.flatMap((l: any) => l.titulares ?? []).reduce((s: number, t: any) => s + (t.percentual_sincronizacao ?? 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── Tipos de Direitos por Link ── */}
          {links.length > 0 && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Tipos de Direitos</h3>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {modoAnalitico ? 'Analítico — ratio de cada participante no link' : 'Sintético — controle econômico por tipo jurídico'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className="text-[10px] text-white/25 shrink-0">Calcular do contrato:</span>
                  {links.map((link: any) => (
                    <button
                      key={link.id ?? link.numero_link}
                      onClick={() => link.id && calcularDireitos(link.id)}
                      disabled={!link.id || !!calcPctLoading[link.id]}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-violet-600/20 text-violet-300 hover:bg-violet-600/35 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {calcPctLoading[link.id] ? '…' : `Lk ${link.numero_link} ⟳`}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── BRASIL ─── */}
              <div className="overflow-x-auto">
                <div className="px-5 py-2 bg-emerald-950/20">
                  <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest">Brasil</span>
                </div>
                <table className="w-full text-xs min-w-[900px]">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-center px-2 py-2 text-white/25 font-semibold w-9">Lk</th>
                      <th className="text-left px-3 py-2 text-white/25 font-semibold min-w-[140px]">Nome</th>
                      {BR_TIPOS_DIREITO.map(c => (
                        <th key={c.key} className="text-right px-2 py-2 text-white/25 font-semibold whitespace-nowrap">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {links.flatMap((link: any) => {
                      const tits = link.titulares ?? []
                      const hasAM = tits.some((x: any) => ['AM','SA'].includes((x.funcao_no_link ?? '').toUpperCase()))
                      const lPR = tits.reduce((s: number, x: any) => s + (x.percentual_exec_publica ?? 0), 0)
                      const lMR = tits.reduce((s: number, x: any) => s + (x.percentual_fonomecanico ?? 0), 0)
                      const mrFall = lMR > 0 ? lMR : lPR
                      const cTot: Record<string, number> = {}
                      for (const c of BR_TIPOS_DIREITO) cTot[c.key] = tits.reduce((s: number, x: any) => s + (x[c.key] ?? 0), 0)
                      return tits.map((t: any) => {
                        const fn = (t.funcao_no_link ?? '').toUpperCase()
                        const isAM  = fn === 'AM' || fn === 'SA'
                        const isE   = fn === 'E'  || fn === 'SE'
                        const isOWR = fn === 'OWR'
                        return (
                          <tr key={t.id + '_br'} className="hover:bg-white/[0.02]">
                            <td className="px-2 py-2.5 text-center">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-600/60 text-[9px] font-bold text-white">
                                {link.numero_link ?? '?'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={t.controlado ? 'text-white/75 font-medium' : 'text-white/40'}>{t.nome}</span>
                            </td>
                            {BR_TIPOS_DIREITO.map(c => {
                              const ct = cTot[c.key]
                              let v: number | null = null
                              if (!isOWR) {
                                if (modoAnalitico) {
                                  const base = ct > 0 ? ct : lPR
                                  const raw  = ct > 0 ? (t[c.key] ?? 0) : (t.percentual_exec_publica ?? 0)
                                  const direito = c.key.replace(/^pct_/, '')
                                  v = getAnaliticoPct(t, link.id, direito, 'BR')
                                } else {
                                  if (isAM || (isE && !hasAM)) v = ct > 0 ? ct : mrFall
                                }
                              }
                              return (
                                <td key={c.key} className="px-2 py-2.5 text-right">
                                  <span className={v != null ? 'tabular-nums font-semibold text-emerald-300/80' : 'text-white/20'}>
                                    {v != null ? formatarPercentual(v) : '—'}
                                  </span>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })
                    })}
                  </tbody>
                </table>
              </div>

              {/* ─── EXTERIOR ─── */}
              <div className="overflow-x-auto border-t border-white/[0.05]">
                <div className="px-5 py-2 bg-sky-950/20">
                  <span className="text-[10px] font-bold text-sky-400/70 uppercase tracking-widest">Exterior</span>
                  {modoAnalitico && (
                    <span className="ml-2 text-[10px] text-white/25">autor ≥ 50% das quantias líquidas remetidas</span>
                  )}
                </div>
                <table className="w-full text-xs min-w-[840px]">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-center px-2 py-2 text-white/25 font-semibold w-9">Lk</th>
                      <th className="text-left px-3 py-2 text-white/25 font-semibold min-w-[140px]">Nome</th>
                      {EXT_TIPOS_DIREITO.map(c => (
                        <th key={c.key} className="text-right px-2 py-2 text-white/25 font-semibold whitespace-nowrap">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {links.flatMap((link: any) => {
                      const tits = link.titulares ?? []
                      const hasAM = tits.some((x: any) => ['AM','SA'].includes((x.funcao_no_link ?? '').toUpperCase()))
                      const lPR = tits.reduce((s: number, x: any) => s + (x.percentual_exec_publica ?? 0), 0)
                      const lSR = tits.reduce((s: number, x: any) => s + (x.percentual_sincronizacao ?? 0), 0)
                      const srFall = lSR > 0 ? lSR : lPR
                      const cTot: Record<string, number> = {}
                      for (const c of EXT_TIPOS_DIREITO) cTot[c.key] = tits.reduce((s: number, x: any) => s + (x[c.key] ?? 0), 0)
                      return tits.map((t: any) => {
                        const fn = (t.funcao_no_link ?? '').toUpperCase()
                        const isAM  = fn === 'AM' || fn === 'SA'
                        const isE   = fn === 'E'  || fn === 'SE'
                        const isOWR = fn === 'OWR'
                        return (
                          <tr key={t.id + '_ext'} className="hover:bg-white/[0.02]">
                            <td className="px-2 py-2.5 text-center">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-700/60 text-[9px] font-bold text-white">
                                {link.numero_link ?? '?'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={t.controlado ? 'text-white/75 font-medium' : 'text-white/40'}>{t.nome}</span>
                            </td>
                            {EXT_TIPOS_DIREITO.map(c => {
                              const ct = cTot[c.key]
                              let v: number | null = null
                              if (!isOWR) {
                                if (modoAnalitico) {
                                  const base = ct > 0 ? ct : lPR
                                  const raw  = ct > 0 ? (t[c.key] ?? 0) : (t.percentual_exec_publica ?? 0)
                                  const direito = c.key.replace(/^pct_ext_/, '')
                                  v = getAnaliticoPct(t, link.id, direito, 'EXT')
                                } else {
                                  if (isAM || (isE && !hasAM)) v = ct > 0 ? ct : srFall
                                }
                              }
                              return (
                                <td key={c.key} className="px-2 py-2.5 text-right">
                                  <span className={v != null ? 'tabular-nums font-semibold text-sky-300/70' : 'text-white/20'}>
                                    {v != null ? formatarPercentual(v) : '—'}
                                  </span>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-5 py-2.5 text-white/30 font-semibold">Gravação</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Versão</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold">Ano</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {fonogramas.map((f: any) => {
                    const interpretesStr = interpretes.length > 0
                      ? interpretes.map((i: any) => i.nome_artistico).filter(Boolean).join(', ')
                      : null
                    return (
                      <tr key={f.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {f.isrc
                              ? <span className="font-mono text-violet-300/80 text-[11px] bg-violet-500/10 px-2 py-0.5 rounded">{f.isrc}</span>
                              : <span className="text-amber-400/60 italic text-[11px]">ISRC pendente</span>}
                            {interpretesStr && (
                              <>
                                <span className="text-white/20">—</span>
                                <span className="text-white/55">{interpretesStr}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-white/40">{f.versao ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-white/40">{f.ano_gravacao ?? f.data_lancamento?.substring(0, 4) ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => removeFonograma(f.id)} className="text-rose-400/40 hover:text-rose-400 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Contratos */}
      {activeTab === 'contratos' && (
        <TabContratos obraId={obra.id} statusContrato={obra.status_contrato} motivoRecontracao={obra.motivo_recontracao} />
      )}

      {/* Tab: Saneamento */}
      {activeTab === 'saneamento' && (
        <div className="space-y-4">
          {saneamentoLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-white/30 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando saneamento...
            </div>
          ) : saneamento ? (
            <>
              <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-violet-400" /> Saneamento Editorial
                    </h3>
                    <p className="text-xs text-white/35 mt-1">
                      Status atual: <span className="text-white/70 font-semibold">{saneamento.integridade?.status ?? 'não calculado'}</span>
                    </p>
                  </div>
                  <button
                    onClick={loadSaneamento}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/60 hover:text-white/80 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Recarregar
                  </button>
                </div>

                {saneamentoMsg && (
                  <div className={`text-xs rounded-lg px-3 py-2 border ${saneamentoMsg.includes('sucesso') ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'}`}>
                    {saneamentoMsg}
                  </div>
                )}

                {(saneamento.acoes_sugeridas ?? []).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Ações sugeridas</h4>
                    {(saneamento.acoes_sugeridas ?? []).map((acao: any, idx: number) => (
                      <div key={idx} className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2">
                        <p className="text-[11px] text-amber-300 font-semibold">{acao.codigo}</p>
                        <p className="text-xs text-white/65">{acao.acao}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {(saneamento.links ?? []).map((link: any) => {
                  const titularControlado = (link.titulares ?? []).find((t: any) => t.controlado || t.status_controle === 'controlado') ?? (link.titulares ?? [])[0]
                  const payload = {
                    data_contrato: titularControlado?.data_contrato ?? '',
                    tipo_contrato: titularControlado?.tipo_contrato ?? '',
                    territorio_contrato: titularControlado?.territorio_contrato ?? '',
                    prazo_contrato: titularControlado?.prazo_contrato ?? '',
                    percentual_controle_brasil: titularControlado?.percentual_controle_brasil ?? titularControlado?.percentual_exec_publica ?? '',
                    percentual_controle_exterior: titularControlado?.percentual_controle_exterior ?? titularControlado?.percentual_exec_publica ?? '',
                    editora_original_id: titularControlado?.editora_original_id ?? '',
                    editora_administradora_id: titularControlado?.editora_administradora_id ?? '',
                    referencia_documental: titularControlado?.referencia_documental ?? '',
                    observacao_validacao: titularControlado?.observacao_validacao ?? '',
                  }

                  return (
                    <div key={link.id} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-white">Link {link.numero_link ?? '?'}</h4>
                          <p className="text-xs text-white/35">
                            {link.link_ok ? 'Link apto editorialmente' : 'Link com pendências editoriais'}
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${link.link_ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                          {link.link_ok ? 'OK' : 'Pendente'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-wider">Data contrato</label>
                          <input defaultValue={payload.data_contrato} onChange={e => (payload.data_contrato = e.target.value)} type="date" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-wider">Tipo contrato</label>
                          <input defaultValue={payload.tipo_contrato} onChange={e => (payload.tipo_contrato = e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-wider">Território</label>
                          <input defaultValue={payload.territorio_contrato} onChange={e => (payload.territorio_contrato = e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-wider">Prazo</label>
                          <input defaultValue={payload.prazo_contrato} onChange={e => (payload.prazo_contrato = e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-wider">% Controle BR</label>
                          <input defaultValue={payload.percentual_controle_brasil} onChange={e => (payload.percentual_controle_brasil = e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-wider">% Controle EX</label>
                          <input defaultValue={payload.percentual_controle_exterior} onChange={e => (payload.percentual_controle_exterior = e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-wider">Editora original ID</label>
                          <input defaultValue={payload.editora_original_id} onChange={e => (payload.editora_original_id = e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-wider">AM ID</label>
                          <input defaultValue={payload.editora_administradora_id} onChange={e => (payload.editora_administradora_id = e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white font-mono" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-wider">Referência documental</label>
                          <input defaultValue={payload.referencia_documental} onChange={e => (payload.referencia_documental = e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/35 mb-1 uppercase tracking-wider">Observação</label>
                          <input defaultValue={payload.observacao_validacao} onChange={e => (payload.observacao_validacao = e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => salvarSaneamentoLink(link.id, payload)}
                          disabled={saneamentoSaving}
                          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors"
                        >
                          {saneamentoSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {saneamentoSaving ? 'Salvando...' : 'Salvar saneamento'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-10 text-center">
              <Shield className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/30">Saneamento editorial ainda não carregado.</p>
              <button onClick={loadSaneamento} className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Carregar saneamento
              </button>
            </div>
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

      {/* ── TAB: BACKOFFICE ─────────────────────────────────────────────────── */}
      {activeTab === 'backoffice' && (() => {
        // ── Dados derivados ─────────────────────────────────────────────────
        const allTit  = links.flatMap((l: any) => l.titulares ?? [])
        const autores = allTit.filter((t: any) => ['CA','C','A','V','AD'].includes((t.funcao_no_link ?? '').toUpperCase()))
        const edits   = allTit.filter((t: any) => (t.funcao_no_link ?? '').toUpperCase() === 'E')
        const adms    = allTit.filter((t: any) => (t.funcao_no_link ?? '').toUpperCase() === 'AM')
        const ctrl    = allTit.some((t: any) => t.status_controle === 'controlado')
        // COPYRIGHT_SHARE deve fechar 100% considerando TODOS os participantes (autores + E + AM)
        const sumPR   = allTit.reduce((s: number, t: any) => s + Number(t.percentual_exec_publica || 0), 0)
        const adm0    = adms[0]
        const stCfg   = BO_STATUS_CFG[obra?.backoffice_status ?? 'nao_enviada'] ?? BO_STATUS_CFG.nao_enviada

        type SI = 'pronto'|'pendente'|'erro'|'alerta'|'info'
        const icon = (s: SI) => {
          if (s === 'pronto')  return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          if (s === 'erro')    return <span className="w-3.5 h-3.5 text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0">✗</span>
          if (s === 'alerta')  return <span className="w-3.5 h-3.5 text-amber-400 text-[11px] flex items-center justify-center shrink-0">⚠</span>
          if (s === 'info')    return <span className="w-3.5 h-3.5 text-sky-400 text-[11px] flex items-center justify-center shrink-0">ℹ</span>
          return <span className="w-3.5 h-3.5 text-white/30 text-[11px] flex items-center justify-center shrink-0">○</span>
        }

        // ── SWI Checklist ───────────────────────────────────────────────────
        const swiItems: { label: string; desc: string; status: SI; valor: string }[] = [
          { label: 'SONG_CODE',            desc: 'ID Interno · obrigatório · imutável',                 status: obra?.codigo_obra ? 'pronto' : 'erro',     valor: obra?.codigo_obra ?? '—' },
          { label: 'SONG_TITLE',           desc: 'Título da obra — obrigatório',                        status: obra?.titulo ? 'pronto' : 'pendente',       valor: obra?.titulo ?? '' },
          { label: 'WRITER (≥1)',          desc: 'Autores cadastrados (CA/C/A/V/AD)',                   status: autores.length > 0 ? 'pronto' : 'pendente', valor: `${autores.length} autor(es)` },
          { label: 'COPYRIGHT_SHARE=100%', desc: 'Soma PR de todos os participantes (autores + E + AM)', status: allTit.length === 0 ? 'pendente' : Math.abs(sumPR-100)<0.1 ? 'pronto' : 'erro', valor: `${sumPR.toFixed(2)}%` },
          { label: 'ORI_PUBLISHER',        desc: 'Editora original vinculada (E)',                      status: edits.length > 0 ? 'pronto' : 'alerta',     valor: edits.length > 0 ? (edits[0].nome ?? '✓') : 'Ausente' },
          { label: 'ADM_PUBLISHER',        desc: 'Administradora local quando há controle (AM)',        status: !ctrl ? 'info' : adms.length > 0 ? 'pronto' : 'alerta', valor: adms.length > 0 ? (adms[0].nome ?? '✓') : ctrl ? 'Ausente' : 'N/A' },
          { label: 'ADM_PR_COLLECT',       desc: 'Percentual execução pública da ADM',                  status: !ctrl ? 'info' : adm0 && Number(adm0.percentual_exec_publica||0)>0 ? 'pronto' : 'pendente', valor: adm0 ? `${Number(adm0.percentual_exec_publica||0).toFixed(2)}%` : '—' },
          { label: 'ADM_MR_COLLECT',       desc: 'Percentual fonomecânico/digital da ADM',              status: !ctrl ? 'info' : adm0 && Number(adm0.percentual_fonomecanico||0)>0 ? 'pronto' : 'pendente', valor: adm0 ? `${Number(adm0.percentual_fonomecanico||0).toFixed(2)}%` : '—' },
          { label: 'ORI_TERRITORY_CODE',   desc: 'Território de controle',                              status: obra?.territorio ? 'pronto' : 'alerta',     valor: obra?.territorio === 'BR' ? 'BR — Brasil' : obra?.territorio === '2WL' ? '2WL — Mundo' : obra?.territorio ?? 'Não definido' },
          { label: 'ISWC (opcional)',       desc: 'Não obrigatório — recomendado quando disponível',     status: obra?.iswc ? 'pronto' : 'info',             valor: obra?.iswc ?? 'Não cadastrado' },
          { label: 'PERFORMER_NAME (opc)', desc: 'Intérprete do fonograma — opcional',                  status: fonogramas.some((f: any)=>f.interprete) ? 'pronto' : 'info', valor: fonogramas.find((f: any)=>f.interprete)?.interprete ?? 'Não informado' },
        ]
        const swiMand   = swiItems.slice(0,9)
        const swiOk     = swiMand.every(c => c.status === 'pronto')
        const swiErr    = swiMand.some(c => c.status === 'erro')
        const swiPend   = !swiErr && swiMand.some(c => c.status === 'pendente')
        // pronta com alertas: sem erros, sem pendentes, mas ao menos um alerta
        const swiAlerta = !swiErr && !swiPend && !swiOk

        // ── ISRC Checklist ──────────────────────────────────────────────────
        const scOk  = !!obra?.codigo_obra
        const titOk = !!obra?.titulo
        const fonoC = fonogramas.map((f: any) => {
          const isrcOk  = !!f.isrc
          const intpOk  = !!f.interprete
          const st = !isrcOk ? 'pendente_isrc' : !intpOk ? 'pendente_interprete' : 'pronto'
          return { ...f, st, isrcOk, intpOk }
        })
        const isrcOk = scOk && titOk && fonoC.some((c: any) => c.st === 'pronto')

        // ── IDs editáveis (boDraft sobrepõe obra) ───────────────────────────
        const boVal = (k: string) => (boDraft[k] ?? (obra as any)?.[k] ?? '') as string

        return (
          <div className="space-y-4">

            {/* Banner prontidão */}
            <div className={`rounded-xl border px-5 py-3 flex items-center justify-between gap-4 ${swiErr ? 'border-red-500/30 bg-red-500/5' : swiOk ? 'border-emerald-500/30 bg-emerald-500/5' : swiAlerta ? 'border-amber-400/20 bg-amber-400/5' : 'border-white/[0.08] bg-white/[0.02]'}`}>
              <div>
                <p className={`text-sm font-semibold ${swiErr ? 'text-red-400' : swiOk ? 'text-emerald-400' : swiAlerta ? 'text-amber-300' : 'text-white/40'}`}>
                  {swiErr ? '✗ Erros impedem envio SWI' : swiOk ? '✓ Obra pronta para SWI' : swiAlerta ? '⚠ Pronta com alertas — pode prosseguir' : '○ Pendências para SWI'}
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  {isrcOk ? `${fonoC.filter((c: any)=>c.st==='pronto').length} fonograma(s) prontos para ISRC` : fonogramas.length === 0 ? 'Sem fonogramas — ISRC indisponível' : 'Fonogramas com ISRC pendente'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${swiOk ? 'bg-emerald-500/15 text-emerald-400' : swiAlerta ? 'bg-amber-400/15 text-amber-300' : 'bg-white/8 text-white/35'}`}>SWI</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${isrcOk ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/8 text-white/35'}`}>ISRC</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${stCfg.cls}`}>{stCfg.label}</span>
              </div>
            </div>

            {/* Bloco 1: Identificadores + Status */}
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-sky-400" /> Identificadores BackOffice</h3>
                <div className="flex items-center gap-2">
                  {boEdit
                    ? <>
                        <button onClick={() => { setBoEdit(false); setBoDraft({}) }} className="text-[11px] text-white/40 hover:text-white/70 px-2 py-1 rounded transition-colors"><X className="w-3 h-3" /></button>
                        <button onClick={saveBoFields} disabled={boSaving} className="flex items-center gap-1.5 text-[11px] bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded transition-colors disabled:opacity-50">
                          {boSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
                        </button>
                      </>
                    : <button onClick={() => { setBoEdit(true); setBoDraft({ backoffice_song_id: obra?.backoffice_song_id ?? '', backoffice_work_id: obra?.backoffice_work_id ?? '', backoffice_status: obra?.backoffice_status ?? 'nao_enviada' }) }} className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                        <Edit className="w-3 h-3" /> Editar IDs
                      </button>
                  }
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-0">
                {([
                  { label: 'ID Interno · SONG_CODE', val: obra?.codigo_obra ?? '—', mono: true, badge: 'imutável' },
                  { label: 'ISWC', val: obra?.iswc ?? 'Não cadastrado', mono: true },
                  { label: 'Código Legado', val: obra?.codigo_interno_legado ?? '—', mono: true },
                  { label: 'Código CWR Original', val: obra?.codigo_obra_cwr_original ?? '—', mono: true },
                ] as { label: string; val: string; mono?: boolean; badge?: string }[]).map(f => (
                  <div key={f.label} className="px-4 py-3 border-r border-b border-white/[0.04] last:border-r-0">
                    <p className="text-[10px] text-white/30 mb-0.5">{f.label}</p>
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs ${f.mono ? 'font-mono text-white/80' : 'text-white/70'}`}>{f.val}</p>
                      {f.badge && <span className="text-[9px] text-white/20 border border-white/10 px-1 rounded">{f.badge}</span>}
                    </div>
                  </div>
                ))}
                {/* Editáveis */}
                <div className="px-4 py-3 border-r border-b border-white/[0.04]">
                  <p className="text-[10px] text-white/30 mb-0.5">BackOffice Song ID</p>
                  {boEdit
                    ? <input value={boVal('backoffice_song_id')} onChange={e => setBoDraft(d => ({ ...d, backoffice_song_id: e.target.value }))} placeholder="—" className="text-xs font-mono bg-white/5 border border-white/10 rounded px-2 py-0.5 w-full text-white/80 outline-none focus:border-violet-500/50" />
                    : <p className="text-xs font-mono text-white/80">{obra?.backoffice_song_id ?? '—'}</p>
                  }
                </div>
                <div className="px-4 py-3 border-b border-white/[0.04]">
                  <p className="text-[10px] text-white/30 mb-0.5">BackOffice Work ID</p>
                  {boEdit
                    ? <input value={boVal('backoffice_work_id')} onChange={e => setBoDraft(d => ({ ...d, backoffice_work_id: e.target.value }))} placeholder="—" className="text-xs font-mono bg-white/5 border border-white/10 rounded px-2 py-0.5 w-full text-white/80 outline-none focus:border-violet-500/50" />
                    : <p className="text-xs font-mono text-white/80">{obra?.backoffice_work_id ?? '—'}</p>
                  }
                </div>
              </div>

              {/* Status BackOffice */}
              <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[10px] text-white/30 mb-1">Status BackOffice</p>
                  {boEdit
                    ? <select value={boVal('backoffice_status') || 'nao_enviada'} onChange={e => setBoDraft(d => ({ ...d, backoffice_status: e.target.value }))} className="text-xs bg-[#0a0f1e] border border-white/10 rounded px-2 py-1 text-white/80 outline-none focus:border-violet-500/50">
                        {Object.entries(BO_STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    : <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${stCfg.cls}`}>{stCfg.label}</span>
                  }
                </div>
                <div className="text-[10px] text-white/25 text-right space-y-0.5">
                  {obra?.backoffice_data_ultimo_envio   && <p>Último envio: {new Date(obra.backoffice_data_ultimo_envio).toLocaleDateString('pt-BR')}</p>}
                  {obra?.backoffice_data_ultimo_retorno && <p>Último retorno: {new Date(obra.backoffice_data_ultimo_retorno).toLocaleDateString('pt-BR')}</p>}
                  {obra?.backoffice_ultimo_arquivo       && <p className="font-mono">Arquivo: {obra.backoffice_ultimo_arquivo}</p>}
                </div>
              </div>
            </div>

            {/* Bloco 2+3: SWI e ISRC */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* SWI Checklist */}
              <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Checklist SWI</h3>
                    <p className="text-[11px] text-white/30">Song Work Information</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {swiOk
                      ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">PRONTA</span>
                      : swiAlerta
                        ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 font-semibold">PRONTA COM ALERTAS</span>
                        : swiErr
                          ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">COM ERROS</span>
                          : <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/40 font-semibold">PENDENTE</span>
                    }
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/25 font-semibold">GERAÇÃO EM BREVE</span>
                  </div>
                </div>
                <div className="px-5 py-2">
                  {/* Item 0 — Contrato vigente */}
                  {(() => {
                    const sc = obra?.status_contrato
                    const pronto = sc === 'contrato_sistema' || sc === 'valido' || sc === 'contrato_manual'
                    const alerta = sc === 'recontratacao_pendente'
                    const erro   = !sc || sc === 'sem_contrato'
                    return (
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${pronto ? 'bg-emerald-500/5 border-emerald-500/20' : alerta ? 'bg-amber-500/5 border-amber-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <span className={`text-lg ${pronto ? 'text-emerald-400' : alerta ? 'text-amber-400' : 'text-red-400'}`}>
                          {pronto ? '✓' : alerta ? '△' : '✗'}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-white/70">Contrato vigente</p>
                          <p className="text-[11px] text-white/40">{sc ?? 'sem_contrato'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pronto ? 'bg-emerald-500/20 text-emerald-400' : alerta ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                          {pronto ? 'pronto' : alerta ? 'alerta' : 'erro'}
                        </span>
                      </div>
                    )
                  })()}
                  {swiItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 py-2 border-b border-white/[0.03] last:border-0">
                      {icon(item.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-white/70 leading-none">{item.label}</p>
                        <p className="text-[10px] text-white/25 mt-0.5 leading-none">{item.desc}</p>
                      </div>
                      <span className={`text-[10px] text-right shrink-0 max-w-[120px] truncate font-mono ${item.status==='pronto'?'text-emerald-400':item.status==='erro'?'text-red-400':item.status==='alerta'?'text-amber-400':item.status==='info'?'text-sky-400':'text-white/30'}`}>
                        {item.valor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ISRC Checklist */}
              <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Checklist ISRC</h3>
                    <p className="text-[11px] text-white/30">Por fonograma</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isrcOk
                      ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">PRONTA</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold">PENDENTE</span>
                    }
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/25 font-semibold">GERAÇÃO EM BREVE</span>
                  </div>
                </div>
                {/* Campos globais */}
                <div className="px-5 py-2 border-b border-white/[0.04]">
                  {([
                    { campo: 'SONGCODE',  ok: scOk,  val: obra?.codigo_obra ?? '—', mono: true },
                    { campo: 'SONGTITLE', ok: titOk, val: obra?.titulo ?? '—',       mono: false },
                  ] as { campo: string; ok: boolean; val: string; mono: boolean }[]).map(r => (
                    <div key={r.campo} className="flex items-center gap-2 py-1.5">
                      {r.ok ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> : <span className="w-3 h-3 text-amber-400 text-[10px] flex items-center justify-center shrink-0">○</span>}
                      <span className="text-[11px] font-mono text-white/55 flex-1">{r.campo}</span>
                      <span className={`text-[10px] ${r.mono ? 'font-mono text-emerald-400' : 'text-white/45'} max-w-[140px] truncate`}>{r.val}</span>
                    </div>
                  ))}
                </div>
                {/* Por fonograma */}
                <div className="px-5 py-2">
                  {fonogramas.length === 0
                    ? <p className="text-[11px] text-white/30 py-4 text-center">Sem fonogramas. Adicione na aba Fonogramas.</p>
                    : fonoC.map((f: any) => (
                        <div key={f.id} className="py-2.5 border-b border-white/[0.03] last:border-0">
                          <div className="flex items-center gap-2 mb-1">
                            {f.st === 'pronto' ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> : <span className="w-3 h-3 text-amber-400 text-[10px] flex items-center justify-center shrink-0">○</span>}
                            <span className={`text-[11px] font-mono flex-1 ${f.isrcOk ? 'text-emerald-400' : 'text-amber-400'}`}>{f.isrc ?? 'ISRC pendente'}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${f.st==='pronto'?'bg-emerald-500/10 text-emerald-400':f.st==='pendente_isrc'?'bg-amber-500/10 text-amber-400':'bg-amber-500/10 text-amber-300'}`}>
                              {f.st==='pronto'?'pronto':f.st==='pendente_isrc'?'ISRC pendente':'intérprete pendente'}
                            </span>
                          </div>
                          <div className="flex gap-3 pl-5 text-[10px] text-white/30">
                            <span className="truncate max-w-[260px]">
                              {interpretes.length > 0
                                ? interpretes.map((i: any) => i.nome_artistico).filter(Boolean).join(', ')
                                : (f.interprete ?? '—')}
                            </span>
                            <span className="ml-auto text-white/20">ISRC_SHARE {f.isrc_share ?? '100.00'}</span>
                          </div>
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>

            {/* Stubs futuros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {([
                { title: 'Manual Song Linkage',         desc: 'Vinculação manual de obra ao BackOffice Work ID',             fields: 'SongCode · BO Work ID · ISRC · data · status · obs' },
                { title: 'ONI — Obras Não Identificadas', desc: 'Associar ONI_CODE ao SongCode para identificação de usos',   fields: 'ONI_CODE · SUBMITTER_SONGCODE · ISRC · status · data' },
                { title: 'Alta / Baixa de Catálogo',    desc: 'Formulários de início e encerramento de administração',       fields: 'território · obras · data · ticket · status' },
                { title: 'Counter Claims / Disputas',   desc: 'Split Conflict, Copyright Conflict, Stop Payment, Dispute',   fields: 'tipo · território · % · partes · status · decisão' },
                { title: 'Tickets BackOffice',          desc: 'Tracking e Copyright — abertura e acompanhamento',            fields: 'número · tipo (Track/CR) · área · status · datas' },
                { title: 'Logs e Auditoria',            desc: 'Registro de todas as alterações e arquivos enviados/recebidos', fields: 'usuário · campo · valor anterior · novo valor · data' },
              ]).map(s => (
                <div key={s.title} className="bg-[#0d1526] border border-white/[0.04] rounded-xl px-4 py-3 opacity-60">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-semibold text-white/55">{s.title}</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/6 text-white/30 font-semibold shrink-0">EM BREVE</span>
                  </div>
                  <p className="text-[10px] text-white/25 mb-1">{s.desc}</p>
                  <p className="text-[10px] font-mono text-white/15 leading-relaxed">{s.fields}</p>
                </div>
              ))}
            </div>

          </div>
        )
      })()}

      {/* ── TAB: EXPORTACOES ─────────────────────────────────────────────────── */}
      {activeTab === 'exportacoes' && (
        <div className="space-y-4">

          {/* Histórico de Exportações */}
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Histórico de Exportações</h3>
              <div className="flex items-center gap-3">
                <a
                  href={`/master/exportacoes?obra_id=${obraId}`}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Exportar esta obra
                </a>
                <a href="/master/exportacoes" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Ver todas <ChevronRight className="inline w-3 h-3" />
                </a>
              </div>
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

      {/* Modal de recontratação exigida */}
      {modalRecontratacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1a1a2e] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-lg">⚠</span>
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Recontratação Exigida</h3>
                <p className="text-white/60 text-sm">
                  A alteração em {modalRecontratacao.campos.length > 0 ? `"${modalRecontratacao.campos.join('", "')}"` : 'campo(s) crítico(s)'} exige que o contrato de cessão seja refeito com todos os autores controlados desta obra.
                </p>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-xs text-amber-300">
              A exportação desta obra ficará bloqueada até que um novo contrato seja assinado ou um contrato manual seja anexado.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModalRecontratacao(null)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors"
              >
                Entendido
              </button>
              <button
                onClick={() => { setModalRecontratacao(null); setActiveTab('contratos') }}
                className="px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-colors"
              >
                Ir para Contratos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
