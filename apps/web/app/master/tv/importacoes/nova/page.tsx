'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight, ChevronLeft, Upload, CheckCircle2, AlertCircle,
  FileText, Tv, Loader2, X, Check, Zap,
} from 'lucide-react'
import type { TvFormatoArquivo } from '@/lib/types-tv'

// ── Types ──────────────────────────────────────────────────────────────────────

type Emissora = 'Globo' | 'SBT' | 'Record' | 'Multishow' | 'Globoplay'

interface Step1Data {
  emissora: Emissora | ''
  formato: TvFormatoArquivo | ''
  periodo_inicio: string
  periodo_fim: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const EMISSORAS: Emissora[] = ['Globo', 'SBT', 'Record', 'Multishow', 'Globoplay']

const FORMATOS: { value: TvFormatoArquivo; label: string; desc: string }[] = [
  { value: 'xlsx',      label: 'XLSX',      desc: 'Planilha Excel (recomendado)' },
  { value: 'csv',       label: 'CSV',       desc: 'Texto separado por vírgulas' },
  { value: 'pdf',       label: 'PDF',       desc: 'Demonstrativo em PDF' },
  { value: 'cue_sheet', label: 'Cue Sheet', desc: 'Folha de cue padronizada' },
  { value: 'xls',       label: 'XLS',       desc: 'Planilha Excel legado' },
]

const MOCK_PREVIEW_ROWS = [
  { titulo: 'AMO NOITE E DIA',           interprete: 'NAUILAN',         autor: 'NAUILAN BARBOSA',  programa: 'Novela ANE',      data: '15/01/2026', duracao: '00:01:30', tipo_uso: 'tema' },
  { titulo: 'SAUDADE DO INTERIOR',       interprete: 'GRUPO SENSACAO',  autor: 'MARCELO COSTA',    programa: 'Jornal da Globo', data: '20/01/2026', duracao: '00:00:12', tipo_uso: 'fundo' },
  { titulo: 'CORACAO PARTIDO',           interprete: 'JOAO PEDRO',      autor: 'JOAO P. MORAES',   programa: 'Fantastico',      data: '10/02/2026', duracao: '00:00:15', tipo_uso: 'fundo' },
  { titulo: 'RAIZ DE SERTAO',            interprete: 'DANIEL S',        autor: 'DANIEL SOUZA',     programa: 'Globo Rural',     data: '05/01/2026', duracao: '00:00:45', tipo_uso: 'abertura' },
  { titulo: 'NOITE DE FESTA',            interprete: 'PEDRO CARVALHO',  autor: 'PEDRO AUGUSTO',    programa: 'The Voice',       data: '30/01/2026', duracao: '00:01:00', tipo_uso: 'encerramento' },
]

const DETECTED_COLUMNS = [
  { source: 'TITULO_OBRA',       mapped: 'titulo_importado' },
  { source: 'INTERPRETE',        mapped: 'interprete_importado' },
  { source: 'COMPOSITOR',        mapped: 'autor_importado' },
  { source: 'PROG_EXIBICAO',     mapped: 'programa' },
  { source: 'DT_EXIBICAO',       mapped: 'data_exibicao' },
  { source: 'DUR_SEGUNDOS',      mapped: 'duracao_seg' },
  { source: 'TIPO_UTILIZACAO',   mapped: 'tipo_uso' },
]

const STEP_LABELS = ['Configuração', 'Upload', 'Preview', 'Matching']

// ── Step indicators ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1
        const done = step < current
        const active = step === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : active
                    ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                    : 'bg-white/5 border-white/10 text-white/25'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-violet-300' : done ? 'text-white/50' : 'text-white/20'}`}>
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div className={`w-12 sm:w-20 h-px mx-1 mb-5 transition-colors ${done ? 'bg-violet-600' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function NovaImportacaoPage() {
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1
  const [step1, setStep1] = useState<Step1Data>({
    emissora: '', formato: '', periodo_inicio: '', periodo_fim: '',
  })

  // Step 2
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  // Step 4
  const [matching, setMatching] = useState(false)
  const [matchDone, setMatchDone] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)

  function canGoNext() {
    if (currentStep === 1) return step1.emissora !== '' && step1.formato !== '' && step1.periodo_inicio !== '' && step1.periodo_fim !== ''
    if (currentStep === 2) return uploaded
    return true
  }

  function handleFile(file: File) {
    setFileName(file.name)
    setUploading(true)
    setUploaded(false)
    setTimeout(() => {
      setUploading(false)
      setUploaded(true)
    }, 1400)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function goNext() {
    if (currentStep === 3) {
      setCurrentStep(4)
      // Simulate matching progress
      setMatching(true)
      setProgress(0)
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval)
            setMatching(false)
            setMatchDone(true)
            return 100
          }
          return p + 8
        })
      }, 120)
      return
    }
    setCurrentStep(s => Math.min(s + 1, 4))
  }

  function goBack() {
    setCurrentStep(s => Math.max(s - 1, 1))
  }

  const inputCls = 'h-9 w-full bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors'
  const labelCls = 'block text-xs font-semibold text-white/50 mb-1.5'

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/master/tv/importacoes"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Nova Importação TV</h1>
          <p className="text-sm text-white/40">Importar cue sheet ou planilha audiovisual</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-center">
        <StepIndicator current={currentStep} />
      </div>

      {/* ── STEP 1: Configuração ── */}
      {currentStep === 1 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Tv className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-semibold text-white">Configuração da Importação</h2>
          </div>

          {/* Emissora */}
          <div>
            <label className={labelCls}>Emissora</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EMISSORAS.map(e => (
                <button
                  key={e}
                  onClick={() => setStep1(s => ({ ...s, emissora: e }))}
                  className={`h-10 rounded-lg text-sm font-medium border transition-all ${
                    step1.emissora === e
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div>
            <label className={labelCls}>Formato do Arquivo</label>
            <div className="space-y-2">
              {FORMATOS.map(f => (
                <label
                  key={f.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    step1.formato === f.value
                      ? 'bg-violet-600/15 border-violet-500/40'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    type="radio"
                    name="formato"
                    value={f.value}
                    checked={step1.formato === f.value}
                    onChange={() => setStep1(s => ({ ...s, formato: f.value }))}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    step1.formato === f.value ? 'border-violet-400' : 'border-white/20'
                  }`}>
                    {step1.formato === f.value && (
                      <div className="w-2 h-2 rounded-full bg-violet-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">{f.label}</span>
                    <span className="text-xs text-white/40 ml-2">{f.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Período Início</label>
              <input
                type="date"
                value={step1.periodo_inicio}
                onChange={e => setStep1(s => ({ ...s, periodo_inicio: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Período Fim</label>
              <input
                type="date"
                value={step1.periodo_fim}
                onChange={e => setStep1(s => ({ ...s, periodo_fim: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Upload ── */}
      {currentStep === 2 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold text-white">Upload do Arquivo</h2>
          </div>

          {/* Summary pill */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300">
              {step1.emissora}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 uppercase">
              {step1.formato}
            </span>
            <span className="text-xs text-white/40">
              {step1.periodo_inicio} – {step1.periodo_fim}
            </span>
          </div>

          {/* Dropzone */}
          {!uploaded && !uploading && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-16 transition-all cursor-pointer ${
                dragOver
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
              }`}
            >
              <Upload className={`w-10 h-10 ${dragOver ? 'text-violet-400' : 'text-white/20'}`} />
              <div className="text-center">
                <p className="text-sm text-white/50 mb-1">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-xs text-white/25">Aceito: XLSX, CSV, PDF, XLS, Cue Sheet</p>
              </div>
              <label className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-sm text-violet-300 font-semibold cursor-pointer hover:bg-violet-600/30 transition-colors">
                <Upload className="w-4 h-4" /> Selecionar Arquivo
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileInput}
                />
              </label>
            </div>
          )}

          {/* Uploading spinner */}
          {uploading && (
            <div className="flex flex-col items-center justify-center gap-3 py-14">
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
              <p className="text-sm text-white/50">
                Processando <span className="text-white/70 font-medium">{fileName}</span>…
              </p>
            </div>
          )}

          {/* Uploaded success */}
          {uploaded && !uploading && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{fileName}</p>
                <p className="text-xs text-emerald-300 mt-0.5">Arquivo carregado — pronto para pré-visualização</p>
              </div>
              <button
                onClick={() => { setUploaded(false); setFileName(null) }}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Preview + Mapeamento ── */}
      {currentStep === 3 && (
        <div className="space-y-4">
          {/* Preview table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
              <FileText className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Pré-visualização — 5 primeiras linhas</h2>
              <span className="ml-auto text-xs text-white/30">Arquivo: {fileName ?? 'importacao.xlsx'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {['Título', 'Intérprete', 'Autor', 'Programa', 'Data', 'Duração', 'Tipo Uso'].map(h => (
                      <th key={h} className="text-left font-semibold text-white/30 px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {MOCK_PREVIEW_ROWS.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 font-medium text-white/70">{row.titulo}</td>
                      <td className="px-4 py-2.5 text-white/50">{row.interprete}</td>
                      <td className="px-4 py-2.5 text-white/50">{row.autor}</td>
                      <td className="px-4 py-2.5 text-white/50">{row.programa}</td>
                      <td className="px-4 py-2.5 text-white/40 tabular-nums">{row.data}</td>
                      <td className="px-4 py-2.5 text-white/40 tabular-nums font-mono">{row.duracao}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {row.tipo_uso}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column mapping */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Mapeamento de Colunas</h2>
              <span className="ml-auto text-xs text-emerald-400">Auto-detectado</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {DETECTED_COLUMNS.map(col => (
                <div key={col.source} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className="font-mono text-xs text-white/50 w-40 shrink-0">{col.source}</span>
                  <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
                  <span className="font-mono text-xs text-violet-300">{col.mapped}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: Matching Results ── */}
      {currentStep === 4 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Processamento de Matching</h2>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">{matching ? 'Executando matching…' : matchDone ? 'Matching concluído' : 'Aguardando…'}</span>
              <span className="text-xs font-bold text-violet-300 tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Matching spinner */}
          {matching && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin shrink-0" />
              <p className="text-sm text-violet-300">Comparando execuções com o catálogo de obras…</p>
            </div>
          )}

          {/* Results */}
          {matchDone && !completed && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-400 tabular-nums">10</p>
                  <p className="text-xs text-white/40 mt-1">Auto Match</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-400 tabular-nums">3</p>
                  <p className="text-xs text-white/40 mt-1">Para Revisão</p>
                </div>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <X className="w-5 h-5 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-400 tabular-nums">2</p>
                  <p className="text-xs text-white/40 mt-1">Divergências</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <p className="text-xs font-semibold text-white/50">Resumo do processamento</p>
                <ul className="space-y-1.5 text-xs text-white/50">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 10 execuções identificadas automaticamente (score ≥ 90%)</li>
                  <li className="flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-amber-400" /> 3 sugeridos para revisão manual (score 65–89%)</li>
                  <li className="flex items-center gap-2"><X className="w-3.5 h-3.5 text-red-400" /> 2 divergências abertas — obras não identificadas</li>
                </ul>
              </div>
            </div>
          )}

          {/* Success */}
          {completed && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="p-4 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="text-lg font-semibold text-white">Importação Concluída!</p>
              <p className="text-sm text-white/40 text-center">
                A importação foi processada com sucesso. Você pode revisar as execuções e resolver as divergências.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Link
                  href="/master/tv/execucoes"
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
                >
                  Ver Execuções <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/master/tv/importacoes"
                  className="h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/60 font-medium transition-colors flex items-center"
                >
                  Voltar às Importações
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ── */}
      {!completed && (
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/60 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>

          {currentStep < 4 ? (
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {currentStep === 3 ? 'Iniciar Matching' : 'Próximo'} <ChevronRight className="w-4 h-4" />
            </button>
          ) : matchDone && (
            <button
              onClick={() => setCompleted(true)}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white font-semibold transition-colors"
            >
              <Check className="w-4 h-4" /> Concluir Importação
            </button>
          )}
        </div>
      )}
    </div>
  )
}
