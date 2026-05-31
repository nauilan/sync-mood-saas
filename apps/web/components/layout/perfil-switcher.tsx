'use client'
import { usePerfilContext } from '@/contexts/perfil-context'
import type { PerfilCodigo } from '@/lib/types-config'
import { ChevronUp, Crown, Building2, Music, DollarSign, Scale, Settings } from 'lucide-react'
import { useState } from 'react'

const PERFIS: { codigo: PerfilCodigo; nome: string; icon: typeof Crown }[] = [
  { codigo: 'master', nome: 'Master (Marina)', icon: Crown },
  { codigo: 'administrada', nome: 'Administrada (Roberto)', icon: Building2 },
  { codigo: 'autor', nome: 'Autor (Nauilan)', icon: Music },
  { codigo: 'financeiro', nome: 'Financeiro (Carla)', icon: DollarSign },
  { codigo: 'juridico', nome: 'Jurídico (Lucas)', icon: Scale },
  { codigo: 'operacional', nome: 'Operacional (Patricia)', icon: Settings },
]

export function PerfilSwitcher() {
  const { activePerfil, setActivePerfil, activePerfilNome } = usePerfilContext()
  const [open, setOpen] = useState(false)

  const activeDef = PERFIS.find(p => p.codigo === activePerfil)!
  const ActiveIcon = activeDef.icon

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors text-left group"
      >
        <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <ActiveIcon className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/60 truncate">{activePerfilNome}</p>
          <p className="text-[10px] text-white/25 capitalize">{activePerfil}</p>
        </div>
        <ChevronUp className={`w-3.5 h-3.5 text-white/25 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-[#12111e] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
            <div className="px-3 py-2 border-b border-white/[0.06]">
              <p className="text-[10px] text-white/25 uppercase tracking-wider font-medium">Trocar Perfil (DEMO)</p>
            </div>
            {PERFIS.map(p => {
              const Icon = p.icon
              const isActive = p.codigo === activePerfil
              return (
                <button
                  key={p.codigo}
                  onClick={() => { setActivePerfil(p.codigo); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.04] transition-colors ${isActive ? 'bg-violet-500/10' : ''}`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-violet-400' : 'text-white/30'}`} />
                  <span className={`text-xs ${isActive ? 'text-violet-300 font-medium' : 'text-white/50'}`}>{p.nome}</span>
                  {isActive && <span className="ml-auto text-[10px] text-violet-400">ativo</span>}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
