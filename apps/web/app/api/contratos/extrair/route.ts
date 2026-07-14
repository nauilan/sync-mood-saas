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
import { createClient } from '@supabase/supabase-js'
import { autenticar } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT_BASE =
  'Você é um assistente especializado em contratos de cessão de direitos autorais musicais brasileiros. ' +
  'Leia o contrato e extraia as informações em JSON. ' +
  'Responda APENAS com o JSON, sem texto adicional, sem markdown, sem backticks. ' +
  'ATENÇÃO AOS PERCENTUAIS: procure a cláusula que detalha os percentuais por tipo de direito (geralmente chamada Cláusula Sexta, Cláusula de Percentuais, ou similar). ' +
  'Ela lista os tipos a, b, c, d, e, f, g, h com percentuais SEPARADOS para autor e editora (ex: "Autor: 75% / Editora: 25%"). ' +
  'NUNCA retorne autor=100 e editora=0 se o contrato tiver uma cláusula de percentuais — isso significaria que a editora não recebe nada, o que não faz sentido num contrato de cessão. ' +
  'Se não encontrar valores explícitos para um tipo, mantenha autor=0 e editora=0 (NÃO invente 100/0). '

const SYSTEM_PROMPT_COMPLETO =
  SYSTEM_PROMPT_BASE +
  'É CRÍTICO preservar a estrutura de versos da letra musical — cada quebra de linha deve ser mantida como \\n no campo texto_poetico.'

const SYSTEM_PROMPT_LEVE =
  SYSTEM_PROMPT_BASE +
  'Para PDFs grandes ou contratos com muitas obras, priorize títulos, coautores, percentuais, dados do contrato e direitos. NÃO extraia letras completas; retorne texto_poetico como string vazia.'

const SYSTEM_PROMPT_TEXTO_POETICO =
  'Você é um assistente especializado em localizar texto poético/letra musical dentro de contratos de cessão de direitos autorais musicais brasileiros. ' +
  'Extraia somente a letra da obra solicitada, preservando EXATAMENTE as quebras de linha originais. ' +
  'Responda APENAS com JSON válido, sem markdown, sem comentários e sem texto adicional.'

function montarUserPrompt(extracaoLeve: boolean) {
  const instrucaoTextoPoetico = extracaoLeve
    ? 'texto_poetico deve ser string vazia (""). NÃO copie letras completas nesta etapa.'
    : 'texto_poetico deve conter a letra completa da obra, preservando EXATAMENTE as quebras de linha originais do contrato usando \\n entre cada verso. NUNCA junte versos em um parágrafo corrido. Cada linha do PDF deve corresponder a uma linha separada por \\n no JSON, respeitando estrofes e repetições (como "2X") exatamente como aparecem no documento.'

  return `Extraia do contrato as seguintes informações e retorne APENAS um JSON válido com esta estrutura exata:
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
      "texto_poetico": "${instrucaoTextoPoetico}",
      "percentual_autor_na_obra": 100,
      "coautores": [
        {"nome": "nome do coautor", "pseudonimo": "pseudônimo", "percentual": 0}
      ]
    }
  ]
}`
}

function montarTextoPoeticoPrompt(titulo: string) {
  return `Localize no contrato a obra com o título "${titulo}" e extraia somente o texto poético/letra dessa obra.

Retorne APENAS este JSON:
{
  "texto_poetico": "letra completa preservando quebras de linha com \\n"
}

Regras:
- Preserve versos e estrofes exatamente como aparecem no PDF.
- Não junte versos em parágrafo corrido.
- Se houver repetições, marcações como "2X", refrão ou estrofes, preserve como no contrato.
- Se não encontrar a letra dessa obra, retorne {"texto_poetico": ""}.`
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function obterPdf(req: NextRequest): Promise<{ file: Blob; nome: string; textoPoeticoTitulo?: string } | { error: NextResponse }> {
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const client = sb()
    const usuario = await autenticar(req, client)
    if (!usuario) return { error: NextResponse.json({ error: 'Não autorizado na etapa extrair: sessão expirada ou token ausente' }, { status: 401 }) }

    const body = await req.json().catch(() => null)
    const storagePath = String(body?.storagePath ?? '')
    const textoPoeticoTitulo = String(body?.textoPoeticoTitulo ?? '').trim()
    if (!storagePath || !storagePath.startsWith(`${usuario.tenant_id}/extrair/`)) {
      return { error: NextResponse.json({ error: 'storagePath inválido para este tenant' }, { status: 400 }) }
    }

    const { data, error } = await client
      .storage
      .from('contratos-manuais')
      .download(storagePath)

    if (error || !data) {
      return { error: NextResponse.json({ error: 'Falha ao baixar o PDF do Storage: ' + (error?.message ?? 'arquivo não encontrado') }, { status: 500 }) }
    }

    return { file: data, nome: storagePath.split('/').pop() ?? 'contrato.pdf', textoPoeticoTitulo }
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
  const startedAt = Date.now()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
  }

  const pdfResult = await obterPdf(req)
  if ('error' in pdfResult) return pdfResult.error
  const { file, textoPoeticoTitulo } = pdfResult

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
    base64Data = Buffer.from(arrayBuffer).toString('base64')
  } catch {
    return NextResponse.json({ error: 'Falha ao converter o PDF para base64' }, { status: 500 })
  }

  const extracaoTextoPoetico = Boolean(textoPoeticoTitulo)
  const extracaoLeve = file.size >= 2 * 1024 * 1024 && !extracaoTextoPoetico
  console.info('[contratos.extrair][inicio]', {
    fileSizeBytes: file.size,
    fileSizeMb: Number((file.size / 1024 / 1024).toFixed(2)),
    extracaoLeve,
    extracaoTextoPoetico,
    maxDuration,
  })

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
        max_tokens: extracaoTextoPoetico ? 8192 : 4096,
        system: extracaoTextoPoetico
          ? SYSTEM_PROMPT_TEXTO_POETICO
          : (extracaoLeve ? SYSTEM_PROMPT_LEVE : SYSTEM_PROMPT_COMPLETO),
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
                text: extracaoTextoPoetico
                  ? montarTextoPoeticoPrompt(textoPoeticoTitulo ?? '')
                  : montarUserPrompt(extracaoLeve),
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(285_000),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: `Falha ao chamar a API da Anthropic após ${Date.now() - startedAt}ms: ${msg}` }, { status: 500 })
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

  console.info('[contratos.extrair][fim]', {
    fileSizeBytes: file.size,
    extracaoLeve,
    extracaoTextoPoetico,
    elapsedMs: Date.now() - startedAt,
  })

  return NextResponse.json({ data: resultado })
}
