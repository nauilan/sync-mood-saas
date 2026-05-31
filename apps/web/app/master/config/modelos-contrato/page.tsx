'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MOCK_MODELOS_CONTRATO } from '@/lib/mock-config'
import type { ModeloContratoConfig } from '@/lib/types-config'
import { FileText, Edit, Eye, X, Save } from 'lucide-react'

const TIPO_LABEL: Record<string, string> = {
  cessao_parcial: 'Cessão Parcial',
  cessao_total: 'Cessão Total',
  licenciamento: 'Licenciamento',
  administracao_editorial: 'Adm. Editorial',
  coedicao: 'Coedição',
  subedicao: 'Subedição',
  cessao_internacional: 'Cessão Intl.',
  cessionario_pj: 'Cessionário PJ',
  exclusividade_autoral: 'Exclusividade',
}

export default function ModelosContratoPage() {
  const [editModalId, setEditModalId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [savedToast, setSavedToast] = useState(false)

  function openEdit(modelo: ModeloContratoConfig) {
    setEditContent(modelo.conteudo_template)
    setEditModalId(modelo.id)
  }

  function handleSaveEdit() {
    setSavedToast(true)
    setTimeout(() => {
      setSavedToast(false)
      setEditModalId(null)
    }, 2000)
  }

  const editModelo = MOCK_MODELOS_CONTRATO.find((m) => m.id === editModalId)
  const previewModelo = MOCK_MODELOS_CONTRATO.find((m) => m.id === previewId)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Modelos de Contrato"
        description="Templates de contratos editáveis usados na geração automática de documentos."
      />

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MOCK_MODELOS_CONTRATO.map((modelo: ModeloContratoConfig) => (
          <div
            key={modelo.id}
            className="flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-white/40" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    modelo.ativo
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-white/5 text-white/30'
                  }`}
                >
                  {modelo.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-mono text-violet-400 mb-0.5">{modelo.codigo}</p>
              <p className="text-sm font-semibold text-white/80">{modelo.nome}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400">
                  {TIPO_LABEL[modelo.tipo_contrato] ?? modelo.tipo_contrato}
                </span>
                <span className="text-[10px] text-white/25">{modelo.editora_id}</span>
              </div>
            </div>

            <p className="text-[10px] text-white/30 line-clamp-2 leading-relaxed">
              {modelo.conteudo_template.substring(0, 120)}...
            </p>

            <div className="flex gap-2 pt-1 border-t border-white/[0.05]">
              <button
                onClick={() => openEdit(modelo)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] hover:bg-violet-500/10 text-white/40 hover:text-violet-400 text-xs transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar Template
              </button>
              <button
                onClick={() => setPreviewId(modelo.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/60 text-xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editModalId && editModelo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0f0d1a] border border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-sm font-semibold text-white/80">Editar Template</p>
                <p className="text-xs text-violet-400 font-mono mt-0.5">{editModelo.codigo}</p>
              </div>
              <button
                onClick={() => setEditModalId(null)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={12}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-white/70 font-mono resize-none focus:outline-none focus:border-violet-500/40 transition-colors leading-relaxed"
              />
              <p className="text-[10px] text-white/25 mt-2">
                Variáveis disponíveis:{' '}
                {Object.keys(editModelo.variaveis_json)
                  .map((v) => `{{${v}}}`)
                  .join(', ')}
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => setEditModalId(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                Cancelar
              </button>
              <div className="flex items-center gap-3">
                {savedToast && (
                  <span className="text-xs text-emerald-400 animate-pulse">Salvo!</span>
                )}
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewId && previewModelo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0f0d1a] border border-white/[0.08] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-sm font-semibold text-white/80">Preview — {previewModelo.nome}</p>
                <p className="text-xs text-white/35 mt-0.5">Somente leitura</p>
              </div>
              <button
                onClick={() => setPreviewId(null)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <pre className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-white/55 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {previewModelo.conteudo_template}
              </pre>
            </div>
            <div className="px-5 py-4 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={() => setPreviewId(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-white/40 hover:text-white/60 transition-colors"
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
