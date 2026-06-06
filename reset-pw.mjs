const res = await fetch('https://sync-mood-saas.vercel.app/api/auth/reset-admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'syncmood-reset-2026', cpf: '04730581970', password: 'admin123' })
})
const data = await res.json()
console.log(data)
