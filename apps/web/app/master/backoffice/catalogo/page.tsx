'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  BookOpen, Music, Search, ChevronRight,
  CheckCircle2, AlertCircle, XCircle,
  Hash, Mic2, Shield, DollarSign,
} from 'lucide-react'

type StatusCatalogo = 'completo' | 'atencao' | 'pendente'
type Aba = 'obras' | 'song_codes' | 'isrc' | 'performers' | 'autorizacoes'

interface ObraBO {
  id: string
  id_interno: string
  titulo: string
  tem_songcode: boolean
  tem_isrc: boolean
  recebe_royalties: boolean
  possui_oni: boolean
  possui_pendencia: boolean
  negocio_editorial: string | null
  qt_direitos_brasil: number
  qt_direitos_exterior: number
  status_catalogo: StatusCatalogo
}

const MOCK_OBRAS: ObraBO[] = [
  {
    id: '1', id_interno: 'TSM000001', titulo: 'Lua de Mel',
    tem_songcode: true, tem_isrc: true, recebe_royalties: true,
    possui_oni: false, possui_pendencia: false,
    negocio_editorial: 'EDI Music → Top Show', qt_direitos_brasil: 3, qt_direitos_exterior: 2,
    status_catalogo: 'completo',
  },
  {
    id: '2', id_interno: 'TSM000002', titulo: 'Saudade do Norte',
    tem_songcode: true, tem_isrc: false, recebe_royalties: true,
    possui_oni: true, possui_pendencia: false,
    negocio_editorial: 'P3 Editora → Top Show', qt_direitos_brasil: 2, qt_direitos_exterior: 0,
    status_catalogo: 'atencao',
  },
  {
    id: '3', id_interno: 'TSM000003', titulo: 'Coracao Livre',
    tem_songcode: false, tem_isrc: false, recebe_royalties: false,
    possui_oni: false, possui_pendencia: true,
    negocio_editorial: null, qt_direitos_brasil: 0, qt_direitos_exterior: 0,
    status_catalogo: 'pendente',
  },
  {
    id: '4', id_interno: 'TSM000004', titulo: 'Mar Aberto',
    tem_songcode: true, tem_isrc: true, recebe_royalties: true,
    possui_oni: false, possui_pendencia: false,
    negocio_editorial: 'LR Edicoes → Top Show', qt_direitos_brasil: 4, qt_direitos_exterior: 3,
    status_catalogo: 'completo',
  },
  {
    id: '5', id_interno: 'TSM000005', titulo: 'Festa da Vila',
    tem_songcode: false, tem_isrc: true, recebe_royalties: false,
    possui_oni: false, possui_pendencia: true,
    negocio_editorial: 'Lamu → Top Show', qt_direitos_brasil: 1, qt_direitos_exterior: 0,
    status_catalogo: 'pendente',
  },
]

const STATUS_ICON: Record<StatusCatalogo, { icon: React.ElementType; color: string; label: string; dot: string }> = {
  completo: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Completo', dot: 'bg-emerald-400' },
  atencao:  { icon: AlertCircle,  color: 'text-amber-400',   label: 'Atencao',  dot: 'bg-amber-400'   },
  pendente: { icon: XCircle,      color: 'text-red-400',     label: 'Pendente', dot: 'bg-red-400'      },
}

const ABA_LABELS: Record<Aba, string> = {
  obras: 'Obras',
  song_codes: 'Song Codes',
  isrc: 'ISRCs',
  performers: 'Performers',
  autorizacoes: 'Autorizacoes',
}

function Semaforo({ status }: { status: StatusCatalogo }) {
  const s = STATUS_ICON[status]
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      <span className={`text-[11px] font-semibold ${s.color}`}>{s.label}</span>
    </div>
  )
}

function Indicador({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1 text-[10px] ${ok ? 'text-emerald-400' : 'text-white/25'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-white/15'}`} />
      {label}
    </div>
  )
}

export default function CatalogoBackOfficePage() {
  const [aba, setAba] = useState<Aba>('obras')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusCatalogo | ''>('')

  const obrasFiltradas = MOCK_OBRAS.filter(o => {
    const matchBusca = busca === '' || o.titulo.toLowerCase().includes(busca.toLowerCase()) || o.id_interno.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === '' || o.status_catalogo === filtroStatus
    return matchBusca && matchStatus
  })

  const completos = MOCK_OBRAS.filter(o => o.status_catalogo === 'completo').length
  const atencao   = MOCK_OBRAS.filter(o => o.status_catalogo === 'atencao').length
  const pendentes = MOCK_OBRAS.filter(o => o.status_catalogo === 'pendente').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogo BackOffice"
        description="Centro de controle — status operacional e cobertura juridica de cada obra do catalogo."
      />

      {/* Semaforo KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { status: 'completo' as const, value: completos,  desc: 'Song Code + ISRC + negocio editorial + royalties' },
          { status: 'atencao'  as const, value: atencao,    desc: 'Song Code vinculado, mas ISRC ou ONI pendente'    },
          { status: 'pendente' as const, value: pendentes,  desc: 'Sem negocio editorial ou com pendencia juridica'  },
        ].map(item => {
          const s = STATUS_ICON[item.status]
          return (
            <div key={item.status} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                <p className={`text-xs font-semibold ${s.color}`}>{s.label}</p>
              </div>
              <p className={`text-3xl font-bold ${s.color} leading-none`}>{item.value}</p>
              <p className="text-[10px] text-white/30 leading-relaxed">{item.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Abas */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] overflow-x-auto">
        {(Object.keys(ABA_LABELS) as Aba[]).map(a => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`shrink-0 h-9 px-4 text-xs font-medium transition-colors border-b-2 -mb-px ${
              aba === a
                ? 'text-sky-400 border-sky-400'
                : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            {ABA_LABELS[a]}
          </button>
        ))}
      </div>

      {aba === 'obras' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por titulo ou ID interno..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#0d1526] border border-white/[0.08] text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-sky-500/50"
              />
            </div>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as StatusCatalogo | '')}
              className="h-10 px-3 rounded-xl bg-[#0d1526] border border-white/[0.08] text-sm text-white/60 focus:outline-none"
            >
              <option value="">Todos os status</option>
              <option value="completo">Completo</option>
              <option value="atencao">Atencao</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[90px_1fr_110px_180px_100px_100px] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
              {['ID Interno', 'Titulo', 'Status', 'Indicadores Operacionais', 'Direitos BR', 'Direitos EXT'].map(h => (
                <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
              ))}
            </div>

            {obrasFiltradas.length === 0 && (
              <div className="px-4 py-10 text-center text-white/30 text-sm">
                Nenhuma obra encontrada.
              </div>
            )}

            {obrasFiltradas.map((obra, idx) => (
              <div
                key={obra.id}
                className={`grid grid-cols-[90px_1fr_110px_180px_100px_100px] gap-2 px-4 py-3 items-start hover:bg-white/[0.02] transition-colors ${idx < obrasFiltradas.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
              >
                <p className="text-xs font-mono text-sky-400 pt-0.5">{obra.id_interno}</p>

                <div>
                  <p className="text-sm font-medium text-white/80">{obra.titulo}</p>
                  {obra.negocio_editorial && (
                    <p className="text-[10px] text-white/30 mt-0.5">{obra.negocio_editorial}</p>
                  )}
                </div>

                <div className="pt-0.5">
                  <Semaforo status={obra.status_catalogo} />
                </div>

                <div className="flex flex-col gap-1 pt-0.5">
                  <Indicador ok={obra.tem_songcode}      label="Song Code" />
                  <Indicador ok={obra.tem_isrc}          label="ISRC" />
                  <Indicador ok={obra.recebe_royalties}  label="Royalties" />
                  <Indicador ok={!obra.possui_pendencia} label="Sem pendencia" />
                </div>

                <div className="pt-0.5">
                  {obra.qt_direitos_brasil > 0
                    ? <p className="text-sm font-semibold text-emerald-400">{obra.qt_direitos_brasil} direito(s)</p>
                    : <p className="text-xs text-red-400/70">Sem cobertura</p>
                  }
                </div>

                <div className="pt-0.5">
                  {obra.qt_direitos_exterior > 0
                    ? <p className="text-sm font-semibold text-emerald-400">{obra.qt_direitos_exterior} direito(s)</p>
                    : <p className="text-xs text-white/25">—</p>
                  }
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {aba === 'song_codes' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-8 text-center">
          <Hash className="w-8 h-8 text-sky-400/50 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white/50">Song Codes</p>
          <p className="text-xs text-white/25 mt-1">
            Tabela obras_backoffice — vinculos BO_SONGCODE ↔ OBRA_ID ↔ ID_INTERNO.
            Disponiveis apos aplicacao da Migration 043.
          </p>
        </div>
      )}

      {aba === 'isrc' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-8 text-center">
          <Music className="w-8 h-8 text-sky-400/50 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white/50">ISRCs / Gravacoes</p>
          <p className="text-xs text-white/25 mt-1">
            Controle de gravacoes por ISRC, interprete, album e gravadora.
          </p>
        </div>
      )}

      {aba === 'performers' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-8 text-center">
          <Mic2 className="w-8 h-8 text-sky-400/50 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white/50">Performers</p>
          <p className="text-xs text-white/25 mt-1">
            Controle de interpretes conforme layout BackOffice — obra, Song Code, participacao.
          </p>
        </div>
      )}

      {aba === 'autorizacoes' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-8 text-center">
          <Shield className="w-8 h-8 text-sky-400/50 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white/50">Autorizacoes</p>
          <p className="text-xs text-white/25 mt-1">
            Layouts ASK / NO conforme manual BackOffice — controle de permissoes por obra.
          </p>
        </div>
      )}

      {/* Legenda semaforo */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-white/50 mb-3">Criterios do semaforo</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { dot: 'bg-emerald-400', label: 'Completo', items: ['Song Code vinculado', 'ISRC vinculado', 'Negocio editorial ativo', 'Recebe royalties', 'Sem pendencias'] },
            { dot: 'bg-amber-400',   label: 'Atencao',  items: ['Song Code vinculado', 'Mas ISRC ausente', 'Ou ONI pendente de envio'] },
            { dot: 'bg-red-400',     label: 'Pendente', items: ['Sem negocio editorial', 'Ou com pendencia juridica', 'Ou receita bloqueada'] },
          ].map(c => (
            <div key={c.label} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <p className="text-xs font-semibold text-white/60">{c.label}</p>
              </div>
              {c.items.map(item => (
                <p key={item} className="text-[10px] text-white/30 pl-4">{item}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
