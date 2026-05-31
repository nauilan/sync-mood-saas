'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Check, Upload, FileText, Music,
  AlertCircle, CheckCircle2, RefreshCw, X, Users, DollarSign,
  Calendar, Building2, Eye, Zap,
} from 'lucide-react'
import { parseB55Text, aggregateB55 } from '@/lib/parse-b55'
import type { B55ParseResult, B55Aggregated } from '@/lib/parse-b55'
import { MOCK_OBRAS } from '@/lib/mock-obras'
import {
  DISTRIBUICAO_TIPO_DESTINO_LABELS,
  DISTRIBUICAO_TIPO_DESTINO_COLORS,
  type DistribuicaoItemTipoDestino,
} from '@/lib/types-distribuicao'
import {
  PERIODOS_ABERTOS,
} from '@/lib/mock-periodos-distribuicao'
import { TIPO_PERIODO_LABELS, type PeriodoDistribuicao } from '@/lib/types-periodo-distribuicao'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Lógica de distribuição (mesmas regras do pipeline Python) ────────────────

interface DistItem {
  titular_nome: string
  tipo_destino: DistribuicaoItemTipoDestino
  percentual_aplicado: number
  valor_bruto: number
  obra_codigo: string
  obra_titulo: string
}

interface ObraDistribuida {
  obra_codigo: string
  obra_titulo: string
  total_recebido: number
  statement_ids: string[]
  publisher: string
  source: string
  start_date: string
  end_date: string
  itens: DistItem[]
  nao_identificada?: boolean
}

function calcularDistribuicao(aggregated: B55Aggregated[]): {
  obras: ObraDistribuida[]
  nao_identificadas: B55Aggregated[]
  total_identificado: number
  total_nao_identificado: number
} {
  // índice rápido por código de obra
  const obraMap = new Map<string, (typeof MOCK_OBRAS)[number]>()
  for (const o of MOCK_OBRAS) {
    obraMap.set(String(o.codigo), o)
  }

  const obras: ObraDistribuida[] = []
  const nao_identificadas: B55Aggregated[] = []

  for (const row of aggregated) {
    const obra = obraMap.get(row.song_code)
    if (!obra) {
      nao_identificadas.push(row)
      continue
    }

    // Coletar participantes controlados por link
    // Regra: link controlado = tem editora (E ou AM) no mesmo link
    // Apenas esses participantes recebem distribuição
    const participantes: Array<{
      nome: string
      percentual: number
      tipo: DistribuicaoItemTipoDestino
    }> = []

    for (const link of (obra._links ?? [])) {
      // Verificar se link tem editora_original, administradora ou subeditora (link controlado)
      const titulares = link.titulares ?? []
      const hasEditora = titulares.some((t) =>
        t.papel === 'editora_original' || t.papel === 'subeditora' || t.papel === 'administradora'
      )
      if (!hasEditora) continue

      for (const t of titulares) {
        const papel = t.papel ?? ''
        let tipo: DistribuicaoItemTipoDestino = 'autor'
        if (papel === 'editora_original') tipo = 'editora'
        else if (papel === 'administradora') tipo = 'administradora'
        else if (papel === 'subeditora') tipo = 'subeditora'

        const pct = typeof t.percentual === 'number' ? t.percentual : parseFloat(t.percentual ?? '0')
        if (pct > 0) {
          participantes.push({ nome: t.nome ?? '?', percentual: pct, tipo })
        }
      }
    }

    if (participantes.length === 0) {
      nao_identificadas.push(row)
      continue
    }

    // Normalizar para 100%
    const somaTotal = participantes.reduce((s, p) => s + p.percentual, 0)
    const itens: DistItem[] = participantes.map(p => {
      const pctNorm = somaTotal > 0 ? (p.percentual / somaTotal) * 100 : 0
      return {
        titular_nome: p.nome,
        tipo_destino: p.tipo,
        percentual_aplicado: Math.round(pctNorm * 1e6) / 1e6,
        valor_bruto: Math.round(row.total * (pctNorm / 100) * 1e9) / 1e9,
        obra_codigo: obra.codigo,
        obra_titulo: obra.titulo,
      }
    })

    obras.push({
      obra_codigo: obra.codigo,
      obra_titulo: obra.titulo,
      total_recebido: row.total,
      statement_ids: [row.statement_id],
      publisher: row.publisher,
      source: row.source,
      start_date: row.start_date,
      end_date: row.end_date,
      itens,
    })
  }

  const total_identificado = obras.reduce((s, o) => s + o.total_recebido, 0)
  const total_nao_identificado = nao_identificadas.reduce((s, r) => s + r.total, 0)
  return { obras, nao_identificadas, total_identificado, total_nao_identificado }
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [
  'Período & Arquivo',
  'Preview do Cálculo',
  'Retenções',
  'Revisão e Execução',
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((label, idx) => {
        const step = idx + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                done   ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' :
                active ? 'border-violet-500 bg-violet-500/20 text-violet-300' :
                         'border-white/20 bg-white/5 text-slate-500'
              }`}>
                {done ? <Check className="h-4 w-4" /> : step}
              </div>
              <span className={`mt-1 text-[10px] whitespace-nowrap max-w-[80px] text-center ${
                active ? 'text-violet-300' : done ? 'text-emerald-400' : 'text-slate-500'
              }`}>{label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-2 mb-4 ${done ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Período (cadastrado) + Upload ────────────────────────────────────

interface UploadedFile {
  filename: string
  result: B55ParseResult
  aggregated: B55Aggregated[]
}

function Step1({
  periodoId, setPeriodoId,
  files, setFiles,
  loading, setLoading,
}: {
  periodoId: string
  setPeriodoId: (v: string) => void
  files: UploadedFile[]
  setFiles: (f: UploadedFile[]) => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const periodoSel = PERIODOS_ABERTOS.find(p => p.id === periodoId)

  function processFiles(fileList: FileList) {
    setLoading(true)
    const results: UploadedFile[] = []
    let remaining = fileList.length
    Array.from(fileList).forEach(f => {
      const reader = new FileReader()
      reader.onload = e => {
        const text = e.target?.result as string
        const result = parseB55Text(text, f.name)
        const aggregated = aggregateB55(result)
        results.push({ filename: f.name, result, aggregated })
        remaining--
        if (remaining === 0) {
          setFiles([...files, ...results])
          setLoading(false)
        }
      }
      reader.readAsText(f, 'utf-8')
    })
  }

  function removeFile(idx: number) {
    setFiles(files.filter((_, i) => i !== idx))
  }

  const totalValor = files.reduce((s, f) => s + f.result.total_valor, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Período de Distribuição & Arquivo</h2>
        <p className="text-sm text-slate-400">Selecione um período aberto e suba os arquivo(s) TXT do BackOffice.</p>
      </div>

      {/* Seleção do período cadastrado */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">
          Período de Distribuição
          <Link href="/master/distribuicao/periodos" className="ml-2 text-violet-400 hover:text-violet-300 transition-colors">
            + Criar novo período
          </Link>
        </label>

        {PERIODOS_ABERTOS.length === 0 ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
            Nenhum período aberto disponível.{' '}
            <Link href="/master/distribuicao/periodos" className="underline text-red-200">Crie um período primeiro.</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PERIODOS_ABERTOS.map(p => (
              <button key={p.id} onClick={() => setPeriodoId(p.id)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  periodoId === p.id
                    ? 'border-violet-500/50 bg-violet-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-extrabold font-mono text-white tracking-tight">{p.codigo}</span>
                  <span className="text-[10px] border border-white/10 bg-white/5 rounded-full px-2 py-0.5 text-white/40">
                    {TIPO_PERIODO_LABELS[p.tipo]}
                  </span>
                </div>
                <p className="text-xs text-white/60">{p.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{p.data_inicio} → {p.data_fim}</p>
                {p.total_previsto > 0 && (
                  <p className="text-[10px] text-sky-400 mt-1">
                    Já atribuído: {fmtBRL(p.total_previsto)}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {periodoSel && (
          <div className="mt-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-violet-300">
            ✓ Período <strong>{periodoSel.codigo}</strong> — {periodoSel.label} selecionado.
            {periodoSel.data_prevista_pagamento && ` Previsão de pagamento: ${periodoSel.data_prevista_pagamento}`}
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-violet-500/70 bg-violet-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files) }}
      >
        <input ref={fileRef} type="file" accept=".txt" multiple className="hidden"
          onChange={e => { if (e.target.files?.length) processFiles(e.target.files); e.target.value = '' }} />
        {loading
          ? <RefreshCw className="w-7 h-7 text-violet-400 mx-auto mb-2 animate-spin" />
          : <Upload className="w-7 h-7 text-white/20 mx-auto mb-2" />}
        <p className="text-sm font-medium text-white/60 mb-1">
          {loading ? 'Processando...' : 'Arraste ou clique para selecionar arquivo(s) TXT'}
        </p>
        <p className="text-xs text-white/30">Formato B-55 fixed-width (BackOffice Music Services / UBEM)</p>
      </div>

      {/* Arquivos carregados */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <FileText className="w-4 h-4 text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-white/80 truncate">{f.filename}</p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {f.result.statement_id} · {f.result.source} · {f.result.total_linhas} linhas · {fmtBRL(f.result.total_valor)}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <button onClick={() => removeFile(idx)} className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white/60">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
            <span className="text-xs text-white/50">{files.length} arquivo(s) · {files.reduce((s, f) => s + f.result.total_linhas, 0)} linhas</span>
            <span className="text-sm font-bold text-emerald-400">{fmtBRL(totalValor)} total</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Prévia Salva ─────────────────────────────────────────────────────────────

function PreviaSalvaView({
  dist, periodo, files, onContinue,
}: {
  dist: ReturnType<typeof calcularDistribuicao>
  periodo: string
  files: UploadedFile[]
  onContinue: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-5 text-center">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-500/20 border border-sky-500/40">
          <Eye className="h-9 w-9 text-sky-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
          <Check className="h-4 w-4 text-emerald-400" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white">Distribuição Prévia criada!</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          Os valores estão disponíveis para consulta pelos autores e pela editora.<br/>
          Efetive quando estiver pronto para creditar nos CC Obra e CC Titular.
        </p>
      </div>

      {/* Resumo prévia */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
        {[
          { label: 'Período', value: periodo, color: 'text-sky-300' },
          { label: 'Obras identificadas', value: dist.obras.length, color: 'text-white' },
          { label: 'Total Previsto', value: fmtBRL(dist.total_identificado), color: 'text-emerald-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] text-white/40 mb-1">{k.label}</p>
            <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Onde a prévia aparece */}
      <div className="w-full max-w-lg rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-left space-y-2">
        <p className="text-xs font-semibold text-sky-300 mb-3">Prévia visível em:</p>
        {[
          { icon: Music,          label: 'CC Obra',             sub: 'Coluna "Saldo Previsto" em cada obra', href: '/master/cc-obra' },
          { icon: Users,          label: 'CC Titular',          sub: 'Card "Valor Previsto próxima dist." por titular', href: '/master/cc-titular' },
          { icon: Eye,            label: 'Portal do Autor',     sub: 'Seção "Próxima Distribuição" no app/web', href: '/portal/royalties-futuros' },
          { icon: Building2,      label: 'Distribuições',       sub: 'Linha com status Prévia na lista', href: '/master/distribuicao' },
        ].map(({ icon: Icon, label, sub, href }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 rounded-lg hover:bg-sky-500/10 px-3 py-2 transition-colors group"
          >
            <Icon className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 group-hover:text-sky-300 transition-colors">{label}</p>
              <p className="text-[10px] text-white/40">{sub}</p>
            </div>
            <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-sky-400 transition-colors" />
          </Link>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex gap-3">
        <Link href="/master/distribuicao"
          className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Ver Distribuições
        </Link>
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 border border-violet-500/40 px-5 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/30 transition-colors"
        >
          <Zap className="h-4 w-4" /> Efetuar Distribuição agora
        </button>
      </div>
    </div>
  )
}



function Step2({ dist, onSalvarPrevia }: { dist: ReturnType<typeof calcularDistribuicao>; onSalvarPrevia: () => void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  function toggle(cod: string) {
    const n = new Set(expanded)
    n.has(cod) ? n.delete(cod) : n.add(cod)
    setExpanded(n)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Preview do Cálculo</h2>
        <p className="text-sm text-slate-400">Obras identificadas, percentuais normalizados e valores calculados por titular.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Obras identificadas', value: dist.obras.length, color: 'text-emerald-400' },
          { label: 'Não identificadas', value: dist.nao_identificadas.length, color: 'text-red-400' },
          { label: 'Valor identificado', value: fmtBRL(dist.total_identificado), color: 'text-white' },
          { label: 'Valor ONI', value: fmtBRL(dist.total_nao_identificado), color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] text-white/40 mb-1">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Lista de obras */}
      <div className="space-y-2">
        {dist.obras.map(obra => (
          <div key={obra.obra_codigo} className="rounded-xl border border-white/10 bg-white/5">
            <button
              onClick={() => toggle(obra.obra_codigo)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <Music className="w-4 h-4 text-violet-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{obra.obra_titulo}</p>
                  <p className="text-[10px] text-white/40">{obra.obra_codigo} · {obra.source} · {obra.start_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50">{obra.itens.length} titular(es)</span>
                <span className="text-sm font-bold text-violet-300">{fmtBRL(obra.total_recebido)}</span>
              </div>
            </button>

            {expanded.has(obra.obra_codigo) && (
              <div className="border-t border-white/10 px-4 py-3 space-y-2">
                {obra.itens.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-300 shrink-0">
                      {item.titular_nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 truncate">{item.titular_nome}</p>
                      <p className="text-[10px] text-white/40">{item.percentual_aplicado.toFixed(4)}% aplicado</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${DISTRIBUICAO_TIPO_DESTINO_COLORS[item.tipo_destino]}`}>
                      {DISTRIBUICAO_TIPO_DESTINO_LABELS[item.tipo_destino]}
                    </span>
                    <span className="text-xs font-semibold text-white/80 min-w-[80px] text-right">{fmtBRL(item.valor_bruto)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Não identificadas */}
        {dist.nao_identificadas.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-xs font-semibold text-red-400">{dist.nao_identificadas.length} obra(s) não identificada(s) no catálogo (ONI)</p>
            </div>
            <div className="space-y-1">
              {dist.nao_identificadas.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-white/40">
                  <span className="font-mono">{r.song_code}</span>
                  <span className="truncate mx-2">{r.song_title || '—'}</span>
                  <span className="text-red-300 shrink-0">{fmtBRL(r.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banner salvar como prévia */}
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-sky-300">Salvar como Distribuição Prévia</p>
              <p className="text-xs text-sky-300/60 mt-0.5">
                Torna os valores visíveis para autores e editora antes da efetivação. Ideal para planejar antecipações e adiantamentos.
              </p>
            </div>
          </div>
          <button
            onClick={onSalvarPrevia}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-sky-500/20 border border-sky-500/40 px-4 py-2.5 text-sm font-semibold text-sky-300 hover:bg-sky-500/30 transition-colors"
          >
            <Eye className="h-4 w-4" /> Salvar Prévia
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Retenções ────────────────────────────────────────────────────────

interface RetState {
  irpf: boolean
  irpf_pct: number
  iss: boolean
  iss_pct: number
}

function Step3({ dist, retencoes, setRetencoes }: {
  dist: ReturnType<typeof calcularDistribuicao>
  retencoes: Record<string, RetState>
  setRetencoes: (r: Record<string, RetState>) => void
}) {
  // Agregar itens por titular para configurar retenção
  const titularMap = new Map<string, { nome: string; tipo: DistribuicaoItemTipoDestino; total: number }>()
  for (const obra of dist.obras) {
    for (const item of obra.itens) {
      const ex = titularMap.get(item.titular_nome)
      if (ex) { ex.total += item.valor_bruto }
      else titularMap.set(item.titular_nome, { nome: item.titular_nome, tipo: item.tipo_destino, total: item.valor_bruto })
    }
  }

  function update(nome: string, patch: Partial<RetState>) {
    setRetencoes({ ...retencoes, [nome]: { ...retencoes[nome], ...patch } })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Retenções por Titular</h2>
        <p className="text-sm text-slate-400">Configure IRPF/ISS. Editoras PJ não têm retenção de IRPF.</p>
      </div>

      <div className="space-y-3">
        {Array.from(titularMap.values()).map(({ nome, tipo, total }) => {
          const r = retencoes[nome] ?? { irpf: false, irpf_pct: 15, iss: false, iss_pct: 2 }
          const isEditora = tipo === 'editora' || tipo === 'administradora'
          const irpfVal = r.irpf && !isEditora ? Math.round(total * r.irpf_pct) / 100 : 0
          const issVal  = r.iss ? Math.round(total * r.iss_pct) / 100 : 0
          const liquido = Math.max(0, total - irpfVal - issVal)

          return (
            <div key={nome} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300 shrink-0">
                  {nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{nome}</p>
                  <p className="text-[10px] text-white/40">{DISTRIBUICAO_TIPO_DESTINO_LABELS[tipo]}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">Bruto</p>
                  <p className="text-sm font-bold text-white">{fmtBRL(total)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* IRPF */}
                <div className={`rounded-lg border p-2.5 ${r.irpf && !isEditora ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/5'}`}>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={r.irpf && !isEditora} disabled={isEditora}
                      onChange={e => update(nome, { irpf: e.target.checked })}
                      className="h-3.5 w-3.5 accent-amber-500" />
                    <span className={`text-xs ${isEditora ? 'text-white/30' : 'text-white/70'}`}>
                      {isEditora ? 'Sem IRPF (PJ)' : 'IRPF'}
                    </span>
                  </label>
                  {r.irpf && !isEditora && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-white/40 mb-1">
                        <span>Alíquota</span><span className="text-amber-300">{r.irpf_pct}%</span>
                      </div>
                      <input type="range" min={0} max={27.5} step={0.5} value={r.irpf_pct}
                        onChange={e => update(nome, { irpf_pct: parseFloat(e.target.value) })}
                        className="w-full accent-amber-500" />
                    </div>
                  )}
                </div>
                {/* ISS */}
                <div className={`rounded-lg border p-2.5 ${r.iss ? 'border-sky-500/30 bg-sky-500/10' : 'border-white/10 bg-white/5'}`}>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={r.iss}
                      onChange={e => update(nome, { iss: e.target.checked })}
                      className="h-3.5 w-3.5 accent-sky-500" />
                    <span className="text-xs text-white/70">ISS</span>
                  </label>
                  {r.iss && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-white/40 mb-1">
                        <span>Alíquota</span><span className="text-sky-300">{r.iss_pct}%</span>
                      </div>
                      <input type="range" min={0} max={5} step={0.5} value={r.iss_pct}
                        onChange={e => update(nome, { iss_pct: parseFloat(e.target.value) })}
                        className="w-full accent-sky-500" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center rounded-lg bg-white/5 px-3 py-2 text-xs">
                <span className="text-white/40">Líquido estimado</span>
                <span className="font-bold text-emerald-400">{fmtBRL(liquido)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 4: Revisão e Execução ───────────────────────────────────────────────

function Step4({
  dist, periodo, files, retencoes, onSubmit,
}: {
  dist: ReturnType<typeof calcularDistribuicao>
  periodo: string
  files: UploadedFile[]
  retencoes: Record<string, RetState>
  onSubmit: () => void
}) {
  const totalBruto = dist.total_identificado
  const totalObras = dist.obras.length
  const totalTitulares = new Set(dist.obras.flatMap(o => o.itens.map(i => i.titular_nome))).size
  const stmts = [...new Set(files.map(f => f.result.statement_id))].join(', ')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Revisão Final</h2>
        <p className="text-sm text-slate-400">Confirme os dados antes de executar. Ao executar, os valores serão creditados no CC Obra e CC Titular.</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Período', value: periodo || '—', icon: Calendar, color: 'text-violet-300' },
          { label: 'Obras', value: totalObras, icon: Music, color: 'text-white' },
          { label: 'Titulares', value: totalTitulares, icon: Users, color: 'text-white' },
          { label: 'Total Bruto', value: fmtBRL(totalBruto), icon: DollarSign, color: 'text-emerald-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
            <k.icon className={`w-5 h-5 ${k.color} shrink-0`} />
            <div>
              <p className="text-[10px] text-white/40">{k.label}</p>
              <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Arquivos */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Arquivos processados</p>
        <div className="space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="font-mono text-white/70 truncate">{f.filename}</span>
              <span className="text-white/40 shrink-0 ml-2">{fmtBRL(f.result.total_valor)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela resumo por titular */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/10">
          <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Resumo por Titular</p>
        </div>
        <div className="max-h-[280px] overflow-y-auto divide-y divide-white/5">
          {(() => {
            const map = new Map<string, { nome: string; tipo: DistribuicaoItemTipoDestino; total: number }>()
            for (const obra of dist.obras) {
              for (const item of obra.itens) {
                const ex = map.get(item.titular_nome)
                if (ex) ex.total += item.valor_bruto
                else map.set(item.titular_nome, { nome: item.titular_nome, tipo: item.tipo_destino, total: item.valor_bruto })
              }
            }
            return Array.from(map.values())
              .sort((a, b) => b.total - a.total)
              .map(({ nome, tipo, total }) => {
                const r = retencoes[nome]
                const isEditora = tipo === 'editora' || tipo === 'administradora'
                const irpf = r?.irpf && !isEditora ? Math.round(total * (r.irpf_pct ?? 15)) / 100 : 0
                const iss  = r?.iss ? Math.round(total * (r.iss_pct ?? 2)) / 100 : 0
                const liq  = Math.max(0, total - irpf - iss)
                return (
                  <div key={nome} className="grid grid-cols-[1fr_80px_80px_90px] gap-2 px-4 py-2.5 items-center text-xs hover:bg-white/[0.02]">
                    <div>
                      <p className="text-white/80 truncate">{nome}</p>
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-medium mt-0.5 ${DISTRIBUICAO_TIPO_DESTINO_COLORS[tipo]}`}>
                        {DISTRIBUICAO_TIPO_DESTINO_LABELS[tipo]}
                      </span>
                    </div>
                    <p className="text-white/60 text-right">{fmtBRL(total)}</p>
                    <p className="text-red-300 text-right">{irpf + iss > 0 ? `- ${fmtBRL(irpf + iss)}` : '—'}</p>
                    <p className="text-emerald-400 font-semibold text-right">{fmtBRL(liq)}</p>
                  </div>
                )
              })
          })()}
        </div>
      </div>

      {dist.nao_identificadas.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {dist.nao_identificadas.length} obra(s) ONI não serão distribuídas — ficarão pendentes para matching.
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-6 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
        >
          <Check className="h-4 w-4" />
          Executar Distribuição → CC Obra / CC Titular
        </button>
      </div>
    </div>
  )
}

// ─── Success ──────────────────────────────────────────────────────────────────

function SuccessView({ dist, periodo }: { dist: ReturnType<typeof calcularDistribuicao>; periodo: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
      <CheckCircle2 className="h-16 w-16 text-emerald-400" />
      <h2 className="text-xl font-bold text-white">Distribuição executada com sucesso!</h2>
      <p className="text-sm text-slate-400 max-w-md">
        <strong className="text-white">{dist.obras.length} obras</strong> creditadas no CC Obra.<br />
        Valores distribuídos para <strong className="text-white">
          {new Set(dist.obras.flatMap(o => o.itens.map(i => i.titular_nome))).size} titulares
        </strong> no CC Titular.<br />
        Período: <strong className="text-violet-300">{periodo}</strong> — Total: <strong className="text-emerald-300">{fmtBRL(dist.total_identificado)}</strong>
      </p>
      <div className="flex gap-3 mt-4">
        <Link href="/master/cc-obra" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">
          <Music className="h-4 w-4" /> CC Obra
        </Link>
        <Link href="/master/cc-titular" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">
          <Users className="h-4 w-4" /> CC Titular
        </Link>
        <Link href="/master/distribuicao" className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 border border-violet-500/40 px-5 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/30 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Distribuições
        </Link>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NovaDistribuicaoPage() {
  const [step, setStep]           = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [previaSalva, setPreviaSalva] = useState(false)

  // Step 1 state
  const [periodoId, setPeriodoId] = useState('')
  const [files, setFiles]         = useState<UploadedFile[]>([])
  const [loading, setLoading]     = useState(false)

  const periodoSel = PERIODOS_ABERTOS.find(p => p.id === periodoId)
  const periodoLabel = periodoSel ? `${periodoSel.codigo} — ${periodoSel.label}` : ''

  // Step 3 state
  const [retencoes, setRetencoes] = useState<Record<string, RetState>>({})

  // Cálculo (derivado de files)
  const dist = calcularDistribuicao(
    files.flatMap(f => f.aggregated)
  )

  function next() { setStep(s => Math.min(4, s + 1)) }
  function back() { setStep(s => Math.max(1, s - 1)) }

  const canNext = step === 1
    ? !!periodoId && files.length > 0 && !loading
    : true

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6">
      <div className="mx-auto max-w-4xl space-y-6">

        <Link href="/master/distribuicao" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-violet-300 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Voltar para Distribuições
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white">Nova Distribuição</h1>
          <p className="text-sm text-slate-400 mt-1">Suba o arquivo TXT do BackOffice e distribua os valores por CC Obra e CC Titular</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          {submitted ? (
            <SuccessView dist={dist} periodo={periodoLabel} />
          ) : previaSalva ? (
            <PreviaSalvaView
              dist={dist} periodo={periodoLabel} files={files}
              onContinue={() => { setPreviaSalva(false); setStep(3) }}
            />
          ) : (
            <>
              <StepIndicator current={step} />

              <div className="min-h-[420px]">
                {step === 1 && (
                  <Step1
                    periodoId={periodoId} setPeriodoId={setPeriodoId}
                    files={files} setFiles={setFiles}
                    loading={loading} setLoading={setLoading}
                  />
                )}
                {step === 2 && <Step2 dist={dist} onSalvarPrevia={() => setPreviaSalva(true)} />}
                {step === 3 && <Step3 dist={dist} retencoes={retencoes} setRetencoes={setRetencoes} />}
                {step === 4 && (
                  <Step4
                    dist={dist} periodo={periodoLabel}
                    files={files} retencoes={retencoes}
                    onSubmit={() => setSubmitted(true)}
                  />
                )}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={back}
                  disabled={step === 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <span className="text-xs text-slate-500">Passo {step} de 4</span>
                {step < 4 ? (
                  <button
                    onClick={next}
                    disabled={!canNext || loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 border border-violet-500/40 px-4 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Próximo <ChevronRight className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
