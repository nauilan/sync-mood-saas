'use client'
import Link from 'next/link'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MOCK_USUARIOS, MOCK_USUARIOS_PERFIS } from '@/lib/mock-config'
import type { UsuarioSistema, UsuarioPerfil } from '@/lib/types-config'
import { Plus, Edit, Lock, Users } from 'lucide-react'

export default function ConfigUsuariosPage() {
  const [filterPerfil, setFilterPerfil] = useState('todos')
  const [filterEditora, setFilterEditora] = useState('todos')

  const usuarios: UsuarioSistema[] = MOCK_USUARIOS.filter((u) => {
    const perfil: UsuarioPerfil | undefined = MOCK_USUARIOS_PERFIS.find(
      (p) => p.usuario_id === u.id
    )
    if (filterPerfil !== 'todos' && perfil?.perfil_codigo !== filterPerfil) return false
    if (filterEditora !== 'todos' && perfil?.editora_id !== filterEditora) return false
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Usuários do Sistema"
          description="Cadastro e gestão de usuários e seus perfis de acesso."
        />
        <Link
          href="/master/config/usuarios/novo"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterPerfil}
          onChange={(e) => setFilterPerfil(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/60 focus:outline-none focus:border-violet-500/40 transition-colors"
        >
          <option value="todos">Perfil: Todos</option>
          <option value="master">Master</option>
          <option value="administrada">Administrada</option>
          <option value="autor">Autor</option>
          <option value="financeiro">Financeiro</option>
          <option value="juridico">Jurídico</option>
          <option value="operacional">Operacional</option>
        </select>
        <select
          value={filterEditora}
          onChange={(e) => setFilterEditora(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/60 focus:outline-none focus:border-violet-500/40 transition-colors"
        >
          <option value="todos">Editora: Todas</option>
          <option value="ed-tsm">Top Show Music</option>
          <option value="ed-edi">Edi Music</option>
        </select>
      </div>

      {/* Empty state */}
      {usuarios.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Users className="w-10 h-10 text-white/20 mb-3" strokeWidth={1.5} />
          <p className="text-white/40 text-sm">Nenhum usuário encontrado com os filtros aplicados.</p>
        </div>
      )}

      {/* Table */}
      {usuarios.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Perfil
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Editora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const perfil: UsuarioPerfil | undefined = MOCK_USUARIOS_PERFIS.find(
                  (p) => p.usuario_id === u.id
                )
                const initials = u.nome
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                return (
                  <tr
                    key={u.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {initials}
                        </div>
                        <span className="text-white/70 font-medium">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      {perfil && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 capitalize">
                          {perfil.perfil_codigo}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {perfil?.editora_nome ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md ${
                          u.ativo
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {u.ativo ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {u.ultimo_login
                        ? new Date(u.ultimo_login).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-violet-400 transition-colors"
                          title="Editar usuário"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-rose-400 transition-colors"
                          title="Bloquear usuário"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
