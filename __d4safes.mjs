const tokenAPI = 'live_71dab8ea174e334d46b00e977cbe22eceee16fab89cb4d7941a1e98c24ce62c3'
const cryptKey  = 'live_crypt_ZRiMH8qywp9znWoXqHtvwkseb46ZDQQy'
const BASE      = 'https://secure.d4sign.com.br/api/v1'

const r = await fetch(`${BASE}/safes?tokenAPI=${tokenAPI}&cryptKey=${cryptKey}`)
const safes = await r.json()

console.log('TODOS OS COFRES:')
for (const s of safes) {
  const nm = s['name-safe'] || s.name || s.safeName || ''
  const id = s.uuid_safe || s.uuid || ''
  const mark = nm.toUpperCase().includes('CESS') || nm.toUpperCase().includes('CONTRAT') ? ' ★' : ''
  console.log(`  [${id}] ${nm}${mark}`)
}

// Seleciona o melhor cofre para contratos de cessão
const best = safes.find(s => {
  const nm = (s['name-safe'] || s.name || '').toUpperCase()
  return nm.includes('CONTRAT') && nm.includes('CESS')
}) || safes.find(s => {
  const nm = (s['name-safe'] || s.name || '').toUpperCase()
  return nm.includes('CESS')
}) || safes.find(s => {
  const nm = (s['name-safe'] || s.name || '').toUpperCase()
  return nm.includes('TOP SHOW') || nm.includes('CONTRAT')
}) || safes[0]

const bestUUID = best?.uuid_safe || best?.uuid || ''
const bestName = best?.['name-safe'] || best?.name || ''
console.log(`\n★ Cofre selecionado: [${bestUUID}] "${bestName}"`)
