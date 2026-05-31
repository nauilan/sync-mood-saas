'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Building2, Save, Plus, Trash2, Users, Settings,
  CreditCard, Check, X, Edit3,
  Mail, Globe,
  Shield,
  ToggleLeft, ToggleRight,
  Music, FileText, ChevronDown, ChevronRight, Mic2, Calendar, Tag, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_EDITORAS } from '@/lib/mock-cadastros'
import { MOCK_OBRAS, MOCK_OBRAS_LINKS, MOCK_OBRAS_FONOGRAMAS } from '@/lib/mock-obras'
import { MOCK_CONTRATOS_V2 } from '@/lib/mock-contratos-v2'
import { maskCnpj, maskCpf } from '@/lib/masks'
import { PhoneInput } from '@/components/ui/phone-input'

// ── helpers de estilo ─────────────────────────────────────────
const card = 'bg-white/[0.03] border border-white/[0.07] rounded-2xl'
const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all'
const labelCls = 'text-xs font-medium text-white/40 mb-1 block'
const sectionTitle = 'text-sm font-semibold text-white/70 mb-4 flex items-center gap-2'

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

// ── Módulos do sistema por editora administrada ───────────────
const MODULOS_SISTEMA = [
  { id: 'titulares',      label: 'Titulares',            grupo: 'Cadastros',      desc: 'Cadastro e gestão de titulares do catálogo próprio' },
  { id: 'obras',          label: 'Obras',                grupo: 'Cadastros',      desc: 'Visualização das obras do catálogo próprio' },
  { id: 'nova_obra',      label: 'Cadastro de Obra',     grupo: 'Cadastros',      desc: 'Registrar novas obras (gera link AM automaticamente)' },
  { id: 'contratos',      label: 'Contratos',            grupo: 'Contratos',      desc: 'Visualizar contratos vinculados ao seu catálogo' },
  { id: 'novo_contrato',  label: 'Novo Contrato',        grupo: 'Contratos',      desc: 'Gerar contratos com titulares do seu catálogo' },
  { id: 'autorizacoes',   label: 'Autorizações (leitura)',grupo: 'Autorizações',   desc: 'Ver autorizações emitidas — licenciamento sempre pela AM' },
  { id: 'financeiro',     label: 'Financeiro',           grupo: 'Financeiro',     desc: 'Recebimentos, CC e demonstrativos do próprio catálogo' },
  { id: 'prestacao',      label: 'Prestação de Contas',  grupo: 'Financeiro',     desc: 'Ver prestações referentes ao seu catálogo' },
  { id: 'relatorios',     label: 'Relatórios',           grupo: 'Relatórios',     desc: 'Relatórios restritos ao catálogo próprio' },
  { id: 'usuarios',       label: 'Usuários',             grupo: 'Admin',          desc: 'Gerenciar usuários internos da editora administrada' },
] as const

type ModuloId = typeof MODULOS_SISTEMA[number]['id']
const DEFAULT_MODULOS: ModuloId[] = ['titulares', 'obras', 'nova_obra', 'contratos', 'novo_contrato', 'financeiro', 'prestacao']

// ── tipos ─────────────────────────────────────────────────────
interface TenantForm {
  razao_social: string; nome_fantasia: string; cnpj: string
  ie: string; im: string; data_fundacao: string
  registro_ecad: string; codigo_iswc: string
  cep: string; endereco: string; numero: string; compl: string
  bairro: string; cidade: string; estado: string; pais: string
  telefone: string; email: string; site: string
  banco: string; agencia: string; conta: string
  tipo_conta: string; titular_conta: string; operacao: string
  pix_chave: string; pix_tipo: string
}
interface EditAdm { id: string; codigo: string; razao_social: string; nome_fantasia: string; cnpj: string; ativa: boolean; modulos?: ModuloId[] }
interface Usuario {
  id: string
  nome: string
  cpf: string          // Identificador principal — login via CPF
  email: string
  perfil: string
  ativo: boolean
  editoras_acesso: string[]  // IDs das editoras administradas que o usuário pode operar
}
interface Config { notif_email: boolean; notif_vencimento: boolean; notif_royalties: boolean; modo_escuro: boolean; idioma: string; moeda: string; timezone: string }

const EMPTY_TENANT: TenantForm = {
  razao_social: 'TOP SHOW MUSIC EDICOES MUSICAIS LTDA',
  nome_fantasia: 'TOP SHOW MUSIC',
  cnpj: '11.111.111/0001-11', ie: '', im: '',
  data_fundacao: '2020-01-15', registro_ecad: '', codigo_iswc: '',
  cep: '', endereco: '', numero: '', compl: '', bairro: '',
  cidade: 'SAO PAULO', estado: 'SP', pais: 'BRASIL',
  telefone: '', email: '', site: '',
  banco: '', agencia: '', conta: '', tipo_conta: '', titular_conta: '', operacao: '', pix_chave: '', pix_tipo: '',
}
const EMPTY_ADM: EditAdm = { id: '', codigo: '', razao_social: '', nome_fantasia: '', cnpj: '', ativa: true, modulos: [...DEFAULT_MODULOS] }
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
  { id: 'empresa',       label: 'Empresa (AM)',          icon: Building2 },
  { id: 'banco',         label: 'Dados Bancarios',       icon: CreditCard },
  { id: 'administradas', label: 'Editoras Administradas',icon: Building2 },
  { id: 'usuarios',      label: 'Usuarios',              icon: Users },
  { id: 'regras',        label: 'Regras / Arquitetura',  icon: Shield },
  { id: 'config',        label: 'Configuracoes',         icon: Settings },
] as const
type AbaId = typeof ABAS[number]['id']

// ── Drawer de detalhe da Editora Administrada ─────────────────
const STATUS_CONTRATO: Record<string, { label: string; cls: string }> = {
  em_vigor:              { label: 'Em Vigor',        cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  assinado:              { label: 'Assinado',         cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  aguardando_assinatura: { label: 'Ag. Assinatura',   cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  vencendo:              { label: 'Vencendo',          cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  vencido:               { label: 'Vencido',           cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  rescindido:            { label: 'Rescindido',        cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
}
const TIPO_CONTRATO: Record<string, string> = {
  cessao_parcial: 'Cessão de Obras', licenciamento: 'Licenciamento',
  administracao_editorial: 'Adm. Editorial', coeditorial: 'Coeditorial',
  subedicao: 'Subedição', cessao_internacional: 'Cessão Internacional',
  obra_nova: 'Obra Nova', versionamento: 'Versionamento',
}

function ObraRow({ obra }: { obra: (typeof MOCK_OBRAS)[0] }) {
  const [open, setOpen] = useState(false)
  const fonogramas = MOCK_OBRAS_FONOGRAMAS[obra.id] ?? []
  const links = MOCK_OBRAS_LINKS[obra.id] ?? []
  const totalTitulares = links.reduce((s, l) => s + (l.titulares?.length ?? 0), 0)

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors text-left">
        <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
          <Music className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white font-mono">{obra.codigo}</p>
          <p className="text-[11px] text-white/50 truncate">{obra.titulo}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {fonogramas.length > 0 && (
            <span className="text-[10px] text-white/30 flex items-center gap-0.5">
              <Mic2 className="w-3 h-3" />{fonogramas.length}
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
            obra.status === 'ativa' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/30 border-white/10'
          }`}>{obra.status}</span>
          {open ? <ChevronDown className="w-3.5 h-3.5 text-white/30" /> : <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.05] p-3 space-y-3">
          {/* Dados cadastrais */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-white/30">ISWC: </span><span className="text-white/60 font-mono">{obra.iswc ?? '—'}</span></div>
            <div><span className="text-white/30">Gênero: </span><span className="text-white/60">{obra.genero ?? '—'}</span></div>
            <div><span className="text-white/30">Idioma: </span><span className="text-white/60">{obra.idioma ?? '—'}</span></div>
            <div><span className="text-white/30">Ano: </span><span className="text-white/60">{obra.ano_criacao ?? '—'}</span></div>
            {obra.duracao && <div><span className="text-white/30">Duração: </span><span className="text-white/60">{Math.floor(obra.duracao / 60)}:{String(obra.duracao % 60).padStart(2,'0')}</span></div>}
            <div><span className="text-white/30">% Controlado: </span><span className="text-emerald-400">{obra._percentual_controlado ?? 0}%</span></div>
          </div>

          {/* Links / Participação */}
          {links.length > 0 && (
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wide mb-1.5">Participação ({totalTitulares} titular{totalTitulares !== 1 ? 'es' : ''})</p>
              <div className="space-y-1">
                {links.map((link, li) => (
                  <div key={link.id} className="text-[11px]">
                    <span className="text-white/20">Link {li + 1}: </span>
                    {link.titulares?.map((t, ti) => (
                      <span key={t.id}>
                        <span className={t.controlado ? 'text-violet-400' : 'text-white/50'}>{t.nome}</span>
                        <span className="text-white/25"> ({t.papel} {t.percentual}%)</span>
                        {ti < (link.titulares!.length - 1) && <span className="text-white/20"> + </span>}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fonogramas atrelados */}
          {fonogramas.length > 0 && (
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wide mb-1.5">
                <Mic2 className="inline w-3 h-3 mr-1" />Fonogramas ({fonogramas.length})
              </p>
              <div className="space-y-1">
                {fonogramas.map(f => (
                  <div key={f.id} className="flex items-center gap-2 bg-white/[0.02] rounded-lg px-2 py-1.5">
                    <Mic2 className="w-3 h-3 text-white/20 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/70 truncate">{f.titulo_fonograma}</p>
                      <p className="text-[10px] text-white/30">{f.interprete}{f.isrc ? ` · ${f.isrc}` : ''}</p>
                    </div>
                    {f.data_lancamento && (
                      <span className="text-[10px] text-white/25 shrink-0">{new Date(f.data_lancamento).getFullYear()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditoraDetalheDrawer({
  editora, onClose, onSaveModulos,
}: {
  editora: EditAdm
  onClose: () => void
  onSaveModulos: (id: string, modulos: ModuloId[]) => void
}) {
  const [subTab, setSubTab] = useState<'obras' | 'contratos' | 'modulos'>('obras')
  const [modulos, setModulos] = useState<ModuloId[]>(editora.modulos ?? [...DEFAULT_MODULOS])

  const obras = useMemo(() => MOCK_OBRAS.filter(o => o.editora_id === editora.id), [editora.id])
  const contratos = useMemo(() => MOCK_CONTRATOS_V2.filter(c =>
    c._partes?.some(p => p.titular_id === editora.id) || c.editora_id === editora.id
  ), [editora.id])

  const grupos = [...new Set(MODULOS_SISTEMA.map(m => m.grupo))]

  function toggleModulo(id: ModuloId) {
    setModulos(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }

  function salvar() {
    onSaveModulos(editora.id, modulos)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[500px] bg-[#0d1526] border-l border-white/[0.07] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-violet-300">{editora.codigo || editora.razao_social.slice(0, 2)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{editora.nome_fantasia || editora.razao_social}</p>
            <p className="text-[11px] text-white/30 truncate">{editora.razao_social}{editora.cnpj ? ` · ${editora.cnpj}` : ''}</p>
          </div>
          <Badge variant={editora.ativa ? 'emerald' : 'slate'}>{editora.ativa ? 'Ativa' : 'Inativa'}</Badge>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-2 shrink-0">
          {([
            { id: 'obras',     label: `Obras (${obras.length})` },
            { id: 'contratos', label: `Contratos (${contratos.length})` },
            { id: 'modulos',   label: 'Módulos / Acesso' },
          ] as const).map(s => (
            <button key={s.id} onClick={() => setSubTab(s.id)}
              className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${
                subTab === s.id ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {/* ── Obras ── */}
          {subTab === 'obras' && (
            obras.length === 0
              ? <div className="flex flex-col items-center gap-2 py-10 text-white/25"><Music className="w-8 h-8" /><p className="text-sm">Nenhuma obra vinculada</p></div>
              : obras.map(o => <ObraRow key={o.id} obra={o} />)
          )}

          {/* ── Contratos ── */}
          {subTab === 'contratos' && (
            contratos.length === 0
              ? <div className="flex flex-col items-center gap-2 py-10 text-white/25"><FileText className="w-8 h-8" /><p className="text-sm">Nenhum contrato vinculado</p></div>
              : contratos.map(c => {
                  const st = STATUS_CONTRATO[c.status] ?? { label: c.status, cls: 'bg-white/10 text-white/50 border-white/10' }
                  return (
                    <div key={c.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-white font-mono">{c.numero}</p>
                          <p className="text-xs text-white/40">{TIPO_CONTRATO[c.tipo] ?? c.tipo}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-white/40">
                        {c.vigencia_inicio && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.vigencia_inicio).toLocaleDateString('pt-BR')}</span>}
                        {c.vigencia_fim && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />Até {new Date(c.vigencia_fim).toLocaleDateString('pt-BR')}</span>}
                      </div>
                      {c._obras && c._obras.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-white/[0.05]">
                          {c._obras.slice(0, 5).map(o => (
                            <span key={o.id} className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-md px-2 py-0.5 font-mono">{o.codigo_obra}</span>
                          ))}
                          {c._obras.length > 5 && <span className="text-[10px] text-white/30">+{c._obras.length - 5}</span>}
                        </div>
                      )}
                    </div>
                  )
                })
          )}

          {/* ── Módulos / Acesso ── */}
          {subTab === 'modulos' && (
            <div className="space-y-4 pt-1">
              {/* Aviso imutável */}
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-amber-400">Regras fixas da AM (não configuráveis)</p>
                <ul className="text-[11px] text-amber-300/70 space-y-0.5 list-disc list-inside">
                  <li>Toda autorização/licenciamento é emitido <strong>pela AM</strong></li>
                  <li>Catálogo da E compõe automaticamente o catálogo da AM</li>
                  <li>Financeiro restrito às obras/autores do próprio catálogo</li>
                </ul>
              </div>

              {/* Módulos por grupo */}
              {grupos.map(grupo => (
                <div key={grupo}>
                  <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">{grupo}</p>
                  <div className="space-y-1.5">
                    {MODULOS_SISTEMA.filter(m => m.grupo === grupo).map(m => {
                      const ativo = modulos.includes(m.id)
                      return (
                        <div key={m.id} onClick={() => toggleModulo(m.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            ativo
                              ? 'bg-violet-500/8 border-violet-500/20 hover:border-violet-500/35'
                              : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10'
                          }`}>
                          <div className={`w-9 h-5 rounded-full relative transition-all shrink-0 ${ativo ? 'bg-violet-500' : 'bg-white/10'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${ativo ? 'left-[18px]' : 'left-0.5'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold ${ativo ? 'text-white' : 'text-white/40'}`}>{m.label}</p>
                            <p className="text-[10px] text-white/25 truncate">{m.desc}</p>
                          </div>
                          {ativo
                            ? <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            : <X className="w-3.5 h-3.5 text-white/20 shrink-0" />
                          }
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] shrink-0 flex gap-2">
          <button onClick={onClose}
            className="flex-1 h-9 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors">
            Fechar
          </button>
          {subTab === 'modulos' && (
            <button onClick={salvar}
              className="flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> Salvar Módulos
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ──────────────────────────────────────────────────────────────
export default function EditoraPage() {
  const [aba, setAba] = useState<AbaId>('empresa')
  const [form, setForm] = useState<TenantForm>(EMPTY_TENANT)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)

  // Editoras administradas
  const [editoras, setEditoras] = useState<EditAdm[]>([])
  const [novaEditora, setNovaEditora] = useState<EditAdm>(EMPTY_ADM)
  const [adicionandoEditora, setAdicionandoEditora] = useState(false)
  const [editEditoraIdx, setEditEditoraIdx] = useState<number | null>(null)

  // Usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [novoUsuario, setNovoUsuario] = useState<Usuario>(EMPTY_USR)
  const [adicionandoUsuario, setAdicionandoUsuario] = useState(false)

  // Config
  const [config, setConfig] = useState<Config>(EMPTY_CFG)

  // Drawer detalhe editora
  const [detalheEditora, setDetalheEditora] = useState<EditAdm | null>(null)

  // Carregar do localStorage
  useEffect(() => {
    try {
      const t = localStorage.getItem('sync_tenant'); if (t) setForm(JSON.parse(t))
      const adms = localStorage.getItem('sync_editoras_adm')
      const mockAdms: EditAdm[] = MOCK_EDITORAS.filter(e => e.administradora_id !== null).map(e => ({
        id: e.id, codigo: e.codigo, razao_social: e.razao_social,
        nome_fantasia: e.nome_fantasia, cnpj: e.cnpj ?? '', ativa: e.ativa,
      }))
      setEditoras(adms ? JSON.parse(adms) : mockAdms)
      const u = localStorage.getItem('sync_usuarios'); if (u) setUsuarios(JSON.parse(u))
      const c = localStorage.getItem('sync_config'); if (c) setConfig(JSON.parse(c))
    } catch { /* silencioso */ }
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

  // Salva tudo de uma vez
  async function salvarTudo() {
    setSalvando(true)
    await new Promise(r => setTimeout(r, 300))
    localStorage.setItem('sync_tenant', JSON.stringify(form))
    localStorage.setItem('sync_editoras_adm', JSON.stringify(editoras))
    localStorage.setItem('sync_usuarios', JSON.stringify(usuarios))
    localStorage.setItem('sync_config', JSON.stringify(config))
    setSalvando(false)
    setToast('Todas as configuracoes foram salvas com sucesso.')
  }

  async function salvarEmpresa() { return salvarTudo() }

  function salvarConfig() {
    localStorage.setItem('sync_config', JSON.stringify(config))
    setToast('Configuracoes salvas.')
  }

  // Editoras administradas CRUD
  function salvarEditora() {
    if (!novaEditora.razao_social.trim()) return
    const updated = editEditoraIdx !== null
      ? editoras.map((e, i) => i === editEditoraIdx ? { ...novaEditora, id: e.id } : e)
      : [...editoras, { ...novaEditora, id: 'LOCAL-' + Date.now() }]
    setEditoras(updated)
    localStorage.setItem('sync_editoras_adm', JSON.stringify(updated))
    setNovaEditora(EMPTY_ADM); setAdicionandoEditora(false); setEditEditoraIdx(null)
    setToast('Editora salva.')
  }
  function removerEditora(idx: number) {
    const updated = editoras.filter((_, i) => i !== idx)
    setEditoras(updated)
    localStorage.setItem('sync_editoras_adm', JSON.stringify(updated))
    setToast('Editora removida.')
  }
  function toggleAtivaEditora(idx: number) {
    const updated = editoras.map((e, i) => i === idx ? { ...e, ativa: !e.ativa } : e)
    setEditoras(updated)
    localStorage.setItem('sync_editoras_adm', JSON.stringify(updated))
  }

  // Usuarios CRUD
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
      {detalheEditora && (
        <EditoraDetalheDrawer
          editora={detalheEditora}
          onClose={() => setDetalheEditora(null)}
          onSaveModulos={(id, mods) => {
            setEditoras((prev: EditAdm[]) => prev.map((e: EditAdm) => e.id === id ? { ...e, modulos: mods } : e))
            setDetalheEditora(prev => prev ? { ...prev, modulos: mods } : null)
          }}
        />
      )}

      {/* Header com botao Salvar global */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Editoras / Master</h1>
          <p className="text-sm text-white/40 mt-0.5">Editora administradora do sistema e editoras administradas</p>
        </div>
        <Button size="sm" onClick={salvarTudo} disabled={salvando} className="flex-shrink-0">
          <Save className="w-4 h-4" />{salvando ? 'Salvando...' : 'Salvar'}
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
              <input className={inputCls} placeholder="00000-0" value={form.conta} onChange={setUpper('conta')} />
            </Field>
            {isCEF && (
              <Field label="Operacao (Caixa Economica Federal)">
                <input className={inputCls} placeholder="001, 013, 023..." value={form.operacao} onChange={setUpper('operacao')} />
              </Field>
            )}
            <div className="md:col-span-2">
              <Field label="Titular da Conta">
                <input className={inputCls} placeholder="NOME COMPLETO / RAZAO SOCIAL" value={form.titular_conta} onChange={setUpper('titular_conta')} />
              </Field>
            </div>
            <Field label="Tipo de Chave PIX">
              <select className={inputCls} value={form.pix_tipo} onChange={set('pix_tipo')}>
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

      {/* ─── ABA ADMINISTRADAS ───────────────────────── */}
      {aba === 'administradas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">{editoras.length} editora{editoras.length !== 1 ? 's' : ''} administrada{editoras.length !== 1 ? 's' : ''}</p>
            <Button size="sm" onClick={() => { setNovaEditora(EMPTY_ADM); setEditEditoraIdx(null); setAdicionandoEditora(true) }}>
              <Plus className="w-3.5 h-3.5" /> Nova Editora Administrada
            </Button>
          </div>

          {/* Form inline nova/editar */}
          {adicionandoEditora && (
            <div className={`${card} p-5 space-y-4 border-violet-500/20`}>
              <h3 className="text-sm font-semibold text-violet-300">{editEditoraIdx !== null ? 'Editar Editora' : 'Nova Editora Administrada'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Codigo">
                  <input className={inputCls} placeholder="EX: EDI" value={novaEditora.codigo}
                    onChange={e => setNovaEditora(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))} />
                </Field>
                <Field label="CNPJ">
                  <input className={inputCls} placeholder="00.000.000/0001-00" value={novaEditora.cnpj}
                    onChange={e => setNovaEditora(prev => ({ ...prev, cnpj: maskCnpj(e.target.value) }))} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Razao Social *">
                    <input className={inputCls} placeholder="RAZAO SOCIAL" value={novaEditora.razao_social}
                      onChange={e => setNovaEditora(prev => ({ ...prev, razao_social: e.target.value.toUpperCase() }))} />
                  </Field>
                </div>
                <Field label="Nome Fantasia">
                  <input className={inputCls} placeholder="NOME FANTASIA" value={novaEditora.nome_fantasia}
                    onChange={e => setNovaEditora(prev => ({ ...prev, nome_fantasia: e.target.value.toUpperCase() }))} />
                </Field>
                <Field label="Status">
                  <select className={inputCls} value={novaEditora.ativa ? 'ativa' : 'inativa'}
                    onChange={e => setNovaEditora(prev => ({ ...prev, ativa: e.target.value === 'ativa' }))}>
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                  </select>
                </Field>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setAdicionandoEditora(false); setEditEditoraIdx(null) }}>Cancelar</Button>
                <Button size="sm" onClick={salvarEditora}><Save className="w-3.5 h-3.5" /> Salvar</Button>
              </div>
            </div>
          )}

          {editoras.length === 0 && !adicionandoEditora && (
            <div className={`${card} p-8 flex flex-col items-center gap-3 text-center`}>
              <Building2 className="w-10 h-10 text-white/10" />
              <p className="text-sm text-white/30">Nenhuma editora administrada cadastrada.</p>
              <Button size="sm" variant="secondary" onClick={() => setAdicionandoEditora(true)}>
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </div>
          )}

          {editoras.map((e, idx) => (
            <div key={e.id} className={`${card} p-4 flex items-center gap-4`}>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-violet-300">{e.codigo || e.razao_social.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{e.nome_fantasia || e.razao_social}</p>
                <p className="text-xs text-white/30 truncate">{e.razao_social} {e.cnpj ? `· ${e.cnpj}` : ''}</p>
              </div>
              <Badge variant={e.ativa ? 'emerald' : 'slate'}>{e.ativa ? 'Ativa' : 'Inativa'}</Badge>
              <div className="flex gap-1">
                <button onClick={() => setDetalheEditora(e)}
                  className="p-1.5 rounded-lg hover:bg-violet-500/10 text-white/30 hover:text-violet-400 transition-colors" title="Ver obras e contratos">
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button onClick={() => toggleAtivaEditora(idx)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-amber-400 transition-colors" title={e.ativa ? 'Desativar' : 'Ativar'}>
                  {e.ativa ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => { setNovaEditora(e); setEditEditoraIdx(idx); setAdicionandoEditora(true) }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => removerEditora(idx)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
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

              {/* Acesso a Editoras Administradas */}
              {editoras.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Acesso a Editoras Administradas
                    <span className="text-white/20 ml-1">— além da Editora Master (acesso automático pelo perfil)</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {editoras.filter(e => e.ativa).map(e => {
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
                          {e.modulos && (
                            <span className="text-[10px] text-white/20 shrink-0">{e.modulos.length} módulos</span>
                          )}
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
                <p className="text-[10px] text-white/20 font-mono mt-0.5">CPF: —&nbsp;&nbsp;·&nbsp;&nbsp;Acesso: Editora Master + todas as editoras administradas</p>
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
                {/* Editoras com acesso */}
                <div className="flex items-center gap-2 pl-12 flex-wrap">
                  <span className="text-[10px] text-white/20 uppercase tracking-wide">Acesso:</span>
                  <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-2 py-0.5">
                    Editora Master (AM)
                  </span>
                  {editorasDoUsuario.length === 0 && (
                    <span className="text-[10px] text-white/20 italic">somente Editora Master</span>
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
          {/* Diagrama visual AM ← E */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              Arquitetura de Administração
            </h3>
            {/* Diagrama */}
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="bg-violet-600/20 border-2 border-violet-500/40 rounded-2xl px-6 py-3 text-center">
                <p className="text-[10px] text-violet-300/60 uppercase tracking-widest mb-0.5">Editora Administradora (AM)</p>
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

          {/* Regras */}
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                titulo: 'Catálogo Unificado',
                icon: Music,
                cor: 'violet',
                descricao: 'Toda obra cadastrada por uma Editora Administrada (E) compõe automaticamente o catálogo da Editora Administradora (AM) por força do contrato de administração.',
                linkLogica: 'Link: Autor + Editora Original (E) + Editora Administradora (AM)',
              },
              {
                titulo: 'Autorização e Licenciamento Centralizado',
                icon: Shield,
                cor: 'amber',
                descricao: 'Toda e qualquer autorização ou licenciamento de obras do catálogo de uma Editora Administrada é emitido e autorizado exclusivamente pela Editora Administradora (AM). A E não pode emitir autorizações.',
                linkLogica: 'REGRA INVIOLÁVEL — AM autoriza, AM licencia',
              },
              {
                titulo: 'Módulos por Editora Administrada',
                icon: Settings,
                cor: 'blue',
                descricao: 'O usuário Master da AM habilita individualmente quais módulos cada Editora Administrada pode acessar. A AM sempre tem acesso total.',
                linkLogica: 'Configure em: Editoras Administradas → clique na editora → aba Módulos / Acesso',
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
