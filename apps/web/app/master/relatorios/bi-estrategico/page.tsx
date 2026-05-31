'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { BI_ESTRATEGICO, fmtBRL } from '@/lib/mock-bi'
import { Sparkles, Download } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const UNIVERSAL_FILTERS = ['Período', 'Obra', 'Titular', 'Editora', 'Fonte', 'Sociedade', 'Status', 'Tipo Direito', 'Território', 'Moeda', 'Usuário']

const SUBS = [
  { id: 'obras_mais_rentaveis', label: 'Obras Mais Rentáveis', count: BI_ESTRATEGICO.obras_mais_rentaveis.length },
  { id: 'autores_mais_rentaveis', label: 'Autores Mais Rentáveis', count: BI_ESTRATEGICO.autores_mais_rentaveis.length },
  { id: 'editoras_mais_rentaveis', label: 'Editoras Mais Rentáveis', count: BI_ESTRATEGICO.editoras_mais_rentaveis.length },
  { id: 'fontes_mais_relevantes', label: 'Fontes Mais Relevantes', count: BI_ESTRATEGICO.fontes_mais_relevantes.length },
  { id: 'dsps_mais_relevantes', label: 'DSPs Mais Relevantes', count: BI_ESTRATEGICO.dsps_mais_relevantes.length },
  { id: 'clientes_que_geram_receita', label: 'Clientes por Receita', count: BI_ESTRATEGICO.clientes_que_geram_receita.length },
  { id: 'emissoras_que_mais_usam', label: 'Emissoras', count: BI_ESTRATEGICO.emissoras_que_mais_usam.length },
  { id: 'crescimento_periodo', label: 'Crescimento por Período', count: BI_ESTRATEGICO.crescimento_por_periodo.length },
  { id: 'comparacao_trimestres', label: 'Comparação Trimestres', count: BI_ESTRATEGICO.comparacao_trimestres.length },
  { id: 'ranking_catalogo', label: 'Ranking Catálogo', count: BI_ESTRATEGICO.ranking_catalogo.length },
  { id: 'curva_receita_obra', label: 'Curva Receita Obra', count: BI_ESTRATEGICO.curva_receita_obra.length },
]

const CHART_TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#12111e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  cursor: { fill: 'rgba(139,92,246,0.08)' },
}

function formatMillions(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`
  return `R$${v}`
}

export default function RelBiEstrategicoPage() {
  const [sub, setSub] = useState('obras_mais_rentaveis')
  const [exportModal, setExportModal] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleExport(fmt: string) {
    setExportModal(fmt)
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const activeSub = SUBS.find(s => s.id === sub)!
  const totalReceita = BI_ESTRATEGICO.fontes_mais_relevantes.reduce((acc, f) => acc + f.valor, 0)

  return (
    <div className="space-y-5">
      <PageHeader title="BI Estratégico" description="Rentabilidade, DSPs, crescimento e rankings do catálogo." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Receita Total" value={fmtBRL(totalReceita)} accent="violet" subtitle="todas as fontes" icon={<Sparkles className="w-4 h-4 text-fuchsia-400" />} />
        <KpiCard title="Obras Analisadas" value={String(BI_ESTRATEGICO.obras_mais_rentaveis.length)} accent="violet" subtitle="top performers" icon={<Sparkles className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Maior Crescimento" value={BI_ESTRATEGICO.obras_mais_rentaveis[0] ? `+${BI_ESTRATEGICO.obras_mais_rentaveis[0].crescimento}%` : '—'} accent="emerald" subtitle={BI_ESTRATEGICO.obras_mais_rentaveis[0]?.obra ?? 'Sem dados'} icon={<Sparkles className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="DSPs Ativos" value={String(BI_ESTRATEGICO.dsps_mais_relevantes.length)} accent="sky" subtitle="plataformas digitais" icon={<Sparkles className="w-4 h-4 text-sky-400" />} />
      </div>

      {/* Filtros universais */}
      <div className="flex flex-wrap gap-2">
        {UNIVERSAL_FILTERS.map(f => (
          <select key={f} className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white/50 focus:outline-none">
            <option>{f}: Todos</option>
          </select>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {SUBS.map(s => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${sub === s.id ? 'bg-fuchsia-600 text-white' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'}`}
          >
            {s.label} <span className="ml-1 opacity-60">({s.count})</span>
          </button>
        ))}
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{activeSub.count} registro(s) — {activeSub.label}</p>
        <div className="flex gap-2">
          {(['PDF', 'Excel', 'CSV'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/30 hover:text-fuchsia-300 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Chart: obras_mais_rentaveis */}
      {sub === 'obras_mais_rentaveis' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">Obras Mais Rentáveis — Valor (BRL)</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={BI_ESTRATEGICO.obras_mais_rentaveis} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tickFormatter={formatMillions} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="obra" width={140} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => [fmtBRL(Number(val)), 'Receita']} {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="valor" fill="#a855f7" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart: crescimento_periodo (LineChart) */}
      {sub === 'crescimento_periodo' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">Crescimento por Período</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={BI_ESTRATEGICO.crescimento_por_periodo} margin={{ left: 8, right: 24, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="periodo" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatMillions} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => [fmtBRL(Number(val)), 'Valor']} {...CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="valor" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', strokeWidth: 0, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart: comparacao_trimestres (LineChart) */}
      {sub === 'comparacao_trimestres' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">Comparação Trimestral</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={BI_ESTRATEGICO.comparacao_trimestres} margin={{ left: 8, right: 24, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="trimestre" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatMillions} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => [fmtBRL(Number(val)), 'Valor']} {...CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="valor" stroke="#c084fc" strokeWidth={2} dot={{ fill: '#c084fc', strokeWidth: 0, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table fallback for all other subs */}
      {sub !== 'obras_mais_rentaveis' && sub !== 'crescimento_periodo' && sub !== 'comparacao_trimestres' && (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {sub === 'ranking_catalogo' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Posição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Obra</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Receita</th>
                  </>
                )}
                {sub === 'autores_mais_rentaveis' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Autor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Receita</th>
                  </>
                )}
                {sub === 'editoras_mais_rentaveis' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Editora</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Receita</th>
                  </>
                )}
                {sub === 'fontes_mais_relevantes' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Fonte</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">% Total</th>
                  </>
                )}
                {sub === 'dsps_mais_relevantes' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">DSP</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">% DSP</th>
                  </>
                )}
                {sub === 'clientes_que_geram_receita' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Receita</th>
                  </>
                )}
                {sub === 'emissoras_que_mais_usam' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Emissora</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Execuções</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Receita</th>
                  </>
                )}
                {sub === 'curva_receita_obra' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Mês</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Obra</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Valor</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sub === 'ranking_catalogo' && BI_ESTRATEGICO.ranking_catalogo.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/40 font-mono text-xs">#{row.posicao}</td>
                  <td className="px-4 py-3 text-white/70">{row.obra}</td>
                  <td className="px-4 py-3 text-right text-fuchsia-400 font-mono text-xs">{fmtBRL(row.valor)}</td>
                </tr>
              ))}
              {sub === 'autores_mais_rentaveis' && BI_ESTRATEGICO.autores_mais_rentaveis.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/70">{row.autor}</td>
                  <td className="px-4 py-3 text-right text-fuchsia-400 font-mono text-xs">{fmtBRL(row.valor)}</td>
                </tr>
              ))}
              {sub === 'editoras_mais_rentaveis' && BI_ESTRATEGICO.editoras_mais_rentaveis.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/70">{row.editora}</td>
                  <td className="px-4 py-3 text-right text-fuchsia-400 font-mono text-xs">{fmtBRL(row.valor)}</td>
                </tr>
              ))}
              {sub === 'fontes_mais_relevantes' && BI_ESTRATEGICO.fontes_mais_relevantes.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/70">{row.fonte}</td>
                  <td className="px-4 py-3 text-right text-fuchsia-400 font-mono text-xs">{fmtBRL(row.valor)}</td>
                  <td className="px-4 py-3 text-right text-white/40 text-xs">{row.percentual.toFixed(1)}%</td>
                </tr>
              ))}
              {sub === 'dsps_mais_relevantes' && BI_ESTRATEGICO.dsps_mais_relevantes.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/70">{row.dsp}</td>
                  <td className="px-4 py-3 text-right text-fuchsia-400 font-mono text-xs">{fmtBRL(row.valor)}</td>
                  <td className="px-4 py-3 text-right text-white/40 text-xs">{row.percentual.toFixed(1)}%</td>
                </tr>
              ))}
              {sub === 'clientes_que_geram_receita' && BI_ESTRATEGICO.clientes_que_geram_receita.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/70">{row.cliente}</td>
                  <td className="px-4 py-3 text-right text-fuchsia-400 font-mono text-xs">{fmtBRL(row.valor)}</td>
                </tr>
              ))}
              {sub === 'emissoras_que_mais_usam' && BI_ESTRATEGICO.emissoras_que_mais_usam.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/70">{row.emissora}</td>
                  <td className="px-4 py-3 text-right text-sky-400 font-mono text-xs">{row.execucoes.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-right text-fuchsia-400 font-mono text-xs">{fmtBRL(row.valor)}</td>
                </tr>
              ))}
              {sub === 'curva_receita_obra' && BI_ESTRATEGICO.curva_receita_obra.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/50 text-xs">{row.mes}</td>
                  <td className="px-4 py-3 text-white/70">{row.obra}</td>
                  <td className="px-4 py-3 text-right text-fuchsia-400 font-mono text-xs">{fmtBRL(row.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Export modal */}
      {exportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#12111e] border border-white/[0.08] rounded-2xl p-6 w-80 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-fuchsia-500/10 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-fuchsia-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Exportação {exportModal}</p>
              {exporting ? (
                <p className="text-white/40 text-sm mt-1">Gerando arquivo...</p>
              ) : (
                <p className="text-emerald-400 text-sm mt-1">Arquivo gerado com sucesso!</p>
              )}
            </div>
            {!exporting && (
              <button
                onClick={() => setExportModal(null)}
                className="w-full py-2 rounded-xl bg-fuchsia-600 text-white text-sm hover:bg-fuchsia-700 transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
