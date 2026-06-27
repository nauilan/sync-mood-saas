/**
 * ════════════════════════════════════════════════════════════════
 *  Testes de Isolamento — Rotas Administrativas e CWR
 * ════════════════════════════════════════════════════════════════
 *
 * Prova que:
 *   1. Rotas admin (/api/admin/*) exigem o segredo de serviço —
 *      um JWT de usuário comum é insuficiente.
 *   2. Rotas CWR sensíveis (integrar, reverter, popular-links) são
 *      tenant-scoped: Tenant B não acessa recursos do Tenant A.
 *   3. Rotas de operação em massa (migrar-editoras-cwr) são seguras.
 *
 * Essas rotas são as mais perigosas porque mexem em lote e
 * podem afetar múltiplas obras/titulares/editoras de uma só vez.
 */

import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import {
  createTestTenant,
  seedTenantResources,
  apiFetch,
  isBlocked,
  adminSb,
  type TestTenant,
  type TestResources,
} from './helpers'

// ── Skip se env vars ausentes ─────────────────────────────────────────────────
const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ISOLATION_TEST_API_URL',
]
const MISSING = REQUIRED_VARS.filter(k => !process.env[k])

// ── Estado dos testes ─────────────────────────────────────────────────────────
let tenantA: TestTenant & { teardown: () => Promise<void> }
let tenantB: TestTenant & { teardown: () => Promise<void> }
let resA: TestResources
let cwrImportacaoIdA: string | null = null

// ════════════════════════════════════════════════════════════════
//  SUITE
// ════════════════════════════════════════════════════════════════

describe.skipIf(MISSING.length > 0)('Admin e CWR — Isolamento', () => {

  beforeAll(async () => {
    ;[tenantA, tenantB] = await Promise.all([
      createTestTenant('admin-A'),
      createTestTenant('admin-B'),
    ])
    resA = await seedTenantResources(tenantA)

    // Tentar criar uma importação CWR mínima para Tenant A (para testes cross-tenant)
    const sb = adminSb()
    const ts = Date.now()
    const { data: cwr } = await sb.from('cwr_importacoes').insert({
      tenant_id:    tenantA.tenantId,
      nome_arquivo: `test-${ts}.cwr`,
      status:       'pendente',
    }).select('id').single()
    cwrImportacaoIdA = cwr?.id ?? null

    if (!cwrImportacaoIdA) {
      console.warn('[admin-test] cwr_importacoes insert falhou — testes de CWR cross-tenant serão pulados')
    }
  }, 60_000)

  afterAll(async () => {
    if (cwrImportacaoIdA) {
      const sb = adminSb()
      try { await sb.from('cwr_importacoes').delete().eq('id', cwrImportacaoIdA) } catch { /* ignore */ }
    }
    await tenantA?.teardown()
    await tenantB?.teardown()
  }, 30_000)

  // ══════════════════════════════════════════════════════════════
  //  1. ROTAS ADMIN — exigem segredo, não apenas JWT
  // ══════════════════════════════════════════════════════════════

  describe('Rotas /api/admin — barreira de segredo', () => {
    it('POST /api/admin/reintegrar-catalogo sem admin secret → bloqueado', async () => {
      // JWT de usuário normal NÃO deve substituir o admin secret
      const { status } = await apiFetch(
        'POST',
        '/api/admin/reintegrar-catalogo',
        tenantA.token,
        { tenant_id: tenantA.tenantId }
      )
      expect(
        isBlocked(status),
        `FALHA: usuário comum acessou rota admin (status ${status})`
      ).toBe(true)
    })

    it('POST /api/admin/reconstruir-links sem admin secret → bloqueado', async () => {
      const { status } = await apiFetch(
        'POST',
        '/api/admin/reconstruir-links',
        tenantA.token,
        { obra_id: resA.obraId }
      )
      expect(
        isBlocked(status),
        `FALHA: usuário comum acessou rota admin reconstruir-links (status ${status})`
      ).toBe(true)
    })
  })

  // ══════════════════════════════════════════════════════════════
  //  2. CWR — Isolamento por tenant
  // ══════════════════════════════════════════════════════════════

  describe('CWR — acesso cross-tenant bloqueado', () => {
    it('B não acessa detalhes de CWR de A por ID', async () => {
      if (!cwrImportacaoIdA) return
      const { status } = await apiFetch('GET', `/api/cwr/${cwrImportacaoIdA}`, tenantB.token)
      expect(
        isBlocked(status),
        `FALHA: B acessou CWR de A (status ${status})`
      ).toBe(true)
    })

    it('B não integra CWR de A ao catálogo', async () => {
      if (!cwrImportacaoIdA) return
      const { status } = await apiFetch(
        'POST',
        `/api/cwr/${cwrImportacaoIdA}/integrar`,
        tenantB.token
      )
      expect(
        isBlocked(status),
        `FALHA: B integrou CWR de A (status ${status})`
      ).toBe(true)
    })

    it('B não reverte integração de CWR de A', async () => {
      if (!cwrImportacaoIdA) return
      const { status } = await apiFetch(
        'POST',
        `/api/cwr/${cwrImportacaoIdA}/reverter`,
        tenantB.token
      )
      expect(
        isBlocked(status),
        `FALHA: B reverteu CWR de A (status ${status})`
      ).toBe(true)
    })

    it('B não popula links do CWR de A', async () => {
      if (!cwrImportacaoIdA) return
      const { status } = await apiFetch(
        'POST',
        `/api/cwr/${cwrImportacaoIdA}/popular-links`,
        tenantB.token
      )
      expect(
        isBlocked(status),
        `FALHA: B populou links do CWR de A (status ${status})`
      ).toBe(true)
    })

    it('B não reprocessa CWR de A', async () => {
      if (!cwrImportacaoIdA) return
      const { status } = await apiFetch(
        'POST',
        `/api/cwr/${cwrImportacaoIdA}/reprocessar`,
        tenantB.token
      )
      expect(
        isBlocked(status),
        `FALHA: B reprocessou CWR de A (status ${status})`
      ).toBe(true)
    })

    it('Listagem de CWR de B não inclui importações de A', async () => {
      const { status, body } = await apiFetch('GET', '/api/cwr', tenantB.token)
      if (status === 404) return
      expect(status).toBe(200)
      const ids: string[] = ((body as any)?.data ?? []).map((i: any) => i.id)
      if (cwrImportacaoIdA) {
        expect(
          ids.includes(cwrImportacaoIdA),
          'FALHA: CWR de A aparece na listagem de B'
        ).toBe(false)
      }
    })
  })

  // ══════════════════════════════════════════════════════════════
  //  3. OPERAÇÕES EM MASSA — tenant-safe
  // ══════════════════════════════════════════════════════════════

  describe('Operações em massa — isolamento', () => {
    it('POST /api/obras/migrar-editoras-cwr — B não migra obras de A', async () => {
      const { status } = await apiFetch(
        'POST',
        '/api/obras/migrar-editoras-cwr',
        tenantB.token,
        { obra_ids: [resA.obraId], editora_destino_id: resA.editoraId }
      )
      // Deve falhar: obra_ids pertencem ao Tenant A, não ao B
      expect(
        isBlocked(status),
        `FALHA: B migrou obras de A (status ${status})`
      ).toBe(true)
    })

    it('POST /api/obras/importar-cwr — B não importa CWR sem tenant válido', async () => {
      // Sem body CWR real — apenas verifica se a rota exige autenticação válida
      const { status } = await apiFetch(
        'POST',
        '/api/obras/importar-cwr',
        tenantB.token,
        {}
      )
      // Deve exigir arquivo CWR (400) ou bloquear por outro motivo — não deve ser 200
      expect(status).not.toBe(200)
    })
  })

  // ══════════════════════════════════════════════════════════════
  //  4. CONTRATOS FORMAIS — isolamento
  // ══════════════════════════════════════════════════════════════

  describe('Contratos formais — isolamento', () => {
    it('Listagem de contratos de B não inclui contratos de A', async () => {
      const { status, body } = await apiFetch('GET', '/api/contratos', tenantB.token)
      if (isBlocked(status)) return // rota protegida = ok
      expect(status).toBe(200)
      const tenantIds: string[] = ((body as any)?.data ?? []).map((c: any) => c.tenant_id)
      expect(
        tenantIds.some(tid => tid === tenantA.tenantId),
        'FALHA: contratos de A aparecem na listagem de B'
      ).toBe(false)
    })

    it('Listagem de recebimentos de B não inclui recebimentos de A', async () => {
      const { status, body } = await apiFetch('GET', '/api/recebimentos', tenantB.token)
      if (isBlocked(status)) return
      expect(status).toBe(200)
      const tenantIds: string[] = ((body as any)?.data ?? []).map((r: any) => r.tenant_id)
      expect(
        tenantIds.some(tid => tid === tenantA.tenantId),
        'FALHA: recebimentos de A aparecem na resposta de B'
      ).toBe(false)
    })

    it('Rota de auditoria analítica não vaza dados de outro tenant', async () => {
      const { status, body } = await apiFetch('GET', '/api/auditoria-analitico', tenantB.token)
      if (isBlocked(status)) return
      expect(status).toBe(200)
      const raw = JSON.stringify(body)
      expect(
        raw.includes(tenantA.tenantId),
        'FALHA: tenant_id de A aparece em auditoria de B'
      ).toBe(false)
    })
  })
})
