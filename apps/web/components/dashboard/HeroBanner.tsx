'use client'

// Hero Banner — "Bom dia, Marina." with abstract feminine figure SVG
export function HeroBanner({ userName = 'Marina' }: { userName?: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.05]"
      style={{ background: 'linear-gradient(135deg, #07060f 0%, #0e0a1e 60%, #140d2e 100%)', minHeight: 200 }}>

      {/* Background glow blobs */}
      <div className="absolute top-0 right-0 w-[400px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(109,40,217,0.25) 0%, transparent 70%)' }}/>
      <div className="absolute bottom-0 right-0 w-[300px] h-[200px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(139,92,246,0.15) 0%, transparent 70%)' }}/>

      {/* Content */}
      <div className="relative z-10 px-8 py-8 max-w-[60%]">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[2rem] font-bold text-white leading-tight">Bom dia, {userName}.</h1>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shadow-[0_0_8px_#34d399] animate-[pulse-dot_2s_ease-in-out_infinite]"/>
        </div>
        <p className="text-[14.5px] text-white/55 mt-2 leading-relaxed">
          Voce esta construindo o futuro da musica.<br/>
          Aqui estao seus direitos, seus resultados, seu legado.
        </p>
      </div>

      {/* Abstract feminine figure — SVG illustration */}
      <div className="absolute right-0 top-0 bottom-0 w-[380px] pointer-events-none overflow-hidden">
        <svg width="380" height="240" viewBox="0 0 380 240" fill="none" className="absolute inset-0">
          <defs>
            <radialGradient id="heroGlow" cx="60%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4"/>
              <stop offset="50%" stopColor="#6d28d9" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="figureGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a0f33"/>
              <stop offset="100%" stopColor="#0c0820"/>
            </radialGradient>
            <filter id="blur4">
              <feGaussianBlur stdDeviation="4"/>
            </filter>
            <filter id="blur8">
              <feGaussianBlur stdDeviation="8"/>
            </filter>
          </defs>

          {/* Background glow */}
          <ellipse cx="240" cy="120" rx="180" ry="160" fill="url(#heroGlow)"/>

          {/* Wave lines — violet abstract */}
          <path d="M160 200 Q200 150 240 180 Q280 210 320 160 Q360 110 380 120" stroke="#a78bfa" strokeWidth="1.5" strokeOpacity="0.4" fill="none"/>
          <path d="M150 220 Q190 170 240 190 Q290 210 330 170 Q365 135 380 145" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.3" fill="none"/>
          <path d="M170 180 Q220 130 260 155 Q300 180 340 140 Q360 120 380 130" stroke="#c4b5fd" strokeWidth="0.75" strokeOpacity="0.25" fill="none"/>
          <path d="M140 240 Q200 190 250 210 Q300 230 350 185 Q370 165 380 170" stroke="#7c3aed" strokeWidth="2" strokeOpacity="0.3" fill="none"/>

          {/* Floating particles */}
          {[
            [200, 80, 2, 0.6], [280, 60, 1.5, 0.4], [320, 100, 2.5, 0.5],
            [250, 40, 1.5, 0.3], [180, 130, 2, 0.4], [310, 140, 1.5, 0.5],
            [230, 160, 1, 0.3], [290, 180, 2, 0.4],
          ].map(([x, y, r, o], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#a78bfa" fillOpacity={o}/>
          ))}

          {/* Feminine silhouette */}
          <g filter="url(#blur4)" opacity="0.9">
            {/* Body */}
            <path d="M230 240 L235 170 Q236 150 240 130 Q244 110 242 90 L238 90 Q235 110 231 130 Q227 150 225 170 Z"
              fill="url(#figureGrad)"/>
            {/* Head */}
            <circle cx="240" cy="80" r="18" fill="url(#figureGrad)"/>
            {/* Shoulders / arms suggestion */}
            <path d="M215 145 Q220 130 225 145 L225 200 Q220 180 215 200Z"
              fill="url(#figureGrad)"/>
            <path d="M255 145 Q260 130 265 145 L263 200 Q258 180 253 200Z"
              fill="url(#figureGrad)"/>
          </g>

          {/* Purple glow behind figure */}
          <ellipse cx="240" cy="130" rx="40" ry="60" fill="#7c3aed" fillOpacity="0.12" filter="url(#blur8)"/>

          {/* Head highlight */}
          <circle cx="240" cy="80" r="22" fill="none" stroke="#a78bfa" strokeWidth="0.5" strokeOpacity="0.3"/>
        </svg>
      </div>
    </div>
  )
}
