import { describe, expect, it } from 'vitest'
import { classificarAutoresDedup, normalizarTextoDedup } from '../lib/obra-dedup'

describe('obra dedup', () => {
  it('normaliza título removendo acento, caixa e pontuação', () => {
    expect(normalizarTextoDedup('  Pésadelo!!! ')).toBe('pesadelo')
  })

  it('bloqueia duplicata exata quando o conjunto de autores é igual por nome civil/pseudônimo', () => {
    const existente = [
      { nomes: ['João da Silva', 'JOAOZINHO'] },
      { nomes: ['Maria Compositora'] },
    ]
    const novo = [
      { nomes: ['joaozinho'] },
      { nomes: ['Maria Compositora'] },
    ]

    expect(classificarAutoresDedup(novo, existente)).toBe('duplicata_exata')
  })

  it('classifica como homônima quando mesmo título tem autor comum e coautor diferente', () => {
    const existente = [
      { nomes: ['João da Silva', 'JOAOZINHO'] },
      { nomes: ['Maria Compositora'] },
    ]
    const novo = [
      { nomes: ['João da Silva'] },
      { nomes: ['Outro Coautor'] },
    ]

    expect(classificarAutoresDedup(novo, existente)).toBe('homonima')
  })

  it('não bloqueia quando mesmo título não tem autor em comum', () => {
    const existente = [{ nomes: ['Autor A'] }]
    const novo = [{ nomes: ['Autor B'] }]

    expect(classificarAutoresDedup(novo, existente)).toBe('nenhum')
  })
})