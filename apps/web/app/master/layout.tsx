import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { MASTER_NAV } from '@/components/layout/nav-config'
import { PerfilProvider } from '@/contexts/perfil-context'
import { AlertasVencimento } from '@/components/ui/alertas-vencimento'
import { TenantBootstrap } from '@/components/ui/tenant-bootstrap'

const DEMO_MODE = true

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  if (DEMO_MODE) {
    return (
      <PerfilProvider>
        <TenantBootstrap />
        <AppShell nav={MASTER_NAV} role="master" userName="Marina Lopes" userInitials="ML">
          <AlertasVencimento />
          {children}
        </AppShell>
      </PerfilProvider>
    )
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  if (user.user_metadata?.user_role !== 'master') redirect('/editora/dashboard')
  const displayName = user.user_metadata?.full_name ?? user.email ?? 'Marina Lopes'
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <PerfilProvider>
      <AppShell nav={MASTER_NAV} role="master" userName={displayName} userInitials={initials}>
        <AlertasVencimento />
        {children}
      </AppShell>
    </PerfilProvider>
  )
}
