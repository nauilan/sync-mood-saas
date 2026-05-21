'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authErr) { setError('E-mail ou senha incorretos.'); return }
      const role = data.user?.user_metadata?.user_role ?? 'editora'
      const routes: Record<string, string> = { master: '/master/dashboard', editora: '/editora/dashboard', titular: '/titular/dashboard' }
      router.push(routes[role] ?? '/editora/dashboard')
      router.refresh()
    } catch { setError('Erro inesperado. Tente novamente.') }
    finally { setLoading(false) }
  }

  const inputCls = [
    'w-full h-10',
    'bg-white/[0.04] border border-white/[0.08] rounded-xl',
    'px-3.5 text-sm text-white placeholder:text-white/20',
    'focus:outline-none focus:border-violet-500/40 focus:bg-violet-500/[0.04]',
    'focus:shadow-[0_0_0_3px_rgb(139_92_246_/_0.1)]',
    'transition-all duration-200',
  ].join(' ')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/55">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="seuemail@editora.com.br"
          className={inputCls}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/55">Senha</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={inputCls + ' pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
          >
            {showPass ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
          </button>
        </div>
        <div className="flex justify-end">
          <a href="/auth/reset-password" className="text-xs text-white/25 hover:text-violet-400 transition-colors">Esqueceu a senha?</a>
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-500/8 border border-rose-500/20 rounded-xl">
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className={[
          'w-full h-10 mt-1',
          'bg-gradient-to-r from-violet-600 to-cyan-500',
          'hover:from-violet-500 hover:to-cyan-400',
          'disabled:opacity-40 disabled:pointer-events-none',
          'text-white text-sm font-semibold rounded-xl',
          'transition-all duration-200',
          'shadow-lg shadow-violet-900/30 hover:shadow-violet-500/25',
          'active:scale-[0.97]',
          'flex items-center justify-center gap-2',
        ].join(' ')}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
