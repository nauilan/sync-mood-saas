'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Upload, FileText, CheckCircle2, AlertCircle, Clock,
  ChevronRight, Filter, Download, Eye, RefreshCw, X, Music,
} from 'lucide-react'
import { MOCK_IMPORTACOES_BO, RESUMO_BO } from '@/lib/mock-backoffice-import'
import {
  STATUS_IMPORTACAO_BO_LABELS,
  STATUS_IMPORTACAO_BO_COLORS,
  TIPO_DIREITO_LABELS,
} from '@/lib/types-backoffice-import'
import { parseB55Text, aggregateB55 } from '@/lib/parse-b55'
import type { B55ParseResult, B55Aggregated } from '@/lib/parse-b55'
import { MOCK_OBRAS } from '@/lib/mock-obras'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

interface ProcessedFile {
  filename: string
  result: B55ParseResult
  aggregated: B55Aggregated[]
  matchCount: number
  noMatchCount: number
}

export default function ImportacaoBackofficePage() {
  const [isDragging, setIsDragging] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDSP, setFilterDSP] = useState('')
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = MOCK_IMPORTACOES_BO.filter(i => {
    if (filterStatus && i.status !== filterStatus) return false
    if (filterDSP && (i.dsp ?? '') !== filterDSP) return false
    return true
  })

  const dsps = Array.from(new Set(MOCK_IMPORTACOES_BO.map(i => i.dsp).filter(Boolean)))

  // Conjunto de códigos do catálogo para matching
  const catalogCodes = new Set(MOCK_OBRAS.map((o: any) => o.codigo))

  function handleFiles(files: FileList) {
    setLoading(true)
    const results: ProcessedFile[] = []
    let remaining = files.length

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const result = parseB55Text(text, file.name)
        const aggregated = aggregateB55(result)
        const matchCount = aggregated.filter(r => catalogCodes.has(r.song_code)).length
        const noMatchCount = aggregated.length - matchCount
        results.push({ filename: file.name, result, aggregated, matchCount, noMatchCount })
        remaining--
        if (remaining === 0) {
          setProcessedFiles(prev => [...prev, ...results])
          setLoading(false)
          if (results.length === 1) setSelectedFile(results[0])
        }
      }
      reader.readAsText(file, 'utf-8')
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importação BackOffice"
        description="Importe extratos de royalties (B-55), autorizações (B-8) e performers (B-9) enviados pelo BackOffice Music Services."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Recebido', value: fmt(RESUMO_BO.total_valor), icon: Download, color: 'text-white/80', bg: 'bg-white/5' },
          { label: 'Identificado', value: fmt(RESUMO_BO.total_identificado), icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Pendente', value: fmt(RESUMO_BO.total_pendente), icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Não Identificado', value: fmt(RESUMO_BO.total_nao_identificado), icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(k => (
          <div key={k.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className={`${k.bg} rounded-lg p-2`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <p className="text-[11px] text-white/35">{k.label}</p>
            </div>
            <p className={`text-lg font-bold ${k.color} leading-none`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${isDragging
            ? 'border-violet-500/70 bg-violet-500/10'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
          }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.xls,.xlsx,.xml,.csv"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        {loading ? (
          <RefreshCw className="w-8 h-8 text-violet-400 mx-auto mb-3 animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-white/20 mx-auto mb-3" />
        )}
        <p className="text-sm font-semibold text-white/60 mb-1">
          {loading ? 'Processando...' : 'Arraste o arquivo aqui ou clique para selecionar'}
        </p>
        <p className="text-xs text-white/30">Formatos aceitos: .TXT (B-55 fixed-width), .XLS, .XLSX, .XML, .CSV</p>
        <div className="flex justify-center gap-4 mt-4">
          {['B-55 Royalty', 'B-8 Songs Auth', 'B-9 Performers', 'Excel Genérico'].map(tipo => (
            <span key={tipo} className="text-[10px] text-white/25 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
              {tipo}
            </span>
          ))}
        </div>
      </div>

      {/* Arquivos processados localmente */}
      {processedFiles.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
            Arquivos Processados ({processedFiles.length})
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {processedFiles.map((pf, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(pf === selectedFile ? null : pf)}
                className={`text-left rounded-xl p-4 border transition-colors ${
                  selectedFile === pf
                    ? 'border-violet-500/50 bg-violet-500/10'
                    : 'border-white/[0.06] bg-[#0d1526] hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <FileText className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-white/80 truncate">{pf.filename}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {pf.result.statement_id} · {pf.result.source}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setProcessedFiles(prev => prev.filter((_, i) => i !== idx)); if (selectedFile === pf) setSelectedFile(null) }}
                    className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs font-bold text-white/70">{pf.result.total_linhas}</p>
                    <p className="text-[10px] text-white/30">Linhas</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-400">{pf.matchCount}</p>
                    <p className="text-[10px] text-white/30">Encontradas</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-400">{pf.noMatchCount}</p>
                    <p className="text-[10px] text-white/30">Não localiz.</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-white/80 mt-2">{fmt(pf.result.total_valor)}</p>
                {pf.result.periodo_inicio && (
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {pf.result.periodo_inicio} → {pf.result.periodo_fim}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Detalhe do arquivo selecionado */}
          {selectedFile && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                <div>
                  <p className="text-sm font-semibold text-white/80">{selectedFile.filename}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {selectedFile.result.statement_id} · {selectedFile.result.source} · {selectedFile.result.publisher}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-400">{fmt(selectedFile.result.total_valor)}</span>
              </div>

              {/* Cabeçalho tabela */}
              <div className="grid grid-cols-[80px_1fr_120px_80px_100px_80px] gap-2 px-4 py-2 border-b border-white/[0.04]">
                {['Código', 'Título', 'Editora', 'Período', 'Valor', 'Status'].map(h => (
                  <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
                ))}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {selectedFile.aggregated.map((row, i) => {
                  const matched = catalogCodes.has(row.song_code)
                  return (
                    <div
                      key={i}
                      className={`grid grid-cols-[80px_1fr_120px_80px_100px_80px] gap-2 px-4 py-2.5 items-center border-b border-white/[0.03] hover:bg-white/[0.02] ${
                        i === selectedFile.aggregated.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <p className="text-[10px] font-mono text-white/60">{row.song_code}</p>
                      <div className="min-w-0">
                        <p className="text-xs text-white/80 truncate">{row.song_title || '—'}</p>
                        <p className="text-[10px] text-white/30 truncate">{row.publisher ?? ''}</p>
                      </div>
                      <p className="text-[10px] text-white/50 truncate">{row.publisher}</p>
                      <p className="text-[10px] text-white/40">{row.start_date}</p>
                      <p className="text-xs font-semibold text-white/70">{fmt(row.total)}</p>
                      <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full border w-fit ${
                        matched
                          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                          : 'text-red-400 border-red-500/30 bg-red-500/10'
                      }`}>
                        {matched ? 'OK' : 'ONI'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters + Table histórico */}
      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Histórico de Importações</p>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <select
              value={filterDSP}
              onChange={e => setFilterDSP(e.target.value)}
              className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/70 focus:outline-none"
            >
              <option value="">Todos DSPs</option>
              {dsps.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/70 focus:outline-none"
            >
              <option value="">Todos Status</option>
              {Object.entries(STATUS_IMPORTACAO_BO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_120px_120px_90px_90px_120px_100px_120px] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
            {['Arquivo', 'Tipo', 'DSP / Período', 'Total', 'Identif.', 'Valor Total', 'Status', 'Ações'].map(h => (
              <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-10 text-center text-white/30 text-sm">Nenhuma importação encontrada.</div>
          )}

          {filtered.map((imp, idx) => (
            <div
              key={imp.id}
              className={`grid grid-cols-[2fr_120px_120px_90px_90px_120px_100px_120px] gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors ${
                idx < filtered.length - 1 ? 'border-b border-white/[0.03]' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-xs font-mono text-white/80 truncate">{imp.filename}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{imp.codigo}</p>
              </div>
              <span className="text-[10px] text-white/50 uppercase">{imp.tipo.replace(/_/g, ' ')}</span>
              <div>
                <p className="text-xs text-white/60">{imp.dsp ?? '—'}</p>
                <p className="text-[10px] text-white/30">{imp.periodo_referencia ?? '—'}</p>
              </div>
              <p className="text-xs text-white/60">{imp.total_linhas}</p>
              <div>
                <p className="text-xs text-emerald-400">{imp.linhas_identificadas}</p>
                {imp.linhas_nao_identificadas > 0 && (
                  <p className="text-[10px] text-red-400">{imp.linhas_nao_identificadas} ONI</p>
                )}
              </div>
              <p className="text-xs font-semibold text-white/70">{imp.valor_total > 0 ? fmt(imp.valor_total) : '—'}</p>
              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit ${STATUS_IMPORTACAO_BO_COLORS[imp.status]}`}>
                {STATUS_IMPORTACAO_BO_LABELS[imp.status]}
              </span>
              <div className="flex gap-1.5">
                <Link
                  href={`/master/backoffice/matching`}
                  className="flex items-center gap-1 h-6 px-2 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
                >
                  <Eye className="w-3 h-3" /> Ver
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Por DSP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 col-span-full sm:col-span-2">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">Receita por DSP</p>
          <div className="space-y-2">
            {RESUMO_BO.por_dsp.map(d => {
              const pct = RESUMO_BO.total_valor > 0 ? (d.valor / RESUMO_BO.total_valor) * 100 : 0
              return (
                <div key={d.dsp}>
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>{d.dsp}</span>
                    <span className="font-semibold">{fmt(d.valor)}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">Por Tipo de Direito</p>
          <div className="space-y-2">
            {RESUMO_BO.por_tipo_direito.map(t => (
              <div key={t.tipo} className="flex justify-between items-center">
                <span className="text-xs text-white/50">{TIPO_DIREITO_LABELS[t.tipo]}</span>
                <span className="text-xs font-semibold text-white/70">{fmt(t.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
