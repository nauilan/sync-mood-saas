'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MOCK_PERMISSOES } from '@/lib/mock-config'
import type { Permissao, PerfilCodigo } from '@/lib/types-config'
import { Search, ShieldCheck } from 'lucide-react'

const PERFIL_COLORS: Record<PerfilCodigo, string> = {
  master: 'bg-violet-500/10 text-violet-400',
  administrada: 'bg-blue-500/10 text-blue-400',
  autor: 'bg-emerald-500/10 text-emerald-400',
  financeiro: 'bg-amber-500/10 text-amber-400',
  juridico: 'bg-sky-500/10 text-sky-400',
  operacional: 'bg-rose-500/10 text-rose-400',
}

export default function ConfigPermissoesPage() {
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(false)

  const filtered: Permissao[] = MOCK_PERMISSOES.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.codigo.toLowerCase().includes(q) ||
      p.modulo.toLowerCase().includes(q) ||
      p.descricao.toLowerCase().includes(q)
    )
  })

  function handleBulkSave() {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  // Group by módulo
  const modulos = Array.from(new Set(filtered.map((p) => p.modulo)))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Permissões"
          description={`${MOCK_PERMISSOES.length} permissões cadastradas no sistema.`}
        />
        <div className="flex items-center gap-3">
          {toast && (
            <span className="text-xs text-emerald-400 animate-pulse">Salvo!</span>
          )}
          <button
            onClick={handleBulkSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Bulk Edit
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, módulo ou descrição..."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 transition-colors"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Search className="w-10 h-10 text-white/20 mb-3" strokeWidth={1.5} />
          <p className="text-white/40 text-sm">Nenhuma permissão encontrada para &ldquo;{search}&rdquo;.</p>
        </div>
      )}

      {/* Agrupado por módulo */}
      {modulos.map((modulo) => {
        const permsDoModulo = filtered.filter((p) => p.modulo === modulo)
        return (
          <div key={modulo} className="space-y-1">
            <p className="text-xs font-medium text-white/35 uppercase tracking-wider px-1 pb-1">
              {modulo}
            </p>
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-56">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      Perfis Padrão
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {permsDoModulo.map((perm) => (
                    <tr
                      key={perm.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0"
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-violet-400">{perm.codigo}</span>
                      </td>
                      <td className="px-4 py-3 text-white/55 text-xs">{perm.descricao}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {perm.perfil_padrao_codigos.map((pc) => (
                            <span
                              key={pc}
                              className={`text-[10px] px-2 py-0.5 rounded-full ${PERFIL_COLORS[pc]}`}
                            >
                              {pc}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
