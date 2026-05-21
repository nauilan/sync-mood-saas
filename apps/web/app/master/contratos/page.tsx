'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Plus, Search, Filter, CheckCircle2, Clock, AlertTriangle, CalendarX2, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import type { ContratoRow, StatusContrato, TipoContrato } from '@/lib/types-contratos'
import {
  STATUS_CONTRATO_LABELS, STATUS_CONTRATO_COLORS,
  TIPO_CONTRATO_LABELS, TIPO_CONTRATO_COLORS,
} from '@/lib/types-contratos'

const MOCK_CONTRATOS: ContratoRow[] = [
  {
    id: 'c1', tenant_id: 't1', numero: 'TSM-2024-001', tipo: 'cessao', status: 'em_vigor',
    vigencia_inicio: '2024-01-10', vigencia_fim: '2026-01-10', renovacao_automatica: true,
    created_at: '2024-01-10T10:00:00Z', updated_at: '2024-01-10T10:00:00Z',
    titular_principal: 'Nauilan Barbosa Silva', _obras_count: 8, _assinaturas_pendentes: 0,
  },
  {
    id: 'c2', tenant_id: 't1', numero: 'TSM-2024-015', tipo: 'administracao', status: 'em_vigor',
    vigencia_inicio: '2024-03-01', vigencia_fim: '2027-03-01', renovacao_automatica: false,
    created_at: '2024-03-01T10:00:00Z', updated_at: '2024-03-01T10:00:00Z',
    titular_principal: 'Giovani Alves Rodrigues', _obras_count: 4, _assinaturas_pendentes: 0,
  },
  {
    id: 'c3', tenant_id: 't1', numero: 'TSM-2024-032', tipo: 'edicao', status: 'aguardando_assinatura',
    vigencia_inicio: '2024-05-20', vigencia_fim: '2027-05-20', renovacao_automatica: true,
    created_at: '2024-05-20T10:00:00Z', updated_at: '2024-05-20T10:00:00Z',
    titular_principal: 'Marcelo Costa Ferreira', _obras_count: 5, _assinaturas_pendentes: 2,
  },
  {
    id: 'c4', tenant_id: 't1', numero: 'TSM-2024-047', tipo: 'cessao', status: 'vencendo',
    vigencia_inicio: '2022-06-01', vigencia_fim: '2024-07-15', renovacao_automatica: false,
    created_at: '2022-06-01T10:00:00Z', updated_at: '2022-06-01T10:00:00Z',
    titular_principal: 'Ana Paula Santos', _obras_count: 2, _assinaturas_pendentes: 0,
  },
  {
    id: 'c5', tenant_id: 't1', numero: 'TSM-2023-008', tipo: 'coedicao', status: 'revogado',
    vigencia_inicio: '2023-01-15', vigencia_fim: '2025-01-15', renovacao_automatica: false,
    created_at: '2023-01-15T10:00:00Z', updated_at: '2023-09-10T10:00:00Z',
    titular_principal: 'Edi Music Editora Ltda', _obras_count: 3, _assinaturas_pendentes: 0,
  },
  {
    id: 'c6', tenant_id: 't1', numero: 'TSM-2024-060', tipo: 'licenca', status: 'em_vigor',
    vigencia_inicio: '2024-07-01', vigencia_fim: '2025-07-01', renovacao_automatica: true,
    created_at: '2024-07-01T10:00:00Z', updated_at: '2024-07-01T10:00:00Z',
    titular_principal: 'Joao Pedro Moraes Lima', _obras_count: 1, _assinaturas_pendentes: 0,
  },
  {
    id: 'c7', tenant_id: 't1', numero: 'TSM-2024-071', tipo: 'representacao', status: 'rascunho',
    vigencia_inicio: '2024-08-01', renovacao_automatica: false,
    created_at: '2024-08-01T10:00:00Z', updated_at: '2024-08-01T10:00:00Z',
    titular_principal: 'Marcelo Costa Ferreira', _obras_count: 0, _assinaturas_pendentes: 0,
  },
]

const kpis = {
  total: MOCK_CONTRATOS.length,
  em_vigor: MOCK_CONTRATOS.filter(c => c.status === 'em_vigor').length,
  pendentes: MOCK_CONTRATOS.filter(c => c.status === 'aguardando_assinatura').length,
  vencendo: MOCK_CONTRATOS.filter(c => c.status === 'vencendo').length,
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function ContratosPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusContrato | ''>('')
  const [filterTipo, setFilterTipo] = useState<TipoContrato | ''>('')

  const filtered = MOCK_CONTRATOS.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.numero.toLowerCase().includes(q) || c.titular_principal.toLowerCase().includes(q)
    const matchStatus = !filterStatus || c.status === filterStatus
    const matchTipo = !filterTipo || c.tipo === filterTipo
    return matchSearch && matchStatus && matchTipo
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestao de Contratos"
        description="Contratos autorais, de cessao e administracao de direitos"
        actions={
          <Link href="/master/contratos/novo">
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Novo Contrato
            </button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total de Contratos" value={kpis.total} subtitle="todos os status" accent="violet" icon={<FileText className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Em Vigor" value={kpis.em_vigor} subtitle="contratos ativos" accent="emerald" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Pend. Assinatura" value={kpis.pendentes} subtitle="aguardando partes" accent="amber" icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Vencendo em 90d" value={kpis.vencendo} subtitle="requer renovacao" accent="rose" icon={<CalendarX2 className="w-4 h-4 text-rose-400" />} />
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors"
              placeholder="Buscar por numero ou titular..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/30" />
            <select
              className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-violet-500/50 transition-colors"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as StatusContrato | '')}
            >
              <option value="">Todos os status</option>
              {(Object.keys(STATUS_CONTRATO_LABELS) as StatusContrato[]).map(k => (
                <option key={k} value={k}>{STATUS_CONTRATO_LABELS[k]}</option>
              ))}
            </select>
            <select
              className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none"
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value as TipoContrato | '')}
            >
              <option value="">Todos os tipos</option>
              {(Object.keys(TIPO_CONTRATO_LABELS) as TipoContrato[]).map(k => (
                <option key={k} value={k}>{TIPO_CONTRATO_LABELS[k]}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-white/30">{filtered.length} contrato{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Numero</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">Titular Principal</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Vigencia</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Obras</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Acao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <span className="text-sm font-mono font-medium text-white">{c.numero}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm text-white/70">{c.titular_principal}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + TIPO_CONTRATO_COLORS[c.tipo]}>
                    {TIPO_CONTRATO_LABELS[c.tipo]}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="text-xs text-white/50">
                    <span>{formatDate(c.vigencia_inicio)}</span>
                    {c.vigencia_fim && <span> — {formatDate(c.vigencia_fim)}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + STATUS_CONTRATO_COLORS[c.status]}>
                      {STATUS_CONTRATO_LABELS[c.status]}
                    </span>
                    {c._assinaturas_pendentes > 0 && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <span className="text-sm text-white/60">{c._obras_count}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={'/master/contratos/' + c.id}
                    className="flex items-center justify-end gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors group-hover:text-white/60"
                  >
                    Ver <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">
                  Nenhum contrato encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
