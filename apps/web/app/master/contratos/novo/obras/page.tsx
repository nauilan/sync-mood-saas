'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authFetch } from '@/lib/supabase/client'
import {
  ChevronLeft, ChevronRight, Check, Scale, Users, ShieldCheck,
  Music, Globe, Pen, Eye, Plus, Trash2, AlertTriangle,
  Info, Search, CheckCircle2, Download, UserCheck, X,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

// ── Constantes ───────────────────────────────────────────────────────────────

const STEP_LABELS = [
  { label: 'Tipo',          icon: Scale },
  { label: 'Titular',       icon: Users },
  { label: 'Obras',         icon: Music },
  { label: 'Direitos',      icon: ShieldCheck },
  { label: 'Cadastro',      icon: Music },
  { label: 'Data & Resumo', icon: Globe },
  { label: 'Assinatura',    icon: Pen },
  { label: 'Revisão',       icon: Eye },
]
const TOTAL_STEPS = STEP_LABELS.length

type TipoObra = 'cessao_obras' | 'coedicao'

const TIPO_CONFIG: Record<TipoObra, { nome: string; descricao: string; cor: string }> = {
  cessao_obras: {
    nome: 'Cessão de Obras',
    descricao: 'O autor cede direitos patrimoniais das obras à editora. A editora administra, exporta, recebe e licencia a parte cedida. Pode ser parcial ou total conforme o percentual negociado.',
    cor: 'violet',
  },
  coedicao: {
    nome: 'Coedição',
    descricao: 'Duas ou mais editoras dividem o controle editorial sobre a participação do autor. Cada uma recebe, exporta e licencia conforme seu percentual de forma individual.',
    cor: 'teal',
  },
}

// Direitos BR (padrão 75/25)
const DIREITOS_BR = [
  { codigo: 'BR_a', nome: 'a) Reprodução Gráfica (Edição)' },
  { codigo: 'BR_b', nome: 'b) Reprodução Fonomecânica (venda e locação de gravações)' },
  { codigo: 'BR_c', nome: 'c) Inclusão e Adaptação em Produções Audiovisuais' },
  { codigo: 'BR_d', nome: 'd) Inclusão e Adaptação em Produções Publicitárias, Gráficas, Sonoras ou Audiovisuais' },
  { codigo: 'BR_e', nome: 'e) Distribuição por Meios Óticos, Cabo, Satélites, Redes, Internet (seleção da obra)' },
  { codigo: 'BR_f', nome: 'f) Inclusão em Base de Dados ou qualquer forma de Armazenamento' },
  { codigo: 'BR_g', nome: 'g) Comunicação ao Público' },
  { codigo: 'BR_h', nome: 'h) Autorizações com Ônus (liberações)' },
]

// Direitos EXT (padrão 50/50)
const DIREITOS_EXT = [
  { codigo: 'EXT_a', nome: 'a) Reprodução Gráfica (Edição)' },
  { codigo: 'EXT_b', nome: 'b) Reprodução Fonomecânica' },
  { codigo: 'EXT_c', nome: 'c) Inclusão e Adaptação em Produções Audiovisuais' },
  { codigo: 'EXT_d', nome: 'd) Inclusão e Adaptação em Produções Publicitárias Gráficas, Sonoras ou Audiovisuais' },
  { codigo: 'EXT_e', nome: 'e) Distribuição por Meios Óticos, Cabo, Satélites, Redes, Internet' },
  { codigo: 'EXT_f', nome: 'f) Inclusão em Base de Dados ou qualquer forma de Armazenamento' },
  { codigo: 'EXT_g', nome: 'g) Comunicação ao Público' },
]

// ── Signatários — selecionados de PF reais do banco (sem cargo manual) ────────

type SignatarioForm = {
  id: string
  nome: string
  cpf: string
  email: string
}

// Siglas oficiais: CA=Compositor/Autor | AD=Adaptador | AR=Arranjador
//                  V=Versionista | E=Editora | SE=Subeditora | AM=Editora Administradora
const PAPEIS_OBRA = [
  { value: 'compositor',     label: 'Compositor (CA)' },
  { value: 'autor_ca',       label: 'Autor (CA)' },
  { value: 'arranjador',     label: 'Arranjador (AR)' },
  { value: 'versionista',    label: 'Versionista (V)' },
  { value: 'adaptador',      label: 'Adaptador (AD)' },
  { value: 'editora',        label: 'Editora (E)' },
  { value: 'subeditora',     label: 'Subeditora (SE)' },
  { value: 'administradora', label: 'Editora Administradora (AM)' },
]

// ── Tipos de Form ────────────────────────────────────────────────────────────

type DireitoForm = {
  codigo: string
  nome: string
  bloco: 'BR' | 'EXT'
  ativo: boolean
  pct_autor: number
  pct_editora: number
}

// Regra de negócio: coautores NÃO são controlados automaticamente pela editora
// neste contrato. Cada titular possui seu próprio instrumento contratual.
// O campo "editado" foi removido — controle editorial é sempre derivado de contrato próprio.
type CoAutor = {
  id: string
  titular_id: string
  nome: string
  pct: number
  papel: string
}

type ObraForm = {
  id: string
  titulo: string
  titulo_alternativo: string
  subtitulo: string
  texto_poetico: string
  pct_autor: number
  papel_autor: string
  co_autores: CoAutor[]
}

type EditoraCoeditora = {
  id: string
  editora_id: string
  nome: string
  pct: number
}

type FormState = {
  tipo: TipoObra | ''
  titular_id: string
  titular_nome: string
  titular_email: string
  titular_cpf: string
  direitos: DireitoForm[]
  obras: ObraForm[]
  editoras_coeditoras: EditoraCoeditora[]
  data_emissao: string
  provedor_assinatura: string
  // Signatários — selecionados de PF reais do banco
  responsavel_editora: SignatarioForm
  testemunha1: SignatarioForm
  testemunha2: SignatarioForm
  observacoes: string
}

// ── PF para pickers ───────────────────────────────────────────────────────────

type PessoaFisica = {
  id: string
  nome_completo: string
  cpf_cnpj?: string
  email?: string
}

function novaObra(): ObraForm {
  return {
    id: `obra-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    titulo: '',
    titulo_alternativo: '',
    subtitulo: '',
    texto_poetico: '',
    pct_autor: '' as unknown as number,
    papel_autor: 'compositor',
    co_autores: [],
  }
}

function buildDireitos(): DireitoForm[] {
  return [
    ...DIREITOS_BR.map(d => ({ ...d, bloco: 'BR' as const, ativo: true, pct_autor: 75, pct_editora: 25 })),
    ...DIREITOS_EXT.map(d => ({ ...d, bloco: 'EXT' as const, ativo: true, pct_autor: 50, pct_editora: 50 })),
  ]
}

const INITIAL_SIGNATARIO: SignatarioForm = { id: '', nome: '', cpf: '', email: '' }

const INITIAL: FormState = {
  tipo: '',
  titular_id: '',
  titular_nome: '',
  titular_email: '',
  titular_cpf: '',
  direitos: buildDireitos(),
  obras: [novaObra()],
  editoras_coeditoras: [],
  data_emissao: new Date().toISOString().slice(0, 10),
  provedor_assinatura: 'd4sign',
  responsavel_editora: { ...INITIAL_SIGNATARIO },
  testemunha1: { ...INITIAL_SIGNATARIO },
  testemunha2: { ...INITIAL_SIGNATARIO },
  observacoes: '',
}

// ── Helpers visuais ──────────────────────────────────────────────────────────

function corBadge(tipo: TipoObra) {
  return {
    cessao_obras: 'bg-violet-500/15 text-violet-300 border border-violet-500/20',
    coedicao:     'bg-teal-500/15 text-teal-300 border border-teal-500/20',
  }[tipo]
}

function somaCoAutores(obra: ObraForm): number {
  return obra.co_autores.reduce((s, c) => s + (c.pct || 0), 0)
}

function somaTotal(obra: ObraForm): number {
  return (obra.pct_autor || 0) + somaCoAutores(obra)
}

function AlertBox({ children, variant = 'amber' }: { children: React.ReactNode; variant?: 'amber' | 'rose' | 'emerald' | 'sky' }) {
  const v = {
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-300',
    rose:    'bg-rose-500/10 border-rose-500/20 text-rose-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    sky:     'bg-sky-500/10 border-sky-500/20 text-sky-300',
  }[variant]
  return (
    <div className={`flex items-start gap-2 border rounded-xl px-4 py-3 text-xs ${v}`}>
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

// ── Geração de download do contrato (texto formatado → blob) ─────────────────

function gerarDownloadContrato(form: FormState, modo: 'rascunho' | 'assinado') {
  const resp = form.responsavel_editora
  const t1   = form.testemunha1
  const t2   = form.testemunha2
  const tipoNome = form.tipo ? TIPO_CONFIG[form.tipo].nome : '—'
  const linhaDir = (d: DireitoForm) =>
    `   [${d.ativo ? 'X' : ' '}] ${d.nome}\n       Autor: ${d.pct_autor}%   |   Editora: ${d.pct_editora}%\n`

  const texto = [
    '========================================================',
    `           CONTRATO DE ${tipoNome.toUpperCase()}`,
    modo === 'rascunho' ? '                    *** RASCUNHO ***' : '                  *** ASSINADO PELAS PARTES ***',
    '========================================================',
    '',
    `Data de Emissão : ${form.data_emissao || '—'}`,
    `Provedor        : ${form.provedor_assinatura?.toUpperCase()}`,
    '',
    '── EDITORA ─────────────────────────────────────────────',
    'TOP SHOW MUSIC',
    `Responsável     : ${resp.nome}`,
    `CPF             : ${resp.cpf}`,
    `E-mail          : ${resp.email}`,
    '',
    '── CEDENTE (AUTOR) ──────────────────────────────────────',
    `Nome            : ${form.titular_nome || '—'}`,
    '',
    ...form.obras.flatMap((o, i) => [
      `── OBRA ${i + 1} ${'─'.repeat(50 - 9)}`,
      `Título          : ${o.titulo}`,
      o.titulo_alternativo ? `Título Alt.     : ${o.titulo_alternativo}` : '',
      o.subtitulo          ? `Subtítulo       : ${o.subtitulo}` : '',
      `% Autor         : ${o.pct_autor}%`,
      ...o.co_autores.map(c => `Co-autor        : ${c.nome || '—'}  ${c.pct}%`),
      o.texto_poetico ? `\nLetra:\n${o.texto_poetico}` : '',
      '',
    ].filter(Boolean)),
    '── DIREITOS BRASIL ──────────────────────────────────────',
    ...form.direitos.filter(d => d.bloco === 'BR').map(linhaDir),
    '── DIREITOS EXTERIOR ────────────────────────────────────',
    ...form.direitos.filter(d => d.bloco === 'EXT').map(linhaDir),
    '── ASSINATURAS ──────────────────────────────────────────',
    '',
    `Cedente: ${form.titular_nome || '—'}`,
    modo === 'assinado' ? '  Assinado digitalmente' : '  _________________________________',
    '',
    `Responsável Editora: ${resp.nome}`,
    modo === 'assinado' ? '  Assinado digitalmente' : '  _________________________________',
    '',
    `Testemunha 1: ${t1.nome}`,
    modo === 'assinado' ? '  Assinado digitalmente' : '  _________________________________',
    '',
    `Testemunha 2: ${t2.nome}`,
    modo === 'assinado' ? '  Assinado digitalmente' : '  _________________________________',
    '',
    '========================================================',
    '              TOP SHOW MUSIC — Sistema SyncMood',
    '========================================================',
  ].join('\n')

  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `contrato_${tipoNome.toLowerCase().replace(/\s+/g, '_')}_${form.titular_nome?.split(' ')[0] || 'autor'}_${form.data_emissao || 'sem_data'}_${modo}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// ── PessoaPicker — seleciona PF real do banco ────────────────────────────────

function PessoaPicker({
  label, cor, badge, valor, onChange, lista,
}: {
  label: string
  cor: string
  badge: string
  valor: SignatarioForm
  onChange: (v: SignatarioForm) => void
  lista: PessoaFisica[]
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

  const filtrado = lista.filter(p => {
    const q = busca.toUpperCase()
    return (
      (p.nome_completo ?? '').toUpperCase().includes(q) ||
      (p.cpf_cnpj ?? '').includes(q)
    )
  })

  function selecionar(p: PessoaFisica) {
    onChange({ id: p.id, nome: p.nome_completo, cpf: p.cpf_cnpj ?? '', email: p.email ?? '' })
    setAberto(false)
    setBusca('')
  }

  function limpar() {
    onChange({ id: '', nome: '', cpf: '', email: '' })
    setAberto(false)
    setBusca('')
  }

  const borderColor = `border-${cor}-500/20`
  const bgColor = `bg-${cor}-500/15`
  const iconColor = `text-${cor}-400`
  const badgeColor = `text-${cor}-400/70 bg-${cor}-500/10 border-${cor}-500/20`

  return (
    <div className={`bg-white/[0.02] border ${borderColor} rounded-xl p-4 space-y-2.5`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
          <UserCheck className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-white/70">{label}</p>
          <p className="text-[10px] text-white/35">Pessoa Física cadastrada no banco</p>
        </div>
        <span className={`text-[10px] ${badgeColor} px-2 py-0.5 rounded border`}>{badge}</span>
      </div>

      {valor.id ? (
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white/80 truncate">{valor.nome}</p>
            <p className="text-[10px] text-white/40">
              {valor.cpf ? `CPF: ${valor.cpf}` : ''}
              {valor.cpf && valor.email ? ' · ' : ''}
              {valor.email}
            </p>
          </div>
          <button
            onClick={limpar}
            className="p-1 rounded hover:bg-rose-500/10 text-white/25 hover:text-rose-400 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAberto(o => !o)}
          className="w-full h-9 flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white/30 hover:border-white/15 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          Selecionar pessoa física...
        </button>
      )}

      {aberto && (
        <div className="space-y-2">
          <input
            autoFocus
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-violet-500/40"
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtrado.length === 0 && (
              <p className="text-xs text-white/25 py-3 text-center">Nenhuma pessoa encontrada.</p>
            )}
            {filtrado.map(p => (
              <button
                key={p.id}
                onClick={() => selecionar(p)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <p className="text-sm text-white/70">{p.nome_completo}</p>
                <p className="text-[10px] text-white/35">
                  {p.cpf_cnpj ? `CPF: ${p.cpf_cnpj}` : ''}
                  {p.cpf_cnpj && p.email ? ' · ' : ''}
                  {p.email}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function NovoContratoObrasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [buscaTitular, setBuscaTitular] = useState('')
  const [obraAtiva, setObraAtiva] = useState(0)
  const [editContratoId, setEditContratoId] = useState<string | null>(null)
  const btnProximoRef = useRef<HTMLButtonElement>(null)
  // Titulares PF+Autor para Step 1
  const [titulares, setTitulares] = useState<{ id: string; nome_completo: string; cpf?: string; codigo_titular?: string; pessoa?: string; email?: string; contatos?: Array<{tipo: string; valor: string}> }[]>([])
  // Todas as PF do banco para pickers de assinantes
  const [pessoasFisicas, setPessoasFisicas] = useState<PessoaFisica[]>([])
  const [editoras, setEditoras] = useState<{ id: string; nome_fantasia: string; cnpj?: string; tipo_editora?: string }[]>([])
  const [editoraMasterId, setEditoraMasterId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // Detecção de obra duplicada
  const [obrasExistentes, setObrasExistentes] = useState<{ id: string; titulo: string }[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset/carrega ao montar — garante wizard limpo ou pré-preenchido em modo edição
  useEffect(() => {
    const editId = searchParams?.get('edit') ?? null
    setBuscaTitular('')
    setObraAtiva(0)
    setSaveError(null)

    if (editId) {
      // Modo edição: carregar contrato existente
      setEditContratoId(editId)
      authFetch(`/api/contratos/${editId}`)
        .then(r => r.json())
        .then(json => {
          const c = json.contrato
          if (!c) return

          // Reverse-map tipo DB → form value
          const tipoFormMap: Record<string, string> = { cessao: 'cessao_obras', cessao_parcial: 'cessao_obras' }
          const d4sign: Array<{ papel: string; nome?: string; cpf?: string; email?: string; titular_id?: string }> = c.assinantes_d4sign ?? []

          const findSignatario = (papel: string): SignatarioForm => {
            const a = d4sign.find(x => x.papel === papel)
            return a ? { id: a.titular_id ?? '', nome: a.nome ?? '', cpf: a.cpf ?? '', email: a.email ?? '' } : { ...INITIAL_SIGNATARIO }
          }

          setStep(0)
          setForm({
            tipo:                    (tipoFormMap[c.tipo] ?? c.tipo ?? '') as TipoObra | '',
            titular_id:              c.titular_id ?? '',
            titular_nome:            c.titular_principal ?? '',
            titular_email:           d4sign.find(a => a.papel === 'cedente')?.email ?? '',
            titular_cpf:             d4sign.find(a => a.papel === 'cedente')?.cpf ?? '',
            direitos:                Array.isArray(c.splits_direitos) && c.splits_direitos.length ? c.splits_direitos : buildDireitos(),
            obras:                   Array.isArray(c.obras_json) && c.obras_json.length ? c.obras_json : [novaObra()],
            editoras_coeditoras:     [],
            data_emissao:            c.vigencia_inicio ?? c.data_inicio ?? new Date().toISOString().slice(0, 10),
            provedor_assinatura:     c.provedor_assinatura ?? 'd4sign',
            responsavel_editora:     findSignatario('responsavel_editora'),
            testemunha1:             findSignatario('testemunha_1'),
            testemunha2:             findSignatario('testemunha_2'),
            observacoes:             c.observacoes ?? '',
          })
          if (c.editora_id) setEditoraMasterId(c.editora_id)
        })
        .catch(() => {
          // Falha ao carregar: wizard limpo
          setEditContratoId(null)
          setForm({ tipo: '', titular_id: '', titular_email: '', titular_cpf: '', titular_nome: '', direitos: buildDireitos(), obras: [novaObra()], editoras_coeditoras: [], data_emissao: new Date().toISOString().slice(0, 10), provedor_assinatura: 'd4sign', responsavel_editora: { ...INITIAL_SIGNATARIO }, testemunha1: { ...INITIAL_SIGNATARIO }, testemunha2: { ...INITIAL_SIGNATARIO }, observacoes: '' })
        })
    } else {
      // Modo criação: wizard limpo
      setEditContratoId(null)
      setStep(0)
      setForm({
        tipo: '',
        titular_id: '',
        titular_nome: '',
        titular_email: '',
        titular_cpf: '',
        direitos: buildDireitos(),
        obras: [novaObra()],
        editoras_coeditoras: [],
        data_emissao: new Date().toISOString().slice(0, 10),
        provedor_assinatura: 'd4sign',
        responsavel_editora: { ...INITIAL_SIGNATARIO },
        testemunha1: { ...INITIAL_SIGNATARIO },
        testemunha2: { ...INITIAL_SIGNATARIO },
        observacoes: '',
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Step 1: apenas PF categoria autor
    authFetch('/api/titulares?tipo=autor&status=ativo&per_page=200')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const pf = (d.data ?? []).filter((t: { pessoa?: string }) => !t.pessoa || t.pessoa === 'PF')
        setTitulares(pf)
      })
      .catch(() => {})

    // Pickers de assinantes: todas as PF ativas
    authFetch('/api/titulares?tipo=todos&status=ativo&per_page=500')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const pf: PessoaFisica[] = (d.data ?? [])
          .filter((t: { pessoa?: string }) => !t.pessoa || t.pessoa === 'PF')
          .map((t: { id: string; nome_completo: string; cpf?: string; cpf_cnpj?: string; email?: string; contatos?: Array<{tipo: string; valor: string}> }) => {
            const email = t.email
              ?? (Array.isArray(t.contatos) ? t.contatos.find(c => c.tipo === 'email')?.valor ?? '' : '')
            return {
              id: t.id,
              nome_completo: t.nome_completo,
              cpf_cnpj: t.cpf ?? t.cpf_cnpj ?? '',
              email,
            }
          })
        setPessoasFisicas(pf)
      })
      .catch(() => {})

    authFetch('/api/editoras?status=todos')
      .then(r => r.ok ? r.json() : { editoras: [] })
      .then(d => {
        const eds = (d.editoras ?? []) as { id: string; nome_fantasia: string; cnpj?: string; tipo_editora?: string }[]
        setEditoras(eds)
        const master = eds.find(e => e.tipo_editora === 'master' || e.tipo_editora === 'propria') ?? eds[0]
        if (master) setEditoraMasterId(master.id)
      })
      .catch(() => {})
  }, [])

  // Reconciliação edit-mode: preenche titular_id dos signatários pelo CPF quando pessoasFisicas carrega
  useEffect(() => {
    if (!editContratoId || pessoasFisicas.length === 0) return
    setForm(prev => {
      function reconciliar(sig: SignatarioForm): SignatarioForm {
        if (sig.id || !sig.cpf) return sig
        const match = pessoasFisicas.find(p => (p.cpf_cnpj ?? '').replace(/\D/g, '') === sig.cpf.replace(/\D/g, ''))
        return match ? { ...sig, id: match.id, email: sig.email || match.email || '' } : sig
      }
      return {
        ...prev,
        responsavel_editora: reconciliar(prev.responsavel_editora),
        testemunha1: reconciliar(prev.testemunha1),
        testemunha2: reconciliar(prev.testemunha2),
      }
    })
  }, [editContratoId, pessoasFisicas]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce: verificar obra duplicada pelo título
  const checkObra = useCallback((titulo: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!titulo.trim()) { setObrasExistentes([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await authFetch(`/api/obras?search=${encodeURIComponent(titulo)}&per_page=5`)
        if (r.ok) {
          const d = await r.json()
          setObrasExistentes(d.data ?? d.obras ?? [])
        }
      } catch { /* silencioso */ }
    }, 600)
  }, [])

  function upd(patch: Partial<FormState>) { setForm(f => ({ ...f, ...patch })) }
  function next() { if (step < TOTAL_STEPS - 1) setStep(s => s + 1) }
  function prev() { if (step > 0) setStep(s => s - 1) }

  const titularFiltrado = titulares.filter(t => {
    const q = buscaTitular.toUpperCase()
    return (
      (t.nome_completo ?? '').toUpperCase().includes(q) ||
      (t.cpf ?? '').includes(q) ||
      (t.codigo_titular ?? '').toUpperCase().includes(q)
    )
  })

  // ── Obra helpers ──────────────────────────────────────────────────────────

  function updateObra(idx: number, patch: Partial<ObraForm>) {
    const obras = form.obras.map((o, i) => {
      if (i !== idx) return o
      const updated = { ...o, ...patch }
      if ('titulo' in patch) checkObra(patch.titulo ?? '')
      return updated
    })
    upd({ obras })
  }

  function addCoAutor(obraIdx: number) {
    const obras = form.obras.map((o, i) => i === obraIdx
      ? { ...o, co_autores: [...o.co_autores, { id: `ca-${Date.now()}`, titular_id: '', nome: '', pct: 0, papel: 'compositor' }] }
      : o
    )
    upd({ obras })
  }

  function updateCoAutor(obraIdx: number, caIdx: number, patch: Partial<CoAutor>) {
    const obras = form.obras.map((o, i) => {
      if (i !== obraIdx) return o
      return { ...o, co_autores: o.co_autores.map((c, j) => j === caIdx ? { ...c, ...patch } : c) }
    })
    upd({ obras })
  }

  function removeCoAutor(obraIdx: number, caIdx: number) {
    const obras = form.obras.map((o, i) => i !== obraIdx ? o : {
      ...o, co_autores: o.co_autores.filter((_, j) => j !== caIdx),
    })
    upd({ obras })
  }

  // ── Direitos helpers ──────────────────────────────────────────────────────

  function toggleAll(bloco: 'BR' | 'EXT', ativo: boolean) {
    upd({ direitos: form.direitos.map(d => d.bloco === bloco ? { ...d, ativo } : d) })
  }

  function updateDireito(codigo: string, patch: Partial<DireitoForm>) {
    const alvo = form.direitos.find(d => d.codigo === codigo)
    if (alvo && 'pct_autor' in patch) {
      const todosBloco = form.direitos.filter(d => d.bloco === alvo.bloco)
      const blocoTodoAtivo = todosBloco.every(d => d.ativo)
      if (blocoTodoAtivo) {
        upd({ direitos: form.direitos.map(d =>
          d.bloco === alvo.bloco ? { ...d, ...patch } : d
        )})
        return
      }
    }
    upd({ direitos: form.direitos.map(d => d.codigo === codigo ? { ...d, ...patch } : d) })
  }

  const allBR = form.direitos.filter(d => d.bloco === 'BR').every(d => d.ativo)
  const allEXT = form.direitos.filter(d => d.bloco === 'EXT').every(d => d.ativo)

  // ── Validações ────────────────────────────────────────────────────────────

  const obraInvalidas = form.obras.filter(o => somaTotal(o) !== 100 || !o.titulo.trim())

  // Valida os 4 assinantes obrigatórios
  // Regra jurídica: T1 ≠ cedente, T1 ≠ responsável; T2 ≠ cedente, T2 ≠ responsável, T2 ≠ T1
  // Email é obrigatório para todos (integração D4Sign)
  const errosAssinantes: string[] = (() => {
    const erros: string[] = []
    const cid  = form.titular_id
    const rid  = form.responsavel_editora.id
    const t1id = form.testemunha1.id
    const t2id = form.testemunha2.id

    // Presença obrigatória
    if (!rid)  erros.push('Responsável da editora não selecionado.')
    if (!t1id) erros.push('Testemunha 1 não selecionada.')
    if (!t2id) erros.push('Testemunha 2 não selecionada.')

    // Regra jurídica: testemunhas devem ser neutras (≠ cedente e ≠ responsável)
    if (cid && t1id && t1id === cid) erros.push('Testemunha 1 não pode ser o cedente.')
    if (rid && t1id && t1id === rid) erros.push('Testemunha 1 não pode ser o responsável da editora.')
    if (cid && t2id && t2id === cid) erros.push('Testemunha 2 não pode ser o cedente.')
    if (rid && t2id && t2id === rid) erros.push('Testemunha 2 não pode ser o responsável da editora.')
    if (t1id && t2id && t1id === t2id) erros.push('Testemunha 1 e Testemunha 2 não podem ser a mesma pessoa.')

    // E-mail obrigatório para D4Sign
    if (cid && !form.titular_email)                  erros.push('Cedente sem e-mail — atualize o cadastro do titular.')
    if (rid && !form.responsavel_editora.email)      erros.push('Responsável da editora sem e-mail cadastrado.')
    if (t1id && !form.testemunha1.email)             erros.push('Testemunha 1 sem e-mail cadastrado.')
    if (t2id && !form.testemunha2.email)             erros.push('Testemunha 2 sem e-mail cadastrado.')

    return erros
  })()

  async function salvarContrato(): Promise<{ id: string; numero: string } | null> {
    setSalvando(true)
    setSaveError(null)
    try {
      const payload = {
        tipo:            form.tipo || 'cessao_obras',
        titular_id:      form.titular_id || null,
        editora_id:      editoraMasterId || null,
        data_inicio:     form.data_emissao || null,
        observacoes:     form.observacoes || null,
        splits_direitos: form.direitos,
        status:          'rascunho',
        numero:          `CTO-${Date.now()}`,
        // Obras vinculadas ao contrato
        obras: form.obras.map(o => ({
          titulo:             o.titulo,
          titulo_alternativo: o.titulo_alternativo || null,
          subtitulo:          o.subtitulo || null,
          texto_poetico:      o.texto_poetico || null,
          pct_autor:          o.pct_autor,
          papel_autor:        o.papel_autor,
          co_autores: o.co_autores.map(c => ({
            titular_id: c.titular_id || null,
            nome:       c.nome,
            pct:        c.pct,
            papel:      c.papel,
          })),
        })),
        // Payload estruturado para D4Sign — 4 assinantes com e-mail
        assinantes_d4sign: [
          {
            papel:      'cedente',
            nome:       form.titular_nome,
            titular_id: form.titular_id,
            cpf:        form.titular_cpf || '',
            email:      form.titular_email,
          },
          {
            papel:      'responsavel_editora',
            titular_id: form.responsavel_editora.id,
            nome:       form.responsavel_editora.nome,
            cpf:        form.responsavel_editora.cpf,
            email:      form.responsavel_editora.email,
          },
          {
            papel:      'testemunha_1',
            titular_id: form.testemunha1.id,
            nome:       form.testemunha1.nome,
            cpf:        form.testemunha1.cpf,
            email:      form.testemunha1.email,
          },
          {
            papel:      'testemunha_2',
            titular_id: form.testemunha2.id,
            nome:       form.testemunha2.nome,
            cpf:        form.testemunha2.cpf,
            email:      form.testemunha2.email,
          },
        ],
        provedor_assinatura: form.provedor_assinatura,
      }

      let res: Response
      if (editContratoId) {
        // Modo edição: PATCH no contrato existente
        res = await authFetch(`/api/contratos/${editContratoId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        // Modo criação: POST novo contrato
        const createPayload = { ...payload, status: 'rascunho', numero: `CTO-${Date.now()}` }
        res = await authFetch('/api/contratos', {
          method: 'POST',
          body: JSON.stringify(createPayload),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSaveError((err as Record<string, string>).error ?? `Erro ${res.status} ao salvar contrato.`)
        return null
      }
      const json = await res.json()
      const saved = (json.data ?? json.contrato) as { id: string; numero: string }
      return { id: editContratoId ?? saved.id, numero: saved.numero ?? `CTO-${editContratoId?.slice(-8) ?? ''}` }
    } catch {
      setSaveError('Erro inesperado ao salvar. Verifique a conexão.')
      return null
    } finally {
      setSalvando(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 0 — Tipo
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-4">
      <p className="text-sm text-white/50">
        Contratos de obras são celebrados entre a editora e o autor (PF). Selecione o tipo:
      </p>
      {(Object.entries(TIPO_CONFIG) as [TipoObra, typeof TIPO_CONFIG[TipoObra]][]).map(([tipo, cfg]) => (
        <button
          key={tipo}
          onClick={() => {
            upd({ tipo })
            setTimeout(() => btnProximoRef.current?.focus(), 50)
          }}
          className={[
            'w-full text-left p-5 rounded-xl border transition-all',
            form.tipo === tipo
              ? 'border-violet-500/60 bg-violet-500/10'
              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
          ].join(' ')}
        >
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${corBadge(tipo)}`}>
            {cfg.nome}
          </span>
          <p className="text-xs text-white/50 mt-2 leading-relaxed">{cfg.descricao}</p>
          {tipo === 'coedicao' && (
            <p className="text-xs text-teal-400/70 mt-1.5">
              Co-editora adicional será configurada na etapa de obras.
            </p>
          )}
        </button>
      ))}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Titular PF + categoria Autor
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-white/50">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-violet-400" />
        <span>
          Este contrato é de um único autor (Pessoa Física). Para co-autores, utilize o campo específico dentro de cada obra.
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou código..."
          value={buscaTitular}
          onChange={e => setBuscaTitular(e.target.value.toUpperCase())}
          className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 text-sm text-white/70 placeholder:text-white/25 outline-none focus:border-violet-500/40 uppercase"
        />
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {titularFiltrado.map(t => (
          <button
            key={t.id}
            onClick={() => {
              const emailTitular = t.email
                ?? (Array.isArray(t.contatos) ? t.contatos.find(c => c.tipo === 'email')?.valor ?? '' : '')
              upd({ titular_id: t.id, titular_nome: t.nome_completo, titular_email: emailTitular, titular_cpf: t.cpf ?? '' })
              setTimeout(() => btnProximoRef.current?.focus(), 50)
            }}
            className={[
              'w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3',
              form.titular_id === t.id
                ? 'border-violet-500/60 bg-violet-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
            ].join(' ')}
          >
            <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0">
              {(t.nome_completo ?? '?')[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/80 truncate">{t.nome_completo}</p>
              <p className="text-xs text-white/40">{t.cpf ? `CPF: ${t.cpf}` : ''}{t.cpf && t.codigo_titular ? ' · ' : ''}{t.codigo_titular ? `Cód: ${t.codigo_titular}` : ''}</p>
            </div>
            {form.titular_id === t.id && (
              <Check className="w-4 h-4 text-violet-400 ml-auto shrink-0" />
            )}
          </button>
        ))}
        {titularFiltrado.length === 0 && (
          <div className="text-xs text-white/30 py-6 text-center">
            Nenhum titular Pessoa Física / Autor encontrado. Cadastre pelo menu Titulares.
          </div>
        )}
      </div>

      {form.titular_id && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Titular selecionado: <strong>{form.titular_nome}</strong>
        </div>
      )}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Direitos
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-white/50">
        Padrão: Brasil 75% Autor / 25% Editora · Exterior 50% / 50%. Ajuste individualmente ou selecione todos de uma vez.
      </p>

      {/* BRASIL */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">1) Brasil (BR)</p>
          <button
            onClick={() => toggleAll('BR', !allBR)}
            className="text-xs text-violet-400/70 hover:text-violet-300 border border-violet-500/20 rounded px-2 py-0.5 transition-colors"
          >
            {allBR ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
          {form.direitos.filter(d => d.bloco === 'BR').map(d => (
            <div key={d.codigo} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={d.ativo}
                onChange={e => updateDireito(d.codigo, { ativo: e.target.checked })}
                className="w-4 h-4 accent-violet-500 shrink-0"
              />
              <span className={`text-xs flex-1 leading-relaxed ${d.ativo ? 'text-white/70' : 'text-white/25 line-through'}`}>
                {d.nome}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white/30">Autor</label>
                  <input
                    type="number"
                    min={0} max={100} step={0.01}
                    value={d.pct_autor}
                    disabled={!d.ativo}
                    onChange={e => {
                      const v = Math.min(100, Math.max(0, parseFloat(parseFloat(e.target.value || '0').toFixed(2))))
                      updateDireito(d.codigo, { pct_autor: v, pct_editora: 100 - v })
                    }}
                    className="w-14 h-7 bg-white/[0.04] border border-white/[0.08] rounded px-2 text-xs text-white/70 outline-none focus:border-violet-500/40 disabled:opacity-30 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-white/30">%</span>
                </div>
                <span className="text-[10px] text-white/20">·</span>
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white/30">Edit</label>
                  <span className="w-10 text-xs text-white/40 text-center">{d.pct_editora.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EXTERIOR */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">2) Exterior (EXT)</p>
          <button
            onClick={() => toggleAll('EXT', !allEXT)}
            className="text-xs text-sky-400/70 hover:text-sky-300 border border-sky-500/20 rounded px-2 py-0.5 transition-colors"
          >
            {allEXT ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
          {form.direitos.filter(d => d.bloco === 'EXT').map(d => (
            <div key={d.codigo} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={d.ativo}
                onChange={e => updateDireito(d.codigo, { ativo: e.target.checked })}
                className="w-4 h-4 accent-sky-500 shrink-0"
              />
              <span className={`text-xs flex-1 leading-relaxed ${d.ativo ? 'text-white/70' : 'text-white/25 line-through'}`}>
                {d.nome}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white/30">Autor</label>
                  <input
                    type="number"
                    min={0} max={100} step={0.01}
                    value={d.pct_autor}
                    disabled={!d.ativo}
                    onChange={e => {
                      const v = Math.min(100, Math.max(0, parseFloat(parseFloat(e.target.value || '0').toFixed(2))))
                      updateDireito(d.codigo, { pct_autor: v, pct_editora: 100 - v })
                    }}
                    className="w-14 h-7 bg-white/[0.04] border border-white/[0.08] rounded px-2 text-xs text-white/70 outline-none focus:border-sky-500/40 disabled:opacity-30 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-white/30">%</span>
                </div>
                <span className="text-[10px] text-white/20">·</span>
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white/30">Edit</label>
                  <span className="w-10 text-xs text-white/40 text-center">{d.pct_editora}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-white/30 text-center italic">
        * Os percentuais são meramente ilustrativos — negociados entre Autor e Editora.
      </p>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Obras
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep3 = () => {
    const obra = form.obras[obraAtiva]
    const soma = somaTotal(obra)
    const somaOk = soma === 100

    // Obras do banco que coincidem com o título digitado
    const coincidentes = obrasExistentes.filter(o =>
      o.titulo?.toUpperCase().includes(obra.titulo.trim().toUpperCase()) ||
      obra.titulo.trim().toUpperCase().includes((o.titulo ?? '').toUpperCase())
    )

    return (
      <div className="space-y-4">
        {/* Abas das obras */}
        <div className="flex items-center gap-2 flex-wrap">
          {form.obras.map((o, i) => (
            <button
              key={o.id}
              onClick={() => setObraAtiva(i)}
              className={[
                'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all',
                obraAtiva === i
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-white/[0.08] text-white/40 hover:text-white/70',
                somaTotal(o) !== 100 || !o.titulo.trim() ? '!border-amber-500/40' : '',
              ].join(' ')}
            >
              {o.titulo.trim() || `Obra ${i + 1}`}
            </button>
          ))}
          <button
            onClick={() => {
              upd({ obras: [...form.obras, novaObra()] })
              setObraAtiva(form.obras.length)
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-violet-400 border border-violet-500/20 rounded-lg hover:border-violet-500/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar obra
          </button>
          {form.obras.length > 1 && (
            <button
              onClick={() => {
                upd({ obras: form.obras.filter((_, i) => i !== obraAtiva) })
                setObraAtiva(Math.max(0, obraAtiva - 1))
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 border border-rose-500/20 rounded-lg hover:border-rose-500/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remover
            </button>
          )}
        </div>

        {/* Campos da obra */}
        <div className="space-y-3">
          {/* Título */}
          <div>
            <label className="text-xs text-white/40 block mb-1.5">
              Título da Obra <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={obra.titulo}
              onChange={e => updateObra(obraAtiva, { titulo: e.target.value.toUpperCase() })}
              placeholder="EX: AMOR DE BAR"
              className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-sm text-white/80 uppercase placeholder:text-white/20 outline-none focus:border-violet-500/40"
            />
            {/* Alerta de possível obra duplicada */}
            {coincidentes.length > 0 && obra.titulo.trim().length >= 3 && (
              <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Possível obra já existente no banco:
                </p>
                {coincidentes.map(o => (
                  <p key={o.id} className="text-amber-300/70 pl-5">· {o.titulo}</p>
                ))}
                <p className="text-amber-300/50 pl-5 mt-1">
                  Confira antes de criar para evitar duplicidade. O sistema não consolida automaticamente.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Título Alternativo</label>
              <input
                type="text"
                value={obra.titulo_alternativo}
                onChange={e => updateObra(obraAtiva, { titulo_alternativo: e.target.value.toUpperCase() })}
                className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-sm text-white/70 uppercase placeholder:text-white/20 outline-none focus:border-violet-500/40"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Subtítulo</label>
              <input
                type="text"
                value={obra.subtitulo}
                onChange={e => updateObra(obraAtiva, { subtitulo: e.target.value.toUpperCase() })}
                className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-sm text-white/70 uppercase placeholder:text-white/20 outline-none focus:border-violet-500/40"
              />
            </div>
          </div>

          {/* Letra */}
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Texto Poético (Letra da Música)</label>
            <textarea
              value={obra.texto_poetico}
              onChange={e => updateObra(obraAtiva, { texto_poetico: e.target.value })}
              rows={5}
              placeholder="Cole a letra da música aqui..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-violet-500/40 resize-none"
            />
          </div>

          {/* % Autor + Co-autores */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
              Participações na obra
              {!somaOk && (
                <span className="ml-2 text-amber-400 font-normal">
                  — soma atual: {soma}% (deve ser 100%)
                </span>
              )}
              {somaOk && (
                <span className="ml-2 text-emerald-400 font-normal">✓ soma: 100%</span>
              )}
            </p>

            {/* Autor principal */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center text-[10px] font-bold text-violet-400 shrink-0">A</div>
                <span className="text-sm text-white/80 truncate">
                  {form.titular_nome || 'Autor do contrato'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={obra.papel_autor}
                  onChange={e => updateObra(obraAtiva, { papel_autor: e.target.value })}
                  className="h-8 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 text-xs text-white/70 outline-none focus:border-violet-500/40"
                >
                  {PAPEIS_OBRA.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={obra.pct_autor === ('' as unknown as number) ? '' : obra.pct_autor}
                  placeholder="0.00"
                  onChange={e => updateObra(obraAtiva, { pct_autor: e.target.value === '' ? '' as unknown as number : parseFloat(e.target.value) || 0 })}
                  className="w-16 h-8 bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 text-sm text-white/80 outline-none focus:border-violet-500/40 text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm text-white/40">%</span>
              </div>
            </div>

            {/* Co-autores — participam da obra, SEM controle editorial automático */}
            {obra.co_autores.map((ca, cai) => (
              <div key={ca.id} className="flex items-center gap-2 flex-wrap">
                <div className="w-6 h-6 rounded-full bg-sky-500/15 flex items-center justify-center text-[10px] font-bold text-sky-400 shrink-0">C</div>
                <select
                  value={ca.titular_id}
                  onChange={e => {
                    const t = titulares.find(t => t.id === e.target.value)
                    updateCoAutor(obraAtiva, cai, { titular_id: e.target.value, nome: t?.nome_completo || '' })
                  }}
                  className="flex-1 min-w-[140px] h-8 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 text-xs text-white/70 outline-none focus:border-sky-500/40"
                >
                  <option value="">Selecionar co-autor...</option>
                  {titulares.filter(t => t.id !== form.titular_id).map(t => (
                    <option key={t.id} value={t.id}>{t.nome_completo}</option>
                  ))}
                </select>
                <select
                  value={ca.papel}
                  onChange={e => updateCoAutor(obraAtiva, cai, { papel: e.target.value })}
                  className="h-8 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 text-xs text-white/70 outline-none focus:border-sky-500/40"
                >
                  {PAPEIS_OBRA.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={ca.pct}
                    onChange={e => updateCoAutor(obraAtiva, cai, { pct: parseFloat(e.target.value) || 0 })}
                    className="w-16 h-8 bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 text-sm text-white/80 outline-none focus:border-sky-500/40 text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm text-white/40">%</span>
                  <button
                    onClick={() => removeCoAutor(obraAtiva, cai)}
                    className="p-1 rounded hover:bg-rose-500/10 text-white/25 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => addCoAutor(obraAtiva)}
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar co-autor
            </button>

            {!somaOk && <AlertBox variant="amber">A soma das participações deve ser exatamente 100%. Atual: {soma}%</AlertBox>}
          </div>

          {/* Nota sobre coautores */}
          <div className="bg-sky-500/[0.04] border border-sky-500/15 rounded-xl px-4 py-3 text-xs text-sky-400/70">
            Co-autores participam da obra mas <strong>não assinam este contrato</strong> e
            <strong> não são controlados automaticamente</strong> pela editora.
            Cada titular possui seu próprio instrumento contratual.
          </div>

          {/* Coedição */}
          {form.tipo === 'coedicao' && (
            <div className="bg-teal-500/[0.04] border border-teal-500/20 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">Editoras coeditoras</p>
              <p className="text-xs text-teal-400/60">
                Defina a divisão do percentual editorial (sobre a participação do autor) entre as editoras.
              </p>
              {form.editoras_coeditoras.map((ec, eci) => (
                <div key={ec.id} className="flex items-center gap-2">
                  <select
                    value={ec.editora_id}
                    onChange={e => {
                      const ed = editoras.find(x => x.id === e.target.value)
                      upd({
                        editoras_coeditoras: form.editoras_coeditoras.map((x, i) =>
                          i === eci ? { ...x, editora_id: e.target.value, nome: ed?.nome_fantasia || '' } : x
                        ),
                      })
                    }}
                    className="flex-1 h-8 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 text-xs text-white/70 outline-none focus:border-teal-500/40 min-w-0"
                  >
                    <option value="">Selecionar editora...</option>
                    {editoras.map(ed => <option key={ed.id} value={ed.id}>{ed.nome_fantasia}</option>)}
                  </select>
                  <input
                    type="number"
                    min={0} max={100}
                    value={ec.pct}
                    onChange={e => upd({
                      editoras_coeditoras: form.editoras_coeditoras.map((x, i) =>
                        i === eci ? { ...x, pct: parseFloat(e.target.value) || 0 } : x
                      ),
                    })}
                    className="w-16 h-8 bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 text-xs text-white/80 outline-none text-center"
                  />
                  <span className="text-xs text-white/40">%</span>
                  <button
                    onClick={() => upd({ editoras_coeditoras: form.editoras_coeditoras.filter((_, i) => i !== eci) })}
                    className="p-1 rounded hover:bg-rose-500/10 text-white/25 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => upd({ editoras_coeditoras: [...form.editoras_coeditoras, { id: `ec-${Date.now()}`, editora_id: '', nome: '', pct: 50 }] })}
                className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar editora coeditora
              </button>
            </div>
          )}
        </div>

        {obraInvalidas.length > 0 && (
          <AlertBox variant="amber">
            {obraInvalidas.length} obra(s) com problema: título em branco ou soma ≠ 100%.
          </AlertBox>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP CADASTRO — Formação do Cadastro de Obra
  // Regra: co-autores são sempre CA puro (sem linha de editora).
  // A editora NÃO entra nos links dos co-autores — cada titular tem seu contrato.
  // ─────────────────────────────────────────────────────────────────────────

  const renderStepCadastro = () => {
    const brAtivos = form.direitos.filter(d => d.bloco === 'BR' && d.ativo)
    const avgPctAutorBR = brAtivos.length
      ? brAtivos.reduce((s, d) => s + d.pct_autor, 0) / brAtivos.length
      : 75
    const avgPctEditoraBR = 100 - avgPctAutorBR

    const extAtivos = form.direitos.filter(d => d.bloco === 'EXT' && d.ativo)
    const avgPctAutorEXT = extAtivos.length
      ? extAtivos.reduce((s, d) => s + d.pct_autor, 0) / extAtivos.length
      : 50

    const EDITORA_NOME = 'TOP SHOW MUSIC LIMITADA'
    const EDITORA_PSEUDO = 'TOP SHOW MUSIC'
    const EDITORA_SIGLA: 'E' | 'AM' = 'E'

    type LinhaTabela = {
      link: number
      nome: string
      pseudo: string
      pct: number
      categoria: string
    }

    return (
      <div className="space-y-6">
        <p className="text-xs text-white/40">
          Prévia do cadastro de obra formado a partir do contrato.
          Cada link agrupa o autor com a participação editorial vinculada.
        </p>

        {form.obras.map((obra, idx) => {
          const linhas: LinhaTabela[] = []
          let linkNum = 1

          // — Link 1: titular do contrato + editora (controlado)
          const pctAutorTitular = (obra.pct_autor * avgPctAutorBR) / 100
          const pctEditoraTitular = (obra.pct_autor * avgPctEditoraBR) / 100

          linhas.push({
            link: linkNum,
            nome: (form.titular_nome || 'AUTOR').toUpperCase(),
            pseudo: (form.titular_nome || 'AUTOR').split(' ')[0].toUpperCase(),
            pct: parseFloat(pctAutorTitular.toFixed(4)),
            categoria: 'CA',
          })
          if (pctEditoraTitular > 0) {
            linhas.push({
              link: linkNum,
              nome: EDITORA_NOME,
              pseudo: EDITORA_PSEUDO,
              pct: parseFloat(pctEditoraTitular.toFixed(4)),
              categoria: EDITORA_SIGLA,
            })
          }
          linkNum++

          // — Links dos co-autores: CA puro (sem contrato próprio = sem linha de editora)
          for (const ca of obra.co_autores.filter(c => c.nome && c.pct > 0)) {
            linhas.push({
              link: linkNum,
              nome: ca.nome.toUpperCase(),
              pseudo: ca.nome.split(' ')[0].toUpperCase(),
              pct: parseFloat(ca.pct.toFixed(4)),
              categoria: 'CA',
            })
            linkNum++
          }

          const totalPct = linhas.reduce((s, l) => s + l.pct, 0)

          return (
            <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="bg-white/[0.03] border-b border-white/[0.06] px-4 py-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-white/30 block">Título da Obra</span>
                  <span className="text-white font-semibold">{obra.titulo || '—'}</span>
                </div>
                <div>
                  <span className="text-white/30 block">Subtítulo</span>
                  <span className="text-white/60">{obra.subtitulo || '—'}</span>
                </div>
                <div>
                  <span className="text-white/30 block">Título Alternativo</span>
                  <span className="text-white/60">{obra.titulo_alternativo || '—'}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-3 py-2 text-left text-white/30 font-medium w-12">Link</th>
                      <th className="px-3 py-2 text-left text-white/30 font-medium">Nome do Compositor</th>
                      <th className="px-3 py-2 text-left text-white/30 font-medium">Pseudônimo</th>
                      <th className="px-3 py-2 text-right text-white/30 font-medium w-20">%</th>
                      <th className="px-3 py-2 text-center text-white/30 font-medium w-20">Categoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {linhas.map((l, li) => (
                      <tr key={li} className={l.categoria === 'CA' ? 'bg-violet-500/[0.04]' : 'bg-sky-500/[0.03]'}>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.06] text-white/50 font-bold">
                            {l.link}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-white/80 font-medium">{l.nome}</td>
                        <td className="px-3 py-2 text-white/50">{l.pseudo}</td>
                        <td className="px-3 py-2 text-right text-white/70 font-mono">{l.pct.toFixed(2)}%</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.categoria === 'CA' ? 'bg-violet-500/20 text-violet-300' :
                            l.categoria === 'AM' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-sky-500/20 text-sky-300'
                          }`}>
                            {l.categoria}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.08]">
                      <td colSpan={3} className="px-3 py-2 text-right text-white/30 text-[10px] font-medium">
                        Total
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-xs text-white/60">
                        {totalPct.toFixed(2)}%
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="px-4 py-2 border-t border-white/[0.04] text-[10px] text-white/25">
                Baseado nos direitos BR · Autor {avgPctAutorBR.toFixed(0)}% / Editora {avgPctEditoraBR.toFixed(0)}%
                {avgPctAutorEXT !== avgPctAutorBR && ` · Exterior Autor ${avgPctAutorEXT.toFixed(0)}%`}
              </div>
            </div>
          )
        })}

        <p className="text-[10px] text-white/20 text-center">
          Co-autores listados como CA puro — sem controle editorial desta editora neste instrumento.
          Cada co-autor pode ter seu próprio contrato de cessão futuramente.
        </p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4 — Data & Resumo
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-white/40 block mb-2">
          Data de Emissão do Contrato <span className="text-rose-400">*</span>
        </label>
        <input
          type="date"
          value={form.data_emissao}
          onChange={e => upd({ data_emissao: e.target.value })}
          className="w-full sm:w-64 h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-sm text-white/70 outline-none focus:border-violet-500/40"
        />
      </div>

      <div>
        <label className="text-xs text-white/40 block mb-2">Observações (opcional)</label>
        <textarea
          value={form.observacoes}
          onChange={e => upd({ observacoes: e.target.value })}
          rows={3}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-violet-500/40 resize-none"
          placeholder="Condições especiais, cláusulas adicionais..."
        />
      </div>

      {/* Resumo */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Resumo do Contrato</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-white/30">Tipo</p>
            <p className="text-white/80 font-medium mt-0.5">{form.tipo ? TIPO_CONFIG[form.tipo].nome : '—'}</p>
          </div>
          <div>
            <p className="text-white/30">Titular</p>
            <p className="text-white/80 font-medium mt-0.5">{form.titular_nome || '—'}</p>
          </div>
          <div>
            <p className="text-white/30">Direitos BR</p>
            <p className="text-white/80 font-medium mt-0.5">{form.direitos.filter(d => d.bloco === 'BR' && d.ativo).length} ativos</p>
          </div>
          <div>
            <p className="text-white/30">Direitos EXT</p>
            <p className="text-white/80 font-medium mt-0.5">{form.direitos.filter(d => d.bloco === 'EXT' && d.ativo).length} ativos</p>
          </div>
          <div>
            <p className="text-white/30">Obras</p>
            <p className="text-white/80 font-medium mt-0.5">{form.obras.length}</p>
          </div>
          <div>
            <p className="text-white/30">Data emissão</p>
            <p className="text-white/80 font-medium mt-0.5">{form.data_emissao || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5 — Assinatura
  // Signatários: cedente (fixo) + responsável editora + 2 testemunhas (todos PF do banco)
  // Co-autores: participam da obra mas NÃO assinam este contrato
  // ─────────────────────────────────────────────────────────────────────────

  const coAutoresObras = form.obras.flatMap(o => o.co_autores.filter(c => c.nome))
  const totalAssinantes = 4

  const renderStep5 = () => (
    <div className="space-y-5">
      <p className="text-sm text-white/50">Provedor de assinatura digital e partes que assinarão o contrato.</p>

      {/* Provedor */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Provedor de Assinatura</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'd4sign',     nome: 'D4Sign',         desc: 'Plataforma brasileira' },
            { id: 'docusign',   nome: 'DocuSign',        desc: 'Padrão internacional' },
            { id: 'icp_brasil', nome: 'ICP-Brasil',      desc: 'Certificado ICP-Brasil' },
            { id: 'manual',     nome: 'Manual / Upload', desc: 'Assinatura física' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => upd({ provedor_assinatura: p.id })}
              className={[
                'text-left p-3 rounded-xl border transition-all',
                form.provedor_assinatura === p.id
                  ? 'border-violet-500/60 bg-violet-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
              ].join(' ')}
            >
              <p className="text-xs font-semibold text-white/80">{p.nome}</p>
              <p className="text-[10px] text-white/35 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Partes */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Partes que assinarão — {totalAssinantes} assinantes
        </p>

        {/* Cedente (autor) — fixo, determinado pelo Step 1 */}
        <div className="flex items-center gap-3 bg-white/[0.02] border border-violet-500/20 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white/80 truncate">{form.titular_nome || '—'}</p>
            <p className="text-[10px] text-white/35">Cedente (Autor) · bloqueado</p>
          </div>
          <span className="text-[10px] text-violet-400/70 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 shrink-0">CEDENTE</span>
        </div>

        {/* Co-autores — participam da obra, NÃO assinam */}
        {coAutoresObras.length > 0 && (
          <div className="bg-sky-500/[0.04] border border-sky-500/15 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-sky-400/80 mb-1">Co-autores das obras ({coAutoresObras.length})</p>
            <p className="text-[10px] text-white/35">
              Participam das obras mas NÃO assinam este contrato. Cada titular assina seu próprio instrumento.
            </p>
            <div className="mt-2 space-y-1">
              {coAutoresObras.map(c => (
                <p key={c.id} className="text-[11px] text-white/50">{c.nome} — {c.pct}%</p>
              ))}
            </div>
          </div>
        )}

        {/* Responsável pela editora — qualquer PF cadastrada */}
        <PessoaPicker
          label="Responsável pela Editora"
          cor="amber"
          badge="EDITORA"
          valor={form.responsavel_editora}
          onChange={v => upd({ responsavel_editora: v })}
          lista={pessoasFisicas}
        />

        {/* Testemunha 1 — PF neutra: ≠ cedente e ≠ responsável */}
        <PessoaPicker
          label="Testemunha 1"
          cor="emerald"
          badge="TESTEMUNHA"
          valor={form.testemunha1}
          onChange={v => upd({ testemunha1: v })}
          lista={pessoasFisicas.filter(p => p.id !== form.titular_id && p.id !== form.responsavel_editora.id)}
        />

        {/* Testemunha 2 — PF neutra: ≠ cedente, ≠ responsável, ≠ T1 */}
        <PessoaPicker
          label="Testemunha 2"
          cor="emerald"
          badge="TESTEMUNHA"
          valor={form.testemunha2}
          onChange={v => upd({ testemunha2: v })}
          lista={pessoasFisicas.filter(p =>
            p.id !== form.titular_id &&
            p.id !== form.responsavel_editora.id &&
            p.id !== form.testemunha1.id
          )}
        />
      </div>

      {/* Alerta: PF insuficientes para preencher as 2 testemunhas neutras */}
      {pessoasFisicas.filter(p => p.id !== form.titular_id && p.id !== form.responsavel_editora.id).length < 2 && (
        <AlertBox variant="rose">
          São necessárias pelo menos 2 Pessoas Físicas cadastradas (além do cedente e do responsável) para preencher as 2 testemunhas neutras.
          Cadastre mais titulares PF antes de continuar.
        </AlertBox>
      )}

      {/* Erros de validação dos assinantes */}
      {errosAssinantes.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            É necessário informar todos os assinantes do contrato:
          </p>
          {errosAssinantes.map((e, i) => (
            <p key={i} className="text-xs text-rose-400/80 pl-5">· {e}</p>
          ))}
        </div>
      )}

      <div className="bg-sky-500/[0.05] border border-sky-500/20 rounded-xl px-4 py-3 text-xs text-sky-400/70">
        <p className="font-semibold text-sky-400 mb-1">Após o envio:</p>
        <p>Cada parte receberá o contrato pelo provedor selecionado. Quando todas as assinaturas forem coletadas o botão <strong className="text-sky-300">Download PDF Assinado</strong> é liberado na lista de contratos.</p>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 6 — Revisão Final
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep6 = () => (
    <div className="space-y-4">
      <p className="text-sm text-white/50">Revisão final antes de criar o contrato e iniciar o cadastro das obras.</p>

      {obraInvalidas.length > 0 && (
        <AlertBox variant="rose">
          {obraInvalidas.length} obra(s) com problema. Volte ao passo Obras e corrija antes de prosseguir.
        </AlertBox>
      )}

      {errosAssinantes.length > 0 && (
        <AlertBox variant="rose">
          Assinantes incompletos ou inválidos. Volte ao passo Assinatura e corrija antes de prosseguir.
        </AlertBox>
      )}

      {form.obras.map((o, i) => {
        const somaOk = somaTotal(o) === 100
        return (
          <div key={o.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white/80">{o.titulo || `Obra ${i + 1}`}</p>
              {somaOk
                ? <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">✓ 100%</span>
                : <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">⚠ {somaTotal(o)}%</span>
              }
            </div>
            {o.titulo_alternativo && <p className="text-xs text-white/40">Alt: {o.titulo_alternativo}</p>}
            {o.subtitulo && <p className="text-xs text-white/40">Sub: {o.subtitulo}</p>}
            {o.texto_poetico && (
              <p className="text-xs text-white/30 line-clamp-2 italic">&ldquo;{o.texto_poetico.slice(0, 80)}...&rdquo;</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="text-xs bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded">
                {form.titular_nome || 'Autor'}: {o.pct_autor}%
              </span>
              {o.co_autores.map(c => (
                <span key={c.id} className="text-xs bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded">
                  {c.nome || 'Co-autor'}: {c.pct}%
                </span>
              ))}
            </div>
          </div>
        )
      })}

      {/* Assinantes */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Assinantes do Contrato</p>
        {[
          { nome: form.titular_nome || '—',              papel: 'Cedente (Autor)',       cor: 'text-violet-400' },
          { nome: form.responsavel_editora.nome || '—',  papel: 'Responsável Editora',   cor: 'text-amber-400'  },
          { nome: form.testemunha1.nome || '—',          papel: 'Testemunha 1',          cor: 'text-emerald-400' },
          { nome: form.testemunha2.nome || '—',          papel: 'Testemunha 2',          cor: 'text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
            <span className={`text-sm font-medium ${s.cor}`}>{s.nome}</span>
            <span className="text-[10px] text-white/30">{s.papel}</span>
          </div>
        ))}
      </div>

      <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-4 space-y-1">
        <p className="text-xs font-semibold text-emerald-400">Após criar o contrato:</p>
        <p className="text-xs text-emerald-400/70">
          O sistema irá iniciar automaticamente a montagem do cadastro das obras vinculadas
          a este contrato. Os dados preenchidos aqui (título, letra, % participações) serão
          pré-carregados no formulário de cadastro de obra.
        </p>
      </div>

      {/* Download rascunho */}
      <button
        onClick={() => gerarDownloadContrato(form, 'rascunho')}
        className="w-full h-9 flex items-center justify-center gap-2 border border-white/[0.08] text-white/50 hover:text-white/70 hover:border-white/15 text-sm rounded-xl transition-colors"
      >
        <Download className="w-4 h-4" /> Baixar rascunho do contrato
      </button>

      <button
        disabled={obraInvalidas.length > 0 || errosAssinantes.length > 0 || !form.titular_id || !form.tipo || salvando}
        onClick={async () => {
          const contrato = await salvarContrato()
          if (!contrato) return
          router.push('/master/obras?origem=contrato&contrato_id=' + contrato.id)
        }}
        className="w-full h-11 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
      >
        {salvando ? 'Salvando...' : 'Criar Contrato e Iniciar Cadastro de Obras'}
      </button>

      {saveError && (
        <p className="text-xs text-rose-400 text-center">{saveError}</p>
      )}

      <button
        disabled={obraInvalidas.length > 0 || errosAssinantes.length > 0 || !form.titular_id || !form.tipo || salvando}
        onClick={async () => {
          const contrato = await salvarContrato()
          if (!contrato) return
          router.push('/master/contratos')
        }}
        className="w-full h-9 border border-white/[0.08] text-white/50 hover:text-white/70 text-sm rounded-xl transition-colors disabled:opacity-40"
      >
        Criar Contrato (apenas — montar obras depois)
      </button>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const steps = [renderStep0, renderStep1, renderStep3, renderStep2, renderStepCadastro, renderStep4, renderStep5, renderStep6]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title={editContratoId ? 'Editar Rascunho' : 'Novo Contrato de Obras'}
        description={`Passo ${step + 1} de ${TOTAL_STEPS} — ${STEP_LABELS[step].label}${editContratoId ? ' · Modo Edição' : ''}`}
        actions={
          <button onClick={() => editContratoId ? router.push(`/master/contratos/${editContratoId}`) : router.push('/master/contratos')} className="text-sm text-white/40 hover:text-white/70">
            Cancelar
          </button>
        }
      />

      {/* Indicador de passos */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center justify-between overflow-x-auto gap-1">
          {STEP_LABELS.map((s, i) => {
            const Icon = s.icon
            const done = i < step
            const active = i === step
            return (
              <div key={i} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <div className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    done   ? 'bg-emerald-500 text-white'
                    : active ? 'bg-violet-600 text-white ring-2 ring-violet-400/30'
                    : 'bg-white/[0.06] text-white/30',
                  ].join(' ')}>
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-[10px] hidden sm:block ${active ? 'text-violet-300' : 'text-white/25'}`}>
                    {s.label}
                  </span>
                </div>
                {i < TOTAL_STEPS - 1 && (
                  <div className={`w-4 md:w-6 h-px mx-1 ${i < step ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tipo badge (visível enquanto avança) */}
      {form.tipo && step > 0 && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold w-fit ${corBadge(form.tipo)}`}>
          {TIPO_CONFIG[form.tipo].nome}
        </div>
      )}

      {/* Conteúdo do passo */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
        {steps[step]()}
      </div>

      {/* Navegação */}
      {step < TOTAL_STEPS - 1 ? (
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
            ref={btnProximoRef}
            disabled={
              (step === 0 && !form.tipo) ||
              (step === 1 && !form.titular_id) ||
              (step === 6 && errosAssinantes.length > 0)
            }
            className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-sm text-white font-semibold transition-colors focus:ring-2 focus:ring-violet-400/50 focus:outline-none"
          >
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={prev}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-white/[0.08] text-sm text-white/60 hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar à Assinatura
        </button>
      )}
    </div>
  )
}
