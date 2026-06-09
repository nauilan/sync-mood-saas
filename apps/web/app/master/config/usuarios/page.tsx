'use client'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Plus, Edit, Lock, Unlock, Users, RefreshCw, KeyRound } from 'lucide-react'

interface UsuarioReal {
  id: string
  email: string
  cpf?: string
  nome: string
  role: string
  telefone?: string
  ativo: boolean
  ultimo_acesso?: string
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  master:               'Master',
  admin:                'Admin',
  super_admin:          'Super Admin',
  editora_administrada: 'Editora Adm.',
  autor:                'Autor',
  financeiro:           'Financeiro',
  juridico:             'Jurídico',
  atendimento:          'Operacional',
}

const ROLE_COLOR: Record<string, string> = {
  master:               'bg-violet-500/10 text-violet-400',
  admin:                'bg-violet-500/10 text-violet-400',
  super_admin:          'bg-violet-500/10 text-violet-400',
  editora_administrada: 'bg-sky-500/10 text-sky-400',
  autor:                'bg-emerald-500/10 text-emerald-400',
  financeiro:           'bg-amber-500/10 text-amber-400',
  juridico:             'bg-blue-500/10 text-blue-400',
  atendimento:          'bg-rose-500/10 text-rose-400',
}

export default function ConfigUsuariosPage() {
  const [usuarios, setUsuarios]   = useState<UsuarioReal[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterRole, setFilterRole] = useState('todos')
  const [resetModal, setResetModal] = useState<{ id: string; nome: string } | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios')
      if (res.ok) {
        const data = await res.json()
        setUsuarios(data.usuarios ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleAtivo(u: UsuarioReal) {
    await fetch(`/api/usuarios/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !u.ativo }),
    })
    load()
  }

  async function handleResetSenha() {
    if (!resetModal || !novaSenha.trim()) return
    setResetting(true)
    setResetMsg('')
    const res = await fetch(`/api/usuarios/${resetModal.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_senha', nova_senha: novaSenha }),
    })
    const data = await res.json()
    if (res.ok) {
      setResetMsg('Senha redefinida com sucesso!')
      setTimeout(() => { setResetModal(null); setNovaSenha(''); setResetMsg('') }, 2000)
    } else {
      setResetMsg(data.error ?? 'Erro ao redefinir senha')
    }
    setResetting(false)
  }

  const filtered = filterRole === 'todos' ? usuarios : usuarios.filter(u => u.role === filterRole)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Usuários do Sistema"
          description="Cadastro e gestão de usuários e seus perfis de acesso."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/master/config/usuarios/novo"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Link>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/60 focus:outline-none focus:border-violet-500/40 transition-colors"
        >
          <option value="todos">Perfil: Todos</option>
          <option value="master">Master</option>
          <option value="admin">Admin</option>
          <option value="editora_administrada">Editora Adm.</option>
          <option value="financeiro">Financeiro</option>
          <option value="juridico">Jurídico</option>
          <option value="atendimento">Operacional</option>
          <option value="autor">Autor</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 text-white/25 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Users className="w-10 h-10 text-white/20 mb-3" strokeWidth={1.5} />
          <p className="text-white/40 text-sm">Nenhum usuário encontrado.</p>
          <Link href="/master/config/usuarios/novo" className="mt-3 text-sm text-violet-400 hover:underline">
            Criar primeiro usuário
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">E-mail / CPF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Perfil</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Criado em</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const initials = u.nome.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
                const displayEmail = u.email.endsWith('@syncmood.app')
                  ? `CPF: ${(u.cpf ?? u.email.replace('@syncmood.app', '')).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`
                  : u.email
                return (
                  <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {initials}
                        </div>
                        <span className="text-white/70 font-medium">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{displayEmail}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${ROLE_COLOR[u.role] ?? 'bg-white/[0.06] text-white/40'}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${u.ativo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {u.ativo ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setResetModal({ id: u.id, nome: u.nome })}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-amber-400 transition-colors"
                          title="Redefinir senha"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleAtivo(u)}
                          className={`p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors ${u.ativo ? 'text-white/40 hover:text-rose-400' : 'text-white/40 hover:text-emerald-400'}`}
                          title={u.ativo ? 'Bloquear usuário' : 'Desbloquear usuário'}
                        >
                          {u.ativo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
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

      {/* Modal reset senha */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12111e] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-1">Redefinir Senha</h3>
            <p className="text-xs text-white/40 mb-4">Definir nova senha para <span className="text-white/70">{resetModal.nome}</span></p>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors mb-3"
            />
            {resetMsg && (
              <p className={`text-xs mb-3 ${resetMsg.includes('sucesso') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {resetMsg}
              </p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setResetModal(null); setNovaSenha(''); setResetMsg('') }}
                className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetSenha}
                disabled={resetting || novaSenha.length < 6}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resetting ? 'Salvando...' : 'Redefinir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
