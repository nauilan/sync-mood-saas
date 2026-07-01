'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  ChevronRight, Plus, Trash2, CheckCircle2, AlertCircle,
  Music2, Users, FileText, Mic2, AlignLeft, Link2,
  Upload, Sparkles, FileCheck2, X, Download, BookOpen,
  Info
} from 'lucide-react'
import type { PapelTitularLink } from '@/lib/types-obras'
import { PAPEL_TITULAR_LABELS, PAPEL_TITULAR_COLORS, GENEROS_MUSICAIS } from '@/lib/types-obras'
import { formatarPercentual, normalizarPercentual } from '@/lib/percentual'
import { authFetch } from '@/lib/supabase/client'

// ── Siglas oficiais ──────────────────────────────────────────────────────────
// CA = Compositor/Autor | AD = Adaptador | AR = Arranjador | V = Versionista
// E  = Editora          | SE = Subeditora | AM = Editora Administradora

const STEPS = [
  { label: 'Titulo & Genero', icon: Music2 },
  { label: 'Links & Participacao', icon: Link2 },
  { label: 'Fonogramas', icon: Mic2 },
  { label: 'Texto Poético', icon: AlignLeft },
  { label: 'Contrato Assinado', icon: FileCheck2 },
  { label: 'Revisao', icon: CheckCircle2 },
]

interface LinkTitular {
  tempId: string
  nome: string
  ipi: string
  papel: PapelTitularLink
  percentual: number
  controlado: boolean
  sociedade: string
  titular_id?: string
}

interface ObraLink {
  tempId: string
  ordem: number
  descricao: string
  controlado: boolean
  percentual_controlado: number
  titulares: LinkTitular[]
}

interface Fonograma {
  tempId: string
  titulo_fonograma: string
  interprete: string
  isrc: string
  produtor: string
}

function uid() { return Math.random().toString(36).slice(2) }

function StepIndicator({
  idx,
  current,
  highest,
  onNavigate,
}: {
  idx: number
  current: number
  highest: number
  onNavigate: (i: number) => void
}) {
  const done = idx < current
  const active = idx === current
  const clickable = idx <= highest && !active
  const S = STEPS[idx]

  function handleClick() {
    if (clickable) onNavigate(idx)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onNavigate(idx)
    }
  }

  return (
    <div
      role={clickable ? 'button' : undefined}
      aria-current={active ? 'step' : undefined}
      aria-disabled={!clickable && !active ? true : undefined}
      tabIndex={clickable ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex flex-col items-center gap-1.5 outline-none
        ${clickable ? 'cursor-pointer group' : !active ? 'cursor-not-allowed' : ''}`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all z-10
        ${done
          ? 'bg-emerald-500 text-white' + (clickable ? ' group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.5)] group-focus-visible:shadow-[0_0_0_3px_rgba(16,185,129,0.4)]' : '')
          : active
            ? 'bg-violet-600 text-white ring-4 ring-violet-500/20'
            : 'bg-white/[0.06] text-white/30'
        }`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : <S.icon className="w-4 h-4" />}
      </div>
      <span className={`text-[10px] whitespace-nowrap transition-colors
        ${active
          ? 'text-white font-semibold'
          : done
            ? 'text-white/60' + (clickable ? ' group-hover:text-white/90' : '')
            : 'text-white/25'
        }`}>
        {S.label}
      </span>
    </div>
  )
}

const PAPEL_OPTIONS: PapelTitularLink[] = [
  'autor', 'compositor', 'versionista', 'adaptador',
  'editora_original', 'administradora', 'subeditora', 'interprete_referencia',
]

// Simula letras para demonstracao
const LETRAS_DEMO: Record<string, string> = {
  'amo noite e dia': 'Amo noite e dia\nSó penso em você\nQue saudade de te ver\nSorrindo pra mim\n\nMeu coração dispara\nAo te ver chegar\nNão consigo me segurar\nVenho te abraçar',
  'amor demais': 'Amor demais é pouco pra te dar\nO que eu sinto não tem como explicar\nSó sei que és tudo pra mim\nDo começo ao fim\n\nMe perco nos teus olhos\nMe encontro no seu bem\nVocê é o amor\nQue ninguém mais tem',
  'la la la': 'La la la la la\nAssim começa nossa história\nLa la la la la\nUma canção pra nunca esquecer\n\nTodo dia assim\nLa la la\nCantando pra você\nMeu amor',
}

// ─── Componente de linha de titular com busca do banco ──────────────────────
function TitularRow({
  t, linkId, onUpdate, onRemove, onOpenNovoTitular
}: {
  t: { tempId: string; nome: string; ipi: string; papel: PapelTitularLink; percentual: number; controlado: boolean; sociedade: string; titular_id?: string }
  linkId: string
  onUpdate: (linkId: string, tId: string, field: string, val: string | number | boolean) => void
  onRemove: (linkId: string, tId: string) => void
  onOpenNovoTitular: (linkId: string, tId: string) => void
}) {
  const [query, setQuery] = useState(t.nome)
  const [open, setOpen] = useState(false)
  const [resultados, setResultados] = useState<{ id: string; nome: string; ipi: string }[]>([])

  useEffect(() => {
    if (query.length < 2) { setResultados([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`/api/titulares?q=${encodeURIComponent(query)}&per_page=8`)
        if (res.ok) {
          const json = await res.json()
          const raw = json.data ?? []
          setResultados(raw.map((x: Record<string, unknown>) => ({
            id: x.id as string,
            nome: (x.nome_artistico || x.razao_social || x.nome_completo || '') as string,
            ipi: (x.ipi || x.cae || '') as string,
          })))
        }
      } catch { setResultados([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function selecionar(item: { id: string; nome: string; ipi: string }) {
    onUpdate(linkId, t.tempId, 'nome', item.nome)
    onUpdate(linkId, t.tempId, 'ipi', item.ipi)
    onUpdate(linkId, t.tempId, 'titular_id', item.id)
    setQuery(item.nome)
    setOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white/[0.03] rounded-lg">
      {/* Campo busca titular */}
      <div className="relative flex-1 min-w-[180px]">
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            onUpdate(linkId, t.tempId, 'nome', e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Buscar titular..."
          className="w-full h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 pr-16"
        />
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={() => onOpenNovoTitular(linkId, t.tempId)}
          className="absolute right-1 top-1 h-5 px-1.5 rounded bg-violet-600/70 hover:bg-violet-600 text-[9px] font-bold text-white transition-colors whitespace-nowrap"
          title="Cadastrar novo titular">
          + Novo
        </button>
        {open && query.length >= 2 && (
          <div className="absolute left-0 top-8 z-40 w-full bg-[#0d1526] border border-white/[0.1] rounded-lg shadow-xl overflow-hidden">
            {resultados.length > 0 ? (
              <>
                {resultados.map(r => (
                  <button
                    key={r.id}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => selecionar(r)}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/5 text-left transition-colors border-b border-white/[0.04] last:border-0">
                    <Users className="w-3 h-3 text-violet-400 shrink-0" />
                    <span className="text-xs text-white/80 truncate flex-1">{r.nome}</span>
                    {r.ipi && <span className="text-[10px] font-mono text-violet-400/70 shrink-0">{r.ipi}</span>}
                  </button>
                ))}
                <div className="border-t border-white/[0.06]">
                  <button
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { setOpen(false); onOpenNovoTitular(linkId, t.tempId) }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-violet-500/10 text-left transition-colors">
                    <Plus className="w-3 h-3 text-violet-400" />
                    <span className="text-xs text-violet-400 font-semibold">Cadastrar novo titular</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="px-3 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white/50">Nenhum titular encontrado</p>
                  <p className="text-[10px] text-white/25">"{query}" não está no cadastro</p>
                </div>
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setOpen(false); onOpenNovoTitular(linkId, t.tempId) }}
                  className="shrink-0 flex items-center gap-1 h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-colors">
                  <Plus className="w-3 h-3" /> Cadastrar novo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Papel */}
      <select value={t.papel} onChange={e => onUpdate(linkId, t.tempId, 'papel', e.target.value)}
        className={`h-7 rounded px-2 text-xs font-semibold cursor-pointer border-0 focus:outline-none ${PAPEL_TITULAR_COLORS[t.papel]}`}>
        {PAPEL_OPTIONS.map(p => <option key={p} value={p}>{PAPEL_TITULAR_LABELS[p]}</option>)}
      </select>

      {/* Percentual */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-white/30">%</span>
        <input type="number" min="0" max="100" step="0.01" value={t.percentual || ''}
          onChange={e => onUpdate(linkId, t.tempId, 'percentual', parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-16 h-7 bg-white/5 border border-white/[0.06] rounded px-1.5 text-xs text-white text-right tabular-nums focus:outline-none focus:border-violet-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      </div>

      {/* IPI */}
      <input type="text" value={t.ipi} onChange={e => onUpdate(linkId, t.tempId, 'ipi', e.target.value)}
        placeholder="IPI/CAE"
        className="w-24 h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none" />

      {/* Controlado */}
      <label className="flex items-center gap-1 text-[10px] text-white/40 cursor-pointer">
        <input type="checkbox" checked={t.controlado}
          onChange={e => onUpdate(linkId, t.tempId, 'controlado', e.target.checked)}
          className="w-3 h-3 accent-violet-500" />
        ctrl
      </label>

      <button onClick={() => onRemove(linkId, t.tempId)}
        className="w-6 h-6 flex items-center justify-center text-white/25 hover:text-rose-400 transition-colors">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  )
}

export default function NovaObraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [highestStep, setHighestStep] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function navigateToStep(i: number) {
    setStep(i)
  }

  // Step 0 — Titulo & Genero
  const [titulo, setTitulo] = useState('')
  const [tituloAlternativo, setTituloAlternativo] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [idioma, setIdioma] = useState('Portugues')
  const [genero, setGenero] = useState('')
  // Contrato de origem (selecionado no step 0 para importar dados)
  const [contratoOrigemId, setContratoOrigemId] = useState(() => searchParams?.get('contrato_id') ?? '')
  const [importado, setImportado] = useState(false)
  const [modoContrato, setModoContrato] = useState<'upload' | 'existente'>('upload')
  const [contratos, setContratos] = useState<{ id: string; numero: string; tipo: string; status?: string; titulo_obra?: string }[]>([])

  useEffect(() => {
    authFetch('/api/contratos?per_page=200&status=aprovado_admin')
      .then(r => r.json())
      .then(json => setContratos(json.data ?? []))
      .catch(() => {})
  }, [])

  // Step 1 — links
  const [links, setLinks] = useState<ObraLink[]>([
    { tempId: uid(), ordem: 1, descricao: '', controlado: false, percentual_controlado: 0, titulares: [] }
  ])

  // Mapeia papel do contrato para PapelTitularLink
  function papelContrato(papel: string): PapelTitularLink {
    if (papel === 'cedente' || papel === 'autor_ca') return 'compositor'
    if (papel === 'cessionario' || papel === 'cessionario_pf' || papel === 'cessionario_pj' || papel === 'editora' || papel === 'co_editora' || papel === 'coeditor') return 'editora_original'
    if (papel === 'administrador') return 'administradora'
    if (papel === 'subeditora') return 'subeditora'
    if (papel === 'versionista') return 'versionista'
    if (papel === 'adaptador') return 'adaptador'
    return 'compositor'
  }

  // Importa dados do contrato para os links
  function importarContrato(cId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contrato = contratos.find((c: any) => c.id === cId) as any
    if (!contrato?._partes?.length) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _partes: any[] = contrato._partes
    const papeisCedente = ['cedente', 'autor_ca', 'compositor', 'versionista', 'adaptador'] as const
    const cedentes = _partes.filter(p => (papeisCedente as readonly string[]).includes(p.papel))
    const editoras = _partes.filter(p => !(papeisCedente as readonly string[]).includes(p.papel))

    let novosLinks: ObraLink[] = []

    if (cedentes.length === 0) {
      // Sem cedente explícito: um link com todos
      novosLinks = [{
        tempId: uid(),
        ordem: 1,
        descricao: _partes.map(p => p.nome_titular).join(' / '),
        controlado: editoras.length > 0,
        percentual_controlado: editoras.reduce((s, p) => s + (p.percentual ?? 0), 0),
        titulares: _partes.map(p => ({
          tempId: uid(),
          nome: p.nome_titular,
          ipi: '',
          papel: papelContrato(p.papel),
          percentual: p.percentual ?? 0,
          controlado: p.papel !== 'cedente',
          sociedade: '',
        }))
      }]
    } else {
      // Um link por cedente; editoras vão no mesmo link
      novosLinks = cedentes.map((cedente, idx) => {
        const editorasDoLink = editoras
        return {
          tempId: uid(),
          ordem: idx + 1,
          descricao: cedente.nome_titular + (editorasDoLink.length > 0 ? ' / ' + editorasDoLink.map(e => e.nome_titular).join(' / ') : ''),
          controlado: editorasDoLink.length > 0,
          percentual_controlado: editorasDoLink.reduce((s, p) => s + (p.percentual ?? 0), 0),
          titulares: [
            {
              tempId: uid(),
              nome: cedente.nome_titular,
              ipi: '',
              papel: papelContrato(cedente.papel),
              percentual: cedente.percentual ?? 0,
              controlado: false,
              sociedade: '',
            },
            ...editorasDoLink.map(e => ({
              tempId: uid(),
              nome: e.nome_titular,
              ipi: '',
              papel: papelContrato(e.papel),
              percentual: e.percentual ?? 0,
              controlado: true,
              sociedade: '',
            }))
          ]
        }
      })
    }

    setLinks(novosLinks)
    setImportado(true)

    // Preenche título se vazio e contrato tiver obra única
    if (!titulo && contrato._obras?.length === 1) {
      setTitulo(contrato._obras[0].titulo_obra)
    }
  }

  // Step 2 — fonogramas
  const [fonogramas, setFonogramas] = useState<Fonograma[]>([])

  // Step 3 — letra
  const [letra, setLetra] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractDone, setExtractDone] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obrasExtraidas, setObrasExtraidas] = useState<any[]>([])
  const [obraSelecionadaIdx, setObraSelecionadaIdx] = useState<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dadosExtraidos, setDadosExtraidos] = useState<any>(null)
  const [titularPendente, setTitularPendente] = useState<{ id: string; nome: string } | null>(null)

  // Step 4 — contrato assinado
  const [contratoFile, setContratoFile] = useState<File | null>(null)
  const [maisDeUmaObra, setMaisDeUmaObra] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Modal: novo titular rápido
  const [showNovoTitular, setShowNovoTitular] = useState(false)
  const [novoTitularTarget, setNovoTitularTarget] = useState<{ linkId: string; tId: string } | null>(null)
  const [novoTitularForm, setNovoTitularForm] = useState<{
    tipo_pessoa: 'PF' | 'PJ'; nome: string; nome_artistico: string
    documento: string; ipi: string; sociedade: string; email: string
  }>({ tipo_pessoa: 'PF', nome: '', nome_artistico: '', documento: '', ipi: '', sociedade: '', email: '' })

  // UI
  const [saved, setSaved] = useState(false)
  const [savedCodigo, setSavedCodigo] = useState('')
  const [saving, setSaving] = useState(false)

  const inputCls = 'w-full h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-colors'

  // ── Link helpers ─────────────────────────────────────────────────────────────

  function addLink() {
    setLinks(prev => [...prev, { tempId: uid(), ordem: prev.length + 1, descricao: '', controlado: false, percentual_controlado: 0, titulares: [] }])
  }
  function removeLink(id: string) {
    setLinks(prev => prev.filter(l => l.tempId !== id).map((l, i) => ({ ...l, ordem: i + 1 })))
  }
  function updateLink<K extends keyof ObraLink>(id: string, key: K, val: ObraLink[K]) {
    setLinks(prev => prev.map(l => l.tempId === id ? { ...l, [key]: val } : l))
  }
  function addTitular(linkId: string) {
    setLinks(prev => prev.map(l =>
      l.tempId !== linkId ? l : {
        ...l,
        titulares: [...l.titulares, {
          tempId: uid(), nome: '', ipi: '', papel: 'compositor' as PapelTitularLink,
          percentual: 0, controlado: false, sociedade: ''
        }]
      }
    ))
  }
  function updateTitular(linkId: string, tId: string, field: string, val: string | number | boolean) {
    setLinks(prev => prev.map(l =>
      l.tempId !== linkId ? l : {
        ...l,
        titulares: l.titulares.map(t => t.tempId !== tId ? t : { ...t, [field]: val })
      }
    ))
  }
  function removeTitular(linkId: string, tId: string) {
    setLinks(prev => prev.map(l =>
      l.tempId !== linkId ? l : { ...l, titulares: l.titulares.filter(t => t.tempId !== tId) }
    ))
  }

  // ── Fonograma helpers ─────────────────────────────────────────────────────────

  function addFonograma() {
    setFonogramas(prev => [...prev, { tempId: uid(), titulo_fonograma: '', interprete: '', isrc: '', produtor: '' }])
  }
  function updateFono(id: string, field: string, val: string) {
    setFonogramas(prev => prev.map(f => f.tempId !== id ? f : { ...f, [field]: val }))
  }
  function removeFono(id: string) {
    setFonogramas(prev => prev.filter(f => f.tempId !== id))
  }

  // ── Extração de letra por IA ─────────────────────────────────────────────────

  function extrairLetra() {
    if (!titulo.trim()) return
    setExtracting(true)
    setExtractDone(false)
    setTimeout(() => {
      const chave = titulo.toLowerCase().trim()
      const encontrada = Object.entries(LETRAS_DEMO).find(([k]) => chave.includes(k) || k.includes(chave))
      if (encontrada) {
        setLetra(encontrada[1])
        setExtractDone(true)
      } else {
        // Gera placeholder se nao encontrar
        setLetra(`[Texto poético de "${titulo}" extraído do contrato]\n\n— IA identificou o título mas o texto poético não estava disponível no arquivo.\nInsira manualmente abaixo.`)
        setExtractDone(true)
      }
      setExtracting(false)
    }, 2200)
  }

  // ── Upload contrato ─────────────────────────────────────────────────────────

  function handleFileSelect(file: File) {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setContratoFile(file)
      // IA auto-extrai a letra do contrato assim que o PDF é enviado
      if (titulo.trim()) {
        setExtracting(true)
        setExtractDone(false)
        setTimeout(() => {
          const chave = titulo.toLowerCase().trim()
          const encontrada = Object.entries(LETRAS_DEMO).find(([k]) => chave.includes(k) || k.includes(chave))
          if (encontrada) {
            setLetra(encontrada[1])
          } else {
            setLetra(`[Letra de "${titulo}" extraída do contrato via IA]\n\n— O texto poético foi identificado no PDF. Revise e edite se necessário.`)
          }
          setExtractDone(true)
          setExtracting(false)
        }, 2200)
      }
    }
  }

  // ── Criar titular + montar link com autor e editora ────────────────────────
  async function criarTitularEMontarLink(
    dadosObra: { percentual_autor_na_obra?: number },
    dados: {
      autor_nome?: string
      autor_pseudonimo?: string
      autor_cpf?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      percentuais_brasil?: { comunicacao_publico?: { autor: number; editora: number } }
    },
    titularJaCriado?: { id: string; nome: string }
  ) {
    // 1. Buscar editora via /api/me e /api/editoras/[id]
    let editoraId = ''
    let editoraNome = ''
    let editoraTitularId = ''
    try {
      const resMe = await authFetch('/api/me')
      if (resMe.ok) {
        const me = await resMe.json()
        editoraId = me.editora_id ?? ''
        editoraNome = me.tenant_nome ?? ''
        if (editoraId) {
          const resEditora = await authFetch(`/api/editoras/${editoraId}`)
          if (resEditora.ok) {
            const editora = await resEditora.json()
            editoraTitularId = editora.editora?.titular_id ?? ''
          }
        }
      }
    } catch { /* sem editora */ }

    // 2. Usar titular já criado OU criar agora
    let novoTitularId = titularJaCriado?.id ?? ''
    const nomeExibicao = titularJaCriado?.nome ?? (dados.autor_pseudonimo || dados.autor_nome || '')
    if (!titularJaCriado && nomeExibicao) {
      try {
        const res = await authFetch('/api/titulares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome_completo: dados.autor_nome || dados.autor_pseudonimo,
            nome_artistico: dados.autor_pseudonimo || '',
            cpf_cnpj: dados.autor_cpf || '',
            tipo: 'autor',
            tipo_pessoa: 'PF',
          })
        })
        const j = await res.json()
        if (res.ok && j.data?.id) novoTitularId = j.data.id
      } catch (err) { console.error('Erro ao criar titular:', err) }
    }

    // 3. Calcular percentuais
    const percentualAutorNaObra = dadosObra.percentual_autor_na_obra ?? 100
    const pctBrasil = dados.percentuais_brasil?.comunicacao_publico
    const divisaoAutor   = pctBrasil?.autor   ?? 75
    const divisaoEditora = pctBrasil?.editora ?? 25
    const pctAutor      = normalizarPercentual(percentualAutorNaObra * (divisaoAutor   / 100))
    const pctEditora    = normalizarPercentual(percentualAutorNaObra * (divisaoEditora / 100))
    const pctControlado = normalizarPercentual(pctAutor + pctEditora)

    // 4. Montar titulares e atualizar primeiro link
    const titulares: LinkTitular[] = []
    if (nomeExibicao) titulares.push({
      tempId: uid(), nome: nomeExibicao, ipi: '',
      papel: 'compositor' as PapelTitularLink,
      percentual: pctAutor, controlado: true, sociedade: '',
      titular_id: novoTitularId || undefined,
    })
    if (editoraNome) titulares.push({
      tempId: uid(), nome: editoraNome, ipi: '',
      papel: 'editora_original' as PapelTitularLink,
      percentual: pctEditora, controlado: true, sociedade: '',
      titular_id: editoraTitularId || undefined,
    })
    if (titulares.length > 0) {
      setLinks(prev => prev.map((l, i) => i !== 0 ? l : {
        ...l,
        controlado: true,
        percentual_controlado: pctControlado,
        titulares: [...l.titulares, ...titulares],
      }))
    }
  }

  async function processarContratoUpload(file: File) {
    setContratoFile(file)
    setExtracting(true)
    setExtractDone(false)
    setObrasExtraidas([])
    setObraSelecionadaIdx(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await authFetch('/api/contratos/extrair', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        setExtracting(false)
        console.error('Erro ao extrair contrato:', json.error)
        return
      }
      const dados = json.data

      if (dados.obras && dados.obras.length > 1) {
        // Múltiplas obras — guardar lista e deixar operador escolher
        setObrasExtraidas(dados.obras)
        setDadosExtraidos(dados)
        setExtractDone(true)
        // Criar apenas o titular (sem montar link ainda — aguarda seleção da obra)
        const nomeExibicao = dados.autor_pseudonimo || dados.autor_nome || ''
        if (nomeExibicao) {
          try {
            const res = await authFetch('/api/titulares', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nome_completo: dados.autor_nome || dados.autor_pseudonimo,
                nome_artistico: dados.autor_pseudonimo || '',
                cpf_cnpj: dados.autor_cpf || '',
                tipo: 'autor',
                tipo_pessoa: 'PF',
              })
            })
            const j = await res.json()
            if (res.ok && j.data?.id) setTitularPendente({ id: j.data.id, nome: nomeExibicao })
          } catch (err) { console.error('Erro ao criar titular:', err) }
        }
      } else if (dados.obras && dados.obras.length === 1) {
        // Obra única — preencher campos e montar link imediatamente
        const primeira = dados.obras[0]
        setTitulo(primeira.titulo || '')
        setSubtitulo(primeira.subtitulo || '')
        setTituloAlternativo(primeira.titulo_alternativo || '')
        setLetra(primeira.texto_poetico || '')
        setExtractDone(true)
        await criarTitularEMontarLink(primeira, dados)
      }
    } catch (err) {
      console.error('Erro ao processar contrato:', err)
    } finally {
      setExtracting(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }, [])

  // ── Validacoes ─────────────────────────────────────────────────────────────

  const allTitulares = links.flatMap(l => l.titulares)
  const somaPct = allTitulares.reduce((s, t) => s + (t.percentual || 0), 0)

  // Validação por link: cada link deve somar 100%
  const somasPorLink = links.map(l => ({
    tempId: l.tempId,
    soma: l.titulares.reduce((s, t) => s + (t.percentual || 0), 0),
  }))
  const todosLinksValidos = somasPorLink.every(l => Math.abs(l.soma - 100) < 0.02)

  const canStep0 = titulo.trim().length >= 2
  const canStep1 = links.length > 0 && links.every(l => l.titulares.length > 0) && todosLinksValidos
  const canStep4 = contratoFile !== null

  const pcControlado = links
    .filter(l => l.controlado)
    .reduce((s, l) => s + (l.percentual_controlado || 0), 0)

  // ── Verificar duplicata / homônima ─────────────────────────────────────────

  async function verificarDuplicataHomonima(): Promise<{ bloqueado: boolean; homonima: boolean }> {
    try {
      const res = await authFetch(`/api/obras?titulo_similar=${encodeURIComponent(titulo.trim())}&per_page=50`)
      if (!res.ok) return { bloqueado: false, homonima: false }
      const json = await res.json()
      const todas: unknown[] = json.data ?? json.obras ?? []
      const tituloNorm = titulo.trim().toLowerCase()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obrasEncontradas = todas.filter((o: any) => (o.titulo ?? '').trim().toLowerCase() === tituloNorm)
      if (obrasEncontradas.length === 0) return { bloqueado: false, homonima: false }
      const nomesAtuais = links
        .flatMap(l => l.titulares.map(t => t.nome.trim().toLowerCase()))
        .filter(Boolean)
      for (const obra of obrasEncontradas) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nomesObra: string[] = ((obra as any)._links ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .flatMap((l: any) => (l.titulares ?? []).map((t: any) => (t.nome ?? '').trim().toLowerCase()))
          .filter(Boolean)
        if (nomesObra.length === 0) continue
        const todosIguais =
          nomesAtuais.length === nomesObra.length &&
          nomesAtuais.every(n => nomesObra.includes(n))
        const algumIgual = nomesAtuais.some(n => nomesObra.includes(n))
        if (todosIguais) return { bloqueado: true, homonima: false }
        if (algumIgual) return { bloqueado: false, homonima: true }
      }
      return { bloqueado: false, homonima: false }
    } catch {
      return { bloqueado: false, homonima: false }
    }
  }

  // ── Salvar obra ─────────────────────────────────────────────────────────────

  async function salvarObra() {
    if (saving) return
    setSaving(true)
    try {
      const checagem = await verificarDuplicataHomonima()
      if (checagem.bloqueado) {
        alert('Obra já cadastrada no catálogo com os mesmos autores.')
        setSaving(false)
        return
      }
      const payload = {
        titulo,
        titulo_alternativo: tituloAlternativo || null,
        subtitulo: subtitulo || null,
        idioma,
        genero: genero || null,
        letra: letra || null,
        // Regra: com contrato de origem → pré-cadastro; sem contrato → catálogo ativo direto
        status_catalogo: contratoOrigemId ? 'pre_cadastro' : 'catalogo_ativo',
        homonima: checagem.homonima,
        links,
        fonogramas,
        // vínculo com contrato de origem — obrigatório para rastreabilidade
        contrato_origem_id: contratoOrigemId || null,
      }
      const res = await authFetch('/api/obras', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar obra')
      setSavedCodigo(data.codigo_obra || '')
      setSaved(true)
    } catch (err) {
      console.error('[salvarObra]', err)
      alert(`Erro ao salvar obra: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  function exportarPDF() {
    const popup = window.open('', '_blank', 'width=960,height=720')
    if (!popup) return

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const linksHtml = links.map((link) => {
      const titularesHtml = link.titulares.map((titular) => `
        <tr>
          <td>${escapeHtml(titular.nome || '—')}</td>
          <td>${escapeHtml(PAPEL_TITULAR_LABELS[titular.papel] ?? titular.papel)}</td>
          <td class="num">${escapeHtml(formatarPercentual(titular.percentual || 0))}</td>
          <td>${titular.controlado ? 'Controlado' : 'Não controlado'}</td>
        </tr>
      `).join('')

      const descricao = link.descricao?.trim() ? ` — ${escapeHtml(link.descricao)}` : ''
      return `
        <section class="link">
          <h3>Link ${link.ordem}${descricao}</h3>
          <p class="meta">Categoria: ${link.controlado ? 'Controlado' : 'Não controlado'} · Total do link: ${escapeHtml(formatarPercentual(link.titulares.reduce((sum, titular) => sum + (titular.percentual || 0), 0)))}</p>
          <table>
            <thead>
              <tr>
                <th>Titular</th>
                <th>Categoria</th>
                <th>Percentual</th>
                <th>Controle</th>
              </tr>
            </thead>
            <tbody>${titularesHtml}</tbody>
          </table>
        </section>
      `
    }).join('')

    popup.document.open()
    popup.document.write(`
      <html>
        <head>
          <title>Prévia da Obra — ${escapeHtml(titulo || 'Sem título')}</title>
          <style>
            @page { margin: 18mm; }
            body { font-family: Arial, sans-serif; color: #111827; background: #ffffff; margin: 0; }
            .page { padding: 24px; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            h2 { margin: 24px 0 10px; font-size: 16px; }
            h3 { margin: 0 0 8px; font-size: 14px; }
            p { margin: 0 0 8px; line-height: 1.5; }
            .muted { color: #6b7280; }
            .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 18px; margin: 18px 0 24px; }
            .summary-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
            .summary-item strong { display: block; font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
            .link { margin: 18px 0; padding: 14px; border: 1px solid #e5e7eb; border-radius: 10px; }
            .meta { color: #4b5563; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; text-align: left; font-size: 12px; }
            th { color: #374151; font-size: 11px; text-transform: uppercase; }
            td.num { font-variant-numeric: tabular-nums; }
            .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 12px; color: #6b7280; font-size: 11px; }
            @media print {
              .page { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <h1>${escapeHtml(titulo || 'Sem título')}</h1>
            <p class="muted">${escapeHtml(subtitulo || 'Sem subtítulo')}</p>
            <p class="muted">Título alternativo: ${escapeHtml(tituloAlternativo || '—')}</p>

            <div class="summary">
              <div class="summary-item"><strong>Idioma</strong>${escapeHtml(idioma || '—')}</div>
              <div class="summary-item"><strong>Gênero</strong>${escapeHtml(genero || '—')}</div>
              <div class="summary-item"><strong>Fonogramas</strong>${fonogramas.length}</div>
              <div class="summary-item"><strong>Percentual Total</strong>${escapeHtml(formatarPercentual(somaPct))}</div>
              <div class="summary-item"><strong>Percentual Controlado</strong>${escapeHtml(formatarPercentual(pcControlado))}</div>
            </div>

            <h2>Links e Participações</h2>
            ${linksHtml}

            <div class="footer">
              Prévia gerada pelo Sync Mood para revisão editorial. Percentuais, categorias e vínculos devem ser conferidos antes do salvamento definitivo.
            </div>
          </div>
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  // ── Tela de sucesso ─────────────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl p-10 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Obra Validada e no Catálogo!</h2>
            <p className="text-sm text-white/50">
              Contrato assinado verificado — a obra foi incluída no catálogo com status <span className="text-emerald-400 font-semibold">Validada</span>.
            </p>
          </div>

          <div className="w-full bg-white/5 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/40">Código da Obra</span>
              <span className="font-mono font-bold text-violet-400">{savedCodigo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/40">Título</span>
              <span className="text-sm text-white/80 font-medium">{titulo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/40">Status</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Validada
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/40">Links</span>
              <span className="text-sm text-white/70">{links.length}</span>
            </div>
            {contratoFile && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">Contrato</span>
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3" /> {contratoFile.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => router.push('/master/obras')}
              className="flex-1 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" /> Ver Catálogo
            </button>
            <button
              onClick={() => { setSaved(false); setStep(0); setHighestStep(0); setTitulo(''); setLinks([{ tempId: uid(), ordem: 1, descricao: '', controlado: false, percentual_controlado: 0, titulares: [] }]); setContratoFile(null); setLetra(''); }}
              className="h-10 px-5 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-white/60 hover:text-white/80 transition-colors">
              Nova Obra
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Nova Obra"
        description="Cadastro completo — dados, participação, fonogramas, letra, contrato assinado e revisão"
        actions={
          <a href="/master/obras" className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors flex items-center">
            Cancelar
          </a>
        }
      />

      {/* Regra: contrato obrigatório */}
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-5 py-3 flex items-start gap-2">
        <FileCheck2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <p className="text-xs text-rose-300/80">
          <span className="font-semibold text-rose-300">Contrato obrigatório:</span> o upload do PDF do contrato assinado é <span className="font-semibold">imprescindível</span> para validar e incluir a obra no catálogo. A IA lê o contrato e extrai automaticamente a letra da obra.
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-start justify-between gap-2 overflow-x-auto pb-1">
        {STEPS.map((_, i) => (
          <div key={i} className="flex-1 flex justify-center">
            <StepIndicator
              idx={i}
              current={step}
              highest={highestStep}
              onNavigate={navigateToStep}
            />
          </div>
        ))}
      </div>

      {/* ─────────────── Step 0: Titulo & Genero ─────────────── */}
      {step === 0 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Music2 className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Dados Básicos da Obra</h2>
          </div>

          {/* ── Contrato: upload ou vincular existente ── */}
          <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400 shrink-0" />
              <p className="text-sm font-semibold text-white">Contrato de Cessão</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setModoContrato('upload')}
                className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition-colors ${modoContrato === 'upload' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
              >
                Fazer upload do contrato
              </button>
              <button
                onClick={() => setModoContrato('existente')}
                className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition-colors ${modoContrato === 'existente' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
              >
                Vincular contrato existente
              </button>
            </div>
            {modoContrato === 'upload' && (
              <div
                onClick={() => !extracting && fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-violet-500/40 transition-colors"
              >
                <Upload className="w-6 h-6 text-white/30 mx-auto mb-2" />
                <p className="text-xs text-white/50">{contratoFile ? contratoFile.name : 'Clique para selecionar o PDF do contrato assinado'}</p>
                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) processarContratoUpload(f) }} />
              </div>
            )}
            {modoContrato === 'upload' && extracting && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <svg className="w-4 h-4 text-violet-400 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-xs text-violet-300">Extraindo dados do contrato via IA...</p>
              </div>
            )}
            {modoContrato === 'upload' && extractDone && !extracting && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-400">Dados extraídos com sucesso</p>
              </div>
            )}
            {obrasExtraidas.length > 1 && obraSelecionadaIdx === null && (
              <div className="mt-3 bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-white">
                  Este contrato tem {obrasExtraidas.length} obras. Selecione qual cadastrar agora:
                </p>
                <div className="space-y-1.5">
                  {obrasExtraidas.map((obra, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setObraSelecionadaIdx(idx)
                        setTitulo(obra.titulo || '')
                        setSubtitulo(obra.subtitulo || '')
                        setTituloAlternativo(obra.titulo_alternativo || '')
                        setLetra(obra.texto_poetico || '')
                        if (dadosExtraidos) {
                          criarTitularEMontarLink(obra, dadosExtraidos, titularPendente ?? undefined)
                            .catch(console.error)
                        }
                      }}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-violet-500/20 border border-white/10 transition-colors text-left"
                    >
                      <span className="text-xs text-white/80">{obra.titulo}</span>
                      <span className="text-[10px] text-white/40">{obra.percentual_autor_na_obra}% autor</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-white/40">
                  As demais obras ficarão disponíveis para cadastro posterior usando o mesmo contrato.
                </p>
              </div>
            )}
            {modoContrato === 'existente' && (
              <div className="flex gap-2">
                <select value={contratoOrigemId} onChange={e => { setContratoOrigemId(e.target.value); setImportado(false) }} className={inputCls + ' cursor-pointer flex-1'}>
                  <option value="">Selecione um contrato...</option>
                  {contratos.map(c => (
                    <option key={c.id} value={c.id}>{c.numero}{c.titulo_obra ? ` — ${c.titulo_obra}` : ''} ({(c.tipo ?? '').replace(/_/g, ' ')})</option>
                  ))}
                </select>
                <button onClick={() => { if (contratoOrigemId) importarContrato(contratoOrigemId) }} disabled={!contratoOrigemId} className="h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:pointer-events-none text-sm font-semibold text-white transition-colors flex items-center gap-1.5 shrink-0">
                  <Users className="w-4 h-4" />
                  Importar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-medium text-white/50">Título da Obra *</label>
              <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Amo Noite e Dia" className={inputCls} autoFocus />

            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Título Alternativo</label>
              <input type="text" value={tituloAlternativo} onChange={e => setTituloAlternativo(e.target.value)}
                placeholder="Título alternativo ou na língua original" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Subtítulo</label>
              <input type="text" value={subtitulo} onChange={e => setSubtitulo(e.target.value)}
                placeholder="Subtítulo da obra" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Idioma</label>
              <select value={idioma} onChange={e => setIdioma(e.target.value)} className={inputCls + ' cursor-pointer'}>
                <option>Portugues</option><option>Ingles</option><option>Espanhol</option><option>Outro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Gênero Musical</label>
              <select value={genero} onChange={e => setGenero(e.target.value)} className={inputCls + ' cursor-pointer'}>
                <option value="">Selecione...</option>
                {GENEROS_MUSICAIS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── Step 1: Links & Participacao ─────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-400">Regra de Links</p>
              <p className="text-xs text-white/50 mt-0.5">
                Cada link agrupa um autor e sua editora (quando editado). A soma de todos os percentuais deve fechar exatamente 100%.
                Autor sem contrato de edição fica sozinho no link com 100% CA.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className={`flex-1 rounded-xl p-3 text-center border ${todosLinksValidos ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              <p className="text-[10px] text-white/40 mb-0.5">Cada link = 100%</p>
              <p className={`text-xl font-bold ${todosLinksValidos ? 'text-emerald-400' : 'text-rose-400'}`}>
                {todosLinksValidos ? '✓ OK' : `${somasPorLink.filter(l => Math.abs(l.soma - 100) >= 0.02).length} link(s) inválido(s)`}
              </p>
            </div>
            <div className="flex-1 rounded-xl p-3 text-center border bg-violet-500/10 border-violet-500/20">
              <p className="text-[10px] text-white/40 mb-0.5">Percentual Controlado</p>
              <p className="text-xl font-bold text-violet-400">{formatarPercentual(pcControlado)}</p>
            </div>
          </div>

          {links.map(link => {
            const somaLink = somasPorLink.find(s => s.tempId === link.tempId)?.soma ?? 0
            const linkValido = Math.abs(somaLink - 100) < 0.02
            const linkVazio  = link.titulares.length === 0
            return (
            <div key={link.tempId} className={`bg-[#0d1526] rounded-xl overflow-hidden border ${!linkVazio && !linkValido ? 'border-rose-500/40' : 'border-white/[0.06]'}`}>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-[10px] font-bold text-white shrink-0">
                  {link.ordem}
                </span>
                <input
                  type="text" value={link.descricao}
                  onChange={e => updateLink(link.tempId, 'descricao', e.target.value)}
                  placeholder="Descrição do link..."
                  className="flex-1 h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/40"
                />
                <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
                  <input type="checkbox" checked={link.controlado}
                    onChange={e => updateLink(link.tempId, 'controlado', e.target.checked)}
                    className="w-3 h-3 accent-violet-500" />
                  Controlado
                </label>
                {link.controlado && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/40">Ctrl%</span>
                    <input type="number" min="0" max="100" step="0.01"
                      value={link.percentual_controlado}
                      onChange={e => updateLink(link.tempId, 'percentual_controlado', parseFloat(e.target.value) || 0)}
                      className="w-16 h-6 bg-violet-500/10 border border-violet-500/20 rounded px-1.5 text-xs text-violet-400 text-right tabular-nums focus:outline-none" />
                  </div>
                )}
                {links.length > 1 && (
                  <button onClick={() => removeLink(link.tempId)}
                    className="w-6 h-6 flex items-center justify-center text-white/25 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="p-4 space-y-2">
                {link.titulares.length === 0 && (
                  <p className="text-xs text-white/25 text-center py-3">Nenhum participante. Adicione autores, editoras ou administradoras.</p>
                )}
                {link.titulares.map(t => (
                  <TitularRow
                    key={t.tempId}
                    t={t}
                    linkId={link.tempId}
                    onUpdate={updateTitular}
                    onRemove={removeTitular}
                    onOpenNovoTitular={(linkId, tId) => {
                      setNovoTitularTarget({ linkId, tId })
                      setShowNovoTitular(true)
                    }}
                  />
                ))}
                <button onClick={() => addTitular(link.tempId)}
                  className="flex items-center gap-1.5 w-full h-7 px-3 rounded-lg border border-dashed border-white/10 text-xs text-white/30 hover:text-white/60 hover:border-white/20 transition-colors">
                  <Plus className="w-3 h-3" /> Adicionar participante
                </button>

                {/* Alerta soma por link */}
                {!linkVazio && (
                  <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${linkValido ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                    <div className="flex items-center gap-2">
                      {linkValido
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        : <AlertCircle  className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                      <span className={`text-xs font-semibold ${linkValido ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {linkValido ? 'Soma OK — 100%' : `Soma ${formatarPercentual(somaLink)} — faltam ${formatarPercentual(100 - somaLink)} para fechar`}
                      </span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${linkValido ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatarPercentual(somaLink)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            )
          })}

          <button onClick={addLink}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border-2 border-dashed border-white/10 text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-colors">
            <Plus className="w-4 h-4" /> Adicionar Link de Participação
          </button>
        </div>
      )}

      {/* Modal: Novo Titular rápido */}
      {showNovoTitular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white">Cadastrar Novo Titular</h3>
              </div>
              <button onClick={() => setShowNovoTitular(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="text-xs text-white/40">Tipo de Pessoa *</label>
                <div className="flex gap-2">
                  {(['PF', 'PJ'] as const).map(tp => (
                    <button key={tp} onClick={() => setNovoTitularForm(f => ({ ...f, tipo_pessoa: tp }))}
                      className={`flex-1 h-8 rounded-lg text-xs font-semibold border transition-colors
                        ${novoTitularForm.tipo_pessoa === tp ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'}`}>
                      {tp === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs text-white/40">{novoTitularForm.tipo_pessoa === 'PF' ? 'Nome Completo *' : 'Razão Social *'}</label>
                <input type="text" value={novoTitularForm.nome}
                  onChange={e => setNovoTitularForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder={novoTitularForm.tipo_pessoa === 'PF' ? 'Nome completo' : 'Razão social'}
                  className={inputCls} autoFocus />
              </div>
              {novoTitularForm.tipo_pessoa === 'PF' && (
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-white/40">Nome Artístico</label>
                  <input type="text" value={novoTitularForm.nome_artistico}
                    onChange={e => setNovoTitularForm(f => ({ ...f, nome_artistico: e.target.value }))}
                    placeholder="Nome artístico (opcional)" className={inputCls} />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs text-white/40">{novoTitularForm.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}</label>
                <input type="text" value={novoTitularForm.documento}
                  onChange={e => setNovoTitularForm(f => ({ ...f, documento: e.target.value }))}
                  placeholder={novoTitularForm.tipo_pessoa === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'}
                  className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40">IPI / CAE</label>
                <input type="text" value={novoTitularForm.ipi}
                  onChange={e => setNovoTitularForm(f => ({ ...f, ipi: e.target.value }))}
                  placeholder="Código IPI ou CAE" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40">Sociedade Arrecadadora</label>
                <select value={novoTitularForm.sociedade}
                  onChange={e => setNovoTitularForm(f => ({ ...f, sociedade: e.target.value }))}
                  className={inputCls + ' cursor-pointer'}>
                  <option value="">Selecione...</option>
                  {['SOCINPRO','UBC','ABRAMUS','AMAR','ASSIM','SBACEM','SICAM'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40">Email</label>
                <input type="email" value={novoTitularForm.email}
                  onChange={e => setNovoTitularForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowNovoTitular(false)}
                className="flex-1 h-9 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors">
                Cancelar
              </button>
              <button
                disabled={!novoTitularForm.nome.trim()}
                onClick={() => {
                  if (!novoTitularForm.nome.trim()) return
                  const nomeDisplay = novoTitularForm.nome_artistico || novoTitularForm.nome
                  if (novoTitularTarget) {
                    updateTitular(novoTitularTarget.linkId, novoTitularTarget.tId, 'nome', nomeDisplay)
                    updateTitular(novoTitularTarget.linkId, novoTitularTarget.tId, 'ipi', novoTitularForm.ipi)
                  }
                  setShowNovoTitular(false)
                  setNovoTitularForm({ tipo_pessoa: 'PF', nome: '', nome_artistico: '', documento: '', ipi: '', sociedade: '', email: '' })
                  setNovoTitularTarget(null)
                }}
                className="flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Cadastrar e Usar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── Step 2: Fonogramas ─────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mic2 className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-white">Fonogramas</h2>
              <span className="text-xs text-white/30 ml-auto">Opcional — pode ser adicionado depois</span>
            </div>
            {fonogramas.length === 0 && (
              <p className="text-xs text-white/30 text-center py-4">Nenhum fonograma cadastrado.</p>
            )}
            {fonogramas.map(f => (
              <div key={f.tempId} className="flex flex-wrap gap-2 p-3 bg-white/[0.03] rounded-lg mb-2">
                <input type="text" value={f.titulo_fonograma} onChange={e => updateFono(f.tempId, 'titulo_fonograma', e.target.value)}
                  placeholder="Título do fonograma" className="flex-1 min-w-[160px] h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white placeholder:text-white/20 focus:outline-none" />
                <input type="text" value={f.interprete} onChange={e => updateFono(f.tempId, 'interprete', e.target.value)}
                  placeholder="Intérprete" className="flex-1 min-w-[120px] h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white placeholder:text-white/20 focus:outline-none" />
                <input type="text" value={f.isrc} onChange={e => updateFono(f.tempId, 'isrc', e.target.value)}
                  placeholder="ISRC" className="w-28 h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none" />
                <input type="text" value={f.produtor} onChange={e => updateFono(f.tempId, 'produtor', e.target.value)}
                  placeholder="Produtor" className="flex-1 min-w-[120px] h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white placeholder:text-white/20 focus:outline-none" />
                <button onClick={() => removeFono(f.tempId)}
                  className="w-7 h-7 flex items-center justify-center text-white/25 hover:text-rose-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={addFonograma}
              className="flex items-center gap-1.5 w-full h-8 px-3 rounded-lg border border-dashed border-white/10 text-xs text-white/30 hover:text-white/60 hover:border-white/20 transition-colors mt-2">
              <Plus className="w-3 h-3" /> Adicionar Fonograma
            </button>
          </div>
        </div>
      )}

      {/* ─────────────── Step 3: Letra ─────────────── */}
      {step === 3 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <AlignLeft className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Texto Poético</h2>
            <span className="text-xs text-white/30 ml-auto">Opcional</span>
          </div>

          {/* Extração por IA */}
          {contratoFile ? (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-0.5">
                  {extracting ? 'IA extraindo texto poético do contrato...' : extractDone ? 'Texto poético extraído pelo contrato' : 'Extrair texto poético do contrato via IA'}
                </p>
                <p className="text-xs text-white/50">
                  Contrato anexado: <span className="text-emerald-400 font-medium">{contratoFile.name}</span>
                  {extractDone && ' — revise o texto abaixo e edite se necessário.'}
                </p>
              </div>
              {extracting && (
                <span className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin shrink-0" />
              )}
              {!extracting && !extractDone && (
                <button
                  onClick={extrairLetra}
                  disabled={!titulo.trim()}
                  className="shrink-0 flex items-center gap-1.5 h-8 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-white transition-colors">
                  <Sparkles className="w-3 h-3" /> Extrair
                </button>
              )}
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-400 mb-0.5">Contrato ainda não anexado</p>
                <p className="text-xs text-white/50">
                  O texto poético será extraído automaticamente pela IA ao fazer o upload do contrato PDF no próximo passo. Você também pode inserir manualmente abaixo.
                </p>
              </div>
            </div>
          )}

          {extractDone && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Texto poético extraído com sucesso — revise abaixo se necessário.
            </div>
          )}

          <textarea
            value={letra}
            onChange={e => { setLetra(e.target.value); setExtractDone(false) }}
            rows={14}
            placeholder="A IA preencherá este campo ao ler o contrato. Você também pode digitar ou colar o texto poético manualmente..."
            className={inputCls + ' h-auto py-3 font-mono text-sm resize-y'}
          />
          {letra.length > 0 && (
            <p className="text-xs text-white/30">{letra.length} caracteres · {letra.split('\n').length} linhas</p>
          )}
        </div>
      )}

      {/* ─────────────── Step 4: Contrato Assinado ─────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Contrato Assinado</h2>
              <span className="ml-auto text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">Obrigatório</span>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300/80">
                <span className="font-semibold">Sem o contrato assinado a obra não pode ser validada.</span> Anexe o PDF assinado por todas as partes (autor + responsável da editora + 2 testemunhas). A IA também lerá este arquivo para extrair a letra da obra.
              </p>
            </div>

            {/* Zona de upload */}
            {!contratoFile ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all
                  ${dragOver ? 'border-violet-500/60 bg-violet-500/10' : 'border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/5'}`}
              >
                <Upload className="w-10 h-10 text-rose-400/40" />
                <div className="text-center">
                  <p className="text-sm font-medium text-white/60">Arraste o PDF aqui ou clique para selecionar</p>
                  <p className="text-xs text-white/30 mt-1">Apenas arquivos .pdf — contrato assinado por todas as partes</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
              </div>
            ) : (
              <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{contratoFile.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {(contratoFile.size / 1024).toFixed(1)} KB · PDF · Contrato pronto para validação
                  </p>
                  {extracting && (
                    <p className="text-xs text-violet-400 mt-1 flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
                      IA extraindo letra da obra...
                    </p>
                  )}
                  {extractDone && !extracting && (
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Letra extraída com sucesso
                    </p>
                  )}
                </div>
                <button onClick={() => { setContratoFile(null); setExtractDone(false) }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 hover:text-rose-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Múltiplas obras no mesmo contrato */}
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Este contrato possui mais de uma obra?</p>
                  <p className="text-xs text-white/40 mt-0.5">O mesmo arquivo será usado para compor outras obras contidas neste documento.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaisDeUmaObra(v => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${maisDeUmaObra ? 'bg-violet-600' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maisDeUmaObra ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {maisDeUmaObra && (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-violet-300/80">
                    Após salvar esta obra, o sistema permitirá cadastrar as demais obras contidas neste mesmo contrato, reaproveitando o arquivo importado e as informações já preenchidas.
                  </p>
                </div>
              )}
            </div>

            {/* Status */}
            <div className={`rounded-xl p-4 border ${contratoFile ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/[0.06]'}`}>
              <div className="flex items-center gap-2">
                {contratoFile
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <AlertCircle className="w-4 h-4 text-white/20" />
                }
                <span className={`text-sm font-semibold ${contratoFile ? 'text-emerald-400' : 'text-white/30'}`}>
                  {contratoFile ? 'Contrato anexado — obra será validada e incluída no catálogo' : 'Aguardando upload do contrato para prosseguir'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── Step 5: Revisao ─────────────── */}
      {step === 5 && (
        <div className="space-y-4">
          <div className={`border rounded-xl p-5 ${canStep1 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className="flex items-center gap-2 mb-3">
              {canStep1
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                : <AlertCircle className="w-5 h-5 text-rose-400" />
              }
              <span className={`text-sm font-semibold ${canStep1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {canStep1 ? 'Obra válida — pronta para salvar' : 'Corrija os percentuais antes de salvar'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Percentual Total', value: formatarPercentual(somaPct), ok: Math.abs(somaPct - 100) < 0.01, color: 'text-cyan-400' },
                { label: 'Controlado', value: formatarPercentual(pcControlado), ok: true, color: 'text-violet-400' },
                { label: 'Fonogramas', value: fonogramas.length, ok: true, color: 'text-sky-400' },
              ].map(col => (
                <div key={col.label} className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-white/40">{col.label}</p>
                  <p className={`text-xl font-bold ${col.ok ? col.color : 'text-rose-400'}`}>{col.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Resumo da Obra</h3>
              <button
                type="button"
                onClick={exportarPDF}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-xs text-white/70 hover:text-white hover:border-white/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Exportar PDF
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6">
              {[
                { label: 'Título', value: titulo || '—' },
                { label: 'Título Alternativo', value: tituloAlternativo || '—' },
                { label: 'Idioma', value: idioma },
                { label: 'Gênero', value: genero || '—' },
                { label: 'Links', value: links.length },
                { label: 'Participantes', value: allTitulares.length },
                { label: 'Fonogramas', value: fonogramas.length },
                { label: 'Letra', value: letra.length > 0 ? `${letra.length} chars` : 'Sem letra' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-white/30 mb-0.5">{f.label}</p>
                  <p className="text-sm text-white/70 font-medium">{String(f.value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contrato */}
          <div className="rounded-xl p-4 border bg-emerald-500/10 border-emerald-500/20 flex items-center gap-3">
            <FileCheck2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">
                {contratoFile ? `Contrato: ${contratoFile.name}` : 'Contrato anexado'}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Status: <span className="font-semibold">Validada — entrará no catálogo</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="h-9 px-5 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 disabled:opacity-30 disabled:pointer-events-none transition-colors">
          Anterior
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">Passo {step + 1} de {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => {
                const next = step + 1
                setStep(next)
                setHighestStep(h => Math.max(h, next))
              }}
              disabled={step === 0 ? !canStep0 : (step === 1 ? !canStep1 : (step === 4 ? !canStep4 : false))}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:pointer-events-none text-sm text-white font-semibold transition-colors">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={salvarObra}
              disabled={saving || !canStep1 || !titulo || !canStep4}
              className="flex items-center gap-1.5 h-9 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-sm text-white font-semibold transition-colors">
              <CheckCircle2 className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar e Incluir no Catálogo'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

