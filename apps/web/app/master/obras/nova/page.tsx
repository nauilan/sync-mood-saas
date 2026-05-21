'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { ChevronRight, Plus, Trash2, CheckCircle2, AlertCircle, Music2, Users, FileText } from 'lucide-react'
import type { FuncaoLink } from '@/lib/types-obras'
import { FUNCAO_LINK_LABELS, FUNCAO_LINK_COLORS } from '@/lib/types-obras'

const STEPS = ['Dados da Obra', 'Links & Participantes', 'Revisao & Validacao']

interface LinkParticipante {
  tempId: string
  nome: string
  ipi: string
  funcao: FuncaoLink
  pct_exec: number
  pct_fono: number
  pct_sync: number
}

interface ObraLink {
  tempId: string
  numero: number
  descricao: string
  participantes: LinkParticipante[]
}

function StepIndicator({ step, current }: { step: number; current: number }) {
  const done    = step < current
  const active  = step === current
  return (
    <div className="flex items-center gap-2">
      <div className={'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ' +
        (done   ? 'bg-emerald-500 text-white' :
         active  ? 'bg-violet-600 text-white' :
                   'bg-white/10 text-white/30')}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : step + 1}
      </div>
      <span className={'text-sm ' + (active ? 'text-white font-semibold' : done ? 'text-white/60' : 'text-white/30')}>
        {STEPS[step]}
      </span>
    </div>
  )
}

const FUNCOES_AUTOR: FuncaoLink[] = ['CA', 'V', 'SA', 'A', 'T', 'AD', 'H']
const FUNCOES_EDITORA: FuncaoLink[] = ['E', 'AM', 'SE', 'C', 'CE']

function uid() { return Math.random().toString(36).slice(2) }

export default function NovaObraPage() {
  const [step, setStep] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [idioma, setIdioma] = useState('Portugues')
  const [origemCadastro, setOrigemCadastro] = useState('manual')
  const [links, setLinks] = useState<ObraLink[]>([
    { tempId: uid(), numero: 1, descricao: '', participantes: [] }
  ])

  const inputCls = 'w-full h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-colors'

  function addLink() {
    setLinks(prev => [...prev, { tempId: uid(), numero: prev.length + 1, descricao: '', participantes: [] }])
  }

  function removeLink(id: string) {
    setLinks(prev => prev.filter(l => l.tempId !== id).map((l, i) => ({ ...l, numero: i + 1 })))
  }

  function addParticipante(linkId: string) {
    setLinks(prev => prev.map(l =>
      l.tempId !== linkId ? l : {
        ...l,
        participantes: [...l.participantes, {
          tempId: uid(), nome: '', ipi: '', funcao: 'CA',
          pct_exec: 0, pct_fono: 0, pct_sync: 0,
        }]
      }
    ))
  }

  function updateParticipante(linkId: string, partId: string, field: string, value: string | number) {
    setLinks(prev => prev.map(l =>
      l.tempId !== linkId ? l : {
        ...l,
        participantes: l.participantes.map(p =>
          p.tempId !== partId ? p : { ...p, [field]: value }
        )
      }
    ))
  }

  function removeParticipante(linkId: string, partId: string) {
    setLinks(prev => prev.map(l =>
      l.tempId !== linkId ? l : {
        ...l,
        participantes: l.participantes.filter(p => p.tempId !== partId)
      }
    ))
  }

  const allParticipantes = links.flatMap(l => l.participantes)
  const sumExec = allParticipantes.reduce((s, p) => s + (p.pct_exec || 0), 0)
  const sumFono = allParticipantes.reduce((s, p) => s + (p.pct_fono || 0), 0)
  const sumSync = allParticipantes.reduce((s, p) => s + (p.pct_sync || 0), 0)

  const canNext0 = titulo.trim().length >= 2
  const canNext1 = links.length > 0 && links.every(l => l.participantes.length > 0) && sumExec === 100

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Nova Obra"
        description="Cadastre uma obra com estrutura de links e titularidade"
        actions={
          <a href="/master/obras" className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors flex items-center">
            Cancelar
          </a>
        }
      />

      {/* Step indicators */}
      <div className="flex items-center gap-4">
        {STEPS.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <StepIndicator step={i} current={step} />
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-white/20" />}
          </div>
        ))}
      </div>

      {/* Step 0: Dados da Obra */}
      {step === 0 && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Music2 className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Dados Basicos</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-medium text-white/50">Titulo da Obra *</label>
              <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Amo Noite e Dia" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Subtitulo</label>
              <input type="text" placeholder="Opcional" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Titulo Alternativo</label>
              <input type="text" placeholder="Opcional" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Idioma</label>
              <select value={idioma} onChange={e => setIdioma(e.target.value)}
                className={inputCls + ' cursor-pointer'}>
                <option>Portugues</option>
                <option>Ingles</option>
                <option>Espanhol</option>
                <option>Outro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Origem do Cadastro</label>
              <select value={origemCadastro} onChange={e => setOrigemCadastro(e.target.value)}
                className={inputCls + ' cursor-pointer'}>
                <option value="manual">Manual</option>
                <option value="contrato_sistema">Via Contrato do Sistema</option>
                <option value="migracao">Migracao</option>
              </select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-medium text-white/50">Letra (opcional)</label>
              <textarea rows={4} placeholder="Letra da obra..." className={inputCls + ' h-auto py-2.5 resize-none'} />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-medium text-white/50">Observacoes</label>
              <textarea rows={2} placeholder="Observacoes internas..." className={inputCls + ' h-auto py-2.5 resize-none'} />
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Links */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-400">Regra dos 100%</p>
              <p className="text-xs text-white/50 mt-0.5">A soma do percentual autoral (Exec. Publica) de todos os participantes CA/A de todos os links deve ser exatamente 100%.</p>
            </div>
          </div>

          {/* Percentual totals */}
          <div className="flex gap-3">
            {[
              { label: 'Exec. Publica', sum: sumExec, color: 'text-cyan-400' },
              { label: 'Fonomecanico',  sum: sumFono, color: 'text-emerald-400' },
              { label: 'Sincronizacao', sum: sumSync, color: 'text-amber-400' },
            ].map(col => (
              <div key={col.label} className={'flex-1 rounded-lg p-3 text-center border ' +
                (col.sum === 100 ? 'bg-emerald-500/10 border-emerald-500/20' : col.sum > 100 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/[0.06]')}>
                <p className="text-[10px] text-white/40 mb-0.5">{col.label}</p>
                <p className={'text-lg font-bold ' + (col.sum === 100 ? 'text-emerald-400' : col.sum > 100 ? 'text-rose-400' : col.color)}>
                  {col.sum.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>

          {links.map((link, linkIdx) => (
            <div key={link.tempId} className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-[10px] font-bold text-white">
                  {link.numero}
                </span>
                <span className="text-sm font-semibold text-white/70">Link {link.numero}</span>
                <input
                  type="text"
                  value={link.descricao}
                  onChange={e => setLinks(prev => prev.map(l => l.tempId === link.tempId ? { ...l, descricao: e.target.value } : l))}
                  placeholder="Descricao do link (opcional)"
                  className="flex-1 h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/40"
                />
                {links.length > 1 && (
                  <button onClick={() => removeLink(link.tempId)} className="w-6 h-6 flex items-center justify-center text-white/25 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="p-4 space-y-2">
                {link.participantes.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-2">Nenhum participante. Adicione autores e/ou editoras.</p>
                )}
                {link.participantes.map(part => (
                  <div key={part.tempId} className="flex items-center gap-2 p-2.5 bg-white/[0.03] rounded-lg">
                    <input type="text" value={part.nome}
                      onChange={e => updateParticipante(link.tempId, part.tempId, 'nome', e.target.value)}
                      placeholder="Nome do participante" className="flex-1 h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white placeholder:text-white/20 focus:outline-none" />
                    <input type="text" value={part.ipi}
                      onChange={e => updateParticipante(link.tempId, part.tempId, 'ipi', e.target.value)}
                      placeholder="IPI" className="w-20 h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none" />
                    <select value={part.funcao}
                      onChange={e => updateParticipante(link.tempId, part.tempId, 'funcao', e.target.value as FuncaoLink)}
                      className={'w-16 h-7 rounded px-1 text-xs font-bold border-0 focus:outline-none cursor-pointer ' + FUNCAO_LINK_COLORS[part.funcao]}>
                      <optgroup label="Autores">
                        {FUNCOES_AUTOR.map(f => <option key={f} value={f}>{f}</option>)}
                      </optgroup>
                      <optgroup label="Editoras">
                        {FUNCOES_EDITORA.map(f => <option key={f} value={f}>{f}</option>)}
                      </optgroup>
                    </select>
                    {['pct_exec','pct_fono','pct_sync'].map((field, fi) => (
                      <div key={field} className="flex flex-col items-center gap-0.5">
                        <span className={'text-[8px] ' + ['text-cyan-500','text-emerald-500','text-amber-500'][fi]}>
                          {['Exec','Fono','Sync'][fi]}
                        </span>
                        <input type="number" min="0" max="100" step="0.01"
                          value={(part as any)[field]}
                          onChange={e => updateParticipante(link.tempId, part.tempId, field, parseFloat(e.target.value) || 0)}
                          className={'w-16 h-7 bg-white/5 border border-white/[0.06] rounded px-2 text-xs text-white text-right tabular-nums focus:outline-none ' + ['focus:border-cyan-500/40','focus:border-emerald-500/40','focus:border-amber-500/40'][fi]} />
                      </div>
                    ))}
                    <button onClick={() => removeParticipante(link.tempId, part.tempId)}
                      className="w-6 h-6 flex items-center justify-center text-white/25 hover:text-rose-400 transition-colors shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addParticipante(link.tempId)}
                  className="flex items-center gap-1.5 w-full h-7 px-3 rounded-lg border border-dashed border-white/10 text-xs text-white/30 hover:text-white/60 hover:border-white/20 transition-colors">
                  <Plus className="w-3 h-3" /> Adicionar participante
                </button>
              </div>
            </div>
          ))}

          <button onClick={addLink}
            className="flex items-center gap-2 w-full h-10 px-4 rounded-xl border-2 border-dashed border-white/10 text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-colors justify-center">
            <Plus className="w-4 h-4" /> Adicionar Link
          </button>
        </div>
      )}

      {/* Step 2: Revisao */}
      {step === 2 && (
        <div className="space-y-4">
          <div className={'border rounded-xl p-5 ' + (sumExec === 100 && sumFono === 100 && sumSync === 100 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20')}>
            <div className="flex items-center gap-2 mb-3">
              {sumExec === 100 && sumFono === 100 && sumSync === 100 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              <span className={'text-sm font-semibold ' + (sumExec === 100 ? 'text-emerald-400' : 'text-rose-400')}>
                {sumExec === 100 ? 'Percentuais validados — obra pronta para salvar' : 'Percentuais incorretos — corrija antes de salvar'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Exec. Publica', value: sumExec, color: 'text-cyan-400' },
                { label: 'Fonomecanico', value: sumFono, color: 'text-emerald-400' },
                { label: 'Sincronizacao', value: sumSync, color: 'text-amber-400' },
              ].map(col => (
                <div key={col.label} className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-white/40">{col.label}</p>
                  <p className={'text-xl font-bold ' + (col.value === 100 ? col.color : 'text-rose-400')}>
                    {col.value.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Resumo da Obra</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-white/30">Titulo</p><p className="text-sm text-white/80 font-medium">{titulo || '—'}</p></div>
              <div><p className="text-xs text-white/30">Idioma</p><p className="text-sm text-white/80">{idioma}</p></div>
              <div><p className="text-xs text-white/30">Origem</p><p className="text-sm text-white/80">{origemCadastro.replace(/_/g, ' ')}</p></div>
              <div><p className="text-xs text-white/30">Total Links</p><p className="text-sm text-white/80">{links.length}</p></div>
              <div><p className="text-xs text-white/30">Participantes</p><p className="text-sm text-white/80">{allParticipantes.length}</p></div>
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
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 0 ? !canNext0 : !canNext1}
            className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:pointer-events-none text-sm text-white font-semibold transition-colors">
            Proximo <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            disabled={sumExec !== 100 || !titulo}
            className="flex items-center gap-1.5 h-9 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-sm text-white font-semibold transition-colors">
            <CheckCircle2 className="w-4 h-4" /> Salvar Obra
          </button>
        )}
      </div>
    </div>
  )
}