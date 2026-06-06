import { NextResponse } from 'next/server'

const TEMP_TOKEN = 'syncmood-reset-2026'

export async function POST(req: Request) {
  const body = await req.json()
  const { token, cpf, password } = body

  if (token !== TEMP_TOKEN) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const url  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
  const skey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  const email = cpf.replace(/\D/g, '') + '@syncmood.app'

  // 1. Busca usuarios para achar o id pelo email
  const listRes = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, {
    headers: {
      'apikey': skey,
      'Authorization': `Bearer ${skey}`,
    },
  })
  const listData = await listRes.json()
  const users: any[] = listData.users ?? []
  const user = users.find((u: any) => u.email === email)
  if (!user) {
    return NextResponse.json({ error: `Usuario nao encontrado: ${email}` }, { status: 404 })
  }

  // 2. Atualiza a senha
  const updRes = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'apikey': skey,
      'Authorization': `Bearer ${skey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  })
  const updData = await updRes.json()
  if (!updRes.ok) {
    return NextResponse.json({ error: updData }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email, message: 'Senha atualizada.' })
}
