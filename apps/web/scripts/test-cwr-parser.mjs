// Teste do parser CWR com linhas reais do arquivo do cliente
// Executa: node --experimental-vm-modules scripts/test-cwr-parser.mjs
// Ou: npx tsx scripts/test-cwr-parser.mjs

// ── Construção das linhas CWR reais ──────────────────────────────────────────
// Formato: posição fixa, off=0 detectado pelo parser
// Tamanho padrão por campo - construímos manualmente para testar offsets

function pad(str, len, right = true) {
  str = String(str ?? '')
  if (right) return str.slice(0, len).padEnd(len)
  return str.slice(0, len).padStart(len)
}

// HDR line (19 chars de prefixo + sender info)
const HDR = 'HDR' + pad('01', 8) + pad('TOPSHOW', 3) + pad('TOP SHOW MUSIC', 45) + pad('20250709', 8) + pad('2025', 4)

// NWR: type(3)+rec_seq(8)+tx_seq(8)+unused(1)+title(60)+lang(2)+...+iswc(11)
// NWR00000000000000001 100% COUNTRY                                                PT T3336222976
function makeNWR(seq, titulo, lang, iswc, codigo) {
  return 'NWR' +
    pad('00000001', 8) +     // record_seq
    pad(seq, 8) +            // tx_seq
    ' ' +                    // reserved
    pad(titulo, 60) +        // title pos=19
    pad(lang, 2) +           // lang pos=79
    pad(codigo, 14) +        // work_id/codigo pos=81
    pad(iswc, 11) +          // iswc pos=95
    pad('', 30)              // padding
}

// SPU: type(3)+rec_seq(8)+tx_seq(8)+[off=0 → base=19]
// base=19: seq_code(14) | ipi(11) | nome(45) | unknown(1) | role(2) | tax_id(9) | cae_ipi(11) | submitter_id(14) | pr_soc(3) | pr_pct(5) | mr_soc(3) | mr_pct(5)
function makeSPU(recSeq, txSeq, seqCode, ipi, nome, unknown, role, taxId, caeIpi, submitterId, prSoc, prPct, mrSoc, mrPct) {
  return 'SPU' +
    pad(recSeq, 8) +
    pad(txSeq, 8) +
    ' ' +                       // reserved (pos 19 is base)
    // Atenção: base=19, mas o campo começa em 19 (sem o espaço reservado)
    // Na prática, depois do prefixo de 19 chars (3+8+8), o conteúdo começa
    // HDR/NWR/SPU: pos 0-2 = tipo, 3-10 = record_seq, 11-18 = tx_seq
    // pos 19 em diante = conteúdo do registro
    pad(seqCode, 14) +          // seq_code: pos 19-32 (14 chars)
    pad(ipi, 11) +              // ipi: pos 33-43
    pad(nome, 45) +             // nome: pos 44-88
    pad(unknown, 1) +           // unknown: pos 89
    pad(role, 2) +              // role: pos 90-91
    pad(taxId, 9) +             // tax_id: pos 92-100
    pad(caeIpi, 11) +           // cae_ipi: pos 101-111
    pad(submitterId, 14) +      // submitter_id: pos 112-125
    pad(prSoc, 3) +             // pr_society: pos 126-128
    pad(prPct, 5) +             // pr_pct: pos 129-133
    pad(mrSoc, 3) +             // mr_society: pos 134-136
    pad(mrPct, 5)               // mr_pct: pos 137-141
}

// SWR: base=19: seq(14)|ipi(11)|last_name(45)|first_name(30)|unknown(1)|role(2)|…|pr_pct(5)|…|mr_pct(5)
// Posições originais (off=0): seq@19, ipi@21, last@32, first@77, unk@107, role@108, pr_pct@126, mr_pct@134
// Com seq_l=14 (extra=12): ipi@33, last@44, first@89, unk@119, role@120, pr_pct@138, mr_pct@146
function makeSWR(recSeq, txSeq, seqCode, ipi, lastName, firstName, unknown, role, prPct, mrPct) {
  return 'SWR' +
    pad(recSeq, 8) +
    pad(txSeq, 8) +
    ' ' +
    pad(seqCode, 14) +     // seq: pos 19-32
    pad(ipi, 11) +         // ipi: pos 33-43
    pad(lastName, 45) +    // last_name: pos 44-88
    pad(firstName, 30) +   // first_name: pos 89-118
    pad(unknown, 1) +      // unknown: pos 119
    pad(role, 2) +         // role: pos 120-121
    pad('', 4) +           // pr_society_seq(2)+pr_affiliation_soc(3) = padding 4
    pad(prPct, 5) +        // pr_pct: pos 126
    pad('', 3) +           // mr_society
    pad(mrPct, 5)          // mr_pct
}

// PWR: base=19: pub_ipi(11)|pub_code(14)|writer_ipi(11)|writer_code(14)
function makePWR(recSeq, txSeq, pubIpi, pubCode, writerIpi, writerCode) {
  return 'PWR' +
    pad(recSeq, 8) +
    pad(txSeq, 8) +
    ' ' +
    pad(pubIpi, 11) +      // pub_ipi: pos 19-29
    pad(pubCode, 14) +     // pub_code: pos 30-43
    pad(writerIpi, 11) +   // writer_ipi: pos 44-54
    pad(writerCode, 14)    // writer_code: pos 55-68
}

// ── Construir arquivo CWR de teste ────────────────────────────────────────────
const lines = [
  HDR,
  'GRH0000000100000000NWR',
  // Obra AFW11 - 100% COUNTRY
  makeNWR('00000001', '100% COUNTRY', 'PT', 'T3336222976', 'AFW11'),
  // SPU 1: EDI MUSIC (editora original, papel E)
  makeSPU('00000001', '00000001',
    'ED01',              // seq_code (14 chars)
    '00000000000',       // ipi
    'EDI MUSIC EDITORA LTDA',
    'N',                 // unknown=N → controlado
    'E ',                // role
    '000000000',         // tax_id
    '00000000000',       // cae_ipi
    'ED01          ',    // submitter_id
    '021',               // pr_society (ABRAMUS=021)
    '01000',             // pr_pct = 10.00%
    '021',
    '01000'              // mr_pct = 10.00%
  ),
  // SPU 2: TOP SHOW MUSIC (administradora, papel AM)
  makeSPU('00000002', '00000001',
    '2646326       ',    // seq_code 14
    '00000000000',
    'TOP SHOW MUSIC LIMITADA - ME',
    'N',
    'AM',
    '000000000',
    '00000000000',
    '2646326       ',
    '021',
    '00250',             // pr_pct = 2.50%
    '021',
    '00250'
  ),
  // SWR 1: ARIOSTO (DJ01, CA)
  makeSWR('00000001', '00000001',
    'DJ01',
    '00000000000',
    'MULLER',
    'ARIOSTO PORTO',
    'N',
    'CA',
    '03750',             // pr_pct = 37.50%
    '03750'
  ),
  // SWR 2: LUAN GAVLIK (JD01, CA)
  makeSWR('00000002', '00000001',
    'JD01',
    '00000000000',
    'GAVLIK',
    'LUAN MARCELO',
    'N',
    'CA',
    '03750',
    '03750'
  ),
  // PWR: ED01 → DJ01
  makePWR('00000001', '00000001', '00000000000', 'ED01          ', '00000000000', 'DJ01          '),
  // PWR: ED01 → JD01
  makePWR('00000002', '00000001', '00000000000', 'ED01          ', '00000000000', 'JD01          '),
  // PWR: 2646326 → DJ01
  makePWR('00000003', '00000001', '00000000000', '2646326       ', '00000000000', 'DJ01          '),
  // PWR: 2646326 → JD01
  makePWR('00000004', '00000001', '00000000000', '2646326       ', '00000000000', 'JD01          '),
  'GRT0000000100000000',
  'TRL00000000000000010000000200000002',
]

const cwrContent = lines.join('\n')

// ── Importar e rodar o parser ─────────────────────────────────────────────────
import { createRequire } from 'module'
import { register } from 'node:module'
import { pathToFileURL } from 'url'
import path from 'path'
import fs from 'fs'

// Salvar CWR de teste em disco para inspeção
const testFile = path.join(process.cwd(), 'scripts', 'test-sample.cwr')
fs.writeFileSync(testFile, cwrContent)
console.log('CWR de teste salvo em:', testFile)
console.log('\n── Linhas do arquivo ──')
lines.forEach((l, i) => console.log(`${i+1}: ${l}`))

// Tentar importar o parser compilado (via tsx ou ts-node)
console.log('\n── Rodando parser ──')

// Verificar se tsx está disponível
import { execSync } from 'child_process'
try {
  const out = execSync(
    `npx tsx -e "
import { parseCwr } from './lib/cwr-parser.ts'
import fs from 'fs'
const content = fs.readFileSync('./scripts/test-sample.cwr', 'utf-8')
const result = parseCwr(content)
console.log(JSON.stringify({
  offset: result.offset_detectado,
  total_obras: result.total_obras,
  obras: result.obras.map(o => ({
    codigo: o.codigo,
    titulo: o.titulo,
    iswc: o.iswc,
    titulares: o.titulares.map(t => ({
      tipo: t.tipo,
      submitter_code: t.submitter_code,
      sequence_code: t.sequence_code,
      nome: t.nome,
      papel_cwr: t.papel_cwr,
      pr_pct: t.pr_pct,
      mr_pct: t.mr_pct,
      controlado: t.controlado,
    })),
    pwr_links: o.pwr_links
  }))
}, null, 2))
"`,
    { cwd: path.join(process.cwd(), '..', '..', 'apps', 'web'), encoding: 'utf-8' }
  )
  console.log(out)
} catch (e) {
  console.error('Erro ao rodar tsx:', e.message)
  console.log('Tente: cd apps/web && npx tsx scripts/test-cwr-parser.mjs')
}
