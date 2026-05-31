'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MOCK_TIPOS_DIREITOS } from '@/lib/mock-config'
import type { TipoDireitoConfig, Territorio } from '@/lib/types-config'
import { Edit, Music } from 'lucide-react'

const TERRITORIO_COLORS: Record<Territorio, string> = {
  BR: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  EXT: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  GLOBAL: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
}

export default function TiposDireitosPage() {
  const [ativos, setAtivos] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_TIPOS_DIREITOS.map((t) => [t.id, t.ativo]))
  )
  const [editingId, setEditingId] = useState<string | null>(null)

  function toggleAtivo(id: string) {
    setAtivos((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const grupos: Territorio[] = ['BR', 'EXT', 'GLOBAL']

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Direitos"
        description="Gerencie os tipos de direitos musicais por território. Ative ou desative conforme necessidade."
      />

      {grupos.map((territorio) => {
        const tipos: TipoDireitoConfig[] = MOCK_TIPOS_DIREITOS.filter(
          (t) => t.territorio === territorio
        )
        if (tipos.length === 0) return null
        return (
          <div key={territorio} className="space-y-2">
            {/* Section header */}
            <div className="flex items-center gap-2 pb-1">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${TERRITORIO_COLORS[territorio]}`}
              >
                {territorio === 'BR'
                  ? 'Brasil (BR)'
                  : territorio === 'EXT'
                  ? 'Exterior (EXT)'
                  : 'Global'}
              </span>
              <span className="text-xs text-white/25">{tipos.length} tipos</span>
            </div>

            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-20">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-32">
                      Categoria
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/40 uppercase tracking-wider w-24">
                      Ativo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider w-20">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((tipo) => {
                    const isAtivo = ativos[tipo.id] ?? tipo.ativo
                    return (
                      <tr
                        key={tipo.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0"
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-violet-400">{tipo.codigo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Music className="w-3.5 h-3.5 text-white/25 shrink-0" strokeWidth={1.5} />
                            <span className="text-sm text-white/70">{tipo.nome}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-md bg-white/[0.05] text-white/40 capitalize">
                            {tipo.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <button
                              onClick={() => toggleAtivo(tipo.id)}
                              className={`relative w-9 h-5 rounded-full transition-colors ${
                                isAtivo ? 'bg-violet-600' : 'bg-white/10'
                              }`}
                              title={isAtivo ? 'Desativar' : 'Ativar'}
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                                  isAtivo ? 'left-4' : 'left-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <button
                              onClick={() =>
                                setEditingId(editingId === tipo.id ? null : tipo.id)
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                editingId === tipo.id
                                  ? 'bg-violet-500/10 text-violet-400'
                                  : 'hover:bg-white/[0.06] text-white/40 hover:text-violet-400'
                              }`}
                              title="Editar inline"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-white/30 pt-1">
        <span>
          Total ativo:{' '}
          <strong className="text-emerald-400">
            {Object.values(ativos).filter(Boolean).length}
          </strong>
          /{MOCK_TIPOS_DIREITOS.length}
        </span>
      </div>
    </div>
  )
}
