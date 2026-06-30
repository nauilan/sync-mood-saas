'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Plus, Search, Filter, CheckCircle2, Clock,
  AlertTriangle, ChevronRight, Building2, User,
  Bell, ShieldAlert, DollarSign, Calendar, Download, Trash2, Loader2, XCircle, Check, Upload,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import type { TipoContratoV2, StatusContratoV2 } from '@/lib/types-contratos-v2'
import {
  TIPO_CONTRATO_V2_LABELS, TIPO_CONTRATO_V2_COLORS,
  STATUS_CONTRATO_V2_LABELS, STATUS_CONTRATO_V2_COLORS,
} from '@/lib/types-contratos-v2'
import { authFetch } from '@/lib/supabase/client'

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

type FilterTipo = TipoContratoV2 | 'todos'
type FilterStatus = StatusContratoV2 | 'todos'
type FilterEditora = string

const TIPOS_FILTER: { value: FilterTipo; label: string }[] = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'administracao_editorial', label: 'Adm. Editorial' },
  { value: 'cessao_parcial', label: 'Cessao Parcial' },
  { value: 'cessao_total', label: 'Cessao Total' },
  { value: 'cessao_internacional', label: 'Cessao Internacional' },
  { value: 'cessionario_pf', label: 'Cessionario PF' },
  { value: 'cessionario_pj', label: 'Cessionario PJ' },
  { value: 'coedicao', label: 'Coedicao' },
  { value: 'licenciamento', label: 'Licenciamento' },
  { value: 'exclusividade_autor_editora', label: 'Exclusividade' },
  { value: 'licenciamento_licenciante_pf', label: 'Licenciante PF' },
  { value: 'licenciamento_licenciante_pj', label: 'Licenciante PJ' },
  { value: 'subedicao', label: 'Subedicao' },
]

const STATUS_FILTER: { value: FilterStatus; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'em_vigor', label: 'Em Vigor' },
  { value: 'aguardando_assinatura', label: 'Ag. Assinatura' },
  { value: 'vencendo', label: 'Vencendo' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'rescindido', label: 'Rescindido' },
]

export default function ContratosPage() {
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('todos')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
  const [filterEditora, setFilterEditora] = useState<FilterEditora>('todos')
  const [contratosApi, setContratosApi] = useState<any[]>([])
  const [apiKpis, setApiKpis] = useState<any>(null)
  const [loadingApi, setLoadingApi] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteErro, setDeleteErro] = useState('')
  const [showPendencias, setShowPendencias] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectMotivo, setRejectMotivo] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [uploadManualId, setUploadManualId] = useState<string | null>(null)
  const [uploadManualFile, setUploadManualFile] = useState<File | null>(null)
  const [uploadManualLoading, setUploadManualLoading] = useState(false)
  const [uploadManualErro, setUploadManualErro] = useState('')

  useEffect(() => {
    authFetch('/api/contratos?per_page=100')
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setContratosApi(json.data)
          if (json.kpis) setApiKpis(json.kpis)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingApi(false))
  }, [])

  function downloadContratoObra(c: any, modo: 'rascunho' | 'assinado') {
    const tipoNomes: Record<string, string> = {
      cessao_parcial: 'Cessão Parcial', cessao_total: 'Cessão Total', coedicao: 'Coedição',
    }
    const partes = [
      `Cedente: ${c.titular_nome || '—'}`,
      ...(c.obras?.flatMap((o: any) => o.co_autores?.filter((ca: any) => ca.nome)
        .map((ca: any) => `Co-autor: ${ca.nome}`)) || []),
      `Responsável Editora: ${c.responsavel_editora_id || 'TOP SHOW MUSIC'}`,
      `Testemunha 1: ${c.testemunha1_id || '—'}`,
      `Testemunha 2: ${c.testemunha2_id || '—'}`,
    ]
    const obras = (c.obras || []).map((o: any, i: number) =>
      `OBRA ${i + 1}: ${o.titulo}  |  ${c.titular_nome}: ${o.pct_autor}%` +
      (o.co_autores?.length ? '\n  Co-autores: ' + o.co_autores.map((ca: any) => `${ca.nome} ${ca.pct}%`).join(', ') : '')
    )
    const txt = [
      '='.repeat(56),
      `  CONTRATO DE ${(tipoNomes[c.tipo] || c.tipo || '').toUpperCase()}`,
      modo === 'assinado' ? '  *** ASSINADO PELAS PARTES ***' : '  *** RASCUNHO ***',
      '='.repeat(56),
      `Número       : ${c.numero}`,
      `Data Emissão : ${c.data_emissao || '—'}`,
      `Provedor     : ${(c.provedor_assinatura || '').toUpperCase()}`,
      '',
      '── OBRAS ───────────────────────────────────────────',
      ...obras,
      '',
      '── PARTES ──────────────────────────────────────────',
      ...partes.map(p => modo === 'assinado' ? p + '\n  ✓ Assinado digitalmente' : p + '\n  _________________________________'),
      '',
      '='.repeat(56),
    ].join('\n')
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${c.numero}_${modo}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleAssinaturaManual() {
    if (!uploadManualId || !uploadManualFile) return
    setUploadManualLoading(true)
    setUploadManualErro('')
    try {
      const formData = new FormData()
      formData.append('file', uploadManualFile)
      const res = await authFetch(`/api/contratos/${uploadManualId}/assinatura-manual`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setUploadManualErro(json.error ?? `Erro ${res.status}`); return }
      setUploadManualId(null)
      setUploadManualFile(null)
      await recarregarContratos()
    } catch (e: unknown) {
      setUploadManualErro(e instanceof Error ? e.message : 'Falha ao enviar arquivo.')
    } finally {
      setUploadManualLoading(false)
    }
  }

  async function marcarAssinado(id: string) {
    await authFetch(`/api/contratos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'assinado' }),
    })
    // Recarrega a lista
    authFetch('/api/contratos?per_page=100')
      .then(r => r.json())
      .then(json => { if (json.data) setContratosApi(json.data) })
      .catch(() => {})
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    setDeleteErro('')
    try {
      const res = await authFetch(`/api/contratos/${id}`, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setDeleteErro(d.error ?? `Erro ${res.status}`); return }
      setContratosApi(prev => prev.filter(c => c.id !== id))
      setConfirmId(null)
    } catch (e: unknown) {
      setDeleteErro(e instanceof Error ? e.message : 'Falha ao deletar.')
    } finally {
      setDeleting(false)
    }
  }

  const pendencias = useMemo(() => contratosApi.filter((c: any) => c.status === 'aguardando_validacao_admin'), [contratosApi])

  async function recarregarContratos() {
    const r = await authFetch('/api/contratos?per_page=100')
    const json = await r.json()
    if (json.data) { setContratosApi(json.data); if (json.kpis) setApiKpis(json.kpis) }
  }

  async function handleAprovar(id: string) {
    setActionLoading(id)
    try {
      await authFetch(`/api/contratos/${id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'aprovar_admin' }),
      })
      await recarregarContratos()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRejeitar() {
    if (!rejectId || !rejectMotivo.trim()) return
    setActionLoading(rejectId)
    try {
      await authFetch(`/api/contratos/${rejectId}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejeitar_admin', motivo: rejectMotivo.trim() }),
      })
      setRejectId(null)
      setRejectMotivo('')
      await recarregarContratos()
    } finally {
      setActionLoading(null)
    }
  }

  const editoras = useMemo(() => {
    const nomes = [...new Set(contratosApi.map((c: any) => c.editora_nome).filter(Boolean))]
    return ['todos', ...nomes]
  }, [contratosApi])

  const alertasExclusividade = useMemo(() => {
    const hoje = new Date()
    const limite = new Date()
    limite.setDate(hoje.getDate() + 90)
    return contratosApi.filter((c: any) => {
      if (!c.vigencia_fim) return false
      const fim = new Date(c.vigencia_fim + 'T00:00:00')
      return fim >= hoje && fim <= limite
    })
  }, [contratosApi])

  const fonteContratos = contratosApi

  const contratos = useMemo(() => {
    if (showPendencias) return pendencias
    return fonteContratos.filter((c: any) => {
      if (filterTipo !== 'todos' && c.tipo !== filterTipo) return false
      if (filterStatus !== 'todos' && c.status !== filterStatus) return false
      if (filterEditora !== 'todos' && c.editora_nome !== filterEditora) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          (c.numero ?? '').toLowerCase().includes(q) ||
          (c.titular_principal ?? '').toLowerCase().includes(q) ||
          (c.editora_nome ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, filterTipo, filterStatus, filterEditora, fonteContratos, showPendencias, pendencias])

  const confirmItem = contratosApi.find(c => c.id === confirmId)

  return (
    <div className="space-y-6">

      {/* Modal de confirmação de exclusão */}
      {confirmId && confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-rose-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Apagar contrato</h3>
                <p className="text-xs text-white/50">{confirmItem.numero} — {confirmItem.titular_nome}</p>
              </div>
            </div>
            <p className="text-xs text-white/60 mb-2">Esta ação irá remover permanentemente:</p>
            <ul className="text-xs text-white/50 space-y-1 mb-4 ml-3 list-disc">
              <li>O contrato e todos os seus dados</li>
              <li>
                <span className="text-rose-300 font-semibold">
                  {confirmItem.obras?.length ?? '?'} obra(s)
                </span> vinculadas a este contrato
              </li>
              <li>Todos os titulares, fonogramas e links dessas obras</li>
            </ul>
            <p className="text-[11px] text-rose-400 font-semibold mb-5">Esta ação é irreversível.</p>
            {deleteErro && (
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs mb-4">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {deleteErro}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setConfirmId(null); setDeleteErro('') }}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                {deleting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Apagando...</>
                  : <><Trash2 className="w-3.5 h-3.5" /> Apagar tudo</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rejeição */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-rose-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Rejeitar contrato</h3>
                <p className="text-xs text-white/50">{contratosApi.find(c => c.id === rejectId)?.numero ?? ''}</p>
              </div>
            </div>
            <p className="text-xs text-white/60 mb-2">Informe o motivo da rejeição:</p>
            <textarea
              value={rejectMotivo}
              onChange={e => setRejectMotivo(e.target.value)}
              rows={3}
              placeholder="Descreva o motivo da rejeição..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-rose-500/40 resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setRejectId(null); setRejectMotivo('') }}
                disabled={!!actionLoading}
                className="px-4 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejeitar}
                disabled={!rejectMotivo.trim() || !!actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de upload de assinatura manual */}
      {uploadManualId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-blue-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Assinatura manual</h3>
                <p className="text-xs text-white/50">{contratosApi.find(c => c.id === uploadManualId)?.numero ?? ''}</p>
              </div>
            </div>
            <p className="text-xs text-white/60 mb-3">Selecione o PDF assinado pelas partes:</p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-6 cursor-pointer hover:border-blue-500/40 transition-colors mb-4">
              <Upload className="w-6 h-6 text-white/30 mb-2" />
              <span className="text-xs text-white/50">
                {uploadManualFile ? uploadManualFile.name : 'Clique para selecionar o PDF'}
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setUploadManualFile(f) }}
              />
            </label>
            {uploadManualErro && (
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs mb-4">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {uploadManualErro}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setUploadManualId(null); setUploadManualFile(null); setUploadManualErro('') }}
                disabled={uploadManualLoading}
                className="px-4 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssinaturaManual}
                disabled={!uploadManualFile || uploadManualLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                {uploadManualLoading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                  : <><Upload className="w-3.5 h-3.5" /> Confirmar Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta exclusividade vencendo */}
      {alertasExclusividade.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-0.5">
              Alertas de Exclusividade
            </p>
            <p className="text-xs text-amber-400/80">
              {alertasExclusividade.length} contrato(s) com vencimento em menos de 90 dias.{' '}
              <Link href="/master/contratos/alertas" className="underline hover:text-amber-300">
                Ver alertas
              </Link>
            </p>
          </div>
        </div>
      )}

      <PageHeader
        title="Contratos"
        description="Motor de contratos autorais — cessoes, licencas, administracao e coedicao"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/master/contratos/novo/obras">
              <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm text-white font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Contrato de Obras
              </button>
            </Link>
            <Link href="/master/contratos/novo">
              <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Outros Contratos
              </button>
            </Link>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          title="Contratos Ativos"
          value={apiKpis?.em_vigor ?? 0}
          subtitle={`de ${apiKpis?.total ?? 0} total`}
          accent="emerald"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          title="Vencendo em 30d"
          value={apiKpis?.vencendo ?? 0}
          subtitle="requerem renovacao"
          accent="amber"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        />
        <KpiCard
          title="Ag. Assinatura"
          value={apiKpis?.aguardando_assinatura ?? 0}
          subtitle="pendentes"
          accent="rose"
          icon={<Clock className="w-4 h-4 text-rose-400" />}
        />
        <KpiCard
          title="Vencidos"
          value={apiKpis?.vencidos ?? 0}
          subtitle="precisam de acao"
          accent="violet"
          icon={<Calendar className="w-4 h-4 text-violet-400" />}
        />
      </div>

      {/* Banner pendências de validação */}
      {pendencias.length > 0 && (
        <button
          onClick={() => setShowPendencias(v => !v)}
          className={`w-full flex items-start gap-3 rounded-xl p-4 border transition-colors text-left ${showPendencias ? 'bg-amber-500/20 border-amber-500/40' : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15'}`}
        >
          <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300 mb-0.5">
              Pendências de Validação
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendencias.length}
              </span>
            </p>
            <p className="text-xs text-amber-400/80">
              {showPendencias ? 'Clique para voltar à lista completa.' : `${pendencias.length} contrato(s) aguardando sua aprovação como administrador.`}
            </p>
          </div>
          {showPendencias && (
            <span className="text-xs text-amber-400 font-semibold self-center">Ativo</span>
          )}
        </button>
      )}

      {/* Filtros */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por numero, titular ou editora..."
              className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/40"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value as FilterTipo)}
              className="h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
            >
              {TIPOS_FILTER.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as FilterStatus)}
              className="h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
            >
              {STATUS_FILTER.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={filterEditora}
              onChange={e => setFilterEditora(e.target.value)}
              className="h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
            >
              {editoras.map(e => (
                <option key={e} value={e}>{e === 'todos' ? 'Todas as editoras' : e}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-white/30 mt-3">
          {contratos.length} contrato(s) encontrado(s)
        </p>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {contratos.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">
            Nenhum contrato encontrado com os filtros atuais.
          </div>
        ) : (
          contratos.map(c => (
            <Link key={c.id} href={`/master/contratos/${c.id}`}>
              <div className="group bg-[#0d1526] border border-white/[0.06] hover:border-white/10 rounded-xl px-5 py-4 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-violet-400" />
                  </div>

                  {/* Main */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-white/90">{c.numero}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_CONTRATO_V2_COLORS[c.tipo as TipoContratoV2] ?? 'bg-white/10 text-white/60'}`}>
                        {TIPO_CONTRATO_V2_LABELS[c.tipo as TipoContratoV2] ?? c.tipo}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONTRATO_V2_COLORS[c.status as StatusContratoV2] ?? 'bg-white/10 text-white/60'}`}>
                        {STATUS_CONTRATO_V2_LABELS[c.status as StatusContratoV2] ?? c.status}
                      </span>
                      {c.exclusividade && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">
                          Exclusividade
                        </span>
                      )}
                      {c.status === 'vencendo' && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Bell className="w-3 h-3" /> Vencendo em {c._dias_para_vencer}d
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
                      <span className="flex items-center gap-1">
                        {c.titular_tipo_pessoa === 'PJ' ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {c.titular_principal ?? '—'}
                      </span>
                      <span className="text-white/20">·</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {c.editora_nome}
                      </span>
                      <span className="text-white/20">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(c.vigencia_inicio)} – {c.prazo_indeterminado ? 'Indeterminado' : formatDate(c.vigencia_fim)}
                      </span>
                    </div>
                  </div>

                  {/* Right KPIs */}
                  <div className="hidden lg:flex items-center gap-6 text-xs text-white/40">
                    <div className="text-right">
                      <div className="text-white/70 font-semibold text-sm">{c._obras_count ?? 0}</div>
                      <div>obras</div>
                    </div>
                    {(c._recoupment_aberto ?? 0) > 0 && (
                      <div className="text-right">
                        <div className="text-rose-400 font-semibold text-sm">
                          {formatCurrency(c._recoupment_aberto!)}
                        </div>
                        <div>recoupment</div>
                      </div>
                    )}
                    {(c._assinaturas_pendentes ?? 0) > 0 && (
                      <div className="text-right">
                        <div className="text-amber-400 font-semibold text-sm">{c._assinaturas_pendentes}</div>
                        <div>pend. assinar</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {showPendencias ? (
                      <>
                        <button
                          onClick={e => { e.preventDefault(); setRejectId(c.id); setRejectMotivo('') }}
                          disabled={actionLoading === c.id}
                          className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rejeitar
                        </button>
                        <button
                          onClick={e => { e.preventDefault(); handleAprovar(c.id) }}
                          disabled={actionLoading === c.id}
                          className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {actionLoading === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Aprovar
                        </button>
                      </>
                    ) : (
                      <>
                        {(c.status === 'rascunho' || c.status === 'aguardando_assinatura') && (
                          <button
                            onClick={e => { e.preventDefault(); setUploadManualId(c.id); setUploadManualFile(null); setUploadManualErro('') }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-blue-500/15 text-white/20 hover:text-blue-400 transition-all"
                            title="Upload assinatura manual"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={e => { e.preventDefault(); setConfirmId(c.id); setDeleteErro('') }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/15 text-white/20 hover:text-rose-400 transition-all"
                          title="Apagar contrato e todas as obras"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Quick links */}
      <div className="flex gap-3 text-xs text-white/40 pt-2">
        <Link href="/master/contratos/modelos" className="hover:text-violet-400 transition-colors">
          Biblioteca de Modelos Juridicos
        </Link>
        <span>·</span>
        <Link href="/master/contratos/alertas" className="hover:text-amber-400 transition-colors">
          Alertas de Exclusividade
        </Link>
      </div>
    </div>
  )
}
