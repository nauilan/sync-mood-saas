'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, FileText, CheckCircle2, XCircle, RefreshCw,
  BarChart3, Music, Users, Calendar, TrendingUp, AlertTriangle,
  ChevronDown, ChevronUp, Eye, Trash2, Download,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import {
  type LoteSocinpro, type LinhaSocinpro, type SociedadeECAD, type TipoExecucaoPublica,
  TIPO_EXECUCAO_LABELS,
  salvarLote, obterLotes, excluirLote,
  calcularBIExecucaoPublica, gerarMockLinhas,
} from '@/lib/socinpro-ecad'

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtNum(v: number) {
  return v.toLocaleString('pt-BR')
}

const STATUS_CONFIG = {
  pendente:    { label: 'Pendente',    cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  conciliado:  { label: 'Conciliado',  cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  divergencia: { label: 'Divergência', cls: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
}

const SOCIEDADES: SociedadeECAD[] = ['SOCINPRO','ABRAMUS','AMAR','ASSIM','SBACEM','SICAM','UBC','OUTRA']
const TIPOS_EXEC: TipoExecucaoPublica[] = Object.keys(TIPO_EXECUCAO_LABELS) as TipoExecucaoPublica[]

function gerarId() {
  return `soc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ── KPI Card simples ─────────────────────────────────────────────────────────

function KPI({ icon: Icon, label, value, sub, color = 'violet' }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string
}) {
  const colors: Record<string, string> = {
    violet: 'text-violet-400 bg-violet-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    sky: 'text-sky-400 bg-sky-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  }
  return (
    <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/40">{label}</p>
        <p className="text-base font-bold text-white/90 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function SocinproEcadPage() {
  const router = useRouter()
  const [lotes, setLotes] = useState<LoteSocinpro[]>([])
  const [bi, setBi] = useState<ReturnType<typeof calcularBIExecucaoPublica> | null>(null)

  // modal de import
  const [modalOpen, setModalOpen] = useState(false)
  const [formSoc, setFormSoc] = useState<SociedadeECAD>('SOCINPRO')
  const [formComp, setFormComp] = useState('')  // YYYY-MM
  const [formFile, setFormFile] = useState<string | null>(null)
  const [importStep, setImportStep] = useState<'idle'|'dragging'|'uploading'|'preview'|'success'>('idle')
  const [previewLinhas, setPreviewLinhas] = useState<LinhaSocinpro[]>([])

  // detalhe do lote expandido
  const [loteExpandido, setLoteExpandido] = useState<string | null>(null)
  const [abaBi, setAbaBi] = useState<'obras'|'titulares'|'competencia'|'tipo'>('obras')

  // aba principal
  const [aba, setAba] = useState<'importar'|'historico'|'bi'>('importar')

  function reload() {
    const l = obterLotes()
    setLotes(l)
    setBi(calcularBIExecucaoPublica())
  }

  useEffect(() => { reload() }, [])

  // ── Upload ───────────────────────────────────────────────────────────────

  function handleFile(name: string) {
    setFormFile(name)
    setImportStep('uploading')
    // Simula parse + gera mock com a competência informada
    setTimeout(() => {
      const competencia = formComp || new Date().toISOString().slice(0, 7)
      setPreviewLinhas(gerarMockLinhas(competencia).map(l => ({ ...l, sociedade: formSoc })))
      setImportStep('preview')
    }, 1400)
  }

  function confirmarImportacao() {
    const competencia = formComp || new Date().toISOString().slice(0, 7)
    const linhas = previewLinhas
    const lote: LoteSocinpro = {
      id: gerarId(),
      nome_arquivo: formFile ?? 'demonstrativo.xlsx',
      sociedade: formSoc,
      competencia,
      data_importacao: new Date().toISOString(),
      importado_por: 'Marina Lopes',
      total_linhas: linhas.length,
      total_obras: new Set(linhas.map(l => l.obra_titulo)).size,
      total_titulares: new Set(linhas.map(l => l.titular_nome)).size,
      valor_bruto_total: linhas.reduce((s, l) => s + l.valor_bruto, 0),
      valor_liquido_total: linhas.reduce((s, l) => s + l.valor_liquido, 0),
      status: 'pendente',
      linhas,
    }
    salvarLote(lote)
    setImportStep('success')
    reload()
    setTimeout(() => {
      setModalOpen(false)
      setImportStep('idle')
      setFormFile(null)
      setAba('historico')
    }, 1800)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file.name)
  }, [formComp, formSoc])

  // ── BI ───────────────────────────────────────────────────────────────────

  const totalLotes = lotes.length
  const totalObras = bi?.ranking_obras.length ?? 0
  const totalLiquido = bi?.total_geral_liquido ?? 0
  const totalExecucoes = bi?.total_geral_execucoes ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="SOCINPRO / ECAD — Execução Pública"
        description="Importação de demonstrativos ECAD. Valores NÃO redistribuídos pelo CC Obra — alimentam BI, Financeiro e Prestação de Contas."
        actions={
          <button
            onClick={() => { setModalOpen(true); setImportStep('idle') }}
            className="flex items-center gap-2 h-9 px-4 bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" /> Importar Demonstrativo
          </button>
        }
      />

      {/* Aviso regra ECAD */}
      <div className="flex items-start gap-3 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300/80">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
        <span>
          <strong className="text-amber-300">Atenção:</strong> valores de execução pública (ECAD/SOCINPRO) são pagos diretamente às sociedades arrecadadoras,
          que repassam aos titulares. <strong>Não entram no CC Obra.</strong> Este módulo é exclusivamente informativo — alimenta BI e financeiro.
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon={FileText}  label="Lotes importados"     value={String(totalLotes)}         color="violet" />
        <KPI icon={Music}     label="Obras monitoradas"    value={String(totalObras)}          color="sky"    />
        <KPI icon={TrendingUp}label="Total líquido recebido" value={fmtBRL(totalLiquido)}      color="emerald"/>
        <KPI icon={BarChart3} label="Execuções registradas" value={fmtNum(totalExecucoes)}     color="amber"  />
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {[
          { id: 'importar', label: 'Importar' },
          { id: 'historico', label: `Histórico (${totalLotes})` },
          { id: 'bi', label: 'BI — Execução Pública' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setAba(t.id as typeof aba)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              aba === t.id
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ABA IMPORTAR ── */}
      {aba === 'importar' && (
        <div className="space-y-5">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/80 mb-1">Como importar um demonstrativo SOCINPRO/ECAD</h3>
            <ol className="text-xs text-white/50 space-y-2 mt-3 list-decimal list-inside leading-relaxed">
              <li>Acesse o portal da sua sociedade (SOCINPRO, ABRAMUS, UBC, etc.) e baixe o demonstrativo do período.</li>
              <li>Clique em <strong className="text-white/70">&quot;Importar Demonstrativo&quot;</strong>, selecione a sociedade e a competência (mês/ano).</li>
              <li>Faça upload do arquivo (.XLS, .XLSX, .CSV ou .PDF). O sistema lê e exibe pré-visualização das linhas detectadas.</li>
              <li>Confira os dados e confirme. O lote é gravado e imediatamente disponível no BI e no Financeiro.</li>
              <li>Nenhum valor é redistribuído pelo CC Obra — o repasse foi feito diretamente pela sociedade ao titular.</li>
            </ol>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {(['SOCINPRO','ABRAMUS','UBC','AMAR','ASSIM','SBACEM'] as SociedadeECAD[]).map(s => (
              <button
                key={s}
                onClick={() => { setFormSoc(s); setModalOpen(true); setImportStep('idle') }}
                className="flex items-center gap-3 bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 hover:border-violet-500/30 hover:bg-violet-500/[0.03] transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0">
                  {s.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">{s}</p>
                  <p className="text-xs text-white/30">
                    {lotes.filter(l => l.sociedade === s).length} lote(s) importado(s)
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA HISTÓRICO ── */}
      {aba === 'historico' && (
        <div className="space-y-3">
          {lotes.length === 0 && (
            <div className="text-center py-16 text-white/30 text-sm">
              Nenhum demonstrativo importado ainda.
            </div>
          )}
          {lotes.map(lote => {
            const sc = STATUS_CONFIG[lote.status]
            const expandido = loteExpandido === lote.id
            return (
              <div key={lote.id} className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
                {/* Header do lote */}
                <div className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0">
                      {lote.sociedade.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white/80 truncate">{lote.sociedade}</span>
                        <span className="text-xs text-white/40">{lote.competencia}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${sc.cls}`}>{sc.label}</span>
                      </div>
                      <p className="text-xs text-white/30 truncate mt-0.5">{lote.nome_arquivo}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
                    <div>
                      <p className="text-xs text-white/30">Obras</p>
                      <p className="text-sm font-semibold text-white/70">{lote.total_obras}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Valor Líquido</p>
                      <p className="text-sm font-semibold text-emerald-400">{fmtBRL(lote.valor_liquido_total)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLoteExpandido(expandido ? null : lote.id)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white/70 transition-colors"
                        title={expandido ? 'Recolher' : 'Ver detalhes'}
                      >
                        {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Excluir este lote?')) { excluirLote(lote.id); reload() }
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors"
                        title="Excluir lote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Linhas expandidas */}
                {expandido && (
                  <div className="border-t border-white/[0.06] overflow-x-auto">
                    <table className="w-full text-xs min-w-[780px]">
                      <thead>
                        <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                          {['Obra','ISWC','Titular','Tipo Execução','Execuções','Valor Bruto','Desconto','Valor Líquido'].map(h => (
                            <th key={h} className="text-left font-semibold text-white/30 px-4 py-2.5 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {lote.linhas.map(l => (
                          <tr key={l.id} className="hover:bg-white/[0.015]">
                            <td className="px-4 py-2.5 text-white/70 font-medium">{l.obra_titulo}</td>
                            <td className="px-4 py-2.5 text-white/40 font-mono">{l.iswc ?? '—'}</td>
                            <td className="px-4 py-2.5 text-white/60">{l.titular_nome}</td>
                            <td className="px-4 py-2.5 text-white/50">{TIPO_EXECUCAO_LABELS[l.tipo_execucao]}</td>
                            <td className="px-4 py-2.5 text-white/50 tabular-nums text-right">{fmtNum(l.num_execucoes)}</td>
                            <td className="px-4 py-2.5 text-white/50 tabular-nums text-right">{fmtBRL(l.valor_bruto)}</td>
                            <td className="px-4 py-2.5 text-rose-400/70 tabular-nums text-right">
                              {l.desconto_admin ? `- ${fmtBRL(l.desconto_admin)}` : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-emerald-400 tabular-nums text-right font-semibold">{fmtBRL(l.valor_liquido)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── ABA BI ── */}
      {aba === 'bi' && bi && (
        <div className="space-y-5">
          {/* Sub-abas */}
          <div className="flex gap-1 flex-wrap">
            {[
              { id: 'obras',       label: `Obras (${bi.ranking_obras.length})` },
              { id: 'titulares',   label: `Titulares (${bi.ranking_titulares.length})` },
              { id: 'competencia', label: 'Por Período' },
              { id: 'tipo',        label: 'Por Tipo Execução' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setAbaBi(t.id as typeof abaBi)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  abaBi === t.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/[0.04] text-white/50 hover:text-white/80'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Obras */}
          {abaBi === 'obras' && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {['#','Obra','ISWC','Execuções','Valor Líquido','Períodos','Tipos'].map(h => (
                      <th key={h} className="text-left font-semibold text-white/30 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {bi.ranking_obras.map((o, i) => (
                    <tr key={o.obra_titulo} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-white/30 font-mono">{i + 1}</td>
                      <td className="px-4 py-2.5 text-white/80 font-medium">{o.obra_titulo}</td>
                      <td className="px-4 py-2.5 text-white/40 font-mono">{o.iswc ?? '—'}</td>
                      <td className="px-4 py-2.5 text-white/60 tabular-nums text-right">{fmtNum(o.total_execucoes)}</td>
                      <td className="px-4 py-2.5 text-emerald-400 font-semibold tabular-nums text-right">{fmtBRL(o.total_valor_liquido)}</td>
                      <td className="px-4 py-2.5 text-white/40">{o.competencias.length}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {o.tipos.map(t => (
                            <span key={t} className="text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded">
                              {TIPO_EXECUCAO_LABELS[t].split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bi.ranking_obras.length === 0 && (
                <p className="text-center text-white/30 py-10 text-sm">Importe demonstrativos para ver o ranking.</p>
              )}
            </div>
          )}

          {/* Titulares */}
          {abaBi === 'titulares' && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {['#','Titular','Sociedade','Execuções','Valor Líquido'].map(h => (
                      <th key={h} className="text-left font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {bi.ranking_titulares.map((t, i) => (
                    <tr key={`${t.titular_nome}_${i}`} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-white/30 font-mono">{i + 1}</td>
                      <td className="px-4 py-2.5 text-white/80 font-medium">{t.titular_nome}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20 px-1.5 py-0.5 rounded">
                          {t.sociedade}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-white/60 tabular-nums text-right">{fmtNum(t.total_execucoes)}</td>
                      <td className="px-4 py-2.5 text-emerald-400 font-semibold tabular-nums text-right">{fmtBRL(t.total_valor_liquido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Por período */}
          {abaBi === 'competencia' && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {['Competência','Obras','Execuções','Valor Bruto','Valor Líquido'].map(h => (
                      <th key={h} className="text-left font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {bi.por_competencia.map(c => (
                    <tr key={c.competencia} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-white/80 font-mono font-medium">{c.competencia}</td>
                      <td className="px-4 py-2.5 text-white/60 tabular-nums">{c.total_obras}</td>
                      <td className="px-4 py-2.5 text-white/60 tabular-nums text-right">{fmtNum(c.total_execucoes)}</td>
                      <td className="px-4 py-2.5 text-white/50 tabular-nums text-right">{fmtBRL(c.valor_bruto)}</td>
                      <td className="px-4 py-2.5 text-emerald-400 font-semibold tabular-nums text-right">{fmtBRL(c.valor_liquido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Por tipo execução */}
          {abaBi === 'tipo' && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-x-auto">
              <table className="w-full text-xs min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {['Tipo de Execução','Execuções','Valor Líquido'].map(h => (
                      <th key={h} className="text-left font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {bi.por_tipo_execucao.map(t => (
                    <tr key={t.tipo} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-white/80 font-medium">{t.label}</td>
                      <td className="px-4 py-2.5 text-white/60 tabular-nums text-right">{fmtNum(t.execucoes)}</td>
                      <td className="px-4 py-2.5 text-emerald-400 font-semibold tabular-nums text-right">{fmtBRL(t.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {bi.ranking_obras.length === 0 && (
            <p className="text-center text-white/30 py-10 text-sm">Importe demonstrativos para visualizar o BI.</p>
          )}
        </div>
      )}

      {/* ── MODAL IMPORT ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-semibold text-white">Importar Demonstrativo ECAD</h2>
                <p className="text-xs text-white/40 mt-0.5">Selecione a sociedade e a competência antes de fazer o upload</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/30 hover:text-white/70">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Seleção sociedade + competência */}
              {importStep === 'idle' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/40 block mb-2">Sociedade *</label>
                      <select
                        value={formSoc}
                        onChange={e => setFormSoc(e.target.value as SociedadeECAD)}
                        className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white/70 outline-none focus:border-violet-500/40"
                      >
                        {SOCIEDADES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-2">Competência (mês/ano) *</label>
                      <input
                        type="month"
                        value={formComp}
                        onChange={e => setFormComp(e.target.value)}
                        className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white/70 outline-none focus:border-violet-500/40"
                      />
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setImportStep('dragging') }}
                    onDragLeave={() => setImportStep('idle')}
                    onDrop={onDrop}
                    className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-violet-500/40 transition-colors py-12 cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-white/20" />
                    <p className="text-sm text-white/50">Arraste o arquivo ou clique para selecionar</p>
                    <p className="text-xs text-white/25">XLS · XLSX · CSV · PDF · TXT</p>
                    <label className="flex items-center gap-1.5 mt-2 h-8 px-4 rounded-lg text-xs font-semibold cursor-pointer bg-violet-600 hover:bg-violet-500 text-white transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Selecionar Arquivo
                      <input
                        type="file"
                        className="hidden"
                        accept=".xls,.xlsx,.csv,.pdf,.txt"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f.name) }}
                      />
                    </label>
                  </div>
                </>
              )}

              {importStep === 'dragging' && (
                <div className="flex flex-col items-center py-12 gap-3 rounded-xl border-2 border-dashed border-violet-500/60 bg-violet-500/[0.04]">
                  <Upload className="w-8 h-8 text-violet-400" />
                  <p className="text-sm text-violet-300">Solte o arquivo para fazer upload</p>
                </div>
              )}

              {importStep === 'uploading' && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                  <p className="text-sm text-white/50">Processando <span className="text-white/70">{formFile}</span>…</p>
                </div>
              )}

              {importStep === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm text-white/70">
                      <span className="font-medium text-white">{formFile}</span> processado — {previewLinhas.length} linhas detectadas
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                    <table className="w-full text-xs min-w-[680px]">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          {['Obra','ISWC','Titular','Tipo Execução','Execuções','Vlr Bruto','Vlr Líquido'].map(h => (
                            <th key={h} className="text-left font-semibold text-white/30 px-3 py-2.5">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {previewLinhas.slice(0, 8).map(l => (
                          <tr key={l.id} className="hover:bg-white/[0.02]">
                            <td className="px-3 py-2 text-white/70">{l.obra_titulo}</td>
                            <td className="px-3 py-2 text-white/40 font-mono text-[10px]">{l.iswc ?? '—'}</td>
                            <td className="px-3 py-2 text-white/50">{l.titular_nome}</td>
                            <td className="px-3 py-2 text-white/50">{TIPO_EXECUCAO_LABELS[l.tipo_execucao]}</td>
                            <td className="px-3 py-2 text-white/50 tabular-nums text-right">{fmtNum(l.num_execucoes)}</td>
                            <td className="px-3 py-2 text-white/50 tabular-nums text-right">{fmtBRL(l.valor_bruto)}</td>
                            <td className="px-3 py-2 text-emerald-400 tabular-nums text-right">{fmtBRL(l.valor_liquido)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewLinhas.length > 8 && (
                    <p className="text-xs text-white/30 text-center">+ {previewLinhas.length - 8} linhas adicionais (exibindo pré-visualização)</p>
                  )}
                </div>
              )}

              {importStep === 'success' && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  <p className="text-sm text-emerald-300 font-medium">Demonstrativo importado com sucesso!</p>
                  <p className="text-xs text-white/40">Dados disponíveis no BI e no Financeiro.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {importStep === 'preview' && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                <button
                  onClick={() => { setImportStep('idle'); setFormFile(null) }}
                  className="h-8 px-4 text-xs text-white/50 hover:text-white/80 border border-white/[0.06] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarImportacao}
                  className="flex items-center gap-1.5 h-8 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Importação
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
