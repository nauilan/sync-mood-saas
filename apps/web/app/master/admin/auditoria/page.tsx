'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { ShieldAlert, Search, Filter, ChevronDown, ChevronRight, User, Calendar, Database, Activity } from 'lucide-react'

interface AuditLog {
  id: string
  event_id: string
  usuario: string
  origem_execucao: 'usuario' | 'sistema' | 'importacao' | 'job' | 'api'
  acao: string
  modulo: string
  tabela_afetada: string
  registro_id: string
  dados_anteriores: string | null
  dados_novos: string | null
  created_at: string
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: '1',
    event_id: 'evt-001',
    usuario: 'admin@topshow.com.br',
    origem_execucao: 'usuario',
    acao: 'criar',
    modulo: 'negocios_editoriais',
    tabela_afetada: 'negocios_editoriais',
    registro_id: 'ne-uuid-001',
    dados_anteriores: null,
    dados_novos: '{"editora": "EDI Music", "status": "ativo"}',
    created_at: '07/06/2026 14:32:11',
  },
  {
    id: '2',
    event_id: 'evt-002',
    usuario: 'Sistema',
    origem_execucao: 'importacao',
    acao: 'importar',
    modulo: 'backoffice',
    tabela_afetada: 'recebimentos_itens',
    registro_id: 'ri-batch-001',
    dados_anteriores: null,
    dados_novos: '{"linhas": 1842, "arquivo": "royalty_q1_2026.xlsx"}',
    created_at: '07/06/2026 14:01:55',
  },
  {
    id: '3',
    event_id: 'evt-003',
    usuario: 'admin@topshow.com.br',
    origem_execucao: 'usuario',
    acao: 'vincular',
    modulo: 'backoffice',
    tabela_afetada: 'obras_backoffice',
    registro_id: 'ob-uuid-001',
    dados_anteriores: null,
    dados_novos: '{"bo_songcode": "BO-112043", "obra_id": "TSM000003"}',
    created_at: '06/06/2026 09:15:22',
  },
  {
    id: '4',
    event_id: 'evt-003',
    usuario: 'admin@topshow.com.br',
    origem_execucao: 'sistema',
    acao: 'criar',
    modulo: 'backoffice',
    tabela_afetada: 'matching_rules',
    registro_id: 'mr-uuid-001',
    dados_anteriores: null,
    dados_novos: '{"tipo_regra": "bo_songcode", "valor": "BO-112043"}',
    created_at: '06/06/2026 09:15:23',
  },
  {
    id: '5',
    event_id: 'evt-004',
    usuario: 'admin@topshow.com.br',
    origem_execucao: 'usuario',
    acao: 'alterar',
    modulo: 'obras',
    tabela_afetada: 'obras',
    registro_id: 'ob-uuid-002',
    dados_anteriores: '{"titulo": "Lua de Mel Versao 1"}',
    dados_novos: '{"titulo": "Lua de Mel"}',
    created_at: '05/06/2026 17:48:00',
  },
]

const ORIGEM_COLORS: Record<string, string> = {
  usuario:    'text-sky-400    bg-sky-500/10    border-sky-500/30',
  sistema:    'text-violet-400 bg-violet-500/10 border-violet-500/30',
  importacao: 'text-amber-400  bg-amber-500/10  border-amber-500/30',
  job:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  api:        'text-orange-400 bg-orange-500/10 border-orange-500/30',
}

const ACAO_COLORS: Record<string, string> = {
  criar:      'text-emerald-400',
  alterar:    'text-amber-400',
  excluir:    'text-red-400',
  vincular:   'text-sky-400',
  importar:   'text-violet-400',
  aprovar:    'text-emerald-400',
  bloquear:   'text-red-400',
  distribuir: 'text-sky-400',
}

const MODULOS = ['', 'obras', 'negocios_editoriais', 'backoffice', 'recebimentos', 'distribuicao', 'contratos', 'cwr']
const ACOES   = ['', 'criar', 'alterar', 'excluir', 'vincular', 'importar', 'aprovar', 'bloquear', 'distribuir']

export default function AuditoriaPage() {
  const [busca, setBusca] = useState('')
  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroAcao, setFiltroAcao] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const logsFiltrados = MOCK_LOGS.filter(log => {
    const matchBusca = busca === '' ||
      log.usuario.toLowerCase().includes(busca.toLowerCase()) ||
      log.tabela_afetada.toLowerCase().includes(busca.toLowerCase()) ||
      log.registro_id.toLowerCase().includes(busca.toLowerCase())
    const matchModulo = filtroModulo === '' || log.modulo === filtroModulo
    const matchAcao   = filtroAcao   === '' || log.acao   === filtroAcao
    return matchBusca && matchModulo && matchAcao
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Historico completo de todas as operacoes criticas do sistema — quem fez, o que fez, quando fez e o que mudou."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Acoes por Usuario', value: '3', icon: User,     color: 'text-sky-400'     },
          { label: 'Acoes pelo Sistema', value: '2', icon: Activity, color: 'text-violet-400'  },
          { label: 'Modulos Auditados', value: '3', icon: Database,  color: 'text-amber-400'   },
          { label: 'Eventos Unicos', value: '4',    icon: ShieldAlert, color: 'text-emerald-400' },
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

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por usuario, tabela ou registro..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#0d1526] border border-white/[0.08] text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-sky-500/50"
          />
        </div>
        <select
          value={filtroModulo}
          onChange={e => setFiltroModulo(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#0d1526] border border-white/[0.08] text-sm text-white/60 focus:outline-none"
        >
          <option value="">Todos os modulos</option>
          {MODULOS.filter(Boolean).map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={filtroAcao}
          onChange={e => setFiltroAcao(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#0d1526] border border-white/[0.08] text-sm text-white/60 focus:outline-none"
        >
          <option value="">Todas as acoes</option>
          {ACOES.filter(Boolean).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Log table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[180px_100px_90px_110px_130px_130px_1fr] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
          {['Quando', 'Origem', 'Acao', 'Modulo', 'Tabela', 'Registro', 'Quem fez'].map(h => (
            <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {logsFiltrados.length === 0 && (
          <div className="px-4 py-10 text-center text-white/30 text-sm">Nenhum registro encontrado.</div>
        )}

        {logsFiltrados.map((log, idx) => (
          <div key={log.id} className={idx < logsFiltrados.length - 1 ? 'border-b border-white/[0.03]' : ''}>
            <div
              className="grid grid-cols-[180px_100px_90px_110px_130px_130px_1fr] gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
            >
              <div>
                <p className="text-xs text-white/60">{log.created_at}</p>
                <p className="text-[10px] text-white/25 mt-0.5 font-mono">{log.event_id}</p>
              </div>
              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ORIGEM_COLORS[log.origem_execucao]}`}>
                {log.origem_execucao}
              </span>
              <p className={`text-xs font-semibold ${ACAO_COLORS[log.acao] ?? 'text-white/60'}`}>{log.acao}</p>
              <p className="text-xs text-white/50">{log.modulo}</p>
              <p className="text-xs text-white/50 font-mono truncate">{log.tabela_afetada}</p>
              <p className="text-xs text-sky-400 font-mono truncate">{log.registro_id}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-white/60 truncate">{log.usuario}</p>
                {(log.dados_anteriores || log.dados_novos) && (
                  <ChevronDown className={`w-3 h-3 text-white/30 shrink-0 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} />
                )}
              </div>
            </div>

            {expandedId === log.id && (
              <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {log.dados_anteriores && (
                  <div className="bg-red-500/[0.05] border border-red-500/20 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-red-400 mb-1.5">Valor anterior</p>
                    <pre className="text-[10px] text-white/50 font-mono whitespace-pre-wrap break-all">{JSON.stringify(JSON.parse(log.dados_anteriores), null, 2)}</pre>
                  </div>
                )}
                {log.dados_novos && (
                  <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-emerald-400 mb-1.5">Valor novo</p>
                    <pre className="text-[10px] text-white/50 font-mono whitespace-pre-wrap break-all">{JSON.stringify(JSON.parse(log.dados_novos), null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-white/50 mb-1">event_id</p>
        <p className="text-[11px] text-white/30">
          O campo event_id agrupa todas as acoes geradas por uma mesma operacao (ex: importacao BackOffice, distribuicao 1Q2026).
          Multiplas linhas com o mesmo event_id formam uma operacao atomica rastreavel.
        </p>
      </div>
    </div>
  )
}
