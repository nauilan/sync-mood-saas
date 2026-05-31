// ============================================================
// mock-cadastros.ts — Dados de demonstracao M1 Cadastros
// Sync Mood Gestao Inteligente — DEMO_MODE
// ============================================================

import type {
  EditoraAdministrada,
  TitularComDados,
  TitularPessoaFisica,
  TitularPessoaJuridica,
  TitularFuncao,
  TitularPseudonimo,
  TitularEndereco,
  TitularContato,
  TitularDadosBancarios,
} from './types-cadastros'

// ============================================================
// EDITORAS ADMINISTRADAS
// ============================================================

export const MOCK_EDITORAS: EditoraAdministrada[] = [
  {
    id: 'ed-tsm',
    codigo: 'TSM',
    razao_social: 'Top Show Music Edicoes Musicais Ltda',
    nome_fantasia: 'Top Show Music',
    cnpj: '11.111.111/0001-11',
    logo_url: null,
    ativa: true,
    administradora_id: null, // E a administradora raiz
    created_at: '2020-01-15T10:00:00Z',
    _titulares: 9,
    _obras: 48,
    _contratos: 12,
  },
  {
    id: 'ed-edi',
    codigo: 'EDI',
    razao_social: 'Edi Music Edicoes Musicais Ltda',
    nome_fantasia: 'Edi Music',
    cnpj: '22.222.222/0001-22',
    logo_url: null,
    ativa: true,
    administradora_id: 'ed-tsm',
    created_at: '2021-03-10T10:00:00Z',
    _titulares: 14,
    _obras: 31,
    _contratos: 8,
  },
  {
    id: 'ed-lr',
    codigo: 'LR',
    razao_social: 'LR Edicoes Musicais Ltda',
    nome_fantasia: 'LR Edicoes Musicais',
    cnpj: '33.333.333/0001-33',
    logo_url: null,
    ativa: true,
    administradora_id: 'ed-tsm',
    created_at: '2021-06-20T10:00:00Z',
    _titulares: 7,
    _obras: 19,
    _contratos: 5,
  },
  {
    id: 'ed-p3',
    codigo: 'P3',
    razao_social: 'P3 Editora Musical Ltda',
    nome_fantasia: 'P3 Editora Musical',
    cnpj: '44.444.444/0001-44',
    logo_url: null,
    ativa: true,
    administradora_id: 'ed-tsm',
    created_at: '2022-01-05T10:00:00Z',
    _titulares: 5,
    _obras: 11,
    _contratos: 3,
  },
  {
    id: 'ed-lamu',
    codigo: 'LAMU',
    razao_social: 'Editora Lamu Edicoes Musicais Ltda',
    nome_fantasia: 'Editora Lamu',
    cnpj: '55.555.555/0001-55',
    logo_url: null,
    ativa: true,
    administradora_id: 'ed-tsm',
    created_at: '2022-08-15T10:00:00Z',
    _titulares: 4,
    _obras: 9,
    _contratos: 2,
    _cwr_ip: '393',
  },
  {
    id: 'ed-lojas-mil',
    codigo: 'LM',
    razao_social: 'Lojas Mil Calcados e Confeccoes Ltda',
    nome_fantasia: 'Lojas Mil',
    cnpj: null,
    logo_url: null,
    ativa: true,
    administradora_id: 'ed-tsm',
    created_at: '2023-01-10T10:00:00Z',
    _titulares: 1,
    _obras: 0,
    _contratos: 1,
    _cwr_ip: '423',
  },
  {
    id: 'ed-pedro-freitas',
    codigo: 'PVF',
    razao_social: 'Pedro V Mendes Estanislau de Freitas',
    nome_fantasia: 'Pedro Freitas Editora',
    cnpj: null,
    logo_url: null,
    ativa: true,
    administradora_id: 'ed-tsm',
    created_at: '2023-05-20T10:00:00Z',
    _titulares: 1,
    _obras: 0,
    _contratos: 1,
    _cwr_ip: 'AP01',
  },
]

// ============================================================
// HELPERS para construir mocks
// ============================================================

function makeEndereco(id: string, titularId: string, data: Partial<TitularEndereco>): TitularEndereco {
  return {
    id,
    titular_id: titularId,
    cep: data.cep ?? null,
    endereco: data.endereco ?? null,
    numero: data.numero ?? null,
    compl: data.compl ?? null,
    bairro: data.bairro ?? null,
    cidade: data.cidade ?? null,
    estado: data.estado ?? null,
    pais: 'Brasil',
    principal: data.principal ?? true,
  }
}

function makeContato(id: string, titularId: string, tipo: TitularContato['tipo'], valor: string, principal = false): TitularContato {
  return { id, titular_id: titularId, tipo, valor, principal }
}

function makeBanco(id: string, titularId: string, data: Partial<TitularDadosBancarios>): TitularDadosBancarios {
  return {
    id,
    titular_id: titularId,
    banco: data.banco ?? 'Banco do Brasil',
    agencia: data.agencia ?? null,
    conta: data.conta ?? null,
    tipo_conta: data.tipo_conta ?? 'corrente',
    titular_conta: data.titular_conta ?? null,
    cpf_cnpj_titular: data.cpf_cnpj_titular ?? null,
    pix_chave: data.pix_chave ?? null,
    pix_tipo: data.pix_tipo ?? null,
    principal: data.principal ?? true,
  }
}

function makeFuncao(id: string, titularId: string, funcao: TitularFuncao['funcao']): TitularFuncao {
  return { id, titular_id: titularId, funcao, sigla: funcao, ativa: true, created_at: '2024-01-01T10:00:00Z' }
}

function makePseudonimo(id: string, titularId: string, pseudonimo: string, principal: boolean): TitularPseudonimo {
  return { id, titular_id: titularId, pseudonimo, principal, ativo: true, data_inicio: '2020-01-01', data_fim: null }
}

// ============================================================
// PESSOA FISICA — 6 titulares
// ============================================================

const PF_NAUILAN: TitularPessoaFisica = {
  titular_id: 'tit-pf-1',
  nome_completo: 'Nauilan Barbosa Silva',
  cpf: '123.456.789-00',
  rg: '12.345.678-9',
  data_nasc: '1985-03-12',
  nacionalidade: 'Brasileira',
  estado_civil: 'Casado',
  profissao: 'Musico',
  nome_artistico_principal: 'Nauilan',
  sociedade_autoral: 'UBC',
  cae: 'CAE-00123',
  ipi: '00123456',
}

const PF_GIOVANI: TitularPessoaFisica = {
  titular_id: 'tit-pf-2',
  nome_completo: 'Giovani Alves Rodrigues',
  cpf: '234.567.890-11',
  rg: '23.456.789-0',
  data_nasc: '1990-07-22',
  nacionalidade: 'Brasileira',
  estado_civil: 'Solteiro',
  profissao: 'Compositor',
  nome_artistico_principal: 'Giovani',
  sociedade_autoral: 'ABRAMUS',
  cae: 'CAE-00234',
  ipi: '00234567',
}

const PF_MARCELO: TitularPessoaFisica = {
  titular_id: 'tit-pf-3',
  nome_completo: 'Marcelo Costa Ferreira',
  cpf: '345.678.901-22',
  rg: '34.567.890-1',
  data_nasc: '1978-11-05',
  nacionalidade: 'Brasileira',
  estado_civil: 'Divorciado',
  profissao: 'Compositor',
  nome_artistico_principal: 'Marcelo Costa',
  sociedade_autoral: 'UBC',
  cae: 'CAE-00345',
  ipi: null,
}

const PF_JOAOPEDRO: TitularPessoaFisica = {
  titular_id: 'tit-pf-4',
  nome_completo: 'Joao Pedro Moraes Lima',
  cpf: '456.789.012-33',
  rg: null,
  data_nasc: '2000-04-18',
  nacionalidade: 'Brasileira',
  estado_civil: 'Solteiro',
  profissao: 'Musico',
  nome_artistico_principal: 'JP Lima',
  sociedade_autoral: null,
  cae: null,
  ipi: null,
}

const PF_DANIEL: TitularPessoaFisica = {
  titular_id: 'tit-pf-5',
  nome_completo: 'Daniel Souza Mendes',
  cpf: '567.890.123-44',
  rg: '56.789.012-3',
  data_nasc: '1995-08-30',
  nacionalidade: 'Brasileira',
  estado_civil: 'Solteiro',
  profissao: 'Letrista',
  nome_artistico_principal: 'Daniel S.',
  sociedade_autoral: 'SOCINPRO',
  cae: 'CAE-00556',
  ipi: '00556677',
}

const PF_PEDRO: TitularPessoaFisica = {
  titular_id: 'tit-pf-6',
  nome_completo: 'Pedro Augusto Carvalho',
  cpf: '678.901.234-55',
  rg: '67.890.123-4',
  data_nasc: '1982-12-01',
  nacionalidade: 'Brasileira',
  estado_civil: 'Casado',
  profissao: 'Musico / Arranjador',
  nome_artistico_principal: 'Pedro Carvalho',
  sociedade_autoral: 'UBC',
  cae: 'CAE-00678',
  ipi: '00667788',
}

// ============================================================
// PESSOA JURIDICA — 3 titulares (editoras + gravadora)
// ============================================================

const PJ_EDIMUSIC: TitularPessoaJuridica = {
  titular_id: 'tit-pj-1',
  razao_social: 'Edi Music Edicoes Musicais Ltda',
  nome_fantasia: 'Edi Music',
  cnpj: '22.222.222/0001-22',
  ie: '111.222.333.444',
  im: '12.345.678',
  responsavel_legal: 'Eduardo Melo',
  sociedade_autoral: 'UBC',
  cae: 'CAE-PJ-EDI',
  ipi: '00900001',
  site: 'www.edimusic.com.br',
}

const PJ_LR: TitularPessoaJuridica = {
  titular_id: 'tit-pj-2',
  razao_social: 'LR Edicoes Musicais Ltda',
  nome_fantasia: 'LR Edicoes',
  cnpj: '33.333.333/0001-33',
  ie: '222.333.444.555',
  im: '23.456.789',
  responsavel_legal: 'Luciana Ribeiro',
  sociedade_autoral: 'ABRAMUS',
  cae: 'CAE-PJ-LR',
  ipi: '00900002',
  site: 'www.lredicoes.com.br',
}

const PJ_SOMTOTAL: TitularPessoaJuridica = {
  titular_id: 'tit-pj-3',
  razao_social: 'Som Total Records Producoes Fonograficas Ltda',
  nome_fantasia: 'Som Total Records',
  cnpj: '99.999.999/0001-99',
  ie: '999.888.777.666',
  im: '99.888.777',
  responsavel_legal: 'Roberto Figueiredo',
  sociedade_autoral: null,
  cae: null,
  ipi: null,
  site: 'www.somtotalrecords.com.br',
}

// ============================================================
// TITULARES COMPLETOS
// ============================================================

export const MOCK_TITULARES: TitularComDados[] = []

// ============================================================
// LOOKUP helpers
// ============================================================

export function getEditoraById(id: string): EditoraAdministrada | undefined {
  return MOCK_EDITORAS.find(e => e.id === id)
}

export function getTitularById(id: string): TitularComDados | undefined {
  return MOCK_TITULARES.find(t => t.id === id)
}

export function getTitularesByEditora(editoraId: string): TitularComDados[] {
  return MOCK_TITULARES.filter(t => t.editora_id === editoraId)
}

export function getAdministradas(): EditoraAdministrada[] {
  return MOCK_EDITORAS.filter(e => e.administradora_id !== null)
}

// Gera o próximo código de titular no padrão 00001TSM
// Respeita edições manuais: usa max(todos os existentes) + 1
export function gerarCodigoTitular(): string {
  const todos = MOCK_TITULARES.map(t => t.codigo_titular)
  const maxExistente = todos.reduce((acc, c) => {
    const m = c.match(/^(\d{5})TSM$/i)
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc
  }, 0)
  const next = maxExistente + 1
  return String(next).padStart(5, '0') + 'TSM'
}

// Verifica se um codigo de titular ja existe (case-insensitive)
export function codigoTitularExiste(codigo: string): boolean {
  const upper = codigo.trim().toUpperCase()
  return MOCK_TITULARES.some(t => t.codigo_titular.toUpperCase() === upper)
}

// Verificacao de duplicidade para o wizard
export interface ResultadoDuplicidade {
  campo: string
  valor: string
  titular_id: string
  nome: string
  bloqueante: boolean  // true apenas para CPF/CNPJ — impede cadastro
}

export function verificarDuplicidade(dados: {
  cpf?: string
  cnpj?: string
  nome_completo?: string
  razao_social?: string
  nome_fantasia?: string
  pseudonimo?: string
  email?: string
  cae?: string
  ipi?: string
}): ResultadoDuplicidade[] {
  const alertas: ResultadoDuplicidade[] = []

  for (const t of MOCK_TITULARES) {
    const nome = t.tipo_pessoa === 'PF'
      ? t._pf?.nome_completo ?? ''
      : t._pj?.razao_social ?? ''

    if (dados.cpf && t._pf?.cpf === dados.cpf) {
      alertas.push({ campo: 'CPF', valor: dados.cpf, titular_id: t.id, nome, bloqueante: true })
    }
    if (dados.cnpj && t._pj?.cnpj === dados.cnpj) {
      alertas.push({ campo: 'CNPJ', valor: dados.cnpj, titular_id: t.id, nome, bloqueante: true })
    }
    if (dados.nome_completo && t._pf?.nome_completo?.toLowerCase() === dados.nome_completo.toLowerCase()) {
      alertas.push({ campo: 'Nome completo', valor: dados.nome_completo, titular_id: t.id, nome, bloqueante: false })
    }
    if (dados.razao_social && t._pj?.razao_social?.toLowerCase() === dados.razao_social.toLowerCase()) {
      alertas.push({ campo: 'Razao social', valor: dados.razao_social, titular_id: t.id, nome, bloqueante: false })
    }
    if (dados.nome_fantasia && t._pj?.nome_fantasia && t._pj.nome_fantasia.toLowerCase() === dados.nome_fantasia.toLowerCase()) {
      alertas.push({ campo: 'Nome fantasia', valor: dados.nome_fantasia, titular_id: t.id, nome, bloqueante: false })
    }
    if (dados.email) {
      const emailMatch = t._contatos.find(c => c.tipo === 'email' && c.valor.toLowerCase() === dados.email!.toLowerCase())
      if (emailMatch) alertas.push({ campo: 'E-mail', valor: dados.email, titular_id: t.id, nome, bloqueante: false })
    }
    if (dados.cae && (t._pf?.cae === dados.cae || t._pj?.cae === dados.cae)) {
      alertas.push({ campo: 'CAE', valor: dados.cae, titular_id: t.id, nome, bloqueante: false })
    }
    if (dados.ipi && (t._pf?.ipi === dados.ipi || t._pj?.ipi === dados.ipi)) {
      alertas.push({ campo: 'IPI', valor: dados.ipi, titular_id: t.id, nome, bloqueante: false })
    }
    if (dados.pseudonimo) {
      const psMatch = t._pseudonimos.find(p => p.pseudonimo.toLowerCase() === dados.pseudonimo!.toLowerCase())
      if (psMatch) alertas.push({ campo: 'Pseudonimo', valor: dados.pseudonimo, titular_id: t.id, nome, bloqueante: false })
    }
  }

  return alertas
}

