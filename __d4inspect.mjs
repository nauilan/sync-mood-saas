const tokenAPI = 'live_71dab8ea174e334d46b00e977cbe22eceee16fab89cb4d7941a1e98c24ce62c3'
const cryptKey  = 'live_crypt_ZRiMH8qywp9znWoXqHtvwkseb46ZDQQy'
const BASE      = 'https://secure.d4sign.com.br/api/v1'

const r = await fetch(`${BASE}/safes?tokenAPI=${tokenAPI}&cryptKey=${cryptKey}`)
const raw = await r.text()
// Mostra a estrutura real
console.log('Estrutura bruta dos cofres (primeiros 1000 chars):')
console.log(raw.slice(0, 1000))
// Mostra as chaves do primeiro objeto
const data = JSON.parse(raw)
const first = Array.isArray(data) ? data[0] : (data?.data?.[0] || data)
if (first && typeof first === 'object') {
  console.log('\nChaves disponíveis:', Object.keys(first))
  console.log('Primeiro cofre:', JSON.stringify(first, null, 2))
}
