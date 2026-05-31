'use client'

import { useState, useMemo } from 'react'
import {
  DollarSign, Plus, Edit, Trash2, Check, X, CheckCircle2, AlertCircle,
  Search,
} from 'lucide-react'
import { TV_PRECIFICACAO, TV_EXECUCOES } from '@/lib/mock-tv'
import { TV_TIPO_USO_LABELS, TV_TIPO_USO_COLORS } from '@/lib/types-tv'
import type { TvPrecificacao, TvTipoUso } from '@/lib/types-tv'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDuracao(min: number, max: number) {
  if (max >= 99999) return `${min}s+`
  return `${min}s – ${max}s`
}

// ── Editable row type ─────────────────────────────────────────────────────────

type EditValues = {
  emissora: string
  canal: string
  plataforma: string
  tipo_uso: TvTipoUso
  ano: number
  nacional: boolean
  duracao_min: number
  duracao_max: number
  valor_base: number
  moeda: string
}

function rowToEdit(row: TvPrecificacao): EditValues {
  return {
    emissora:   row.emissora,
    canal:      row.canal,
    plataforma: row.plataforma ?? '',
    tipo_uso:   row.tipo_uso,
    ano:        row.ano,
    nacional:   row.nacional,
    duracao_min: row.duracao_min,
    duracao_max: row.duracao_max,
    valor_base:  row.valor_base,
    moeda:       row.moeda,
  }
}

const EMPTY_EDIT: EditValues = {
  emissora: '', canal: '', plataforma: '', tipo_uso: 'tema', ano: 2026,
  nacional: true, duracao_min: 0, duracao_max: 120, valor_base: 0, moeda: 'BRL',
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PrecificacaoPage() {
  const [rows, setRows]               = useState<TvPrecificacao[]>(TV_PRECIFICACAO)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editValues, setEditValues]   = useState<EditValues>(EMPTY_EDIT)
  const [addingNew, setAddingNew]     = useState(false)
  const [newValues, setNewValues]     = useState<EditValues>(EMPTY_EDIT)

  // Filters
  const [fEmissora, setFEmissora]   = useState('')
  const [fCanal, setFCanal]         = useState('')
  const [fAno, setFAno]             = useState('')
  const [fTipoUso, setFTipoUso]     = useState<TvTipoUso | ''>('')

  // Preview modal
  const [showPreview, setShowPreview]     = useState(false)
  const [previewExecId, setPreviewExecId] = useState('')
  const [toast, setToast]                 = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Filtering ──
  const filtered = useMemo(() => rows.filter(r => {
    if (fEmissora && !r.emissora.toLowerCase().includes(fEmissora.toLowerCase())) return false
    if (fCanal    && !r.canal.toLowerCase().includes(fCanal.toLowerCase())) return false
    if (fAno      && r.ano !== Number(fAno)) return false
    if (fTipoUso  && r.tipo_uso !== fTipoUso) return false
    return true
  }), [rows, fEmissora, fCanal, fAno, fTipoUso])

  // ── Edit actions ──
  function startEdit(row: TvPrecificacao) {
    setEditingId(row.id)
    setEditValues(rowToEdit(row))
    setAddingNew(false)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function saveEdit() {
    setRows(prev => prev.map(r =>
      r.id === editingId
        ? { ...r, ...editValues, plataforma: editValues.plataforma || null }
        : r
    ))
    setEditingId(null)
    showToast('Linha atualizada com sucesso')
  }

  function deleteRow(id: string) {
    setRows(prev => prev.filter(r => r.id !== id))
    showToast('Linha removida')
  }

  // ── Add new row ──
  function startAdd() {
    setAddingNew(true)
    setNewValues(EMPTY_EDIT)
    setEditingId(null)
  }

  function cancelAdd() {
    setAddingNew(false)
  }

  function saveNew() {
    const newId = `tv-prec-${Date.now()}`
    const newRow: TvPrecificacao = {
      id: newId,
      ...newValues,
      plataforma: newValues.plataforma || null,
      territorio: 'BR',
    }
    setRows(prev => [newRow, ...prev])
    setAddingNew(false)
    showToast('Nova linha adicionada')
  }

  // ── Preview calculation ──
  const previewExec = TV_EXECUCOES.find(e => e.id === previewExecId) ?? null
  const previewPrec = rows.find(r =>
    r.emissora === previewExec?.emissora &&
    r.tipo_uso === previewExec?.tipo_uso
  ) ?? rows[0]
  const valorPreview = previewPrec
    ? previewPrec.valor_base * 0.625  // mock: 62.5% percentual controlado
    : 0

  // ── Shared cell/input styles ──
  const inputCls = 'h-7 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-violet-500/50 w-full transition-colors'
  const selectCls = 'h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white/60 focus:outline-none cursor-pointer focus:border-violet-500/50 transition-colors'

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Precificação TV</h1>
            <p className="text-sm text-white/40">{rows.length} linhas de precificação cadastradas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-violet-600/20 border border-violet-500/30 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5" /> Calcular Preview
          </button>
          <button
            onClick={startAdd}
            disabled={addingNew}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Linha
          </button>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-sm text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {toast}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 h-9 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Emissora..."
            value={fEmissora}
            onChange={e => setFEmissora(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 h-9 min-w-[140px]">
          <input
            type="text"
            placeholder="Canal..."
            value={fCanal}
            onChange={e => setFCanal(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 h-9 w-24">
          <input
            type="number"
            placeholder="Ano"
            value={fAno}
            onChange={e => setFAno(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
          />
        </div>
        <select value={fTipoUso} onChange={e => setFTipoUso(e.target.value as TvTipoUso | '')} className={selectCls}>
          <option value="">Todos tipos de uso</option>
          {(Object.keys(TV_TIPO_USO_LABELS) as TvTipoUso[]).map(k => (
            <option key={k} value={k}>{TV_TIPO_USO_LABELS[k]}</option>
          ))}
        </select>
        {(fEmissora || fCanal || fAno || fTipoUso) && (
          <button
            onClick={() => { setFEmissora(''); setFCanal(''); setFAno(''); setFTipoUso('') }}
            className="flex items-center gap-1 h-9 px-3 rounded-xl text-xs text-white/40 hover:text-white/70 bg-white/5 border border-white/[0.06] hover:bg-white/10 transition-colors"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
        <span className="ml-auto text-xs text-white/25 tabular-nums">{filtered.length} linhas</span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Emissora', 'Canal', 'Plataforma', 'Tipo Uso', 'Ano', 'Nacional', 'Duração', 'Valor Base', 'Moeda', 'Ações'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {/* ── New row form ── */}
              {addingNew && (
                <tr className="bg-violet-500/5 border-b border-violet-500/20">
                  {(['emissora', 'canal'] as const).map(field => (
                    <td key={field} className="px-3 py-2.5">
                      <input
                        type="text"
                        value={newValues[field]}
                        onChange={e => setNewValues(prev => ({ ...prev, [field]: e.target.value }))}
                        className={inputCls}
                        placeholder={field}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      value={newValues.plataforma}
                      onChange={e => setNewValues(prev => ({ ...prev, plataforma: e.target.value }))}
                      className={inputCls}
                      placeholder="plataforma"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={newValues.tipo_uso}
                      onChange={e => setNewValues(prev => ({ ...prev, tipo_uso: e.target.value as TvTipoUso }))}
                      className="h-7 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white focus:outline-none w-full"
                    >
                      {(Object.keys(TV_TIPO_USO_LABELS) as TvTipoUso[]).map(k => (
                        <option key={k} value={k}>{TV_TIPO_USO_LABELS[k]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <input type="number" value={newValues.ano} onChange={e => setNewValues(prev => ({ ...prev, ano: Number(e.target.value) }))} className={inputCls} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <input type="checkbox" checked={newValues.nacional} onChange={e => setNewValues(prev => ({ ...prev, nacional: e.target.checked }))} className="accent-violet-500 w-4 h-4" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <input type="number" value={newValues.duracao_min} onChange={e => setNewValues(prev => ({ ...prev, duracao_min: Number(e.target.value) }))} className={`${inputCls} w-16`} placeholder="min" />
                      <span className="text-white/30 self-center">–</span>
                      <input type="number" value={newValues.duracao_max} onChange={e => setNewValues(prev => ({ ...prev, duracao_max: Number(e.target.value) }))} className={`${inputCls} w-16`} placeholder="max" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <input type="number" value={newValues.valor_base} onChange={e => setNewValues(prev => ({ ...prev, valor_base: Number(e.target.value) }))} className={inputCls} />
                  </td>
                  <td className="px-3 py-2.5">
                    <input type="text" value={newValues.moeda} onChange={e => setNewValues(prev => ({ ...prev, moeda: e.target.value }))} className={`${inputCls} w-16`} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={saveNew} className="flex items-center gap-1 h-7 px-2 rounded-lg bg-emerald-600/25 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-600/35 transition-colors">
                        <Check className="w-3 h-3" /> Salvar
                      </button>
                      <button onClick={cancelAdd} className="flex items-center gap-1 h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/40 hover:text-white/70 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* ── Data rows ── */}
              {filtered.map(row => {
                const isEditing = editingId === row.id
                return (
                  <tr key={row.id} className={`hover:bg-white/[0.02] transition-colors ${isEditing ? 'bg-violet-500/5' : ''}`}>
                    {/* Emissora */}
                    <td className="px-3 py-2.5">
                      {isEditing
                        ? <input type="text" value={editValues.emissora} onChange={e => setEditValues(p => ({ ...p, emissora: e.target.value }))} className={inputCls} />
                        : <span className="text-sm font-semibold text-white">{row.emissora}</span>
                      }
                    </td>
                    {/* Canal */}
                    <td className="px-3 py-2.5">
                      {isEditing
                        ? <input type="text" value={editValues.canal} onChange={e => setEditValues(p => ({ ...p, canal: e.target.value }))} className={inputCls} />
                        : <span className="text-xs text-white/60">{row.canal}</span>
                      }
                    </td>
                    {/* Plataforma */}
                    <td className="px-3 py-2.5">
                      {isEditing
                        ? <input type="text" value={editValues.plataforma} onChange={e => setEditValues(p => ({ ...p, plataforma: e.target.value }))} className={inputCls} placeholder="—" />
                        : <span className="text-xs text-white/40">{row.plataforma ?? '—'}</span>
                      }
                    </td>
                    {/* Tipo uso */}
                    <td className="px-3 py-2.5">
                      {isEditing
                        ? (
                          <select
                            value={editValues.tipo_uso}
                            onChange={e => setEditValues(p => ({ ...p, tipo_uso: e.target.value as TvTipoUso }))}
                            className="h-7 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white focus:outline-none w-full"
                          >
                            {(Object.keys(TV_TIPO_USO_LABELS) as TvTipoUso[]).map(k => (
                              <option key={k} value={k}>{TV_TIPO_USO_LABELS[k]}</option>
                            ))}
                          </select>
                        )
                        : (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TV_TIPO_USO_COLORS[row.tipo_uso]}`}>
                            {TV_TIPO_USO_LABELS[row.tipo_uso]}
                          </span>
                        )
                      }
                    </td>
                    {/* Ano */}
                    <td className="px-3 py-2.5">
                      {isEditing
                        ? <input type="number" value={editValues.ano} onChange={e => setEditValues(p => ({ ...p, ano: Number(e.target.value) }))} className={`${inputCls} w-20`} />
                        : <span className="text-xs text-white/50 tabular-nums">{row.ano}</span>
                      }
                    </td>
                    {/* Nacional */}
                    <td className="px-3 py-2.5 text-center">
                      {isEditing
                        ? <input type="checkbox" checked={editValues.nacional} onChange={e => setEditValues(p => ({ ...p, nacional: e.target.checked }))} className="accent-violet-500 w-4 h-4" />
                        : (
                          row.nacional
                            ? <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            : <X className="w-4 h-4 text-white/25 mx-auto" />
                        )
                      }
                    </td>
                    {/* Duração */}
                    <td className="px-3 py-2.5">
                      {isEditing
                        ? (
                          <div className="flex gap-1">
                            <input type="number" value={editValues.duracao_min} onChange={e => setEditValues(p => ({ ...p, duracao_min: Number(e.target.value) }))} className={`${inputCls} w-16`} />
                            <span className="text-white/30 self-center">–</span>
                            <input type="number" value={editValues.duracao_max} onChange={e => setEditValues(p => ({ ...p, duracao_max: Number(e.target.value) }))} className={`${inputCls} w-16`} />
                          </div>
                        )
                        : <span className="text-xs text-white/50 tabular-nums font-mono">{formatDuracao(row.duracao_min, row.duracao_max)}</span>
                      }
                    </td>
                    {/* Valor base */}
                    <td className="px-3 py-2.5">
                      {isEditing
                        ? <input type="number" value={editValues.valor_base} onChange={e => setEditValues(p => ({ ...p, valor_base: Number(e.target.value) }))} className={inputCls} />
                        : <span className="text-sm font-bold text-emerald-400 tabular-nums">{formatBRL(row.valor_base)}</span>
                      }
                    </td>
                    {/* Moeda */}
                    <td className="px-3 py-2.5">
                      {isEditing
                        ? <input type="text" value={editValues.moeda} onChange={e => setEditValues(p => ({ ...p, moeda: e.target.value }))} className={`${inputCls} w-16`} />
                        : <span className="text-xs text-white/40 font-mono">{row.moeda}</span>
                      }
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-2.5">
                      {isEditing
                        ? (
                          <div className="flex gap-1">
                            <button onClick={saveEdit} className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-emerald-600/25 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-600/35 transition-colors">
                              <Check className="w-3 h-3" /> Salvar
                            </button>
                            <button onClick={cancelEdit} className="flex items-center gap-1 h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/40 hover:text-white/70 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                        : (
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(row)} className="flex items-center gap-1 h-7 px-2 rounded-lg bg-white/5 border border-white/[0.08] text-[10px] text-white/50 hover:text-violet-300 hover:border-violet-500/30 transition-colors">
                              <Edit className="w-3 h-3" />
                            </button>
                            <button onClick={() => deleteRow(row.id)} className="flex items-center gap-1 h-7 px-2 rounded-lg bg-white/5 border border-white/[0.08] text-[10px] text-white/50 hover:text-red-300 hover:border-red-500/30 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-white/30">
            <DollarSign className="w-8 h-8" />
            <p className="text-sm">Nenhuma linha encontrada</p>
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Calcular Preview de Valor</h2>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-white/30 hover:text-white/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs text-white/40 block mb-1.5">Selecionar Execução</label>
                <select
                  value={previewExecId}
                  onChange={e => setPreviewExecId(e.target.value)}
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                >
                  <option value="">-- Selecione uma execução --</option>
                  {TV_EXECUCOES.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.titulo_importado} · {e.programa} · {e.data_exibicao}
                    </option>
                  ))}
                </select>
              </div>

              {previewExec && (
                <>
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div>
                      <p className="text-[10px] text-white/30 mb-0.5">Emissora</p>
                      <p className="text-sm font-semibold text-white">{previewExec.emissora}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 mb-0.5">Tipo Uso</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TV_TIPO_USO_COLORS[previewExec.tipo_uso]}`}>
                        {TV_TIPO_USO_LABELS[previewExec.tipo_uso]}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 mb-0.5">Valor Base</p>
                      <p className="text-sm font-bold text-white">{formatBRL(previewPrec?.valor_base ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 mb-0.5">Percentual controlado (mock)</p>
                      <p className="text-sm text-violet-300 font-semibold">62,5%</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/40 mb-0.5">Valor calculado</p>
                      <p className="text-xs text-white/30">valor_base × 62,5%</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400 tabular-nums">{formatBRL(valorPreview)}</p>
                  </div>
                </>
              )}

              {!previewExec && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <AlertCircle className="w-4 h-4 text-white/20" />
                  <p className="text-xs text-white/30">Selecione uma execução para ver o cálculo</p>
                </div>
              )}
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={() => setShowPreview(false)}
                className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
