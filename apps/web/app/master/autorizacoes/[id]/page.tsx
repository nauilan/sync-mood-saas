'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  Shield, ArrowLeft, CheckCircle2, XCircle, Clock, FileText,
  Building2, User, Globe, Calendar, DollarSign, RefreshCw,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

const TIPO_LABELS: Record<string, string> = {
  sync: 'Sync', audiovisual: 'Audiovisual', publicidade: 'Publicidade',
  gravacao: 'Gravação', uso_especial: 'Uso Especial', performance: 'Performance', digital: 'Digital',
}
const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho', aguardando_aprovacao_admin: 'Aguardando Aprovação',
  emitida: 'Emitida', cancelada: 'Cancelada', expirada: 'Expirada',
}
const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-white/10 text-white/50',
  aguardando_aprovacao_admin: 'bg-amber-500/20 text-amber-300',
  emitida: 'bg-emerald-500/20 text-emerald-300',
  cancelada: 'bg-rose-500/20 text-rose-300',
  expirada: 'bg-gray-500/20 text-gray-400',
}

function fmtDate(d?: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
}
function fmtBRL(v?: number | null) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
}

const TABS = [
  { id: 'resumo',    label: 'Resumo',    icon: Shield },
  { id: 'licenciado', label: 'Licenciado', icon: User },
  { id: 'condicoes', label: 'Condições',  icon: FileText },
]

export default function AutorizacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const [aut, setAut]         = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('resumo')
  const [error, setError]     = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionResult, setActionResult]   = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await authFetch(`/api/autorizacoes/${id}`)
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json?.error ?? `Erro ${res.status}`)
        }
        const json = await res.json()
        setAut(json.data ?? json)
      } catch (e: any) {
        setError(e.message ?? 'Erro ao carregar autorização')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleAprovar() {
    if (!confirm('Confirmar aprovação desta autorização?')) return
    setActionLoading(true)
    setActionResult(null)
    try {
      const res = await authFetch(`/api/autorizacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'emitida' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`)
      setAut(json.data ?? json)
      setActionResult({ ok: true, message: 'Autorização aprovada e emitida com sucesso.' })
    } catch (e: any) {
      setActionResult({ ok: false, message: e.message ?? 'Erro ao aprovar' })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelar() {
    const motivo = prompt('Motivo do cancelamento:')
    if (!motivo) return
    setActionLoading(true)
    setActionResult(null)
    try {
      const res = await authFetch(`/api/autorizacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelada', observacoes: motivo }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`)
      setAut(json.data ?? json)
      setActionResult({ ok: true, message: 'Autorização cancelada.' })
    } catch (e: any) {
      setActionResult({ ok: false, message: e.message ?? 'Erro ao cancelar' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-white/30 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Carregando autorização...
      </div>
    )
  }
  if (error || !aut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-rose-400 gap-3">
        <Shield className="w-8 h-8" />
        <p>{error || 'Autorização não encontrada'}</p>
        <Link href="/master/autorizacoes" className="text-sm text-violet-400 hover:text-violet-300">← Voltar para Autorizações</Link>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[aut.status] ?? 'bg-white/10 text-white/50'
  const statusLabel = STATUS_LABELS[aut.status] ?? aut.status

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
        <span>/</span>
        <Link href="/master/autorizacoes" className="hover:text-white/70 transition-colors">Autorizações</Link>
        <span>/</span>
        <span className="text-white/60">{aut.numero_autorizacao ?? aut.id.slice(0, 8)}</span>
      </div>

      <PageHeader
        title={aut.numero_autorizacao ?? `Autorização ${aut.id.slice(0, 8)}`}
        description={`${TIPO_LABELS[aut.tipo_autorizacao] ?? aut.tipo_autorizacao ?? '—'} · ${aut.obra?.titulo ?? '—'}`}
        actions={
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
              {statusLabel}
            </span>
            {aut.status === 'aguardando_aprovacao_admin' && (
              <>
                <button
                  onClick={handleAprovar}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Aprovar e Emitir
                </button>
                <button
                  onClick={handleCancelar}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-sm text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Cancelar
                </button>
              </>
            )}
          </div>
        }
      />

      {actionResult && (
        <div className={`px-4 py-3 rounded-xl border text-sm ${actionResult.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
          {actionResult.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Resumo */}
      {tab === 'resumo' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Número',        value: aut.numero_autorizacao ?? '—', icon: FileText },
            { label: 'Tipo',          value: TIPO_LABELS[aut.tipo_autorizacao] ?? aut.tipo_autorizacao ?? '—', icon: Shield },
            { label: 'Obra',          value: aut.obra?.titulo ?? '—', icon: FileText },
            { label: 'Editora',       value: aut.editora?.nome ?? '—', icon: Building2 },
            { label: 'Titular',       value: aut.titular?.nome ?? '—', icon: User },
            { label: 'Território',    value: aut.territorio ?? '—', icon: Globe },
            { label: 'Início',        value: fmtDate(aut.prazo_inicio), icon: Calendar },
            { label: 'Fim',           value: aut.prazo_indeterminado ? 'Indeterminado' : fmtDate(aut.prazo_fim), icon: Calendar },
            { label: 'Valor',         value: fmtBRL(aut.valor_licenca), icon: DollarSign },
            { label: 'Emitido em',    value: fmtDate(aut.emitida_em), icon: Clock },
            { label: 'Finalidade',    value: aut.finalidade ?? '—', icon: FileText },
            { label: 'Moeda',         value: aut.moeda ?? 'BRL', icon: DollarSign },
          ].map(item => (
            <div key={item.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <item.icon className="w-3 h-3 text-white/30" />
                <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">{item.label}</p>
              </div>
              <p className="text-sm text-white/80">{item.value}</p>
            </div>
          ))}
          {aut.observacoes && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Observações</p>
              <p className="text-sm text-white/70 whitespace-pre-line">{aut.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Licenciado */}
      {tab === 'licenciado' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Dados do Licenciado</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nome / Razão Social', value: aut.licenciado_nome },
              { label: 'CPF / CNPJ',          value: aut.licenciado_cnpj_cpf },
              { label: 'E-mail',               value: aut.licenciado_email },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{f.label}</p>
                <p className="text-sm text-white/80">{f.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Condições */}
      {tab === 'condicoes' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Condições da Autorização</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Finalidade',    value: aut.finalidade },
              { label: 'Território',    value: aut.territorio },
              { label: 'Período',       value: aut.prazo_indeterminado ? 'Indeterminado' : `${fmtDate(aut.prazo_inicio)} a ${fmtDate(aut.prazo_fim)}` },
              { label: 'Valor',         value: fmtBRL(aut.valor_licenca) },
              { label: 'Moeda',         value: aut.moeda ?? 'BRL' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{f.label}</p>
                <p className="text-sm text-white/80">{f.value || '—'}</p>
              </div>
            ))}
          </div>
          {aut.observacoes && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Observações</p>
              <p className="text-sm text-white/70 whitespace-pre-line">{aut.observacoes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
