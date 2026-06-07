'use client'

import { PageHeader } from '@/components/ui/page-header'
import { AlertTriangle, ShieldAlert, CheckCircle2, Clock, XCircle, Search, Filter } from 'lucide-react'

const STATUS_JURIDICO_LABELS: Record<string, string> = {
  pendente_identificacao: 'Pendente Identificacao',
  pendente_validacao: 'Pendente Validacao',
  pendente_revisao_juridica: 'Revisao Juridica',
  autorizado: 'Autorizado',
  bloqueado: 'Bloqueado',
}
const STATUS_JURIDICO_COLORS: Record<string, string> = {
  pendente_identificacao: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  pendente_validacao: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  pendente_revisao_juridica: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  autorizado: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  bloqueado: 'text-red-400 bg-red-500/10 border-red-500/30',
}

const MOCK_PENDENCIAS = [
  { id: '1', bo_songcode: 'BO-998712', titulo: 'Nao identificada', valor: 'R$ 1.240,00', periodo: '1Q2026', status: 'pendente_identificacao', motivo: 'Song Code sem correspondencia no catalogo' },
  { id: '2', bo_songcode: 'BO-447231', titulo: 'Lua de Mel', valor: 'R$ 3.890,00', periodo: '1Q2026', status: 'pendente_revisao_juridica', motivo: 'Direito Fonomecânico nao administrado pelo negocio editorial ativo' },
  { id: '3', bo_songcode: 'BO-112043', titulo: 'Saudade do Norte', valor: 'R$ 580,00', periodo: '02M2026', status: 'bloqueado', motivo: 'Negocio editorial expirado — renovacao pendente' },
  { id: '4', bo_songcode: 'BO-774910', titulo: 'Coracao Livre', valor: 'R$ 2.100,00', periodo: '02M2026', status: 'pendente_validacao', motivo: 'Aguardando confirmacao de territorio (Exterior)' },
]

export default function PendenciasJuridicasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pendencias Juridicas"
        description="Lançamentos que nao passaram na validacao do Motor de Autorizacao. Nenhum valor segue ao Financeiro sem aprovacao juridica."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pendente Identificacao', value: '9', icon: Clock, color: 'text-amber-400' },
          { label: 'Pendente Validacao', value: '4', icon: ShieldAlert, color: 'text-sky-400' },
          { label: 'Revisao Juridica', value: '2', icon: AlertTriangle, color: 'text-orange-400' },
          { label: 'Bloqueados', value: '1', icon: XCircle, color: 'text-red-400' },
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

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type="text"
            placeholder="Buscar por Song Code, titulo ou motivo..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#0d1526] border border-white/[0.08] text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <select className="h-10 px-3 rounded-xl bg-[#0d1526] border border-white/[0.08] text-sm text-white/60 focus:outline-none focus:border-amber-500/50">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_JURIDICO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_130px_110px_1fr_160px] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
          {['Song Code', 'Titulo', 'Valor', 'Periodo', 'Motivo', 'Status Juridico'].map(h => (
            <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {MOCK_PENDENCIAS.map((p, idx) => (
          <div
            key={p.id}
            className={`grid grid-cols-[120px_1fr_130px_110px_1fr_160px] gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors ${idx < MOCK_PENDENCIAS.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
          >
            <p className="text-xs font-mono text-sky-400">{p.bo_songcode}</p>
            <p className="text-sm text-white/80 truncate">{p.titulo}</p>
            <p className="text-sm font-semibold text-white/70">{p.valor}</p>
            <p className="text-xs text-white/50 font-mono">{p.periodo}</p>
            <p className="text-xs text-white/40 truncate">{p.motivo}</p>
            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_JURIDICO_COLORS[p.status]}`}>
              {STATUS_JURIDICO_LABELS[p.status]}
            </span>
          </div>
        ))}
      </div>

      {/* Rule reminder */}
      <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4">
        <p className="text-[11px] font-semibold text-red-400 mb-1">Regra do Motor de Autorizacao</p>
        <p className="text-[11px] text-white/40">
          Nenhuma receita segue ao modulo Financeiro sem passar pela funcao validar_direito_administrado().
          O direito juridico deve estar administrado no negocio editorial ativo para o territorio e vigencia correspondentes.
        </p>
      </div>
    </div>
  )
}
