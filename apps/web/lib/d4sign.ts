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
  | '1'   // Assinar (padrão — usado para todos os papéis)
  | '2'   // Aprovar
  | '3'   // Reconhecer
  | '4'   // Assinar como parte
  | '5'   // Assinar como testemunha
  | '6'   // Assinar como interveniente
  | '7'   // Acusar recebimento
  | '8'   // Assinar como Emissor, Endossante e Avalista

export interface D4SignSigner {
  email: string
  act: D4SignAct
  nome?: string          // exibido no D4Sign apenas se informado
  foreign?: '0' | '1'
  /** Exigir autenticação por vídeo selfie com reconhecimento facial */
  videoselfie?: '0' | '1'
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

/**
 * Todos os papéis usam act="1" (Assinar).
 * A diferença entre cedente e demais é feita pela autenticação extra
 * (cedente recebe videoselfie="1" no enviar-assinatura/route.ts).
 */
export function papelToAct(_papel: string): D4SignAct {
  return '1'
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
 * Adiciona signatários ao documento via POST /documents/{uuid}/createlist.
 * Endpoint correto da API D4Sign v1 — aceita array de signatários em uma única chamada.
 * Aguarda 3s antes de adicionar para garantir que o PDF foi processado pelo D4Sign.
 */
export async function addSigners(
  docUuid: string,
  signers: D4SignSigner[]
): Promise<void> {
  const { tokenAPI, cryptKey } = getCredentials()

  // D4Sign processa o PDF de forma assíncrona após o upload.
  // Aguardar 3s garante que o documento está pronto para receber signatários.
  await new Promise(r => setTimeout(r, 3000))

  // Endpoint correto: /documents/{uuid}/createlist (não /signers)
  const url = `${BASE_URL}/documents/${docUuid}/createlist?tokenAPI=${encodeURIComponent(tokenAPI)}&cryptKey=${encodeURIComponent(cryptKey)}`

  // createlist aceita array completo de signatários em uma única chamada
  const body = {
    signers: signers.map(s => ({
      email:                 s.email,
      act:                   s.act,
      foreign:               s.foreign ?? '0',
      certificadoicpbr:      '0',
      assinatura_presencial: '0',
      docauth:               '0',
      docauthandselfie:      '0',
      // videoselfie: "1" ativa autenticação por vídeo selfie com reconhecimento facial
      videoselfie:           s.videoselfie ?? '0',
      embed_methodauth:      'email',
      embed_smsnumber:       '',
      upload_allow:          '0',
      upload_obs:            '',
    }))
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  console.log(`[d4sign] createlist ${docUuid} → HTTP ${res.status} | ${text.substring(0, 500)}`)

  if (!res.ok) {
    throw new Error(
      `D4Sign createlist HTTP ${res.status}: ${text.substring(0, 300)}`
    )
  }

  // Verificar se cada signatário recebeu key_signer
  let json: Array<{ key_signer?: string; email?: string; message?: string }> | { message?: string } = []
  try { json = text ? JSON.parse(text) : [] } catch { /* ignore */ }

  if (Array.isArray(json)) {
    for (const item of json) {
      if (!item.key_signer) {
        console.warn(`[d4sign] createlist: signatário ${item.email ?? '?'} sem key_signer — ${JSON.stringify(item)}`)
      } else {
        console.log(`[d4sign] createlist: signatário ${item.email} key_signer=${item.key_signer}`)
      }
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
 * Endpoint correto: /documents/{uuid}/sendtosigner (não /send).
 * Após esse passo, o status muda para "Aguardando Assinaturas".
 */
export async function sendDocument(
  docUuid: string,
  message = 'Por favor, assine o contrato em anexo.',
  webhookUrl?: string
): Promise<void> {
  const { tokenAPI, cryptKey } = getCredentials()

  // Endpoint correto: /sendtosigner (não /send)
  const url = `${BASE_URL}/documents/${docUuid}/sendtosigner?tokenAPI=${encodeURIComponent(tokenAPI)}&cryptKey=${encodeURIComponent(cryptKey)}`

  const body: Record<string, string> = {
    message,
    workflow:   '0',
    skip_email: '0',
  }
  if (webhookUrl) body.webhook = webhookUrl

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  // D4Sign pode retornar body vazio no 200
  const text = await res.text()
  let json: { message?: string } = {}
  try { json = text ? JSON.parse(text) : {} } catch { /* ignore */ }

  console.log(`[d4sign] sendtosigner ${docUuid} → HTTP ${res.status} body=${text.substring(0, 200)}`)

  if (!res.ok) {
    throw new Error(
      `D4Sign sendtosigner falhou (${res.status}): ${json.message ?? text}`
    )
  }
}

// ── Consultar status ─────────────────────────────────────────────────────────

export async function getDocumentStatus(docUuid: string): Promise<D4SignDocument> {
  const { tokenAPI, cryptKey } = getCredentials()

  const res = await fetch(
    `${BASE_URL}/documents/${docUuid}?tokenAPI=${tokenAPI}&cryptKey=${cryptKey}`
  )

  // D4Sign às vezes retorna array, às vezes objeto — normalizar
  const raw = await res.json() as unknown
  const json = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>

  console.log(`[d4sign] getDocumentStatus uuid=${docUuid} HTTP=${res.status}`, JSON.stringify(json).slice(0, 400))

  if (!res.ok) {
    throw new Error(`D4Sign getStatus falhou (${res.status}): ${JSON.stringify(json)}`)
  }

  // Campo pode aparecer como "statusId", "status_id" ou "uuidDoc" aninhado
  const statusId = Number(json.statusId ?? json.status_id ?? (json.uuidDoc as Record<string, unknown>)?.statusId ?? -1)
  const statusName = (json.statusName ?? json.status_name ?? '') as string

  return {
    uuid:         (json.uuid ?? docUuid) as string,
    statusId,
    statusName,
    nameOriginal: json.nameOriginal as string,
    safeUUID:     (json.safeUUID ?? '') as string,
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
