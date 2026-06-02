'use client'

import { useRef, useState, useCallback } from 'react'
import {
  Upload, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Music, Users, Shield, X, Download, Info, Database, Mic2,
} from 'lucide-react'
import { parseCwr, labelPapel, detectarOffsetCwr } from '@/lib/cwr-parser'
import type { CwrParseResult, CwrObra, CwrTitular } from '@/lib/cwr-parser'
import { cwrToStore } from '@/lib/cwr-to-obra'
import { upsertStore, registrarImportacao, deleteImportacao, getStore, STORE_KEYS } from '@/lib/store'
import type { ImportacaoLog } from '@/lib/store'
import { saveObrasToSupabase, clearObrasFromSupabase } from '@/lib/save-obras-supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

function pctFmt(n: number) { return `${n.toFixed(1)}%` }

// Monta a estrutura de links a partir dos dados CWR brutos da obra
interface LinkPreview {
  numero: number
  autor: CwrTitular
  editoras: CwrTitular[]  // E + AM + SE na ordem certa
}

// Deduplica uma lista de CwrTitular por IPI → sequence_code → nome
function deduplicarEditoras(list: CwrTitular[]): CwrTitular[] {
  const seen = new Set<string>()
  return list.filter(t => {
    const key = t.ipi?.trim() || t.submitter_code?.trim() || t.sequence_code?.trim() || t.nome?.trim() || ''
    if (!key) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildLinksPreview(obra: CwrObra): LinkPreview[] {
  const swrs = obra.titulares.filter(t => t.tipo === 'SWR')
  const spus = obra.titulares.filter(t => t.tipo === 'SPU')

  // Deduplica editoras antes de qualquer agrupamento
  const spusUniq = deduplicarEditoras(spus)
  const ams = spusUniq.filter(t => t.papel_cwr.trim() === 'AM')

  const links: LinkPreview[] = []

  swrs.forEach((autor, idx) => {
    // Encontrar a editora E vinculada a este autor via PWR
    const pubCode = (autor.publisher_seq || autor.publisher_ipi || '').trim()
    let editE: CwrTitular | undefined

    if (pubCode) {
      editE = spusUniq.find(t =>
        t.papel_cwr.trim() !== 'AM' &&
        (t.submitter_code.trim() === pubCode || t.sequence_code.trim() === pubCode || t.ipi === pubCode)
      )
    }

    // Se não achou via PWR, pegar a primeira E disponível
    if (!editE) {
      editE = spusUniq.find(t => t.papel_cwr.trim() === 'E' || t.papel_cwr.trim() === 'AQ')
    }

    const editoras: CwrTitular[] = []
    if (editE) editoras.push(editE)
    // Adicionar AMs deduplicadas ao link
    editoras.push(...ams.filter(am => am !== editE))

    links.push({ numero: idx + 1, autor, editoras })
  })

  // Se não há SWR mas há SPU, criar um link genérico por editora
  if (swrs.length === 0 && spus.length > 0) {
    const editE = spusUniq.find(t => t.papel_cwr.trim() === 'E')
    if (editE) links.push({ numero: 1, autor: editE, editoras: ams })
  }

  return links
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

// Badge de papel CWR colorido
function BadgeRole({ role, tipo }: { role: string; tipo: 'autor' | 'editora' }) {
  const r = role.trim().toUpperCase()
  let cls = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border '
  if (tipo === 'editora') {
    if (r === 'E' || r === 'AQ') cls += 'border-violet-500/40 bg-violet-500/20 text-violet-200'
    else if (r === 'AM') cls += 'border-blue-500/40 bg-blue-500/20 text-blue-200'
    else if (r === 'SE') cls += 'border-indigo-500/40 bg-indigo-500/20 text-indigo-200'
    else cls += 'border-white/10 bg-white/5 text-white/50'
  } else {
    if (r === 'CA') cls += 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200'
    else if (r === 'C') cls += 'border-teal-500/40 bg-teal-500/20 text-teal-200'
    else if (r === 'A') cls += 'border-green-500/40 bg-green-500/20 text-green-200'
    else cls += 'border-white/10 bg-white/5 text-white/50'
  }
  return <span className={cls}>{r}</span>
}

// Linha de autor dentro de um link
function AutorCard({ t }: { t: CwrTitular }) {
  const code = t.submitter_code && t.submitter_code !== t.sequence_code ? t.submitter_code : t.sequence_code
  const ipiValid = t.ipi && /\d{4,}/.test(t.ipi) ? t.ipi : null
  return (
    <div className="flex flex-wrap items-start gap-3 px-4 py-3 bg-emerald-500/5 border-l-2 border-emerald-500/40">
      <BadgeRole role={t.papel_cwr} tipo="autor" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{t.nome || '—'}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {code && <span className="text-[10px] font-mono text-amber-400/80 font-bold">{code}</span>}
          {ipiValid && <span className="text-[10px] font-mono text-white/30">IPI: {ipiValid}</span>}
        </div>
      </div>
      <div className="flex gap-4 shrink-0 text-right">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-white/30">Exec. Pub.</p>
          <p className="text-xs font-bold text-white tabular-nums">{pctFmt(t.pr_pct)}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-white/30">Mecânico</p>
          <p className="text-xs font-bold text-white tabular-nums">{pctFmt(t.mr_pct)}</p>
        </div>
      </div>
    </div>
  )
}

// Linha de editora dentro de um link
function EditoraCard({ t, label }: { t: CwrTitular; label?: string }) {
  const code = t.submitter_code && t.submitter_code !== t.sequence_code ? t.submitter_code : t.sequence_code
  const role = t.papel_cwr.trim().toUpperCase()
  const ipiValid = t.ipi && /\d{4,}/.test(t.ipi) ? t.ipi : null
  const bgCls = role === 'E' || role === 'AQ'
    ? 'bg-violet-500/[0.03] border-l-2 border-violet-500/30'
    : 'bg-blue-500/[0.03] border-l-2 border-blue-500/30'
  return (
    <div className={`flex flex-wrap items-start gap-3 px-4 py-2.5 ${bgCls} ml-6`}>
      <BadgeRole role={role} tipo="editora" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80 leading-tight">{t.nome || '—'}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {code && <span className="text-[10px] font-mono text-amber-400/60 font-bold">{code}</span>}
          {ipiValid && <span className="text-[10px] font-mono text-white/25">IPI: {ipiValid}</span>}
          {label && <span className="text-[10px] text-white/30 italic">{label}</span>}
          <span className={`text-[10px] font-semibold ${t.controlado ? 'text-emerald-400/70' : 'text-orange-400/50'}`}>
            {t.controlado ? 'CONTROLADO' : 'externo'}
          </span>
        </div>
      </div>
      <div className="flex gap-4 shrink-0 text-right">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-white/30">Exec. Pub.</p>
          <p className="text-xs font-bold text-white/70 tabular-nums">{pctFmt(t.pr_pct)}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-white/30">Mecânico</p>
          <p className="text-xs font-bold text-white/70 tabular-nums">{pctFmt(t.mr_pct)}</p>
        </div>
      </div>
    </div>
  )
}

// ── Diagnóstico de leitura CWR — tabela compacta por obra ─────────────────────

function DiagnosticoTabela({ obras }: { obras: CwrObra[] }) {
  const [aberto, setAberto] = useState(false)
  if (obras.length === 0) return null

  const obrasComProblema = obras.filter(o => {
    const swrsSemPub = o.titulares.filter(t => t.tipo === 'SWR' && !t.publisher_seq && !t.publisher_ipi)
    return o.pwr_links.length > 0 && swrsSemPub.length > 0
  })

  return (
    <details
      open={aberto}
      onToggle={e => setAberto((e.target as HTMLDetailsElement).open)}
      className="rounded-xl border border-violet-500/20 bg-violet-500/5"
    >
      <summary className="px-4 py-3 cursor-pointer select-none flex items-center gap-2">
        <span className="text-xs font-bold text-violet-300">Diagnóstico de Leitura CWR</span>
        {obrasComProblema.length > 0 && (
          <span className="text-[10px] bg-red-500/20 text-red-300 rounded-full px-2 py-0.5 border border-red-500/30">
            {obrasComProblema.length} com problema PWR
          </span>
        )}
        <span className="text-[10px] text-white/30 ml-auto">{aberto ? 'fechar ▲' : 'ver diagnóstico ▼'}</span>
      </summary>
      <div className="px-4 pb-4 overflow-x-auto">
        <table className="w-full text-[11px] mt-2">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-white/25 border-b border-white/10">
              <th className="py-1.5 pr-2 text-left">Título</th>
              <th className="py-1.5 px-2 text-left">Código</th>
              <th className="py-1.5 px-2 text-left">ISWC</th>
              <th className="py-1.5 px-2 text-center">Editoras</th>
              <th className="py-1.5 px-2 text-center">Autores</th>
              <th className="py-1.5 px-2 text-center">PWR</th>
              <th className="py-1.5 px-2 text-center">Links</th>
              <th className="py-1.5 px-2 text-center">% Ctrl</th>
              <th className="py-1.5 pl-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {obras.map((o, i) => {
              const spus = o.titulares.filter(t => t.tipo === 'SPU')
              const swrs = o.titulares.filter(t => t.tipo === 'SWR')
              const owrs = o.titulares.filter(t => t.tipo === 'OWR')
              const swrsComLink = swrs.filter(t => t.publisher_seq || t.publisher_ipi)
              const swrsSemLink = swrs.filter(t => !t.publisher_seq && !t.publisher_ipi)
              const pwrNaoCasado = o.pwr_links.length > 0 && swrsSemLink.length > 0
              const erros: string[] = []
              if (pwrNaoCasado) erros.push(`PWR não casado: ${swrsSemLink.length} SWR sem editora`)
              if (o.pwr_links.length === 0 && swrs.length > 0 && spus.length > 0) erros.push('Sem registros PWR')
              if (!o.titulo) erros.push('Título vazio')

              return (
                <tr key={i} className={`border-t border-white/5 ${erros.length > 0 ? 'bg-red-500/5' : ''}`}>
                  <td className="py-1.5 pr-2">
                    <span className="text-white/80 font-medium">{o.titulo?.slice(0, 30) || '(sem título)'}</span>
                    {o.titulo_alternativo && (
                      <span className="block text-[9px] text-white/30 truncate">alt: {o.titulo_alternativo}</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-violet-300/70">{o.codigo_interno_legado || o.codigo || '—'}</td>
                  <td className="py-1.5 px-2 font-mono">
                    {o.iswc ? <span className="text-emerald-400/70">{o.iswc}</span> : <span className="text-white/20">—</span>}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {spus.length > 0
                      ? spus.map((s, si) => (
                          <span key={si} className={`block text-[9px] truncate max-w-[90px] ${s.controlado ? 'text-violet-300' : 'text-white/30'}`}
                            title={`${s.nome} [${s.papel_cwr.trim()}] seq:${s.sequence_code} sub:${s.submitter_code}`}>
                            {s.submitter_code?.slice(0,8) || s.nome.slice(0, 10)}
                          </span>
                        ))
                      : <span className="text-white/20">—</span>}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {swrs.map((s, si) => (
                      <span key={si} className={`block text-[9px] truncate max-w-[90px] ${swrsComLink.includes(s) ? 'text-emerald-400/70' : 'text-amber-400/50'}`}
                        title={`${s.nome} seq:${s.sequence_code} sub:${s.submitter_code}${s.publisher_seq ? ' → ' + s.publisher_seq : ' (sem PWR)'}`}>
                        {s.submitter_code?.slice(0,8) || ''} {s.nome.split(' ').pop()?.slice(0, 8)}
                        {swrsComLink.includes(s) ? ' ✓' : ''}
                      </span>
                    ))}
                    {owrs.length > 0 && <span className="text-[9px] text-white/20">{owrs.length} OWR</span>}
                    {swrs.length === 0 && owrs.length === 0 && <span className="text-white/20">—</span>}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {o.pwr_links.length > 0 ? (
                      <span className={`text-[10px] font-mono ${pwrNaoCasado ? 'text-red-400' : 'text-sky-400/70'}`}>
                        {o.pwr_links.length}{pwrNaoCasado ? ' !' : ' ✓'}
                      </span>
                    ) : <span className="text-white/20">0</span>}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`text-[10px] font-semibold ${swrsComLink.length > 0 ? 'text-emerald-400/70' : 'text-white/30'}`}>
                      {swrsComLink.length}/{swrs.length}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-center tabular-nums">
                    <span className={`text-[10px] ${o.pct_controlado > 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                      {o.pct_controlado.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-1.5 pl-2 text-center">
                    {erros.length > 0
                      ? <span className="text-[9px] text-red-400" title={erros.join(' · ')}>⚠ {erros[0].slice(0, 18)}</span>
                      : <span className="text-[9px] text-emerald-400/60">OK</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {obrasComProblema.length > 0 && (
          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-[10px] text-red-400 font-semibold mb-1">Obras com PWR não casado:</p>
            {obrasComProblema.map((o, i) => {
              const swrsSemLink = o.titulares.filter(t => t.tipo === 'SWR' && !t.publisher_seq && !t.publisher_ipi)
              return (
                <div key={i} className="text-[10px] text-red-300/70 font-mono">
                  {o.titulo?.slice(0, 40)} — SWR sem link: {swrsSemLink.map(s => s.submitter_code || s.sequence_code).join(', ')}
                  {' | '}PWRs: {o.pwr_links.map(p => `pub:${p.pub_seq||p.pub_code.slice(0,6)}↗wr:${p.writer_seq}`).join(', ')}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </details>
  )
}

// ── ObraRow ───────────────────────────────────────────────────────────────────

// ── CatBadge: sigla da categoria com cor ────────────────────────────────────
function CatBadge({ role }: { role: string }) {
  const r = role.trim().toUpperCase()
  const styles: Record<string, string> = {
    CA:  'bg-emerald-600/20 border-emerald-500/40 text-emerald-300',
    C:   'bg-teal-600/20 border-teal-500/40 text-teal-300',
    A:   'bg-green-600/20 border-green-500/40 text-green-300',
    E:   'bg-violet-600/20 border-violet-500/40 text-violet-300',
    AQ:  'bg-violet-600/20 border-violet-500/40 text-violet-300',
    AM:  'bg-amber-600/20 border-amber-500/40 text-amber-300',
    SE:  'bg-indigo-600/20 border-indigo-500/40 text-indigo-300',
    V:   'bg-rose-600/20 border-rose-500/40 text-rose-300',
    AD:  'bg-pink-600/20 border-pink-500/40 text-pink-300',
    AR:  'bg-sky-600/20 border-sky-500/40 text-sky-300',
  }
  return (
    <span className={`inline-flex items-center justify-center rounded border px-1.5 py-0 text-[10px] font-bold leading-5 ${styles[r] ?? 'bg-white/5 border-white/10 text-white/40'}`}>
      {r}
    </span>
  )
}

// ── helper: percentuais sintéticos ───────────────────────────────────────────
function calcSintetico(link: LinkPreview, t: CwrTitular) {
  const role = t.papel_cwr.trim().toUpperCase()
  const hasAM = link.editoras.some(ed => ed.papel_cwr.trim().toUpperCase() === 'AM')
  const totalMr = link.autor.mr_pct + link.editoras.reduce((s, e) => s + e.mr_pct, 0)
  const execPub = t.pr_pct
  let fono = 0
  if (hasAM && role === 'AM') { fono = totalMr }
  else if (!hasAM && (role === 'E' || role === 'AQ')) { fono = totalMr }
  return { execPub, fono, sinc: fono }
}

// ── download CSV ─────────────────────────────────────────────────────────────
function downloadCsv(obra: CwrObra, links: LinkPreview[]) {
  const rows: string[] = [
    ['Link', 'Nome / Razão Social', 'Pseudônimo / Fantasia', 'Cat.', 'CPF / CNPJ', 'IPI/CAE', '% Exec. Pública', '% Fono/Digital', '% Sinc.', 'Controlado', 'Contrato'].join(';')
  ]
  links.forEach(link => {
    const all = [link.autor, ...link.editoras]
    all.forEach(t => {
      const s = calcSintetico(link, t)
      rows.push([
        link.numero, t.nome, '—', t.papel_cwr.trim(), '—', t.ipi || '—',
        s.execPub.toFixed(2), s.fono.toFixed(2), s.sinc.toFixed(2),
        t.controlado ? 'Sim' : 'Não', '—'
      ].join(';'))
    })
  })
  const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `titulares-${obra.codigo || 'obra'}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function ObraRow({ obra }: { obra: CwrObra }) {
  const [open, setOpen] = useState(false)
  const [innerTab, setInnerTab] = useState<'titulares' | 'info' | 'fonogramas' | 'letra'>('titulares')
  const [modoView, setModoView] = useState<'sintetico' | 'analitico'>('sintetico')
  const links = buildLinksPreview(obra)
  const owrs  = obra.titulares.filter(t => t.tipo === 'OWR' || t.tipo === 'OPU')

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
            <span className="text-[10px] font-mono bg-violet-500/10 text-violet-300 rounded px-1.5 py-0.5"
              title="Código interno legado (preservado do CWR)">
              {obra.codigo_interno_legado || obra.codigo}
            </span>
            {obra.iswc && <span className="text-[10px] font-mono text-sky-400/70">{obra.iswc}</span>}
            {obra.titulo_alternativo && (
              <span className="text-[10px] text-white/30">alt: {obra.titulo_alternativo}</span>
            )}
            {links.length > 0 && (
              <span className="text-[10px] text-emerald-400/60">{links.length} link{links.length > 1 ? 's' : ''}</span>
            )}
            {obra.pwr_links.length > 0 && (
              <span className="text-[10px] text-amber-400/40">{obra.pwr_links.length} PWR</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-white/40">links</p>
            <p className="text-sm font-bold text-white">{links.length}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40">% ctrl</p>
            <p className={`text-sm font-bold ${obra.tem_editora ? 'text-emerald-400' : 'text-white/30'}`}>
              {pctFmt(obra.pct_controlado)}
            </p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      {/* Detalhe — tabela estilo planilha */}
      {open && (
        <div className="border-t border-white/10">
          {links.length > 0 ? (() => {
            // Flatten: todos os titulares de todos os links em linha única
            const CAT_COLOR: Record<string, string> = {
              CA: 'text-violet-300', C: 'text-violet-300', A: 'text-sky-300',
              E: 'text-amber-300', AM: 'text-emerald-300', SE: 'text-rose-300',
              AQ: 'text-teal-300',
            }
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse min-w-[620px]">
                  <thead>
                    <tr className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/30 font-semibold">
                      <th className="text-center px-3 py-2 w-10 border-b border-white/[0.06]">link</th>
                      <th className="text-left px-3 py-2 border-b border-white/[0.06]">nome / razão social</th>
                      <th className="text-left px-3 py-2 border-b border-white/[0.06]">pseudônimo / fantasia</th>
                      <th className="text-center px-2 py-2 w-12 border-b border-white/[0.06]">cat.</th>
                      <th className="text-left px-3 py-2 w-20 border-b border-white/[0.06]">código</th>
                      <th className="text-center px-2 py-2 w-16 border-b border-l border-white/[0.06] text-cyan-400/60 leading-tight">exec<br/>pública</th>
                      <th className="text-center px-2 py-2 w-16 border-b border-l border-white/[0.06] text-teal-400/60 leading-tight">mec /<br/>digital</th>
                      <th className="text-center px-2 py-2 w-16 border-b border-l border-white/[0.06]">ctrl?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link, li) => {
                      // linha do autor
                      const autor = link.autor
                      const autorCode = autor.submitter_code && autor.submitter_code !== autor.sequence_code
                        ? autor.submitter_code : autor.sequence_code
                      const rows: Array<{ t: CwrTitular; code: string; li: number }> = [
                        { t: autor, code: autorCode, li },
                        ...link.editoras.map(ed => {
                          const c = ed.submitter_code && ed.submitter_code !== ed.sequence_code
                            ? ed.submitter_code : ed.sequence_code
                          return { t: ed, code: c, li }
                        }),
                      ]
                      return rows.map(({ t, code, li: linkIdx }, ri) => (
                        <tr key={`${li}-${ri}`}
                          className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${ri === 0 ? 'bg-white/[0.01]' : ''}`}>
                          {ri === 0 && (
                            <td rowSpan={rows.length} className="text-center px-3 py-2 text-violet-400 font-bold align-middle border-r border-white/[0.04]">
                              {linkIdx + 1}
                            </td>
                          )}
                          <td className="px-3 py-2">
                            <p className={`font-medium ${ri === 0 ? 'text-white/90' : 'text-white/60'}`}>{t.nome || '—'}</p>
                          </td>
                          <td className="px-3 py-2 text-white/35 italic text-[10px]">—</td>
                          <td className="text-center px-2 py-2">
                            <span className={`font-bold text-[10px] ${CAT_COLOR[t.papel_cwr.trim()] ?? 'text-white/40'}`}>
                              {t.papel_cwr.trim()}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-white/40 text-[10px]">{code || '—'}</td>
                          <td className="text-center px-2 py-2 border-l border-white/[0.04] tabular-nums text-cyan-400 font-semibold">
                            {pctFmt(t.pr_pct)}
                          </td>
                          <td className="text-center px-2 py-2 border-l border-white/[0.04] tabular-nums text-teal-400 font-semibold">
                            {pctFmt(t.mr_pct)}
                          </td>
                          <td className="text-center px-2 py-2 border-l border-white/[0.04]">
                            <span className={`text-[10px] font-semibold ${t.controlado ? 'text-emerald-400' : 'text-white/20'}`}>
                              {t.controlado ? 'sim' : 'não'}
                            </span>
                          </td>
                        </tr>
                      ))
                    })}
                  </tbody>
                </table>
              </div>
            )
          })() : (
            <div className="px-5 py-4 text-sm text-white/30 italic">Nenhum link montado — sem SWR ou PWR</div>
          )}

          {/* Referências OWR/OPU (não controlados) */}
          {owrs.length > 0 && (
            <div className="border-t border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-white/20 px-5 py-2">
                Participantes externos / Referência ({owrs.length})
              </p>
              {owrs.map((t, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 px-5 py-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-white/25 border border-white/10 rounded px-1.5">{t.tipo}</span>
                  <span className="text-xs text-white/40">{t.nome}</span>
                  {t.submitter_code && <span className="text-[10px] font-mono text-white/25">{t.submitter_code}</span>}
                  <span className="text-[10px] text-white/20 italic">não controlado</span>
                </div>
              ))}
            </div>
          )}

          {/* Debug bruto — apenas para diagnóstico */}
          <details className="border-t border-white/5">
            <summary className="px-5 py-2 text-[10px] text-white/20 cursor-pointer select-none hover:text-white/40">
              Dados brutos CWR (diagnóstico)
            </summary>
            <div className="px-5 pb-3 overflow-x-auto">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr className="text-white/20 border-b border-white/5">
                    <th className="py-1 pr-2 text-left">Tipo</th>
                    <th className="py-1 px-2 text-left">Código</th>
                    <th className="py-1 px-2 text-left">Nome</th>
                    <th className="py-1 px-2 text-left">IPI</th>
                    <th className="py-1 px-2 text-center">Papel</th>
                    <th className="py-1 px-2 text-center">PR%</th>
                    <th className="py-1 px-2 text-center">MR%</th>
                    <th className="py-1 px-2 text-center">seq</th>
                    <th className="py-1 pl-2 text-left">PWR↗</th>
                  </tr>
                </thead>
                <tbody>
                  {obra.titulares.map((t, i) => (
                    <tr key={i} className="border-t border-white/[0.04]">
                      <td className="py-1 pr-2 text-white/40">{t.tipo}</td>
                      <td className="py-1 px-2 text-amber-400/60">{t.submitter_code || '—'}</td>
                      <td className="py-1 px-2 text-white/50 max-w-[140px] truncate">{t.nome}</td>
                      <td className="py-1 px-2 text-white/25">{t.ipi || '—'}</td>
                      <td className="py-1 px-2 text-center text-sky-400/60">{t.papel_cwr.trim()}</td>
                      <td className="py-1 px-2 text-center text-white/40">{pctFmt(t.pr_pct)}</td>
                      <td className="py-1 px-2 text-center text-white/40">{pctFmt(t.mr_pct)}</td>
                      <td className="py-1 px-2 text-center text-white/25">{t.sequence_code || '—'}</td>
                      <td className="py-1 pl-2 text-emerald-400/40">{t.publisher_seq || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

// ── Histórico de Importações CWR ─────────────────────────────────────────────

function HistoricoCwr({ historico, onDelete }: { historico: ImportacaoLog[]; onDelete: () => void }) {
  const [deletando, setDeletando] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)

  const handleDelete = async (log: ImportacaoLog) => {
    if (!confirm(
      `Apagar importação "${log.arquivo}"?\n\nIsso vai remover ${log.obras_importadas} obra(s) e todos os titulares/gravações associados do localStorage.\n\nNOTA: dados no Supabase precisam ser apagados manualmente pelo momento.`
    )) return
    setDeletando(log.id)
    try {
      const { obras_removidas } = deleteImportacao(log.id)
      window.dispatchEvent(new Event('storage'))
      alert(`Importação removida. ${obras_removidas} obra(s) apagada(s) do localStorage.`)
      onDelete()
    } finally {
      setDeletando(null)
    }
  }

  return (
    <div className="mt-8 border-t border-white/10 pt-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white/70 flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" />
          Arquivos CWR Importados
        </h2>
        <span className="text-[10px] text-white/30">{historico.length} registro{historico.length !== 1 ? 's' : ''}</span>
      </div>

      {historico.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-6 text-center text-sm text-white/25">
          Nenhum arquivo CWR importado ainda
        </div>
      )}

      {historico.map(log => (
        <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {/* Cabeçalho do registro */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-white/80 truncate max-w-[240px]">{log.arquivo}</span>
                <span className={`text-[9px] font-bold uppercase rounded-full px-2 py-0.5 border ${
                  log.status === 'sucesso'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : log.status === 'parcial'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}>{log.status}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                <span className="text-[10px] text-white/35">
                  {new Date(log.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] font-semibold text-violet-300/60">{log.obras_importadas} obras</span>
                <span className="text-[10px] text-white/30">{log.titulares_importados} titulares</span>
                {log.detalhes && <span className="text-[10px] text-white/20 italic">{log.detalhes}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Expandir obras */}
              {log.codigos_obras && log.codigos_obras.length > 0 && (
                <button
                  onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                  className="text-[10px] text-white/30 hover:text-white/60 border border-white/10 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
                >
                  {expandido === log.id ? 'fechar ▲' : `ver ${log.codigos_obras.length} obras ▼`}
                </button>
              )}
              {/* Botão deletar */}
              <button
                onClick={() => handleDelete(log)}
                disabled={deletando === log.id}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-400/70 hover:bg-red-500/15 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletando === log.id
                  ? <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Apagando…</>
                  : <><X className="w-3 h-3" /> Apagar</>
                }
              </button>
            </div>
          </div>

          {/* Lista de obras (colapsável) */}
          {expandido === log.id && log.codigos_obras && (
            <div className="border-t border-white/[0.06] px-4 pb-3 pt-2">
              <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Códigos das obras nesta importação</p>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {log.codigos_obras.map(code => (
                  <span key={code} className="text-[10px] font-mono bg-violet-500/10 border border-violet-500/20 text-violet-300/70 rounded px-1.5 py-0.5">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
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
  const [fileContent, setFileContent] = useState('')
  const [offsetOverride, setOffsetOverride] = useState<number | null>(null)
  const [offsetScores, setOffsetScores] = useState<Record<number, number> | null>(null)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'controlados' | 'nao_controlados'>('todos')
  const [importResult, setImportResult] = useState<{
    obras: number; titulares: number; gravacoes: number
    obras_ctrl: number; tit_ctrl: number; tit_nctrl: number
    supabase_ok: boolean; supabase_obras: number; supabase_errs: string[]
    com_codigo_legado: number; com_iswc: number; total_pwr: number
  } | null>(null)
  const [importing, setImporting] = useState(false)
  const [historico, setHistorico] = useState<ImportacaoLog[]>(() =>
    typeof window !== 'undefined' ? getStore<ImportacaoLog>(STORE_KEYS.importacoes).filter(l => l.tipo === 'CWR') : []
  )
  const reloadHistorico = () =>
    setHistorico(getStore<ImportacaoLog>(STORE_KEYS.importacoes).filter(l => l.tipo === 'CWR'))

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
      codigos_obras: converted.obras.map(o => o.codigo).filter(Boolean),
    })
    let sbRes = { obras_saved: 0, titulares_saved: 0, links_saved: 0, errors: [] as string[] }
    try {
      sbRes = await saveObrasToSupabase(converted.obras, converted.titulares)
    } catch { /* silencioso */ }

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
    reloadHistorico()
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
        const { offset: autoOff, scores } = detectarOffsetCwr(text)
        setOffsetScores(scores)
        const useOff = offOverride !== undefined ? offOverride : autoOff
        const parsed = parseCwr(text, useOff)
        setResult(parsed)
      } catch (err) {
        setResult({
          sender: '', creation_date: '', total_obras: 0, obras: [],
          erros: [`Erro ao processar: ${err}`],
          offset_detectado: 0, spu_offset_detectado: 0,
          stats: { nwr: 0, spu: 0, swr: 0, owr: 0, pwr: 0, linhas: 0 },
        })
      } finally {
        setParsing(false)
      }
    }
    reader.readAsText(file, 'latin1')
  }, [])

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

  const [limpandoCwr, setLimpandoCwr] = useState(false)
  const clearCwrData = async () => {
    if (!confirm('Isso vai APAGAR TODAS as obras e titulares do sistema. Confirma?')) return
    setLimpandoCwr(true)
    try {
      localStorage.removeItem(STORE_KEYS.obras)
      localStorage.removeItem(STORE_KEYS.titulares)
      window.dispatchEvent(new Event('storage'))
      const res = await clearObrasFromSupabase()
      if (!res.ok) {
        alert(`localStorage limpo. Supabase: ${res.error ?? 'erro desconhecido'}`)
      } else {
        alert('Dados apagados com sucesso!\nAgora re-importe o arquivo CWR.')
      }
    } catch (e) {
      alert('Erro ao limpar: ' + String(e))
    } finally {
      setLimpandoCwr(false)
    }
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
          <button
            onClick={clearCwrData}
            disabled={limpandoCwr}
            title="Apaga TODAS as obras e titulares (localStorage + Supabase) para reimportar limpo"
            className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400/70 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" /> {limpandoCwr ? 'Zerando...' : 'Zerar todas as obras'}
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
            dragging ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            <Upload className="w-6 h-6 text-white/40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white/60">Arraste o arquivo CWR ou clique para selecionar</p>
            <p className="text-xs text-white/30 mt-1">Formatos: .cwr · .txt · CWR 2.1 / 2.2</p>
          </div>
          <input ref={inputRef} type="file" accept=".cwr,.txt,.V21,.v21" className="hidden"
            onChange={e => onFile(e.target.files?.[0])} />
        </div>
      )}

      {parsing && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 flex items-center justify-center gap-4">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-white/60">Processando {fileName}…</span>
        </div>
      )}

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
            <button onClick={() => { setResult(null); setFileName(''); setFileContent(''); setOffsetScores(null); setOffsetOverride(null) }}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/30" />
            </button>
          </div>

          {/* Diagnóstico de Offset */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-white/30">Formato CWR detectado</span>
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                result.offset_detectado === 0 ? 'bg-emerald-500/20 text-emerald-300' :
                result.offset_detectado === 4 ? 'bg-amber-500/20 text-amber-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                NWR off={result.offset_detectado}
              </span>
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                result.spu_offset_detectado === 0 ? 'bg-emerald-500/20 text-emerald-300' :
                result.spu_offset_detectado === 8 ? 'bg-violet-500/20 text-violet-300' :
                'bg-amber-500/20 text-amber-300'
              }`}>
                SPU/SWR off={result.spu_offset_detectado}
              </span>
              {offsetScores && (
                <span className="text-[10px] text-white/30 font-mono">
                  scores NWR: 0={offsetScores[0]} 4={offsetScores[4]} 8={offsetScores[8]}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-white/30">Forçar offset global:</span>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(off => (
                <button key={off}
                  onClick={() => { setOffsetOverride(off); reparse(off) }}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                    (offsetOverride === off || (offsetOverride === null && result.offset_detectado === off))
                      ? 'border-violet-500/60 bg-violet-500/20 text-violet-300'
                      : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                  }`}>{off}</button>
              ))}
              <input type="number" min={0} max={20} placeholder="outro…"
                className="w-16 text-[11px] font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/60 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40"
                onChange={e => {
                  const v = parseInt(e.target.value, 10)
                  if (!isNaN(v) && v >= 0 && v <= 20) { setOffsetOverride(v); reparse(v) }
                }} />
              {offsetOverride !== null && (
                <button onClick={() => { setOffsetOverride(null); if (fileContent) { const parsed = parseCwr(fileContent); setResult(parsed) } }}
                  className="text-[10px] text-white/30 hover:text-white/60 underline">
                  voltar para auto
                </button>
              )}
            </div>
          </div>

          {/* Diagnóstico linha bruta */}
          {(result.debug_nwr_line || result.debug_spu_line) && (
            <details className="rounded-xl border border-amber-500/20 bg-amber-500/5">
              <summary className="px-4 py-2.5 cursor-pointer text-xs text-amber-400/70 font-semibold select-none">
                Diagnóstico: linhas brutas NWR / SPU (clique para ver)
              </summary>
              <div className="px-4 pb-4 space-y-4">
                {[
                  { label: 'NWR (linha de obra)', line: result.debug_nwr_line },
                  { label: 'SPU (linha de editora)', line: result.debug_spu_line },
                ].filter(d => d.line).map(({ label, line }) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{label} — primeiros 150 chars</p>
                    <div className="font-mono text-[10px] text-white/60 bg-black/40 rounded-lg p-3 overflow-x-auto whitespace-nowrap">
                      <div className="text-white/25 mb-0.5">{'0         1         2         3         4         5         6         7         8         9         10        11        12        13        14   '.slice(0, 150)}</div>
                      <div className="text-white/25 mb-1">{'012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789'.slice(0, 150)}</div>
                      <div className="text-amber-300/80">{line!.slice(0, 150)}</div>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-white/25 italic">
                  Para SPU: o offset correto é onde o campo role (E, AM, SE) aparece na posição certa.
                  Off=8 → role está em pos 98 (seq_l=14) ou pos 86 (seq_l=2).
                </p>
              </div>
            </details>
          )}

          {/* Resultado da importação */}
          {importResult && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
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
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-amber-400/70 font-semibold">Rastreabilidade CWR</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-base font-extrabold text-amber-300">{importResult.com_codigo_legado}</p>
                    <p className="text-[10px] text-white/40">Cód. legado</p>
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
              {importResult.supabase_ok
                ? <div className="flex items-center gap-2 text-xs text-emerald-400"><Shield className="w-3.5 h-3.5" /><span>{importResult.supabase_obras} obras gravadas no banco Supabase</span></div>
                : importResult.supabase_errs.length > 0
                  ? <p className="text-[11px] text-amber-400/80 flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> localStorage salvo · Supabase: {importResult.supabase_errs[0]}</p>
                  : <p className="text-[11px] text-white/30">Dados salvos em localStorage. Sincronização Supabase em andamento…</p>}
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
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título ou código…"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
            <div className="flex gap-2">
              {(['todos', 'controlados', 'nao_controlados'] as const).map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold border transition-colors ${
                    filtro === f ? 'border-violet-500/40 bg-violet-500/20 text-violet-300' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                  }`}>
                  {f === 'todos' ? 'Todos' : f === 'controlados' ? 'Controlados' : 'Não controlados'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-300/70">
              <strong className="text-sky-300">Clique em cada obra</strong> para ver os links com autores e editoras (cadeia editorial).
              Cada link mostra: Autor (CA/C/A) + Editora E + Administradora AM.
            </p>
          </div>

          <DiagnosticoTabela obras={obras_filtradas} />

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

      {/* ── Histórico de Importações CWR ── */}
      <HistoricoCwr historico={historico} onDelete={reloadHistorico} />
    </div>
  )
}
