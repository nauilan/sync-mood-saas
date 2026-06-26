const { chromium } = require('playwright')
const path = require('path')

const OUT = __dirname
const BASE = 'http://localhost:3000'

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: true })
  console.log('  [ok]', name)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  // Login
  await page.goto(BASE + '/auth/login', { waitUntil: 'networkidle', timeout: 30000 })
  await page.locator('input[placeholder="000.000.000-00"]').first().fill('04730581970')
  await page.locator('input[type="password"]').first().fill('admin123')
  await page.locator('button:has-text("Entrar")').click()
  await page.waitForTimeout(4000)
  console.log('Login URL:', page.url())

  // Nova autorizacao
  await page.goto(BASE + '/master/autorizacoes/nova', { waitUntil: 'networkidle', timeout: 20000 })
  await page.waitForTimeout(2000)
  await shot(page, 'A_step0_tipo.png')

  // Inspecionar elementos clicaveis do step 0
  const clickables = await page.locator('button, [role="radio"], [role="option"]').all()
  console.log('Elementos clicaveis no step 0:')
  for (const el of clickables) {
    const txt = await el.innerText().catch(() => '')
    if (txt.trim()) console.log('  el:', JSON.stringify(txt.trim().slice(0, 60)))
  }

  // Tentar selecionar Fonograma
  let tipoClicado = false
  for (const el of clickables) {
    const txt = (await el.innerText().catch(() => '')).toLowerCase().trim()
    if (txt.includes('fonograma') || txt.includes('gravacao') || txt.includes('gravação')) {
      await el.click(); tipoClicado = true
      console.log('Tipo clicado')
      break
    }
  }

  // Clicar Proximo
  await page.waitForTimeout(500)
  try {
    await page.locator('button').filter({ hasText: /Pr[oó]ximo/ }).last().click({ timeout: 2000 })
    await page.waitForTimeout(1200)
  } catch {}
  await shot(page, 'B_step1_obra.png')

  // Listar todos os inputs visiveis
  const allInputs = await page.locator('input:visible').all()
  console.log('\nInputs visiveis (' + allInputs.length + '):')
  for (const inp of allInputs) {
    const ph = await inp.getAttribute('placeholder').catch(() => '')
    console.log('  placeholder:', JSON.stringify(ph))
  }

  // Selecionar o input de busca de obras do WIZARD (nao o header global)
  // O global search tem "Buscar obras, autores, ISWC, gravações, contratos..."
  // O wizard tem algo mais simples
  let obraInput = null
  for (const inp of allInputs) {
    const ph = (await inp.getAttribute('placeholder').catch(() => '')) || ''
    if (!ph.includes('ISWC') && !ph.includes('gravações') && !ph.includes('contratos') &&
        !ph.includes('000.000') && !ph.includes('senha') &&
        (ph.toLowerCase().includes('buscar') || ph.toLowerCase().includes('obra') || ph.toLowerCase().includes('título') || ph === '')) {
      obraInput = inp
      console.log('\nUsando input de obra:', JSON.stringify(ph))
      break
    }
  }
  if (!obraInput && allInputs.length > 0) {
    // Pega o segundo input (o primeiro costuma ser o global search)
    obraInput = allInputs[allInputs.length > 1 ? 1 : 0]
    const ph = await obraInput.getAttribute('placeholder').catch(() => '')
    console.log('\nFallback input:', JSON.stringify(ph))
  }

  if (obraInput) {
    await obraInput.click()
    await obraInput.fill('3 tam')
    await page.waitForTimeout(2500)
    await shot(page, 'C_busca_obra.png')

    // Ver botoes visiveis
    const btns = await page.locator('button:visible').all()
    const nav = ['próximo','proximo','anterior','prosseguir','voltar','entrar','confirmar','fechar']
    for (const b of btns) {
      const txt = (await b.innerText().catch(() => '')).trim()
      if (txt) console.log('  btn:', JSON.stringify(txt.slice(0,120)))
    }
    // Clicar no botao de obra (tem "Editora:" ou "controlado" no texto)
    for (const b of btns) {
      const txt = (await b.innerText().catch(() => '')).trim()
      if (txt.includes('Editora:') || txt.includes('controlado')) {
        console.log('Clicando obra:', txt.slice(0,80))
        await b.click()
        await page.waitForTimeout(2000)
        await shot(page, 'D_obra_selecionada.png')
        break
      }
    }
  }

  await shot(page, 'E_final.png')
  await browser.close()
  console.log('\nPronto!')
})().catch(e => { console.error('ERRO:', e.message); process.exit(1) })
