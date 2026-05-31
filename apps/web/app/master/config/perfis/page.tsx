'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MOCK_PERFIS, MOCK_PERMISSOES } from '@/lib/mock-config'
import type { PerfilCompleto, Permissao } from '@/lib/types-config'
import { ChevronDown, ChevronUp, Crown, Building2, Music, DollarSign, Scale, Settings, Shield } from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  Crown,
  Building2,
  Music,
  DollarSign,
  Scale,
  Settings,
}

const COR_BADGE: Record<string, string> = {
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

const COR_BORDER_CARD: Record<string, string> = {
  violet: 'border-violet-500/20',
  blue: 'border-blue-500/20',
  emerald: 'border-emerald-500/20',
  amber: 'border-amber-500/20',
  sky: 'border-sky-500/20',
  rose: 'border-rose-500/20',
}

export default function ConfigPerfisPage() {
  const [expandido, setExpandido] = useState<string | null>(null)

  function toggle(codigo: string) {
    setExpandido((prev) => (prev === codigo ? null : codigo))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Perfis e Permissões"
        description="Gerencie os perfis de acesso e as permissões padrão de cada perfil."
      />

      <div className="grid grid-cols-1 gap-3">
        {MOCK_PERFIS.map((perfil: PerfilCompleto) => {
          const Icon = ICON_MAP[perfil.icone] ?? Shield
          const isOpen = expandido === perfil.codigo
          const permsDoPerfl: Permissao[] = MOCK_PERMISSOES.filter((p) =>
            p.perfil_padrao_codigos.includes(perfil.codigo)
          )
          const totalPerms = MOCK_PERMISSOES.length

          return (
            <div
              key={perfil.codigo}
              className={`rounded-2xl border bg-white/[0.03] transition-all duration-200 ${COR_BORDER_CARD[perfil.cor]}`}
            >
              {/* Header do perfil */}
              <button
                onClick={() => toggle(perfil.codigo)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${COR_BADGE[perfil.cor]}`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <p className="text-sm font-semibold text-white/80">{perfil.nome}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${COR_BADGE[perfil.cor]}`}
                      >
                        {perfil.codigo}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">{perfil.descricao}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-white/30 font-mono">
                    {permsDoPerfl.length}/{totalPerms} permissões
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-white/30" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  )}
                </div>
              </button>

              {/* Permissões expandidas */}
              {isOpen && (
                <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                    Permissões concedidas por padrão
                  </p>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {MOCK_PERMISSOES.map((perm) => {
                      const granted = perm.perfil_padrao_codigos.includes(perfil.codigo)
                      return (
                        <div
                          key={perm.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                        >
                          {/* Toggle visual (mock) */}
                          <button
                            className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                              granted ? 'bg-violet-600' : 'bg-white/10'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                                granted ? 'left-4' : 'left-0.5'
                              }`}
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-white/60 truncate">{perm.codigo}</p>
                            <p className="text-[10px] text-white/35 truncate">{perm.descricao}</p>
                          </div>
                          <span className="text-[10px] text-white/20 shrink-0">{perm.modulo}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
