/**
 * ════════════════════════════════════════════════════════════════
 *  Testes de Isolamento — Storage e PDFs de Contrato
 * ════════════════════════════════════════════════════════════════
 *
 * Prova que Tenant B não consegue:
 *   1. Acessar endpoint que gera signed URL para contrato de A
 *   2. Acessar o arquivo diretamente no Supabase Storage (bucket privado)
 *   3. Obter qualquer metadado de contrato de A
 *
 * O fluxo real de um ataque:
 *   → Tenant B consegue o obra_id de A (via adivinhação ou outro vazamento)
 *   → Tenant B tenta GET /api/obras/{id_de_A}/contrato-manual
 *   → Sistema deve retornar 403/404 antes de gerar qualquer signed URL
 *   → Mesmo que B tente acessar o arquivo diretamente no Storage → bloqueado
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
let resB: TestResources
let obraContratoId: string | null = null
let storagePath: string | null = null

// ════════════════════════════════════════════════════════════════
//  SUITE
// ════════════════════════════════════════════════════════════════

describe.skipIf(MISSING.length > 0)('Storage — Isolamento de Contratos e PDFs', () => {

  beforeAll(async () => {
    ;[tenantA, tenantB] = await Promise.all([
      createTestTenant('storage-A'),
      createTestTenant('storage-B'),
    ])
    ;[resA, resB] = await Promise.all([
      seedTenantResources(tenantA),
      seedTenantResources(tenantB),
    ])

    // Fazer upload de um arquivo mínimo no storage para Tenant A
    const sb = adminSb()
    const ts = Date.now()
    storagePath = `${tenantA.tenantId}/contratos/test-${ts}.pdf`

    // Conteúdo mínimo de PDF (4 bytes)
    const fakeContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // "%PDF"

    const { error: uploadErr } = await sb.storage
      .from('contratos-manuais')
      .upload(storagePath, fakeContent, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadErr) {
      console.warn('[storage-test] Upload falhou (bucket pode não existir localmente):', uploadErr.message)
      storagePath = null
    } else {
      // Registrar metadados na tabela obras_contratos para Tenant A
      const { data: oc } = await sb.from('obras_contratos').insert({
        tenant_id:        tenantA.tenantId,
        obra_id:          resA.obraId,
        storage_path:     storagePath,
        nome_arquivo:     `test-${ts}.pdf`,
        mime_type:        'application/pdf',
        tamanho_arquivo:  4,
        status_processamento_ia: 'pendente',
      }).select('id').single()
      obraContratoId = oc?.id ?? null
    }
  }, 90_000)

  afterAll(async () => {
    // Remover arquivo do storage se foi criado
    if (storagePath) {
      const sb = adminSb()
      await sb.storage.from('contratos-manuais').remove([storagePath]).catch(() => {})
    }
    await tenantA?.teardown()
    await tenantB?.teardown()
  }, 60_000)

  // ── 1. Tenant B não consegue endpoint de contrato da obra de A ────────────
  it('B não acessa endpoint contrato-manual da obra de A', async () => {
    const { status } = await apiFetch(
      'GET',
      `/api/obras/${resA.obraId}/contrato-manual`,
      tenantB.token
    )
    expect(
      isBlocked(status),
      `FALHA: B acessou contrato-manual da obra de A (status ${status})`
    ).toBe(true)
  })

  it('A não acessa endpoint contrato-manual da obra de B', async () => {
    const { status } = await apiFetch(
      'GET',
      `/api/obras/${resB.obraId}/contrato-manual`,
      tenantA.token
    )
    expect(isBlocked(status)).toBe(true)
  })

  // ── 2. Acesso direto ao Supabase Storage sem signed URL é bloqueado ────────
  it('Acesso direto ao bucket privado sem autenticação retorna 400/401/403', async () => {
    if (!storagePath) {
      console.info('[skip] arquivo não foi carregado no storage')
      return
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const directUrl   = `${supabaseUrl}/storage/v1/object/contratos-manuais/${storagePath}`

    const res = await fetch(directUrl)
    // Bucket privado deve negar acesso sem signed URL ou service_role key
    expect(
      [400, 401, 403].includes(res.status),
      `Arquivo acessível diretamente sem signed URL! status=${res.status} url=${directUrl}`
    ).toBe(true)
  })

  // ── 3. Tenant B não pode gerar signed URL para arquivo de A via guessing ──
  it('B não consegue signed URL para storage_path conhecido de A', async () => {
    if (!storagePath || !obraContratoId) {
      console.info('[skip] obras_contratos não foi criado')
      return
    }
    // Mesmo conhecendo o storage_path de A, B tenta acessar pelo endpoint
    // O endpoint verifica obra_id → tenant_id antes de gerar a URL
    const { status, body } = await apiFetch(
      'GET',
      `/api/obras/${resA.obraId}/contrato-manual`,
      tenantB.token
    )
    // O endpoint não pode retornar nenhuma signed URL
    const bodyStr = JSON.stringify(body)
    const hasSignedUrl = bodyStr.includes('signed') || bodyStr.includes('token=')
    expect(
      isBlocked(status) || !hasSignedUrl,
      `FALHA DE SEGURANÇA: B obteve signed URL de contrato de A (status ${status})`
    ).toBe(true)
  })

  // ── 4. Tenant B não consegue upload de contrato na obra de A ──────────────
  it('B não consegue fazer upload de contrato para obra de A', async () => {
    // A rota de upload usa FormData — aqui testamos a validação de acesso
    // sem enviar um arquivo real (a rota deve bloquear antes)
    const res = await fetch(
      `${process.env.ISOLATION_TEST_API_URL}/api/obras/${resA.obraId}/contrato-manual`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${tenantB.token}` },
        // Sem body FormData — apenas testa se a rota bloqueia antes de processar
        body: new FormData(),
      }
    )
    expect(
      isBlocked(res.status),
      `B conseguiu iniciar upload para obra de A (status ${res.status})`
    ).toBe(true)
  })
})
