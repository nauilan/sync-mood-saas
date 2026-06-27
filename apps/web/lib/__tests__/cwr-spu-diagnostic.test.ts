/**
 * Diagnóstico SPU — identifica posições exatas dos campos no registro real.
 * Teste local: só roda quando o arquivo CWR existir na máquina do desenvolvedor.
 */
import { describe, it } from 'vitest'
import * as fs from 'fs'

const CWR_FILE = 'C:\\Users\\Usuário\\Downloads\\cwr\\CW260020TSL_189.V21'
const FILE_EXISTS = fs.existsSync(CWR_FILE)

describe.skipIf(!FILE_EXISTS)('SPU Diagnóstico de posições', () => {
  it('imprime campos SPU char a char', () => {
    const raw = fs.readFileSync(CWR_FILE, 'latin1')
    const linhas = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
    const spuLines = linhas.filter(l => l.startsWith('SPU')).slice(0, 3)

    for (const ln of spuLines) {
      const nome = ln.substring(30, 75).trim()
      console.log('\n══════════════════════════════════════════')
      console.log(`Editora: ${nome} | tamanho=${ln.length}`)

      // Localizar "I-" no string (regex)
      const ipiMatch = ln.match(/I-(\d{9})-\d/)
      const ipiPos = ipiMatch ? ln.indexOf(ipiMatch[0]) : -1
      console.log(`IPI Base localizado em pos ${ipiPos}: "${ipiMatch?.[0]}"`)

      // Localizar "189" (típico de sociedade SOCINPRO)
      const soc189 = ln.indexOf('189')
      console.log(`Primeira ocorrência "189" em pos ${soc189}`)

      // Localizar o bloco de shares "189xxxxx189xxxxx189xxxxx"
      const sharesMatch = ln.match(/189\d{5}/)
      const sharesPos = sharesMatch ? ln.indexOf(sharesMatch[0]) : -1
      console.log(`Bloco 189xxxxx localizado em pos ${sharesPos}`)

      if (sharesPos > 0) {
        const sp = sharesPos
        console.log(`\nA partir de pos ${sp} (PR Society+Share group):`)
        console.log(`  [${sp}-${sp+2}] PR Society : "${ln.substring(sp, sp+3)}"`)
        console.log(`  [${sp+3}-${sp+7}] PR Share  : "${ln.substring(sp+3, sp+8)}" → ${parseInt(ln.substring(sp+3, sp+8).replace(/\D/g,'') || '0') / 100}%`)
        console.log(`  [${sp+8}-${sp+10}] MR Society: "${ln.substring(sp+8, sp+11)}"`)
        console.log(`  [${sp+11}-${sp+15}] MR Share  : "${ln.substring(sp+11, sp+16)}" → ${parseInt(ln.substring(sp+11, sp+16).replace(/\D/g,'') || '0') / 100}%`)
        console.log(`  [${sp+16}-${sp+18}] SR Society: "${ln.substring(sp+16, sp+19)}"`)
        console.log(`  [${sp+19}-${sp+23}] SR Share  : "${ln.substring(sp+19, sp+24)}" → ${parseInt(ln.substring(sp+19, sp+24).replace(/\D/g,'') || '0') / 100}%`)
        console.log(`  [${sp+24}-${sp+26}] Flags     : "${ln.substring(sp+24, sp+27)}"`)
        if (ipiPos > 0) {
          console.log(`  [${ipiPos}] IPI Base  : "${ln.substring(ipiPos, ipiPos+13)}"`)
        }
      }

      // Print linha inteira com marcadores de posição
      console.log('\n--- LINHA COMPLETA (caracter a caracter) ---')
      for (let i = 0; i < Math.min(ln.length, 185); i += 20) {
        const chunk = ln.substring(i, i+20)
        console.log(`pos ${String(i).padStart(3)}: [${chunk}]`)
      }
    }
  })
})

