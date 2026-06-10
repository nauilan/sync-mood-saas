'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  Receipt, ArrowLeft, CheckCircle2, XCircle, Clock, FileText,
  Building2, User, Globe, Calendar, DollarSign, RefreshCw,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

const TIPO_LABELS: Record<string, string> = {
  licenciamento: 'Licenciamento', royalty: 'Royalty', sincronizacao: 'Sincronização',
  performance: 'Performance', mecanica: 'Mecânica', digital: 'Digital', outro: 'Outro',
}
const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho', emitida: 'Emitida', paga: 'Paga',
  vencida: 'Vencida', cancelada: 'Cancelada', em_disputa: 'Em Disputa',
}
const STATUS_COLORS: Record<string, string> = {
  rascunho:   'bg-white/10 text-white/50',
  emitida:    'bg-sky-500/20 text-sky-300 border-sky-500/30',
  paga:       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  vencida:    'bg-rose-500/20 text-rose-300 border-rose-500/30',
  cancelada:  'bg-gray-500/20 text-gray-400 border-gray-500/20',
  em_disputa: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

function fmtDate(d?: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
}
function fmtBRL(v?: number | null) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v)
}

const TABS = [
  { id: 'resumo',    label: 'Resumo',    icon: Receipt },
  { id: 'valores',  label: 'Valores',   icon: DollarSign },
  { id: 'licenciado', label: 'Licenciado', icon: User },
]

export default function CobrancaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [cob, setCob]         = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('resumo')
  const [error, setError]     = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionResult, setActionResult]   = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await authFetch(`/api/cobracas/${params.id}`)
        if (!res.ok) throw new Error(`Erro ${res.status}`)
        const json = await res.json()
        setCob(json.data ?? json)
      } catch (e: any) {
        setError(e.message ?? 'Erro ao carregar cobrança')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  async function patchStatus(status: string, extraMsg?: string) {
    setActionLoading(true)
    setActionResult(null)
    try {
      const res = await authFetch(`/api/cobracas/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`)
      setCob(json.data ?? json)
      setActionResult({ ok: true, message: extraMsg ?? `Status atualizado para: ${STATUS_LABELS[status] ?? status}` })
    } catch (e: any) {
      setActionResult({ ok: false, message: e.message ?? 'Erro ao atualizar' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-white/30 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Carregando cobrança...
      </div>
    )
  }
  if (error || !cob) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-rose-400 gap-3">
        <Receipt className="w-8 h-8" />
        <p>{error || 'Cobrança não encontrada'}</p>
        <Link href="/master/cobracas" className="text-sm text-violet-400 hover:text-violet-300">← Voltar para Cobranças</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
        <span>/</span>
        <Link href="/master/cobracas" className="hover:text-white/70 transition-colors">Cobranças</Link>
        <span>/</span>
        <span className="text-white/60">{cob.numero_cobranca ?? cob.id?.slice(0, 8)}</span>
      </div>

      <PageHeader
        title={cob.numero_cobranca ?? `Cobrança ${cob.id?.slice(0, 8)}`}
        description={`${TIPO_LABELS[cob.tipo] ?? cob.tipo ?? '—'} · ${cob.obra?.titulo ?? '—'}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[cob.status] ?? 'bg-white/10 text-white/50'}`}>
              {STATUS_LABELS[cob.status] ?? cob.status ?? '—'}
            </span>
            {cob.status === 'emitida' && (
              <button
                onClick={() => patchStatus('paga', 'Cobrança marcada como paga.')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white font-semibold transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Marcar como Paga
              </button>
            )}
            {cob.status === 'rascunho' && (
              <button
                onClick={() => patchStatus('emitida', 'Cobrança emitida com sucesso.')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm text-white font-semibold transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4" /> Emitir
              </button>
            )}
            {['rascunho', 'emitida', 'em_disputa'].includes(cob.status) && (
              <button
                onClick={() => { if (confirm('Cancelar esta cobrança?')) patchStatus('cancelada', 'Cobrança cancelada.') }}
                disabled={actionLoading}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-sm text-white font-semibold transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Cancelar
              </button>
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
            { label: 'Número',        value: cob.numero_cobranca ?? '—',   icon: Receipt },
            { label: 'Tipo',          value: TIPO_LABELS[cob.tipo] ?? cob.tipo ?? '—', icon: Receipt },
            { label: 'Obra',          value: cob.obra?.titulo ?? '—',       icon: FileText },
            { label: 'Editora',       value: cob.editora?.nome ?? '—',      icon: Building2 },
            { label: 'Titular',       value: cob.titular?.nome ?? '—',      icon: User },
            { label: 'Licenciado',    value: cob.licenciado_nome ?? '—',    icon: User },
            { label: 'Emissão',       value: fmtDate(cob.data_emissao),     icon: Calendar },
            { label: 'Vencimento',    value: fmtDate(cob.data_vencimento),  icon: Clock },
            { label: 'Pagamento',     value: fmtDate(cob.data_pagamento),   icon: CheckCircle2 },
            { label: 'Território',    value: cob.territorio ?? '—',         icon: Globe },
            { label: 'Período Ref.',  value: cob.periodo_referencia ?? '—', icon: Calendar },
            { label: 'Autorização',   value: cob.autorizacao?.numero_autorizacao ?? (cob.autorizacao_id ? cob.autorizacao_id.slice(0, 8) : '—'), icon: FileText },
          ].map(item => (
            <div key={item.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <item.icon className="w-3 h-3 text-white/30" />
                <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">{item.label}</p>
              </div>
              <p className="text-sm text-white/80">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Valores */}
      {tab === 'valores' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Valores da Cobrança</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Valor Bruto',         value: fmtBRL(cob.valor_bruto) },
              { label: '% Comissão',           value: cob.percentual_comissao != null ? `${cob.percentual_comissao}%` : '—' },
              { label: 'Valor Líquido',        value: fmtBRL(cob.valor_liquido) },
              { label: 'Moeda',                value: cob.moeda ?? 'BRL' },
            ].map(f => (
              <div key={f.label} className="bg-white/[0.03] rounded-lg p-4">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{f.label}</p>
                <p className="text-lg font-semibold text-white/80">{f.value}</p>
              </div>
            ))}
          </div>
          {cob.observacoes && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Observações</p>
              <p className="text-sm text-white/70 whitespace-pre-line">{cob.observacoes}</p>
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
              { label: 'Nome / Razão Social', value: cob.licenciado_nome },
              { label: 'CPF / CNPJ',          value: cob.licenciado_cnpj_cpf },
              { label: 'E-mail',               value: cob.licenciado_email },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{f.label}</p>
                <p className="text-sm text-white/80">{f.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
