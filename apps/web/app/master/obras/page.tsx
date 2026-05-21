import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Music, ChevronRight } from 'lucide-react'
import type { StatusObra } from '@/lib/types-obras'
import { STATUS_OBRA_LABELS, STATUS_OBRA_COLORS } from '@/lib/types-obras'

export const metadata = { title: 'Obras | Sync Mood' }

interface ObraRow {
  id: string
  codigo_obra: string
  titulo: string
  status: StatusObra
  status_iswc: string
  iswc?: string
  total_links: number
  total_participantes: number
  controle_exec: number
  controle_fono: number
  controle_sync: number
  origem: string
}

const MOCK_OBRAS: ObraRow[] = [
  {
    id: '1', codigo_obra: 'OBR-001', titulo: 'Amo Noite e Dia',
    status: 'ativa', status_iswc: 'recebido', iswc: 'T-123456789-0',
    total_links: 4, total_participantes: 5, controle_exec: 50, controle_fono: 62.5, controle_sync: 62.5,
    origem: 'contrato_sistema',
  },
  {
    id: '2', codigo_obra: 'OBR-002', titulo: 'Passarinho do Norte',
    status: 'validada', status_iswc: 'aguardando_retorno',
    total_links: 2, total_participantes: 3, controle_exec: 75, controle_fono: 75, controle_sync: 75,
    origem: 'manual',
  },
  {
    id: '3', codigo_obra: 'OBR-003', titulo: 'Sol da Manha',
    status: 'pendente_contrato', status_iswc: 'pendente',
    total_links: 3, total_participantes: 4, controle_exec: 33.33, controle_fono: 33.33, controle_sync: 33.33,
    origem: 'manual',
  },
  {
    id: '4', codigo_obra: 'OBR-004', titulo: 'Tempo de Amar',
    status: 'pre_cadastro', status_iswc: 'pendente',
    total_links: 1, total_participantes: 2, controle_exec: 50, controle_fono: 50, controle_sync: 50,
    origem: 'contrato_sistema',
  },
  {
    id: '5', codigo_obra: 'OBR-005', titulo: 'Chuva Fina',
    status: 'enviada_sociedade', status_iswc: 'aguardando_retorno',
    total_links: 2, total_participantes: 3, controle_exec: 100, controle_fono: 100, controle_sync: 100,
    origem: 'migracao',
  },
]

function IswcBadge({ status, iswc }: { status: string; iswc?: string }) {
  if (status === 'recebido' && iswc) {
    return <span className="text-xs font-mono text-emerald-400">{iswc}</span>
  }
  if (status === 'aguardando_retorno') {
    return <span className="text-xs text-amber-400">Ag. SOCINPRO</span>
  }
  return <span className="text-xs text-white/25">Pendente</span>
}

function PctBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={['h-full rounded-full', color].join(' ')} style={{ width: value + '%' }} />
      </div>
      <span className="text-xs text-white/60 tabular-nums">{value.toFixed(1)}%</span>
    </div>
  )
}

export default function ObrasPage() {
  const totals = {
    total: MOCK_OBRAS.length,
    ativas: MOCK_OBRAS.filter(o => o.status === 'ativa').length,
    pendentes: MOCK_OBRAS.filter(o => ['pendente_contrato','pendente_percentual','pendente_validacao','pre_cadastro'].includes(o.status)).length,
    enviadas: MOCK_OBRAS.filter(o => o.status === 'enviada_sociedade').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastro de Obras"
        description="Gerencie o catalogo musical com estrutura de links e titularidade"
        actions={
          <a
            href="/master/obras/nova"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Obra
          </a>
        }
      />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totals.total, color: 'text-white/80' },
          { label: 'Ativas', value: totals.ativas, color: 'text-emerald-400' },
          { label: 'Pendentes', value: totals.pendentes, color: 'text-amber-400' },
          { label: 'Enviadas', value: totals.enviadas, color: 'text-sky-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">{stat.label}</p>
            <p className={'text-2xl font-bold ' + stat.color}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/[0.06] rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por titulo ou codigo..."
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filtrar
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-xs font-semibold text-white/30 px-5 py-3">Codigo</th>
              <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Titulo</th>
              <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">ISWC</th>
              <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Links</th>
              <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 text-cyan-500">Exec %</th>
              <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 text-emerald-500">Fono %</th>
              <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 text-amber-500">Sync %</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {MOCK_OBRAS.map(obra => (
              <tr key={obra.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-5 py-3.5">
                  <span className="text-xs font-mono text-white/40">{obra.codigo_obra}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Music className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <span className="font-medium text-white/80">{obra.titulo}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + STATUS_OBRA_COLORS[obra.status]}>
                    {STATUS_OBRA_LABELS[obra.status]}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <IswcBadge status={obra.status_iswc} iswc={obra.iswc} />
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs text-white/60">
                    {obra.total_links}L / {obra.total_participantes}P
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <PctBar value={obra.controle_exec} color="bg-cyan-500" />
                </td>
                <td className="px-4 py-3.5">
                  <PctBar value={obra.controle_fono} color="bg-emerald-500" />
                </td>
                <td className="px-4 py-3.5">
                  <PctBar value={obra.controle_sync} color="bg-amber-500" />
                </td>
                <td className="px-5 py-3.5">
                  <a
                    href={'/master/obras/' + obra.id}
                    className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors group-hover:text-white/60"
                  >
                    Ver <ChevronRight className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}