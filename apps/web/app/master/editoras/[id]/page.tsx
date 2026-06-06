'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Building2, Pencil, Save, Loader2,
  X, Shield, Globe, Hash, Music, FileText,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { authFetch } from '@/lib/supabase/client'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Editora {
  id: string
  nome_fantasia: string
  razao_social: string
  cnpj: string | null
  tipo_editora: string
  controlada: boolean
  status: string
  codigo_publisher_cwr: string | null
  codigo_cae: string | null
  codigo_ipi: string | null
  codigo_interno_cwr: string | null
  pais_registro: string | null
  codigo_ecad: string | null
  codigo_interno: string | null
  created_at: string
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/40 w-52 flex-shrink-0">{label}</span>
      <span className="text-sm font-mono text-white/70 text-right flex-1">
        {value ?? <span className="text-white/20 font-sans">—</span>}
      </span>
    </div>
  )
}

export default function EditoraDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [editora, setEditora]   = useState<Editora | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm]         = useState<Partial<Editora>>({})
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res  = await authFetch(`/api/editoras/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? data?.error ?? 'Erro ao carregar')
      setEditora(data.editora ?? data.data ?? data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  function openEdit() {
    if (!editora) return
    setForm({
      nome_fantasia:      editora.nome_fantasia,
      razao_social:       editora.razao_social,
      cnpj:               editora.cnpj ?? '',
      tipo_editora:       editora.tipo_editora,
      controlada:         editora.controlada,
      status:             editora.status,
      codigo_publisher_cwr: editora.codigo_publisher_cwr ?? '',
      codigo_cae:         editora.codigo_cae ?? '',
      codigo_ipi:         editora.codigo_ipi ?? '',
      codigo_interno_cwr: editora.codigo_interno_cwr ?? '',
      pais_registro:      editora.pais_registro ?? 'BR',
      codigo_ecad:        editora.codigo_ecad ?? '',
      codigo_interno:     editora.codigo_interno ?? '',
    })
    setSaveError(null)
    setShowEdit(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const res  = await authFetch(`/api/editoras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? data?.error ?? 'Erro ao salvar')
      setShowEdit(false)
      await load()
    } catch (e: any) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
      </div>
    )
  }

  if (error || !editora) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-3 text-red-400 text-sm">
        {error ?? 'Editora não encontrada'}
        <button onClick={() => router.back()} className="text-white/40 hover:text-white/70 text-xs underline">
          Voltar
        </button>
      </div>
    )
  }

  const isMaster = editora.tipo_editora === 'master'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-1 text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <PageHeader
            title={editora.nome_fantasia}
            description={editora.razao_social}
            actions={
              <div className="flex items-center gap-2">
                <Badge variant={editora.status === 'ativo' ? 'emerald' : 'rose'}>
                  {editora.status === 'ativo' ? 'Ativa' : 'Inativa'}
                </Badge>
                {isMaster && <Badge variant="violet">Gestora</Badge>}
                {editora.controlada && <Badge variant="sky">Controlada</Badge>}
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
              </div>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados cadastrais */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-3.5 h-3.5 text-white/30" />
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Dados Cadastrais</h3>
          </div>
          <InfoRow label="Razão Social"     value={editora.razao_social} />
          <InfoRow label="Nome Fantasia"    value={editora.nome_fantasia} />
          <InfoRow label="CNPJ"             value={editora.cnpj} />
          <InfoRow label="Tipo"             value={editora.tipo_editora} />
          <InfoRow label="Cadastrado em"    value={new Date(editora.created_at).toLocaleDateString('pt-BR')} />
        </div>

        {/* Identificadores */}
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-3.5 h-3.5 text-white/30" />
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Identificadores</h3>
          </div>
          <InfoRow label="Código Interno (Sistema)" value={editora.codigo_interno} />
          <InfoRow label="Código Publisher CWR"     value={editora.codigo_publisher_cwr} />
          <InfoRow label="Código Interno CWR"       value={editora.codigo_interno_cwr} />
          <InfoRow label="CAE"                      value={editora.codigo_cae} />
          <InfoRow label="IPI"                      value={editora.codigo_ipi} />
          <InfoRow label="ECAD"                     value={editora.codigo_ecad} />
          <InfoRow label="País de Registro"         value={editora.pais_registro} />
        </div>
      </div>

      {/* ─── Drawer de edição ──────────────────────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-end">
          <form
            onSubmit={handleSave}
            className="relative w-full max-w-lg h-full bg-[#0a0f1e] border-l border-white/[0.06] overflow-y-auto flex flex-col"
          >
            {/* Header drawer */}
            <div className="sticky top-0 z-10 bg-[#0a0f1e] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Editar Editora</h2>
              <button type="button" onClick={() => setShowEdit(false)} className="text-white/40 hover:text-white/70">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4">
              {saveError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {saveError}
                </div>
              )}

              {/* Dados básicos */}
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Dados Básicos</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">Nome Fantasia *</label>
                  <input required value={form.nome_fantasia ?? ''} onChange={e => setForm(f => ({ ...f, nome_fantasia: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">Razão Social *</label>
                  <input required value={form.razao_social ?? ''} onChange={e => setForm(f => ({ ...f, razao_social: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">CNPJ</label>
                  <input value={form.cnpj ?? ''} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                    placeholder="00.000.000/0001-00" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1.5">Tipo</label>
                    <select value={form.tipo_editora ?? 'administrada'} onChange={e => setForm(f => ({ ...f, tipo_editora: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50">
                      <option value="master">Própria (Gestora)</option>
                      <option value="administrada">Administrada</option>
                      <option value="externa">Externa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1.5">Status</label>
                    <select value={form.status ?? 'ativo'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50">
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setForm(f => ({ ...f, controlada: !f.controlada }))}
                      className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${form.controlada ? 'bg-violet-600' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${form.controlada ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-[11px] text-white/50">Controlada / Administrada</span>
                  </label>
                </div>
              </div>

              {/* Identificadores */}
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider pt-2">Identificadores</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">
                    Código Interno <span className="text-violet-400/70">(Sistema)</span>
                  </label>
                  <input value={form.codigo_interno ?? ''} onChange={e => setForm(f => ({ ...f, codigo_interno: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                    placeholder="Ex: TOPSHOW, EDI001, LR001" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1.5">Código Publisher CWR</label>
                    <input value={form.codigo_publisher_cwr ?? ''} onChange={e => setForm(f => ({ ...f, codigo_publisher_cwr: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                      placeholder="Ex: 2646326" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1.5">Código Interno CWR</label>
                    <input value={form.codigo_interno_cwr ?? ''} onChange={e => setForm(f => ({ ...f, codigo_interno_cwr: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                      placeholder="Ex: TS01" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1.5">CAE</label>
                    <input value={form.codigo_cae ?? ''} onChange={e => setForm(f => ({ ...f, codigo_cae: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1.5">IPI</label>
                    <input value={form.codigo_ipi ?? ''} onChange={e => setForm(f => ({ ...f, codigo_ipi: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/50 mb-1.5">ECAD</label>
                    <input value={form.codigo_ecad ?? ''} onChange={e => setForm(f => ({ ...f, codigo_ecad: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">País de Registro</label>
                  <input value={form.pais_registro ?? 'BR'} onChange={e => setForm(f => ({ ...f, pais_registro: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                    placeholder="BR" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#0a0f1e] border-t border-white/[0.06] px-6 py-4 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowEdit(false)}
                className="text-sm text-white/50 hover:text-white/80 transition-colors px-4 py-2">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
