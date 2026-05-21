import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { TITULAR_NAV } from '@/components/layout/nav-config'

export default async function TitularLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  if (user.user_metadata?.user_role !== 'titular') redirect('/editora/dashboard')
  const displayName = user.user_metadata?.full_name ?? 'Titular'
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <AppShell nav={TITULAR_NAV} role="titular" editoraNome={user.user_metadata?.editora_nome} userName={displayName} userInitials={initials}>
      {children}
    </AppShell>
  )
}