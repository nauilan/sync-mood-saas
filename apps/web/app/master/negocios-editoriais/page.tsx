'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Building2, Plus, Edit3, Trash2, Save, Check, Loader2,
  AlertTriangle, ChevronDown, ChevronUp, FileText, Globe,
  Calendar, Percent, ShieldCheck, Info,
} from 'lucide-react'
// (Supabase client removido — carregamento via API routes server-side)

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Editora { id: string; nome_fantasia: string; razao_social: string; cnpj?: string }
interface TipoDireito { id: string; nome: string; codigo: string }
interface Negocio {
  id: string
  tenant_id: string
  nome: string
  codigo_interno?: string
  status: 'ativo' | 'inativo' | 'encerrado'
  editora_administrada_id: string
  editora_administrada_nome: string
  editora_administradora_id: string
  editora_administradora_nome: string
  percentual_administrada: number
  percentual_administradora: number
  receitas_aplicaveis: string[]
  abrangencia_tipo: string
  abrangencia_ids: string[]
  territorios: string[]
  data_inicio: string
  data_fim?: string
  contrato_url?: string
  contrato_nome_arquivo?: string
  tipo_direito_id?: string | null
  observacoes?: string
  created_at: string
  updated_at: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const RECEITAS_OPCOES = [
  { value: 'execucao_publica', label: 'Execução Pública' },
  { value: 'digital',          label: 'Direitos Digitais / Fonomecânicos' },
  { value: 'sync',             label: 'Sincronização' },
  { value: 'mecanico',         label: 'Fonomecânicos (Físico)' },
  { value: 'licenciamento',    label: 'Licenciamento Direto' },
  { value: 'internacional',    label: 'Direitos Internacionais' },
  { value: 'direitos_editoriais', label: 'Direitos Editoriais (Letras/Partituras)' },
  { value: 'direitos_futuros', label: 'Direitos Futuros / Novas Modalidades' },
]
const TERRITORIOS_RAPIDOS = [
  { value: 'mundial', label: 'Mundo' },
  { value: 'brasil',  label: 'Brasil' },
]
const PAISES_ESPECIFICOS = [
  { value: 'AR', label: 'Argentina' },
  { value: 'BO', label: 'Bolívia' },
  { value: 'CA', label: 'Canadá' },
  { value: 'CL', label: 'Chile' },
  { value: 'CN', label: 'China' },
  { value: 'CO', label: 'Colômbia' },
  { value: 'DE', label: 'Alemanha' },
  { value: 'EC', label: 'Equador' },
  { value: 'ES', label: 'Espanha' },
  { value: 'FR', label: 'França' },
  { value: 'GB', label: 'Reino Unido' },
  { value: 'IT', label: 'Itália' },
  { value: 'JP', label: 'Japão' },
  { value: 'KR', label: 'Coreia do Sul' },
  { value: 'MX', label: 'México' },
  { value: 'NL', label: 'Holanda' },
  { value: 'PE', label: 'Peru' },
  { value: 'PT', label: 'Portugal' },
  { value: 'PY', label: 'Paraguai' },
  { value: 'SE', label: 'Suécia' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'UY', label: 'Uruguai' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'ZA', label: 'África do Sul' },
]
const TERRITORIOS_TODOS = [...TERRITORIOS_RAPIDOS, ...PAISES_ESPECIFICOS]
// Mapeamento de compatibilidade para valores antigos já armazenados no banco
const LEGACY_TERRITORIO_LABELS: Record<string, string> = {
  america_latina: 'América Latina',
  europa: 'Europa',
  america_norte: 'América do Norte',
  asia: 'Ásia',
  outros: 'Outros',
}
// Mantido para compatibilidade com NegocioCard e outros pontos que usavam TERRITORIOS_OPCOES
const TERRITORIOS_OPCOES = TERRITORIOS_TODOS
const ABRANGENCIA_OPCOES = [
  { value: 'catalogo_inteiro', label: 'Catálogo inteiro' },
  { value: 'obras_especificas', label: 'Obras específicas' },
  { value: 'autor_especifico', label: 'Autor específico' },
  { value: 'grupo_autores',    label: 'Grupo de autores' },
]
const STATUS_COLOR: Record<string, string> = {
  ativo:      'text-emerald-400 bg-emerald-500/10',
  inativo:    'text-amber-400 bg-amber-500/10',
  encerrado:  'text-rose-400 bg-rose-500/10',
}

// ─── Formulário vazio ─────────────────────────────────────────────────────────
const FORM_EMPTY = {
  nome: '',
  codigo_interno: '',
  status: 'ativo' as const,
  editora_administrada_id: '',
  editora_administrada_nome: '',
  editora_administradora_id: '',
  editora_administradora_nome: '',
  percentual_administrada: 60,
  percentual_administradora: 40,
  receitas_aplicaveis: ['execucao_publica', 'digital', 'sync', 'mecanico', 'internacional', 'licenciamento'],
  abrangencia_tipo: 'catalogo_inteiro',
  territorios: ['mundial'],
  data_inicio: new Date().toISOString().slice(0, 10),
  data_fim: '',
  tipo_direito_id: '',
  contrato_url: '',
  contrato_nome_arquivo: '',
  observacoes: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d?: string | null) {
  if (!d) return 'Indeterminado'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}
function fmtPct(n: number) { return n.toFixed(4).replace(/\.?0+$/, '') + '%' }
function getTerritoryLabel(v: string): string {
  return TERRITORIOS_TODOS.find(t => t.value === v)?.label
    ?? LEGACY_TERRITORIO_LABELS[v]
    ?? v
}

// ─── Componente de formulário inline ─────────────────────────────────────────
function NegocioForm({
  initial, editoras, tipoDireitos, tenantId, onSave, onCancel,
}: {
  initial: typeof FORM_EMPTY & { id?: string }
  editoras: Editora[]
  tipoDireitos: TipoDireito[]
  tenantId: string
  onSave: (n: Negocio) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [mostrarPaises, setMostrarPaises] = useState(false)
  const [buscaPais, setBuscaPais] = useState('')

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  // Quando muda a administrada, preenche o nome
  const pickAdministrada = (id: string) => {
    const e = editoras.find(x => x.id === id)
    set('editora_administrada_id', id)
    set('editora_administrada_nome', e?.nome_fantasia ?? '')
  }
  const pickAdministradora = (id: string) => {
    const e = editoras.find(x => x.id === id)
    set('editora_administradora_id', id)
    set('editora_administradora_nome', e?.nome_fantasia ?? '')
  }

  const toggleReceita = (v: string) => {
    const arr = form.receitas_aplicaveis as string[]
    set('receitas_aplicaveis', arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }
  const toggleTerritorio = (v: string) => {
    const arr = form.territorios as string[]
    set('territorios', arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  // Sincroniza complementar automaticamente
  const handlePctAdm = (v: number) => {
    const safe = Math.min(100, Math.max(0, v))
    set('percentual_administrada', safe)
    set('percentual_administradora', parseFloat((100 - safe).toFixed(4)))
  }
  const handlePctAdmR = (v: number) => {
    const safe = Math.min(100, Math.max(0, v))
    set('percentual_administradora', safe)
    set('percentual_administrada', parseFloat((100 - safe).toFixed(4)))
  }

  const soma = Number(form.percentual_administrada) + Number(form.percentual_administradora)
  const somaOk = Math.round(soma * 10000) === 1000000
  const specificSelected = (form.territorios as string[]).filter(v =>
    PAISES_ESPECIFICOS.some(p => p.value === v)
  )
  const paisesFiltrados = PAISES_ESPECIFICOS.filter(p =>
    p.label.toLowerCase().includes(buscaPais.toLowerCase()) ||
    p.value.toLowerCase().includes(buscaPais.toLowerCase())
  )

  const save = async () => {
    setErr(null)
    if (!form.editora_administrada_id)   return setErr('Selecione a Editora Administrada')
    if (!form.editora_administradora_id) return setErr('Selecione a Editora Administradora')
    if (!somaOk)                         return setErr('Percentuais devem somar exatamente 100%')
    if (!form.data_inicio)               return setErr('Data de início obrigatória')
    if (!form.nome.trim())               return setErr('Nome do negócio obrigatório')

    setSaving(true)
    try {
      const payload = {
        ...form,
        tenant_id: tenantId,
        data_fim: form.data_fim || null,
        percentual_administrada:   Number(form.percentual_administrada),
        percentual_administradora: Number(form.percentual_administradora),
        tipo_direito_id: (form as any).tipo_direito_id || null,
        contrato_url: (form as any).contrato_url || null,
        contrato_nome_arquivo: (form as any).contrato_nome_arquivo || null,
      }
      const url = (initial as any).id
        ? `/api/negocios-editoriais/${(initial as any).id}`
        : '/api/negocios-editoriais'
      const res = await fetch(url, {
        method: (initial as any).id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? data?.error ?? 'Erro ao salvar')
      onSave(data.negocio)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors'
  const labelCls = 'text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block'

  return (
    <div className="bg-[#0d1526] border border-violet-500/20 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-violet-400" />
        </div>
        <h3 className="text-sm font-bold text-white">
          {(initial as any).id ? 'Editar Negócio' : 'Novo Negócio entre Editoras'}
        </h3>
      </div>

      {err && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {err}
        </div>
      )}

      {/* Nome + código */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nome do negócio *</label>
          <input value={form.nome} onChange={e => set('nome', e.target.value)}
            placeholder="Ex: Contrato Adm. 2025 – Lojas Mil x Top Show" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Código interno</label>
          <input value={form.codigo_interno} onChange={e => set('codigo_interno', e.target.value)}
            placeholder="ADM-001" className={inputCls} />
        </div>
      </div>

      {/* Partes */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Editora Titular / Administrada *</label>
          <select value={form.editora_administrada_id} onChange={e => pickAdministrada(e.target.value)} className={inputCls}>
            <option value="">— selecionar —</option>
            {editoras.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia}</option>)}
          </select>
          <p className="text-[10px] text-white/25 mt-0.5">Editora que possui os direitos editoriais</p>
        </div>
        <div>
          <label className={labelCls}>Editora Gestora / Administradora *</label>
          <select value={form.editora_administradora_id} onChange={e => pickAdministradora(e.target.value)} className={inputCls}>
            <option value="">— selecionar —</option>
            {editoras.map(e => <option key={e.id} value={e.id}>{e.nome_fantasia}</option>)}
          </select>
          <p className="text-[10px] text-white/25 mt-0.5">Editora que presta serviço de administração</p>
        </div>
      </div>

      {/* Percentuais */}
      <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-violet-400" />
          <p className="text-xs font-semibold text-white/70">Divisão Contratual</p>
          <span className={`ml-auto text-xs font-bold ${somaOk ? 'text-emerald-400' : 'text-rose-400'}`}>
            {soma.toFixed(4)}% {somaOk ? '✓' : '≠ 100%'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>% Editora Administrada</label>
            <input type="number" min={0} max={100} step={0.0001}
              value={form.percentual_administrada}
              onChange={e => handlePctAdm(parseFloat(e.target.value) || 0)}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>% Editora Administradora</label>
            <input type="number" min={0} max={100} step={0.0001}
              value={form.percentual_administradora}
              onChange={e => handlePctAdmR(parseFloat(e.target.value) || 0)}
              className={inputCls} />
          </div>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden flex">
          <div className="h-full bg-sky-500 transition-all" style={{ width: `${form.percentual_administrada}%` }} />
          <div className="h-full bg-violet-500 transition-all flex-1" />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-sky-400 font-semibold">{form.editora_administrada_nome || 'Administrada'} — {form.percentual_administrada}%</span>
          <span className="text-violet-400 font-semibold">{form.editora_administradora_nome || 'Administradora'} — {form.percentual_administradora}%</span>
        </div>
        <p className="text-[10px] text-amber-400/60 flex items-center gap-1.5">
          <Info className="w-3 h-3 shrink-0" />
          Estes percentuais incidem <strong>somente sobre a parcela editorial da Editora Titular</strong>, nunca sobre a obra inteira.
          Ex.: autor 50% da obra, editora 25% → parte editorial = 12,5%. Se regra for 60/40, Titular fica 7,5% e Gestora 5%.
        </p>
      </div>

      {/* Direitos Administrados */}
      <div>
        <label className={labelCls}>Direitos Administrados</label>
        <div className="flex flex-wrap gap-2">
          {RECEITAS_OPCOES.map(r => (
            <button key={r.value} type="button"
              onClick={() => toggleReceita(r.value)}
              className={`h-7 px-3 rounded-lg text-xs font-semibold transition-colors border ${
                (form.receitas_aplicaveis as string[]).includes(r.value)
                  ? 'bg-violet-600/25 border-violet-500/40 text-violet-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white/60'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Territórios */}
      <div>
        <label className={labelCls}>Territórios</label>
        {/* Atalhos rápidos + botão "Territórios Específicos" */}
        <div className="flex flex-wrap gap-2 mb-2">
          {TERRITORIOS_RAPIDOS.map(t => (
            <button key={t.value} type="button"
              onClick={() => toggleTerritorio(t.value)}
              className={`h-7 px-3 rounded-lg text-xs font-semibold transition-colors border ${
                (form.territorios as string[]).includes(t.value)
                  ? 'bg-sky-600/25 border-sky-500/40 text-sky-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white/60'
              }`}>
              {t.label}
            </button>
          ))}
          <button type="button"
            onClick={() => setMostrarPaises(v => !v)}
            className={`h-7 px-3 rounded-lg text-xs font-semibold transition-colors border ${
              mostrarPaises || specificSelected.length > 0
                ? 'bg-amber-600/20 border-amber-500/30 text-amber-300'
                : 'bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white/60'
            }`}>
            Territórios Específicos{specificSelected.length > 0 ? ` (${specificSelected.length})` : ''}
          </button>
        </div>

        {/* Chips dos países selecionados */}
        {specificSelected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {specificSelected.map(v => {
              const country = PAISES_ESPECIFICOS.find(p => p.value === v)
              return (
                <span key={v} className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] bg-sky-600/20 border border-sky-500/30 text-sky-300">
                  {country?.label ?? v}
                  <button type="button" onClick={() => toggleTerritorio(v)}
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-colors ml-0.5">
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        )}

        {/* Painel expansível com busca */}
        {mostrarPaises && (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-3">
            <input
              type="text"
              value={buscaPais}
              onChange={e => setBuscaPais(e.target.value)}
              placeholder="Buscar país..."
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 mb-2 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
              {paisesFiltrados.length === 0 ? (
                <p className="text-[11px] text-white/30 text-center py-3">Nenhum país encontrado</p>
              ) : paisesFiltrados.map(p => {
                const selected = (form.territorios as string[]).includes(p.value)
                return (
                  <button key={p.value} type="button"
                    onClick={() => toggleTerritorio(p.value)}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors text-left ${
                      selected ? 'bg-sky-600/15 text-sky-300' : 'hover:bg-white/[0.04] text-white/60'
                    }`}>
                    <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                      selected ? 'bg-sky-500 border-sky-500' : 'border-white/20'
                    }`}>
                      {selected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-[12px]">{p.label}</span>
                    <span className="text-[10px] text-white/25 ml-auto font-mono">{p.value}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Abrangência */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Abrangência</label>
          <select value={form.abrangencia_tipo} onChange={e => set('abrangencia_tipo', e.target.value)} className={inputCls}>
            {ABRANGENCIA_OPCOES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
      </div>

      {/* Vigência */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Data início *</label>
          <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data fim (vazio = indeterminado)</label>
          <input type="date" value={form.data_fim} onChange={e => set('data_fim', e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Tipo de Direito + Documento */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tipo de Direito (vazio = todos)</label>
          <select value={(form as any).tipo_direito_id ?? ''} onChange={e => set('tipo_direito_id', e.target.value || null)} className={inputCls}>
            <option value="">— Todos os direitos —</option>
            {tipoDireitos.map(td => <option key={td.id} value={td.id}>{td.nome}</option>)}
          </select>
          <p className="text-[10px] text-white/25 mt-0.5">Regra se aplica a esse direito específico</p>
        </div>
        <div>
          <label className={labelCls}>Nome do Arquivo do Contrato</label>
          <input value={(form as any).contrato_nome_arquivo ?? ''} onChange={e => set('contrato_nome_arquivo', e.target.value)}
            placeholder="Ex: contrato-adm-2025.pdf" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Link externo do Contrato (opcional)</label>
        <input value={(form as any).contrato_url ?? ''} onChange={e => set('contrato_url', e.target.value)}
          placeholder="https://drive.google.com/... ou DocuSign/Clicksign" className={inputCls} />
      </div>

      {/* Observações */}
      <div>
        <label className={labelCls}>Observações</label>
        <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
          rows={2} placeholder="Condições especiais, cláusulas importantes..."
          className={inputCls + ' resize-none'} />
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 h-9 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors">
          Cancelar
        </button>
        <button onClick={save} disabled={saving}
          className="flex items-center justify-center gap-1.5 flex-1 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Salvando...' : 'Salvar Negócio'}
        </button>
      </div>
    </div>
  )
}

// ─── Card de Negócio ──────────────────────────────────────────────────────────
function NegocioCard({
  negocio, onEdit, onDelete,
}: { negocio: Negocio; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const vigente = !negocio.data_fim || new Date(negocio.data_fim) >= new Date()
  const receitas = (negocio.receitas_aplicaveis ?? []).map(r =>
    RECEITAS_OPCOES.find(x => x.value === r)?.label ?? r
  )
  const territorios = (negocio.territorios ?? []).map(t => getTerritoryLabel(t))

  return (
    <div className={`bg-[#0d1526] border rounded-2xl overflow-hidden transition-all ${
      negocio.status === 'ativo' && vigente ? 'border-white/[0.08]' : 'border-white/[0.04] opacity-70'
    }`}>
      {/* Header do card */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(x => !x)}
      >
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-bold text-white truncate">{negocio.nome}</h3>
            {negocio.codigo_interno && (
              <span className="text-[10px] font-mono text-white/35 bg-white/5 px-1.5 py-0.5 rounded">{negocio.codigo_interno}</span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[negocio.status]}`}>
              {negocio.status}
            </span>
            {!vigente && (
              <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">Vencido</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="text-sky-300 font-semibold">{negocio.editora_administrada_nome}</span>
            <span>→</span>
            <span className="text-violet-300 font-semibold">{negocio.editora_administradora_nome}</span>
          </div>
        </div>

        {/* Percentuais — destaque visual */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center">
            <p className="text-lg font-bold text-sky-400 tabular-nums">{negocio.percentual_administrada}%</p>
            <p className="text-[9px] text-white/30">Adm.</p>
          </div>
          <div className="text-white/20 text-xs font-bold">/</div>
          <div className="text-center">
            <p className="text-lg font-bold text-violet-400 tabular-nums">{negocio.percentual_administradora}%</p>
            <p className="text-[9px] text-white/30">Admra.</p>
          </div>
        </div>

        <button className="text-white/20 hover:text-white/50 transition-colors shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-white/[0.06] p-5 space-y-4">
          {/* Barra visual de divisão */}
          <div>
            <div className="w-full h-3 bg-white/[0.04] rounded-full overflow-hidden flex">
              <div className="h-full bg-sky-500 rounded-l-full transition-all" style={{ width: `${negocio.percentual_administrada}%` }} />
              <div className="h-full bg-violet-500 rounded-r-full flex-1" />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px]">
              <span className="text-sky-400 font-semibold">{negocio.editora_administrada_nome} — {negocio.percentual_administrada}%</span>
              <span className="text-violet-400 font-semibold">{negocio.editora_administradora_nome} — {negocio.percentual_administradora}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-[10px] text-white/30 mb-1">Abrangência</p>
              <p className="text-white/70 font-medium">{ABRANGENCIA_OPCOES.find(a => a.value === negocio.abrangencia_tipo)?.label ?? negocio.abrangencia_tipo}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Vigência</p>
              <p className="text-white/70 font-medium">{fmtDate(negocio.data_inicio)} → {fmtDate(negocio.data_fim)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Territórios</p>
              <p className="text-white/70 font-medium">{territorios.join(' · ')}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-white/30 mb-1.5">Direitos Administrados</p>
            <div className="flex flex-wrap gap-1.5">
              {receitas.map(r => (
                <span key={r} className="text-[10px] font-semibold bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20">
                  {r}
                </span>
              ))}
            </div>
          </div>

          {negocio.observacoes && (
            <div className="bg-white/[0.03] rounded-xl px-4 py-3">
              <p className="text-[10px] text-white/30 mb-1">Observações</p>
              <p className="text-xs text-white/60 leading-relaxed">{negocio.observacoes}</p>
            </div>
          )}

          {/* Tipo de Direito + Documento */}
          {(negocio.tipo_direito_id || negocio.contrato_url || negocio.contrato_nome_arquivo) && (
            <div className="bg-white/[0.03] rounded-xl px-4 py-3 space-y-2">
              {negocio.tipo_direito_id && (
                <p className="text-[11px] text-white/50">
                  <span className="text-white/30 text-[10px] uppercase tracking-wider mr-1">Tipo de Direito:</span>
                  <span className="font-semibold text-violet-300">{negocio.tipo_direito_id}</span>
                </p>
              )}
              {(negocio.contrato_url || negocio.contrato_nome_arquivo) && (
                <p className="text-[11px] text-white/50 flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-white/30 shrink-0" />
                  {negocio.contrato_url
                    ? <a href={negocio.contrato_url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline truncate">{negocio.contrato_nome_arquivo || 'Ver contrato'}</a>
                    : <span>{negocio.contrato_nome_arquivo}</span>
                  }
                </p>
              )}
            </div>
          )}

          {/* Aviso de obrigatoriedade */}
          <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-400/80 leading-relaxed">
              O Analítico consulta exclusivamente este cadastro para distribuir a parte editorial.
              Nenhum cálculo é feito com base no CWR, BackOffice ou UBEM.
            </p>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 hover:bg-violet-500/15 text-xs text-white/50 hover:text-violet-300 transition-colors border border-white/[0.06]">
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
            <button onClick={onDelete}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 hover:bg-rose-500/15 text-xs text-white/50 hover:text-rose-400 transition-colors border border-white/[0.06]">
              <Trash2 className="w-3.5 h-3.5" /> Remover
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function NegociosEditoriaisPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [editoras, setEditoras] = useState<Editora[]>([])
  const [tipoDireitos, setTipoDireitos] = useState<TipoDireito[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Negocio | null>(null)
  const [tenantId, setTenantId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Carrega dados via API routes (server-side, com token de sessão)
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [resNegocios, resEditoras, resTipos, resMe] = await Promise.all([
          fetch('/api/negocios-editoriais?limit=200'),
          fetch('/api/editoras?status=ativo'),
          fetch('/api/tipos-direito'),
          fetch('/api/me'),
        ])

        const negData = await resNegocios.json()
        setNegocios(negData.negocios ?? [])

        const edData = await resEditoras.json()
        setEditoras(edData.editoras ?? [])

        const tdData = await resTipos.json()
        setTipoDireitos(tdData.tipos ?? [])

        const meData = await resMe.json()
        if (meData?.tenant_id) setTenantId(meData.tenant_id)
        else {
          // Fallback: tenant do primeiro negócio
          const primeiro = (negData.negocios ?? [])[0]
          if (primeiro?.tenant_id) setTenantId(primeiro.tenant_id)
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSave = (n: Negocio) => {
    setNegocios(prev => {
      const idx = prev.findIndex(x => x.id === n.id)
      if (idx >= 0) { const arr = [...prev]; arr[idx] = n; return arr }
      return [n, ...prev]
    })
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este negócio? O Analítico deixará de calcular divisões baseadas nele.')) return
    await fetch(`/api/negocios-editoriais/${id}`, { method: 'DELETE' })
    setNegocios(prev => prev.filter(x => x.id !== id))
  }

  const filtered = useMemo(() =>
    filterStatus ? negocios.filter(n => n.status === filterStatus) : negocios,
  [negocios, filterStatus])

  // KPIs
  const kpis = useMemo(() => ({
    total:    negocios.length,
    ativos:   negocios.filter(n => n.status === 'ativo').length,
    inativos: negocios.filter(n => n.status === 'inativo').length,
    vencidos: negocios.filter(n => n.data_fim && new Date(n.data_fim) < new Date()).length,
  }), [negocios])

  const editingForm = editing
    ? { ...FORM_EMPTY, ...editing, data_fim: editing.data_fim ?? '', id: editing.id }
    : FORM_EMPTY

  return (
    <div className="space-y-6">
      <PageHeader
        title="Negócios entre Editoras"
        description="Contratos de administração entre Editora Administrada e Editora Administradora — base obrigatória do Analítico"
        actions={
          !showForm && !editing ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Novo Negócio
            </button>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: kpis.total,    color: 'text-white/80' },
          { label: 'Ativos', value: kpis.ativos,   color: 'text-emerald-400' },
          { label: 'Inativos', value: kpis.inativos, color: 'text-amber-400' },
          { label: 'Vencidos', value: kpis.vencidos, color: 'text-rose-400' },
        ].map(k => (
          <div key={k.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[11px] text-white/40 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Aviso instrucional */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-5 py-4">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-300 mb-0.5">Regra Fundamental do Analítico</p>
          <p className="text-xs text-amber-400/70 leading-relaxed mb-2">
            O Analítico <strong>jamais</strong> deduz a divisão entre Editora Administrada e Administradora
            a partir do CWR, BackOffice, UBEM ou qualquer fonte externa.
            Se não houver negócio cadastrado aqui, o sistema emite alerta de <em>"Regra de negócio não localizada"</em>
            e envia o registro para conferência manual.
          </p>
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2 text-[11px] text-amber-300/80 font-mono leading-relaxed">
            <span className="text-amber-300/50">Exemplo — Obra: A CASA | Autor Roberto 50% | Editado 25% para LR Edições</span><br/>
            Roberto = 50% × 75% = <strong>37,5%</strong> da obra<br/>
            LR Edições = 50% × 25% = <strong>12,5%</strong> da obra<br/>
            <span className="text-amber-300/50">Negócio LR Edições → Top Show Music: 60/40</span><br/>
            LR Edições = 12,5% × 60% = <strong>7,5%</strong> · Top Show = 12,5% × 40% = <strong>5%</strong><br/>
            <span className="text-amber-300/40">↳ A Top Show recebe 40% da parte editorial da LR — não 40% da obra inteira.</span>
          </div>
        </div>
      </div>

      {/* Formulário novo */}
      {showForm && (
        <NegocioForm
          initial={FORM_EMPTY}
          editoras={editoras}
          tipoDireitos={tipoDireitos}
          tenantId={tenantId}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Formulário de edição */}
      {editing && (
        <NegocioForm
          initial={editingForm as any}
          editoras={editoras}
          tipoDireitos={tipoDireitos}
          tenantId={tenantId}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* Filtros */}
      {!showForm && !editing && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-white/40 mr-1">Filtrar:</p>
          {['', 'ativo', 'inativo', 'encerrado'].map(s => (
            <button key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-7 px-3 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === s
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                  : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/60'
              }`}>
              {s === '' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs text-white/30">{filtered.length} negócio{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/30 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando negócios...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/25">
          <Building2 className="w-10 h-10" />
          <p className="text-sm font-medium">Nenhum negócio cadastrado</p>
          <p className="text-xs text-center max-w-sm leading-relaxed">
            Cadastre os contratos entre Editora Administrada e Editora Administradora
            para que o Analítico possa calcular a distribuição financeira corretamente.
          </p>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors mt-1">
              <Plus className="w-4 h-4" /> Cadastrar primeiro negócio
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => (
            <NegocioCard
              key={n.id}
              negocio={n}
              onEdit={() => { setEditing(n); setShowForm(false) }}
              onDelete={() => handleDelete(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
