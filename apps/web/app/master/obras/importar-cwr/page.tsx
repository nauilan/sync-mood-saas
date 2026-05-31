'use client'

import { useRef, useState, useCallback } from 'react'
import {
  Upload, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Music, Users, Shield, X, Download, Info, Database, Mic2,
} from 'lucide-react'
import { parseCwr, labelPapel, detectarOffsetCwr } from '@/lib/cwr-parser'
import type { CwrParseResult, CwrObra, CwrTitular } from '@/lib/cwr-parser'
import { cwrToStore } from '@/lib/cwr-to-obra'
import { upsertStore, registrarImportacao, STORE_KEYS } from '@/lib/store'
import { saveObrasToSupabase } from '@/lib/save-obras-supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

function pctFmt(n: number) { return `${n.toFixed(1)}%` }

function badgePapel(t: CwrTitular) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border '
  if (!t.controlado)
    return base + 'border-white/10 bg-white/5 text-white/30'
  if (t.tipo === 'SPU')
    return base + 'border-violet-500/40 bg-violet-500/15 text-violet-300'
  return base + 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
}

// ── Componentes ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  const colors: Record<string, string> = {
    violet: 'border-violet-500/20 bg-violet-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    sky: 'border-sky-500/20 bg-sky-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    orange: 'border-orange-500/20 bg-orange-500/5',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colors[accent] ?? colors.violet}`}>
      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-white tabular-nums">{value}</p>
    </div>
  )
}

function TitularRow({ t }: { t: CwrTitular }) {
  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.02]">
      <td className="py-2 pl-4 pr-2">
        <span className={badgePapel(t)}>{labelPapel(t.papel_cwr)} {t.controlado ? '✓' : '—'}</span>
      </td>
      <td className="py-2 px-2">
        <p className="text-xs text-white/80">{t.nome}</p>
        {t.submitter_code && t.tipo !== 'SPU' && (
          <p className="text-[10px] font-mono text-amber-400/60" title="Código legado do titular (ex: HR01)">
            {t.submitter_code || t.sequence_code}
          </p>
        )}
      </td>
      <td className="py-2 px-2 text-[11px] text-white/40 font-mono">{t.ipi || '—'}</td>
      <td className="py-2 px-2 text-[11px] font-mono">
        <span className="text-sky-400/60" title="Sequence code CWR">{t.sequence_code || '—'}</span>
        {t.publisher_seq && (
          <span className="ml-1 text-amber-400/50" title="Vinculado via PWR">
            ↗{t.publisher_seq.slice(0, 6)}
          </span>
        )}
      </td>
      <td className="py-2 px-2 text-xs text-center tabular-nums">
        <span className={t.controlado ? 'text-white/70' : 'text-white/25'}>{pctFmt(t.mr_pct || t.pr_pct)}</span>
      </td>
      <td className="py-2 pr-4 text-xs text-center">
        {t.tipo === 'OWR' || t.tipo === 'OPU'
          ? <span className="text-white/20 text-[10px] italic">referência</span>
          : t.controlado
            ? <span className="text-emerald-400 text-[10px] font-semibold">CONTROLADO</span>
            : <span className="text-orange-400/60 text-[10px]">externo</span>}
      </td>
    </tr>
  )
}

function ObraRow({ obra }: { obra: CwrObra }) {
  const [open, setOpen] = useState(false)
  const controlados = obra.titulares.filter(t => t.controlado)
  const naoControlados = obra.titulares.filter(t => !t.controlado)

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden mb-3">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{obra.titulo}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {/* Código legado — referência principal CWR */}
            <span className="text-[10px] font-mono bg-violet-500/10 text-violet-300 rounded px-1.5 py-0.5"
              title="Código interno legado (preservado do CWR)">
              {obra.codigo_interno_legado || obra.codigo}
            </span>
            {obra.iswc && <span className="text-[10px] font-mono text-sky-400/70">{obra.iswc}</span>}
            {obra.titulo_alternativo && (
              <span className="text-[10px] text-white/30">alt: {obra.titulo_alternativo}</span>
            )}
            {obra.pwr_links.length > 0 && (
              <span className="text-[10px] text-amber-400/50" title="Registros PWR desta obra">
                {obra.pwr_links.length} PWR
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-white/40">titulares</p>
            <p className="text-sm font-bold text-white">{obra.titulares.length}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40">% controlado</p>
            <p className={`text-sm font-bold ${obra.tem_editora ? 'text-emerald-400' : 'text-white/30'}`}>
              {pctFmt(obra.pct_controlado)}
            </p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      {/* Detalhe */}
      {open && (
        <div className="border-t border-white/10">
          {controlados.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 px-5 py-2 bg-emerald-500/5">
                Controlados ({controlados.length})
              </p>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-white/25">
                    <th className="pl-4 pr-2 py-1.5 text-left">Papel</th>
                    <th className="px-2 py-1.5 text-left">Nome</th>
                    <th className="px-2 py-1.5 text-left">IPI</th>
                    <th className="px-2 py-1.5 text-left">Seq / PWR</th>
                    <th className="px-2 py-1.5 text-center">%</th>
                    <th className="pr-4 py-1.5 text-center">Controle</th>
                  </tr>
                </thead>
                <tbody>
                  {controlados.map((t, i) => <TitularRow key={i} t={t} />)}
                </tbody>
              </table>
            </div>
          )}
          {naoControlados.length > 0 && (
            <div className="border-t border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-white/20 px-5 py-2">
                Externos / Referência ({naoControlados.length})
              </p>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-white/25">
                    <th className="pl-4 pr-2 py-1.5 text-left">Papel</th>
                    <th className="px-2 py-1.5 text-left">Nome</th>
                    <th className="px-2 py-1.5 text-left">IPI</th>
                    <th className="px-2 py-1.5 text-left">Seq / PWR</th>
                    <th className="px-2 py-1.5 text-center">%</th>
                    <th className="pr-4 py-1.5 text-center">Controle</th>
                  </tr>
                </thead>
                <tbody>
                  {naoControlados.map((t, i) => <TitularRow key={i} t={t} />)}
                </tbody>
              </table>
            </div>
          )}
          {/* Vínculos PWR — cadeia editorial */}
          {obra.pwr_links.length > 0 && (
            <div className="border-t border-white/5 bg-amber-500/[0.02]">
              <p className="text-[10px] uppercase tracking-widest text-amber-400/40 px-5 py-2">
                Vínculos PWR ({obra.pwr_links.length}) — cadeia editorial
              </p>
              <div className="px-5 pb-3 flex flex-wrap gap-2">
                {obra.pwr_links.map((pwr, i) => {
                  const pub = obra.titulares.find(t =>
                    t.tipo === 'SPU' && (t.sequence_code === pwr.pub_seq || t.ipi === pwr.pub_ipi)
                  )
                  const aut = obra.titulares.find(t =>
                    (t.tipo === 'SWR' || t.tipo === 'OWR') && (
                      t.sequence_code === pwr.writer_seq || t.ipi === pwr.writer_ipi
                    )
                  )
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] bg-white/5 rounded-lg px-2.5 py-1.5">
                      <span className="text-sky-300/70 font-medium">{aut?.nome ?? `Seq ${pwr.writer_seq}`}</span>
                      <span className="text-white/20">→</span>
                      <span className={`font-medium ${pub?.controlado ? 'text-emerald-400/70' : 'text-orange-400/50'}`}>
                        {pub?.nome ?? `Pub ${pwr.pub_code.slice(0, 8)}`}
                      </span>
                      {pub?.controlado
                        ? <span className="text-emerald-400/50 text-[9px]">✓</span>
                        : <span className="text-white/20 text-[9px]">ext</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ImportarCwrPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<CwrParseResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState('')          // para re-parsear com outro offset
  const [offsetOverride, setOffsetOverride] = useState<number | null>(null)  // null = auto
  const [offsetScores, setOffsetScores] = useState<Record<number, number> | null>(null)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'controlados' | 'nao_controlados'>('todos')
  const [importResult, setImportResult] = useState<{
    obras: number; titulares: number; gravacoes: number
    obras_ctrl: number; tit_ctrl: number; tit_nctrl: number
    supabase_ok: boolean; supabase_obras: number; supabase_errs: string[]
    // estatísticas de rastreabilidade
    com_codigo_legado: number; com_iswc: number; total_pwr: number
  } | null>(null)
  const [importing, setImporting] = useState(false)

  const processarImport = useCallback(async () => {
    if (!result || importing) return
    setImporting(true)
    const converted = cwrToStore(result.obras)
    const r1 = upsertStore(STORE_KEYS.obras, converted.obras, 'codigo' as never)
    const r2 = upsertStore(STORE_KEYS.titulares, converted.titulares, 'id' as never)
    const r3 = upsertStore(STORE_KEYS.gravacoes, converted.gravacoes, 'id' as never)
    registrarImportacao({
      arquivo: fileName,
      tipo: 'CWR',
      obras_importadas: converted.stats.obras_total,
      titulares_importados: converted.stats.titulares_novos + converted.stats.titulares_nao_controlados,
      status: result.erros.length === 0 ? 'sucesso' : 'parcial',
      detalhes: `${result.stats.linhas} linhas · ${result.erros.length} avisos`,
    })
    // Salvar no Supabase em paralelo (falha silenciosa)
    let sbRes = { obras_saved: 0, titulares_saved: 0, links_saved: 0, errors: [] as string[] }
    try {
      sbRes = await saveObrasToSupabase(converted.obras, converted.titulares)
    } catch { /* silencioso */ }

    // Estatísticas de rastreabilidade
    const com_codigo_legado = converted.obras.filter(o =>
      o.codigo_interno_legado && o.codigo_interno_legado !== o.codigo
    ).length
    const com_iswc = converted.obras.filter(o => o.iswc).length
    const total_pwr = result.obras.reduce((sum, o) => sum + o.pwr_links.length, 0)

    setImportResult({
      obras: r1.inserted + r1.updated,
      titulares: r2.inserted + r2.updated,
      gravacoes: r3.inserted + r3.updated,
      obras_ctrl: converted.stats.obras_controladas,
      tit_ctrl: converted.stats.titulares_novos,
      tit_nctrl: converted.stats.titulares_nao_controlados,
      supabase_ok: sbRes.obras_saved > 0 && sbRes.errors.length === 0,
      supabase_obras: sbRes.obras_saved,
      supabase_errs: sbRes.errors,
      com_codigo_legado,
      com_iswc,
      total_pwr,
    })
    setImporting(false)
  }, [result, fileName, importing])

  const processar = useCallback((file: File, offOverride?: number) => {
    setFileName(file.name)
    setParsing(true)
    setResult(null)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? ''
      setFileContent(text)
      try {
        // Calcular scores para exibir diagnóstico
        const { offset: autoOff, scores } = detectarOffsetCwr(text)
        setOffsetScores(scores)
        const useOff = offOverride !== undefined ? offOverride : autoOff
        const parsed = parseCwr(text, useOff)
        setResult(parsed)
      } catch (err) {
        setResult({
          sender: '',
          creation_date: '',
          total_obras: 0,
          obras: [],
          erros: [`Erro ao processar: ${err}`],
          offset_detectado: 0,
          stats: { nwr: 0, spu: 0, swr: 0, owr: 0, pwr: 0, linhas: 0 },
        })
      } finally {
        setParsing(false)
      }
    }
    reader.readAsText(file, 'latin1')
  }, [])

  // Re-parsear com offset diferente (sem re-ler o arquivo)
  const reparse = useCallback((off: number) => {
    if (!fileContent) return
    setImportResult(null)
    try {
      const parsed = parseCwr(fileContent, off)
      setResult(parsed)
    } catch { /* silencioso */ }
  }, [fileContent])

  const onFile = (file: File | null | undefined) => {
    if (!file) return
    setOffsetOverride(null)
    processar(file)
  }

  // Limpar dados CWR ruins do localStorage
  const clearCwrData = () => {
    try {
      // Nuclear: remove TODAS as obras do localStorage (para reimportar limpo)
      localStorage.removeItem(STORE_KEYS.obras)
      localStorage.removeItem(STORE_KEYS.titulares)
      window.dispatchEvent(new Event('storage'))
    } catch { /* silencioso */ }
    alert('Todos os dados de obras/titulares removidos do armazenamento local.\nAgora re-importe o arquivo CWR.')
  }

  const obras_filtradas = (result?.obras ?? []).filter(o => {
    const q = search.toLowerCase()
    const match = !q || o.titulo.toLowerCase().includes(q) || o.codigo.toLowerCase().includes(q)
    if (!match) return false
    if (filtro === 'controlados') return o.tem_editora
    if (filtro === 'nao_controlados') return !o.tem_editora
    return true
  })

  const totalControladas = result?.obras.filter(o => o.pct_controlado > 0).length ?? 0

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Importar CWR</h1>
          <p className="text-sm text-white/50 mt-1">
            Carregue um arquivo CWR 2.1 (.cwr / .txt) para visualizar e importar obras para o catálogo
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Limpar dados ruins — NUCLEAR: remove todo localStorage de obras */}
          <button
            onClick={clearCwrData}
            title="Remove TODAS as obras do armazenamento local para reimportar com dados corretos"
            className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400/70 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Zerar obras locais
          </button>
          {result && !importResult && (
            <button
              onClick={processarImport}
              disabled={importing}
              className="flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-5 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing
                ? <><div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> Importando…</>
                : <><Database className="w-4 h-4" /> Importar {result.total_obras} obras para o sistema</>
              }
            </button>
          )}
          {importResult && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">Importação concluída</span>
            </div>
          )}
        </div>
      </div>

      {/* Drop zone */}
      {!result && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center py-16 gap-4 ${
            dragging
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            <Upload className="w-6 h-6 text-white/40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white/60">Arraste o arquivo CWR ou clique para selecionar</p>
            <p className="text-xs text-white/30 mt-1">Formatos: .cwr · .txt · CWR 2.1 / 2.2</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".cwr,.txt,.V21,.v21"
            className="hidden"
            onChange={e => onFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* Parsing */}
      {parsing && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 flex items-center justify-center gap-4">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-white/60">Processando {fileName}…</span>
        </div>
      )}

      {/* Erros */}
      {result && result.erros.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 space-y-1">
          <p className="text-xs font-semibold text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {result.erros.length} avisos de parse
          </p>
          {result.erros.slice(0, 5).map((e, i) => (
            <p key={i} className="text-[11px] text-red-300/70 font-mono ml-6">{e}</p>
          ))}
        </div>
      )}

      {/* Resultado */}
      {result && (
        <>
          {/* Info do arquivo */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3.5">
            <FileText className="w-4 h-4 text-white/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/80 truncate">{fileName}</p>
              <p className="text-[11px] text-white/40">
                Remetente: {result.sender || '—'} · Data: {result.creation_date || '—'} ·{' '}
                {result.stats.linhas.toLocaleString('pt-BR')} linhas processadas
              </p>
            </div>
            <button onClick={() => { setResult(null); setFileName(''); setFileContent(''); setOffsetScores(null); setOffsetOverride(null) }} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/30" />
            </button>
          </div>

          {/* Diagnóstico de Offset + Override manual */}
          {result && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-white/30">Formato CWR detectado</span>
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                  result.offset_detectado === 0 ? 'bg-emerald-500/20 text-emerald-300' :
                  result.offset_detectado === 4 ? 'bg-amber-500/20 text-amber-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  off={result.offset_detectado} {result.offset_detectado === 0 ? '(Standard 2.1)' : result.offset_detectado === 4 ? '(Extended BR +4)' : '(Extended UBEM +8)'}
                </span>
                {offsetScores && (
                  <span className="text-[10px] text-white/30 font-mono">
                    scores: 0={offsetScores[0]} 4={offsetScores[4]} 8={offsetScores[8]}
                  </span>
                )}
              </div>
              {/* Override manual — botões 0-8 + campo livre para qualquer valor */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-white/30">Forçar offset:</span>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(off => (
                  <button
                    key={off}
                    onClick={() => { setOffsetOverride(off); reparse(off) }}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                      (offsetOverride === off || (offsetOverride === null && result.offset_detectado === off))
                        ? 'border-violet-500/60 bg-violet-500/20 text-violet-300'
                        : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                    }`}
                  >
                    {off}
                  </button>
                ))}
                <input
                  type="number"
                  min={0} max={20}
                  placeholder="outro…"
                  className="w-16 text-[11px] font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/60 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40"
                  onChange={e => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v) && v >= 0 && v <= 20) { setOffsetOverride(v); reparse(v) }
                  }}
                />
                {offsetOverride !== null && (
                  <button
                    onClick={() => { setOffsetOverride(null); reparse(result.offset_detectado) }}
                    className="text-[10px] text-white/30 hover:text-white/60 underline"
                  >
                    voltar para auto
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Painel diagnóstico — linha NWR bruta + análise de posições */}
          {result.debug_nwr_line && (
            <details className="rounded-xl border border-amber-500/20 bg-amber-500/5">
              <summary className="px-4 py-2.5 cursor-pointer text-xs text-amber-400/70 font-semibold select-none">
                Diagnóstico: linha NWR bruta (clique para ver)
              </summary>
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Linha bruta (primeiros 130 chars)</p>
                  <div className="font-mono text-[10px] text-white/60 bg-black/40 rounded-lg p-3 overflow-x-auto whitespace-nowrap">
                    <div className="text-white/25 mb-0.5">
                      {'0         1         2         3         4         5         6         7         8         9         10        11        12   '.slice(0, 130)}
                    </div>
                    <div className="text-white/25 mb-1">
                      {'0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789'.slice(0, 130)}
                    </div>
                    <div className="text-amber-300/80">
                      {result.debug_nwr_line.slice(0, 130)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(off => {
                    const line = result.debug_nwr_line!
                    const titulo  = line.slice(19 + off, 79 + off).trim()
                    const lang    = line.slice(79 + off, 81 + off).trim()
                    const codigo  = line.slice(81 + off, 95 + off).trim()
                    const iswc    = line.slice(95 + off, 106 + off).trim()
                    const isActive = (offsetOverride ?? result.offset_detectado) === off
                    const langOk = /^[A-Z]{2}$/.test(lang)
                    return (
                      <button key={off}
                        onClick={() => { setOffsetOverride(off); reparse(off) }}
                        className={`text-left rounded-lg p-2 space-y-1 transition-all ${isActive ? 'border-2 border-emerald-500/60 bg-emerald-500/10' : 'border border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                      >
                        <p className={`text-[10px] font-bold ${isActive ? 'text-emerald-300' : langOk ? 'text-white/50' : 'text-white/25'}`}>
                          off={off}{isActive && ' ✓'}
                        </p>
                        <div className="space-y-0.5 font-mono text-[9px]">
                          <p className="truncate"><span className="text-white/30">tit: </span><span className={`${titulo ? 'text-white/70' : 'text-white/20'}`}>"{titulo.slice(0, 18) || '(vazio)'}"</span></p>
                          <p><span className="text-white/30">lang: </span><span className={langOk ? 'text-emerald-400' : 'text-red-400'}>{lang || '??'}</span></p>
                          <p className="truncate"><span className="text-white/30">cod: </span><span className="text-white/60">{codigo.slice(0,10) || '—'}</span></p>
                          <p><span className="text-white/30">iswc: </span><span className={/^[Tt]\d/.test(iswc) ? 'text-emerald-400' : iswc ? 'text-amber-400' : 'text-white/20'}>{iswc.slice(0,8) || '—'}</span></p>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-white/25 italic">
                  Se o offset detectado mostrar título truncado, use "Forçar offset" acima para testar os outros valores.
                  O offset correto é aquele onde lang=2 letras maiúsculas (ex: PT) e título começa com letras do nome da música.
                </p>
              </div>
            </details>
          )}

          {/* Painel de resultado da importação */}
          {importResult && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
              <p className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Sistema atualizado com sucesso
              </p>
              {/* Cards principais */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <Music className="w-4 h-4 mx-auto mb-1 text-violet-400" />
                  <p className="text-lg font-extrabold text-white">{importResult.obras}</p>
                  <p className="text-[10px] text-white/40">Obras salvas</p>
                  <p className="text-[10px] text-emerald-400">{importResult.obras_ctrl} controladas</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <Users className="w-4 h-4 mx-auto mb-1 text-sky-400" />
                  <p className="text-lg font-extrabold text-white">{importResult.titulares}</p>
                  <p className="text-[10px] text-white/40">Titulares salvos</p>
                  <p className="text-[10px] text-sky-400">{importResult.tit_ctrl} ctrl · {importResult.tit_nctrl} ref</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <Mic2 className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <p className="text-lg font-extrabold text-white">{importResult.gravacoes}</p>
                  <p className="text-[10px] text-white/40">Gravações</p>
                  <p className="text-[10px] text-amber-400">com duração no CWR</p>
                </div>
              </div>
              {/* Rastreabilidade */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-amber-400/70 font-semibold">
                  Rastreabilidade CWR
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-base font-extrabold text-amber-300">{importResult.com_codigo_legado}</p>
                    <p className="text-[10px] text-white/40">Cód. legado (AFW2)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-extrabold text-emerald-300">{importResult.com_iswc}</p>
                    <p className="text-[10px] text-white/40">Com ISWC</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-extrabold text-sky-300">{importResult.total_pwr}</p>
                    <p className="text-[10px] text-white/40">Vínculos PWR</p>
                  </div>
                </div>
              </div>
              {/* Status Supabase */}
              {importResult.supabase_ok ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{importResult.supabase_obras} obras gravadas no banco Supabase</span>
                </div>
              ) : importResult.supabase_errs.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[11px] text-amber-400/80 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    Dados salvos em localStorage · Supabase: {importResult.supabase_errs[0]}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-white/30">
                  Dados salvos em localStorage. Sincronização Supabase em andamento…
                </p>
              )}
              <p className="text-[11px] text-white/30">
                Disponível em: <span className="text-white/50">Obras · Titulares · Gravações · BackOffice</span>
              </p>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <KpiCard label="Total Obras" value={result.total_obras} accent="violet" />
            <KpiCard label="Controladas" value={totalControladas} accent="emerald" />
            <KpiCard label="Reg. SPU" value={result.stats.spu} accent="sky" />
            <KpiCard label="Reg. SWR" value={result.stats.swr} accent="amber" />
            <KpiCard label="Vínculos PWR" value={result.stats.pwr ?? 0} accent="orange" />
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título ou código…"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
            />
            <div className="flex gap-2">
              {(['todos', 'controlados', 'nao_controlados'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold border transition-colors ${
                    filtro === f
                      ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                      : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'controlados' ? 'Controlados' : 'Não controlados'}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-300/70">
              <strong className="text-sky-300">Clique em cada obra</strong> para ver os titulares.
              Registros <strong>SPU/SWR controlados</strong> têm editora no mesmo link e serão importados para o catálogo.
              Registros <strong>OWR/OPU</strong> são não controlados e aparecem apenas para referência.
            </p>
          </div>

          {/* Lista de obras */}
          <div>
            <p className="text-xs text-white/30 mb-3">
              Exibindo {obras_filtradas.length} de {result.total_obras} obras
            </p>
            {obras_filtradas.length === 0 && (
              <div className="text-center py-12 text-white/30 text-sm">Nenhuma obra encontrada</div>
            )}
            {obras_filtradas.map((obra, i) => (
              <ObraRow key={i} obra={obra} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
