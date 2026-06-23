/**
 * __tests__/contrato-integridade.test.ts
 *
 * Testes unitários das regras de integridade contratual.
 * Cobre: detectarCamposCriticos · extrairLetraDaLegal
 *        validarArquivoContrato · filtrarObrasBloqueadas
 */
import { describe, it, expect } from 'vitest'
import {
  detectarCamposCriticos,
  extrairLetraDaLegal,
  validarArquivoContrato,
  filtrarObrasBloqueadas,
  TAMANHO_MAXIMO_BYTES,
  type ObraResumo,
} from '../lib/contrato-integridade'

// ─────────────────────────────────────────────────────────────────────────────
// detectarCamposCriticos
// ─────────────────────────────────────────────────────────────────────────────
describe('detectarCamposCriticos', () => {
  it('detecta alteração no título', () => {
    const campos = detectarCamposCriticos(
      { titulo: 'Novo Título' },
      { titulo: 'Título Antigo' },
    )
    expect(campos).toEqual(['titulo'])
  })

  it('detecta múltiplos campos críticos de uma vez', () => {
    const campos = detectarCamposCriticos(
      { titulo: 'Novo', subtitulo: 'Sub Novo', letra: 'Letra nova' },
      { titulo: 'Antigo', subtitulo: 'Sub Antigo', letra: 'Letra antiga' },
    )
    expect(campos).toContain('titulo')
    expect(campos).toContain('subtitulo')
    expect(campos).toContain('letra')
    expect(campos).toHaveLength(3)
  })

  it('não dispara quando campo crítico não mudou', () => {
    const campos = detectarCamposCriticos(
      { titulo: 'Mesmo Título' },
      { titulo: 'Mesmo Título' },
    )
    expect(campos).toHaveLength(0)
  })

  it('não dispara para campos não-críticos (ex: iswc, status)', () => {
    const campos = detectarCamposCriticos(
      { iswc: 'T-123456789-1', status: 'ativa' },
      { iswc: null, status: 'pre_cadastro' },
    )
    expect(campos).toHaveLength(0)
  })

  it('detecta alteração em titulo_alternativo', () => {
    const campos = detectarCamposCriticos(
      { titulo_alternativo: 'Alt Novo' },
      { titulo_alternativo: '' },
    )
    expect(campos).toEqual(['titulo_alternativo'])
  })

  it('trata campo ausente no anterior como string vazia', () => {
    // anterior não tem "letra" — equivale a '' — update insere valor
    const campos = detectarCamposCriticos(
      { letra: 'Primeira estrofe\nSegunda estrofe' },
      {},
    )
    expect(campos).toEqual(['letra'])
  })

  it('não dispara quando update define mesmo valor que anterior', () => {
    const campos = detectarCamposCriticos(
      { subtitulo: 'Ao Vivo' },
      { subtitulo: 'Ao Vivo' },
    )
    expect(campos).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// extrairLetraDaLegal
// ─────────────────────────────────────────────────────────────────────────────
describe('extrairLetraDaLegal', () => {
  it('retorna string vazia para texto vazio', () => {
    expect(extrairLetraDaLegal('')).toBe('')
  })

  it('retorna string vazia para texto puramente jurídico', () => {
    const jurídico = [
      'CONTRATO DE CESSÃO DE DIREITOS AUTORAIS',
      '1. CONSIDERANDO que as partes acordaram...',
      'CLÁUSULA PRIMEIRA — Das Obrigações',
      '2. O OUTORGANTE cede todos os direitos',
    ].join('\n')
    expect(extrairLetraDaLegal(jurídico)).toBe('')
  })

  it('extrai bloco de letra quando há pelo menos 4 linhas curtas', () => {
    const texto = [
      'CONTRATO DE CESSÃO',
      'CLÁUSULA PRIMEIRA',
      '',
      'Letra da música:',
      '',
      'Quando a noite cai',
      'E o vento traz saudade',
      'Eu penso em você',
      'Lá do outro lado',
      '',
      'CLÁUSULA SEGUNDA',
    ].join('\n')
    const resultado = extrairLetraDaLegal(texto)
    expect(resultado).toContain('Quando a noite cai')
    expect(resultado).toContain('Eu penso em você')
    expect(resultado).not.toContain('CLÁUSULA')
  })

  it('ignora blocos com menos de 4 linhas', () => {
    const texto = [
      'Linha um',
      'Linha dois',
      'Linha três',
      '',
      'Texto jurídico CONTRATO',
    ].join('\n')
    // Bloco de 3 linhas — não deve ser retornado
    expect(extrairLetraDaLegal(texto)).toBe('')
  })

  it('prefere o bloco mais longo quando há múltiplos candidatos', () => {
    const texto = [
      // Bloco curto (4 linhas)
      'Estrofe curta linha 1',
      'Estrofe curta linha 2',
      'Estrofe curta linha 3',
      'Estrofe curta linha 4',
      '',
      'INSTRUMENTO PARTICULAR',
      '',
      // Bloco longo (7 linhas)
      'Verso longo um',
      'Verso longo dois',
      'Verso longo três',
      'Verso longo quatro',
      'Verso longo cinco',
      'Verso longo seis',
      'Verso longo sete',
    ].join('\n')
    const resultado = extrairLetraDaLegal(texto)
    expect(resultado).toContain('Verso longo um')
    expect(resultado).not.toContain('Estrofe curta linha 1')
  })

  it('normaliza quebras de linha Windows (\\r\\n)', () => {
    const texto = 'Linha 1\r\nLinha 2\r\nLinha 3\r\nLinha 4\r\nLinha 5\r\n'
    const resultado = extrairLetraDaLegal(texto)
    expect(resultado).toContain('Linha 1')
    expect(resultado.split('\n')).toHaveLength(5)
  })

  it('ignora linhas que iniciam com numeração de cláusula (ex: "1. ")', () => {
    const texto = [
      '1. Esta cláusula define',
      '2. Os direitos cedidos',
      'Mas isso é letra',
      'E isso também',
      'E mais uma linha',
      'E a quarta linha',
    ].join('\n')
    const resultado = extrairLetraDaLegal(texto)
    expect(resultado).not.toContain('1. Esta')
    expect(resultado).toContain('Mas isso é letra')
  })

  it('inclui o último bloco mesmo sem linha em branco final', () => {
    // Sem \n ao final do texto
    const linhas = Array.from({ length: 5 }, (_, i) => `Linha ${i + 1}`)
    const texto = linhas.join('\n') // sem \n final
    const resultado = extrairLetraDaLegal(texto)
    expect(resultado).toContain('Linha 1')
    expect(resultado).toContain('Linha 5')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// validarArquivoContrato
// ─────────────────────────────────────────────────────────────────────────────
describe('validarArquivoContrato', () => {
  it('aceita PDF dentro do limite', () => {
    const resultado = validarArquivoContrato('application/pdf', 1024 * 1024)
    expect(resultado.ok).toBe(true)
  })

  it('aceita DOCX dentro do limite', () => {
    const tipo = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    const resultado = validarArquivoContrato(tipo, 5 * 1024 * 1024)
    expect(resultado.ok).toBe(true)
  })

  it('rejeita tipo não permitido (ex: image/png)', () => {
    const resultado = validarArquivoContrato('image/png', 1024)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.status).toBe(400)
      expect(resultado.erro).toMatch(/PDF|DOCX/i)
    }
  })

  it('rejeita arquivo acima do limite de 20 MB', () => {
    const resultado = validarArquivoContrato('application/pdf', TAMANHO_MAXIMO_BYTES + 1)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.status).toBe(400)
      expect(resultado.erro).toMatch(/20 MB/)
    }
  })

  it('aceita arquivo exatamente no limite de 20 MB', () => {
    const resultado = validarArquivoContrato('application/pdf', TAMANHO_MAXIMO_BYTES)
    expect(resultado.ok).toBe(true)
  })

  it('rejeita HTML mesmo com tamanho válido', () => {
    const resultado = validarArquivoContrato('text/html', 500)
    expect(resultado.ok).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// filtrarObrasBloqueadas
// ─────────────────────────────────────────────────────────────────────────────
describe('filtrarObrasBloqueadas', () => {
  const obras: ObraResumo[] = [
    { id: '1', titulo: 'Obra OK',         exportacao_bloqueada: false },
    { id: '2', titulo: 'Sem Contrato',    exportacao_bloqueada: true,  exportacao_bloqueio_motivo: 'CWR sem contrato' },
    { id: '3', titulo: 'Recontratação',   exportacao_bloqueada: true,  exportacao_bloqueio_motivo: 'Edição de campo crítico: titulo' },
    { id: '4', titulo: 'Outra OK',        exportacao_bloqueada: false },
    { id: '5', titulo: 'Sem flag',        exportacao_bloqueada: undefined },
  ]

  it('retorna apenas obras com exportacao_bloqueada=true', () => {
    const bloqueadas = filtrarObrasBloqueadas(obras)
    expect(bloqueadas).toHaveLength(2)
    expect(bloqueadas.map(o => o.id)).toEqual(['2', '3'])
  })

  it('retorna array vazio se nenhuma obra está bloqueada', () => {
    const livres: ObraResumo[] = [
      { id: 'a', exportacao_bloqueada: false },
      { id: 'b', exportacao_bloqueada: false },
    ]
    expect(filtrarObrasBloqueadas(livres)).toHaveLength(0)
  })

  it('retorna array vazio para lista de obras vazia', () => {
    expect(filtrarObrasBloqueadas([])).toHaveLength(0)
  })

  it('preserva o motivo do bloqueio nas obras retornadas', () => {
    const bloqueadas = filtrarObrasBloqueadas(obras)
    const obr2 = bloqueadas.find(o => o.id === '2')
    expect(obr2?.exportacao_bloqueio_motivo).toBe('CWR sem contrato')
  })

  it('trata exportacao_bloqueada=undefined como não bloqueada', () => {
    const bloqueadas = filtrarObrasBloqueadas(obras)
    expect(bloqueadas.map(o => o.id)).not.toContain('5')
  })
})
