'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Upload, FileText, Globe, DollarSign, RefreshCw, XCircle, CheckCircle2, AlertCircle,
} from 'lucide-react'

interface SourceCard {
  key: string
  title: string
  description: string
  formats: string[]
  colorBg: string
  colorBorder: string
  colorText: string
  colorIcon: string
  icon: React.ElementType
}

const SOURCE_CARDS: SourceCard[] = [
  {
    key: 'ecad_socinpro',
    title: 'ECAD / SOCINPRO',
    description: 'Demonstrativos ECAD — apenas para BI/auditoria. Não redistribuível.',
    formats: ['PDF', 'XLS', 'XLSX'],
    colorBg: 'bg-slate-500/10',
    colorBorder: 'border-slate-500/30',
    colorText: 'text-slate-300',
    colorIcon: 'text-slate-400',
    icon: FileText,
  },
  {
    key: 'backoffice_music_services',
    title: 'BackOffice Music Services',
    description: 'Planilhas DSP via UBEM. Distribuição interna após conciliação.',
    formats: ['XLS', 'XLSX', 'CSV'],
    colorBg: 'bg-sky-500/10',
    colorBorder: 'border-sky-500/30',
    colorText: 'text-sky-300',
    colorIcon: 'text-sky-400',
    icon: RefreshCw,
  },
  {
    key: 'sync',
    title: 'Sync',
    description: 'Recebimentos de sincronização, publicidade e audiovisual.',
    formats: ['XLS', 'XLSX', 'PDF', 'CSV'],
    colorBg: 'bg-amber-500/10',
    colorBorder: 'border-amber-500/30',
    colorText: 'text-amber-300',
    colorIcon: 'text-amber-400',
    icon: DollarSign,
  },
  {
    key: 'internacional',
    title: 'Internacional',
    description: 'Royalties de subeditoras e sociedades estrangeiras. Inclui câmbio.',
    formats: ['XLS', 'XLSX', 'CSV', 'TXT'],
    colorBg: 'bg-indigo-500/10',
    colorBorder: 'border-indigo-500/30',
    colorText: 'text-indigo-300',
    colorIcon: 'text-indigo-400',
    icon: Globe,
  },
  {
    key: 'acordo_direto',
    title: 'Acordos Diretos',
    description: 'Acordos fora do ECAD/BackOffice/internacional tradicional.',
    formats: ['XLS', 'XLSX', 'PDF', 'CSV', 'TXT'],
    colorBg: 'bg-teal-500/10',
    colorBorder: 'border-teal-500/30',
    colorText: 'text-teal-300',
    colorIcon: 'text-teal-400',
    icon: CheckCircle2,
  },
]

const MOCK_PREVIEW_ROWS = [
  { col1: 'ISRC-0001', col2: 'Obra Exemplo Alpha', col3: 'Spotify', col4: '12.400', col5: 'USD 48,50' },
  { col1: 'ISRC-0002', col2: 'Obra Exemplo Beta',  col3: 'Deezer',  col4: '8.732',  col5: 'USD 32,14' },
  { col1: 'ISRC-0003', col2: 'Obra Exemplo Gamma', col3: 'YouTube', col4: '33.100', col5: 'USD 91,20' },
  { col1: 'ISRC-0004', col2: 'Obra Exemplo Delta', col3: 'Apple',   col4: '5.020',  col5: 'USD 19,78' },
  { col1: 'ISRC-0005', col2: 'Obra Exemplo Epsilon',col3: 'Spotify','col4': '21.600', col5: 'USD 63,42' },
  { col1: 'ISRC-0006', col2: 'Obra Exemplo Zeta',  col3: 'Tidal',  col4: '2.340',  col5: 'USD 11,05' },
  { col1: 'ISRC-0007', col2: 'Obra Exemplo Eta',   col3: 'Deezer', col4: '14.500', col5: 'USD 44,90' },
  { col1: 'ISRC-0008', col2: 'Obra Exemplo Theta', col3: 'Spotify','col4': '9.820',  col5: 'USD 28,67' },
  { col1: 'ISRC-0009', col2: 'Obra Exemplo Iota',  col3: 'YouTube','col4': '41.200', col5: 'USD 107,33' },
  { col1: 'ISRC-0010', col2: 'Obra Exemplo Kappa', col3: 'Amazon', col4: '3.780',  col5: 'USD 14,22' },
]

type UploadStep = 'idle' | 'dragging' | 'uploading' | 'preview' | 'success'

export default function ImportarPage() {
  const [openSource, setOpenSource] = useState<string | null>(null)
  const [step, setStep] = useState<UploadStep>('idle')
  const [fileName, setFileName] = useState<string | null>(null)
  const [toast, setToast] = useState(false)

  const activeCard = SOURCE_CARDS.find(c => c.key === openSource)

  function openModal(key: string) {
    setOpenSource(key)
    setStep('idle')
    setFileName(null)
    setToast(false)
  }

  function closeModal() {
    setOpenSource(null)
    setStep('idle')
    setFileName(null)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setStep('dragging')
    const file = e.dataTransfer.files[0]
    if (file) {
      setFileName(file.name)
      setStep('uploading')
      setTimeout(() => setStep('preview'), 1200)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setStep('uploading')
      setTimeout(() => setStep('preview'), 1200)
    }
  }

  function confirmImport() {
    setToast(true)
    setTimeout(() => {
      setToast(false)
      closeModal()
    }, 2200)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar Recebimentos"
        description="Selecione a fonte e faça upload do demonstrativo para iniciar a importação e conciliação"
      />

      {/* Source Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SOURCE_CARDS.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.key}
              className={`bg-[#0d1526] border ${card.colorBorder} rounded-xl p-5 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg ${card.colorBg} border ${card.colorBorder}`}>
                  <Icon className={`w-5 h-5 ${card.colorIcon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold ${card.colorText}`}>{card.title}</h3>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">{card.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {card.formats.map(fmt => (
                  <span key={fmt} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${card.colorBg} ${card.colorText} border ${card.colorBorder}`}>
                    {fmt}
                  </span>
                ))}
              </div>
              <button
                onClick={() => openModal(card.key)}
                className={`mt-auto flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg text-xs font-semibold transition-colors ${card.colorBg} ${card.colorText} border ${card.colorBorder} hover:brightness-125`}
              >
                <Upload className="w-3.5 h-3.5" /> Fazer Upload
              </button>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {openSource && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${activeCard.colorBg} border ${activeCard.colorBorder}`}>
                  <activeCard.icon className={`w-4 h-4 ${activeCard.colorIcon}`} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Importar — {activeCard.title}</h2>
                  <p className="text-xs text-white/40">Formatos aceitos: {activeCard.formats.join(', ')}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-white/30 hover:text-white/70 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Drop Zone */}
              {(step === 'idle' || step === 'dragging') && (
                <div
                  onDragOver={e => { e.preventDefault(); setStep('dragging') }}
                  onDragLeave={() => setStep('idle')}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors py-14 cursor-pointer ${
                    step === 'dragging'
                      ? `${activeCard.colorBorder} ${activeCard.colorBg}`
                      : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <Upload className={`w-8 h-8 ${step === 'dragging' ? activeCard.colorIcon : 'text-white/20'}`} />
                  <p className="text-sm text-white/50">Arraste o arquivo aqui ou clique para selecionar</p>
                  <p className="text-xs text-white/25">Formatos aceitos: {activeCard.formats.join(', ')}</p>
                  <label className={`flex items-center gap-1.5 mt-2 h-8 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${activeCard.colorBg} ${activeCard.colorText} border ${activeCard.colorBorder} hover:brightness-125`}>
                    <Upload className="w-3.5 h-3.5" /> Selecionar Arquivo
                    <input type="file" className="hidden" accept=".xls,.xlsx,.csv,.pdf,.txt" onChange={handleFileInput} />
                  </label>
                </div>
              )}

              {/* Uploading */}
              {step === 'uploading' && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                  <p className="text-sm text-white/50">Processando <span className="text-white/70">{fileName}</span>…</p>
                </div>
              )}

              {/* Preview Table */}
              {step === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm text-white/70">
                      Arquivo <span className="text-white font-medium">{fileName ?? 'arquivo.xlsx'}</span> processado — pré-visualização das primeiras 10 linhas
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                    <table className="w-full text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          {['Identificador', 'Obra', 'Plataforma', 'Execuções', 'Valor'].map(h => (
                            <th key={h} className="text-left font-semibold text-white/30 px-4 py-2.5">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {MOCK_PREVIEW_ROWS.map((row, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-2.5 font-mono text-white/50">{row.col1}</td>
                            <td className="px-4 py-2.5 text-white/70">{row.col2}</td>
                            <td className="px-4 py-2.5 text-white/50">{row.col3}</td>
                            <td className="px-4 py-2.5 text-white/50 tabular-nums">{row.col4}</td>
                            <td className="px-4 py-2.5 text-emerald-400 tabular-nums">{row.col5}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Success Toast inline */}
              {toast && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-300">Importação confirmada com sucesso! Redirecionando…</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {step === 'preview' && !toast && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                <button
                  onClick={closeModal}
                  className="h-8 px-4 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors border border-white/[0.06] hover:border-white/20"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmImport}
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
