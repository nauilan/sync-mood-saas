import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function autenticar(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const client = sb()
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await client
    .from('usuarios')
    .select('id, tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  return usuario as { id: string; tenant_id: string; role: string } | null
}

function sanitizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
}

export async function POST(req: NextRequest) {
  const usuario = await autenticar(req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const fileName = String(body?.fileName ?? '')
  const contentType = String(body?.contentType ?? 'application/pdf')
  const size = Number(body?.size ?? 0)

  if (!fileName.toLowerCase().endsWith('.pdf') && !contentType.includes('pdf')) {
    return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos' }, { status: 400 })
  }

  const maxBytes = 25 * 1024 * 1024
  if (!Number.isFinite(size) || size <= 0 || size > maxBytes) {
    return NextResponse.json({ error: 'Arquivo excede o limite de 25 MB para extração por IA' }, { status: 413 })
  }

  const path = `${usuario.tenant_id}/extrair/${Date.now()}-${crypto.randomUUID()}-${sanitizarNome(fileName)}`
  const { data, error } = await sb()
    .storage
    .from('contratos-manuais')
    .createSignedUploadUrl(path)

  if (error || !data) {
    return NextResponse.json({
      error: 'Falha ao preparar upload do contrato: ' + (error?.message ?? 'erro desconhecido'),
    }, { status: 500 })
  }

  return NextResponse.json({
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    bucket: 'contratos-manuais',
  })
}