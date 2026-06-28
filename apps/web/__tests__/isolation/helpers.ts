/**
 * Helpers para testes de isolamento multi-tenant.
 *
 * Variáveis necessárias (via .env.local ou ambiente CI):
 *   NEXT_PUBLIC_SUPABASE_URL      — URL do projeto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY     — chave service_role (operações admin)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — chave anon (sign-in)
 *   ISOLATION_TEST_API_URL        — base da API Next.js rodando (ex: http://localhost:3000)
 */

import { createClient } from '@supabase/supabase-js'

// Polyfill WebSocket para Node.js/CI — Supabase Realtime precisa no construtor
if (typeof (globalThis as any).WebSocket === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ;(globalThis as any).WebSocket = require('ws')
  } catch { /* sem ws — ok, testes não usam subscriptions */ }
}

export const API_BASE = (process.env.ISOLATION_TEST_API_URL ?? '').replace(/\/$/, '')
export const VERCEL_BYPASS_SECRET = (process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? '').trim()

// ── Clientes Supabase ─────────────────────────────────────────────────────────

export function adminSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export function anonSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface TestTenant {
  tenantId:   string
  usuarioId:  string
  authUserId: string
  token:      string
  email:      string
  password:   string
}

export interface TestResources {
  editoraId:     string
  titularId:     string
  obraId:        string
  autorizacaoId: string
}

// ── Criar tenant de teste ─────────────────────────────────────────────────────

/**
 * Cria um tenant completo: auth user + tenant + usuario.
 * Retorna o JWT de acesso e uma função teardown para limpeza.
 */
export async function createTestTenant(
  label: string
): Promise<TestTenant & { teardown: () => Promise<void> }> {
  const sb  = adminSb()
  const ts  = Date.now()
  const email    = `test-isolation-${label}-${ts}@syncmood-test.invalid`
  const password = `Isolation@${ts}!`
  const slug     = `test-iso-${label}-${ts}`

  // 1. Auth user
  const { data: authData, error: authErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authErr || !authData.user) {
    throw new Error(`[setup:${label}] Auth user: ${authErr?.message}`)
  }

  // 2. Tenant
  const { data: tenantRow, error: tenantErr } = await sb
    .from('tenants')
    .insert({ nome: `[ISOLATION-TEST] ${label} ${ts}`, slug })
    .select('id')
    .single()
  if (tenantErr || !tenantRow) {
    try { await sb.auth.admin.deleteUser(authData.user.id) } catch { /* ignore */ }
    throw new Error(`[setup:${label}] Tenant: ${tenantErr?.message}`)
  }

  // 3. Usuario (vincula auth user ao tenant)
  const { data: usuarioRow, error: userErr } = await sb
    .from('usuarios')
    .insert({
      auth_user_id: authData.user.id,
      tenant_id:    tenantRow.id,
      role:         'admin',
      nome:         `[TEST] User ${label}`,
      email,
    })
    .select('id')
    .single()
  if (userErr || !usuarioRow) {
    try { await sb.from('tenants').delete().eq('id', tenantRow.id) } catch { /* ignore */ }
    try { await sb.auth.admin.deleteUser(authData.user.id) } catch { /* ignore */ }
    throw new Error(`[setup:${label}] Usuario: ${userErr?.message}`)
  }

  // 4. Sign-in para obter JWT
  const anon = anonSb()
  const { data: session, error: signInErr } = await anon.auth.signInWithPassword({ email, password })
  if (signInErr || !session?.session) {
    throw new Error(`[setup:${label}] SignIn: ${signInErr?.message}`)
  }

  // ── Teardown: deleta tudo na ordem correta das FKs ────────────────────────
  const teardown = async () => {
    const s   = adminSb()
    const tid = tenantRow.id
    const ops = [
      () => s.from('audit_logs').delete().eq('tenant_id', tid),
      () => s.from('cc_obras_movimentos').delete().eq('tenant_id', tid),
      () => s.from('cc_obras').delete().eq('tenant_id', tid),
      () => s.from('autorizacoes').delete().eq('tenant_id', tid),
      () => s.from('obras_contratos').delete().eq('tenant_id', tid),
      () => s.from('obras_links_titulares').delete().eq('tenant_id', tid),
      () => s.from('obras_links').delete().eq('tenant_id', tid),
      () => s.from('obras').delete().eq('tenant_id', tid),
      () => s.from('titulares').delete().eq('tenant_id', tid),
      () => s.from('editoras').delete().eq('tenant_id', tid),
      () => s.from('tenant_planos').delete().eq('tenant_id', tid),
      () => s.from('usuarios').delete().eq('tenant_id', tid),
      () => s.from('tenants').delete().eq('id', tid),
      () => s.auth.admin.deleteUser(authData.user.id),
    ]
    for (const op of ops) {
      try { await op() } catch (e) {
        console.warn(`[teardown:${label}]`, (e as Error)?.message)
      }
    }
  }

  return {
    tenantId:   tenantRow.id,
    usuarioId:  usuarioRow.id,
    authUserId: authData.user.id,
    token:      session.session.access_token,
    email,
    password,
    teardown,
  }
}

// ── Criar dados de teste direto no banco ──────────────────────────────────────

/**
 * Insere editora, titular, obra e autorização para o tenant.
 * Usado para criar o "estado vítima" — dados que o outro tenant tentará acessar.
 */
export async function seedTenantResources(tenant: TestTenant): Promise<TestResources> {
  const sb = adminSb()
  const ts = Date.now()

  const { data: editora, error: edErr } = await sb
    .from('editoras')
    .insert({
      tenant_id:     tenant.tenantId,
      razao_social:  `[TEST] Editora ${ts}`,
      nome_fantasia: `[TEST] Editora ${ts}`,
    })
    .select('id')
    .single()
  if (edErr || !editora) throw new Error(`[seed] editora: ${edErr?.message}`)

  const { data: titular, error: titErr } = await sb
    .from('titulares')
    .insert({
      tenant_id:      tenant.tenantId,
      codigo_titular: `TST-${ts}`,
      nome_completo:  `[TEST] Titular ${ts}`,
    })
    .select('id')
    .single()
  if (titErr || !titular) throw new Error(`[seed] titular: ${titErr?.message}`)

  const { data: obra, error: obraErr } = await sb
    .from('obras')
    .insert({
      tenant_id:   tenant.tenantId,
      codigo_obra: `TST-${ts}`,
      titulo:      `[TEST] Obra ${ts}`,
    })
    .select('id')
    .single()
  if (obraErr || !obra) throw new Error(`[seed] obra: ${obraErr?.message}`)

  const { data: aut, error: autErr } = await sb
    .from('autorizacoes')
    .insert({
      tenant_id:          tenant.tenantId,
      obra_id:            obra.id,
      status_workflow:    'rascunho',
      status:             'pendente',
      numero_autorizacao: `AUT-TST-${ts}`,
      tipo_uso:           'sync',
      tipo_autorizacao:   'sync',
      licenciante:        '[TEST] Licenciante',
      licenciado:         '[TEST] Licenciado',
      data_inicio:        new Date().toISOString().slice(0, 10),
      territorio:         'BR',
      moeda:              'BRL',
      valor:              0,
    })
    .select('id')
    .single()
  if (autErr || !aut) throw new Error(`[seed] autorizacao: ${autErr?.message}`)

  return {
    editoraId:     editora.id,
    titularId:     titular.id,
    obraId:        obra.id,
    autorizacaoId: aut.id,
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

export async function apiFetch(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  token: string,
  payload?: unknown
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
      ...(VERCEL_BYPASS_SECRET ? { 'x-vercel-protection-bypass': VERCEL_BYPASS_SECRET } : {}),
    },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  })
  let body: unknown = null
  try { body = await res.json() } catch { /* resposta vazia */ }
  return { status: res.status, body }
}

/** Retorna true se o status indica acesso bloqueado (403, 404 ou 401). */
export function isBlocked(status: number): boolean {
  return status === 401 || status === 403 || status === 404
}

/** Lista de IDs extraída de uma resposta de listagem. */
export function extractIds(body: unknown, field = 'id'): string[] {
  const items = (body as any)?.data ?? (body as any)?.items ?? []
  return Array.isArray(items) ? items.map((i: any) => i[field]).filter(Boolean) : []
}
