'use client'
import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import type { NavSection } from './nav-config'

interface AppShellProps {
  nav: NavSection[]
  role: 'master' | 'editora' | 'titular'
  editoraNome?: string
  tenantNome?: string
  userRole?: string
  userName?: string
  userInitials?: string
  breadcrumb?: string[]
  topbarBadge?: string
  topbarBadgeColor?: 'violet' | 'sky' | 'emerald' | 'amber' | 'rose'
  topbarActions?: React.ReactNode
  notificationCount?: number
  children: React.ReactNode
}

export function AppShell({
  nav, role, editoraNome, tenantNome, userRole,
  userName, userInitials,
  breadcrumb, topbarBadge, topbarBadgeColor, topbarActions,
  notificationCount, children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#07060f]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        nav={nav}
        role={role}
        editoraNome={editoraNome}
        tenantNome={tenantNome}
        userName={userName}
        userInitials={userInitials}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <Topbar
          breadcrumb={breadcrumb}
          badge={topbarBadge}
          badgeColor={topbarBadgeColor}
          actions={topbarActions}
          notificationCount={notificationCount}
          userName={userName}
          userInitials={userInitials}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
