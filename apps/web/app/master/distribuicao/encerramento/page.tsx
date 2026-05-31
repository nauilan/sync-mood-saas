'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Lock, CheckCircle2, AlertCircle, Users, Music,
  FileText, DollarSign, ChevronLeft, Zap,
} from 'lucide-react'
import { PERIODO_CORRENTE } from '@/lib/mock-periodos-distribuicao'
import { KPI_PREVIA, MOCK_PREVIA_TITULAR } from '@/lib/mock-distribuicao-previa'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type EtapaEncerramento = 'checklist' | 'confirmando' | 'processando' | 'concluido'

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function EncerrarDistribuicaoPage() {
  const [etapa, setEtapa] = useState<EtapaEncerramento>('checklist')
  const [progresso, setProgresso] = useState(0)
  const [confirmado, setConfirmado] = useState(false)

  // Simula processamento
  function iniciarProcessamento() {
    setEtapa('processando')
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 18
      if (p >= 100) {
        p = 100
        clearInterval(iv)
        setTimeout(() => setEtapa('concluido'), 600)
      }
      setProgresso(p)
    }, 300)
  }

  const checklist = [
    { ok: !!PERIODO_CORRENTE, label: 'Período de distribuição selecionado', detalhe: PERIODO_CORRENTE?.codigo ?? 'Nenhum período cadastrado' },
    { ok: true,  label: 'Arquivos TXT processados',               detalhe: `${KPI_PREVIA.statements.length} statements` },
    { ok: true,  label: 'Obras identificadas no catálogo',        detalhe: `${KPI_PREVIA.obras_identificadas} obras` },
    { ok: true,  label: 'Titulares validados (controlados)',       detalhe: `${KPI_PREVIA.titulares} titulares` },
    { ok: true,  label: 'Prévia revisada e conferida',            detalhe: 'CC Obra e CC Titular virtual OK' },
    { ok: true,  label: 'Percentuais normalizados a 100%',        detalhe: 'Por obra, todos links' },
    { ok: false, label: 'Retenções IRPF/ISS configuradas',        detalhe: 'Opcional — prosseguir sem retenções?' },
  ]

  if (etapa === 'concluido') return (
    <div className="flex flex-col items-center justify-center py-16 space-y-5 text-center">
      <CheckCircle2 className="h-16 w-16 text-emerald-400" />
      <h2 className="text-2xl font-bold text-white">Distribuição Encerrada!</h2>
      <p className="text-sm text-slate-400 max-w-lg">
        Período <strong className="text-violet-300">{PERIODO_CORRENTE?.codigo ?? '—'}</strong> processado com sucesso.<br />
        <strong className="text-white">{KPI_PREVIA.obras_identificadas} CC Obras</strong> creditadas ·{' '}
        <strong className="text-white">{KPI_PREVIA.titulares} CC Titulares</strong> atualizados ·{' '}
        <strong className="text-emerald-300">{fmtBRL(KPI_PREVIA.total_previsto)}</strong> distribuídos.<br />
        Recibos e demonstrativos disponíveis para cada titular.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-2">
        {[
          { label: 'Total Distribuído', value: fmtBRL(KPI_PREVIA.total_previsto), color: 'text-emerald-400' },
          { label: 'CC Obras',          value: KPI_PREVIA.obras_identificadas,    color: 'text-white' },
          { label: 'Titulares Pagos',   value: KPI_PREVIA.titulares,              color: 'text-white' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-white/30 mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-4">
        <Link href="/master/cc-obra" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition-colors">
          <Music className="h-4 w-4" /> CC Obra
        </Link>
        <Link href="/master/cc-titular" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition-colors">
          <Users className="h-4 w-4" /> CC Titular
        </Link>
        <Link href="/master/distribuicao" className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 border border-violet-500/40 px-5 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/30 transition-colors">
          Ver Distribuições
        </Link>
      </div>
    </div>
  )

  if (etapa === 'processando') return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center max-w-lg mx-auto">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
        <Zap className="h-8 w-8 text-amber-400 animate-pulse" />
      </div>
      <h2 className="text-xl font-bold text-white">Processando distribuição…</h2>
      <div className="w-full space-y-2">
        <ProgressBar pct={progresso} />
        <div className="flex justify-between text-xs text-white/30">
          <span>{Math.round(progresso)}% concluído</span>
          <span>{KPI_PREVIA.obras_identificadas} obras · {KPI_PREVIA.titulares} titulares</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-white/40 w-full">
        {[
          { done: progresso > 15, label: '① Gravando CC Obras' },
          { done: progresso > 35, label: '② Calculando titulares' },
          { done: progresso > 55, label: '③ Creditando CC Titular' },
          { done: progresso > 75, label: '④ Gerando recibos' },
          { done: progresso > 88, label: '⑤ Aplicando retenções' },
          { done: progresso >= 100, label: '⑥ Fechando período' },
        ].map(({ done, label }) => (
          <div key={label} className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${done ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-white/10 bg-white/5'}`}>
            {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />}
            {label}
          </div>
        ))}
      </div>
    </div>
  )

  if (etapa === 'confirmando') return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-red-400 shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-white">Confirmar Encerramento</h3>
            <p className="text-sm text-red-300/80 mt-1">
              Esta ação é <strong>irreversível</strong>. Os valores serão gravados permanentemente no CC Obra e CC Titular.
              Recibos serão gerados para todos os {KPI_PREVIA.titulares} titulares.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Período', value: PERIODO_CORRENTE?.codigo ?? '—' },
            { label: 'Total a distribuir', value: fmtBRL(KPI_PREVIA.total_previsto) },
            { label: 'Obras', value: `${KPI_PREVIA.obras_identificadas}` },
            { label: 'Titulares', value: `${KPI_PREVIA.titulares}` },
          ].map(k => (
            <div key={k.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[10px] text-white/30">{k.label}</p>
              <p className="text-sm font-bold text-white">{k.value}</p>
            </div>
          ))}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)}
            className="h-4 w-4 accent-red-500" />
          <span className="text-sm text-white/70">
            Confirmo que revisei a prévia e autorizo o encerramento da distribuição {PERIODO_CORRENTE?.codigo ?? '—'}
          </span>
        </label>
      </div>

      <div className="flex justify-between gap-3">
        <button onClick={() => setEtapa('checklist')}
          className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <button
          onClick={iniciarProcessamento}
          disabled={!confirmado}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-6 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Zap className="h-4 w-4" /> Processar Distribuição
        </button>
      </div>
    </div>
  )

  // Checklist inicial
  return (
    <div className="space-y-6">
      <PageHeader
        title="Encerrar Distribuição"
        description="Verifique todos os itens antes de efetivar. Ao processar, os valores são gravados no CC Obra e CC Titular e os recibos são emitidos."
      />

      {/* Resumo período */}
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-amber-400/60 uppercase tracking-wider mb-1">Período a Encerrar</p>
          <p className="text-2xl font-extrabold font-mono text-amber-300">{PERIODO_CORRENTE?.codigo ?? '—'}</p>
          <p className="text-sm text-white/60">{PERIODO_CORRENTE?.label ?? 'Nenhum período aberto'} · {PERIODO_CORRENTE?.data_inicio ?? ''} → {PERIODO_CORRENTE?.data_fim ?? ''}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/30 uppercase">Total a Distribuir</p>
          <p className="text-2xl font-bold text-emerald-400">{fmtBRL(KPI_PREVIA.total_previsto)}</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Checklist de Encerramento</p>
        {checklist.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            item.ok
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : 'border-amber-500/20 bg-amber-500/5'
          }`}>
            {item.ok
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            <div className="flex-1">
              <p className="text-sm text-white/80">{item.label}</p>
              <p className="text-[10px] text-white/40">{item.detalhe}</p>
            </div>
            <span className={`text-[10px] font-semibold ${item.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
              {item.ok ? 'OK' : 'Atenção'}
            </span>
          </div>
        ))}
      </div>

      {/* Resumo por titular */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Resumo por Titular</p>
          <span className="text-[10px] text-white/25">{MOCK_PREVIA_TITULAR.length} titulares</span>
        </div>
        <div className="max-h-[260px] overflow-y-auto divide-y divide-white/[0.04]">
          {[...MOCK_PREVIA_TITULAR].sort((a, b) => b.valor_previsto - a.valor_previsto).map((t, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02]">
              <div>
                <p className="text-xs text-white/70">{t.titular_nome}</p>
                <p className="text-[10px] text-white/30 capitalize">{t.tipo} · {t.obras_count} obras</p>
              </div>
              <p className="text-sm font-semibold text-white/80 tabular-nums">{fmtBRL(t.valor_previsto)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Links antes de encerrar */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
        <p className="text-xs text-white/50 mb-3">Revisar antes de encerrar:</p>
        {[
          { label: 'Distribuição Prévia',  href: '/master/distribuicao/previa', desc: 'CC Obra e CC Titular virtual' },
          { label: 'CC Obra atual',         href: '/master/cc-obra',             desc: 'Saldos reais atuais' },
          { label: 'CC Titular atual',      href: '/master/cc-titular',          desc: 'Extratos dos titulares' },
        ].map(({ label, href, desc }) => (
          <Link key={href} href={href}
            className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5 transition-colors group">
            <div>
              <p className="text-xs font-medium text-white/70 group-hover:text-white/90">{label}</p>
              <p className="text-[10px] text-white/30">{desc}</p>
            </div>
            <ChevronLeft className="w-3 h-3 text-white/20 rotate-180 group-hover:text-violet-400" />
          </Link>
        ))}
      </div>

      {/* Botão encerrar */}
      <div className="flex justify-end">
        <button
          onClick={() => setEtapa('confirmando')}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-6 py-3 text-sm font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
        >
          <Lock className="w-4 h-4" /> Prosseguir para Confirmação
        </button>
      </div>
    </div>
  )
}
