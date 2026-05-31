'use client'

import React, { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Music2, Film, Tv2, Megaphone, BookOpen, Shuffle, Layers,
  Tags, FileText, Receipt, Gift, Info
} from 'lucide-react'
import {
  TIPO_AUTORIZACAO_LABELS, TIPO_AUTORIZACAO_DESCRICAO, TIPO_AUTORIZACAO_COLORS,
  TIPOS_USO_POR_TIPO_AUTORIZACAO, TIPO_USO_LABELS,
  MODELO_NEGOCIO_LABELS, MODELO_NEGOCIO_DESCRICAO, MODELO_NEGOCIO_DOCUMENTO_NOME, MODELO_NEGOCIO_COLORS,
} from '@/lib/types-autorizacoes'
import type { TipoAutorizacao, ModeloNegocio } from '@/lib/types-autorizacoes'

// Icone por tipo
const TIPO_ICONS: Record<TipoAutorizacao, React.ElementType> = {
  fonograma:      Music2,
  sincronizacao:  Tv2,
  publicidade:    Megaphone,
  tv:             Tv2,
  edicao_grafica: BookOpen,
  incidental:     Layers,
  versao:         Shuffle,
}

const TODOS_TIPOS: TipoAutorizacao[] = [
  'fonograma','sincronizacao','publicidade',
  'tv','edicao_grafica','incidental','versao',
]

const MODELO_ICONS: Record<ModeloNegocio, React.ElementType> = {
  pago_editora: Receipt,
  pago_autor:   FileText,
  sem_onus:     Gift,
}

export default function TiposDeUsoPage() {
  const [selectedTipo, setSelectedTipo] = useState<TipoAutorizacao | null>(null)

  const tiposUso = selectedTipo ? TIPOS_USO_POR_TIPO_AUTORIZACAO[selectedTipo] : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Autorizacao"
        description="As 8 modalidades de autorizacao de uso de obras musicais e suas especificacoes"
      />

      {/* Grid dos 8 tipos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TODOS_TIPOS.map(tipo => {
          const Icon = TIPO_ICONS[tipo]
          const usos = TIPOS_USO_POR_TIPO_AUTORIZACAO[tipo]
          const active = selectedTipo === tipo
          return (
            <button
              key={tipo}
              onClick={() => setSelectedTipo(active ? null : tipo)}
              className={`flex flex-col gap-3 p-4 rounded-xl border text-left transition-all ${
                active
                  ? 'bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/30'
                  : 'bg-[#0d1526] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-violet-600' : 'bg-white/[0.06]'}`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-white/50'}`} />
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TIPO_AUTORIZACAO_COLORS[tipo]}`}>
                  {usos.length > 0 ? `${usos.length} usos` : 'geral'}
                </span>
              </div>
              <div>
                <p className={`text-sm font-semibold leading-snug ${active ? 'text-white' : 'text-white/80'}`}>
                  {TIPO_AUTORIZACAO_LABELS[tipo]}
                </p>
                <p className="text-[11px] text-white/35 mt-0.5 leading-snug">
                  {TIPO_AUTORIZACAO_DESCRICAO[tipo]}
                </p>
              </div>
              {usos.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {usos.slice(0, 4).map(u => (
                    <span key={u} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/40">
                      {TIPO_USO_LABELS[u]}
                    </span>
                  ))}
                  {usos.length > 4 && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/30">
                      +{usos.length - 4}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Detalhe do tipo selecionado */}
      {selectedTipo && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            {React.createElement(TIPO_ICONS[selectedTipo], { className: 'w-4 h-4 text-violet-400' })}
            <h2 className="text-sm font-semibold text-white">
              Autorizacao para {TIPO_AUTORIZACAO_LABELS[selectedTipo]}
            </h2>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-1 ${TIPO_AUTORIZACAO_COLORS[selectedTipo]}`}>
              {TIPO_AUTORIZACAO_LABELS[selectedTipo]}
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tipos de uso */}
            <div>
              <p className="text-xs font-semibold text-white/50 mb-3 flex items-center gap-1.5">
                <Tags className="w-3.5 h-3.5" /> Tipos de Uso Aplicaveis
              </p>
              {tiposUso.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tiposUso.map(u => (
                    <span key={u} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60">
                      {TIPO_USO_LABELS[u]}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-white/35 bg-white/[0.03] rounded-lg p-3">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Nao requer selecao de tipo de uso especifico
                </div>
              )}
            </div>

            {/* Informacoes gerais */}
            <div>
              <p className="text-xs font-semibold text-white/50 mb-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Sobre esta modalidade
              </p>
              <div className="space-y-2 text-xs text-white/50 leading-relaxed">
                <p>{TIPO_AUTORIZACAO_DESCRICAO[selectedTipo]}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-white/30">Exclusividade:</span>
                  <span className="text-white/60 font-medium">Disponivel em todas as modalidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/30">Renovacao:</span>
                  <span className="text-white/60 font-medium">Suportada — alertas automaticos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modelos de Negocio */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Receipt className="w-4 h-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white">Modelos de Negocio e Documentos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['pago_editora','pago_autor','sem_onus'] as ModeloNegocio[]).map(modelo => {
            const Icon = MODELO_ICONS[modelo]
            return (
              <div key={modelo} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white/50" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{MODELO_NEGOCIO_LABELS[modelo]}</p>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${MODELO_NEGOCIO_COLORS[modelo]}`}>
                        {modelo}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  {MODELO_NEGOCIO_DESCRICAO[modelo]}
                </p>
                <div className="border-t border-white/[0.06] pt-3">
                  <p className="text-[10px] text-white/30 mb-1">Documento gerado</p>
                  <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
                    <FileText className="w-3 h-3 text-white/30 shrink-0" />
                    <span className="text-xs text-white/55 font-medium">{MODELO_NEGOCIO_DOCUMENTO_NOME[modelo]}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Regras de Exclusividade */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Regras de Exclusividade</h3>
            <p className="text-xs text-white/35">Aplicavel a todos os 8 tipos de autorizacao</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { titulo: 'Selecao', desc: 'Qualquer autorizacao pode ter ou nao exclusividade', color: 'bg-sky-500/10 border-sky-500/20 text-sky-400' },
            { titulo: 'Prazo', desc: 'Informar prazo em meses para exclusividade vigente', color: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
            { titulo: 'Bloqueio', desc: 'Sistema bloqueia novas autorizacoes da mesma obra enquanto exclusividade vigente', color: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
            { titulo: 'Alertas', desc: 'Notificacao automatica 30 dias antes do vencimento da exclusividade', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
          ].map(r => (
            <div key={r.titulo} className={`rounded-xl p-3 border ${r.color.split(' ').slice(0,2).join(' ')}`}>
              <p className={`text-xs font-bold mb-1 ${r.color.split(' ')[2]}`}>{r.titulo}</p>
              <p className="text-xs text-white/45 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400/80">
            <strong>Renovacao:</strong> Autorizacoes com exclusividade podem ser renovadas. O sistema registra o historico de cada renovacao e calcula automaticamente a nova data de termino.
          </p>
        </div>
      </div>
    </div>
  )
}