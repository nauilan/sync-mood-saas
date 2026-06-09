import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { MASTER_NAV } from '@/components/layout/nav-config'
import { PerfilProvider } from '@/contexts/perfil-context'
import { AlertasVencimento } from '@/components/ui/alertas-vencimento'
import { TenantBootstrap } from '@/components/ui/tenant-bootstrap'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()

const MASTER_ROLES = ['master', 'admin', 'super_admin', 'editora_administrada', 'financeiro', 'juridico', 'atendimento']

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const url = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
  const key = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY)

  // Busca role real do banco
  let usuario: { nome: string; role: string; tenant_id: string } | null = null
  try {
    const usrRes = await fetch(
      `${url}/rest/v1/usuarios?select=nome,role,tenant_id&auth_user_id=eq.${user.id}&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
    )
    const usrData = await usrRes.json()
    usuario = Array.isArray(usrData) && usrData[0] ? usrData[0] : null
  } catch { /* continua sem dados do banco */ }

  // Proteção: role precisa ser permitida para /master
  if (!usuario || !MASTER_ROLES.includes(usuario.role)) {
    // Fallback: aceitar se user_metadata.user_role === 'master' (compatibilidade)
    if (user.user_metadata?.user_role !== 'master') {
      redirect('/editora/dashboard')
    }
  }

  // Nome do tenant
  let tenantNome = ''
  if (usuario?.tenant_id) {
    try {
      const tenantRes = await fetch(
        `${url}/rest/v1/tenants?select=nome&id=eq.${usuario.tenant_id}&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
      )
      const tenantData = await tenantRes.json()
      tenantNome = Array.isArray(tenantData) && tenantData[0]?.nome ? tenantData[0].nome : ''
    } catch { /* sem nome de tenant */ }
  }

  const displayName = usuario?.nome ?? user.user_metadata?.full_name ?? user.email ?? ''
  const initials = displayName.split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'
  const userRole = (usuario?.role ?? user.user_metadata?.user_role ?? 'master') as string

  return (
    <PerfilProvider userRole={userRole}>
      <TenantBootstrap />
      <AppShell
        nav={MASTER_NAV}
        role="master"
        userName={displayName}
        userInitials={initials}
        tenantNome={tenantNome}
        userRole={userRole}
      >
        <AlertasVencimento />
        {children}
      </AppShell>
    </PerfilProvider>
  )
}
