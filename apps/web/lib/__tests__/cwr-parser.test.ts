/**
 * lib/__tests__/cwr-parser.test.ts
 * Testes do parser CWR 2.1 com linhas reais extraídas de arquivo de homologação.
 *
 * Executar: npx vitest run lib/__tests__/cwr-parser.test.ts
 */

import { describe, it, expect } from 'vitest'
import { parseCwr, type CwrObra, type CwrAutor, type CwrEditora } from '../cwr-parser'

// ─── Utilitários ─────────────────────────────────────────────────────────────

function nwr(titulo: string, swn: string, iswc = '', lang = 'PT'): string {
  // Constrói NWR com campos nos offsets corretos (0-indexed):
  //   0-2:  NWR
  //   3-18: transaction+record seq (zeros)
  //   19-78: Work Title (60 chars)
  //   79-80: Language Code (2 chars)
  //   81-94: Submitter Work # (14 chars)
  //   95-105: ISWC (11 chars — usar formato sem traços: T1234567890)
  const titulo60 = titulo.padEnd(60, ' ').substring(0, 60)
  const lang2    = lang.padEnd(2, ' ').substring(0, 2)
  const swn14    = swn.padEnd(14, ' ').substring(0, 14)
  // ISWC: aceita T-XXXXXXXXX-C (13 chars) mas guarda apenas 11 chars sem traços
  const iswcClean = iswc.replace(/[\s\-]/g, '').substring(0, 11).padEnd(11, ' ')
  const seqs     = '0'.repeat(16)
  return `NWR${seqs}${titulo60}${lang2}${swn14}${iswcClean}20250101000000000000000000`
}

function swr(ipNameNo: string, lastName: string, firstName: string, designation: string, prShare = '00000', mrShare = '00000', srShare = '00000', ipiBase = ''): string {
  // CWR 2.2 SWR offsets (0-indexed):
  //   0-2:  SWR
  //   3-18: seqs (16 zeros)
  //   19-27: IP Name # (9 chars)
  //   28-72: Last Name (45 chars)
  //   73-102: First Name (30 chars)
  //   103:  Unknown Ind (1)
  //   104-105: Designation (2 chars)
  //   106-114: Tax ID (9 chars, blanks)
  //   115-125: IPI Name # (11 chars, blanks)
  //   126-128: PR Society (3 chars, blanks)
  //   129-133: PR Share (5 chars)
  //   134-136: MR Society (3 chars, blanks)
  //   137-141: MR Share (5 chars)
  //   142-144: SR Society (3 chars, blanks)
  //   145-149: SR Share (5 chars)
  //   150-153: Flags (4 chars, blanks)
  //   154-166: IPI Base # (13 chars)
  const ip9    = ipNameNo.padEnd(9, ' ').substring(0, 9)
  const ln45   = lastName.padEnd(45, ' ').substring(0, 45)
  const fn30   = firstName.padEnd(30, ' ').substring(0, 30)
  const unk    = ' '
  const des2   = designation.padEnd(2, ' ').substring(0, 2)
  const tax9   = ' '.repeat(9)
  const ipi11  = ' '.repeat(11)
  const soc3   = ' '.repeat(3)
  const pr5    = prShare.padEnd(5, '0').substring(0, 5)
  const mr5    = mrShare.padEnd(5, '0').substring(0, 5)
  const sr5    = srShare.padEnd(5, '0').substring(0, 5)
  const flags4 = ' '.repeat(4)
  const ipiPad = ipiBase.padEnd(13, ' ').substring(0, 13)
  const seqs   = '0'.repeat(16)
  return `SWR${seqs}${ip9}${ln45}${fn30}${unk}${des2}${tax9}${ipi11}${soc3}${pr5}${soc3}${mr5}${soc3}${sr5}${flags4}${ipiPad}`
}

function spu(seq: string, ipNameNo: string, nome: string, tipo: string, prShare = '000000', mrShare = '000000', srShare = '000000', ipiBase = ''): string {
  // SPU offsets:
  //   0-2:  SPU
  //   3-18: seqs
  //   19-20: Pub Seq # (2 chars)
  //   21-29: IP Name # (9 chars)
  //   30-74: Publisher Name (45 chars)
  //   75:   Unknown (1)
  //   76-77: Pub Type (2 chars)
  //   87-92: PR Share (6 chars) — best-effort position
  const seq2   = seq.padEnd(2, ' ').substring(0, 2)
  const ip9    = ipNameNo.padEnd(9, ' ').substring(0, 9)
  const nome45 = nome.padEnd(45, ' ').substring(0, 45)
  const unk    = ' '
  const tipo2  = tipo.padEnd(2, ' ').substring(0, 2)
  const seqs   = '0'.repeat(16)
  const ipiSuffix = ipiBase ? `          ${ipiBase}` : ''
  return `SPU${seqs}${seq2}${ip9}${nome45}${unk}${tipo2}     ${prShare}${mrShare}${srShare}${ipiSuffix}`
}

// ─── Linhas reais extraídas dos registros_raw de homologação ─────────────────

// Extraídas da importação b0f55a42 (campo registros_raw)
const NWR_100PCT_COUNTRY = 'NWR0000000000000000100% COUNTRY                                                PT27            T333622297620250709            UNC120000YMTX   ORI         contato@topshowmusic.com.br   27          N00000000000                                                    '
const SWR_HENRIQUE       = 'SWR0000000000000005HR01     ALVES DOS REIS                               HENRIQUE                       CA         00817662813189075001890750018907500    I-004434992-8011238972985 '
const SPU_EDI_MUSIC      = 'SPU000000000000000101ED01     EDI MUSIC EDITORA LTDA                        E          0124784681731            189025001890250018902500   I-006969853-7                               '

const NWR_3_TAMBORES = 'NWR00000001000000003 TAMBORES\t\t\t\t                                              PT482                      20250826            UNC120000YMTX   ORI         contato@topshowmusic.com.br   27          N00000000000                                                    '
const SWR_EWERTON    = 'SWR0000000100000013128      SILVA SANTOS                                 EWERTON                        CA         00773188018189024991890249918902499    I-004147530-1008917608906 '
const REC_COM_ISRC   = 'REC000000010000002300000000                                                            000000                                                                                                                                                            BX3PP2400012AD   '

// ─── Testes: NWR ─────────────────────────────────────────────────────────────

describe('parseCwr — NWR', () => {
  it('extrai título correto (pos 19-79)', () => {
    const r = parseCwr(NWR_100PCT_COUNTRY)
    expect(r.obras).toHaveLength(1)
    expect(r.obras[0].titulo).toBe('100% COUNTRY')
  })

  it('extrai submitter_work_no correto (pos 81-95)', () => {
    const r = parseCwr(NWR_100PCT_COUNTRY)
    expect(r.obras[0].submitter_work_no).toBe('27')
  })

  it('NÃO inverte titulo e submitter_work_no', () => {
    const r = parseCwr(NWR_100PCT_COUNTRY)
    // Título deve conter "COUNTRY", não código "PT27"
    expect(r.obras[0].titulo).not.toMatch(/^PT\d+$/)
    // SWN deve ser numérico/alfanumérico curto, não "100% COUNTRY"
    expect(r.obras[0].submitter_work_no).not.toBe('100% COUNTRY')
  })

  it('extrai ISWC quando presente', () => {
    const r = parseCwr(NWR_100PCT_COUNTRY)
    const iswc = r.obras[0].iswc
    // T333622297620250709 → ISWC T-333622297-6
    expect(iswc).toMatch(/^T-\d{9}-\d$/)
  })

  it('extrai lang code (pos 79-81)', () => {
    const r = parseCwr(NWR_100PCT_COUNTRY)
    expect(r.obras[0].lang).toBe('PT')
  })

  it('NWR construído sinteticamente extrai campos corretos', () => {
    // ISWC sem traços: T + 9 dígitos + check digit = 11 chars
    const linha = nwr('MINHA MUSICA TESTE', 'OBRA-001', 'T1234567890')
    const r = parseCwr(linha)
    expect(r.obras[0].titulo).toBe('MINHA MUSICA TESTE')
    expect(r.obras[0].submitter_work_no).toBe('OBRA-001')
    expect(r.obras[0].iswc).toBe('T-123456789-0')
  })
})

// ─── Testes: SWR ─────────────────────────────────────────────────────────────

describe('parseCwr — SWR', () => {
  it('extrai nome completo correto (First Last)', () => {
    const conteudo = NWR_100PCT_COUNTRY + '\n' + SWR_HENRIQUE
    const r = parseCwr(conteudo)
    expect(r.obras[0].autores).toHaveLength(1)
    const a = r.obras[0].autores[0]
    // Nome deve ser "HENRIQUE ALVES DOS REIS" ou similar
    expect(a.nome).toContain('HENRIQUE')
    expect(a.nome).toContain('ALVES DOS REIS')
  })

  it('NÃO inclui o papel CA dentro do nome', () => {
    const conteudo = NWR_100PCT_COUNTRY + '\n' + SWR_HENRIQUE
    const r = parseCwr(conteudo)
    const a = r.obras[0].autores[0]
    // O campo nome não deve começar com "CA"
    expect(a.nome).not.toMatch(/^CA\s/)
  })

  it('extrai papel (designation) corretamente', () => {
    const conteudo = NWR_100PCT_COUNTRY + '\n' + SWR_HENRIQUE
    const r = parseCwr(conteudo)
    const a = r.obras[0].autores[0]
    expect(a.papel).toBe('CA')
  })

  it('extrai IPI via regex I-XXXXXXXXX-C', () => {
    const conteudo = NWR_100PCT_COUNTRY + '\n' + SWR_HENRIQUE
    const r = parseCwr(conteudo)
    const a = r.obras[0].autores[0]
    // IPI = "004434992" de "I-004434992-8"
    expect(a.ipi).toBe('004434992')
  })

  it('percentual PR não excede 100%', () => {
    const conteudo = NWR_100PCT_COUNTRY + '\n' + SWR_HENRIQUE
    const r = parseCwr(conteudo)
    const a = r.obras[0].autores[0]
    expect(a.pr_pct).toBeGreaterThanOrEqual(0)
    expect(a.pr_pct).toBeLessThanOrEqual(100)
  })

  it('SWR controlado = true', () => {
    const conteudo = NWR_100PCT_COUNTRY + '\n' + SWR_HENRIQUE
    const r = parseCwr(conteudo)
    expect(r.obras[0].autores[0].controlled).toBe(true)
  })

  it('SWR sintético extrai campos corretos', () => {
    // ISWC sem traços no nwr, IPI Base sem traços no swr
    const linha = nwr('MUSICA X', 'MX-001') + '\n' +
      swr('IP0001   ', 'SOUZA LIMA', 'CARLOS', 'CA', '02500', '02500', '02500', 'I-123456789-0')
    const r = parseCwr(linha)
    const a = r.obras[0].autores[0]
    expect(a.nome).toContain('CARLOS')
    expect(a.nome).toContain('SOUZA LIMA')
    expect(a.papel).toBe('CA')
    expect(a.pr_pct).toBeCloseTo(25, 1)  // 02500 / 100 = 25.0%
    expect(a.ipi).toBe('123456789')
  })
})

// ─── Testes: SPU ─────────────────────────────────────────────────────────────

describe('parseCwr — SPU', () => {
  it('extrai nome da editora correto', () => {
    const conteudo = NWR_100PCT_COUNTRY + '\n' + SPU_EDI_MUSIC
    const r = parseCwr(conteudo)
    expect(r.obras[0].editoras).toHaveLength(1)
    const e = r.obras[0].editoras[0]
    expect(e.nome).toContain('EDI MUSIC')
  })

  it('NÃO inclui IPI/tipo dentro do nome da editora', () => {
    const conteudo = NWR_100PCT_COUNTRY + '\n' + SPU_EDI_MUSIC
    const r = parseCwr(conteudo)
    const e = r.obras[0].editoras[0]
    // Nome não deve conter o IPI numérico (01247846817)
    expect(e.nome).not.toMatch(/\d{9,}/)
  })

  it('extrai IPI via regex I-XXXXXXXXX-C', () => {
    const conteudo = NWR_100PCT_COUNTRY + '\n' + SPU_EDI_MUSIC
    const r = parseCwr(conteudo)
    const e = r.obras[0].editoras[0]
    // IPI "006969853" de "I-006969853-7"
    expect(e.ipi).toBe('006969853')
  })

  it('SPU controlado = true', () => {
    const conteudo = NWR_100PCT_COUNTRY + '\n' + SPU_EDI_MUSIC
    const r = parseCwr(conteudo)
    expect(r.obras[0].editoras[0].controlled).toBe(true)
  })
})

// ─── Testes: REC ─────────────────────────────────────────────────────────────

describe('parseCwr — REC / ISRC', () => {
  it('extrai ISRC quando presente', () => {
    const conteudo = NWR_3_TAMBORES + '\n' + REC_COM_ISRC
    const r = parseCwr(conteudo)
    const fono = r.obras[0].fonogramas[0]
    // ISRC "BX3PP2400012AD" — 12 chars, começa com 2 letras + 3 alfanum + 7 digitos
    // BX3PP2400012 → BX (country), 3PP (registrant), 2400012 (year+id)
    // Mas "BX3PP2400012AD" tem 14 chars — os últimos 2 podem ser extras
    // O regex deve pegar apenas os 12 válidos: "BX3PP2400012"
    expect(fono?.isrc).toBeTruthy()
    expect(fono?.isrc).toMatch(/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/)
  })
})

// ─── Testes: Arquivo completo ─────────────────────────────────────────────────

describe('parseCwr — arquivo sintético completo', () => {
  const arquivo = [
    'HDR          SENDER           RECEIVER           20250101CWR2.1              01.000000000000',
    nwr('AMOR E PAZ', 'AP-001', 'T9999999990', 'PT'),
    swr('W0001    ', 'OLIVEIRA', 'MARIA', 'CA', '00500000'),
    spu('01', 'E0001    ', 'EDITORA EXEMPLO LTDA', 'SE', '050000'),
    'GRT0000000000000001',
  ].join('\n')

  it('parseia arquivo completo sem erros', () => {
    const r = parseCwr(arquivo)
    expect(r.erros_parse).toHaveLength(0)
    expect(r.obras).toHaveLength(1)
  })

  it('obra com titulo, swn, iswc, autores e editoras', () => {
    const r = parseCwr(arquivo)
    const o = r.obras[0]
    expect(o.titulo).toBe('AMOR E PAZ')
    expect(o.submitter_work_no).toBe('AP-001')
    expect(o.iswc).toBe('T-999999999-0')
    expect(o.autores).toHaveLength(1)
    expect(o.editoras).toHaveLength(1)
  })
})

// ─── Testes: iswcParse (função interna exportada indiretamente) ──────────────
// Testamos via parseCwr com linha NWR construída

describe('ISWC parsing', () => {
  it('parseia formato sem hifens TXXXXXXXXXX (11 chars)', () => {
    const linha = nwr('TESTE', '001', 'T1234567890')
    const r = parseCwr(linha)
    expect(r.obras[0].iswc).toBe('T-123456789-0')
  })

  it('parseia formato T-XXXXXXXXX-C do arquivo real', () => {
    // O arquivo real embute ISWC sem traços: T3336222976 → T-333622297-6
    const r = parseCwr(NWR_100PCT_COUNTRY)
    expect(r.obras[0].iswc).toBe('T-333622297-6')
  })

  it('retorna null quando ISWC ausente', () => {
    const linha = nwr('TESTE', '001', '')
    const r = parseCwr(linha)
    expect(r.obras[0].iswc).toBeNull()
  })
})
