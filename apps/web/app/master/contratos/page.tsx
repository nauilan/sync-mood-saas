'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Plus, Search, Filter, CheckCircle2, Clock,
  AlertTriangle, ChevronRight, Building2, User,
  Bell, ShieldAlert, DollarSign, Calendar, Download,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import type { TipoContratoV2, StatusContratoV2 } from '@/lib/types-contratos-v2'
import {
  TIPO_CONTRATO_V2_LABELS, TIPO_CONTRATO_V2_COLORS,
  STATUS_CONTRATO_V2_LABELS, STATUS_CONTRATO_V2_COLORS,
} from '@/lib/types-contratos-v2'
import {
  MOCK_CONTRATOS_V2, ALERTAS_EXCLUSIVIDADE,
} from '@/lib/mock-contratos-v2'
import { authFetch } from '@/lib/supabase/client'

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

type FilterTipo = TipoContratoV2 | 'todos'
type FilterStatus = StatusContratoV2 | 'todos'
type FilterEditora = string

const TIPOS_FILTER: { value: FilterTipo; label: string }[] = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'administracao_editorial', label: 'Adm. Editorial' },
  { value: 'cessao_parcial', label: 'Cessao Parcial' },
  { value: 'cessao_total', label: 'Cessao Total' },
  { value: 'cessao_internacional', label: 'Cessao Internacional' },
  { value: 'cessionario_pf', label: 'Cessionario PF' },
  { value: 'cessionario_pj', label: 'Cessionario PJ' },
  { value: 'coedicao', label: 'Coedicao' },
  { value: 'licenciamento', label: 'Licenciamento' },
  { value: 'exclusividade_autor_editora', label: 'Exclusividade' },
  { value: 'licenciamento_licenciante_pf', label: 'Licenciante PF' },
  { value: 'licenciamento_licenciante_pj', label: 'Licenciante PJ' },
  { value: 'subedicao', label: 'Subedicao' },
]

const STATUS_FILTER: { value: FilterStatus; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'em_vigor', label: 'Em Vigor' },
  { value: 'aguardando_assinatura', label: 'Ag. Assinatura' },
  { value: 'vencendo', label: 'Vencendo' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'rescindido', label: 'Rescindido' },
]

export default function ContratosPage() {
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('todos')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
  const [filterEditora, setFilterEditora] = useState<FilterEditora>('todos')
  const [contratosObras, setContratosObras] = useState<any[]>([])
  const [contratosApi, setContratosApi] = useState<any[]>([])
  const [apiKpis, setApiKpis] = useState<any>(null)
  const [loadingApi, setLoadingApi] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sync_contratos_obras_v1')
      if (raw) setContratosObras(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    authFetch('/api/contratos?per_page=100')
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setContratosApi(json.data)
          if (json.kpis) setApiKpis(json.kpis)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingApi(false))
  }, [])

  function downloadContratoObra(c: any, modo: 'rascunho' | 'assinado') {
    const tipoNomes: Record<string, string> = {
      cessao_parcial: 'Cessão Parcial', cessao_total: 'Cessão Total', coedicao: 'Coedição',
    }
    const partes = [
      `Cedente: ${c.titular_nome || '—'}`,
      ...(c.obras?.flatMap((o: any) => o.co_autores?.filter((ca: any) => ca.nome)
        .map((ca: any) => `Co-autor: ${ca.nome}`)) || []),
      `Responsável Editora: ${c.responsavel_editora_id || 'TOP SHOW MUSIC'}`,
      `Testemunha 1: ${c.testemunha1_id || '—'}`,
      `Testemunha 2: ${c.testemunha2_id || '—'}`,
    ]
    const obras = (c.obras || []).map((o: any, i: number) =>
      `OBRA ${i + 1}: ${o.titulo}  |  ${c.titular_nome}: ${o.pct_autor}%` +
      (o.co_autores?.length ? '\n  Co-autores: ' + o.co_autores.map((ca: any) => `${ca.nome} ${ca.pct}%`).join(', ') : '')
    )
    const txt = [
      '='.repeat(56),
      `  CONTRATO DE ${(tipoNomes[c.tipo] || c.tipo || '').toUpperCase()}`,
      modo === 'assinado' ? '  *** ASSINADO PELAS PARTES ***' : '  *** RASCUNHO ***',
      '='.repeat(56),
      `Número       : ${c.numero}`,
      `Data Emissão : ${c.data_emissao || '—'}`,
      `Provedor     : ${(c.provedor_assinatura || '').toUpperCase()}`,
      '',
      '── OBRAS ───────────────────────────────────────────',
      ...obras,
      '',
      '── PARTES ──────────────────────────────────────────',
      ...partes.map(p => modo === 'assinado' ? p + '\n  ✓ Assinado digitalmente' : p + '\n  _________________________________'),
      '',
      '='.repeat(56),
    ].join('\n')
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${c.numero}_${modo}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function marcarAssinado(id: string) {
    const updated = contratosObras.map(c => c.id === id ? { ...c, status: 'assinado' } : c)
    setContratosObras(updated)
    localStorage.setItem('sync_contratos_obras_v1', JSON.stringify(updated))
  }

  const editoras = useMemo(() => {
    // Prioriza editoras do banco; fallback para mock para exibição dos filtros
    const nomes = [...new Set([...contratosApi, ...MOCK_CONTRATOS_V2].map((c: any) => c.editora_nome).filter(Boolean))]
    return ['todos', ...nomes]
  }, [contratosApi])

  // Usa contratos do banco se disponível, senão usa mock como fallback visual
  const fonteContratos = contratosApi.length > 0 ? contratosApi : MOCK_CONTRATOS_V2

  const contratos = useMemo(() => {
    return fonteContratos.filter((c: any) => {
      if (filterTipo !== 'todos' && c.tipo !== filterTipo) return false
      if (filterStatus !== 'todos' && c.status !== filterStatus) return false
      if (filterEditora !== 'todos' && c.editora_nome !== filterEditora) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          (c.numero ?? '').toLowerCase().includes(q) ||
          (c.titular_principal ?? '').toLowerCase().includes(q) ||
          (c.editora_nome ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, filterTipo, filterStatus, filterEditora, fonteContratos])

  return (
    <div className="space-y-6">
      {/* Alerta exclusividade vencendo */}
      {ALERTAS_EXCLUSIVIDADE.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-0.5">
              Alertas de Exclusividade
            </p>
            <p className="text-xs text-amber-400/80">
              {ALERTAS_EXCLUSIVIDADE.length} contrato(s) com exclusividade autoral vencendo em menos de 90 dias.{' '}
              <Link href="/master/contratos/alertas" className="underline hover:text-amber-300">
                Ver alertas
              </Link>
            </p>
          </div>
        </div>
      )}

      <PageHeader
        title="Contratos"
        description="Motor de contratos autorais — cessoes, licencas, administracao e coedicao"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/master/contratos/novo/obras">
              <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm text-white font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Contrato de Obras
              </button>
            </Link>
            <Link href="/master/contratos/novo">
              <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Outros Contratos
              </button>
            </Link>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          title="Contratos Ativos"
          value={apiKpis?.em_vigor ?? 0}
          subtitle={`de ${apiKpis?.total ?? 0} total`}
          accent="emerald"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          title="Vencendo em 30d"
          value={apiKpis?.vencendo ?? 0}
          subtitle="requerem renovacao"
          accent="amber"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        />
        <KpiCard
          title="Ag. Assinatura"
          value={apiKpis?.aguardando_assinatura ?? 0}
          subtitle="pendentes"
          accent="rose"
          icon={<Clock className="w-4 h-4 text-rose-400" />}
        />
        <KpiCard
          title="Vencidos"
          value={apiKpis?.vencidos ?? 0}
          subtitle="precisam de acao"
          accent="violet"
          icon={<Calendar className="w-4 h-4 text-violet-400" />}
        />
      </div>

      {/* Contratos de Obras (localStorage) */}
      {contratosObras.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white/60 uppercase tracking-wider">Contratos de Obras</p>
            <span className="text-xs bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">{contratosObras.length}</span>
          </div>
          {contratosObras.map(c => {
            const assinado = c.status === 'assinado'
            const tipoNomes: Record<string, string> = {
              cessao_parcial: 'Cessão Parcial', cessao_total: 'Cessão Total', coedicao: 'Coedição',
            }
            return (
              <div key={c.id} className="bg-[#0d1526] border border-teal-500/20 rounded-xl px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-white/90">{c.numero}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        {tipoNomes[c.tipo] || c.tipo}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        assinado
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {assinado ? '✓ Assinado' : 'Rascunho'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-white/40 flex-wrap">
                      <span><User className="w-3 h-3 inline mr-1" />{c.titular_nome}</span>
                      <span><Calendar className="w-3 h-3 inline mr-1" />{c.data_emissao}</span>
                      <span>{(c.obras || []).length} obra(s)</span>
                    </div>
                  </div>
                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => downloadContratoObra(c, 'rascunho')}
                      title="Baixar rascunho"
                      className="h-8 px-3 flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 border border-white/[0.08] hover:border-white/15 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Rascunho
                    </button>
                    {assinado ? (
                      <button
                        onClick={() => downloadContratoObra(c, 'assinado')}
                        title="Baixar contrato assinado"
                        className="h-8 px-3 flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Assinado
                      </button>
                    ) : (
                      <button
                        onClick={() => marcarAssinado(c.id)}
                        title="Marcar como assinado por todas as partes"
                        className="h-8 px-3 flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Assinado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por numero, titular ou editora..."
              className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/40"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value as FilterTipo)}
              className="h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
            >
              {TIPOS_FILTER.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as FilterStatus)}
              className="h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
            >
              {STATUS_FILTER.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={filterEditora}
              onChange={e => setFilterEditora(e.target.value)}
              className="h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-xs text-white/70 outline-none focus:border-violet-500/40"
            >
              {editoras.map(e => (
                <option key={e} value={e}>{e === 'todos' ? 'Todas as editoras' : e}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-white/30 mt-3">
          {contratos.length} contrato(s) encontrado(s)
        </p>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {contratos.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">
            Nenhum contrato encontrado com os filtros atuais.
          </div>
        ) : (
          contratos.map(c => (
            <Link key={c.id} href={`/master/contratos/${c.id}`}>
              <div className="group bg-[#0d1526] border border-white/[0.06] hover:border-white/10 rounded-xl px-5 py-4 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-violet-400" />
                  </div>

                  {/* Main */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-white/90">{c.numero}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_CONTRATO_V2_COLORS[c.tipo as TipoContratoV2] ?? 'bg-white/10 text-white/60'}`}>
                        {TIPO_CONTRATO_V2_LABELS[c.tipo as TipoContratoV2] ?? c.tipo}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONTRATO_V2_COLORS[c.status as StatusContratoV2] ?? 'bg-white/10 text-white/60'}`}>
                        {STATUS_CONTRATO_V2_LABELS[c.status as StatusContratoV2] ?? c.status}
                      </span>
                      {c.exclusividade && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">
                          Exclusividade
                        </span>
                      )}
                      {c.status === 'vencendo' && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Bell className="w-3 h-3" /> Vencendo em {c._dias_para_vencer}d
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
                      <span className="flex items-center gap-1">
                        {c.titular_tipo_pessoa === 'PJ' ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {c.titular_principal ?? '—'}
                      </span>
                      <span className="text-white/20">·</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {c.editora_nome}
                      </span>
                      <span className="text-white/20">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(c.vigencia_inicio)} – {c.prazo_indeterminado ? 'Indeterminado' : formatDate(c.vigencia_fim)}
                      </span>
                    </div>
                  </div>

                  {/* Right KPIs */}
                  <div className="hidden lg:flex items-center gap-6 text-xs text-white/40">
                    <div className="text-right">
                      <div className="text-white/70 font-semibold text-sm">{c._obras_count ?? 0}</div>
                      <div>obras</div>
                    </div>
                    {(c._recoupment_aberto ?? 0) > 0 && (
                      <div className="text-right">
                        <div className="text-rose-400 font-semibold text-sm">
                          {formatCurrency(c._recoupment_aberto!)}
                        </div>
                        <div>recoupment</div>
                      </div>
                    )}
                    {(c._assinaturas_pendentes ?? 0) > 0 && (
                      <div className="text-right">
                        <div className="text-amber-400 font-semibold text-sm">{c._assinaturas_pendentes}</div>
                        <div>pend. assinar</div>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Quick links */}
      <div className="flex gap-3 text-xs text-white/40 pt-2">
        <Link href="/master/contratos/modelos" className="hover:text-violet-400 transition-colors">
          Biblioteca de Modelos Juridicos
        </Link>
        <span>·</span>
        <Link href="/master/contratos/alertas" className="hover:text-amber-400 transition-colors">
          Alertas de Exclusividade
        </Link>
      </div>
    </div>
  )
}
