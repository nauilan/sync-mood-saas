'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  BookOpen, ChevronRight, Clock, Eye, Users, Plus,
  Upload, FileText, Trash2, CheckCircle2, X, Download,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import {
  TIPO_CONTRATO_V2_LABELS, TIPO_CONTRATO_V2_COLORS,
} from '@/lib/types-contratos-v2'
import { MODELOS_JURIDICOS_V2 } from '@/lib/modelos-juridicos-v2'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

type ArquivoUpload = {
  nome: string
  tamanho: string
  tipo: string
  dataUpload: string
}

export default function ContratosModelosPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [uploads, setUploads] = useState<Record<string, ArquivoUpload>>({})
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(modeloId: string, file: File) {
    const tamanho = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    setUploadingId(modeloId)
    setTimeout(() => {
      setUploads(prev => ({
        ...prev,
        [modeloId]: {
          nome: file.name,
          tamanho,
          tipo: file.name.endsWith('.docx') ? 'Word' : 'PDF',
          dataUpload: new Date().toLocaleDateString('pt-BR'),
        },
      }))
      setUploadingId(null)
      setShowUploadModal(null)
    }, 1200)
  }

  function removerArquivo(modeloId: string) {
    setUploads(prev => {
      const next = { ...prev }
      delete next[modeloId]
      return next
    })
  }

  const modeloAtual = showUploadModal
    ? MODELOS_JURIDICOS_V2.find(m => m.id === showUploadModal)
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos Juridicos"
        description="Faça upload dos templates Word/PDF que serão usados na geração de contratos"
        actions={
          <Link href="/master/contratos/novo">
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Novo Contrato
            </button>
          </Link>
        }
      />

      {/* Resumo uploads */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[10px] text-white/30 mb-1">Total de Modelos</p>
          <p className="text-2xl font-bold text-white/80">{MODELOS_JURIDICOS_V2.length}</p>
        </div>
        <div className="bg-[#0d1526] border border-emerald-500/10 rounded-xl p-4">
          <p className="text-[10px] text-emerald-400/70 mb-1">Com Arquivo</p>
          <p className="text-2xl font-bold text-emerald-400">{Object.keys(uploads).length}</p>
        </div>
        <div className="bg-[#0d1526] border border-amber-500/10 rounded-xl p-4">
          <p className="text-[10px] text-amber-400/70 mb-1">Sem Arquivo</p>
          <p className="text-2xl font-bold text-amber-400">{MODELOS_JURIDICOS_V2.length - Object.keys(uploads).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MODELOS_JURIDICOS_V2.map(m => {
          const arquivo = uploads[m.id]
          const isUploading = uploadingId === m.id

          return (
            <div
              key={m.id}
              className={[
                'bg-[#0d1526] border rounded-xl p-5 transition-all',
                m.ativo ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-60',
                selectedId === m.id ? 'border-violet-500/40 bg-violet-500/[0.04]' : '',
              ].join(' ')}
            >
              {/* Cabeçalho */}
              <div
                className="flex items-start justify-between mb-3 cursor-pointer"
                onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white/90">{m.nome}</p>
                      {arquivo && (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Arquivo vinculado
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full mt-1 block w-fit ${TIPO_CONTRATO_V2_COLORS[m.tipo_contrato]}`}>
                      {TIPO_CONTRATO_V2_LABELS[m.tipo_contrato]}
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedId === m.id ? 'rotate-90 text-violet-400' : 'text-white/20'}`} />
              </div>

              {m.descricao && (
                <p className="text-xs text-white/50 mb-4 leading-relaxed">{m.descricao}</p>
              )}

              {/* Arquivo vinculado */}
              {arquivo ? (
                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2.5 mb-3">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-300 truncate">{arquivo.nome}</p>
                    <p className="text-[10px] text-emerald-400/50">{arquivo.tipo} · {arquivo.tamanho} · Enviado em {arquivo.dataUpload}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      title="Baixar"
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/5 text-white/30 hover:text-emerald-400 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Remover"
                      onClick={() => removerArquivo(m.id)}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/5 text-white/30 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowUploadModal(m.id)}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-white/[0.10] hover:border-violet-500/40 hover:bg-violet-500/5 text-xs text-white/30 hover:text-violet-400 transition-all mb-3"
                >
                  {isUploading ? (
                    <span className="animate-pulse">Enviando...</span>
                  ) : (
                    <><Upload className="w-3.5 h-3.5" /> Vincular arquivo (Word ou PDF)</>
                  )}
                </button>
              )}

              <div className="flex items-center justify-between text-xs text-white/30">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{m.contagem_uso} uso{m.contagem_uso !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Atualizado {formatDate(m.updated_at)}</span>
                </div>
              </div>

              {/* Preview expandido */}
              {selectedId === m.id && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-white/60">Preview do template</p>
                    <button
                      onClick={e => { e.stopPropagation(); setShowPreview(s => !s) }}
                      className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {showPreview ? 'Ocultar' : 'Ver texto completo'}
                    </button>
                  </div>

                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {['{{titular_nome}}', '{{cpf}}', '{{editora_nome}}', '{{vigencia_inicio}}', '{{vigencia_fim}}', '{{percentual_titular}}', '{{obras_lista}}'].map(v => (
                      <span key={v} className="text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded font-mono">
                        {v}
                      </span>
                    ))}
                  </div>

                  {showPreview && (
                    <pre className="text-xs text-white/40 bg-black/20 rounded-lg p-4 overflow-auto max-h-56 leading-relaxed whitespace-pre-wrap font-mono">
                      {m.template_texto}
                    </pre>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Link
                      href="/master/contratos/novo"
                      className="flex items-center gap-1.5 h-8 px-3 text-xs bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Usar este modelo
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal de Upload */}
      {showUploadModal && modeloAtual && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowUploadModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d1526] border border-white/[0.10] rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-bold text-white">Vincular Arquivo</h3>
                  <p className="text-xs text-white/40 mt-0.5">{modeloAtual.nome}</p>
                </div>
                <button onClick={() => setShowUploadModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragging(false)
                    const file = e.dataTransfer.files[0]
                    if (file) handleFile(showUploadModal, file)
                  }}
                  onClick={() => fileRef.current?.click()}
                  className={[
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                    dragging
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/[0.10] hover:border-violet-500/50 hover:bg-violet-500/5',
                  ].join(' ')}
                >
                  <Upload className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white/60">Arraste o arquivo aqui</p>
                  <p className="text-xs text-white/30 mt-1">ou clique para selecionar</p>
                  <p className="text-[10px] text-white/20 mt-3">Aceito: .docx · .pdf · .doc</p>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".docx,.doc,.pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(showUploadModal, file)
                  }}
                />

                <button
                  onClick={() => setShowUploadModal(null)}
                  className="w-full h-9 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
