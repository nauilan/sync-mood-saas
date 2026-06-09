'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, Save, Loader2, AlertTriangle,
  User, Building2, Briefcase, MapPin, Phone, Landmark,
  Plus, Trash2, Mail, MessageSquare, FileText,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { authFetch } from '@/lib/supabase/client'
import { maskCpf, maskCnpj } from '@/lib/masks'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  FUNCAO_LABEL, FUNCOES_PF, FUNCOES_PJ,
  type FuncaoTitular,
} from '@/lib/types-cadastros'

const inputCls = 'w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors'

const BANCOS_BR = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '041', nome: 'Banrisul' },
  { codigo: '077', nome: 'Inter' },
  { codigo: '104', nome: 'Caixa Economica Federal' },
  { codigo: '197', nome: 'Stone' },
  { codigo: '208', nome: 'BTG Pactual' },
  { codigo: '212', nome: 'Banco Original' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '290', nome: 'PagBank / PagSeguro' },
  { codigo: '323', nome: 'Mercado Pago' },
  { codigo: '336', nome: 'C6 Bank' },
  { codigo: '341', nome: 'Itau' },
  { codigo: '380', nome: 'PicPay' },
  { codigo: '422', nome: 'Banco Safra' },
  { codigo: '748', nome: 'Sicredi' },
  { codigo: '756', nome: 'Sicoob' },
  { codigo: '999', nome: 'Outro' },
]

const SOCIEDADES = ['ABRAMUS', 'AMAR', 'ASSIM', 'SBACEM', 'SICAM', 'SOCINPRO', 'UBC', 'Outras']
const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/50">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-violet-400">{icon}</span>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  )
}

export default function EditarTitularPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editoras, setEditoras] = useState<{ id: string; nome_fantasia: string }[]>([])

  // Form state
  const [f, setF] = useState({
    tipo_pessoa: 'PF' as 'PF' | 'PJ',
    tipo: '',
    editora_id: '',
    nome_completo: '',
    nome_artistico: '',
    cpf_cnpj: '',
    nacionalidade: 'Brasileira',
    estado_civil: '',
    sexo: '',
    sociedade_autoral: '',
    codigo_interno: '',
    codigo_cae: '',
    codigo_ipi: '',
    codigo_titular: '',
    funcoes: [] as FuncaoTitular[],
    status: 'ativo',
    observacoes: '',
    contatos: [
      { tipo: 'email' as 'email' | 'whatsapp' | 'telefone', valor: '', principal: true },
      { tipo: 'whatsapp' as 'email' | 'whatsapp' | 'telefone', valor: '', principal: false },
    ],
    // Endereço
    cep: '', endereco: '', numero: '', compl: '', bairro: '', cidade: '', estado: '', pais: 'Brasil',
    // Bancário
    banco: '', agencia: '', conta: '', conta_digito: '', tipo_conta: '', titular_conta: '', operacao: '', pix_chave: '', pix_tipo: '',
  })

  const setField = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [key]: e.target.value }))

  const setUpper = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [key]: e.target.value.toUpperCase() }))

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(`/api/titulares/${id}`)
      if (!res.ok) { setError('Titular não encontrado'); return }
      const json = await res.json()
      const t = json.data
      const db = t.dados_bancarios ?? {}
      // Separa conta e dígito
      const [contaNum = '', contaDig = ''] = (db.conta ?? '').split('-')

      // Contatos: usa os salvos ou cria estrutura padrão
      const contatosSalvos = Array.isArray(t.contatos) && t.contatos.length > 0
        ? t.contatos
        : [
            { tipo: 'email',    valor: '', principal: true  },
            { tipo: 'whatsapp', valor: '', principal: false },
          ]

      setF({
        tipo_pessoa:    t.pessoa === 'PJ' ? 'PJ' : 'PF',
        tipo:           t.tipo ?? '',
        editora_id:     t.editora_id ?? '',
        nome_completo:  t.nome_completo ?? '',
        nome_artistico: t.nome_artistico ?? '',
        cpf_cnpj:       t.cpf_cnpj ?? '',
        nacionalidade:  t.nacionalidade ?? 'Brasileira',
        estado_civil:   t.estado_civil ?? '',
        sexo:           t.sexo ?? '',
        sociedade_autoral: t.sociedade_autoral ?? '',
        codigo_interno: t.codigo_interno ?? '',
        codigo_cae:     t.codigo_cae ?? '',
        codigo_ipi:     t.codigo_ipi ?? t.ipi ?? '',
        codigo_titular: t.codigo_titular ?? '',
        funcoes:        t.funcoes ?? [],
        status:         t.status ?? 'ativo',
        observacoes:    t.observacoes ?? '',
        contatos:       contatosSalvos,
        cep:            t.endereco?.cep ?? '',
        endereco:       t.endereco?.logradouro ?? '',
        numero:         t.endereco?.numero ?? '',
        compl:          t.endereco?.complemento ?? '',
        bairro:         t.endereco?.bairro ?? '',
        cidade:         t.endereco?.cidade ?? '',
        estado:         t.endereco?.estado ?? '',
        pais:           t.endereco?.pais ?? 'Brasil',
        banco:          db.banco ?? '',
        agencia:        db.agencia ?? '',
        conta:          contaNum,
        conta_digito:   contaDig,
        tipo_conta:     db.tipo_conta ?? '',
        titular_conta:  db.titular_conta ?? '',
        operacao:       db.operacao ?? '',
        pix_chave:      db.pix_chave ?? '',
        pix_tipo:       db.pix_tipo ?? '',
      })
    } catch {
      setError('Erro ao carregar titular.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    authFetch('/api/editoras?status=todos')
      .then(r => r.json())
      .then(d => setEditoras((d.editoras ?? []).map((e: any) => ({ id: e.id, nome_fantasia: e.nome_fantasia }))))
      .catch(() => {})
  }, [])

  function toggleFuncao(fn: FuncaoTitular) {
    setF(prev => ({
      ...prev,
      funcoes: prev.funcoes.includes(fn)
        ? prev.funcoes.filter(x => x !== fn)
        : [...prev.funcoes, fn],
    }))
  }

  async function salvar() {
    setSaving(true)
    setSaveError(null)
    try {
      const payload: Record<string, unknown> = {
        nome_completo:  f.nome_completo.trim(),
        nome_artistico: f.nome_artistico.trim() || undefined,
        cpf_cnpj:       f.cpf_cnpj.trim() || undefined,
        tipo:           f.tipo || undefined,
        pessoa:         f.tipo_pessoa,
        codigo_interno: f.codigo_interno.trim() || undefined,
        codigo_cae:     f.codigo_cae.trim() || undefined,
        codigo_ipi:     f.codigo_ipi.trim() || undefined,
        ipi:            f.codigo_ipi.trim() || undefined,
        codigo_titular: f.codigo_titular.trim() || undefined,
        status:         f.status,
        observacoes:    f.observacoes.trim() || undefined,
        estado_civil:   f.estado_civil || undefined,
        nacionalidade:  f.nacionalidade.trim() || undefined,
        sociedade_autoral: f.sociedade_autoral || undefined,
        funcoes:        f.funcoes.length > 0 ? f.funcoes : undefined,
        sexo:           f.sexo || undefined,
      }

      // Contatos (email, whatsapp, telefone)
      const contatosFilled = f.contatos.filter(c => c.valor.trim() !== '')
      if (contatosFilled.length > 0) {
        payload.contatos = contatosFilled.map(c => ({
          tipo:      c.tipo,
          valor:     c.valor.trim(),
          principal: c.principal,
        }))
      }

      if (f.cep || f.endereco || f.cidade) {
        payload.endereco = {
          cep:         f.cep.trim() || undefined,
          logradouro:  f.endereco.trim() || undefined,
          numero:      f.numero.trim() || undefined,
          complemento: f.compl.trim() || undefined,
          bairro:      f.bairro.trim() || undefined,
          cidade:      f.cidade.trim() || undefined,
          estado:      f.estado || undefined,
          pais:        f.pais.trim() || 'Brasil',
        }
      }

      if (f.banco || f.agencia || f.conta) {
        payload.dados_bancarios = {
          banco:         f.banco || undefined,
          agencia:       f.agencia.trim() || undefined,
          conta:         f.conta.trim()
            ? (f.conta_digito.trim() ? `${f.conta}-${f.conta_digito}` : f.conta)
            : undefined,
          tipo_conta:    f.tipo_conta || undefined,
          titular_conta: f.titular_conta.trim() || undefined,
          operacao:      f.operacao.trim() || undefined,
          pix_chave:     f.pix_chave.trim() || undefined,
          pix_tipo:      f.pix_tipo || undefined,
        }
      }

      const res = await authFetch(`/api/titulares/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data?.error ?? 'Erro ao salvar.')
        return
      }
      router.push(`/master/titulares/${id}`)
    } catch {
      setSaveError('Falha de conexão.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-3 text-white/40">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-white/40">
        <AlertTriangle className="w-8 h-8 text-rose-400" />
        <p className="text-sm">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  const isPF = f.tipo_pessoa === 'PF'
  const funcoesDisponiveis = isPF ? FUNCOES_PF : FUNCOES_PJ

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/master/titulares/${id}`)} className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors text-xs">
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        <PageHeader
          title="Editar Titular"
          description={f.nome_completo || 'Titular'}
          actions={
            <Button onClick={salvar} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar</>}
            </Button>
          }
        />
      </div>

      {saveError && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {saveError}
        </div>
      )}

      {/* Identificação */}
      <Section icon={<User className="w-4 h-4" />} title="Identificação">
        <Field label="Tipo de Pessoa">
          <select className={inputCls} value={f.tipo_pessoa} onChange={setField('tipo_pessoa')}>
            <option value="PF">Pessoa Física</option>
            <option value="PJ">Pessoa Jurídica</option>
          </select>
        </Field>

        <Field label="Tipo de Titular">
          <select className={inputCls} value={f.tipo} onChange={setField('tipo')}>
            <option value="">— Selecione —</option>
            <option value="autor">Autor / Compositor</option>
            <option value="editora">Editora</option>
            <option value="editora_administrada">Editora Administrada</option>
            <option value="gravadora">Gravadora / Produtora Fonográfica</option>
            <option value="interprete">Intérprete</option>
            <option value="outro">Outro</option>
          </select>
        </Field>

        <Field label="Editora Responsável">
          <select className={inputCls} value={f.editora_id} onChange={setField('editora_id')}>
            <option value="">— Selecione —</option>
            {editoras.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia}</option>)}
          </select>
        </Field>

        <Field label="Código Titular">
          <input className={inputCls} value={f.codigo_titular} onChange={setUpper('codigo_titular')} placeholder="Ex: T0001" />
        </Field>

        {isPF ? (
          <>
            <Field label="Nome Completo" required>
              <input className={inputCls} value={f.nome_completo} onChange={setUpper('nome_completo')} placeholder="NOME COMPLETO" />
            </Field>
            <Field label="Nome Artístico">
              <input className={inputCls} value={f.nome_artistico} onChange={setUpper('nome_artistico')} placeholder="NOME ARTÍSTICO" />
            </Field>
            <Field label="CPF">
              <input className={inputCls} value={f.cpf_cnpj}
                onChange={e => setF(prev => ({ ...prev, cpf_cnpj: maskCpf(e.target.value) }))}
                placeholder="000.000.000-00" maxLength={14} />
            </Field>
            <Field label="Nacionalidade">
              <input className={inputCls} value={f.nacionalidade} onChange={setUpper('nacionalidade')} placeholder="BRASILEIRA" />
            </Field>
            <Field label="Estado Civil">
              <select className={inputCls} value={f.estado_civil} onChange={setField('estado_civil')}>
                <option value="">— Selecione —</option>
                {['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável', 'Separado(a)'].map(v =>
                  <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Sexo">
              <select className={inputCls} value={f.sexo} onChange={setField('sexo')}>
                <option value="">— Selecione —</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
                <option value="nao_informado">Prefiro não informar</option>
              </select>
            </Field>
          </>
        ) : (
          <>
            <Field label="Razão Social" required>
              <input className={inputCls} value={f.nome_completo} onChange={setUpper('nome_completo')} placeholder="RAZÃO SOCIAL" />
            </Field>
            <Field label="CNPJ">
              <input className={inputCls} value={f.cpf_cnpj}
                onChange={e => setF(prev => ({ ...prev, cpf_cnpj: maskCnpj(e.target.value) }))}
                placeholder="00.000.000/0001-00" maxLength={18} />
            </Field>
          </>
        )}

        <Field label="Status">
          <select className={inputCls} value={f.status} onChange={setField('status')}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </Field>
      </Section>

      {/* Arrecadação */}
      <Section icon={<Briefcase className="w-4 h-4" />} title="Arrecadação e Registro">
        <Field label="ID Interno">
          <input className={inputCls} value={f.codigo_interno} onChange={setUpper('codigo_interno')} placeholder="Ex: JD01, HR01, 2646326" />
        </Field>
        <Field label="Código CAE">
          <input className={inputCls} value={f.codigo_cae} onChange={setUpper('codigo_cae')} placeholder="000000000" />
        </Field>
        <Field label="Código IPI">
          <input className={inputCls} value={f.codigo_ipi} onChange={setUpper('codigo_ipi')} placeholder="00000000" />
        </Field>
        {isPF && (
          <Field label="Sociedade Autoral">
            <select className={inputCls} value={f.sociedade_autoral} onChange={setField('sociedade_autoral')}>
              <option value="">— Selecione —</option>
              {SOCIEDADES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        )}
        <div className="md:col-span-2">
          <Field label="Funções">
            <div className="flex flex-wrap gap-2 mt-1">
              {funcoesDisponiveis.map(fn => (
                <button
                  key={fn}
                  type="button"
                  onClick={() => toggleFuncao(fn)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    f.funcoes.includes(fn)
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-violet-500/40'
                  }`}
                >
                  {FUNCAO_LABEL[fn] ?? fn}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* Endereço */}
      <Section icon={<MapPin className="w-4 h-4" />} title="Endereço">
        <Field label="CEP">
          <input className={inputCls} value={f.cep} onChange={setField('cep')} placeholder="00000-000" maxLength={9}
            onBlur={async e => {
              const cep = e.target.value.replace(/\D/g, '')
              if (cep.length !== 8) return
              try {
                const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                const d = await r.json()
                if (!d.erro) setF(prev => ({ ...prev, endereco: d.logradouro?.toUpperCase() ?? prev.endereco, bairro: d.bairro?.toUpperCase() ?? prev.bairro, cidade: d.localidade?.toUpperCase() ?? prev.cidade, estado: d.uf ?? prev.estado }))
              } catch { /* silencioso */ }
            }}
          />
        </Field>
        <Field label="Logradouro">
          <input className={inputCls} value={f.endereco} onChange={setUpper('endereco')} placeholder="RUA / AV." />
        </Field>
        <Field label="Número">
          <input className={inputCls} value={f.numero} onChange={setField('numero')} placeholder="123" />
        </Field>
        <Field label="Complemento">
          <input className={inputCls} value={f.compl} onChange={setUpper('compl')} placeholder="APTO, SALA..." />
        </Field>
        <Field label="Bairro">
          <input className={inputCls} value={f.bairro} onChange={setUpper('bairro')} placeholder="BAIRRO" />
        </Field>
        <Field label="Cidade">
          <input className={inputCls} value={f.cidade} onChange={setUpper('cidade')} placeholder="CIDADE" />
        </Field>
        <Field label="Estado">
          <select className={inputCls} value={f.estado} onChange={setField('estado')}>
            <option value="">— UF —</option>
            {ESTADOS_BR.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="País">
          <input className={inputCls} value={f.pais} onChange={setUpper('pais')} placeholder="BRASIL" />
        </Field>
      </Section>

      {/* Dados Bancários */}
      <Section icon={<Landmark className="w-4 h-4" />} title="Dados Bancários">
        <Field label="Banco">
          <select className={inputCls} value={f.banco} onChange={setField('banco')}>
            <option value="">— Selecione —</option>
            {BANCOS_BR.map(b => <option key={b.codigo} value={b.codigo}>{b.codigo} — {b.nome}</option>)}
          </select>
        </Field>
        <Field label="Titular da Conta">
          <input className={inputCls} value={f.titular_conta}
            onChange={setUpper('titular_conta')}
            placeholder={f.nome_completo || 'NOME DO TITULAR'}
          />
        </Field>
        <Field label="Agência">
          <input className={inputCls} value={f.agencia} onChange={setField('agencia')} placeholder="0000" />
        </Field>
        <Field label="Tipo de Conta">
          <select className={inputCls} value={f.tipo_conta} onChange={setField('tipo_conta')}>
            <option value="">— Selecione —</option>
            <option value="corrente">Corrente</option>
            <option value="poupanca">Poupança</option>
            <option value="pagamento">Pagamento</option>
          </select>
        </Field>
        <div className="flex gap-2">
          <div className="flex-1">
            <Field label="Conta">
              <input className={inputCls} value={f.conta} onChange={setField('conta')} placeholder="00000" />
            </Field>
          </div>
          <div className="w-20">
            <Field label="Dígito">
              <input className={inputCls} value={f.conta_digito} onChange={setField('conta_digito')} placeholder="0" maxLength={2} />
            </Field>
          </div>
        </div>
        <Field label="Operação (Caixa)">
          <input className={inputCls} value={f.operacao} onChange={setField('operacao')} placeholder="Ex: 013" />
        </Field>
        <Field label="Tipo de Chave PIX">
          <select className={inputCls} value={f.pix_tipo} onChange={e => {
            const tipo = e.target.value as typeof f.pix_tipo
            let chave = f.pix_chave
            if (tipo === 'cpf') chave = f.tipo_pessoa === 'PF' ? f.cpf_cnpj : ''
            else if (tipo === 'cnpj') chave = f.tipo_pessoa === 'PJ' ? f.cpf_cnpj : ''
            setF(prev => ({ ...prev, pix_tipo: tipo, pix_chave: chave }))
          }}>
            <option value="">— Selecione —</option>
            <option value="cpf">CPF</option>
            <option value="cnpj">CNPJ</option>
            <option value="email">E-mail</option>
            <option value="telefone">Telefone</option>
            <option value="aleatoria">Chave Aleatória</option>
          </select>
        </Field>
        <Field label="Chave PIX">
          <input className={inputCls} value={f.pix_chave} onChange={setField('pix_chave')} placeholder="Chave PIX" />
        </Field>
      </Section>

      {/* Contatos */}
      <Section icon={<Phone className="w-4 h-4" />} title="Contatos">
        <div className="md:col-span-2 space-y-3">
          {f.contatos.map((c, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select
                className={inputCls + ' w-36 shrink-0'}
                value={c.tipo}
                onChange={e => setF(prev => {
                  const next = [...prev.contatos]
                  next[idx] = { ...next[idx], tipo: e.target.value as 'email' | 'whatsapp' | 'telefone' }
                  return { ...prev, contatos: next }
                })}
              >
                <option value="email">E-mail</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telefone">Telefone</option>
              </select>
              <input
                className={inputCls + ' flex-1'}
                value={c.valor}
                onChange={e => setF(prev => {
                  const next = [...prev.contatos]
                  next[idx] = { ...next[idx], valor: e.target.value }
                  return { ...prev, contatos: next }
                })}
                placeholder={c.tipo === 'email' ? 'EMAIL@DOMINIO.COM' : c.tipo === 'whatsapp' ? '(XX) XXXXX-XXXX' : '(XX) XXXX-XXXX'}
              />
              <button
                type="button"
                className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                onClick={() => setF(prev => ({ ...prev, contatos: prev.contatos.filter((_, i) => i !== idx) }))}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            onClick={() => setF(prev => ({ ...prev, contatos: [...prev.contatos, { tipo: 'email', valor: '', principal: false }] }))}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar contato
          </button>
        </div>
      </Section>

      {/* Observações */}
      <Section icon={<FileText className="w-4 h-4" />} title="Observações">
        <div className="md:col-span-2">
          <textarea
            className={inputCls + ' h-28 resize-none'}
            value={f.observacoes}
            onChange={setUpper('observacoes')}
            placeholder="NOTAS INTERNAS..."
          />
        </div>
      </Section>

      {/* Botão inferior */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => router.push(`/master/titulares/${id}`)}>Cancelar</Button>
        <Button onClick={salvar} disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar alterações</>}
        </Button>
      </div>
    </div>
  )
}
