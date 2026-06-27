/**
 * lib/__tests__/cwr-audit.test.ts
 * Auditoria do parser corrigido contra o arquivo CWR real.
 * Executar: npx vitest run lib/__tests__/cwr-audit.test.ts --reporter=verbose
 */

import { describe, it, expect } from 'vitest'
import { parseCwr } from '../cwr-parser'
import * as fs from 'fs'
import * as path from 'path'

const CWR_FILE = 'C:\\Users\\Usuário\\Downloads\\cwr\\CW260020TSL_189.V21'
const FILE_EXISTS = fs.existsSync(CWR_FILE)

function lerArquivo(): string | null {
  try {
    return fs.readFileSync(CWR_FILE, 'latin1')
  } catch {
    return null
  }
}

describe.skipIf(!FILE_EXISTS)('Auditoria CWR real — parser corrigido', () => {
  const conteudo = lerArquivo()
  const skip = !conteudo

  it('arquivo CWR existe e é legível', () => {
    expect(conteudo, 'Arquivo CWR não encontrado em ' + CWR_FILE).not.toBeNull()
  })

  it('parse sem erros críticos', { skip }, () => {
    const r = parseCwr(conteudo!)
    console.log('\n══════════════════════════════════════════')
    console.log('RELATÓRIO DE AUDITORIA — PARSER CWR CORRIGIDO')
    console.log('══════════════════════════════════════════')
    console.log(`Versão CWR detectada : ${r.versao || '(não detectada)'}`)
    console.log(`Sender               : ${r.sender || '(vazio)'}`)
    console.log(`Data criação         : ${r.data_criacao || '(vazio)'}`)
    console.log(`Total de linhas      : ${r.total_records}`)
    console.log(`Erros de parse       : ${r.erros_parse.length}`)
    if (r.erros_parse.length > 0) {
      r.erros_parse.slice(0, 5).forEach(e => console.log('  ERR:', e))
    }
    console.log('──────────────────────────────────────────')

    // Contadores
    const obras = r.obras
    const comIswc      = obras.filter(o => o.iswc)
    const comAutores   = obras.filter(o => o.autores.length > 0)
    const comEditoras  = obras.filter(o => o.editoras.length > 0)
    const comFonograma = obras.filter(o => o.fonogramas.length > 0)

    // Qualidade autores
    const todosAutores = obras.flatMap(o => o.autores)
    const autoresComIpi     = todosAutores.filter(a => a.ipi)
    const autoresComNome    = todosAutores.filter(a => a.nome && a.nome.trim().length > 0)
    const autoresComPapel   = todosAutores.filter(a => a.papel && a.papel.trim().length > 0)
    const autoresPercentOk  = todosAutores.filter(a => a.pr_pct >= 0 && a.pr_pct <= 100)
    const autoresPercentNok = todosAutores.filter(a => a.pr_pct > 100)

    // Qualidade editoras
    const todasEditoras = obras.flatMap(o => o.editoras)
    const editorasComIpi    = todasEditoras.filter(e => e.ipi)
    const editorasComNome   = todasEditoras.filter(e => e.nome && e.nome.trim().length > 0)

    // Fonogramas
    const todosFonogramas = obras.flatMap(o => o.fonogramas)
    const fonogramasComIsrc = todosFonogramas.filter(f => f.isrc)

    console.log('OBRAS')
    console.log(`  Total obras lidas     : ${obras.length}`)
    console.log(`  Com ISWC             : ${comIswc.length} (${pct(comIswc.length, obras.length)})`)
    console.log(`  Com autores          : ${comAutores.length} (${pct(comAutores.length, obras.length)})`)
    console.log(`  Com editoras         : ${comEditoras.length} (${pct(comEditoras.length, obras.length)})`)
    console.log(`  Com fonogramas       : ${comFonograma.length} (${pct(comFonograma.length, obras.length)})`)
    console.log('AUTORES')
    console.log(`  Total registros      : ${todosAutores.length}`)
    console.log(`  Com nome válido      : ${autoresComNome.length} (${pct(autoresComNome.length, todosAutores.length)})`)
    console.log(`  Com papel            : ${autoresComPapel.length} (${pct(autoresComPapel.length, todosAutores.length)})`)
    console.log(`  Com IPI              : ${autoresComIpi.length} (${pct(autoresComIpi.length, todosAutores.length)})`)
    console.log(`  % PR válido (0-100%) : ${autoresPercentOk.length} (${pct(autoresPercentOk.length, todosAutores.length)})`)
    console.log(`  % PR INVÁLIDO (>100%): ${autoresPercentNok.length}`)
    console.log('EDITORAS')
    console.log(`  Total registros      : ${todasEditoras.length}`)
    console.log(`  Com nome válido      : ${editorasComNome.length} (${pct(editorasComNome.length, todasEditoras.length)})`)
    console.log(`  Com IPI              : ${editorasComIpi.length} (${pct(editorasComIpi.length, todasEditoras.length)})`)
    console.log('FONOGRAMAS')
    console.log(`  Total registros      : ${todosFonogramas.length}`)
    console.log(`  Com ISRC             : ${fonogramasComIsrc.length} (${pct(fonogramasComIsrc.length, todosFonogramas.length)})`)

    // Amostra das primeiras 5 obras
    console.log('──────────────────────────────────────────')
    console.log('AMOSTRA — primeiras 5 obras:')
    obras.slice(0, 5).forEach((o, i) => {
      console.log(`  [${i + 1}] "${o.titulo}" | SWN: ${o.submitter_work_no} | ISWC: ${o.iswc ?? 'null'}`)
      o.autores.slice(0, 2).forEach(a =>
        console.log(`       Autor: "${a.nome}" | papel: ${a.papel} | IPI: ${a.ipi ?? 'null'} | PR: ${a.pr_pct}%`)
      )
      o.editoras.slice(0, 1).forEach(e =>
        console.log(`       Editora: "${e.nome}" | IPI: ${e.ipi ?? 'null'} | PR: ${e.pr_pct}%`)
      )
      if (o.iswc) console.log(`       ISWC: ${o.iswc}`)
      if (o.fonogramas.some(f => f.isrc)) {
        o.fonogramas.filter(f => f.isrc).slice(0, 1).forEach(f =>
          console.log(`       ISRC: ${f.isrc} | intérprete: ${f.interprete ?? 'null'}`)
        )
      }
    })

    // Diagnóstico de autores com percentual inválido
    if (autoresPercentNok.length > 0) {
      console.log('──────────────────────────────────────────')
      console.log('ATENÇÃO — autores com PR% > 100 (primeiros 3):')
      autoresPercentNok.slice(0, 3).forEach(a =>
        console.log(`  "${a.nome}" | PR: ${a.pr_pct}%`)
      )
    }

    console.log('══════════════════════════════════════════\n')

    // Asserções de qualidade mínima
    expect(obras.length).toBeGreaterThan(0)
    expect(autoresPercentNok.length).toBe(0) // ZERO percentuais inválidos
    expect(r.erros_parse.length).toBeLessThan(obras.length * 0.05) // < 5% erro
  })

  it('ISWC corretamente formatado quando presente', { skip }, () => {
    const r = parseCwr(conteudo!)
    const comIswc = r.obras.filter(o => o.iswc)
    comIswc.slice(0, 10).forEach(o => {
      expect(o.iswc).toMatch(/^T-\d{9}-\d$/)
    })
  })

  it('nenhum autor com PR% > 100', { skip }, () => {
    const r = parseCwr(conteudo!)
    const invalidos = r.obras.flatMap(o => o.autores).filter(a => a.pr_pct > 100)
    expect(invalidos).toHaveLength(0)
  })

  it('designações de papel são valores CWR válidos', { skip }, () => {
    const PAPEIS_VALIDOS = new Set(['CA', 'C', 'A', 'AR', 'E', 'ES', 'AE', 'SE', 'PA', 'TR', 'AD', 'AM', 'MO', ''])
    const r = parseCwr(conteudo!)
    const invalidos = r.obras
      .flatMap(o => o.autores)
      .filter(a => a.papel && !PAPEIS_VALIDOS.has(a.papel))
    if (invalidos.length > 0) {
      console.log('Papéis não reconhecidos:', [...new Set(invalidos.map(a => a.papel))])
    }
    expect(invalidos.length).toBeLessThan(10) // tolerância mínima
  })
})

function pct(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((n / total) * 100)}%`
}
