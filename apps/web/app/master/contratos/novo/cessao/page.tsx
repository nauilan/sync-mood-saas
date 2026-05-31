'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Check, Users, Music, Eye,
  ShieldCheck, AlertTriangle, Info, Building2, User,
  ToggleLeft, ToggleRight, Globe, MapPin, Plus, X,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import {
  DIREITO_CESSAO_LABELS, DIREITO_CESSAO_SIGLA, DIREITO_CESSAO_ICONS,
  TODOS_DIREITOS_CESSAO, SPLIT_PADRAO_BR, SPLIT_PADRAO_EXT,
  TIPO_CESSAO_LABELS, TERRITORIO_LABELS,
} from '@/lib/types-contratos'
import type {
  DireitoCessao, DireitoCessaoItem, SplitTerritorio, Territorio,
  ContratoCessaoDetalhado,
} from '@/lib/types-contratos'
import { MODELOS_CESSAO } from '@/lib/modelos-cessao'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TitularMock {
  id: string
  nome: string
  tipo_pessoa: 'PF' | 'PJ'
  cpf_cnpj: string
  tipo_papel: 'compositor' | 'interprete' | 'editora'
}

interface ObrasMock {
  id: string
  codigo: string
  titulo: string
  percentual_autor: number
}

interface CessaoWizardState {
  // Etapa 1
  titular_id: string
  obras_selecionadas: string[]
  modelo_cessao_id: string

  // Etapa 2
  direitos: DireitoCessaoItem[]

  // Etapa 3
  vigencia_inicio: string
  vigencia_fim: string
  prazo_indeterminado: boolean
  territorio_principal: Territorio
  clausula_reversao: boolean
  prazo_reversao_anos: number
  exclusividade: boolean

  // Etapa 4
  clausulas_extras: string
  confirmado: boolean
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TITULARES: TitularMock[] = [
  { id: 'tit-nau', nome: 'Nauilan Producoes Musicais Ltda', tipo_pessoa: 'PJ', cpf_cnpj: '42.891.330/0001-55', tipo_papel: 'compositor' },
  { id: 'tit-gio', nome: 'Giovani Alves Rodrigues',         tipo_pessoa: 'PF', cpf_cnpj: '123.456.789-00',      tipo_papel: 'compositor' },
  { id: 'tit-mar', nome: 'Marcelo Costa Ferreira',          tipo_pessoa: 'PF', cpf_cnpj: '987.654.321-00',      tipo_papel: 'compositor' },
  { id: 'tit-ana', nome: 'Ana Paula Santos',                tipo_pessoa: 'PF', cpf_cnpj: '456.123.789-00',      tipo_papel: 'compositor' },
]

const OBRAS: ObrasMock[] = [
  { id: 'obra-001', codigo: 'OBR-2025-001', titulo: 'Amor de Bar',             percentual_autor: 100 },
  { id: 'obra-002', codigo: 'OBR-2025-002', titulo: 'Saudade do Interior',     percentual_autor: 100 },
  { id: 'obra-003', codigo: 'OBR-2025-003', titulo: 'Cheiro de Terra Molhada', percentual_autor: 100 },
  { id: 'obra-004', codigo: 'OBR-2025-004', titulo: 'Passarinho do Norte',     percentual_autor: 60  },
  { id: 'obra-005', codigo: 'OBR-2025-005', titulo: 'Estrada da Vida',         percentual_autor: 50  },
  { id: 'obra-006', codigo: 'OBR-2025-006', titulo: 'Tempo de Amar',           percentual_autor: 50  },
]

// ─── Helper: gera direitos do modelo selecionado ──────────────────────────────
function buildDireitosFromModelo(modeloId: string): DireitoCessaoItem[] {
  const modelo = MODELOS_CESSAO.find(m => m.id === modeloId)
  const direitosAtivos = modelo ? modelo.direitos_padrao : TODOS_DIREITOS_CESSAO
  const brSplit = modelo ? modelo.splits_padrao_br : SPLIT_PADRAO_BR
  const extSplit = modelo ? modelo.splits_padrao_ext : SPLIT_PADRAO_EXT

  return TODOS_DIREITOS_CESSAO.map(d => ({
    direito: d,
    ativo: direitosAtivos.includes(d),
    splits: [
      { territorio: 'BR' as Territorio, pct_titular: brSplit.pct_titular, pct_editora: brSplit.pct_editora },
      { territorio: 'EXT' as Territorio, pct_titular: extSplit.pct_titular, pct_editora: extSplit.pct_editora },
    ],
  }))
}

function buildDireitosPadrao(): DireitoCessaoItem[] {
  return TODOS_DIREITOS_CESSAO.map(d => ({
    direito: d,
    ativo: true,
    splits: [
      { territorio: 'BR' as Territorio, pct_titular: 75, pct_editora: 25 },
      { territorio: 'EXT' as Territorio, pct_titular: 50, pct_editora: 50 },
    ],
  }))
}

// ─── Regra de Ouro validation ─────────────────────────────────────────────────
function violaRegraDeOuro(item: DireitoCessaoItem): boolean {
  return item.splits.some(s => s.territorio === 'BR' && s.pct_editora > s.pct_titular)
}

// ─── StepBar ──────────────────────────────────────────────────────────────────
const STEP_LABELS = ['Titular & Obras', 'Direitos Cedidos', 'Vigencia', 'Revisao & Assinar']
const STEP_ICONS = [
  <Users className="w-4 h-4" key="u" />,
  <ShieldCheck className="w-4 h-4" key="s" />,
  <Globe className="w-4 h-4" key="g" />,
  <Eye className="w-4 h-4" key="e" />,
]

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
                done ? 'bg-violet-600 text-white' :
                  active ? 'bg-violet-600/30 border border-violet-500 text-violet-300' :
                    'bg-white/5 border border-white/10 text-white/30',
              ].join(' ')}>
                {done ? <Check className="w-4 h-4" /> : STEP_ICONS[i]}
              </div>
              <span className={['text-xs whitespace-nowrap text-center', active ? 'text-violet-300 font-medium' : done ? 'text-white/50' : 'text-white/25'].join(' ')}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={['flex-1 h-px mx-2 mb-4', done ? 'bg-violet-600/50' : 'bg-white/10'].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── IRRF Badge ───────────────────────────────────────────────────────────────
function IRRFBadge({ tipoPessoa }: { tipoPessoa: 'PF' | 'PJ' | null }) {
  if (!tipoPessoa) return null
  if (tipoPessoa === 'PJ') {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-1 font-semibold">
        <Building2 className="w-3 h-3" />
        PJ — Sem Retencao IRRF
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-1 font-semibold">
      <User className="w-3 h-3" />
      PF — Com Retencao IRRF
    </span>
  )
}

// ─── Regra de Ouro Card ───────────────────────────────────────────────────────
function RegraDeOuroCard({ violations }: { violations: string[] }) {
  return (
    <div className={[
      'rounded-xl border p-4 mb-6',
      violations.length > 0
        ? 'bg-rose-500/8 border-rose-500/30'
        : 'bg-amber-500/8 border-amber-500/20',
    ].join(' ')}>
      <div className="flex items-start gap-3">
        <div className={['w-8 h-8 rounded-full flex items-center justify-center shrink-0', violations.length > 0 ? 'bg-rose-500/20' : 'bg-amber-500/15'].join(' ')}>
          <ShieldCheck className={['w-4 h-4', violations.length > 0 ? 'text-rose-400' : 'text-amber-400'].join(' ')} />
        </div>
        <div>
          <p className={['text-sm font-bold', violations.length > 0 ? 'text-rose-300' : 'text-amber-300'].join(' ')}>
            Regra de Ouro
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            A editora <strong className="text-white/70">NUNCA</strong> fica com mais que o titular em territorio nacional.
          </p>
          {violations.length > 0 && (
            <div className="mt-2 space-y-1">
              {violations.map(v => (
                <p key={v} className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {v}
                </p>
              ))}
            </div>
          )}
          {violations.length === 0 && (
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1.5">
              <Check className="w-3 h-3" /> Todos os direitos respeitam a regra de ouro
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WizardCessaoPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CessaoWizardState>({
    titular_id: '',
    obras_selecionadas: [],
    modelo_cessao_id: '',
    direitos: buildDireitosPadrao(),
    vigencia_inicio: '',
    vigencia_fim: '',
    prazo_indeterminado: false,
    territorio_principal: 'BR',
    clausula_reversao: true,
    prazo_reversao_anos: 3,
    exclusividade: true,
    clausulas_extras: '',
    confirmado: false,
  })

  const titular = TITULARES.find(t => t.id === form.titular_id) ?? null

  // Violations da Regra de Ouro
  const violations = useMemo(() => {
    return form.direitos
      .filter(d => d.ativo && violaRegraDeOuro(d))
      .map(d => `${DIREITO_CESSAO_LABELS[d.direito]}: editora (${form.direitos.find(i => i.direito === d.direito)?.splits.find(s => s.territorio === 'BR')?.pct_editora ?? 0}%) > titular (${form.direitos.find(i => i.direito === d.direito)?.splits.find(s => s.territorio === 'BR')?.pct_titular ?? 0}%)`)
  }, [form.direitos])

  const hasViolations = violations.length > 0

  function selectModelo(modeloId: string) {
    const novos = buildDireitosFromModelo(modeloId)
    setForm(f => ({ ...f, modelo_cessao_id: modeloId, direitos: novos }))
  }

  function toggleObra(id: string) {
    setForm(f => ({
      ...f,
      obras_selecionadas: f.obras_selecionadas.includes(id)
        ? f.obras_selecionadas.filter(x => x !== id)
        : [...f.obras_selecionadas, id],
    }))
  }

  function toggleDireito(d: DireitoCessao) {
    setForm(f => ({
      ...f,
      direitos: f.direitos.map(item =>
        item.direito === d ? { ...item, ativo: !item.ativo } : item
      ),
    }))
  }

  function updateSplit(d: DireitoCessao, territorio: Territorio, field: 'pct_titular' | 'pct_editora', rawVal: string) {
    const val = Math.min(100, Math.max(0, Number(rawVal) || 0))
    const other = field === 'pct_titular' ? 'pct_editora' : 'pct_titular'
    const otherVal = 100 - val
    setForm(f => ({
      ...f,
      direitos: f.direitos.map(item => {
        if (item.direito !== d) return item
        return {
          ...item,
          splits: item.splits.map(s =>
            s.territorio === territorio
              ? { ...s, [field]: val, [other]: otherVal }
              : s
          ),
        }
      }),
    }))
  }

  const canAdvance = () => {
    if (step === 0) return !!form.titular_id && form.obras_selecionadas.length > 0
    if (step === 1) return form.direitos.some(d => d.ativo) && !hasViolations
    if (step === 2) return !!form.vigencia_inicio || form.prazo_indeterminado
    return form.confirmado
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()} className="text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <PageHeader
          title="Novo Contrato de Cessao"
          description={'Etapa ' + (step + 1) + ' de 4 — ' + STEP_LABELS[step]}
        />
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
        <StepBar current={step} />

        {/* ── Etapa 1: Titular & Obras ── */}
        {step === 0 && (
          <div className="space-y-7">
            {/* Modelo pre-pronto */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">
                Modelo de Cessao <span className="text-white/30 font-normal">(opcional)</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setForm(f => ({ ...f, modelo_cessao_id: '', direitos: buildDireitosPadrao() }))}
                  className={['rounded-lg border p-3 text-left transition-colors', !form.modelo_cessao_id ? 'border-violet-500 bg-violet-500/10' : 'border-white/[0.08] hover:border-white/20'].join(' ')}
                >
                  <p className="text-sm font-medium text-white/80">Personalizado</p>
                  <p className="text-xs text-white/40 mt-0.5">Configure cada direito manualmente na proxima etapa</p>
                </button>
                {MODELOS_CESSAO.map(m => (
                  <button
                    key={m.id}
                    onClick={() => selectModelo(m.id)}
                    className={['rounded-lg border p-3 text-left transition-colors', form.modelo_cessao_id === m.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/[0.08] hover:border-white/20'].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white/80">{m.nome}</p>
                      <span className="text-xs bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">{TIPO_CESSAO_LABELS[m.tipo_cessao]}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">{m.descricao}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Titular */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">
                Titular / Cedente <span className="text-rose-400">*</span>
              </h3>
              <div className="space-y-2">
                {TITULARES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setForm(f => ({ ...f, titular_id: t.id }))}
                    className={['w-full flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors', form.titular_id === t.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/[0.08] hover:border-white/20'].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', t.tipo_pessoa === 'PJ' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-sky-500/15 text-sky-400'].join(' ')}>
                        {t.tipo_pessoa === 'PJ' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">{t.nome}</p>
                        <p className="text-xs text-white/40 font-mono">{t.cpf_cnpj}</p>
                      </div>
                    </div>
                    <IRRFBadge tipoPessoa={t.tipo_pessoa} />
                  </button>
                ))}
              </div>
            </div>

            {/* Obras */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">
                Obras a Ceder <span className="text-rose-400">*</span>
              </h3>
              <div className="space-y-2">
                {OBRAS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => toggleObra(o.id)}
                    className={['w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors', form.obras_selecionadas.includes(o.id) ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/[0.08] hover:border-white/20'].join(' ')}
                  >
                    <div className={['w-4 h-4 rounded border flex items-center justify-center shrink-0', form.obras_selecionadas.includes(o.id) ? 'bg-violet-600 border-violet-600' : 'border-white/20'].join(' ')}>
                      {form.obras_selecionadas.includes(o.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/80">{o.titulo}</p>
                      <p className="text-xs text-white/40 font-mono">{o.codigo}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-white/50">
                        {o.percentual_autor < 100 ? `${o.percentual_autor}% do autor` : '100% autoria'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {form.obras_selecionadas.length > 0 && (
                <p className="text-xs text-violet-400 mt-2">{form.obras_selecionadas.length} obra{form.obras_selecionadas.length > 1 ? 's' : ''} selecionada{form.obras_selecionadas.length > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Etapa 2: Direitos Cedidos ── */}
        {step === 1 && (
          <div className="space-y-5">
            <RegraDeOuroCard violations={violations} />

            {/* IRRF indicator */}
            {titular && (
              <div className="flex items-center gap-3 bg-white/[0.02] rounded-lg px-4 py-3 border border-white/[0.05]">
                <Info className="w-4 h-4 text-white/30 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-white/60">Titular: <span className="text-white/80 font-medium">{titular.nome}</span></p>
                </div>
                <IRRFBadge tipoPessoa={titular.tipo_pessoa} />
              </div>
            )}

            <p className="text-xs text-white/40">
              Splits padrao: Brasil 75/25 (titular/editora) · Exterior 50/50. Ajuste individualmente se necessario.
            </p>

            <div className="space-y-3">
              {form.direitos.map((item) => {
                const brSplit = item.splits.find(s => s.territorio === 'BR')
                const extSplit = item.splits.find(s => s.territorio === 'EXT')
                const isViolation = item.ativo && violaRegraDeOuro(item)

                return (
                  <div
                    key={item.direito}
                    className={[
                      'rounded-xl border transition-colors',
                      item.ativo
                        ? isViolation
                          ? 'border-rose-500/40 bg-rose-500/5'
                          : 'border-violet-500/20 bg-violet-500/5'
                        : 'border-white/[0.06] bg-white/[0.01] opacity-50',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <span className="text-lg leading-none shrink-0">
                        {DIREITO_CESSAO_ICONS[item.direito]}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white/80">{DIREITO_CESSAO_LABELS[item.direito]}</p>
                        <p className="text-xs text-white/40 font-mono">{DIREITO_CESSAO_SIGLA[item.direito]}</p>
                      </div>
                      {isViolation && (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <button
                        onClick={() => toggleDireito(item.direito)}
                        className="shrink-0"
                      >
                        {item.ativo
                          ? <ToggleRight className="w-8 h-8 text-violet-400" />
                          : <ToggleLeft className="w-8 h-8 text-white/20" />}
                      </button>
                    </div>

                    {item.ativo && (
                      <div className="px-3 pb-3 grid grid-cols-2 gap-3">
                        {/* Brasil */}
                        <div className="bg-white/[0.03] rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-400">Brasil</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-white/40 block mb-1">Titular %</label>
                              <input
                                type="number" min={0} max={100} step={1}
                                value={brSplit?.pct_titular ?? 75}
                                onChange={e => updateSplit(item.direito, 'BR', 'pct_titular', e.target.value)}
                                className={['w-full text-center rounded px-2 py-1.5 text-sm font-bold outline-none border transition-colors', (brSplit?.pct_editora ?? 25) > (brSplit?.pct_titular ?? 75) ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' : 'border-white/[0.08] bg-white/[0.03] text-white'].join(' ')}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-white/40 block mb-1">Editora %</label>
                              <input
                                type="number" min={0} max={100} step={1}
                                value={brSplit?.pct_editora ?? 25}
                                onChange={e => updateSplit(item.direito, 'BR', 'pct_editora', e.target.value)}
                                className={['w-full text-center rounded px-2 py-1.5 text-sm font-bold outline-none border transition-colors', (brSplit?.pct_editora ?? 25) > (brSplit?.pct_titular ?? 75) ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' : 'border-white/[0.08] bg-white/[0.03] text-white/70'].join(' ')}
                              />
                            </div>
                          </div>
                          {(brSplit?.pct_titular ?? 0) + (brSplit?.pct_editora ?? 0) !== 100 && (
                            <p className="text-[10px] text-amber-400 mt-1">Soma deve ser 100%</p>
                          )}
                        </div>

                        {/* Exterior */}
                        <div className="bg-white/[0.03] rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Globe className="w-3 h-3 text-sky-400" />
                            <span className="text-xs font-semibold text-sky-400">Exterior</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-white/40 block mb-1">Titular %</label>
                              <input
                                type="number" min={0} max={100} step={1}
                                value={extSplit?.pct_titular ?? 50}
                                onChange={e => updateSplit(item.direito, 'EXT', 'pct_titular', e.target.value)}
                                className="w-full text-center rounded px-2 py-1.5 text-sm font-bold text-white bg-white/[0.03] border border-white/[0.08] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-white/40 block mb-1">Editora %</label>
                              <input
                                type="number" min={0} max={100} step={1}
                                value={extSplit?.pct_editora ?? 50}
                                onChange={e => updateSplit(item.direito, 'EXT', 'pct_editora', e.target.value)}
                                className="w-full text-center rounded px-2 py-1.5 text-sm font-bold text-white/70 bg-white/[0.03] border border-white/[0.08] outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Resumo ativo */}
            <div className="flex items-center gap-2 text-xs text-white/40 pt-2 border-t border-white/[0.05]">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
              {form.direitos.filter(d => d.ativo).length} de {TODOS_DIREITOS_CESSAO.length} direitos cedidos
            </div>
          </div>
        )}

        {/* ── Etapa 3: Vigência + Território ── */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Território */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Territorio Principal <span className="text-rose-400">*</span></h3>
              <div className="grid grid-cols-3 gap-2">
                {(['BR', 'EXT', 'MUNDIAL'] as Territorio[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, territorio_principal: t }))}
                    className={['rounded-lg border p-3 text-center transition-colors', form.territorio_principal === t ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-white/[0.08] text-white/50 hover:border-white/20'].join(' ')}
                  >
                    <p className="text-sm font-semibold">{t}</p>
                    <p className="text-xs text-white/40 mt-0.5">{TERRITORIO_LABELS[t]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Vigência */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Vigencia</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-white/50 block mb-2">Data de Inicio <span className="text-rose-400">*</span></label>
                  <input
                    type="date"
                    value={form.vigencia_inicio}
                    disabled={form.prazo_indeterminado}
                    onChange={e => setForm(f => ({ ...f, vigencia_inicio: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 disabled:opacity-30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 block mb-2">Data de Fim</label>
                  <input
                    type="date"
                    value={form.vigencia_fim}
                    disabled={form.prazo_indeterminado}
                    onChange={e => setForm(f => ({ ...f, vigencia_fim: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 disabled:opacity-30"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={form.prazo_indeterminado}
                  onChange={e => setForm(f => ({ ...f, prazo_indeterminado: e.target.checked, vigencia_inicio: e.target.checked ? 'indeterminado' : '', vigencia_fim: '' }))}
                  className="accent-violet-500"
                />
                <span className="text-sm text-white/60">Prazo indeterminado</span>
              </label>
            </div>

            {/* Exclusividade */}
            <div className="flex items-center justify-between bg-white/[0.02] rounded-lg px-4 py-3 border border-white/[0.05]">
              <div>
                <p className="text-sm font-medium text-white/80">Exclusividade</p>
                <p className="text-xs text-white/40 mt-0.5">O titular nao podera ceder os mesmos direitos a terceiros durante a vigencia</p>
              </div>
              <button onClick={() => setForm(f => ({ ...f, exclusividade: !f.exclusividade }))}>
                {form.exclusividade
                  ? <ToggleRight className="w-8 h-8 text-violet-400" />
                  : <ToggleLeft className="w-8 h-8 text-white/20" />}
              </button>
            </div>

            {/* Cláusula de reversão */}
            <div>
              <div className="flex items-center justify-between bg-white/[0.02] rounded-lg px-4 py-3 border border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium text-white/80">Clausula de Reversao</p>
                  <p className="text-xs text-white/40 mt-0.5">Direitos revertem ao titular se a editora nao explorar as obras por X anos</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, clausula_reversao: !f.clausula_reversao }))}>
                  {form.clausula_reversao
                    ? <ToggleRight className="w-8 h-8 text-violet-400" />
                    : <ToggleLeft className="w-8 h-8 text-white/20" />}
                </button>
              </div>
              {form.clausula_reversao && (
                <div className="mt-3 px-4">
                  <label className="text-xs text-white/50 block mb-2">Prazo de Reversao (anos)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 5, 7].map(n => (
                      <button
                        key={n}
                        onClick={() => setForm(f => ({ ...f, prazo_reversao_anos: n }))}
                        className={['w-12 h-10 rounded-lg border text-sm font-semibold transition-colors', form.prazo_reversao_anos === n ? 'bg-violet-600 border-violet-500 text-white' : 'border-white/[0.08] text-white/50 hover:border-white/20'].join(' ')}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="text-xs text-white/40">anos</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Etapa 4: Revisão & Assinar ── */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Titular */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Cedente</h4>
                {titular ? (
                  <div className="flex items-center gap-3">
                    <div className={['w-10 h-10 rounded-full flex items-center justify-center shrink-0', titular.tipo_pessoa === 'PJ' ? 'bg-emerald-500/15' : 'bg-sky-500/15'].join(' ')}>
                      {titular.tipo_pessoa === 'PJ' ? <Building2 className="w-5 h-5 text-emerald-400" /> : <User className="w-5 h-5 text-sky-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{titular.nome}</p>
                      <p className="text-xs text-white/40 font-mono">{titular.cpf_cnpj}</p>
                      <div className="mt-1"><IRRFBadge tipoPessoa={titular.tipo_pessoa} /></div>
                    </div>
                  </div>
                ) : <p className="text-sm text-white/30">Nao selecionado</p>}
              </div>

              {/* Obras */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
                  Obras ({form.obras_selecionadas.length})
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {form.obras_selecionadas.map(id => {
                    const o = OBRAS.find(o => o.id === id)
                    return o ? (
                      <div key={id} className="flex items-center gap-2">
                        <Music className="w-3 h-3 text-violet-400 shrink-0" />
                        <p className="text-sm text-white/70 truncate">{o.titulo}</p>
                      </div>
                    ) : null
                  })}
                </div>
              </div>

              {/* Direitos */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
                  Direitos Cedidos ({form.direitos.filter(d => d.ativo).length}/8)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {form.direitos.filter(d => d.ativo).map(d => (
                    <span key={d.direito} className="text-xs bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full font-mono">
                      {DIREITO_CESSAO_SIGLA[d.direito]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Vigência */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Vigencia & Condicoes</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Territorio</span>
                    <span className="text-white/70">{TERRITORIO_LABELS[form.territorio_principal]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Inicio</span>
                    <span className="text-white/70">{form.prazo_indeterminado ? 'Indeterminado' : form.vigencia_inicio || '—'}</span>
                  </div>
                  {form.vigencia_fim && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Fim</span>
                      <span className="text-white/70">{form.vigencia_fim}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/40">Exclusividade</span>
                    <span className={form.exclusividade ? 'text-violet-400' : 'text-white/40'}>{form.exclusividade ? 'Sim' : 'Nao'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Clausula reversao</span>
                    <span className={form.clausula_reversao ? 'text-violet-400' : 'text-white/40'}>
                      {form.clausula_reversao ? `${form.prazo_reversao_anos} anos` : 'Nao'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Splits resumo */}
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]">
              <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Regra de Ouro — Splits por Direito</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/30 border-b border-white/[0.05]">
                      <th className="text-left py-2 pr-4">Direito</th>
                      <th className="text-center py-2 px-3">BR Titular</th>
                      <th className="text-center py-2 px-3">BR Editora</th>
                      <th className="text-center py-2 px-3">EXT Titular</th>
                      <th className="text-center py-2 px-3">EXT Editora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {form.direitos.filter(d => d.ativo).map(item => {
                      const br = item.splits.find(s => s.territorio === 'BR')
                      const ext = item.splits.find(s => s.territorio === 'EXT')
                      return (
                        <tr key={item.direito}>
                          <td className="py-2 pr-4 text-white/60 font-mono">{DIREITO_CESSAO_SIGLA[item.direito]}</td>
                          <td className="text-center py-2 px-3 text-emerald-400 font-semibold">{br?.pct_titular ?? 75}%</td>
                          <td className="text-center py-2 px-3 text-white/50">{br?.pct_editora ?? 25}%</td>
                          <td className="text-center py-2 px-3 text-sky-400 font-semibold">{ext?.pct_titular ?? 50}%</td>
                          <td className="text-center py-2 px-3 text-white/50">{ext?.pct_editora ?? 50}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cláusulas extras */}
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">Clausulas Adicionais</label>
              <textarea
                rows={4}
                value={form.clausulas_extras}
                onChange={e => setForm(f => ({ ...f, clausulas_extras: e.target.value }))}
                placeholder="Digite clausulas extras ou observacoes contratuais..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors resize-none"
              />
            </div>

            {/* Confirmação */}
            <label className="flex items-start gap-3 cursor-pointer bg-white/[0.02] rounded-lg p-4 border border-white/[0.06] hover:border-white/10 transition-colors">
              <input
                type="checkbox"
                checked={form.confirmado}
                onChange={e => setForm(f => ({ ...f, confirmado: e.target.checked }))}
                className="accent-violet-500 mt-0.5"
              />
              <div>
                <p className="text-sm text-white/80 font-medium">Confirmo as informacoes acima</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Ao confirmar, o contrato sera criado com status "Aguardando Assinatura" e ambas as partes serao notificadas para assinar.
                </p>
              </div>
            </label>

            <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-4 py-3">
              <p className="text-xs text-amber-400/80">
                O contrato so entra em vigor apos assinatura de ambas as partes. Obras vinculadas ficarao no status "Aguardando Contrato" ate a conclusao.
              </p>
            </div>
          </div>
        )}

        {/* Navegação */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> {step === 0 ? 'Cancelar' : 'Voltar'}
          </button>

          {step < 3 ? (
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
              disabled={!canAdvance()}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm text-white font-semibold transition-colors"
            >
              <Check className="w-4 h-4" /> Criar Contrato
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
