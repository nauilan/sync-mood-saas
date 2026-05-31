'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Plus, Calendar, ChevronRight, CheckCircle2, Clock,
  AlertCircle, Lock, TrendingUp, Layers, RefreshCw,
} from 'lucide-react'
import {
  MOCK_PERIODOS_DISTRIBUICAO, KPI_PERIODOS,
} from '@/lib/mock-periodos-distribuicao'
import {
  STATUS_PERIODO_LABELS, STATUS_PERIODO_COLORS, TIPO_PERIODO_LABELS,
  mensalCodigo, trimestreCodigo, periodoLabel, trimestreDatas, conflitaTrimestral,
  type TipoPeriodoDistribuicao, type PeriodoDistribuicao,
} from '@/lib/types-periodo-distribuicao'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Modal Novo Período ────────────────────────────────────────────────────────

function ModalNovoPeriodo({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo]         = useState<TipoPeriodoDistribuicao>('trimestral')
  const [ano, setAno]           = useState(new Date().getFullYear())
  const [mes, setMes]           = useState(new Date().getMonth() + 1)
  const [trim, setTrim]         = useState<1 | 2 | 3 | 4>(
    Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4
  )
  const [pagamento, setPagamento] = useState('')
  const [obs, setObs]           = useState('')
  const [saved, setSaved]       = useState(false)

  const codigo = tipo === 'mensal'
    ? mensalCodigo(ano, mes)
    : trimestreCodigo(ano, trim)

  const label = periodoLabel({ tipo, ano, mes: tipo === 'mensal' ? mes : undefined, trimestre: tipo === 'trimestral' ? trim : undefined })

  const datas = tipo === 'trimestral'
    ? trimestreDatas(ano, trim)
    : {
        inicio: `${ano}-${String(mes).padStart(2, '0')}-01`,
        fim: `${ano}-${String(mes).padStart(2, '0')}-${new Date(ano, mes, 0).getDate()}`,
      }

  // Validação bidirecional de exclusão mútua mensal/trimestral
  // Mensal → bloqueia se já existe trimestral cobrindo esse mês/ano
  // Trimestral → bloqueia se já existe mensal em qualquer mês do trimestre
  const conflito: string | null = (() => {
    if (tipo === 'mensal') {
      return conflitaTrimestral(ano, mes, MOCK_PERIODOS_DISTRIBUICAO)
    }
    // tipo === 'trimestral': verificar se há mensal em algum dos 3 meses do trimestre
    const mesesDoTrim: Record<1|2|3|4, [number, number, number]> = {
      1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12],
    }
    const meses = mesesDoTrim[trim]
    const conflitante = MOCK_PERIODOS_DISTRIBUICAO.find(
      p => p.tipo === 'mensal' && p.ano === ano && p.mes !== undefined && meses.includes(p.mes as number)
    )
    return conflitante ? conflitante.codigo : null
  })()

  if (saved) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0d1526] border border-white/10 rounded-2xl p-8 w-full max-w-md text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Período {codigo} criado!</h3>
        <p className="text-sm text-white/50">{label} — agora você pode iniciar uma Nova Distribuição selecionando esse período.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition-colors">
            Fechar
          </button>
          <Link href="/master/distribuicao/nova" onClick={onClose}
            className="rounded-xl bg-violet-500/20 border border-violet-500/40 px-5 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/30 transition-colors inline-flex items-center gap-2">
            Nova Distribuição <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0d1526] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Novo Período de Distribuição</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 text-lg leading-none">×</button>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Tipo de Período</label>
          <div className="grid grid-cols-2 gap-2">
            {(['trimestral', 'mensal'] as TipoPeriodoDistribuicao[]).map(t => (
              <button key={t} onClick={() => setTipo(t)}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  tipo === t
                    ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                    : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                }`}>
                {TIPO_PERIODO_LABELS[t]}
                {t === 'trimestral' && <span className="ml-1 text-[10px] text-amber-400">(obrigatório)</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Ano */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Ano</label>
            <select value={ano} onChange={e => setAno(parseInt(e.target.value))}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50">
              {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {tipo === 'mensal' ? (
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Mês</label>
              <select value={mes} onChange={e => setMes(parseInt(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50">
                {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
                  .map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Trimestre</label>
              <select value={trim} onChange={e => setTrim(parseInt(e.target.value) as 1|2|3|4)}
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50">
                {[1,2,3,4].map(t => <option key={t} value={t}>{t}º Trimestre</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Código</span>
            <span className="font-mono font-bold text-violet-300">{codigo}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Label</span>
            <span className="text-white/70">{label}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Início</span>
            <span className="text-white/70">{datas.inicio}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Fim</span>
            <span className="text-white/70">{datas.fim}</span>
          </div>
        </div>

        {/* Data prevista pgto */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Data Prevista de Pagamento</label>
          <input type="date" value={pagamento} onChange={e => setPagamento(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50" />
        </div>

        {/* Observação */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Observação (opcional)</label>
          <input type="text" value={obs} onChange={e => setObs(e.target.value)}
            placeholder="Ex: Inclui valores de YouTube e Spotify do 2Q26"
            className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm focus:outline-none focus:border-violet-500/50 placeholder:text-white/20" />
        </div>

        {/* Aviso de conflito mensal/trimestral */}
        {conflito && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">
              {tipo === 'mensal'
                ? <>Este mês já está coberto pelo período trimestral <span className="font-mono font-bold">{conflito}</span>. Não é permitido criar um período mensal para um mês incluído em um trimestral existente.</>
                : <>O trimestre selecionado contém o período mensal <span className="font-mono font-bold">{conflito}</span> já cadastrado. Exclua o mensal antes de criar o trimestral, ou escolha outro trimestre.</>
              }
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose}
            className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition-colors">
            Cancelar
          </button>
          <button onClick={() => setSaved(true)}
            disabled={!!conflito}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              conflito
                ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                : 'bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30'
            }`}>
            Criar Período
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card de Período ──────────────────────────────────────────────────────────

function PeriodoCard({ p }: { p: PeriodoDistribuicao }) {
  const icons: Record<string, typeof Clock> = {
    aberto: Clock, em_processamento: RefreshCw, encerrado: CheckCircle2, cancelado: AlertCircle,
  }
  const Icon = icons[p.status] ?? Clock

  return (
    <div className={`rounded-2xl border p-5 space-y-4 transition-colors ${
      p.status === 'aberto' ? 'border-sky-500/20 bg-sky-500/5' :
      p.status === 'encerrado' ? 'border-white/10 bg-white/[0.02]' :
      'border-amber-500/20 bg-amber-500/5'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">{p.codigo}</span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_PERIODO_COLORS[p.status]}`}>
              {STATUS_PERIODO_LABELS[p.status]}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
              {TIPO_PERIODO_LABELS[p.tipo]}
            </span>
          </div>
          <p className="text-sm text-white/60">{p.label}</p>
          <p className="text-[10px] text-white/30 mt-0.5">{p.data_inicio} → {p.data_fim}</p>
        </div>
        <Icon className={`w-5 h-5 shrink-0 mt-1 ${
          p.status === 'aberto' ? 'text-sky-400' :
          p.status === 'encerrado' ? 'text-emerald-400' :
          p.status === 'em_processamento' ? 'text-amber-400 animate-spin' :
          'text-red-400'
        }`} />
      </div>

      {/* Fontes */}
      {p.fontes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {p.fontes.map(f => (
            <span key={f} className="text-[10px] font-mono bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/50">
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Valores */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">
            {p.status === 'encerrado' ? 'Processado' : 'Previsto'}
          </p>
          <p className={`text-lg font-bold ${p.status === 'encerrado' ? 'text-emerald-400' : 'text-sky-300'}`}>
            {fmtBRL(p.status === 'encerrado' ? p.total_processado : p.total_previsto)}
          </p>
        </div>
        {p.data_prevista_pagamento && (
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Prev. Pagamento</p>
            <p className="text-sm font-semibold text-white/70">{p.data_prevista_pagamento}</p>
          </div>
        )}
      </div>

      {p.observacao && (
        <p className="text-[10px] text-white/30 italic">{p.observacao}</p>
      )}

      {/* Ações */}
      <div className="flex gap-2 pt-1 border-t border-white/[0.06]">
        {p.status === 'aberto' && (
          <>
            <Link href="/master/distribuicao/nova"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/30 transition-colors">
              <Plus className="w-3 h-3" /> Nova Distribuição
            </Link>
            <Link href="/master/distribuicao/previa"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-500/15 border border-sky-500/25 px-3 py-2 text-xs font-medium text-sky-300 hover:bg-sky-500/25 transition-colors">
              Ver Prévia
            </Link>
            <Link href="/master/distribuicao/encerramento"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/25 transition-colors">
              <Lock className="w-3 h-3" /> Encerrar
            </Link>
          </>
        )}
        {p.status === 'encerrado' && (
          <Link href="/master/distribuicao"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/10 transition-colors">
            Ver Distribuições <ChevronRight className="w-3 h-3" />
          </Link>
        )}
        {p.status === 'em_processamento' && (
          <div className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
            <RefreshCw className="w-3 h-3 animate-spin" /> Processando…
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PeriodosDistribuicaoPage() {
  const [modalAberto, setModalAberto] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'mensal' | 'trimestral'>('todos')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'aberto' | 'encerrado'>('todos')

  const filtrados = MOCK_PERIODOS_DISTRIBUICAO.filter(p => {
    if (filtroTipo !== 'todos' && p.tipo !== filtroTipo) return false
    if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false
    return true
  }).sort((a, b) => b.codigo.localeCompare(a.codigo))

  return (
    <div className="space-y-6">
      {modalAberto && <ModalNovoPeriodo onClose={() => setModalAberto(false)} />}

      <PageHeader
        title="Períodos de Distribuição"
        description="Gerencie os ciclos de distribuição. Todo período trimestral é obrigatório; mensais são opcionais."
        actions={[
          <button
            key="novo"
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 border border-violet-500/40 px-4 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Período
          </button>
        ]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Períodos Encerrados', value: KPI_PERIODOS.total_encerrados, color: 'text-emerald-400' },
          { label: 'Períodos Abertos',    value: KPI_PERIODOS.total_abertos,    color: 'text-sky-400' },
          { label: 'Total Processado',    value: fmtBRL(KPI_PERIODOS.total_processado), color: 'text-white' },
          { label: 'Total Previsto',      value: fmtBRL(KPI_PERIODOS.total_previsto),   color: 'text-sky-300' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Aviso: trimestral obrigatório */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-300/80">
          <span className="font-semibold">Obrigatório:</span> cada trimestre do ano deve ter um período de distribuição criado.
          O fechamento trimestral é exigido para a prestação de contas aos titulares.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mr-2">Filtrar:</p>
        {(['todos', 'trimestral', 'mensal'] as const).map(f => (
          <button key={f} onClick={() => setFiltroTipo(f)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filtroTipo === f
                ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
            }`}>
            {f === 'todos' ? 'Todos os tipos' : TIPO_PERIODO_LABELS[f]}
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-1" />
        {(['todos', 'aberto', 'encerrado'] as const).map(f => (
          <button key={f} onClick={() => setFiltroStatus(f)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filtroStatus === f
                ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
            }`}>
            {f === 'todos' ? 'Todos os status' : f === 'aberto' ? 'Abertos' : 'Encerrados'}
          </button>
        ))}
      </div>

      {/* Grid de períodos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrados.map(p => <PeriodoCard key={p.id} p={p} />)}
        {filtrados.length === 0 && (
          <div className="col-span-3 py-12 text-center text-white/30 text-sm">
            Nenhum período encontrado com esse filtro.
          </div>
        )}
      </div>
    </div>
  )
}
