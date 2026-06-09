import fetch from 'node:http'

const BASE = 'http://localhost:3000'

function req(path, opts = {}) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path)
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    }
    const r = fetch.request(options, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode, body }) }
      })
    })
    r.on('error', e => resolve({ status: 0, body: e.message }))
    if (opts.body) r.write(JSON.stringify(opts.body))
    r.end()
  })
}

async function run() {
  console.log('=== VALIDACAO LOGIN CPF ===\n')

  // 1. /api/me sem token
  const me0 = await req('/api/me')
  console.log('[1] /api/me sem token:', me0.status === 401 ? 'PASS (401)' : 'FAIL (' + me0.status + ')')

  // 2. CPF errado
  const r2 = await req('/api/auth/login', { method: 'POST', body: { cpf: '00000000000', password: 'errada' } })
  console.log('[2] CPF errado:', r2.status === 401 ? 'PASS (401)' : 'FAIL (' + r2.status + ')')

  // 3. Senha errada
  const r3 = await req('/api/auth/login', { method: 'POST', body: { cpf: '04730581970', password: 'senhaerrada' } })
  console.log('[3] Senha errada:', r3.status === 401 ? 'PASS (401)' : 'FAIL (' + r3.status + ')')

  // 4. Login correto
  const r4 = await req('/api/auth/login', { method: 'POST', body: { cpf: '04730581970', password: 'admin123' } })
  console.log('[4] Login CPF+admin123:', r4.status === 200 ? 'PASS (200)' : 'FAIL (' + r4.status + ')', '| role:', r4.body?.role, '| redirect:', r4.body?.redirectTo)

  // 5. /api/me com token
  if (r4.body?.access_token) {
    const me5 = await req('/api/me', { headers: { Authorization: 'Bearer ' + r4.body.access_token } })
    console.log('[5] /api/me autenticado:', me5.status === 200 ? 'PASS' : 'FAIL (' + me5.status + ')', '| role:', me5.body?.role)
  }

  // 6. CPF com máscara
  const r6 = await req('/api/auth/login', { method: 'POST', body: { cpf: '047.305.819-70', password: 'admin123' } })
  console.log('[6] CPF mascarado:', r6.status === 200 ? 'PASS (200)' : 'FAIL (' + r6.status + ')')

  console.log('\n=== FIM ===')
}

run().catch(console.error)
