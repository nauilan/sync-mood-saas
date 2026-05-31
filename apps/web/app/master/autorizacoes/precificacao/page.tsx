'use client'

import React, { useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Tv2, Plus, Save, Pencil, Check, X, ChevronDown, ChevronUp,
  RefreshCw, Download, Calendar
} from 'lucide-react'

const TIPOS_USO_TV = [
  { id: 'abertura_novelas',   grupo: 'Obras Nacionais',    nome: 'Abertura (Novelas e series)' },
  { id: 'abertura_curta',     grupo: 'Obras Nacionais',    nome: 'Abertura (series de curta temporada)' },
  { id: 'abertura_mini',      grupo: 'Obras Nacionais',    nome: 'Abertura (Mini-series/demais producoes)' },
  { id: 'abertura_enc',       grupo: 'Obras Nacionais',    nome: 'Abertura/Encerramento Pontual' },
  { id: 'tema_novelas',       grupo: 'Obras Nacionais',    nome: 'Tema (novela / series)' },
  { id: 'tema_curta',         grupo: 'Obras Nacionais',    nome: 'Tema (series de curta temporada)' },
  { id: 'tema_mini',          grupo: 'Obras Nacionais',    nome: 'Tema (mini-series/demais producoes)' },
  { id: 'fundo_generos',      grupo: 'Obras Nacionais',    nome: 'Fundo (em quaisquer generos)' },
  { id: 'fundo_jornalistico', grupo: 'Obras Nacionais',    nome: 'Fundo (programas jornalisticos)' },
  { id: 'performance',        grupo: 'Obras Nacionais',    nome: 'Performance (em quaisquer generos)' },
  { id: 'ext_abertura',       grupo: 'Obras Estrangeiras', nome: 'Abertura' },
  { id: 'ext_tema',           grupo: 'Obras Estrangeiras', nome: 'Tema' },
  { id: 'ext_fundo',          grupo: 'Obras Estrangeiras', nome: 'Fundo' },
  { id: 'ext_performance',    grupo: 'Obras Estrangeiras', nome: 'Performance' },
]

const GRUPOS = ['Obras Nacionais', 'Obras Estrangeiras']
const CANAIS_INICIAIS = ['Globo', 'SBT', 'Record', 'Band', 'RedeTV', 'Multishow', 'GNT', 'Sportv', 'Canal Brasil']
const ANO_ATUAL = new Date().getFullYear()
const ANOS = [ANO_ATUAL - 1, ANO_ATUAL, ANO_ATUAL + 1]

type TabelaKey = string
type Tabela = Record<TabelaKey, number>

function makeKey(canal: string, tipoId: string, ano: number) {
  return canal + '__' + tipoId + '__' + ano
}

function formatBRL(v: number) {
  if (!v) return ''
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })
}

function parseBRL(s: string) {
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

function gerarDadosIniciais(): Tabela {
  const t: Tabela = {}
  const baseValues: Record<string, number> = {
    abertura_novelas: 85000, abertura_curta: 45000, abertura_mini: 35000,
    abertura_enc: 30000, tema_novelas: 75000, tema_curta: 40000,
    tema_mini: 30000, fundo_generos: 25000, fundo_jornalistico: 15000,
    performance: 20000, ext_abertura: 60000, ext_tema: 55000,
    ext_fundo: 18000, ext_performance: 22000,
  }
  const canalMult: Record<string, number> = {
    Globo: 1.0, SBT: 0.55, Record: 0.55, Band: 0.35, RedeTV: 0.25,
    Multishow: 0.4, GNT: 0.35, Sportv: 0.3, 'Canal Brasil': 0.25,
  }
  CANAIS_INICIAIS.forEach(canal => {
    TIPOS_USO_TV.forEach(tipo => {
      ANOS.forEach(ano => {
        const base = baseValues[tipo.id] ?? 0
        const mult = canalMult[canal] ?? 0.3
        const anoMult = ano === ANO_ATUAL ? 1 : ano < ANO_ATUAL ? 0.9 : 1.1
        t[makeKey(canal, tipo.id, ano)] = Math.round(base * mult * anoMult / 1000) * 1000
      })
    })
  })
  return t
}

export default function PrecificacaoPage() {
  const [canais, setCanais] = useState<string[]>(CANAIS_INICIAIS)
  const [tabela, setTabela] = useState<Tabela>(gerarDadosIniciais)
  const [anoSel, setAnoSel] = useState(ANO_ATUAL)
  const [canalSel, setCanalSel] = useState<string>(CANAIS_INICIAIS[0])
  const [editingCell, setEditingCell] = useState<TabelaKey | null>(null)
  const [editValue, setEditValue] = useState('')
  const [novoCanal, setNovoCanal] = useState('')
  const [showAddCanal, setShowAddCanal] = useState(false)
  const [gruposOpen, setGruposOpen] = useState<Record<string, boolean>>({
    'Obras Nacionais': true, 'Obras Estrangeiras': true,
  })

  function setCellValue(canal: string, tipoId: string, ano: number, val: number) {
    setTabela(prev => ({ ...prev, [makeKey(canal, tipoId, ano)]: val }))
  }

  function getCellValue(canal: string, tipoId: string, ano: number) {
    return tabela[makeKey(canal, tipoId, ano)] ?? 0
  }

  function startEdit(canal: string, tipoId: string, ano: number) {
    setEditingCell(makeKey(canal, tipoId, ano))
    setEditValue(String(getCellValue(canal, tipoId, ano) || ''))
  }

  function commitEdit(canal: string, tipoId: string, ano: number) {
    setCellValue(canal, tipoId, ano, parseBRL(editValue) || 0)
    setEditingCell(null)
  }

  function addCanal() {
    const nome = novoCanal.trim()
    if (!nome || canais.includes(nome)) return
    setCanais(prev => [...prev, nome])
    setNovoCanal('')
    setShowAddCanal(false)
    setCanalSel(nome)
  }

  const totalCanalAno = useMemo(() =>
    TIPOS_USO_TV.reduce((s, t) => s + getCellValue(canalSel, t.id, anoSel), 0),
    [tabela, canalSel, anoSel]
  )

  const tiposPreenchidos = useMemo(() =>
    TIPOS_USO_TV.filter(t => getCellValue(canalSel, t.id, anoSel) > 0).length,
    [tabela, canalSel, anoSel]
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Precificacao — Autorizacoes de TV"
        description="Tabela de valores por canal e tipo de uso. Usada para calcular autorizacoes automaticamente."
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-colors">
              <Download className="w-3.5 h-3.5" /> Exportar
            </button>
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors">
              <Save className="w-3.5 h-3.5" /> Salvar
            </button>
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-[#0d1526] border border-white/[0.06] rounded-lg p-1">
          {ANOS.map(a => (
            <button
              key={a}
              onClick={() => setAnoSel(a)}
              className={`flex items-center gap-1 h-7 px-3 rounded-md text-xs font-semibold transition-colors ${anoSel === a ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              <Calendar className="w-3 h-3" /> {a}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {canais.map(c => (
            <button
              key={c}
              onClick={() => setCanalSel(c)}
              className={`h-7 px-2.5 rounded-lg border text-xs font-medium transition-colors ${canalSel === c ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-white/[0.03] border-white/[0.06] text-white/45 hover:text-white/70'}`}
            >
              {c}
            </button>
          ))}
          {showAddCanal ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={novoCanal}
                onChange={e => setNovoCanal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addCanal()
                  if (e.key === 'Escape') setShowAddCanal(false)
                }}
                placeholder="Nome do canal..."
                autoFocus
                className="h-7 w-32 bg-white/5 border border-violet-500/40 rounded-lg px-2 text-xs text-white focus:outline-none"
              />
              <button onClick={addCanal} className="h-7 w-7 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 text-white">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowAddCanal(false)} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-white/70">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCanal(true)}
              className="h-7 px-2.5 rounded-lg border border-dashed border-white/[0.12] text-xs text-white/30 hover:text-white/60 hover:border-white/20 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Canal
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-xs text-white/35 mb-1">Canal</p>
          <p className="text-sm font-bold text-white">{canalSel}</p>
          <p className="text-[10px] text-white/30">{anoSel}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-xs text-white/35 mb-1">Tipos Preenchidos</p>
          <p className="text-2xl font-bold text-violet-400">{tiposPreenchidos}</p>
          <p className="text-[10px] text-white/30">de {TIPOS_USO_TV.length}</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-xs text-white/35 mb-1">Soma da Tabela</p>
          <p className="text-lg font-bold text-emerald-400">
            {totalCanalAno.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-white/30">total {anoSel}</p>
        </div>
      </div>

      {/* Tabela principal */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Tv2 className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">{canalSel}</h2>
            <span className="text-xs text-white/35">— {anoSel}</span>
          </div>
          <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
            <RefreshCw className="w-3 h-3" /> Copiar do ano anterior
          </button>
        </div>

        {GRUPOS.map(grupo => {
          const tiposGrupo = TIPOS_USO_TV.filter(t => t.grupo === grupo)
          const open = gruposOpen[grupo] !== false
          return (
            <div key={grupo}>
              <button
                onClick={() => setGruposOpen(prev => ({ ...prev, [grupo]: !prev[grupo] }))}
                className="w-full flex items-center justify-between px-5 py-2.5 bg-white/[0.03] border-b border-white/[0.04] hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-xs font-semibold text-white/60">{grupo}</span>
                {open ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
              </button>

              {open && tiposGrupo.map((tipo) => {
                const val = getCellValue(canalSel, tipo.id, anoSel)
                const cellKey = makeKey(canalSel, tipo.id, anoSel)
                const isEditing = editingCell === cellKey
                return (
                  <div
                    key={tipo.id}
                    className="flex items-center px-5 py-3 gap-4 border-b border-white/[0.03] group"
                  >
                    <div className="flex-1 text-sm text-white/65">{tipo.nome}</div>
                    <div className="w-44 flex items-center gap-2">
                      <span className="text-xs text-white/30 shrink-0">R$</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(canalSel, tipo.id, anoSel)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitEdit(canalSel, tipo.id, anoSel)
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                            autoFocus
                            className="flex-1 h-7 bg-violet-500/10 border border-violet-500/40 rounded-lg px-2 text-xs text-white tabular-nums focus:outline-none"
                          />
                          <button
                            onClick={() => commitEdit(canalSel, tipo.id, anoSel)}
                            className="w-6 h-6 flex items-center justify-center rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(canalSel, tipo.id, anoSel)}
                          className="flex-1 h-8 px-2 text-left rounded-lg hover:bg-white/[0.06] transition-colors group/cell"
                        >
                          {val > 0 ? (
                            <span className="text-sm font-semibold text-white tabular-nums">{formatBRL(val)}</span>
                          ) : (
                            <span className="text-xs text-white/20 group-hover/cell:text-white/40">Clique para editar</span>
                          )}
                        </button>
                      )}
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(canalSel, tipo.id, anoSel)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Comparativo entre canais */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Comparativo — {anoSel}</h3>
          <span className="text-xs text-white/30">Obras Nacionais · primeiros 5 canais</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-white/40 w-48">Tipo de Uso</th>
                {canais.slice(0, 5).map(c => (
                  <th
                    key={c}
                    className={`px-3 py-2.5 text-right text-xs font-semibold whitespace-nowrap ${c === canalSel ? 'text-violet-300' : 'text-white/40'}`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIPOS_USO_TV.filter(t => t.grupo === 'Obras Nacionais').map((tipo, i) => (
                <tr key={tipo.id} className={i % 2 === 0 ? '' : 'bg-white/[0.01]'}>
                  <td className="px-4 py-2.5 text-xs text-white/55">{tipo.nome}</td>
                  {canais.slice(0, 5).map(c => {
                    const v = getCellValue(c, tipo.id, anoSel)
                    return (
                      <td
                        key={c}
                        className={`px-3 py-2.5 text-right text-xs tabular-nums ${c === canalSel ? 'text-violet-300 font-semibold' : 'text-white/55'}`}
                      >
                        {v > 0 ? 'R$ ' + formatBRL(v) : <span className="text-white/20">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}