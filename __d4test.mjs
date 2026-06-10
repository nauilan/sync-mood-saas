// Testa credenciais D4Sign e lista cofres disponíveis
const tokenAPI = 'live_71dab8ea174e334d46b00e977cbe22eceee16fab89cb4d7941a1e98c24ce62c3'
const cryptKey  = 'live_crypt_ZRiMH8qywp9znWoXqHtvwkseb46ZDQQy'
const BASE      = 'https://secure.d4sign.com.br/api/v1'

console.log('Testando credenciais D4Sign...\n')

// 1. Listar cofres
const r = await fetch(`${BASE}/safes?tokenAPI=${tokenAPI}&cryptKey=${cryptKey}`)
console.log('GET /safes — status:', r.status)
const data = await r.json()
if (!r.ok) {
  console.error('ERRO:', data?.message || JSON.stringify(data))
  process.exit(1)
}
const safes = Array.isArray(data) ? data : (data?.data || [])
console.log(`Cofres encontrados: ${safes.length}`)
for (const s of safes) {
  const current = s.uuid === 'fa6c664d-4f8a-4280-be47-818b3a7367b4' ? ' ← CONFIGURADO' : ''
  console.log(`  [${s.uuid}] ${s.name || s.safeName || s.uuidSafe}${current}`)
}

// 2. Verifica se o safe UUID configurado existe
const safeOk = safes.some(s => s.uuid === 'fa6c664d-4f8a-4280-be47-818b3a7367b4')
console.log('\nSafe UUID fa6c664d...:', safeOk ? '✓ EXISTE' : '✗ NÃO ENCONTRADO')
if (!safeOk && safes.length > 0) {
  console.log('Safe a usar:', safes[0].uuid, safes[0].name || safes[0].safeName)
}
