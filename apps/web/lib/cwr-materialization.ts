type SnapshotAutor = {
  nome?: string
  ipi?: string | null
  ipi_nome?: string | null
  papel?: string
  pr_pct?: number
  mr_pct?: number
  sr_pct?: number
  controlled?: boolean
}

type SnapshotEditora = {
  nome?: string
  ipi?: string | null
  ip_name_no?: string | null
  tipo?: string
  papel?: string
  pr_pct?: number
  mr_pct?: number
  sr_pct?: number
  controlled?: boolean
}

type SnapshotPwr = {
  writer_ip?: string | null
  publisher_ip?: string | null
  publisher_nome?: string | null
}

type SnapshotCwr = {
  autores?: SnapshotAutor[]
  editoras?: SnapshotEditora[]
  pwr_links?: SnapshotPwr[]
}

export type SnapshotPreviewParticipant = {
  nome: string
  ipi: string | null
  ip_name_number: string | null
  papel: string
  pr_pct: number
  mr_pct: number
  sr_pct: number
  controlled: boolean
  link_number: number
  kind: 'autor' | 'editora'
}

export type SnapshotPreviewLink = {
  numero_link: number
  percentual_link: number
  controlado: boolean
  tipo_link: 'controlado' | 'direto_sem_editora'
  participantes: SnapshotPreviewParticipant[]
}

function normNome(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function chaveTitular(ipi: string | null | undefined, nome: string): string {
  const cleanedIpi = (ipi ?? '').replace(/\s/g, '').trim()
  return cleanedIpi.length > 0 ? `IPI:${cleanedIpi}` : `NOME:${normNome(nome)}`
}

function mapPapelAutor(papel: string): string {
  const value = (papel ?? '').toUpperCase().trim()
  if (['CA', 'V', 'SA', 'E', 'AM', 'SE', 'C', 'CE', 'A', 'I', 'M', 'T', 'AD', 'H'].includes(value)) return value
  if (value === 'AR' || value === 'AE') return 'AD'
  if (value === 'ES') return 'CA'
  if (value === 'PA') return 'A'
  if (value === 'TR') return 'T'
  return 'CA'
}

function mapPapelEditora(tipo: string, papel: string): string {
  const value = (tipo ?? papel ?? '').toUpperCase().trim()
  if (['CA', 'V', 'SA', 'E', 'AM', 'SE', 'C', 'CE', 'A', 'I', 'M', 'T', 'AD', 'H'].includes(value)) return value
  if (value === 'AQ') return 'AM'
  if (value === 'ES') return 'SE'
  return 'E'
}

export function hasCompleteEditorialChain(snapshot: SnapshotCwr): boolean {
  const autores = Array.isArray(snapshot?.autores) ? snapshot.autores : []
  const editoras = Array.isArray(snapshot?.editoras) ? snapshot.editoras : []
  const pwrLinks = Array.isArray(snapshot?.pwr_links) ? snapshot.pwr_links : []
  const hasControlledAuthor = autores.some((autor) => Boolean(autor?.controlled) && Number(autor?.pr_pct ?? 0) > 0)
  const hasEditorialShares = editoras.some((editora) => Number(editora?.pr_pct ?? 0) > 0)
  return hasControlledAuthor && hasEditorialShares && pwrLinks.length > 0
}

export function previewLinksFromSnapshot(snapshot: SnapshotCwr): SnapshotPreviewLink[] {
  const autores = Array.isArray(snapshot?.autores) ? snapshot.autores : []
  const editoras = Array.isArray(snapshot?.editoras) ? snapshot.editoras : []
  const pwrLinks = Array.isArray(snapshot?.pwr_links) ? snapshot.pwr_links : []

  const pubIpToLinkNums = new Map<string, number[]>()
  const wrtIpToLinkNum = new Map<string, number>()
  let nextLinkNum = 1

  for (const pwr of pwrLinks) {
    const pubIp = String(pwr.publisher_ip ?? '').replace(/\s/g, '').trim()
    const wrtIp = String(pwr.writer_ip ?? '').replace(/\s/g, '').trim()
    if (!pubIp) continue
    const links = pubIpToLinkNums.get(pubIp) ?? []
    const linkNum = nextLinkNum++
    links.push(linkNum)
    pubIpToLinkNums.set(pubIp, links)
    if (wrtIp && !wrtIpToLinkNum.has(wrtIp)) wrtIpToLinkNum.set(wrtIp, linkNum)
  }

  const controlledAutores = autores.filter((autor) => Boolean(autor?.controlled))
  const pwrsWithPublisher = pwrLinks.filter((pwr) => String(pwr.publisher_ip ?? '').trim().length > 0)
  const wrtChaveToLinkNum = new Map<string, number>()
  const pubIpSeenForWriters = new Map<string, number>()

  for (let index = 0; index < Math.min(controlledAutores.length, pwrsWithPublisher.length); index++) {
    const autor = controlledAutores[index]
    const pwr = pwrsWithPublisher[index]
    const chave = chaveTitular(autor.ipi, String(autor.nome ?? ''))
    const pubIp = String(pwr.publisher_ip ?? '').replace(/\s/g, '').trim()
    const seen = pubIpSeenForWriters.get(pubIp) ?? 0
    pubIpSeenForWriters.set(pubIp, seen + 1)
    const links = pubIpToLinkNums.get(pubIp) ?? []
    const linkNum = links[seen] ?? index + 1
    if (!wrtChaveToLinkNum.has(chave)) wrtChaveToLinkNum.set(chave, linkNum)
  }

  const hasControlledAuthors = autores.some((autor) => Boolean(autor?.controlled))
  let owrNextLink = hasControlledAuthors ? Math.max(nextLinkNum, 2) : nextLinkNum

  const participantes: SnapshotPreviewParticipant[] = []

  for (const autor of autores) {
    const nome = String(autor.nome ?? '').trim()
    if (!nome) continue
    const chave = chaveTitular(autor.ipi, nome)
    const isControlled = Boolean(autor.controlled)
    const authorIpKey = String(autor.ipi_nome ?? autor.ipi ?? '').replace(/\s/g, '').trim()
    const linkNumber = isControlled
      ? (wrtIpToLinkNum.get(authorIpKey) ?? wrtChaveToLinkNum.get(chave) ?? 1)
      : owrNextLink++

    participantes.push({
      nome,
      ipi: autor.ipi ?? null,
      ip_name_number: autor.ipi_nome ?? null,
      papel: mapPapelAutor(String(autor.papel ?? '')),
      pr_pct: Number(autor.pr_pct ?? 0),
      mr_pct: Number(autor.mr_pct ?? 0),
      sr_pct: Number(autor.sr_pct ?? 0),
      controlled: isControlled,
      link_number: linkNumber,
      kind: 'autor',
    })
  }

  const pubIpSeenForEditoras = new Map<string, number>()
  for (const editora of editoras) {
    const nome = String(editora.nome ?? '').trim()
    if (!nome) continue
    const pubIpKey = String(editora.ip_name_no ?? editora.ipi ?? '').replace(/\s/g, '').trim()
    const seen = pubIpSeenForEditoras.get(pubIpKey) ?? 0
    pubIpSeenForEditoras.set(pubIpKey, seen + 1)
    const links = pubIpToLinkNums.get(pubIpKey) ?? []
    const linkNumber = links[seen] ?? (seen + 1)

    participantes.push({
      nome,
      ipi: editora.ipi ?? null,
      ip_name_number: editora.ip_name_no ?? null,
      papel: mapPapelEditora(String(editora.tipo ?? ''), String(editora.papel ?? '')),
      pr_pct: Number(editora.pr_pct ?? 0),
      mr_pct: Number(editora.mr_pct ?? 0),
      sr_pct: Number(editora.sr_pct ?? 0),
      controlled: Boolean(editora.controlled),
      link_number: linkNumber,
      kind: 'editora',
    })
  }

  const grouped = new Map<number, SnapshotPreviewParticipant[]>()
  for (const participante of participantes) {
    if (!grouped.has(participante.link_number)) grouped.set(participante.link_number, [])
    grouped.get(participante.link_number)!.push(participante)
  }

  return [...grouped.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([numero_link, items]) => {
      const percentual_link = Number(items.reduce((sum, item) => sum + (Number(item.pr_pct) || 0), 0).toFixed(4))
      const hasControlled = items.some((item) => item.controlled)
      const hasEditorial = items.some((item) => item.kind === 'editora')
      return {
        numero_link,
        percentual_link,
        controlado: hasControlled && hasEditorial,
        tipo_link: hasControlled && hasEditorial ? 'controlado' : 'direto_sem_editora',
        participantes: items,
      }
    })
}