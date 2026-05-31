'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, Plus, Check, X, Percent, Music, FileEdit,
  AlertTriangle, ShieldCheck, Calendar, Info,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import {
  DIREITO_CESSAO_LABELS, DIREITO_CESSAO_SIGLA, TODOS_DIREITOS_CESSAO,
} from '@/lib/types-contratos'
import type { DireitoCessao, Territorio } from '@/lib/types-contratos'
import { MOCK_CONTRATOS_CESSAO, CESSOES_MAP } from '@/lib/mock-cessao'

// ─── Obras disponíveis para adicionar ────────────────────────────────────────
const OBRAS_DISPONIVEIS = [
  { id: 'obra-009', codigo: 'OBR-2025-009', titulo: 'Luna Cheia',      percentual_autor: 100 },
  { id: 'obra-010', codigo: 'OBR-2025-010', titulo: 'Brisa do Mar',    percentual_autor: 75  },
  { id: 'obra-011', codigo: 'OBR-2025-011', titulo: 'Voz do Sertao',   percentual_autor: 50  },
  { id: 'obra-012', codigo: 'OBR-2025-012', titulo: 'Raiz Profunda',   percentual_autor: 100 },
]

type TipoAditivo = 'alteracao_percentual' | 'adicao_obras' | 'misto'

interface ObraNovaAditivo {
  obra_id: string
  titulo: string
  codigo: string
  percentual: number
  direitos: DireitoCessao[]
}

interface AlteracaoPercAditivo {
  obra_id: string
  titulo: string
  direito: DireitoCessao
  territorio: Territorio
  pct_titular_novo: number
  pct_editora_novo: number
  pct_titular_anterior: number
  pct_editora_anterior: number
}

interface AditivoForm {
  tipo: TipoAditivo
  descricao: string
  data_vigencia: string
  obras_novas: ObraNovaAditivo[]
  alteracoes: AlteracaoPercAditivo[]
  confirmado: boolean
}

export default function AditivoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const contrato = MOCK_CONTRATOS_CESSAO.find(c => c.id === id) ?? MOCK_CONTRATOS_CESSAO[0]
  const cessao = CESSOES_MAP[contrato.id] ?? null

  const [form, setForm] = useState<AditivoForm>({
    tipo: 'adicao_obras',
    descricao: '',
    data_vigencia: '',
    obras_novas: [],
    alteracoes: [],
    confirmado: false,
  })

  // Obras já no contrato (para alterar %)
  const obrasContrato = cessao?.obras_cessao ?? []

  // Toggle obra nova
  function toggleObraNova(obra: typeof OBRAS_DISPONIVEIS[0]) {
    setForm(f => {
      const exists = f.obras_novas.find(o => o.obra_id === obra.id)
      if (exists) return { ...f, obras_novas: f.obras_novas.filter(o => o.obra_id !== obra.id) }
      return {
        ...f,
        obras_novas: [...f.obras_novas, {
          obra_id: obra.id,
          titulo: obra.titulo,
          codigo: obra.codigo,
          percentual: obra.percentual_autor,
          direitos: TODOS_DIREITOS_CESSAO,
        }],
      }
    })
  }

  function updateObraNovaPerc(obraId: string, val: number) {
    setForm(f => ({ ...f, obras_novas: f.obras_novas.map(o => o.obra_id === obraId ? { ...o, percentual: val } : o) }))
  }

  function toggleDireitoNova(obraId: string, d: DireitoCessao) {
    setForm(f => ({
      ...f,
      obras_novas: f.obras_novas.map(o => {
        if (o.obra_id !== obraId) return o
        const dirs = o.direitos.includes(d) ? o.direitos.filter(x => x !== d) : [...o.direitos, d]
        return { ...o, direitos: dirs }
      }),
    }))
  }

  // Toggle alteração de %
  function toggleAlteracao(obraId: string, obraTitulo: string, direito: DireitoCessao, territorio: Territorio) {
    const key = `${obraId}-${direito}-${territorio}`
    const obra = obrasContrato.find(o => o.obra_id === obraId)
    const splits = obra?.splits[direito]?.filter(s => s.territorio === territorio) ?? []
    const split = splits[0]
    if (!split) return

    setForm(f => {
      const exists = f.alteracoes.find(a => a.obra_id === obraId && a.direito === direito && a.territorio === territorio)
      if (exists) return { ...f, alteracoes: f.alteracoes.filter(a => !(a.obra_id === obraId && a.direito === direito && a.territorio === territorio)) }
      return {
        ...f,
        alteracoes: [...f.alteracoes, {
          obra_id: obraId, titulo: obraTitulo, direito, territorio,
          pct_titular_anterior: split.pct_titular,
          pct_editora_anterior: split.pct_editora,
          pct_titular_novo: split.pct_titular,
          pct_editora_novo: split.pct_editora,
        }],
      }
    })
  }

  function updateAlteracao(obraId: string, direito: DireitoCessao, territorio: Territorio, field: 'pct_titular_novo' | 'pct_editora_novo', val: number) {
    const other: 'pct_titular_novo' | 'pct_editora_novo' = field === 'pct_titular_novo' ? 'pct_editora_novo' : 'pct_titular_novo'
    setForm(f => ({
      ...f,
      alteracoes: f.alteracoes.map(a => {
        if (!(a.obra_id === obraId && a.direito === direito && a.territorio === territorio)) return a
        return { ...a, [field]: val, [other]: 100 - val }
      }),
    }))
  }

  // Violação regra de ouro nas alterações
  const violacoesAlt = form.alteracoes.filter(a => a.territorio === 'BR' && a.pct_editora_novo > a.pct_titular_novo)

  const canSubmit = form.confirmado &&
    (form.obras_novas.length > 0 || form.alteracoes.length > 0) &&
    violacoesAlt.length === 0 &&
    !!form.descricao

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-1 text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <PageHeader
          title="Novo Aditivo Contratual"
          description={`${contrato.numero} · ${contrato.titular_principal}`}
        />
      </div>

      {/* Info do contrato base */}
      <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl px-4 py-3 flex items-center gap-3">
        <Info className="w-4 h-4 text-violet-400 shrink-0" />
        <div className="text-xs text-white/60">
          Aditivo vinculado ao contrato <span className="font-mono text-violet-400">{contrato.numero}</span> —
          {' '}{cessao ? `${cessao.obras_cessao.length} obras` : '—'} cedidas atualmente em vigor.
        </div>
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-7">

        {/* Tipo do aditivo */}
        <div>
          <h3 className="text-sm font-semibold text-white/70 mb-3">Tipo do Aditivo <span className="text-rose-400">*</span></h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'adicao_obras',          label: 'Adicao de Obras',         icon: <Plus className="w-4 h-4" /> },
              { id: 'alteracao_percentual',   label: 'Alteracao de %',          icon: <Percent className="w-4 h-4" /> },
              { id: 'misto',                  label: 'Misto',                   icon: <FileEdit className="w-4 h-4" /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setForm(f => ({ ...f, tipo: t.id as TipoAditivo }))}
                className={['rounded-lg border p-3 text-center transition-colors', form.tipo === t.id ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-white/[0.08] text-white/50 hover:border-white/20'].join(' ')}
              >
                <div className="flex justify-center mb-1">{t.icon}</div>
                <p className="text-xs font-semibold">{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs font-medium text-white/50 block mb-2">Descricao do Aditivo <span className="text-rose-400">*</span></label>
          <input
            type="text"
            value={form.descricao}
            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            placeholder="Ex: Inclusao de novas obras ao catalogo / Ajuste de percentuais..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        {/* Data de vigência */}
        <div>
          <label className="text-xs font-medium text-white/50 block mb-2">Data de Vigencia do Aditivo</label>
          <input
            type="date"
            value={form.data_vigencia}
            onChange={e => setForm(f => ({ ...f, data_vigencia: e.target.value }))}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        {/* Seção: adicionar obras */}
        {(form.tipo === 'adicao_obras' || form.tipo === 'misto') && (
          <div>
            <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-400" />
              Obras a Adicionar
            </h3>
            <div className="space-y-2">
              {OBRAS_DISPONIVEIS.map(o => {
                const sel = form.obras_novas.find(n => n.obra_id === o.id)
                return (
                  <div key={o.id} className={['rounded-lg border transition-colors', sel ? 'border-violet-500/40 bg-violet-500/5' : 'border-white/[0.08]'].join(' ')}>
                    <button
                      onClick={() => toggleObraNova(o)}
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      <div className={['w-4 h-4 rounded border flex items-center justify-center shrink-0', sel ? 'bg-violet-600 border-violet-600' : 'border-white/20'].join(' ')}>
                        {sel && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white/80">{o.titulo}</p>
                        <p className="text-xs text-white/40 font-mono">{o.codigo}</p>
                      </div>
                      <span className="text-xs text-white/40">{o.percentual_autor}% autoria</span>
                    </button>

                    {sel && (
                      <div className="px-10 pb-3 space-y-3">
                        <div>
                          <label className="text-xs text-white/40 block mb-1">Percentual cedido (%)</label>
                          <input
                            type="number" min={1} max={100}
                            value={sel.percentual}
                            onChange={e => updateObraNovaPerc(o.id, Number(e.target.value))}
                            className="w-32 text-center rounded px-2 py-1.5 text-sm font-bold text-white bg-white/[0.03] border border-white/[0.08] outline-none"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-white/40 mb-1.5">Direitos cedidos</p>
                          <div className="flex flex-wrap gap-1.5">
                            {TODOS_DIREITOS_CESSAO.map(d => (
                              <button
                                key={d}
                                onClick={() => toggleDireitoNova(o.id, d)}
                                className={['text-xs px-2 py-0.5 rounded-full border font-mono transition-colors', sel.direitos.includes(d) ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'border-white/10 text-white/30 hover:border-white/20'].join(' ')}
                              >
                                {DIREITO_CESSAO_SIGLA[d]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Seção: alterar % */}
        {(form.tipo === 'alteracao_percentual' || form.tipo === 'misto') && cessao && (
          <div>
            <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              Alterar Percentuais Existentes
            </h3>

            {/* Regra de ouro check */}
            {violacoesAlt.length > 0 && (
              <div className="bg-rose-500/8 border border-rose-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-rose-400 font-semibold flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Violacao da Regra de Ouro
                </p>
                {violacoesAlt.map((v, i) => (
                  <p key={i} className="text-xs text-rose-400/70">{v.titulo} — {DIREITO_CESSAO_SIGLA[v.direito]}: editora ({v.pct_editora_novo}%) &gt; titular ({v.pct_titular_novo}%) em BR</p>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {obrasContrato.map(obra => (
                <div key={obra.obra_id} className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-violet-400" />
                    <p className="text-sm font-medium text-white/80">{obra.titulo}</p>
                    <span className="text-xs text-white/40 font-mono">{obra.codigo}</span>
                  </div>

                  <div className="space-y-2">
                    {obra.direitos_cedidos.map(d => {
                      const brSplit = obra.splits[d]?.find(s => s.territorio === 'BR')
                      if (!brSplit) return null
                      const altKey = form.alteracoes.find(a => a.obra_id === obra.obra_id && a.direito === d && a.territorio === 'BR')
                      return (
                        <div key={d} className={['rounded-lg border p-3 transition-colors', altKey ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/[0.05]'].join(' ')}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-white/50 bg-white/[0.05] px-1.5 py-0.5 rounded">{DIREITO_CESSAO_SIGLA[d]}</span>
                              <span className="text-xs text-white/60">{DIREITO_CESSAO_LABELS[d]}</span>
                            </div>
                            <button
                              onClick={() => toggleAlteracao(obra.obra_id, obra.titulo, d, 'BR')}
                              className={['text-xs px-2.5 py-1 rounded-full border font-semibold transition-colors', altKey ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-white/10 text-white/30 hover:border-white/20'].join(' ')}
                            >
                              {altKey ? 'Alterar' : 'Selecionar'}
                            </button>
                          </div>

                          {altKey && (
                            <div className="mt-3 grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-[10px] text-white/30 uppercase tracking-wider">Atual</p>
                                <div className="flex gap-3 text-xs">
                                  <span className="text-emerald-400">{altKey.pct_titular_anterior}% titular</span>
                                  <span className="text-white/40">{altKey.pct_editora_anterior}% editora</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] text-amber-400/70 uppercase tracking-wider">Novo (BR)</p>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <label className="text-[10px] text-white/30">Titular</label>
                                    <input
                                      type="number" min={0} max={100}
                                      value={altKey.pct_titular_novo}
                                      onChange={e => updateAlteracao(obra.obra_id, d, 'BR', 'pct_titular_novo', Number(e.target.value))}
                                      className={['w-16 text-center rounded px-1.5 py-1 text-sm font-bold outline-none border', altKey.pct_editora_novo > altKey.pct_titular_novo ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' : 'border-white/[0.08] bg-white/[0.03] text-white'].join(' ')}
                                    />
                                  </div>
                                  <span className="text-white/30 mt-4">+</span>
                                  <div>
                                    <label className="text-[10px] text-white/30">Editora</label>
                                    <input
                                      type="number" min={0} max={100}
                                      value={altKey.pct_editora_novo}
                                      onChange={e => updateAlteracao(obra.obra_id, d, 'BR', 'pct_editora_novo', Number(e.target.value))}
                                      className={['w-16 text-center rounded px-1.5 py-1 text-sm font-bold outline-none border', altKey.pct_editora_novo > altKey.pct_titular_novo ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' : 'border-white/[0.08] bg-white/[0.03] text-white/70'].join(' ')}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo do aditivo */}
        {(form.obras_novas.length > 0 || form.alteracoes.length > 0) && (
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-4">
            <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Resumo do Aditivo</h4>
            {form.obras_novas.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-white/50 mb-1.5">Obras a adicionar ({form.obras_novas.length}):</p>
                {form.obras_novas.map(o => (
                  <div key={o.obra_id} className="flex items-center gap-2 text-xs text-white/60">
                    <Plus className="w-3 h-3 text-emerald-400" />
                    {o.titulo} — {o.percentual}% — {o.direitos.length} direitos
                  </div>
                ))}
              </div>
            )}
            {form.alteracoes.length > 0 && (
              <div>
                <p className="text-xs text-white/50 mb-1.5">Alteracoes de % ({form.alteracoes.length}):</p>
                {form.alteracoes.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                    <Percent className="w-3 h-3 text-amber-400" />
                    {a.titulo} · {DIREITO_CESSAO_SIGLA[a.direito]} · {a.territorio}:
                    {' '}{a.pct_titular_anterior}% → <span className="text-emerald-400">{a.pct_titular_novo}%</span> (titular)
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirmação */}
        <label className="flex items-start gap-3 cursor-pointer bg-white/[0.02] rounded-lg p-4 border border-white/[0.06] hover:border-white/10 transition-colors">
          <input
            type="checkbox"
            checked={form.confirmado}
            onChange={e => setForm(f => ({ ...f, confirmado: e.target.checked }))}
            className="accent-violet-500 mt-0.5"
          />
          <div>
            <p className="text-sm text-white/80 font-medium">Confirmo o aditivo acima</p>
            <p className="text-xs text-white/40 mt-0.5">
              O aditivo sera gerado como documento vinculado ao contrato {contrato.numero} e enviado para assinatura das partes.
            </p>
          </div>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Cancelar
          </button>
          <button
            onClick={() => router.push(`/master/contratos/${id}`)}
            disabled={!canSubmit}
            className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm text-white font-semibold transition-colors"
          >
            <Check className="w-4 h-4" /> Gerar Aditivo
          </button>
        </div>
      </div>
    </div>
  )
}
