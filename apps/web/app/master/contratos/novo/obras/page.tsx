'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Check, Scale, Users, ShieldCheck,
  Music, Globe, Pen, Eye, Plus, Trash2, AlertTriangle,
  Info, BookOpen, Search, CheckCircle2, Download, UserCheck,
  Building2, Pencil,
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

// Mocks de titulares PF
const TITULARES_PF = [
  { id: 'pf-001', nome: 'NAUILAN BARBOSA SILVA',   cpf: '123.456.789-00', codigo: 'TIT001A' },
  { id: 'pf-002', nome: 'GIOVANI ALVES RODRIGUES', cpf: '234.567.890-11', codigo: 'TIT002B' },
  { id: 'pf-003', nome: 'MARCELO COSTA FERREIRA',  cpf: '345.678.901-22', codigo: 'TIT003C' },
  { id: 'pf-004', nome: 'JOAO PEDRO MORAES LIMA',  cpf: '456.789.012-33', codigo: 'TIT004D' },
  { id: 'pf-005', nome: 'ANA CAROLINA SOUZA',      cpf: '567.890.123-44', codigo: 'TIT005E' },
  { id: 'pf-006', nome: 'ROBERTO FERREIRA DIAS',   cpf: '678.901.234-55', codigo: 'TIT006F' },
]

// Editoras disponíveis para coedição
const EDITORAS = [
  { id: 'ed-tsm', nome: 'TOP SHOW MUSIC', cnpj: '12.345.678/0001-90' },
  { id: 'ed-univ', nome: 'UNIVERSAL MUSIC', cnpj: '00.000.000/0001-00' },
  { id: 'ed-sony', nome: 'SONY MUSIC', cnpj: '11.111.111/0001-11' },
  { id: 'ed-emi',  nome: 'EMI MUSIC', cnpj: '22.222.222/0001-22' },
]

// ── Signatários — pessoas do banco de dados disponíveis p/ assinar ───────────

type Signatario = {
  id: string
  nome: string
  cargo: string
  cpf: string
  email: string
}

// Responsáveis da editora cadastrados (o primeiro é o padrão)
const RESPONSAVEIS_EDITORA: Signatario[] = [
  { id: 'resp-001', nome: 'MARINA LOPES',          cargo: 'Diretora Executiva',    cpf: '111.222.333-44', email: 'marina@topshowmusic.com.br' },
  { id: 'resp-002', nome: 'CARLOS EDUARDO MELO',   cargo: 'Diretor Jurídico',      cpf: '222.333.444-55', email: 'carlos@topshowmusic.com.br' },
  { id: 'resp-003', nome: 'PATRICIA SOUZA RAMOS',  cargo: 'Gerente de Contratos',  cpf: '333.444.555-66', email: 'patricia@topshowmusic.com.br' },
]

// Testemunhas cadastradas (as primeiras duas são o padrão)
const TESTEMUNHAS_DB: Signatario[] = [
  { id: 'test-001', nome: 'RODRIGO ANDRADE SILVA', cargo: 'Assistente Jurídico',   cpf: '444.555.666-77', email: 'rodrigo@topshowmusic.com.br' },
  { id: 'test-002', nome: 'JULIANA COSTA LIMA',    cargo: 'Assessora Editorial',   cpf: '555.666.777-88', email: 'juliana@topshowmusic.com.br' },
  { id: 'test-003', nome: 'FERNANDO BRAGA NETO',   cargo: 'Coordenador Financeiro',cpf: '666.777.888-99', email: 'fernando@topshowmusic.com.br' },
  { id: 'test-004', nome: 'SABRINA MOURA DIAS',    cargo: 'Analista de Royalties', cpf: '777.888.999-00', email: 'sabrina@topshowmusic.com.br' },
]

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

type CoAutor = {
  id: string
  titular_id: string
  nome: string
  pct: number
  papel: string
  editado: boolean   // true = tem contrato de edição com esta editora → gera linha da editora no cadastro
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
  direitos: DireitoForm[]
  obras: ObraForm[]
  editoras_coeditoras: EditoraCoeditora[]
  data_emissao: string
  provedor_assinatura: string
  // Signatários
  responsavel_editora_id: string
  testemunha1_id: string
  testemunha2_id: string
  observacoes: string
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

const INITIAL: FormState = {
  tipo: '',
  titular_id: '',
  titular_nome: '',
  direitos: buildDireitos(),
  obras: [novaObra()],
  editoras_coeditoras: [],
  data_emissao: new Date().toISOString().slice(0, 10),
  provedor_assinatura: 'd4sign',
  responsavel_editora_id: RESPONSAVEIS_EDITORA[0].id,
  testemunha1_id: TESTEMUNHAS_DB[0].id,
  testemunha2_id: TESTEMUNHAS_DB[1].id,
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
  const resp = RESPONSAVEIS_EDITORA.find(r => r.id === form.responsavel_editora_id) || RESPONSAVEIS_EDITORA[0]
  const t1   = TESTEMUNHAS_DB.find(t => t.id === form.testemunha1_id)   || TESTEMUNHAS_DB[0]
  const t2   = TESTEMUNHAS_DB.find(t => t.id === form.testemunha2_id)   || TESTEMUNHAS_DB[1]
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
    `Cargo           : ${resp.cargo}`,
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
    // observacoes NÃO vai para o contrato — fica salvo apenas no cadastro da(s) obra(s)
    '── ASSINATURAS ──────────────────────────────────────────',
    '',
    `Cedente: ${form.titular_nome || '—'}`,
    modo === 'assinado' ? '  Assinado digitalmente' : '  _________________________________',
    '',
    ...form.obras.flatMap(o => o.co_autores.filter(c => c.nome).map(c => [
      `Co-autor: ${c.nome}`,
      modo === 'assinado' ? '  Assinado digitalmente' : '  _________________________________',
      '',
    ])).flat(),
    `Responsável Editora: ${resp.nome} — ${resp.cargo}`,
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

// ── Componente auxiliar de linha de signatário (read-only) ───────────────────

function SignatarioRow({ label, icon, cor, nome, cargo, cpf, readOnly }: {
  label: string; icon: React.ReactNode; cor: string
  nome: string; cargo: string; cpf: string; readOnly?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 bg-white/[0.02] border border-${cor}-500/20 rounded-xl px-4 py-3`}>
      <div className={`w-8 h-8 rounded-full bg-${cor}-500/15 flex items-center justify-center shrink-0`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/80 truncate">{nome}</p>
        <p className="text-[10px] text-white/35">{cargo}{readOnly ? ' · bloqueado' : ''}</p>
      </div>
      <span className={`text-[10px] text-${cor}-400/70 bg-${cor}-500/10 px-2 py-0.5 rounded border border-${cor}-500/20 shrink-0 uppercase`}>{label}</span>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function NovoContratoObrasPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [buscaTitular, setBuscaTitular] = useState('')
  const [obraAtiva, setObraAtiva] = useState(0)
  const btnProximoRef = useRef<HTMLButtonElement>(null)

  function upd(patch: Partial<FormState>) { setForm(f => ({ ...f, ...patch })) }
  function next() { if (step < TOTAL_STEPS - 1) setStep(s => s + 1) }
  function prev() { if (step > 0) setStep(s => s - 1) }

  const titularFiltrado = TITULARES_PF.filter(t =>
    t.nome.includes(buscaTitular.toUpperCase()) ||
    t.cpf.includes(buscaTitular) ||
    t.codigo.includes(buscaTitular.toUpperCase())
  )

  // ── Obra helpers ──────────────────────────────────────────────────────────

  function updateObra(idx: number, patch: Partial<ObraForm>) {
    const obras = form.obras.map((o, i) => i === idx ? { ...o, ...patch } : o)
    upd({ obras })
  }

  function addCoAutor(obraIdx: number) {
    const obras = form.obras.map((o, i) => i === obraIdx
      ? { ...o, co_autores: [...o.co_autores, { id: `ca-${Date.now()}`, titular_id: '', nome: '', pct: 0, papel: 'compositor', editado: false }] }
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
    // Se todos do bloco estiverem selecionados e o patch contiver pct_autor,
    // aplica o mesmo percentual em todos do mesmo bloco (sincronização em massa)
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

  function salvarContrato() {
    const contratos = JSON.parse(localStorage.getItem('sync_contratos_obras_v1') || '[]')
    const novo = {
      id: `cnt-obras-${Date.now()}`,
      numero: `CTO-${String(contratos.length + 1).padStart(4, '0')}`,
      ...form,
      status: 'rascunho',
      aguarda_montagem_obra: true,
      created_at: new Date().toISOString(),
    }
    contratos.unshift(novo)
    localStorage.setItem('sync_contratos_obras_v1', JSON.stringify(contratos))
    return novo
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
  // STEP 1 — Titular PF
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
              upd({ titular_id: t.id, titular_nome: t.nome })
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
              {t.nome[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/80 truncate">{t.nome}</p>
              <p className="text-xs text-white/40">CPF: {t.cpf} · Cód: {t.codigo}</p>
            </div>
            {form.titular_id === t.id && (
              <Check className="w-4 h-4 text-violet-400 ml-auto shrink-0" />
            )}
          </button>
        ))}
        {titularFiltrado.length === 0 && (
          <div className="text-xs text-white/30 py-6 text-center">
            Nenhum titular encontrado. Cadastre pelo menu M1 Titulares.
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

            {/* Co-autores */}
            {obra.co_autores.map((ca, cai) => (
              <div key={ca.id} className="flex items-center gap-2 flex-wrap">
                <div className="w-6 h-6 rounded-full bg-sky-500/15 flex items-center justify-center text-[10px] font-bold text-sky-400 shrink-0">C</div>
                <select
                  value={ca.titular_id}
                  onChange={e => {
                    const t = TITULARES_PF.find(t => t.id === e.target.value)
                    updateCoAutor(obraAtiva, cai, { titular_id: e.target.value, nome: t?.nome || '' })
                  }}
                  className="flex-1 min-w-[140px] h-8 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 text-xs text-white/70 outline-none focus:border-sky-500/40"
                >
                  <option value="">Selecionar co-autor...</option>
                  {TITULARES_PF.filter(t => t.id !== form.titular_id).map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
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
                  {/* Toggle: co-autor editado por esta editora? */}
                  <button
                    title={ca.editado ? 'Tem contrato de edição com esta editora' : 'Sem contrato de edição (100% CA)'}
                    onClick={() => updateCoAutor(obraAtiva, cai, { editado: !ca.editado })}
                    className={`h-6 px-2 rounded text-[10px] font-bold border transition-colors shrink-0 ${
                      ca.editado
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/25'
                    }`}
                  >
                    {ca.editado ? 'Editado (E)' : 'Sem edição'}
                  </button>
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

          {/* Coedição: adicionar editora coeditora por obra */}
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
                      const ed = EDITORAS.find(x => x.id === e.target.value)
                      upd({
                        editoras_coeditoras: form.editoras_coeditoras.map((x, i) =>
                          i === eci ? { ...x, editora_id: e.target.value, nome: ed?.nome || '' } : x
                        ),
                      })
                    }}
                    className="flex-1 h-8 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 text-xs text-white/70 outline-none focus:border-teal-500/40 min-w-0"
                  >
                    <option value="">Selecionar editora...</option>
                    {EDITORAS.map(ed => <option key={ed.id} value={ed.id}>{ed.nome}</option>)}
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
  // Mostra preview da estrutura: Link | Nome | Pseudônimo | % | Categoria
  // Para cada obra: autor do contrato + editora (Link 1) + co-autores (Links seguintes)
  // Os % são calculados: pct_participacao × pct_direito_br (média ativa)
  // ─────────────────────────────────────────────────────────────────────────

  const renderStepCadastro = () => {
    // Percentual médio BR ativo (todos sincronizados quando "Selecionar todos")
    const brAtivos = form.direitos.filter(d => d.bloco === 'BR' && d.ativo)
    const avgPctAutorBR = brAtivos.length
      ? brAtivos.reduce((s, d) => s + d.pct_autor, 0) / brAtivos.length
      : 75
    const avgPctEditoraBR = 100 - avgPctAutorBR

    // Percentual médio EXT ativo
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

          // — Link do titular do contrato + editora
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

          // — Links dos co-autores
          for (const ca of obra.co_autores.filter(c => c.nome && c.pct > 0)) {
            const pctCaAutor = ca.editado
              ? (ca.pct * avgPctAutorBR) / 100
              : ca.pct                              // sem contrato → 100% CA
            const pctCaEditora = ca.editado
              ? (ca.pct * avgPctEditoraBR) / 100
              : 0                                   // sem contrato → editora não entra
            linhas.push({
              link: linkNum,
              nome: ca.nome.toUpperCase(),
              pseudo: ca.nome.split(' ')[0].toUpperCase(),
              pct: parseFloat(pctCaAutor.toFixed(4)),
              categoria: 'CA',
            })
            if (pctCaEditora > 0) {
              linhas.push({
                link: linkNum,
                nome: EDITORA_NOME,
                pseudo: EDITORA_PSEUDO,
                pct: parseFloat(pctCaEditora.toFixed(4)),
                categoria: EDITORA_SIGLA,
              })
            }
            linkNum++
          }

          const totalPct = linhas.reduce((s, l) => s + l.pct, 0)

          return (
            <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              {/* Cabeçalho da obra */}
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

              {/* Tabela */}
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

              {/* Nota EXT */}
              <div className="px-4 py-2 border-t border-white/[0.04] text-[10px] text-white/25">
                Baseado nos direitos BR · Autor {avgPctAutorBR.toFixed(0)}% / Editora {avgPctEditoraBR.toFixed(0)}%
                {avgPctAutorEXT !== avgPctAutorBR && ` · Exterior Autor ${avgPctAutorEXT.toFixed(0)}%`}
              </div>
            </div>
          )
        })}

        <p className="text-[10px] text-white/20 text-center">
          Este cadastro será gerado automaticamente ao validar o contrato assinado.
          Co-autores poderão editar sua participação futuramente.
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
  // ─────────────────────────────────────────────────────────────────────────

  const respEditora = RESPONSAVEIS_EDITORA.find(r => r.id === form.responsavel_editora_id) || RESPONSAVEIS_EDITORA[0]
  const test1 = TESTEMUNHAS_DB.find(t => t.id === form.testemunha1_id) || TESTEMUNHAS_DB[0]
  const test2 = TESTEMUNHAS_DB.find(t => t.id === form.testemunha2_id) || TESTEMUNHAS_DB[1]
  const coAutoresObras = form.obras.flatMap(o => o.co_autores.filter(c => c.nome))
  const totalAssinantes = 1 + coAutoresObras.length + 1 + 2

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

        {/* Cedente (autor) — fixo */}
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

        {/* Co-autores — fixos */}
        {coAutoresObras.map(c => (
          <div key={c.id} className="flex items-center gap-3 bg-white/[0.02] border border-sky-500/20 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-sky-500/15 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white/80 truncate">{c.nome}</p>
              <p className="text-[10px] text-white/35">Co-autor · bloqueado</p>
            </div>
            <span className="text-[10px] text-sky-400/70 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 shrink-0">CO-AUTOR</span>
          </div>
        ))}

        {/* Responsável editora — editável */}
        <div className="bg-white/[0.02] border border-amber-500/20 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white/70">Responsável pela Editora</p>
              <p className="text-[10px] text-white/35">TOP SHOW MUSIC</p>
            </div>
            <span className="text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">EDITORA</span>
          </div>
          <select
            value={form.responsavel_editora_id}
            onChange={e => upd({ responsavel_editora_id: e.target.value })}
            className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white/80 outline-none focus:border-amber-500/40"
          >
            {RESPONSAVEIS_EDITORA.map(r => (
              <option key={r.id} value={r.id}>{r.nome} — {r.cargo}</option>
            ))}
          </select>
          <div className="flex gap-4 text-[10px] text-white/30 px-1">
            <span>CPF: {respEditora.cpf}</span>
            <span>{respEditora.email}</span>
          </div>
        </div>

        {/* Testemunha 1 — editável */}
        <div className="bg-white/[0.02] border border-emerald-500/20 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs font-semibold text-white/70 flex-1">Testemunha 1</p>
            <span className="text-[10px] text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">TESTEMUNHA</span>
          </div>
          <select
            value={form.testemunha1_id}
            onChange={e => upd({ testemunha1_id: e.target.value })}
            className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white/80 outline-none focus:border-emerald-500/40"
          >
            {TESTEMUNHAS_DB.filter(t => t.id !== form.testemunha2_id).map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
          <div className="flex gap-4 text-[10px] text-white/30 px-1">
            <span>CPF: {test1.cpf}</span>
            <span>{test1.email}</span>
          </div>
        </div>

        {/* Testemunha 2 — editável */}
        <div className="bg-white/[0.02] border border-emerald-500/20 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs font-semibold text-white/70 flex-1">Testemunha 2</p>
            <span className="text-[10px] text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">TESTEMUNHA</span>
          </div>
          <select
            value={form.testemunha2_id}
            onChange={e => upd({ testemunha2_id: e.target.value })}
            className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white/80 outline-none focus:border-emerald-500/40"
          >
            {TESTEMUNHAS_DB.filter(t => t.id !== form.testemunha1_id).map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
          <div className="flex gap-4 text-[10px] text-white/30 px-1">
            <span>CPF: {test2.cpf}</span>
            <span>{test2.email}</span>
          </div>
        </div>
      </div>

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
              <p className="text-xs text-white/30 line-clamp-2 italic">"{o.texto_poetico.slice(0, 80)}..."</p>
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
          { nome: form.titular_nome || '—',   papel: 'Cedente (Autor)',             cor: 'text-violet-400' },
          ...coAutoresObras.map(c => ({ nome: c.nome, papel: 'Co-autor', cor: 'text-sky-400' })),
          { nome: respEditora.nome,            papel: `Responsável Editora · ${respEditora.cargo}`, cor: 'text-amber-400' },
          { nome: test1.nome, papel: 'Testemunha 1', cor: 'text-emerald-400' },
          { nome: test2.nome, papel: 'Testemunha 2', cor: 'text-emerald-400' },
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
        <Download className="w-4 h-4" /> Baixar rascunho do contrato (PDF)
      </button>

      <button
        disabled={obraInvalidas.length > 0 || !form.titular_id || !form.tipo}
        onClick={() => {
          const contrato = salvarContrato()
          localStorage.setItem('sync_obras_prefill', JSON.stringify({
            contrato_id: contrato.id,
            titular_id: form.titular_id,
            obras: form.obras,
            observacoes: form.observacoes, // salvo no cadastro da obra, não no contrato
          }))
          router.push('/master/obras/catalogo?origem=contrato')
        }}
        className="w-full h-11 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
      >
        Criar Contrato e Iniciar Cadastro de Obras
      </button>

      <button
        disabled={obraInvalidas.length > 0 || !form.titular_id || !form.tipo}
        onClick={() => {
          salvarContrato()
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
        title="Novo Contrato de Obras"
        description={`Passo ${step + 1} de ${TOTAL_STEPS} — ${STEP_LABELS[step].label}`}
        actions={
          <button onClick={() => router.push('/master/contratos')} className="text-sm text-white/40 hover:text-white/70">
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

      {/* Navegação — visível em todos os passos exceto o primeiro tem Anterior */}
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
              (step === 1 && !form.titular_id)
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
