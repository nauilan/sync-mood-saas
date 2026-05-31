'use client'

import { useState, useEffect } from 'react'
import {
  FilePlus, Plus, Search, Edit3, Trash2, Copy, ChevronDown, ChevronUp,
  Check, X, Save, FileText, Clock, Globe, Shield, Users, Building2,
  AlertTriangle, ToggleLeft, ToggleRight, Info, Percent, ArrowRight,
  Lock, Unlock, MapPin, Star, Landmark, UserCheck, UserX,
  Upload, Paperclip, Download, Trash
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Tipos de Contrato ────────────────────────────────────────
export type TipoContrato =
  | 'cessao_parcial'
  | 'licenciamento'
  | 'administracao_editorial'
  | 'coeditorial'
  | 'subedicao'
  | 'cessao_internacional'
  | 'cessao_cessionario_pj'
  | 'cessao_cessionario_pf'
  | 'licenciamento_licenciante_pj'
  | 'licenciamento_licenciante_pf'
  | 'exclusividade'

// ── Tipos de Direito ─────────────────────────────────────────
export interface DireitoItem {
  codigo: string
  label: string
  territorio: 'brasil' | 'exterior'
  letra: string
}

export const DIREITOS_BRASIL: DireitoItem[] = [
  { codigo: 'br_grafica',       label: 'Reprodução Gráfica (Edição)',                                                     territorio: 'brasil', letra: 'a' },
  { codigo: 'br_fonomec',       label: 'Reprodução Fonomecânica (venda e locação de gravações)',                          territorio: 'brasil', letra: 'b' },
  { codigo: 'br_audiovisual',   label: 'Inclusão e Adaptação em Produções Audiovisuais',                                  territorio: 'brasil', letra: 'c' },
  { codigo: 'br_publicitaria',  label: 'Inclusão em Produções Publicitárias, Gráficas, Sonoras ou Audiovisuais',          territorio: 'brasil', letra: 'd' },
  { codigo: 'br_digital',       label: 'Distribuição via Meios Óticos, Cabo, Satélites, Redes e Computadores',            territorio: 'brasil', letra: 'e' },
  { codigo: 'br_base_dados',    label: 'Inclusão em Base de Dados ou Qualquer Forma de Armazenamento',                    territorio: 'brasil', letra: 'f' },
  { codigo: 'br_comunicacao',   label: 'Comunicação ao Público',                                                          territorio: 'brasil', letra: 'g' },
  { codigo: 'br_autorizacoes',  label: 'Autorizações com Ônus (Liberações)',                                              territorio: 'brasil', letra: 'h' },
]

export const DIREITOS_EXTERIOR: DireitoItem[] = [
  { codigo: 'ext_grafica',      label: 'Reprodução Gráfica (Edição)',                                                     territorio: 'exterior', letra: 'a' },
  { codigo: 'ext_fonomec',      label: 'Reprodução Fonomecânica (venda e locação de gravações)',                          territorio: 'exterior', letra: 'b' },
  { codigo: 'ext_audiovisual',  label: 'Inclusão e Adaptação em Produções Audiovisuais',                                  territorio: 'exterior', letra: 'c' },
  { codigo: 'ext_publicitaria', label: 'Inclusão em Produções Publicitárias, Gráficas, Sonoras ou Audiovisuais',          territorio: 'exterior', letra: 'd' },
  { codigo: 'ext_digital',      label: 'Distribuição via Meios Óticos, Cabo, Satélites, Redes e Computadores',            territorio: 'exterior', letra: 'e' },
  { codigo: 'ext_base_dados',   label: 'Inclusão em Base de Dados ou Qualquer Forma de Armazenamento',                    territorio: 'exterior', letra: 'f' },
  { codigo: 'ext_comunicacao',  label: 'Comunicação ao Público',                                                          territorio: 'exterior', letra: 'g' },
]

export const TODOS_DIREITOS = [...DIREITOS_BRASIL, ...DIREITOS_EXTERIOR]

export interface DireitoContrato {
  codigo: string
  ativo: boolean
  percentual_autor: number
  percentual_editora: number
}

function direitos_padrao_br(pAutor: number, pEditora: number): DireitoContrato[] {
  return DIREITOS_BRASIL.map(d => ({ codigo: d.codigo, ativo: true, percentual_autor: pAutor, percentual_editora: pEditora }))
}
function direitos_padrao_ext(pAutor: number, pEditora: number): DireitoContrato[] {
  return DIREITOS_EXTERIOR.map(d => ({ codigo: d.codigo, ativo: true, percentual_autor: pAutor, percentual_editora: pEditora }))
}

// ── Definições dos tipos de contrato ─────────────────────────
export interface TipoContratoMeta {
  value: TipoContrato
  label: string
  sigla: string
  cor: string
  icone: 'cessao' | 'total' | 'lic' | 'adm' | 'coed' | 'sub' | 'intl' | 'pj' | 'pf' | 'excl'
  descricao: string
  tem_cessionario: boolean
  tipo_cessionario?: 'PF' | 'PJ'
  controla_exterior: boolean
  altera_recebedor: boolean
  imposto: string
}

export const TIPOS_META: TipoContratoMeta[] = [
  {
    value: 'cessao_parcial',
    label: 'Cessão de Obras',
    sigla: 'CDO',
    cor: 'violet',
    icone: 'cessao',
    descricao: 'Titular cede parte dos direitos patrimoniais. Editora administra, exporta, recebe e licencia somente a parte cedida.',
    tem_cessionario: false,
    controla_exterior: false,
    altera_recebedor: false,
    imposto: '',
  },
  {
    value: 'licenciamento',
    label: 'Contrato de Licenciamento',
    sigla: 'LIC',
    cor: 'amber',
    icone: 'lic',
    descricao: 'Titular transfere parcial ou integralmente os direitos POR UM PERÍODO. Editora controla, recebe, licencia e paga ao licenciado.',
    tem_cessionario: false,
    controla_exterior: true,
    altera_recebedor: false,
    imposto: '',
  },
  {
    value: 'administracao_editorial',
    label: 'Administração Editorial',
    sigla: 'ADE',
    cor: 'blue',
    icone: 'adm',
    descricao: 'Editora administra catálogo de outra editora (opera, exporta, cobra, licencia, distribui) SEM ser proprietária originária.',
    tem_cessionario: false,
    controla_exterior: false,
    altera_recebedor: false,
    imposto: '',
  },
  {
    value: 'coeditorial',
    label: 'Coedição',
    sigla: 'COE',
    cor: 'indigo',
    icone: 'coed',
    descricao: 'Duas editoras dividem controle editorial. Cada uma controla, recebe, exporta e licencia conforme percentual. NÃO é administração.',
    tem_cessionario: false,
    controla_exterior: true,
    altera_recebedor: false,
    imposto: '',
  },
  {
    value: 'subedicao',
    label: 'Subedição',
    sigla: 'SUB',
    cor: 'cyan',
    icone: 'sub',
    descricao: 'Editora representa outra em determinado território (cobra, licencia, recebe, repassa). Controle territorial com comissão e prazo.',
    tem_cessionario: false,
    controla_exterior: true,
    altera_recebedor: false,
    imposto: '',
  },
  {
    value: 'cessao_internacional',
    label: 'Cessão Internacional',
    sigla: 'CIN',
    cor: 'emerald',
    icone: 'intl',
    descricao: 'Cessão específica para exploração internacional (mundo ou territórios específicos). Separa controle Brasil / Exterior.',
    tem_cessionario: false,
    controla_exterior: true,
    altera_recebedor: false,
    imposto: '',
  },
  {
    value: 'cessao_cessionario_pj',
    label: 'Cessão para Cessionário PJ',
    sigla: 'CPJ',
    cor: 'orange',
    icone: 'pj',
    descricao: 'Titular transfere direitos para empresa própria (PJ). Autor continua criador/ECAD/CWR. RECEBEDOR FINANCEIRO muda para PJ. SEM IRPF.',
    tem_cessionario: true,
    tipo_cessionario: 'PJ',
    controla_exterior: false,
    altera_recebedor: true,
    imposto: 'Sem IRPF (natureza PJ)',
  },
  {
    value: 'cessao_cessionario_pf',
    label: 'Cessão para Cessionário PF',
    sigla: 'CPF',
    cor: 'rose',
    icone: 'pf',
    descricao: 'Titular transfere direitos para outra pessoa física. Autor continua criador/ECAD/CWR. RECEBEDOR FINANCEIRO muda para terceiro PF. INCIDE IRPF.',
    tem_cessionario: true,
    tipo_cessionario: 'PF',
    controla_exterior: false,
    altera_recebedor: true,
    imposto: 'Incide IRPF (natureza PF)',
  },
  {
    value: 'licenciamento_licenciante_pj',
    label: 'Licenciamento para Licenciante PJ',
    sigla: 'LPJ',
    cor: 'teal',
    icone: 'pj',
    descricao: 'Titular licencia direitos para empresa (PJ) por prazo determinado. Autor continua criador/ECAD/CWR. RECEBEDOR FINANCEIRO muda para PJ por tempo limitado. SEM IRPF.',
    tem_cessionario: true,
    tipo_cessionario: 'PJ',
    controla_exterior: false,
    altera_recebedor: true,
    imposto: 'Sem IRPF (natureza PJ)',
  },
  {
    value: 'licenciamento_licenciante_pf',
    label: 'Licenciamento para Licenciante PF',
    sigla: 'LPF',
    cor: 'pink',
    icone: 'pf',
    descricao: 'Titular licencia direitos para outra pessoa física por prazo determinado. Autor continua criador/ECAD/CWR. RECEBEDOR FINANCEIRO muda para terceiro PF por tempo limitado. INCIDE IRPF.',
    tem_cessionario: true,
    tipo_cessionario: 'PF',
    controla_exterior: false,
    altera_recebedor: true,
    imposto: 'Incide IRPF (natureza PF)',
  },
  {
    value: 'exclusividade',
    label: 'Exclusividade Autor × Editora',
    sigla: 'EXC',
    cor: 'slate',
    icone: 'excl',
    descricao: 'Autor só pode cadastrar obras pela editora durante determinado período. Sistema bloqueia ou alerta vínculo com outra editora.',
    tem_cessionario: false,
    controla_exterior: false,
    altera_recebedor: false,
    imposto: '',
  },
]

const COR_CLASSES: Record<string, { badge: string; dot: string; ring: string }> = {
  violet:  { badge: 'bg-violet-500/10 text-violet-300 border-violet-500/20',  dot: 'bg-violet-400',  ring: 'ring-violet-500/30' },
  red:     { badge: 'bg-red-500/10 text-red-300 border-red-500/20',           dot: 'bg-red-400',     ring: 'ring-red-500/30' },
  amber:   { badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',     dot: 'bg-amber-400',   ring: 'ring-amber-500/30' },
  blue:    { badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',        dot: 'bg-blue-400',    ring: 'ring-blue-500/30' },
  indigo:  { badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',  dot: 'bg-indigo-400',  ring: 'ring-indigo-500/30' },
  cyan:    { badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',        dot: 'bg-cyan-400',    ring: 'ring-cyan-500/30' },
  emerald: { badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', dot: 'bg-emerald-400', ring: 'ring-emerald-500/30' },
  orange:  { badge: 'bg-orange-500/10 text-orange-300 border-orange-500/20',  dot: 'bg-orange-400',  ring: 'ring-orange-500/30' },
  rose:    { badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',        dot: 'bg-rose-400',    ring: 'ring-rose-500/30' },
  teal:    { badge: 'bg-teal-500/10 text-teal-300 border-teal-500/20',        dot: 'bg-teal-400',    ring: 'ring-teal-500/30' },
  pink:    { badge: 'bg-pink-500/10 text-pink-300 border-pink-500/20',        dot: 'bg-pink-400',    ring: 'ring-pink-500/30' },
  slate:   { badge: 'bg-white/5 text-white/40 border-white/10',               dot: 'bg-white/30',    ring: 'ring-white/10' },
}

// ── Interface principal ──────────────────────────────────────
export interface ContratoTipo {
  id: string
  codigo: string
  nome: string
  tipo: TipoContrato
  descricao: string
  tipo_titular: 'PF' | 'PJ' | 'ambos'

  // Partes
  cessionario_nome: string
  cessionario_cpf_cnpj: string

  // Coeditora
  coeditora_nome: string
  coeditora_percentual: number

  // Subedição / Internacional
  territorio: 'brasil' | 'exterior' | 'mundial' | 'especifico'
  territorios_especificos: string
  comissao_subeditor: number

  // Vigência
  vigencia_tipo: 'determinado' | 'indeterminado'
  vigencia_meses: number | null
  data_inicio: string
  data_termino: string        // obrigatório para LIC, LPJ, LPF — opcional para demais
  renovacao_automatica: boolean
  alerta_antecedencia_dias: number

  // Exclusividade
  tem_exclusividade: boolean

  // Percentuais padrão (usados para pré-preencher tabela de direitos)
  pct_autor_br: number
  pct_editora_br: number
  pct_autor_ext: number
  pct_editora_ext: number

  // Direitos granulares
  direitos: DireitoContrato[]

  // Administração
  editora_original: string

  // Arquivo modelo
  arquivo_nome: string
  arquivo_tipo: string
  arquivo_tamanho: number
  arquivo_base64: string

  ativo: boolean
  created_at: string
  updated_at: string
}

// ── Helpers ──────────────────────────────────────────────────
const card = 'bg-white/[0.03] border border-white/[0.07] rounded-2xl'
const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all uppercase'
const inputLoCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all'
const labelCls = 'text-xs font-medium text-white/40 mb-1 block'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>
}

function TipoBadge({ tipo }: { tipo: TipoContrato }) {
  const meta = TIPOS_META.find(t => t.value === tipo)
  if (!meta) return null
  const c = COR_CLASSES[meta.cor] ?? COR_CLASSES.slate
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>
      {meta.sigla}
    </span>
  )
}

function gerarCodigo(lista: ContratoTipo[], tipo: TipoContrato) {
  const meta = TIPOS_META.find(t => t.value === tipo)
  const prefixo = meta?.sigla ?? 'CT'
  const existentes = lista.map(c => c.codigo)
  let i = lista.length + 1
  let cod = ''
  do {
    cod = `${prefixo}${String(i).padStart(3, '0')}`
    i++
  } while (existentes.includes(cod))
  return cod
}

function direitos_iniciais(): DireitoContrato[] {
  return [
    ...direitos_padrao_br(75, 25),
    ...direitos_padrao_ext(50, 50),
  ]
}

const EMPTY_FORM: Omit<ContratoTipo, 'id' | 'created_at' | 'updated_at'> = {
  codigo: '',
  nome: '',
  tipo: 'cessao_parcial',
  descricao: '',
  tipo_titular: 'ambos',
  cessionario_nome: '',
  cessionario_cpf_cnpj: '',
  coeditora_nome: '',
  coeditora_percentual: 50,
  territorio: 'brasil',
  territorios_especificos: '',
  comissao_subeditor: 20,
  vigencia_tipo: 'indeterminado',
  vigencia_meses: null,
  data_inicio: '',
  data_termino: '',
  renovacao_automatica: false,
  alerta_antecedencia_dias: 90,
  tem_exclusividade: false,
  pct_autor_br: 75,
  pct_editora_br: 25,
  pct_autor_ext: 50,
  pct_editora_ext: 50,
  direitos: direitos_iniciais(),
  editora_original: '',
  arquivo_nome: '',
  arquivo_tipo: '',
  arquivo_tamanho: 0,
  arquivo_base64: '',
  ativo: true,
}

// ── Mocks ─────────────────────────────────────────────────────
const MOCKS: ContratoTipo[] = [
  {
    id: 'CT-01', codigo: 'CDO001', nome: 'CESSÃO DE OBRAS PADRÃO - PF',
    tipo: 'cessao_parcial', descricao: 'Modelo padrão de cessão parcial de direitos para pessoa física. Percentual negociável.',
    tipo_titular: 'PF', cessionario_nome: '', cessionario_cpf_cnpj: '',
    coeditora_nome: '', coeditora_percentual: 50,
    territorio: 'brasil', territorios_especificos: '', comissao_subeditor: 0,
    vigencia_tipo: 'indeterminado', vigencia_meses: null, data_inicio: '', data_termino: '',
    renovacao_automatica: false, alerta_antecedencia_dias: 90,
    tem_exclusividade: false,
    pct_autor_br: 75, pct_editora_br: 25, pct_autor_ext: 50, pct_editora_ext: 50,
    direitos: direitos_iniciais(), editora_original: '',
    arquivo_nome: '', arquivo_tipo: '', arquivo_tamanho: 0, arquivo_base64: '',
    ativo: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'CT-02', codigo: 'ADE001', nome: 'ADMINISTRAÇÃO EDITORIAL PADRÃO',
    tipo: 'administracao_editorial', descricao: 'Modelo de administração editorial sem transferência de propriedade.',
    tipo_titular: 'ambos', cessionario_nome: '', cessionario_cpf_cnpj: '',
    coeditora_nome: '', coeditora_percentual: 50,
    territorio: 'mundial', territorios_especificos: '', comissao_subeditor: 0,
    vigencia_tipo: 'determinado', vigencia_meses: 36, data_inicio: '', data_termino: '',
    renovacao_automatica: true, alerta_antecedencia_dias: 60,
    tem_exclusividade: false,
    pct_autor_br: 80, pct_editora_br: 20, pct_autor_ext: 60, pct_editora_ext: 40,
    direitos: direitos_iniciais(), editora_original: '',
    arquivo_nome: '', arquivo_tipo: '', arquivo_tamanho: 0, arquivo_base64: '',
    ativo: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'CT-03', codigo: 'CPJ001', nome: 'CESSÃO PARA CESSIONÁRIO PJ',
    tipo: 'cessao_cessionario_pj', descricao: 'Cessão de recebimento financeiro para pessoa jurídica do titular.',
    tipo_titular: 'PF', cessionario_nome: '', cessionario_cpf_cnpj: '',
    coeditora_nome: '', coeditora_percentual: 0,
    territorio: 'brasil', territorios_especificos: '', comissao_subeditor: 0,
    vigencia_tipo: 'indeterminado', vigencia_meses: null, data_inicio: '', data_termino: '',
    renovacao_automatica: false, alerta_antecedencia_dias: 90,
    tem_exclusividade: false,
    pct_autor_br: 100, pct_editora_br: 0, pct_autor_ext: 100, pct_editora_ext: 0,
    direitos: direitos_iniciais(), editora_original: '',
    arquivo_nome: '', arquivo_tipo: '', arquivo_tamanho: 0, arquivo_base64: '',
    ativo: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]

// ── Aba de Tabela de Direitos ────────────────────────────────
function TabelaDireitos({
  direitos, onChange,
}: {
  direitos: DireitoContrato[]
  onChange: (d: DireitoContrato[]) => void
}) {
  function set(codigo: string, key: keyof DireitoContrato, val: boolean | number) {
    onChange(direitos.map(d => d.codigo === codigo ? { ...d, [key]: val } : d))
  }

  function setAll(territorio: 'brasil' | 'exterior', key: 'percentual_autor' | 'percentual_editora', val: number) {
    const oposto: typeof key = key === 'percentual_autor' ? 'percentual_editora' : 'percentual_autor'
    const codigos = (territorio === 'brasil' ? DIREITOS_BRASIL : DIREITOS_EXTERIOR).map(d => d.codigo)
    onChange(direitos.map(d => codigos.includes(d.codigo) ? { ...d, [key]: val, [oposto]: 100 - val } : d))
  }

  function renderBloco(titulo: string, itens: DireitoItem[], territorio: 'brasil' | 'exterior') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
            {territorio === 'brasil' ? <MapPin className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {titulo}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/20">Definir todos:</span>
            {[100, 75, 50, 25, 0].map(v => (
              <button key={v} onClick={() => setAll(territorio, 'percentual_autor', v)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-violet-500/20 text-white/40 hover:text-violet-300 transition-all">
                {v}% autor
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/[0.06]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-3 py-2 text-[10px] text-white/30 font-medium w-6">#</th>
                <th className="text-left px-3 py-2 text-[10px] text-white/30 font-medium">Direito</th>
                <th className="text-center px-3 py-2 text-[10px] text-white/30 font-medium w-20">Ativo</th>
                <th className="text-center px-3 py-2 text-[10px] text-white/30 font-medium w-28">% Autor</th>
                <th className="text-center px-3 py-2 text-[10px] text-white/30 font-medium w-28">% Editora</th>
                <th className="text-center px-3 py-2 text-[10px] text-white/30 font-medium w-20">Soma</th>
              </tr>
            </thead>
            <tbody>
              {itens.map(item => {
                const d = direitos.find(x => x.codigo === item.codigo)
                if (!d) return null
                const soma = d.percentual_autor + d.percentual_editora
                const ok = soma === 100
                return (
                  <tr key={item.codigo} className={`border-b border-white/[0.04] transition-colors ${d.ativo ? '' : 'opacity-40'}`}>
                    <td className="px-3 py-2 text-white/20 font-mono">{item.letra.toUpperCase()}</td>
                    <td className="px-3 py-2 text-white/60 leading-snug">{item.label}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => set(item.codigo, 'ativo', !d.ativo)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center mx-auto transition-all ${d.ativo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                        {d.ativo ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} max={100} value={d.percentual_autor} disabled={!d.ativo}
                          onChange={e => set(item.codigo, 'percentual_autor', Number(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-white/70 focus:outline-none focus:ring-1 focus:ring-violet-500/40 disabled:opacity-30" />
                        <span className="text-white/20 text-[10px]">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} max={100} value={d.percentual_editora} disabled={!d.ativo}
                          onChange={e => set(item.codigo, 'percentual_editora', Number(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-white/70 focus:outline-none focus:ring-1 focus:ring-violet-500/40 disabled:opacity-30" />
                        <span className="text-white/20 text-[10px]">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[10px] font-bold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{soma}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-white/20">* Percentuais de cada direito devem somar 100%</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderBloco('Direitos no Brasil', DIREITOS_BRASIL, 'brasil')}
      {renderBloco('Direitos no Exterior', DIREITOS_EXTERIOR, 'exterior')}
    </div>
  )
}

// ── Formulário principal ─────────────────────────────────────
function ContratoForm({
  form, setForm, editandoId, onSalvar, onCancelar, contratos,
}: {
  form: typeof EMPTY_FORM
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>
  editandoId: string | null
  onSalvar: () => void
  onCancelar: () => void
  contratos: ContratoTipo[]
}) {
  const [aba, setAba] = useState<'geral' | 'direitos' | 'clausulas'>('geral')
  const meta = TIPOS_META.find(t => t.value === form.tipo)

  function upd<K extends keyof typeof EMPTY_FORM>(key: K, val: (typeof EMPTY_FORM)[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function onTipoChange(tipo: TipoContrato) {
    const cod = gerarCodigo(contratos, tipo)
    // Licenciamentos sempre têm prazo determinado
    const forcaDeterminado = ['licenciamento_licenciante_pj', 'licenciamento_licenciante_pf', 'licenciamento'].includes(tipo)
    setForm(prev => ({
      ...prev,
      tipo,
      codigo: editandoId ? prev.codigo : cod,
      vigencia_tipo: forcaDeterminado ? 'determinado' : prev.vigencia_tipo,
    }))
  }

  const abas: { id: 'geral' | 'direitos' | 'clausulas'; label: string }[] = [
    { id: 'geral', label: 'Identificação' },
    { id: 'direitos', label: 'Tabela de Direitos' },
    { id: 'clausulas', label: 'Observações' },
  ]

  return (
    <div className={`${card} border-violet-500/20 overflow-hidden`}>
      {/* Header do form */}
      <div className="px-6 pt-5 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <FilePlus className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{editandoId ? 'Editar Contrato-Tipo' : 'Novo Contrato-Tipo'}</h2>
            {meta && <p className="text-[10px] text-white/30">{meta.label}</p>}
          </div>
        </div>
        <button onClick={onCancelar} className="text-white/30 hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>
      </div>

      {/* Abas */}
      <div className="px-6 pt-4 flex gap-1 border-b border-white/[0.06]">
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-all ${aba === a.id ? 'text-violet-300 border-b-2 border-violet-400 -mb-px' : 'text-white/30 hover:text-white/60'}`}>
            {a.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-5">
        {/* ── Aba Identificação ── */}
        {aba === 'geral' && (
          <div className="space-y-5">
            {/* Tipo de Contrato */}
            <Field label="Tipo de Contrato *">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {TIPOS_META.map(t => {
                  const c = COR_CLASSES[t.cor]
                  const sel = form.tipo === t.value
                  return (
                    <button key={t.value} onClick={() => onTipoChange(t.value)}
                      className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${sel ? `${c.badge} border-current ring-1 ${c.ring}` : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20 text-white/40'}`}>
                      <span className={`text-[10px] font-bold leading-tight ${sel ? '' : 'text-white/70'}`}>{t.label}</span>
                      <span className={`text-[9px] font-mono ${sel ? 'opacity-50' : 'text-white/20'}`}>{t.sigla}</span>
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Box de conceito */}
            {meta && (
              <div className="flex gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <Info className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-white/50">{meta.descricao}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {meta.controla_exterior && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1"><Globe className="w-3 h-3" /> Controla Exterior</span>}
                    {meta.altera_recebedor && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Altera Recebedor</span>}
                    {meta.imposto && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">{meta.imposto}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Identificação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Código">
                <input className={inputCls} value={form.codigo} onChange={e => upd('codigo', e.target.value.toUpperCase())} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Nome do Modelo *">
                  <input className={inputCls} placeholder="EX: CESSÃO PARCIAL 25% - PESSOA FÍSICA"
                    value={form.nome} onChange={e => upd('nome', e.target.value.toUpperCase())} />
                </Field>
              </div>
              <Field label="Aplicável para">
                <select className={inputCls} value={form.tipo_titular} onChange={e => upd('tipo_titular', e.target.value as 'PF' | 'PJ' | 'ambos')}>
                  <option value="ambos">PF e PJ</option>
                  <option value="PF">Apenas Pessoa Física</option>
                  <option value="PJ">Apenas Pessoa Jurídica</option>
                </select>
              </Field>
              <Field label="Status">
                <select className={inputCls} value={form.ativo ? 'ativo' : 'inativo'} onChange={e => upd('ativo', e.target.value === 'ativo')}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </Field>
            </div>

            {/* Cessionário / Licenciante (CPJ / CPF / LPJ / LPF) */}
            {meta?.tem_cessionario && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/15">
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    {['licenciamento_licenciante_pj','licenciamento_licenciante_pf'].includes(form.tipo)
                      ? `Dados do Licenciante (${meta.tipo_cessionario}) — Prazo Determinado`
                      : `Dados do Cessionário (${meta.tipo_cessionario})`}
                  </p>
                  <p className="text-[10px] text-white/30">
                    O autor continua criador da obra. O {['licenciamento_licenciante_pj','licenciamento_licenciante_pf'].includes(form.tipo) ? 'licenciante' : 'cessionário'} passa a ser o RECEBEDOR FINANCEIRO.
                  </p>
                </div>
                <Field label={`Nome do ${['licenciamento_licenciante_pj','licenciamento_licenciante_pf'].includes(form.tipo) ? 'Licenciante' : 'Cessionário'} ${meta.tipo_cessionario}`}>
                  <input className={inputCls}
                    placeholder={meta.tipo_cessionario === 'PJ' ? 'RAZÃO SOCIAL DA EMPRESA' : 'NOME COMPLETO'}
                    value={form.cessionario_nome} onChange={e => upd('cessionario_nome', e.target.value.toUpperCase())} />
                </Field>
                <Field label={meta.tipo_cessionario === 'PJ' ? 'CNPJ' : 'CPF'}>
                  <input className={inputCls}
                    placeholder={meta.tipo_cessionario === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                    value={form.cessionario_cpf_cnpj} onChange={e => upd('cessionario_cpf_cnpj', e.target.value)} />
                </Field>
              </div>
            )}

            {/* Administração Editorial */}
            {form.tipo === 'administracao_editorial' && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Editora Administrada (Proprietária Original)
                </p>
                <Field label="Nome da Editora Original / Administrada">
                  <input className={inputCls} placeholder="EX: EDI MUSIC"
                    value={form.editora_original} onChange={e => upd('editora_original', e.target.value.toUpperCase())} />
                </Field>
              </div>
            )}

            {/* Coedição */}
            {form.tipo === 'coeditorial' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Dados da Coeditora
                  </p>
                  <p className="text-[10px] text-white/30">Coedição NÃO é administração — ambas possuem participação editorial.</p>
                </div>
                <Field label="Nome da Coeditora">
                  <input className={inputCls} placeholder="EX: UNIVERSAL MUSIC PUBLISHING"
                    value={form.coeditora_nome} onChange={e => upd('coeditora_nome', e.target.value.toUpperCase())} />
                </Field>
                <Field label="Participação da Coeditora (%)">
                  <input type="number" min={0} max={100} className={inputCls}
                    value={form.coeditora_percentual} onChange={e => upd('coeditora_percentual', Number(e.target.value))} />
                </Field>
              </div>
            )}

            {/* Território (Subedição / Internacional / Total / Lic) */}
            {['subedicao', 'cessao_internacional', 'licenciamento', 'coeditorial'].includes(form.tipo) && (
              <div className="space-y-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Território de Atuação
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { v: 'brasil', l: 'Brasil' },
                    { v: 'exterior', l: 'Exterior' },
                    { v: 'mundial', l: 'Mundial' },
                    { v: 'especifico', l: 'Específico' },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => upd('territorio', opt.v as typeof form.territorio)}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${form.territorio === opt.v ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:border-white/20'}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
                {form.territorio === 'especifico' && (
                  <Field label="Territórios Específicos (separe por vírgula)">
                    <input className={inputLoCls} placeholder="EX: ESTADOS UNIDOS, REINO UNIDO, ALEMANHA"
                      value={form.territorios_especificos} onChange={e => upd('territorios_especificos', e.target.value.toUpperCase())} />
                  </Field>
                )}
                {form.tipo === 'subedicao' && (
                  <Field label="Comissão do Subeditor (%)">
                    <input type="number" min={0} max={100} className={inputCls}
                      value={form.comissao_subeditor} onChange={e => upd('comissao_subeditor', Number(e.target.value))} />
                  </Field>
                )}
              </div>
            )}

            {/* Vigência */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-white/[0.01] border border-white/[0.05]">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest md:col-span-3 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Vigência e Renovação
              </p>

              {/* Data de Início — sempre obrigatória */}
              <Field label="Data de Início *">
                <input type="date" className={inputCls}
                  value={form.data_inicio}
                  onChange={e => {
                    const ini = e.target.value
                    // Recalcula data_termino se tiver meses definidos
                    let term = form.data_termino
                    if (ini && form.vigencia_meses) {
                      const d = new Date(ini)
                      d.setMonth(d.getMonth() + form.vigencia_meses)
                      term = d.toISOString().split('T')[0]
                    }
                    setForm(prev => ({ ...prev, data_inicio: ini, data_termino: term }))
                  }} />
              </Field>

              {/* Data de Término */}
              <Field label={
                ['licenciamento', 'licenciamento_licenciante_pj', 'licenciamento_licenciante_pf'].includes(form.tipo)
                  ? 'Data de Término * (obrigatória)'
                  : 'Data de Término (opcional)'
              }>
                <input type="date" className={`${inputCls} ${
                  ['licenciamento', 'licenciamento_licenciante_pj', 'licenciamento_licenciante_pf'].includes(form.tipo) && !form.data_termino
                    ? 'border-amber-500/50 ring-1 ring-amber-500/30'
                    : ''
                }`}
                  value={form.data_termino}
                  onChange={e => upd('data_termino', e.target.value)} />
              </Field>

              <Field label="Tipo de Vigência">
                <select className={inputCls} value={form.vigencia_tipo}
                  onChange={e => upd('vigencia_tipo', e.target.value as 'determinado' | 'indeterminado')}>
                  <option value="indeterminado">Prazo Indeterminado</option>
                  <option value="determinado">Prazo Determinado</option>
                </select>
              </Field>

              {form.vigencia_tipo === 'determinado' && (
                <Field label="Duração (meses)">
                  <input type="number" min={1} className={inputCls} placeholder="EX: 60"
                    value={form.vigencia_meses ?? ''}
                    onChange={e => {
                      const meses = e.target.value ? Number(e.target.value) : null
                      let term = form.data_termino
                      if (meses && form.data_inicio) {
                        const d = new Date(form.data_inicio)
                        d.setMonth(d.getMonth() + meses)
                        term = d.toISOString().split('T')[0]
                      }
                      setForm(prev => ({ ...prev, vigencia_meses: meses, data_termino: term }))
                    }} />
                </Field>
              )}

              <Field label="Renovação Automática">
                <select className={inputCls} value={form.renovacao_automatica ? 'sim' : 'nao'}
                  onChange={e => upd('renovacao_automatica', e.target.value === 'sim')}>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </Field>

              <Field label="Alertar antes do vencimento (dias)">
                <input type="number" min={0} className={inputCls}
                  value={form.alerta_antecedencia_dias}
                  onChange={e => upd('alerta_antecedencia_dias', Number(e.target.value))} />
              </Field>

              {/* Aviso: direitos voltam ao cedente */}
              {form.data_termino && (
                <div className="md:col-span-3 flex gap-2 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-200/60 leading-relaxed">
                    <strong className="text-amber-300">Regra de vencimento:</strong> ao término em{' '}
                    <strong className="text-amber-300">
                      {new Date(form.data_termino + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </strong>
                    , todos os direitos negociados retornam automaticamente ao cedente (autor ou editora).
                    O sistema bloqueará novos pagamentos ao cessionário/licenciante e alertará os colaboradores com{' '}
                    <strong className="text-amber-300">{form.alerta_antecedencia_dias} dias</strong> de antecedência.
                  </p>
                </div>
              )}
            </div>

            {/* Exclusividade */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.01] border border-white/[0.05]">
              <button onClick={() => upd('tem_exclusividade', !form.tem_exclusividade)}
                className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${form.tem_exclusividade ? 'bg-violet-500' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-all ${form.tem_exclusividade ? 'translate-x-4' : ''}`} />
              </button>
              <div>
                <p className="text-xs font-medium text-white/60">Contém Cláusula de Exclusividade</p>
                <p className="text-[10px] text-white/25">Bloqueia ou alerta cadastro de obras com outra editora durante a vigência</p>
              </div>
              {form.tem_exclusividade && <Lock className="w-4 h-4 text-violet-400 ml-auto" />}
            </div>
          </div>
        )}

        {/* ── Aba Direitos ── */}
        {aba === 'direitos' && (
          <div className="space-y-4">
            <div className="flex gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/60">
                Os percentuais abaixo são um <strong className="text-amber-300">padrão editorial</strong>, mas podem ser flexibilizados conforme negociação entre autor e editora.
                Cada direito pode ter percentual diferente. Todos os ativos devem somar 100%.
              </p>
            </div>
            <TabelaDireitos direitos={form.direitos} onChange={d => upd('direitos', d)} />
          </div>
        )}

        {/* ── Aba Observações ── */}
        {aba === 'clausulas' && (
          <div className="space-y-4">

            {/* Upload do modelo */}
            <div className="space-y-2">
              <label className={labelCls}>Arquivo Modelo do Contrato (.pdf, .docx, .doc)</label>

              {form.arquivo_nome ? (
                /* Arquivo já anexado */
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-300 truncate">{form.arquivo_nome}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {form.arquivo_tipo} · {form.arquivo_tamanho > 0 ? (form.arquivo_tamanho / 1024 / 1024).toFixed(2) + ' MB' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {form.arquivo_base64 && (
                      <a
                        href={form.arquivo_base64}
                        download={form.arquivo_nome}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-cyan-400 transition-colors"
                        title="Baixar arquivo"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setForm(prev => ({ ...prev, arquivo_nome: '', arquivo_tipo: '', arquivo_tamanho: 0, arquivo_base64: '' }))}
                      className="p-2 rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors"
                      title="Remover arquivo"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Área de drop / clique */
                <label className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 cursor-pointer transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-violet-500/10 flex items-center justify-center transition-all">
                    <Upload className="w-5 h-5 text-white/20 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                      Clique para selecionar o arquivo do modelo
                    </p>
                    <p className="text-[10px] text-white/20 mt-1">PDF, DOCX ou DOC · máx. 10 MB</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 10 * 1024 * 1024) {
                        alert('Arquivo muito grande. Máximo 10 MB.')
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = ev => {
                        setForm(prev => ({
                          ...prev,
                          arquivo_nome: file.name,
                          arquivo_tipo: file.type || 'application/octet-stream',
                          arquivo_tamanho: file.size,
                          arquivo_base64: ev.target?.result as string,
                        }))
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
              )}
              <p className="text-[10px] text-white/20">
                O arquivo ficará salvo vinculado a este modelo e poderá ser baixado a qualquer momento.
                Use os identificadores <span className="font-mono text-violet-300/60">{'{{campo}}'}</span> no documento para preenchimento automático.
              </p>
            </div>

            <Field label="Observações / Cláusulas Especiais">
              <textarea className={inputLoCls + ' h-32 resize-none'} rows={6}
                placeholder="Observações gerais sobre este modelo de contrato, cláusulas especiais, condições de uso, etc."
                value={form.descricao} onChange={e => upd('descricao', e.target.value)} />
            </Field>
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 space-y-2">
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-1">
                <Info className="w-3 h-3" /> Estrutura de Tabelas do Sistema
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {['contratos', 'contratos_partes', 'contratos_direitos', 'contratos_obras', 'contratos_obras_links', 'contratos_obras_links_titulares', 'contratos_assinaturas', 'contratos_recoupment', 'contratos_aditivos', 'contratos_historico'].map(t => (
                  <span key={t} className="text-[10px] font-mono px-2 py-1 rounded-lg bg-blue-500/5 border border-blue-500/15 text-blue-200/50">{t}</span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-3 h-3" /> Assinatura Digital (Integração Futura)
              </p>
              <div className="flex gap-2 flex-wrap">
                {['D4SIGN', 'DocuSign', 'ICP-Brasil'].map(s => (
                  <span key={s} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/30">{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
          <div className="flex gap-1">
            {abas.map((a, i) => (
              <div key={a.id} className={`w-2 h-2 rounded-full transition-all ${aba === a.id ? 'bg-violet-400 w-6' : 'bg-white/10'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancelar}>Cancelar</Button>
            <Button size="sm" onClick={onSalvar}>
              <Save className="w-3.5 h-3.5" /> {editandoId ? 'Atualizar' : 'Criar Modelo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function ContratosTipoPage() {
  const [contratos, setContratos] = useState<ContratoTipo[]>([])
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoContrato | ''>('')
  const [filtroStatus, setFiltroStatus] = useState<'ativo' | 'inativo' | ''>('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [mostraForm, setMostraForm] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' }>({ msg: '', tipo: 'ok' })

  useEffect(() => {
    try {
      const s = localStorage.getItem('sync_contratos_tipo_v2')
      setContratos(s ? JSON.parse(s) : MOCKS)
    } catch { setContratos(MOCKS) }
  }, [])

  useEffect(() => {
    if (toast.msg) { const t = setTimeout(() => setToast({ msg: '', tipo: 'ok' }), 3500); return () => clearTimeout(t) }
  }, [toast])

  function persistir(lista: ContratoTipo[]) {
    setContratos(lista)
    localStorage.setItem('sync_contratos_tipo_v2', JSON.stringify(lista))
  }

  function abrirNovo() {
    const tipo: TipoContrato = 'cessao_parcial'
    const codigo = gerarCodigo(contratos, tipo)
    setForm({ ...EMPTY_FORM, codigo, direitos: direitos_iniciais() })
    setEditandoId(null)
    setMostraForm(true)
    setExpandido(null)
  }

  function abrirEditar(c: ContratoTipo) {
    const { id, created_at, updated_at, ...rest } = c
    setForm(rest)
    setEditandoId(id)
    setMostraForm(true)
    setExpandido(null)
  }

  function duplicar(c: ContratoTipo) {
    const codigo = gerarCodigo(contratos, c.tipo)
    const novo: ContratoTipo = {
      ...c, id: 'CT-' + Date.now(), codigo,
      nome: c.nome + ' (CÓPIA)',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    persistir([...contratos, novo])
    setToast({ msg: `"${novo.nome}" duplicado.`, tipo: 'ok' })
  }

  function remover(id: string) {
    persistir(contratos.filter(c => c.id !== id))
    setToast({ msg: 'Modelo removido.', tipo: 'ok' })
  }

  function toggleAtivo(id: string) {
    persistir(contratos.map(c => c.id === id ? { ...c, ativo: !c.ativo, updated_at: new Date().toISOString() } : c))
  }

  function salvarForm() {
    if (!form.nome.trim()) { setToast({ msg: 'Informe o nome do modelo.', tipo: 'err' }); return }
    const codigoConflito = contratos.find(c => c.codigo === form.codigo && c.id !== editandoId)
    if (codigoConflito) { setToast({ msg: `Código "${form.codigo}" já existe.`, tipo: 'err' }); return }
    if (editandoId) {
      persistir(contratos.map(c => c.id === editandoId ? { ...c, ...form, updated_at: new Date().toISOString() } : c))
      setToast({ msg: 'Modelo atualizado.', tipo: 'ok' })
    } else {
      const novo: ContratoTipo = { ...form, id: 'CT-' + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      persistir([...contratos, novo])
      setToast({ msg: 'Novo modelo criado.', tipo: 'ok' })
    }
    setMostraForm(false); setEditandoId(null)
  }

  const filtrados = contratos.filter(c => {
    const q = busca.toLowerCase()
    const mb = !q || c.nome.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q)
    const mt = !filtroTipo || c.tipo === filtroTipo
    const ms = !filtroStatus || (filtroStatus === 'ativo' ? c.ativo : !c.ativo)
    return mb && mt && ms
  })

  const kpis = {
    total: contratos.length,
    ativos: contratos.filter(c => c.ativo).length,
    comExclusividade: contratos.filter(c => c.tem_exclusividade).length,
    alteraRecebedor: contratos.filter(c => TIPOS_META.find(t => t.value === c.tipo)?.altera_recebedor).length,
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toast.msg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl transition-all ${toast.tipo === 'ok' ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-red-500/15 border-red-500/30'}`}>
          {toast.tipo === 'ok' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
          <span className={`text-sm ${toast.tipo === 'ok' ? 'text-emerald-300' : 'text-red-300'}`}>{toast.msg}</span>
          <button onClick={() => setToast({ msg: '', tipo: 'ok' })}><X className="w-3.5 h-3.5 text-white/30" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-violet-400" /> Contratos-Tipo
          </h1>
          <p className="text-sm text-white/40 mt-0.5">Biblioteca de modelos jurídicos reutilizáveis — 9 tipos de contrato editorial</p>
        </div>
        <Button size="sm" onClick={abrirNovo}><Plus className="w-4 h-4" /> Novo Modelo</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${card} p-4`}>
          <p className="text-xs text-white/40">Total de Modelos</p>
          <p className="text-2xl font-bold text-white mt-1">{kpis.total}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs text-white/40">Ativos</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{kpis.ativos}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs text-white/40">Com Exclusividade</p>
          <p className="text-2xl font-bold text-violet-400 mt-1 flex items-center gap-1">{kpis.comExclusividade} <Lock className="w-4 h-4" /></p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs text-white/40">Altera Recebedor</p>
          <p className="text-2xl font-bold text-orange-400 mt-1 flex items-center gap-1">{kpis.alteraRecebedor} <UserCheck className="w-4 h-4" /></p>
        </div>
      </div>

      {/* Legenda dos tipos */}
      <div className={`${card} p-4`}>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Tipos Disponíveis</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {TIPOS_META.map(t => {
            const c = COR_CLASSES[t.cor]
            const count = contratos.filter(x => x.tipo === t.value).length
            return (
              <button key={t.value} onClick={() => setFiltroTipo(filtroTipo === t.value ? '' : t.value)}
                className={`flex flex-col gap-1 p-2.5 rounded-xl border text-left transition-all ${filtroTipo === t.value ? `${c.badge} ring-1 ${c.ring}` : filtroTipo ? 'opacity-30 bg-white/[0.01] border-white/[0.05]' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold leading-tight ${filtroTipo === t.value ? '' : 'text-white/70'}`}>{t.label}</span>
                  <span className="text-[10px] text-white/25">{count}</span>
                </div>
                <span className={`text-[9px] font-mono ${filtroTipo === t.value ? 'opacity-50' : 'text-white/20'}`}>{t.sigla}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Formulário */}
      {mostraForm && (
        <ContratoForm
          form={form} setForm={setForm}
          editandoId={editandoId}
          onSalvar={salvarForm}
          onCancelar={() => { setMostraForm(false); setEditandoId(null) }}
          contratos={contratos}
        />
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/20" />
          <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
            placeholder="Buscar por nome, código..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
          value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as 'ativo' | 'inativo' | '')}>
          <option value="">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
        {(busca || filtroTipo || filtroStatus) && (
          <button onClick={() => { setBusca(''); setFiltroTipo(''); setFiltroStatus('') }}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/40 hover:text-white transition-colors">
            Limpar filtros
          </button>
        )}
      </div>

      <p className="text-xs text-white/30">{filtrados.length} modelo{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}{contratos.length !== filtrados.length && ` (de ${contratos.length} total)`}</p>

      {/* Lista */}
      {filtrados.length === 0 && (
        <div className={`${card} p-10 flex flex-col items-center gap-3 text-center`}>
          <FilePlus className="w-10 h-10 text-white/10" />
          <p className="text-sm text-white/30">Nenhum modelo encontrado.</p>
          <Button size="sm" variant="secondary" onClick={abrirNovo}><Plus className="w-3.5 h-3.5" /> Criar primeiro modelo</Button>
        </div>
      )}

      <div className="space-y-3">
        {filtrados.map(c => {
          const meta = TIPOS_META.find(t => t.value === c.tipo)
          const cor = COR_CLASSES[meta?.cor ?? 'slate']
          const dirBr = c.direitos.filter(d => DIREITOS_BRASIL.find(x => x.codigo === d.codigo) && d.ativo)
          const dirExt = c.direitos.filter(d => DIREITOS_EXTERIOR.find(x => x.codigo === d.codigo) && d.ativo)

          // Cálculo de alerta de vencimento
          const hoje = new Date()
          const dataTermino = c.data_termino ? new Date(c.data_termino + 'T12:00:00') : null
          const diasRestantes = dataTermino ? Math.ceil((dataTermino.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : null
          const vencido = diasRestantes !== null && diasRestantes < 0
          const alertaProximo = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= c.alerta_antecedencia_dias
          const pAutorBr = dirBr.length > 0 ? Math.round(dirBr.reduce((a, x) => a + x.percentual_autor, 0) / dirBr.length) : 0
          const pAutorExt = dirExt.length > 0 ? Math.round(dirExt.reduce((a, x) => a + x.percentual_autor, 0) / dirExt.length) : 0

          return (
            <div key={c.id} className={`${card} overflow-hidden transition-all ${vencido ? 'border-red-500/30' : alertaProximo ? 'border-amber-500/30' : ''}`}>

              {/* Banner de alerta de vencimento */}
              {vencido && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <p className="text-[11px] text-red-300 font-medium">
                    CONTRATO VENCIDO em {dataTermino!.toLocaleDateString('pt-BR')} — direitos retornaram ao cedente.
                    Regularize ou renove.
                  </p>
                </div>
              )}
              {alertaProximo && !vencido && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <p className="text-[11px] text-amber-300 font-medium">
                    Vence em <strong>{diasRestantes} dia{diasRestantes !== 1 ? 's' : ''}</strong> ({dataTermino!.toLocaleDateString('pt-BR')}).
                    Ao vencer, os direitos retornam ao cedente.
                    {c.renovacao_automatica ? ' Renovação automática configurada.' : ' Considere renovar ou encerrar.'}
                  </p>
                </div>
              )}
              <div className="p-4 flex items-center gap-4">
                {/* Dot de cor */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cor.badge} border`}>
                  <span className="text-[10px] font-black">{meta?.sigla}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-white/30">{c.codigo}</span>
                    <p className="text-sm font-semibold text-white truncate">{c.nome}</p>
                    <TipoBadge tipo={c.tipo} />
                    {c.tem_exclusividade && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Exclus.</span>}
                    {meta?.altera_recebedor && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 flex items-center gap-1"><UserCheck className="w-2.5 h-2.5" /> Receb.</span>}
                    {c.arquivo_nome && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1"><Paperclip className="w-2.5 h-2.5" /> Modelo</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-white/30 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> BR: {pAutorBr}% autor / {100 - pAutorBr}% editora
                    </span>
                    {dirExt.length > 0 && (
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> EXT: {pAutorExt}% autor / {100 - pAutorExt}% editora
                      </span>
                    )}
                    <span className="text-xs text-white/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {c.vigencia_tipo === 'indeterminado' ? 'Indeterminado' : `${c.vigencia_meses ?? ''}m${c.renovacao_automatica ? ' · auto' : ''}${c.data_termino ? ' · até ' + new Date(c.data_termino + 'T12:00:00').toLocaleDateString('pt-BR') : ''}`}
                    </span>
                    <span className="text-xs text-white/30">{c.tipo_titular === 'ambos' ? 'PF e PJ' : c.tipo_titular}</span>
                  </div>
                </div>

                {/* Status badge */}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.ativo ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
                  {c.ativo ? 'Ativo' : 'Inativo'}
                </span>

                {/* Ações */}
                <div className="flex gap-1">
                  <button onClick={() => setExpandido(expandido === c.id ? null : c.id)} title="Ver direitos"
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                    {expandido === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => toggleAtivo(c.id)} title={c.ativo ? 'Desativar' : 'Ativar'}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-amber-400 transition-colors">
                    {c.ativo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => abrirEditar(c)} title="Editar"
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => duplicar(c)} title="Duplicar"
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-cyan-400 transition-colors"><Copy className="w-4 h-4" /></button>
                  <button onClick={() => remover(c.id)} title="Remover"
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Expansão: tabela de direitos resumida */}
              {expandido === c.id && (
                <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-4">
                  {/* Cessionário */}
                  {meta?.tem_cessionario && c.cessionario_nome && (
                    <div className="flex items-center gap-2 text-xs">
                      <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-white/40">Cessionário ({meta.tipo_cessionario}):</span>
                      <span className="text-orange-300 font-medium">{c.cessionario_nome}</span>
                      {c.cessionario_cpf_cnpj && <span className="text-white/30">· {c.cessionario_cpf_cnpj}</span>}
                    </div>
                  )}
                  {/* Administração */}
                  {c.tipo === 'administracao_editorial' && c.editora_original && (
                    <div className="flex items-center gap-2 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-white/40">Editora original:</span>
                      <span className="text-blue-300 font-medium">{c.editora_original}</span>
                    </div>
                  )}
                  {/* Coedição */}
                  {c.tipo === 'coeditorial' && c.coeditora_nome && (
                    <div className="flex items-center gap-2 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-white/40">Coeditora:</span>
                      <span className="text-indigo-300 font-medium">{c.coeditora_nome}</span>
                      <span className="text-white/30">({c.coeditora_percentual}%)</span>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { titulo: 'Brasil', itens: DIREITOS_BRASIL },
                      { titulo: 'Exterior', itens: DIREITOS_EXTERIOR },
                    ].map(bloco => (
                      <div key={bloco.titulo}>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1">
                          {bloco.titulo === 'Brasil' ? <MapPin className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          {bloco.titulo}
                        </p>
                        <div className="space-y-1">
                          {bloco.itens.map(item => {
                            const d = c.direitos.find(x => x.codigo === item.codigo)
                            if (!d) return null
                            return (
                              <div key={item.codigo} className={`flex items-center gap-2 text-[11px] ${d.ativo ? '' : 'opacity-30'}`}>
                                <span className="text-white/20 w-4 font-mono">{item.letra.toUpperCase()})</span>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${d.ativo ? 'bg-emerald-400' : 'bg-white/10'}`} />
                                <span className="text-white/40 flex-1 leading-tight">{item.label}</span>
                                {d.ativo && (
                                  <span className="text-white/25 font-mono flex-shrink-0">
                                    {d.percentual_autor}% / {d.percentual_editora}%
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {c.descricao && (
                    <div className="pt-2 border-t border-white/[0.04]">
                      <p className="text-[10px] text-white/25 leading-relaxed">{c.descricao}</p>
                    </div>
                  )}
                  {c.arquivo_nome && (
                    <div className="pt-2 border-t border-white/[0.04] flex items-center gap-3">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-white/40 flex-1 truncate">{c.arquivo_nome}</span>
                      <span className="text-[10px] text-white/20">{c.arquivo_tamanho > 0 ? (c.arquivo_tamanho / 1024 / 1024).toFixed(2) + ' MB' : ''}</span>
                      {c.arquivo_base64 && (
                        <a href={c.arquivo_base64} download={c.arquivo_nome}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 transition-colors">
                          <Download className="w-3 h-3" /> Baixar
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
