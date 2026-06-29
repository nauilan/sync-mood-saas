import { describe, expect, it } from 'vitest'

import { generateCWR } from '@/lib/cwr-generator'
import { parseCwr } from '@/lib/cwr-parser'
import type { Obra, ObraLink } from '@/lib/types-obras'

function makeObra(id: string, codigo: string, titulo: string, iswc: string): Obra {
  const now = new Date().toISOString()
  return {
    id,
    codigo,
    titulo,
    iswc,
    idioma: 'PT',
    status: 'ativa',
    created_at: now,
    updated_at: now,
  }
}

function makeLink(
  id: string,
  obra_id: string,
  ordem: number,
  controlado: boolean,
  percentual_controlado: number,
  titulares: ObraLink['titulares']
): ObraLink {
  return {
    id,
    obra_id,
    ordem,
    controlado,
    percentual_controlado,
    titulares,
  }
}

describe('cwr generator export roundtrip', () => {
  it('exporta ELA NAO PARA preservando cadeia editorial correta', () => {
    const obra = makeObra('obra-ela', 'CWR-ELA', 'ELA NAO PARA', 'T-932925165-2')
    const links: ObraLink[] = [
      makeLink('link-ela-1', obra.id, 1, true, 50, [
        {
          id: 'jose',
          link_id: 'link-ela-1',
          titular_id: 'tit-jose',
          nome: 'JOSE APARECIDO AMORIM JUNIOR',
          papel: 'compositor',
          percentual: 37.5,
          percentual_exec_publica: 37.5,
          percentual_fonomecanico: 0,
          percentual_sincronizacao: 37.5,
          ipi: '1975871',
          controlado: true,
          pwr_writer_code: '58',
        },
        {
          id: 'p3',
          link_id: 'link-ela-1',
          titular_id: 'ed-p3',
          nome: 'P3 EDITORA MUSICAL LTDA - ME',
          papel: 'editora_original',
          percentual: 6.25,
          percentual_exec_publica: 6.25,
          percentual_fonomecanico: 0,
          percentual_sincronizacao: 0,
          ipi: '8961236',
          cae: 'P3',
          controlado: true,
          pwr_publisher_code: '8961236',
        },
        {
          id: 'topshow-1',
          link_id: 'link-ela-1',
          titular_id: 'ed-topshow',
          nome: 'TOP SHOW MUSIC LIMITADA - ME',
          papel: 'administradora',
          percentual: 6.25,
          percentual_exec_publica: 6.25,
          percentual_fonomecanico: 50,
          percentual_sincronizacao: 50,
          ipi: '2646326',
          cae: 'TOPSHOW',
          controlado: true,
          pwr_publisher_code: '2646326',
        },
      ]),
      makeLink('link-ela-2', obra.id, 2, false, 0, [
        {
          id: 'luis',
          link_id: 'link-ela-2',
          titular_id: 'tit-luis',
          nome: 'LUIS MIGUEL THIESEN KULCHESKI',
          papel: 'compositor',
          percentual: 50,
          percentual_exec_publica: 50,
          percentual_fonomecanico: 50,
          percentual_sincronizacao: 50,
          ipi: '6224513',
          controlado: false,
        },
      ]),
    ]

    const generated = generateCWR({
      format: 'CWR',
      senderName: 'SYNC MOOD',
      obras: [{ obra, links }],
    })
    const parsed = parseCwr(generated.content)
    const exported = parsed.obras.find((item) => item.titulo?.includes('ELA NAO PARA'))

    expect(exported).toBeTruthy()
    expect(exported?.autores.map((autor) => ({ nome: autor.nome, controlled: autor.controlled, pr: autor.pr_pct }))).toEqual([
      { nome: 'JOSE APARECIDO AMORIM JUNIOR', controlled: true, pr: 37.5 },
      { nome: 'LUIS MIGUEL THIESEN KULCHESKI', controlled: false, pr: 50 },
    ])
    expect(exported?.editoras.map((editora) => ({ nome: editora.nome, papel: editora.papel, pr: editora.pr_pct, mr: editora.mr_pct, sr: editora.sr_pct }))).toEqual([
      { nome: 'P3 EDITORA MUSICAL LTDA - ME', papel: 'E', pr: 6.25, mr: 0, sr: 0 },
      { nome: 'TOP SHOW MUSIC LIMITADA - ME', papel: 'AQ', pr: 6.25, mr: 50, sr: 50 },
    ])
    expect(exported?.pwr_links).toEqual([
      { writer_ip: '58', publisher_ip: '8961236', publisher_nome: 'P3 EDITORA MUSICAL LTDA - ME' },
    ])
  })

  it('exporta LEMBRANCA NOSSA sem rateio proporcional e com cadeias corretas', () => {
    const obra = makeObra('obra-lembranca', 'CWR-LEMBRANCA', 'LEMBRANCA NOSSA', 'T-335753310-5')
    const links: ObraLink[] = [
      makeLink('link-l-1', obra.id, 1, true, 20, [
        {
          id: 'ari',
          link_id: 'link-l-1',
          titular_id: 'tit-ari',
          nome: 'ARI ALEXANDRE DE PAIVA BRALESI',
          papel: 'compositor',
          percentual: 16,
          percentual_exec_publica: 16,
          percentual_fonomecanico: 0,
          percentual_sincronizacao: 16,
          ipi: '1961401',
          controlado: true,
          pwr_writer_code: '5',
        },
        {
          id: 'edi-1',
          link_id: 'link-l-1',
          titular_id: 'ed-edi',
          nome: 'EDI MUSIC EDITORA LTDA',
          papel: 'editora_original',
          percentual: 3.2,
          percentual_exec_publica: 3.2,
          percentual_fonomecanico: 0,
          percentual_sincronizacao: 0,
          ipi: '006969853',
          cae: 'ED01',
          controlado: true,
          pwr_publisher_code: 'ED01',
        },
        {
          id: 'topshow-l1',
          link_id: 'link-l-1',
          titular_id: 'ed-topshow',
          nome: 'TOP SHOW MUSIC LIMITADA - ME',
          papel: 'administradora',
          percentual: 0.8,
          percentual_exec_publica: 0.8,
          percentual_fonomecanico: 20,
          percentual_sincronizacao: 20,
          ipi: '2646326',
          cae: 'TOPSHOW',
          controlado: true,
          pwr_publisher_code: '2646326',
        },
      ]),
      makeLink('link-l-2', obra.id, 2, true, 20, [
        {
          id: 'pedro',
          link_id: 'link-l-2',
          titular_id: 'tit-pedro',
          nome: 'PEDRO MANOEL CRISPIM DA SILVA',
          papel: 'compositor',
          percentual: 15,
          percentual_exec_publica: 15,
          percentual_fonomecanico: 0,
          percentual_sincronizacao: 15,
          ipi: '262',
          controlado: true,
          pwr_writer_code: '26',
        },
        {
          id: 'edi-2',
          link_id: 'link-l-2',
          titular_id: 'ed-edi',
          nome: 'EDI MUSIC EDITORA LTDA',
          papel: 'editora_original',
          percentual: 4,
          percentual_exec_publica: 4,
          percentual_fonomecanico: 0,
          percentual_sincronizacao: 0,
          ipi: '006969853',
          cae: 'ED01',
          controlado: true,
          pwr_publisher_code: 'ED01',
        },
        {
          id: 'topshow-l2',
          link_id: 'link-l-2',
          titular_id: 'ed-topshow',
          nome: 'TOP SHOW MUSIC LIMITADA - ME',
          papel: 'administradora',
          percentual: 1,
          percentual_exec_publica: 1,
          percentual_fonomecanico: 20,
          percentual_sincronizacao: 20,
          ipi: '2646326',
          cae: 'TOPSHOW',
          controlado: true,
          pwr_publisher_code: '2646326',
        },
      ]),
      makeLink('link-l-3', obra.id, 3, false, 0, [
        {
          id: 'christian',
          link_id: 'link-l-3',
          titular_id: 'tit-christian',
          nome: 'CHRISTIAN RACHID VALEZI',
          papel: 'compositor',
          percentual: 20,
          percentual_exec_publica: 20,
          percentual_fonomecanico: 20,
          percentual_sincronizacao: 20,
          ipi: '9180713',
          controlado: false,
        },
      ]),
      makeLink('link-l-4', obra.id, 4, false, 0, [
        {
          id: 'lucas',
          link_id: 'link-l-4',
          titular_id: 'tit-lucas',
          nome: 'LUCAS JHONATAN DE CASTRO FERREIRA',
          papel: 'compositor',
          percentual: 20,
          percentual_exec_publica: 20,
          percentual_fonomecanico: 20,
          percentual_sincronizacao: 20,
          ipi: '4490045',
          controlado: false,
        },
      ]),
      makeLink('link-l-5', obra.id, 5, false, 0, [
        {
          id: 'matheus',
          link_id: 'link-l-5',
          titular_id: 'tit-matheus',
          nome: 'MATHEUS MARCHLEWSKI',
          papel: 'compositor',
          percentual: 20,
          percentual_exec_publica: 20,
          percentual_fonomecanico: 20,
          percentual_sincronizacao: 20,
          ipi: '6874589',
          controlado: false,
        },
      ]),
    ]

    const generated = generateCWR({
      format: 'CWR',
      senderName: 'SYNC MOOD',
      obras: [{ obra, links }],
    })
    const parsed = parseCwr(generated.content)
    const exported = parsed.obras.find((item) => item.titulo?.includes('LEMBRANCA NOSSA'))

    expect(exported).toBeTruthy()
    expect(exported?.autores.map((autor) => ({ nome: autor.nome, controlled: autor.controlled, pr: autor.pr_pct }))).toEqual([
      { nome: 'ARI ALEXANDRE DE PAIVA BRALESI', controlled: true, pr: 16 },
      { nome: 'PEDRO MANOEL CRISPIM DA SILVA', controlled: true, pr: 15 },
      { nome: 'CHRISTIAN RACHID VALEZI', controlled: false, pr: 20 },
      { nome: 'LUCAS JHONATAN DE CASTRO FERREIRA', controlled: false, pr: 20 },
      { nome: 'MATHEUS MARCHLEWSKI', controlled: false, pr: 20 },
    ])
    expect(exported?.editoras.map((editora) => ({ nome: editora.nome, papel: editora.papel, pr: editora.pr_pct, mr: editora.mr_pct, sr: editora.sr_pct }))).toEqual([
      { nome: 'EDI MUSIC EDITORA LTDA', papel: 'E', pr: 3.2, mr: 0, sr: 0 },
      { nome: 'TOP SHOW MUSIC LIMITADA - ME', papel: 'AQ', pr: 0.8, mr: 20, sr: 20 },
      { nome: 'EDI MUSIC EDITORA LTDA', papel: 'E', pr: 4, mr: 0, sr: 0 },
      { nome: 'TOP SHOW MUSIC LIMITADA - ME', papel: 'AQ', pr: 1, mr: 20, sr: 20 },
    ])
    expect(exported?.pwr_links).toEqual([
      { writer_ip: '5', publisher_ip: 'ED01', publisher_nome: 'EDI MUSIC EDITORA LTDA' },
      { writer_ip: '26', publisher_ip: 'ED01', publisher_nome: 'EDI MUSIC EDITORA LTDA' },
    ])
  })
})