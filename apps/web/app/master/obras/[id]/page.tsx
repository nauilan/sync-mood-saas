'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Edit, AlignLeft, Mic2, FileText, Link2, Activity, AlertTriangle,
  CheckCircle2, ChevronRight, ExternalLink, Music, Users2, Globe2, DollarSign, Users,
} from 'lucide-react'
import { STATUS_OBRA_LABELS, STATUS_OBRA_COLORS, PAPEL_TITULAR_LABELS, PAPEL_TITULAR_COLORS, normalizarLinksObra } from '@/lib/types-obras'
import { formatarPercentual } from '@/lib/percentual'
import { getObraById, getLinksById, getFonogramasById } from '@/lib/mock-obras'
import { getAutorizacoesByObra } from '@/lib/mock-autorizacoes'
import { MOCK_EDITORAS } from '@/lib/mock-cadastros'
import { MOCK_CC_OBRAS, fmtBRL, fmtDate } from '@/lib/mock-cc'

const TABS = [
  { id: 'resumo',         label: 'Resumo',              icon: Music },
  { id: 'integrantes',    label: 'Integrantes da Obra',  icon: Users2 },
  { id: 'conta_corrente', label: 'Conta Corrente',       icon: DollarSign },
  { id: 'letra',          label: 'Letra',               icon: AlignLeft },
  { id: 'fonogramas',     label: 'Fonogramas',           icon: Mic2 },
  { id: 'contratos',      label: 'Contratos',            icon: FileText },
  { id: 'exportacoes',    label: 'Exportações',          icon: Activity },
  { id: 'divergencias',   label: 'Divergências',         icon: AlertTriangle },
]

// Parseia o campo descricao em campos estruturados
function parseDescricao(desc?: string) {
  if (!desc) return null
  const parts = desc.split(' | ')
  const header = parts[0]
  const fields: { label: string; value: string }[] = []
  for (const part of parts.slice(1)) {
    const i = part.indexOf(':')
    if (i > -1) fields.push({ label: part.slice(0, i).trim(), value: part.slice(i + 1).trim() })
  }
  return { header, fields }
}

// Siglas de categoria → badge color
const SIGLA_COLOR: Record<string, string> = {
  CA: 'bg-violet-600 text-white',
  E:  'bg-sky-600 text-white',
  SE: 'bg-indigo-600 text-white',
  AM: 'bg-amber-600 text-white',
  V:  'bg-emerald-600 text-white',
  AD: 'bg-rose-600 text-white',
  AR: 'bg-pink-600 text-white',
}

function papelToSigla(papel: string): string {
  const map: Record<string, string> = {
    compositor: 'CA', autor_ca: 'CA', autor: 'CA',
    editora: 'E', editora_original: 'E',
    subeditora: 'SE',
    administradora: 'AM', editora_administradora: 'AM',
    versionista: 'V', adaptador: 'AD', arranjador: 'AR',
  }
  return map[papel] ?? papel.toUpperCase().slice(0, 3)
}

function SiglaBadge({ papel }: { papel: string }) {
  const sigla = papelToSigla(papel)
  const color = SIGLA_COLOR[sigla] ?? 'bg-white/10 text-white/60'
  return (
    <span className={`inline-flex items-center justify-center w-7 h-6 rounded text-[10px] font-bold ${color}`}>
      {sigla}
    </span>
  )
}

function ControleBadge({ pct, label, color }: { pct: number; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-start px-4 py-3 rounded-xl border min-w-[160px] ${color}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-xl font-bold tabular-nums">{formatarPercentual(pct)}</span>
      <div className="w-full h-1 bg-black/20 rounded-full mt-1.5 overflow-hidden">
        <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

export default function ObraDetailPage({ params }: { params: { id: string } }) {
  const obra = getObraById(params.id)
  const links = normalizarLinksObra(getLinksById(params.id))
  const fonogramas = getFonogramasById(params.id)
  const autorizacoes = getAutorizacoesByObra(params.id)
  const [activeTab, setActiveTab] = useState('resumo')

  if (!obra) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-white/40">
        <Music className="w-10 h-10" />
        <p className="text-sm">Obra nao encontrada</p>
        <Link href="/master/obras" className="text-xs text-violet-400 hover:text-violet-300">
          Voltar para Obras
        </Link>
      </div>
    )
  }

  const editora = MOCK_EDITORAS.find(e => e.id === obra.editora_id)
  const pcControlado = obra._percentual_controlado ?? 0

  return (
    <div className="space-y-5">
      <PageHeader
        title={obra.titulo}
        description={`Codigo: ${obra.codigo}${obra.iswc ? '  |  ISWC: ' + obra.iswc : '  |  ISWC: Pendente'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/master/obras" className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors flex items-center">
              Voltar
            </Link>
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors">
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        }
      />

      {/* Status bar */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_OBRA_COLORS[obra.status]}`}>
            {STATUS_OBRA_LABELS[obra.status]}
          </span>
          {obra.genero && <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50">{obra.genero}</span>}
          <span className="text-xs text-white/30">|</span>
          <span className="text-xs text-white/40">{obra.idioma}</span>
          {obra.ano_criacao && <><span className="text-xs text-white/30">|</span><span className="text-xs text-white/40">{obra.ano_criacao}</span></>}
          <span className="text-xs text-white/30">|</span>
          <span className={`text-xs font-semibold ${obra.iswc ? 'text-emerald-400' : 'text-amber-400'}`}>
            ISWC: {obra.iswc ?? 'Pendente'}
          </span>
          {editora && (
            <><span className="text-xs text-white/30">|</span>
            <span className="text-xs text-white/40">Editora: <span className="text-white/60">{editora.nome_fantasia}</span></span></>
          )}
          {/* Código legado */}
          {obra.codigo_interno_legado && obra.codigo_interno_legado !== obra.codigo && (
            <><span className="text-xs text-white/30">|</span>
            <span className="text-[10px] font-mono bg-violet-500/10 text-violet-300 rounded px-1.5 py-0.5"
              title="Código interno legado (CWR/sistema antigo)">
              {obra.codigo_interno_legado}
            </span></>
          )}
          {/* Status BackOffice */}
          {obra.backoffice_status && obra.backoffice_status !== 'nao_enviada' && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              obra.backoffice_status === 'work_ativa' ? 'bg-emerald-500/10 text-emerald-300' :
              obra.backoffice_status === 'song_passiva' ? 'bg-sky-500/10 text-sky-300' :
              obra.backoffice_status === 'rejeitada' ? 'bg-red-500/10 text-red-400' :
              'bg-amber-500/10 text-amber-300'
            }`}>
              BO: {obra.backoffice_status.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <ControleBadge pct={pcControlado} label="Percentual Controlado" color="bg-violet-500/10 border-violet-500/20 text-violet-300" />
          <ControleBadge pct={fonogramas.length > 0 ? 100 : 0} label={`Fonogramas (${fonogramas.length})`} color="bg-sky-500/10 border-sky-500/20 text-sky-300" />
          <ControleBadge pct={autorizacoes.length * 12.5} label={`Autorizacoes (${autorizacoes.length})`} color="bg-emerald-500/10 border-emerald-500/20 text-emerald-300" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-white/[0.06] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 h-9 px-4 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
              ${activeTab === tab.id
                ? 'border-violet-500 text-white'
                : 'border-transparent text-white/40 hover:text-white/70'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Resumo */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Dados da Obra</h3>
            {[
              { label: 'Titulo',           value: obra.titulo },
              { label: 'Titulo Original',  value: obra.titulo_original ?? '—' },
              { label: 'Codigo Sync Mood', value: obra.codigo },
              { label: 'Codigo Legado',    value: obra.codigo_interno_legado ?? '—', mono: true },
              { label: 'Codigo CWR Orig.', value: obra.codigo_obra_cwr_original ?? '—', mono: true },
              { label: 'ISWC',             value: obra.iswc ?? 'Pendente SOCINPRO' },
              { label: 'Idioma',           value: obra.idioma },
              { label: 'Genero',           value: obra.genero ?? '—' },
              { label: 'Ano de Criacao',   value: obra.ano_criacao?.toString() ?? '—' },
              { label: 'Duracao',          value: obra.duracao ? `${Math.floor(obra.duracao/60)}:${String(obra.duracao%60).padStart(2,'0')}` : '—' },
              { label: 'Origem',           value: obra.origem_importacao ?? 'manual' },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-xs text-white/35">{f.label}</span>
                <span className={`text-xs text-white/70 font-medium ${(f as {mono?: boolean}).mono ? 'font-mono bg-white/5 px-1.5 py-0.5 rounded' : ''}`}>{f.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Controle & BackOffice</h3>
            {[
              { label: 'Status',               value: STATUS_OBRA_LABELS[obra.status] },
              { label: 'Editora Responsavel',  value: editora?.nome_fantasia ?? '—' },
              { label: 'Links de Participacao',value: String(links.length) },
              { label: 'Links Controlados',    value: String(links.filter(l => l.controlado).length) },
              { label: '% Controlado',         value: `${pcControlado.toFixed(3)}%` },
              { label: 'Fonogramas',           value: String(fonogramas.length) },
              { label: 'Autorizacoes',         value: String(autorizacoes.length) },
              { label: 'BackOffice Song ID',   value: obra.backoffice_song_id ?? '—', mono: true },
              { label: 'BackOffice Work ID',   value: obra.backoffice_work_id ?? '—', mono: true },
              { label: 'Status BackOffice',    value: obra.backoffice_status ?? 'nao_enviada' },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <span className="text-xs text-white/35">{f.label}</span>
                <span className={`text-xs text-white/70 font-medium ${(f as {mono?: boolean}).mono ? 'font-mono bg-white/5 px-1.5 py-0.5 rounded text-[11px]' : ''}`}>{f.value}</span>
              </div>
            ))}
          </div>
          {obra.observacoes && (
            <div className="lg:col-span-2 bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-xs font-semibold text-white/50 mb-2">Observacoes</h3>
              <p className="text-sm text-white/60 leading-relaxed">{obra.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Integrantes da Obra */}
      {activeTab === 'integrantes' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs text-white/40">
              {links.length} link{links.length !== 1 ? 's' : ''} · {links.filter(l => l.controlado).length} controlado{links.filter(l=>l.controlado).length!==1?'s':''}
            </span>
            <span className="text-xs text-violet-400 font-semibold ml-auto">{pcControlado.toFixed(2)}% controlado</span>
          </div>

          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-white">Integrantes da Obra</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold text-xs w-12">Link</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-semibold text-xs">Nome</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold text-xs w-28">IPI / Cód.</th>
                    <th className="text-center px-4 py-2.5 text-white/30 font-semibold text-xs w-16">Cat.</th>
                    <th className="text-right px-5 py-2.5 text-white/30 font-semibold text-xs w-24">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {links.flatMap(link =>
                    (link.titulares ?? []).map(t => (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-[10px] font-bold text-white">
                            {link.ordem}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${t.controlado ? 'text-white/80' : 'text-white/55'}`}>
                            {t.nome}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-sm text-violet-400/80">
                            {t.ipi || t.cae || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <SiglaBadge papel={t.papel} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-semibold tabular-nums text-sky-300/90 text-sm">
                            {formatarPercentual(t.percentual)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.08]">
                    <td colSpan={4} className="px-4 py-2 text-right text-xs text-white/25 font-medium">Total</td>
                    <td className="px-5 py-2 text-right font-bold tabular-nums text-xs text-white/50">
                      {formatarPercentual(links.flatMap(l => l.titulares ?? []).reduce((s, t) => s + t.percentual, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Letra */}
      {activeTab === 'letra' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Letra da Obra</h3>
          <div className="text-white/40 text-sm italic py-8 text-center">
            Letra nao cadastrada para esta obra.
          </div>
        </div>
      )}

      {/* Tab: Fonogramas */}
      {activeTab === 'fonogramas' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Fonogramas ({fonogramas.length})</h3>
          </div>
          {fonogramas.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/30">Nenhum fonograma cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-5 py-2 text-white/30 font-semibold">Titulo</th>
                    <th className="text-left px-4 py-2 text-white/30 font-semibold">Interprete</th>
                    <th className="text-center px-4 py-2 text-white/30 font-semibold">ISRC</th>
                    <th className="text-center px-4 py-2 text-white/30 font-semibold">Plataformas</th>
                    <th className="text-center px-4 py-2 text-white/30 font-semibold">Lancamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {fonogramas.map(f => (
                    <tr key={f.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-medium text-white/70">{f.titulo_fonograma}</td>
                      <td className="px-4 py-3 text-white/50">{f.interprete}</td>
                      <td className="px-4 py-3 text-center font-mono text-white/40">{f.isrc ?? <span className="text-amber-400/60 italic">Pendente</span>}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-white/40">{f.plataformas_json?.length ?? 0} plataformas</span>
                      </td>
                      <td className="px-4 py-3 text-center text-white/40">{f.data_lancamento ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Contratos */}
      {activeTab === 'contratos' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Contratos Vinculados</h3>
          {obra.contrato_origem_id ? (
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <div>
                <p className="text-sm text-white/70 font-medium">Contrato de Origem</p>
                <p className="text-xs font-mono text-white/40">{obra.contrato_origem_id}</p>
              </div>
              <Link href={`/master/contratos/${obra.contrato_origem_id}`}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                Ver <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-white/30">Nenhum contrato vinculado.</div>
          )}
        </div>
      )}

      {/* Tab: Exportacoes */}
      {activeTab === 'exportacoes' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Historico de Exportacoes</h3>
          <div className="py-8 text-center text-xs text-white/30">Nenhuma exportacao registrada.</div>
        </div>
      )}

      {/* Tab: Conta Corrente */}
      {activeTab === 'conta_corrente' && (() => {
        const ccObras = MOCK_CC_OBRAS.filter(o => o.obra_id === params.id)
        const totalSaldo = ccObras.reduce((s, o) => s + o.saldo_atual, 0)
        const totalDist  = ccObras.reduce((s, o) => s + o.saldo_distribuido, 0)
        if (ccObras.length === 0) return (
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-10 text-center text-white/30 text-sm">
            Nenhum recebimento distribuído para esta obra ainda.
          </div>
        )
        return (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#0d1526] border border-emerald-500/10 rounded-2xl p-4">
                <p className="text-[10px] text-emerald-400/70 mb-1">Saldo Total</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">{fmtBRL(totalSaldo)}</p>
              </div>
              <div className="bg-[#0d1526] border border-violet-500/10 rounded-2xl p-4">
                <p className="text-[10px] text-violet-400/70 mb-1">Total Distribuído</p>
                <p className="text-xl font-bold text-violet-400 tabular-nums">{fmtBRL(totalDist)}</p>
              </div>
              <div className="bg-[#0d1526] border border-sky-500/10 rounded-2xl p-4">
                <p className="text-[10px] text-sky-400/70 mb-1">Statements</p>
                <p className="text-xl font-bold text-sky-400 tabular-nums">{ccObras.length}</p>
              </div>
            </div>

            {/* Por statement */}
            {ccObras.map(cc => {
              const allMovimentos = cc.movimentos
              return (
                <div key={cc.id} className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white/80">{cc.obra_titulo}</p>
                      <p className="text-[10px] text-white/35 font-mono">{cc.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400 tabular-nums">{fmtBRL(cc.saldo_atual)}</p>
                      <p className="text-[10px] text-white/35">saldo</p>
                    </div>
                  </div>

                  {/* Movimentos com campos estruturados */}
                  {allMovimentos.map(m => {
                    const parsed = parseDescricao(m.descricao)
                    return (
                      <div key={m.id} className="px-5 py-4 border-b border-white/[0.04] last:border-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="text-xs font-semibold text-white/70">{parsed?.header ?? m.descricao}</p>
                            <p className="text-[10px] text-white/35">{fmtDate(m.data_movimento)}</p>
                          </div>
                          <span className="text-sm font-bold text-emerald-400 tabular-nums shrink-0">+{fmtBRL(m.valor_liquido)}</span>
                        </div>
                        {parsed && parsed.fields.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {parsed.fields.map(f => (
                              <span key={f.label} className="inline-flex items-center gap-1 text-[10px] bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">
                                <span className="text-white/30">{f.label}:</span>
                                <span className="text-white/65">{f.value}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Distribuições por titular */}
                  {cc.distribuicoes.length > 0 && (
                    <div className="px-5 py-3 border-t border-white/[0.05] bg-white/[0.01]">
                      <p className="text-[10px] text-white/30 font-semibold uppercase mb-2">Distribuição por Titular</p>
                      <div className="space-y-1.5">
                        {cc.distribuicoes.map(d => (
                          <div key={d.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Users className="w-3 h-3 text-violet-400 shrink-0" />
                              <span className="text-xs text-white/60 truncate">{d.titular_nome}</span>
                              <span className="text-[10px] text-white/30 shrink-0">{d.percentual_aplicado.toFixed(2)}%</span>
                            </div>
                            <span className="text-xs font-semibold text-violet-400 tabular-nums shrink-0">{fmtBRL(d.valor_destinado)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Tab: Divergencias */}
      {activeTab === 'divergencias' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Divergencias</h3>
          <div className="py-8 text-center text-xs text-white/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
            Nenhuma divergencia aberta.
          </div>
        </div>
      )}
    </div>
  )
}
