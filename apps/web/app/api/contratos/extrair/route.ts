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

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT =
  'Você é um assistente especializado em contratos de cessão de direitos autorais musicais brasileiros. ' +
  'Leia o contrato e extraia as informações em JSON. ' +
  'Responda APENAS com o JSON, sem texto adicional, sem markdown, sem backticks.'

const USER_PROMPT = `Extraia do contrato as seguintes informações e retorne APENAS um JSON válido com esta estrutura exata:
{
  "autor_nome": "nome completo do autor",
  "autor_pseudonimo": "pseudônimo ou nome artístico",
  "autor_cpf": "CPF do autor",
  "data_contrato": "data no formato YYYY-MM-DD",
  "editora_nome": "nome da editora signatária",
  "percentuais_brasil": {
    "reproducao_grafica": {"autor": 0, "editora": 0},
    "fonecanico": {"autor": 0, "editora": 0},
    "audiovisual": {"autor": 0, "editora": 0},
    "publicidade": {"autor": 0, "editora": 0},
    "digital": {"autor": 0, "editora": 0},
    "base_dados": {"autor": 0, "editora": 0},
    "comunicacao_publico": {"autor": 0, "editora": 0},
    "autorizacoes": {"autor": 0, "editora": 0}
  },
  "percentuais_exterior": {
    "reproducao_grafica": {"autor": 0, "editora": 0},
    "fonecanico": {"autor": 0, "editora": 0},
    "audiovisual": {"autor": 0, "editora": 0},
    "publicidade": {"autor": 0, "editora": 0},
    "digital": {"autor": 0, "editora": 0},
    "base_dados": {"autor": 0, "editora": 0},
    "comunicacao_publico": {"autor": 0, "editora": 0}
  },
  "obras": [
    {
      "titulo": "título da obra",
      "subtitulo": "subtítulo se houver",
      "titulo_alternativo": "título alternativo se houver",
      "texto_poetico": "letra/texto poético completo",
      "percentual_autor_na_obra": 100,
      "coautores": [
        {"nome": "nome do coautor", "pseudonimo": "pseudônimo", "percentual": 0}
      ]
    }
  ]
}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Falha ao ler o formulário multipart' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Campo "file" ausente ou inválido' }, { status: 400 })
  }

  const mimeType = (file as File).type || 'application/pdf'
  if (!mimeType.includes('pdf')) {
    return NextResponse.json({ error: 'O arquivo deve ser um PDF' }, { status: 400 })
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
    resultado = JSON.parse(rawText)
  } catch {
    return NextResponse.json(
      { error: 'A IA não retornou um JSON válido', raw: rawText },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: resultado })
}
