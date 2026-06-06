'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Check, FileText, Users, Music,
  Eye, BookOpen, DollarSign, Globe, Pen, ShieldCheck, Scale,
  AlertTriangle, Info, Plus, X, Search,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { authFetch } from '@/lib/supabase/client'
import { formatarPercentual } from '@/lib/percentual'
import type { TipoContratoV2, PapelParte } from '@/lib/types-contratos-v2'
import {
  TIPO_CONTRATO_V2_LABELS, TIPO_CONTRATO_V2_COLORS,
  CODIGO_DIREITO_LABELS, TODOS_DIREITOS_BR, TODOS_DIREITOS_EXT,
  PAPEL_PARTE_LABELS, PROVEDOR_ASSINATURA_LABELS,
  getDireitosDefault,
  dataTerminoObrigatorio, permiteRenovacaoAutomatica, isExclusividade,
} from '@/lib/types-contratos-v2'
import { MODELOS_JURIDICOS_V2, getModeloByTipo } from '@/lib/modelos-juridicos-v2'

const TOTAL_STEPS = 9

const STEP_CONFIG = [
  { label: 'Tipo & Editora',       icon: Scale },
  { label: 'Modelo Juridico',      icon: BookOpen },
  { label: 'Partes',               icon: Users },
  { label: 'Direitos',             icon: ShieldCheck },
  { label: 'Obras & Links',        icon: Music },
  { label: 'Periodo & Territorio', icon: Globe },
  { label: 'Recoupment',           icon: DollarSign },
  { label: 'Assinatura',           icon: Pen },
  { label: 'Revisao',              icon: Eye },
]

// ── Config por tipo ────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<TipoContratoV2, {
  descricao: string
  titulares_envolvidos: string
  termino_obrigatorio: boolean
  cor_info: string
  alerta?: string
}> = {
  cessao_parcial: {
    descricao: 'Titular cede PARTE dos direitos patrimoniais. A editora administra, exporta, recebe e licencia somente a parte cedida.',
    titulares_envolvidos: 'Editora × Autor(es)',
    termino_obrigatorio: false,
    cor_info: 'violet',
  },
  cessao_total: {
    descricao: 'Titular transfere integralmente os direitos patrimoniais. 100% dos resultados do autor vao para o cessionario ou editora.',
    titulares_envolvidos: 'Editora × Autor(es) / Cessionarios',
    termino_obrigatorio: false,
    cor_info: 'indigo',
  },
  licenciamento: {
    descricao: 'Licenca por periodo determinado — obrigatorio informar data de termino. Ao fim, direitos retornam ao cedente.',
    titulares_envolvidos: 'Editora × Titulares diversos (Agencias / Clientes)',
    termino_obrigatorio: true,
    cor_info: 'amber',
    alerta: 'DATA DE TERMINO OBRIGATORIA. Ao fim do prazo os direitos retornam automaticamente ao cedente.',
  },
  administracao_editorial: {
    descricao: 'Editora administradora opera, exporta, cobra e licencia o catalogo da editora original. NAO e proprietaria. Negocia-se um % sobre o % que a editora original tem com os autores.',
    titulares_envolvidos: 'Editora Administradora × Editora Original (Administrada)',
    termino_obrigatorio: false,
    cor_info: 'sky',
  },
  coedicao: {
    descricao: 'Duas editoras dividem controle editorial sobre a participacao do autor nas obras. Cada uma controla, recebe, exporta e licencia conforme seu percentual.',
    titulares_envolvidos: 'Editora A × Editora B × Autor(es)',
    termino_obrigatorio: false,
    cor_info: 'teal',
  },
  subedicao: {
    descricao: 'Uma editora representa outra em territorio especifico — cobra, licencia, recebe e repassa naquele territorio.',
    titulares_envolvidos: 'Editora × Editora Internacional (Subeditora)',
    termino_obrigatorio: false,
    cor_info: 'cyan',
  },
  cessao_internacional: {
    descricao: 'Cessao especifica para exploracao internacional — pode envolver mundo inteiro ou territorios especificos, DSP internacional, sync internacional.',
    titulares_envolvidos: 'Editora × Subeditora Internacional',
    termino_obrigatorio: false,
    cor_info: 'emerald',
  },
  cessionario_pj: {
    descricao: 'Autor transfere recebimentos para PJ propria. Recebedor economico muda — autor continua como criador no CWR. NAO INCIDE IRPF.',
    titulares_envolvidos: 'Editora Original × Autor × Cessionarios PJ',
    termino_obrigatorio: false,
    cor_info: 'pink',
    alerta: 'Cessionario PJ — NAO incide IRPF. Ao termino do prazo os direitos voltam ao autor.',
  },
  cessionario_pf: {
    descricao: 'Autor transfere recebimentos para outra PF. Recebedor economico muda — autor continua como criador no CWR. INCIDE IRPF.',
    titulares_envolvidos: 'Editora Original × Autor × Cessionarios PF',
    termino_obrigatorio: false,
    cor_info: 'orange',
    alerta: 'Cessionario PF — INCIDE IRPF sobre os valores distribuidos. Ao termino do prazo os direitos voltam ao autor.',
  },
  licenciamento_licenciante_pj: {
    descricao: 'Licenca POR PRAZO DETERMINADO a PJ. Recebedor muda temporariamente para a PJ licenciante. Ao termino, direitos retornam ao cedente. NAO INCIDE IRPF.',
    titulares_envolvidos: 'Editora × Autor(es) × Licenciante(s) PJ',
    termino_obrigatorio: true,
    cor_info: 'rose',
    alerta: 'DATA DE TERMINO OBRIGATORIA. Licenciante PJ — NAO incide IRPF. Direitos retornam ao autor no dia subsequente ao termino.',
  },
  licenciamento_licenciante_pf: {
    descricao: 'Licenca POR PRAZO DETERMINADO a PF. Recebedor muda temporariamente para a PF licenciante. Ao termino, direitos retornam ao cedente. INCIDE IRPF.',
    titulares_envolvidos: 'Editora × Autor(es) × Licenciante(s) PF',
    termino_obrigatorio: true,
    cor_info: 'red',
    alerta: 'DATA DE TERMINO OBRIGATORIA. Licenciante PF — INCIDE IRPF. Direitos retornam ao autor no dia subsequente ao termino.',
  },
  exclusividade_autor_editora: {
    descricao: 'Autor so pode editar suas obras pela editora contratante durante a vigencia. Quebra contratual sujeita a multa. Alertas em 90d, 30d, 10d e diariamente ate o vencimento.',
    titulares_envolvidos: 'Editora × Autor(es)',
    termino_obrigatorio: false,
    cor_info: 'yellow',
    alerta: 'EXCLUSIVIDADE: sistema alerta em 90 dias, 30 dias, 10 dias e DIARIAMENTE ate o vencimento. Renovacao automatica disponivel.',
  },
}

// Titulares carregados da API — não usar mock

type TitularItem = { id: string; nome: string; tipo_pessoa: 'PF' | 'PJ'; ipi?: string; cpf_cnpj?: string }

function TitularBusca({
  value, onChange, todosOsTitulares, onNovoTitular,
}: {
  value: string
  onChange: (id: string) => void
  todosOsTitulares: TitularItem[]
  onNovoTitular: (t: TitularItem) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoTipo, setNovoTipo] = useState<'PF' | 'PJ'>('PF')
  const [novoCpf, setNovoCpf] = useState('')
  const [novoIpi, setNovoIpi] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selecionado = todosOsTitulares.find(t => t.id === value)

  const resultados = query.length >= 2
    ? todosOsTitulares.filter(t => t.nome.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setShowForm(false)
      }
    }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [])

  function confirmarNovo() {
    if (!novoNome.trim()) return
    const novo: TitularItem = {
      id: `tit-novo-${Date.now()}`,
      nome: novoNome.trim().toUpperCase(),
      tipo_pessoa: novoTipo,
      cpf_cnpj: novoCpf,
      ipi: novoIpi,
    }
    onNovoTitular(novo)
    onChange(novo.id)
    setQuery('')
    setShowForm(false)
    setOpen(false)
    setNovoNome(''); setNovoCpf(''); setNovoIpi('')
  }

  const inputCls = 'w-full h-8 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-violet-500/40'

  if (selecionado) {
    return (
      <div className="flex items-center gap-2 h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3">
        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${selecionado.tipo_pessoa === 'PF' ? 'bg-violet-500/20 text-violet-300' : 'bg-sky-500/20 text-sky-300'}`}>
          {selecionado.tipo_pessoa}
        </div>
        <span className="flex-1 text-xs text-white/80 truncate">{selecionado.nome}</span>
        <button onClick={() => { onChange(''); setQuery('') }}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/30 hover:text-rose-400 transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 focus-within:border-violet-500/40">
        <Search className="w-3.5 h-3.5 text-white/25 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setShowForm(false) }}
          onFocus={() => { if (query.length >= 2) setOpen(true) }}
          placeholder="Buscar titular pelo nome..."
          className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/25 outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false) }}
            className="text-white/20 hover:text-white/50 transition-colors shrink-0">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && query.length >= 2 && !showForm && (
        <div className="absolute left-0 top-full mt-1 w-full z-50 bg-[#0d1526] border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden">
          {resultados.length > 0 ? (
            <>
              {resultados.map(t => (
                <button key={t.id}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onChange(t.id); setQuery(''); setOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-white/5 text-left transition-colors border-b border-white/[0.04] last:border-0">
                  <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${t.tipo_pessoa === 'PF' ? 'bg-violet-500/20 text-violet-300' : 'bg-sky-500/20 text-sky-300'}`}>
                    {t.tipo_pessoa}
                  </div>
                  <span className="flex-1 text-xs text-white/80 truncate">{t.nome}</span>
                  {t.ipi && <span className="text-[10px] font-mono text-white/30 shrink-0">{t.ipi}</span>}
                </button>
              ))}
              <div className="border-t border-white/[0.06]">
                <button onMouseDown={e => e.preventDefault()}
                  onClick={() => { setOpen(false); setShowForm(true); setNovoNome(query) }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-violet-500/10 text-left transition-colors">
                  <Plus className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs text-violet-400 font-semibold">Cadastrar novo titular</span>
                </button>
              </div>
            </>
          ) : (
            <div className="px-3 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-white/50">Nenhum titular encontrado</p>
                <p className="text-[10px] text-white/25">"{query}" não está no cadastro</p>
              </div>
              <button onMouseDown={e => e.preventDefault()}
                onClick={() => { setOpen(false); setShowForm(true); setNovoNome(query) }}
                className="shrink-0 flex items-center gap-1 h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-colors">
                <Plus className="w-3 h-3" /> Cadastrar novo
              </button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-2 bg-[#0d1526] border border-violet-500/30 rounded-xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-violet-400">Novo Titular</p>
            <button onClick={() => setShowForm(false)} className="text-white/25 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            {(['PF', 'PJ'] as const).map(tp => (
              <button key={tp} onClick={() => setNovoTipo(tp)}
                className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-colors ${novoTipo === tp ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:text-white/60'}`}>
                {tp === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </button>
            ))}
          </div>

          <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)}
            placeholder={novoTipo === 'PF' ? 'Nome completo *' : 'Razão social *'}
            className={inputCls} />

          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={novoCpf} onChange={e => setNovoCpf(e.target.value)}
              placeholder={novoTipo === 'PF' ? 'CPF' : 'CNPJ'}
              className={inputCls} />
            <input type="text" value={novoIpi} onChange={e => setNovoIpi(e.target.value)}
              placeholder="IPI / CAE"
              className={inputCls + ' font-mono'} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={confirmarNovo} disabled={!novoNome.trim()}
              className="flex-1 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-white transition-colors">
              Confirmar e Usar
            </button>
            <button onClick={() => setShowForm(false)}
              className="h-8 px-4 rounded-lg bg-white/5 text-xs text-white/40 hover:text-white/70 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Editoras carregadas da API — não usar mock

const TIPOS: TipoContratoV2[] = [
  'administracao_editorial',
  'cessao_parcial',
  'cessao_total',
  'cessao_internacional',
  'cessionario_pf',
  'cessionario_pj',
  'coedicao',
  'licenciamento',
  'exclusividade_autor_editora',
  'licenciamento_licenciante_pf',
  'licenciamento_licenciante_pj',
  'subedicao',
]

type FormState = {
  tipo: TipoContratoV2 | ''
  editora_id: string
  modelo_juridico_id: string
  partes: { titular_id: string; papel: PapelParte; percentual: string }[]
  direitos: { codigo: string; ativo: boolean; pct_titular: string; pct_editora: string }[]
  obras: { titulo: string; codigo: string; percentual_autor: string; controlado: boolean }[]
  vigencia_inicio: string
  vigencia_fim: string
  prazo_indeterminado: boolean
  renovacao_automatica: boolean
  territorio: string
  exclusividade: boolean
  clausula_reversao: boolean
  adiantamento: string
  descricao_recoupment: string
  provedor_assinatura: string
  // Administracao editorial
  paga_direto_autor: boolean | null
  // Administracao: % da administradora sobre o % da editora original
  pct_administradora: string
}

const INITIAL_FORM: FormState = {
  tipo: '',
  editora_id: '',
  modelo_juridico_id: '',
  partes: [{ titular_id: '', papel: 'cedente', percentual: '75' }],
  direitos: [],
  obras: [{ titulo: '', codigo: '', percentual_autor: '100', controlado: false }],
  vigencia_inicio: '',
  vigencia_fim: '',
  prazo_indeterminado: false,
  renovacao_automatica: false,
  territorio: 'BR',
  exclusividade: false,
  clausula_reversao: false,
  adiantamento: '',
  descricao_recoupment: '',
  provedor_assinatura: 'd4sign',
  paga_direto_autor: null,
  pct_administradora: '50',
}

function StepIndicator({ step, current }: { step: number; current: number }) {
  const cfg = STEP_CONFIG[step]
  const Icon = cfg.icon
  const done = step < current
  const active = step === current
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={[
        'w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs font-bold',
        done ? 'bg-emerald-500 text-white' :
        active ? 'bg-violet-600 text-white ring-2 ring-violet-400/30' :
        'bg-white/[0.06] text-white/30',
      ].join(' ')}>
        {done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
      </div>
      <span className={`text-[10px] hidden md:block ${active ? 'text-violet-300' : 'text-white/30'}`}>
        {cfg.label}
      </span>
    </div>
  )
}

function AlertBox({ children, variant = 'amber' }: { children: React.ReactNode; variant?: string }) {
  const colors: Record<string, string> = {
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    rose:  'bg-rose-500/10 border-rose-500/20 text-rose-300',
    sky:   'bg-sky-500/10 border-sky-500/20 text-sky-300',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-300',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  }
  return (
    <div className={`flex items-start gap-2 border rounded-xl px-4 py-3 text-xs ${colors[variant] ?? colors.amber}`}>
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export default function NovoContratoPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [showPreview, setShowPreview] = useState(false)
  const [extraTitulares, setExtraTitulares] = useState<TitularItem[]>([])
  const [titularesReais, setTitularesReais] = useState<TitularItem[]>([])
  const [editorasReais, setEditorasReais] = useState<Array<{ id: string; nome: string; cnpj: string }>>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const [tRes, eRes] = await Promise.all([
          authFetch('/api/titulares?per_page=200&status=ativo'),
          authFetch('/api/editoras'),
        ])
        const tJson = await tRes.json()
        const eJson = await eRes.json()
        if (Array.isArray(tJson.data)) {
          setTitularesReais(tJson.data.map((t: Record<string, unknown>) => ({
            id: t.id as string,
            nome: (t.nome_completo ?? t.nome ?? '') as string,
            tipo_pessoa: ((t.pessoa ?? t.tipo_pessoa ?? 'PF') as 'PF' | 'PJ'),
            cpf_cnpj: (t.cpf_cnpj ?? '') as string,
            ipi: (t.ipi ?? t.codigo_ipi ?? '') as string,
          })))
        }
        if (Array.isArray(eJson.editoras)) {
          setEditorasReais(eJson.editoras.map((e: Record<string, unknown>) => ({
            id: e.id as string,
            nome: (e.nome_fantasia ?? e.nome ?? '') as string,
            cnpj: (e.cnpj ?? '') as string,
          })))
        }
      } catch { /* silencioso */ }
    }
    carregar()
  }, [])

  const todosOsTitulares: TitularItem[] = [...titularesReais, ...extraTitulares]

  function next() { if (step < TOTAL_STEPS - 1) setStep(s => s + 1) }
  function prev() { if (step > 0) setStep(s => s - 1) }
  function updateForm(patch: Partial<FormState>) { setForm(f => ({ ...f, ...patch })) }

  function selectTipo(tipo: TipoContratoV2) {
    const modelo = getModeloByTipo(tipo)
    const direitos = getDireitosDefault(tipo).map(d => ({
      codigo: d.codigo,
      ativo: d.ativo,
      pct_titular: String(d.pct_titular),
      pct_editora: String(d.pct_editora),
    }))
    const isExcl = isExclusividade(tipo)
    const termObrig = dataTerminoObrigatorio(tipo)
    updateForm({
      tipo,
      modelo_juridico_id: modelo?.id ?? '',
      direitos,
      exclusividade: isExcl,
      prazo_indeterminado: termObrig ? false : form.prazo_indeterminado,
    })
  }

  const cfg = form.tipo ? TIPO_CONFIG[form.tipo] : null
  const selectedModelo = MODELOS_JURIDICOS_V2.find(m => m.id === form.modelo_juridico_id)
  const selectedEditora = editorasReais.find(e => e.id === form.editora_id)
  const termObrig = form.tipo ? dataTerminoObrigatorio(form.tipo) : false
  const podeRenovar = form.tipo ? permiteRenovacaoAutomatica(form.tipo) : false

  // ── Step 1: Tipo & Editora ──────────────────────────────────────────────────
  const renderStep0 = () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60 mb-4">Selecione o tipo de contrato:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIPOS.map(t => {
            const tc = TIPO_CONFIG[t]
            return (
              <button
                key={t}
                onClick={() => selectTipo(t)}
                className={[
                  'text-left p-4 rounded-xl border transition-all',
                  form.tipo === t
                    ? 'border-violet-500/60 bg-violet-500/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
                ].join(' ')}
              >
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full block mb-2 w-fit ${TIPO_CONTRATO_V2_COLORS[t]}`}>
                  {TIPO_CONTRATO_V2_LABELS[t]}
                </span>
                <p className="text-xs text-white/50 leading-relaxed">{tc.descricao}</p>
                <p className="text-[10px] text-white/30 mt-1.5">
                  Titulares: {tc.titulares_envolvidos}
                </p>
                {tc.termino_obrigatorio && (
                  <span className="inline-block mt-1.5 text-[10px] bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded">
                    Prazo obrigatorio
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Alerta especifico do tipo */}
      {cfg?.alerta && (
        <AlertBox variant={
          form.tipo === 'cessionario_pf' || form.tipo === 'licenciamento_licenciante_pf' ? 'orange'
          : form.tipo === 'exclusividade_autor_editora' ? 'yellow'
          : 'rose'
        }>
          {cfg.alerta}
        </AlertBox>
      )}

      <div>
        <p className="text-sm text-white/60 mb-3">Editora responsavel:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {editorasReais.length === 0 ? (
            <div className="col-span-2 text-xs text-white/30 py-4 text-center">Carregando editoras...</div>
          ) : editorasReais.map(e => (
            <button
              key={e.id}
              onClick={() => updateForm({ editora_id: e.id })}
              className={[
                'text-left p-3 rounded-lg border transition-all',
                form.editora_id === e.id
                  ? 'border-violet-500/60 bg-violet-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
              ].join(' ')}
            >
              <div className="text-sm text-white/80 font-medium">{e.nome}</div>
              <div className="text-xs text-white/40">{e.cnpj}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Step 2: Modelo Juridico ─────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-sm text-white/60">Modelo juridico correspondente ao tipo selecionado:</p>
      {selectedModelo ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-white/90">{selectedModelo.nome}</h3>
              <p className="text-xs text-white/50 mt-1">{selectedModelo.descricao}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_CONTRATO_V2_COLORS[selectedModelo.tipo_contrato]}`}>
              {TIPO_CONTRATO_V2_LABELS[selectedModelo.tipo_contrato]}
            </span>
          </div>
          <button
            onClick={() => setShowPreview(s => !s)}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {showPreview ? 'Ocultar texto' : 'Visualizar texto do contrato'}
          </button>
          {showPreview && (
            <pre className="mt-3 text-xs text-white/50 bg-black/20 rounded-lg p-4 overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap font-mono">
              {selectedModelo.template_texto}
            </pre>
          )}
        </div>
      ) : (
        <div className="text-sm text-white/30 py-8 text-center">
          Selecione um tipo de contrato na etapa anterior.
        </div>
      )}
      <div>
        <p className="text-sm text-white/60 mb-3">Ou escolha outro modelo disponivel:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODELOS_JURIDICOS_V2.map(m => (
            <button
              key={m.id}
              onClick={() => updateForm({ modelo_juridico_id: m.id })}
              className={[
                'text-left p-3 rounded-lg border transition-all',
                form.modelo_juridico_id === m.id
                  ? 'border-violet-500/60 bg-violet-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
              ].join(' ')}
            >
              <div className="text-sm text-white/80 font-medium">{m.nome}</div>
              <div className="text-xs text-white/40 mt-0.5">{m.contagem_uso} uso(s)</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Step 3: Partes ──────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-4">
      {cfg && (
        <div className="flex items-start gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-white/50">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-violet-400" />
          <span>Titulares envolvidos neste tipo: <strong className="text-white/70">{cfg.titulares_envolvidos}</strong></span>
        </div>
      )}

      {/* Administracao editorial: pergunta paga direto ou via editora */}
      {form.tipo === 'administracao_editorial' && (
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-sky-300">Regra de repasse da Administradora:</p>
          <p className="text-xs text-sky-400/70">
            A editora administradora recebe os direitos. Como deve ser feito o repasse aos autores da editora original?
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paga_direto"
                checked={form.paga_direto_autor === true}
                onChange={() => updateForm({ paga_direto_autor: true })}
                className="accent-sky-500"
              />
              <span className="text-sm text-white/80">Paga direto ao autor (a administradora repassa direto)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paga_direto"
                checked={form.paga_direto_autor === false}
                onChange={() => updateForm({ paga_direto_autor: false })}
                className="accent-sky-500"
              />
              <span className="text-sm text-white/80">Paga a editora original (que repassa aos seus autores)</span>
            </label>
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1">% da administradora sobre o % da editora original</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={99}
                value={form.pct_administradora}
                onChange={e => updateForm({ pct_administradora: e.target.value })}
                className="w-20 h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-sky-500/40"
              />
              <span className="text-xs text-white/40">
                % · Editora original fica com {formatarPercentual(Math.max(0, 100 - parseFloat(form.pct_administradora || '0')))}
              </span>
            </div>
          </div>
        </div>
      )}

      {form.partes.map((parte, i) => (
        <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60">Parte {i + 1}</span>
            {form.partes.length > 1 && (
              <button
                onClick={() => updateForm({ partes: form.partes.filter((_, j) => j !== i) })}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Remover
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/40 block mb-1">Titular</label>
              <TitularBusca
                value={parte.titular_id}
                onChange={id => {
                  const p = [...form.partes]
                  p[i] = { ...p[i], titular_id: id }
                  updateForm({ partes: p })
                }}
                todosOsTitulares={todosOsTitulares}
                onNovoTitular={t => setExtraTitulares(prev => [...prev, t])}
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Papel</label>
              <select
                value={parte.papel}
                onChange={e => {
                  const p = [...form.partes]
                  p[i] = { ...p[i], papel: e.target.value as PapelParte }
                  updateForm({ partes: p })
                }}
                className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
              >
                {Object.entries(PAPEL_PARTE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Percentual (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={parte.percentual}
                onChange={e => {
                  const p = [...form.partes]
                  p[i] = { ...p[i], percentual: e.target.value }
                  updateForm({ partes: p })
                }}
                className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
              />
            </div>
          </div>
          {parte.titular_id && (form.tipo === 'cessionario_pf' || form.tipo === 'licenciamento_licenciante_pf') && (
            <AlertBox variant="orange">INCIDE IRPF sobre os valores distribuidos a esta parte.</AlertBox>
          )}
          {parte.titular_id && (form.tipo === 'cessionario_pj' || form.tipo === 'licenciamento_licenciante_pj') && (
            <AlertBox variant="emerald">NAO incide IRPF — natureza PJ.</AlertBox>
          )}
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          onClick={() => updateForm({ partes: [...form.partes, { titular_id: '', papel: 'cessionario', percentual: '25' }] })}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors border border-violet-500/20 rounded-lg px-3 py-1.5"
        >
          + Adicionar parte
        </button>
        <span className="text-xs text-white/30">
          Soma: {formatarPercentual(form.partes.reduce((s, p) => s + (parseFloat(p.percentual) || 0), 0))}
          {form.partes.reduce((s, p) => s + (parseFloat(p.percentual) || 0), 0) !== 100 && (
            <span className="text-amber-400 ml-1">(deve somar 100%)</span>
          )}
        </span>
      </div>
    </div>
  )

  // ── Step 4: Direitos ────────────────────────────────────────────────────────
  const renderStep3 = () => {
    const brDireitos = form.direitos.filter(d => d.codigo.startsWith('BR_'))
    const extDireitos = form.direitos.filter(d => d.codigo.startsWith('EXT_'))
    const allBrAtivo = brDireitos.every(d => d.ativo)
    const allExtAtivo = extDireitos.every(d => d.ativo)

    function toggleAll(prefix: 'BR_' | 'EXT_', ativo: boolean) {
      updateForm({
        direitos: form.direitos.map(d =>
          d.codigo.startsWith(prefix) ? { ...d, ativo } : d
        ),
      })
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          Direitos cedidos — padrao BR 75/25 e EXT 50/50 (flexibilizaveis). Marque todos de uma vez ou individualmente.
        </p>
        {form.direitos.length === 0 && (
          <div className="text-xs text-white/30 py-4 text-center">
            Selecione um tipo de contrato para carregar os direitos padrao.
          </div>
        )}

        {/* BR */}
        {brDireitos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-violet-400">Brasil (BR)</p>
              <button
                onClick={() => toggleAll('BR_', !allBrAtivo)}
                className="text-xs text-violet-400/70 hover:text-violet-300 border border-violet-500/20 rounded px-2 py-0.5"
              >
                {allBrAtivo ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            {brDireitos.map(d => {
              const idx = form.direitos.findIndex(fd => fd.codigo === d.codigo)
              return (
                <div key={d.codigo} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <input
                    type="checkbox"
                    checked={d.ativo}
                    onChange={e => {
                      const dirs = [...form.direitos]
                      dirs[idx] = { ...dirs[idx], ativo: e.target.checked }
                      updateForm({ direitos: dirs })
                    }}
                    className="w-4 h-4 accent-violet-500"
                  />
                  <span className="text-xs text-white/70 flex-1">
                    {CODIGO_DIREITO_LABELS[d.codigo as keyof typeof CODIGO_DIREITO_LABELS]}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={d.pct_titular}
                      onChange={e => {
                        const dirs = [...form.direitos]
                        dirs[idx] = { ...dirs[idx], pct_titular: e.target.value, pct_editora: String(100 - parseFloat(e.target.value || '0')) }
                        updateForm({ direitos: dirs })
                      }}
                      disabled={!d.ativo}
                      className="w-16 h-7 bg-white/[0.04] border border-white/[0.08] rounded px-2 text-xs text-white/70 outline-none focus:border-violet-500/40 disabled:opacity-30"
                    />
                    <span className="text-xs text-white/30">/ {formatarPercentual(Number(d.pct_editora))}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* EXT */}
        {extDireitos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 mt-4">
              <p className="text-xs font-semibold text-sky-400">Exterior (EXT)</p>
              <button
                onClick={() => toggleAll('EXT_', !allExtAtivo)}
                className="text-xs text-sky-400/70 hover:text-sky-300 border border-sky-500/20 rounded px-2 py-0.5"
              >
                {allExtAtivo ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            {extDireitos.map(d => {
              const idx = form.direitos.findIndex(fd => fd.codigo === d.codigo)
              return (
                <div key={d.codigo} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <input
                    type="checkbox"
                    checked={d.ativo}
                    onChange={e => {
                      const dirs = [...form.direitos]
                      dirs[idx] = { ...dirs[idx], ativo: e.target.checked }
                      updateForm({ direitos: dirs })
                    }}
                    className="w-4 h-4 accent-sky-500"
                  />
                  <span className="text-xs text-white/70 flex-1">
                    {CODIGO_DIREITO_LABELS[d.codigo as keyof typeof CODIGO_DIREITO_LABELS]}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={d.pct_titular}
                      onChange={e => {
                        const dirs = [...form.direitos]
                        dirs[idx] = { ...dirs[idx], pct_titular: e.target.value, pct_editora: String(100 - parseFloat(e.target.value || '0')) }
                        updateForm({ direitos: dirs })
                      }}
                      disabled={!d.ativo}
                      className="w-16 h-7 bg-white/[0.04] border border-white/[0.08] rounded px-2 text-xs text-white/70 outline-none focus:border-violet-500/40 disabled:opacity-30"
                    />
                    <span className="text-xs text-white/30">/ {formatarPercentual(Number(d.pct_editora))}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Step 5: Obras ───────────────────────────────────────────────────────────
  const renderStep4 = () => (
    <div className="space-y-4">
      <p className="text-sm text-white/60">Adicione as obras vinculadas ao contrato:</p>
      {form.obras.map((obra, i) => (
        <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60">Obra {i + 1}</span>
            {form.obras.length > 1 && (
              <button
                onClick={() => updateForm({ obras: form.obras.filter((_, j) => j !== i) })}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Remover
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 block mb-1">Titulo</label>
              <input
                type="text"
                value={obra.titulo}
                onChange={e => {
                  const obras = [...form.obras]
                  obras[i] = { ...obras[i], titulo: e.target.value.toUpperCase() }
                  updateForm({ obras })
                }}
                placeholder="EX: AMOR DE BAR"
                className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40 uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Codigo interno</label>
              <input
                type="text"
                value={obra.codigo}
                onChange={e => {
                  const obras = [...form.obras]
                  obras[i] = { ...obras[i], codigo: e.target.value.toUpperCase() }
                  updateForm({ obras })
                }}
                placeholder="EX: TSM-OBR-001"
                className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40 uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">% Autor na obra</label>
              <input
                type="number"
                min={0}
                max={100}
                value={obra.percentual_autor}
                onChange={e => {
                  const obras = [...form.obras]
                  obras[i] = { ...obras[i], percentual_autor: e.target.value }
                  updateForm({ obras })
                }}
                className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={obra.controlado}
                  onChange={e => {
                    const obras = [...form.obras]
                    obras[i] = { ...obras[i], controlado: e.target.checked }
                    updateForm({ obras })
                  }}
                  className="w-4 h-4 accent-violet-500"
                />
                <span className="text-xs text-white/60">Controlado pela editora</span>
              </label>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={() => updateForm({ obras: [...form.obras, { titulo: '', codigo: '', percentual_autor: '100', controlado: false }] })}
        className="text-xs text-violet-400 hover:text-violet-300 transition-colors border border-violet-500/20 rounded-lg px-3 py-1.5"
      >
        + Adicionar obra
      </button>
    </div>
  )

  // ── Step 6: Periodo + Territorio + Exclusividade ────────────────────────────
  const renderStep5 = () => (
    <div className="space-y-5">
      {/* Alerta termino obrigatorio */}
      {termObrig && (
        <AlertBox variant="rose">
          Este tipo de contrato exige DATA DE TERMINO obrigatoria. Ao fim do prazo os direitos retornam ao cedente automaticamente no dia subsequente.
        </AlertBox>
      )}

      {/* Exclusividade: alertas escalonados */}
      {form.tipo === 'exclusividade_autor_editora' && (
        <AlertBox variant="yellow">
          EXCLUSIVIDADE: o sistema enviara alertas em 90 dias, 30 dias, 10 dias antes do vencimento e DIARIAMENTE nos dias finais, a cada acesso de colaborador.
        </AlertBox>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/40 block mb-2">Inicio de vigencia *</label>
          <input
            type="date"
            value={form.vigencia_inicio}
            onChange={e => updateForm({ vigencia_inicio: e.target.value })}
            className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-2">
            Fim de vigencia {termObrig ? <span className="text-rose-400">*</span> : '(opcional)'}
          </label>
          <input
            type="date"
            value={form.vigencia_fim}
            onChange={e => updateForm({ vigencia_fim: e.target.value })}
            disabled={form.prazo_indeterminado}
            className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40 disabled:opacity-40"
          />
          {!termObrig && (
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.prazo_indeterminado}
                onChange={e => updateForm({ prazo_indeterminado: e.target.checked })}
                className="w-4 h-4 accent-violet-500"
              />
              <span className="text-xs text-white/60">Prazo indeterminado</span>
            </label>
          )}
        </div>
      </div>

      {/* Renovacao automatica */}
      {podeRenovar && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.renovacao_automatica}
            onChange={e => updateForm({ renovacao_automatica: e.target.checked })}
            className="w-4 h-4 accent-violet-500"
          />
          <div>
            <span className="text-sm text-white/80">Renovacao automatica</span>
            <p className="text-xs text-white/40">Ao atingir a data de termino, o contrato e renovado automaticamente pelo mesmo periodo</p>
          </div>
        </label>
      )}

      <div>
        <label className="text-xs text-white/40 block mb-2">Territorio de abrangencia</label>
        <select
          value={form.territorio}
          onChange={e => updateForm({ territorio: e.target.value })}
          className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
        >
          <option value="BR">Brasil (BR)</option>
          <option value="EXT">Exterior (EXT)</option>
          <option value="MUNDIAL">Mundial</option>
          <option value="LATAM">America Latina (LATAM)</option>
          <option value="EUR">Europa (EUR)</option>
          <option value="USA">Estados Unidos (USA)</option>
        </select>
      </div>

      <div className="space-y-3">
        {form.tipo !== 'exclusividade_autor_editora' && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.exclusividade}
              onChange={e => updateForm({ exclusividade: e.target.checked })}
              className="w-4 h-4 accent-rose-500"
            />
            <div>
              <span className="text-sm text-white/80">Clausula de exclusividade</span>
              <p className="text-xs text-white/40">Titular nao podera celebrar contratos com outras editoras durante a vigencia</p>
            </div>
          </label>
        )}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.clausula_reversao}
            onChange={e => updateForm({ clausula_reversao: e.target.checked })}
            className="w-4 h-4 accent-violet-500"
          />
          <div>
            <span className="text-sm text-white/80">Clausula de reversao</span>
            <p className="text-xs text-white/40">Direitos revertem ao titular caso editora nao comercialize as obras</p>
          </div>
        </label>
      </div>
    </div>
  )

  // ── Step 7: Recoupment ──────────────────────────────────────────────────────
  const renderStep6 = () => (
    <div className="space-y-4">
      <p className="text-sm text-white/60">Adiantamento e recoupment (opcional):</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/40 block mb-2">Valor do adiantamento (R$)</label>
          <input
            type="number"
            min={0}
            value={form.adiantamento}
            onChange={e => updateForm({ adiantamento: e.target.value })}
            placeholder="Ex: 30000"
            className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-2">Descricao</label>
          <input
            type="text"
            value={form.descricao_recoupment}
            onChange={e => updateForm({ descricao_recoupment: e.target.value })}
            placeholder="Ex: Adiantamento de royalties Jan/2025"
            className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
          />
        </div>
      </div>
      {parseFloat(form.adiantamento || '0') > 0 && (
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
          <p className="text-xs text-sky-300">
            Sera criado um recoupment aberto de{' '}
            <strong>R$ {parseFloat(form.adiantamento).toLocaleString('pt-BR')}</strong>{' '}
            para o titular principal. O saldo sera abatido conforme distribuicoes futuras.
          </p>
        </div>
      )}
    </div>
  )

  // ── Step 8: Assinatura ──────────────────────────────────────────────────────
  const renderStep7 = () => (
    <div className="space-y-4">
      <p className="text-sm text-white/60">Escolha o provedor de assinatura digital:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(PROVEDOR_ASSINATURA_LABELS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => updateForm({ provedor_assinatura: k })}
            className={[
              'text-left p-4 rounded-xl border transition-all',
              form.provedor_assinatura === k
                ? 'border-violet-500/60 bg-violet-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
            ].join(' ')}
          >
            <div className="text-sm font-semibold text-white/80">{v}</div>
            {k === 'd4sign'     && <p className="text-xs text-white/40 mt-1">Plataforma brasileira, integracao via API</p>}
            {k === 'docusign'   && <p className="text-xs text-white/40 mt-1">Padrao internacional, ampla adocao</p>}
            {k === 'icp_brasil' && <p className="text-xs text-white/40 mt-1">Certificado digital ICP-Brasil, valor legal maximo</p>}
            {k === 'manual'     && <p className="text-xs text-white/40 mt-1">Upload de documento assinado fisicamente</p>}
          </button>
        ))}
      </div>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
        <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Partes que devem assinar</p>
        {form.partes.map((p, i) => {
          const t = todosOsTitulares.find(x => x.id === p.titular_id)
          return (
            <p key={i} className="text-xs text-white/60 py-1 border-b border-white/[0.04] last:border-0">
              {t?.nome ?? '(não selecionado)'} — {PAPEL_PARTE_LABELS[p.papel]}
            </p>
          )
        })}
        <p className="text-xs text-white/60 py-1">
          {selectedEditora?.nome ?? '(Editora não selecionada)'} — Editora
        </p>
      </div>
    </div>
  )

  // ── Step 9: Revisao ─────────────────────────────────────────────────────────
  const renderStep8 = () => (
    <div className="space-y-5">
      <p className="text-sm text-white/60">Revise as informacoes antes de criar o contrato:</p>
      <div className="space-y-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Tipo & Editora</p>
          <p className="text-sm text-white/80">
            {form.tipo ? TIPO_CONTRATO_V2_LABELS[form.tipo] : '—'} · {selectedEditora?.nome ?? '—'}
          </p>
          {cfg && <p className="text-xs text-white/40 mt-1">Titulares: {cfg.titulares_envolvidos}</p>}
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Partes ({form.partes.length})</p>
          {form.partes.map((p, i) => {
            const t = todosOsTitulares.find(x => x.id === p.titular_id)
            return (
              <p key={i} className="text-sm text-white/70">
                {t?.nome ?? '—'} — {PAPEL_PARTE_LABELS[p.papel]} — {p.percentual}%
              </p>
            )
          })}
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Direitos ({form.direitos.filter(d => d.ativo).length} ativos)</p>
          <p className="text-sm text-white/70">
            BR ativos: {form.direitos.filter(d => d.ativo && d.codigo.startsWith('BR_')).length} |{' '}
            EXT ativos: {form.direitos.filter(d => d.ativo && d.codigo.startsWith('EXT_')).length}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Obras ({form.obras.length})</p>
          {form.obras.map((o, i) => (
            <p key={i} className="text-sm text-white/70">{o.titulo || '(sem titulo)'} — {o.percentual_autor}%</p>
          ))}
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Vigencia & Territorio</p>
          <p className="text-sm text-white/70">
            {form.vigencia_inicio || '—'} ate {form.prazo_indeterminado ? 'Indeterminado' : (form.vigencia_fim || '—')} · {form.territorio}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {form.renovacao_automatica && <span className="text-xs bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded">Renovacao automatica</span>}
            {(form.exclusividade || form.tipo === 'exclusividade_autor_editora') && <span className="text-xs bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded">Exclusividade</span>}
            {form.clausula_reversao && <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Clausula de Reversao</span>}
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Assinatura</p>
          <p className="text-sm text-white/70">
            {PROVEDOR_ASSINATURA_LABELS[form.provedor_assinatura as keyof typeof PROVEDOR_ASSINATURA_LABELS] ?? '—'}
          </p>
        </div>
        {parseFloat(form.adiantamento || '0') > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Recoupment</p>
            <p className="text-sm text-white/70">
              R$ {parseFloat(form.adiantamento).toLocaleString('pt-BR')} — {form.descricao_recoupment || '—'}
            </p>
          </div>
        )}
      </div>
      <button
        onClick={async () => {
          // ── Validações ──
          const mainParte = form.partes[0]
          if (!mainParte?.titular_id || mainParte.titular_id.startsWith('tit-novo-')) {
            setSaveError('Selecione um titular válido cadastrado no banco.')
            return
          }
          if (!form.editora_id) { setSaveError('Selecione uma editora.'); return }
          if (!form.vigencia_inicio) { setSaveError('Informe a data de início da vigência.'); return }
          if (!form.tipo) { setSaveError('Selecione o tipo de contrato.'); return }

          // ── Mapeamento tipo wizard → enum banco ──
          const tipoMap: Record<string, string> = {
            cessao_parcial: 'cessao', cessao_total: 'cessao',
            cessao_internacional: 'cessao', cessionario_pf: 'cessao', cessionario_pj: 'cessao',
            licenciamento: 'licenciamento', licenciamento_licenciante_pf: 'licenciamento',
            licenciamento_licenciante_pj: 'licenciamento',
            administracao_editorial: 'administracao',
            coedicao: 'coedicao', subedicao: 'subedicao',
            exclusividade_autor_editora: 'autorizacao',
          }
          const tipoEnum = tipoMap[form.tipo] ?? 'cessao'

          // ── Percentuais ──
          const percentualAutor = Number(mainParte.percentual ?? 75)
          const percentualEditora = Math.round((100 - percentualAutor) * 10000) / 10000

          // ── Splits por direito (strip prefixo BR_/EXT_) ──
          const splitsDireitos: Record<string, { percentual_editora: number; percentual_autor: number }> = {}
          for (const d of form.direitos) {
            if (!d.ativo) continue
            const codigo = d.codigo.replace(/^(BR_|EXT_)/, '')
            if (splitsDireitos[codigo]) continue // BR prevalece sobre EXT
            splitsDireitos[codigo] = {
              percentual_editora: Number(d.pct_editora) || 0,
              percentual_autor:   Number(d.pct_titular) || 0,
            }
          }

          const payload = {
            tipo:                tipoEnum,
            editora_id:          form.editora_id,
            titular_id:          mainParte.titular_id,
            percentual_editora:  percentualEditora,
            percentual_autor:    percentualAutor,
            splits_direitos:     splitsDireitos,
            data_inicio:         form.vigencia_inicio,
            data_fim:            form.prazo_indeterminado ? null : (form.vigencia_fim || null),
            prazo_indeterminado: form.prazo_indeterminado,
            territorio:          form.territorio,
            exclusividade:       form.exclusividade,
            status:              'assinado',
            numero:              `CTR-${Date.now()}`,
            observacoes:         [form.tipo, form.descricao_recoupment].filter(Boolean).join(' — ') || null,
          }

          setSaving(true)
          setSaveError(null)
          try {
            const res = await authFetch('/api/contratos', {
              method: 'POST',
              body: JSON.stringify(payload),
            })
            if (!res.ok) {
              const err = await res.json().catch(() => ({}))
              setSaveError((err as Record<string, string>).error ?? `Erro ${res.status} ao salvar contrato.`)
              return
            }
            router.push('/master/contratos')
          } catch {
            setSaveError('Erro inesperado ao salvar. Verifique a conexão.')
          } finally {
            setSaving(false)
          }
        }}
        disabled={saving}
        className="w-full h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        {saving ? 'Salvando...' : 'Criar Contrato'}
      </button>
      {saveError && (
        <p className="text-xs text-rose-400 text-center mt-1">{saveError}</p>
      )}
    </div>
  )

  const steps = [
    renderStep0, renderStep1, renderStep2, renderStep3,
    renderStep4, renderStep5, renderStep6, renderStep7, renderStep8,
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Novo Contrato"
        description={`Passo ${step + 1} de ${TOTAL_STEPS} — ${STEP_CONFIG[step].label}`}
        actions={
          <button onClick={() => router.push('/master/contratos')} className="text-sm text-white/40 hover:text-white/70">
            Cancelar
          </button>
        }
      />

      {/* Step indicator */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-start justify-between overflow-x-auto gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex items-center flex-shrink-0">
              <StepIndicator step={i} current={step} />
              {i < TOTAL_STEPS - 1 && (
                <div className={`w-4 md:w-8 h-px mx-1 ${i < step ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
        {steps[step]()}
      </div>

      {/* Navigation */}
      {step < TOTAL_STEPS - 1 && (
        <div className="flex justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-white/[0.08] text-sm text-white/60 hover:text-white/80 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
          >
            Proximo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
