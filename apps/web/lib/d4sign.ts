/**
 * lib/d4sign.ts
 * Cliente HTTP para a API D4Sign — upload, signatários, envio e webhook.
 *
 * Credenciais obrigatórias (variáveis de ambiente):
 *   D4SIGN_TOKEN_API   — token de autenticação do D4Sign
 *   D4SIGN_CRYPT_KEY   — chave criptográfica do D4Sign
 *   D4SIGN_SAFE_UUID   — UUID do cofre (pasta) onde os documentos são armazenados
 *   D4SIGN_BASE_URL    — (opcional) padrão: https://secure.d4sign.com.br/api/v1
 */

const BASE_URL =
  (process.env.D4SIGN_BASE_URL ?? 'https://secure.d4sign.com.br/api/v1').replace(/\/$/, '')

function getCredentials() {
  const tokenAPI  = process.env.D4SIGN_TOKEN_API?.trim()
  const cryptKey  = process.env.D4SIGN_CRYPT_KEY?.trim()
  const safeUUID  = process.env.D4SIGN_SAFE_UUID?.trim()
  if (!tokenAPI || !cryptKey || !safeUUID) {
    throw new Error(
      'Credenciais D4Sign não configuradas. Defina D4SIGN_TOKEN_API, D4SIGN_CRYPT_KEY e D4SIGN_SAFE_UUID.'
    )
  }
  return { tokenAPI, cryptKey, safeUUID }
}

// ── Tipos ────────────────────────────────────────────────────────────────────

export type D4SignAct =
  | '1'   // Assinar
  | '5'   // Assinar como Testemunha
  | '8'   // Assinar como Outorgante (cedente)
  | '9'   // Assinar como Outorgado  (cessionário / responsável)

export interface D4SignSigner {
  email: string
  act: D4SignAct
  nome?: string     // exibido no D4Sign apenas se informado
  foreign?: '0' | '1'
}

export interface D4SignDocument {
  uuid: string
  /** 1=Processando 2=Ag.Signatários 3=Ag.Assinaturas 4=Finalizado 5=Arquivado 6=Cancelado 7=Deletado */
  statusId: number
  statusName: string
  nameOriginal: string
  safeUUID: string
}

// ── Mapeamento de papéis → act D4Sign ────────────────────────────────────────

export function papelToAct(papel: string): D4SignAct {
  switch (papel) {
    case 'cedente':             return '8'  // Outorgante
    case 'responsavel_editora': return '9'  // Outorgado
    case 'testemunha_1':        return '5'  // Testemunha
    case 'testemunha_2':        return '5'  // Testemunha
    default:                    return '1'  // Assinar
  }
}

// ── Upload do documento ──────────────────────────────────────────────────────

/**
 * Faz upload de um PDF para o cofre do D4Sign.
 * Retorna o UUID do documento criado.
 */
export async function uploadDocument(
  pdfBuffer: Buffer,
  filename: string
): Promise<string> {
  const { tokenAPI, cryptKey, safeUUID } = getCredentials()

  // D4Sign exige tokenAPI e cryptKey na query string para o endpoint de upload
  const form = new FormData()
  form.append(
    'file',
    new Blob([pdfBuffer.buffer as ArrayBuffer], { type: 'application/pdf' }),
    filename
  )

  const url = `${BASE_URL}/documents/${safeUUID}/upload?tokenAPI=${encodeURIComponent(tokenAPI)}&cryptKey=${encodeURIComponent(cryptKey)}`
  const res = await fetch(url, {
    method: 'POST',
    body: form,
  })

  const json = await res.json() as { uuid?: string; message?: string }

  if (!res.ok || !json.uuid) {
    throw new Error(
      `D4Sign upload falhou (${res.status}): ${json.message ?? JSON.stringify(json)}`
    )
  }

  return json.uuid
}

// ── Adicionar signatários ────────────────────────────────────────────────────

/**
 * Adiciona signatários ao documento.
 * D4Sign exige UMA chamada POST separada por signatário (não aceita batch/array).
 * Inclui delay fixo após upload para aguardar processamento do PDF.
 */
export async function addSigners(
  docUuid: string,
  signers: D4SignSigner[]
): Promise<void> {
  const { tokenAPI, cryptKey } = getCredentials()

  // D4Sign processa o PDF de forma assíncrona após o upload.
  // Aguardar 3s é suficiente para a maioria dos documentos ficarem prontos.
  await new Promise(r => setTimeout(r, 3000))

  // D4Sign exige credenciais na query string
  const url = `${BASE_URL}/documents/${docUuid}/signers?tokenAPI=${encodeURIComponent(tokenAPI)}&cryptKey=${encodeURIComponent(cryptKey)}`

  // Uma requisição por signatário — comportamento correto da API D4Sign
  for (const signer of signers) {
    const body: Record<string, string> = {
      email:                 signer.email,
      act:                   signer.act,
      foreign:               signer.foreign ?? '0',
      certificadoicpbr:      '0',
      assinatura_presencial: '0',
      login:                 '0',
      upload_allow:          '0',
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let json: { message?: string; uuid_signer?: string } = {}
    try { json = text ? JSON.parse(text) : {} } catch { /* ignore */ }

    console.log(`[d4sign] addSigner ${signer.email} act=${signer.act} → HTTP ${res.status} | ${text.substring(0, 300)}`)

    if (!res.ok) {
      throw new Error(
        `D4Sign addSigner HTTP ${res.status} para ${signer.email}: ${json.message ?? text.substring(0, 200)}`
      )
    }

    // D4Sign retorna uuid_signer na resposta de sucesso.
    // Se não vier, pode ser erro silencioso — registrar mas não bloquear.
    if (!json.uuid_signer) {
      console.warn(`[d4sign] addSigner ${signer.email}: sem uuid_signer na resposta — ${text.substring(0, 200)}`)
    }
  }
}

/**
 * Retorna a lista de signatários do documento.
 * Usado para verificar se os signatários foram inseridos antes de enviar.
 */
export async function getDocumentSigners(docUuid: string): Promise<unknown[]> {
  const { tokenAPI, cryptKey } = getCredentials()
  const res = await fetch(
    `${BASE_URL}/documents/${docUuid}/signers?tokenAPI=${encodeURIComponent(tokenAPI)}&cryptKey=${encodeURIComponent(cryptKey)}`
  )
  if (!res.ok) return []
  const json = await res.json() as { signatarios?: unknown[] } | unknown[]
  if (Array.isArray(json)) return json
  if (json && typeof json === 'object' && 'signatarios' in json) {
    return (json as { signatarios?: unknown[] }).signatarios ?? []
  }
  return []
}

// ── Enviar para assinatura ────────────────────────────────────────────────────

/**
 * Envia o documento para os signatários assinarem.
 * Após esse passo, o status muda para "Aguardando Assinaturas".
 */
export async function sendDocument(
  docUuid: string,
  message = 'Por favor, assine o contrato em anexo.'
): Promise<void> {
  const { tokenAPI, cryptKey } = getCredentials()

  // D4Sign exige credenciais na query string
  const url = `${BASE_URL}/documents/${docUuid}/send?tokenAPI=${encodeURIComponent(tokenAPI)}&cryptKey=${encodeURIComponent(cryptKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      workflow: '0',
      skip_email: '0',
    }),
  })

  // D4Sign pode retornar body vazio no 200
  const text = await res.text()
  let json: { message?: string } = {}
  try { json = text ? JSON.parse(text) : {} } catch { /* ignore */ }

  console.log(`[d4sign] sendDocument ${docUuid} → HTTP ${res.status} body=${text.substring(0, 200)}`)

  if (!res.ok) {
    throw new Error(
      `D4Sign send falhou (${res.status}): ${json.message ?? text}`
    )
  }
}

// ── Consultar status ─────────────────────────────────────────────────────────

export async function getDocumentStatus(docUuid: string): Promise<D4SignDocument> {
  const { tokenAPI, cryptKey } = getCredentials()

  const res = await fetch(
    `${BASE_URL}/documents/${docUuid}?tokenAPI=${tokenAPI}&cryptKey=${cryptKey}`
  )
  const json = await res.json() as Record<string, unknown>

  if (!res.ok) {
    throw new Error(`D4Sign getStatus falhou (${res.status}): ${JSON.stringify(json)}`)
  }

  return {
    uuid:         json.uuid as string,
    statusId:     Number(json.statusId),
    statusName:   json.statusName as string,
    nameOriginal: json.nameOriginal as string,
    safeUUID:     json.safeUUID as string,
  }
}

// ── Cancelar documento ────────────────────────────────────────────────────────

export async function cancelDocument(docUuid: string): Promise<void> {
  const { tokenAPI, cryptKey } = getCredentials()

  // D4Sign exige credenciais na query string
  const url = `${BASE_URL}/documents/${docUuid}/cancel?tokenAPI=${encodeURIComponent(tokenAPI)}&cryptKey=${encodeURIComponent(cryptKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(
      `D4Sign cancel falhou (${res.status}): ${json.message ?? ''}`
    )
  }
}

// ── Mapear statusId D4Sign → status interno do contrato ─────────────────────

export function d4signStatusToContrato(statusId: number): string {
  switch (statusId) {
    case 1: return 'processando'
    case 2: return 'aguardando_signatarios'
    case 3: return 'aguardando_assinaturas'
    case 4: return 'finalizado'      // → em_vigor no contrato
    case 5: return 'arquivado'
    case 6: return 'cancelado'
    case 7: return 'deletado'
    default: return 'desconhecido'
  }
}
