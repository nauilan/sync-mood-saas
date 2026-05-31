'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Globe Card — dotted globe SVG placeholder
export function GlobeCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0a0618 0%, #0e0b28 50%, #11102a 100%)', minHeight: 280 }}>
      <GlobeSVG />
    </div>
  )
}

function GlobeSVG() {
  // Dotted globe approximation using SVG
  const dots: { x: number; y: number; r: number; o: number }[] = []
  const W = 280, H = 280, R = 110, cx = 140, cy = 140

  // Generate dot pattern for globe
  for (let lat = -80; lat <= 80; lat += 12) {
    const latRad = (lat * Math.PI) / 180
    const cosLat = Math.cos(latRad)
    const numDots = Math.max(4, Math.round(20 * cosLat))
    for (let i = 0; i < numDots; i++) {
      const lng = (i / numDots) * 360 - 180
      const lngRad = (lng * Math.PI) / 180
      // Simple orthographic projection (front hemisphere)
      const x3d = cosLat * Math.sin(lngRad)
      const y3d = Math.sin(latRad)
      const z3d = cosLat * Math.cos(lngRad)
      if (z3d > -0.1) {
        const px = cx + R * x3d
        const py = cy - R * y3d
        const depth = (z3d + 1) / 2
        dots.push({ x: px, y: py, r: depth > 0.7 ? 1.8 : 1.2, o: 0.2 + depth * 0.6 })
      }
    }
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <defs>
        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.3"/>
          <stop offset="60%" stopColor="#4c1d95" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="globeAtmo" cx="50%" cy="50%" r="55%">
          <stop offset="70%" stopColor="transparent"/>
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2"/>
        </radialGradient>
        <filter id="globeBlur">
          <feGaussianBlur stdDeviation="12"/>
        </filter>
      </defs>

      {/* Atmosphere glow */}
      <circle cx={cx} cy={cy} r={R + 20} fill="url(#globeGlow)" filter="url(#globeBlur)"/>
      <circle cx={cx} cy={cy} r={R + 5} fill="url(#globeAtmo)"/>

      {/* Globe outline */}
      <circle cx={cx} cy={cy} r={R} fill="rgba(20,12,48,0.8)" stroke="#6d28d9" strokeWidth="0.5" strokeOpacity="0.4"/>

      {/* Latitude/longitude lines */}
      {[-60, -30, 0, 30, 60].map((lat) => {
        const latRad = (lat * Math.PI) / 180
        const yr = cy - R * Math.sin(latRad)
        const xr = R * Math.cos(latRad)
        return (
          <ellipse key={lat} cx={cx} cy={yr} rx={xr} ry={xr * 0.15}
            fill="none" stroke="#8b5cf6" strokeWidth="0.4" strokeOpacity="0.2"/>
        )
      })}
      {[-90, -45, 0, 45, 90].map((lng) => {
        const lngRad = (lng * Math.PI) / 180
        const x2 = Math.sin(lngRad)
        return (
          <ellipse key={lng} cx={cx} cy={cy} rx={R * Math.abs(Math.cos(lngRad)) + 0.1} ry={R}
            fill="none" stroke="#8b5cf6" strokeWidth="0.4" strokeOpacity="0.15"
            transform={`rotate(${lng}, ${cx}, ${cy})`}/>
        )
      })}

      {/* Dots */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#a78bfa" fillOpacity={d.o}/>
      ))}

      {/* Highlight hotspots */}
      {[
        { x: 135, y: 100, label: 'BR' },
        { x: 100, y: 90, label: 'US' },
        { x: 150, y: 85, label: 'PT' },
      ].map((spot) => (
        <g key={spot.label}>
          <circle cx={spot.x} cy={spot.y} r="4" fill="#a78bfa" fillOpacity="0.9"
            style={{ filter: 'drop-shadow(0 0 4px #8b5cf6)' }}/>
          <circle cx={spot.x} cy={spot.y} r="8" fill="none" stroke="#a78bfa" strokeWidth="0.5" strokeOpacity="0.4"/>
        </g>
      ))}

      {/* Lens flare / top-right */}
      <circle cx={cx + 50} cy={cy - 60} r="3" fill="white" fillOpacity="0.15"/>
    </svg>
  )
}

// Execucoes Card — right side of globe row
export function ExecucoesCard() {
  const countries = [
    { flag: '🇧🇷', name: 'Brasil', count: 2451, pct: 100 },
    { flag: '🇺🇸', name: 'Estados Unidos', count: 1892, pct: 77 },
    { flag: '🇲🇽', name: 'Mexico', count: 975, pct: 40 },
    { flag: '🇵🇹', name: 'Portugal', count: 642, pct: 26 },
    { flag: '🇦🇷', name: 'Argentina', count: 512, pct: 21 },
  ]

  return (
    <div className="rounded-2xl border border-white/[0.06] p-5"
      style={{ background: '#11111d' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13.5px] font-semibold text-white">Execucoes em tempo real</h3>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[pulse-dot_1.5s_ease-in-out_infinite]"/>
          <span className="text-[10px] font-bold text-emerald-400 tracking-wide">AO VIVO</span>
        </div>
      </div>

      {/* Big number */}
      <div className="mb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-[40px] font-bold text-white tabular-nums leading-none">7.892</span>
          <span className="text-[12px] text-[#8a8a9a]">atualizando agora</span>
        </div>
      </div>

      {/* Countries list */}
      <div className="space-y-3">
        {countries.map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="text-base shrink-0">{c.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-white/70 truncate">{c.name}</span>
                <span className="text-[12px] text-white/60 tabular-nums ml-2">{c.count.toLocaleString('pt-BR')}</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full"
                  style={{
                    width: `${c.pct}%`,
                    background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                  }}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/[0.07] text-[12px] text-white/50 hover:bg-white/[0.04] hover:text-white/80 hover:border-white/[0.12] transition-all duration-150">
        Ver mapa completo
        <ChevronRight className="w-3.5 h-3.5" strokeWidth={2}/>
      </button>
    </div>
  )
}
