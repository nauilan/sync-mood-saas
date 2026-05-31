import { Suspense } from 'react'
import { LoginForm } from './login-form'
import { Music2, Shield, Zap, BarChart3 } from 'lucide-react'

export const metadata = { title: 'Login | Sync Mood' }

const features = [
  { icon: Shield, label: 'Contratos Autorais', desc: 'Gestao completa com motor contratual avancado' },
  { icon: Zap, label: 'Distribuicao Automatica', desc: 'Royalties calculados e distribuidos em tempo real' },
  { icon: BarChart3, label: 'BI & Relatorios', desc: 'Insights detalhados sobre seu catalogo musical' },
]

const stats = [
  { label: 'Obras cadastradas', value: '12.400+' },
  { label: 'Titulares ativos', value: '890+' },
  { label: 'Contratos gerenciados', value: '3.200+' },
  { label: 'Distribuicoes realizadas', value: '480+' },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex overflow-hidden">
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] relative border-r border-white/[0.05] p-10 overflow-hidden shrink-0">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[#0d1526]" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-600/6 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-cyan-600/6 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_16px_rgb(139_92_246_/_0.4)]">
              <Music2 className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold gradient-brand-text tracking-tight">sync.mood</p>
              <p className="text-[10px] text-white/35">Gestao de Direitos Musicais</p>
            </div>
          </div>

          {/* Main copy */}
          <div className="mt-auto mb-8">
            <h1 className="text-3xl font-semibold text-white leading-tight tracking-tight mb-3">
              Plataforma completa<br />
              <span className="gradient-brand-text">para editoras musicais</span>
            </h1>
            <p className="text-sm text-white/45 leading-relaxed">
              Gerencie contratos, distribuicao de royalties, demonstrativos e o catalogo completo da sua editora.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/80">{f.label}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                <p className="text-base font-bold gradient-brand-text">{stat.value}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-white/15 mt-6">2025 Sync Mood. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-violet-900/5 pointer-events-none" />

        <div className="relative w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_12px_rgb(139_92_246_/_0.4)]">
              <Music2 className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-bold gradient-brand-text tracking-tight">sync.mood</span>
          </div>

          {/* Login card with glassmorphism */}
          <div className="bg-[#0d1526]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-[0_8px_32px_rgb(0_0_0_/_0.4),inset_0_1px_0_rgb(255_255_255_/_0.05)]">
            <div className="mb-7">
              <h2 className="text-xl font-semibold tracking-tight text-white">Entrar na plataforma</h2>
              <p className="text-sm text-white/40 mt-1">Use seu CPF e senha de acesso</p>
            </div>
            <Suspense fallback={<div className="h-48 flex items-center justify-center text-white/40 text-sm">Carregando...</div>}>
              <LoginForm />
            </Suspense>
            <p className="text-center text-xs text-white/25 mt-6">
              Problemas? <a href="mailto:suporte@syncmood.com.br" className="text-violet-400/70 hover:text-violet-400 transition-colors">suporte@syncmood.com.br</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
