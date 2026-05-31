import { GitBranch, Construction } from 'lucide-react'

export const metadata = { title: 'Versoes | Sync Mood' }

export default function VersoesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_32px_rgba(139,92,246,0.25)]"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.1))' }}>
        <GitBranch className="w-7 h-7 text-violet-400" strokeWidth={1.5} />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Versoes</h1>
      <p className="text-sm text-white/40 max-w-sm">
        Gestão de versões de obras musicais. Esta funcionalidade está em desenvolvimento e estará disponível em breve.
      </p>
      <div className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
        <Construction className="w-3.5 h-3.5 text-violet-400" strokeWidth={2} />
        <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Em breve</span>
      </div>
    </div>
  )
}
