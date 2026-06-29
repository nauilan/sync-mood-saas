import { NextRequest } from 'next/server'
import { describe, expect, it, beforeEach, vi } from 'vitest'

import { generateCWR } from '@/lib/cwr-generator'
import { parseCwr } from '@/lib/cwr-parser'
import type { Obra, ObraLink } from '@/lib/types-obras'
import { DEFAULT_CWR_VERSION } from '@/lib/cwr-versions'
import { POST as createExportacao } from '@/app/api/exportacoes/route'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

type MockInsertRecord = Record<string, unknown>

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/exportacoes', {
    method: 'POST',
    headers: {
      authorization: 'Bearer token-teste',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

function makeSupabaseMock() {
  const exportacaoInserts: MockInsertRecord[] = []
  const exportacaoLogs: MockInsertRecord[] = []

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'usuarios') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'user-1', tenant_id: 'tenant-1', role: 'admin' },
                error: null,
              }),
            })),
          })),
        }
      }

      if (table === 'exportacoes') {
        return {
          insert: vi.fn((payload: MockInsertRecord) => {
            exportacaoInserts.push(payload)
            return {
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'exp-1',
                    codigo: 'EXP-20260629-120000',
                    destino: payload.destino,
                    formato: payload.formato,
                    cwr_version: payload.cwr_version,
                    status: 'rascunho',
                    total_obras: payload.total_obras,
                    criado_em: '2026-06-29T12:00:00.000Z',
                  },
                  error: null,
                }),
              })),
            }
          }),
        }
      }

      if (table === 'exportacoes_logs') {
        return {
          insert: vi.fn(async (payload: MockInsertRecord) => {
            exportacaoLogs.push(payload)
            return { error: null }
          }),
        }
      }

      if (table === 'obras') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            })),
          })),
        }
      }

      if (table === 'exportacoes_obras') {
        return {
          insert: vi.fn(async () => ({ error: null })),
        }
      }

      throw new Error(`Tabela mock não tratada: ${table}`)
    }),
  }

  return { client, exportacaoInserts, exportacaoLogs }
}

beforeEach(() => {
  vi.clearAllMocks()
})

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

describe('exportações CWR — fluxo real mínimo', () => {
  it('gera um lote com ELA NAO PARA e LEMBRANCA NOSSA preservando os pontos críticos', () => {
    const ela = makeObra('obra-ela', 'CWR-ELA', 'ELA NAO PARA', 'T-932925165-2')
    const lembranca = makeObra('obra-lembranca', 'CWR-LEMBRANCA', 'LEMBRANCA NOSSA', 'T-335753310-5')

    const obras: Array<{ obra: Obra; links: ObraLink[] }> = [
      {
        obra: ela,
        links: [
          makeLink('link-ela-1', ela.id, 1, true, 50, [
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
          makeLink('link-ela-2', ela.id, 2, false, 0, [
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
        ],
      },
      {
        obra: lembranca,
        links: [
          makeLink('link-l-1', lembranca.id, 1, true, 20, [
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
          makeLink('link-l-2', lembranca.id, 2, true, 20, [
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
          makeLink('link-l-3', lembranca.id, 3, false, 0, [
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
          makeLink('link-l-4', lembranca.id, 4, false, 0, [
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
          makeLink('link-l-5', lembranca.id, 5, false, 0, [
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
        ],
      },
    ]

    const generated = generateCWR({
      format: 'CWR',
      senderName: 'SYNC MOOD',
      obras,
    })

    expect(generated.stats.obras_incluidas).toBe(2)

    const parsed = parseCwr(generated.content)
    const elaExportada = parsed.obras.find((item) => item.titulo?.includes('ELA NAO PARA'))
    const lembrancaExportada = parsed.obras.find((item) => item.titulo?.includes('LEMBRANCA NOSSA'))

    expect(elaExportada).toBeTruthy()
    expect(elaExportada?.autores.map((autor) => ({ nome: autor.nome, controlled: autor.controlled, pr: autor.pr_pct }))).toEqual([
      { nome: 'JOSE APARECIDO AMORIM JUNIOR', controlled: true, pr: 37.5 },
      { nome: 'LUIS MIGUEL THIESEN KULCHESKI', controlled: false, pr: 50 },
    ])
    expect(elaExportada?.editoras.map((editora) => ({ nome: editora.nome, papel: editora.papel, pr: editora.pr_pct, mr: editora.mr_pct, sr: editora.sr_pct }))).toEqual([
      { nome: 'P3 EDITORA MUSICAL LTDA - ME', papel: 'E', pr: 6.25, mr: 0, sr: 0 },
      { nome: 'TOP SHOW MUSIC LIMITADA - ME', papel: 'AQ', pr: 6.25, mr: 50, sr: 50 },
    ])

    expect(lembrancaExportada).toBeTruthy()
    expect(lembrancaExportada?.autores.map((autor) => ({ nome: autor.nome, controlled: autor.controlled, pr: autor.pr_pct }))).toEqual([
      { nome: 'ARI ALEXANDRE DE PAIVA BRALESI', controlled: true, pr: 16 },
      { nome: 'PEDRO MANOEL CRISPIM DA SILVA', controlled: true, pr: 15 },
      { nome: 'CHRISTIAN RACHID VALEZI', controlled: false, pr: 20 },
      { nome: 'LUCAS JHONATAN DE CASTRO FERREIRA', controlled: false, pr: 20 },
      { nome: 'MATHEUS MARCHLEWSKI', controlled: false, pr: 20 },
    ])
    expect(lembrancaExportada?.pwr_links).toEqual([
      { writer_ip: '5', publisher_ip: 'ED01', publisher_nome: 'EDI MUSIC EDITORA LTDA' },
      { writer_ip: '26', publisher_ip: 'ED01', publisher_nome: 'EDI MUSIC EDITORA LTDA' },
    ])
  })

  it('usa CWR 2.1 por padrão quando o lote é criado sem versão explícita', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = makeSupabaseMock()
    vi.mocked(createClient).mockReturnValue(supabase.client as never)

    const response = await createExportacao(makeRequest({
      destino: 'cwr',
      formato: 'txt',
      obra_ids: [],
    }))

    expect(response.status).toBe(201)

    const payload = await response.json()
    expect(payload.data.cwr_version).toBe(DEFAULT_CWR_VERSION)
    expect(supabase.exportacaoInserts.at(-1)?.cwr_version).toBe(DEFAULT_CWR_VERSION)
    expect(supabase.exportacaoLogs.at(-1)?.dados_json).toEqual({
      destino: 'cwr',
      formato: 'txt',
      cwr_version: DEFAULT_CWR_VERSION,
      obra_ids: [],
    })
  })

  it('persiste CWR 2.2 quando a versão é informada na criação do lote', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = makeSupabaseMock()
    vi.mocked(createClient).mockReturnValue(supabase.client as never)

    const response = await createExportacao(makeRequest({
      destino: 'cwr',
      formato: 'txt',
      cwr_version: '2.2',
      obra_ids: [],
    }))

    expect(response.status).toBe(201)

    const payload = await response.json()
    expect(payload.data.cwr_version).toBe('2.2')
    expect(supabase.exportacaoInserts.at(-1)?.cwr_version).toBe('2.2')
  })

  it('rejeita versão CWR inválida na criação do lote', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = makeSupabaseMock()
    vi.mocked(createClient).mockReturnValue(supabase.client as never)

    const response = await createExportacao(makeRequest({
      destino: 'cwr',
      formato: 'txt',
      cwr_version: '3.0',
      obra_ids: [],
    }))

    expect(response.status).toBe(400)

    const payload = await response.json()
    expect(payload.error).toContain('Vers')
  })
})