'use client'

import { useState, useMemo, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Download, FileText, CheckCircle2, ArrowLeft, Info } from 'lucide-react'
import { getMatchesByLista, getListaById } from '@/lib/mock-oni'
import { generateONICSV, previewONICSV, downloadONICSV } from '@/lib/oni-csv-export'
import type { CSVExportOptions } from '@/lib/oni-csv-export'

function ExportarContent() {
  const params = useParams()
  const listaId = params.id as string

  const lista = getListaById(listaId)
  const allMatches = useMemo(() => getMatchesByLista(listaId), [listaId])
  const aprovados = useMemo(() => allMatches.filter(m => m.status === 'aprovado'), [allMatches])

  const [separator, setSeparator] = useState<',' | ';'>(',')
  const [includeHeader, setIncludeHeader] = useState(true)
  const [exported, setExported] = useState(false)

  const options: CSVExportOptions = { separator, includeHeader }

  const csvPreview = useMemo(() => previewONICSV(aprovados, options, 20), [aprovados, options])

  const totalBytes = useMemo(() => {
    const csv = generateONICSV(aprovados, options)
    return new Blob([csv]).size
  }, [aprovados, options])

  function handleDownload() {
    const filename = lista
      ? `ONI_IDENTIFICACOES_${lista.data_lista.replace(/-/g, '')}.csv`
      : `ONI_IDENTIFICACOES_${listaId}.csv`
    downloadONICSV(aprovados, filename, options)
    setExported(true)
  }

  if (aprovados.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Exportar CSV de Identificacao"
          description="Nenhum match aprovado para exportar."
        />
        <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-white/50">
            Volte para a tela de revisao e aprove pelo menos um match antes de exportar.
          </p>
        </div>
        <Link
          href={`/master/backoffice/match-lista-oni/${listaId}/revisar`}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Revisao
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Exportar CSV de Identificacao ONI"
        description="Gere o arquivo CSV para envio ao BackOffice e liberacao dos royalties retidos."
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Matches Aprovados', value: aprovados.length, color: 'text-emerald-400' },
          { label: 'Total Linhas CSV', value: aprovados.length + (includeHeader ? 1 : 0), color: 'text-violet-400' },
          { label: 'Tamanho Estimado', value: `${(totalBytes / 1024).toFixed(1)} KB`, color: 'text-sky-400' },
        ].map(item => (
          <div key={item.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] text-white/30 mb-1">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Options */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 space-y-4">
        <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">Opcoes de Exportacao</p>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-[11px] text-white/40 mb-2">Separador</p>
            <div className="flex items-center gap-3">
              {([',', ';'] as const).map(sep => (
                <label key={sep} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="separator"
                    value={sep}
                    checked={separator === sep}
                    onChange={() => setSeparator(sep)}
                    className="accent-violet-500"
                  />
                  <span className="text-sm text-white/60 font-mono">&quot;{sep}&quot;</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-white/40 mb-2">Cabecalho</p>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={e => setIncludeHeader(e.target.checked)}
                className="accent-violet-500"
              />
              <span className="text-sm text-white/60">Incluir linha de cabecalho</span>
            </label>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/30" />
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
            Preview (primeiras {Math.min(csvPreview.length, 20)} linhas)
          </p>
        </div>
        <div className="p-4">
          <pre className="text-[11px] font-mono text-white/55 leading-relaxed overflow-x-auto">
            {csvPreview.join('\n')}
          </pre>
          {aprovados.length > 19 && (
            <p className="text-[10px] text-white/25 mt-2 italic">
              ... e mais {aprovados.length - 19} linhas
            </p>
          )}
        </div>
      </div>

      {/* Download button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Baixar CSV
        </button>
        <Link
          href={`/master/backoffice/match-lista-oni/${listaId}/revisar`}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </div>

      {/* Post-export instructions */}
      {exported && (
        <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-300">CSV exportado com sucesso!</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white/40 mb-2">Proximos passos:</p>
            <ol className="text-[11px] text-white/45 space-y-1 list-decimal list-inside">
              <li>Acesse o BackOffice Music Services.</li>
              <li>Navegue para <strong className="text-white/60">INBOX FILES</strong>.</li>
              <li>Clique em <strong className="text-white/60">Upload File</strong> e selecione o CSV gerado.</li>
              <li>Em &quot;Process File Type&quot;, selecione <strong className="text-white/60">ONI IDENTIFICATIONS (CSV)</strong>.</li>
              <li>Aguarde a confirmacao de processamento (ate 48h uteis).</li>
              <li>O dinheiro retido sera liberado apos validacao pelo BackOffice.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExportarPage() {
  return (
    <Suspense fallback={<div className="text-white/40 text-sm p-6">Carregando...</div>}>
      <ExportarContent />
    </Suspense>
  )
}
