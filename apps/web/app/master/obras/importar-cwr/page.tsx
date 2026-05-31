'use client'

import { useRef, useState, useCallback } from 'react'
import {
  Upload, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Music, Users, Shield, X, Download, Info, Database, Mic2,
} from 'lucide-react'
import { parseCwr, labelPapel } from '@/lib/cwr-parser'
import type { CwrParseResult, CwrObra, CwrTitular } from '@/lib/cwr-parser'
import { cwrToStore } from '@/lib/cwr-to-obra'
import { upsertStore, registrarImportacao, STORE_KEYS } from '@/lib/store'

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
      <td className="py-2 px-2 text-xs text-white/80">{t.nome}</td>
      <td className="py-2 px-2 text-[11px] text-white/40 font-mono">{t.ipi || '—'}</td>
      <td className="py-2 px-2 text-[11px] font-mono">
        {/* Sequence code + legado */}
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
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'controlados' | 'nao_controlados'>('todos')
  const [importResult, setImportResult] = useState<{
    obras: number; titulares: number; gravacoes: number
    obras_ctrl: number; tit_ctrl: number; tit_nctrl: number
  } | null>(null)

  const processarImport = useCallback(() => {
    if (!result) return
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
    setImportResult({
      obras: r1.inserted + r1.updated,
      titulares: r2.inserted + r2.updated,
      gravacoes: r3.inserted + r3.updated,
      obras_ctrl: converted.stats.obras_controladas,
      tit_ctrl: converted.stats.titulares_novos,
      tit_nctrl: converted.stats.titulares_nao_controlados,
    })
  }, [result, fileName])

  const processar = useCallback((file: File) => {
    setFileName(file.name)
    setParsing(true)
    setResult(null)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? ''
      try {
        const parsed = parseCwr(text)
        setResult(parsed)
      } catch (err) {
        setResult({
          sender: '',
          creation_date: '',
          total_obras: 0,
          obras: [],
          erros: [`Erro ao processar: ${err}`],
          stats: { nwr: 0, spu: 0, swr: 0, owr: 0, pwr: 0, linhas: 0 },
        })
      } finally {
        setParsing(false)
      }
    }
    reader.readAsText(file, 'latin1')
  }, [])

  const onFile = (file: File | null | undefined) => {
    if (!file) return
    processar(file)
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
        {result && !importResult && (
          <button
            onClick={processarImport}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-5 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
          >
            <Database className="w-4 h-4" />
            Importar {result.total_obras} obras para o sistema
          </button>
        )}
        {importResult && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">Importação concluída</span>
          </div>
        )}
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
            <button onClick={() => { setResult(null); setFileName('') }} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/30" />
            </button>
          </div>

          {/* Painel de resultado da importação */}
          {importResult && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
              <p className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Sistema atualizado com sucesso
              </p>
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
              <p className="text-[11px] text-white/30">
                Dados disponíveis em: <span className="text-white/50">Obras · Titulares · Gravações · BackOffice</span>
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
