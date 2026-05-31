'use client'

import Link from 'next/link'
import { Building2, Users, Music, FileText, Shield, ArrowRight, Star } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { MOCK_EDITORAS } from '@/lib/mock-cadastros'
import type { EditoraAdministrada } from '@/lib/types-cadastros'

const ACCENT_COLORS = [
  { border: 'border-violet-500/20', bg: 'bg-violet-600/8', text: 'text-violet-400', kpi: 'text-violet-300', icon: 'bg-violet-500/10' },
  { border: 'border-sky-500/20', bg: 'bg-sky-600/8', text: 'text-sky-400', kpi: 'text-sky-300', icon: 'bg-sky-500/10' },
  { border: 'border-emerald-500/20', bg: 'bg-emerald-600/8', text: 'text-emerald-400', kpi: 'text-emerald-300', icon: 'bg-emerald-500/10' },
  { border: 'border-amber-500/20', bg: 'bg-amber-600/8', text: 'text-amber-400', kpi: 'text-amber-300', icon: 'bg-amber-500/10' },
  { border: 'border-rose-500/20', bg: 'bg-rose-600/8', text: 'text-rose-400', kpi: 'text-rose-300', icon: 'bg-rose-500/10' },
]

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function EditoraCard({ editora, idx }: { editora: EditoraAdministrada; idx: number }) {
  const isAdmin = editora.administradora_id === null
  const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length]

  return (
    <Link href={`/master/editoras/${editora.id}`} className="group block">
      <div className={`relative bg-[#0d1526] border rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${accent.border} hover:border-opacity-40`}>
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-base font-bold ${accent.icon} ${accent.text}`}>
            {getInitials(editora.nome_fantasia)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-white truncate max-w-[180px]">{editora.nome_fantasia}</h3>
              {isAdmin && (
                <span className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-600/15 border border-violet-500/25 px-1.5 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5" /> Administradora
                </span>
              )}
              <Badge variant={editora.ativa ? 'emerald' : 'rose'}>{editora.ativa ? 'Ativa' : 'Inativa'}</Badge>
            </div>
            <p className="text-xs text-white/30 truncate">{editora.razao_social}</p>
            {editora.cnpj && <p className="text-xs text-white/20 font-mono">{editora.cnpj}</p>}
          </div>
          <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors flex-shrink-0 mt-1" />
        </div>

        {/* KPIs */}
        <div className={`grid grid-cols-3 gap-2 pt-4 border-t ${accent.border}`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Users className={`w-3 h-3 ${accent.text}`} />
            </div>
            <p className={`text-lg font-bold tabular-nums ${accent.kpi}`}>{editora._titulares ?? 0}</p>
            <p className="text-[10px] text-white/25">Titulares</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Music className={`w-3 h-3 ${accent.text}`} />
            </div>
            <p className={`text-lg font-bold tabular-nums ${accent.kpi}`}>{editora._obras ?? 0}</p>
            <p className="text-[10px] text-white/25">Obras</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <FileText className={`w-3 h-3 ${accent.text}`} />
            </div>
            <p className={`text-lg font-bold tabular-nums ${accent.kpi}`}>{editora._contratos ?? 0}</p>
            <p className="text-[10px] text-white/25">Contratos</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function EditorasPage() {
  const administradora = MOCK_EDITORAS.filter(e => e.administradora_id === null)
  const administradas = MOCK_EDITORAS.filter(e => e.administradora_id !== null)

  const totalTitulares = MOCK_EDITORAS.reduce((s, e) => s + (e._titulares ?? 0), 0)
  const totalObras = MOCK_EDITORAS.reduce((s, e) => s + (e._obras ?? 0), 0)
  const totalContratos = MOCK_EDITORAS.reduce((s, e) => s + (e._contratos ?? 0), 0)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Editoras Administradas"
        description="Estrutura multi-tenant — administradora e editoras vinculadas"
      />

      {/* KPIs consolidados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-white/40">Editoras</span>
          </div>
          <p className="text-2xl font-bold text-violet-400">{MOCK_EDITORAS.length}</p>
          <p className="text-xs text-white/25">{administradas.length} administradas</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-white/40">Titulares</span>
          </div>
          <p className="text-2xl font-bold text-sky-400">{totalTitulares}</p>
          <p className="text-xs text-white/25">em todas as editoras</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-white/40">Obras</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{totalObras}</p>
          <p className="text-xs text-white/25">no catalogo total</p>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-white/40">Contratos</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{totalContratos}</p>
          <p className="text-xs text-white/25">em vigencia</p>
        </div>
      </div>

      {/* Administradora */}
      {administradora.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Administradora</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {administradora.map((e, i) => <EditoraCard key={e.id} editora={e} idx={0} />)}
          </div>
        </section>
      )}

      {/* Editoras Administradas */}
      {administradas.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Editoras Administradas ({administradas.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {administradas.map((e, i) => <EditoraCard key={e.id} editora={e} idx={i + 1} />)}
          </div>
        </section>
      )}
    </div>
  )
}
