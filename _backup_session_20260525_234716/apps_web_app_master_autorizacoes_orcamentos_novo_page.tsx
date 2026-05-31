'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Check, Music2, User, FileEdit,
  Calendar, DollarSign, Building2, ClipboardList, Tv2, Megaphone,
  BookOpen, Layers, Shuffle, Banknote, Smartphone, ArrowLeftRight,
  CreditCard, Calculator, Info, ArrowRight,
} from 'lucide-react'
import { useWizardSmartScroll } from '@/hooks/use-wizard-smart-scroll'
import { MOCK_OBRAS, getLinksById, calcularPercentualControlado } from '@/lib/mock-obras'
import { MOCK_TITULARES } from '@/lib/mock-cadastros'
import {
  calcValorAudiovisual,
  PRECIFICACAO_BASE_SINC,
  FATOR_MEIO,
  STATUS_ORCAMENTO_LABELS,
} from '@/lib/types-orcamentos'
import { TIPO_AUTORIZACAO_LABELS } from '@/lib/types-autorizacoes'

// ── helpers ───────────────────────────────────────────────────────────────────
type TipoAut = 'fonograma' | 'sincronizacao' | 'publicidade' | 'tv' | 'edicao_grafica' | 'incidental' | 'versao'

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

function addDias(base: string, dias: number): string {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

// ── TitularLookup ─────────────────────────────────────────────────────────────
type TS = { nome: string; cpf_cnpj: string; endereco: string; cep: string; cidade_uf: string; email: string }

function extrairTitular(t: any): TS {
  const isPJ = t.tipo_pessoa === 'PJ'
  const nome = isPJ ? (t._pj?.razao_social ?? t.nome ?? '') : (t._pf?.nome_completo ?? t.nome ?? '')
  const cpf_cnpj = isPJ ? (t._pj?.cnpj ?? '') : (t._pf?.cpf ?? '')
  const end = t._enderecos?.find((e: any) => e.principal) ?? t._enderecos?.[0]
  const endereco = end ? `${end.logradouro ?? ''}, ${end.numero ?? ''}${end.complemento ? ' ' + end.complemento : ''}`.trim().replace(/^,\s*/, '') : ''
  const cep = end?.cep ?? ''
  const cidade_uf = end ? `${end.cidade ?? ''} / ${end.uf ?? ''}` : ''
  const emailC = (t._contatos as any[])?.find((c: any) => c.tipo === 'email')
  const email = emailC?.valor ?? ''
  return { nome, cpf_cnpj, endereco, cep, cidade_uf, email }
}

function TitularLookup({ label, value, onChange, onSelect, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  onSelect?: (t: TS) => void; hint?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const resultados = useMemo(() => {
    if (!value || value.length < 2) return []
    const q = value.toLowerCase()
    return MOCK_TITULARES.filter(t => {
      const n = t.tipo_pessoa === 'PJ' ? (t._pj?.razao_social ?? '') : (t._pf?.nome_completo ?? '')
      return n.toLowerCase().includes(q)
    }).slice(0, 6)
  }, [value])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const ic = 'w-full h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50'
  return (
    <div ref={ref} className="relative col-span-1">
      <label className="block text-xs text-white/40 mb-1">{label}</label>
      <input type="text" value={value} onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)} className={ic} placeholder="Digite para buscar..." autoComplete="off" />
      {hint && <p className="text-[10px] text-violet-400/60 mt-0.5">{hint}</p>}
      {open && resultados.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#111c33] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
          {resultados.map(t => {
            const n = t.tipo_pessoa === 'PJ' ? (t._pj?.razao_social ?? '') : (t._pf?.nome_completo ?? '')
            return (
              <button key={t.id} type="button"
                onMouseDown={e => { e.preventDefault(); const ts = extrairTitular(t); onChange(ts.nome); onSelect?.(ts); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-violet-600/20 transition-colors flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <div>
                  <p className="text-sm text-white/80">{n}</p>
                  <p className="text-[10px] text-white/35">{t.tipo_pessoa === 'PJ' ? 'PJ' : 'PF'} · {t._pf?.cpf ?? t._pj?.cnpj ?? ''}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── sub-componentes ───────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-white/40">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}
function BoolField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${value ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/[0.06] text-white/40 hover:border-white/20'}`}>
      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${value ? 'border-violet-400 bg-violet-500' : 'border-white/30'}`}>
        {value && <Check className="w-2 h-2 text-white" />}
      </div>
      {label}
    </button>
  )
}
function MultiSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const ic = 'h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50'
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-white/40">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => {
          const sel = value.includes(o)
          return (
            <button key={o} type="button" onClick={() => onChange(sel ? value.filter(x => x !== o) : [...value, o])}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${sel ? 'bg-violet-600/30 border-violet-500/50 text-violet-300' : 'bg-white/5 border-white/[0.06] text-white/40 hover:border-white/20'}`}>
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const ic = 'w-full h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50'
const sel = ic + ' cursor-pointer'

// ── helper autores de obra ───────────────────────────────────────────────────
function getAutoresObra(obraId: string): { todos: string[]; controlados: string[]; pctControlado: number } {
  const links = getLinksById(obraId)
  const allTits = links.flatMap(l => l.titulares ?? [])
  const todos = [...new Set(allTits.map(t => t.nome))]
  const controlados = [...new Set(allTits.filter(t => t.controlado).map(t => t.nome))]
  const pctControlado = calcularPercentualControlado(obraId)
  return { todos, controlados, pctControlado }
}


function CalculadoraAudiovisual({ dados, percentualControle, onAplicar }: {
  dados: any
  percentualControle: number
  onAplicar: (valor: number) => void
}) {
  const resultado = useMemo(() => calcValorAudiovisual({
    tipoSincronizacao: dados.tipo_sincronizacao,
    meioUtilizacao:    dados.meio_utilizacao,
    territorio:        dados.territorio ?? ['Brasil'],
    periodoLicencaDias: dados.periodo_licenca_dias ?? 365,
    percentualControle,
    exclusividade:         !!dados.exclusividade_segmento,
    participacaoFestivais: !!dados.participacao_festivais,
  }), [dados, percentualControle])

  const semBase = !dados.tipo_sincronizacao || !dados.meio_utilizacao

  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-emerald-400">Precificacao Automatica — Sincronizacao Audiovisual</span>
      </div>
      {semBase ? (
        <p className="text-xs text-white/30">Selecione o tipo de sincronizacao e o meio de utilizacao para calcular.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {resultado.detalhamento.map((d, i) => (
              <p key={i} className="text-[11px] text-white/50 font-mono">{d}</p>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20">
            <div>
              <p className="text-xs text-white/40">Valor sugerido</p>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">{fmtBRL(resultado.valorSugerido)}</p>
            </div>
            <button type="button" onClick={() => onAplicar(resultado.valorSugerido)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/30 text-xs text-emerald-300 font-semibold transition-colors">
              Aplicar ao Orcamento <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Tipo',    icon: FileEdit },
  { id: 2, label: 'Obra',    icon: Music2 },
  { id: 3, label: 'Dados',   icon: User },
  { id: 4, label: 'Periodo', icon: Calendar },
  { id: 5, label: 'Valor',   icon: DollarSign },
  { id: 6, label: 'Revisao', icon: ClipboardList },
]

const TIPOS: { key: TipoAut; label: string; desc: string; icon: React.ElementType }[] = [
  { key: 'fonograma',     label: 'Fonograma / Videofonograma', desc: 'Gravacao, streaming, DVD, clipes', icon: Music2 },
  { key: 'sincronizacao', label: 'Sincronizacao Audiovisual',  desc: 'Filmes, series, novelas, documentarios', icon: Tv2 },
  { key: 'publicidade',   label: 'Publicidade',                desc: 'Campanhas publicitarias, anuncios', icon: Megaphone },
  { key: 'tv',            label: 'Uso em TV',                  desc: 'Canais de televisao — valores por tabela', icon: Tv2 },
  { key: 'edicao_grafica',label: 'Edicao Grafica',             desc: 'Letra, cifra, songbook, partitura', icon: BookOpen },
  { key: 'incidental',    label: 'Uso Incidental',             desc: 'Uso nao intencional em producao', icon: Layers },
  { key: 'versao',        label: 'Versao',                     desc: 'Traducao ou adaptacao de letra', icon: Shuffle },
]

// ── Formularios especificos (iguais ao wizard de autorizacao) ──────────────────
function FormFonograma({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  function fill(t: TS) { set('produtor_nome', t.nome); set('produtor_cpf_cnpj', t.cpf_cnpj); set('produtor_endereco', t.endereco); set('produtor_cep', t.cep); set('produtor_cidade_uf', t.cidade_uf); set('produtor_email', t.email) }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TitularLookup label="Produtor Fonografico / Razao Social" value={data.produtor_nome || ''} onChange={v => set('produtor_nome', v)} onSelect={fill} hint="Selecione para preencher automaticamente" />
        <Field label="CPF / CNPJ"><input type="text" value={data.produtor_cpf_cnpj || ''} onChange={e => set('produtor_cpf_cnpj', e.target.value)} className={ic} /></Field>
        <Field label="Endereco"><input type="text" value={data.produtor_endereco || ''} onChange={e => set('produtor_endereco', e.target.value)} className={ic} /></Field>
        <Field label="CEP"><input type="text" value={data.produtor_cep || ''} onChange={e => set('produtor_cep', e.target.value)} className={ic} /></Field>
        <Field label="Cidade / UF"><input type="text" value={data.produtor_cidade_uf || ''} onChange={e => set('produtor_cidade_uf', e.target.value)} className={ic} /></Field>
        <Field label="E-mail"><input type="email" value={data.produtor_email || ''} onChange={e => set('produtor_email', e.target.value)} className={ic} /></Field>
        <Field label="Distribuidora"><input type="text" value={data.distribuidora || ''} onChange={e => set('distribuidora', e.target.value)} className={ic} /></Field>
      </div>
      <MultiSelect label="Plataformas" options={['Spotify','Apple Music','Amazon Music','YouTube','Deezer','Tidal','Redes Sociais','Download Digital','DVD/Blu-ray']} value={data.plataformas || []} onChange={v => set('plataformas', v)} />
    </div>
  )
}

function FormSincronizacao({ data, set, percentualControle, onValorCalculado }: {
  data: any; set: (k: string, v: any) => void; percentualControle: number; onValorCalculado: (v: number) => void
}) {
  function fill(t: TS) { set('razao_social', t.nome); set('cnpj', t.cpf_cnpj); set('endereco', t.endereco); set('cep', t.cep); set('cidade_uf', t.cidade_uf) }
  return (
    <div className="space-y-4">
      <CalculadoraAudiovisual dados={data} percentualControle={percentualControle} onAplicar={onValorCalculado} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TitularLookup label="Agencia / Produtora" value={data.agencia_produtora || ''} onChange={v => set('agencia_produtora', v)} onSelect={t => { set('agencia_produtora', t.nome); fill(t) }} hint="Selecione para preencher automaticamente" />
        <TitularLookup label="Cliente" value={data.cliente || ''} onChange={v => set('cliente', v)} onSelect={t => { set('cliente', t.nome); fill(t) }} hint="Selecione para preencher automaticamente" />
        <Field label="Razao Social"><input type="text" value={data.razao_social || ''} onChange={e => set('razao_social', e.target.value)} className={ic} /></Field>
        <Field label="CNPJ / CPF"><input type="text" value={data.cnpj || ''} onChange={e => set('cnpj', e.target.value)} className={ic} /></Field>
        <Field label="Endereco"><input type="text" value={data.endereco || ''} onChange={e => set('endereco', e.target.value)} className={ic} /></Field>
        <Field label="CEP"><input type="text" value={data.cep || ''} onChange={e => set('cep', e.target.value)} className={ic} /></Field>
        <Field label="Cidade / UF"><input type="text" value={data.cidade_uf || ''} onChange={e => set('cidade_uf', e.target.value)} className={ic} /></Field>
        <Field label="Meio de Utilizacao">
          <select value={data.meio_utilizacao || ''} onChange={e => set('meio_utilizacao', e.target.value)} className={sel}>
            <option value="">Selecione...</option>
            {Object.keys(FATOR_MEIO).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Tipo de Sincronizacao">
          <select value={data.tipo_sincronizacao || ''} onChange={e => set('tipo_sincronizacao', e.target.value)} className={sel}>
            <option value="">Selecione...</option>
            {Object.keys(PRECIFICACAO_BASE_SINC).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Tempo de Utilizacao (min:seg)"><input type="text" value={data.tempo_utilizacao || ''} onChange={e => set('tempo_utilizacao', e.target.value)} placeholder="00:01:30" className={ic} /></Field>
        <Field label="Previsao de Lancamento"><input type="date" value={data.previsao_lancamento || ''} onChange={e => set('previsao_lancamento', e.target.value)} className={ic} /></Field>
        <Field label="Periodo de Licenca (dias)"><input type="number" value={data.periodo_licenca_dias || ''} onChange={e => set('periodo_licenca_dias', parseInt(e.target.value))} placeholder="365" className={ic} /></Field>
        <Field label="Qtd. Utilizacoes"><input type="number" value={data.qtd_utilizacoes || ''} onChange={e => set('qtd_utilizacoes', parseInt(e.target.value))} className={ic} /></Field>
      </div>
      <MultiSelect label="Territorio" options={['Brasil','America Latina','Estados Unidos','Europa','Portugal','Mundial']} value={data.territorio || ['Brasil']} onChange={v => set('territorio', v)} />
      <Field label="Descricao / Contexto do Uso"><textarea rows={3} value={data.descricao_uso || ''} onChange={e => set('descricao_uso', e.target.value)} placeholder="Descreva como a obra sera usada..." className={ic + ' h-auto py-2 resize-none'} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <BoolField label="Exclusividade no Segmento" value={!!data.exclusividade_segmento} onChange={v => set('exclusividade_segmento', v)} />
        <BoolField label="Alteracao da letra ou obra" value={!!data.alteracao_letra} onChange={v => set('alteracao_letra', v)} />
        <BoolField label="Remix / adaptacao" value={!!data.remix_adaptacao} onChange={v => set('remix_adaptacao', v)} />
        <BoolField label="Participacao em festivais" value={!!data.participacao_festivais} onChange={v => set('participacao_festivais', v)} />
      </div>
    </div>
  )
}

function FormPublicidade({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  function fill(t: TS) { set('razao_social', t.nome); set('cnpj', t.cpf_cnpj); set('endereco', t.endereco); set('cep', t.cep); set('cidade_uf', t.cidade_uf) }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TitularLookup label="Agencia / Produtora" value={data.agencia_produtora || ''} onChange={v => set('agencia_produtora', v)} onSelect={t => { set('agencia_produtora', t.nome); fill(t) }} hint="Selecione para preencher automaticamente" />
        <TitularLookup label="Cliente / Anunciante" value={data.cliente_anunciante || ''} onChange={v => set('cliente_anunciante', v)} onSelect={t => { set('cliente_anunciante', t.nome); fill(t) }} hint="Selecione para preencher automaticamente" />
        <Field label="Razao Social"><input type="text" value={data.razao_social || ''} onChange={e => set('razao_social', e.target.value)} className={ic} /></Field>
        <Field label="CNPJ / CPF"><input type="text" value={data.cnpj || ''} onChange={e => set('cnpj', e.target.value)} className={ic} /></Field>
        <Field label="Endereco"><input type="text" value={data.endereco || ''} onChange={e => set('endereco', e.target.value)} className={ic} /></Field>
        <Field label="CEP"><input type="text" value={data.cep || ''} onChange={e => set('cep', e.target.value)} className={ic} /></Field>
        <Field label="Cidade / UF"><input type="text" value={data.cidade_uf || ''} onChange={e => set('cidade_uf', e.target.value)} className={ic} /></Field>
        <Field label="Qtd. Pecas de Veiculacao"><input type="number" value={data.qtd_pecas || ''} onChange={e => set('qtd_pecas', parseInt(e.target.value))} className={ic} /></Field>
        <Field label="Duracao de cada peca"><input type="text" value={data.duracao_peca || ''} onChange={e => set('duracao_peca', e.target.value)} placeholder="00:00:30" className={ic} /></Field>
        <Field label="Data de Inicio"><input type="date" value={data.data_inicio_campanha || ''} onChange={e => set('data_inicio_campanha', e.target.value)} className={ic} /></Field>
        <Field label="Periodo de Licenca (dias)"><input type="number" value={data.periodo_licenca_dias || ''} onChange={e => set('periodo_licenca_dias', parseInt(e.target.value))} className={ic} /></Field>
      </div>
      <MultiSelect label="Meios de Veiculacao" options={['TV Aberta','TV Fechada','Internet','Redes Sociais','Radio','Cinema','Out of Home']} value={data.meio_veiculacao || []} onChange={v => set('meio_veiculacao', v)} />
      <MultiSelect label="Territorio" options={['Brasil','America Latina','Estados Unidos','Europa','Portugal','Mundial']} value={data.territorio || ['Brasil']} onChange={v => set('territorio', v)} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <BoolField label="Exclusividade no Segmento" value={!!data.exclusividade_segmento} onChange={v => set('exclusividade_segmento', v)} />
        <BoolField label="Participacao em festivais" value={!!data.participacao_festivais} onChange={v => set('participacao_festivais', v)} />
      </div>
    </div>
  )
}

// FormTV, FormEdicaoGrafica, FormIncidental, FormVersao — versoes simplificadas para orcamento
function FormGenerico({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  function fill(t: TS) { set('licenciado_nome', t.nome); set('licenciado_cpf_cnpj', t.cpf_cnpj); set('licenciado_endereco', t.endereco); set('licenciado_cidade_uf', t.cidade_uf); set('licenciado_email', t.email) }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TitularLookup label="Cliente / Licenciado" value={data.licenciado_nome || ''} onChange={v => set('licenciado_nome', v)} onSelect={fill} hint="Selecione para preencher automaticamente" />
        <Field label="CPF / CNPJ"><input type="text" value={data.licenciado_cpf_cnpj || ''} onChange={e => set('licenciado_cpf_cnpj', e.target.value)} className={ic} /></Field>
        <Field label="Endereco"><input type="text" value={data.licenciado_endereco || ''} onChange={e => set('licenciado_endereco', e.target.value)} className={ic} /></Field>
        <Field label="Cidade / UF"><input type="text" value={data.licenciado_cidade_uf || ''} onChange={e => set('licenciado_cidade_uf', e.target.value)} className={ic} /></Field>
        <Field label="E-mail"><input type="email" value={data.licenciado_email || ''} onChange={e => set('licenciado_email', e.target.value)} className={ic} /></Field>
      </div>
      <Field label="Descricao do Uso">
        <textarea rows={3} value={data.descricao_uso || ''} onChange={e => set('descricao_uso', e.target.value)} placeholder="Descreva a finalidade do uso..." className={ic + ' h-auto py-2 resize-none'} />
      </Field>
      <MultiSelect label="Territorio" options={['Brasil','America Latina','Estados Unidos','Europa','Portugal','Mundial']} value={data.territorio || ['Brasil']} onChange={v => set('territorio', v)} />
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function NovoOrcamentoPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [tipo, setTipo] = useState<TipoAut | ''>('')
  const [obrasIds, setObrasIds] = useState<string[]>([])
  const [obraSearch, setObraSearch] = useState('')
  const [dados, setDados] = useState<Record<string, any>>({})
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().slice(0, 10))
  const [dataValidade, setDataValidade] = useState(addDias(new Date().toISOString().slice(0, 10), 30))
  const [validadeDias, setValidadeDias] = useState(30)
  const [valorSugerido, setValorSugerido] = useState('')
  const [valorNegociado, setValorNegociado] = useState('')
  const [modeloNegocio, setModeloNegocio] = useState<'pago_editora' | 'pago_autor' | 'sem_onus'>('pago_editora')
  const [observacoes, setObservacoes] = useState('')
  const [statusInicial, setStatusInicial] = useState<'rascunho' | 'enviado'>('rascunho')

  // Smart scroll: top ao mudar step; scroll ao botao quando campo e preenchido
  const footerRef = useWizardSmartScroll(step, [tipo, obrasIds[0], valorSugerido, valorNegociado, modeloNegocio])

  const set = useCallback((k: string, v: any) => setDados(prev => ({ ...prev, [k]: v })), [])

  // Atualiza data validade quando emissao ou prazo mudam
  useEffect(() => {
    setDataValidade(addDias(dataEmissao, validadeDias))
  }, [dataEmissao, validadeDias])

  // SEM_ONUS: zera valores automaticamente
  useEffect(() => {
    if (modeloNegocio === 'sem_onus') {
      setValorSugerido('0,00')
      setValorNegociado('0,00')
    }
  }, [modeloNegocio])

  // Obras filtradas
  const obrasFiltradas = useMemo(() => {
    if (!obraSearch.trim()) return []
    const q = obraSearch.toLowerCase()
    return MOCK_OBRAS.filter(o => o.titulo.toLowerCase().includes(q)).slice(0, 8)
  }, [obraSearch])

  const obrasEscolhidas = useMemo(() =>
    MOCK_OBRAS.filter(o => obrasIds.includes(o.id)), [obrasIds])

  // Percentual de controle da editora (calculado a partir das obras)
  const percentualControle = useMemo(() => {
    if (obrasEscolhidas.length === 0) return 100
    const pcts = obrasEscolhidas.flatMap(o =>
      ((o._links ?? []) as any[])
        .filter((l: any) => l.controlado === true || ((l.titulares ?? []) as any[]).some((t: any) => t.controlado))
        .map((l: any) => {
          const tits: any[] = l.titulares ?? l._titulares ?? []
          return tits.filter((t: any) => t.controlado).reduce((s: number, t: any) => s + (t.percentual_composicao ?? 0), 0)
        })
    )
    if (pcts.length === 0) return 100
    return pcts.reduce((a, b) => a + b, 0) / pcts.length
  }, [obrasEscolhidas])

  const canNext = useMemo(() => {
    if (step === 1) return tipo !== ''
    if (step === 2) return obrasIds.length > 0
    return true
  }, [step, tipo, obrasIds])

  function renderDadosEspecificos() {
    if (tipo === 'fonograma') return <FormFonograma data={dados} set={set} />
    if (tipo === 'sincronizacao') return (
      <FormSincronizacao
        data={dados} set={set}
        percentualControle={percentualControle}
        onValorCalculado={v => setValorSugerido(v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))}
      />
    )
    if (tipo === 'publicidade') return <FormPublicidade data={dados} set={set} />
    return <FormGenerico data={dados} set={set} />
  }

  function handleSubmit() {
    // Em producao: POST /api/orcamentos
    router.push('/master/autorizacoes/orcamentos')
  }

  const stepTitles = ['Tipo de Uso', 'Obra(s)', 'Dados do Cliente', 'Periodo de Validade', 'Valor', 'Revisao']

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-white/30 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <span className="text-white/15">·</span>
        <h1 className="text-sm font-semibold text-white/60">Novo Orcamento</h1>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={`flex flex-col items-center gap-1 group ${step > s.id ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${
                step === s.id ? 'bg-violet-600 border-violet-500 text-white' :
                step > s.id  ? 'bg-emerald-600/30 border-emerald-500/40 text-emerald-400' :
                               'bg-white/5 border-white/[0.06] text-white/25'
              }`}>
                {step > s.id ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[10px] hidden sm:block ${step === s.id ? 'text-violet-400' : 'text-white/25'}`}>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${step > s.id ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-white">{stepTitles[step - 1]}</h2>

        {/* Step 1 — Tipo */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TIPOS.map(t => (
              <button key={t.key} type="button" onClick={() => setTipo(t.key)}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${tipo === t.key ? 'bg-violet-600/20 border-violet-500/50' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'}`}>
                <t.icon className={`w-4 h-4 mt-0.5 shrink-0 ${tipo === t.key ? 'text-violet-400' : 'text-white/30'}`} />
                <div>
                  <p className={`text-sm font-semibold ${tipo === t.key ? 'text-white' : 'text-white/60'}`}>{t.label}</p>
                  <p className="text-xs text-white/35 mt-0.5">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Obras */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="relative">
              <input type="text" value={obraSearch} onChange={e => setObraSearch(e.target.value)}
                placeholder="Buscar obra por titulo..." className={ic} autoFocus />
              {obrasFiltradas.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#111c33] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
                  {obrasFiltradas.map(o => {
                    const aut = getAutoresObra(o.id)
                    return (
                      <button key={o.id} type="button"
                        onMouseDown={e => { e.preventDefault(); if (!obrasIds.includes(o.id)) setObrasIds(prev => [...prev, o.id]); setObraSearch('') }}
                        className="w-full text-left px-4 py-3 hover:bg-violet-600/20 transition-colors flex items-start gap-2 border-b border-white/[0.04] last:border-0">
                        <Music2 className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/90 font-semibold">{o.titulo}</p>
                          <p className="text-[10px] text-white/35">{o.codigo ?? o.id}</p>
                          {aut.todos.length > 0 && (
                            <p className="text-[10px] text-white/40 mt-0.5 truncate">
                              Autores: {aut.todos.join(' / ')}
                            </p>
                          )}
                          {aut.controlados.length > 0 && (
                            <p className="text-[10px] text-violet-400/70 truncate">
                              Controlados: {aut.controlados.join(' / ')} · {aut.pctControlado.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            {obrasEscolhidas.length > 0 ? (
              <div className="space-y-2">
                {obrasEscolhidas.map(o => {
                  const aut = getAutoresObra(o.id)
                  return (
                    <div key={o.id} className="flex items-start justify-between bg-white/[0.03] rounded-lg px-4 py-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold">{o.titulo}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{o.codigo ?? o.id}</p>
                        {aut.todos.length > 0 && (
                          <p className="text-xs text-white/45 mt-1">
                            <span className="text-white/30">Autores: </span>{aut.todos.join(' / ')}
                          </p>
                        )}
                        {aut.controlados.length > 0 && (
                          <p className="text-xs text-violet-400/80 mt-0.5">
                            <span className="text-violet-400/50">Controlados: </span>{aut.controlados.join(' / ')}
                            <span className="text-violet-400/50 ml-1">· {aut.pctControlado.toFixed(2)}%</span>
                          </p>
                        )}
                      </div>
                      <button onClick={() => setObrasIds(prev => prev.filter(id => id !== o.id))}
                        className="text-xs text-rose-400/60 hover:text-rose-400 transition-colors shrink-0 mt-0.5">Remover</button>
                    </div>
                  )
                })}
                <p className="text-xs text-white/30 pt-1">% Controle total estimado: <span className="text-white/60 font-semibold">{percentualControle.toFixed(2)}%</span></p>
              </div>
            ) : (
              <p className="text-xs text-white/25 text-center py-4">Nenhuma obra selecionada</p>
            )}
          </div>
        )}

        {/* Step 3 — Dados especificos */}
        {step === 3 && renderDadosEspecificos()}

        {/* Step 4 — Periodo */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Data de Emissao">
                <input type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)} className={ic} />
              </Field>
              <Field label="Prazo de Validade (dias)">
                <select value={validadeDias} onChange={e => setValidadeDias(parseInt(e.target.value))} className={sel}>
                  {[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} dias</option>)}
                </select>
              </Field>
              <Field label="Data de Validade (calculada)">
                <input type="date" value={dataValidade} readOnly className={ic + ' opacity-60 cursor-not-allowed'} />
              </Field>
            </div>
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-3 text-xs text-sky-400">
              O orcamento expira em <strong>{dataValidade ? new Date(dataValidade + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</strong>.
              Apos a expiracao o status muda para <em>Expirado</em> automaticamente.
            </div>
          </div>
        )}

        {/* Step 5 — Valor */}
        {step === 5 && (
          <div className="space-y-5">
            {tipo === 'sincronizacao' && (
              <CalculadoraAudiovisual
                dados={dados}
                percentualControle={percentualControle}
                onAplicar={v => setValorSugerido(v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))}
              />
            )}
            {modeloNegocio === 'sem_onus' && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-400 font-medium">
                  Autorizacao SEM ONUS — sem cobranca financeira. Valores zerados automaticamente.
                </p>
              </div>
            )}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4${modeloNegocio === 'sem_onus' ? ' opacity-50 pointer-events-none select-none' : ''}`}>
              <Field label="Valor Sugerido (R$)">
                <input type="text" value={valorSugerido} onChange={e => setValorSugerido(e.target.value)} placeholder="0,00" className={ic} readOnly={modeloNegocio === 'sem_onus'} />
              </Field>
              <Field label="Valor Negociado (R$)">
                <input type="text" value={valorNegociado} onChange={e => setValorNegociado(e.target.value)} placeholder="Preencha apos negociacao" className={ic} readOnly={modeloNegocio === 'sem_onus'} />
              </Field>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">Modelo de Negocio</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['pago_editora', 'Pago a Editora', Building2],
                  ['pago_autor',   'Pago ao Autor',  User],
                  ['sem_onus',     'Sem Onus',       Check],
                ] as const).map(([key, lbl, Icon]) => (
                  <button key={key} type="button" onClick={() => setModeloNegocio(key)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-semibold transition-colors ${modeloNegocio === key ? 'bg-violet-600/20 border-violet-500/50 text-violet-300' : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:border-white/20'}`}>
                    <Icon className="w-4 h-4" />
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40">Status inicial</label>
              <div className="flex gap-2">
                {(['rascunho','enviado'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setStatusInicial(s)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-colors ${statusInicial === s ? 'bg-sky-600/20 border-sky-500/40 text-sky-300' : 'bg-white/5 border-white/[0.06] text-white/40 hover:border-white/20'}`}>
                    {STATUS_ORCAMENTO_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Observacoes">
              <textarea rows={3} value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Condicoes especiais, notas..." className={ic + ' h-auto py-2 resize-none'} />
            </Field>
          </div>
        )}

        {/* Step 6 — Revisao */}
        {step === 6 && (
          <div className="space-y-4 text-xs text-white/50">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Tipo</p><p className="text-white font-semibold">{tipo ? TIPO_AUTORIZACAO_LABELS[tipo as TipoAut] : '—'}</p></div>
              <div><p className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Obra(s)</p><p className="text-white">{obrasEscolhidas.map(o => o.titulo).join(', ') || '—'}</p></div>
              <div><p className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Emissao</p><p className="text-white">{dataEmissao ? new Date(dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</p></div>
              <div><p className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Validade</p><p className="text-white">{dataValidade ? new Date(dataValidade + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</p></div>
              <div><p className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Valor Sugerido</p><p className="text-emerald-400 font-semibold">{valorSugerido ? `R$ ${valorSugerido}` : '—'}</p></div>
              <div><p className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Valor Negociado</p><p className="text-emerald-400 font-semibold">{valorNegociado ? `R$ ${valorNegociado}` : '—'}</p></div>
              <div><p className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Modelo Negocio</p><p className="text-white">{modeloNegocio === 'pago_editora' ? 'Pago a Editora' : modeloNegocio === 'pago_autor' ? 'Pago ao Autor' : 'Sem Onus'}</p></div>
              <div><p className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Status</p><p className="text-sky-400 font-semibold">{STATUS_ORCAMENTO_LABELS[statusInicial]}</p></div>
              <div><p className="text-white/30 text-[10px] uppercase tracking-wide mb-0.5">Controle Editora</p><p className="text-white">{percentualControle.toFixed(2)}%</p></div>
            </div>
            {observacoes && (
              <div className="bg-white/[0.03] rounded-lg p-3 mt-2">
                <p className="text-white/30 text-[10px] uppercase tracking-wide mb-1">Observacoes</p>
                <p className="text-white/60 text-xs">{observacoes}</p>
              </div>
            )}
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 flex items-start gap-2 mt-2">
              <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-400/80">
                Apos salvar, o orcamento podera ser enviado ao cliente. Quando aprovado, use o botao <strong>Converter em Autorizacao</strong> para gerar a autorizacao formal.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div ref={footerRef} className="flex items-center justify-between">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06] text-sm text-white/60 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        {step < 6 ? (
          <button onClick={() => canNext && setStep(s => s + 1)} disabled={!canNext}
            className={`flex items-center gap-1.5 h-9 px-5 rounded-lg text-sm font-semibold transition-colors ${canNext ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-white/5 text-white/25 cursor-not-allowed'}`}>
            Proximo <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit}
            className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white font-semibold transition-colors">
            <Check className="w-4 h-4" /> Salvar Orcamento
          </button>
        )}
      </div>
    </div>
  )
}
