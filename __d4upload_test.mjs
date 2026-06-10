import { readFileSync } from 'fs'

const tokenAPI = 'live_71dab8ea174e334d46b00e977cbe22eceee16fab89cb4d7941a1e98c24ce62c3'
const cryptKey  = 'live_crypt_ZRiMH8qywp9znWoXqHtvwkseb46ZDQQy'
const safeUUID  = 'fa6c664d-4f8a-4280-be47-818b3a7367b4'
const BASE      = 'https://secure.d4sign.com.br/api/v1'

// PDF mínimo válido (1 página em branco)
const MINIMAL_PDF = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF'
const pdfBytes = Buffer.from(MINIMAL_PDF)

// Teste 1: form body com tokenAPI/cryptKey
console.log('Teste 1: form body (form.append tokenAPI/cryptKey)...')
const form1 = new FormData()
form1.append('tokenAPI', tokenAPI)
form1.append('cryptKey', cryptKey)
form1.append('file', new Blob([pdfBytes.buffer], { type: 'application/pdf' }), 'teste.pdf')
const r1 = await fetch(`${BASE}/documents/${safeUUID}/upload`, { method: 'POST', body: form1 })
console.log('  Status:', r1.status)
const t1 = await r1.text()
console.log('  Body:', t1.slice(0, 200))

// Teste 2: query params + form body
console.log('\nTeste 2: query params (tokenAPI/cryptKey na URL) + file no form...')
const form2 = new FormData()
form2.append('file', new Blob([pdfBytes.buffer], { type: 'application/pdf' }), 'teste.pdf')
const r2 = await fetch(
  `${BASE}/documents/${safeUUID}/upload?tokenAPI=${tokenAPI}&cryptKey=${cryptKey}`,
  { method: 'POST', body: form2 }
)
console.log('  Status:', r2.status)
const t2 = await r2.text()
console.log('  Body:', t2.slice(0, 200))
