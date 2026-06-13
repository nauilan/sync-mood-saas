import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sanitize = (v: string | undefined) =>
  (v ?? '').replace(/[\uFEFF\u200B\u200C\u200D]/g, '').trim()

function sb() {
  return createClient(
    sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL),
    sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false } }
  )
}

async function getUser(req: NextRequest) {
  const raw = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  const token = raw.replace(/[\uFEFF\u200B\u200C\u200D]/g, '').trim()
  if (!token) return null
  const client = sb()
  const { data: { user } } = await client.auth.getUser(token)
  if (!user) return null
  const { data } = await client.from('usuarios').select('id,tenant_id,role').eq('auth_user_id', user.id).single()
  return data ? { userId: data.id as string, tenantId: data.tenant_id as string, role: data.role as string } : null
}

// ── POST /api/cwr/[id]/confirmar ──────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUser(req)
  if (!usuario) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = sb()

  const { data: imp } = await client
    .from('cwr_importacoes')
    .select('id,status,tenant_id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenantId)
    .single()

  if (!imp) return NextResponse.json({ error: 'Importação não encontrada' }, { status: 404 })
  if (imp.status === 'confirmado') return NextResponse.json({ error: 'Importação já confirmada. Para re-confirmar, reset o status para pendente.' }, { status: 400 })

  const { data: obrasImp } = await client
    .from('cwr_importacoes_obras')
    .select('*')
    .eq('importacao_id', id)

  const rows = obrasImp ?? []

  // Contadores do relatório
  let obras_novas = 0, obras_vinculadas = 0, obras_ignoradas = 0
  let obras_divergentes = 0, conflitos_editoriais = 0
  let fonogramas_criados = 0, negocios_criados = 0
  let participantes_controlados = 0, participantes_nao_controlados = 0, participantes_adm_ext = 0

  for (const row of rows) {
    const snap = row.snapshot_cwr as Record<string, unknown>
    const tipo = row.match_tipo as string

    if (tipo === 'conflito') {
      conflitos_editoriais++
      // Registrar conflito
      await client.from('cwr_conflitos').insert({
        importacao_id: id,
        obra_id:       row.obra_id,
        tipo:          'divergencia_geral',
        descricao:     'Obra em catalogo_ativo com dados divergentes no CWR',
        dados_cwr:     snap,
        dados_sistema: { obra_id: row.obra_id },
      })
      continue
    }

    if (tipo === 'nova') {
      // Criar obra como pre_cadastro
      const tituloCwr = (snap.titulo as string) ?? 'Sem título'
      // codigo_obra é NOT NULL — usar submitter_work_no ou gerar fallback único
      const swn = ((snap.submitter_work_no as string) ?? '').trim()
      const codigoObra = swn || `CWR-${id.slice(0, 8)}-${obras_novas + 1}`

      const { data: novaObra, error: errObra } = await client
        .from('obras')
        .insert({
          tenant_id:        usuario.tenantId,
          titulo:           tituloCwr,
          iswc:             (snap.iswc as string | null) ?? null,
          status_catalogo:  'pre_cadastro',
          origem_cadastro:  'importacao_cwr',
          codigo_obra:      codigoObra,
        })
        .select('id')
        .single()

      if (errObra) {
        // Log erro mas não interrompe o loop — registra na importação depois
        console.error(`[CWR confirmar] Erro ao criar obra "${tituloCwr}":`, errObra.message)
      }

      if (novaObra) {
        await client
          .from('cwr_importacoes_obras')
          .update({ obra_id: novaObra.id })
          .eq('id', row.id)

        obras_novas++
        negocios_criados++

        // Fonogramas
        const fono = (snap.fonogramas as unknown[]) ?? []
        if (fono.length > 0) {
          const fonoRows = fono.map((f: unknown) => {
            const fg = f as Record<string, unknown>
            return {
              obra_id:    novaObra.id,
              tenant_id:  usuario.tenantId,
              isrc:       fg.isrc ?? null,
              titulo:     fg.titulo ?? tituloCwr,
              interprete: fg.interprete ?? null,
              versao:     fg.versao ?? null,
              ano:        fg.ano ?? null,
            }
          })
          await client.from('fonogramas').insert(fonoRows)
          fonogramas_criados += fono.length
        }
      }
    } else if (tipo === 'vinculada') {
      obras_vinculadas++
    } else {
      obras_divergentes++
    }

    // Contadores de controle editorial
    const status = row.status_editorial as string
    if (status === 'controlado') participantes_controlados++
    else if (status === 'administrado_externo') participantes_adm_ext++
    else participantes_nao_controlados++
  }

  // Titulares novos / vinculados (simplificado por ora)
  const titulares_novos = 0
  const titulares_vinculados = 0
  const editoras_novas = 0
  const editoras_vinculadas = 0
  const fonogramas_vinculados = 0

  const relatorio = {
    obras_lidas:                  rows.length,
    obras_novas,
    obras_vinculadas,
    obras_ignoradas,
    obras_divergentes,
    titulares_novos,
    titulares_vinculados,
    editoras_novas,
    editoras_vinculadas,
    negocios_editoriais_criados:  negocios_criados,
    fonogramas_criados,
    fonogramas_vinculados,
    participantes_controlados,
    participantes_nao_controlados,
    participantes_administrado_externo: participantes_adm_ext,
    conflitos_editoriais,
  }

  await client
    .from('cwr_importacoes')
    .update({ status: 'confirmado', relatorio, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true, relatorio })
}
