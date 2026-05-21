'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, FileText, Users, Music, Eye } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import type { TipoContrato, DireitoCedido } from '@/lib/types-contratos'
import { TIPO_CONTRATO_LABELS, DIREITO_LABELS } from '@/lib/types-contratos'

const TOTAL_STEPS = 4

const STEP_LABELS = ['Modelo & Tipo', 'Partes', 'Obras', 'Revisao']
const STEP_ICONS = [
  <FileText className="w-4 h-4" key="ft" />,
  <Users className="w-4 h-4" key="u" />,
  <Music className="w-4 h-4" key="m" />,
  <Eye className="w-4 h-4" key="e" />,
]

const MODELOS_MOCK = [
  { id: 'm1', nome: 'Cessao Padrao UBC', tipo: 'cessao' as TipoContrato, descricao: 'Modelo padrao para cessao de direitos autorais com sociedade UBC.' },
  { id: 'm2', nome: 'Administracao Editorial', tipo: 'administracao' as TipoContrato, descricao: 'Contrato de administracao editorial para obras nacionais.' },
  { id: 'm3', nome: 'Co-edicao Internacional', tipo: 'coedicao' as TipoContrato, descricao: 'Modelo para co-edicao com parceiros internacionais.' },
]

const TITULARES_MOCK = [
  { id: 't1', nome: 'Nauilan Barbosa Silva', tipo: 'compositor' },
  { id: 't2', nome: 'Giovani Alves Rodrigues', tipo: 'compositor' },
  { id: 't3', nome: 'Edi Music Editora Ltda', tipo: 'editora' },
  { id: 't4', nome: 'Marcelo Costa Ferreira', tipo: 'compositor' },
  { id: 't5', nome: 'Ana Paula Santos', tipo: 'interprete' },
]

const OBRAS_MOCK = [
  { id: 'o1', codigo: 'OBR-001', titulo: 'Amo Noite e Dia' },
  { id: 'o2', codigo: 'OBR-002', titulo: 'Passarinho do Norte' },
  { id: 'o3', codigo: 'OBR-003', titulo: 'Sol da Manha' },
  { id: 'o4', codigo: 'OBR-004', titulo: 'Tempo de Amar' },
  { id: 'o5', codigo: 'OBR-005', titulo: 'Chuva Fina' },
]

interface ObraVinculada {
  obra_id: string
  titulo: string
  percentual: string
  vigencia_inicio: string
  vigencia_fim: string
  direitos: DireitoCedido[]
}

interface FormState {
  modelo_id: string
  tipo: TipoContrato | ''
  vigencia_inicio: string
  vigencia_fim: string
  renovacao_automatica: boolean
  cedentes: string[]
  cessionarios: string[]
  obras: ObraVinculada[]
  clausulas_extras: string
}

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                done ? 'bg-violet-600 text-white' : active ? 'bg-violet-600/30 border border-violet-500 text-violet-300' : 'bg-white/5 border border-white/10 text-white/30',
              ].join(' ')}>
                {done ? <Check className="w-4 h-4" /> : STEP_ICONS[i]}
              </div>
              <span className={['text-xs whitespace-nowrap', active ? 'text-violet-300 font-medium' : done ? 'text-white/50' : 'text-white/25'].join(' ')}>
                {label}
              </span>
            </div>
            {i < TOTAL_STEPS - 1 && (
              <div className={['flex-1 h-px mx-2 mb-4', done ? 'bg-violet-600/50' : 'bg-white/10'].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function NovoContratoPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>({
    modelo_id: '',
    tipo: '',
    vigencia_inicio: '',
    vigencia_fim: '',
    renovacao_automatica: false,
    cedentes: [],
    cessionarios: [],
    obras: [],
    clausulas_extras: '',
  })

  const canAdvance = () => {
    if (step === 0) return !!form.tipo && !!form.vigencia_inicio
    if (step === 1) return form.cedentes.length > 0 && form.cessionarios.length > 0
    if (step === 2) return form.obras.length > 0
    return true
  }

  const toggleTitular = (id: string, field: 'cedentes' | 'cessionarios') => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(id) ? f[field].filter(x => x !== id) : [...f[field], id],
    }))
  }

  const toggleObra = (obra: typeof OBRAS_MOCK[0]) => {
    setForm(f => {
      const exists = f.obras.find(o => o.obra_id === obra.id)
      if (exists) return { ...f, obras: f.obras.filter(o => o.obra_id !== obra.id) }
      return {
        ...f,
        obras: [...f.obras, {
          obra_id: obra.id, titulo: obra.titulo, percentual: '100',
          vigencia_inicio: form.vigencia_inicio, vigencia_fim: form.vigencia_fim,
          direitos: ['exec_publica', 'fonomecanico', 'sincronizacao'],
        }],
      }
    })
  }

  const updateObra = (obra_id: string, field: keyof ObraVinculada, value: string | DireitoCedido[]) => {
    setForm(f => ({ ...f, obras: f.obras.map(o => o.obra_id === obra_id ? { ...o, [field]: value } : o) }))
  }

  const toggleDireito = (obra_id: string, direito: DireitoCedido) => {
    setForm(f => ({
      ...f,
      obras: f.obras.map(o => {
        if (o.obra_id !== obra_id) return o
        const dirs = o.direitos.includes(direito) ? o.direitos.filter(d => d !== direito) : [...o.direitos, direito]
        return { ...o, direitos: dirs }
      }),
    }))
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <PageHeader title="Novo Contrato" description={'Etapa ' + (step + 1) + ' de ' + TOTAL_STEPS + ' — ' + STEP_LABELS[step]} />
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
        <StepBar current={step} />

        {/* ── Etapa 1: Modelo + Tipo ── */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Selecione um Modelo (opcional)</h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, modelo_id: '' }))}
                  className={['rounded-lg border p-3 text-left transition-colors', !form.modelo_id ? 'border-violet-500 bg-violet-500/10' : 'border-white/[0.08] hover:border-white/20'].join(' ')}
                >
                  <p className="text-sm font-medium text-white/80">Sem modelo (contrato manual)</p>
                  <p className="text-xs text-white/40 mt-0.5">Preencha todas as clausulas manualmente</p>
                </button>
                {MODELOS_MOCK.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setForm(f => ({ ...f, modelo_id: m.id, tipo: m.tipo }))}
                    className={['rounded-lg border p-3 text-left transition-colors', form.modelo_id === m.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/[0.08] hover:border-white/20'].join(' ')}
                  >
                    <p className="text-sm font-medium text-white/80">{m.nome}</p>
                    <p className="text-xs text-white/40 mt-0.5">{m.descricao}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Tipo de Contrato <span className="text-rose-400">*</span></h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.keys(TIPO_CONTRATO_LABELS) as TipoContrato[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, tipo: t }))}
                    className={['rounded-lg border p-3 text-sm font-medium transition-colors', form.tipo === t ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-white/[0.08] text-white/50 hover:border-white/20 hover:text-white/70'].join(' ')}
                  >
                    {TIPO_CONTRATO_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-white/50 block mb-2">Inicio da Vigencia <span className="text-rose-400">*</span></label>
                <input
                  type="date"
                  value={form.vigencia_inicio}
                  onChange={e => setForm(f => ({ ...f, vigencia_inicio: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 block mb-2">Fim da Vigencia</label>
                <input
                  type="date"
                  value={form.vigencia_fim}
                  onChange={e => setForm(f => ({ ...f, vigencia_fim: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.renovacao_automatica}
                onChange={e => setForm(f => ({ ...f, renovacao_automatica: e.target.checked }))}
                className="accent-violet-500"
              />
              <span className="text-sm text-white/60">Renovacao automatica ao vencer</span>
            </label>
          </div>
        )}

        {/* ── Etapa 2: Titulares ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Cedente(s) <span className="text-rose-400">*</span></h3>
              <div className="space-y-2">
                {TITULARES_MOCK.map(t => (
                  <button
                    key={t.id}
                    onClick={() => toggleTitular(t.id, 'cedentes')}
                    className={['w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors', form.cedentes.includes(t.id) ? 'border-violet-500 bg-violet-500/10' : 'border-white/[0.08] hover:border-white/20'].join(' ')}
                  >
                    <div className={['w-4 h-4 rounded border flex items-center justify-center flex-shrink-0', form.cedentes.includes(t.id) ? 'bg-violet-600 border-violet-600' : 'border-white/20'].join(' ')}>
                      {form.cedentes.includes(t.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{t.nome}</p>
                      <p className="text-xs text-white/40 capitalize">{t.tipo}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Cessionario(s) <span className="text-rose-400">*</span></h3>
              <div className="space-y-2">
                {TITULARES_MOCK.filter(t => t.tipo === 'editora').map(t => (
                  <button
                    key={t.id}
                    onClick={() => toggleTitular(t.id, 'cessionarios')}
                    className={['w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors', form.cessionarios.includes(t.id) ? 'border-sky-500 bg-sky-500/10' : 'border-white/[0.08] hover:border-white/20'].join(' ')}
                  >
                    <div className={['w-4 h-4 rounded border flex items-center justify-center flex-shrink-0', form.cessionarios.includes(t.id) ? 'bg-sky-600 border-sky-600' : 'border-white/20'].join(' ')}>
                      {form.cessionarios.includes(t.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{t.nome}</p>
                      <p className="text-xs text-white/40 capitalize">{t.tipo}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Etapa 3: Obras ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/70">Selecione as Obras Vinculadas <span className="text-rose-400">*</span></h3>
            <div className="space-y-2">
              {OBRAS_MOCK.map(o => {
                const vinc = form.obras.find(v => v.obra_id === o.id)
                return (
                  <div key={o.id} className={['rounded-lg border transition-colors', vinc ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/[0.08]'].join(' ')}>
                    <button
                      onClick={() => toggleObra(o)}
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      <div className={['w-4 h-4 rounded border flex items-center justify-center flex-shrink-0', vinc ? 'bg-violet-600 border-violet-600' : 'border-white/20'].join(' ')}>
                        {vinc && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">{o.titulo}</p>
                        <p className="text-xs text-white/40 font-mono">{o.codigo}</p>
                      </div>
                    </button>
                    {vinc && (
                      <div className="px-10 pb-3 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-white/40 block mb-1">Percentual (%)</label>
                            <input
                              type="number" min="0" max="100" step="0.01"
                              value={vinc.percentual}
                              onChange={e => updateObra(o.id, 'percentual', e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.08] rounded px-2 py-1 text-sm text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/40 block mb-1">Inicio</label>
                            <input
                              type="date"
                              value={vinc.vigencia_inicio}
                              onChange={e => updateObra(o.id, 'vigencia_inicio', e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.08] rounded px-2 py-1 text-sm text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/40 block mb-1">Fim</label>
                            <input
                              type="date"
                              value={vinc.vigencia_fim}
                              onChange={e => updateObra(o.id, 'vigencia_fim', e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.08] rounded px-2 py-1 text-sm text-white outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-white/40 mb-1">Direitos cedidos</p>
                          <div className="flex flex-wrap gap-2">
                            {(['exec_publica', 'fonomecanico', 'sincronizacao', 'digital'] as DireitoCedido[]).map(d => (
                              <button
                                key={d}
                                onClick={() => toggleDireito(o.id, d)}
                                className={['text-xs px-2 py-0.5 rounded-full border transition-colors', vinc.direitos.includes(d) ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'border-white/10 text-white/30 hover:border-white/20'].join(' ')}
                              >
                                {DIREITO_LABELS[d]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Etapa 4: Revisao ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Contrato</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-white/50">Tipo</span><span className="text-white/80">{form.tipo ? TIPO_CONTRATO_LABELS[form.tipo] : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Vigencia</span><span className="text-white/80">{form.vigencia_inicio || '—'}{form.vigencia_fim ? ' a ' + form.vigencia_fim : ''}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Renovacao auto.</span><span className="text-white/80">{form.renovacao_automatica ? 'Sim' : 'Nao'}</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Obras</h3>
                {form.obras.map(o => (
                  <div key={o.obra_id} className="text-sm">
                    <p className="text-white/70">{o.titulo}</p>
                    <p className="text-xs text-white/40">{o.percentual}% · {o.direitos.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">Clausulas Adicionais</label>
              <textarea
                rows={5}
                value={form.clausulas_extras}
                onChange={e => setForm(f => ({ ...f, clausulas_extras: e.target.value }))}
                placeholder="Digite clausulas extras ou observacoes contratuais..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors resize-none"
              />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-300 font-medium">Pronto para assinar</p>
              <p className="text-xs text-amber-400/70 mt-1">Ao confirmar, o contrato sera criado com status "Aguardando Assinatura" e as partes serao notificadas.</p>
            </div>
          </div>
        )}

        {/* ── Navegacao ── */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> {step === 0 ? 'Cancelar' : 'Voltar'}
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm text-white font-semibold transition-colors"
            >
              Proximo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => router.push('/master/contratos')}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white font-semibold transition-colors"
            >
              <Check className="w-4 h-4" /> Criar Contrato
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
