/**
 * POST /api/contratos/extrair
 *
 * Recebe um PDF em multipart/form-data (campo "file") e retorna os dados
 * extraídos via API da Anthropic (claude-sonnet-4-6).
 *
 * Body: FormData com campo "file" contendo o PDF
 * Response: { data: { autor_nome, autor_cpf, ... obras: [...] } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT =
  'Você é um assistente especializado em contratos de cessão de direitos autorais musicais brasileiros. ' +
  'Leia o contrato e extraia as informações em JSON. ' +
  'Responda APENAS com o JSON, sem texto adicional, sem markdown, sem backticks. ' +
  'ATENÇÃO AOS PERCENTUAIS: procure a cláusula que detalha os percentuais por tipo de direito (geralmente chamada Cláusula Sexta, Cláusula de Percentuais, ou similar). ' +
  'Ela lista os tipos a, b, c, d, e, f, g, h com percentuais SEPARADOS para autor e editora (ex: "Autor: 75% / Editora: 25%"). ' +
  'NUNCA retorne autor=100 e editora=0 se o contrato tiver uma cláusula de percentuais — isso significaria que a editora não recebe nada, o que não faz sentido num contrato de cessão. ' +
  'Se não encontrar valores explícitos para um tipo, mantenha autor=0 e editora=0 (NÃO invente 100/0). ' +
  'É CRÍTICO preservar a estrutura de versos da letra musical — cada quebra de linha deve ser mantida como \\n no campo texto_poetico.'

const USER_PROMPT = `Extraia do contrato as seguintes informações e retorne APENAS um JSON válido com esta estrutura exata:
{
  "autor_nome": "nome completo do autor",
  "autor_pseudonimo": "pseudônimo ou nome artístico",
  "autor_cpf": "CPF do autor",
  "data_contrato": "data no formato YYYY-MM-DD",
  "editora_nome": "nome da editora signatária",
  "percentuais_brasil": {
    "repr_grafica":          {"autor": 0, "editora": 0},
    "repr_fonomecanica":     {"autor": 0, "editora": 0},
    "inclusao_audiovisual":  {"autor": 0, "editora": 0},
    "inclusao_publicitaria": {"autor": 0, "editora": 0},
    "distribuicao_meios":    {"autor": 0, "editora": 0},
    "inclusao_base_dados":   {"autor": 0, "editora": 0},
    "comunicacao_publico":   {"autor": 0, "editora": 0},
    "autorizacoes_onus":     {"autor": 0, "editora": 0}
  },
  "percentuais_exterior": {
    "repr_grafica":          {"autor": 0, "editora": 0},
    "repr_fonomecanica":     {"autor": 0, "editora": 0},
    "inclusao_audiovisual":  {"autor": 0, "editora": 0},
    "inclusao_publicitaria": {"autor": 0, "editora": 0},
    "distribuicao_meios":    {"autor": 0, "editora": 0},
    "inclusao_base_dados":   {"autor": 0, "editora": 0},
    "comunicacao_publico":   {"autor": 0, "editora": 0},
    "autorizacoes_onus":     {"autor": 0, "editora": 0}
  },
  "obras": [
    {
      "titulo": "título da obra",
      "subtitulo": "subtítulo se houver",
      "titulo_alternativo": "título alternativo se houver",
      "texto_poetico": "letra completa da obra, preservando EXATAMENTE as quebras de linha originais do contrato usando \\n entre cada verso. NUNCA junte versos em um parágrafo corrido. Cada linha do PDF deve corresponder a uma linha separada por \\n no JSON, respeitando estrofes e repetições (como '2X') exatamente como aparecem no documento.",
      "percentual_autor_na_obra": 100,
      "coautores": [
        {"nome": "nome do coautor", "pseudonimo": "pseudônimo", "percentual": 0}
      ]
    }
  ]
}`

function sb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function autenticar(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const client = sb()

  if (token) {
    const { data: { user }, error } = await client.auth.getUser(token)
    if (!error && user) {
      const { data: usuario } = await client
        .from('usuarios')
        .select('id, tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()
      return usuario as { id: string; tenant_id: string; role: string } | null
    }
  }

  const serverClient = await createServerSupabaseClient()
  const { data: { user }, error } = await serverClient.auth.getUser()
  if (error || !user) return null

  const { data: usuario } = await client
    .from('usuarios')
    .select('id, tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  return usuario as { id: string; tenant_id: string; role: string } | null
}

async function obterPdf(req: NextRequest): Promise<{ file: Blob; nome: string } | { error: NextResponse }> {
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const usuario = await autenticar(req)
    if (!usuario) return { error: NextResponse.json({ error: 'Não autorizado na etapa extrair: sessão expirada ou token ausente' }, { status: 401 }) }

    const body = await req.json().catch(() => null)
    const storagePath = String(body?.storagePath ?? '')
    if (!storagePath || !storagePath.startsWith(`${usuario.tenant_id}/extrair/`)) {
      return { error: NextResponse.json({ error: 'storagePath inválido para este tenant' }, { status: 400 }) }
    }

    const { data, error } = await sb()
      .storage
      .from('contratos-manuais')
      .download(storagePath)

    if (error || !data) {
      return { error: NextResponse.json({ error: 'Falha ao baixar o PDF do Storage: ' + (error?.message ?? 'arquivo não encontrado') }, { status: 500 }) }
    }

    return { file: data, nome: storagePath.split('/').pop() ?? 'contrato.pdf' }
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return { error: NextResponse.json({ error: 'Falha ao ler o formulário multipart. Se o arquivo for grande, envie pelo fluxo de upload via Storage.' }, { status: 400 }) }
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return { error: NextResponse.json({ error: 'Campo "file" ausente ou inválido' }, { status: 400 }) }
  }

  return { file, nome: (file as File).name ?? 'contrato.pdf' }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
  }

  const pdfResult = await obterPdf(req)
  if ('error' in pdfResult) return pdfResult.error
  const { file } = pdfResult

  const mimeType = (file as File).type || 'application/pdf'
  if (!mimeType.includes('pdf')) {
    return NextResponse.json({ error: 'O arquivo deve ser um PDF' }, { status: 400 })
  }

  const maxBytes = 25 * 1024 * 1024
  if (file.size > maxBytes) {
    return NextResponse.json({ error: 'Arquivo excede o limite de 25 MB para extração por IA' }, { status: 413 })
  }

  let base64Data: string
  try {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    base64Data = btoa(binary)
  } catch {
    return NextResponse.json({ error: 'Falha ao converter o PDF para base64' }, { status: 500 })
  }

  let anthropicResponse: Response
  try {
    anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: USER_PROMPT,
              },
            ],
          },
        ],
      }),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: `Falha ao chamar a API da Anthropic: ${msg}` }, { status: 500 })
  }

  if (!anthropicResponse.ok) {
    let detail = ''
    try {
      const body = await anthropicResponse.json()
      detail = body?.error?.message ?? JSON.stringify(body)
    } catch { /* */ }
    return NextResponse.json(
      { error: `Anthropic retornou erro ${anthropicResponse.status}: ${detail}` },
      { status: 500 }
    )
  }

  let anthropicBody: { content?: Array<{ type: string; text?: string }> }
  try {
    anthropicBody = await anthropicResponse.json()
  } catch {
    return NextResponse.json({ error: 'Resposta inválida da API da Anthropic' }, { status: 500 })
  }

  const rawText = anthropicBody.content?.find(b => b.type === 'text')?.text ?? ''

  let resultado: unknown
  try {
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    resultado = JSON.parse(cleaned)
  } catch {
    return NextResponse.json(
      { error: 'A IA não retornou um JSON válido', raw: rawText },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: resultado })
}
