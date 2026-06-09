'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft, Save, User } from 'lucide-react'

const ROLES = [
  { value: 'admin',                label: 'Admin' },
  { value: 'editora_administrada', label: 'Editora Adm.' },
  { value: 'financeiro',           label: 'Financeiro' },
  { value: 'juridico',             label: 'Jurídico' },
  { value: 'atendimento',          label: 'Operacional' },
  { value: 'autor',                label: 'Autor' },
]

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [nome,      setNome]      = useState('')
  const [email,     setEmail]     = useState('')
  const [cpf,       setCpf]       = useState('')
  const [telefone,  setTelefone]  = useState('')
  const [role,      setRole]      = useState('atendimento')
  const [senha,     setSenha]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  function maskCpf(v: string) {
    return v.replace(/\D/g, '').slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
  }

  async function handleSave() {
    setError('')
    if (!nome.trim())   return setError('Nome é obrigatório')
    if (!senha.trim() || senha.length < 6) return setError('Senha mínima de 6 caracteres')
    if (!email.trim() && cpf.replace(/\D/g, '').length !== 11) {
      return setError('Informe e-mail ou CPF (11 dígitos)')
    }

    setSaving(true)
    const body: Record<string, string> = { nome: nome.trim(), senha, role }
    if (email.trim()) body.email = email.trim()
    if (cpf)          body.cpf   = cpf.replace(/\D/g, '')
    if (telefone)     body.telefone = telefone.trim()

    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao criar usuário')
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/master/config/usuarios'), 1500)
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
                {nome.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            ) : (
              <User className="w-5 h-5 text-white/60" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">{nome || 'Nome do Usuário'}</p>
            <p className="text-xs text-white/35">{email || (cpf ? `CPF: ${cpf}` : 'e-mail ou CPF')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Nome Completo *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@editora.com.br"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">CPF (se não tiver e-mail)</label>
              <input
                type="text"
                value={maskCpf(cpf)}
                onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                placeholder="000.000.000-00"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-0000"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Perfil *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-violet-500/50 transition-colors"
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Senha Inicial *</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
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
            {error && <p className="text-xs text-rose-400">{error}</p>}
            {success && <p className="text-xs text-emerald-400">Usuário criado! Redirecionando...</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
