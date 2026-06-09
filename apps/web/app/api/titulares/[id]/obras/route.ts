/**
 * GET /api/titulares/[id]/obras
 *
 * Retorna as obras em que um titular participa,
 * via obras_links_titulares → obras_links → obras.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const { id: titular_id } = await params

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: usuario } = await sb
    .from('usuarios')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })

  // Busca links_titulares → links → obras via joins embutidos
  const { data, error } = await sb
    .from('obras_links_titulares')
    .select(`
      id,
      papel,
      funcao_no_link,
      percentual_exec_publica,
      percentual_fonomecanico,
      percentual_sincronizacao,
      ipi,
      cae,
      controlado,
      status_controle,
      editora_id,
      obras_links (
        id,
        numero_link,
        percentual_link,
        tipo_link,
        obras (
          id,
          titulo,
          codigo_obra,
          iswc,
          status
        )
      )
    `)
    .eq('titular_id', titular_id)
    .eq('tenant_id', usuario.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normaliza para formato plano
  const obras = (data ?? [])
    .filter((olt: any) => olt.obras_links?.obras)
    .map((olt: any) => {
      const link = olt.obras_links
      const obra = link?.obras
      return {
        link_titular_id:          olt.id,
        papel:                    olt.papel,
        funcao_no_link:           olt.funcao_no_link,
        percentual_exec_publica:  olt.percentual_exec_publica ?? 0,
        percentual_fonomecanico:  olt.percentual_fonomecanico ?? 0,
        percentual_sincronizacao: olt.percentual_sincronizacao ?? 0,
        ipi:                      olt.ipi,
        cae:                      olt.cae,
        controlado:               olt.controlado,
        status_controle:          olt.status_controle,
        editora_id:               olt.editora_id,
        numero_link:              link?.numero_link,
        percentual_link:          link?.percentual_link,
        tipo_link:                link?.tipo_link,
        obra_id:                  obra?.id,
        obra_titulo:              obra?.titulo,
        obra_codigo:              obra?.codigo_obra,
        obra_iswc:                obra?.iswc,
        obra_status:              obra?.status,
      }
    })

  return NextResponse.json({ data: obras, total: obras.length })
}
