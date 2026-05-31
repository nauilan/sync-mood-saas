'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  Upload, FileSpreadsheet, CheckCircle2, Settings, Play,
  ChevronRight, X, AlertCircle,
} from 'lucide-react'

type Step = 1 | 2 | 3 | 4

interface ParsedPreview {
  filename: string
  totalRows: number
  rows: Array<{
    ranking: number
    oni_code: string
    title: string
    performer: string
    royalty_spotify: string
  }>
}

const STEP_LABELS: Record<Step, string> = {
  1: 'Upload',
  2: 'Preview',
  3: 'Configuracoes',
  4: 'Processando',
}

export default function ImportListaONIPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [nomeAmigavel, setNomeAmigavel] = useState('')
  const [dataLista, setDataLista] = useState('')
  const [preview, setPreview] = useState<ParsedPreview | null>(null)
  const [threshold, setThreshold] = useState(0.65)
  const [pesoTitulo, setPesoTitulo] = useState(40)
  const [pesoAutor, setPesoAutor] = useState(30)
  const [pesoInterprete, setPesoInterprete] = useState(20)
  const [pesoIsrc, setPesoIsrc] = useState(10)
  const [progress, setProgress] = useState(0)
  const [processing, setProcessing] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  function handleFile(f: File) {
    setFile(f)
    // Mock parse: simulate reading XLSX
    const mockPreview: ParsedPreview = {
      filename: f.name,
      totalRows: 76131,
      rows: [
        { ranking: 1, oni_code: '00000000000061188167', title: 'ATE QUE DUROU / TU MANDAS NO MEU CORACAO / ADOREI / SUPERA', performer: 'GRUPO MENOS E MAIS', royalty_spotify: '> USD 15,000 & <= USD 20,000' },
        { ranking: 2, oni_code: '00000000000061188200', title: 'SAUDADE DO INTERIOR', performer: 'NAUILAN', royalty_spotify: '> USD 5,000 & <= USD 10,000' },
        { ranking: 3, oni_code: '00000000000061188301', title: 'TEMPO DE AMAR', performer: 'GIOVANI', royalty_spotify: '> USD 10,000 & <= USD 15,000' },
        { ranking: 4, oni_code: '00000000000061188450', title: 'CHUVA FINA', performer: 'MARCELO COSTA', royalty_spotify: '> USD 1,000 & <= USD 5,000' },
        { ranking: 5, oni_code: '00000000000061188555', title: 'PASSARINHO VERSION LATINA', performer: 'DANIEL S', royalty_spotify: '<= USD 1,000' },
      ],
    }
    setPreview(mockPreview)
    if (!nomeAmigavel) setNomeAmigavel(f.name.replace('.xlsx', '').replace('.XLSX', ''))
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function startProcessing() {
    setStep(4)
    setProcessing(true)
    setProgress(0)
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setProgress(100)
        setProcessing(false)
        setTimeout(() => {
          router.push('/master/backoffice/match-lista-oni/oni-list-002/revisar')
        }, 800)
      } else {
        setProgress(p)
      }
    }, 350)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Importar Nova Lista ONI"
        description="Importe a lista XLSX semanal do BackOffice e inicie o cruzamento com o catalogo."
      />

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {([1, 2, 3, 4] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                step === s
                  ? 'bg-violet-600 text-white'
                  : step > s
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/[0.04] text-white/30 border border-white/[0.06]'
              }`}
            >
              {step > s ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">{s}</span>
              )}
              {STEP_LABELS[s]}
            </div>
            {i < 3 && <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
              dragging
                ? 'border-violet-400 bg-violet-500/10'
                : file
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-white/[0.12] bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileInput}
            />
            {file ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-white/80">{file.name}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(1)} MB — clique para substituir
                  </p>
                </div>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-10 h-10 text-white/25" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-white/60">
                    Arraste o arquivo XLSX ou clique para selecionar
                  </p>
                  <p className="text-[11px] text-white/25 mt-1">
                    Lista ONI do BackOffice — formato XLSX com 12 colunas
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-white/40 block mb-1.5">
                Nome Amigavel (opcional)
              </label>
              <input
                type="text"
                value={nomeAmigavel}
                onChange={e => setNomeAmigavel(e.target.value)}
                placeholder="ex: Lista ONI 16/05/2026"
                className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-white/40 block mb-1.5">
                Data da Lista
              </label>
              <input
                type="date"
                value={dataLista}
                onChange={e => setDataLista(e.target.value)}
                className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 text-sm text-white/80 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              disabled={!file}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && preview && (
        <div className="space-y-4">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-white/80">{preview.filename}</p>
                <p className="text-[11px] text-white/35">
                  {preview.totalRows.toLocaleString('pt-BR')} ONIs encontradas
                </p>
              </div>
            </div>

            <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-2">
              Primeiras 5 linhas (preview)
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Ranking', 'ONI_CODE', 'Title', 'Performer', 'RoyaltyRange_Spotify'].map(h => (
                      <th key={h} className="text-left text-white/25 font-semibold pb-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map(row => (
                    <tr key={row.oni_code} className="border-b border-white/[0.03]">
                      <td className="py-2 pr-4 text-white/40">{row.ranking}</td>
                      <td className="py-2 pr-4 font-mono text-white/50">{row.oni_code}</td>
                      <td className="py-2 pr-4 text-white/70 max-w-[200px] truncate">{row.title}</td>
                      <td className="py-2 pr-4 text-white/50">{row.performer}</td>
                      <td className="py-2 text-emerald-400">{row.royalty_spotify}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-[11px] text-white/30 italic">
              ... e mais {(preview.totalRows - 5).toLocaleString('pt-BR')} linhas
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors">
              Voltar
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            >
              Configurar Matching <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Configuracoes */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-5">
            <div>
              <label className="text-[11px] font-medium text-white/40 block mb-1.5">
                Threshold minimo de score ({(threshold * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min={0.40}
                max={0.95}
                step={0.05}
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-white/20 mt-1">
                <span>40% (mais permissivo)</span>
                <span>95% (mais restrito)</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-white/40 mb-3">Pesos por criterio (devem somar 100)</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Titulo', value: pesoTitulo, set: setPesoTitulo },
                  { label: 'Autores', value: pesoAutor, set: setPesoAutor },
                  { label: 'Interpretes', value: pesoInterprete, set: setPesoInterprete },
                  { label: 'ISRC (quando presente)', value: pesoIsrc, set: setPesoIsrc },
                ].map(item => (
                  <div key={item.label}>
                    <label className="text-[10px] text-white/30 block mb-1">{item.label}: {item.value}%</label>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={5}
                      value={item.value}
                      onChange={e => item.set(Number(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/25 mt-2">
                Soma atual: {pesoTitulo + pesoAutor + pesoInterprete + pesoIsrc}%
                {pesoTitulo + pesoAutor + pesoInterprete + pesoIsrc !== 100 && (
                  <span className="text-amber-400 ml-1">(ajuste para 100%)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors">
              Voltar
            </button>
            <button
              onClick={startProcessing}
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            >
              <Play className="w-4 h-4" />
              Iniciar Cruzamento
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Processing */}
      {step === 4 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-8 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            {progress < 100 ? (
              <span className="text-violet-400 font-bold text-lg">{Math.round(progress)}%</span>
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            )}
          </div>

          <div className="w-full max-w-md space-y-2">
            <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-white/50">
              {progress < 100
                ? `Cruzando ONIs com o catalogo... ${Math.round(progress)}%`
                : 'Cruzamento concluido! Redirecionando...'}
            </p>
          </div>

          <div className="text-[11px] text-white/25 space-y-1 text-center">
            <p>Normalizando titulos e nomes</p>
            <p>Calculando scores de similaridade (Levenshtein)</p>
            <p>Classificando por nivel de confianca</p>
          </div>
        </div>
      )}
    </div>
  )
}
