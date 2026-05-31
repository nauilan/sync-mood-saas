// ============================================================
// lib/cwr-generator.ts — Gerador CWR 2.1-5 e SWI
// Sync Mood Gestao Inteligente — M5 BackOffice
//
// SPEC: B-5-BO-LAYOUT CWR README (versao 2.1-5)
// Filtros obrigatorios (conforme spec UBEM):
//   - Apenas obras com controle editorial no BR
//   - SPT/SWT: apenas registros de Brasil (territory=BR)
//   - SPU: apenas editor original + editor local com collect
//   - NAO incluir: AGR,TER,IPA,NPA,EWT,INS,IND,ORN,COM
// ============================================================

import type { Obra, ObraLink } from './types-obras'
import { normalizarLinksObra } from './types-obras'

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(value: string | number, length: number, fill = ' '): string {
  return String(value).padEnd(length, fill).slice(0, length)
}

function padLeft(value: string | number, length: number, fill = '0'): string {
  return String(value).padStart(length, fill).slice(0, length)
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

// CWR fixed char values
const CWR_VERSION    = '02.10'
const SENDER_ID      = 'SYNCMD'  // 9-char sender code
const SENDER_TYPE    = 'PB'      // Publisher
const SOCIETY_CODE   = 'BRA'     // Brazil
const TERRITORY_CODE = '0076'    // Brazil CISAC code

// ── Record builders ───────────────────────────────────────────────────────────

/** HDR — Transmission Header */
function buildHDR(senderName: string, totalRecords?: number): string {
  const record_type  = 'HDR'
  const sender_type  = pad(SENDER_TYPE, 3)
  const sender_id    = pad(SENDER_ID, 9)
  const sender_name  = pad(senderName, 45)
  const edi_version  = pad(CWR_VERSION, 5)
  const creation_dt  = today()
  const creation_tm  = '000000'
  const tx_ref       = padLeft(_seqNo + 1, 14)
  const char_set     = pad('U+0000', 15)

  return `${record_type}${sender_type}${sender_id}${sender_name}${edi_version}${creation_dt}${creation_tm}${tx_ref}${char_set}`
}

/** GRH — Group Header */
function buildGRH(groupId: number, transactionType: 'NWR' | 'REV'): string {
  const record_type = 'GRH'
  const tx_type     = pad(transactionType, 3)
  const grp_id      = padLeft(groupId, 5)
  const version     = pad(CWR_VERSION, 5)
  const batch_req   = padLeft(0, 10)
  return `${record_type}${tx_type}${grp_id}${version}${batch_req}`
}

/** NWR — New Work Registration */
function buildNWR(obra: Obra): string {
  const record_type   = 'NWR'
  const seq           = nextSeq()
  const tx_seq        = padLeft(0, 8)
  const record_seq    = padLeft(1, 8)
  const title         = pad(obra.titulo.toUpperCase(), 60)
  const lang_code     = pad('PT', 2)
  const submitter_code= pad(obra.codigo, 14)
  const iswc          = pad(obra.iswc ?? '', 11)
  const copyright_dt  = pad('', 8)   // unknown
  const copyright_no  = pad('', 12)
  const music_arr     = pad('ORI', 3)  // Original
  const lyrics_adp    = pad('ORI', 3)
  const excerpt       = pad('EXC', 3)
  const composite     = pad('MED', 3)
  const version_type  = pad(obra.titulo_original ? 'MOD' : 'ORI', 3)
  const excerpt_type  = pad('', 2)
  const music_arr2    = pad('', 3)
  const duration      = obra.duracao ? padLeft(Math.floor(obra.duracao / 3600), 2) + padLeft(Math.floor((obra.duracao % 3600) / 60), 2) + padLeft(obra.duracao % 60, 2) : '000000'
  const catalogue_no  = pad('', 14)
  const opus_no       = pad('', 6)
  const contact_name  = pad('', 30)
  const contact_id    = pad('', 10)
  const work_type     = pad('', 2)
  const grand_rights  = pad('N', 1)
  const composite_cnt = padLeft(0, 3)
  const date_print    = pad('', 8)
  const except_dist   = pad('N', 1)
  const opus_detail   = pad('', 25)
  const printed_ed    = pad('', 25)

  return `${record_type}${seq}${tx_seq}${record_seq}${title}${lang_code}${submitter_code}${iswc}${copyright_dt}${copyright_no}${music_arr}${lyrics_adp}${excerpt}${composite}${version_type}${excerpt_type}${music_arr2}${duration}${catalogue_no}${opus_no}${contact_name}${contact_id}${work_type}${grand_rights}${composite_cnt}${date_print}${except_dist}${opus_detail}${printed_ed}`
}

/** SPU — Publisher controlled by submitter (Original + Local) */
function buildSPU(
  workSeq: string,
  spuSeq: number,
  publisherCode: string,
  publisherName: string,
  ipi: string,
  cae: string,
  publisherRole: 'AQ' | 'E ' | 'SE',
  prefBrPct: number,
  mechBrPct: number
): string {
  const record_type    = 'SPU'
  const seq            = nextSeq()
  const tx_seq         = padLeft(0, 8)
  const record_seq     = padLeft(spuSeq + 2, 8)
  const pub_seq        = padLeft(spuSeq, 2)
  const ipi_name_no    = padLeft(ipi, 11)
  const pub_name       = pad(publisherName.toUpperCase(), 45)
  const pub_unknown    = pad('', 1)
  const pub_role       = pad(publisherRole, 2)
  const submitter_code = pad(publisherCode, 14)
  const ipi_base_no    = pad('', 13)
  const pr_soc         = padLeft(SOCIETY_CODE, 3)
  const pr_pct         = padLeft(Math.round(prefBrPct * 100), 5)
  const mr_soc         = padLeft(SOCIETY_CODE, 3)
  const mr_pct         = padLeft(Math.round(mechBrPct * 100), 5)
  const sr_soc         = padLeft(0, 3)
  const sr_pct         = padLeft(0, 5)
  const special_agree  = pad('', 1)
  const first_record   = pad('', 1)
  const pr_collect     = pad('Y', 1)
  const mr_collect     = pad('Y', 1)
  const sr_collect     = pad('N', 1)
  const reversionary   = pad('N', 1)
  const first_pub_dt   = pad('', 8)

  return `${record_type}${seq}${tx_seq}${record_seq}${pub_seq}${ipi_name_no}${pub_name}${pub_unknown}${pub_role}${submitter_code}${ipi_base_no}${pr_soc}${pr_pct}${mr_soc}${mr_pct}${sr_soc}${sr_pct}${special_agree}${first_record}${pr_collect}${mr_collect}${sr_collect}${reversionary}${first_pub_dt}`
}

/** SPT — Territory of Control for Publisher — Brazil only */
function buildSPT(workSeq: string, spuSeq: number, prPct: number, mrPct: number): string {
  const record_type   = 'SPT'
  const seq           = nextSeq()
  const tx_seq        = padLeft(0, 8)
  const record_seq    = padLeft(spuSeq + 10, 8)
  const ipi_name_no   = padLeft(0, 11)
  const pr_coll_soc   = padLeft(SOCIETY_CODE, 3)
  const pr_pct        = padLeft(Math.round(prPct * 100), 5)
  const mr_coll_soc   = padLeft(SOCIETY_CODE, 3)
  const mr_pct        = padLeft(Math.round(mrPct * 100), 5)
  const sr_coll_soc   = padLeft(0, 3)
  const sr_pct        = padLeft(0, 5)
  const inclusion     = pad('I', 1) // Include
  const tis_no        = pad(TERRITORY_CODE, 4) // Brazil
  const shares_change = pad('N', 1)
  const sequence_no   = padLeft(spuSeq, 3)

  return `${record_type}${seq}${tx_seq}${record_seq}${ipi_name_no}${pr_coll_soc}${pr_pct}${mr_coll_soc}${mr_pct}${sr_coll_soc}${sr_pct}${inclusion}${tis_no}${shares_change}${sequence_no}`
}

/** OPU — Other Publisher unknown */
function buildOPU(workSeq: string, opuSeq: number): string {
  const record_type   = 'OPU'
  const seq           = nextSeq()
  const tx_seq        = padLeft(0, 8)
  const record_seq    = padLeft(opuSeq + 50, 8)
  const pub_seq       = padLeft(opuSeq, 2)
  const ipi_name_no   = padLeft(0, 11)
  const pub_name      = pad('UNKNOWN', 45)
  const pub_unknown   = pad('Y', 1)
  const pub_role      = pad('E ', 2)
  const submitter_code= pad('', 14)
  return `${record_type}${seq}${tx_seq}${record_seq}${pub_seq}${ipi_name_no}${pub_name}${pub_unknown}${pub_role}${submitter_code}`
}

/** SWR — Writer controlled by submitter */
function buildSWR(
  workSeq: string,
  writerSeq: number,
  ipi: string,
  lastName: string,
  firstName: string,
  role: string,
  prSocCode: string,
  mrSocCode: string,
  prPct: number,
  mrPct: number
): string {
  const record_type  = 'SWR'
  const seq          = nextSeq()
  const tx_seq       = padLeft(0, 8)
  const record_seq   = padLeft(writerSeq + 100, 8)
  const writer_seq   = padLeft(writerSeq, 2)
  const ipi_name_no  = padLeft(ipi, 11)
  const last_name    = pad(lastName.toUpperCase(), 45)
  const first_name   = pad(firstName.toUpperCase(), 30)
  const unknown      = pad('N', 1)
  const writer_role  = pad(role.slice(0, 2), 2)
  const ipi_base_no  = pad('', 13)
  const pr_soc       = padLeft(prSocCode || '000', 3)
  const pr_pct       = padLeft(Math.round(prPct * 100), 5)
  const mr_soc       = padLeft(mrSocCode || '000', 3)
  const mr_pct       = padLeft(Math.round(mrPct * 100), 5)
  const sr_soc       = padLeft(0, 3)
  const sr_pct       = padLeft(0, 5)
  const revversionary= pad('N', 1)
  const pr_collect   = pad('Y', 1)
  const mr_collect   = pad('Y', 1)
  const sr_collect   = pad('N', 1)

  return `${record_type}${seq}${tx_seq}${record_seq}${writer_seq}${ipi_name_no}${last_name}${first_name}${unknown}${writer_role}${ipi_base_no}${pr_soc}${pr_pct}${mr_soc}${mr_pct}${sr_soc}${sr_pct}${revversionary}${pr_collect}${mr_collect}${sr_collect}`
}

/** SWT — Writer Territory — Brazil only */
function buildSWT(workSeq: string, writerSeq: number, prPct: number, mrPct: number): string {
  const record_type  = 'SWT'
  const seq          = nextSeq()
  const tx_seq       = padLeft(0, 8)
  const record_seq   = padLeft(writerSeq + 150, 8)
  const ipi_name_no  = padLeft(0, 11)
  const pr_coll_soc  = padLeft(SOCIETY_CODE, 3)
  const pr_pct       = padLeft(Math.round(prPct * 100), 5)
  const mr_coll_soc  = padLeft(SOCIETY_CODE, 3)
  const mr_pct       = padLeft(Math.round(mrPct * 100), 5)
  const sr_coll_soc  = padLeft(0, 3)
  const sr_pct       = padLeft(0, 5)
  const inclusion    = pad('I', 1)
  const tis_no       = pad(TERRITORY_CODE, 4)
  const shares_change= pad('N', 1)
  const sequence_no  = padLeft(writerSeq, 3)
  return `${record_type}${seq}${tx_seq}${record_seq}${ipi_name_no}${pr_coll_soc}${pr_pct}${mr_coll_soc}${mr_pct}${sr_coll_soc}${sr_pct}${inclusion}${tis_no}${shares_change}${sequence_no}`
}

/** PWR — Publisher for Writer link */
function buildPWR(workSeq: string, pwrSeq: number, publisherIpi: string, publisherCode: string, writerIpi: string): string {
  const record_type    = 'PWR'
  const seq            = nextSeq()
  const tx_seq         = padLeft(0, 8)
  const record_seq     = padLeft(pwrSeq + 200, 8)
  const pub_ipi        = padLeft(publisherIpi, 11)
  const pub_code       = pad(publisherCode, 14)
  const writer_ipi     = padLeft(writerIpi, 11)
  const writer_unknown = pad('N', 1)
  return `${record_type}${seq}${tx_seq}${record_seq}${pub_ipi}${pub_code}${writer_ipi}${writer_unknown}`
}

/** OWR — Other Writer (not administered) */
function buildOWR(workSeq: string, owrSeq: number, ipi: string, lastName: string, firstName: string, role: string): string {
  const record_type  = 'OWR'
  const seq          = nextSeq()
  const tx_seq       = padLeft(0, 8)
  const record_seq   = padLeft(owrSeq + 250, 8)
  const writer_seq   = padLeft(owrSeq, 2)
  const ipi_name_no  = padLeft(ipi || '00000000000', 11)
  const last_name    = pad(lastName.toUpperCase(), 45)
  const first_name   = pad(firstName.toUpperCase(), 30)
  const unknown      = pad(ipi ? 'N' : 'Y', 1)
  const writer_role  = pad(role.slice(0, 2), 2)
  const ipi_base_no  = pad('', 13)
  const pr_soc       = padLeft(0, 3)
  const pr_pct       = padLeft(0, 5)
  const mr_soc       = padLeft(0, 3)
  const mr_pct       = padLeft(0, 5)
  return `${record_type}${seq}${tx_seq}${record_seq}${writer_seq}${ipi_name_no}${last_name}${first_name}${unknown}${writer_role}${ipi_base_no}${pr_soc}${pr_pct}${mr_soc}${mr_pct}`
}

/** ALT — Alternate Title */
function buildALT(workSeq: string, altTitle: string, lang: string): string {
  const record_type  = 'ALT'
  const seq          = nextSeq()
  const tx_seq       = padLeft(0, 8)
  const record_seq   = padLeft(300, 8)
  const title        = pad(altTitle.toUpperCase(), 60)
  const title_type   = pad('AT', 2) // Alternative Title
  const lang_code    = pad(lang, 2)
  return `${record_type}${seq}${tx_seq}${record_seq}${title}${title_type}${lang_code}`
}

/** PER — Performer */
function buildPER(workSeq: string, perSeq: number, name: string): string {
  const record_type   = 'PER'
  const seq           = nextSeq()
  const tx_seq        = padLeft(0, 8)
  const record_seq    = padLeft(perSeq + 350, 8)
  const perf_last     = pad(name.toUpperCase(), 45)
  const perf_first    = pad('', 30)
  const isni          = pad('', 16)
  const perf_role     = pad('', 3)
  return `${record_type}${seq}${tx_seq}${record_seq}${perf_last}${perf_first}${isni}${perf_role}`
}

/** REC — Recording */
function buildREC(workSeq: string, recSeq: number, isrc: string, duration: number, title: string): string {
  const record_type  = 'REC'
  const seq          = nextSeq()
  const tx_seq       = padLeft(0, 8)
  const record_seq   = padLeft(recSeq + 400, 8)
  const release_dt   = pad('', 8)
  const rec_duration = padLeft(Math.floor(duration / 3600), 2) + padLeft(Math.floor((duration % 3600) / 60), 2) + padLeft(duration % 60, 2)
  const isrc_out     = pad(isrc || '', 12)
  const rec_title    = pad(title.toUpperCase(), 60)
  const display_art  = pad('', 60)
  const rec_label    = pad('', 60)
  const isrc2        = pad('', 12)
  return `${record_type}${seq}${tx_seq}${record_seq}${release_dt}${rec_duration}${isrc_out}${rec_title}${display_art}${rec_label}${isrc2}`
}

/** VER — Version / Original work for Versions */
function buildVER(workSeq: string, originalIswc: string, originalTitle: string): string {
  const record_type  = 'VER'
  const seq          = nextSeq()
  const tx_seq       = padLeft(0, 8)
  const record_seq   = padLeft(450, 8)
  const iswc         = pad(originalIswc, 11)
  const title        = pad(originalTitle.toUpperCase(), 60)
  const lang         = pad('PT', 2)
  return `${record_type}${seq}${tx_seq}${record_seq}${iswc}${title}${lang}`
}

/** GRT — Group Trailer */
function buildGRT(groupId: number, txCount: number, recordCount: number): string {
  const record_type  = 'GRT'
  const grp_id       = padLeft(groupId, 5)
  const tx_count     = padLeft(txCount, 8)
  const rec_count    = padLeft(recordCount, 8)
  return `${record_type}${grp_id}${tx_count}${rec_count}`
}

/** TRL — Transmission Trailer */
function buildTRL(groupCount: number, txCount: number, recordCount: number): string {
  const record_type  = 'TRL'
  const grp_count    = padLeft(groupCount, 5)
  const tx_count     = padLeft(txCount, 8)
  const rec_count    = padLeft(recordCount, 8)
  return `${record_type}${grp_count}${tx_count}${rec_count}`
}

// ── Main generator ─────────────────────────────────────────────────────────────

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

/**
 * Gera arquivo CWR 2.1-5 ou SWI conforme spec UBEM.
 * Filtros:
 *   - Apenas obras com percentual_controlado > 0 (controle editorial no BR)
 *   - SPT/SWT: apenas territorio BR
 *   - SPU: apenas editor original + editor local com collect
 *   - NAO inclui: AGR,TER,IPA,NPA,EWT,INS,IND,ORN,COM
 */
export function generateCWR(opts: CWRGeneratorOptions): CWRGeneratorResult {
  resetSeq()
  const lines: string[] = []
  const now = new Date()

  // Filter obras com editora presente (Top Show ou administrada — ambas sao controladas)
  const obrasFiltradas = opts.obras.filter(item =>
    item.links.some(l =>
      (l.titulares ?? []).some(t =>
        ['editora_original', 'administradora'].includes(t.papel)
      )
    )
  )

  if (opts.format === 'SWI') {
    return generateSWI(opts, obrasFiltradas)
  }

  // HDR
  lines.push(buildHDR(opts.senderName))

  // GRH (NWR group)
  lines.push(buildGRH(1, 'NWR'))

  let txCount = 0
  let recordCount = 2 // HDR + GRH

  for (const item of obrasFiltradas) {
    const { obra, fonogramas, performers } = item
    // Normaliza: garante 1 link por cadeia editorial com todos os titulares
    const links = normalizarLinksObra(item.links)
    txCount++

    // NWR
    const workSeq = nextSeq()
    lines.push(buildNWR(obra))
    recordCount++

    // SPU: toda editora citada eh controlada — Top Show Music (administradora/original) ou editora administrada
    let spuIdx = 0
    const controlledPublishers = links
      .flatMap(l => l.titulares ?? [])
      .filter(t => ['editora_original', 'administradora'].includes(t.papel))

    const seenPub = new Set<string>()
    for (const pub of controlledPublishers) {
      const pubKey = pub.titular_id ?? pub.nome
      if (seenPub.has(pubKey)) continue
      seenPub.add(pubKey)
      // AQ = sub-publisher/administradora, E = editora original
      const role: 'AQ' | 'E ' | 'SE' = pub.papel === 'administradora' ? 'AQ' : 'E '
      // percentual ja representa a fatia final da editora — nao dividir
      const pubPR = pub.percentual_exec_publica  ?? pub.percentual
      const pubMR = pub.percentual_fonomecanico  ?? pub.percentual
      const pubSR = pub.percentual_sincronizacao ?? pub.percentual
      lines.push(buildSPU(workSeq, spuIdx, pub.cae ?? '', pub.nome, pub.ipi ?? '0', pub.cae ?? '', role, pubPR, pubMR))
      recordCount++
      // SPT — Brazil only
      lines.push(buildSPT(workSeq, spuIdx, pubPR, pubMR))
      recordCount++
      spuIdx++
    }

    // OPU apenas se existir editora sem IPI (identidade desconhecida)
    const hasUnknownPub = links.some(l =>
      (l.titulares ?? []).some(t =>
        ['editora_original', 'administradora'].includes(t.papel) && !t.ipi
      )
    )
    if (hasUnknownPub) {
      lines.push(buildOPU(workSeq, spuIdx))
      recordCount++
    }

    // SWR / OWR per writer
    let swrIdx = 0
    let owrIdx = 0

    const allWriters = links.flatMap(l =>
      (l.titulares ?? []).filter(t => ['compositor', 'autor', 'versionista', 'adaptador'].includes(t.papel))
    )

    for (const writer of allWriters) {
      const roleMap: Record<string, string> = {
        compositor: 'CA',
        autor:      'A ',
        versionista:'V ',
        adaptador:  'AD',
      }
      const writerRole = roleMap[writer.papel] ?? 'CA'

      if (writer.controlado || writer.ipi) {
        // SWR — controlled writer
        const wrPR = (writer.percentual_exec_publica  ?? writer.percentual) / 2
        const wrMR = (writer.percentual_fonomecanico  ?? writer.percentual) / 2
        lines.push(buildSWR(workSeq, swrIdx, writer.ipi ?? '0', writer.nome.split(' ').slice(-1)[0], writer.nome.split(' ').slice(0, -1).join(' '), writerRole, 'BRA', 'BRA', wrPR, wrMR))
        recordCount++
        // SWT — Brazil only
        lines.push(buildSWT(workSeq, swrIdx, wrPR, wrMR))
        recordCount++
        // PWR — link to publisher
        const pubForWriter = links.find(l => (l.titulares ?? []).includes(writer))
        const pub = pubForWriter?.titulares?.find(t => ['editora_original', 'administradora'].includes(t.papel) && t.ipi)
        if (pub) {
          lines.push(buildPWR(workSeq, swrIdx, pub.ipi ?? '0', pub.cae ?? '', writer.ipi ?? '0'))
          recordCount++
        }
        swrIdx++
      } else {
        // OWR — non-administered writer
        lines.push(buildOWR(workSeq, owrIdx, writer.ipi ?? '', writer.nome.split(' ').slice(-1)[0], writer.nome.split(' ').slice(0, -1).join(' '), writerRole))
        recordCount++
        owrIdx++
      }
    }

    // ALT — alternate title if original
    if (obra.titulo_original) {
      lines.push(buildALT(workSeq, obra.titulo_original, 'PT'))
      recordCount++
    }

    // VER — if this is a version
    if (obra.titulo_original && obra.iswc) {
      lines.push(buildVER(workSeq, obra.iswc, obra.titulo_original))
      recordCount++
    }

    // PER — performers
    if (performers?.length) {
      performers.forEach((p, i) => {
        lines.push(buildPER(workSeq, i, p))
        recordCount++
      })
    }

    // REC — fonogramas
    if (fonogramas?.length) {
      fonogramas.forEach((f, i) => {
        lines.push(buildREC(workSeq, i, f.isrc ?? '', f.duracao, f.titulo_fonograma))
        recordCount++
      })
    }
  }

  // GRT
  lines.push(buildGRT(1, txCount, recordCount))
  recordCount++

  // TRL
  lines.push(buildTRL(1, txCount, recordCount + 1))

  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `CWR_SYNCMD_${date}_v01.V21`

  return {
    content: lines.join('\r\n'),
    filename,
    stats: {
      obras_incluidas: obrasFiltradas.length,
      obras_filtradas: opts.obras.length - obrasFiltradas.length,
      total_records: lines.length,
      format: 'CWR 2.1-5',
    },
  }
}

// ── SWI generator (Simple Work Information) ───────────────────────────────────

function generateSWI(opts: CWRGeneratorOptions, obras: CWRGeneratorOptions['obras']): CWRGeneratorResult {
  resetSeq()
  const lines: string[] = []
  const now = new Date()

  // SWI header
  lines.push(`SWI|${opts.senderName}|${now.toISOString().slice(0, 10)}|2.1-5`)

  for (const item of obras) {
    const { obra } = item
    // Normaliza: garante 1 link por cadeia editorial
    const links = normalizarLinksObra(item.links)
    const writers = links.flatMap(l => (l.titulares ?? []).filter(t => ['compositor', 'autor', 'versionista'].includes(t.papel)))
    const pubs    = links.flatMap(l => (l.titulares ?? []).filter(t => ['editora_original', 'administradora'].includes(t.papel)))

    // Work line
    lines.push([
      'WRK',
      obra.codigo,
      obra.titulo.toUpperCase(),
      obra.iswc ?? '',
      obra.idioma ?? 'PT',
      obra.duracao ? String(obra.duracao) : '',
    ].join('|'))

    // Writer lines
    for (const w of writers) {
      lines.push([
        'WTR',
        w.cae ?? '',
        w.nome.split(' ').slice(-1)[0].toUpperCase(),
        w.nome.split(' ').slice(0, -1).join(' ').toUpperCase(),
        w.papel === 'compositor' ? 'CA' : w.papel === 'autor' ? 'A' : 'V',
        String(w.percentual_exec_publica  ?? w.percentual),
        String(w.percentual_fonomecanico  ?? w.percentual),
        String(w.percentual_sincronizacao ?? w.percentual),
        w.ipi ?? '',
      ].join('|'))
    }

    // Publisher lines
    for (const p of pubs) {
      lines.push([
        'PUB',
        p.cae ?? '',
        p.nome.toUpperCase(),
        p.papel === 'administradora' ? 'AQ' : 'E ',
        String(p.percentual_exec_publica  ?? p.percentual),
        String(p.percentual_fonomecanico  ?? p.percentual),
        String(p.percentual_sincronizacao ?? p.percentual),
        p.ipi ?? '',
      ].join('|'))
    }
  }

  // SWI trailer
  lines.push(`TRL|${obras.length}|${lines.length + 1}`)

  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `SWI_SYNCMD_${date}.txt`

  return {
    content: lines.join('\n'),
    filename,
    stats: {
      obras_incluidas: obras.length,
      obras_filtradas: opts.obras.length - obras.length,
      total_records: lines.length,
      format: 'SWI',
    },
  }
}

// ── Status helpers ─────────────────────────────────────────────────────────────

/**
 * Determina status BO da obra com base nos dados disponiveis.
 * WORK = uso detectado (fonograma com ISRC lancado) + ISWC atribuido.
 * SONG = validada mas sem uso confirmado.
 */
export function inferStatusBO(obra: Obra, fonogramas: Array<{ isrc?: string | null; data_lancamento?: string | null }>): 'SONG' | 'WORK' {
  const hasISWC    = Boolean(obra.iswc)
  const hasLaunch  = fonogramas.some(f => f.data_lancamento && f.isrc)
  return hasISWC && hasLaunch ? 'WORK' : 'SONG'
}
