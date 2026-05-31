// ============================================================
// modelos-juridicos-v2.ts — 9 modelos juridicos PT-BR
// Sync Mood Gestao Inteligente — M2 Contratos
// Um modelo por tipo de contrato, com variaveis {{...}}
// ============================================================

import type { TipoContratoV2, ModeloJuridicoV2 } from './types-contratos-v2'

// ── Variaveis de template disponiveis ────────────────────────────────────────
// {{titular_nome}}        — Nome completo do titular
// {{cpf}}                 — CPF do titular (PF)
// {{cnpj}}                — CNPJ da empresa (PJ)
// {{rg}}                  — RG do titular
// {{endereco_completo}}   — Endereco completo
// {{editora_nome}}        — Nome da editora
// {{editora_cnpj}}        — CNPJ da editora
// {{obra_titulo}}         — Titulo da obra
// {{obra_codigo}}         — Codigo interno da obra
// {{vigencia_inicio}}     — Data de inicio da vigencia
// {{vigencia_fim}}        — Data de fim da vigencia (ou "prazo indeterminado")
// {{percentual_titular}}  — Percentual do titular (ex: 75%)
// {{percentual_editora}}  — Percentual da editora (ex: 25%)
// {{territorio}}          — Territorio de abrangencia
// {{moeda}}               — Moeda (BRL, USD, EUR)
// {{comissao}}            — Percentual de comissao (subedicao)
// {{administradora_nome}} — Nome da editora administradora
// {{cessionario_nome}}    — Nome do cessionario
// {{obras_lista}}         — Lista de obras vinculadas
// {{data_assinatura}}     — Data de assinatura

// ── Templates ────────────────────────────────────────────────────────────────

const TEMPLATE_CESSAO_PARCIAL = `CONTRATO DE CESSAO PARCIAL DE DIREITOS AUTORAIS PATRIMONIAIS

Pelo presente instrumento particular, de um lado:

CEDENTE: {{titular_nome}}, portador(a) do CPF n. {{cpf}}, RG n. {{rg}}, residente e domiciliado(a) em {{endereco_completo}}, doravante denominado(a) simplesmente CEDENTE;

CESSIONARIA: {{editora_nome}}, pessoa juridica de direito privado, inscrita no CNPJ sob n. {{editora_cnpj}}, doravante denominada CESSIONARIA;

Tendo entre si como justo e acordado o seguinte:

CLAUSULA 1 - DO OBJETO
O CEDENTE cede parcialmente a CESSIONARIA os direitos autorais patrimoniais sobre as obras musicais listadas neste contrato ({{obras_lista}}), conforme direitos e percentuais especificados no Anexo I.

CLAUSULA 2 - DOS PERCENTUAIS
Os direitos ora cedidos observam a seguinte divisao:
- Titular/Autor: {{percentual_titular}}% sobre os rendimentos gerados pelas obras no territorio {{territorio}};
- Editora Cessionaria: {{percentual_editora}}% sobre os rendimentos gerados pelas obras no territorio {{territorio}}.

Os percentuais acima sao flexibilizaveis por aditivo contratual, observado o minimo legal.

CLAUSULA 3 - DA VIGENCIA
O presente contrato vigorara de {{vigencia_inicio}} ate {{vigencia_fim}}.

CLAUSULA 4 - DO TERRITORIO
O presente contrato abrange o territorio {{territorio}}.

CLAUSULA 5 - DA EXCLUSIVIDADE
A cessao de direitos ora realizada nao implica exclusividade autoral, salvo clausula especifica em Anexo.

CLAUSULA 6 - DA REVERSAO DOS DIREITOS
Os direitos cedidos reverterao automaticamente ao CEDENTE caso a CESSIONARIA nao promova a exploracao comercial das obras por periodo superior a 2 (dois) anos.

CLAUSULA 7 - DAS OBRIGACOES DA CESSIONARIA
A CESSIONARIA se compromete a: (i) registrar as obras nas sociedades autorais competentes; (ii) prestar contas mensalmente ao CEDENTE; (iii) distribuir os royalties conforme percentuais estabelecidos.

CLAUSULA 8 - DA LEGISLACAO APLICAVEL
O presente contrato e regido pela Lei n. 9.610/1998 (Lei de Direitos Autorais) e pelas disposicoes do Codigo Civil Brasileiro.

{{endereco_completo}}, {{data_assinatura}}.

_______________________________        _______________________________
{{titular_nome}}                        {{editora_nome}}
CEDENTE                                 CESSIONARIA
CPF: {{cpf}}                            CNPJ: {{editora_cnpj}}`

const TEMPLATE_CESSAO_TOTAL = `CONTRATO DE CESSAO TOTAL DE DIREITOS AUTORAIS PATRIMONIAIS

Pelo presente instrumento particular, de um lado:

CEDENTE: {{titular_nome}}, portador(a) do CPF n. {{cpf}}, RG n. {{rg}}, residente e domiciliado(a) em {{endereco_completo}};

ADQUIRENTE: {{editora_nome}}, pessoa juridica de direito privado, inscrita no CNPJ sob n. {{editora_cnpj}};

CLAUSULA 1 - DO OBJETO E EXTENSAO
O CEDENTE transfere integralmente a ADQUIRENTE TODOS os direitos autorais patrimoniais sobre as obras musicais ({{obras_lista}}), incluindo mas nao se limitando a: reproducao grafica, fonomecanica, audiovisual, publicitaria, distribuicao digital, base de dados, comunicacao ao publico e autorizacoes com onus, em carater MUNDIAL e por PRAZO INDETERMINADO.

CLAUSULA 2 - DA CONTRAPRESTACAO
A ADQUIRENTE pagara ao CEDENTE o valor acordado em Anexo Financeiro como contraprestacao unica e integral pela cessao ora realizada.

CLAUSULA 3 - DA NATUREZA DA CESSAO
O CEDENTE permanece como CRIADOR das obras para fins de direitos morais autorais, constando em cadastros das sociedades autorais (ECAD/SOCINPRO/UBC/ABRAMUS), porem DEIXA DE SER RECEBEDOR FINANCEIRO a partir da assinatura deste instrumento.

CLAUSULA 4 - DA VIGENCIA
O presente contrato vigorara a partir de {{vigencia_inicio}}, por prazo indeterminado.

CLAUSULA 5 - DA IRREVOGABILIDADE
A cessao total e irrevogavel e irretratavel, salvo acordo escrito entre as partes.

CLAUSULA 6 - DA LEGISLACAO APLICAVEL
Regido pela Lei n. 9.610/1998.

{{endereco_completo}}, {{data_assinatura}}.

_______________________________        _______________________________
{{titular_nome}}                        {{editora_nome}}
CEDENTE                                 ADQUIRENTE`

const TEMPLATE_LICENCIAMENTO = `CONTRATO DE LICENCIAMENTO DE DIREITOS AUTORAIS

Licenciante: {{titular_nome}}, CPF/CNPJ: {{cpf}};
Licenciada: {{editora_nome}}, CNPJ: {{editora_cnpj}};

CLAUSULA 1 - DO OBJETO
O LICENCIANTE concede a LICENCIADA licenca NAO-EXCLUSIVA (salvo disposicao em contrario) para utilizacao dos direitos autorais patrimoniais sobre as obras musicais ({{obras_lista}}) durante o PERIODO e no TERRITORIO especificados neste instrumento.

CLAUSULA 2 - DO PERIODO
A presente licenca vigorara de {{vigencia_inicio}} a {{vigencia_fim}}, podendo ser renovada por igual periodo mediante acordo expresso das partes.

CLAUSULA 3 - DO TERRITORIO
Territorio de abrangencia: {{territorio}}.

CLAUSULA 4 - DA CONTRAPRESTACAO E ROYALTIES
A LICENCIADA pagara ao LICENCIANTE {{percentual_titular}}% sobre os rendimentos liquidos gerados pela exploracao das obras no territorio e periodo licenciados, sendo {{percentual_editora}}% retidos pela LICENCIADA a titulo de comissao de administracao.

CLAUSULA 5 - DA MANUTENCAO DOS DIREITOS MORAIS
O LICENCIANTE mantem integralmente os direitos morais sobre as obras, incluindo direito de paternidade, integridade e inedito.

CLAUSULA 6 - DA REVOGACAO
Esta licenca podera ser revogada a qualquer tempo, mediante notificacao com antecedencia minima de 90 (noventa) dias.

CLAUSULA 7 - DA LEGISLACAO APLICAVEL
Regido pela Lei n. 9.610/1998.

{{endereco_completo}}, {{data_assinatura}}.

_______________________________        _______________________________
{{titular_nome}}                        {{editora_nome}}
LICENCIANTE                             LICENCIADA`

const TEMPLATE_ADMINISTRACAO_EDITORIAL = `CONTRATO DE ADMINISTRACAO EDITORIAL

Administrado(a): {{titular_nome}}, CPF/CNPJ: {{cpf}};
Editora Original: {{editora_nome}}, CNPJ: {{editora_cnpj}};
Administradora: {{administradora_nome}};

CLAUSULA 1 - DO OBJETO
O(A) ADMINISTRADO(A) e a EDITORA ORIGINAL autorizam a ADMINISTRADORA a operar, exportar, cobrar e licenciar os direitos autorais patrimoniais das obras musicais ({{obras_lista}}), sendo certo que a ADMINISTRADORA NAO adquire propriedade sobre as obras, atuando exclusivamente como gestora.

CLAUSULA 2 - DA NATUREZA DA ADMINISTRACAO
A ADMINISTRACAO EDITORIAL e distinta de PROPRIEDADE. A EDITORA ORIGINAL permanece como titular dos percentuais editoriais, e a ADMINISTRADORA atua como mandataria, podendo coexistir EDITORA ORIGINAL + ADMINISTRADORA simultaneamente no mesmo link editorial.

CLAUSULA 3 - DA REMUNERACAO
A ADMINISTRADORA reterao {{percentual_editora}}% sobre os valores coletados e distribuidos como honorarios de administracao. Os {{percentual_titular}}% restantes serao repassados ao(a) ADMINISTRADO(A) e/ou EDITORA ORIGINAL conforme percentuais acordados.

CLAUSULA 4 - DAS ATRIBUICOES DA ADMINISTRADORA
Cabe a ADMINISTRADORA: (i) registro perante sociedades autorais (ECAD, UBC, ABRAMUS, SOCINPRO); (ii) representacao perante subeditoras internacionais; (iii) cobranca e distribuicao de royalties; (iv) prestacao de contas mensal; (v) emissao de autorizacoes de uso.

CLAUSULA 5 - DA VIGENCIA
De {{vigencia_inicio}} a {{vigencia_fim}}.

CLAUSULA 6 - DA LEGISLACAO APLICAVEL
Regido pela Lei n. 9.610/1998 e pelo Codigo Civil Brasileiro.

{{endereco_completo}}, {{data_assinatura}}.

_______________________________
{{titular_nome}} / {{editora_nome}} (Administrado/Editora Original)

_______________________________
{{administradora_nome}} (Administradora)`

const TEMPLATE_COEDICAO = `CONTRATO DE CO-EDICAO MUSICAL

Co-editora A: {{titular_nome}}, CPF/CNPJ: {{cpf}};
Co-editora B: {{editora_nome}}, CNPJ: {{editora_cnpj}};

CLAUSULA 1 - DO OBJETO
As partes celebram o presente CONTRATO DE CO-EDICAO sobre as obras musicais ({{obras_lista}}), dividindo o controle editorial e os percentuais conforme especificado no Anexo de Participacoes.

CLAUSULA 2 - DA DIVISAO DE CONTROLE
As CO-EDITORAS concordam que:
- Co-editora A: {{percentual_titular}}% dos direitos editoriais;
- Co-editora B: {{percentual_editora}}% dos direitos editoriais;

A COEDICAO e distinta de ADMINISTRACAO. Cada co-editora detem propriedade proporcional e pode ter percentuais e territorios distintos, desde que a soma total seja 100%.

CLAUSULA 3 - DOS TERRITORIOS
Cada co-editora podera deter participacoes diferenciadas por territorio, conforme Anexo de Territorios.

CLAUSULA 4 - DAS DECISOES CONJUNTAS
Decisoes relevantes sobre as obras (sincronizacoes, licencas, alteracoes cadastrais nas sociedades) devem ser acordadas por ambas as co-editoras, salvo delegacao expressa.

CLAUSULA 5 - DA VIGENCIA
De {{vigencia_inicio}} a {{vigencia_fim}}.

CLAUSULA 6 - DA LEGISLACAO APLICAVEL
Regido pela Lei n. 9.610/1998.

{{endereco_completo}}, {{data_assinatura}}.

_______________________________        _______________________________
{{titular_nome}}                        {{editora_nome}}
CO-EDITORA A                            CO-EDITORA B`

const TEMPLATE_SUBEDICAO = `CONTRATO DE SUBEDICAO

Editora Principal: {{editora_nome}}, CNPJ: {{editora_cnpj}};
Subeditora: {{cessionario_nome}};

CLAUSULA 1 - DO OBJETO
A EDITORA PRINCIPAL outorga a SUBEDITORA direito de representacao e administracao das obras musicais ({{obras_lista}}) no territorio especificado, para fins de sub-publicacao, sublicenciamento e cobranca de royalties internacionais.

CLAUSULA 2 - DO TERRITORIO E MOEDA
A presente subedicao abrange o territorio: {{territorio}}.
As transacoes serao realizadas em: {{moeda}}.

CLAUSULA 3 - DA COMISSAO
A SUBEDITORA retera {{comissao}}% sobre os valores liquidos recebidos no territorio, repassando o saldo remanescente a EDITORA PRINCIPAL no prazo de 30 dias apos recebimento.

CLAUSULA 4 - DO PRAZO
De {{vigencia_inicio}} a {{vigencia_fim}}.

CLAUSULA 5 - DOS RECEBIMENTOS INTERNACIONAIS
Os valores recebidos pela SUBEDITORA serao reportados mensalmente a EDITORA PRINCIPAL, com demonstrativo detalhado por obra, direito, territorio e fonte de receita.

CLAUSULA 6 - DA SUB-SUBLICENCA
E vedado a SUBEDITORA sub-sublicenciar as obras sem autorizacao previa e escrita da EDITORA PRINCIPAL.

CLAUSULA 7 - DA LEGISLACAO APLICAVEL
Regido pela lei do territorio {{territorio}} e, subsidiariamente, pela legislacao brasileira.

{{endereco_completo}}, {{data_assinatura}}.

_______________________________        _______________________________
{{editora_nome}}                        {{cessionario_nome}}
EDITORA PRINCIPAL                       SUBEDITORA`

const TEMPLATE_CESSAO_INTERNACIONAL = `CONTRATO DE CESSAO INTERNACIONAL DE DIREITOS AUTORAIS

Titular: {{titular_nome}}, CPF: {{cpf}};
Editora BR: {{editora_nome}}, CNPJ: {{editora_cnpj}};

CLAUSULA 1 - DO OBJETO
O presente instrumento regula a cessao de direitos autorais em territorio INTERNACIONAL (EXTERIOR), separadamente dos direitos nacionais (BR), sobre as obras musicais ({{obras_lista}}).

CLAUSULA 2 - DA SEPARACAO BR/EXTERIOR
Fica expressamente acordado que:
- No BRASIL: os direitos sao regidos por contrato especifico (Contrato BR vinculado), com percentuais proprios;
- NO EXTERIOR: os direitos cedidos neste instrumento observam o percentual de {{percentual_titular}}% para o TITULAR e {{percentual_editora}}% para a EDITORA, calculados sobre o liquido recebido no Brasil via subeditora exterior.

CLAUSULA 3 - DA COEXISTENCIA
E possivel e previsto que coexistam simultaneamente: Editora BR + Subeditora Exterior + Administradora Digital na mesma obra, com territorios e percentuais proprios.

CLAUSULA 4 - DA VIGENCIA
De {{vigencia_inicio}} a {{vigencia_fim}}.

CLAUSULA 5 - DO REGISTRO INTERNACIONAL
A EDITORA se compromete a registrar as obras nas sociedades internacionais competentes e nas plataformas de distribuicao digital globais.

CLAUSULA 6 - DA LEGISLACAO APLICAVEL
Regido pela Lei n. 9.610/1998 e pelos tratados internacionais ratificados pelo Brasil (Convencao de Berna, TRIPS).

{{endereco_completo}}, {{data_assinatura}}.

_______________________________        _______________________________
{{titular_nome}}                        {{editora_nome}}
TITULAR                                 EDITORA`

const TEMPLATE_CESSIONARIO_PJ = `CONTRATO DE CESSAO DE RECEBIMENTOS A PESSOA JURIDICA (SEM INCIDENCIA DE IRPF)

CEDENTE: {{titular_nome}}, CPF: {{cpf}}, na qualidade de AUTOR/CRIADOR das obras musicais;
CESSIONARIA PJ: {{cessionario_nome}}, CNPJ: {{cnpj}};
EDITORA: {{editora_nome}}, CNPJ: {{editora_cnpj}};

CLAUSULA 1 - DO OBJETO
O CEDENTE transfere o RECEBIMENTO dos royalties autorais gerados pelas obras musicais ({{obras_lista}}) para a CESSIONARIA PJ, sendo esta pessoa juridica de titularidade ou vinculo do CEDENTE.

CLAUSULA 2 - DA MANUTENCAO DA AUTORIA
O CEDENTE permanece como CRIADOR E AUTOR das obras para todos os fins de direitos morais, registros nas sociedades autorais, creditos no CWR e historico contratual. Apenas o RECEBIMENTO FINANCEIRO e transferido para a CESSIONARIA PJ.

CLAUSULA 3 - DA NAO INCIDENCIA DO IRPF
Por se tratar de cessao de recebimentos a pessoa juridica, NAO INCIDE retencao de IRRF (Imposto de Renda Retido na Fonte) sobre os valores distribuidos, nos termos da legislacao tributaria vigente.

CLAUSULA 4 - DA RESPONSABILIDADE TRIBUTARIA DA CESSIONARIA
A CESSIONARIA PJ e responsavel pelo recolhimento dos tributos devidos sobre os valores recebidos, conforme seu enquadramento tributario (Simples Nacional, Lucro Presumido ou Lucro Real).

CLAUSULA 5 - DA VIGENCIA
De {{vigencia_inicio}} a {{vigencia_fim}}.

CLAUSULA 6 - DA LEGISLACAO APLICAVEL
Regido pela Lei n. 9.610/1998 e pelo Regulamento do Imposto de Renda vigente.

{{endereco_completo}}, {{data_assinatura}}.

_______________________________        _______________________________
{{titular_nome}}                        {{cessionario_nome}}
CEDENTE (AUTOR)                         CESSIONARIA PJ
CPF: {{cpf}}                            CNPJ: {{cnpj}}`

const TEMPLATE_CESSIONARIO_PF = `CONTRATO DE CESSAO DE RECEBIMENTOS A PESSOA FISICA (COM INCIDENCIA DE IRPF)

CEDENTE: {{titular_nome}}, CPF: {{cpf}};
CESSIONARIO PF: {{cessionario_nome}}, CPF: {{cnpj}};
EDITORA: {{editora_nome}}, CNPJ: {{editora_cnpj}};

CLAUSULA 1 - DO OBJETO
O CEDENTE transfere o RECEBIMENTO dos royalties autorais gerados pelas obras musicais ({{obras_lista}}) para o CESSIONARIO PF designado neste instrumento.

CLAUSULA 2 - DA MANUTENCAO DA AUTORIA
O CEDENTE permanece como CRIADOR E AUTOR das obras para todos os fins de direitos morais e registros nas sociedades autorais. Apenas o RECEBIMENTO FINANCEIRO e transferido ao CESSIONARIO PF.

CLAUSULA 3 - DA INCIDENCIA DE IRPF
Por se tratar de cessao de recebimentos a pessoa fisica, INCIDE retencao de IRRF (Imposto de Renda Retido na Fonte) sobre os valores distribuidos, conforme tabela progressiva vigente do Imposto de Renda.

CLAUSULA 4 - DA RESPONSABILIDADE TRIBUTARIA
A EDITORA fica responsavel pelo recolhimento do IRRF na fonte, devendo emitir informe de rendimentos anual ao CESSIONARIO PF.

CLAUSULA 5 - DA VIGENCIA
De {{vigencia_inicio}} a {{vigencia_fim}}.

CLAUSULA 6 - DA LEGISLACAO APLICAVEL
Regido pela Lei n. 9.610/1998 e pelo Regulamento do Imposto de Renda vigente.

ATENCAO: Este contrato IMPLICA OBRIGACAO TRIBUTARIA de IRPF para o CESSIONARIO PESSOA FISICA.

{{endereco_completo}}, {{data_assinatura}}.

_______________________________        _______________________________
{{titular_nome}}                        {{cessionario_nome}}
CEDENTE (AUTOR)                         CESSIONARIO PF
CPF: {{cpf}}                            CPF: {{cnpj}}`

// ── 9 modelos juridicos (1 por tipo) ────────────────────────────────────────

export const MODELOS_JURIDICOS_V2: ModeloJuridicoV2[] = [
  {
    id: 'mj-cessao-parcial',
    editora_id: 'ed-tsm',
    tipo_contrato: 'cessao_parcial',
    nome: 'Cessao Parcial Padrao',
    descricao: 'Modelo padrao para cessao parcial de direitos autorais patrimoniais. Splits BR 75/25, flexibilizaveis. Inclui clausula de reversao.',
    template_texto: TEMPLATE_CESSAO_PARCIAL,
    ativo: true,
    contagem_uso: 14,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'mj-cessao-total',
    editora_id: 'ed-tsm',
    tipo_contrato: 'cessao_total',
    nome: 'Cessao Total de Catalogo',
    descricao: 'Cessao total e irrevogavel de todos os direitos patrimoniais. Indicado para compra de catalogo. Autor mantem direitos morais.',
    template_texto: TEMPLATE_CESSAO_TOTAL,
    ativo: true,
    contagem_uso: 3,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-10-01T10:00:00Z',
  },
  {
    id: 'mj-licenciamento',
    editora_id: 'ed-tsm',
    tipo_contrato: 'licenciamento',
    nome: 'Licenciamento por Periodo',
    descricao: 'Licenca por periodo determinado, com ou sem exclusividade. Royalties pagos conforme uso. Autor mantem propriedade.',
    template_texto: TEMPLATE_LICENCIAMENTO,
    ativo: true,
    contagem_uso: 7,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-11-01T10:00:00Z',
  },
  {
    id: 'mj-administracao-editorial',
    editora_id: 'ed-tsm',
    tipo_contrato: 'administracao_editorial',
    nome: 'Administracao Editorial',
    descricao: 'Administradora opera/exporta/cobra sem adquirir propriedade. Editora original + administradora coexistem simultaneamente no link editorial.',
    template_texto: TEMPLATE_ADMINISTRACAO_EDITORIAL,
    ativo: true,
    contagem_uso: 9,
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-12-15T10:00:00Z',
  },
  {
    id: 'mj-coedicao',
    editora_id: 'ed-tsm',
    tipo_contrato: 'coedicao',
    nome: 'Co-edicao Musical',
    descricao: 'Duas editoras dividem controle editorial com percentuais proprios por territorio. Coedicao != administracao.',
    template_texto: TEMPLATE_COEDICAO,
    ativo: true,
    contagem_uso: 4,
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z',
  },
  {
    id: 'mj-subedicao',
    editora_id: 'ed-tsm',
    tipo_contrato: 'subedicao',
    nome: 'Subedicao Internacional',
    descricao: 'Editora representa outra em territorio especifico. Controla territorio, moeda, prazo, comissao e recebimentos internacionais.',
    template_texto: TEMPLATE_SUBEDICAO,
    ativo: true,
    contagem_uso: 2,
    created_at: '2024-04-01T10:00:00Z',
    updated_at: '2024-08-01T10:00:00Z',
  },
  {
    id: 'mj-cessao-internacional',
    editora_id: 'ed-tsm',
    tipo_contrato: 'cessao_internacional',
    nome: 'Cessao Internacional',
    descricao: 'Separa direitos BR e EXTERIOR. Permite coexistencia: editora BR + subeditora exterior + administradora digital na mesma obra.',
    template_texto: TEMPLATE_CESSAO_INTERNACIONAL,
    ativo: true,
    contagem_uso: 5,
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-11-15T10:00:00Z',
  },
  {
    id: 'mj-cessionario-pj',
    editora_id: 'ed-tsm',
    tipo_contrato: 'cessionario_pj',
    nome: 'Cessionario PJ — Sem IRPF',
    descricao: 'Autor transfere recebimentos para PJ propria. Autor continua criador no CWR/sociedade. Recebedor muda. NAO INCIDE IRPF.',
    template_texto: TEMPLATE_CESSIONARIO_PJ,
    ativo: true,
    contagem_uso: 6,
    created_at: '2024-02-15T10:00:00Z',
    updated_at: '2024-12-10T10:00:00Z',
  },
  {
    id: 'mj-cessionario-pf',
    editora_id: 'ed-tsm',
    tipo_contrato: 'cessionario_pf',
    nome: 'Cessionario PF — Com IRPF',
    descricao: 'Autor transfere recebimentos para outra pessoa fisica. Recebedor muda. INCIDE IRPF conforme tabela progressiva.',
    template_texto: TEMPLATE_CESSIONARIO_PF,
    ativo: true,
    contagem_uso: 2,
    created_at: '2024-05-01T10:00:00Z',
    updated_at: '2024-10-15T10:00:00Z',
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getModeloByTipo(tipo: TipoContratoV2): ModeloJuridicoV2 | undefined {
  return MODELOS_JURIDICOS_V2.find(m => m.tipo_contrato === tipo)
}

export function renderTemplate(template: string, variaveis: Record<string, string>): string {
  let resultado = template
  for (const [chave, valor] of Object.entries(variaveis)) {
    resultado = resultado.replaceAll(`{{${chave}}}`, valor)
  }
  return resultado
}
