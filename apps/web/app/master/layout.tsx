import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { MASTER_NAV } from '@/components/layout/nav-config'

const DEMO_MODE = true

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  if (DEMO_MODE) {
    return (
      <AppShell nav={MASTER_NAV} role="master" userName="Demo Master" userInitials="DM">
        {children}
      </AppShell>
    )
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  if (user.user_metadata?.user_role !== 'master') redirect('/editora/dashboard')
  const displayName = user.user_metadata?.full_name ?? user.email ?? 'Usuario'
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <AppShell nav={MASTER_NAV} role="master" userName={displayName} userInitials={initials}>
      {children}
    </AppShell>
  )
}