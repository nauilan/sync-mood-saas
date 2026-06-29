import { describe, expect, it } from 'vitest'

import {
  hasCompleteEditorialChain,
  previewLinksFromSnapshot,
} from '@/lib/cwr-materialization'

const elaNaoParaSnapshot = {
  titulo: 'ELA NAO PARA',
  iswc: 'T-932925165-2',
  autores: [
    {
      nome: 'JOSE APARECIDO AMORIM JUNIOR',
      papel: 'CA',
      pr_pct: 37.5,
      mr_pct: 37.5,
      sr_pct: 37.5,
      ipi_nome: '1975871',
      controlled: true,
    },
    {
      nome: 'LUIS MIGUEL THIESEN KULCHESKI',
      papel: 'CA',
      pr_pct: 50,
      mr_pct: 50,
      sr_pct: 50,
      ipi_nome: '6224513',
      controlled: false,
    },
  ],
  editoras: [
    {
      nome: 'P3 EDITORA MUSICAL LTDA - ME',
      tipo: 'E',
      papel: 'E',
      pr_pct: 6.25,
      mr_pct: 0,
      sr_pct: 0,
      ip_name_no: '8961236',
      controlled: true,
    },
    {
      nome: 'TOP SHOW MUSIC LIMITADA - ME',
      tipo: 'AM',
      papel: 'AM',
      pr_pct: 6.25,
      mr_pct: 50,
      sr_pct: 50,
      ipi: '003726806',
      ip_name_no: '2646326',
      controlled: true,
    },
  ],
  pwr_links: [
    {
      writer_ip: '58',
      publisher_ip: '8961236',
      publisher_nome: 'P3 EDITORA MUSICAL LTDA - ME',
    },
  ],
}

const lembrancaNossaSnapshot = {
  titulo: 'LEMBRANCA NOSSA',
  iswc: 'T-335753310-5',
  autores: [
    {
      nome: 'ARI ALEXANDRE DE PAIVA BRALESI',
      papel: 'CA',
      pr_pct: 16,
      mr_pct: 16,
      sr_pct: 16,
      ipi_nome: '1961401',
      controlled: true,
    },
    {
      nome: 'PEDRO MANOEL CRISPIM DA SILVA',
      papel: 'CA',
      pr_pct: 15,
      mr_pct: 15,
      sr_pct: 15,
      ipi_nome: '262',
      controlled: true,
    },
    {
      nome: 'CHRISTIAN RACHID VALEZI',
      papel: 'CA',
      pr_pct: 20,
      mr_pct: 20,
      sr_pct: 20,
      ipi_nome: '9180713',
      controlled: false,
    },
    {
      nome: 'LUCAS JHONATAN DE CASTRO FERREIRA',
      papel: 'CA',
      pr_pct: 20,
      mr_pct: 20,
      sr_pct: 20,
      ipi_nome: '4490045',
      controlled: false,
    },
    {
      nome: 'MATHEUS MARCHLEWSKI',
      papel: 'CA',
      pr_pct: 20,
      mr_pct: 20,
      sr_pct: 20,
      ipi_nome: '6874589',
      controlled: false,
    },
  ],
  editoras: [
    {
      nome: 'EDI MUSIC EDITORA LTDA',
      tipo: 'E',
      papel: 'E',
      pr_pct: 3.2,
      mr_pct: 0,
      sr_pct: 0,
      ipi: '006969853',
      ip_name_no: 'ED01',
      controlled: true,
    },
    {
      nome: 'TOP SHOW MUSIC LIMITADA - ME',
      tipo: 'AM',
      papel: 'AM',
      pr_pct: 0.8,
      mr_pct: 20,
      sr_pct: 20,
      ipi: '003726806',
      ip_name_no: '2646326',
      controlled: true,
    },
    {
      nome: 'EDI MUSIC EDITORA LTDA',
      tipo: 'E',
      papel: 'E',
      pr_pct: 4,
      mr_pct: 0,
      sr_pct: 0,
      ipi: '006969853',
      ip_name_no: 'ED01',
      controlled: true,
    },
    {
      nome: 'TOP SHOW MUSIC LIMITADA - ME',
      tipo: 'AM',
      papel: 'AM',
      pr_pct: 1,
      mr_pct: 20,
      sr_pct: 20,
      ipi: '003726806',
      ip_name_no: '2646326',
      controlled: true,
    },
  ],
  pwr_links: [
    {
      writer_ip: '5',
      publisher_ip: 'ED01',
      publisher_nome: 'EDI MUSIC EDITORA LTDA',
    },
    {
      writer_ip: '26',
      publisher_ip: 'ED01',
      publisher_nome: 'EDI MUSIC EDITORA LTDA',
    },
  ],
}

describe('cwr materialization preview', () => {
  it('detecta cadeia editorial completa no snapshot', () => {
    expect(hasCompleteEditorialChain(elaNaoParaSnapshot)).toBe(true)
    expect(hasCompleteEditorialChain(lembrancaNossaSnapshot)).toBe(true)
  })

  it('monta ELA NAO PARA com 2 links e participantes corretos', () => {
    const links = previewLinksFromSnapshot(elaNaoParaSnapshot)

    expect(links).toHaveLength(2)
    expect(links.map((link) => link.percentual_link)).toEqual([50, 50])

    expect(links[0].participantes.map((item) => item.nome)).toEqual([
      'JOSE APARECIDO AMORIM JUNIOR',
      'P3 EDITORA MUSICAL LTDA - ME',
      'TOP SHOW MUSIC LIMITADA - ME',
    ])
    expect(links[1].participantes.map((item) => item.nome)).toEqual([
      'LUIS MIGUEL THIESEN KULCHESKI',
    ])
  })

  it('monta LEMBRANCA NOSSA com 5 links e sem rateio 20,65/19,35', () => {
    const links = previewLinksFromSnapshot(lembrancaNossaSnapshot)

    expect(links).toHaveLength(5)
    expect(links.map((link) => link.percentual_link)).toEqual([20, 20, 20, 20, 20])

    expect(links[0].participantes.map((item) => item.nome)).toEqual([
      'ARI ALEXANDRE DE PAIVA BRALESI',
      'EDI MUSIC EDITORA LTDA',
      'TOP SHOW MUSIC LIMITADA - ME',
    ])
    expect(links[1].participantes.map((item) => item.nome)).toEqual([
      'PEDRO MANOEL CRISPIM DA SILVA',
      'EDI MUSIC EDITORA LTDA',
      'TOP SHOW MUSIC LIMITADA - ME',
    ])
    expect(links[2].participantes.map((item) => item.nome)).toEqual(['CHRISTIAN RACHID VALEZI'])
    expect(links[3].participantes.map((item) => item.nome)).toEqual(['LUCAS JHONATAN DE CASTRO FERREIRA'])
    expect(links[4].participantes.map((item) => item.nome)).toEqual(['MATHEUS MARCHLEWSKI'])
  })
})