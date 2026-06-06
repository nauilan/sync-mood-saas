'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, Plus, Search, Filter, UserCheck, Building2,
  AlertCircle, Music, FileText, SlidersHorizontal, ChevronDown,
  X, Phone, Mail, MapPin, CreditCard, Hash, Globe, Calendar,
  Shield, ChevronRight, Copy, ExternalLink, Edit3, CheckCircle2,
  Clock, Pen, BookOpen, Tag,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/ui/kpi-card'
import { MOCK_EDITORAS } from '@/lib/mock-cadastros'
import { MOCK_CONTRATOS_V2 } from '@/lib/mock-contratos-v2'
import { authFetch } from '@/lib/supabase/client'
import { FUNCAO_LABEL, nomeTitular, cpfCnpjTitular, nomeArtistico, emailPrincipal } from '@/lib/types-cadastros'
import type { FuncaoTitular, TipoPessoa, TitularComDados } from '@/lib/types-cadastros'

const FUNCAO_OPTIONS: { value: FuncaoTitular; label: string }[] = [
  { value: 'CA', label: 'Autor / Compositor (CA)' },
  { value: 'V', label: 'Versionista (V)' },
  { value: 'AD', label: 'Adaptador (AD)' },
  { value: 'I', label: 'Interprete (I)' },
  { value: 'E', label: 'Editora Original (E)' },
  { value: 'AM', label: 'Editora Administradora (AM)' },
  { value: 'SE', label: 'Subeditora (SE)' },
  { value: 'gravadora', label: 'Gravadora' },
  { value: 'cliente', label: 'Cliente' },
]

function getTipoBadge(t: TitularComDados) {
  const funcoes = t._funcoes ?? []
  if (funcoes.length === 0) return { label: t.tipo_pessoa, color: 'sky' as const }
  const f = funcoes[0].funcao
  if (f === 'CA') return { label: 'Compositor (CA)', color: 'violet' as const }
  if (f === 'V') return { label: 'Versionista (V)', color: 'sky' as const }
  if (f === 'AD') return { label: 'Adaptador (AD)', color: 'sky' as const }
  if (f === 'I') return { label: 'Interprete (I)', color: 'sky' as const }
  if (f === 'E' || f === 'AM' || f === 'SE') return { label: FUNCAO_LABEL[f], color: 'emerald' as const }
  if (f === 'gravadora') return { label: 'Gravadora', color: 'amber' as const }
  return { label: FUNCAO_LABEL[f], color: 'amber' as const }
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

// ─── Drawer de detalhes do titular ──────────────────────────────────────────
// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_CONTRATO: Record<string, { label: string; cls: string }> = {
  em_vigor:             { label: 'Em Vigor',              cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  assinado:             { label: 'Assinado',              cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  aguardando_assinatura:{ label: 'Ag. Assinatura',        cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  vencendo:             { label: 'Vencendo',              cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  vencido:              { label: 'Vencido',               cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  rescindido:           { label: 'Rescindido',            cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
}

const TIPO_CONTRATO: Record<string, string> = {
  cessao_parcial:       'Cessão de Obras',
  licenciamento:        'Licenciamento',
  administracao_editorial: 'Adm. Editorial',
  coeditorial:          'Coeditorial',
  subedicao:            'Subedição',
  cessao_internacional: 'Cessão Internacional',
  obra_nova:            'Obra Nova',
  versionamento:        'Versionamento',
}

function ObrasContratosTab({ titular }: { titular: TitularComDados }) {
  const contratos = useMemo(
    () => MOCK_CONTRATOS_V2.filter(c => c._partes?.some(p => p.titular_id === titular.id)),
    [titular.id]
  )

  // TODO: conectar ao banco real via API para buscar obras vinculadas
  const obrasVinculadas: { obra: any; papel: string; percentual: number }[] = useMemo(() => [], [])

  const [subTab, setSubTab] = useState<'contratos' | 'obras'>('contratos')

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] text-white/30 uppercase tracking-wide">Contratos</p>
          <div className="flex items-center gap-2">
            <FileText className={`w-5 h-5 ${contratos.length === 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className={`text-2xl font-bold ${contratos.length === 0 ? 'text-amber-400' : 'text-white'}`}>{contratos.length}</span>
          </div>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-4 flex flex-col gap-1">
          <p className="text-[10px] text-white/30 uppercase tracking-wide">Obras</p>
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-violet-400" />
            <span className="text-2xl font-bold text-white">{obrasVinculadas.length}</span>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1">
        {(['contratos', 'obras'] as const).map(s => (
          <button key={s} onClick={() => setSubTab(s)}
            className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${
              subTab === s ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70'
            }`}>
            {s === 'contratos' ? `Contratos Assinados (${contratos.length})` : `Obras Vinculadas (${obrasVinculadas.length})`}
          </button>
        ))}
      </div>

      {/* Contratos list */}
      {subTab === 'contratos' && (
        <div className="space-y-2">
          {contratos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-white/25">
              <FileText className="w-8 h-8" />
              <p className="text-sm">Nenhum contrato vinculado</p>
            </div>
          ) : contratos.map(c => {
            const st = STATUS_CONTRATO[c.status] ?? { label: c.status, cls: 'bg-white/10 text-white/50 border-white/10' }
            const parte = c._partes?.find(p => p.titular_id === titular.id)
            return (
              <div key={c.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white font-mono">{c.numero}</p>
                    <p className="text-xs text-white/40">{TIPO_CONTRATO[c.tipo] ?? c.tipo}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-white/40">
                  {c.vigencia_inicio && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.vigencia_inicio).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {parte && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {parte.papel} · {parte.percentual}%
                    </span>
                  )}
                </div>
                {c._obras && c._obras.length > 0 && (
                  <div className="pt-1 border-t border-white/[0.05]">
                    <p className="text-[10px] text-white/30 mb-1">Obras no contrato</p>
                    <div className="flex flex-wrap gap-1">
                      {c._obras.slice(0, 4).map(o => (
                        <span key={o.id} className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-md px-2 py-0.5 font-mono">{o.codigo_obra}</span>
                      ))}
                      {c._obras.length > 4 && (
                        <span className="text-[10px] text-white/30">+{c._obras.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Obras list */}
      {subTab === 'obras' && (
        <div className="space-y-2">
          {obrasVinculadas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-white/25">
              <Music className="w-8 h-8" />
              <p className="text-sm">Nenhuma obra vinculada</p>
            </div>
          ) : obrasVinculadas.map(({ obra, papel, percentual }) => (
            <div key={obra.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3 hover:border-white/10 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white font-mono">{obra.codigo}</p>
                <p className="text-[11px] text-white/60 truncate">{obra.titulo}</p>
                <p className="text-[10px] text-white/30">{papel} · {percentual}%</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                obra.status === 'ativa' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/30 border-white/10'
              }`}>{obra.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TitularDrawer({ t, onClose }: { t: TitularComDados; onClose: () => void }) {
  const [tab, setTab] = useState<'dados' | 'contatos' | 'funcoes' | 'obras'>('dados')

  const nome = nomeTitular(t)
  const doc  = cpfCnpjTitular(t)
  const pseudo = nomeArtistico(t)
  const editora = MOCK_EDITORAS.find(e => e.id === t.editora_id)
  const isPF = t.tipo_pessoa === 'PF'
  const pf = t._pf
  const pj = t._pj

  const TABS = [
    { id: 'dados',    label: 'Dados Cadastrais', icon: Hash },
    { id: 'contatos', label: 'Contatos',         icon: Phone },
    { id: 'funcoes',  label: 'Funções',          icon: Shield },
    { id: 'obras',    label: 'Obras / Contratos', icon: Music },
  ] as const

  function Linha({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
    if (!value) return null
    return (
      <div className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
        <span className="text-xs text-white/35 shrink-0">{label}</span>
        <span className={`text-xs text-right text-white/75 font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
      </div>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-[#080f1e] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isPF ? 'bg-violet-600/25 text-violet-300' : 'bg-emerald-600/25 text-emerald-300'}`}>
            {getInitials(nome)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white">{nome}</h2>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPF ? 'bg-violet-500/20 text-violet-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {t.tipo_pessoa}
              </span>
              <Badge variant={t.ativo ? 'emerald' : 'rose'} className="text-[10px]">{t.ativo ? 'Ativo' : 'Inativo'}</Badge>
            </div>
            {pseudo && pseudo !== nome && <p className="text-xs text-white/40 mt-0.5">{pseudo}</p>}
            <p className="text-xs font-mono text-white/30 mt-0.5">{t.codigo_titular}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/master/titulares/${t.id}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 hover:text-violet-400 transition-colors"
              title="Abrir página completa">
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 hover:text-white/70 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06] overflow-x-auto">
          {TABS.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors
                ${tab === tb.id ? 'bg-violet-600/20 text-violet-300' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
              <tb.icon className="w-3 h-3" />
              {tb.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Dados Cadastrais ── */}
          {tab === 'dados' && (
            <div className="space-y-4">
              {/* Identificação */}
              <div className="bg-white/[0.03] rounded-xl p-4">
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Identificação</p>
                <Linha label="Código" value={t.codigo_titular} mono />
                <Linha label={isPF ? 'CPF' : 'CNPJ'} value={doc} mono />
                <Linha label={isPF ? 'Nome Completo' : 'Razão Social'} value={nome} />
                <Linha label={isPF ? 'Nome Artístico' : 'Nome Fantasia'} value={pseudo} />
                {isPF && <Linha label="Nacionalidade" value={pf?.nacionalidade} />}
                {isPF && pf?.rg && <Linha label="RG" value={pf.rg} mono />}
                {!isPF && pj?.nome_fantasia && pj.nome_fantasia !== nome && <Linha label="Nome Fantasia" value={pj.nome_fantasia} />}
              </div>

              {/* Direitos Autorais */}
              <div className="bg-white/[0.03] rounded-xl p-4">
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Direitos Autorais</p>
                <Linha label="IPI" value={isPF ? pf?.ipi : pj?.ipi} mono />
                <Linha label="CAE" value={isPF ? pf?.cae : pj?.cae} mono />
                <Linha label="Sociedade Autoral" value={isPF ? pf?.sociedade_autoral : pj?.sociedade_autoral} />
              </div>

              {/* Vínculos */}
              <div className="bg-white/[0.03] rounded-xl p-4">
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Vínculos</p>
                <Linha label="Editora" value={editora?.nome_fantasia} />
                <div className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.04]">
                  <span className="text-xs text-white/35 shrink-0">Obras</span>
                  <div className="flex items-center gap-1 text-white/70">
                    <Music className="w-3 h-3" />
                    <span className="text-xs font-bold">{t._obras ?? 0}</span>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 py-2">
                  <span className="text-xs text-white/35 shrink-0">Contratos</span>
                  <div className={`flex items-center gap-1 ${(t._contratos ?? 0) === 0 ? 'text-amber-400' : 'text-white/70'}`}>
                    <FileText className="w-3 h-3" />
                    <span className="text-xs font-bold">{t._contratos ?? 0}</span>
                    {(t._contratos ?? 0) === 0 && <span className="text-[10px] text-amber-400/70 ml-1">pendente</span>}
                  </div>
                </div>
              </div>

              {/* Endereços */}
              {(t._enderecos ?? []).length > 0 && (
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Endereços</p>
                  {(t._enderecos ?? []).map((e: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
                      <MapPin className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-white/70">{[e.logradouro, e.numero, e.complemento].filter(Boolean).join(', ')}</p>
                        <p className="text-[10px] text-white/35">{[e.bairro, e.cidade, e.estado, e.cep].filter(Boolean).join(' · ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Contatos ── */}
          {tab === 'contatos' && (
            <div className="space-y-2">
              {(t._contatos ?? []).length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-white/25">
                  <Phone className="w-8 h-8" />
                  <p className="text-sm">Nenhum contato cadastrado</p>
                </div>
              )}
              {(t._contatos ?? []).map((c: any, i: number) => {
                const Icon = c.tipo === 'email' ? Mail : Phone
                return (
                  <div key={i} className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60 capitalize">{c.tipo}{c.descricao ? ` · ${c.descricao}` : ''}</p>
                      <p className="text-sm font-medium text-white/85 truncate">{c.valor}</p>
                    </div>
                    {c.principal && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 shrink-0">Principal</span>
                    )}
                    <button onClick={() => navigator.clipboard?.writeText(c.valor)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/20 hover:text-white/60 transition-colors shrink-0">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Funções ── */}
          {tab === 'funcoes' && (
            <div className="space-y-2">
              {(t._funcoes ?? []).length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-white/25">
                  <Shield className="w-8 h-8" />
                  <p className="text-sm">Nenhuma função cadastrada</p>
                </div>
              )}
              {(t._funcoes ?? []).map((f: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/80">{FUNCAO_LABEL[f.funcao as FuncaoTitular] ?? f.funcao}</p>
                    {f.editora_vinculada && <p className="text-xs text-white/35 mt-0.5">Editora: {f.editora_vinculada}</p>}
                  </div>
                  <Badge variant="violet" className="text-[10px] px-2">{f.funcao}</Badge>
                </div>
              ))}
            </div>
          )}

          {/* ── Obras / Contratos ── */}
          {tab === 'obras' && (
            <ObrasContratosTab titular={t} />
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex items-center gap-2">
          <button onClick={onClose}
            className="flex-1 h-9 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors">
            Fechar
          </button>
          <Link href={`/master/titulares/${t.id}`}
            className="flex items-center justify-center gap-1.5 flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors">
            <Edit3 className="w-3.5 h-3.5" /> Editar Titular
          </Link>
        </div>
      </div>
    </>
  )
}

export default function TitularesPage() {
  const [search, setSearch] = useState('')
  const [filterPessoa, setFilterPessoa] = useState<TipoPessoa | ''>('')
  const [titularAtivo, setTitularAtivo] = useState<TitularComDados | null>(null)
  const [filterFuncao, setFilterFuncao] = useState<FuncaoTitular | ''>('')
  const [filterEditora, setFilterEditora] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ativo' | 'inativo' | ''>('')
  const [showFilters, setShowFilters] = useState(false)
  const [rawTitulares, setRawTitulares] = useState<any[]>([])
  const [apiKpis, setApiKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/api/titulares?per_page=200')
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setRawTitulares(json.data)
          if (json.kpis) setApiKpis(json.kpis)
        }
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false))
  }, [])

  // Normaliza campos: banco usa flat columns
  const allTitulares = useMemo(() => rawTitulares.map((t: any) => ({
    ...t,
    tipo_pessoa: t.tipo_pessoa ?? t.pessoa ?? 'PF',
    ativo: t.ativo !== undefined ? t.ativo : (t.status === 'ativo'),
    _pf: t._pf ?? (t.tipo_pessoa === 'PF' || t.pessoa === 'PF' ? {
      nome_completo: t.nome_completo ?? '',
      cpf: t.cpf_cnpj ?? null,
      ipi: t.codigo_ipi ?? t.ipi ?? null,
      cae: t.codigo_cae ?? null,
      nome_artistico_principal: t.nome_artistico ?? null,
    } : null),
    _pj: t._pj ?? (t.tipo_pessoa === 'PJ' || t.pessoa === 'PJ' ? {
      razao_social: t.nome_completo ?? '',
      cnpj: t.cpf_cnpj ?? null,
      nome_fantasia: t.nome_artistico ?? null,
      ipi: t.codigo_ipi ?? t.ipi ?? null,
      cae: t.codigo_cae ?? null,
    } : null),
    _pseudonimos: t._pseudonimos ?? [],
    _contatos: t._contatos ?? [],
    _funcoes: t._funcoes ?? [],
  })), [rawTitulares])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allTitulares.filter(t => {
      const nome = nomeTitular(t).toLowerCase()
      const docNum = (cpfCnpjTitular(t) ?? '').replace(/\D/g, '')
      const searchDoc = q.replace(/\D/g, '')
      const pseudo = (nomeArtistico(t) ?? '').toLowerCase()
      const email = (emailPrincipal(t) ?? '').toLowerCase()
      const cae = (t._pf?.cae ?? t._pj?.cae ?? '').toLowerCase()
      const ipi = (t._pf?.ipi ?? t._pj?.ipi ?? '').toLowerCase()

      const matchSearch = !q
        || nome.includes(q)
        || (searchDoc && docNum.includes(searchDoc))
        || pseudo.includes(q)
        || email.includes(q)
        || cae.includes(q)
        || ipi.includes(q)

      const matchPessoa = !filterPessoa || t.tipo_pessoa === filterPessoa
      const matchFuncao = !filterFuncao || t._funcoes?.some((f: any) => f.funcao === filterFuncao)
      const matchEditora = !filterEditora || t.editora_id === filterEditora
      const matchStatus = !filterStatus || (filterStatus === 'ativo' ? t.ativo : !t.ativo)

      return matchSearch && matchPessoa && matchFuncao && matchEditora && matchStatus
    })
  }, [allTitulares, search, filterPessoa, filterFuncao, filterEditora, filterStatus])

  const kpis = useMemo(() => ({
    total: apiKpis?.total ?? allTitulares.length,
    pf: allTitulares.filter(t => t.tipo_pessoa === 'PF').length,
    pj: allTitulares.filter(t => t.tipo_pessoa === 'PJ').length,
    ativos: apiKpis?.ativos ?? allTitulares.filter(t => t.ativo).length,
    semContrato: allTitulares.filter(t => (t._contratos ?? 0) === 0).length,
  }), [allTitulares, apiKpis])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Titulares"
        description="Gestao centralizada de titulares de direitos autorais"
        actions={
          <Link href="/master/titulares/novo">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" /> Novo Titular
            </Button>
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total de Titulares" value={kpis.total} subtitle={'ativos: ' + kpis.ativos} accent="violet" icon={<Users className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Pessoas Fisicas (PF)" value={kpis.pf} subtitle="autores, versionistas, adapts." accent="sky" icon={<UserCheck className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Pessoas Juridicas (PJ)" value={kpis.pj} subtitle="editoras, gravadoras, etc." accent="emerald" icon={<Building2 className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Sem Contrato" value={kpis.semContrato} subtitle="pendentes de vinculacao" accent="amber" icon={<AlertCircle className="w-4 h-4 text-amber-400" />} />
      </div>

      {/* Barra de filtros */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Busca */}
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors"
              placeholder="Nome, CPF/CNPJ, pseudonimo, e-mail, CAE, IPI..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Toggle filtros avancados */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ' + (showFilters ? 'bg-violet-600/10 border-violet-500/30 text-violet-300' : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:text-white/70')}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
            <ChevronDown className={'w-3.5 h-3.5 transition-transform ' + (showFilters ? 'rotate-180' : '')} />
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-white/[0.04]">
            <Filter className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <select
              className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-violet-500/50"
              value={filterPessoa}
              onChange={e => setFilterPessoa(e.target.value as TipoPessoa | '')}
            >
              <option value="">PF + PJ</option>
              <option value="PF">Pessoa Fisica (PF)</option>
              <option value="PJ">Pessoa Juridica (PJ)</option>
            </select>
            <select
              className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
              value={filterFuncao}
              onChange={e => setFilterFuncao(e.target.value as FuncaoTitular | '')}
            >
              <option value="">Todas as funcoes</option>
              {FUNCAO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
              value={filterEditora}
              onChange={e => setFilterEditora(e.target.value)}
            >
              <option value="">Todas as editoras</option>
              {MOCK_EDITORAS.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia}</option>)}
            </select>
            <select
              className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as 'ativo' | 'inativo' | '')}
            >
              <option value="">Ativo + Inativo</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            {(filterPessoa || filterFuncao || filterEditora || filterStatus) && (
              <button
                onClick={() => { setFilterPessoa(''); setFilterFuncao(''); setFilterEditora(''); setFilterStatus('') }}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-white/30">
          {filtered.length} titular{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          {allTitulares.length !== filtered.length && ` (de ${allTitulares.length} total)`}
        </p>
      </div>

      {/* Tabela */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="sticky top-0 text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider bg-[#0d1526]">Titular</th>
                <th className="sticky top-0 text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider bg-[#0d1526]">Cod. / CPF / CNPJ</th>
                <th className="sticky top-0 text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider bg-[#0d1526] hidden md:table-cell">Funcao</th>
                <th className="sticky top-0 text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider bg-[#0d1526] hidden lg:table-cell">Editora</th>
                <th className="sticky top-0 text-center px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider bg-[#0d1526] hidden lg:table-cell">Obras</th>
                <th className="sticky top-0 text-center px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider bg-[#0d1526] hidden lg:table-cell">Contratos</th>
                <th className="sticky top-0 text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider bg-[#0d1526]">Status</th>
                <th className="sticky top-0 text-right px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider bg-[#0d1526]">Acao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-white/30">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <Users className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-white/30">Nenhum titular encontrado com os filtros atuais.</p>
                    <button onClick={() => { setSearch(''); setFilterPessoa(''); setFilterFuncao(''); setFilterEditora(''); setFilterStatus('') }} className="mt-2 text-xs text-violet-400 hover:text-violet-300">Limpar filtros</button>
                  </td>
                </tr>
              ) : filtered.map(t => {
                const nome = nomeTitular(t)
                const docNum = cpfCnpjTitular(t)
                const pseudo = nomeArtistico(t)
                const badge = getTipoBadge(t)
                const editora = MOCK_EDITORAS.find(e => e.id === t.editora_id)

                return (
                  <tr
                    key={t.id}
                    onClick={() => setTitularAtivo(t)}
                    className={`hover:bg-white/[0.03] transition-colors group cursor-pointer
                      ${titularAtivo?.id === t.id ? 'bg-violet-500/10 border-l-2 border-violet-500' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ' + (t.tipo_pessoa === 'PF' ? 'bg-violet-600/20 text-violet-400' : 'bg-emerald-600/20 text-emerald-400')}>
                          {getInitials(nome)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[180px]">{nome}</p>
                          {pseudo && pseudo !== nome && (
                            <p className="text-xs text-white/40 truncate max-w-[180px]">{pseudo}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-white/50 font-mono">{t.codigo_titular}</p>
                      {docNum && <p className="text-xs text-white/30 font-mono">{docNum}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(t._funcoes ?? []).slice(0, 2).map((f: any) => (
                          <Badge key={f.id} variant={badge.color} className="text-[10px] px-1.5 py-0">{f.funcao}</Badge>
                        ))}
                        {(t._funcoes ?? []).length > 2 && (
                          <span className="text-[10px] text-white/30">+{(t._funcoes ?? []).length - 2}</span>
                        )}
                        {(t._funcoes ?? []).length === 0 && <span className="text-xs text-white/20">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-white/50 truncate max-w-[120px] block">{editora?.nome_fantasia ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1 text-sm text-white/50">
                        <Music className="w-3.5 h-3.5" />
                        <span>{t._obras ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <FileText className="w-3.5 h-3.5" />
                        <span className={(t._contratos ?? 0) === 0 ? 'text-amber-400' : 'text-white/50'}>{t._contratos ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={t.ativo ? 'emerald' : 'rose'}>{t.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className={`w-4 h-4 ml-auto transition-colors ${titularAtivo?.id === t.id ? 'text-violet-400' : 'text-white/15 group-hover:text-violet-400'}`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer de detalhes */}
      {titularAtivo && (
        <TitularDrawer t={titularAtivo} onClose={() => setTitularAtivo(null)} />
      )}
    </div>
  )
}
