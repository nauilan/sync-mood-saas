'use client'
import Link from 'next/link'
import { Music, ArrowRight } from 'lucide-react'

export default function PortalLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sync Mood</h1>
          <p className="text-sm text-white/40">Portal do Autor</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 block mb-1.5">E-mail</label>
              <input type="email" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40" placeholder="seu@email.com" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Senha</label>
              <input type="password" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40" placeholder="••••••••" />
            </div>
          </div>
          <button className="w-full py-2.5 rounded-xl bg-violet-600/50 text-white/50 text-sm cursor-not-allowed">
            Entrar
          </button>
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/20">ou</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <Link href="/portal/dashboard" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors font-medium">
            Entrar como Nauilan (DEMO) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-center text-xs text-white/20">Sync Mood Gestão Inteligente v7 · DEMO MODE</p>
      </div>
    </div>
  )
}
