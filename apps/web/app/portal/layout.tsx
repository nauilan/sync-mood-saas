import type { ReactNode } from 'react'

export const metadata = {
  title: 'Portal do Autor — Sync Mood',
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07060f]">
      {children}
    </div>
  )
}
