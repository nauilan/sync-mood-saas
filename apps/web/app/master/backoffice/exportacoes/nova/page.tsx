'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  Globe, Database, Globe2, FileText, ArrowLeft, ArrowRight,
  CheckCircle2, Search, Upload
} from 'lucide-react'
import { OBRAS_DISPONIVEIS_EXPORTACAO, CWR_PREVIEW_LINES } from '@/lib/mock-exportacao'
import { FORMATO_EXPORTACAO_LABELS, DESTINO_EXPORTACAO_LABELS } from '@/lib/types-exportacao'
import type { DestinoExportacao, FormatoExportacao } from '@/lib/types-exportacao'

const TOTAL_STEPS = 5

const STEP_LABELS = [
  'Destino & Formato',
  'Período',
  'Seleção de Obras',
  'Preview CWR',
  'Confirmar',
]

const DESTINO_OPTIONS: Array<{
  value: DestinoExportacao
  label: string
  description: string
  icon: React.ElementType
  accent: string
  border: string
  iconBg: string
}> = [
  {
    value: 'socinpro',
    label: 'SOCINPRO',
    description: 'Registro e cobrança de direitos autorais',
    icon: Globe,
    accent: 'text-violet-300',
    border: 'border-violet-500/40',
    iconBg: 'bg-violet-500/15',
  },
  {
    value: 'backoffice_music_services',
    label: 'BackOffice Music Services',
    description: 'Distribuição para DSPs via catálogo digital',
    icon: Database,
    accent: 'text-sky-300',
    border: 'border-sky-500/40',
    iconBg: 'bg-sky-500/15',
  },
  {
    value: 'parceiro_internacional',
    label: 'Parceiro Internacional',
    description: 'Exportação para parceiros e sub-editoras',
    icon: Globe2,
    accent: 'text-amber-300',
    border: 'border-amber-500/40',
    iconBg: 'bg-amber-500/15',
  },
]

const FORMATO_OPTIONS: Array<{ value: FormatoExportacao; desc: string }> = [
  { value: 'cwr_v21', desc: 'Versão legada CWR — compatível com sistemas mais antigos e algumas ARDs regionais' },
  { value: 'cwr_v22', desc: 'Padrão CWR — compatível com SOCINPRO e maioria das ARDs' },
  { value: 'cwr_v30', desc: 'Versão mais recente do protocolo CWR com suporte a ISWC v2' },
  { value: 'xml',     desc: 'XML genérico para integrações customizadas' },
  { value: 'csv',     desc: 'Planilha CSV — ideal para parceiros sem suporte a CWR' },
  { value: 'xlsx',    desc: 'Excel — relatório visual para revisão manual' },
]

interface WizardState {
  destino: DestinoExportacao | ''
  formato: FormatoExportacao
  periodo_inicio: string
  periodo_fim: string
  observacoes: string
  obras_selecionadas: string[]
}

export default function NovaExportacaoPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [obraSearch, setObraSearch] = useState('')

  const [form, setForm] = useState<WizardState>({
    destino: '',
    formato: 'cwr_v22',
    periodo_inicio: '',
    periodo_fim: '',
    observacoes: '',
    obras_selecionadas: [],
  })

  // ── Step 3 filtered obras ──────────────────────────────────────────────────
  const obrasFiltradas = useMemo(() => {
    if (!obraSearch) return OBRAS_DISPONIVEIS_EXPORTACAO
    const q = obraSearch.toLowerCase()
    return OBRAS_DISPONIVEIS_EXPORTACAO.filter(
      o => o.titulo.toLowerCase().includes(q) || o.codigo.toLowerCase().includes(q)
    )
  }, [obraSearch])

  const toggleObra = (id: string) => {
    setForm(prev => ({
      ...prev,
      obras_selecionadas: prev.obras_selecionadas.includes(id)
        ? prev.obras_selecionadas.filter(x => x !== id)
        : [...prev.obras_selecionadas, id],
    }))
  }

  const toggleAll = () => {
    const allIds = OBRAS_DISPONIVEIS_EXPORTACAO.map(o => o.id)
    const allSelected = allIds.every(id => form.obras_selecionadas.includes(id))
    setForm(prev => ({
      ...prev,
      obras_selecionadas: allSelected ? [] : allIds,
    }))
  }

  // ── Step validation ────────────────────────────────────────────────────────
  const canProceed = useMemo(() => {
    if (step === 1) return form.destino !== ''
    if (step === 2) return form.periodo_inicio !== '' && form.periodo_fim !== ''
    if (step === 3) return form.obras_selecionadas.length > 0
    return true
  }, [step, form])

  // ── Confirm & generate ────────────────────────────────────────────────────
  const handleConfirm = () => {
    setShowSuccess(true)
    setTimeout(() => {
      router.push('/master/backoffice/exportacoes')
    }, 2000)
  }

  // ── Preview stats ─────────────────────────────────────────────────────────
  const previewStats = useMemo(() => {
    const obras = OBRAS_DISPONIVEIS_EXPORTACAO.filter(o => form.obras_selecionadas.includes(o.id))
    const totalTitulares = obras.reduce((acc, o) => acc + o.titulares, 0)
    return { obras: obras.length, titulares: totalTitulares, linhas: CWR_PREVIEW_LINES.length }
  }, [form.obras_selecionadas])

  const inputCls = 'w-full h-9 bg-white/5 border border-white/[0.06] rounded-lg px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50'

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {showSuccess && (
        <div className="fixed inset-x-0 top-4 flex justify-center z-50 px-4">
          <div className="flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-5 py-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300 font-semibold">Exportação gerada com sucesso! Redirecionando…</p>
          </div>
        </div>
      )}

      <PageHeader
        title="Nova Exportação"
        description="Configure e gere um novo arquivo de exportação de obras musicais."
      />

      {/* Step indicator */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl px-5 py-4">
        <div className="flex items-center gap-0">
          {STEP_LABELS.map((label, idx) => {
            const n = idx + 1
            const active = n === step
            const done = n < step
            return (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    done   ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : active ? 'bg-violet-600 text-white'
                    : 'bg-white/[0.05] text-white/30 border border-white/[0.06]'
                  }`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : n}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-white/30'}`}>
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 transition-colors ${done ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">

        {/* ── STEP 1: Destino + Formato ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-white mb-1">Destino da Exportação</h2>
              <p className="text-xs text-white/40 mb-4">Selecione para qual entidade esta exportação será enviada.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DESTINO_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const selected = form.destino === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, destino: opt.value }))}
                      className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-all ${
                        selected
                          ? `${opt.border} bg-white/[0.04]`
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`${opt.iconBg} rounded-lg p-2 w-fit`}>
                        <Icon className={`w-5 h-5 ${opt.accent}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${selected ? opt.accent : 'text-white/70'}`}>{opt.label}</p>
                        <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{opt.description}</p>
                      </div>
                      {selected && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-semibold">Selecionado</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white mb-1">Formato do Arquivo</h2>
              <p className="text-xs text-white/40 mb-4">Escolha o formato de saída do arquivo gerado.</p>
              <div className="space-y-2">
                {FORMATO_OPTIONS.map(opt => {
                  const selected = form.formato === opt.value
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selected
                          ? 'border-violet-500/40 bg-violet-500/[0.06]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="formato"
                        value={opt.value}
                        checked={selected}
                        onChange={() => setForm(prev => ({ ...prev, formato: opt.value }))}
                        className="accent-violet-500 w-3.5 h-3.5 shrink-0"
                      />
                      <div className="flex-1">
                        <span className={`text-sm font-semibold ${selected ? 'text-violet-300' : 'text-white/70'}`}>
                          {FORMATO_EXPORTACAO_LABELS[opt.value]}
                        </span>
                        <p className="text-[11px] text-white/35 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Período ── */}
        {step === 2 && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h2 className="text-sm font-semibold text-white mb-1">Período de Referência</h2>
              <p className="text-xs text-white/40 mb-4">Defina o intervalo de datas que esta exportação cobre.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 font-medium">Data de Início</label>
                <input
                  type="date"
                  value={form.periodo_inicio}
                  onChange={e => setForm(prev => ({ ...prev, periodo_inicio: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 font-medium">Data de Fim</label>
                <input
                  type="date"
                  value={form.periodo_fim}
                  onChange={e => setForm(prev => ({ ...prev, periodo_fim: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/50 font-medium">Observações <span className="text-white/25">(opcional)</span></label>
              <textarea
                value={form.observacoes}
                onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Adicione notas ou observações sobre esta exportação…"
                rows={4}
                className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 resize-none"
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Seleção de Obras ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-white">Seleção de Obras</h2>
                <p className="text-xs text-white/40 mt-0.5">Escolha quais obras serão incluídas nesta exportação.</p>
              </div>
              <span className="text-xs text-violet-300 font-semibold bg-violet-500/10 border border-violet-500/30 px-3 py-1 rounded-full">
                {form.obras_selecionadas.length} obra{form.obras_selecionadas.length !== 1 ? 's' : ''} selecionada{form.obras_selecionadas.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white/5 border border-white/[0.06] rounded-lg px-3 h-9">
              <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por título ou código…"
                value={obraSearch}
                onChange={e => setObraSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
              />
            </div>

            <div className="border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-2.5 w-10">
                      <input
                        type="checkbox"
                        checked={OBRAS_DISPONIVEIS_EXPORTACAO.every(o => form.obras_selecionadas.includes(o.id))}
                        onChange={toggleAll}
                        className="accent-violet-500 w-3.5 h-3.5"
                      />
                    </th>
                    <th className="text-left text-xs font-semibold text-white/30 px-4 py-2.5">Código</th>
                    <th className="text-left text-xs font-semibold text-white/30 px-4 py-2.5">Título</th>
                    <th className="text-left text-xs font-semibold text-white/30 px-4 py-2.5">Gênero</th>
                    <th className="text-left text-xs font-semibold text-white/30 px-4 py-2.5">ISWC</th>
                    <th className="text-right text-xs font-semibold text-white/30 px-4 py-2.5">Titulares</th>
                    <th className="text-right text-xs font-semibold text-white/30 px-4 py-2.5 pr-5">% Controlado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {obrasFiltradas.map(o => {
                    const checked = form.obras_selecionadas.includes(o.id)
                    return (
                      <tr
                        key={o.id}
                        onClick={() => toggleObra(o.id)}
                        className={`cursor-pointer transition-colors ${checked ? 'bg-violet-500/[0.04]' : 'hover:bg-white/[0.02]'}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleObra(o.id)}
                            onClick={e => e.stopPropagation()}
                            className="accent-violet-500 w-3.5 h-3.5"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-white/50">{o.codigo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white/80 font-medium">{o.titulo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-white/45">{o.genero}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-white/45">
                            {o.iswc ?? <span className="text-amber-400/70 italic">Pendente</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs tabular-nums text-white/60">{o.titulares}</span>
                        </td>
                        <td className="px-4 py-3 pr-5 text-right">
                          <span className="text-xs tabular-nums text-emerald-400/80">{o.percentual_controlado.toFixed(1)}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── STEP 4: Preview CWR ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white mb-1">Preview do Arquivo CWR</h2>
              <p className="text-xs text-white/40 mb-4">Revisão das primeiras linhas do arquivo a ser gerado.</p>
            </div>

            {/* File stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Linhas',     value: previewStats.linhas    },
                { label: 'Obras',      value: previewStats.obras     },
                { label: 'Titulares',  value: previewStats.titulares },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-violet-300 tabular-nums">{s.value}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* CWR code block */}
            <div className="bg-[#060d1a] border border-white/[0.06] rounded-xl p-4 overflow-x-auto">
              <pre className="font-mono text-xs text-emerald-400/90 leading-relaxed whitespace-pre">
                {CWR_PREVIEW_LINES.join('\n')}
              </pre>
            </div>

            <p className="text-[10px] text-white/25 italic">
              * Preview simulado — o arquivo final será gerado com os dados reais das obras selecionadas.
            </p>
          </div>
        )}

        {/* ── STEP 5: Confirmar ── */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-white mb-1">Confirmar e Gerar</h2>
              <p className="text-xs text-white/40 mb-4">Revise as configurações antes de gerar o arquivo.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Destino',   value: form.destino ? DESTINO_EXPORTACAO_LABELS[form.destino as DestinoExportacao] : '—' },
                { label: 'Formato',   value: FORMATO_EXPORTACAO_LABELS[form.formato] },
                { label: 'Início',    value: form.periodo_inicio || '—' },
                { label: 'Fim',       value: form.periodo_fim    || '—' },
                { label: 'Obras',     value: `${form.obras_selecionadas.length} selecionadas` },
                { label: 'Observações', value: form.observacoes || '—' },
              ].map(item => (
                <div key={item.label} className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">{item.label}</p>
                  <p className="text-sm text-white/80 font-medium mt-1 break-words">{item.value}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-2 h-10 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white font-semibold transition-colors mt-2"
            >
              <Upload className="w-4 h-4" />
              Confirmar e Gerar Arquivo
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-sm text-white/60 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {step < TOTAL_STEPS && (
          <button
            type="button"
            onClick={() => setStep(s => Math.min(TOTAL_STEPS, s + 1))}
            disabled={!canProceed}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próximo <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
