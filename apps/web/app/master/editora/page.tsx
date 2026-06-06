'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2, Save, Plus, Trash2, Users, Settings,
  CreditCard, Check, X,
  Mail, Globe,
  Shield,
  ToggleLeft, ToggleRight,
  FileText, ExternalLink, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { maskCnpj, maskCpf } from '@/lib/masks'
import { PhoneInput } from '@/components/ui/phone-input'
import { getAccessToken } from '@/lib/supabase/client'

// ── helpers de estilo ─────────────────────────────────────────
const card = 'bg-white/[0.03] border border-white/[0.07] rounded-2xl'
const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all'
const labelCls = 'text-xs font-medium text-white/40 mb-1 block'

const BANCOS_BR = [
  { codigo: '001', nome: 'Banco do Brasil' }, { codigo: '033', nome: 'Santander' },
  { codigo: '041', nome: 'Banrisul' }, { codigo: '070', nome: 'BRB' },
  { codigo: '077', nome: 'Inter' }, { codigo: '104', nome: 'Caixa Economica Federal' },
  { codigo: '197', nome: 'Stone' }, { codigo: '208', nome: 'BTG Pactual' },
  { codigo: '212', nome: 'Banco Original' }, { codigo: '237', nome: 'Bradesco' },
  { codigo: '260', nome: 'Nubank' }, { codigo: '290', nome: 'PagBank' },
  { codigo: '336', nome: 'C6 Bank' }, { codigo: '341', nome: 'Itau' },
  { codigo: '422', nome: 'Banco Safra' }, { codigo: '748', nome: 'Sicredi' },
  { codigo: '756', nome: 'Sicoob' }, { codigo: '999', nome: 'Outro' },
]
const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

// ── tipos ─────────────────────────────────────────────────────
interface TenantForm {
  razao_social: string; nome_fantasia: string; cnpj: string
  ie: string; im: string; data_fundacao: string
  registro_ecad: string; codigo_iswc: string
  cep: string; endereco: string; numero: string; compl: string
  bairro: string; cidade: string; estado: string; pais: string
  telefone: string; email: string; site: string
  banco: string; agencia: string; conta: string; conta_digito: string
  tipo_conta: string; titular_conta: string; operacao: string
  pix_chave: string; pix_tipo: string
  codigo_interno: string
  // Identificadores CWR
  codigo_interno_cwr: string
  codigo_publisher_cwr: string
  codigo_cae: string
  codigo_ipi: string
}
// Editora simples para seletor de acesso de usuários
interface EditoraOpcao { id: string; nome_fantasia: string; razao_social: string; cnpj?: string | null }
// Negócio editorial para a aba Administradas (view derivada de negocios_editoriais)
interface NegocioAdm {
  id: string
  nome: string
  status: string
  editora_administrada_id: string
  editora_administrada?: { nome_fantasia: string } | null
  editora_administradora?: { nome_fantasia: string } | null
  percentual_administrada: number
  percentual_administradora: number
  territorios: string[]
  data_inicio: string
  data_fim?: string | null
}
interface Usuario {
  id: string
  nome: string
  cpf: string
  email: string
  perfil: string
  ativo: boolean
  editoras_acesso: string[]
}
interface Config { notif_email: boolean; notif_vencimento: boolean; notif_royalties: boolean; modo_escuro: boolean; idioma: string; moeda: string; timezone: string }

const EMPTY_TENANT: TenantForm = {
  razao_social: '', nome_fantasia: '', cnpj: '', ie: '', im: '',
  data_fundacao: '', registro_ecad: '', codigo_iswc: '',
  cep: '', endereco: '', numero: '', compl: '', bairro: '',
  cidade: '', estado: '', pais: 'BRASIL',
  telefone: '', email: '', site: '',
  banco: '', agencia: '', conta: '', conta_digito: '', tipo_conta: '', titular_conta: '', operacao: '', pix_chave: '', pix_tipo: '',
  codigo_interno: '',
  codigo_interno_cwr: '', codigo_publisher_cwr: '', codigo_cae: '', codigo_ipi: '',
}
const EMPTY_USR: Usuario = { id: '', nome: '', cpf: '', email: '', perfil: 'operador', ativo: true, editoras_acesso: [] }
const EMPTY_CFG: Config = {
  notif_email: true, notif_vencimento: true, notif_royalties: true,
  modo_escuro: true, idioma: 'pt-BR', moeda: 'BRL', timezone: 'America/Sao_Paulo',
}
const PERFIS = ['administrador', 'operador', 'financeiro', 'readonly']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  )
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 shadow-xl">
      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <span className="text-sm text-emerald-300">{msg}</span>
      <button onClick={onClose} className="text-white/30 hover:text-white ml-2"><X className="w-3.5 h-3.5" /></button>
    </div>
  )
}

// ── ABAS ──────────────────────────────────────────────────────
const ABAS = [
  { id: 'empresa',       label: 'Dados da Empresa',      icon: Building2 },
  { id: 'codigos',       label: 'Codigos e IDs',         icon: Shield },
  { id: 'banco',         label: 'Dados Bancarios',       icon: CreditCard },
  { id: 'administradas', label: 'Editoras Administradas',icon: Building2 },
  { id: 'usuarios',      label: 'Usuarios',              icon: Users },
  { id: 'regras',        label: 'Regras / Arquitetura',  icon: Shield },
  { id: 'config',        label: 'Configuracoes',         icon: Settings },
] as const
type AbaId = typeof ABAS[number]['id']

// ──────────────────────────────────────────────────────────────
export default function EditoraPage() {
  const [aba, setAba] = useState<AbaId>('empresa')
  const [form, setForm] = useState<TenantForm>(EMPTY_TENANT)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [masterEditoraId, setMasterEditoraId] = useState<string | null>(null)

  // Editoras para seletor de acesso de usuários
  const [editoras, setEditoras] = useState<EditoraOpcao[]>([])

  // Negócios editoriais para aba Administradas (view derivada)
  const [negocios, setNegocios] = useState<NegocioAdm[]>([])
  const [loadingNegocios, setLoadingNegocios] = useState(false)

  // Usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [novoUsuario, setNovoUsuario] = useState<Usuario>(EMPTY_USR)
  const [adicionandoUsuario, setAdicionandoUsuario] = useState(false)

  // Config
  const [config, setConfig] = useState<Config>(EMPTY_CFG)

  // Carregar dados reais na inicialização
  useEffect(() => {
    // Restaurar usuarios e config do localStorage
    try {
      const u = localStorage.getItem('sync_usuarios'); if (u) setUsuarios(JSON.parse(u))
      const c = localStorage.getItem('sync_config'); if (c) setConfig(JSON.parse(c))
    } catch { /* silencioso */ }

    // Carregar editoras do banco
    async function loadEditoras() {
      try {
        const tok = getAccessToken()
        const res = await fetch('/api/editoras?status=todos', {
          headers: tok ? { Authorization: `Bearer ${tok}` } : {},
        })
        const data = await res.json()
        const all: any[] = data.editoras ?? []
        setEditoras(all.map(e => ({ id: e.id, nome_fantasia: e.nome_fantasia, razao_social: e.razao_social, cnpj: e.cnpj })))

        const master = all.find(e => e.tipo_editora === 'master')
        if (master) {
          setMasterEditoraId(master.id)
          // Carregar dados completos da editora master
          const res2 = await fetch(`/api/editoras/${master.id}`)
          const data2 = await res2.json()
          const e = data2.editora
          if (e) {
            const extra = (e.dados_bancarios as any)?._extra ?? {}
            const banco = (e.dados_bancarios as any) ?? {}
            setForm({
              razao_social: e.razao_social ?? '',
              nome_fantasia: e.nome_fantasia ?? '',
              cnpj: e.cnpj ?? '',
              ie: extra.ie ?? '',
              im: extra.im ?? '',
              data_fundacao: extra.data_fundacao ?? '',
              registro_ecad: e.codigo_ecad ?? '',
              codigo_iswc: extra.codigo_iswc ?? '',
              cep: e.cep ?? '',
              endereco: e.endereco ?? '',
              numero: extra.numero ?? '',
              compl: extra.compl ?? '',
              bairro: e.bairro ?? '',
              cidade: e.cidade ?? '',
              estado: e.estado ?? '',
              pais: e.pais ?? 'BRASIL',
              telefone: e.telefone ?? '',
              email: e.email ?? '',
              site: e.site ?? '',
              banco: banco.banco ?? '',
              agencia: banco.agencia ?? '',
              conta: (() => { const c = banco.conta ?? ''; const i = c.lastIndexOf('-'); return i > 0 ? c.substring(0, i) : c })(),
              conta_digito: (() => { const c = banco.conta ?? ''; const i = c.lastIndexOf('-'); return i > 0 ? c.substring(i + 1) : '' })(),
              tipo_conta: banco.tipo_conta ?? '',
              titular_conta: banco.titular_conta ?? '',
              operacao: banco.operacao ?? '',
              pix_chave: banco.pix_chave ?? '',
              pix_tipo: banco.pix_tipo ?? '',
              codigo_interno: e.codigo_interno ?? '',
              codigo_interno_cwr: e.codigo_interno_cwr ?? '',
              codigo_publisher_cwr: e.codigo_publisher_cwr ?? '',
              codigo_cae: e.codigo_cae ?? '',
              codigo_ipi: e.codigo_ipi ?? '',
            })
          }
        }
      } catch { /* silencioso */ }
    }

    // Carregar negócios editoriais para aba Administradas
    async function loadNegocios() {
      setLoadingNegocios(true)
      try {
        const res = await fetch('/api/negocios-editoriais')
        const data = await res.json()
        setNegocios(data.negocios ?? [])
      } catch { /* silencioso */ } finally {
        setLoadingNegocios(false)
      }
    }

    loadEditoras()
    loadNegocios()
  }, [])

  const set = useCallback((k: keyof TenantForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value })), [])

  const setUpper = useCallback((k: keyof TenantForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: (e.target.value as string).toUpperCase() })), [])

  async function fetchCep(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) setForm(prev => ({
        ...prev,
        endereco: (data.logradouro ?? prev.endereco).toUpperCase(),
        bairro: (data.bairro ?? prev.bairro).toUpperCase(),
        cidade: (data.localidade ?? prev.cidade).toUpperCase(),
        estado: data.uf ?? prev.estado,
      }))
    } catch { /* silencioso */ } finally { setBuscandoCep(false) }
  }

  // Salvar dados da Organização Gestora via API PUT
  async function salvarEmpresa() {
    if (!masterEditoraId) {
      setToast('Organização Gestora não identificada. Verifique o cadastro.')
      return
    }
    setSalvando(true)
    try {
      const payload = {
        razao_social: form.razao_social,
        nome_fantasia: form.nome_fantasia,
        cnpj: form.cnpj,
        cep: form.cep,
        endereco: form.endereco,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        pais: form.pais,
        telefone: form.telefone,
        email: form.email,
        site: form.site,
        codigo_ecad: form.registro_ecad,
        codigo_interno: form.codigo_interno || undefined,
        codigo_interno_cwr: form.codigo_interno_cwr || undefined,
        codigo_publisher_cwr: form.codigo_publisher_cwr || undefined,
        codigo_cae: form.codigo_cae || undefined,
        codigo_ipi: form.codigo_ipi || undefined,
        dados_bancarios: {
          banco: form.banco,
          agencia: form.agencia,
          conta: form.conta ? (form.conta_digito ? `${form.conta}-${form.conta_digito}` : form.conta) : '',
          tipo_conta: form.tipo_conta,
          titular_conta: form.titular_conta,
          operacao: form.operacao,
          pix_chave: form.pix_chave,
          pix_tipo: form.pix_tipo,
          _extra: {
            ie: form.ie,
            im: form.im,
            data_fundacao: form.data_fundacao,
            numero: form.numero,
            compl: form.compl,
            codigo_iswc: form.codigo_iswc,
          },
        },
      }
      const res = await fetch(`/api/editoras/${masterEditoraId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setToast('Dados da Organização Gestora salvos com sucesso.')
    } catch (e: any) {
      setToast('Erro: ' + (e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  function salvarConfig() {
    localStorage.setItem('sync_config', JSON.stringify(config))
    setToast('Configuracoes salvas.')
  }

  // Usuarios CRUD (localStorage)
  function salvarUsuario() {
    if (!novoUsuario.nome.trim() || !novoUsuario.email.trim()) return
    const updated = [...usuarios, { ...novoUsuario, id: 'U-' + Date.now() }]
    setUsuarios(updated)
    localStorage.setItem('sync_usuarios', JSON.stringify(updated))
    setNovoUsuario(EMPTY_USR); setAdicionandoUsuario(false)
    setToast('Usuario adicionado.')
  }
  function removerUsuario(id: string) {
    const updated = usuarios.filter(u => u.id !== id)
    setUsuarios(updated); localStorage.setItem('sync_usuarios', JSON.stringify(updated))
  }
  function toggleAtivoUsuario(id: string) {
    const updated = usuarios.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u)
    setUsuarios(updated); localStorage.setItem('sync_usuarios', JSON.stringify(updated))
  }

  const isCEF = form.banco.includes('104') || form.banco.toLowerCase().includes('caixa')

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      {/* Header com botao Salvar */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Organização Gestora</h1>
          <p className="text-sm text-white/40 mt-0.5">Empresa principal do sistema — pode atuar como administradora de editoras terceiras e como editora original de obras próprias</p>
        </div>
        <Button size="sm" onClick={salvarEmpresa} disabled={salvando} className="flex-shrink-0">
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {ABAS.map(a => {
          const Icon = a.icon
          const active = aba === a.id
          return (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                active ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}>
              <Icon className="w-3.5 h-3.5" />{a.label}
            </button>
          )
        })}
      </div>

      {/* ─── ABA EMPRESA ─────────────────────────────── */}
      {aba === 'empresa' && (
        <div className={`${card} p-6 space-y-6`}>
          {/* Papéis da Organização Gestora */}
          <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl px-4 py-3 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-[11px] text-violet-300 font-medium">Atua como Administradora</span>
              <span className="text-[11px] text-white/30">— gerencia catálogos de editoras terceiras via Negócios Editoriais</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-emerald-300 font-medium">Atua como Editora Original</span>
              <span className="text-[11px] text-white/30">— pode ser titular direta de obras e contratos com autores</span>
            </div>
          </div>
          <Divider label="Identificacao" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="Razao Social *">
                <input className={inputCls} value={form.razao_social} onChange={setUpper('razao_social')} />
              </Field>
            </div>
            <Field label="Nome Fantasia">
              <input className={inputCls} value={form.nome_fantasia} onChange={setUpper('nome_fantasia')} />
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
            <Field label="Data de Fundacao">
              <input type="date" className={inputCls} value={form.data_fundacao} onChange={set('data_fundacao')} />
            </Field>
            <Field label="Codigo ECAD">
              <input className={inputCls} placeholder="CODIGO ECAD" value={form.registro_ecad} onChange={setUpper('registro_ecad')} />
            </Field>
          </div>

          <Divider label="Endereco" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={buscandoCep ? 'CEP (buscando...)' : 'CEP'}>
              <input className={inputCls} placeholder="00000-000" value={form.cep} maxLength={9}
                onChange={e => { setForm(prev => ({ ...prev, cep: e.target.value })); fetchCep(e.target.value) }} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Endereco">
                <input className={inputCls} placeholder="RUA, AVENIDA..." value={form.endereco} onChange={setUpper('endereco')} />
              </Field>
            </div>
            <Field label="Numero">
              <input className={inputCls} placeholder="NUMERO" value={form.numero} onChange={setUpper('numero')} />
            </Field>
            <Field label="Complemento">
              <input className={inputCls} placeholder="APTO, SALA..." value={form.compl} onChange={setUpper('compl')} />
            </Field>
            <Field label="Bairro">
              <input className={inputCls} placeholder="BAIRRO" value={form.bairro} onChange={setUpper('bairro')} />
            </Field>
            <Field label="Cidade">
              <input className={inputCls} placeholder="CIDADE" value={form.cidade} onChange={setUpper('cidade')} />
            </Field>
            <Field label="Estado">
              <select className={inputCls} value={form.estado} onChange={set('estado')}>
                <option value="">Selecione...</option>
                {ESTADOS_BR.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Pais">
              <input className={inputCls} placeholder="BRASIL" value={form.pais} onChange={setUpper('pais')} />
            </Field>
          </div>

          <Divider label="Contatos" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Telefone / WhatsApp">
              <PhoneInput
                value={form.telefone}
                onChange={v => setForm(prev => ({ ...prev, telefone: v }))}
              />
            </Field>
            <Field label="E-mail">
              <div className="relative"><Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/20" />
                <input className={inputCls + ' pl-9'} placeholder="contato@editora.com.br" value={form.email} onChange={set('email')} />
              </div>
            </Field>
            <Field label="Site">
              <div className="relative"><Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/20" />
                <input className={inputCls + ' pl-9'} placeholder="www.editora.com.br" value={form.site} onChange={set('site')} />
              </div>
            </Field>
          </div>
        </div>
      )}

      {/* ─── ABA CODIGOS ─────────────────────────────── */}
      {aba === 'codigos' && (
        <div className={`${card} p-6 space-y-6`}>
          <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl px-4 py-3 text-xs text-sky-300/70 space-y-1">
            <p className="font-semibold text-sky-300">Identificadores estratégicos</p>
            <p>Esses campos são utilizados para matching automático na importação CWR, vínculo com sociedades autorais e identificação internacional. Após a editora possuir obras ou contratos vinculados, alterações requerem perfil master e geram log de auditoria.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Codigo Interno (Sync Mood)">
              <input className={inputCls} placeholder="Ex: TOPSHOW" value={form.codigo_interno} onChange={setUpper('codigo_interno')} />
            </Field>
            <Field label="Codigo ECAD">
              <input className={inputCls} placeholder="CODIGO ECAD" value={form.registro_ecad} onChange={setUpper('registro_ecad')} />
            </Field>
          </div>

          <Divider label="Identificadores CWR" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Codigo Interno CWR">
              <input className={inputCls} placeholder="Ex: TS01 — identifica a editora dentro do arquivo CWR" value={form.codigo_interno_cwr} onChange={setUpper('codigo_interno_cwr')} />
            </Field>
            <Field label="Codigo Publisher CWR">
              <input className={inputCls} placeholder="Codigo de publisher registrado no CWR" value={form.codigo_publisher_cwr} onChange={setUpper('codigo_publisher_cwr')} />
            </Field>
          </div>

          <Divider label="Identificadores CISAC / Sociedades" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Codigo CAE">
              <input className={inputCls} placeholder="CAE-00000000" value={form.codigo_cae} onChange={setUpper('codigo_cae')} />
            </Field>
            <Field label="Codigo IPI">
              <input className={inputCls} placeholder="00000000000 (11 digitos)" value={form.codigo_ipi} onChange={setUpper('codigo_ipi')} />
            </Field>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 text-xs text-amber-300/70 space-y-1">
            <p className="font-semibold text-amber-300">Sender Code CISAC</p>
            <p>O Sender Code não fica nesta tela. Ele pertence exclusivamente às Configurações CWR da Organização Gestora — disponível futuramente na aba CWR.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={salvarEmpresa}
              disabled={salvando}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar Codigos</>}
            </button>
          </div>
        </div>
      )}

      {/* ─── ABA BANCO ───────────────────────────────── */}
      {aba === 'banco' && (
        <div className={`${card} p-6 space-y-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="Banco">
                <input className={inputCls} list="bancos-tenant" placeholder="Buscar por nome ou codigo..." value={form.banco} onChange={set('banco')} />
                <datalist id="bancos-tenant">
                  {BANCOS_BR.map(b => <option key={b.codigo} value={`${b.codigo} - ${b.nome}`} />)}
                </datalist>
              </Field>
            </div>
            <Field label="Tipo de Conta">
              <select className={inputCls} value={form.tipo_conta} onChange={set('tipo_conta')}>
                <option value="">Selecione...</option>
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupanca</option>
                <option value="pagamento">Pagamento</option>
              </select>
            </Field>
            <Field label="Agencia">
              <input className={inputCls} placeholder="0000" value={form.agencia} onChange={setUpper('agencia')} />
            </Field>
            <Field label="Conta">
              <div className="flex gap-2">
                <input className={inputCls + ' flex-1'} placeholder="00000" value={form.conta} onChange={setUpper('conta')} />
                <div className="w-24">
                  <input className={inputCls} placeholder="Digito" maxLength={2} value={form.conta_digito} onChange={setUpper('conta_digito')} />
                </div>
              </div>
            </Field>
            {isCEF && (
              <Field label="Operacao (Caixa Economica Federal)">
                <input className={inputCls} placeholder="001, 013, 023..." value={form.operacao} onChange={setUpper('operacao')} />
              </Field>
            )}
            <div className="md:col-span-2">
              <Field label="Titular da Conta">
                <input
                  className={inputCls}
                  placeholder="NOME COMPLETO / RAZAO SOCIAL"
                  value={form.titular_conta}
                  onFocus={() => {
                    if (!form.titular_conta) {
                      const nome = form.razao_social || form.nome_fantasia
                      if (nome) setForm(prev => ({ ...prev, titular_conta: nome.toUpperCase() }))
                    }
                  }}
                  onChange={setUpper('titular_conta')}
                />
              </Field>
            </div>
            <Field label="Tipo de Chave PIX">
              <select
                className={inputCls}
                value={form.pix_tipo}
                onChange={e => {
                  const tipo = e.target.value
                  let chave = ''
                  if (tipo === 'cnpj') chave = form.cnpj
                  else if (tipo === 'email') chave = form.email
                  else if (tipo === 'telefone') chave = form.telefone
                  setForm(prev => ({ ...prev, pix_tipo: tipo, pix_chave: chave }))
                }}
              >
                <option value="">Sem chave PIX</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave aleatoria</option>
              </select>
            </Field>
            {form.pix_tipo && (
              <Field label="Chave PIX">
                <input className={inputCls} placeholder="Informe a chave PIX" value={form.pix_chave}
                  onChange={e => setForm(prev => ({ ...prev, pix_chave: prev.pix_tipo === 'email' ? e.target.value : e.target.value.toUpperCase() }))}
                  />
              </Field>
            )}
          </div>
        </div>
      )}

      {/* ─── ABA ADMINISTRADAS — view derivada de negocios_editoriais ── */}
      {aba === 'administradas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">
              {negocios.length} negócio{negocios.length !== 1 ? 's' : ''} {negocios.length !== 1 ? 'editoriais' : 'editorial'} ativo{negocios.length !== 1 ? 's' : ''}
            </p>
            <Link href="/master/negocios-editoriais"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Gerenciar Negócios
            </Link>
          </div>

          <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl px-4 py-3">
            <p className="text-[11px] text-sky-300/70">
              As editoras administradas são derivadas automaticamente dos Negócios Editoriais ativos.
              Para cadastrar ou editar a relação entre editoras, acesse <Link href="/master/negocios-editoriais" className="underline hover:text-sky-200">Negócios entre Editoras</Link>.
            </p>
          </div>

          {loadingNegocios && (
            <div className="flex items-center justify-center py-8 text-white/25">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando negócios editoriais...
            </div>
          )}

          {!loadingNegocios && negocios.length === 0 && (
            <div className={`${card} p-8 flex flex-col items-center gap-3 text-center`}>
              <Building2 className="w-10 h-10 text-white/10" />
              <p className="text-sm text-white/30">Nenhum negócio editorial cadastrado.</p>
              <Link href="/master/negocios-editoriais"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Cadastrar negócio editorial
              </Link>
            </div>
          )}

          {negocios.map(n => (
            <div key={n.id} className={`${card} p-4 flex items-center gap-4`}>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {n.editora_administrada?.nome_fantasia ?? n.nome}
                </p>
                <p className="text-xs text-white/30 truncate">
                  {n.editora_administrada?.nome_fantasia ?? '—'} → {n.editora_administradora?.nome_fantasia ?? '—'}
                  &nbsp;·&nbsp;{n.percentual_administrada}% / {n.percentual_administradora}%
                </p>
                {(n.territorios ?? []).length > 0 && (
                  <p className="text-[10px] text-white/20 mt-0.5">{(n.territorios ?? []).join(', ')}</p>
                )}
              </div>
              <Badge variant={n.status === 'ativo' ? 'emerald' : 'slate'}>{n.status}</Badge>
              <Link href="/master/negocios-editoriais"
                className="p-1.5 rounded-lg hover:bg-violet-500/10 text-white/30 hover:text-violet-400 transition-colors"
                title="Ver negócios editoriais">
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ─── ABA USUARIOS ────────────────────────────── */}
      {aba === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}</p>
            <Button size="sm" onClick={() => { setNovoUsuario(EMPTY_USR); setAdicionandoUsuario(true) }}>
              <Plus className="w-3.5 h-3.5" /> Novo Usuario
            </Button>
          </div>

          {adicionandoUsuario && (
            <div className={`${card} p-5 space-y-4 border-violet-500/20`}>
              <h3 className="text-sm font-semibold text-violet-300">Novo Usuário</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome Completo *">
                  <input className={inputCls} placeholder="NOME DO USUÁRIO" value={novoUsuario.nome}
                    onChange={e => setNovoUsuario(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))} />
                </Field>
                <Field label="CPF * (login de acesso)">
                  <input className={inputCls} placeholder="000.000.000-00" value={novoUsuario.cpf}
                    onChange={e => setNovoUsuario(prev => ({ ...prev, cpf: maskCpf(e.target.value) }))}
                    maxLength={14} />
                </Field>
                <Field label="E-mail">
                  <input className={inputCls} placeholder="usuario@editora.com.br" value={novoUsuario.email}
                    onChange={e => setNovoUsuario(prev => ({ ...prev, email: e.target.value }))} />
                </Field>
                <Field label="Perfil de Acesso">
                  <select className={inputCls} value={novoUsuario.perfil}
                    onChange={e => setNovoUsuario(prev => ({ ...prev, perfil: e.target.value }))}>
                    {PERFIS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select className={inputCls} value={novoUsuario.ativo ? 'ativo' : 'inativo'}
                    onChange={e => setNovoUsuario(prev => ({ ...prev, ativo: e.target.value === 'ativo' }))}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </Field>
              </div>

              {/* Acesso a Editoras */}
              {editoras.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Acesso a Editoras Administradas
                    <span className="text-white/20 ml-1">— além da Organização Gestora (acesso automático pelo perfil)</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {editoras.filter(e => e.nome_fantasia).map(e => {
                      const selecionada = novoUsuario.editoras_acesso.includes(e.id)
                      return (
                        <div key={e.id}
                          onClick={() => setNovoUsuario(prev => ({
                            ...prev,
                            editoras_acesso: selecionada
                              ? prev.editoras_acesso.filter(id => id !== e.id)
                              : [...prev.editoras_acesso, e.id],
                          }))}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            selecionada
                              ? 'bg-emerald-500/8 border-emerald-500/25 hover:border-emerald-500/40'
                              : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                          }`}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                            selecionada ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                          }`}>
                            {selecionada && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${selecionada ? 'text-white' : 'text-white/40'}`}>
                              {e.nome_fantasia || e.razao_social}
                            </p>
                            {e.cnpj && <p className="text-[10px] text-white/20 font-mono">{e.cnpj}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAdicionandoUsuario(false)}>Cancelar</Button>
                <Button size="sm" onClick={salvarUsuario}><Save className="w-3.5 h-3.5" /> Adicionar</Button>
              </div>
            </div>
          )}

          {/* Usuario admin fixo (tenant) */}
          <div className={`${card} p-4`}>
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-violet-500/20 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Administrador do Sistema</p>
                <p className="text-[11px] text-white/30">admin@syncmood.com</p>
                <p className="text-[10px] text-white/20 font-mono mt-0.5">CPF: —&nbsp;&nbsp;·&nbsp;&nbsp;Acesso: Organização Gestora + todas as editoras administradas</p>
              </div>
              <Badge variant="violet">Administrador</Badge>
              <Badge variant="emerald">Ativo</Badge>
            </div>
          </div>

          {usuarios.length === 0 && !adicionandoUsuario && (
            <div className={`${card} p-6 text-center`}>
              <p className="text-sm text-white/30">Nenhum usuario adicional cadastrado.</p>
            </div>
          )}

          {usuarios.map(u => {
            const editorasDoUsuario = editoras.filter(e => (u.editoras_acesso ?? []).includes(e.id))
            return (
              <div key={u.id} className={`${card} p-4 space-y-3`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white/40">{u.nome.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.nome}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {u.cpf && (
                        <span className="text-[11px] text-white/30 font-mono flex items-center gap-1">
                          <Shield className="w-3 h-3 text-violet-400/50" />
                          CPF: {u.cpf}
                        </span>
                      )}
                      {u.email && <span className="text-[11px] text-white/25 truncate">{u.email}</span>}
                    </div>
                  </div>
                  <Badge variant={u.perfil === 'administrador' ? 'violet' : u.perfil === 'financeiro' ? 'emerald' : 'slate'}>
                    {u.perfil}
                  </Badge>
                  <Badge variant={u.ativo ? 'emerald' : 'slate'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => toggleAtivoUsuario(u.id)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-amber-400 transition-colors">
                      {u.ativo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => removerUsuario(u.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-12 flex-wrap">
                  <span className="text-[10px] text-white/20 uppercase tracking-wide">Acesso:</span>
                  <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-2 py-0.5">
                    Organização Gestora
                  </span>
                  {editorasDoUsuario.length === 0 && (
                    <span className="text-[10px] text-white/20 italic">somente Organização Gestora</span>
                  )}
                  {editorasDoUsuario.map(e => (
                    <span key={e.id} className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">
                      {e.nome_fantasia || e.razao_social}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── ABA REGRAS / ARQUITETURA ─────────────────── */}
      {aba === 'regras' && (
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              Arquitetura de Administração
            </h3>
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="bg-violet-600/20 border-2 border-violet-500/40 rounded-2xl px-6 py-3 text-center">
                <p className="text-[10px] text-violet-300/60 uppercase tracking-widest mb-0.5">Organização Gestora</p>
                <p className="text-sm font-bold text-violet-200">Top Show Music</p>
                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  {['Catálogo Unificado', 'Autorizações', 'Licenciamentos', 'Financeiro Global'].map(t => (
                    <span key={t} className="text-[10px] bg-violet-500/15 text-violet-300 border border-violet-500/20 rounded-full px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center text-white/20 text-xs gap-0.5">
                <span>contrato de administração</span>
                <span className="text-lg">↕</span>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                {['Editora A', 'Editora B', 'Editora N…'].map((e, i) => (
                  <div key={e} className={`rounded-xl border px-3 py-2 text-center ${i < 2 ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-white/[0.03] border-white/10 border-dashed'}`}>
                    <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Editora {i < 2 ? 'Administrada (E)' : 'futura'}</p>
                    <p className="text-xs font-semibold text-white/60">{e}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              {
                titulo: 'Catálogo Unificado',
                icon: Building2,
                cor: 'violet',
                descricao: 'Toda obra cadastrada por uma Editora Administrada (E) compõe automaticamente o catálogo da Organização Gestora por força do contrato de administração.',
                linkLogica: 'Link: Autor + Editora Original (E) + Organização Gestora',
              },
              {
                titulo: 'Autorização e Licenciamento Centralizado',
                icon: Shield,
                cor: 'amber',
                descricao: 'Toda e qualquer autorização ou licenciamento de obras do catálogo de uma Editora Administrada é emitido e autorizado exclusivamente pela Organização Gestora. A E não pode emitir autorizações.',
                linkLogica: 'REGRA INVIOLÁVEL — Organização Gestora autoriza e licencia',
              },
              {
                titulo: 'Negócios Editoriais por Tipo de Direito e Território',
                icon: CreditCard,
                cor: 'blue',
                descricao: 'Cada negócio editorial define percentuais por tipo de direito e território. O percentual da administradora incide apenas sobre a parcela editorial da editora administrada, nunca sobre a obra inteira.',
                linkLogica: 'Configure em: Negócios entre Editoras → cada negócio por tipo de direito e território',
              },
              {
                titulo: 'Financeiro Restrito',
                icon: CreditCard,
                cor: 'emerald',
                descricao: 'A Editora Administrada acessa apenas o financeiro relativo a autores e obras do seu próprio catálogo. Receitas de outras editoras são invisíveis para ela.',
                linkLogica: 'Filtro automático por editora_id no módulo Financeiro',
              },
              {
                titulo: 'Contratos Próprios',
                icon: FileText,
                cor: 'rose',
                descricao: 'Cada Editora Administrada pode gerar seus próprios contratos com titulares do seu catálogo (se o módulo estiver habilitado pela AM).',
                linkLogica: 'Contratos gerados pela E ficam visíveis também para a AM',
              },
            ].map(({ titulo, icon: Icon, cor, descricao, linkLogica }) => (
              <div key={titulo} className={`bg-${cor}-500/5 border border-${cor}-500/15 rounded-xl p-4 space-y-2`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${cor}-400`} />
                  <p className={`text-sm font-bold text-${cor}-300`}>{titulo}</p>
                </div>
                <p className="text-[12px] text-white/50 leading-relaxed">{descricao}</p>
                <p className={`text-[11px] font-mono text-${cor}-400/60 bg-${cor}-500/8 rounded-lg px-3 py-1.5 border border-${cor}-500/10`}>{linkLogica}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ABA CONFIGURACOES ───────────────────────── */}
      {aba === 'config' && (
        <div className={`${card} p-6 space-y-6`}>
          <Divider label="Notificacoes" />
          <div className="space-y-3">
            {([
              { k: 'notif_email', label: 'Receber notificacoes por e-mail' },
              { k: 'notif_vencimento', label: 'Alertas de vencimento de contratos' },
              { k: 'notif_royalties', label: 'Avisos de lancamento de royalties' },
            ] as { k: keyof Config; label: string }[]).map(({ k, label }) => (
              <div key={k} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-white/60">{label}</span>
                <button onClick={() => setConfig(prev => ({ ...prev, [k]: !prev[k] }))}
                  className={`w-10 h-6 rounded-full transition-all relative ${config[k] ? 'bg-violet-500' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${config[k] ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          <Divider label="Preferencias do Sistema" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Idioma">
              <select className={inputCls} value={config.idioma} onChange={e => setConfig(prev => ({ ...prev, idioma: e.target.value }))}>
                <option value="pt-BR">Portugues (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es">Espanol</option>
              </select>
            </Field>
            <Field label="Moeda">
              <select className={inputCls} value={config.moeda} onChange={e => setConfig(prev => ({ ...prev, moeda: e.target.value }))}>
                <option value="BRL">BRL — Real Brasileiro</option>
                <option value="USD">USD — Dolar Americano</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </Field>
            <Field label="Fuso Horario">
              <select className={inputCls} value={config.timezone} onChange={e => setConfig(prev => ({ ...prev, timezone: e.target.value }))}>
                <option value="America/Sao_Paulo">America/Sao Paulo (GMT-3)</option>
                <option value="America/Manaus">America/Manaus (GMT-4)</option>
                <option value="America/Belem">America/Belem (GMT-3)</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={salvarConfig}><Save className="w-3.5 h-3.5" /> Salvar Configuracoes</Button>
          </div>
        </div>
      )}
    </div>
  )
}
