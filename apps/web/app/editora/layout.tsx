import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { EDITORA_NAV } from '@/components/layout/nav-config'

export default async function EditoraLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const role = user.user_metadata?.user_role
  if (role !== 'editora' && role !== 'master') redirect('/titular/dashboard')
  const displayName = user.user_metadata?.full_name ?? user.email ?? 'Usuario'
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  const editoraNome = user.user_metadata?.editora_nome ?? 'Editora'
  return (
    <AppShell nav={EDITORA_NAV} role="editora" editoraNome={editoraNome} userName={displayName} userInitials={initials}>
      {children}
    </AppShell>
  )
}