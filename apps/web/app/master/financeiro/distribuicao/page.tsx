'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import {
  Plus, X, Layers, CheckCircle2, Clock, ChevronRight,
  Coins, Users, ArrowRight, AlertCircle, TrendingUp,
} from 'lucide-react'
import {
  MOCK_LOTES, formatCurrency, formatDate, formatDatetime,
  type LoteDistribuicao, type StatusLote,
} from '@/lib/mock-financeiro'

const STATUS_CONFIG: Record<StatusLote, { label: string; color: string; dot: string }> = {
  rascunho: {
    label: 'Rascunho',
    color: 'bg-white/8 text-white/50 border-white/10',
    dot: 'bg-white/30',
  },
  em_processamento: {
    label: 'Processando',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400 animate-pulse',
  },
  confirmado: {
    label: 'Confirmado',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  estornado: {
    label: 'Estornado',
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    dot: 'bg-rose-400',
  },
}

function StatusBadge({ status }: { status: StatusLote }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Wizard ────────────────────────────────────────────────────────────────────
type WizardStep = 1 | 2 | 3

const OBRAS_DISPONIVEIS = [
  { id: 'obra-001', titulo: 'Amo Noite e Dia', saldo: 8_450.00, pct_controlado: 75 },
  { id: 'obra-002', titulo: 'Passarinho do Norte', saldo: 5_120.00, pct_controlado: 60 },
  { id: 'obra-004', titulo: 'Tempo de Amar', saldo: 3_780.00, pct_controlado: 80 },
  { id: 'obra-005', titulo: 'Chuva Fina', saldo: 1_240.00, pct_controlado: 100 },
]

const SIMULACAO = [
  {
    obra: 'Amo Noite e Dia', saldo: 8_450.00, pct_controlado: 75,
    titulares: [
      { nome: 'Nauilan Pereira Barbosa', tipo: 'PF', pr_share: 45, bruto: 3_802.50, recoupment: 500.00, ir: 499.28, liquido: 2_803.22 },
      { nome: 'Giovani Messias da Rocha', tipo: 'PF', pr_share: 30, bruto: 2_535.00, recoupment: 0, ir: 380.25, liquido: 2_154.75 },
      { nome: 'Sync Edições Musicais Ltda.', tipo: 'PJ', pr_share: 25, bruto: 2_112.50, recoupment: 0, ir: 31.69, liquido: 2_080.81 },
    ],
  },
  {
    obra: 'Passarinho do Norte', saldo: 5_120.00, pct_controlado: 60,
    titulares: [
      { nome: 'Nauilan Pereira Barbosa', tipo: 'PF', pr_share: 60, bruto: 3_072.00, recoupment: 500.00, ir: 385.08, liquido: 2_186.92 },
      { nome: 'Giovani Messias da Rocha', tipo: 'PF', pr_share: 40, bruto: 2_048.00, recoupment: 0, ir: 307.20, liquido: 1_740.80 },
    ],
  },
]

function NovoLoteWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<WizardStep>(1)
  const [competencia, setCompetencia] = useState('2026-05')
  const [selectedObras, setSelectedObras] = useState<string[]>(['obra-001', 'obra-002'])
  const [confirming, setConfirming] = useState(false)

  const toggleObra = (id: string) => {
    setSelectedObras(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id])
  }

  const totalBruto = SIMULACAO.reduce((s, o) => s + o.saldo, 0)
  const totalIr = SIMULACAO.reduce((s, o) => s + o.titulares.reduce((ss, t) => ss + t.ir, 0), 0)
  const totalLiquido = SIMULACAO.reduce((s, o) => s + o.titulares.reduce((ss, t) => ss + t.liquido, 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-[#0d1526] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">Novo Lote de Distribuição</h2>
            <p className="text-[11px] text-white/40 mt-0.5">Wizard {step}/3</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-white/[0.05] shrink-0">
          {(['Selecionar Período & Obras', 'Simular Cálculo', 'Confirmar & Gerar'] as const).map((label, i) => {
            const n = (i + 1) as WizardStep
            const active = step === n
            const done = step > n
            return (
              <div key={label} className="flex items-center">
                <div className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  active ? 'bg-violet-600/20 text-violet-300' : done ? 'text-emerald-400' : 'text-white/30',
                ].join(' ')}>
                  <div className={[
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
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

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50 block mb-1.5">Competência</label>
                <input
                  type="month"
                  value={competencia}
                  onChange={e => setCompetencia(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 block mb-2">Obras com saldo disponível</label>
                <div className="space-y-2">
                  {OBRAS_DISPONIVEIS.map(o => (
                    <button
                      key={o.id}
                      onClick={() => toggleObra(o.id)}
                      className={[
                        'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left',
                        selectedObras.includes(o.id)
                          ? 'bg-violet-600/10 border-violet-500/30'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]',
                      ].join(' ')}
                    >
                      <div>
                        <p className="text-sm text-white/80">{o.titulo}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{o.pct_controlado}% controlado pela editora</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400 tabular-nums">{formatCurrency(o.saldo)}</p>
                        <p className="text-[10px] text-white/30">saldo disponível</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                  <p className="text-[10px] text-white/40 mb-1">Total Bruto</p>
                  <p className="text-base font-bold text-white tabular-nums">{formatCurrency(totalBruto)}</p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-amber-400/70 mb-1">Total IR</p>
                  <p className="text-base font-bold text-amber-400 tabular-nums">-{formatCurrency(totalIr)}</p>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-emerald-400/70 mb-1">Liquido Total</p>
                  <p className="text-base font-bold text-emerald-400 tabular-nums">{formatCurrency(totalLiquido)}</p>
                </div>
              </div>

              {SIMULACAO.map(obra => (
                <div key={obra.obra} className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
                    <p className="text-xs font-semibold text-white/70">{obra.obra}</p>
                    <span className="text-xs text-white/40 tabular-nums">Saldo: {formatCurrency(obra.saldo)}</span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Titular</th>
                        <th className="text-right px-3 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">PR%</th>
                        <th className="text-right px-3 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Bruto</th>
                        <th className="text-right px-3 py-1.5 text-[10px] font-semibold text-amber-500/50 uppercase tracking-wider">Recoup.</th>
                        <th className="text-right px-3 py-1.5 text-[10px] font-semibold text-amber-500/50 uppercase tracking-wider">IR</th>
                        <th className="text-right px-4 py-1.5 text-[10px] font-semibold text-emerald-500/60 uppercase tracking-wider">Liquido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {obra.titulares.map(t => (
                        <tr key={t.nome} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                          <td className="px-4 py-2">
                            <p className="text-xs text-white/65">{t.nome}</p>
                            <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${t.tipo === 'PF' ? 'text-amber-400 bg-amber-500/10' : 'text-sky-400 bg-sky-500/10'}`}>{t.tipo}</span>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-white/50 tabular-nums">{t.pr_share}%</td>
                          <td className="px-3 py-2 text-right text-xs text-white/60 tabular-nums">{formatCurrency(t.bruto)}</td>
                          <td className="px-3 py-2 text-right text-xs text-amber-400 tabular-nums">
                            {t.recoupment > 0 ? `-${formatCurrency(t.recoupment)}` : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-amber-400/70 tabular-nums">-{formatCurrency(t.ir)}</td>
                          <td className="px-4 py-2 text-right text-xs font-semibold text-emerald-400 tabular-nums">{formatCurrency(t.liquido)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Lote DIST-2026-05-001</p>
                    <p className="text-xs text-white/40">Competência: Maio/2026</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-white/40">Obras incluídas</p>
                    <p className="text-lg font-bold text-white">{selectedObras.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40">Titulares impactados</p>
                    <p className="text-lg font-bold text-white">3</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40">Valor bruto total</p>
                    <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(totalBruto)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-400/70">Valor líquido total</p>
                    <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatCurrency(totalLiquido)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-white/50">
                  Esta ação é <strong className="text-white/70">irreversível após confirmação</strong>. Os lançamentos serão criados atomicamente nas contas correntes das obras e dos titulares. Adiantamentos recoupables serão descontados em ordem FIFO.
                </p>
              </div>

              {confirming && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-400">Lote confirmado com sucesso! (modo demo)</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0">
          <button
            onClick={step === 1 ? onClose : () => setStep((step - 1) as WizardStep)}
            className="h-9 px-4 rounded-lg text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            {step === 1 ? 'Cancelar' : '← Voltar'}
          </button>
          <button
            onClick={() => {
              if (step < 3) setStep((step + 1) as WizardStep)
              else { setConfirming(true); setTimeout(onClose, 1200) }
            }}
            disabled={step === 3 && confirming}
            className="h-9 px-5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            {step === 3 ? (confirming ? 'Confirmando...' : 'Confirmar e Gerar') : 'Avançar →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detalhe do Lote ───────────────────────────────────────────────────────────
function LoteDetalheModal({ lote, onClose }: { lote: LoteDistribuicao; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-[#0d1526] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">{lote.codigo}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={lote.status} />
              <span className="text-[11px] text-white/35">Competência: {formatDate(lote.competencia)}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <p className="text-[10px] text-white/40 mb-1">Obras</p>
            <p className="text-xl font-bold text-white">{lote.total_obras}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <p className="text-[10px] text-white/40 mb-1">Titulares</p>
            <p className="text-xl font-bold text-white">{lote.total_titulares}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <p className="text-[10px] text-white/40 mb-1">Total Bruto</p>
            <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(lote.total_bruto)}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
            <p className="text-[10px] text-emerald-400/70 mb-1">Liquido</p>
            <p className="text-sm font-bold text-emerald-400 tabular-nums">{formatCurrency(lote.total_liquido)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lote.itens.length > 0 ? (
            <div className="space-y-4">
              {lote.itens.map(item => (
                <div key={item.obra_id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
                    <div>
                      <p className="text-xs font-semibold text-white/75">{item.obra_titulo}</p>
                      <p className="text-[10px] text-white/35">pct_controlado: {item.pct_controlado}%</p>
                    </div>
                    <span className="text-xs font-bold text-white/60 tabular-nums">{formatCurrency(item.saldo_obra)}</span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.03]">
                        <th className="text-left px-4 py-1.5 text-[10px] text-white/30 uppercase tracking-wider font-semibold">Titular</th>
                        <th className="text-right px-3 py-1.5 text-[10px] text-white/30 uppercase tracking-wider font-semibold">PR%</th>
                        <th className="text-right px-3 py-1.5 text-[10px] text-white/30 uppercase tracking-wider font-semibold">Bruto</th>
                        <th className="text-right px-3 py-1.5 text-[10px] text-amber-500/50 uppercase tracking-wider font-semibold">Recoup.</th>
                        <th className="text-right px-4 py-1.5 text-[10px] text-emerald-500/60 uppercase tracking-wider font-semibold">Liquido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.titulares.map(t => (
                        <tr key={t.nome} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                          <td className="px-4 py-2">
                            <p className="text-xs text-white/65">{t.nome}</p>
                            <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${t.tipo_pessoa === 'PF' ? 'text-amber-400 bg-amber-500/10' : 'text-sky-400 bg-sky-500/10'}`}>{t.tipo_pessoa}</span>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-white/50 tabular-nums">{t.pr_share}%</td>
                          <td className="px-3 py-2 text-right text-xs text-white/60 tabular-nums">{formatCurrency(t.valor_bruto)}</td>
                          <td className="px-3 py-2 text-right text-xs text-amber-400 tabular-nums">
                            {t.recoupment > 0 ? `-${formatCurrency(t.recoupment)}` : '—'}
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-semibold text-emerald-400 tabular-nums">{formatCurrency(t.valor_liquido)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-white/30 text-sm py-8">Sem itens detalhados neste lote.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DistribuicaoPage() {
  const [showWizard, setShowWizard] = useState(false)
  const [selectedLote, setSelectedLote] = useState<LoteDistribuicao | null>(null)

  const lotesPendentes = MOCK_LOTES.filter(l => l.status === 'rascunho' || l.status === 'em_processamento').length
  const totalADistribuir = MOCK_LOTES.filter(l => l.status === 'rascunho').reduce((s, l) => s + l.total_bruto, 0)
  const ultimoLote = MOCK_LOTES.find(l => l.status === 'confirmado')
  const titularesImpactados = MOCK_LOTES.filter(l => l.status === 'confirmado').reduce((s, l) => s + l.total_titulares, 0)

  return (
    <div className="space-y-6">
      {showWizard && <NovoLoteWizard onClose={() => setShowWizard(false)} />}
      {selectedLote && <LoteDetalheModal lote={selectedLote} onClose={() => setSelectedLote(null)} />}

      <PageHeader
        title="Distribuição de Royalties"
        description="Lotes de distribuição do saldo de obras para titulares. Recoupment FIFO aplicado automaticamente."
        actions={
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Plus className="w-4 h-4" />
            Novo Lote
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Lotes Pendentes"
          value={lotesPendentes}
          subtitle="rascunho ou em processamento"
          accent="amber"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
        <KpiCard
          title="Valor a Distribuir"
          value={formatCurrency(totalADistribuir + 18_590.00)}
          subtitle="obras com saldo disponivel"
          accent="violet"
          icon={<Coins className="w-4 h-4 text-violet-400" />}
        />
        <KpiCard
          title="Ultimo Lote"
          value={ultimoLote ? formatCurrency(ultimoLote.total_liquido) : '—'}
          subtitle={ultimoLote ? `${ultimoLote.codigo}` : 'Nenhum'}
          accent="emerald"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          title="Titulares Impactados"
          value={titularesImpactados}
          subtitle="total acumulado 2026"
          accent="sky"
          icon={<Users className="w-4 h-4 text-sky-400" />}
        />
      </div>

      {/* Lotes list */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Lotes de Distribuição</h3>
          <span className="text-xs text-white/30">{MOCK_LOTES.length} lotes</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Código</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Competência</th>
              <th className="text-center px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Obras</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Titulares</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Total Liquido</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden lg:table-cell">Criado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {MOCK_LOTES.map(lote => (
              <tr
                key={lote.id}
                className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                onClick={() => setSelectedLote(lote)}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-sm font-medium text-white/80 font-mono">{lote.codigo}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs text-white/55">{formatDate(lote.competencia)}</span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <StatusBadge status={lote.status} />
                </td>
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  <span className="text-xs text-white/50">{lote.total_obras}</span>
                </td>
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  <span className="text-xs text-white/50">{lote.total_titulares}</span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={[
                    'text-sm font-bold tabular-nums',
                    lote.status === 'confirmado' ? 'text-emerald-400' : lote.status === 'rascunho' ? 'text-white/40' : 'text-amber-400',
                  ].join(' ')}>
                    {lote.total_liquido > 0 ? formatCurrency(lote.total_liquido) : '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <span className="text-xs text-white/35">{formatDatetime(lote.criado_em)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1 text-xs text-white/25 group-hover:text-violet-400 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
