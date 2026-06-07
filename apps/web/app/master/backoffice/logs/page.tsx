'use client'

import { PageHeader } from '@/components/ui/page-header'
import { ScrollText, FileInput, CheckCircle2, AlertCircle, Clock, Search } from 'lucide-react'

const MOCK_LOGS = [
  { id: '1', arquivo: 'royalty_statement_q1_2026.xlsx', data: '07/06/2026 14:32', usuario: 'Sistema', linhas: 1842, identificadas: 1798, pendentes: 44, status: 'concluido' },
  { id: '2', arquivo: 'oni_lista_semana_22.xlsx', data: '06/06/2026 09:15', usuario: 'admin@topshow.com.br', linhas: 312, identificadas: 287, pendentes: 25, status: 'concluido' },
  { id: '3', arquivo: 'songs_export_backoffice.xml', data: '05/06/2026 17:48', usuario: 'Sistema', linhas: 502, identificadas: 502, pendentes: 0, status: 'concluido' },
  { id: '4', arquivo: 'royalty_statement_fev_2026.xlsx', data: '04/06/2026 11:00', usuario: 'Sistema', linhas: 967, identificadas: 901, pendentes: 66, status: 'concluido' },
  { id: '5', arquivo: 'isrc_report_q1.csv', data: '03/06/2026 08:20', usuario: 'admin@topshow.com.br', linhas: 218, identificadas: 0, pendentes: 0, status: 'processando' },
]

const STATUS_COLORS: Record<string, string> = {
  concluido: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  processando: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  erro: 'text-red-400 bg-red-500/10 border-red-500/30',
}
const STATUS_LABELS: Record<string, string> = {
  concluido: 'Concluido',
  processando: 'Processando',
  erro: 'Erro',
}

export default function LogsProcessamentoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs de Processamento"
        description="Historico completo de todos os arquivos importados — data, usuario, linhas processadas, identificadas e pendentes."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de Arquivos', value: '38', icon: FileInput, color: 'text-white/80' },
          { label: 'Linhas Processadas', value: '18.420', icon: ScrollText, color: 'text-sky-400' },
          { label: 'Identificadas', value: '17.841', icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Com Pendencias', value: '7', icon: AlertCircle, color: 'text-amber-400' },
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          type="text"
          placeholder="Buscar por arquivo, usuario ou data..."
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#0d1526] border border-white/[0.08] text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-sky-500/50"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_150px_100px_90px_90px_110px] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
          {['Arquivo', 'Data / Usuario', 'Linhas', 'Identificadas', 'Pendentes', 'Status'].map(h => (
            <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {MOCK_LOGS.map((log, idx) => (
          <div
            key={log.id}
            className={`grid grid-cols-[1fr_150px_100px_90px_90px_110px] gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors ${idx < MOCK_LOGS.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">{log.arquivo}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">{log.data}</p>
              <p className="text-[10px] text-white/30 mt-0.5 truncate">{log.usuario}</p>
            </div>
            <p className="text-sm text-white/60">{log.linhas.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-emerald-400 font-semibold">{log.identificadas.toLocaleString('pt-BR')}</p>
            <p className={`text-sm font-semibold ${log.pendentes > 0 ? 'text-amber-400' : 'text-white/30'}`}>
              {log.pendentes}
            </p>
            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[log.status]}`}>
              {STATUS_LABELS[log.status]}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-sky-500/[0.06] border border-sky-500/20 rounded-xl p-4">
        <p className="text-[11px] font-semibold text-sky-400 mb-1">Rastreabilidade completa</p>
        <p className="text-[11px] text-white/40">
          Cada linha importada fica permanentemente vinculada ao arquivo de origem (importacao_id).
          Nenhuma informacao original e descartada — o raw_payload preserva a linha exata do arquivo.
        </p>
      </div>
    </div>
  )
}
