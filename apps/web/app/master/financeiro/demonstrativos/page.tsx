'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import {
  FileText, Send, Eye, CheckCircle2, Clock, X, Plus, ArrowRight,
  Mail, MailCheck, AlertCircle, Users, TrendingUp, ChevronRight,
} from 'lucide-react'
import {
  MOCK_DEMONSTRATIVOS, MOCK_TITULARES_CC, formatCurrency, formatDate, formatDatetime,
  type Demonstrativo, type StatusDemonstrativo,
} from '@/lib/mock-financeiro'

type FilterStatus = 'todos' | 'rascunho' | 'aprovado' | 'enviado'

const FILTER_LABELS: Record<FilterStatus, string> = {
  todos: 'Todos',
  rascunho: 'Rascunho',
  aprovado: 'Aprovado',
  enviado: 'Enviado',
}

const STATUS_CONFIG: Record<StatusDemonstrativo, { label: string; color: string; icon: React.ReactNode }> = {
  rascunho: {
    label: 'Rascunho',
    color: 'bg-white/8 text-white/50 border-white/10',
    icon: <Clock className="w-3 h-3" />,
  },
  aprovado: {
    label: 'Aprovado',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  enviado: {
    label: 'Enviado',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    icon: <MailCheck className="w-3 h-3" />,
  },
}

function StatusBadge({ status }: { status: StatusDemonstrativo }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ── PDF Preview ───────────────────────────────────────────────────────────────
function PdfPreview({ demo }: { demo: Demonstrativo }) {
  const titularCC = MOCK_TITULARES_CC.find(t => t.nome === demo.titular_nome)
  const obras = titularCC?.extrato
    .filter(l => l.categoria === 'operacional' && l.obra_titulo)
    .reduce((acc, l) => {
      if (!l.obra_titulo) return acc
      const k = l.obra_titulo
      if (!acc[k]) acc[k] = { titulo: k, bruto: 0, ir: 0, liquido: 0 }
      acc[k].bruto += l.valor_bruto
      acc[k].ir += l.ir_retido
      acc[k].liquido += l.valor_liquido
      return acc
    }, {} as Record<string, { titulo: string; bruto: number; ir: number; liquido: number }>)
  const obrasArr = obras ? Object.values(obras) : []

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-2xl text-gray-900 text-sm"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div className="px-8 py-6" style={{ background: 'linear-gradient(135deg, #07060f, #11111d)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Sync Mood Gestao Inteligente</p>
            <h1 className="text-lg font-bold text-white">Demonstrativo de Royalties</h1>
            <p className="text-xs text-white/50 mt-0.5">
              {formatDate(demo.periodo_inicio)} até {formatDate(demo.periodo_fim)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40">Nº</p>
            <p className="text-sm font-mono font-bold text-white/80">{demo.numero}</p>
          </div>
        </div>
      </div>

      {/* Titular */}
      <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Titular</p>
        <p className="text-base font-bold text-gray-900">{demo.titular_nome}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${demo.titular_tipo_pessoa === 'PF' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
            {demo.titular_tipo_pessoa}
          </span>
          {demo.titular_tipo_pessoa === 'PF' && (
            <span className="text-[10px] text-gray-400">Sujeito a retenção IRRF tabela progressiva</span>
          )}
        </div>
      </div>

      {/* Obras */}
      {obrasArr.length > 0 && (
        <div className="px-8 py-5 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Obras com Direitos no Período</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-2 text-[10px] font-semibold text-gray-400">Obra</th>
                <th className="text-right pb-2 text-[10px] font-semibold text-gray-400">Bruto</th>
                <th className="text-right pb-2 text-[10px] font-semibold text-gray-400">IR Retido</th>
                <th className="text-right pb-2 text-[10px] font-semibold text-gray-400">Liquido</th>
              </tr>
            </thead>
            <tbody>
              {obrasArr.map(o => (
                <tr key={o.titulo} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{o.titulo}</td>
                  <td className="py-2 text-right text-gray-600 tabular-nums">{formatCurrency(o.bruto)}</td>
                  <td className="py-2 text-right text-amber-600 tabular-nums">-{formatCurrency(o.ir)}</td>
                  <td className="py-2 text-right font-semibold text-gray-900 tabular-nums">{formatCurrency(o.liquido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="px-8 py-5">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total Bruto</span>
            <span className="font-semibold tabular-nums">{formatCurrency(demo.valor_bruto)}</span>
          </div>
          {demo.valor_ir > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">IR Retido na Fonte</span>
              <span className="font-semibold text-amber-700 tabular-nums">-{formatCurrency(demo.valor_ir)}</span>
            </div>
          )}
          {demo.valor_iss > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">ISS Retido</span>
              <span className="font-semibold text-amber-700 tabular-nums">-{formatCurrency(demo.valor_iss)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-900">Valor Liquido a Receber</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: '#7c3aed' }}>{formatCurrency(demo.valor_liquido)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          Demonstrativo gerado em {demo.gerado_em ? formatDatetime(demo.gerado_em) : 'N/A'} · Sync Mood Gestao Inteligente · Este documento é informativo.
        </p>
      </div>
    </div>
  )
}

// ── Detalhe do Demonstrativo ──────────────────────────────────────────────────
function DemonstrativoDetalheModal({ demo, onClose }: { demo: Demonstrativo; onClose: () => void }) {
  const [tab, setTab] = useState<'preview' | 'envios'>('preview')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-[#0d1526] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">{demo.numero}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={demo.status} />
              <span className="text-[11px] text-white/35">{demo.titular_nome}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-2 border-b border-white/[0.05] shrink-0">
          {(['preview', 'envios'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'h-7 px-3 rounded-lg text-xs font-medium transition-colors capitalize',
                tab === t ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/60',
              ].join(' ')}
            >
              {t === 'preview' ? 'Preview PDF' : 'Histórico de Envios'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'preview' && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-white/40">Prévia do documento (HTML estilizado)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Mock</span>
              </div>
              <PdfPreview demo={demo} />
            </div>
          )}

          {tab === 'envios' && (
            <div className="space-y-3">
              {demo.envios.length > 0 ? (
                demo.envios.map(env => (
                  <div key={env.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className={[
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        env.status === 'enviado' ? 'bg-emerald-500/10' : 'bg-rose-500/10',
                      ].join(' ')}>
                        {env.status === 'enviado'
                          ? <MailCheck className="w-4 h-4 text-emerald-400" />
                          : <AlertCircle className="w-4 h-4 text-rose-400" />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/75">{env.email_destino}</p>
                        <p className="text-[10px] text-white/35">Enviado: {formatDatetime(env.enviado_em)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {env.lido_em ? (
                        <div>
                          <span className="text-[10px] font-semibold text-emerald-400">Lido</span>
                          <p className="text-[9px] text-white/30">{formatDatetime(env.lido_em)}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/30">Não lido</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-white/30 text-sm py-8">Nenhum envio registrado.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {demo.status !== 'enviado' && (
          <div className="flex items-center gap-2 px-6 py-3 border-t border-white/[0.05] shrink-0">
            {demo.status === 'rascunho' && (
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aprovar
              </button>
            )}
            {demo.status === 'aprovado' && (
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors">
                <Send className="w-3.5 h-3.5" />
                Enviar por Email
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Wizard Gerar Demonstrativos ───────────────────────────────────────────────
type WizardStep = 1 | 2 | 3

function GerarDemonstrativosWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<WizardStep>(1)
  const [periodo, setPeriodo] = useState('2026-05')
  const [selectedTitulares, setSelectedTitulares] = useState<string[]>(['tit-001', 'tit-002'])

  const toggleTitular = (id: string) =>
    setSelectedTitulares(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-[#0d1526] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">Gerar Demonstrativos</h2>
            <p className="text-[11px] text-white/40 mt-0.5">Passo {step} de 3</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-white/[0.05] shrink-0">
          {(['Período', 'Titulares', 'Enviar'] as const).map((label, i) => {
            const n = (i + 1) as WizardStep
            const active = step === n
            const done = step > n
            return (
              <div key={label} className="flex items-center">
                <div className={[
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  active ? 'bg-violet-600/20 text-violet-300' : done ? 'text-emerald-400' : 'text-white/30',
                ].join(' ')}>
                  <div className={[
                    'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0',
                    active ? 'bg-violet-600 text-white' : done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/30',
                  ].join(' ')}>
                    {done ? '✓' : n}
                  </div>
                  {label}
                </div>
                {i < 2 && <ArrowRight className="w-3 h-3 text-white/15 mx-1" />}
              </div>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50 block mb-1.5">Período de referência</label>
                <input
                  type="month"
                  value={periodo}
                  onChange={e => setPeriodo(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>
              <p className="text-xs text-white/40">
                Serão gerados demonstrativos com todos os lançamentos operacionais do período selecionado para cada titular.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 mb-3">Selecione os titulares</p>
              {MOCK_TITULARES_CC.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTitular(t.id)}
                  className={[
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left',
                    selectedTitulares.includes(t.id)
                      ? 'bg-violet-600/10 border-violet-500/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]',
                  ].join(' ')}
                >
                  <div>
                    <p className="text-sm text-white/80">{t.nome}</p>
                    <p className="text-[10px] text-white/35">{t.tipo_pessoa} · {t.tipo_titular}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.tipo_pessoa === 'PF' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'}`}>
                    {t.tipo_pessoa}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-3">Resumo do Envio</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/45">Período:</span>
                    <span className="text-white/70 font-medium">{periodo}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/45">Titulares selecionados:</span>
                    <span className="text-white/70 font-medium">{selectedTitulares.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/45">Demonstrativos a gerar:</span>
                    <span className="text-white/70 font-medium">{selectedTitulares.length}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-sky-500/5 border border-sky-500/10">
                <Mail className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                <p className="text-xs text-white/50">
                  Os demonstrativos serão gerados e enviados por email para cada titular. Demonstrativos para PF incluem detalhamento de IRRF retido na fonte.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0">
          <button
            onClick={step === 1 ? onClose : () => setStep((step - 1) as WizardStep)}
            className="h-9 px-4 rounded-lg text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            {step === 1 ? 'Cancelar' : '← Voltar'}
          </button>
          <button
            onClick={() => { if (step < 3) setStep((step + 1) as WizardStep); else onClose() }}
            className="h-9 px-5 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            {step === 3 ? 'Gerar e Enviar' : 'Avançar →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DemonstrativosPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Demonstrativo | null>(null)
  const [showWizard, setShowWizard] = useState(false)

  const filtered = MOCK_DEMONSTRATIVOS.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q || d.titular_nome.toLowerCase().includes(q) || d.numero.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' ? true : d.status === filterStatus
    return matchSearch && matchStatus
  })

  const pendentesAprovacao = MOCK_DEMONSTRATIVOS.filter(d => d.status === 'rascunho').length
  const enviadosMes = MOCK_DEMONSTRATIVOS.filter(d => d.status === 'enviado' && d.gerado_em?.startsWith('2026-04')).length
  const totalBrutoDistribuido = MOCK_DEMONSTRATIVOS.filter(d => d.status === 'enviado').reduce((s, d) => s + d.valor_bruto, 0)
  const lidos = MOCK_DEMONSTRATIVOS.filter(d => d.envios.some(e => e.lido_em)).length
  const taxaLeitura = MOCK_DEMONSTRATIVOS.filter(d => d.status === 'enviado').length > 0
    ? Math.round((lidos / MOCK_DEMONSTRATIVOS.filter(d => d.status === 'enviado').length) * 100)
    : 0

  return (
    <div className="space-y-6">
      {selected && <DemonstrativoDetalheModal demo={selected} onClose={() => setSelected(null)} />}
      {showWizard && <GerarDemonstrativosWizard onClose={() => setShowWizard(false)} />}

      <PageHeader
        title="Demonstrativos"
        description="Demonstrativos de royalties por titular. PF com detalhamento IRRF. PJ sem retencao."
        actions={
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Plus className="w-4 h-4" />
            Gerar Demonstrativos
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Pendentes Aprovacao"
          value={pendentesAprovacao}
          subtitle="aguardando aprovacao"
          accent="amber"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
        <KpiCard
          title="Enviados Mes"
          value={enviadosMes}
          subtitle="Abril/2026"
          accent="sky"
          icon={<Send className="w-4 h-4 text-sky-400" />}
        />
        <KpiCard
          title="Total Bruto Distribuido"
          value={formatCurrency(totalBrutoDistribuido)}
          subtitle="em demonstrativos enviados"
          accent="violet"
          icon={<TrendingUp className="w-4 h-4 text-violet-400" />}
        />
        <KpiCard
          title="Taxa de Leitura"
          value={`${taxaLeitura}%`}
          subtitle="titulares que abriram o email"
          accent="emerald"
          icon={<Eye className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors"
            placeholder="Buscar por titular ou numero..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {(Object.keys(FILTER_LABELS) as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={[
                'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
                filterStatus === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80',
              ].join(' ')}
            >
              {FILTER_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Demonstrativo</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden lg:table-cell">Período</th>
              <th className="text-center px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Bruto</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-amber-500/50 uppercase tracking-wider hidden md:table-cell">IR</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-emerald-500/60 uppercase tracking-wider">Liquido</th>
              <th className="text-center px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Lido</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(demo => (
              <tr
                key={demo.id}
                className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                onClick={() => setSelected(demo)}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/85">{demo.titular_nome}</p>
                      <p className="text-[10px] text-white/35 font-mono">{demo.numero}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <span className="text-xs text-white/50">
                    {formatDate(demo.periodo_inicio)} → {formatDate(demo.periodo_fim)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <StatusBadge status={demo.status} />
                </td>
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  <span className="text-xs text-white/50 tabular-nums">{formatCurrency(demo.valor_bruto)}</span>
                </td>
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  {demo.valor_ir > 0 ? (
                    <span className="text-xs text-amber-400 tabular-nums">-{formatCurrency(demo.valor_ir)}</span>
                  ) : (
                    <span className="text-xs text-white/25">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm font-bold text-white/75 tabular-nums">{formatCurrency(demo.valor_liquido)}</span>
                </td>
                <td className="px-4 py-3.5 text-center hidden md:table-cell">
                  {demo.envios.some(e => e.lido_em) ? (
                    <MailCheck className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                  ) : demo.status === 'enviado' ? (
                    <Mail className="w-3.5 h-3.5 text-white/25 mx-auto" />
                  ) : (
                    <span className="text-xs text-white/20">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1 text-xs text-white/25 group-hover:text-violet-400 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-white/30 text-sm">
                  Nenhum demonstrativo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-white/30">
            {filtered.length} demonstrativo(s) · PF: retem IRRF tabela progressiva. PJ: sem retencao na fonte.
          </p>
        </div>
      </div>
    </div>
  )
}
