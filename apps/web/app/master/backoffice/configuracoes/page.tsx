'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Settings, Plus, Trash2, Save } from 'lucide-react'

const DSP_DEFAULTS = [
  { id: '1', nome: 'Spotify', ativo: true },
  { id: '2', nome: 'Apple Music', ativo: true },
  { id: '3', nome: 'Deezer', ativo: true },
  { id: '4', nome: 'YouTube Music', ativo: true },
  { id: '5', nome: 'Amazon Music', ativo: false },
  { id: '6', nome: 'Tidal', ativo: false },
]

const LAYOUTS_DEFAULT = [
  { codigo: 'B-55', descricao: 'Royalty Statement (fixed-width 920 bytes/linha)', formato: 'TXT', ativo: true },
  { codigo: 'B-8', descricao: 'Songs Authorization', formato: 'TXT/XLS/XML', ativo: true },
  { codigo: 'B-9', descricao: 'Performers', formato: 'TXT/XLS/XML', ativo: true },
  { codigo: 'GENERICO', descricao: 'Excel/CSV Genérico (mapeamento manual de colunas)', formato: 'XLS/XLSX/CSV', ativo: true },
]

export default function ConfiguracoesBackofficePage() {
  const [scoreMin, setScoreMin] = useState(60)
  const [dsps, setDsps] = useState(DSP_DEFAULTS)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações BackOffice"
        description="Configure layouts aceitos, regras de matching, DSPs cadastrados e permissões de acesso ao módulo BackOffice."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regras de Matching */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Settings className="w-4 h-4 text-violet-400" /> Regras de Matching
          </p>
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Score mínimo de similaridade para "Possível Match"</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={30} max={90} step={5}
                value={scoreMin}
                onChange={e => setScoreMin(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-bold text-violet-400 w-10">{scoreMin}%</span>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Cruzar por ISWC', checked: true },
              { label: 'Cruzar por ISRC', checked: true },
              { label: 'Cruzar por título exato', checked: true },
              { label: 'Cruzar por similaridade de título', checked: true },
              { label: 'Cruzar por autor', checked: true },
              { label: 'Cruzar por intérprete', checked: false },
            ].map(opt => (
              <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={opt.checked} className="accent-violet-500" />
                <span className="text-xs text-white/60">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* DSPs Cadastrados */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-400" /> DSPs Cadastrados
            </p>
            <button className="h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors">
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {dsps.map(dsp => (
              <div key={dsp.id} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                <input
                  type="checkbox"
                  checked={dsp.ativo}
                  onChange={() => setDsps(prev => prev.map(d => d.id === dsp.id ? { ...d, ativo: !d.ativo } : d))}
                  className="accent-violet-500"
                />
                <span className="flex-1 text-xs text-white/70">{dsp.nome}</span>
                <button className="text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Layouts Aceitos */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4 lg:col-span-2">
          <p className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" /> Layouts de Importação Aceitos
          </p>
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <div className="grid grid-cols-[80px_1fr_150px_80px] gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/[0.05]">
              {['Código', 'Descrição', 'Formatos', 'Ativo'].map(h => (
                <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
              ))}
            </div>
            {LAYOUTS_DEFAULT.map((l, idx) => (
              <div key={l.codigo} className={`grid grid-cols-[80px_1fr_150px_80px] gap-2 px-4 py-3 items-center ${idx < LAYOUTS_DEFAULT.length - 1 ? 'border-b border-white/[0.03]' : ''}`}>
                <span className="text-xs font-mono font-bold text-violet-400">{l.codigo}</span>
                <p className="text-xs text-white/60">{l.descricao}</p>
                <span className="text-xs text-white/40">{l.formato}</span>
                <input type="checkbox" defaultChecked={l.ativo} className="accent-violet-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`h-10 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
            saved ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Salvo!' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}
