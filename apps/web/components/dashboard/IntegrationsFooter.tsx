'use client'

// Integrations Footer
export function IntegrationsFooter() {
  return (
    <div className="flex items-center gap-4 py-5 px-1 border-t border-white/[0.05] flex-wrap">
      <span className="text-[11px] text-[#5a5a6a] shrink-0">Conectado com</span>

      {/* ECAD */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="#a78bfa" strokeWidth="1.5"/>
          <path d="M5 8 L8 5 L11 8 L8 11Z" fill="#a78bfa"/>
        </svg>
        <span className="text-[11px] font-semibold text-white/60">ecad</span>
      </div>

      {/* SOCINPRO */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
        <span className="text-[11px] font-bold text-white/60">SOCINPRO</span>
      </div>

      {/* UBEM */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
        <span className="text-[11px] font-bold text-white/60">UBEM</span>
      </div>

      {/* Spotify */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6.5" fill="#1DB954"/>
          <path d="M4 9 Q7 7.5 10 8.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M3.5 7 Q7 5 10.5 6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M3 5 Q7 3 11 4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="text-[11px] font-semibold text-white/60">Spotify</span>
      </div>

      {/* YouTube */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <rect width="16" height="12" rx="3" fill="#FF0000"/>
          <path d="M6.5 4 L11 6 L6.5 8Z" fill="white"/>
        </svg>
        <span className="text-[11px] font-semibold text-white/60">YouTube</span>
      </div>

      {/* Apple Music */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6.5" fill="#fc3c44"/>
          <path d="M9 4 L9 9 M7 5 L9 4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="8" cy="9.5" r="1.2" fill="white"/>
          <circle cx="6" cy="10" r="1.2" fill="white"/>
          <path d="M6 10 L6 6 L9 5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
        </svg>
        <span className="text-[11px] font-semibold text-white/60 italic">Music</span>
      </div>

      {/* Deezer */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05]">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <rect x="2" y="4" width="2.5" height="5" rx="1" fill="#a100ff"/>
          <rect x="6" y="2" width="2.5" height="7" rx="1" fill="#ff0092"/>
          <rect x="10" y="5" width="2.5" height="4" rx="1" fill="#00c7f2"/>
        </svg>
        <span className="text-[11px] font-semibold text-white/60">Deezer</span>
      </div>

      <span className="text-[11px] text-[#5a5a6a]">e mais 12</span>

      <div className="ml-auto flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[pulse-dot_2s_ease-in-out_infinite]"/>
        <span className="text-[11px] text-[#8a8a9a]">Dados atualizados ha 1 minuto</span>
      </div>
    </div>
  )
}
