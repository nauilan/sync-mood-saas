'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Edit, Music, Loader2, AlertTriangle, Info } from 'lucide-react'

interface TipoDireito {
  id: string
  codigo: string
  nome: string
  nome_curto?: string
  nome_juridico?: string
  descricao?: string
  ordem?: number
  ativo: boolean
  codigo_legado?: boolean
}

export default function TiposDireitosPage() {
  const [tipos, setTipos] = useState<TipoDireito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tipos-direito')
      .then(r => r.json())
      .then(d => {
        if (d.tipos) setTipos(d.tipos)
        else setError(d.error ?? 'Erro ao carregar tipos de direito')
      })
      .catch(() => setError('Erro de rede'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        <span className="ml-2 text-sm text-white/40">Carregando direitos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
        <div>
          <p className="text-sm text-rose-300 font-medium">Erro ao carregar tipos de direito</p>
          <p className="text-xs text-rose-400/70 mt-0.5">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Direitos"
        description="Catálogo mestre de direitos jurídicos contratuais. Fonte oficial de verdade do Sync Mood."
      />

      {/* Aviso arquitetural */}
      <div className="flex items-start gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
        <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-violet-300">Regra Máxima do Sync Mood</p>
          <p className="text-xs text-violet-400/80">
            O contrato manda. O sistema se adapta ao contrato.
            <span className="font-semibold text-violet-300"> nome_juridico</span> é o texto exato do contrato —
            nunca simplificar ou reescrever.
            <span className="font-semibold text-violet-300"> nome_curto</span> é apenas para interface.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-36">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                Nome Curto (interface)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                Nome Jurídico (contrato)
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-white/40 uppercase tracking-wider w-16">
                Ordem
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider w-20">
                Ver
              </th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((tipo) => (
              <>
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
                      <span className="text-sm text-white/70">{tipo.nome_curto ?? tipo.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-white/40 leading-relaxed line-clamp-1" title={tipo.nome_juridico ?? ''}>
                      {tipo.nome_juridico ?? <span className="text-rose-400/60 italic">sem nome jurídico</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-white/30">{tipo.ordem ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setExpandedId(expandedId === tipo.id ? null : tipo.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          expandedId === tipo.id
                            ? 'bg-violet-500/10 text-violet-400'
                            : 'hover:bg-white/[0.06] text-white/40 hover:text-violet-400'
                        }`}
                        title="Ver nome jurídico completo"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === tipo.id && (
                  <tr key={`${tipo.id}-expand`} className="bg-violet-500/5">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-violet-400/60 font-semibold">
                          Nome Jurídico Completo (texto exato do contrato)
                        </p>
                        <p className="text-sm text-violet-200 font-medium leading-relaxed">
                          {tipo.nome_juridico ?? <span className="text-rose-400 italic">Não cadastrado — aplicar Migration 039</span>}
                        </p>
                        {tipo.descricao && (
                          <>
                            <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mt-3">
                              Descrição Operacional
                            </p>
                            <p className="text-xs text-white/50">{tipo.descricao}</p>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-xs text-white/30 pt-1">
        <span>
          Total de direitos jurídicos ativos:{' '}
          <strong className="text-emerald-400">{tipos.length}</strong>
        </span>
        <span className="text-white/20">
          Passe o cursor sobre o ícone de edição para ver o nome jurídico completo
        </span>
      </div>
    </div>
  )
}
