'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Target, FileDown, Globe, Database, Globe2, Upload,
  ChevronRight, Plus, Package, CheckCircle2, RefreshCw, AlertCircle,
  BookOpen, ScrollText, AlertTriangle, Shuffle, Hash, Music2,
  FileInput, ShieldAlert,
} from 'lucide-react'
import { MOCK_EXPORTACOES, KPI_EXPORTACOES } from '@/lib/mock-exportacao'
import {
  DESTINO_EXPORTACAO_LABELS,
  STATUS_EXPORTACAO_LABELS,
  STATUS_EXPORTACAO_COLORS,
} from '@/lib/types-exportacao'
import type { DestinoExportacao } from '@/lib/types-exportacao'
import { KPI_ONI } from '@/lib/mock-oni'

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(iso))
}

const DESTINO_CARDS: Array<{
  destino: DestinoExportacao
  label: string
  description: string
  icon: React.ElementType
  accent: string
  borderAccent: string
  iconBg: string
}> = [
  {
    destino: 'socinpro',
    label: 'Exportacao SOCINPRO',
    description: 'Envie obras em formato CWR para registro e cobranca de direitos autorais junto a SOCINPRO.',
    icon: Globe,
    accent: 'text-violet-300',
    borderAccent: 'border-violet-500/30',
    iconBg: 'bg-violet-500/15',
  },
  {
    destino: 'backoffice_music_services',
    label: 'Exportacao BackOffice MS',
    description: 'Exporte seu catalogo em XML para distribuicao e sincronizacao com DSPs via BackOffice MS.',
    icon: Database,
    accent: 'text-sky-300',
    borderAccent: 'border-sky-500/30',
    iconBg: 'bg-sky-500/15',
  },
  {
    destino: 'parceiro_internacional',
    label: 'Parceiros Internacionais',
    description: 'Compartilhe dados de obras com parceiros internacionais em multiplos formatos (CWR, XML, XLSX).',
    icon: Globe2,
    accent: 'text-amber-300',
    borderAccent: 'border-amber-500/30',
    iconBg: 'bg-amber-500/15',
  },
]

// 11 KPIs do Dashboard BackOffice
const BACKOFFICE_KPIS = [
  { label: 'Obras Cadastradas',      value: '1.284', icon: Music2,       color: 'text-white/80'    },
  { label: 'Obras Enviadas',         value: '1.102', icon: Upload,        color: 'text-sky-400'     },
  { label: 'Obras Identificadas',    value: '1.089', icon: CheckCircle2,  color: 'text-emerald-400' },
  { label: 'Sem Identificacao',      value: '13',    icon: AlertCircle,   color: 'text-amber-400'   },
  { label: 'Song Codes Vinculados',  value: '1.089', icon: Hash,          color: 'text-sky-400'     },
  { label: 'ISRCs Vinculados',       value: '876',   icon: Music2,        color: 'text-violet-400'  },
  { label: 'ONIs Pendentes',         value: String(KPI_ONI.listas_pendentes), icon: Target, color: 'text-amber-400' },
  { label: 'ONIs Resolvidas',        value: String(KPI_ONI.matches_confirmados), icon: CheckCircle2, color: 'text-emerald-400' },
  { label: 'Arquivos Processados',   value: '38',    icon: FileInput,     color: 'text-sky-400'     },
  { label: 'Arquivos Pendentes',     value: '2',     icon: RefreshCw,     color: 'text-amber-400'   },
  { label: 'Pendencias Juridicas',   value: '16',    icon: ShieldAlert,   color: 'text-red-400'     },
]

const MODULE_SHORTCUTS = [
  { href: '/master/backoffice/catalogo',            label: 'Catalogo BackOffice',       icon: BookOpen,      accent: 'text-sky-300',    border: 'border-sky-500/20',    bg: 'bg-sky-500/15'    },
  { href: '/master/backoffice/match-lista-oni',     label: 'ONI',                       icon: Target,        accent: 'text-violet-300', border: 'border-violet-500/20', bg: 'bg-violet-500/15' },
  { href: '/master/backoffice/matching',            label: 'Analise de Lancamentos',    icon: Shuffle,       accent: 'text-amber-300',  border: 'border-amber-500/20',  bg: 'bg-amber-500/15'  },
  { href: '/master/backoffice/logs',                label: 'Logs de Processamento',     icon: ScrollText,    accent: 'text-white/60',   border: 'border-white/10',      bg: 'bg-white/[0.06]'  },
  { href: '/master/backoffice/pendencias-juridicas',label: 'Pendencias Juridicas',      icon: AlertTriangle, accent: 'text-red-300',    border: 'border-red-500/20',    bg: 'bg-red-500/15'    },
  { href: '/master/backoffice/exportacoes',         label: 'Exportacoes CWR',           icon: FileDown,      accent: 'text-emerald-300',border: 'border-emerald-500/20',bg: 'bg-emerald-500/15'},
]

export default function BackOfficePage() {
  const latestByDestino = useMemo(() => {
    const map: Partial<Record<DestinoExportacao, (typeof MOCK_EXPORTACOES)[0]>> = {}
    for (const exp of MOCK_EXPORTACOES) {
      const existing = map[exp.destino]
      if (!existing || new Date(exp.criado_em) > new Date(existing.criado_em)) {
        map[exp.destino] = exp
      }
    }
    return map
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="BackOffice — Dashboard"
        description="Central de Informacao: identificacao de obras, Song Codes, ONIs, matching e logs. Nao e modulo financeiro."
      />

      {/* 11 KPIs */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
          Indicadores Operacionais
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {BACKOFFICE_KPIS.map(kpi => (
            <div key={kpi.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <kpi.icon className={`w-3 h-3 ${kpi.color}`} />
                <p className="text-[9px] text-white/35 leading-tight">{kpi.label}</p>
              </div>
              <p className={`text-xl font-bold ${kpi.color} leading-tight`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module shortcuts */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
          Modulos BackOffice
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MODULE_SHORTCUTS.map(mod => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className={`group bg-[#0d1526] border ${mod.border} rounded-xl p-4 flex flex-col gap-3 hover:bg-white/[0.02] transition-all`}
              >
                <div className={`${mod.bg} rounded-lg p-2.5 w-fit`}>
                  <Icon className={`w-4 h-4 ${mod.accent}`} />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-xs font-semibold ${mod.accent} leading-tight`}>{mod.label}</p>
                  <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* CWR exports section */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
          Exportacoes CWR — Destinos
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Exportacoes', value: KPI_EXPORTACOES.total,      icon: Package,     color: 'text-white/80'    },
            { label: 'Enviadas',          value: KPI_EXPORTACOES.enviadas,    icon: Upload,      color: 'text-sky-400'     },
            { label: 'Com Retorno',       value: KPI_EXPORTACOES.com_retorno, icon: RefreshCw,   color: 'text-emerald-400' },
            { label: 'Erros',             value: KPI_EXPORTACOES.erros,       icon: AlertCircle, color: 'text-red-400'     },
          ].map(stat => (
            <div key={stat.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                <p className="text-[10px] text-white/35">{stat.label}</p>
              </div>
              <p className={`text-xl font-bold ${stat.color} leading-tight`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Destination cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {DESTINO_CARDS.map(card => {
            const latest = latestByDestino[card.destino]
            const Icon = card.icon
            return (
              <div key={card.destino} className={`bg-[#0d1526] border ${card.borderAccent} rounded-xl p-5 flex flex-col gap-4`}>
                <div className="flex items-start gap-3">
                  <div className={`${card.iconBg} rounded-lg p-2.5 shrink-0`}>
                    <Icon className={`w-5 h-5 ${card.accent}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-sm font-semibold ${card.accent} leading-tight`}>{card.label}</h2>
                    <p className="text-xs text-white/40 mt-1 leading-relaxed">{card.description}</p>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3 space-y-2">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Ultima Exportacao</p>
                  {latest ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-white/60">{latest.codigo}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_EXPORTACAO_COLORS[latest.status]}`}>
                          {STATUS_EXPORTACAO_LABELS[latest.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-white/35">
                        <span>{latest.total_obras} obras</span>
                        <span>·</span>
                        <span>{latest.total_titulares} titulares</span>
                        <span>·</span>
                        <span>{formatDate(latest.criado_em)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-white/25 italic">Nenhuma exportacao ainda</p>
                  )}
                </div>
                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`/master/backoffice/exportacoes?destino=${card.destino}`}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors"
                  >
                    Ver Exportacoes <ChevronRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/master/backoffice/exportacoes/nova"
                    className={`flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                      card.destino === 'socinpro'
                        ? 'bg-violet-600 hover:bg-violet-500 text-white'
                        : card.destino === 'backoffice_music_services'
                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Nova
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
