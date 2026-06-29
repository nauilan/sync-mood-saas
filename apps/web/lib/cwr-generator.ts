// ============================================================
// lib/cwr-generator.ts — Gerador CWR 2.1-5 e SWI
// Sync Mood Gestao Inteligente — M5 BackOffice
// ============================================================

import type { Obra, ObraLink } from './types-obras'
import { normalizarLinksObra } from './types-obras'

function pad(value: string | number, length: number, fill = ' '): string {
  return String(value ?? '').padEnd(length, fill).slice(0, length)
}

function padLeft(value: string | number, length: number, fill = '0'): string {
  const stringValue = String(value ?? '')
  if (stringValue.length >= length) return stringValue.slice(-length)
  return stringValue.padStart(length, fill)
}

function cdate(iso?: string | null): string {
  if (!iso) return ' '.repeat(8)
  const d = new Date(iso)
  const y = String(d.getFullYear())
  const m = padLeft(d.getMonth() + 1, 2)
  const day = padLeft(d.getDate(), 2)
  return `${y}${m}${day}`
}

function today(): string {
  return cdate(new Date().toISOString())
}

let _seqNo = 0
function nextSeq(): string {
  _seqNo++
  return padLeft(_seqNo, 8)
}

function resetSeq(): void { _seqNo = 0 }

function splitPersonName(nome: string): { firstName: string; lastName: string } {
  const parts = String(nome ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1)[0],
  }
}

function toIpiNameNo(value: string | null | undefined): string {
  return String(value ?? '').trim().slice(0, 9)
}

function toIpiBaseNo(value: string | null | undefined): string {
  return String(value ?? '').replace(/\D/g, '').slice(-13)
}

const CWR_VERSION = '02.10'
const SENDER_ID = 'SYNCMD'
const SENDER_TYPE = 'PB'
const SOCIETY_CODE = 'BRA'
const TERRITORY_CODE = '0076'

function buildHDR(senderName: string): string {
  const record_type = 'HDR'
  const sender_type = pad(SENDER_TYPE, 3)
  const sender_id = pad(SENDER_ID, 9)
  const sender_name = pad(senderName, 45)
  const edi_version = pad(CWR_VERSION, 5)
  const creation_dt = today()
  const creation_tm = '000000'
  const tx_ref = padLeft(_seqNo + 1, 14)
  const char_set = pad('U+0000', 15)

  return `${record_type}${sender_type}${sender_id}${sender_name}${edi_version}${creation_dt}${creation_tm}${tx_ref}${char_set}`
}

function buildGRH(groupId: number, transactionType: 'NWR' | 'REV'): string {
  const record_type = 'GRH'
  const tx_type = pad(transactionType, 3)
  const grp_id = padLeft(groupId, 5)
  const version = pad(CWR_VERSION, 5)
  const batch_req = padLeft(0, 10)
  return `${record_type}${tx_type}${grp_id}${version}${batch_req}`
}

function buildNWR(obra: Obra): string {
  const record_type = 'NWR'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const title = pad(obra.titulo.toUpperCase(), 60)
  const lang_code = pad('PT', 2)
  const submitter_code = pad(obra.codigo, 14)
  const iswc = pad(obra.iswc ?? '', 11)
  const filler7 = pad('', 7)
  const categoria = pad('', 3)
  return `${record_type}${seq}${tx_seq}${title}${lang_code}${submitter_code}${iswc}${filler7}${categoria}`
}

function buildSPU(
  spuSeq: number,
  publisherName: string,
  ipiNameNo: string,
  ipiBaseNo: string,
  publisherRole: 'AQ' | 'E ' | 'SE',
  prefBrPct: number,
  mechBrPct: number,
  syncBrPct: number
): string {
  const record_type = 'SPU'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const pub_seq = padLeft(spuSeq, 2)
  const ipi_name_no = pad(toIpiNameNo(ipiNameNo), 9)
  const pub_name = pad(publisherName.toUpperCase(), 45)
  const pub_unknown = pad('', 1)
  const pub_role = pad(publisherRole, 2)
  const tax_id = pad('', 9)
  const ipi_name_full = padLeft(toIpiBaseNo(ipiBaseNo), 13)
  const filler12 = pad('', 12)
  const pr_soc = padLeft(SOCIETY_CODE, 3)
  const pr_pct = padLeft(Math.round(prefBrPct * 100), 5)
  const mr_soc = padLeft(SOCIETY_CODE, 3)
  const mr_pct = padLeft(Math.round(mechBrPct * 100), 5)
  const sr_soc = padLeft(0, 3)
  const sr_pct = padLeft(Math.round(syncBrPct * 100), 5)
  const flags = pad('YYN', 3)
  const ipi_base = padLeft(toIpiBaseNo(ipiBaseNo), 13)
  return `${record_type}${seq}${tx_seq}${pub_seq}${ipi_name_no}${pub_name}${pub_unknown}${pub_role}${tax_id}${ipi_name_full}${filler12}${pr_soc}${pr_pct}${mr_soc}${mr_pct}${sr_soc}${sr_pct}${flags}${ipi_base}`
}

function buildSPT(ipNameNo: string, prPct: number, mrPct: number, srPctValue: number): string {
  const record_type = 'SPT'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const ipi_name_no = pad(toIpiNameNo(ipNameNo), 9)
  const filler6 = pad('', 6)
  const pr_coll_soc = padLeft(SOCIETY_CODE, 3)
  const pr_pct = padLeft(Math.round(prPct * 100), 5)
  const mr_coll_soc = padLeft(SOCIETY_CODE, 3)
  const mr_pct = padLeft(Math.round(mrPct * 100), 5)
  const sr_coll_soc = padLeft(0, 3)
  const sr_pct = padLeft(Math.round(srPctValue * 100), 5)
  const inclusion = pad('I', 1)
  const tis_no = pad(TERRITORY_CODE, 4)
  const shares_change = pad('N', 1)
  const sequence_no = padLeft(1, 3)
  return `${record_type}${seq}${tx_seq}${ipi_name_no}${filler6}${pr_coll_soc}${pr_pct}${mr_coll_soc}${mr_pct}${sr_coll_soc}${sr_pct}${inclusion}${tis_no}${shares_change}${sequence_no}`
}

function buildOPU(opuSeq: number): string {
  const record_type = 'OPU'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const pub_seq = padLeft(opuSeq, 2)
  const ipi_name_no = pad('', 9)
  const pub_name = pad('UNKNOWN', 45)
  const pub_unknown = pad('Y', 1)
  const pub_role = pad('E ', 2)
  const tail = pad('', 60)
  return `${record_type}${seq}${tx_seq}${pub_seq}${ipi_name_no}${pub_name}${pub_unknown}${pub_role}${tail}`
}

function buildSWR(
  ipiNameNo: string,
  ipiBaseNo: string,
  lastName: string,
  firstName: string,
  role: string,
  prPct: number,
  mrPct: number,
  srPct: number
): string {
  const record_type = 'SWR'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const writer_ip_name_no = pad(toIpiNameNo(ipiNameNo), 9)
  const last_name = pad(lastName.toUpperCase(), 45)
  const first_name = pad(firstName.toUpperCase(), 30)
  const unknown = pad('N', 1)
  const writer_role = pad(role.slice(0, 2), 2)
  const tax_id = pad('', 9)
  const writer_ipi_name_no = pad(toIpiNameNo(ipiNameNo), 11)
  const pr_soc = padLeft(SOCIETY_CODE, 3)
  const pr_share = padLeft(Math.round(prPct * 100), 5)
  const mr_soc = padLeft(SOCIETY_CODE, 3)
  const mr_share = padLeft(Math.round(mrPct * 100), 5)
  const sr_soc = padLeft(0, 3)
  const sr_share = padLeft(Math.round(srPct * 100), 5)
  const flags = 'NYYN'
  const writer_ipi_base_no = padLeft(toIpiBaseNo(ipiBaseNo), 13)
  return `${record_type}${seq}${tx_seq}${writer_ip_name_no}${last_name}${first_name}${unknown}${writer_role}${tax_id}${writer_ipi_name_no}${pr_soc}${pr_share}${mr_soc}${mr_share}${sr_soc}${sr_share}${flags}${writer_ipi_base_no}`
}

function buildSWT(prPct: number, mrPct: number): string {
  const record_type = 'SWT'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const filler15 = pad('', 15)
  const pr_coll_soc = padLeft(SOCIETY_CODE, 3)
  const pr_share = padLeft(Math.round(prPct * 100), 5)
  const mr_coll_soc = padLeft(SOCIETY_CODE, 3)
  const mr_share = padLeft(Math.round(mrPct * 100), 5)
  const sr_coll_soc = padLeft(0, 3)
  const sr_share = padLeft(0, 5)
  const inclusion = pad('I', 1)
  const tis_no = pad(TERRITORY_CODE, 4)
  const shares_change = pad('N', 1)
  const sequence_no = padLeft(1, 3)
  return `${record_type}${seq}${tx_seq}${filler15}${pr_coll_soc}${pr_share}${mr_coll_soc}${mr_share}${sr_coll_soc}${sr_share}${inclusion}${tis_no}${shares_change}${sequence_no}`
}

function buildPWR(publisherIpNameNo: string, publisherName: string, writerIpNameNo: string): string {
  const record_type = 'PWR'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const pub_ipi = pad(toIpiNameNo(publisherIpNameNo), 9)
  const pub_name = pad(publisherName.toUpperCase(), 45)
  const writer_ipi = pad(toIpiNameNo(writerIpNameNo), 9)
  const writer_unknown = pad('N', 1)
  return `${record_type}${seq}${tx_seq}${pub_ipi}${pub_name}${writer_ipi}${writer_unknown}`
}

function buildOWR(
  ipiNameNo: string,
  ipiBaseNo: string,
  lastName: string,
  firstName: string,
  role: string,
  prPct: number,
  mrPct: number,
  srPct: number
): string {
  const record_type = 'OWR'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const writer_ip_name_no = pad(toIpiNameNo(ipiNameNo || ''), 9)
  const last_name = pad(lastName.toUpperCase(), 45)
  const first_name = pad(firstName.toUpperCase(), 30)
  const unknown = pad(ipiNameNo ? 'N' : 'Y', 1)
  const writer_role = pad(role.slice(0, 2), 2)
  const tax_id = pad('', 9)
  const writer_ipi_name_no = pad(toIpiNameNo(ipiNameNo || ''), 11)
  const pr_soc = padLeft(SOCIETY_CODE, 3)
  const pr_share = padLeft(Math.round(prPct * 100), 5)
  const mr_soc = padLeft(SOCIETY_CODE, 3)
  const mr_share = padLeft(Math.round(mrPct * 100), 5)
  const sr_soc = padLeft(0, 3)
  const sr_share = padLeft(Math.round(srPct * 100), 5)
  const flags = 'NYYN'
  const writer_ipi_base_no = padLeft(toIpiBaseNo(ipiBaseNo), 13)
  return `${record_type}${seq}${tx_seq}${writer_ip_name_no}${last_name}${first_name}${unknown}${writer_role}${tax_id}${writer_ipi_name_no}${pr_soc}${pr_share}${mr_soc}${mr_share}${sr_soc}${sr_share}${flags}${writer_ipi_base_no}`
}

function buildALT(altTitle: string, lang: string): string {
  const record_type = 'ALT'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const filler = pad('', 8)
  const title = pad(altTitle.toUpperCase(), 60)
  const lang_code = pad(lang, 2)
  const title_type = pad('AT', 2)
  return `${record_type}${seq}${tx_seq}${filler}${title}${lang_code}${title_type}`
}

function buildPER(perSeq: number, name: string): string {
  const record_type = 'PER'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const record_seq = padLeft(perSeq + 350, 8)
  const perf_last = pad(name.toUpperCase(), 45)
  const perf_first = pad('', 30)
  const isni = pad('', 16)
  const perf_role = pad('', 3)
  return `${record_type}${seq}${tx_seq}${record_seq}${perf_last}${perf_first}${isni}${perf_role}`
}

function buildREC(recSeq: number, isrc: string, duration: number, title: string): string {
  const record_type = 'REC'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const record_seq = padLeft(recSeq + 400, 8)
  const release_dt = pad('', 8)
  const rec_duration = padLeft(Math.floor(duration / 3600), 2) + padLeft(Math.floor((duration % 3600) / 60), 2) + padLeft(duration % 60, 2)
  const isrc_out = pad(isrc || '', 12)
  const rec_title = pad(title.toUpperCase(), 60)
  const display_art = pad('', 60)
  const rec_label = pad('', 60)
  const isrc2 = pad('', 12)
  return `${record_type}${seq}${tx_seq}${record_seq}${release_dt}${rec_duration}${isrc_out}${rec_title}${display_art}${rec_label}${isrc2}`
}

function buildVER(originalIswc: string, originalTitle: string): string {
  const record_type = 'VER'
  const seq = nextSeq()
  const tx_seq = padLeft(0, 8)
  const record_seq = padLeft(450, 8)
  const iswc = pad(originalIswc, 11)
  const title = pad(originalTitle.toUpperCase(), 60)
  const lang = pad('PT', 2)
  return `${record_type}${seq}${tx_seq}${record_seq}${iswc}${title}${lang}`
}

function buildGRT(groupId: number, txCount: number, recordCount: number): string {
  const record_type = 'GRT'
  const grp_id = padLeft(groupId, 5)
  const tx_count = padLeft(txCount, 8)
  const rec_count = padLeft(recordCount, 8)
  return `${record_type}${grp_id}${tx_count}${rec_count}`
}

function buildTRL(groupCount: number, txCount: number, recordCount: number): string {
  const record_type = 'TRL'
  const grp_count = padLeft(groupCount, 5)
  const tx_count = padLeft(txCount, 8)
  const rec_count = padLeft(recordCount, 8)
  return `${record_type}${grp_count}${tx_count}${rec_count}`
}

export interface CWRGeneratorOptions {
  format: 'CWR' | 'SWI'
  senderName: string
  obras: Array<{
    obra: Obra
    links: ObraLink[]
    fonogramas?: Array<{ isrc?: string | null; titulo_fonograma: string; duracao: number }>
    performers?: string[]
  }>
}

export interface CWRGeneratorResult {
  content: string
  filename: string
  stats: {
    obras_incluidas: number
    obras_filtradas: number
    total_records: number
    format: string
  }
}

export function generateCWR(opts: CWRGeneratorOptions): CWRGeneratorResult {
  resetSeq()
  const lines: string[] = []
  const now = new Date()

  const obrasFiltradas = opts.obras.filter(item =>
    item.links.some(l => (l.titulares?.length ?? 0) > 0)
  )

  if (opts.format === 'SWI') {
    return generateSWI(opts, obrasFiltradas)
  }

  lines.push(buildHDR(opts.senderName))
  lines.push(buildGRH(1, 'NWR'))

  let txCount = 0
  let recordCount = 2

  for (const item of obrasFiltradas) {
    const { obra, fonogramas, performers } = item
    const links = normalizarLinksObra(item.links)
    txCount++

    lines.push(buildNWR(obra))
    recordCount++

    let spuIdx = 0
    const controlledPublishers = links
      .flatMap(l => l.titulares ?? [])
      .filter(t => ['editora_original', 'administradora'].includes(t.papel))

    const seenPub = new Set<string>()
    for (const pub of controlledPublishers) {
      const pubKey = `${pub.link_id}:${pub.papel}:${pub.nome}:${pub.pwr_publisher_code ?? pub.ipi ?? ''}`
      if (seenPub.has(pubKey)) continue
      seenPub.add(pubKey)

      const role: 'AQ' | 'E ' | 'SE' = pub.papel === 'administradora' ? 'AQ' : 'E '
      const pubPR = pub.percentual_exec_publica ?? pub.percentual
      const pubMR = pub.percentual_fonomecanico ?? 0
      const pubSR = pub.percentual_sincronizacao ?? 0
      lines.push(buildSPU(spuIdx, pub.nome, pub.pwr_publisher_code ?? pub.ipi ?? '0', pub.ipi ?? pub.pwr_publisher_code ?? '0', role, pubPR, pubMR, pubSR))
      recordCount++
      lines.push(buildSPT(pub.pwr_publisher_code ?? pub.ipi ?? '0', pubPR, pubMR, pubSR))
      recordCount++
      spuIdx++
    }

    const hasUnknownPub = links.some(l =>
      (l.titulares ?? []).some(t =>
        ['editora_original', 'administradora'].includes(t.papel) && !t.ipi
      )
    )
    if (hasUnknownPub) {
      lines.push(buildOPU(spuIdx))
      recordCount++
    }

    const allWriters = links.flatMap(l =>
      (l.titulares ?? []).filter(t => ['compositor', 'autor', 'versionista', 'adaptador'].includes(t.papel))
    )

    for (const writer of allWriters) {
      const roleMap: Record<string, string> = {
        compositor: 'CA',
        autor: 'A ',
        versionista: 'V ',
        adaptador: 'AD',
      }
      const writerRole = roleMap[writer.papel] ?? 'CA'
      const { firstName, lastName } = splitPersonName(writer.nome)

      if (writer.controlado) {
        const wrPR = writer.percentual_exec_publica ?? writer.percentual
        const wrMR = writer.percentual_fonomecanico ?? 0
        const wrSR = writer.percentual_sincronizacao ?? 0
        lines.push(buildSWR(writer.pwr_writer_code ?? writer.ipi ?? '0', writer.ipi ?? writer.pwr_writer_code ?? '0', lastName, firstName, writerRole, wrPR, wrMR, wrSR))
        recordCount++
        lines.push(buildSWT(wrPR, wrMR))
        recordCount++
        const pubForWriter = links.find(l => (l.titulares ?? []).includes(writer))
        const pub = pubForWriter?.titulares?.find(t => t.papel === 'editora_original' && !!(t.pwr_publisher_code ?? t.ipi))
          ?? pubForWriter?.titulares?.find(t => t.papel === 'administradora' && !!(t.pwr_publisher_code ?? t.ipi))
        if (pub) {
          lines.push(buildPWR(pub.pwr_publisher_code ?? pub.ipi ?? '0', pub.nome, writer.pwr_writer_code ?? writer.ipi ?? '0'))
          recordCount++
        }
      } else {
        const wrPR = writer.percentual_exec_publica ?? writer.percentual
        const wrMR = writer.percentual_fonomecanico ?? 0
        const wrSR = writer.percentual_sincronizacao ?? 0
        lines.push(buildOWR(writer.pwr_writer_code ?? writer.ipi ?? '0', writer.ipi ?? writer.pwr_writer_code ?? '0', lastName, firstName, writerRole, wrPR, wrMR, wrSR))
        recordCount++
      }
    }

    if (obra.titulo_original) {
      lines.push(buildALT(obra.titulo_original, 'PT'))
      recordCount++
    }

    if (obra.titulo_original && obra.iswc) {
      lines.push(buildVER(obra.iswc, obra.titulo_original))
      recordCount++
    }

    const recs = fonogramas ?? []
    recs.forEach((f, idx) => {
      lines.push(buildREC(idx, f.isrc ?? '', f.duracao, f.titulo_fonograma))
      recordCount++
    })

    const pers = performers ?? []
    pers.forEach((name, idx) => {
      lines.push(buildPER(idx, name))
      recordCount++
    })
  }

  lines.push(buildGRT(1, txCount, recordCount + 2))
  lines.push(buildTRL(1, txCount, recordCount + 2))

  const content = lines.join('\r\n') + '\r\n'
  const filename = `syncmood_${opts.format.toLowerCase()}_${today()}.txt`

  return {
    content,
    filename,
    stats: {
      obras_incluidas: obrasFiltradas.length,
      obras_filtradas: opts.obras.length - obrasFiltradas.length,
      total_records: lines.length,
      format: opts.format,
    },
  }
}

function generateSWI(opts: CWRGeneratorOptions, obrasFiltradas: CWRGeneratorOptions['obras']): CWRGeneratorResult {
  const rows: string[] = []
  rows.push([
    'work_id',
    'titulo',
    'iswc',
    'autores',
    'editoras',
    'fonogramas',
  ].join('\t'))

  for (const item of obrasFiltradas) {
    const { obra } = item
    const links = normalizarLinksObra(item.links)
    const autores = links.flatMap(link => (link.titulares ?? []).filter(t => ['compositor', 'autor', 'versionista', 'adaptador'].includes(t.papel)))
    const editoras = links.flatMap(link => (link.titulares ?? []).filter(t => ['editora_original', 'administradora'].includes(t.papel)))
    rows.push([
      obra.codigo,
      obra.titulo,
      obra.iswc ?? '',
      autores.map(a => `${a.nome}:${a.percentual_exec_publica ?? a.percentual}`).join('; '),
      editoras.map(e => `${e.nome}:${e.percentual_exec_publica ?? e.percentual}`).join('; '),
      (item.fonogramas ?? []).map(f => `${f.isrc ?? ''}:${f.titulo_fonograma}`).join('; '),
    ].join('\t'))
  }

  return {
    content: rows.join('\n') + '\n',
    filename: `syncmood_swi_${today()}.txt`,
    stats: {
      obras_incluidas: obrasFiltradas.length,
      obras_filtradas: opts.obras.length - obrasFiltradas.length,
      total_records: rows.length,
      format: 'SWI',
    },
  }
}