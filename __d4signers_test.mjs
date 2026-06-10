const tokenAPI = 'live_71dab8ea174e334d46b00e977cbe22eceee16fab89cb4d7941a1e98c24ce62c3'
const cryptKey  = 'live_crypt_ZRiMH8qywp9znWoXqHtvwkseb46ZDQQy'
const BASE      = 'https://secure.d4sign.com.br/api/v1'
const docUUID   = '43808ebc-2316-4f4a-bf6f-17fb7cd73a20' // criado no teste anterior

const TEST_EMAIL = 'contato@topshowmusic.com.br'

// Teste addSigners: JSON body com tokenAPI/cryptKey
console.log('Teste addSigners — JSON body...')
const r1 = await fetch(`${BASE}/documents/${docUUID}/signers`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenAPI, cryptKey,
    signers: [{ email: TEST_EMAIL, act: '1', foreign: '0', certificadoicpbr: '0', assinatura_presencial: '0', login: '0', upload_allow: '0' }]
  })
})
console.log('  Status:', r1.status)
const t1 = await r1.text()
console.log('  Body:', t1.slice(0, 200))

// Se falhou, testa com query params
if (!r1.ok) {
  console.log('\nTeste addSigners — query params + JSON body...')
  const r2 = await fetch(`${BASE}/documents/${docUUID}/signers?tokenAPI=${tokenAPI}&cryptKey=${cryptKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signers: [{ email: TEST_EMAIL, act: '1', foreign: '0', certificadoicpbr: '0', assinatura_presencial: '0', login: '0', upload_allow: '0' }]
    })
  })
  console.log('  Status:', r2.status)
  console.log('  Body:', (await r2.text()).slice(0, 200))
}
