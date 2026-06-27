'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  Shield, ArrowLeft, CheckCircle2, XCircle, Clock, FileText,
  Building2, User, Globe, Calendar, DollarSign, RefreshCw,
  Music, Disc, Download,
} from 'lucide-react'
import { authFetch } from '@/lib/supabase/client'

const TIPO_LABELS: Record<string, string> = {
  sync: 'Sync', audiovisual: 'Audiovisual', publicidade: 'Publicidade',
  gravacao: 'Gravação', uso_especial: 'Uso Especial', performance: 'Performance',
  digital: 'Digital', fonograma: 'Fonograma', sincronizacao: 'Sincronização',
  edicao_grafica: 'Edição Gráfica', incidental: 'Incidental', versao: 'Versão',
}
const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho', aguardando_aprovacao_admin: 'Aguardando Aprovação',
  emitida: 'Emitida', cancelada: 'Cancelada', expirada: 'Expirada',
}
const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-white/10 text-white/50 border-white/10',
  aguardando_aprovacao_admin: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  emitida: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  cancelada: 'bg-rose-500/20 text-rose-300 border-rose-500/20',
  expirada: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
}
const MODELO_LABELS: Record<string, string> = {
  pago_editora: 'Pago à Editora',
  pago_autor:   'Pago ao Autor',
  sem_onus:     'Sem Ônus',
}

function fmtDate(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
}
function fmtBRL(v?: number | null) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
}
function arr(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return (v as unknown[]).map(i => (typeof i === 'string' ? i : (i as any)?.nome ?? '')).filter(Boolean)
  return []
}

const TABS = [
  { id: 'espelho',    label: 'Espelho',    icon: Music },
  { id: 'licenciado', label: 'Licenciado', icon: User },
  { id: 'condicoes',  label: 'Condições',  icon: FileText },
]

export default function AutorizacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const [aut, setAut]         = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('espelho')
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
          throw new Error((json as any)?.error ?? `Erro ${res.status}`)
        }
        const json = await res.json()
        setAut((json as any).data ?? json)
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
    setActionLoading(true); setActionResult(null)
    try {
      const res = await authFetch(`/api/autorizacoes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_workflow: 'emitida', status: 'vigente' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error((json as any).error ?? `Erro ${res.status}`)
      setAut((json as any).data ?? json)
      setActionResult({ ok: true, message: 'Autorização aprovada e emitida.' })
    } catch (e: any) {
      setActionResult({ ok: false, message: e.message ?? 'Erro ao aprovar' })
    } finally { setActionLoading(false) }
  }

  async function handleCancelar() {
    const motivo = prompt('Motivo do cancelamento:')
    if (!motivo) return
    setActionLoading(true); setActionResult(null)
    try {
      const res = await authFetch(`/api/autorizacoes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_workflow: 'cancelada', status: 'cancelada', motivo_cancelamento: motivo }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error((json as any).error ?? `Erro ${res.status}`)
      setAut((json as any).data ?? json)
      setActionResult({ ok: true, message: 'Autorização cancelada.' })
    } catch (e: any) {
      setActionResult({ ok: false, message: e.message ?? 'Erro ao cancelar' })
    } finally { setActionLoading(false) }
  }

  function handleExportPDF() {
    if (!aut) return
    const dp      = aut.dados_produto ?? {}
    const interp  = arr(dp.interpretes).join(', ') || '—'
    const tipos   = arr(dp.tipos_produto).join(', ') || '—'
    const ffis    = arr(dp.formatos_fisicos).join(', ') || '—'
    const fdig    = arr(dp.formatos_digitais).join(', ') || '—'
    const isrcs   = arr(dp.isrcs).join(', ') || '—'
    const modelo  = MODELO_LABELS[aut.modelo_negocio] ?? aut.modelo_negocio ?? '—'
    const pagoA   = aut.modelo_negocio === 'pago_autor'
      ? 'Autor (diretamente)'
      : aut.modelo_negocio === 'sem_onus'
        ? 'N/A (sem ônus)'
        : (aut.editora?.nome ?? aut.licenciante ?? 'Editora')
    const periodo = aut.prazo_indeterminado
      ? 'Indeterminado'
      : `${fmtDate(aut.prazo_inicio)} a ${fmtDate(aut.prazo_fim)}`
    const obraTitulo = aut.obra?.titulo ?? aut.obra_titulo ?? '—'
    const num = aut.numero_autorizacao ?? aut.id.slice(0, 8)

    const row = (label: string, value: string) =>
      `<tr><td class="lbl">${label}</td><td class="val">${value || '—'}</td></tr>`

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Autorização ${num}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:32px 40px}
  h1{font-size:17px;margin:0 0 2px}
  .sub{color:#555;margin-bottom:20px;font-size:11px}
  .section{margin-bottom:18px}
  .section h2{font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;
    background:#f0f0f0;padding:4px 8px;margin:0 0 0;border-radius:2px}
  table{width:100%;border-collapse:collapse;margin-top:0}
  td{padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top}
  .lbl{color:#777;width:42%;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
  .val{color:#111}
  .isrc-list{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
  .isrc{background:#f5f5f5;border:1px solid #ddd;border-radius:4px;padding:2px 8px;font-family:monospace;font-size:10px}
  .footer{margin-top:28px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px}
  @media print{button{display:none!important}}
  button{margin-top:16px;padding:8px 20px;background:#6d28d9;color:#fff;border:none;
    border-radius:6px;cursor:pointer;font-size:12px}
</style>
</head>
<body>
<h1>Autorização ${num}</h1>
<div class="sub">${TIPO_LABELS[aut.tipo_autorizacao] ?? aut.tipo_autorizacao ?? ''} · ${obraTitulo} · Status: ${STATUS_LABELS[aut.status_workflow] ?? aut.status_workflow ?? ''}</div>

<div class="section">
  <h2>Produto</h2>
  <table>
    ${row('Título do produto', dp.titulo)}
    ${row('Intérprete(s)', interp)}
    ${row('Tipo de produto', tipos)}
    ${row('Formato físico', ffis)}
    ${row('Formatos digitais', fdig)}
    ${row('Data prevista de lançamento', dp.data_lancamento ? fmtDate(dp.data_lancamento) : '')}
    ${row('Território da autorização', dp.territorio ?? aut.territorio)}
    ${dp.selo_gravadora ? row('Selo / Gravadora', dp.selo_gravadora) : ''}
    ${dp.distribuidora ? row('Distribuidora', dp.distribuidora) : ''}
  </table>
  ${arr(dp.isrcs).length ? `<div style="padding:6px 8px"><span style="font-size:10px;color:#777;text-transform:uppercase">ISRC</span><div class="isrc-list">${arr(dp.isrcs).map((s: string) => `<span class="isrc">${s}</span>`).join('')}</div></div>` : ''}
</div>

<div class="section">
  <h2>Condições do Negócio</h2>
  <table>
    ${row('Modelo de negócio', modelo)}
    ${row('Pago a', pagoA)}
    ${row('Valor', fmtBRL(aut.valor_licenca))}
    ${row('Moeda', aut.moeda ?? 'BRL')}
    ${row('Finalidade', aut.finalidade)}
    ${row('Território', aut.territorio)}
    ${row('Período', periodo)}
    ${aut.observacoes ? row('Observações', aut.observacoes) : ''}
  </table>
</div>

<div class="section">
  <h2>Licenciado</h2>
  <table>
    ${row('Nome / Razão Social', aut.licenciado_nome)}
    ${row('CPF / CNPJ', aut.licenciado_cnpj_cpf)}
    ${row('E-mail', aut.licenciado_email)}
  </table>
</div>

<div class="footer">Emitido em: ${fmtDate(aut.emitida_em)} · Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
<button onclick="window.print()">Imprimir / Salvar PDF</button>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
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
        <Link href="/master/autorizacoes" className="text-sm text-violet-400 hover:text-violet-300">
          ← Voltar para Autorizações
        </Link>
      </div>
    )
  }

  const sw          = aut.status_workflow ?? aut.status
  const statusColor = STATUS_COLORS[sw] ?? 'bg-white/10 text-white/50 border-white/10'
  const statusLabel = STATUS_LABELS[sw] ?? sw
  const dp          = aut.dados_produto ?? {}
  const interpretes = arr(dp.interpretes).join(', ')
  const modelo      = MODELO_LABELS[aut.modelo_negocio] ?? aut.modelo_negocio ?? '—'
  const pagoA       = aut.modelo_negocio === 'pago_autor'
    ? 'Autor (diretamente)'
    : aut.modelo_negocio === 'sem_onus'
      ? 'N/A (sem ônus)'
      : (aut.editora?.nome ?? aut.licenciante ?? 'Editora')

  const Card = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
    <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-white/30" />
        <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm text-white/80">{value || '—'}</p>
    </div>
  )

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-white/70">{value || '—'}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/40">
        <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
        <span>/</span>
        <Link href="/master/autorizacoes" className="hover:text-white/70 transition-colors">Autorizações</Link>
        <span>/</span>
        <span className="text-white/60">{aut.numero_autorizacao ?? aut.id.slice(0, 8)}</span>
      </div>

      {/* Header */}
      <PageHeader
        title={aut.numero_autorizacao ?? `Autorização ${aut.id.slice(0, 8)}`}
        description={`${TIPO_LABELS[aut.tipo_autorizacao] ?? aut.tipo_autorizacao ?? '—'} · ${aut.obra?.titulo ?? aut.obra_titulo ?? '—'}`}
        actions={
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
              {statusLabel}
            </span>
            {sw === 'aguardando_aprovacao_admin' && (
              <>
                <button onClick={handleAprovar} disabled={actionLoading}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white font-semibold transition-colors disabled:opacity-50">
                  <CheckCircle2 className="w-4 h-4" /> Aprovar e Emitir
                </button>
                <button onClick={handleCancelar} disabled={actionLoading}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-sm text-white font-semibold transition-colors disabled:opacity-50">
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
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? 'border-violet-500 text-violet-300' : 'border-transparent text-white/40 hover:text-white/70'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Espelho ─────────────────────────────────────────────── */}
      {tab === 'espelho' && (
        <div className="space-y-6">
          {/* Identificação */}
          <section>
            <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-3">Identificação</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Card label="Número"     value={aut.numero_autorizacao ?? '—'}              icon={FileText} />
              <Card label="Tipo"       value={TIPO_LABELS[aut.tipo_autorizacao] ?? aut.tipo_autorizacao ?? '—'} icon={Shield} />
              <Card label="Obra"       value={aut.obra?.titulo ?? aut.obra_titulo ?? '—'} icon={FileText} />
              <Card label="Editora"    value={aut.editora?.nome ?? '—'}                   icon={Building2} />
              <Card label="Emitido em" value={fmtDate(aut.emitida_em)}                    icon={Clock} />
            </div>
          </section>

          {/* Produto */}
          <section>
            <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-3">Produto</p>
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                <Field label="Título do produto"          value={dp.titulo} />
                <Field label="Intérprete(s)"              value={interpretes} />
                <Field label="Tipo de produto"            value={arr(dp.tipos_produto).join(', ')} />
                <Field label="Formato físico"             value={arr(dp.formatos_fisicos).join(', ')} />
                <Field label="Formatos digitais"          value={arr(dp.formatos_digitais).join(', ')} />
                <Field label="Data prevista de lançamento" value={dp.data_lancamento ? fmtDate(dp.data_lancamento) : null} />
                <Field label="Território da autorização"  value={dp.territorio ?? aut.territorio} />
                {dp.selo_gravadora && <Field label="Selo / Gravadora" value={dp.selo_gravadora} />}
                {dp.distribuidora  && <Field label="Distribuidora"    value={dp.distribuidora} />}
              </div>

              {arr(dp.isrcs).length > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">ISRC</p>
                  <div className="flex flex-wrap gap-2">
                    {arr(dp.isrcs).map((isrc, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/70 font-mono">
                        <Disc className="w-3 h-3 text-white/30" /> {isrc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {aut.observacoes && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Observações</p>
              <p className="text-sm text-white/70 whitespace-pre-line">{aut.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Licenciado ──────────────────────────────────────────── */}
      {tab === 'licenciado' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Dados do Licenciado</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome / Razão Social" value={aut.licenciado_nome} />
            <Field label="CPF / CNPJ"          value={aut.licenciado_cnpj_cpf} />
            <Field label="E-mail"              value={aut.licenciado_email} />
          </div>
        </div>
      )}

      {/* ── Tab: Condições ───────────────────────────────────────────── */}
      {tab === 'condicoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Condições do Negócio</h3>
            <button onClick={handleExportPDF}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs text-white font-medium transition-colors">
              <Download className="w-3.5 h-3.5" /> Exportar PDF
            </button>
          </div>

          {/* Pagamento */}
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Estrutura de Pagamento</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
              <Field label="Modelo de negócio" value={modelo} />
              <Field label="Pago a"            value={pagoA} />
              <Field label="Valor"             value={fmtBRL(aut.valor_licenca)} />
              <Field label="Moeda"             value={aut.moeda ?? 'BRL'} />
            </div>
          </div>

          {/* Condições gerais */}
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Condições Gerais</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
              <Field label="Finalidade"  value={aut.finalidade} />
              <Field label="Território"  value={aut.territorio} />
              <Field label="Período"     value={aut.prazo_indeterminado ? 'Indeterminado' : `${fmtDate(aut.prazo_inicio)} a ${fmtDate(aut.prazo_fim)}`} />
            </div>
            {aut.observacoes && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Observações</p>
                <p className="text-sm text-white/70 whitespace-pre-line">{aut.observacoes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
