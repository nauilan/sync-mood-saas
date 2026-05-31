'use client'

import { Send } from 'lucide-react'

// MIA Card — AI assistant with violet orb
export function MiaCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.06] overflow-hidden"
      style={{ background: '#11111d' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[15px] font-bold text-white tracking-wide">MIA</span>
          <span className="text-[9px] font-bold bg-violet-600/80 text-white px-2 py-0.5 rounded-md tracking-wider">BETA</span>
        </div>
        <p className="text-[11.5px] text-[#8a8a9a] leading-relaxed">
          Sua assistente inteligente para direitos autorais e negocios musicais.
        </p>
      </div>

      {/* Orb */}
      <div className="flex items-center justify-center py-6 relative">
        {/* Outer glow rings */}
        <div className="absolute w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}/>
        <div className="absolute w-24 h-24 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}/>

        {/* Main orb */}
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #a78bfa 0%, #7c3aed 40%, #3b0f8c 70%, #0a0612 100%)',
            boxShadow: '0 0 30px rgba(139,92,246,0.5), 0 0 60px rgba(109,40,217,0.25), inset 0 1px 1px rgba(255,255,255,0.2)',
            animation: 'orb-breathe 4s ease-in-out infinite',
          }}>
          {/* Sound wave inside orb */}
          <svg width="36" height="24" viewBox="0 0 36 24" fill="none">
            {[2, 8, 14, 20, 26, 32].map((x, i) => {
              const heights = [6, 14, 20, 18, 12, 8]
              const h = heights[i]
              return (
                <rect key={i} x={x} y={(24 - h) / 2} width="2.5" height={h} rx="1.25"
                  fill="white" fillOpacity={0.4 + i * 0.08}/>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 mt-auto">
        <div className="flex items-center gap-2 bg-white/[0.05] rounded-xl px-3 py-2.5 border border-white/[0.07] focus-within:border-violet-500/40 transition-colors">
          <input
            type="text"
            placeholder="Pergunte algo para a Mia..."
            className="flex-1 text-[12px] bg-transparent text-white/60 placeholder:text-white/25 outline-none"
          />
          <button className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center hover:bg-violet-500 transition-colors shadow-[0_0_10px_rgba(139,92,246,0.4)] shrink-0">
            <Send className="w-3 h-3 text-white" strokeWidth={2} style={{ transform: 'rotate(45deg)' }}/>
          </button>
        </div>
      </div>
    </div>
  )
}
