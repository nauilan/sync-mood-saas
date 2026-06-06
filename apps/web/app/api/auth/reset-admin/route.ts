import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Endpoint temporário — remover após uso
// Só funciona com o token correto
const TEMP_TOKEN = 'syncmood-reset-2026'

export async function POST(req: Request) {
  const { token, cpf, password } = await req.json()

  if (token !== TEMP_TOKEN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const email = `${cpf.replace(/\D/g, '')}@syncmood.app`

  // Busca o usuário pelo email
  const { data: { users }, error: listErr } = await sb.auth.admin.listUsers()
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const user = users.find(u => u.email === email)
  if (!user) return NextResponse.json({ error: `Usuário não encontrado: ${email}` }, { status: 404 })

  // Atualiza a senha
  const { error: updateErr } = await sb.auth.admin.updateUserById(user.id, { password })
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, email, message: 'Senha atualizada com sucesso.' })
}
