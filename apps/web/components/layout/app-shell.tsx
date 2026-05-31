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
    // h-screen + overflow-hidden: trava a altura no viewport — cada coluna rola de forma independente
    <div className="flex h-screen overflow-hidden bg-[#07060f]">
      <Sidebar nav={nav} role={role} editoraNome={editoraNome} userName={userName ?? 'Marina Lopes'} userInitials={userInitials ?? 'ML'} />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <Topbar
          breadcrumb={breadcrumb}
          badge={topbarBadge}
          badgeColor={topbarBadgeColor}
          actions={topbarActions}
          notificationCount={notificationCount ?? 3}
          userName={userName ?? 'Marina Lopes'}
          userInitials={userInitials ?? 'ML'}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
