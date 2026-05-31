'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Target, FileDown, Globe, Database, Globe2, Upload,
  ChevronRight, Plus, Package, CheckCircle2, RefreshCw, AlertCircle,
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
        title="BACKOFFICE"
        description="Central BackOffice Music Services — identificacao de ONIs e exportacoes CWR/SWI para sociedades."
      />

      {/* 2 main module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/master/backoffice/match-lista-oni"
          className="group bg-[#0d1526] border border-violet-500/20 rounded-xl p-5 flex flex-col gap-4 hover:border-violet-500/40 hover:bg-white/[0.02] transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="bg-violet-500/15 rounded-xl p-3 shrink-0">
              <Target className="w-6 h-6 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-violet-300 leading-tight">Match Lista ONI</h2>
              <p className="text-[11px] text-white/35 mt-1 leading-relaxed">
                Cruzamento automatico das listas semanais de Obras Nao Identificadas com o catalogo da editora.
                Libere royalties retidos em ate 48h.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-violet-400 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-auto">
            {[
              { label: 'Listas', value: KPI_ONI.total_listas },
              { label: 'Confirmados', value: KPI_ONI.matches_confirmados },
              { label: 'Pendentes', value: KPI_ONI.listas_pendentes },
            ].map(stat => (
              <div key={stat.label} className="bg-violet-500/[0.07] rounded-lg p-2 text-center">
                <p className="text-base font-bold text-violet-300">{stat.value}</p>
                <p className="text-[9px] text-white/30">{stat.label}</p>
              </div>
            ))}
          </div>
        </Link>

        <Link
          href="/master/backoffice/exportacoes"
          className="group bg-[#0d1526] border border-sky-500/20 rounded-xl p-5 flex flex-col gap-4 hover:border-sky-500/40 hover:bg-white/[0.02] transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="bg-sky-500/15 rounded-xl p-3 shrink-0">
              <FileDown className="w-6 h-6 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-sky-300 leading-tight">Exportacoes CWR</h2>
              <p className="text-[11px] text-white/35 mt-1 leading-relaxed">
                Gere e envie arquivos CWR 2.1-5, SWI e XML para SOCINPRO, BackOffice MS e parceiros internacionais.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-sky-400 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-auto">
            {[
              { label: 'Total', value: KPI_EXPORTACOES.total },
              { label: 'Enviadas', value: KPI_EXPORTACOES.enviadas },
              { label: 'Erros', value: KPI_EXPORTACOES.erros },
            ].map(stat => (
              <div key={stat.label} className="bg-sky-500/[0.07] rounded-lg p-2 text-center">
                <p className="text-base font-bold text-sky-300">{stat.value}</p>
                <p className="text-[9px] text-white/30">{stat.label}</p>
              </div>
            ))}
          </div>
        </Link>
      </div>

      {/* Exportacoes CWR section */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
          Exportacoes CWR — Destinos
        </p>

        {/* Quick Stats */}
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

        {/* Destination Cards */}
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
