'use client'
import Link from 'next/link'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MOCK_PERMISSOES } from '@/lib/mock-config'
import type { PerfilCodigo } from '@/lib/types-config'
import { ArrowLeft, Save, User } from 'lucide-react'

const AMOSTRA_PERMISSOES = MOCK_PERMISSOES.slice(0, 6)

export default function NovoUsuarioPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [perfil, setPerfil] = useState<PerfilCodigo | ''>('')
  const [editora, setEditora] = useState('')
  const [permsExtras, setPermsExtras] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  function togglePerm(id: string) {
    setPermsExtras((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/master/config/usuarios"
          className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Novo Usuário"
          description="Crie um novo usuário e defina seu perfil de acesso."
        />
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-5">
        {/* Avatar preview */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/[0.06]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0">
            {nome ? (
              <span className="text-sm font-bold text-white">
                {nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </span>
            ) : (
              <User className="w-5 h-5 text-white/60" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">{nome || 'Nome do Usuário'}</p>
            <p className="text-xs text-white/35">{email || 'email@editora.com.br'}</p>
          </div>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Nome Completo *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@editora.com.br"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Telefone
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-0000"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Perfil *
              </label>
              <select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as PerfilCodigo | '')}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-violet-500/50 transition-colors"
              >
                <option value="">Selecione...</option>
                <option value="master">Master</option>
                <option value="administrada">Administrada</option>
                <option value="autor">Autor</option>
                <option value="financeiro">Financeiro</option>
                <option value="juridico">Jurídico</option>
                <option value="operacional">Operacional</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Editora *
              </label>
              <select
                value={editora}
                onChange={(e) => setEditora(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-violet-500/50 transition-colors"
              >
                <option value="">Selecione...</option>
                <option value="ed-tsm">Top Show Music</option>
                <option value="ed-edi">Edi Music</option>
                <option value="ed-lr">LR Edições</option>
                <option value="ed-p3">P3 Music</option>
                <option value="ed-lamu">Lamu Edições</option>
              </select>
            </div>
          </div>
        </div>

        {/* Permissões adicionais */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Permissões Adicionais (opcional)
          </p>
          <div className="grid grid-cols-1 gap-2">
            {AMOSTRA_PERMISSOES.map((perm) => (
              <label
                key={perm.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={permsExtras.includes(perm.id)}
                  onChange={() => togglePerm(perm.id)}
                  className="mt-0.5 accent-violet-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-violet-400">{perm.codigo}</p>
                  <p className="text-xs text-white/50 mt-0.5">{perm.descricao}</p>
                </div>
                <span className="text-[10px] text-white/25 shrink-0">{perm.modulo}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <Link
            href="/master/config/usuarios"
            className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            Cancelar
          </Link>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs text-emerald-400 animate-pulse">
                Usuário criado com sucesso!
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Criar Usuário
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
