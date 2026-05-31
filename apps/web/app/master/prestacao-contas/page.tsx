'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import {
  Search, FileText, Plus, Mail, MessageCircle, Globe, Layers,
  ChevronRight, AlertTriangle,
} from 'lucide-react'
import { MOCK_PRESTACOES, KPI_PRESTACOES } from '@/lib/mock-prestacao'
import {
  PRESTACAO_STATUS_LABELS, PRESTACAO_STATUS_COLORS,
  CANAL_ENVIO_LABELS, type PrestacaoStatus, type CanalEnvio,
} from '@/lib/types-prestacao'

const CANAL_ICONS: Record<CanalEnvio, React.ReactNode> = {
  email: <Mail className="w-3 h-3" />,
  whatsapp: <MessageCircle className="w-3 h-3" />,
  portal: <Globe className="w-3 h-3" />,
  multiplo: <Layers className="w-3 h-3" />,
}

function StatusBadge({ status }: { status: PrestacaoStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRESTACAO_STATUS_COLORS[status]}`}>
      {PRESTACAO_STATUS_LABELS[status]}
    </span>
  )
}

export default function PrestacaoContasPage() {
  const [search, setSearch] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<PrestacaoStatus | 'todos'>('todos')

  const filtered = MOCK_PRESTACOES.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.titular_nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
    const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prestação de Contas"
        description="Demonstrativos gerados, enviados e aprovados por titular."
        actions={
          <Link href="/master/prestacao-contas/nova" className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Nova Prestação
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Geradas" value={KPI_PRESTACOES.total_geradas} accent="sky" icon={<FileText className="w-4 h-4 text-white/40" />} />
        <KpiCard title="Enviadas" value={KPI_PRESTACOES.total_enviadas} accent="sky" icon={<Mail className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Aprovadas" value={KPI_PRESTACOES.total_aprovadas} accent="emerald" icon={<FileText className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Contestadas" value={KPI_PRESTACOES.total_contestadas} accent="rose" icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} />
        <KpiCard title="Pagas" value={KPI_PRESTACOES.total_pagas} accent="violet" icon={<FileText className="w-4 h-4 text-violet-400" />} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors"
            placeholder="Buscar por titular ou código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['todos', 'gerada', 'enviada', 'aprovada', 'contestada', 'paga'] as const).map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)} className={['h-8 px-3 rounded-lg text-xs font-medium transition-colors', filtroStatus === s ? 'bg-violet-600 text-white' : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80'].join(' ')}>
              {s === 'todos' ? 'Todos' : PRESTACAO_STATUS_LABELS[s as PrestacaoStatus]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Código</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Titular</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden lg:table-cell">Período</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor Liq.</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden sm:table-cell">Canal</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden xl:table-cell">Gerada em</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-5 py-3.5">
                  <span className="text-xs font-mono text-white/60">{p.codigo}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-violet-400">{p.titular_nome.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{p.titular_nome}</p>
                      <span className={['text-[9px] font-semibold px-1 rounded', p.titular_tipo === 'PF' ? 'text-amber-400' : 'text-sky-400'].join(' ')}>{p.titular_tipo}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <p className="text-xs text-white/50">{new Date(p.periodo_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} – {new Date(p.periodo_fim + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <p className="text-sm font-bold text-emerald-400 tabular-nums">R$ {p.valor_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  {p.retencoes_total > 0 && <p className="text-[10px] text-rose-400/70 tabular-nums">-R$ {p.retencoes_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ret.</p>}
                </td>
                <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  {p.canal_envio ? (
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      {CANAL_ICONS[p.canal_envio]}
                      {CANAL_ENVIO_LABELS[p.canal_envio]}
                    </span>
                  ) : <span className="text-xs text-white/20">—</span>}
                </td>
                <td className="px-4 py-3.5 hidden xl:table-cell">
                  <span className="text-xs text-white/40">{new Date(p.data_geracao).toLocaleDateString('pt-BR')}</span>
                </td>
                <td className="px-5 py-3.5">
                  <Link href={`/master/prestacao-contas/${p.id}`} className="flex items-center justify-end gap-1 text-xs text-white/25 group-hover:text-violet-400 transition-colors">
                    Ver <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-white/30">{filtered.length} prestação(ões)</p>
        </div>
      </div>
    </div>
  )
}
