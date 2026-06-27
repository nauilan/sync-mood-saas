/**
 * ════════════════════════════════════════════════════════════════
 *  TESTES DE ISOLAMENTO MULTI-TENANT — Sync Mood
 * ════════════════════════════════════════════════════════════════
 *
 * Prova, de forma automatizada, que Tenant B não consegue ler,
 * listar, criar ou alterar nenhum recurso pertencente ao Tenant A
 * — e vice-versa.
 *
 * REGRA: nenhum deploy em rotas de auth, contratos, autorizações,
 * CWR, storage ou relatórios sem esses testes passando.
 *
 * Pré-requisitos (via .env.local ou variáveis de CI):
 *   NEXT_PUBLIC_SUPABASE_URL      — URL do projeto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY     — chave service_role
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — chave anon
 *   ISOLATION_TEST_API_URL        — ex: http://localhost:3000
 *
 * Como rodar:
 *   npx cross-env ISOLATION_TEST_API_URL=http://localhost:3000 vitest run --reporter=verbose __tests__/isolation
 *   (ou)
 *   npm run test:isolation
 */

import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import {
  createTestTenant,
  seedTenantResources,
  apiFetch,
  isBlocked,
  extractIds,
  type TestTenant,
  type TestResources,
} from './helpers'

// ── Verificar variáveis de ambiente ──────────────────────────────────────────

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ISOLATION_TEST_API_URL',
]
const MISSING = REQUIRED_VARS.filter(k => !process.env[k])

if (MISSING.length > 0) {
  console.warn(
    '\n⚠️  Testes de isolamento PULADOS — variáveis ausentes:\n' +
    MISSING.map(v => `   • ${v}`).join('\n') +
    '\n\n   Configure o ISOLATION_TEST_API_URL e rode: npm run test:isolation\n'
  )
}

// ── Estado dos testes ─────────────────────────────────────────────────────────

let tenantA: TestTenant & { teardown: () => Promise<void> }
let tenantB: TestTenant & { teardown: () => Promise<void> }
let resA: TestResources   // recursos do Tenant A (vítima)
let resB: TestResources   // recursos do Tenant B (atacante)

// ════════════════════════════════════════════════════════════════
//  SUITE PRINCIPAL
// ════════════════════════════════════════════════════════════════

describe.skipIf(MISSING.length > 0)('Isolamento Multi-Tenant', () => {

  // ── Setup global ────────────────────────────────────────────────────────────
  beforeAll(async () => {
    // Criar os dois tenants em paralelo
    ;[tenantA, tenantB] = await Promise.all([
      createTestTenant('A'),
      createTestTenant('B'),
    ])
    // Criar dados de teste para cada tenant
    ;[resA, resB] = await Promise.all([
      seedTenantResources(tenantA),
      seedTenantResources(tenantB),
    ])
    console.info(`\n  Tenant A: ${tenantA.tenantId}`)
    console.info(`  Tenant B: ${tenantB.tenantId}\n`)
  }, 90_000)

  // ── Teardown global ─────────────────────────────────────────────────────────
  afterAll(async () => {
    await tenantA?.teardown()
    await tenantB?.teardown()
  }, 60_000)

  // ══════════════════════════════════════════════════════════════
  //  1. ACESSO SEM AUTENTICAÇÃO — deve bloquear tudo
  // ══════════════════════════════════════════════════════════════

  describe('Acesso sem autenticação', () => {
    it('GET /api/obras sem token → 401', async () => {
      const res = await fetch(`${process.env.ISOLATION_TEST_API_URL}/api/obras`)
      expect([401, 403]).toContain(res.status)
    })

    it('GET /api/autorizacoes sem token → 401', async () => {
      const res = await fetch(`${process.env.ISOLATION_TEST_API_URL}/api/autorizacoes`)
      expect([401, 403]).toContain(res.status)
    })

    it('GET /api/titulares sem token → 401', async () => {
      const res = await fetch(`${process.env.ISOLATION_TEST_API_URL}/api/titulares`)
      expect([401, 403]).toContain(res.status)
    })
  })

  // ══════════════════════════════════════════════════════════════
  //  2. OBRAS
  // ══════════════════════════════════════════════════════════════

  describe('Obras — isolamento de leitura', () => {
    it('B não acessa obra de A por ID', async () => {
      const { status } = await apiFetch('GET', `/api/obras/${resA.obraId}`, tenantB.token)
      expect(isBlocked(status), `esperado 403/404, recebeu ${status}`).toBe(true)
    })

    it('A não acessa obra de B por ID', async () => {
      const { status } = await apiFetch('GET', `/api/obras/${resB.obraId}`, tenantA.token)
      expect(isBlocked(status), `esperado 403/404, recebeu ${status}`).toBe(true)
    })

    it('Listagem de B não inclui obras de A', async () => {
      const { status, body } = await apiFetch('GET', '/api/obras', tenantB.token)
      expect(status).toBe(200)
      expect(extractIds(body)).not.toContain(resA.obraId)
    })

    it('Listagem de A não inclui obras de B', async () => {
      const { status, body } = await apiFetch('GET', '/api/obras', tenantA.token)
      expect(status).toBe(200)
      expect(extractIds(body)).not.toContain(resB.obraId)
    })
  })

  // ══════════════════════════════════════════════════════════════
  //  3. TITULARES
  // ══════════════════════════════════════════════════════════════

  describe('Titulares — isolamento de leitura', () => {
    it('B não acessa titular de A por ID', async () => {
      const { status } = await apiFetch('GET', `/api/titulares/${resA.titularId}`, tenantB.token)
      expect(isBlocked(status), `esperado 403/404, recebeu ${status}`).toBe(true)
    })

    it('A não acessa titular de B por ID', async () => {
      const { status } = await apiFetch('GET', `/api/titulares/${resB.titularId}`, tenantA.token)
      expect(isBlocked(status), `esperado 403/404, recebeu ${status}`).toBe(true)
    })

    it('Listagem de B não inclui titulares de A', async () => {
      const { status, body } = await apiFetch('GET', '/api/titulares', tenantB.token)
      expect(status).toBe(200)
      expect(extractIds(body)).not.toContain(resA.titularId)
    })

    it('Listagem de A não inclui titulares de B', async () => {
      const { status, body } = await apiFetch('GET', '/api/titulares', tenantA.token)
      expect(status).toBe(200)
      expect(extractIds(body)).not.toContain(resB.titularId)
    })
  })

  // ══════════════════════════════════════════════════════════════
  //  4. AUTORIZAÇÕES
  // ══════════════════════════════════════════════════════════════

  describe('Autorizações — isolamento de leitura e escrita', () => {
    it('B não acessa autorização de A por ID', async () => {
      const { status } = await apiFetch('GET', `/api/autorizacoes/${resA.autorizacaoId}`, tenantB.token)
      expect(isBlocked(status), `esperado 403/404, recebeu ${status}`).toBe(true)
    })

    it('A não acessa autorização de B por ID', async () => {
      const { status } = await apiFetch('GET', `/api/autorizacoes/${resB.autorizacaoId}`, tenantA.token)
      expect(isBlocked(status), `esperado 403/404, recebeu ${status}`).toBe(true)
    })

    it('Listagem de B não inclui autorizações de A', async () => {
      const { status, body } = await apiFetch('GET', '/api/autorizacoes', tenantB.token)
      expect(status).toBe(200)
      expect(extractIds(body)).not.toContain(resA.autorizacaoId)
    })

    it('Listagem de A não inclui autorizações de B', async () => {
      const { status, body } = await apiFetch('GET', '/api/autorizacoes', tenantA.token)
      expect(status).toBe(200)
      expect(extractIds(body)).not.toContain(resB.autorizacaoId)
    })

    it('B não consegue emitir autorização para obra de A', async () => {
      // Testa contaminação cross-tenant: B usa obra_id de A
      const { status, body } = await apiFetch('POST', '/api/autorizacoes', tenantB.token, {
        obra_id:          resA.obraId,   // obra pertence ao Tenant A
        tipo_autorizacao: 'sinc_av',
        licenciado_nome:  '[TEST] Invasor Ltda',
        modelo_negocio:   'sem_onus',
        territorio:       'BR',
        status_workflow:  'rascunho',
      })
      // DEVE ser bloqueado (404 = obra não encontrada no tenant de B)
      expect(
        isBlocked(status),
        `FALHA DE SEGURANÇA: B criou autorização para obra de A (status ${status}, body: ${JSON.stringify(body)})`
      ).toBe(true)
    })

    it('A não consegue confirmar pagamento de autorização de B', async () => {
      const { status } = await apiFetch(
        'POST',
        `/api/autorizacoes/${resB.autorizacaoId}/confirmar-pagamento`,
        tenantA.token,
        { valor_pago: 100, forma_pagamento: 'transferencia' }
      )
      expect(isBlocked(status), `esperado 403/404, recebeu ${status}`).toBe(true)
    })
  })

  // ══════════════════════════════════════════════════════════════
  //  5. CONTRATOS (obras_contratos)
  // ══════════════════════════════════════════════════════════════

  describe('Contratos — isolamento de leitura', () => {
    it('B não lista contratos da obra de A', async () => {
      const { status, body } = await apiFetch(
        'GET',
        `/api/obras/${resA.obraId}/contrato-manual`,
        tenantB.token
      )
      // Pode retornar 404 (obra não encontrada para B) ou 200 com lista vazia
      if (isBlocked(status)) {
        expect(isBlocked(status)).toBe(true)
      } else {
        expect(status).toBe(200)
        expect(extractIds(body)).toHaveLength(0)
      }
    })

    it('A não lista contratos da obra de B', async () => {
      const { status, body } = await apiFetch(
        'GET',
        `/api/obras/${resB.obraId}/contrato-manual`,
        tenantA.token
      )
      if (isBlocked(status)) {
        expect(isBlocked(status)).toBe(true)
      } else {
        expect(status).toBe(200)
        expect(extractIds(body)).toHaveLength(0)
      }
    })
  })

  // ══════════════════════════════════════════════════════════════
  //  6. CONTA CORRENTE
  // ══════════════════════════════════════════════════════════════

  describe('Conta Corrente — isolamento', () => {
    it('B não acessa cc_obras da obra de A', async () => {
      // Tenta via rota de detalhe da obra — cc é embutido
      const { status, body } = await apiFetch('GET', `/api/cc-obra/${resA.obraId}`, tenantB.token)
      // Se a rota não existir (404 geral) → ok
      // Se existir → deve bloquear
      const isNotFoundRoute = status === 404 && !(body as any)?.id
      if (!isNotFoundRoute) {
        expect(isBlocked(status), `esperado 403/404, recebeu ${status}`).toBe(true)
      }
    })

    it('A não acessa cc_obras da obra de B', async () => {
      const { status, body } = await apiFetch('GET', `/api/cc-obra/${resB.obraId}`, tenantA.token)
      const isNotFoundRoute = status === 404 && !(body as any)?.id
      if (!isNotFoundRoute) {
        expect(isBlocked(status), `esperado 403/404, recebeu ${status}`).toBe(true)
      }
    })
  })

  // ══════════════════════════════════════════════════════════════
  //  7. CWR IMPORTAÇÕES
  // ══════════════════════════════════════════════════════════════

  describe('CWR — isolamento de listagem', () => {
    it('Listagem de CWR de B não inclui importações de A', async () => {
      const { status, body } = await apiFetch('GET', '/api/cwr', tenantB.token)
      if (status === 404 || status === 405) return // rota pode não existir
      expect(status).toBe(200)
      const items: any[] = (body as any)?.data ?? []
      const crossTenant  = items.filter(i => i.tenant_id === tenantA.tenantId)
      expect(crossTenant, 'Dados de A encontrados na listagem de B').toHaveLength(0)
    })

    it('Listagem de CWR de A não inclui importações de B', async () => {
      const { status, body } = await apiFetch('GET', '/api/cwr', tenantA.token)
      if (status === 404 || status === 405) return
      expect(status).toBe(200)
      const items: any[] = (body as any)?.data ?? []
      const crossTenant  = items.filter(i => i.tenant_id === tenantB.tenantId)
      expect(crossTenant, 'Dados de B encontrados na listagem de A').toHaveLength(0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  //  8. IDs GERADOS POR A NÃO SÃO ENCONTRADOS POR B
  //     (confirmação geral — recursos adicionais)
  // ══════════════════════════════════════════════════════════════

  describe('Isolamento geral de recursos', () => {
    it('B não consegue acessar editora de A via titulares (edge case)', async () => {
      // titulares pode ter editora_id — garante que leitura de titular
      // de outro tenant não vaza nomes de editora
      const { status } = await apiFetch('GET', `/api/titulares/${resA.titularId}`, tenantB.token)
      expect(isBlocked(status)).toBe(true)
    })

    it('tenant_id de A nunca aparece em resposta autenticada de B', async () => {
      // Varredura nas listagens principais
      const endpoints = ['/api/obras', '/api/titulares', '/api/autorizacoes']
      for (const ep of endpoints) {
        const { status, body } = await apiFetch('GET', ep, tenantB.token)
        if (status !== 200) continue
        const raw = JSON.stringify(body)
        expect(
          raw.includes(tenantA.tenantId),
          `tenant_id de A encontrado na resposta de ${ep} para B`
        ).toBe(false)
      }
    })

    it('tenant_id de B nunca aparece em resposta autenticada de A', async () => {
      const endpoints = ['/api/obras', '/api/titulares', '/api/autorizacoes']
      for (const ep of endpoints) {
        const { status, body } = await apiFetch('GET', ep, tenantA.token)
        if (status !== 200) continue
        const raw = JSON.stringify(body)
        expect(
          raw.includes(tenantB.tenantId),
          `tenant_id de B encontrado na resposta de ${ep} para A`
        ).toBe(false)
      }
    })
  })
})
