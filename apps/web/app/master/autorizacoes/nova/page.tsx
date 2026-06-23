'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  ChevronRight, ChevronLeft, CheckCircle2, Shield, Music, Users,
  Calendar, DollarSign, FileText, Lock, RefreshCw, AlertCircle,
  Search, Building2, User, Phone, Mail, MapPin, CreditCard,
  Banknote, Smartphone, ArrowLeftRight, Layers, BookOpen, Shuffle,
  Tv2, Megaphone, Music2, Info
} from 'lucide-react'
import { useWizardSmartScroll } from '@/hooks/use-wizard-smart-scroll'
import { authFetch } from '@/lib/supabase/client'
import {
  TIPO_AUTORIZACAO_LABELS, TIPO_AUTORIZACAO_DESCRICAO, TIPO_AUTORIZACAO_COLORS,
  MODELO_NEGOCIO_LABELS, MODELO_NEGOCIO_DESCRICAO, MODELO_NEGOCIO_DOCUMENTO_NOME, MODELO_NEGOCIO_COLORS,
  TERRITORIOS, FORMA_PAGAMENTO_LABELS,
  obraBloqueadaPorExclusividade,
} from '@/lib/types-autorizacoes'
import type { TipoAutorizacao, ModeloNegocio, FormaPagamento } from '@/lib/types-autorizacoes'

// ── Icones por tipo ──────────────────────────────────────────────────────────
const TIPO_ICONS: Record<TipoAutorizacao, React.ElementType> = {
  fonograma:      Music2,
  sincronizacao:  Tv2,
  publicidade:    Megaphone,
  tv:             Tv2,
  edicao_grafica: BookOpen,
  incidental:     Layers,
  versao:         Shuffle,
}

const MODELOS_NEGOCIO: ModeloNegocio[] = ['pago_editora', 'pago_autor', 'sem_onus']
const FORMAS_PAG: FormaPagamento[] = ['dinheiro', 'pix', 'transferencia', 'cartao_credito', 'cartao_debito']
const TODOS_TIPOS: TipoAutorizacao[] = ['fonograma', 'sincronizacao', 'publicidade', 'tv', 'edicao_grafica', 'incidental', 'versao']

// ── Sequencial de numero ─────────────────────────────────────────────────────
const ANO_ATUAL = new Date().getFullYear()
const NUMERO_GERADO = `AUTH-${ANO_ATUAL}-00001`

// ── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  'Tipo',
  'Obra',
  'Dados Especificos',
  'Periodo & Exclusividade',
  'Modelo de Negocio',
  'Pagamento',
  'Revisao',
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const ic = 'w-full h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors'
const sel = ic + ' cursor-pointer'

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-white/50">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-white/25">{hint}</p>}
    </div>
  )
}

function BoolField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
      <span className="text-xs text-white/60">{label}</span>
      <div className="flex gap-1.5">
        {[true, false].map(v => (
          <button key={String(v)} onClick={() => onChange(v)}
            className={`h-6 px-3 rounded-md text-[10px] font-semibold transition-colors ${value === v ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/35 hover:bg-white/10'}`}>
            {v ? 'Sim' : 'Nao'}
          </button>
        ))}
      </div>
    </div>
  )
}

function CurrencyInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [display, setDisplay] = React.useState(() =>
    value > 0 ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
  )
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) { setDisplay(''); onChange(0); return }
    const numeric = parseFloat(raw) / 100
    setDisplay(numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    onChange(numeric)
  }
  return (
    <div className="flex items-center gap-2 h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 focus-within:border-violet-500/50 transition-colors">
      <span className="text-sm text-white/40 shrink-0">R$</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        disabled={disabled}
        placeholder="0,00"
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none tabular-nums"
      />
    </div>
  )
}

function MultiSelect({ options, value, onChange, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-medium text-white/50">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const sel2 = value.includes(opt)
          return (
            <button key={opt} onClick={() => onChange(sel2 ? value.filter(x => x !== opt) : [...value, opt])}
              className={`h-7 px-2.5 rounded-lg border text-xs font-medium transition-colors ${sel2 ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-white/[0.03] border-white/[0.06] text-white/45 hover:text-white/70'}`}>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Titular lookup ────────────────────────────────────────────────────────────
interface TitularSelecionado {
  nome: string
  cpf_cnpj: string
  endereco: string
  bairro: string
  cep: string
  cidade_uf: string
  contato: string
  email: string
}

function extrairTitular(t: any): TitularSelecionado {
  // Titulares usam campos flat: nome_completo, cpf/cpf_cnpj, endereco (JSONB), contatos (JSONB[])
  const nome     = t.nome_completo ?? t.nome ?? ''
  const cpf_cnpj = t.cpf ?? t.cpf_cnpj ?? t.cnpj ?? ''
  const end      = (typeof t.endereco === 'object' && t.endereco !== null) ? t.endereco : {}
  const contatos: any[] = Array.isArray(t.contatos) ? t.contatos : []
  const tel  = contatos.find((c: any) => c.tipo === 'whatsapp' || c.tipo === 'telefone')
            ?? contatos.find((c: any) => c.tipo !== 'email')
            ?? {}
  const mail = contatos.find((c: any) => c.tipo === 'email') ?? {}
  return {
    nome,
    cpf_cnpj,
    endereco:  end.logradouro
      ? `${end.logradouro}, ${end.numero ?? ''}${end.complemento ? ' ' + end.complemento : ''}`.trim()
      : (end.endereco ?? ''),
    bairro:    end.bairro ?? '',
    cep:       end.cep ?? '',
    cidade_uf: end.cidade ? `${end.cidade} / ${end.estado ?? ''}` : '',
    contato:   tel.valor ?? '',
    email:     mail.valor ?? t.email ?? '',
  }
}

function TitularLookup({
  label, value, onChange, onSelect, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSelect?: (t: TitularSelecionado) => void
  hint?: string
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const [apiResults, setApiResults] = React.useState<any[]>([])

  React.useEffect(() => {
    const q = value.trim()
    if (!q) { setApiResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`/api/titulares?search=${encodeURIComponent(q)}&limit=8`)
        const json = await res.json()
        setApiResults(json.titulares ?? json.data ?? [])
      } catch { setApiResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [value])

  const filtered = apiResults

  // fecha ao clicar fora
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(t: any) {
    const dados = extrairTitular(t)
    onChange(dados.nome)
    onSelect?.(dados)
    setOpen(false)
  }

  return (
    <Field label={label} hint={hint}>
      <div className="relative" ref={ref}>
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/25 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar no banco de dados..."
          autoComplete="off"
          className={ic + ' pl-8'}
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#0d1526] border border-violet-500/30 rounded-xl shadow-2xl overflow-hidden">
            {filtered.map((t: any) => {
              const nome = t.nome_completo ?? t.nome ?? '(sem nome)'
              const doc  = t.cpf ?? t.cpf_cnpj ?? t.cnpj ?? ''
              const pseudo = Array.isArray(t.pseudonimos)
                ? t.pseudonimos.find((p: any) => p.principal)?.pseudonimo
                : undefined
              const isPJ = t.pessoa === 'PJ' || t.tipo === 'editora'
              return (
                <button
                  key={t.id}
                  onMouseDown={() => handleSelect(t)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-violet-500/10 transition-colors text-left"
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 ${isPJ ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {isPJ ? 'PJ' : 'PF'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{nome || '(sem nome)'}</p>
                    <p className="text-[10px] text-white/35">{pseudo ? pseudo + ' · ' : ''}{doc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Field>
  )
}

// ── Formularios por tipo ──────────────────────────────────────────────────────

function FormFonograma({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  function handleSelectProdutor(t: TitularSelecionado) {
    set('produtor_nome',       t.nome)
    set('produtor_cpf_cnpj',   t.cpf_cnpj)
    set('produtor_endereco',   t.endereco)
    set('produtor_cep',        t.cep)
    set('produtor_cidade_uf',  t.cidade_uf)
    set('produtor_contato',    t.contato)
    set('produtor_email',      t.email)
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
        <Music2 className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Dados do Produtor Fonografico</h3>
      </div>
      <p className="text-xs text-white/40 bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
        Autorizacao para inclusao de obra musical em fonograma / videofonograma — gravacao, distribuicao digital, clipes e plataformas de streaming.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TitularLookup
          label="Produtor Fonografico / Razao Social"
          value={data.produtor_nome || ''}
          onChange={v => set('produtor_nome', v)}
          onSelect={handleSelectProdutor}
          hint="Selecione para preencher automaticamente"
        />
        <Field label="CPF / CNPJ"><input type="text" value={data.produtor_cpf_cnpj || ''} onChange={e => set('produtor_cpf_cnpj', e.target.value)} placeholder="000.000.000-00 ou 00.000.000/0001-00" className={ic} /></Field>
        <Field label="Endereco"><input type="text" value={data.produtor_endereco || ''} onChange={e => set('produtor_endereco', e.target.value)} placeholder="Rua, numero, complemento" className={ic} /></Field>
        <Field label="CEP"><input type="text" value={data.produtor_cep || ''} onChange={e => set('produtor_cep', e.target.value)} placeholder="00000-000" className={ic} /></Field>
        <Field label="Cidade / UF"><input type="text" value={data.produtor_cidade_uf || ''} onChange={e => set('produtor_cidade_uf', e.target.value)} placeholder="Sao Paulo / SP" className={ic} /></Field>
        <Field label="Contato"><input type="text" value={data.produtor_contato || ''} onChange={e => set('produtor_contato', e.target.value)} placeholder="(11) 99999-9999" className={ic} /></Field>
        <Field label="E-mail"><input type="email" value={data.produtor_email || ''} onChange={e => set('produtor_email', e.target.value)} placeholder="contato@email.com" className={ic} /></Field>
        <Field label="Distribuidora"><input type="text" value={data.distribuidora || ''} onChange={e => set('distribuidora', e.target.value)} placeholder="Nome da distribuidora" className={ic} /></Field>
      </div>
      <MultiSelect label="Plataformas de distribuicao" options={['Spotify','Apple Music','Amazon Music','YouTube','Deezer','Tidal','Redes Sociais','Download Digital','DVD/Blu-ray']} value={data.plataformas || []} onChange={v => set('plataformas', v)} />
    </div>
  )
}

function FormSincronizacao({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  function fillCamposComuns(t: TitularSelecionado) {
    set('razao_social', t.nome)
    set('cnpj',         t.cpf_cnpj)
    set('endereco',     t.endereco)
    set('cep',          t.cep)
    set('cidade_uf',    t.cidade_uf)
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
        <Tv2 className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Dados da Sincronizacao Audiovisual</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TitularLookup label="Agencia / Produtora" value={data.agencia_produtora || ''} onChange={v => set('agencia_produtora', v)} onSelect={t => { set('agencia_produtora', t.nome); fillCamposComuns(t) }} hint="Selecione para preencher automaticamente" />
        <TitularLookup label="Cliente" value={data.cliente || ''} onChange={v => set('cliente', v)} onSelect={t => { set('cliente', t.nome); fillCamposComuns(t) }} hint="Selecione para preencher automaticamente" />
        <Field label="Razao Social"><input type="text" value={data.razao_social || ''} onChange={e => set('razao_social', e.target.value)} className={ic} /></Field>
        <Field label="CNPJ / CPF"><input type="text" value={data.cnpj || ''} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" className={ic} /></Field>
        <Field label="Endereco"><input type="text" value={data.endereco || ''} onChange={e => set('endereco', e.target.value)} className={ic} /></Field>
        <Field label="CEP"><input type="text" value={data.cep || ''} onChange={e => set('cep', e.target.value)} className={ic} /></Field>
        <Field label="Cidade / UF"><input type="text" value={data.cidade_uf || ''} onChange={e => set('cidade_uf', e.target.value)} className={ic} /></Field>
        <Field label="Meio de Utilizacao">
          <select value={data.meio_utilizacao || ''} onChange={e => set('meio_utilizacao', e.target.value)} className={sel}>
            <option value="">Selecione...</option>
            {['Filme','Serie','Novela','Documentario','Programa de TV','Publicidade'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Tipo de Sincronizacao">
          <select value={data.tipo_sincronizacao || ''} onChange={e => set('tipo_sincronizacao', e.target.value)} className={sel}>
            <option value="">Selecione...</option>
            {['Abertura','Encerramento','Tema','Fundo','Performance'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Tempo de Utilizacao (minutagem)"><input type="text" value={data.tempo_utilizacao || ''} onChange={e => set('tempo_utilizacao', e.target.value)} placeholder="Ex: 00:01:30" className={ic} /></Field>
        <Field label="Previsao de Lancamento"><input type="date" value={data.previsao_lancamento || ''} onChange={e => set('previsao_lancamento', e.target.value)} className={ic} /></Field>
        <Field label="Periodo de Licenca (dias)"><input type="number" value={data.periodo_licenca_dias || ''} onChange={e => set('periodo_licenca_dias', parseInt(e.target.value))} placeholder="Ex: 365" className={ic} /></Field>
        <Field label="Quantidade de Utilizacoes"><input type="number" value={data.qtd_utilizacoes || ''} onChange={e => set('qtd_utilizacoes', parseInt(e.target.value))} className={ic} /></Field>
      </div>
      <MultiSelect label="Territorio" options={['Brasil','America Latina','Estados Unidos','Europa','Portugal','Mundial']} value={data.territorio || ['Brasil']} onChange={v => set('territorio', v)} />
      <Field label="Descricao / Contexto do Uso">
        <textarea rows={3} value={data.descricao_uso || ''} onChange={e => set('descricao_uso', e.target.value)} placeholder="Descreva como a obra sera usada na producao..." className={ic + ' h-auto py-2 resize-none'} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <BoolField label="Exclusividade no Segmento" value={!!data.exclusividade_segmento} onChange={v => set('exclusividade_segmento', v)} />
        <BoolField label="Havera alteracao da letra ou obra" value={!!data.alteracao_letra} onChange={v => set('alteracao_letra', v)} />
        <BoolField label="Havera remix / adaptacao" value={!!data.remix_adaptacao} onChange={v => set('remix_adaptacao', v)} />
        <BoolField label="Participacao em festivais" value={!!data.participacao_festivais} onChange={v => set('participacao_festivais', v)} />
        <BoolField label="Fonograma original (Nao = regravacao)" value={data.fonograma_original !== false} onChange={v => set('fonograma_original', v)} />
      </div>
    </div>
  )
}

function FormPublicidade({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  function fillCamposComuns(t: TitularSelecionado) {
    set('razao_social', t.nome)
    set('cnpj',         t.cpf_cnpj)
    set('endereco',     t.endereco)
    set('cep',          t.cep)
    set('cidade_uf',    t.cidade_uf)
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
        <Megaphone className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Dados da Autorizacao para Publicidade</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TitularLookup label="Agencia / Produtora" value={data.agencia_produtora || ''} onChange={v => set('agencia_produtora', v)} onSelect={t => { set('agencia_produtora', t.nome); fillCamposComuns(t) }} hint="Selecione para preencher automaticamente" />
        <TitularLookup label="Cliente / Anunciante" value={data.cliente_anunciante || ''} onChange={v => set('cliente_anunciante', v)} onSelect={t => { set('cliente_anunciante', t.nome); fillCamposComuns(t) }} hint="Selecione para preencher automaticamente" />
        <Field label="Razao Social"><input type="text" value={data.razao_social || ''} onChange={e => set('razao_social', e.target.value)} className={ic} /></Field>
        <Field label="CNPJ / CPF"><input type="text" value={data.cnpj || ''} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" className={ic} /></Field>
        <Field label="Endereco"><input type="text" value={data.endereco || ''} onChange={e => set('endereco', e.target.value)} className={ic} /></Field>
        <Field label="CEP"><input type="text" value={data.cep || ''} onChange={e => set('cep', e.target.value)} className={ic} /></Field>
        <Field label="Cidade / UF"><input type="text" value={data.cidade_uf || ''} onChange={e => set('cidade_uf', e.target.value)} className={ic} /></Field>
        <Field label="Quantidade de Pecas de Veiculacao"><input type="number" value={data.qtd_pecas || ''} onChange={e => set('qtd_pecas', parseInt(e.target.value))} className={ic} /></Field>
        <Field label="Duracao de cada peca (minutagem)"><input type="text" value={data.duracao_peca || ''} onChange={e => set('duracao_peca', e.target.value)} placeholder="Ex: 00:00:30" className={ic} /></Field>
        <Field label="Data de Inicio da Campanha"><input type="date" value={data.data_inicio_campanha || ''} onChange={e => set('data_inicio_campanha', e.target.value)} className={ic} /></Field>
        <Field label="Periodo de Licenca (dias)"><input type="number" value={data.periodo_licenca_dias || ''} onChange={e => set('periodo_licenca_dias', parseInt(e.target.value))} className={ic} /></Field>
      </div>
      <MultiSelect label="Meios de Veiculacao" options={['TV Aberta','TV Fechada','Internet','Redes Sociais','Radio','Cinema','Out of Home']} value={data.meio_veiculacao || []} onChange={v => set('meio_veiculacao', v)} />
      <MultiSelect label="Territorio" options={['Brasil','America Latina','Estados Unidos','Europa','Portugal','Mundial']} value={data.territorio || ['Brasil']} onChange={v => set('territorio', v)} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <BoolField label="Exclusividade no Segmento" value={!!data.exclusividade_segmento} onChange={v => set('exclusividade_segmento', v)} />
        <BoolField label="Participacao em festivais" value={!!data.participacao_festivais} onChange={v => set('participacao_festivais', v)} />
        <BoolField label="Fonograma original (Nao = regravacao)" value={data.fonograma_original !== false} onChange={v => set('fonograma_original', v)} />
      </div>
    </div>
  )
}

function FormTV({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
        <Tv2 className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Dados da Autorizacao para TV</h3>
      </div>
      <p className="text-xs text-white/40 bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
        Os valores sao calculados automaticamente a partir da tabela de precificacao por canal e tipo de uso configurada no modulo de Precificacao.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Canal / Emissora" required>
          <select value={data.canal || ''} onChange={e => set('canal', e.target.value)} className={sel}>
            <option value="">Selecione...</option>
            {['Globo','SBT','Record','Band','RedeTV','Multishow','GNT','Sportv','HBO','Netflix','Prime Video','Disney+','Paramount+'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Tipo de Uso" required>
          <select value={data.tipo_uso_tv || ''} onChange={e => set('tipo_uso_tv', e.target.value)} className={sel}>
            <option value="">Selecione...</option>
            {['Abertura','Encerramento','Abertura/Encerramento Pontual','Tema','Fundo','Performance'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Subtipo / Producao">
          <select value={data.subtipo || ''} onChange={e => set('subtipo', e.target.value)} className={sel}>
            <option value="">Selecione...</option>
            {['Novelas e Series','Series de Curta Temporada','Mini-series / Demais Producoes','Programas Jornalisticos','Quaisquer Generos'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Periodo de Licenca (dias)">
          <input type="number" value={data.periodo_licenca_dias || ''} onChange={e => set('periodo_licenca_dias', parseInt(e.target.value))} className={ic} />
        </Field>
      </div>
      <MultiSelect label="Territorio" options={['Brasil','America Latina','Estados Unidos','Europa','Portugal','Mundial']} value={data.territorio || ['Brasil']} onChange={v => set('territorio', v)} />
    </div>
  )
}

function FormEdicaoGrafica({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
        <BookOpen className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Dados da Edicao Grafica</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TitularLookup
          label="Licenciante / Razao Social"
          value={data.licenciante_nome || ''}
          onChange={v => set('licenciante_nome', v)}
          onSelect={t => {
            set('licenciante_nome',      t.nome)
            set('licenciante_cpf_cnpj',  t.cpf_cnpj)
            set('licenciante_endereco',  t.endereco)
            set('licenciante_cidade_uf', t.cidade_uf)
            set('licenciante_email',     t.email)
          }}
          hint="Selecione para preencher automaticamente"
        />
        <Field label="CPF / CNPJ"><input type="text" value={data.licenciante_cpf_cnpj || ''} onChange={e => set('licenciante_cpf_cnpj', e.target.value)} className={ic} /></Field>
        <Field label="Endereco"><input type="text" value={data.licenciante_endereco || ''} onChange={e => set('licenciante_endereco', e.target.value)} className={ic} /></Field>
        <Field label="Cidade / UF"><input type="text" value={data.licenciante_cidade_uf || ''} onChange={e => set('licenciante_cidade_uf', e.target.value)} className={ic} /></Field>
        <Field label="E-mail"><input type="email" value={data.licenciante_email || ''} onChange={e => set('licenciante_email', e.target.value)} className={ic} /></Field>
        <Field label="Editora Publicadora"><input type="text" value={data.editora_publicadora || ''} onChange={e => set('editora_publicadora', e.target.value)} className={ic} /></Field>
        <Field label="Tiragem (copias)"><input type="number" value={data.tiragem || ''} onChange={e => set('tiragem', parseInt(e.target.value))} className={ic} /></Field>
      </div>
      <MultiSelect label="Tipo de Direito Licenciado" options={['Letra','Cifra','Partitura','Tablatura','Songbook','Coletanea']} value={data.tipos_direito || []} onChange={v => set('tipos_direito', v)} />
    </div>
  )
}

function FormIncidental({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
        <Layers className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Dados do Uso Incidental</h3>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400 space-y-1">
        <p className="font-semibold">Observacao de mercado</p>
        <p>Uso incidental possui valor reduzido. NAO autoriza regravacao e NAO transforma o uso em sincronizacao principal. Quando a musica tem destaque narrativo ou sincronismo proposital, considere usar Sincronizacao Audiovisual.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TitularLookup
          label="Produtora Responsavel"
          value={data.produtora || ''}
          onChange={v => set('produtora', v)}
          onSelect={t => {
            set('produtora', t.nome)
          }}
          hint="Selecione para preencher automaticamente"
        />
        <Field label="Nome da Producao Audiovisual"><input type="text" value={data.nome_producao || ''} onChange={e => set('nome_producao', e.target.value)} className={ic} /></Field>
        <Field label="Tempo exato de Utilizacao"><input type="text" value={data.tempo_utilizacao || ''} onChange={e => set('tempo_utilizacao', e.target.value)} placeholder="Ex: 00:00:23" className={ic} /></Field>
        <Field label="Quantidade de Utilizacoes"><input type="number" value={data.qtd_utilizacoes || ''} onChange={e => set('qtd_utilizacoes', parseInt(e.target.value))} className={ic} /></Field>
        <Field label="Prazo de Utilizacao"><input type="text" value={data.prazo_utilizacao || ''} onChange={e => set('prazo_utilizacao', e.target.value)} placeholder="Ex: 12 meses" className={ic} /></Field>
      </div>
      <MultiSelect label="Tipo da Producao" options={['Filme','Serie','Documentario','Programa de TV','Conteudo Digital','YouTube','Streaming']} value={data.tipo_producao || []} onChange={v => set('tipo_producao', v)} />
      <Field label="Descricao da Cena">
        <textarea rows={2} value={data.descricao_cena || ''} onChange={e => set('descricao_cena', e.target.value)} placeholder="Descreva o contexto da cena..." className={ic + ' h-auto py-2 resize-none'} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <BoolField label="Ha destaque perceptivel da musica" value={!!data.destaque_percetivel} onChange={v => set('destaque_percetivel', v)} />
        <BoolField label="Ha sincronismo intencional" value={!!data.sincronismo_intencional} onChange={v => set('sincronismo_intencional', v)} />
      </div>
      <MultiSelect label="Plataformas de Exibicao" options={['Cinema','TV Aberta','TV Fechada','Netflix','Prime Video','Disney+','YouTube','Festivais']} value={data.plataformas_exibicao || []} onChange={v => set('plataformas_exibicao', v)} />
    </div>
  )
}

function FormVersao({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
        <Shuffle className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Dados da Autorizacao para Versao</h3>
      </div>
      <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 text-xs text-sky-400">
        Uma versao NAO e automaticamente permitida apenas por citar os autores originais. Depende de autorizacao formal dos titulares e aprovacao da nova letra.
      </div>

      <p className="text-xs font-semibold text-white/40 pt-1">Obra Original</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Titulo Original"><input type="text" value={data.titulo_original || ''} onChange={e => set('titulo_original', e.target.value)} className={ic} /></Field>
        <Field label="Autores / Compositores Originais"><input type="text" value={data.autores_originais || ''} onChange={e => set('autores_originais', e.target.value)} className={ic} /></Field>
        <Field label="Editora Original"><input type="text" value={data.editora_original || ''} onChange={e => set('editora_original', e.target.value)} className={ic} /></Field>
        <Field label="ISWC"><input type="text" value={data.iswc || ''} onChange={e => set('iswc', e.target.value)} placeholder="T-000000000-0" className={ic} /></Field>
        <Field label="Pais de Origem"><input type="text" value={data.pais_origem || ''} onChange={e => set('pais_origem', e.target.value)} className={ic} /></Field>
      </div>

      <p className="text-xs font-semibold text-white/40 pt-1">Versionista</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TitularLookup
          label="Nome Completo do Versionista"
          value={data.versionista_nome || ''}
          onChange={v => set('versionista_nome', v)}
          onSelect={t => {
            set('versionista_nome', t.nome)
            set('versionista_cpf',  t.cpf_cnpj)
          }}
          hint="Selecione para preencher automaticamente"
        />
        <Field label="CPF / CNPJ"><input type="text" value={data.versionista_cpf || ''} onChange={e => set('versionista_cpf', e.target.value)} className={ic} /></Field>
        <Field label="Sociedade Autoral"><input type="text" value={data.versionista_sociedade || ''} onChange={e => set('versionista_sociedade', e.target.value)} placeholder="ECAD, ASCAP, BMI..." className={ic} /></Field>
        <Field label="Codigo CAE / IPI"><input type="text" value={data.versionista_cae || ''} onChange={e => set('versionista_cae', e.target.value)} className={ic} /></Field>
      </div>

      <p className="text-xs font-semibold text-white/40 pt-1">Nova Versao</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Novo Titulo da Obra"><input type="text" value={data.novo_titulo || ''} onChange={e => set('novo_titulo', e.target.value)} className={ic} /></Field>
        <Field label="Idioma da Versao"><input type="text" value={data.idioma_versao || ''} onChange={e => set('idioma_versao', e.target.value)} placeholder="Portugues, Espanhol..." className={ic} /></Field>
        <Field label="Percentual para o Versionista (%)">
          <input type="number" value={data.percentual_versionista || ''} onChange={e => set('percentual_versionista', parseFloat(e.target.value))} min={0} max={50} step={0.01} className={ic} />
        </Field>
        <Field label="Tipo de Versao">
          <select value={data.tipo_versao || ''} onChange={e => set('tipo_versao', e.target.value)} className={sel}>
            <option value="">Selecione...</option>
            {[['traducao','Traducao'],['adaptacao','Adaptacao'],['versao_parcial','Versao Parcial'],['versao_integral','Versao Integral']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Letra Adaptada / Traduzida">
        <textarea rows={4} value={data.letra_adaptada || ''} onChange={e => set('letra_adaptada', e.target.value)} placeholder="Cole ou escreva a nova letra..." className={ic + ' h-auto py-2 resize-none'} />
      </Field>
      <MultiSelect label="Formas de Exploracao" options={['Fonograma','Videofonograma','Streaming','Shows','TV','Publicidade','Redes Sociais']} value={data.exploracoes || []} onChange={v => set('exploracoes', v)} />
      <BoolField label="Necessita aprovacao previa da letra final" value={!!data.aprovacao_previa_letra} onChange={v => set('aprovacao_previa_letra', v)} />
    </div>
  )
}

// ── Pagamento step ─────────────────────────────────────────────────────────────
function StepPagamento({ valorTotal, forma, setForma, condicao, setCondicao, parcelas, setParcelas, entrada, setEntrada, dataInicio, semOnus }: {
  valorTotal: number; forma: FormaPagamento; setForma: (v: FormaPagamento) => void;
  condicao: 'a_vista' | 'parcelado'; setCondicao: (v: 'a_vista' | 'parcelado') => void;
  parcelas: number; setParcelas: (v: number) => void;
  entrada: number; setEntrada: (v: number) => void;
  dataInicio: string;
  semOnus?: boolean;
}) {
  const FORMA_ICONS: Record<FormaPagamento, React.ElementType> = {
    dinheiro:      Banknote,
    pix:           Smartphone,
    transferencia: ArrowLeftRight,
    cartao_credito:CreditCard,
    cartao_debito: CreditCard,
  }
  const valorRestante = valorTotal - entrada
  const valorParcela = parcelas > 0 ? valorRestante / parcelas : 0
  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

  // Gera datas das parcelas: 30, 60, 90... dias a partir de dataInicio
  const datasVencimento = useMemo(() => {
    if (!dataInicio || parcelas <= 0) return []
    const base = new Date(dataInicio + 'T00:00:00')
    return Array.from({ length: parcelas }, (_, i) => {
      const d = new Date(base)
      d.setDate(d.getDate() + (i + 1) * 30)
      return d
    })
  }, [dataInicio, parcelas])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
        <DollarSign className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Forma e Condicao de Pagamento</h3>
      </div>

      {semOnus && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-400 font-medium">
            Autorizacao SEM ONUS — sem cobranca financeira. Valores zerados automaticamente.
          </p>
        </div>
      )}

      <div className={semOnus ? 'opacity-50 pointer-events-none select-none' : undefined}>
        {/* Forma de pagamento */}
        <div>
        <p className="text-xs font-medium text-white/50 mb-2">Forma de Pagamento</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {FORMAS_PAG.map(f => {
            const Icon = FORMA_ICONS[f]
            return (
              <button key={f} onClick={() => setForma(f)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${forma === f ? 'bg-violet-500/15 border-violet-500/40 ring-1 ring-violet-500/30' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'}`}>
                <Icon className={`w-4 h-4 ${forma === f ? 'text-violet-400' : 'text-white/35'}`} />
                <span className={`text-[10px] font-semibold ${forma === f ? 'text-violet-300' : 'text-white/40'}`}>{FORMA_PAGAMENTO_LABELS[f]}</span>
                {forma === f && <CheckCircle2 className="w-3 h-3 text-violet-400" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Condicao */}
      <div className="mt-5">
        <p className="text-xs font-medium text-white/50 mb-2">Condicao de Pagamento</p>
        <div className="flex gap-2">
          {(['a_vista','parcelado'] as const).map(c => (
            <button key={c} onClick={() => setCondicao(c)}
              className={`flex-1 h-10 rounded-xl border text-sm font-semibold transition-all ${condicao === c ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60'}`}>
              {c === 'a_vista' ? 'A Vista' : 'Parcelado'}
            </button>
          ))}
        </div>
      </div>

      {/* Parcelamento */}
      {condicao === 'parcelado' && (
        <div className="mt-5 space-y-4 bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Entrada (R$)">
              <CurrencyInput value={entrada} onChange={setEntrada} />
            </Field>
            <Field label="Numero de Parcelas">
              <select value={parcelas} onChange={e => setParcelas(parseInt(e.target.value))} className={sel}>
                {[2,3,4,5,6,7,8,9,10,11,12,18,24,36,48].map(n => (
                  <option key={n} value={n}>{n}x</option>
                ))}
              </select>
            </Field>
          </div>

          {valorTotal > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0d1526] rounded-lg p-3 text-center border border-white/[0.06]">
                  <p className="text-[10px] text-white/35 mb-1">Entrada</p>
                  <p className="text-sm font-bold text-sky-400">{fmtBRL(entrada)}</p>
                </div>
                <div className="bg-[#0d1526] rounded-lg p-3 text-center border border-white/[0.06]">
                  <p className="text-[10px] text-white/35 mb-1">{parcelas}x de</p>
                  <p className="text-sm font-bold text-violet-400">{fmtBRL(valorParcela)}</p>
                </div>
                <div className="bg-[#0d1526] rounded-lg p-3 text-center border border-white/[0.06]">
                  <p className="text-[10px] text-white/35 mb-1">Total</p>
                  <p className="text-sm font-bold text-emerald-400">{fmtBRL(valorTotal)}</p>
                </div>
              </div>

              {/* Tabela de vencimentos */}
              <div>
                <p className="text-[10px] font-semibold text-white/35 mb-2 uppercase tracking-wider">
                  Cronograma de Vencimentos {!dataInicio && <span className="text-amber-400/70">(defina a data de inicio no passo anterior)</span>}
                </p>
                <div className="rounded-lg border border-white/[0.06] overflow-hidden">
                  {entrada > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 bg-sky-500/5 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[9px] font-bold flex items-center justify-center">E</span>
                        <span className="text-xs text-white/60">Entrada</span>
                        {dataInicio && <span className="text-[10px] text-white/30">— {new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                      </div>
                      <span className="text-xs font-semibold text-sky-400">{fmtBRL(entrada)}</span>
                    </div>
                  )}
                  {datasVencimento.map((data, i) => (
                    <div key={i} className={`flex items-center justify-between px-3 py-2 ${i < datasVencimento.length - 1 ? 'border-b border-white/[0.03]' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-violet-500/15 text-violet-400 text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-xs text-white/60">{(i + 1) * 30}º dia</span>
                        {dataInicio
                          ? <span className="text-[10px] text-white/30">— {data.toLocaleDateString('pt-BR')}</span>
                          : <span className="text-[10px] text-white/20">— data a definir</span>
                        }
                      </div>
                      <span className="text-xs font-semibold text-violet-300">{fmtBRL(valorParcela)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {condicao === 'a_vista' && valorTotal > 0 && (
        <div className="mt-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs text-white/50">Total a pagar a vista</span>
          <span className="text-xl font-bold text-emerald-400">{fmtBRL(valorTotal)}</span>
        </div>
      )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function NovaAutorizacaoPage() {
  const [step, setStep] = useState(0)
  const [tipo, setTipo] = useState<TipoAutorizacao>('fonograma')
  const [obraId, setObraId] = useState('')
  const [pctAutorizado, setPctAutorizado] = useState(0)
  const [camposEspecificos, setCamposEspecificos] = useState<Record<string, any>>({})
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [territorio, setTerritorio] = useState('BR')
  const [exclusividade, setExclusividade] = useState(false)
  const [exclMeses, setExclMeses] = useState(12)
  const [valorTotal, setValorTotal] = useState(0)
  const [obs, setObs] = useState('')
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [condicao, setCondicao] = useState<'a_vista' | 'parcelado'>('a_vista')
  const [parcelas, setParcelas] = useState(3)
  const [entrada, setEntrada] = useState(0)
  const [modeloNegocio, setModeloNegocio] = useState<ModeloNegocio>('pago_editora')
  const [buscaObra, setBuscaObra] = useState('')
  // ── Busca real de obras via API ──────────────────────────────────────────
  const [obrasResultado, setObrasResultado]           = useState<any[]>([])
  const [buscandoObra, setBuscandoObra]               = useState(false)
  const [obraSelecionadaData, setObraSelecionadaData] = useState<any>(null)
  const [linksObra, setLinksObra]                     = useState<any[]>([])

  useEffect(() => {
    const q = buscaObra.trim()
    if (!q) { setObrasResultado([]); return }
    const timer = setTimeout(async () => {
      setBuscandoObra(true)
      try {
        const res = await authFetch(`/api/obras?q=${encodeURIComponent(q)}&per_page=30`)
        const json = await res.json()
        const obras = (json.obras ?? json.data ?? []) as any[]
        // Calcular _percentual_controlado a partir dos links da obra
        const obrasComPct = obras.map((obra: any) => {
          const links: any[] = obra._links ?? obra.obras_links ?? []
          let pctControlado = 0
          for (const link of links) {
            const titulares: any[] = link.titulares ?? link.obras_links_titulares ?? []
            for (const t of titulares) {
              if (t.controlado) {
                pctControlado += Number(t.percentual_exec_publica ?? t.percentual ?? 0)
              }
            }
          }
          return { ...obra, _percentual_controlado: pctControlado }
        })
        setObrasResultado(obrasComPct)
      } catch { setObrasResultado([]) }
      finally { setBuscandoObra(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [buscaObra])

  useEffect(() => {
    if (!obraId) { setLinksObra([]); return }
    authFetch(`/api/obras/${obraId}/links`)
      .then(r => r.json())
      .then(d => setLinksObra(d.links ?? []))
      .catch(() => setLinksObra([]))
  }, [obraId])

  // Smart scroll: top ao mudar step; scroll ao botao quando campo e preenchido
  const footerRef = useWizardSmartScroll(step, [tipo, obraId, dataInicio, dataFim, valorTotal, modeloNegocio])

  function setC(k: string, v: any) {
    setCamposEspecificos(prev => ({ ...prev, [k]: v }))
  }

  const pcControlado = obraSelecionadaData?._percentual_controlado ?? 0
  const bloqueioExcl = { bloqueada: false }

  const exclusividadeDataFim = useMemo(() => {
    if (!exclusividade || !dataInicio) return null
    const d = new Date(dataInicio)
    d.setMonth(d.getMonth() + exclMeses)
    return d.toISOString().slice(0, 10)
  }, [exclusividade, dataInicio, exclMeses])

  // Exclusividade preenche automaticamente dataFim
  React.useEffect(() => {
    if (exclusividade && exclusividadeDataFim) {
      setDataFim(exclusividadeDataFim)
    }
  }, [exclusividade, exclusividadeDataFim])

  // SEM_ONUS: zera valores financeiros automaticamente
  useEffect(() => {
    if (modeloNegocio === 'sem_onus') {
      setValorTotal(0)
      setEntrada(0)
      setParcelas(3)
      setCondicao('a_vista')
    }
  }, [modeloNegocio])

  const stepValido = [
    true,
    !!obraId && !bloqueioExcl.bloqueada,
    true,
    !!dataInicio,
    true,
    true,
    true,
  ]

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
  const docNome = MODELO_NEGOCIO_DOCUMENTO_NOME[modeloNegocio]
  const valorParcela = condicao === 'parcelado' && parcelas > 0 ? (valorTotal - entrada) / parcelas : 0

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader
        title="Nova Autorizacao"
        description={`Numero: ${NUMERO_GERADO} · Assistente em ${STEPS.length} passos`}
        actions={
          <Link href="/master/autorizacoes" className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors flex items-center">
            Cancelar
          </Link>
        }
      />

      {/* Step bar */}
      <div className="flex items-center gap-0 overflow-x-auto">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium ${i === step ? 'bg-violet-600 text-white' : i < step ? 'text-emerald-400' : 'text-white/25'}`}>
              {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-4 h-4 rounded-full bg-current opacity-30 inline-flex items-center justify-center text-[9px] font-bold text-white">{i+1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-white/15 shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* ─── Step 0: Tipo ─── */}
      {step === 0 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Tipo de Autorizacao</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TODOS_TIPOS.map(t => {
              const Icon = TIPO_ICONS[t]
              return (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${tipo === t ? 'bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/30' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tipo === t ? 'bg-violet-600' : 'bg-white/10'}`}>
                    <Icon className={`w-4 h-4 ${tipo === t ? 'text-white' : 'text-white/40'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${tipo === t ? 'text-white' : 'text-white/60'}`}>{TIPO_AUTORIZACAO_LABELS[t]}</p>
                    <p className="text-xs text-white/30 mt-0.5 leading-snug">{TIPO_AUTORIZACAO_DESCRICAO[t]}</p>
                  </div>
                  {tipo === t && <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Step 1: Obra ─── */}
      {step === 1 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Selecionar Obra</h2>
            </div>
            <button
              onClick={() => { if (obraId && !bloqueioExcl.bloqueada) setStep(s => s + 1) }}
              disabled={!obraId || !!bloqueioExcl.bloqueada}
              className={`flex items-center gap-1.5 h-9 px-5 rounded-lg text-sm font-semibold transition-all ${obraId && !bloqueioExcl.bloqueada ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-violet-600 text-white opacity-50 cursor-not-allowed'}`}
            >
              Prosseguir <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-white/40">O sistema identifica automaticamente a editora administradora responsavel e carrega o modelo de documento correto para emissao.</p>
          {/* Busca por titulo */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/25 pointer-events-none" />
            <input
              type="text"
              value={buscaObra}
              onChange={e => setBuscaObra(e.target.value)}
              placeholder="Digite o titulo para buscar..."
              className={ic + ' pl-8'}
            />
          </div>
          <div className="space-y-2">
            {/* Spinner enquanto busca */}
            {buscandoObra && (
              <p className="text-xs text-white/40 text-center py-2">Buscando...</p>
            )}
            {/* Obra já selecionada (busca vazia) */}
            {!buscandoObra && buscaObra.trim() === '' && obraSelecionadaData && (() => {
                const obra = obraSelecionadaData
                const allTits = linksObra.flatMap((l: any) => l.titulares ?? [])
                const todos = [...new Set(allTits.map((t: any) => t.nome))]
                const controlados = [...new Set(allTits.filter((t: any) => t.controlado).map((t: any) => t.nome))]
                return (
                  <button key={obra.id} onClick={() => {}} disabled
                    className="flex items-center gap-3 w-full p-4 rounded-xl border text-left bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/30 cursor-default">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-600">
                      <Music className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{obra.titulo}</p>
                      <p className="text-xs text-white/30">{obra.codigo_obra ?? obra.codigo} · Editora: {obra.editora_nome ?? obra.editora ?? '—'}</p>
                      {todos.length > 0 && (
                        <div className="mt-0.5 space-y-0">
                          <p className="text-[10px] text-white/35 truncate">Autores: {todos.join(' / ')}</p>
                          {controlados.length > 0 && <p className="text-[10px] text-violet-400/70 truncate">Controlados: {controlados.join(' / ')}</p>}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-violet-400">{pcControlado.toFixed(2)}%</p>
                      <p className="text-[10px] text-white/30">controlado</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                  </button>
                )
              })()
            }
            {/* Resultados da busca */}
            {!buscandoObra && buscaObra.trim() !== '' && obrasResultado.length === 0 && (
              <p className="text-xs text-white/30 text-center py-2">Nenhuma obra encontrada</p>
            )}
            {!buscandoObra && buscaObra.trim() !== '' && obrasResultado.map((obra: any) => {
                const pctCtrl = obra._percentual_controlado ?? 0
                const sel2 = obraId === obra.id
                return (
                  <button key={obra.id}
                    onClick={() => {
                      setObraId(obra.id)
                      setObraSelecionadaData(obra)
                      setPctAutorizado(pctCtrl)
                      setBuscaObra('')
                    }}
                    className={`flex items-center gap-3 w-full p-4 rounded-xl border text-left transition-all ${sel2 ? 'bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/30' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sel2 ? 'bg-violet-600' : 'bg-white/10'}`}>
                      <Music className={`w-3.5 h-3.5 ${sel2 ? 'text-white' : 'text-white/40'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${sel2 ? 'text-white' : 'text-white/70'}`}>{obra.titulo}</p>
                      <p className="text-xs text-white/30">{obra.codigo_obra ?? obra.codigo} · Editora: {obra.editora_nome ?? obra.editora ?? '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-violet-400">{pctCtrl.toFixed(2)}%</p>
                      <p className="text-[10px] text-white/30">controlado</p>
                    </div>
                    {sel2 && <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />}
                  </button>
                )
              })
            }
          </div>
          {obraId && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-white/50">Percentual Autorizado (maximo: {pcControlado.toFixed(2)}%)</p>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={pcControlado} step={0.01}
                  value={Math.min(pctAutorizado, pcControlado)}
                  onChange={e => setPctAutorizado(parseFloat(e.target.value))}
                  className="flex-1 accent-violet-500" />
                <div className="flex items-center gap-1">
                  <input type="number" min={0} max={pcControlado} step={0.01}
                    value={pctAutorizado}
                    onChange={e => setPctAutorizado(parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 bg-white/5 border border-white/[0.08] rounded-lg px-2 text-sm text-white tabular-nums focus:outline-none" />
                  <span className="text-xs text-white/40">%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 2: Dados Especificos ─── */}
      {step === 2 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          {tipo === 'fonograma'      && <FormFonograma      data={camposEspecificos} set={setC} />}
          {tipo === 'sincronizacao'  && <FormSincronizacao  data={camposEspecificos} set={setC} />}
          {tipo === 'publicidade'    && <FormPublicidade     data={camposEspecificos} set={setC} />}
          {tipo === 'tv'             && <FormTV              data={camposEspecificos} set={setC} />}
          {tipo === 'edicao_grafica' && <FormEdicaoGrafica   data={camposEspecificos} set={setC} />}
          {tipo === 'incidental'     && <FormIncidental      data={camposEspecificos} set={setC} />}
          {tipo === 'versao'         && <FormVersao          data={camposEspecificos} set={setC} />}
        </div>
      )}

      {/* ─── Step 3: Periodo & Exclusividade ─── */}
      {step === 3 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Periodo, Territorio e Exclusividade</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de Inicio" required><input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className={ic} /></Field>
            <Field label="Data de Termino"><input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className={ic} /></Field>
          </div>
          <Field label="Territorio">
            <select value={territorio} onChange={e => setTerritorio(e.target.value)} className={sel}>
              {TERRITORIOS.map(t => <option key={t.codigo} value={t.codigo}>{t.nome}</option>)}
            </select>
          </Field>
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 space-y-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={exclusividade} onChange={e => setExclusividade(e.target.checked)} className="w-4 h-4 accent-amber-500" />
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-semibold text-white/80">Esta autorizacao tem exclusividade</span>
            </label>
            {exclusividade && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input type="number" value={exclMeses} onChange={e => setExclMeses(parseInt(e.target.value) || 12)}
                    min={1} max={120} className="w-24 h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 text-sm text-white focus:outline-none" />
                  <span className="text-xs text-white/50">meses</span>
                </div>
                {exclusividadeDataFim && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400 space-y-1">
                    <p className="font-semibold">Exclusividade vigente ate: {new Date(exclusividadeDataFim + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    <p className="text-amber-400/70">Novas autorizacoes desta obra serao bloqueadas automaticamente. Alertas serao enviados 30 dias antes do vencimento.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <Field label="Valor Total (BRL)">
            <CurrencyInput value={valorTotal} onChange={setValorTotal} />
          </Field>
          <Field label="Observacoes">
            <textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Observacoes adicionais..." className={ic + ' h-auto py-2 resize-none'} />
          </Field>
        </div>
      )}

      {/* ─── Step 4: Modelo Negocio ─── */}
      {step === 4 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Quem Paga — Modelo de Negocio</h2>
          </div>
          <div className="space-y-2">
            {MODELOS_NEGOCIO.map(m => (
              <button key={m} onClick={() => setModeloNegocio(m)}
                className={`flex items-start gap-3 w-full p-4 rounded-xl border text-left transition-all ${modeloNegocio === m ? 'bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/30' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${modeloNegocio === m ? 'text-white' : 'text-white/60'}`}>{MODELO_NEGOCIO_LABELS[m]}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${MODELO_NEGOCIO_COLORS[m]}`}>{m}</span>
                  </div>
                  <p className="text-xs text-white/35 mt-0.5">{MODELO_NEGOCIO_DESCRICAO[m]}</p>
                </div>
                {modeloNegocio === m && <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />}
              </button>
            ))}
          </div>
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-sky-400 mb-1">Documento que sera gerado</p>
            <p className="text-sm font-semibold text-white">{docNome}</p>
            <p className="text-xs text-white/40 mt-1">Apos emitir, o PDF sera gerado automaticamente. Voce podera baixar, assinar por token digital e fazer o upload do documento assinado de volta ao sistema.</p>
          </div>
        </div>
      )}

      {/* ─── Step 5: Pagamento ─── */}
      {step === 5 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <StepPagamento
            valorTotal={valorTotal}
            forma={forma} setForma={setForma}
            condicao={condicao} setCondicao={setCondicao}
            parcelas={parcelas} setParcelas={setParcelas}
            entrada={entrada} setEntrada={setEntrada}
            dataInicio={dataInicio}
            semOnus={modeloNegocio === 'sem_onus'}
          />
        </div>
      )}

      {/* ─── Step 6: Revisao ─── */}
      {step === 6 && (() => {
        // Calcula autores da obra selecionada a partir dos links
        const todosLinks = linksObra
        const PAPEIS_AUTOR = ['compositor', 'co_compositor', 'arranjador', 'versionista', 'tradutor', 'autor']
        const todosTitulares: string[] = []
        const tituladosControlados: string[] = []
        todosLinks.forEach((link: any) => {
          const membros = link.titulares ?? link._titulares ?? []
          membros.forEach((lt: any) => {
            const nome = lt.nome ?? lt.titular_nome ?? ''
            const papel = (lt.papel ?? '').toLowerCase()
            const isAutor = PAPEIS_AUTOR.some(p => papel.includes(p))
            if (!isAutor) return
            if (nome && !todosTitulares.includes(nome)) todosTitulares.push(nome)
            if (lt.controlado && nome && !tituladosControlados.includes(nome)) tituladosControlados.push(nome)
          })
        })
        const pctFormatado = pcControlado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">Autorizacao pronta para emissao</p>
              <p className="text-xs text-emerald-400/70">Numero: {NUMERO_GERADO}</p>
            </div>
          </div>

          {/* Bloco de autores da obra */}
          {obraSelecionadaData && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Titulares da Obra</h3>
              </div>
              <div>
                <p className="text-[10px] text-white/30 mb-0.5">Autores da obra</p>
                <p className="text-xs text-white/70 font-medium">
                  {todosTitulares.length > 0 ? todosTitulares.join(' / ') : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 mb-0.5">Autores controlados</p>
                <p className="text-xs text-violet-300 font-semibold">
                  {tituladosControlados.length > 0 ? tituladosControlados.join(' / ') : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 mb-0.5">% de controle</p>
                <p className="text-xs text-emerald-400 font-bold">{pctFormatado}%</p>
              </div>
            </div>
          )}

          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white mb-3">Resumo da Autorizacao</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6">
              {[
                { label: 'Numero', value: NUMERO_GERADO },
                { label: 'Tipo', value: TIPO_AUTORIZACAO_LABELS[tipo] },
                { label: 'Obra', value: obraSelecionadaData?.titulo ?? obraId },
                { label: 'Editora', value: (obraSelecionadaData as any)?.editora_nome ?? '—' },
                { label: '% Controlado', value: pcControlado.toFixed(2) + '%' },
                { label: '% Autorizado', value: pctAutorizado.toFixed(2) + '%' },
                { label: 'Territorio', value: TERRITORIOS.find(t => t.codigo === territorio)?.nome ?? territorio },
                { label: 'Inicio', value: dataInicio ? new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR') : 'nao definido' },
                { label: 'Termino', value: dataFim ? new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR') : 'indeterminado' },
                { label: 'Exclusividade', value: exclusividade ? exclMeses + ' meses (ate ' + (exclusividadeDataFim ? new Date(exclusividadeDataFim + 'T00:00:00').toLocaleDateString('pt-BR') : '') + ')' : 'Nao' },
                { label: 'Valor Total', value: modeloNegocio === 'sem_onus' ? 'R$ 0,00 (SEM ONUS)' : (valorTotal > 0 ? fmtBRL(valorTotal) : 'Sem onus') },
                { label: 'Forma Pgto', value: modeloNegocio === 'sem_onus' ? '— (sem cobranca)' : FORMA_PAGAMENTO_LABELS[forma] },
                { label: 'Condicao', value: modeloNegocio === 'sem_onus' ? '— (sem cobranca)' : (condicao === 'a_vista' ? 'A Vista' : parcelas + 'x de ' + fmtBRL(valorParcela) + (entrada > 0 ? ' + entrada ' + fmtBRL(entrada) : '')) },
                { label: 'Modelo Negocio', value: MODELO_NEGOCIO_LABELS[modeloNegocio] },
                { label: 'Documento', value: docNome },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] text-white/30">{f.label}</p>
                  <p className="text-xs text-white/70 font-medium">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-start gap-2">
            <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-xs text-violet-400">
              Ao confirmar, o sistema gera o <strong>{docNome}</strong> em PDF assinado pela <strong>Top Show Music</strong> como editora administradora. Voce podera baixar, assinar por token digital e fazer upload do documento assinado.
            </p>
          </div>
          {modeloNegocio === 'pago_editora' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-0.5">Conta Corrente da Obra</p>
                <p className="text-xs text-emerald-400/70">
                  Os valores pagos a editora serao lancados automaticamente no conta corrente da obra assim que o recebimento for confirmado. O sistema ira calcular e distribuir os percentuais para autores e co-editoras conforme os links cadastrados.
                </p>
              </div>
            </div>
          )}
        </div>
        )
      })()}

      {/* Navigation */}
      <div ref={footerRef} className="flex items-center justify-between pt-2">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 disabled:opacity-30 disabled:pointer-events-none transition-colors">
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">Passo {step + 1} de {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!stepValido[step]}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:pointer-events-none text-sm text-white font-semibold transition-colors">
              Proximo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button className="flex items-center gap-1.5 h-9 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white font-semibold transition-colors">
              <FileText className="w-4 h-4" /> Gerar Documento
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
