const res = await fetch('https://sync-mood-saas.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cpf: '04730581970', password: 'admin123' })
})
const data = await res.json()
console.log('status:', res.status)
console.log('data:', JSON.stringify(data, null, 2))
