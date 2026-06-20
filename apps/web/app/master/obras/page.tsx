'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Music, Plus, Upload, Search, ChevronRight, Users,
  AlertCircle, CheckCircle2, Mic2, X, FileCheck2,
  AlignLeft, Link2, Hash, Globe, Calendar, Clock,
  ExternalLink, Edit3, Copy, ChevronDown, ChevronUp,
  Send, Database, Tag, ShieldCheck, ShieldAlert, Loader2,
  Save, FileSpreadsheet, FileText, Check, Calculator, RefreshCw, Trash2,
} from 'lucide-react'
import { MOCK_OBRAS, MOCK_OBRAS_LINKS } from '@/lib/mock-obras'
import { STORE_KEYS } from '@/lib/store'
import { authFetch } from '@/lib/supabase/client'
import { createClient } from '@supabase/supabase-js'
// MOCK_EDITORAS removido — editoras carregadas via /api/editoras
import { STATUS_OBRA_LABELS, STATUS_OBRA_COLORS, normalizarLinksObra } from '@/lib/types-obras'
import { DeleteObraModal } from '@/components/ui/delete-obra-modal'
import type { StatusObra, Fonograma } from '@/lib/types-obras'

/** Distribui percentuais garantindo soma = 100,00 (algoritmo largest-remainder, 2 casas) */
function largestRemainder(values: number[]): number[] {
  const total = values.reduce((s, v) => s + v, 0)
  if (total === 0 || values.length === 0) return values.map(() => 0)
  const raw = values.map(v => (v / total) * 100)
  const floors = raw.map(v => Math.floor(v * 100) / 100)
  const deficit = Math.round((100 - floors.reduce((s, v) => s + v, 0)) * 100)
  const order = raw
    .map((v, i) => ({ i, frac: (v * 100) - Math.floor(v * 100) }))
    .sort((a, b) => b.frac - a.frac)
  const result = [...floors]
  for (let k = 0; k < deficit && k < order.length; k++)
    result[order[k].i] = parseFloat((result[order[k].i] + 0.01).toFixed(2))
  return result
}

const AVATARES_CORES = [
  'bg-violet-600', 'bg-amber-600', 'bg-emerald-600',
  'bg-sky-600', 'bg-rose-600', 'bg-indigo-600',
]

function AvatarTitular({ nome, idx }: { nome: string; idx: number }) {
  if (!nome) return null
  const initials = nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span title={nome}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white ring-2 ring-[#0d1526] -ml-1.5 first:ml-0 ${AVATARES_CORES[idx % AVATARES_CORES.length]}`}>
      {initials}
    </span>
  )
}

function IswcBadge({ iswc }: { iswc?: string | null }) {
  if (iswc) return <span className="text-xs font-mono text-emerald-400">{iswc}</span>
  return <span className="text-xs text-white/25 italic">Pendente</span>
}

function PctBadge({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs tabular-nums text-white/60">{value.toFixed(0)}%</span>
    </div>
  )
}

const BO_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  nao_enviada: { label: 'Não enviada', color: 'text-white/30', icon: <Database className="w-3 h-3" /> },
  enviada:     { label: 'Enviada',     color: 'text-amber-400', icon: <Send className="w-3 h-3" /> },
  song:        { label: 'Song',        color: 'text-sky-400',   icon: <Loader2 className="w-3 h-3" /> },
  work:        { label: 'Work ✓',      color: 'text-emerald-400', icon: <ShieldCheck className="w-3 h-3" /> },
  divergente:  { label: 'Divergente',  color: 'text-amber-500', icon: <ShieldAlert className="w-3 h-3" /> },
  rejeitada:   { label: 'Rejeitada',   color: 'text-rose-400',  icon: <ShieldAlert className="w-3 h-3" /> },
}

function BackOfficeBadge({ status }: { status?: string | null }) {
  const s = status ?? 'nao_enviada'
  const bo = BO_STATUS[s] ?? BO_STATUS.nao_enviada
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${bo.color}`}>
      {bo.icon}{bo.label}
    </span>
  )
}

const STATUS_OPTIONS: { value: StatusObra | ''; label: string }[] = [
  { value: '', label: 'Todos status' },
  { value: 'ativa', label: 'Ativa' },
  { value: 'validada', label: 'Validada' },
  { value: 'pre_cadastro', label: 'Pre-cadastro' },
  { value: 'bloqueada', label: 'Bloqueada' },
  { value: 'divergente', label: 'Divergente' },
]

// ─── Highlight texto da busca ─────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!text) return <></>
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-violet-500/30 text-violet-200 rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

// ─── Drawer de detalhes da obra ──────────────────────────────────────────────
function ObraDrawer({ obra: obraInicial, onClose, editoras = [] }: { obra: any; onClose: () => void; editoras?: { id: string; nome_fantasia: string }[] }) {
  const [tab, setTab] = useState<'info' | 'titulares' | 'fonogramas' | 'letra'>('info')
  const [letraExpanded, setLetraExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [obra, setObra] = useState<any>(obraInicial)
  const [editData, setEditData] = useState<any>({})
  const [modoView, setModoView] = useState<'sintetico' | 'analitico'>('sintetico')
  const [showDeleteObra, setShowDeleteObra] = useState(false)

  // ── Carregamento real de links do banco ──────────────────────────────────
  const [realLinks, setRealLinks] = useState<any[] | null>(null)
  const [loadingLinks, setLoadingLinks] = useState(true)

  useEffect(() => {
    if (!obraInicial.id) { setLoadingLinks(false); return }
    setLoadingLinks(true)
    setRealLinks(null)
    authFetch(`/api/obras/${obraInicial.id}/links`)
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setRealLinks(json.data)
        }
      })
      .catch(() => { /* silencioso: cai no fallback mock */ })
      .finally(() => setLoadingLinks(false))
  }, [obraInicial.id])

  // ── Calcular Analítico ───────────────────────────────────────────────────
  const [calculando, setCalculando] = useState(false)
  const [analiticoResult, setAnaliticoResult] = useState<any>(null)
  const [analiticoError, setAnaliticoError] = useState<string | null>(null)

  const calcularAnalitico = async () => {
    setCalculando(true)
    setAnaliticoError(null)
    setAnaliticoResult(null)
    try {
      const res = await authFetch(`/api/obras/${obra.id}/analitico`, {
        method: 'POST',
        body: JSON.stringify({ territorios: ['BR'] }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao calcular analítico')
      setAnaliticoResult(json)
    } catch (e: any) {
      setAnaliticoError(e.message)
    } finally {
      setCalculando(false)
    }
  }

  const links = normalizarLinksObra(realLinks ?? obra._links ?? MOCK_OBRAS_LINKS[obra.id] ?? [])

  // Detecta link OWR: tem autores MAS nenhuma editora/administradora no link.
  // Regra: se existe E/AM/SE no link, é cadeia editorial controlada (não OWR).
  // NÃO usa a.controlado pois pode estar errado em dados de importações antigas.
  const PAPEIS_AUTOR_SET = ['autor', 'compositor', 'versionista', 'adaptador']
  const PAPEIS_EDITORA_SET = ['editora_original', 'administradora', 'subeditora']
  const isOwrLink = (titulares: any[]): boolean => {
    const autores = titulares.filter(t => PAPEIS_AUTOR_SET.includes(t.papel ?? ''))
    if (autores.length === 0) return false
    const hasEditora = titulares.some(t =>
      PAPEIS_EDITORA_SET.includes(t.papel ?? '') ||
      ['E', 'AM', 'SE', 'AQ'].includes((t.papel ?? '').toUpperCase())
    )
    return !hasEditora  // sem editora = OWR
  }
  // Percentual controlado: soma TODOS os participantes de links não-OWR.
  // Um link não-OWR significa cadeia editorial completa (CA+E+AM) → 100% sob controle.
  // NÃO filtra por t.controlado pois essa flag pode estar errada em dados antigos.
  const pctControladoCalc = parseFloat(
    links.reduce((total: number, link: any) => {
      const lt = link.titulares ?? []
      if (isOwrLink(lt)) return total
      return total + lt.reduce((s: number, t: any) =>
        s + (t.percentual_exec_publica ?? t.percentual ?? 0), 0)
    }, 0).toFixed(2)
  )

  // ── Fonogramas + Intérpretes ─────────────────────────────────────────────
  const [fonogramas, setFonogramas] = useState<Fonograma[]>([])
  const [loadingFonogramas, setLoadingFonogramas] = useState(false)
  const [showAddFono, setShowAddFono] = useState(false)
  const [newFono, setNewFono] = useState({ titulo_fonograma: '', isrc: '', interprete: '', versao: 'original', gravadora: '' })
  const [savingFono, setSavingFono] = useState(false)
  const [fonogramaSub, setFonogramaSub] = useState<'gravacoes' | 'interpretes'>('gravacoes')

  const addFonograma = async () => {
    if (!newFono.interprete.trim() || !newFono.isrc.trim()) return
    setSavingFono(true)
    try {
      const res = await authFetch(`/api/obras/${obra.id}/fonogramas`, {
        method: 'POST',
        body: JSON.stringify(newFono),
      })
      const d = await res.json()
      if (d.data) {
        setFonogramas(prev => [...prev, d.data])
        setNewFono({ titulo_fonograma: '', isrc: '', interprete: '', versao: 'original', gravadora: '' })
        setShowAddFono(false)
      }
    } catch {}
    finally { setSavingFono(false) }
  }

  // ── Intérpretes ──────────────────────────────────────────────────────────
  const [interpretes, setInterpretes] = useState<any[]>([])
  const [loadingInterp, setLoadingInterp] = useState(false)
  const [showAddInterp, setShowAddInterp] = useState(false)
  const [newInterp, setNewInterp] = useState({ nome_artistico: '', tipo: 'principal' })
  const [savingInterp, setSavingInterp] = useState(false)

  useEffect(() => {
    if (tab !== 'fonogramas' || !obra.id) return
    setLoadingInterp(true)
    authFetch(`/api/obras/${obra.id}/interpretes`)
      .then(r => r.json())
      .then(d => setInterpretes(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingInterp(false))
  }, [tab, obra.id])

  const addInterprete = async () => {
    if (!newInterp.nome_artistico.trim()) return
    setSavingInterp(true)
    try {
      const res = await authFetch(`/api/obras/${obra.id}/interpretes`, {
        method: 'POST',
        body: JSON.stringify(newInterp),
      })
      const d = await res.json()
      if (d.data) {
        setInterpretes(prev => [...prev, d.data])
        setNewInterp({ nome_artistico: '', tipo: 'principal' })
        setShowAddInterp(false)
      }
    } catch {}
    finally { setSavingInterp(false) }
  }

  // ── Contrato vinculado ──────────────────────────────────────────────────
  const [contratoInfo, setContratoInfo] = useState<any>(null)
  useEffect(() => {
    if (tab !== 'info' || !obra.contrato_origem_id) return
    authFetch(`/api/contratos/${obra.contrato_origem_id}`)
      .then(r => r.json())
      .then(d => setContratoInfo(d.contrato ?? null))
      .catch(() => {})
  }, [tab, obra.contrato_origem_id])
  useEffect(() => {
    if (tab !== 'fonogramas') return
    setLoadingFonogramas(true)
    authFetch(`/api/obras/${obra.id}/fonogramas`)
      .then(r => r.json())
      .then(d => setFonogramas(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingFonogramas(false))
  }, [obra.id, tab])

  const editora = editoras.find(e => e.id === obra.editora_id)
  const editoraNome = editora?.nome_fantasia
    ?? links.flatMap((l: any) => l.titulares ?? [])
        .find((t: any) => ['editora_original', 'administradora'].includes(t.papel))?.nome
    ?? null

  const startEdit = () => {
    setEditData({
      titulo: obra.titulo ?? '',
      titulo_alternativo: obra.titulo_alternativo ?? '',
      subtitulo: obra.subtitulo ?? '',
      idioma: obra.idioma ?? '',
      genero: obra.genero ?? '',
      ano_criacao: obra.ano_criacao ?? '',
      duracao: obra.duracao ?? '',
      iswc: obra.iswc ?? '',
      codigo_interno_legado: obra.codigo_interno_legado ?? '',
      codigo_obra_cwr_original: obra.codigo_obra_cwr_original ?? '',
      backoffice_song_id: obra.backoffice_song_id ?? '',
      backoffice_work_id: obra.backoffice_work_id ?? '',
      letra: obra.letra ?? '',
    })
    setIsEditing(true)
  }

  const cancelEdit = () => { setIsEditing(false); setEditData({}) }

  const saveEdit = async () => {
    setSaving(true)
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (url && key && !url.includes('placeholder') && obra.id) {
        const sb = createClient(url, key)
        await sb.from('obras').update(editData).eq('id', obra.id)
      }
      setObra((prev: any) => ({ ...prev, ...editData }))
      setIsEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Erro ao salvar:', e)
    } finally {
      setSaving(false)
    }
  }

  // ── helpers de exibição ───────────────────────────────────────────────────
  const fmtDuracao = (raw: any): string => {
    if (!raw) return ''
    const n = typeof raw === 'string' ? parseInt(raw.replace(/\D/g,''), 10) : Number(raw)
    if (!n || isNaN(n)) return ''
    const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), s = n % 60
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${m}:${String(s).padStart(2,'0')}`
  }
  const papelSigla = (papel: string): string => {
    const p = (papel ?? '').toLowerCase()
    if (['autor','coautor','compositor','compositor_letrista','letrista','autor_nao_controlado'].includes(p)) return 'CA'
    if (p === 'letrista') return 'LA'
    if (['editora_original','e','aq'].includes(p)) return 'E'
    if (['administradora','am'].includes(p)) return 'AM'
    if (p === 'subpublicadora') return 'SE'
    return (papel ?? '').toUpperCase()
  }

  // ── Exportar Excel (CSV) ───────────────────────────────────────────────────
  const exportExcel = () => {
    const fmt2 = (n: number) => n.toFixed(2) + '%'
    const sinteticoFono = (li: number, t: any): number => {
      const lt = (links[li] as any)?.titulares ?? []
      const hasAM = lt.some((x: any) => ['AM','administradora'].includes(x.papel) || (x.papel??'').toUpperCase()==='AM')
      const hasE  = lt.some((x: any) => { const p=(x.papel??'').toUpperCase(); return p==='E'||p==='AQ'||x.papel==='editora_original' })
      const papel = (t.papel??'').toUpperCase()
      const linkFono = () => { const s=lt.reduce((acc:number,x:any)=>acc+(x.percentual_fonomecanico??0),0); return s>0?s:lt.reduce((acc:number,x:any)=>acc+(x.percentual_exec_publica??x.percentual??0),0) }
      if (hasAM) {
        if (papel==='AM'||t.papel==='administradora') return linkFono()
        return 0
      }
      if (hasE) {
        if (papel==='E'||t.papel==='editora_original'||papel==='AQ') return linkFono()
        return 0
      }
      // OWR / autor não controlado: não controlamos fono/digital/sinc → 0%
      return 0
    }
    const rows: string[] = []
    rows.push('CADASTRO DE OBRA')
    rows.push(`Título;${obra.titulo}`)
    rows.push(`Código Sync Mood;${obra.codigo_obra ?? obra.codigo ?? ''}`)
    rows.push(`Cód. Legado;${obra.codigo_interno_legado||''}`)
    rows.push(`ISWC;${obra.iswc||''}`)
    rows.push(`Idioma;${obra.idioma||''}`)
    rows.push(`Gênero;${obra.genero||''}`)
    rows.push(`Ano;${obra.ano_criacao||''}`)
    rows.push(`Duração;${fmtDuracao(obra.duracao)}`)
    rows.push(`Editora;${editoraNome||''}`)
    rows.push(`Status;${obra.status||''}`)
    rows.push('')
    rows.push('TITULARES')
    rows.push('Link;Nome;Pseudônimo;CPF/CNPJ;Papel;Código;% Exec Pública;% Fono/Digital;Controlado')
    const allRows = links.flatMap((link: any, li: number) => {
      const lt = link.titulares ?? []
      const owr = isOwrLink(lt)
      return lt
        .filter((t: any) => !owr || PAPEIS_AUTOR_SET.includes(t.papel ?? ''))
        .map((t: any) => ({ li, t }))
    })
    let sumExec = 0, sumFono = 0
    allRows.forEach(({ li, t }: any) => {
      const ep = (t.percentual_exec_publica??t.percentual??0)
      const fn = sinteticoFono(li, t)
      sumExec += ep; sumFono += fn
      const doc = t.cpf_cnpj ? t.cpf_cnpj.replace(/\D/g,'') : ''
      rows.push([li+1, t.nome, t.pseudonimo_fantasia||'', doc, papelSigla(t.papel||''),
        t.codigo_interno_legado_titular||'', fmt2(ep), fmt2(fn), t.controlado?'sim':'não'].join(';'))
    })
    rows.push(['TOTAL','','','','','', fmt2(sumExec), fmt2(sumFono), ''].join(';'))
    const bom = '\uFEFF'
    const blob = new Blob([bom + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${obra.titulo.replace(/[^a-zA-Z0-9]/g,'_')}_cadastro.csv`; a.click()
  }

  // ── Exportar PDF (print) ───────────────────────────────────────────────────
  const exportPdf = () => {
    const sinteticoFono = (li: number, t: any): number => {
      const lt = (links[li] as any)?.titulares ?? []
      const hasAM = lt.some((x: any) => ['AM','administradora'].includes(x.papel)||(x.papel??'').toUpperCase()==='AM')
      const hasE  = lt.some((x: any) => { const p=(x.papel??'').toUpperCase(); return p==='E'||p==='AQ'||x.papel==='editora_original' })
      const papel = (t.papel??'').toUpperCase()
      const linkFono = () => { const s=lt.reduce((a:number,x:any)=>a+(x.percentual_fonomecanico??0),0); return s>0?s:lt.reduce((a:number,x:any)=>a+(x.percentual_exec_publica??x.percentual??0),0) }
      if (hasAM) {
        if (papel==='AM'||t.papel==='administradora') return linkFono()
        return 0
      }
      if (hasE) {
        if (papel==='E'||t.papel==='editora_original'||papel==='AQ') return linkFono()
        return 0
      }
      return 0
    }
    const allRows = links.flatMap((link: any, li: number) => {
      const lt = link.titulares ?? []
      const owr = isOwrLink(lt)
      return lt
        .filter((t: any) => !owr || PAPEIS_AUTOR_SET.includes(t.papel ?? ''))
        .map((t: any) => ({ li, t }))
    })
    let sumExec = 0, sumFono = 0
    const trRows = allRows.map(({ li, t }: any) => {
      const ep = (t.percentual_exec_publica??t.percentual??0)
      const fn = sinteticoFono(li, t)
      sumExec += ep; sumFono += fn
      const doc = t.cpf_cnpj ? t.cpf_cnpj.replace(/\D/g,'') : '—'
      return `<tr>
        <td>${li+1}</td><td>${t.nome||''}</td><td>${t.pseudonimo_fantasia||'—'}</td>
        <td>${doc}</td><td><b>${papelSigla(t.papel||'')}</b></td>
        <td>${t.codigo_interno_legado_titular||'—'}</td>
        <td>${ep.toFixed(2)}%</td><td>${fn.toFixed(2)}%</td>
        <td>${t.controlado?'✓':'—'}</td></tr>`
    }).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Cadastro - ${obra.titulo}</title>
<style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px;color:#111}
h1{font-size:16px;margin-bottom:4px}h2{font-size:12px;margin:16px 0 6px;border-bottom:1px solid #ccc;padding-bottom:2px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:12px}
.meta div{border:1px solid #e5e5e5;padding:6px 8px;border-radius:4px}
.meta label{font-size:9px;color:#666;text-transform:uppercase;display:block}
table{width:100%;border-collapse:collapse;margin-top:8px}
th{background:#f0f0f0;padding:5px 6px;text-align:left;font-size:10px;border:1px solid #ddd}
td{padding:4px 6px;border:1px solid #eee;font-size:10px}
tfoot td{background:#f7f7f7;font-weight:bold}
@media print{@page{size:A4 landscape;margin:12mm}}</style></head><body>
<h1>${obra.titulo}</h1>
<p style="color:#555;font-size:10px">Código: ${obra.codigo_obra ?? obra.codigo ?? ''} | ISWC: ${obra.iswc||'Pendente'} | Status: ${obra.status||''}</p>
<div class="meta">
  <div><label>Cód. Legado</label>${obra.codigo_interno_legado||'—'}</div>
  <div><label>Idioma</label>${obra.idioma||'—'}</div>
  <div><label>Gênero</label>${obra.genero||'—'}</div>
  <div><label>Ano</label>${obra.ano_criacao||'—'}</div>
  <div><label>Duração</label>${fmtDuracao(obra.duracao)}</div>
  <div><label>Editora</label>${editoraNome||'—'}</div>
</div>
<h2>Titulares</h2>
<table><thead><tr>
  <th>Link</th><th>Nome</th><th>Pseudônimo</th><th>CPF/CNPJ</th>
  <th>Papel</th><th>Código</th><th>% Exec</th><th>% Fono/Digital</th><th>Ctrl</th>
</tr></thead><tbody>${trRows}</tbody>
<tfoot><tr><td colspan="6" style="text-align:right">TOTAL</td>
  <td>${sumExec.toFixed(2)}%</td><td>${sumFono.toFixed(2)}%</td><td></td></tr></tfoot>
</table></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
  }

  const TABS = [
    { id: 'info',       label: 'Informações',  icon: Hash },
    { id: 'titulares',  label: 'Titulares',    icon: Users },
    { id: 'fonogramas', label: 'Fonogramas',   icon: Mic2 },
    { id: 'letra',      label: 'Letra',        icon: AlignLeft },
  ] as const

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-[#080f1e] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden">

        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <Music className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate">{obra.titulo}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs font-mono text-white/35">{obra.codigo_obra ?? obra.codigo}</span>
              {obra.codigo_interno_legado && obra.codigo_interno_legado !== obra.codigo && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                  <Tag className="w-2.5 h-2.5" />{obra.codigo_interno_legado}
                </span>
              )}
              {obra.iswc && <span className="text-xs font-mono text-emerald-400">{obra.iswc}</span>}
              {(() => {
                const st = (obra.status || obra.status_catalogo) as StatusObra
                return (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_OBRA_COLORS[st] ?? 'bg-white/5 text-white/40'}`}>
                    {STATUS_OBRA_LABELS[st] ?? st ?? '—'}
                  </span>
                )
              })()}
              <BackOfficeBadge status={obra.backoffice_status} />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isEditing && (
              <button onClick={startEdit}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-500/10 text-white/30 hover:text-violet-400 transition-colors"
                title="Editar obra">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowDeleteObra(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-500/10 text-white/30 hover:text-rose-400 transition-colors"
              title="Apagar obra">
              <Trash2 className="w-4 h-4" />
            </button>
            <Link href={`/master/obras/${obra.id}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sky-500/10 text-white/30 hover:text-sky-400 transition-colors"
              title="Abrir página completa (BackOffice, Titulares, Analítico...)">
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 hover:text-white/70 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal de exclusão com 2 etapas */}
        {showDeleteObra && (
          <DeleteObraModal
            obra={{
              id: obra.id,
              titulo: obra.titulo,
              contrato_origem_id: obra.contrato_origem_id ?? null,
              contrato_numero:    obra.contrato_numero ?? null,
              contrato_obras_count: obra.contrato_obras_count ?? null,
            }}
            onClose={() => setShowDeleteObra(false)}
            onDeleted={() => { setShowDeleteObra(false); onClose() }}
          />
        )}

        <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold transition-colors
                ${tab === t.id ? 'bg-violet-600/20 text-violet-300' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'info' && (
            <div className="space-y-4">
              {isEditing && (
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3 mb-1 text-xs text-violet-300 flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 shrink-0" />
                  Modo edição ativo — altere os campos e clique em Salvar
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { label: 'Título', key: 'titulo', value: obra.titulo, editable: true },
                  { label: 'Código Sync Mood', key: null, value: obra.codigo, mono: true, editable: false },
                  { label: 'Cód. Legado (CWR)', key: 'codigo_interno_legado', value: obra.codigo_interno_legado || '—', mono: true, editable: true },
                  { label: 'Cód. CWR Original', key: 'codigo_obra_cwr_original', value: obra.codigo_obra_cwr_original || '—', mono: true, editable: true },
                  { label: 'Título Alternativo', key: 'titulo_alternativo', value: obra.titulo_alternativo || '—', editable: true },
                  { label: 'Subtítulo', key: 'subtitulo', value: obra.subtitulo || '—', editable: true },
                  { label: 'Idioma', key: 'idioma', value: obra.idioma || '—', editable: true, tipo: 'idioma' },
                  { label: 'Gênero', key: 'genero', value: obra.genero || '—', editable: true, tipo: 'genero' },
                  { label: 'Ano de Criação', key: 'ano_criacao', value: obra.ano_criacao || '—', editable: true },
                  { label: 'Duração', key: 'duracao', value: obra.duracao || '—', editable: true },
                  { label: 'ISWC', key: 'iswc', value: obra.iswc || 'Pendente', mono: true, editable: true },
                  { label: 'Editora', key: null, value: editora?.nome_fantasia || editoraNome || '—', editable: false },
                  { label: 'BackOffice Song ID', key: 'backoffice_song_id', value: obra.backoffice_song_id || '—', mono: true, editable: true },
                  { label: 'BackOffice Work ID', key: 'backoffice_work_id', value: obra.backoffice_work_id || '—', mono: true, editable: true },
                ] as any[]).map(item => (
                  <div key={item.label} className="bg-white/[0.03] rounded-xl p-3 space-y-0.5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wide">{item.label}</p>
                    {isEditing && item.editable && item.key ? (
                      item.tipo === 'idioma' ? (
                        editData['__idioma_custom__'] ? (
                          <input
                            autoFocus
                            value={editData[item.key] ?? ''}
                            placeholder="Digite o idioma…"
                            onChange={e => setEditData((prev: any) => ({ ...prev, [item.key]: e.target.value }))}
                            onBlur={() => setEditData((prev: any) => ({ ...prev, __idioma_custom__: false }))}
                            className="w-full bg-white/5 border border-violet-500/30 rounded-lg px-2 py-1 text-sm text-white/90 outline-none focus:border-violet-400 transition-colors"
                          />
                        ) : (
                        <select
                          value={editData[item.key] ?? ''}
                          onChange={e => {
                            if (e.target.value === '__outro__') {
                              setEditData((prev: any) => ({ ...prev, [item.key]: '', __idioma_custom__: true }))
                            } else {
                              setEditData((prev: any) => ({ ...prev, [item.key]: e.target.value }))
                            }
                          }}
                          className="w-full bg-white/5 border border-violet-500/30 rounded-lg px-2 py-1 text-sm text-white/90 outline-none focus:border-violet-400 transition-colors"
                        >
                          <option value="">— selecionar —</option>
                          {['PT - Português','EN - Inglês','ES - Espanhol','FR - Francês','IT - Italiano','DE - Alemão','JA - Japonês','ZH - Chinês','AR - Árabe'].map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                          {editData[item.key] && !['PT - Português','EN - Inglês','ES - Espanhol','FR - Francês','IT - Italiano','DE - Alemão','JA - Japonês','ZH - Chinês','AR - Árabe',''].includes(editData[item.key]) && (
                            <option value={editData[item.key]}>{editData[item.key]}</option>
                          )}
                          <option value="__outro__">+ Incluir novo…</option>
                        </select>
                        )
                      ) : item.tipo === 'genero' ? (
                        editData['__genero_custom__'] ? (
                          <input
                            autoFocus
                            value={editData[item.key] ?? ''}
                            placeholder="Digite o gênero…"
                            onChange={e => setEditData((prev: any) => ({ ...prev, [item.key]: e.target.value }))}
                            onBlur={() => setEditData((prev: any) => ({ ...prev, __genero_custom__: false }))}
                            className="w-full bg-white/5 border border-violet-500/30 rounded-lg px-2 py-1 text-sm text-white/90 outline-none focus:border-violet-400 transition-colors"
                          />
                        ) : (
                          <select
                            value={editData[item.key] ?? ''}
                            onChange={e => {
                              if (e.target.value === '__outro__') {
                                setEditData((prev: any) => ({ ...prev, [item.key]: '', __genero_custom__: true }))
                              } else {
                                setEditData((prev: any) => ({ ...prev, [item.key]: e.target.value }))
                              }
                            }}
                            className="w-full bg-white/5 border border-violet-500/30 rounded-lg px-2 py-1 text-sm text-white/90 outline-none focus:border-violet-400 transition-colors"
                          >
                            <option value="">— selecionar —</option>
                            {['Sertanejo','Forró','Pagode','Samba','Funk','Axé','MPB','Rock','Pop','Gospel','Hip-Hop','Reggae','Bossa Nova','Baião','Jazz','Blues','Eletrônica','Infantil','Clássico'].map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                            {editData[item.key] && !['Sertanejo','Forró','Pagode','Samba','Funk','Axé','MPB','Rock','Pop','Gospel','Hip-Hop','Reggae','Bossa Nova','Baião','Jazz','Blues','Eletrônica','Infantil','Clássico',''].includes(editData[item.key]) && (
                              <option value={editData[item.key]}>{editData[item.key]}</option>
                            )}
                            <option value="__outro__">+ Incluir novo…</option>
                          </select>
                        )
                      ) : (
                      <input
                        value={editData[item.key] ?? ''}
                        onChange={e => setEditData((prev: any) => ({ ...prev, [item.key]: e.target.value }))}
                        className={`w-full bg-white/5 border border-violet-500/30 rounded-lg px-2 py-1 text-sm text-white/90 outline-none focus:border-violet-400 transition-colors ${item.mono ? 'font-mono' : ''}`}
                      />
                      )
                    ) : (
                      <p className={`text-sm text-white/80 font-medium ${item.mono ? 'font-mono' : ''}`}>
                        {item.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/40">Percentual Controlado</p>
                  <span className="text-sm font-bold text-violet-400">{pctControladoCalc.toFixed(2)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(pctControladoCalc, 100)}%` }} />
                </div>
              </div>
              <div className={`rounded-xl p-4 flex items-center gap-3 ${obra.contrato_origem_id ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.03]'}`}>
                <FileCheck2 className={`w-5 h-5 shrink-0 ${obra.contrato_origem_id ? 'text-emerald-400' : 'text-white/20'}`} />
                <div className="flex-1 min-w-0">
                  {obra.contrato_origem_id ? (
                    <>
                      <p className="text-sm font-semibold text-emerald-400">
                        {contratoInfo?.codigo ?? contratoInfo?.numero_contrato ?? 'Contrato vinculado'}
                      </p>
                      <p className="text-xs text-white/30">{contratoInfo?.status ? `Status: ${contratoInfo.status}` : 'Contrato de origem'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Link href={`/master/contratos/${obra.contrato_origem_id}`}
                          className="flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-emerald-500/15 text-xs text-emerald-300 hover:bg-emerald-500/25 transition-colors">
                          <ExternalLink className="w-3 h-3" /> Ver Contrato
                        </Link>
                        {contratoInfo?.d4sign_pdf_url && (
                          <a href={contratoInfo.d4sign_pdf_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-sky-500/15 text-xs text-sky-300 hover:bg-sky-500/25 transition-colors">
                            <FileText className="w-3 h-3" /> Download PDF
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-white/30">Sem contrato anexado</p>
                      <p className="text-xs text-white/30">Necessário para validação</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'titulares' && (() => {
            const rows = links.flatMap((link: any, li: number) => {
              const lt = link.titulares ?? []
              const owr = isOwrLink(lt)
              return lt
                .filter((t: any) => {
                  // Link OWR: mostrar apenas o autor externo, ocultar editoras
                  if (!owr) return true
                  return PAPEIS_AUTOR_SET.includes(t.papel ?? '')
                })
                .map((t: any) => ({ li, t }))
            })
            const fmtDoc = (doc?: string | null, tipo?: string | null) => {
              if (!doc) return '—'
              const d = doc.replace(/\D/g, '')
              if (tipo === 'PJ' || d.length === 14)
                return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
              if (d.length === 11)
                return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
              return doc
            }
            const sinteticoFono = (li: number, t: any): number => {
              const lt = (links[li] as any)?.titulares ?? []
              // Link OWR → 0% para todos (autor externo, sem controle de fono/sinc)
              if (isOwrLink(lt)) return 0
              const hasAM = lt.some((x: any) =>
                ['AM', 'administradora'].includes(x.papel) || (x.papel ?? '').toUpperCase() === 'AM'
              )
              const hasE = lt.some((x: any) => { const p=(x.papel??'').toUpperCase(); return p==='E'||p==='AQ'||x.papel==='editora_original' })
              const papel = (t.papel ?? '').toUpperCase()
              // Fono sintético do link = soma de toda a cadeia (usa exec pública como base confiável)
              const linkFono = () =>
                parseFloat(
                  lt.reduce((acc: number, x: any) => acc + (x.percentual_exec_publica ?? x.percentual ?? 0), 0).toFixed(2)
                )
              if (hasAM) {
                if (papel === 'AM' || t.papel === 'administradora') return linkFono()
                return 0
              }
              if (hasE) {
                if (papel === 'E' || t.papel === 'editora_original' || papel === 'AQ') return linkFono()
                return 0
              }
              return 0
            }
            // Analítico: calcula pct econômico por link (PR / totalPR_link × 100)
            const analiticoLinkPct = new Map<any, number>()
            if (modoView === 'analitico') {
              const linkGroups = new Map<number, any[]>()
              rows.forEach((r: any) => {
                if (!linkGroups.has(r.li)) linkGroups.set(r.li, [])
                linkGroups.get(r.li)!.push(r.t)
              })
              linkGroups.forEach((titulares, li) => {
                const lt = (links[li] as any)?.titulares ?? []
                if (isOwrLink(lt)) return
                const totalPR = titulares.reduce((s: number, t: any) =>
                  s + (t.percentual_exec_publica ?? t.percentual ?? 0), 0)
                if (totalPR <= 0) return
                titulares.forEach((t: any) => {
                  const sc = t.status_controle ?? (t.controlado === false ? 'nao_controlado' : 'controlado')
                  if (sc === 'nao_controlado') {
                    analiticoLinkPct.set(t, 0)
                  } else {
                    analiticoLinkPct.set(t, (t.percentual_exec_publica ?? t.percentual ?? 0) / totalPR * 100)
                  }
                })
              })
            }
            const calcFono = (li: number, t: any) => {
              if (modoView === 'sintetico') return sinteticoFono(li, t)
              const lt = (links[li] as any)?.titulares ?? []
              if (isOwrLink(lt)) return 0
              return analiticoLinkPct.get(t) ?? 0
            }
            const calcSinc = (t: any) => (t.percentual_sincronizacao ?? 0)
            const calcExec = (t: any) => (t.percentual_exec_publica ?? t.percentual ?? 0)
            const sumExec = rows.reduce((s: number, r: any) => s + calcExec(r.t), 0)
            const sumFono = rows.reduce((s: number, r: any) => s + calcFono(r.li, r.t), 0)
            const sumSinc = rows.reduce((s: number, r: any) => s + calcSinc(r.t), 0)
            const CAT_LABEL: Record<string, string> = {
              compositor: 'CA', compositorautor: 'CA', CA: 'CA', C: 'C', A: 'A',
              editora_original: 'E', administradora: 'AM', subeditora: 'SE',
              AM: 'AM', E: 'E', SE: 'SE',
            }
            const CAT_COLOR: Record<string, string> = {
              CA: 'text-violet-300 bg-violet-500/10', C: 'text-violet-300 bg-violet-500/10',
              A: 'text-sky-300 bg-sky-500/10', E: 'text-amber-300 bg-amber-500/10',
              AM: 'text-emerald-300 bg-emerald-500/10', SE: 'text-rose-300 bg-rose-500/10',
            }
            return rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-white/25">
                <Users className="w-8 h-8" />
                <p className="text-sm">Nenhum integrante cadastrado</p>
              </div>
            ) : (
              <>
                {/* Toggle Sintético / Analítico */}
                <div className="flex items-center gap-2 px-5 pb-3">
                  <div className="flex bg-white/[0.04] rounded-lg p-0.5 gap-0.5">
                    {(['sintetico', 'analitico'] as const).map(v => (
                      <button key={v} onClick={() => setModoView(v)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                          modoView === v
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-white/40 hover:text-white/70'
                        }`}>
                        {v === 'sintetico' ? 'Sintético' : 'Analítico'}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-white/25">
                    {modoView === 'sintetico'
                      ? 'MEC/Sinc: CA=0%, E=0% — AM absorve total do link'
                      : 'Valores individuais de cada participante'}
                  </span>
                </div>
                <div className="overflow-x-auto -mx-5">
                <table className="w-full text-[11px] border-collapse min-w-[620px]">
                  <thead>
                    <tr className="bg-white/[0.04] text-white/40 font-semibold text-[10px] uppercase tracking-wide">
                      <th className="text-center px-3 py-2.5 w-10 border-b border-white/[0.06]">lnk</th>
                      <th className="text-left px-3 py-2.5 border-b border-white/[0.06]">autor / editora</th>
                      <th className="text-left px-3 py-2.5 border-b border-white/[0.06]">pseudônimo</th>
                      <th className="text-center px-3 py-2.5 w-12 border-b border-white/[0.06]">cat.</th>
                      <th className="text-left px-3 py-2.5 w-28 border-b border-white/[0.06]">cpf / cnpj</th>
                      <th className="text-center px-2 py-2.5 w-16 border-b border-l border-white/[0.06] text-cyan-400/60 leading-tight">% exec<br/>pública</th>
                      <th className="text-center px-2 py-2.5 w-16 border-b border-l border-white/[0.06] text-teal-400/60 leading-tight">% fono/<br/>digital</th>
                      <th className="text-center px-2 py-2.5 w-16 border-b border-l border-white/[0.06] text-amber-400/60 leading-tight">% sinc-<br/>roniz.</th>
                      <th className="text-center px-3 py-2.5 w-20 border-b border-l border-white/[0.06]">contrato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ li, t }: any, ri: number) => {
                      const ep = calcExec(t)
                      const fn = calcFono(li, t)
                      const sr = calcSinc(t)
                      const catKey = CAT_LABEL[(t.papel ?? '').replace(/\s/g,'').toLowerCase()] ?? t.papel ?? '—'
                      return (
                        <tr key={t.id || ri}
                          className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                          <td className="text-center px-3 py-2 text-violet-400 font-bold">{li + 1}</td>
                          <td className="px-3 py-2">
                            <p className="text-white/80 font-medium">{t.nome}</p>
                            {t.codigo_interno_legado_titular && (
                              <p className="text-[9px] font-mono text-white/25">{t.codigo_interno_legado_titular}</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-white/45 italic">{t.pseudonimo_fantasia || '—'}</td>
                          <td className="text-center px-3 py-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CAT_COLOR[catKey] ?? 'text-white/40 bg-white/5'}`}>
                              {catKey}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-white/40 text-[10px]">{fmtDoc(t.cpf_cnpj, t.tipo_pessoa)}</td>
                          <td className="text-center px-2 py-2 border-l border-white/[0.04] tabular-nums text-cyan-400 font-semibold">
                            {ep.toFixed(2)}%
                          </td>
                          <td className={`text-center px-2 py-2 border-l border-white/[0.04] tabular-nums font-semibold ${fn > 0 ? 'text-teal-400' : 'text-white/20'}`}>
                            {fn.toFixed(2)}%
                          </td>
                          <td className={`text-center px-2 py-2 border-l border-white/[0.04] tabular-nums font-semibold ${sr > 0 ? 'text-amber-400' : 'text-white/20'}`}>
                            {sr.toFixed(2)}%
                          </td>
                          <td className="text-center px-3 py-2 border-l border-white/[0.04]">
                            {t.contrato_file ? (
                              <span className="text-[10px] font-semibold text-emerald-400">✓</span>
                            ) : (
                              <span className="text-[10px] text-amber-500/60 font-semibold" title="Sem contrato">⚠</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-white/[0.03] border-t border-white/[0.08] font-bold text-[10px]">
                      <td colSpan={5} className="px-3 py-2.5 text-right text-white/40 uppercase tracking-wide">total</td>
                      <td className="text-center px-2 py-2.5 border-l border-white/[0.06] text-cyan-400 tabular-nums">{sumExec.toFixed(2)}%</td>
                      <td className="text-center px-2 py-2.5 border-l border-white/[0.06] text-teal-400 tabular-nums">{sumFono.toFixed(2)}%</td>
                      <td className="text-center px-2 py-2.5 border-l border-white/[0.06] text-amber-400 tabular-nums">{sumSinc.toFixed(2)}%</td>
                      <td className="border-l border-white/[0.06]" />
                    </tr>
                  </tfoot>
                </table>
              </div>
              </>
            )
          })()}

          {tab === 'fonogramas' && (
            <div className="space-y-3">
              {/* Sub-tabs Gravações / Intérpretes */}
              <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1">
                {([
                  { id: 'gravacoes',  label: `Gravações (${fonogramas.length})` },
                  { id: 'interpretes', label: `Intérpretes (${interpretes.length})` },
                ] as const).map(s => (
                  <button key={s.id}
                    onClick={() => { setFonogramaSub(s.id); setShowAddFono(false); setShowAddInterp(false) }}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${fonogramaSub === s.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* ── GRAVAÇÕES ──────────────────────────────────────────────── */}
              {fonogramaSub === 'gravacoes' && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <button onClick={() => setShowAddFono(v => !v)}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-sky-500/20 border border-sky-500/30 text-xs text-sky-300 hover:bg-sky-500/30 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Adicionar Gravação
                    </button>
                  </div>
                  {showAddFono && (
                    <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-sky-300">Nova Gravação</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <label className="text-[10px] text-white/30 mb-1 flex items-center gap-1">Intérprete <span className="text-rose-400">*</span></label>
                          <input type="text" value={newFono.interprete}
                            onChange={e => setNewFono(p => ({ ...p, interprete: e.target.value.toUpperCase() }))}
                            placeholder="NOME DO INTERPRETE"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white uppercase placeholder-white/20 focus:outline-none focus:border-sky-500/60" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-white/30 mb-1 flex items-center gap-1">ISRC <span className="text-rose-400">*</span></label>
                          <input type="text" value={newFono.isrc}
                            onChange={e => setNewFono(p => ({ ...p, isrc: e.target.value.toUpperCase() }))}
                            placeholder="BR-XXX-00-00000"
                            className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-white/20 focus:outline-none ${!newFono.isrc.trim() ? 'border-rose-500/40' : 'border-white/10 focus:border-sky-500/60'}`} />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/30 mb-1 block">Título da Gravação</label>
                          <input type="text" value={newFono.titulo_fonograma}
                            onChange={e => setNewFono(p => ({ ...p, titulo_fonograma: e.target.value }))}
                            placeholder="Opcional"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-sky-500/60" />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/30 mb-1 block">Versão</label>
                          <select value={newFono.versao} onChange={e => setNewFono(p => ({ ...p, versao: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                            <option value="original">Original</option>
                            <option value="ao_vivo">Ao Vivo</option>
                            <option value="acustico">Acústico</option>
                            <option value="remix">Remix</option>
                            <option value="outro">Outro</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setShowAddFono(false)} className="flex-1 h-9 rounded-lg bg-white/5 text-xs text-white/50 hover:text-white/70 transition-colors">Cancelar</button>
                        <button onClick={addFonograma} disabled={!newFono.interprete.trim() || !newFono.isrc.trim() || savingFono}
                          className="flex-1 h-9 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white transition-colors disabled:opacity-40">
                          {savingFono ? 'Salvando...' : 'Salvar Gravação'}
                        </button>
                      </div>
                    </div>
                  )}
                  {loadingFonogramas && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>}
                  {!loadingFonogramas && fonogramas.length === 0 && !showAddFono && (
                    <div className="flex flex-col items-center gap-2 py-8 text-white/25">
                      <Mic2 className="w-7 h-7" /><p className="text-sm">Nenhuma gravação cadastrada</p>
                    </div>
                  )}
                  {!loadingFonogramas && fonogramas.map((f, i) => (
                    <div key={f.id || i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                        <Mic2 className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 font-medium truncate">{f.titulo_fonograma || f.interprete || `Gravação ${i + 1}`}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {f.isrc && <span className="text-[10px] font-mono text-emerald-400">{f.isrc}</span>}
                          {f.interprete && <span className="text-[10px] text-sky-300 uppercase">{f.interprete}</span>}
                          {f.versao && f.versao !== 'original' && <span className="text-[10px] text-white/30">{f.versao}</span>}
                        </div>
                      </div>
                      {f.ano_gravacao && <span className="text-xs text-white/25 shrink-0">{f.ano_gravacao}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── INTÉRPRETES ────────────────────────────────────────────── */}
              {fonogramaSub === 'interpretes' && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <button onClick={() => setShowAddInterp(v => !v)}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 hover:bg-emerald-500/30 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Adicionar Intérprete
                    </button>
                  </div>
                  {showAddInterp && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-emerald-300">Novo Intérprete</p>
                      <div>
                        <label className="text-[10px] text-white/30 mb-1 flex items-center gap-1">Nome Artístico <span className="text-rose-400">*</span></label>
                        <input type="text" value={newInterp.nome_artistico}
                          onChange={e => setNewInterp(p => ({ ...p, nome_artistico: e.target.value.toUpperCase() }))}
                          onKeyDown={e => e.key === 'Enter' && addInterprete()}
                          placeholder="NOME DO INTERPRETE"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white uppercase placeholder-white/20 focus:outline-none focus:border-emerald-500/60" />
                      </div>
                      <p className="text-[10px] text-white/25">Pode ser adicionado manualmente ou carregado de uma autorização emitida.</p>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setShowAddInterp(false)} className="flex-1 h-9 rounded-lg bg-white/5 text-xs text-white/50 hover:text-white/70 transition-colors">Cancelar</button>
                        <button onClick={addInterprete} disabled={!newInterp.nome_artistico.trim() || savingInterp}
                          className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors disabled:opacity-40">
                          {savingInterp ? 'Salvando...' : 'Salvar Intérprete'}
                        </button>
                      </div>
                    </div>
                  )}
                  {loadingInterp && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>}
                  {!loadingInterp && interpretes.length === 0 && !showAddInterp && (
                    <div className="flex flex-col items-center gap-2 py-8 text-white/25">
                      <Users className="w-7 h-7" /><p className="text-sm">Nenhum intérprete cadastrado</p>
                    </div>
                  )}
                  {interpretes.map((interp: any, i: number) => (
                    <div key={interp.id || i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 text-xs font-bold text-emerald-400">
                        {(interp.nome_artistico ?? '?')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 font-medium uppercase">{interp.nome_artistico}</p>
                        <p className="text-[10px] text-white/30">{interp.tipo ?? 'principal'}{interp.origem && interp.origem !== 'manual' ? ` · ${interp.origem}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'letra' && (
            <div className="space-y-3">
              {obra.letra ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/40">{obra.letra.length} caracteres · {obra.letra.split('\n').length} linhas</p>
                    <button onClick={() => navigator.clipboard?.writeText(obra.letra)}
                      className="flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/40 hover:text-white/70 transition-colors">
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                  </div>
                  <div className={`bg-white/[0.03] rounded-xl p-4 overflow-hidden transition-all ${letraExpanded ? '' : 'max-h-80'}`}>
                    <pre className="text-sm text-white/70 font-mono whitespace-pre-wrap leading-relaxed">{obra.letra}</pre>
                  </div>
                  {obra.letra.split('\n').length > 15 && (
                    <button onClick={() => setLetraExpanded(x => !x)}
                      className="flex items-center gap-1.5 w-full justify-center h-8 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/40 hover:text-white/70 transition-colors">
                      {letraExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Recolher</> : <><ChevronDown className="w-3.5 h-3.5" /> Ver completo</>}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-white/25">
                  <AlignLeft className="w-8 h-8" />
                  <p className="text-sm">Letra não cadastrada</p>
                  <p className="text-xs text-white/20">Disponível após upload do contrato (extração por IA)</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] flex items-center gap-2 flex-wrap">
          {isEditing ? (
            <>
              <button onClick={cancelEdit}
                className="flex-1 h-9 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors">
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex items-center justify-center gap-1.5 flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
              </button>
            </>
          ) : (
            <>
              {/* Painel de resultado / erro do analítico */}
              {(analiticoResult || analiticoError) && (
                <div className={`w-full mb-1 rounded-xl px-3 py-2 text-xs ${analiticoError ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                  {analiticoError ? (
                    <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{analiticoError}</span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      Analítico calculado — {analiticoResult?.total_linhas ?? '?'} participantes · {analiticoResult?.soma_percentuais?.toFixed(2) ?? '?'}%
                    </span>
                  )}
                </div>
              )}
              <button onClick={onClose}
                className="flex-1 h-9 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors">
                Fechar
              </button>
              <button onClick={exportExcel} title="Exportar Excel"
                className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/20 text-sm font-semibold text-emerald-400 hover:bg-emerald-600/30 transition-colors">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button onClick={exportPdf} title="Exportar PDF"
                className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl bg-rose-600/20 border border-rose-500/20 text-sm font-semibold text-rose-400 hover:bg-rose-600/30 transition-colors">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button onClick={calcularAnalitico} disabled={calculando}
                title="Calcular Analítico — gera distribuição por participante"
                className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl bg-blue-600/20 border border-blue-500/20 text-sm font-semibold text-blue-300 hover:bg-blue-600/30 transition-colors disabled:opacity-60">
                {calculando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
                {calculando ? 'Calculando...' : 'Analítico'}
              </button>
              <button onClick={startEdit}
                className="flex items-center justify-center gap-1.5 flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors">
                <Edit3 className="w-3.5 h-3.5" /> Editar Obra
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ObrasPage() {
  const [search, setSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filterStatus, setFilterStatus] = useState<StatusObra | ''>('')
  const [filterEditora, setFilterEditora] = useState('')
  const [filterIswc, setFilterIswc] = useState<'todos' | 'com' | 'sem'>('todos')
  const [filterFono, setFilterFono] = useState<'todos' | 'com' | 'sem'>('todos')
  const [obraAtiva, setObraAtiva] = useState<any>(null)
  const [cwrInvalidos, setCwrInvalidos] = useState(0)
  const [limpando, setLimpando] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Contar dados no localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEYS.obras) ?? '[]')
      setCwrInvalidos(stored.length)
    } catch { /* silencioso */ }
  }, [])

  // Limpar localStorage + Supabase (nuclear) — preserva histórico de importações
  const clearCwrInvalidos = async () => {
    if (!confirm('Isso vai apagar TODAS as obras do armazenamento local. Deseja continuar?')) return
    setLimpando(true)
    try {
      // 1. Limpar localStorage de obras/titulares/gravações — sem apagar histórico CWR
      localStorage.removeItem(STORE_KEYS.obras)
      localStorage.removeItem(STORE_KEYS.titulares)
      localStorage.removeItem(STORE_KEYS.gravacoes)
      window.dispatchEvent(new Event('storage'))
      // 2. Tentar limpar Supabase também
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (url && key && !url.includes('placeholder')) {
        const sb = createClient(url, key)
        const { data: { user } } = await sb.auth.getUser()
        if (user) {
          // Buscar tenant do usuário
          const { data: tenant } = await sb.from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
          const tenantId = tenant?.tenant_id
          if (tenantId) {
            await sb.from('obras_links_titulares').delete().eq('tenant_id', tenantId)
            await sb.from('obras_links').delete().eq('tenant_id', tenantId)
            await sb.from('obras').delete().eq('tenant_id', tenantId)
            await sb.from('titulares').delete().eq('tenant_id', tenantId)
          }
        }
      }
      setCwrInvalidos(0)
      window.location.reload()
    } catch (e) {
      console.error('Erro ao limpar:', e)
      window.location.reload()
    } finally {
      setLimpando(false)
    }
  }

  // Carrega obras via API route server-side (garante autenticação via token Bearer)
  const [obrasData, setObrasData] = useState<any[]>([])
  const [obrasLoading, setObrasLoading] = useState(true)
  const [obrasSource, setObrasSource] = useState<'api' | 'mock'>('mock')
  const [editoras, setEditoras] = useState<{ id: string; nome_fantasia: string }[]>([])

  useEffect(() => {
    async function carregarObras() {
      setObrasLoading(true)
      try {
        const res = await authFetch('/api/obras?per_page=1000')
        if (res.ok) {
          const json = await res.json()
          setObrasData(json.data ?? [])
          setObrasSource('api')
        } else {
          console.warn('[obras] API retornou', res.status)
          setObrasData(MOCK_OBRAS)
          setObrasSource('mock')
        }
      } catch (e) {
        console.error('[obras] erro ao carregar:', e)
        setObrasData(MOCK_OBRAS)
        setObrasSource('mock')
      } finally {
        setObrasLoading(false)
      }
    }
    carregarObras()
  }, [])

  useEffect(() => {
    authFetch('/api/editoras')
      .then(r => r.ok ? r.json() : { editoras: [] })
      .then(d => setEditoras(d.editoras ?? []))
      .catch(() => {})
  }, [])

  // Catálogo unificado: deduplicado por codigo, com % controlado recalculado dinamicamente
  const catalogoCompleto = useMemo(() => {
    const map = new Map<string, any>()
    const PAPEIS_AUTOR_RECALC = ['autor', 'compositor', 'versionista', 'adaptador']
    obrasData.forEach(o => {
      const linksRaw = normalizarLinksObra(o._links ?? MOCK_OBRAS_LINKS[o.id] ?? [])
      if (linksRaw.length > 0) {
        const PAPEIS_EDITORA_RECALC = ['editora_original', 'administradora', 'subeditora']
        const PAPEIS_EDITORA_ABREV  = ['E', 'AM', 'SE', 'AQ']
        const pctCtrl = parseFloat(
          linksRaw.reduce((total: number, link: any) => {
            return total + (link.titulares ?? []).reduce((s: number, t: any) => {
              const p = t.papel ?? ''
              const isEdi = PAPEIS_EDITORA_RECALC.includes(p) || PAPEIS_EDITORA_ABREV.includes(p.toUpperCase())
              if (!isEdi) return s
              return s + (t.percentual_fonomecanico || t.percentual_exec_publica || t.percentual || 0)
            }, 0)
          }, 0).toFixed(2)
        )
        o = { ...o, _percentual_controlado: pctCtrl }
      }
      map.set(o.codigo ?? o.codigo_obra ?? o.id, o)
    })
    return Array.from(map.values())
  }, [obrasData])

  // KPIs dinâmicos calculados do catálogo real
  const kpis = useMemo(() => ({
    total: catalogoCompleto.length,
    ativas: catalogoCompleto.filter(o =>
      o.status === 'ativa' || o.status === 'validada' || o.status_catalogo === 'catalogo_ativo'
    ).length,
    pre_cadastro: catalogoCompleto.filter(o =>
      (o.status === 'pre_cadastro' || o.status_catalogo === 'pre_cadastro') &&
      o.status !== 'ativa' && o.status_catalogo !== 'catalogo_ativo'
    ).length,
    sem_iswc: catalogoCompleto.filter(o => !o.iswc).length,
    com_fonograma: catalogoCompleto.filter(o => (o._fonogramas_count ?? 0) > 0).length,
  }), [catalogoCompleto])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sugestões de autocomplete (máx 8)
  const suggestions = useMemo(() => {
    if (!search || search.length < 1) return []
    const q = search.toLowerCase()
    return catalogoCompleto.filter(o =>
      (o.titulo ?? '').toLowerCase().includes(q) || (o.codigo ?? o.codigo_obra ?? '').toLowerCase().includes(q)
    ).slice(0, 8)
  }, [search, catalogoCompleto])

  const obras = useMemo(() => {
    return catalogoCompleto.filter(o => {
      if (search && !(o.titulo ?? '').toLowerCase().includes(search.toLowerCase()) && !(o.codigo ?? o.codigo_obra ?? '').toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus && (o.status || o.status_catalogo) !== filterStatus) return false
      if (filterEditora && o.editora_id !== filterEditora) return false
      if (filterIswc === 'com' && !o.iswc) return false
      if (filterIswc === 'sem' && o.iswc) return false
      if (filterFono === 'com' && (o._fonogramas_count ?? 0) === 0) return false
      if (filterFono === 'sem' && (o._fonogramas_count ?? 0) > 0) return false
      return true
    })
  }, [search, filterStatus, filterEditora, filterIswc, filterFono, catalogoCompleto])

  const selectCls = 'h-8 bg-white/5 border border-white/[0.06] rounded-lg px-2.5 text-xs text-white/70 focus:outline-none cursor-pointer'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Obras & Catalogo"
        description="Catalogo musical com estrutura de links de participacao e controle editorial"
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Botão de limpeza — SEMPRE visível */}
            <button
              onClick={clearCwrInvalidos}
              disabled={limpando}
              title="Apaga TODOS os dados de obras do armazenamento local e Supabase"
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-xs text-red-400 font-semibold transition-colors disabled:opacity-50"
            >
              {limpando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              {limpando ? 'Limpando...' : 'Zerar obras'}
            </button>
            <Link href="/master/obras/importar-cwr"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-sky-600/20 border border-sky-500/40 hover:bg-sky-600/30 text-sm text-sky-300 font-semibold transition-colors">
              <Upload className="w-4 h-4" /> Importar CWR
            </Link>
            <Link href="/master/obras/nova"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Nova Obra
            </Link>
          </div>
        }
      />

      {/* KPIs clicáveis */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Obras',   value: kpis.total,        color: 'text-white/80',   icon: Music,        action: () => { setFilterStatus(''); setFilterIswc('todos'); setFilterFono('todos') } },
          { label: 'Ativas',        value: kpis.ativas,       color: 'text-emerald-400', icon: CheckCircle2, action: () => setFilterStatus('ativa' as StatusObra) },
          { label: 'Pre-cadastro',  value: kpis.pre_cadastro, color: 'text-violet-400',  icon: AlertCircle,  action: () => setFilterStatus('pre_cadastro' as StatusObra) },
          { label: 'Sem ISWC',      value: kpis.sem_iswc,     color: 'text-amber-400',   icon: AlertCircle,  action: () => setFilterIswc('sem') },
          { label: 'Com Fonograma', value: kpis.com_fonograma, color: 'text-sky-400',    icon: Mic2,         action: () => setFilterFono('com') },
        ].map(stat => (
          <button key={stat.label} onClick={stat.action}
            className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-1 text-left hover:border-white/[0.14] hover:bg-white/[0.02] transition-colors cursor-pointer">
            <div className="flex items-center gap-1.5">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <p className="text-[11px] text-white/40">{stat.label}</p>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </button>
        ))}
      </div>

      {/* Filtros + Tabela */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl flex flex-col">

        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">

          {/* Campo de busca com autocomplete */}
          <div ref={searchRef} className="relative flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 bg-white/5 border border-white/[0.06] rounded-lg px-3 h-8">
              <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por título ou código..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
              />
              {search && (
                <button onClick={() => { setSearch(''); setShowSuggestions(false) }}
                  className="text-white/25 hover:text-white/60 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown de sugestões */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0d1526] border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden">
                <div className="px-3 py-1.5 border-b border-white/[0.06]">
                  <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
                    {suggestions.length} sugestão{suggestions.length !== 1 ? 'ões' : ''}
                  </p>
                </div>
                {suggestions.map(obra => {
                  const links = normalizarLinksObra(obra._links ?? MOCK_OBRAS_LINKS[obra.id] ?? [])
                  const autores = links.flatMap((l: any) =>
                    l.titulares?.filter((t: any) => ['compositor', 'autor', 'CA'].includes(t.papel)) ?? []
                  )
                  return (
                    <button
                      key={obra.id}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setSearch(obra.titulo ?? '')
                        setShowSuggestions(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-violet-500/10 transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20">
                        <Music className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/80 truncate">
                          <Highlight text={obra.titulo ?? ''} query={search} />
                        </p>
                        <p className="text-[10px] text-white/35 font-mono">
                          <Highlight text={obra.codigo ?? obra.codigo_obra ?? ''} query={search} />
                          {autores.length > 0 && (
                            <span className="font-sans ml-2 text-white/25">
                              · {autores.slice(0, 2).map((a: any) => (a.nome ?? '').split(' ')[0]).join(', ')}
                              {autores.length > 2 && ` +${autores.length - 2}`}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_OBRA_COLORS[obra.status as StatusObra] ?? ''}`}>
                        {STATUS_OBRA_LABELS[obra.status as StatusObra] ?? obra.status}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusObra | '')} className={selectCls}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filterEditora} onChange={e => setFilterEditora(e.target.value)} className={selectCls}>
            <option value="">Todas editoras</option>
            {editoras.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia}</option>)}
          </select>
          <select value={filterIswc} onChange={e => setFilterIswc(e.target.value as 'todos' | 'com' | 'sem')} className={selectCls}>
            <option value="todos">ISWC: todos</option>
            <option value="com">Com ISWC</option>
            <option value="sem">Sem ISWC</option>
          </select>
          <select value={filterFono} onChange={e => setFilterFono(e.target.value as 'todos' | 'com' | 'sem')} className={selectCls}>
            <option value="todos">Fonograma: todos</option>
            <option value="com">Com fonograma</option>
            <option value="sem">Sem fonograma</option>
          </select>
          <span className="text-xs text-white/30 ml-auto">
            {obrasLoading ? (
              <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> carregando...</span>
            ) : (
              <>{obras.length} obras{obrasSource === 'mock' && <span className="ml-1 text-amber-500/60">(demo)</span>}</>
            )}
          </span>
        </div>

        {/* Tabela com scroll independente */}
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <table className="w-full text-sm min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-[#0d1526]">
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-semibold text-white/30 px-5 py-3 w-28">Codigo</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Titulo</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Autores</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Editora</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">ISWC</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Status</th>
                <th className="text-center text-xs font-semibold text-white/30 px-4 py-3">Fonogramas</th>
                <th className="text-center text-xs font-semibold text-white/30 px-4 py-3">Ctrl %</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {obras.map(obra => {
                const links = normalizarLinksObra(obra._links ?? MOCK_OBRAS_LINKS[obra.id] ?? [])
                const todosParticipantes = links.flatMap((l: any) => l.titulares ?? [])
                const PAPEIS_EDI = ['editora_original', 'administradora', 'subeditora', 'E', 'AM', 'SE', 'AQ']
                const autores = todosParticipantes.filter((t: any) =>
                  !PAPEIS_EDI.includes(t.papel ?? '') && !PAPEIS_EDI.includes((t.papel ?? '').toUpperCase())
                )
                const editorasLinks = todosParticipantes.filter((t: any) =>
                  PAPEIS_EDI.includes(t.papel ?? '') || PAPEIS_EDI.includes((t.papel ?? '').toUpperCase())
                )
                const editora = editoras.find(e => e.id === obra.editora_id)
                const editoraNome = editora?.nome_fantasia ?? editorasLinks[0]?.nome ?? null
                const isAtiva = obraAtiva?.id === obra.id

                return (
                  <tr
                    key={obra.id}
                    onClick={() => setObraAtiva(isAtiva ? null : obra)}
                    className={`hover:bg-white/[0.03] transition-colors group cursor-pointer
                      ${isAtiva ? 'bg-violet-500/10 border-l-2 border-violet-500' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        {(obra.codigo_obra ?? obra.codigo) ? (
                          <span className="text-xs font-mono text-white/60">{obra.codigo_obra ?? obra.codigo}</span>
                        ) : (
                          <span className="text-xs text-white/20">—</span>
                        )}
                        {obra.codigo_interno_legado && (
                          <div>
                            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-1 py-0.5 rounded">
                              {obra.codigo_interno_legado}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isAtiva ? 'bg-violet-500/30' : 'bg-violet-500/10'}`}>
                          <Music className={`w-3.5 h-3.5 ${isAtiva ? 'text-violet-300' : 'text-violet-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-white/80 text-sm">{obra.titulo}</p>
                          {obra.genero && <p className="text-[11px] text-white/30">{obra.genero} · {obra.idioma}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center">
                        {autores.slice(0, 4).map((t: any, i: number) => (
                          <AvatarTitular key={t.id} nome={t.nome} idx={i} />
                        ))}
                        {autores.length > 4 && (
                          <span className="ml-1.5 text-[10px] text-white/40">+{autores.length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/50">{editoraNome ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <IswcBadge iswc={obra.iswc} />
                    </td>
                    <td className="px-4 py-3.5">
                      {(() => {
                        const st = (obra.status || obra.status_catalogo) as StatusObra
                        return (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_OBRA_COLORS[st] ?? 'bg-white/5 text-white/40'}`}>
                            {STATUS_OBRA_LABELS[st] ?? st ?? '—'}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Mic2 className="w-3 h-3 text-white/30" />
                        <span className="text-xs text-white/50">{obra._fonogramas_count ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <PctBadge value={obra._percentual_controlado ?? 0} color="bg-violet-500" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/master/obras/${obra.id}`}
                          onClick={e => e.stopPropagation()}
                          className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-sky-500/10 text-white/30 hover:text-sky-400 transition-all"
                          title="Abrir página completa"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <ChevronRight className={`w-4 h-4 transition-colors ${isAtiva ? 'text-violet-400 rotate-90' : 'text-white/20 group-hover:text-violet-400'}`} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {obrasLoading && (
            <div className="flex flex-col items-center gap-2 py-12 text-white/30">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
              <p className="text-sm">Carregando obras...</p>
            </div>
          )}

          {!obrasLoading && obras.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-white/30">
              <Music className="w-8 h-8" />
              <p className="text-sm">Nenhuma obra encontrada</p>
            </div>
          )}
        </div>
      </div>

      {obraAtiva && (
        <ObraDrawer obra={obraAtiva} onClose={() => setObraAtiva(null)} editoras={editoras} />
      )}
    </div>
  )
}
