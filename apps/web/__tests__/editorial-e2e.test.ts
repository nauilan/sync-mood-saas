import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminSb, apiFetch, createTestTenant, type TestTenant } from './isolation/helpers'

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ISOLATION_TEST_API_URL',
] as const

const missing = requiredEnv.filter((key) => !process.env[key] || String(process.env[key]).trim() === '')
const hasEnv = missing.length === 0

type SeededEditorial = {
  editoraId: string
  titularId: string
  obraId: string
  linkId: string
  contratoId: string
}

async function seedEditorialScenario(tenant: TestTenant): Promise<SeededEditorial> {
  const sb = adminSb()
  const ts = Date.now()

  const { data: editora, error: editoraErr } = await sb
    .from('editoras')
    .insert({
      tenant_id: tenant.tenantId,
      razao_social: `[E2E] Editora ${ts}`,
      nome_fantasia: `[E2E] Editora ${ts}`,
      cnpj: `${ts}`.slice(-14).padStart(14, '0'),
      endereco: 'Rua Teste',
      bairro: 'Centro',
      cep: '01001000',
      cidade: 'SÃ£o Paulo',
      estado: 'SP',
      telefone: '11999999999',
      email: `editora-${ts}@test.invalid`,
      dados_bancarios: {},
      status: 'ativo',
    })
    .select('id')
    .single()
  if (editoraErr || !editora) throw new Error(`seed editora: ${editoraErr?.message}`)

  const { data: titular, error: titularErr } = await sb
    .from('titulares')
    .insert({
      tenant_id: tenant.tenantId,
      codigo_titular: `TIT-E2E-${ts}`,
      tipo: 'autor',
      nome_completo: `[E2E] Titular ${ts}`,
      pessoa: 'PF',
      cpf_cnpj: `${ts}`.slice(-11).padStart(11, '0'),
      status: 'ativo',
    })
    .select('id')
    .single()
  if (titularErr || !titular) throw new Error(`seed titular: ${titularErr?.message}`)

  const { data: obra, error: obraErr } = await sb
    .from('obras')
    .insert({
      tenant_id: tenant.tenantId,
      titulo: `[E2E] Obra ${ts}`,
      codigo_obra: `E2E-${ts}`,
      status: 'pre_cadastro',
      status_catalogo: 'pre_cadastro',
      origem_cadastro: 'manual',
      editora_id: editora.id,
    })
    .select('id')
    .single()
  if (obraErr || !obra) throw new Error(`seed obra: ${obraErr?.message}`)

  const { data: link, error: linkErr } = await sb
    .from('obras_links')
    .insert({
      tenant_id: tenant.tenantId,
      obra_id: obra.id,
      numero_link: 1,
      percentual_link: 100,
      tipo_link: 'controlado',
      controlado: true,
      status: 'ativo',
    })
    .select('id')
    .single()
  if (linkErr || !link) throw new Error(`seed link: ${linkErr?.message}`)

  const { error: oltErr } = await sb
    .from('obras_links_titulares')
    .insert({
      tenant_id: tenant.tenantId,
      obra_link_id: link.id,
      obra_id: obra.id,
      titular_id: titular.id,
      nome: `[E2E] Titular ${ts}`,
      papel: 'autor',
      funcao_no_link: 'CA',
      percentual_exec_publica: 100,
      percentual_fonomecanico: 100,
      percentual_sincronizacao: 100,
      controlado: false,
      status_controle: 'contrato_pendente',
      editora_id: editora.id,
      editora_original_id: editora.id,
    })
  if (oltErr) throw new Error(`seed obras_links_titulares: ${oltErr.message}`)

  const { data: contrato, error: contratoErr } = await sb
    .from('contratos')
    .insert({
      tenant_id: tenant.tenantId,
      numero: `CTR-E2E-${ts}`,
      tipo: 'administracao',
      titular_id: titular.id,
      editora_id: editora.id,
      data_inicio: new Date().toISOString().slice(0, 10),
      prazo_indeterminado: true,
      percentual_editora: 100,
      percentual_autor: 0,
      territorio: 'BR',
      direitos: ['sincronizacao', 'digital'],
      status: 'ativo',
    })
    .select('id')
    .single()
  if (contratoErr || !contrato) throw new Error(`seed contrato: ${contratoErr?.message}`)

  return {
    editoraId: editora.id,
    titularId: titular.id,
    obraId: obra.id,
    linkId: link.id,
    contratoId: contrato.id,
  }
}

async function debugResponse(label: string, response: Awaited<ReturnType<typeof apiFetch>>) {
  const body = response.body as any
  console.log(`[editorial-e2e] ${label}`, JSON.stringify({
    status: response.status,
    body,
  }))
}

describe('E2E editorial â€” obra pendente â†’ apta â†’ autorizaÃ§Ã£o â†’ pagamento', () => {
  let tenant: (TestTenant & { teardown: () => Promise<void> }) | null = null
  let seeded: SeededEditorial | null = null
  let autorizacaoId: string | null = null

  beforeAll(async () => {
    if (!hasEnv) return
    tenant = await createTestTenant('editorial-e2e')
    seeded = await seedEditorialScenario(tenant)
  }, 120000)

  afterAll(async () => {
    if (!hasEnv) return
    if (tenant) await tenant.teardown()
  }, 120000)

  it('obra nasce pendente e emissÃ£o Ã© bloqueada visual/API antes da amarraÃ§Ã£o', async () => {
    if (!hasEnv) {
      console.warn(`editorial-e2e skipped: variÃ¡veis ausentes: ${missing.join(', ')}`)
      return
    }
    const tenantCtx = tenant!
    const seed = seeded!

    const integridade = await apiFetch('GET', `/api/obras/${seed.obraId}/integridade`, tenantCtx.token)
    expect(integridade.status).toBe(200)
    expect((integridade.body as any)?.data?.status).toBe('contrato_pendente')

    const saneamento = await apiFetch('GET', `/api/obras/${seed.obraId}/saneamento`, tenantCtx.token)
    expect(saneamento.status).toBe(200)
    expect((saneamento.body as any)?.data?.integridade?.status).toBe('contrato_pendente')

    const tentativaAut = await apiFetch('POST', '/api/autorizacoes', tenantCtx.token, {
      obra_id: seed.obraId,
      editora_id: seed.editoraId,
      titular_id: seed.titularId,
      tipo_autorizacao: 'fonograma',
      finalidade: 'Teste editorial E2E',
      licenciado_nome: 'Produtor Teste',
      licenciado_cnpj_cpf: '12345678000199',
      licenciado_email: 'produtor@test.invalid',
      valor_licenca: 1000,
      moeda: 'BRL',
      territorio: 'BR',
      prazo_inicio: new Date().toISOString().slice(0, 10),
      prazo_indeterminado: true,
      status_workflow: 'emitida',
      modelo_negocio: 'pago_editora',
      dados_produto: {
        titulo: 'Produto E2E',
        interpretes: ['IntÃ©rprete E2E'],
        tipos_produto: ['single'],
        formatos_fisicos: ['CD'],
        formatos_digitais: ['Streaming'],
        isrcs: ['BRE2E2600001'],
        selo_gravadora: 'Gravadora E2E',
        distribuidora: 'Distrib E2E',
        data_lancamento: new Date().toISOString().slice(0, 10),
      },
    })

    expect(tentativaAut.status).toBe(422)
    expect(String((tentativaAut.body as any)?.error ?? '')).toMatch(/integridade editorial/i)
  }, 120000)

  it('amarrar contrato + recalcular integridade torna a obra apta', async () => {
    if (!hasEnv) return
    const tenantCtx = tenant!
    const seed = seeded!
    const sb = adminSb()

    const obraUpdate = await sb
      .from('obras')
      .update({
        contrato_origem_id: seed.contratoId,
      })
      .eq('id', seed.obraId)
      .eq('tenant_id', tenantCtx.tenantId)
    expect(obraUpdate.error).toBeNull()

    const amarrar = await apiFetch('POST', `/api/obras/${seed.obraId}/amarrar-contrato`, tenantCtx.token, {
      contrato_id: seed.contratoId,
    })
    if (amarrar.status !== 200) await debugResponse('amarrar', amarrar)
    expect(amarrar.status).toBe(200)
    expect((amarrar.body as any)?.data?.titulares_amarrados).toBeGreaterThan(0)

    const integridade = await apiFetch('GET', `/api/obras/${seed.obraId}/integridade`, tenantCtx.token)
    expect(integridade.status).toBe(200)
    expect((integridade.body as any)?.data?.status).toBe('apta')

    const saneamento = await apiFetch('GET', `/api/obras/${seed.obraId}/saneamento`, tenantCtx.token)
    expect(saneamento.status).toBe(200)
    expect((saneamento.body as any)?.data?.integridade?.status).toBe('apta')
    expect(((saneamento.body as any)?.data?.links ?? [])[0]?.titulares?.[0]?.controlado).toBe(true)
  }, 120000)

  it('obra apta permite emitir autorizaÃ§Ã£o e confirmar pagamento com movimento financeiro', async () => {
    if (!hasEnv) return
    const tenantCtx = tenant!
    const seed = seeded!

    const criarAut = await apiFetch('POST', '/api/autorizacoes', tenantCtx.token, {
      obra_id: seed.obraId,
      editora_id: seed.editoraId,
      titular_id: seed.titularId,
      tipo_autorizacao: 'fonograma',
      finalidade: 'Teste editorial E2E',
      licenciado_nome: 'Produtor Teste',
      licenciado_cnpj_cpf: '12345678000199',
      licenciado_email: 'produtor@test.invalid',
      valor_licenca: 1500,
      moeda: 'BRL',
      territorio: 'BR',
      prazo_inicio: new Date().toISOString().slice(0, 10),
      prazo_indeterminado: true,
      status_workflow: 'emitida',
      modelo_negocio: 'pago_editora',
      dados_produto: {
        titulo: 'Produto E2E',
        interpretes: ['IntÃ©rprete E2E'],
        tipos_produto: ['single'],
        formatos_fisicos: ['CD'],
        formatos_digitais: ['Streaming'],
        isrcs: ['BRE2E2600001'],
        titulo_faixa: 'Faixa E2E',
        versao: 'original',
        selo_gravadora: 'Gravadora E2E',
        distribuidora: 'Distrib E2E',
        data_lancamento: new Date().toISOString().slice(0, 10),
      },
    })

    if (criarAut.status !== 201) await debugResponse('criar-autorizacao', criarAut)
    expect(criarAut.status).toBe(201)
    autorizacaoId = (criarAut.body as any)?.data?.id
    expect(autorizacaoId).toBeTruthy()

    const detalhe = await apiFetch('GET', `/api/autorizacoes/${autorizacaoId}`, tenantCtx.token)
    expect(detalhe.status).toBe(200)
    expect((detalhe.body as any)?.data?.status_workflow ?? (detalhe.body as any)?.status_workflow).toBe('emitida')

    const saneamento = await apiFetch('GET', `/api/obras/${seed.obraId}/saneamento`, tenantCtx.token)
    const editorial = (saneamento.body as any)?.data
    expect(editorial?.integridade?.status).toBe('apta')
    expect(editorial?.obra?.codigo_obra).toContain('E2E-')
    expect((editorial?.links ?? []).length).toBeGreaterThan(0)

    const confirmar = await apiFetch('POST', `/api/autorizacoes/${autorizacaoId}/confirmar-pagamento`, tenantCtx.token, {
      valor_pago: 1500,
      forma_pagamento: 'pix',
      observacoes: 'Pagamento E2E',
    })
    if (confirmar.status !== 200) await debugResponse('confirmar-pagamento', confirmar)
    expect(confirmar.status).toBe(200)
    expect((confirmar.body as any)?.cc_atualizado).toBe(true)
    expect((confirmar.body as any)?.cc_movimento_id).toBeTruthy()

    const sb = adminSb()
    let movimento: any = null
    let movErr: any = null
    const tentativaMovNova = await sb
      .from('cc_obras_movimentos')
      .select('id, editora_id, valor, descricao, source_id')
      .eq('tenant_id', tenantCtx.tenantId)
      .eq('source_id', autorizacaoId)
      .single()
    if (!tentativaMovNova.error) {
      movimento = tentativaMovNova.data
    } else {
      const tentativaMovLegada = await sb
        .from('cc_obras_movimentos')
        .select('id, editora_id, valor, descricao, source')
        .eq('tenant_id', tenantCtx.tenantId)
        .eq('source', 'autorizacao')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      movErr = tentativaMovLegada.error
      movimento = tentativaMovLegada.data
    }
    expect(movErr).toBeNull()
    expect(movimento?.valor).toBe(1500)
    expect(movimento?.editora_id).toBe(seed.editoraId)
    expect(String(movimento?.descricao ?? '')).toMatch(/AutorizaÃ§Ã£o/i)
  }, 120000)
})
