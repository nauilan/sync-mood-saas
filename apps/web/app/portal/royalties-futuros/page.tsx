'use client'
import { PortalNav } from '@/components/portal/portal-nav'
import { PORTAL_ROYALTIES_FUTUROS } from '@/lib/mock-portal-autor'
import { fmtBRL } from '@/lib/mock-bi'
import { Info, Calendar, Eye, Zap } from 'lucide-react'
import { KPI_PREVIA, MOCK_PREVIA_TITULAR } from '@/lib/mock-distribuicao-previa'

type RoyaltyTipo = 'apurado' | 'conciliado' | 'previsto' | 'pendente_liberacao' | 'em_contestacao' | 'bloqueado'

const tipoConfig: Record<RoyaltyTipo, { label: string; badge: string; card: string; text: string }> = {
  apurado: {
    label: 'Apurado',
    badge: 'bg-violet-500/20 text-violet-300',
    card: 'ring-violet-500/20 bg-violet-600/5',
    text: 'text-violet-400',
  },
  conciliado: {
    label: 'Conciliado',
    badge: 'bg-emerald-500/20 text-emerald-300',
    card: 'ring-emerald-500/20 bg-emerald-600/5',
    text: 'text-emerald-400',
  },
  previsto: {
    label: 'Previsto',
    badge: 'bg-sky-500/20 text-sky-300',
    card: 'ring-sky-500/20 bg-sky-600/5',
    text: 'text-sky-400',
  },
  pendente_liberacao: {
    label: 'Pendente Liberação',
    badge: 'bg-amber-500/20 text-amber-300',
    card: 'ring-amber-500/20 bg-amber-600/5',
    text: 'text-amber-400',
  },
  em_contestacao: {
    label: 'Em Contestação',
    badge: 'bg-rose-500/20 text-rose-300',
    card: 'ring-rose-500/20 bg-rose-600/5',
    text: 'text-rose-400',
  },
  bloqueado: {
    label: 'Bloqueado',
    badge: 'bg-red-500/20 text-red-300',
    card: 'ring-red-500/20 bg-red-600/5',
    text: 'text-red-400',
  },
}

export default function PortalRoyaltiesFuturosPage() {
  return (
    <>
      <PortalNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">Royalties Futuros</h1>
          <p className="text-xs text-white/40 mt-0.5">Calendário de apuração e pagamentos previstos</p>
        </div>

        {/* ── BANNER PRÉVIA ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 shrink-0">
              <Eye className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sky-300">Próxima Distribuição — Prévia {KPI_PREVIA.periodo}</p>
              <p className="text-[10px] text-sky-300/60 mt-0.5">
                Previsão de pagamento: <strong className="text-sky-200">{KPI_PREVIA.data_prevista_pagamento}</strong> · Fontes: {KPI_PREVIA.fontes.join(', ')}
              </p>
            </div>
            <div className="ml-auto text-right shrink-0">
              <p className="text-[10px] text-sky-300/50">Total Previsto</p>
              <p className="text-xl font-bold text-sky-300">{fmtBRL(KPI_PREVIA.total_previsto)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MOCK_PREVIA_TITULAR.slice(0, 6).map(t => (
              <div key={t.titular_nome} className="flex items-center justify-between rounded-lg bg-sky-500/5 border border-sky-500/10 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-white/70 truncate">{t.titular_nome}</p>
                  <p className="text-[10px] text-sky-300/50 capitalize">{t.tipo} · {t.obras_count} obra(s)</p>
                </div>
                <p className="text-sm font-bold text-sky-300 tabular-nums shrink-0 ml-3">{fmtBRL(t.valor_previsto)}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-sky-300/40 text-center">
            Valores previstos com base nos arquivos já processados. Sujeito a ajustes antes da efetivação.
          </p>
        </div>

        {/* Explainer card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/80 mb-1">Como funciona o calendário de royalties?</h2>
            <p className="text-xs text-white/50 leading-relaxed">
              Receitas apuradas no 1º trimestre têm previsão de pagamento no 3º trimestre, após conciliação com as sociedades de arrecadação.
              O processo envolve apuração (T), conciliação com ECAD/distribuidoras (T+1), validação administrativa (T+1) e pagamento (T+2).
              Valores marcados como <strong className="text-violet-300">Apurado</strong> já foram computados.
              Valores <strong className="text-sky-300">Previstos</strong> são estimativas baseadas no histórico.
            </p>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PORTAL_ROYALTIES_FUTUROS.map((rf, i) => {
            const cfg = tipoConfig[rf.tipo]
            return (
              <div key={i} className={`bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 ring-1 ${cfg.card} space-y-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/35 font-medium">{rf.trimestre}</p>
                    <p className="text-sm font-semibold text-white/80 mt-0.5">{rf.label}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>

                <div>
                  <span className={`text-3xl font-black ${cfg.text}`}>{fmtBRL(rf.valor)}</span>
                </div>

                {rf.descricao && (
                  <p className="text-xs text-white/40 leading-relaxed">{rf.descricao}</p>
                )}

                <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
                  <span className="text-xs text-white/30">
                    {rf.obras_count} obra{rf.obras_count !== 1 ? 's' : ''}
                  </span>
                  {rf.data_prevista_pagamento && (
                    <span className="flex items-center gap-1 text-xs text-white/35">
                      <Calendar className="w-3 h-3" />
                      {new Date(rf.data_prevista_pagamento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
