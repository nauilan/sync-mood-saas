'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Save, AlertTriangle,
  User, Building2, Briefcase, UserCircle2, MapPin,
  Phone, Landmark, FileText, CheckSquare
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { verificarDuplicidade } from '@/lib/mock-cadastros'
import { maskCpf, maskCnpj } from '@/lib/masks'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  FUNCAO_LABEL, FUNCAO_SIGLA, FUNCOES_PF, FUNCOES_PJ,
  type FuncaoTitular, type TipoPessoa
} from '@/lib/types-cadastros'

// ---- Passos do wizard ----------------------------------------
type Passo =
  | 'tipo'        // 1 — Tipo + Editora
  | 'dados_pf'    // 2a — Dados PF
  | 'dados_pj'    // 2b — Dados PJ
  | 'funcoes'     // 3 — Funcoes (multi-select)
  | 'pseudonimos' // 4 — Pseudonimos (so PF)
  | 'endereco'    // 5 — Endereco
  | 'contatos'    // 6 — Contatos
  | 'bancario'    // 7 — Dados bancarios
  | 'documentos'  // 8 — Documentos (upload mock)
  | 'revisao'     // 9 — Revisao + validacao duplicidade

interface PassoConfig { id: Passo; label: string; icon: React.ReactNode }

function getPassos(tipoPessoa: TipoPessoa): PassoConfig[] {
  const all: PassoConfig[] = [
    { id: 'tipo', label: 'Tipo e Editora', icon: <User className="w-4 h-4" /> },
    tipoPessoa === 'PF'
      ? { id: 'dados_pf', label: 'Dados Pessoais', icon: <UserCircle2 className="w-4 h-4" /> }
      : { id: 'dados_pj', label: 'Dados da Empresa', icon: <Building2 className="w-4 h-4" /> },
    { id: 'funcoes', label: 'Funcoes', icon: <Briefcase className="w-4 h-4" /> },
    ...(tipoPessoa === 'PF' ? [{ id: 'pseudonimos' as Passo, label: 'Pseudonimos', icon: <UserCircle2 className="w-4 h-4" /> }] : []),
    { id: 'endereco', label: 'Endereco', icon: <MapPin className="w-4 h-4" /> },
    { id: 'contatos', label: 'Contatos', icon: <Phone className="w-4 h-4" /> },
    { id: 'bancario', label: 'Dados Bancarios', icon: <Landmark className="w-4 h-4" /> },
    { id: 'documentos', label: 'Documentos', icon: <FileText className="w-4 h-4" /> },
    { id: 'revisao', label: 'Revisao', icon: <CheckSquare className="w-4 h-4" /> },
  ]
  return all
}

// ---- Estado do formulario ------------------------------------
interface FormState {
  tipo_pessoa: TipoPessoa
  editora_id: string
  codigo_titular: string
  // PF
  nome_completo: string
  cpf: string
  rg: string
  data_nasc: string
  nacionalidade: string
  estado_civil: string
  profissao: string
  nome_artistico_principal: string
  sociedade_autoral: string
  cae: string
  ipi: string
  // PJ
  razao_social: string
  nome_fantasia: string
  cnpj: string
  ie: string
  im: string
  responsavel_legal: string
  site: string
  socios: { nome: string; cpf: string }[]
  // Funcoes
  funcoes: FuncaoTitular[]
  // Pseudonimos
  pseudonimos: { pseudonimo: string; principal: boolean }[]
  // Endereco
  cep: string
  endereco: string
  numero: string
  compl: string
  bairro: string
  cidade: string
  estado: string
  pais: string
  // Contatos
  contatos: { tipo: 'telefone' | 'whatsapp' | 'email'; valor: string; principal: boolean }[]
  // Bancario
  banco: string
  agencia: string
  conta: string
  tipo_conta: 'corrente' | 'poupanca' | 'pagamento' | ''
  titular_conta: string
  pix_chave: string
  pix_tipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria' | ''
  operacao: string
  // Documentos
  documentos: { tipo: string; numero: string }[]
  // Observacoes
  observacoes: string
}

const EMPTY: FormState = {
  tipo_pessoa: 'PF', editora_id: '', codigo_titular: '',
  nome_completo: '', cpf: '', rg: '', data_nasc: '', nacionalidade: 'Brasileira', estado_civil: '', profissao: '', nome_artistico_principal: '', sociedade_autoral: '', cae: '', ipi: '',
  razao_social: '', nome_fantasia: '', cnpj: '', ie: '', im: '', responsavel_legal: '', site: '', socios: [],
  funcoes: [],
  pseudonimos: [],
  cep: '', endereco: '', numero: '', compl: '', bairro: '', cidade: '', estado: '', pais: 'Brasil',
  contatos: [{ tipo: 'email', valor: '', principal: true }],
  banco: '', agencia: '', conta: '', tipo_conta: '', titular_conta: '', pix_chave: '', pix_tipo: '', operacao: '',
  documentos: [],
  observacoes: '',
}

const inputCls = 'w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors'
const inputErrCls = 'w-full bg-white/[0.03] border border-rose-500/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none'

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const BANCOS_BR = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '003', nome: 'Banco da Amazônia' },
  { codigo: '004', nome: 'Banco do Nordeste do Brasil' },
  { codigo: '021', nome: 'Banestes' },
  { codigo: '025', nome: 'Banco Alfa' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '036', nome: 'Bradesco BBI' },
  { codigo: '037', nome: 'Banpará' },
  { codigo: '041', nome: 'Banrisul' },
  { codigo: '047', nome: 'Banese' },
  { codigo: '070', nome: 'BRB' },
  { codigo: '077', nome: 'Inter' },
  { codigo: '084', nome: 'Uniprime Norte do Paraná' },
  { codigo: '085', nome: 'Cecred / Ailos' },
  { codigo: '099', nome: 'Uniprime Central' },
  { codigo: '104', nome: 'Caixa Economica Federal' },
  { codigo: '136', nome: 'Unicred' },
  { codigo: '197', nome: 'Stone' },
  { codigo: '208', nome: 'BTG Pactual' },
  { codigo: '212', nome: 'Banco Original' },
  { codigo: '218', nome: 'BS2' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '243', nome: 'Banco Master' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '290', nome: 'PagBank / PagSeguro' },
  { codigo: '301', nome: 'BPP' },
  { codigo: '323', nome: 'Mercado Pago' },
  { codigo: '336', nome: 'C6 Bank' },
  { codigo: '341', nome: 'Itau' },
  { codigo: '380', nome: 'PicPay' },
  { codigo: '422', nome: 'Banco Safra' },
  { codigo: '623', nome: 'Banco Pan' },
  { codigo: '633', nome: 'Banco Rendimento' },
  { codigo: '637', nome: 'Banco Sofisa' },
  { codigo: '655', nome: 'Votorantim' },
  { codigo: '707', nome: 'Banco Daycoval' },
  { codigo: '735', nome: 'Banco Neon' },
  { codigo: '748', nome: 'Sicredi' },
  { codigo: '756', nome: 'Sicoob' },
  { codigo: '999', nome: 'Outro' },
]
const SOCIEDADES = ['ABRAMUS', 'AMAR', 'ASSIM', 'SBACEM', 'SICAM', 'SOCINPRO', 'UBC', 'Outras']

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/50">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  )
}

function AvisoDuplicidade({ avisos, campos }: { avisos: ReturnType<typeof verificarDuplicidade>; campos?: string[] }) {
  const filtrados = campos ? avisos.filter(a => campos.includes(a.campo)) : avisos
  if (filtrados.length === 0) return null
  const temBloqueante = filtrados.some(a => a.bloqueante)
  return (
    <div className={`rounded-xl border px-4 py-3 space-y-1.5 ${temBloqueante ? 'bg-rose-500/8 border-rose-500/30' : 'bg-amber-500/8 border-amber-500/25'}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${temBloqueante ? 'text-rose-400' : 'text-amber-400'}`} />
        <p className={`text-sm font-semibold ${temBloqueante ? 'text-rose-400' : 'text-amber-400'}`}>
          {temBloqueante ? 'Cadastro duplicado — nao e possivel prosseguir' : 'Possivel duplicidade encontrada'}
        </p>
      </div>
      {filtrados.map((a, i) => (
        <p key={i} className={`text-xs pl-6 ${temBloqueante ? 'text-rose-300/70' : 'text-amber-300/70'}`}>
          Campo <strong>{a.campo}</strong> ({a.valor}) ja existe em: <strong>{a.nome}</strong>
          {a.bloqueante && <span className="ml-2 text-rose-400 font-semibold">— cadastro bloqueado</span>}
        </p>
      ))}
      {!temBloqueante && (
        <p className="text-xs text-amber-400/50 pl-6">Verifique se nao esta criando um duplicado. Voce pode prosseguir mesmo assim.</p>
      )}
    </div>
  )
}

export default function NovoTitularWizardPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [duplicidades, setDuplicidades] = useState<ReturnType<typeof verificarDuplicidade>>([])
  const [buscandoCep, setBuscandoCep] = useState(false)
  const bancoInputRef = useRef<HTMLInputElement>(null)
  const [avisos, setAvisos] = useState<ReturnType<typeof verificarDuplicidade>>([])
  // Editoras reais do banco
  const [editorasReais, setEditorasReais] = useState<{ id: string; nome_fantasia: string }[]>([])
  useEffect(() => {
    fetch('/api/editoras?status=todos')
      .then(r => r.json())
      .then(d => setEditorasReais(d.editoras ?? []))
      .catch(() => {/* usa vazio */})
  }, [])

  // codigo_titular: deixado vazio → servidor auto-gera T####; se preenchido, usa o valor informado

  // Live duplicate check ao alterar nome, cpf/cnpj ou pseudonimos
  useEffect(() => {
    const pseudonimoAtivo = form.pseudonimos.find(p => p.principal)?.pseudonimo || form.pseudonimos[0]?.pseudonimo
    const resultado = verificarDuplicidade({
      cpf: form.cpf.trim() || undefined,
      cnpj: form.cnpj.trim() || undefined,
      nome_completo: form.nome_completo.trim() || undefined,
      razao_social: form.razao_social.trim() || undefined,
      nome_fantasia: form.nome_fantasia.trim() || undefined,
      pseudonimo: pseudonimoAtivo?.trim() || undefined,
    })
    setAvisos(resultado)
  }, [form.cpf, form.cnpj, form.nome_completo, form.razao_social, form.nome_fantasia, form.pseudonimos])

  const passos = getPassos(form.tipo_pessoa)
  const [passoIdx, setPassoIdx] = useState(0)
  const passo = passos[passoIdx]

  const set = useCallback(<K extends keyof FormState>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value })), [])

  // Igual ao set mas converte para maiusculas (exceto email, url, etc.)
  const setUpper = useCallback(<K extends keyof FormState>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: (e.target.value as string).toUpperCase() })), [])

  const setVal = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v })), [])

  // Auto-popular pseudonimos ao entrar no passo 4 se nome_artistico_principal foi preenchido
  useEffect(() => {
    if (passo.id === 'pseudonimos' && form.pseudonimos.length === 0 && form.nome_artistico_principal.trim()) {
      setForm(prev => ({ ...prev, pseudonimos: [{ pseudonimo: prev.nome_artistico_principal.trim(), principal: true }] }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo.id])

  async function fetchCep(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          endereco: data.logradouro || prev.endereco,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }))
      }
    } catch { /* silencioso */ } finally {
      setBuscandoCep(false)
    }
  }

  function validatePasso(): boolean {
    const errs: typeof errors = {}
    if (passo.id === 'tipo') {
      // código pode estar vazio (servidor auto-gera) — nenhuma validação local de unicidade
    }
    if (passo.id === 'dados_pf') {
      if (!form.nome_completo.trim()) errs.nome_completo = 'Nome obrigatorio'
    }
    if (passo.id === 'dados_pj') {
      if (!form.razao_social.trim()) errs.razao_social = 'Razao social obrigatoria'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (!validatePasso()) return
    // CPF/CNPJ duplicado bloqueia avanco
    if (avisos.some(a => a.bloqueante) && (passo.id === 'dados_pf' || passo.id === 'dados_pj')) return
    if (passoIdx < passos.length - 1) setPassoIdx(i => i + 1)
  }
  function handlePrev() {
    if (passoIdx > 0) setPassoIdx(i => i - 1)
  }

  function goToPasso(idx: number) {
    if (idx < passoIdx) setPassoIdx(idx)
  }

  // Na revisao: verificar duplicidades
  function calcDuplicidades() {
    const d = verificarDuplicidade({
      cpf: form.cpf || undefined,
      cnpj: form.cnpj || undefined,
      nome_completo: form.nome_completo || undefined,
      razao_social: form.razao_social || undefined,
      pseudonimo: form.pseudonimos[0]?.pseudonimo || undefined,
      email: form.contatos.find(c => c.tipo === 'email')?.valor || undefined,
      cae: form.cae || undefined,
      ipi: form.ipi || undefined,
    })
    setDuplicidades(d)
  }

  // ao chegar na revisao
  const prevPassoId = passos[passoIdx - 1]?.id
  if (passo.id === 'revisao' && prevPassoId && prevPassoId !== 'revisao') {
    // Nao recalcular se ja estava na revisao
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const nomeCompleto = form.tipo_pessoa === 'PF'
        ? form.nome_completo.trim()
        : (form.razao_social.trim() || form.nome_fantasia.trim())

      const payload: Record<string, unknown> = {
        nome_completo:   nomeCompleto,
        tipo:            form.tipo_pessoa === 'PF' ? 'autor' : 'editora',
        tipo_pessoa:     form.tipo_pessoa,
        // Se em branco, o servidor gera T####; se preenchido, usa e valida unicidade
        codigo_titular:  form.codigo_titular.trim() || undefined,
        nome_artistico:  form.nome_artistico_principal.trim() || undefined,
        cpf_cnpj:        form.tipo_pessoa === 'PF'
          ? (form.cpf.trim() || undefined)
          : (form.cnpj.trim() || undefined),
        codigo_cae:      form.cae.trim() || undefined,
        ipi:             form.ipi.trim() || undefined,
        codigo_ipi:      form.ipi.trim() || undefined,
      }

      const res  = await fetch('/api/titulares', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data?.error?.message ?? data?.error ?? 'Erro ao salvar titular'
        setSaveError(msg)
        setSaving(false)
        return
      }
      router.push('/master/titulares')
    } catch (e: any) {
      setSaveError(e.message ?? 'Erro inesperado')
      setSaving(false)
    }
  }

  // Funcoes disponíveis por tipo de pessoa
  const funcoesDisponiveis = form.tipo_pessoa === 'PF' ? FUNCOES_PF : FUNCOES_PJ

  function toggleFuncao(f: FuncaoTitular) {
    setForm(prev => ({
      ...prev,
      funcoes: prev.funcoes.includes(f)
        ? prev.funcoes.filter(x => x !== f)
        : [...prev.funcoes, f]
    }))
  }

  function addPseudonimo() {
    setForm(prev => ({ ...prev, pseudonimos: [...prev.pseudonimos, { pseudonimo: '', principal: prev.pseudonimos.length === 0 }] }))
  }
  function removePseudonimo(idx: number) {
    setForm(prev => ({ ...prev, pseudonimos: prev.pseudonimos.filter((_, i) => i !== idx) }))
  }
  function setPseudonimoPrincipal(idx: number) {
    setForm(prev => ({ ...prev, pseudonimos: prev.pseudonimos.map((p, i) => ({ ...p, principal: i === idx })) }))
  }

  function addContato() {
    setForm(prev => ({ ...prev, contatos: [...prev.contatos, { tipo: 'telefone', valor: '', principal: false }] }))
  }
  function removeContato(idx: number) {
    setForm(prev => ({ ...prev, contatos: prev.contatos.filter((_, i) => i !== idx) }))
  }

  // ---- Render conteudo do passo ----------------------------
  function renderPasso() {
    switch (passo.id) {
      case 'tipo':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <p className="text-sm text-white/50 mb-3">Selecione o tipo de pessoa e a editora responsavel por este titular.</p>
            </div>
            <Field label="Tipo de Pessoa" required>
              <div className="flex gap-3">
                {(['PF', 'PJ'] as TipoPessoa[]).map(tp => (
                  <button key={tp} onClick={() => setVal('tipo_pessoa', tp)}
                    className={'flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ' + (form.tipo_pessoa === tp ? 'bg-violet-600/15 border-violet-500/40 text-violet-300' : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:text-white/70')}>
                    {tp === 'PF' ? 'Pessoa Fisica (PF)' : 'Pessoa Juridica (PJ)'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Editora vinculada" error={errors.editora_id}>
              <select className={errors.editora_id ? inputErrCls : inputCls} value={form.editora_id} onChange={set('editora_id')}>
                <option value="">Selecione a editora...</option>
                {editorasReais.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia}</option>)}
              </select>
            </Field>
            <Field label="Codigo do Titular" error={errors.codigo_titular}>
              <input
                className={errors.codigo_titular ? inputErrCls : inputCls}
                placeholder="Deixe vazio para gerar automaticamente (ex: T0001)"
                value={form.codigo_titular}
                onChange={setUpper('codigo_titular')}
              />
              <p className="text-xs text-white/20 mt-1">
                Se preenchido, deve ser único neste tenant. Se em branco, o sistema gera automaticamente.
              </p>
            </Field>
          </div>
        )

      case 'dados_pf':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <AvisoDuplicidade avisos={avisos} campos={['CPF', 'Nome completo']} />
            </div>
            <div className="md:col-span-2">
              <Field label="Nome Completo" required error={errors.nome_completo}>
                <input className={errors.nome_completo ? inputErrCls : inputCls} placeholder="Nome completo conforme documento" value={form.nome_completo} onChange={setUpper('nome_completo')} />
              </Field>
            </div>
            <Field label="CPF">
              <input className={inputCls} placeholder="000.000.000-00" value={form.cpf}
                onChange={e => setForm(prev => ({ ...prev, cpf: maskCpf(e.target.value) }))} />
            </Field>
            <Field label="RG">
              <input className={inputCls} placeholder="00.000.000-0" value={form.rg} onChange={setUpper('rg')} />
            </Field>
            <Field label="Data de Nascimento">
              <input type="date" className={inputCls} value={form.data_nasc} onChange={set('data_nasc')} />
            </Field>
            <Field label="Nacionalidade">
              <input className={inputCls} placeholder="Brasileira" value={form.nacionalidade} onChange={setUpper('nacionalidade')} />
            </Field>
            <Field label="Estado Civil">
              <select className={inputCls} value={form.estado_civil} onChange={set('estado_civil')}>
                <option value="">Selecione...</option>
                <option value="Solteiro">Solteiro(a)</option>
                <option value="Casado">Casado(a)</option>
                <option value="Divorciado">Divorciado(a)</option>
                <option value="Viuvo">Viuvo(a)</option>
                <option value="Uniao estavel">Uniao estavel</option>
              </select>
            </Field>
            <Field label="Profissao">
              <input className={inputCls} placeholder="MUSICO, COMPOSITOR, ETC." value={form.profissao} onChange={setUpper('profissao')} />
            </Field>
            <Field label="Nome Artistico Principal">
              <input className={inputCls} placeholder="NOME ARTISTICO" value={form.nome_artistico_principal} onChange={setUpper('nome_artistico_principal')} />
            </Field>
            <Field label="Sociedade Autoral">
              <select className={inputCls} value={form.sociedade_autoral} onChange={set('sociedade_autoral')}>
                <option value="">Nao vinculado</option>
                {SOCIEDADES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Codigo CAE">
              <input className={inputCls} placeholder="CAE-00000" value={form.cae} onChange={setUpper('cae')} />
            </Field>
            <Field label="Codigo IPI (SOCINPRO)">
              <input className={inputCls} placeholder="00000000" value={form.ipi} onChange={setUpper('ipi')} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Observacoes">
                <textarea className={inputCls + ' h-20 resize-none'} placeholder="NOTAS INTERNAS..." value={form.observacoes} onChange={setUpper('observacoes')} />
              </Field>
            </div>
          </div>
        )

      case 'dados_pj':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <AvisoDuplicidade avisos={avisos} campos={['CNPJ', 'Razao social', 'Nome fantasia']} />
            </div>
            <div className="md:col-span-2">
              <Field label="Razao Social" required error={errors.razao_social}>
                <input className={errors.razao_social ? inputErrCls : inputCls} placeholder="RAZAO SOCIAL COMPLETA" value={form.razao_social} onChange={setUpper('razao_social')} />
              </Field>
            </div>
            <Field label="Nome Fantasia">
              <input className={inputCls} placeholder="NOME FANTASIA" value={form.nome_fantasia} onChange={setUpper('nome_fantasia')} />
            </Field>
            <Field label="CNPJ">
              <input className={inputCls} placeholder="00.000.000/0001-00" value={form.cnpj}
                onChange={e => setForm(prev => ({ ...prev, cnpj: maskCnpj(e.target.value) }))} />
            </Field>
            <Field label="Inscricao Estadual (IE)">
              <input className={inputCls} placeholder="IE" value={form.ie} onChange={setUpper('ie')} />
            </Field>
            <Field label="Inscricao Municipal (IM)">
              <input className={inputCls} placeholder="IM" value={form.im} onChange={setUpper('im')} />
            </Field>
            <Field label="Responsavel Legal">
              <input className={inputCls} placeholder="NOME DO RESPONSAVEL LEGAL" value={form.responsavel_legal} onChange={setUpper('responsavel_legal')} />
            </Field>
            <Field label="Site">
              <input className={inputCls} placeholder="www.exemplo.com.br" value={form.site} onChange={set('site')} />
            </Field>
            <Field label="Sociedade Autoral">
              <select className={inputCls} value={form.sociedade_autoral} onChange={set('sociedade_autoral')}>
                <option value="">Nao vinculado</option>
                {SOCIEDADES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Codigo CAE">
              <input className={inputCls} placeholder="CAE-PJ-00000" value={form.cae} onChange={setUpper('cae')} />
            </Field>
            <Field label="Codigo IPI">
              <input className={inputCls} placeholder="00000000" value={form.ipi} onChange={setUpper('ipi')} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Observacoes">
                <textarea className={inputCls + ' h-20 resize-none'} placeholder="NOTAS INTERNAS..." value={form.observacoes} onChange={setUpper('observacoes')} />
              </Field>
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/50">CPF dos Socios</span>
                <button type="button"
                  onClick={() => setForm(prev => ({ ...prev, socios: [...prev.socios, { nome: '', cpf: '' }] }))}
                  className="text-xs text-violet-400 hover:text-violet-300">
                  + Adicionar socio
                </button>
              </div>
              {form.socios.length === 0 && <p className="text-xs text-white/20">Nenhum socio adicionado.</p>}
              {form.socios.map((s, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input className={inputCls + ' flex-1'} placeholder="NOME DO SOCIO"
                    value={s.nome}
                    onChange={e => setForm(prev => ({ ...prev, socios: prev.socios.map((x, i) => i === idx ? { ...x, nome: e.target.value.toUpperCase() } : x) }))} />
                  <input className={inputCls + ' w-40'} placeholder="000.000.000-00"
                    value={s.cpf}
                    onChange={e => setForm(prev => ({ ...prev, socios: prev.socios.map((x, i) => i === idx ? { ...x, cpf: maskCpf(e.target.value) } : x) }))} />
                  <button type="button"
                    onClick={() => setForm(prev => ({ ...prev, socios: prev.socios.filter((_, i) => i !== idx) }))}
                    className="mt-1 text-white/20 hover:text-rose-400 text-xl leading-none px-1">×</button>
                </div>
              ))}
            </div>
          </div>
        )

      case 'funcoes':
        return (
          <div className="space-y-4">
            <p className="text-sm text-white/50">Selecione as funcoes deste titular. Um titular pode ter multiplas funcoes.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {funcoesDisponiveis.map(f => {
                const selected = form.funcoes.includes(f)
                return (
                  <button key={f} onClick={() => toggleFuncao(f)}
                    className={'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors text-left ' + (selected ? 'bg-violet-600/15 border-violet-500/40 text-violet-300' : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:text-white/70 hover:border-white/15')}>
                    <span className={'w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ' + (selected ? 'bg-violet-500 border-violet-500' : 'border-white/20')}>
                      {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </span>
                    <span>{FUNCAO_LABEL[f]}</span>
                    <span className="ml-auto text-[10px] font-mono text-white/30">{FUNCAO_SIGLA[f]}</span>
                  </button>
                )
              })}
            </div>
            {form.funcoes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04]">
                <span className="text-xs text-white/30">Selecionados:</span>
                {form.funcoes.map(f => <Badge key={f} variant="violet">{FUNCAO_LABEL[f]}</Badge>)}
              </div>
            )}
            {form.funcoes.length === 0 && (
              <p className="text-xs text-amber-400/70">Nenhuma funcao selecionada — recomendamos selecionar ao menos uma.</p>
            )}
          </div>
        )

      case 'pseudonimos':
        return (
          <div className="space-y-4">
            <p className="text-sm text-white/50">Pseudonimos artisticos do titular. Apenas um pode ser o principal ativo.</p>
            <AvisoDuplicidade avisos={avisos} campos={['Pseudonimo']} />
            <div className="space-y-3">
              {form.pseudonimos.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.06]">
                  <input
                    className={inputCls + ' flex-1'}
                    placeholder="Nome artistico / pseudonimo"
                    value={p.pseudonimo}
                    onChange={e => setForm(prev => ({ ...prev, pseudonimos: prev.pseudonimos.map((x, i) => i === idx ? { ...x, pseudonimo: e.target.value.toUpperCase() } : x) }))}
                  />
                  <button
                    onClick={() => setPseudonimoPrincipal(idx)}
                    className={'px-2.5 py-1.5 rounded-lg text-xs border transition-colors ' + (p.principal ? 'bg-violet-600/15 border-violet-500/30 text-violet-300' : 'border-white/10 text-white/30 hover:text-white/50')}
                  >
                    {p.principal ? 'Principal' : 'Definir principal'}
                  </button>
                  <button onClick={() => removePseudonimo(idx)} className="text-white/20 hover:text-rose-400 transition-colors text-lg leading-none">×</button>
                </div>
              ))}
              <button
                onClick={addPseudonimo}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.1] text-xs text-white/30 hover:text-white/50 hover:border-white/20 transition-colors"
              >
                + Adicionar pseudonimo
              </button>
            </div>
          </div>
        )

      case 'endereco':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={buscandoCep ? 'CEP (buscando...)' : 'CEP'}>
              <input
                className={inputCls}
                placeholder="00000-000"
                value={form.cep}
                maxLength={9}
                onChange={e => {
                  const v = e.target.value
                  setForm(prev => ({ ...prev, cep: v }))
                  fetchCep(v)
                }}
              />
            </Field>
            <div className="md:col-span-2 md:hidden" />
            <div className="md:col-span-2">
              <Field label="Endereco">
                <input className={inputCls} placeholder="RUA, AVENIDA, ETC." value={form.endereco} onChange={setUpper('endereco')} />
              </Field>
            </div>
            <Field label="Numero">
              <input className={inputCls} placeholder="NUMERO" value={form.numero} onChange={setUpper('numero')} />
            </Field>
            <Field label="Complemento">
              <input className={inputCls} placeholder="APTO, SALA, ETC." value={form.compl} onChange={setUpper('compl')} />
            </Field>
            <Field label="Bairro">
              <input className={inputCls} placeholder="BAIRRO" value={form.bairro} onChange={setUpper('bairro')} />
            </Field>
            <Field label="Cidade">
              <input className={inputCls} placeholder="CIDADE" value={form.cidade} onChange={setUpper('cidade')} />
            </Field>
            <Field label="Estado (UF)">
              <select className={inputCls} value={form.estado} onChange={set('estado')}>
                <option value="">Selecione...</option>
                {ESTADOS_BR.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Pais">
              <input className={inputCls} placeholder="BRASIL" value={form.pais} onChange={setUpper('pais')} />
            </Field>
          </div>
        )

      case 'contatos':
        return (
          <div className="space-y-4">
            <p className="text-sm text-white/50">Adicione os contatos do titular. Marque o principal de cada tipo.</p>
            <div className="space-y-3">
              {form.contatos.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/[0.02] rounded-xl px-3 py-2.5 border border-white/[0.06]">
                  <select
                    className="bg-transparent text-xs text-white/60 outline-none border-r border-white/[0.08] pr-2 mr-1"
                    value={c.tipo}
                    onChange={e => setForm(prev => ({ ...prev, contatos: prev.contatos.map((x, i) => i === idx ? { ...x, tipo: e.target.value as typeof c.tipo } : x) }))}
                  >
                    <option value="telefone">Telefone</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                  </select>
                  {(c.tipo === 'telefone' || c.tipo === 'whatsapp') ? (
                    <div className="flex-1">
                      <PhoneInput
                        value={c.valor}
                        onChange={v => setForm(prev => ({ ...prev, contatos: prev.contatos.map((x, i) => i === idx ? { ...x, valor: v } : x) }))}
                      />
                    </div>
                  ) : (
                    <input
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder-white/25"
                      placeholder={c.tipo === 'email' ? 'email@dominio.com' : c.valor}
                      value={c.valor}
                      onChange={e => setForm(prev => ({ ...prev, contatos: prev.contatos.map((x, i) => i === idx ? { ...x, valor: e.target.value } : x) }))}
                    />
                  )}
                  <button
                    onClick={() => setForm(prev => ({ ...prev, contatos: prev.contatos.map((x, i) => ({ ...x, principal: i === idx })) }))}
                    className={'px-2 py-1 rounded text-[10px] border transition-colors ' + (c.principal ? 'bg-violet-600/15 border-violet-500/30 text-violet-300' : 'border-white/10 text-white/20 hover:text-white/40')}
                  >
                    Principal
                  </button>
                  <button onClick={() => removeContato(idx)} className="text-white/20 hover:text-rose-400 text-lg leading-none">×</button>
                </div>
              ))}
              <button onClick={addContato} className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.1] text-xs text-white/30 hover:text-white/50 hover:border-white/20 transition-colors">
                + Adicionar contato
              </button>
            </div>
          </div>
        )

      case 'bancario': {
        const isCEF = form.banco.includes('104') || form.banco.toLowerCase().includes('caixa')
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="Banco">
                <input
                  ref={bancoInputRef}
                  className={inputCls}
                  list="bancos-list"
                  placeholder="Buscar por nome ou código (ex: 237 ou Bradesco)..."
                  value={form.banco}
                  onChange={set('banco')}
                  autoComplete="off"
                />
                <datalist id="bancos-list">
                  {BANCOS_BR.map(b => (
                    <option key={b.codigo} value={`${b.codigo} - ${b.nome}`} />
                  ))}
                </datalist>
              </Field>
            </div>
            <Field label="Tipo de Conta">
              <select className={inputCls} value={form.tipo_conta} onChange={set('tipo_conta')}>
                <option value="">Selecione...</option>
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupanca</option>
                <option value="pagamento">Pagamento</option>
                <option value="salario">Salario</option>
              </select>
            </Field>
            <Field label="Agencia">
              <input className={inputCls} placeholder="0000" value={form.agencia} onChange={setUpper('agencia')} />
            </Field>
            <Field label="Conta">
              <input className={inputCls} placeholder="00000-0" value={form.conta} onChange={setUpper('conta')} />
            </Field>
            {isCEF && (
              <Field label="Operacao (Caixa Economica Federal)">
                <input className={inputCls} placeholder="EX: 001, 013, 023..." value={form.operacao} onChange={setUpper('operacao')} />
              </Field>
            )}
            <Field label="Titular da Conta">
              <input className={inputCls} placeholder="NOME COMPLETO DO TITULAR" value={form.titular_conta} onChange={setUpper('titular_conta')} />
            </Field>
            <Field label="Tipo de Chave PIX">
              <select className={inputCls} value={form.pix_tipo} onChange={set('pix_tipo')}>
                <option value="">Sem chave PIX</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave aleatoria</option>
              </select>
            </Field>
            {form.pix_tipo && (
              <div className="md:col-span-2">
                <Field label="Chave PIX">
                  <input className={inputCls} placeholder="Informe a chave PIX" value={form.pix_chave}
                    onChange={e => setForm(prev => ({ ...prev, pix_chave: prev.pix_tipo === 'email' ? e.target.value : e.target.value.toUpperCase() }))} />
                </Field>
              </div>
            )}
          </div>
        )
      }

      case 'documentos':
        return (
          <div className="space-y-4">
            <p className="text-sm text-white/50">Anexe documentos do titular. (Upload disponivel apos conexao com Supabase Storage.)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { tipo: 'rg', label: 'RG' },
                { tipo: 'cpf', label: 'CPF' },
                { tipo: 'cnpj', label: 'Cartao CNPJ' },
                { tipo: 'contrato_social', label: 'Contrato Social' },
                { tipo: 'cnh', label: 'CNH' },
                { tipo: 'passaporte', label: 'Passaporte' },
              ].filter(d => form.tipo_pessoa === 'PF' ? !['cnpj', 'contrato_social'].includes(d.tipo) : !['rg', 'cnh', 'passaporte'].includes(d.tipo))
               .map(doc => (
                <div key={doc.tipo} className="flex items-center gap-3 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-xl px-4 py-3">
                  <FileText className="w-4 h-4 text-white/20 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/50">{doc.label}</p>
                    <p className="text-[10px] text-white/20">Nenhum arquivo</p>
                  </div>
                  <button className="text-xs text-violet-400/60 hover:text-violet-400 transition-colors">Anexar</button>
                </div>
              ))}
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400/70">
              Upload de arquivos estara disponivel apos configuracao do Supabase Storage. Os campos de numero de documento podem ser preenchidos manualmente.
            </div>
          </div>
        )

      case 'revisao': {
        const nome = form.tipo_pessoa === 'PF' ? form.nome_completo : form.razao_social
        const docNum = form.tipo_pessoa === 'PF' ? form.cpf : form.cnpj
        const editora = editorasReais.find(e => e.id === form.editora_id)
        const todosAvisos = duplicidades.length > 0 ? duplicidades : avisos
        return (
          <div className="space-y-5">
            {todosAvisos.length > 0 && (
              <AvisoDuplicidade avisos={todosAvisos} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.02] rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Identificacao</h4>
                <InfoRowR label="Nome" value={nome || '—'} />
                <InfoRowR label="Codigo" value={form.codigo_titular || '—'} />
                <InfoRowR label="Tipo" value={form.tipo_pessoa} />
                <InfoRowR label="Editora" value={editora?.nome_fantasia ?? '—'} />
                <InfoRowR label={form.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'} value={docNum || '—'} />
                {form.tipo_pessoa === 'PF' && <InfoRowR label="CAE" value={form.cae || '—'} />}
                {form.tipo_pessoa === 'PF' && <InfoRowR label="IPI" value={form.ipi || '—'} />}
                {form.tipo_pessoa === 'PF' && <InfoRowR label="Sociedade" value={form.sociedade_autoral || '—'} />}
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Funcoes e Contatos</h4>
                <InfoRowR label="Funcoes" value={form.funcoes.length > 0 ? form.funcoes.join(', ') : '—'} />
                {form.tipo_pessoa === 'PF' && <InfoRowR label="Pseudonimos" value={form.pseudonimos.map(p => p.pseudonimo).filter(Boolean).join(', ') || '—'} />}
                <InfoRowR label="Contatos" value={form.contatos.filter(c => c.valor).map(c => c.valor).join(', ') || '—'} />
                <InfoRowR label="Banco" value={form.banco || '—'} />
                <InfoRowR label="Agencia/Conta" value={form.agencia && form.conta ? `${form.agencia} / ${form.conta}` : '—'} />
                <InfoRowR label="PIX" value={form.pix_chave || '—'} />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              Tudo certo? Clique em &quot;Salvar Titular&quot; para confirmar o cadastro.
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  function InfoRowR({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex items-start justify-between gap-2 text-xs">
        <span className="text-white/30 flex-shrink-0 w-28">{label}</span>
        <span className="text-white/70 text-right break-all">{value}</span>
      </div>
    )
  }

  const isLast = passoIdx === passos.length - 1

  function handleNextOrReview() {
    if (passoIdx === passos.length - 2) {
      // Proximo passo e revisao: calcular duplicidades
      calcDuplicidades()
    }
    handleNext()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <PageHeader title="Novo Titular" description="Wizard de cadastro — 9 passos" />
      </div>

      {/* Progress bar */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {passos.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => goToPasso(idx)}
                disabled={idx > passoIdx}
                className={'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ' + (
                  idx === passoIdx
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : idx < passoIdx
                    ? 'text-white/50 hover:text-white/70 cursor-pointer'
                    : 'text-white/20 cursor-not-allowed'
                )}
              >
                <span className={'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ' + (idx < passoIdx ? 'bg-emerald-500/20 text-emerald-400' : idx === passoIdx ? 'bg-violet-500/30 text-violet-300' : 'bg-white/5 text-white/20')}>
                  {idx < passoIdx ? '✓' : idx + 1}
                </span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
              {idx < passos.length - 1 && <span className="text-white/10 text-xs">›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Conteudo do passo */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 min-h-[320px]">
        <div className="flex items-center gap-2 mb-5">
          <div className="text-violet-400">{passo.icon}</div>
          <h3 className="text-sm font-semibold text-white">Passo {passoIdx + 1} — {passo.label}</h3>
        </div>
        {renderPasso()}
      </div>

      {/* Footer navegacao */}
      <div className="flex items-center justify-between bg-[#0d1526] border border-white/[0.06] rounded-xl px-5 py-3.5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-white/30 hover:text-white/50 transition-colors">Cancelar</button>
          {passoIdx > 0 && (
            <Button variant="ghost" size="sm" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/20">
          {passoIdx + 1} / {passos.length}
        </div>
        {isLast ? (
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Titular'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleNextOrReview}
            disabled={avisos.some(a => a.bloqueante) && (passo.id === 'dados_pf' || passo.id === 'dados_pj')}
          >
            Proximo <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
      {saveError && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {saveError}
        </div>
      )}
    </div>
  )
}
