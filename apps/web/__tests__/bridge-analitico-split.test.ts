import { describe, expect, it } from 'vitest'
import { executarBridge, type BridgeContexto } from '../lib/bridge-analitico'

describe('bridge analítico - split autor/editora original', () => {
  it('reparte autor bruto 33.34 em 26.67 autor e 6.67 editora original, fechando 100', () => {
    const ctx: BridgeContexto = {
      tenant_id: 'tenant',
      obra_id: 'obra',
      links: [{
        id: 'link-1',
        obra_id: 'obra',
        numero_link: 1,
        percentual_link: 100,
        tipo_link: 'manual',
        controlado: true,
        titulares: [
          {
            id: 'autor-controlado',
            obra_link_id: 'link-1',
            titular_id: 'tit-autor-controlado',
            editora_id: null,
            nome: 'Autor Controlado',
            funcao_no_link: 'CA',
            papel: 'compositor',
            percentual_exec_publica: 33.34,
            percentual_fonomecanico: 33.34,
            percentual_sincronizacao: 33.34,
            direitos_flexiveis: [],
            controlado: true,
            editora_original_id: null,
            editora_administradora_id: null,
            contrato_id: 'contrato-1',
          },
          {
            id: 'editora-original',
            obra_link_id: 'link-1',
            titular_id: 'tit-editora',
            editora_id: 'editora-1',
            nome: 'Editora Original',
            funcao_no_link: 'E',
            papel: 'editora_original',
            percentual_exec_publica: 0,
            percentual_fonomecanico: 0,
            percentual_sincronizacao: 0,
            direitos_flexiveis: [],
            controlado: true,
            editora_original_id: null,
            editora_administradora_id: null,
            contrato_id: 'contrato-1',
          },
          {
            id: 'autor-nao-controlado',
            obra_link_id: 'link-1',
            titular_id: 'tit-autor-nao-controlado',
            editora_id: null,
            nome: 'Autor Não Controlado',
            funcao_no_link: 'CA',
            papel: 'compositor',
            percentual_exec_publica: 66.66,
            percentual_fonomecanico: 66.66,
            percentual_sincronizacao: 66.66,
            direitos_flexiveis: [],
            controlado: false,
            editora_original_id: null,
            editora_administradora_id: null,
            contrato_id: null,
          },
        ],
      }],
      contratos_editoriais: [{
        id: 'contrato-1',
        titular_id: 'tit-autor-controlado',
        editora_id: null,
        percentual_editora: 20,
        percentual_autor: 80,
        splits_direitos: {
          repr_fonomecanica: {
            percentual_autor: 80,
            percentual_editora: 20,
            percentual_ed_original: 20,
            percentual_ed_adm: 0,
          },
        },
        data_inicio: '2026-01-01',
        data_fim: null,
        status: 'ativo',
        territorio: null,
      }],
      negocios_editoriais: [],
      cessoes: [],
      tipos_direito: [{ id: 'td-fono', codigo: 'repr_fonomecanica' }],
      territorios: ['BR'],
      competencia_inicio: new Date('2026-01-02'),
      competencia_fim: null,
      versao_calculo: 1,
    }

    const resultado = executarBridge(ctx)
    const autor = resultado.linhas.find(l => l.nome_participante === 'Autor Controlado')
    const editora = resultado.linhas.find(l => l.nome_participante === 'Editora Original')

    expect(autor?.percentual_sobre_obra).toBe(26.67)
    expect(editora?.percentual_sobre_obra).toBe(6.67)
    expect(resultado.soma_percentuais['repr_fonomecanica|BR']).toBe(100)
  })
})