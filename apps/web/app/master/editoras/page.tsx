'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2, Users, Music, FileText, Star,
  CheckCircle, XCircle, ArrowRight, Plus, X, Save, Loader2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'

const ACCENT_COLORS = [
  { border: 'border-violet-500/20', text: 'text-violet-400', kpi: 'text-violet-300', icon: 'bg-violet-500/10' },
  { border: 'border-sky-500/20',    text: 'text-sky-400',    kpi: 'text-sky-300',    icon: 'bg-sky-500/10'    },
  { border: 'border-emerald-500/20',text: 'text-emerald-400',kpi: 'text-emerald-300',icon: 'bg-emerald-500/10'},
  { border: 'border-amber-500/20',  text: 'text-amber-400',  kpi: 'text-amber-300',  icon: 'bg-amber-500/10'  },
  { border: 'border-rose-500/20',   text: 'text-rose-400',   kpi: 'text-rose-300',   icon: 'bg-rose-500/10'   },
]

type TipoEditora = 'master' | 'administrada' | 'externa'

interface Editora {
  id: string
  nome_fantasia: string
  razao_social: string
  cnpj: string | null
  tipo_editora: TipoEditora
  controlada: boolean
  status: string
  codigo_publisher_cwr: string | null
  codigo_cae: string | null
  codigo_ipi: string | null
  codigo_interno_cwr: string | null
  pais_registro: string | null
  codigo_ecad: string | null
  created_at: string
}

const FORM_INITIAL = {
  nome_fantasia: '',
  razao_social: '',
  cnpj: '',
  tipo_editora: 'administrada' as TipoEditora,
  controlada: false,
  codigo_publisher_cwr: '',
  codigo_cae: '',
  codigo_ipi: '',
  codigo_interno_cwr: '',
  pais_registro: 'BR',
  codigo_ecad: '',
}

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function EditoraCard({ editora, idx }: { editora: Editora; idx: number }) {
  const isMaster = editora.tipo_editora === 'master'
  const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length]

  return (
    <Link href={`/master/editoras/${editora.id}`} className="group block">
      <div className={`relative bg-[#0d1526] border rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${accent.border} hover:border-opacity-40`}>
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-base font-bold ${accent.icon} ${accent.text}`}>
            {getInitials(editora.nome_fantasia)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-white truncate max-w-[180px]">{editora.nome_fantasia}</h3>
              {isMaster && (
                <span className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-600/15 border border-violet-500/25 px-1.5 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5" /> Própria / Gestora
                </span>
              )}
              {editora.tipo_editora !== 'master' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  editora.tipo_editora === 'administrada'
                    ? 'bg-sky-500/10 text-sky-300'
                    : 'bg-white/5 text-white/40'
                }`}>
                  {editora.tipo_editora}
                </span>
              )}
              <span className={`flex items-center gap-0.5 text-[10px] ${editora.controlada ? 'text-emerald-400' : 'text-white/30'}`}>
                {editora.controlada
                  ? <CheckCircle className="w-3 h-3" />
                  : <XCircle className="w-3 h-3" />}
                {editora.controlada ? 'Controlada' : 'Externa'}
              </span>
              <Badge variant={editora.status === 'ativo' ? 'emerald' : 'rose'}>
                {editora.status === 'ativo' ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            <p className="text-xs text-white/30 truncate">{editora.razao_social}</p>
            {editora.cnpj && <p className="text-xs text-white/20 font-mono">{editora.cnpj}</p>}
            {editora.codigo_publisher_cwr && (
              <p className="text-[10px] font-mono text-amber-400/60 mt-0.5">CWR: {editora.codigo_publisher_cwr}</p>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors flex-shrink-0 mt-1" />
        </div>

        <div className={`grid grid-cols-3 gap-2 pt-4 border-t ${accent.border}`}>
          <div className="text-center">
            <Users className={`w-3 h-3 ${accent.text} mx-auto mb-0.5`} />
            <p className={`text-lg font-bold tabular-nums ${accent.kpi}`}>—</p>
            <p className="text-[10px] text-white/25">Titulares</p>
          </div>
          <div className="text-center">
            <Music className={`w-3 h-3 ${accent.text} mx-auto mb-0.5`} />
            <p className={`text-lg font-bold tabular-nums ${accent.kpi}`}>—</p>
            <p className="text-[10px] text-white/25">Obras</p>
          </div>
          <div className="text-center">
            <FileText className={`w-3 h-3 ${accent.text} mx-auto mb-0.5`} />
            <p className={`text-lg font-bold tabular-nums ${accent.kpi}`}>—</p>
            <p className="text-[10px] text-white/25">Contratos</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function EditorasPage() {
  const [editoras, setEditoras]   = useState<Editora[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(FORM_INITIAL)
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/editoras?status=todos')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? data?.error ?? 'Erro ao carregar editoras')
      setEditoras(data.editoras ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/editoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? data?.error ?? 'Erro ao salvar editora')
      setShowForm(false)
      setForm(FORM_INITIAL)
      await load()
    } catch (e: any) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const master       = editoras.filter(e => e.tipo_editora === 'master')
  const administradas = editoras.filter(e => e.tipo_editora !== 'master')

  return (
    <div className="space-y-8">
      <PageHeader
        title="Editoras"
        description="Estrutura editorial — administradora e editoras vinculadas"
        actions={
          <button
            onClick={() => { setShowForm(true); setSaveError(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Editora
          </button>
        }
      />

      {/* Formulário inline */}
      {showForm && (
        <div className="bg-[#0d1526] border border-violet-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">Nova Editora</h3>
            <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Nome Fantasia *</label>
                <input
                  required
                  value={form.nome_fantasia}
                  onChange={e => setForm(f => ({ ...f, nome_fantasia: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
                  placeholder="Ex: LR Edições"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Razão Social *</label>
                <input
                  required
                  value={form.razao_social}
                  onChange={e => setForm(f => ({ ...f, razao_social: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
                  placeholder="Ex: LR Edições Musicais Ltda"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">CNPJ</label>
                <input
                  value={form.cnpj}
                  onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Código Publisher CWR</label>
                <input
                  value={form.codigo_publisher_cwr}
                  onChange={e => setForm(f => ({ ...f, codigo_publisher_cwr: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                  placeholder="Ex: ED01"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Código CAE / IPI</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.codigo_cae}
                    onChange={e => setForm(f => ({ ...f, codigo_cae: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                    placeholder="CAE"
                  />
                  <input
                    value={form.codigo_ipi}
                    onChange={e => setForm(f => ({ ...f, codigo_ipi: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                    placeholder="IPI"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Código Interno CWR</label>
                <input
                  value={form.codigo_interno_cwr}
                  onChange={e => setForm(f => ({ ...f, codigo_interno_cwr: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                  placeholder="Ex: TS01"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">Código ECAD</label>
                  <input
                    value={form.codigo_ecad}
                    onChange={e => setForm(f => ({ ...f, codigo_ecad: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                    placeholder="ECAD"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">País de Registro</label>
                  <input
                    value={form.pais_registro}
                    onChange={e => setForm(f => ({ ...f, pais_registro: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-violet-500/50"
                    placeholder="BR"
                    maxLength={2}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Tipo</label>
                <select
                  value={form.tipo_editora}
                  onChange={e => setForm(f => ({ ...f, tipo_editora: e.target.value as TipoEditora }))}
                  className="w-full bg-[#0d1526] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                >
                  <option value="master">Própria (Gestora)</option>
                  <option value="administrada">Administrada</option>
                  <option value="externa">Externa</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, controlada: !f.controlada }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.controlada ? 'bg-emerald-500' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.controlada ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-white/60">Editora controlada</span>
              </div>
            </div>

            {saveError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{saveError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-white/40">Editoras</span>
          </div>
          {loading
            ? <div className="h-8 bg-white/5 rounded animate-pulse" />
            : <><p className="text-2xl font-bold text-violet-400">{editoras.length}</p><p className="text-xs text-white/25">{administradas.length} administradas</p></>
          }
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-white/40">Controladas</span>
          </div>
          {loading
            ? <div className="h-8 bg-white/5 rounded animate-pulse" />
            : <><p className="text-2xl font-bold text-emerald-400">{editoras.filter(e => e.controlada).length}</p><p className="text-xs text-white/25">do grupo</p></>
          }
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-white/40">Externas</span>
          </div>
          {loading
            ? <div className="h-8 bg-white/5 rounded animate-pulse" />
            : <><p className="text-2xl font-bold text-amber-400">{editoras.filter(e => !e.controlada).length}</p><p className="text-xs text-white/25">não controladas</p></>
          }
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-white/40">Master</span>
          </div>
          {loading
            ? <div className="h-8 bg-white/5 rounded animate-pulse" />
            : <><p className="text-2xl font-bold text-sky-400">{master.length}</p><p className="text-xs text-white/25">administradora(s)</p></>
          }
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Skeleton de carregamento */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#0d1526] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
              <div className="flex gap-4 mb-5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="h-12 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Administradora(s) master */}
      {!loading && master.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Administradora</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {master.map((e, i) => <EditoraCard key={e.id} editora={e} idx={0} />)}
          </div>
        </section>
      )}

      {/* Editoras administradas / externas */}
      {!loading && administradas.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">
            Editoras Administradas ({administradas.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {administradas.map((e, i) => <EditoraCard key={e.id} editora={e} idx={i + 1} />)}
          </div>
        </section>
      )}

      {/* Estado vazio */}
      {!loading && !error && editoras.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma editora cadastrada</p>
          <p className="text-xs mt-1">Clique em "Nova Editora" para começar</p>
        </div>
      )}
    </div>
  )
}
