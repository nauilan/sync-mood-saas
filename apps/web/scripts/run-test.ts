import { parseCwr } from '../lib/cwr-parser'

function pad(str: unknown, len: number): string {
  const s = String(str ?? '')
  return s.slice(0, len).padEnd(len)
}

// ── Layout CWR 2.1 (formato BR, off=0, seq_code de 14 chars) ─────────────────
// Prefixo de 19 chars em TODAS as linhas: tipo(3) + rec_seq(8) + tx_seq(8)
// Conteúdo começa em pos 19 (base = 19 + off = 19 + 0 = 19)

// NWR: titulo@19(60), lang@79(2), codigo@81(14), iswc@95(11)
const NWR =
  'NWR' + pad('00000001',8) + pad('00000001',8) +
  pad('100% COUNTRY',60) +   // titulo @19
  pad('PT',2) +               // lang @79
  pad('AFW11',14) +           // codigo @81
  pad('T3336222976',11) +     // iswc @95
  pad('',30)

// SPU layout com seq_l=14 (detectado via seqFieldLen porque começa com letra/7 dígitos)
// [base=19] seq(14)|ipi(11)|nome(45)|unknown(1)|role(2)|tax_id(9)|cae_ipi(11)|submitter_id(14)|pr_soc(3)|pr_pct(5)|mr_soc(3)|mr_pct(5)
// parseSPU usa acumulador de posição → totalmente correto
const SPU1 =
  'SPU' + pad('00000001',8) + pad('00000001',8) +
  pad('ED01',14) +            // seq @19
  pad('00000000000',11) +     // ipi @33
  pad('EDI MUSIC EDITORA LTDA',45) + // nome @44
  'N' +                       // unknown @89
  'E ' +                      // role @90
  pad('000000000',9) +        // tax_id @92
  pad('00000000000',11) +     // cae_ipi @101
  pad('ED01',14) +            // submitter_id @112
  '021' +                     // pr_soc @126
  '01000' +                   // pr_pct @129 → 10.00%
  '021' +                     // mr_soc @134
  '01000'                     // mr_pct @137 → 10.00%

const SPU2 =
  'SPU' + pad('00000002',8) + pad('00000001',8) +
  pad('2646326',14) +
  pad('00000000000',11) +
  pad('TOP SHOW MUSIC LIMITADA - ME',45) +
  'N' + 'AM' +
  pad('000000000',9) +
  pad('00000000000',11) +
  pad('2646326',14) +
  '021' + '00250' +
  '021' + '00250'

// SWR layout com seq_l=14:
// [base=19] seq(14)|ipi(11)|last_name(45)|first_name(30)|unknown(1)|role(2)|tax_id(9)|reserved(4)|pr_soc(3)|pr_pct(5)|mr_soc(3)|mr_pct(5)
// parser usa: pr_pct @ 126 + off + extra = 126 + 0 + 12 = 138
// base(19) + seq_l(14) + ipi(11) + last(45) + first(30) + unk(1) + role(2) = 122 → gap=16 → pr_pct@138 ✓
const SWR1 =
  'SWR' + pad('00000001',8) + pad('00000001',8) +
  pad('DJ01',14) +            // seq @19
  pad('00000000000',11) +     // ipi @33
  pad('MULLER',45) +          // last_name @44
  pad('ARIOSTO PORTO',30) +   // first_name @89
  'N' +                       // unknown @119
  'CA' +                      // role @120
  pad('000000000',9) +        // tax_id @122 (9)
  pad('    ',4) +             // reserved @131 (4)
  '021' +                     // pr_soc @135 (3)  → gap total=16, pr_pct@138 ✓
  '03750' +                   // pr_pct @138 → 37.50%
  '021' +                     // mr_soc @143
  '03750'                     // mr_pct @146 → 37.50%

const SWR2 =
  'SWR' + pad('00000002',8) + pad('00000001',8) +
  pad('JD01',14) +
  pad('00000000000',11) +
  pad('GAVLIK',45) +
  pad('LUAN MARCELO',30) +
  'N' + 'CA' +
  pad('000000000',9) +
  pad('    ',4) +
  '021' + '03750' + '021' + '03750'

// PWR layout (off=0):
// [base=19] pub_ipi(11)|pub_code(14)|writer_ipi(11)|writer_code(14)
const PWR1 = 'PWR' + pad('00000001',8) + pad('00000001',8) + pad('00000000000',11) + pad('ED01',14)   + pad('00000000000',11) + pad('DJ01',14)
const PWR2 = 'PWR' + pad('00000002',8) + pad('00000001',8) + pad('00000000000',11) + pad('ED01',14)   + pad('00000000000',11) + pad('JD01',14)
const PWR3 = 'PWR' + pad('00000003',8) + pad('00000001',8) + pad('00000000000',11) + pad('2646326',14) + pad('00000000000',11) + pad('DJ01',14)
const PWR4 = 'PWR' + pad('00000004',8) + pad('00000001',8) + pad('00000000000',11) + pad('2646326',14) + pad('00000000000',11) + pad('JD01',14)

const content = [
  'HDR' + pad('01',8) + pad('TOPSHOW',3) + pad('TOP SHOW',45),
  'GRH0000000100000000NWR',
  NWR, SPU1, SPU2, SWR1, SWR2, PWR1, PWR2, PWR3, PWR4,
  'GRT0000000100000000',
  'TRL0000000000000001'
].join('\n')

// ── Debug posições ───────────────────────────────────────────────────────────
console.log('=== POSICOES DAS LINHAS ===')
content.split('\n').forEach(l => {
  const t = l.slice(0,3)
  if (!['SPU','SWR','PWR','NWR'].includes(t)) return
  console.log(`[${t}] len=${l.length}`)
  if (t === 'NWR') {
    console.log(`  titulo   @19 [${l.slice(19,31)}...]`)
    console.log(`  lang     @79 [${l.slice(79,81)}]`)
    console.log(`  codigo   @81 [${l.slice(81,95)}]`)
    console.log(`  iswc     @95 [${l.slice(95,106)}]`)
  }
  if (t === 'SPU') {
    console.log(`  seq      @19 [${l.slice(19,33)}]`)
    console.log(`  ipi      @33 [${l.slice(33,44)}]`)
    console.log(`  nome     @44 [${l.slice(44,56)}...]`)
    console.log(`  unknown  @89 [${l.slice(89,90)}]`)
    console.log(`  role     @90 [${l.slice(90,92)}]`)
    console.log(`  sub_id  @112 [${l.slice(112,126)}]`)
    console.log(`  pr_pct  @129 [${l.slice(129,134)}] (esperado 01000=10%)`)
  }
  if (t === 'SWR') {
    console.log(`  seq      @19 [${l.slice(19,33)}]`)
    console.log(`  ipi      @33 [${l.slice(33,44)}]`)
    console.log(`  last     @44 [${l.slice(44,56)}...]`)
    console.log(`  first    @89 [${l.slice(89,102)}...]`)
    console.log(`  unknown @119 [${l.slice(119,120)}]`)
    console.log(`  role    @120 [${l.slice(120,122)}]`)
    console.log(`  pr_pct  @138 [${l.slice(138,143)}] (esperado 03750=37.5%)`)
    console.log(`  mr_pct  @146 [${l.slice(146,151)}] (esperado 03750)`)
  }
  if (t === 'PWR') {
    console.log(`  pub_ipi  @19 [${l.slice(19,30)}]`)
    console.log(`  pub_code @30 [${l.slice(30,44)}]`)
    console.log(`  wrt_ipi  @44 [${l.slice(44,55)}]`)
    console.log(`  wrt_code @55 [${l.slice(55,69)}]`)
  }
})

// ── Rodar parser ─────────────────────────────────────────────────────────────
const result = parseCwr(content)
console.log('\n=== RESULTADO DO PARSER ===')
console.log(`offset detectado: ${result.offset_detectado} (esperado: 0)`)
console.log(`total obras: ${result.total_obras}`)
if (result.erros.length) console.log('erros:', result.erros)

result.obras.forEach(o => {
  console.log(`\n[${o.codigo.trim()}] "${o.titulo.trim()}" | ISWC: ${o.iswc.trim()}`)
  o.titulares.forEach(t => {
    const ok_pr = t.tipo === 'SPU'
      ? (t.pr_pct === 10 ? '✓' : `✗ esperado 10, got ${t.pr_pct}`)
      : (t.pr_pct === 37.5 ? '✓' : `✗ esperado 37.5, got ${t.pr_pct}`)
    console.log(`  ${t.tipo} [${t.submitter_code.trim()}] "${t.nome.trim()}" papel:${t.papel_cwr.trim()} pr:${t.pr_pct}% ${ok_pr} mr:${t.mr_pct}% ctrl:${t.controlado}`)
  })
  console.log('  PWRs:')
  o.pwr_links.forEach(p => console.log(`    [${(p.pub_code||p.pub_seq||'').trim()}] → [${p.writer_seq.trim()}]`))
})

// ── Verificações finais ──────────────────────────────────────────────────────
const obra = result.obras[0]
const checks = [
  { desc: 'offset=0',          ok: result.offset_detectado === 0 },
  { desc: '1 obra encontrada', ok: result.total_obras === 1 },
  { desc: 'codigo=AFW11',      ok: obra?.codigo.trim() === 'AFW11' },
  { desc: 'iswc=T3336222976',  ok: obra?.iswc.trim() === 'T3336222976' },
  { desc: 'SPU ED01 E 10%',    ok: obra?.titulares.some(t => t.submitter_code.trim()==='ED01' && t.papel_cwr.trim()==='E' && t.pr_pct===10) },
  { desc: 'SPU 2646326 AM 2.5%',ok: obra?.titulares.some(t => t.submitter_code.trim()==='2646326' && t.papel_cwr.trim()==='AM' && t.pr_pct===2.5) },
  { desc: 'SWR DJ01 CA 37.5%', ok: obra?.titulares.some(t => t.submitter_code.trim()==='DJ01' && t.papel_cwr.trim()==='CA' && t.pr_pct===37.5) },
  { desc: 'SWR JD01 CA 37.5%', ok: obra?.titulares.some(t => t.submitter_code.trim()==='JD01' && t.papel_cwr.trim()==='CA' && t.pr_pct===37.5) },
  { desc: 'PWR ED01→DJ01',     ok: obra?.pwr_links.some(p => (p.pub_code||p.pub_seq||'').trim()==='ED01' && p.writer_seq.trim()==='DJ01') },
  { desc: 'PWR ED01→JD01',     ok: obra?.pwr_links.some(p => (p.pub_code||p.pub_seq||'').trim()==='ED01' && p.writer_seq.trim()==='JD01') },
  { desc: 'PWR 2646326→DJ01',  ok: obra?.pwr_links.some(p => (p.pub_code||p.pub_seq||'').trim()==='2646326' && p.writer_seq.trim()==='DJ01') },
]
console.log('\n=== CHECKS ===')
let pass = 0, fail = 0
checks.forEach(c => {
  if (c.ok) { console.log(`  ✓ ${c.desc}`); pass++ }
  else       { console.log(`  ✗ ${c.desc}`); fail++ }
})
console.log(`\n${pass}/${checks.length} checks passou${fail > 0 ? ` — ${fail} FALHOU` : ' — TUDO OK'}`)
process.exit(fail > 0 ? 1 : 0)
