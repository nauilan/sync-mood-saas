'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { ChevronLeft, ChevronRight, Check, Users, Calendar, FileText, Send, Zap } from 'lucide-react'
import { MOCK_CC_TITULARES } from '@/lib/mock-cc'
import { MOCK_CC_OBRAS, fmtBRL } from '@/lib/mock-cc'

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
  { id: 1 as Step, label: 'Titular(es)', icon: Users },
  { id: 2 as Step, label: 'Período', icon: Calendar },
  { id: 3 as Step, label: 'Preview', icon: FileText },
  { id: 4 as Step, label: 'Canal Envio', icon: Send },
  { id: 5 as Step, label: 'Gerar', icon: Zap },
]

export default function NovaPrestacaoPage() {
  const [step, setStep] = useState<Step>(1)
  const [titularesSelecionados, setTitularesSelecionados] = useState<string[]>([])
  const [periodoInicio, setPeriodoInicio] = useState('2026-01-01')
  const [periodoFim, setPeriodoFim] = useState('2026-03-31')
  const [canais, setCanais] = useState<string[]>(['email'])
  const [gerado, setGerado] = useState(false)

  function toggleTitular(id: string) {
    setTitularesSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleCanal(c: string) {
    setCanais(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  function nextStep() {
    if (step < 5) setStep((step + 1) as Step)
  }
  function prevStep() {
    if (step > 1) setStep((step - 1) as Step)
  }

  const titularesSel = MOCK_CC_TITULARES.filter(t => titularesSelecionados.includes(t.titular_id))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/master/prestacao-contas" className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-white/50" />
        </Link>
        <PageHeader title="Nova Prestação de Contas" description="Wizard — 5 passos para gerar e enviar demonstrativos" className="mb-0 flex-1" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className={['flex flex-col items-center gap-1 flex-1', step >= s.id ? 'opacity-100' : 'opacity-30'].join(' ')}>
              <div className={['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2', step > s.id ? 'bg-violet-600 border-violet-600 text-white' : step === s.id ? 'border-violet-500 text-violet-400 bg-violet-500/10' : 'border-white/10 text-white/30'].join(' ')}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className="text-[9px] text-white/50 hidden sm:block">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={['h-px flex-1 max-w-8', step > s.id ? 'bg-violet-600' : 'bg-white/10'].join(' ')} />}
          </div>
        ))}
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
        {/* Step 1 — Selecionar titulares */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/70">Selecione os titulares</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {MOCK_CC_TITULARES.map(t => (
                <button
                  key={t.titular_id}
                  onClick={() => toggleTitular(t.titular_id)}
                  className={['flex items-center gap-3 p-3 rounded-xl border transition-colors text-left', titularesSelecionados.includes(t.titular_id) ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:border-white/[0.15]'].join(' ')}
                >
                  <div className={['w-6 h-6 rounded border flex items-center justify-center shrink-0', titularesSelecionados.includes(t.titular_id) ? 'bg-violet-600 border-violet-600' : 'border-white/20'].join(' ')}>
                    {titularesSelecionados.includes(t.titular_id) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.titular_nome}</p>
                    <p className="text-[10px] text-white/30">{t.titular_codigo} · {t.titular_tipo} · Saldo: {fmtBRL(t.saldo_atual)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Período */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/70">Selecione o período</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 block mb-1">Início</label>
                <input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Fim</label>
                <input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/70">Preview dos valores</h3>
            {titularesSel.map(t => (
              <div key={t.titular_id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <p className="text-sm font-semibold text-white/80 mb-3">{t.titular_nome}</p>
                {t.movimentos.filter(m => m.tipo_movimento === 'credito').map(m => (
                  <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                    <p className="text-xs text-white/50">{m.descricao}</p>
                    <div className="text-right">
                      <p className="text-xs text-white/70 tabular-nums">{fmtBRL(m.valor_bruto)}</p>
                      {m.retencoes_total > 0 && <p className="text-[10px] text-rose-400 tabular-nums">-{fmtBRL(m.retencoes_total)} IRPF</p>}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs font-semibold text-white/50">Valor Líquido Estimado</p>
                  <p className="text-sm font-bold text-emerald-400 tabular-nums">{fmtBRL(t.saldo_liberado)}</p>
                </div>
                {t.recoupment_ativo && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <p className="text-[10px] text-amber-400">⚠ Recoupment aplicado: saldo devedor {fmtBRL(t.recoupment_ativo.saldo_devedor)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 4 — Canal de envio */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/70">Canal de envio</h3>
            <div className="flex items-center gap-3 flex-wrap">
              {(['email', 'whatsapp', 'portal'] as const).map(c => (
                <button key={c} onClick={() => toggleCanal(c)} className={['flex items-center gap-2 h-9 px-4 rounded-xl border text-xs font-medium transition-colors', canais.includes(c) ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/70'].join(' ')}>
                  {c === 'email' && '📧'} {c === 'whatsapp' && '💬'} {c === 'portal' && '🌐'}
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Mensagem personalizada (email)</label>
              <textarea className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white/70 h-20 resize-none outline-none focus:border-violet-500/50" defaultValue="Olá {{nome}}, segue seu demonstrativo de pagamentos para o período {{periodo}}." />
            </div>
          </div>
        )}

        {/* Step 5 — Gerar */}
        {step === 5 && (
          <div className="text-center space-y-4 py-6">
            {gerado ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white/80">Prestações geradas e enviadas!</h3>
                <p className="text-sm text-white/40">{titularesSel.length} prestação(ões) gerada(s) e enfileirada(s) para envio via {canais.join(', ')}.</p>
                <Link href="/master/prestacao-contas" className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
                  Ver Prestações
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-white/70">Confirmar geração</h3>
                <div className="text-left bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2">
                  <p className="text-xs text-white/50">Titulares: <span className="text-white/70">{titularesSel.map(t => t.titular_nome).join(', ') || '—'}</span></p>
                  <p className="text-xs text-white/50">Período: <span className="text-white/70">{periodoInicio} – {periodoFim}</span></p>
                  <p className="text-xs text-white/50">Canais: <span className="text-white/70">{canais.join(', ')}</span></p>
                </div>
                <button onClick={() => setGerado(true)} className="flex items-center gap-2 mx-auto h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
                  <Zap className="w-4 h-4" />
                  Gerar e Enviar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!gerado && (
        <div className="flex items-center justify-between">
          <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-white/[0.10] text-sm text-white/50 hover:text-white/80 disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          {step < 5 ? (
            <button onClick={nextStep} className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
