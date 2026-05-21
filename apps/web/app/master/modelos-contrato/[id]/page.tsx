'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Save, Eye, EyeOff } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import type { ModeloContrato, TipoContrato } from '@/lib/types-contratos'
import { TIPO_CONTRATO_LABELS } from '@/lib/types-contratos'

const PLACEHOLDERS = [
  '{{titular_nome}}', '{{titular_cpf_cnpj}}', '{{cessionario_nome}}',
  '{{vigencia_inicio}}', '{{vigencia_fim}}', '{{obras_lista}}',
  '{{percentual}}', '{{cidade}}', '{{data_assinatura}}',
]

const MOCK_MODELOS: Record<string, ModeloContrato> = {
  m1: {
    id: 'm1', tenant_id: 't1', nome: 'Cessao Padrao UBC', tipo: 'cessao',
    descricao: 'Modelo padrao para cessao total de direitos autorais com filiacao UBC.',
    clausulas: `CONTRATO DE CESSAO DE DIREITOS AUTORAIS

Pelo presente instrumento particular, {{titular_nome}}, portador do CPF/CNPJ {{titular_cpf_cnpj}}, doravante denominado CEDENTE, e {{cessionario_nome}}, doravante denominado CESSIONARIO, celebram o presente Contrato de Cessao de Direitos Autorais.

CLAUSULA PRIMEIRA - DO OBJETO
O CEDENTE cede ao CESSIONARIO, em carater exclusivo, os direitos patrimoniais de autor sobre as seguintes obras musicais:

{{obras_lista}}

CLAUSULA SEGUNDA - DA VIGENCIA
O presente contrato vigorara de {{vigencia_inicio}} ate {{vigencia_fim}}.

CLAUSULA TERCEIRA - DOS PERCENTUAIS
Fica estabelecido o percentual de {{percentual}}% sobre as arrecadacoes.

CLAUSULA QUARTA - DO FORO
As partes elegem o foro da comarca de {{cidade}} para dirimir controversias.

{{cidade}}, {{data_assinatura}}.`,
    ativo: true, contagem_uso: 12,
    created_at: '2024-01-01T10:00:00Z', updated_at: '2024-06-15T10:00:00Z',
  },
  m2: {
    id: 'm2', tenant_id: 't1', nome: 'Administracao Editorial', tipo: 'administracao',
    descricao: 'Contrato de administracao editorial para obras nacionais.',
    clausulas: `CONTRATO DE ADMINISTRACAO EDITORIAL

Pelo presente instrumento, {{titular_nome}} autoriza {{cessionario_nome}} a administrar os direitos das obras listadas:

{{obras_lista}}

Vigencia: {{vigencia_inicio}} a {{vigencia_fim}}.`,
    ativo: true, contagem_uso: 5,
    created_at: '2024-02-10T10:00:00Z', updated_at: '2024-05-20T10:00:00Z',
  },
  novo: {
    id: 'novo', tenant_id: 't1', nome: '', tipo: 'cessao',
    descricao: '', clausulas: '', ativo: true, contagem_uso: 0,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
}

function renderPreview(text: string): string {
  return text
    .replace(/\{\{titular_nome\}\}/g, 'Nauilan Barbosa Silva')
    .replace(/\{\{titular_cpf_cnpj\}\}/g, '123.456.789-00')
    .replace(/\{\{cessionario_nome\}\}/g, 'Edi Music Editora Ltda')
    .replace(/\{\{vigencia_inicio\}\}/g, '01/01/2024')
    .replace(/\{\{vigencia_fim\}\}/g, '31/12/2026')
    .replace(/\{\{obras_lista\}\}/g, '1. Amo Noite e Dia (OBR-001)\n2. Sol da Manha (OBR-003)')
    .replace(/\{\{percentual\}\}/g, '50')
    .replace(/\{\{cidade\}\}/g, 'Sao Paulo/SP')
    .replace(/\{\{data_assinatura\}\}/g, '20/05/2024')
}

export default function ModeloEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)
  const [saved, setSaved] = useState(false)

  const base = MOCK_MODELOS[id] ?? MOCK_MODELOS['novo']
  const [form, setForm] = useState({ nome: base.nome, tipo: base.tipo, descricao: base.descricao ?? '', clausulas: base.clausulas, ativo: base.ativo })

  useEffect(() => { setSaved(false) }, [form])

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const insertPlaceholder = (p: string) => {
    setForm(f => ({ ...f, clausulas: f.clausulas + p }))
  }

  const isNew = id === 'novo'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <PageHeader
            title={isNew ? 'Novo Modelo' : form.nome || 'Editar Modelo'}
            description="Editor de template contratual com placeholders dinamicos"
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(v => !v)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-xs text-white/60 hover:text-white/80 transition-colors"
                >
                  {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPreview ? 'Ocultar Preview' : 'Preview'}
                </button>
                <button
                  onClick={handleSave}
                  className={'flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-semibold transition-colors ' + (saved ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white')}
                >
                  <Save className="w-3.5 h-3.5" /> {saved ? 'Salvo!' : 'Salvar'}
                </button>
              </div>
            }
          />
        </div>
      </div>

      <div className={['grid gap-6', showPreview ? 'grid-cols-2' : 'grid-cols-1'].join(' ')}>
        {/* Editor */}
        <div className="space-y-4">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-white/50 block mb-2">Nome do Modelo <span className="text-rose-400">*</span></label>
              <input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="ex: Cessao Padrao UBC"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-white/50 block mb-2">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoContrato }))}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 outline-none"
                >
                  {(Object.keys(TIPO_CONTRATO_LABELS) as TipoContrato[]).map(t => (
                    <option key={t} value={t}>{TIPO_CONTRATO_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                    className="accent-violet-500"
                  />
                  <span className="text-sm text-white/60">Modelo ativo</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/50 block mb-2">Descricao</label>
              <input
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Breve descricao do modelo..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/50">Clausulas do Contrato</label>
            </div>
            <div>
              <p className="text-xs text-white/30 mb-2">Placeholders disponiveis (clique para inserir):</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {PLACEHOLDERS.map(p => (
                  <button
                    key={p}
                    onClick={() => insertPlaceholder(p)}
                    className="text-xs bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 px-2 py-0.5 rounded font-mono transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={20}
              value={form.clausulas}
              onChange={e => setForm(f => ({ ...f, clausulas: e.target.value }))}
              placeholder="Digite o texto do contrato aqui. Use os placeholders acima para campos dinamicos..."
              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/15 outline-none focus:border-violet-500/30 transition-colors font-mono leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-violet-400" />
              <p className="text-sm font-medium text-white/70">Preview com dados de exemplo</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-4">
              <pre className="text-sm text-white/70 whitespace-pre-wrap font-sans leading-relaxed">
                {renderPreview(form.clausulas) || <span className="text-white/20">Comece a digitar as clausulas para ver o preview...</span>}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
