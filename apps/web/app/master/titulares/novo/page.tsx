'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ChevronLeft, Save, User, MapPin, Phone, Music2, Landmark, FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import type { TipoTitular, PessoaTipo, TipoContaBancaria } from '@/lib/database.types'

const TIPOS_TITULAR: { value: TipoTitular; label: string }[] = [
  { value: 'compositor', label: 'Compositor' }, { value: 'autor', label: 'Autor' },
  { value: 'interprete', label: 'Interprete' }, { value: 'produtor', label: 'Produtor' },
  { value: 'editora', label: 'Editora' }, { value: 'gravadora', label: 'Gravadora' },
  { value: 'cessionario', label: 'Cessionario' },
]
const SOCIEDADES = ['UBC', 'ECAD', 'ABRAMUS', 'ABRAC', 'ASSIM', 'SOCINPRO', 'SBACEM', 'UMB', 'Outra']
const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const BANCOS = ['Banco do Brasil', 'Bradesco', 'Caixa Economica', 'Itau', 'Nubank', 'Santander', 'Sicoob', 'Sicredi', 'Inter', 'C6 Bank', 'Outro']

interface FormData { tipo: TipoTitular; pessoa: PessoaTipo; nome_completo: string; cpf_cnpj: string; rg: string; data_nascimento: string; endereco: string; bairro: string; cep: string; cidade: string; estado: string; telefone: string; email: string; sociedade_autoral: string; codigo_cae: string; ipi: string; banco: string; agencia: string; conta: string; tipo_conta: TipoContaBancaria | ''; pix: string; observacoes: string }
const EMPTY: FormData = { tipo: 'compositor', pessoa: 'PF', nome_completo: '', cpf_cnpj: '', rg: '', data_nascimento: '', endereco: '', bairro: '', cep: '', cidade: '', estado: '', telefone: '', email: '', sociedade_autoral: '', codigo_cae: '', ipi: '', banco: '', agencia: '', conta: '', tipo_conta: '', pix: '', observacoes: '' }

type Section = 'identificacao' | 'endereco' | 'contato' | 'arrecadacao' | 'bancario' | 'observacoes'
const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'identificacao', label: 'Identificacao', icon: <User className="w-4 h-4" /> },
  { id: 'endereco', label: 'Endereco', icon: <MapPin className="w-4 h-4" /> },
  { id: 'contato', label: 'Contato', icon: <Phone className="w-4 h-4" /> },
  { id: 'arrecadacao', label: 'Arrecadacao', icon: <Music2 className="w-4 h-4" /> },
  { id: 'bancario', label: 'Dados Bancarios', icon: <Landmark className="w-4 h-4" /> },
  { id: 'observacoes', label: 'Observacoes', icon: <FileText className="w-4 h-4" /> },
]

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/50">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

const inputCls = "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors"
const inputErr = "w-full bg-white/[0.03] border border-rose-500/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors"

export default function NovoTitularPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(EMPTY)
  const [activeSection, setActiveSection] = useState<Section>('identificacao')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.nome_completo.trim()) errs.nome_completo = 'Obrigatorio'
    if (!form.cpf_cnpj.trim()) errs.cpf_cnpj = 'Obrigatorio'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) { setActiveSection('identificacao'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    router.push('/master/titulares')
  }

  const sectionContent: Record<Section, React.ReactNode> = {
    identificacao: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tipo de Titular" required>
          <select className={inputCls} value={form.tipo} onChange={set('tipo')}>
            {TIPOS_TITULAR.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Tipo de Pessoa" required>
          <select className={inputCls} value={form.pessoa} onChange={set('pessoa')}>
            <option value="PF">Pessoa Fisica (PF)</option>
            <option value="PJ">Pessoa Juridica (PJ)</option>
          </select>
        </Field>
        <Field label="Nome Completo / Razao Social" required error={errors.nome_completo}>
          <input className={errors.nome_completo ? inputErr : inputCls} placeholder="Nome completo ou razao social" value={form.nome_completo} onChange={set('nome_completo')} />
        </Field>
        <Field label={form.pessoa === 'PF' ? 'CPF' : 'CNPJ'} required error={errors.cpf_cnpj}>
          <input className={errors.cpf_cnpj ? inputErr : inputCls} placeholder={form.pessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'} value={form.cpf_cnpj} onChange={set('cpf_cnpj')} />
        </Field>
        {form.pessoa === 'PF' && (<>
          <Field label="RG"><input className={inputCls} placeholder="Numero do RG" value={form.rg} onChange={set('rg')} /></Field>
          <Field label="Data de Nascimento"><input type="date" className={inputCls} value={form.data_nascimento} onChange={set('data_nascimento')} /></Field>
        </>)}
      </div>
    ),
    endereco: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><Field label="Endereco"><input className={inputCls} placeholder="Rua, avenida, numero..." value={form.endereco} onChange={set('endereco')} /></Field></div>
        <Field label="Bairro"><input className={inputCls} placeholder="Bairro" value={form.bairro} onChange={set('bairro')} /></Field>
        <Field label="CEP"><input className={inputCls} placeholder="00000-000" value={form.cep} onChange={set('cep')} /></Field>
        <Field label="Cidade"><input className={inputCls} placeholder="Cidade" value={form.cidade} onChange={set('cidade')} /></Field>
        <Field label="Estado (UF)">
          <select className={inputCls} value={form.estado} onChange={set('estado')}>
            <option value="">Selecione...</option>
            {ESTADOS_BR.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
    ),
    contato: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Telefone / WhatsApp"><input className={inputCls} placeholder="(00) 00000-0000" value={form.telefone} onChange={set('telefone')} /></Field>
        <Field label="E-mail"><input type="email" className={inputCls} placeholder="email@dominio.com" value={form.email} onChange={set('email')} /></Field>
      </div>
    ),
    arrecadacao: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Sociedade Autoral">
          <select className={inputCls} value={form.sociedade_autoral} onChange={set('sociedade_autoral')}>
            <option value="">Nao vinculado</option>
            {SOCIEDADES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Codigo CAE"><input className={inputCls} placeholder="Codigo CAE da sociedade" value={form.codigo_cae} onChange={set('codigo_cae')} /></Field>
        <Field label="IPI (SOCINPRO)"><input className={inputCls} placeholder="Numero IPI" value={form.ipi} onChange={set('ipi')} /></Field>
      </div>
    ),
    bancario: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Banco">
          <select className={inputCls} value={form.banco} onChange={set('banco')}>
            <option value="">Selecione o banco...</option>
            {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Tipo de Conta">
          <select className={inputCls} value={form.tipo_conta} onChange={set('tipo_conta')}>
            <option value="">Selecione...</option>
            <option value="corrente">Corrente</option>
            <option value="poupanca">Poupanca</option>
            <option value="pagamento">Pagamento</option>
          </select>
        </Field>
        <Field label="Agencia"><input className={inputCls} placeholder="0000" value={form.agencia} onChange={set('agencia')} /></Field>
        <Field label="Conta"><input className={inputCls} placeholder="00000-0" value={form.conta} onChange={set('conta')} /></Field>
        <div className="md:col-span-2"><Field label="Chave PIX"><input className={inputCls} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatoria" value={form.pix} onChange={set('pix')} /></Field></div>
      </div>
    ),
    observacoes: (
      <Field label="Observacoes internas">
        <textarea className={inputCls + ' h-32 resize-none'} placeholder="Notas internas sobre este titular..." value={form.observacoes} onChange={set('observacoes')} />
      </Field>
    ),
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <PageHeader title="Novo Titular" description="Preencha os dados do titular de direitos" />
      </div>

      <div className="flex gap-6">
        <div className="w-44 flex-shrink-0 space-y-1">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ' + (activeSection === s.id ? 'bg-violet-600/15 text-violet-300 border-r-2 border-violet-500' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]')}>
              {s.icon}{s.label}
            </button>
          ))}
        </div>
        <div className="flex-1 bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/80">{SECTIONS.find(s => s.id === activeSection)?.label}</h3>
          {sectionContent[activeSection]}
        </div>
      </div>

      <div className="flex items-center justify-between bg-[#0d1526] border border-white/[0.06] rounded-xl px-6 py-4">
        <button onClick={() => router.back()} className="text-sm text-white/40 hover:text-white/70 transition-colors">Cancelar</button>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={() => { const idx = SECTIONS.findIndex(s => s.id === activeSection); if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].id) }}>Proxima secao</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}><Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Titular'}</Button>
        </div>
      </div>
    </div>
  )
}