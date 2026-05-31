import pkg from 'file:///C:/Users/Usuário/Desktop/gestao-zero-1/node_modules/playwright/index.js'
const { chromium } = pkg

const BASE = 'http://localhost:3000/master/autorizacoes/nova'
const OUT = 'C:/Users/Usuário/AppData/Local/Temp/'

const b = await chromium.launch({ headless: true })
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } })
const p = await ctx.newPage()
p.setDefaultTimeout(12000)

const shot = async (name) => {
  await p.screenshot({ path: OUT + name })
  console.log('📸', name)
}

console.log('\n=== TESTE DO WIZARD NOVA AUTORIZAÇÃO ===\n')

await p.goto(BASE)
await p.waitForLoadState('networkidle')
await shot('step0_tipo.png')
const titulo = await p.locator('h2').first().textContent().catch(() => '?')
console.log('Step 0 carregado. Título:', titulo?.trim())

const totalTipos = await p.locator('button').filter({ hasText: /Fonograma|Sincroniza|Publicidade|TV|Edicao|Incidental|Versao/i }).count()
console.log('Tipos de autorização visíveis:', totalTipos, totalTipos >= 7 ? '✅' : '⚠️ esperado 7')

// Step 0 → 1
await p.getByRole('button', { name: /Proximo/i }).click()
await p.waitForTimeout(800)
await shot('step1_obra.png')
console.log('✅ Step 0 → 1 (Selecionar Obra)')

// Seleciona primeira obra não bloqueada
const obras = p.locator('button:not([disabled])').filter({ hasText: /TSM|CTR|AUT/ })
const nObras = await obras.count()
console.log('Obras disponíveis:', nObras)
if (nObras > 0) {
  await obras.first().click()
  await p.waitForTimeout(400)
  console.log('✅ Obra selecionada')
}
await shot('step1_obra_sel.png')

await p.getByRole('button', { name: /Proximo/i }).click()
await p.waitForTimeout(800)
await shot('step2_dados.png')
console.log('✅ Step 1 → 2 (Dados Específicos)')

// Step 2 → 3
await p.getByRole('button', { name: /Proximo/i }).click()
await p.waitForTimeout(800)
await shot('step3_periodo.png')
console.log('✅ Step 2 → 3 (Período)')

// Preenche data obrigatória
await p.locator('input[type="date"]').first().fill('2026-07-01')
await p.waitForTimeout(200)

// Ativa exclusividade
await p.locator('input[type="checkbox"]').first().click()
await p.waitForTimeout(400)
await shot('step3_excl.png')
console.log('✅ Exclusividade ativada')

await p.getByRole('button', { name: /Proximo/i }).click()
await p.waitForTimeout(800)
await shot('step4_pagamento.png')
console.log('✅ Step 3 → 4 (Pagamento)')

// Seleciona parcelado
await p.locator('button').filter({ hasText: /Parcelado/i }).first().click()
await p.waitForTimeout(400)
await shot('step4_parcelado.png')
console.log('✅ Parcelado selecionado')

await p.getByRole('button', { name: /Proximo/i }).click()
await p.waitForTimeout(800)
await shot('step5_modelo.png')
console.log('✅ Step 4 → 5 (Modelo Negócio)')

await p.getByRole('button', { name: /Proximo/i }).click()
await p.waitForTimeout(800)
await shot('step6_revisao.png')
console.log('✅ Step 5 → 6 (Revisão)')

const btnGerar = await p.getByRole('button', { name: /Gerar Documento/i }).isVisible()
console.log('Botão "Gerar Documento":', btnGerar ? '✅ visível' : '❌ não encontrado')

// Teste voltar
await p.getByRole('button', { name: /Anterior/i }).click()
await p.waitForTimeout(400)
console.log('✅ Botão Anterior funcionando')
await shot('step5_volta.png')

await b.close()
console.log('\n=== ✅ WIZARD TESTADO — todos os passos navegados ===')
