'use client'
import { usePerfilContext } from '@/contexts/perfil-context'
import { Crown, Building2, Music, DollarSign, Scale, Settings, ShieldCheck } from 'lucide-react'

const ROLE_DISPLAY: Record<string, { nome: string; Icon: typeof Crown; color: string }> = {
  master:              { nome: 'Master',        Icon: Crown,       color: 'text-violet-400' },
  admin:               { nome: 'Admin',         Icon: ShieldCheck, color: 'text-violet-400' },
  super_admin:         { nome: 'Super Admin',   Icon: ShieldCheck, color: 'text-violet-400' },
  editora_administrada:{ nome: 'Editora Adm.',  Icon: Building2,   color: 'text-sky-400'    },
  administrada:        { nome: 'Editora Adm.',  Icon: Building2,   color: 'text-sky-400'    },
  autor:               { nome: 'Autor',         Icon: Music,       color: 'text-emerald-400'},
  financeiro:          { nome: 'Financeiro',    Icon: DollarSign,  color: 'text-amber-400'  },
  juridico:            { nome: 'Jurídico',      Icon: Scale,       color: 'text-blue-400'   },
  atendimento:         { nome: 'Operacional',   Icon: Settings,    color: 'text-rose-400'   },
  operacional:         { nome: 'Operacional',   Icon: Settings,    color: 'text-rose-400'   },
}

export function PerfilSwitcher() {
  const { userRole } = usePerfilContext()
  const def = ROLE_DISPLAY[userRole] ?? ROLE_DISPLAY.master
  const Icon = def.Icon

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
      <div className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
        <Icon className={`w-3 h-3 ${def.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/25 leading-none mb-0.5">Perfil de acesso</p>
        <p className={`text-[11px] font-medium truncate leading-none ${def.color}`}>{def.nome}</p>
      </div>
    </div>
  )
}
