// ============================================================
// mock-titulares-cwr.ts — Titulares extraídos do CWR
// Fonte: CW260020TSL_189.V21 — Top Show Music Limitada
// GERADO AUTOMATICAMENTE — NÃO EDITAR MANUALMENTE
// ============================================================

import type {
  TitularComDados,
  TitularPessoaFisica,
  TitularPessoaJuridica,
  TitularFuncao,
} from './types-cadastros'

function fn(id: string, tid: string, f: TitularFuncao['funcao']): TitularFuncao {
  return { id, titular_id: tid, funcao: f, sigla: f, ativa: true, created_at: '2025-01-01T00:00:00Z' }
}

// ── Pessoas Jurídicas (editoras / administradoras) ──────────────

const PJ_0001: TitularPessoaJuridica = {
  titular_id: 'cwr-pj-0001',
  razao_social: "EDI MUSIC EDITORA LTDA",
  nome_fantasia: null,
  cnpj: null,
  ie: null,
  im: null,
  responsavel_legal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
  site: null,
}

const PJ_0002: TitularPessoaJuridica = {
  titular_id: 'cwr-pj-0002',
  razao_social: "EDITORA LAMU LTDA",
  nome_fantasia: null,
  cnpj: null,
  ie: null,
  im: null,
  responsavel_legal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "393",
  site: null,
}

const PJ_0003: TitularPessoaJuridica = {
  titular_id: 'cwr-pj-0003',
  razao_social: "LOJAS MIL CALCADOS E CONFECCOES LTDA",
  nome_fantasia: null,
  cnpj: null,
  ie: null,
  im: null,
  responsavel_legal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "423",
  site: null,
}

const PJ_0004: TitularPessoaJuridica = {
  titular_id: 'cwr-pj-0004',
  razao_social: "P3 EDITORA MUSICAL LTDA - ME",
  nome_fantasia: null,
  cnpj: null,
  ie: null,
  im: null,
  responsavel_legal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "8961236",
  site: null,
}

const PJ_0005: TitularPessoaJuridica = {
  titular_id: 'cwr-pj-0005',
  razao_social: "PEDRO V MENDES ESTANISLAU DE FREITAS",
  nome_fantasia: null,
  cnpj: null,
  ie: null,
  im: null,
  responsavel_legal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
  site: null,
}

const PJ_0006: TitularPessoaJuridica = {
  titular_id: 'cwr-pj-0006',
  razao_social: "TOP SHOW MUSIC LIMITADA - ME",
  nome_fantasia: null,
  cnpj: null,
  ie: null,
  im: null,
  responsavel_legal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "2646326",
  site: null,
}

// ── Pessoas Físicas (autores / compositores) ───────────────────

const PF_0001: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0001',
  nome_completo: "ABEL MARTINS NOVAIS NETO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "287",
}

const PF_0002: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0002',
  nome_completo: "ADAIR CARDOSO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "404",
}

const PF_0003: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0003',
  nome_completo: "ADIR PAIVA NETO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "314",
}

const PF_0004: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0004',
  nome_completo: "ALAILSON BERNARDO DA COSTA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "93",
}

const PF_0005: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0005',
  nome_completo: "ALAN RICHARDY SILVA RODRIGUES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "572",
}

const PF_0006: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0006',
  nome_completo: "ALEX ALVEZ",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "390",
}

const PF_0007: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0007',
  nome_completo: "ALEX SANDRO GOMES DE AGUIAR ALVES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "293",
}

const PF_0008: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0008',
  nome_completo: "ALEX STELA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "2780022",
}

const PF_0009: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0009',
  nome_completo: "ALEXANDRE RODRIGUES DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "268",
}

const PF_0010: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0010',
  nome_completo: "ALEXANDRE RODRIGUES FERRAZ",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "496",
}

const PF_0011: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0011',
  nome_completo: "ALISSON HENRIQUE FERREIRA DE OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "315",
}

const PF_0012: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0012',
  nome_completo: "ALLANS LUAN MANOEL NUNES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "20",
}

const PF_0013: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0013',
  nome_completo: "ALMY",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "504",
}

const PF_0014: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0014',
  nome_completo: "AMANDA VALVERDE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "444",
}

const PF_0015: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0015',
  nome_completo: "AMILTON SILVA JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "510",
}

const PF_0016: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0016',
  nome_completo: "ANA FLAVIA CASTELA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "72",
}

const PF_0017: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0017',
  nome_completo: "ANA JU",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "384",
}

const PF_0018: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0018',
  nome_completo: "ANA LARISSA SILVA GAMA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "317",
}

const PF_0019: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0019',
  nome_completo: "ANA NERI GABRIEL",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1298036",
}

const PF_0020: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0020',
  nome_completo: "ANA PAULA LOPES COPETTI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "525",
}

const PF_0021: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0021',
  nome_completo: "ANDERSON VIANA DE CARVALHO ALVES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "132",
}

const PF_0022: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0022',
  nome_completo: "ANDRE CANDOTI MENDONCA DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "80",
}

const PF_0023: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0023',
  nome_completo: "ANDREY DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "130",
}

const PF_0024: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0024',
  nome_completo: "ANDREY OLMES FURTADO PESCADOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "506",
}

const PF_0025: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0025',
  nome_completo: "ANTONIO APARECIDO PEPATO JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "345",
}

const PF_0026: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0026',
  nome_completo: "ANTONIO AVELAR BORGES JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "325",
}

const PF_0027: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0027',
  nome_completo: "ANTONIO AVELAR BORGES JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "81",
}

const PF_0028: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0028',
  nome_completo: "ANTONIO MORAES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "436",
}

const PF_0029: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0029',
  nome_completo: "ANTONIO RAYO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "441",
}

const PF_0030: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0030',
  nome_completo: "ARI ALEXANDRE DE PAIVA BRALESI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1961401",
}

const PF_0031: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0031',
  nome_completo: "ARIOSTO PORTO MULLER",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0032: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0032',
  nome_completo: "AUGUSTO JANTIM FERREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "32",
}

const PF_0033: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0033',
  nome_completo: "AYLA ALBUQUERQUE PEREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "296",
}

const PF_0034: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0034',
  nome_completo: "BARTO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "395",
}

const PF_0035: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0035',
  nome_completo: "BEAT WILL",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "416",
}

const PF_0036: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0036',
  nome_completo: "BERENICE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "515",
}

const PF_0037: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0037',
  nome_completo: "BIA FRAZZO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "551",
}

const PF_0038: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0038',
  nome_completo: "BRAYAN MARTINS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "334",
}

const PF_0039: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0039',
  nome_completo: "BRUNA SIQUEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "552",
}

const PF_0040: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0040',
  nome_completo: "BRUNO CESAR OREFICE DE CARVALHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "358",
}

const PF_0041: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0041',
  nome_completo: "BRUNO FIGUEREDO DE CARVALHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "125",
}

const PF_0042: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0042',
  nome_completo: "BRUNO GABRYEL",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "367",
}

const PF_0043: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0043',
  nome_completo: "CAIO BORDA DE LIMA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "508",
}

const PF_0044: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0044',
  nome_completo: "CAIO MARCELO NOGUEIRA BARBOSA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "64",
}

const PF_0045: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0045',
  nome_completo: "CAIO SANFONEIRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "459",
}

const PF_0046: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0046',
  nome_completo: "CAMILA MORES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "82",
}

const PF_0047: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0047',
  nome_completo: "CARLOS ALBERTO VIERIA FILHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "460",
}

const PF_0048: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0048',
  nome_completo: "CARLOS JOSE ROSA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "454",
}

const PF_0049: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0049',
  nome_completo: "CAROLINE DOS REIS BIAZIN",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "307",
}

const PF_0050: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0050',
  nome_completo: "CAUIQUE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "548",
}

const PF_0051: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0051',
  nome_completo: "CESAR AUGUSTO ZOCANTE DE SOUZA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "919769",
}

const PF_0052: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0052',
  nome_completo: "CHICO SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "535",
}

const PF_0053: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0053',
  nome_completo: "CHICO TEIXEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "484",
}

const PF_0054: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0054',
  nome_completo: "CHRISTIAN RACHID VALEZI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "9180713",
}

const PF_0055: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0055',
  nome_completo: "CIRO PEREIRA NETO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1119049",
}

const PF_0056: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0056',
  nome_completo: "CLARA MARTINS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "503",
}

const PF_0057: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0057',
  nome_completo: "CLAU",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "539",
}

const PF_0058: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0058',
  nome_completo: "CLEBINHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "377",
}

const PF_0059: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0059',
  nome_completo: "CONRADO RODRIGUES DE SENA NETO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "502",
}

const PF_0060: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0060',
  nome_completo: "COUTTO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "347",
}

const PF_0061: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0061',
  nome_completo: "CRISTIANO DE MELO ARAUJO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "463",
}

const PF_0062: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0062',
  nome_completo: "CUPERTINO LOPEZ ESTRADA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "370",
}

const PF_0063: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0063',
  nome_completo: "DAN CANDIDO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "550",
}

const PF_0064: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0064',
  nome_completo: "DANIEL FERRERA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "421",
}

const PF_0065: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0065',
  nome_completo: "DANIEL QUIRINO DE MATOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "281",
}

const PF_0066: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0066',
  nome_completo: "DANIEL RANGEL",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "528",
}

const PF_0067: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0067',
  nome_completo: "DANIELA ALMEIDA DE LIMA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "328",
}

const PF_0068: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0068',
  nome_completo: "DANILO CARVALHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "144",
}

const PF_0069: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0069',
  nome_completo: "DANILO COSTA BORGES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "186959",
}

const PF_0070: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0070',
  nome_completo: "DANILO DE SOUZA CARVALHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "340",
}

const PF_0071: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0071',
  nome_completo: "DANILO OLIVEIRA LELLIS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "447",
}

const PF_0072: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0072',
  nome_completo: "DARIO ANTONIO DOS SANTOS JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "288",
}

const PF_0073: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0073',
  nome_completo: "DAVI MATHEUS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "387",
}

const PF_0074: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0074',
  nome_completo: "DAVID R FRASIER",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "437",
}

const PF_0075: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0075',
  nome_completo: "DE VIEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "397",
}

const PF_0076: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0076',
  nome_completo: "DELAO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "543",
}

const PF_0077: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0077',
  nome_completo: "DENIS DOS SANTOS ARAUJO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "29",
}

const PF_0078: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0078',
  nome_completo: "DENNYS RICARDO ANDRADE TOQUETAO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "71",
}

const PF_0079: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0079',
  nome_completo: "DIEGO CESAR MONTEIRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1253187",
}

const PF_0080: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0080',
  nome_completo: "DIEGO FELIPE MOREIRA TAMIOZZO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "570",
}

const PF_0081: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0081',
  nome_completo: "DIEGO FREITAS DE SOUZA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "126",
}

const PF_0082: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0082',
  nome_completo: "DIEGO HENRIQUE DA SILVEIRA MARTINS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "6526487",
}

const PF_0083: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0083',
  nome_completo: "DIGGO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "569",
}

const PF_0084: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0084',
  nome_completo: "DILSON SCHER NETO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "298",
}

const PF_0085: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0085',
  nome_completo: "DINY SOUZA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "485",
}

const PF_0086: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0086',
  nome_completo: "DIOGO VIEIRA XAVIER",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1947076",
}

const PF_0087: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0087',
  nome_completo: "DIRLEI DE OLIVEIRA MAZZO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "558",
}

const PF_0088: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0088',
  nome_completo: "DMAX",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "540",
}

const PF_0089: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0089',
  nome_completo: "DONATO VERISSIMO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "309",
}

const PF_0090: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0090',
  nome_completo: "DONATTO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "319",
}

const PF_0091: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0091',
  nome_completo: "DOUGLAS ADALBERTO SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "425",
}

const PF_0092: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0092',
  nome_completo: "DOUGLAS LACERDA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "487",
}

const PF_0093: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0093',
  nome_completo: "ED NOBRE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "568",
}

const PF_0094: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0094',
  nome_completo: "EDERSON DE OLIVEIRA BRITO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "40",
}

const PF_0095: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0095',
  nome_completo: "EDIMAR CESAR DE ARAUJO NETO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "520",
}

const PF_0096: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0096',
  nome_completo: "EDIMAR FILHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "521",
}

const PF_0097: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0097',
  nome_completo: "EDU VALIM",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "394",
}

const PF_0098: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0098',
  nome_completo: "EDUARDO FELIPE ALENCAR SOARES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "98",
}

const PF_0099: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0099',
  nome_completo: "EDUARDO MUNIZ DE ARAUJO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "8153005",
}

const PF_0100: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0100',
  nome_completo: "EDY LEMOND",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "501",
}

const PF_0101: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0101',
  nome_completo: "ELAN RUBIO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "361",
}

const PF_0102: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0102',
  nome_completo: "ELCINONDAS EVANGELISTA DE SOUZA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "2037995",
}

const PF_0103: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0103',
  nome_completo: "ELEANDRO LUIS FERREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "150",
}

const PF_0104: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0104',
  nome_completo: "ELIAS MAFRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "411",
}

const PF_0105: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0105',
  nome_completo: "ELISON AUGUSTO DOS SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "2616799",
}

const PF_0106: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0106',
  nome_completo: "ELIVALDO RIBEIRO LIMA JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "127",
}

const PF_0107: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0107',
  nome_completo: "ELOISE REBECA PENGA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "511",
}

const PF_0108: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0108',
  nome_completo: "ELTON DOUGLAS JR FITE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "87",
}

const PF_0109: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0109',
  nome_completo: "ELTON PATRICK PENTEADO RODRIGUES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0110: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0110',
  nome_completo: "EMERSON MANOEL DE OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1110513",
}

const PF_0111: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0111',
  nome_completo: "EMERSON ROBSON CAMPOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "12",
}

const PF_0112: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0112',
  nome_completo: "ENZO VELOZO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "491",
}

const PF_0113: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0113',
  nome_completo: "EUGENIO JOSE DOS SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "426",
}

const PF_0114: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0114',
  nome_completo: "EVANDRO GABRIEL SCHWINGEL DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "107",
}

const PF_0115: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0115',
  nome_completo: "EVERSON FELIX DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "48",
}

const PF_0116: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0116',
  nome_completo: "EWERTON SILVA SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "128",
}

const PF_0117: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0117',
  nome_completo: "EWERTON TOMAZ BENEVIDES DE OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "6456459",
}

const PF_0118: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0118',
  nome_completo: "FABIO ROGERIO SILVA JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0119: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0119',
  nome_completo: "FABIOLA CARRION PATRICIO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "482",
}

const PF_0120: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0120',
  nome_completo: "FABRICIO DE LIMA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "106",
}

const PF_0121: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0121',
  nome_completo: "FABRICIO FAFA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "413",
}

const PF_0122: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0122',
  nome_completo: "FABRICIO MARQUES GUIMARAES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "435",
}

const PF_0123: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0123',
  nome_completo: "FELIPE AUGUSTO NALIN NICOLAU",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "84",
}

const PF_0124: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0124',
  nome_completo: "FELIPE GOFFI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "445",
}

const PF_0125: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0125',
  nome_completo: "FELIPE HIT",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "415",
}

const PF_0126: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0126',
  nome_completo: "FELIPE KAN",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "513",
}

const PF_0127: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0127',
  nome_completo: "FELIPE LEAO CARNEIRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "2315686",
}

const PF_0128: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0128',
  nome_completo: "FELIPE MORAIS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "357",
}

const PF_0129: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0129',
  nome_completo: "FELIPE SALLES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "375",
}

const PF_0130: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0130',
  nome_completo: "FELIPE VICE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "512",
}

const PF_0131: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0131',
  nome_completo: "FELIPPE AUGUSTO BEIENKE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "77",
}

const PF_0132: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0132',
  nome_completo: "FELLIPE MORAES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "419",
}

const PF_0133: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0133',
  nome_completo: "FELLIPE PINHEIRO MARTINS DE MORAIS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "282",
}

const PF_0134: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0134',
  nome_completo: "FERNANDO BIANUCCI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "146",
}

const PF_0135: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0135',
  nome_completo: "FERNANDO DE SOUZA MANSO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "451",
}

const PF_0136: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0136',
  nome_completo: "FERNANDO FLEURY",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "90",
}

const PF_0137: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0137',
  nome_completo: "FERNANDO HENRIQUE DE MOURA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "500",
}

const PF_0138: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0138',
  nome_completo: "FERNANDO PALONI DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "70296",
}

const PF_0139: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0139',
  nome_completo: "FILIPE MASETTI DE SOUZA LEITE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "427",
}

const PF_0140: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0140',
  nome_completo: "FLAVIO DE AQUINO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "46",
}

const PF_0141: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0141',
  nome_completo: "GABRIEL COLETO PEREIRA GODOY",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "149",
}

const PF_0142: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0142',
  nome_completo: "GABRIEL DE PAULA LACERDA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "114",
}

const PF_0143: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0143',
  nome_completo: "GABRIEL GUIMARAES ALVES FERREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "331",
}

const PF_0144: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0144',
  nome_completo: "GABRIEL HEITOR LORENZON",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "27",
}

const PF_0145: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0145',
  nome_completo: "GABRIEL MONTEIRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "389",
}

const PF_0146: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0146',
  nome_completo: "GABRIEL NOGUEIRA SOUSA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "112",
}

const PF_0147: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0147',
  nome_completo: "GABRIEL NOGZ",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "271",
}

const PF_0148: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0148',
  nome_completo: "GABRIEL SIMAO PASCOAL",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "369",
}

const PF_0149: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0149',
  nome_completo: "GABRIEL VIDALETTI RODRIGUES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "300",
}

const PF_0150: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0150',
  nome_completo: "GABRIEL VITOR DE FREITAS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "103",
}

const PF_0151: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0151',
  nome_completo: "GABRIELA PIEDADE MARTINS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "100",
}

const PF_0152: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0152',
  nome_completo: "GEORGE EDWIN VARBLE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "438",
}

const PF_0153: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0153',
  nome_completo: "GEOVANE VIEIRA MARTINS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "428",
}

const PF_0154: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0154',
  nome_completo: "GILDO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "516",
}

const PF_0155: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0155',
  nome_completo: "GIOLI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "524",
}

const PF_0156: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0156',
  nome_completo: "GIOVANI AVELAR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0157: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0157',
  nome_completo: "GUILHERME AMARAL",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "97",
}

const PF_0158: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0158',
  nome_completo: "GUILHERME APARECIDO DANTAS PINHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "101",
}

const PF_0159: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0159',
  nome_completo: "GUILHERME AUGUSTO NOGUEIRA DIAS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "509",
}

const PF_0160: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0160',
  nome_completo: "GUILHERME FERRAZ",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "486",
}

const PF_0161: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0161',
  nome_completo: "GUILHERME GUERRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "429",
}

const PF_0162: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0162',
  nome_completo: "GUILHERME HENRIQUE DE SOUZA ROSA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "2021638",
}

const PF_0163: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0163',
  nome_completo: "GUILHERME NASCIMENTO SIMINI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "318",
}

const PF_0164: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0164',
  nome_completo: "GUSTAVO ABREU TAVARES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "289",
}

const PF_0165: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0165',
  nome_completo: "GUSTAVO BURGO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "505",
}

const PF_0166: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0166',
  nome_completo: "GUSTAVO FAQUIM DOS SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "69",
}

const PF_0167: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0167',
  nome_completo: "GUSTAVO HENRIQUE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "405",
}

const PF_0168: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0168',
  nome_completo: "GUSTAVO HENRIQUE SALIBA RODRIGUES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1843009",
}

const PF_0169: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0169',
  nome_completo: "GUSTAVO MARTINS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "559",
}

const PF_0170: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0170',
  nome_completo: "GUSTAVO PADILHA DE SOUZA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "424",
}

const PF_0171: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0171',
  nome_completo: "GUSTAVO PROTASIO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "465",
}

const PF_0172: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0172',
  nome_completo: "HEITOR BLANCO MOREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "38",
}

const PF_0173: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0173',
  nome_completo: "HEITOR MOREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "141",
}

const PF_0174: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0174',
  nome_completo: "HENRIQUE ALVES DOS REIS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0175: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0175',
  nome_completo: "HENRIQUE BATISTA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "531",
}

const PF_0176: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0176',
  nome_completo: "HENRIQUE TRANQUERO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "6990672",
}

const PF_0177: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0177',
  nome_completo: "HENRIQUE VITOR FELIX",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "353",
}

const PF_0178: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0178',
  nome_completo: "HIGOR HENRIQUE DE VASCONCELOS OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "326",
}

const PF_0179: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0179',
  nome_completo: "HUGO CARVALHO CERQUEIRA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "137",
}

const PF_0180: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0180',
  nome_completo: "HUGO CASCIANO PENA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "119",
}

const PF_0181: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0181',
  nome_completo: "HYAGO MELO SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "327",
}

const PF_0182: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0182',
  nome_completo: "IAN BARRETO DOS SANTOS TEIXEIRA PATROCINIO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "497",
}

const PF_0183: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0183',
  nome_completo: "IGOR HENRIQUE SEBASTIANI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "42",
}

const PF_0184: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0184',
  nome_completo: "IGOR RIANI DE SOUZA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "335",
}

const PF_0185: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0185',
  nome_completo: "IKARO ANDRADE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "529",
}

const PF_0186: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0186',
  nome_completo: "ISA SANTANA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "401",
}

const PF_0187: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0187',
  nome_completo: "ISAAC DANIEL JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "134",
}

const PF_0188: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0188',
  nome_completo: "ITALO DIAS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "379",
}

const PF_0189: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0189',
  nome_completo: "ITTALO VIANA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "408",
}

const PF_0190: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0190',
  nome_completo: "JAIR MENDONCA JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "3611699",
}

const PF_0191: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0191',
  nome_completo: "JAMIL LENNON GOMES CORTES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "470466",
}

const PF_0192: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0192',
  nome_completo: "JANDERSON DIAS MORAES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0193: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0193',
  nome_completo: "JERONIMO HILGEMBERG",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "430",
}

const PF_0194: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0194',
  nome_completo: "JHONATHAN FRANK CARVALHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "65",
}

const PF_0195: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0195',
  nome_completo: "JIMMY HENDRIX DE OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "970114",
}

const PF_0196: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0196',
  nome_completo: "JOAO ALYSON LOPES HOMEM",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "493",
}

const PF_0197: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0197',
  nome_completo: "JOAO AUGUSTO LIMA SOARES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "338",
}

const PF_0198: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0198',
  nome_completo: "JOAO CATAN",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "320",
}

const PF_0199: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0199',
  nome_completo: "JOAO FLORES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "140",
}

const PF_0200: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0200',
  nome_completo: "JOAO GUSTAVO JG&M",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "578",
}

const PF_0201: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0201',
  nome_completo: "JOAO MACHADO MARQUES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "354",
}

const PF_0202: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0202',
  nome_completo: "JOAO MARCOS FICHMAN",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "145",
}

const PF_0203: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0203',
  nome_completo: "JOAO MARTINS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "310",
}

const PF_0204: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0204',
  nome_completo: "JOAO MONTEIRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "272",
}

const PF_0205: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0205',
  nome_completo: "JOAO RAFAEL FERREIRA AVILA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "124",
}

const PF_0206: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0206',
  nome_completo: "JOAO THIAGO PEREIRA SALES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0207: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0207',
  nome_completo: "JOAO VICTOR OLIVEIRA SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "560",
}

const PF_0208: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0208',
  nome_completo: "JOAO VITOR FRAGOSO BURGOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "378",
}

const PF_0209: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0209',
  nome_completo: "JOAO VITOR LOPES RAPHAEL SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "273",
}

const PF_0210: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0210',
  nome_completo: "JOHN",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "290",
}

const PF_0211: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0211',
  nome_completo: "JOQUITAN MEDINA GAMA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "75",
}

const PF_0212: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0212',
  nome_completo: "JOSE ANDRE ARAUJO E SOUZA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "462",
}

const PF_0213: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0213',
  nome_completo: "JOSE APARECIDO AMORIM JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1975871",
}

const PF_0214: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0214',
  nome_completo: "JOSE BONIFACIO SOBRINHO JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1804329",
}

const PF_0215: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0215',
  nome_completo: "JOSE GUSTAVO ABELBECK",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "129",
}

const PF_0216: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0216',
  nome_completo: "JOSE LAZARO SERVO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "455",
}

const PF_0217: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0217',
  nome_completo: "JOSE MATHEUS VERAS VIEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "91",
}

const PF_0218: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0218',
  nome_completo: "JOSEPH ABRAAO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "412",
}

const PF_0219: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0219',
  nome_completo: "JULIANO COUTO DO AMARANTE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "283",
}

const PF_0220: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0220',
  nome_completo: "JULIANO COUTTO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "376",
}

const PF_0221: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0221',
  nome_completo: "JULIANO GAZONI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "2100946",
}

const PF_0222: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0222',
  nome_completo: "JULIO CESAR CAMARGO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "11",
}

const PF_0223: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0223',
  nome_completo: "JUNIOR LOBO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "382",
}

const PF_0224: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0224',
  nome_completo: "JUNYNHO SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "476",
}

const PF_0225: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0225',
  nome_completo: "KAIO OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "561",
}

const PF_0226: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0226',
  nome_completo: "KALEB CAPITAO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "458",
}

const PF_0227: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0227',
  nome_completo: "KELVYN BERTONI SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "270",
}

const PF_0228: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0228',
  nome_completo: "KENYO ALVES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "406",
}

const PF_0229: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0229',
  nome_completo: "KEVIN",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "360",
}

const PF_0230: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0230',
  nome_completo: "KLEBER PARAIBA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "450",
}

const PF_0231: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0231',
  nome_completo: "KLEBIN",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "363",
}

const PF_0232: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0232',
  nome_completo: "LAWAN BRENO DA SILVA PENA CASSIANO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "495",
}

const PF_0233: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0233',
  nome_completo: "LAZARO NASS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "414",
}

const PF_0234: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0234',
  nome_completo: "LEANDRO ANDRE SPARREMBERGER",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "47",
}

const PF_0235: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0235',
  nome_completo: "LEANDRO ARAUJO ROJAS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "3458727",
}

const PF_0236: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0236',
  nome_completo: "LEANDRO FILE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "366",
}

const PF_0237: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0237',
  nome_completo: "LEONARDO DE SOUZA PACHECO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "10210230",
}

const PF_0238: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0238',
  nome_completo: "LEONARDO DOMINICO DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "17",
}

const PF_0239: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0239',
  nome_completo: "LEONARDO PEDRO ROCATTO VACARI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "102",
}

const PF_0240: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0240',
  nome_completo: "LEONARDO PEDRO ROCATTO VACARI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "321",
}

const PF_0241: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0241',
  nome_completo: "LEONARDO TARGINO DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "99",
}

const PF_0242: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0242',
  nome_completo: "LEOPOLDO LEONEL SEGURA OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "2468092",
}

const PF_0243: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0243',
  nome_completo: "LIVIA FONSECA PEREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "58",
}

const PF_0244: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0244',
  nome_completo: "LIZA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "545",
}

const PF_0245: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0245',
  nome_completo: "LUAN MARCELO GAVLIK DE OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0246: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0246',
  nome_completo: "LUAN PEREIRA GALDINO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "104",
}

const PF_0247: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0247',
  nome_completo: "LUCAS BECKER NAKAHARA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "2653575",
}

const PF_0248: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0248',
  nome_completo: "LUCAS BEZERRA MEDEIROS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "94",
}

const PF_0249: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0249',
  nome_completo: "LUCAS CARVALHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "549",
}

const PF_0250: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0250',
  nome_completo: "LUCAS CORREA DE OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "461",
}

const PF_0251: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0251',
  nome_completo: "LUCAS DE FREITAS ANGELO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "431",
}

const PF_0252: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0252',
  nome_completo: "LUCAS DE FREITAS PAVANI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "542",
}

const PF_0253: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0253',
  nome_completo: "LUCAS DE SOUSA MURTA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "446",
}

const PF_0254: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0254',
  nome_completo: "LUCAS JHONATAN DE CASTRO FERREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "4490045",
}

const PF_0255: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0255',
  nome_completo: "LUCAS MANTOVANI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "121",
}

const PF_0256: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0256',
  nome_completo: "LUCAS MULLER SOUZA RAMOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "92",
}

const PF_0257: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0257',
  nome_completo: "LUCAS NAGE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "488",
}

const PF_0258: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0258',
  nome_completo: "LUCAS STIW WAGNER DE CEZARO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "432",
}

const PF_0259: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0259',
  nome_completo: "LUCAS VIEIRA XAVIER",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1947082",
}

const PF_0260: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0260',
  nome_completo: "LUCCA RODRIGUES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "400",
}

const PF_0261: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0261',
  nome_completo: "LUIS FELIPE FORTES SOARES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "109",
}

const PF_0262: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0262',
  nome_completo: "LUIS GUILHERME PEREIRA DE MELO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "13004950",
}

const PF_0263: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0263',
  nome_completo: "LUIS HENRIQUE CAMARGO GOMES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "79",
}

const PF_0264: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0264',
  nome_completo: "LUIS MIGUEL THIESEN KULCHESKI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "6224513",
}

const PF_0265: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0265',
  nome_completo: "LUIZ ANACLETO JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "70",
}

const PF_0266: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0266',
  nome_completo: "LUIZ FELIPE AMORIM DO NASCIMENTO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "457",
}

const PF_0267: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0267',
  nome_completo: "LUIZ FELIPE VIANA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "284",
}

const PF_0268: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0268',
  nome_completo: "LUIZ HENRIQUE PALONI DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "70328",
}

const PF_0269: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0269',
  nome_completo: "LUIZ MATHEUS MALDONADO DA FONSECA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "305",
}

const PF_0270: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0270',
  nome_completo: "LUIZ OLIVEIRA DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1495568",
}

const PF_0271: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0271',
  nome_completo: "MANOEL MATHEUS NITSCHE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "479",
}

const PF_0272: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0272',
  nome_completo: "MARCELINHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "374",
}

const PF_0273: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0273',
  nome_completo: "MARCELLO HENRIQUE DAMASIO DE SOUSA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "295",
}

const PF_0274: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0274',
  nome_completo: "MARCELO BERNARDES DE OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "355",
}

const PF_0275: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0275',
  nome_completo: "MARCELO DAVI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "392",
}

const PF_0276: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0276',
  nome_completo: "MARCELO HENRIQUE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "541",
}

const PF_0277: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0277',
  nome_completo: "MARCIA REGINA ARAUJO FARIAS DE OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "356868",
}

const PF_0278: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0278',
  nome_completo: "MARCINHO POETA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "449",
}

const PF_0279: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0279',
  nome_completo: "MARCIO AUGUSTO REZENDE FILHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "527",
}

const PF_0280: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0280',
  nome_completo: "MARCIO LUIZ AUGUSTO BARCELOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "263",
}

const PF_0281: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0281',
  nome_completo: "MARCO ANTONIO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "44",
}

const PF_0282: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0282',
  nome_completo: "MARCO ANTONIO ESTEVES MARTINS FILHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "337",
}

const PF_0283: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0283',
  nome_completo: "MARCO AURELIO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "139",
}

const PF_0284: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0284',
  nome_completo: "MARCOS ANTONIO GARCIA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1916019",
}

const PF_0285: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0285',
  nome_completo: "MARCOS COWBOY",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "274",
}

const PF_0286: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0286',
  nome_completo: "MARCOS ROBERTO RIBEIRO CARVALHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "3761165",
}

const PF_0287: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0287',
  nome_completo: "MARCOS SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "148",
}

const PF_0288: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0288',
  nome_completo: "MARCUS VINICIUS MIRANDA DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "269",
}

const PF_0289: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0289',
  nome_completo: "MARCUS VINICIUS OLIVEIRA SANTANA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "275",
}

const PF_0290: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0290',
  nome_completo: "MARIA EDUARDA BERTELLI MARCIANO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "18",
}

const PF_0291: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0291',
  nome_completo: "MARIANNA EIS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "544",
}

const PF_0292: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0292',
  nome_completo: "MARIO CELSO SZYMCZOK",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "2116123",
}

const PF_0293: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0293',
  nome_completo: "MARIO FACCIN NETO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "571",
}

const PF_0294: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0294',
  nome_completo: "MATEUS FELIX DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "9346747",
}

const PF_0295: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0295',
  nome_completo: "MATHEUS ALEIXO PINTO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1276827",
}

const PF_0296: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0296',
  nome_completo: "MATHEUS ARAUJO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "537",
}

const PF_0297: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0297',
  nome_completo: "MATHEUS CORREA SPERANDIO COTT",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "22",
}

const PF_0298: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0298',
  nome_completo: "MATHEUS CORTES SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "303",
}

const PF_0299: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0299',
  nome_completo: "MATHEUS COSTA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "538",
}

const PF_0300: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0300',
  nome_completo: "MATHEUS DAMASCENO DOS SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "88",
}

const PF_0301: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0301',
  nome_completo: "MATHEUS FERNANDES RODRIGUES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "336",
}

const PF_0302: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0302',
  nome_completo: "MATHEUS FREIRE PINTO OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "10190272",
}

const PF_0303: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0303',
  nome_completo: "MATHEUS GUSTAVO DE OLIVEIRA PADUA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "286",
}

const PF_0304: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0304',
  nome_completo: "MATHEUS ITAKURA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "111",
}

const PF_0305: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0305',
  nome_completo: "MATHEUS MACHADO MARCOLINO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "7389339",
}

const PF_0306: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0306',
  nome_completo: "MATHEUS MARCHLEWSKI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "6874589",
}

const PF_0307: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0307',
  nome_completo: "MATHEUS NEVES SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "279",
}

const PF_0308: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0308',
  nome_completo: "MATHEUS RODRIGUES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "147",
}

const PF_0309: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0309',
  nome_completo: "MATHEUS ROSADO DE OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "291",
}

const PF_0310: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0310',
  nome_completo: "MATTEUS APARECIDO GONCALVES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "108",
}

const PF_0311: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0311',
  nome_completo: "MAURO HENRIQUE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "417",
}

const PF_0312: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0312',
  nome_completo: "MAURO HENRIQUE LONGUINHO DE MOURA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "113",
}

const PF_0313: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0313',
  nome_completo: "MAYKE MER",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "381",
}

const PF_0314: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0314',
  nome_completo: "MC PEDRINHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "453",
}

const PF_0315: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0315',
  nome_completo: "MC VENEZA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "267",
}

const PF_0316: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0316',
  nome_completo: "MENOR DJ",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "576",
}

const PF_0317: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0317',
  nome_completo: "MICHEL GUILHERME TURELI SAGRILLO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "483",
}

const PF_0318: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0318',
  nome_completo: "MIKE SEEMANN RIOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "311",
}

const PF_0319: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0319',
  nome_completo: "MURILLO GARCIA DE ABREU",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "105",
}

const PF_0320: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0320',
  nome_completo: "MURILLO HENRIQUE NALIN NICOLAU",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "83",
}

const PF_0321: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0321',
  nome_completo: "MURILO JG&M",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "579",
}

const PF_0322: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0322',
  nome_completo: "NAUILAN VICENTINI ZULAI RAMOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1961407",
}

const PF_0323: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0323',
  nome_completo: "NEGO LAU",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "507",
}

const PF_0324: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0324',
  nome_completo: "NETO GASSER",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "398",
}

const PF_0325: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0325',
  nome_completo: "OFERNANDINHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "385",
}

const PF_0326: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0326',
  nome_completo: "OSVALDO DE ATAIDES FARIA NETO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "292",
}

const PF_0327: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0327',
  nome_completo: "OTAVIO AUGUSTO DE COSTA MORAES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "39",
}

const PF_0328: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0328',
  nome_completo: "PABLO FIERRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "442",
}

const PF_0329: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0329',
  nome_completo: "PABLO PORTES BERTOLINO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "76",
}

const PF_0330: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0330',
  nome_completo: "PATIKI NO BEAT",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "477",
}

const PF_0331: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0331',
  nome_completo: "PATRICK MICHAEL GRAUE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "573",
}

const PF_0332: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0332',
  nome_completo: "PAULO JAECIO SILVA FERREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "297",
}

const PF_0333: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0333',
  nome_completo: "PAULO MARCELO MAZETTI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "60",
}

const PF_0334: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0334',
  nome_completo: "PAULO PIRES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "563",
}

const PF_0335: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0335',
  nome_completo: "PEDRO BREDER",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "566",
}

const PF_0336: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0336',
  nome_completo: "PEDRO CANDIDO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "565",
}

const PF_0337: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0337',
  nome_completo: "PEDRO FELIPE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "368",
}

const PF_0338: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0338',
  nome_completo: "PEDRO GRECCO ASSUNCAO TICKS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "350",
}

const PF_0339: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0339',
  nome_completo: "PEDRO HENRIQUE DE OLIVEIRA MOREIRA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0340: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0340',
  nome_completo: "PEDRO HENRIQUE PHEJV",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "399",
}

const PF_0341: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0341',
  nome_completo: "PEDRO HENRIQUE SANCHEZ",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0342: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0342',
  nome_completo: "PEDRO MANOEL CRISPIM DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "262",
}

const PF_0343: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0343',
  nome_completo: "PEDRO RIBEIRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "333",
}

const PF_0344: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0344',
  nome_completo: "PEDRO SAMPAIO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "564",
}

const PF_0345: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0345',
  nome_completo: "PEDRO VITOR MENDES ESTANISLAU FREITAS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "8107219",
}

const PF_0346: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0346',
  nome_completo: "PEPE FIGUEIREDO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "403",
}

const PF_0347: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0347',
  nome_completo: "PHILLIPE PICCININI UCHOA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "294",
}

const PF_0348: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0348',
  nome_completo: "PREGO OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "440",
}

const PF_0349: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0349',
  nome_completo: "RAFA MEDEIROS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "522",
}

const PF_0350: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0350',
  nome_completo: "RAFAEL APARECIDO DE MORAIS GONCALVES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "131",
}

const PF_0351: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0351',
  nome_completo: "RAFAEL LEAL",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "518",
}

const PF_0352: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0352',
  nome_completo: "RAFAEL LIBORIO DE SOUZA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "348",
}

const PF_0353: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0353',
  nome_completo: "RAFAEL QUADROS DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "89",
}

const PF_0354: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0354',
  nome_completo: "RAFAEL RIBEIRO DO PRADO E SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0355: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0355',
  nome_completo: "RAFINHA MATTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "386",
}

const PF_0356: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0356',
  nome_completo: "RAFINHA RSQ",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "567",
}

const PF_0357: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0357',
  nome_completo: "RAMIRO ALVES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "409",
}

const PF_0358: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0358',
  nome_completo: "RAPHAEL BRUNO FERREIRA MARQUES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "4217480",
}

const PF_0359: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0359',
  nome_completo: "RAPHAEL JOSE SOARES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "3597644",
}

const PF_0360: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0360',
  nome_completo: "RAPHAEL LUCAS FRANCA COSTA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "304",
}

const PF_0361: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0361',
  nome_completo: "RAQUEL ELIAS BERTIM",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "8679207",
}

const PF_0362: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0362',
  nome_completo: "RAYNNER FERREIRA COIMBRA DE SOUSA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1104062",
}

const PF_0363: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0363',
  nome_completo: "REGINALDO CRUZ HONORATO JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "78",
}

const PF_0364: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0364',
  nome_completo: "RENAN AUGUSTO GRAMORELLI GOUVEIA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "574",
}

const PF_0365: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0365',
  nome_completo: "RENAN DI CASTRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "402",
}

const PF_0366: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0366',
  nome_completo: "RENAN IGOR DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "478",
}

const PF_0367: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0367',
  nome_completo: "RENAN KULCHESKI PALUDO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "433",
}

const PF_0368: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0368',
  nome_completo: "RENAN PRADO SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "575",
}

const PF_0369: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0369',
  nome_completo: "RENATO FARHAT DOS SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "4793499",
}

const PF_0370: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0370',
  nome_completo: "RENATO SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "332",
}

const PF_0371: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0371',
  nome_completo: "RENATO SOUSA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "499",
}

const PF_0372: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0372',
  nome_completo: "RENE SOUZA ALECRIM",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "138",
}

const PF_0373: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0373',
  nome_completo: "RENEE FERNANDES CORDEIRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "970754",
}

const PF_0374: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0374',
  nome_completo: "RICELLY HENRIQUE TAVARES REIS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1428329",
}

const PF_0375: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0375',
  nome_completo: "ROBERTO PEDREIRA SAMPAIO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1393396",
}

const PF_0376: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0376',
  nome_completo: "RODOLFO BOMFIM ALESSI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1237026",
}

const PF_0377: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0377',
  nome_completo: "RODRIGO COSTA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "530",
}

const PF_0378: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0378',
  nome_completo: "RODRIGO MER",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "380",
}

const PF_0379: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0379',
  nome_completo: "RODRIGO OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "365",
}

const PF_0380: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0380',
  nome_completo: "RODRIGO REYS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "534",
}

const PF_0381: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0381',
  nome_completo: "RODRYGO REIS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "388",
}

const PF_0382: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0382',
  nome_completo: "ROLANDO AUGUSTO CABRERA NOBLE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1255499",
}

const PF_0383: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0383',
  nome_completo: "ROMARIO LEMOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "422",
}

const PF_0384: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0384',
  nome_completo: "ROMINHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "362",
}

const PF_0385: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0385',
  nome_completo: "RONAIR ALVES BORGES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "63",
}

const PF_0386: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0386',
  nome_completo: "RONALDO APARECIDO CAVALHEIRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1783118",
}

const PF_0387: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0387',
  nome_completo: "SALGADINHO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "547",
}

const PF_0388: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0388',
  nome_completo: "SANDOVAL NOGUEIRA DE MORAES NETO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "313",
}

const PF_0389: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0389',
  nome_completo: "SEAN GLEASON",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "439",
}

const PF_0390: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0390',
  nome_completo: "SERGIO ANTONIO DA COSTA NETO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "448",
}

const PF_0391: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0391',
  nome_completo: "SERGIO MACHADO ALMEIDA JUNIOR",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "110",
}

const PF_0392: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0392',
  nome_completo: "SERGIO MARCIO COSTA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1382602",
}

const PF_0393: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0393',
  nome_completo: "SPARTACO LUIZ NEVES VEZZANI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1779915",
}

const PF_0394: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0394',
  nome_completo: "TARIK ARAUJO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "151",
}

const PF_0395: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0395',
  nome_completo: "TAYRONE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "562",
}

const PF_0396: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0396',
  nome_completo: "THALES ALLAN SANTOS HUMBERTO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1273596",
}

const PF_0397: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0397',
  nome_completo: "THAMARA KATHLEN GOMES DE CASTRO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "526",
}

const PF_0398: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0398',
  nome_completo: "THAWAN DOUGLAS ALVES DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "306",
}

const PF_0399: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0399',
  nome_completo: "THIAGO ANANIAS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "7386579",
}

const PF_0400: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0400',
  nome_completo: "THIAGO BERTOLDO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "517",
}

const PF_0401: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0401',
  nome_completo: "THIAGO CARNEIRO DE CASTRO OLIVEIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "312",
}

const PF_0402: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0402',
  nome_completo: "THIAGO HENRIQUE GOMES PEGO DOS SANTOS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "494",
}

const PF_0403: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0403',
  nome_completo: "THIAGO JOSE GOMES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "536",
}

const PF_0404: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0404',
  nome_completo: "THIAGO MARQUES SOARES ROSA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "339",
}

const PF_0405: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0405',
  nome_completo: "TIAGO MARCELO PEIXOTO DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1047878",
}

const PF_0406: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0406',
  nome_completo: "TIERRE DE ARAUJO PAIXAO COSTA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "905627",
}

const PF_0407: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0407',
  nome_completo: "TIERRE DE ARAUJO PAUXAO COSTA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "464",
}

const PF_0408: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0408',
  nome_completo: "TOM BARATELLA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "407",
}

const PF_0409: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0409',
  nome_completo: "V PEREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "364",
}

const PF_0410: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0410',
  nome_completo: "VALDINEI JOSE DE SOUZA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "43",
}

const PF_0411: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0411',
  nome_completo: "VICTOR HUGO EULALIO DE PAULA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "456",
}

const PF_0412: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0412',
  nome_completo: "VICTOR MATEUS TAVARES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "434",
}

const PF_0413: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0413',
  nome_completo: "VINI MIRANDA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "396",
}

const PF_0414: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0414',
  nome_completo: "VINICIUS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "577",
}

const PF_0415: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0415',
  nome_completo: "VINICIUS DE OLIVEIRA MARQUES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "420",
}

const PF_0416: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0416',
  nome_completo: "VINICIUS GONCALVES PIERI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: null,
}

const PF_0417: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0417',
  nome_completo: "VINICIUS NOVAIS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "383",
}

const PF_0418: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0418',
  nome_completo: "VINNY PERES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "142",
}

const PF_0419: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0419',
  nome_completo: "VITOR FERRARI",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "410",
}

const PF_0420: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0420',
  nome_completo: "VITOR YAGO GONCALVES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "555",
}

const PF_0421: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0421',
  nome_completo: "VPEREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "351",
}

const PF_0422: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0422',
  nome_completo: "WAGUIRE KAE MORENO MARTINS",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "498",
}

const PF_0423: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0423',
  nome_completo: "WALAS DIAS DA SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "285",
}

const PF_0424: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0424',
  nome_completo: "WALERIA LEAO DE MORAES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "92925",
}

const PF_0425: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0425',
  nome_completo: "WANDERSON ANTONIO SOARES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "882377",
}

const PF_0426: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0426',
  nome_completo: "WESLEY HENRIQUE LUSTOSA ALVES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "277",
}

const PF_0427: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0427',
  nome_completo: "WILLIAM DANIEL DE BRITO",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "21",
}

const PF_0428: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0428',
  nome_completo: "WILLIAN PEREIRA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "135",
}

const PF_0429: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0429',
  nome_completo: "WOLNEY IRES SOUSA GONCALVES",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "1916051",
}

const PF_0430: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0430',
  nome_completo: "WS DA NORTE",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "391",
}

const PF_0431: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0431',
  nome_completo: "WTEYKSON SILVA E SILVA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "532",
}

const PF_0432: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0432',
  nome_completo: "YURI FERREIRA DE ALMEIDA",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "143",
}

const PF_0433: TitularPessoaFisica = {
  titular_id: 'cwr-pf-0433',
  nome_completo: "ZAINNETH JEREMY CLAASEN",
  cpf: null,
  rg: null,
  data_nasc: null,
  nacionalidade: 'Brasileira',
  estado_civil: null,
  profissao: 'Compositor/Autor',
  nome_artistico_principal: null,
  sociedade_autoral: '189',
  cae: null,
  ipi: "133",
}

// ── Array principal ───────────────────────────────────────────────

export const MOCK_TITULARES_CWR: TitularComDados[] = []

// Stats: 433 autores PF + 6 editoras PJ = 439 titulares únicos
// Fonte: 760 obras do CWR CW260020TSL_189.V21