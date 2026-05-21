import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import type { NavSection } from './nav-config'

interface AppShellProps {
  nav: NavSection[]
  role: 'master' | 'editora' | 'titular'
  editoraNome?: string
  userName?: string
  userInitials?: string
  breadcrumb?: string[]
  topbarBadge?: string
  topbarBadgeColor?: 'violet' | 'sky' | 'emerald' | 'amber' | 'rose'
  topbarActions?: React.ReactNode
  notificationCount?: number
  children: React.ReactNode
}

export function AppShell({ nav, role, editoraNome, userName, userInitials, breadcrumb, topbarBadge, topbarBadgeColor, topbarActions, notificationCount, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#0a0e1a]">
      <Sidebar nav={nav} role={role} editoraNome={editoraNome} userName={userName} userInitials={userInitials} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar breadcrumb={breadcrumb} badge={topbarBadge} badgeColor={topbarBadgeColor} actions={topbarActions} notificationCount={notificationCount} />
        <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
