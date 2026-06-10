// Testa credenciais D4Sign diretamente
// Execute com: D4SIGN_TOKEN_API=xxx D4SIGN_CRYPT_KEY=yyy D4SIGN_SAFE_UUID=zzz node test_d4sign_creds.mjs
const tokenAPI  = process.env.D4SIGN_TOKEN_API?.trim()
const cryptKey  = process.env.D4SIGN_CRYPT_KEY?.trim()
const safeUUID  = process.env.D4SIGN_SAFE_UUID?.trim()
const BASE_URL  = 'https://secure.d4sign.com.br/api/v1'

if (!tokenAPI || !cryptKey || !safeUUID) {
  console.error('Falta: D4SIGN_TOKEN_API, D4SIGN_CRYPT_KEY ou D4SIGN_SAFE_UUID')
  console.log('Use: set D4SIGN_TOKEN_API=... && set D4SIGN_CRYPT_KEY=... && set D4SIGN_SAFE_UUID=... && node test_d4sign_creds.mjs')
  process.exit(1)
}

console.log('Token:', tokenAPI.slice(0, 15) + '...')
console.log('Crypt:', cryptKey.slice(0, 15) + '...')
console.log('Safe:',  safeUUID)
console.log()

// Testa 1: Listar documentos (GET básico com credenciais na query)
console.log('Teste 1: GET /documents?tokenAPI=&cryptKey= ...')
const r1 = await fetch(`${BASE_URL}/documents?tokenAPI=${tokenAPI}&cryptKey=${cryptKey}`)
console.log('  Status:', r1.status)
const t1 = await r1.text()
console.log('  Body:', t1.slice(0, 200))

// Testa 2: Listar cofres
console.log('\nTeste 2: GET /safes?tokenAPI=&cryptKey= ...')
const r2 = await fetch(`${BASE_URL}/safes?tokenAPI=${tokenAPI}&cryptKey=${cryptKey}`)
console.log('  Status:', r2.status)
const t2 = await r2.text()
console.log('  Body:', t2.slice(0, 300))
