'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  BarChart3, Download, FileText, Filter,
  TrendingUp, Music, Users, DollarSign,
} from 'lucide-react'
import { MOCK_LINHAS_ROYALTY, RESUMO_BO } from '@/lib/mock-backoffice-import'
import { TIPO_DIREITO_LABELS } from '@/lib/types-backoffice-import'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

const TABS = ['Por Obra', 'Por DSP', 'Por Tipo de Direito', 'ONIs', 'Valores Pendentes'] as const
type Tab = typeof TABS[number]

export default function RelatoriosBackofficePage() {
  const [tab, setTab] = useState<Tab>('Por Obra')
  const [periodo, setPeriodo] = useState('')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios BackOffice"
        description="Relatórios analíticos de royalties recebidos: por obra, por DSP, por tipo de direito, ONIs e valores pendentes."
      />

      {/* Export buttons */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                tab === t
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white/80 flex items-center gap-1.5 transition-colors">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white/80 flex items-center gap-1.5 transition-colors">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white/80 flex items-center gap-1.5 transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Recebido', value: fmt(RESUMO_BO.total_valor), icon: DollarSign, color: 'text-white/80' },
          { label: 'Identificado', value: fmt(RESUMO_BO.total_identificado), icon: Music, color: 'text-emerald-400' },
          { label: 'Pendente', value: fmt(RESUMO_BO.total_pendente), icon: TrendingUp, color: 'text-amber-400' },
          { label: 'Importações', value: String(RESUMO_BO.total_importacoes), icon: BarChart3, color: 'text-violet-400' },
        ].map(k => (
          <div key={k.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
            <k.icon className={`w-5 h-5 ${k.color} shrink-0`} />
            <div>
              <p className="text-[10px] text-white/30">{k.label}</p>
              <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Por Obra' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_90px_100px_100px_120px] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
            {['Obra', 'Autores', 'Tipo', 'Unidades', 'Royalty Líq.', 'Status'].map(h => (
              <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
            ))}
          </div>
          {MOCK_LINHAS_ROYALTY.map((l, idx) => (
            <div key={l.id} className={`grid grid-cols-[2fr_1fr_90px_100px_100px_120px] gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors ${idx < MOCK_LINHAS_ROYALTY.length - 1 ? 'border-b border-white/[0.03]' : ''}`}>
              <div>
                <p className="text-xs font-semibold text-white/80">{l.titulo_bo}</p>
                {l.obra_titulo_match && l.obra_titulo_match !== l.titulo_bo && (
                  <p className="text-[10px] text-white/30">→ {l.obra_titulo_match}</p>
                )}
              </div>
              <p className="text-xs text-white/50 truncate">{l.autores_bo}</p>
              <span className="text-[10px] text-white/40">{TIPO_DIREITO_LABELS[l.tipo_direito]}</span>
              <p className="text-xs text-white/60">{l.unidades.toLocaleString('pt-BR')}</p>
              <p className="text-xs font-semibold text-white/70">{fmt(l.royalty_liquido)}</p>
              <span className="text-[10px] text-white/50">{l.status_matching}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'Por DSP' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-4">Distribuição por DSP</p>
          <div className="space-y-4">
            {RESUMO_BO.por_dsp.map(d => {
              const pct = RESUMO_BO.total_valor > 0 ? (d.valor / RESUMO_BO.total_valor) * 100 : 0
              return (
                <div key={d.dsp}>
                  <div className="flex justify-between text-sm text-white/70 mb-1.5">
                    <span className="font-semibold">{d.dsp}</span>
                    <div className="flex gap-4">
                      <span className="text-white/40 text-xs">{d.linhas} linhas</span>
                      <span className="font-semibold">{fmt(d.valor)}</span>
                      <span className="text-white/40 text-xs">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'Por Tipo de Direito' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-4">Por Tipo de Direito</p>
          <div className="space-y-3">
            {RESUMO_BO.por_tipo_direito.map(t => {
              const pct = RESUMO_BO.total_valor > 0 ? (t.valor / RESUMO_BO.total_valor) * 100 : 0
              return (
                <div key={t.tipo} className="flex items-center gap-4">
                  <div className="w-24">
                    <p className="text-xs font-semibold text-white/70">{TIPO_DIREITO_LABELS[t.tipo]}</p>
                    <p className="text-[10px] text-white/30">{t.linhas} linhas</p>
                  </div>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-right w-28">
                    <p className="text-xs font-semibold text-white/70">{fmt(t.valor)}</p>
                    <p className="text-[10px] text-white/30">{pct.toFixed(1)}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'ONIs' && (
        <div className="space-y-4">
          <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-400 mb-1">Obras Não Identificadas (ONIs)</p>
            <p className="text-xs text-white/40">Linhas cujo score de matching ficou abaixo de 60%. Necessitam de identificação manual ou envio ao BackOffice.</p>
          </div>
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_100px_120px] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
              {['Título (BackOffice)', 'Autores', 'Royalty', 'Ação'].map(h => (
                <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
              ))}
            </div>
            {MOCK_LINHAS_ROYALTY.filter(l => l.status_matching === 'nao_identificado').map((l, idx) => (
              <div key={l.id} className={`grid grid-cols-[2fr_1fr_100px_120px] gap-2 px-4 py-3 items-center ${idx > 0 ? 'border-t border-white/[0.03]' : ''}`}>
                <p className="text-xs font-semibold text-white/80">{l.titulo_bo}</p>
                <p className="text-xs text-white/50 truncate">{l.autores_bo}</p>
                <p className="text-xs font-semibold text-red-400">{fmt(l.royalty_liquido)}</p>
                <div className="flex gap-1.5">
                  <button className="h-6 px-2 rounded bg-amber-600/20 border border-amber-500/30 text-[10px] text-amber-400 hover:bg-amber-600/40 transition-colors">
                    Identificar
                  </button>
                  <button className="h-6 px-2 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/40 hover:text-white/70 transition-colors">
                    Criar Obra
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Valores Pendentes' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {RESUMO_BO.por_status.filter(s => s.status !== 'validado').map(s => (
              <div key={s.status} className="bg-white/[0.03] rounded-xl p-4 text-center">
                <p className="text-lg font-bold text-white/70">{fmt(s.valor)}</p>
                <p className="text-[10px] text-white/30 mt-1">{s.status} ({s.linhas} linhas)</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 text-center">Após validação manual, clique em "Enviar para Conta Corrente" no módulo de Matching.</p>
        </div>
      )}

      {/* Botão atualizar CC */}
      <div className="flex justify-end">
        <button className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 transition-colors">
          <TrendingUp className="w-4 h-4" /> Atualizar Conta Corrente
        </button>
      </div>
    </div>
  )
}
