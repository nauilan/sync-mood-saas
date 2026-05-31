// lib/modelos-cessao.ts
// 4 modelos pré-prontos de Cessão de Obras com cláusulas jurídicas reais

import type { ModeloCessao } from './types-contratos'
import { TODOS_DIREITOS_CESSAO } from './types-contratos'

export const MODELOS_CESSAO: ModeloCessao[] = [
  // ── 1. Cessão Total Brasil ────────────────────────────────────────────────
  {
    id: 'mc-total-br',
    nome: 'Cessão Total Brasil',
    descricao: 'Cessão completa de todos os 8 direitos para o território nacional. Split padrão 75/25.',
    tipo_cessao: 'total_brasil',
    direitos_padrao: TODOS_DIREITOS_CESSAO,
    territorio_padrao: 'BR',
    splits_padrao_br: { pct_titular: 75, pct_editora: 25 },
    splits_padrao_ext: { pct_titular: 50, pct_editora: 50 },
    vigencia_padrao_anos: 3,
    clausulas: `CONTRATO DE CESSÃO PARCIAL DE DIREITOS AUTORAIS — TERRITÓRIO BRASIL

CEDENTE: [TITULAR_NOME], [TITULAR_QUALIFICACAO], portador(a) do CPF/CNPJ nº [TITULAR_CPFDOC], residente/sediado(a) em [TITULAR_ENDERECO], doravante denominado(a) simplesmente CEDENTE.

CESSIONÁRIA: [EDITORA_RAZAO_SOCIAL], pessoa jurídica de direito privado, inscrita no CNPJ sob nº [EDITORA_CNPJ], com sede em [EDITORA_ENDERECO], doravante denominada simplesmente CESSIONÁRIA.

As partes acima qualificadas celebram o presente Contrato de Cessão Parcial de Direitos Autorais para o Território Brasil, que se regerá pelas seguintes cláusulas:

CLÁUSULA PRIMEIRA – DO OBJETO
O CEDENTE, na qualidade de titular dos direitos patrimoniais sobre as obras musicais listadas no Anexo I, cede à CESSIONÁRIA, em caráter exclusivo, dentro do Território Brasil, os seguintes direitos patrimoniais: (a) reprodução fonomecânica; (b) sincronização em obras audiovisuais; (c) execução pública e comunicação ao público; (d) distribuição e disponibilização em plataformas digitais de streaming; (e) reprodução gráfica (partituras e letras impressas); (f) utilização em obras dramáticas e dramático-musicais; e (h) autorização para adaptações e obras derivativas.

CLÁUSULA SEGUNDA – DA PARTICIPAÇÃO
Sobre os valores líquidos arrecadados e recebidos pela CESSIONÁRIA em decorrência dos direitos cedidos, fica estabelecida a seguinte divisão:
I – Território Brasil: 75% (setenta e cinco por cento) ao CEDENTE e 25% (vinte e cinco por cento) à CESSIONÁRIA.

CLÁUSULA TERCEIRA – DA REGRA DE OURO
Fica expressamente vedado que a CESSIONÁRIA retenha, em território nacional, percentual superior ao do CEDENTE. A divisão mínima garantida ao CEDENTE no Brasil é de 50,01% (cinquenta vírgula zero um por cento) sobre qualquer direito cedido.

CLÁUSULA QUARTA – DA EXCLUSIVIDADE
A cessão ora pactuada é exclusiva para o Território Brasil, pelo prazo de vigência deste instrumento.

CLÁUSULA QUINTA – DA VIGÊNCIA
O presente contrato vigorará pelo prazo de [VIGENCIA_ANOS] ([VIGENCIA_ANOS_EXTENSO]) anos, a contar da data de assinatura por ambas as partes, podendo ser renovado mediante acordo expresso.

CLÁUSULA SEXTA – DAS OBRIGAÇÕES DA CESSIONÁRIA
A CESSIONÁRIA obriga-se a: (a) registrar as obras cedidas nas entidades arrecadadoras e de gestão coletiva competentes; (b) prestar contas mensalmente ao CEDENTE, discriminando por direito e período os valores arrecadados; (c) promover, licenciar e defender os direitos patrimoniais cedidos; (d) repassar ao CEDENTE sua participação no prazo máximo de 30 (trinta) dias após o recebimento.

CLÁUSULA SÉTIMA – DAS OBRIGAÇÕES DO CEDENTE
O CEDENTE obriga-se a: (a) garantir a titularidade plena sobre os direitos cedidos; (b) não ceder, total ou parcialmente, os mesmos direitos a terceiros durante a vigência; (c) comunicar à CESSIONÁRIA qualquer litígio ou reivindicação sobre as obras cedidas.

CLÁUSULA OITAVA – DA RETENÇÃO FISCAL
Os pagamentos realizados ao CEDENTE estarão sujeitos às retenções fiscais previstas em lei, conforme a natureza jurídica do CEDENTE. Caso o CEDENTE seja pessoa física, incidirá IRRF conforme tabela progressiva vigente. Caso seja pessoa jurídica, não haverá retenção de IRRF sobre royalties autorais.

CLÁUSULA NONA – DO FORO
As partes elegem o foro da Comarca de [FORO_CIDADE]/[FORO_ESTADO] para dirimir quaisquer controvérsias oriundas do presente instrumento, renunciando a qualquer outro, por mais privilegiado que seja.`,
    clausulas_reversao: `CLÁUSULA DÉCIMA – DA REVERSÃO DOS DIREITOS
Na hipótese de a CESSIONÁRIA, por período superior a [REVERSAO_ANOS] ([REVERSAO_ANOS_EXTENSO]) anos consecutivos, deixar de explorar economicamente as obras cedidas, ficam revertidos automaticamente ao CEDENTE todos os direitos objeto deste contrato, independentemente de notificação ou interpelação judicial.`,
  },

  // ── 2. Cessão Total Mundo ─────────────────────────────────────────────────
  {
    id: 'mc-total-mundo',
    nome: 'Cessão Total Mundo',
    descricao: 'Cessão completa de todos os 8 direitos para o território mundial. BR 75/25 | EXT 50/50.',
    tipo_cessao: 'total_mundo',
    direitos_padrao: TODOS_DIREITOS_CESSAO,
    territorio_padrao: 'MUNDIAL',
    splits_padrao_br: { pct_titular: 75, pct_editora: 25 },
    splits_padrao_ext: { pct_titular: 50, pct_editora: 50 },
    vigencia_padrao_anos: 5,
    clausulas: `CONTRATO DE CESSÃO TOTAL DE DIREITOS AUTORAIS — TERRITÓRIO MUNDIAL

CEDENTE: [TITULAR_NOME], [TITULAR_QUALIFICACAO], portador(a) do CPF/CNPJ nº [TITULAR_CPFDOC], residente/sediado(a) em [TITULAR_ENDERECO], doravante denominado(a) simplesmente CEDENTE.

CESSIONÁRIA: [EDITORA_RAZAO_SOCIAL], pessoa jurídica de direito privado, inscrita no CNPJ sob nº [EDITORA_CNPJ], com sede em [EDITORA_ENDERECO], doravante denominada simplesmente CESSIONÁRIA.

CLÁUSULA PRIMEIRA – DO OBJETO
O CEDENTE cede à CESSIONÁRIA, em caráter exclusivo e mundial, todos os direitos patrimoniais de autor sobre as obras musicais listadas no Anexo I, incluindo, sem limitação: (a) reprodução fonomecânica; (b) sincronização audiovisual; (c) execução pública e comunicação ao público; (d) distribuição digital e streaming; (e) reprodução gráfica; (f) direitos dramáticos; (g) sub-edição internacional; e (h) adaptações e obras derivativas.

CLÁUSULA SEGUNDA – DA PARTICIPAÇÃO
I – Território Brasil: 75% (setenta e cinco por cento) ao CEDENTE e 25% (vinte e cinco por cento) à CESSIONÁRIA.
II – Exterior: 50% (cinquenta por cento) ao CEDENTE e 50% (cinquenta por cento) à CESSIONÁRIA, calculados sobre a quantia líquida efetivamente recebida no Brasil após dedução da comissão da sub-editora estrangeira.

CLÁUSULA TERCEIRA – DA REGRA DE OURO
É vedado que a CESSIONÁRIA retenha, em território nacional, percentual superior ao do CEDENTE. Em território exterior, aplica-se o princípio da divisão equânime conforme Cláusula Segunda, II.

CLÁUSULA QUARTA – DA SUB-EDIÇÃO INTERNACIONAL
A CESSIONÁRIA fica autorizada a contratar sub-editoras em territórios estrangeiros, desde que: (a) a comissão da sub-editora seja descontada antes do cálculo da participação do CEDENTE; (b) o CEDENTE seja informado dos contratos de sub-edição firmados.

CLÁUSULA QUINTA – DA VIGÊNCIA
O presente contrato vigorará pelo prazo de [VIGENCIA_ANOS] ([VIGENCIA_ANOS_EXTENSO]) anos, a contar da data de assinatura.

CLÁUSULA SEXTA – DAS OBRIGAÇÕES DA CESSIONÁRIA
A CESSIONÁRIA obriga-se a: (a) registrar as obras em entidades arrecadadoras nacionais e internacionais; (b) prestar contas mensalmente; (c) repassar valores ao CEDENTE em até 30 dias do recebimento; (d) defender a integridade moral das obras cedidas.

CLÁUSULA SÉTIMA – DA RETENÇÃO FISCAL
Sujeito às retenções legais vigentes conforme natureza do CEDENTE (PF: IRRF tabela progressiva; PJ: isento de IRRF sobre royalties autorais).

CLÁUSULA OITAVA – DO FORO
Foro da Comarca de [FORO_CIDADE]/[FORO_ESTADO].`,
    clausulas_reversao: `CLÁUSULA NONA – DA REVERSÃO
Não exploração econômica por [REVERSAO_ANOS] anos consecutivos implica reversão automática de todos os direitos ao CEDENTE.`,
  },

  // ── 3. Cessão Parcial — só Sincronização ─────────────────────────────────
  {
    id: 'mc-parcial-sync',
    nome: 'Cessão Parcial (Sincronização)',
    descricao: 'Cede apenas o direito de sincronização audiovisual. Demais direitos permanecem com o titular.',
    tipo_cessao: 'parcial_sincronizacao',
    direitos_padrao: ['sincronizacao_av'],
    territorio_padrao: 'MUNDIAL',
    splits_padrao_br: { pct_titular: 75, pct_editora: 25 },
    splits_padrao_ext: { pct_titular: 50, pct_editora: 50 },
    vigencia_padrao_anos: 2,
    clausulas: `CONTRATO DE CESSÃO PARCIAL DE DIREITOS AUTORAIS — SINCRONIZAÇÃO AUDIOVISUAL

CEDENTE: [TITULAR_NOME], portador(a) do CPF/CNPJ nº [TITULAR_CPFDOC].
CESSIONÁRIA: [EDITORA_RAZAO_SOCIAL], CNPJ nº [EDITORA_CNPJ].

CLÁUSULA PRIMEIRA – DO OBJETO
O presente instrumento tem por objeto a cessão exclusiva, pelo CEDENTE à CESSIONÁRIA, única e exclusivamente do direito de SINCRONIZAÇÃO AUDIOVISUAL (direito de autorizar, licenciar e negociar a sincronização das obras musicais listadas no Anexo I em produções audiovisuais, incluindo filmes, séries, publicidade, jogos eletrônicos, plataformas de vídeo e quaisquer obras audiovisuais). Os demais direitos patrimoniais sobre as obras permanecem integralmente com o CEDENTE.

CLÁUSULA SEGUNDA – DA PARTICIPAÇÃO
Sobre os valores líquidos de cada licença de sincronização concedida:
I – Brasil: 75% ao CEDENTE e 25% à CESSIONÁRIA.
II – Exterior: 50% ao CEDENTE e 50% à CESSIONÁRIA, calculados sobre valor líquido recebido no Brasil.

CLÁUSULA TERCEIRA – DA REGRA DE OURO
Vedada à CESSIONÁRIA participação superior à do CEDENTE em território nacional.

CLÁUSULA QUARTA – DAS APROVAÇÕES
Toda licença de sincronização depende de aprovação prévia do CEDENTE, exceto para: (a) trailers e chamadas de até 30 segundos; (b) conteúdos educacionais sem fins lucrativos.

CLÁUSULA QUINTA – DA VIGÊNCIA
Prazo de [VIGENCIA_ANOS] ([VIGENCIA_ANOS_EXTENSO]) anos, renováveis.

CLÁUSULA SEXTA – DAS OBRIGAÇÕES
A CESSIONÁRIA: (a) submeterá ao CEDENTE, mensalmente, relatório de todas as sincronizações licenciadas; (b) repassará valores em até 30 dias do recebimento; (c) não poderá sub-licenciar sem anuência expressa do CEDENTE.

CLÁUSULA SÉTIMA – DO FORO
Foro da Comarca de [FORO_CIDADE]/[FORO_ESTADO].`,
  },

  // ── 4. Cessão com Sub-edição Internacional ────────────────────────────────
  {
    id: 'mc-subedicao-intl',
    nome: 'Cessão c/ Sub-edição Internacional',
    descricao: 'Cessão total com cláusula específica de sub-edição para territories estrangeiros. Inclui direito g) Sub-edição Internacional.',
    tipo_cessao: 'subedicao_internacional',
    direitos_padrao: TODOS_DIREITOS_CESSAO,
    territorio_padrao: 'MUNDIAL',
    splits_padrao_br: { pct_titular: 75, pct_editora: 25 },
    splits_padrao_ext: { pct_titular: 50, pct_editora: 50 },
    vigencia_padrao_anos: 5,
    clausulas: `CONTRATO DE CESSÃO DE DIREITOS AUTORAIS COM SUB-EDIÇÃO INTERNACIONAL

CEDENTE: [TITULAR_NOME], portador(a) do CPF/CNPJ nº [TITULAR_CPFDOC], residente/sediado(a) em [TITULAR_ENDERECO].
CESSIONÁRIA: [EDITORA_RAZAO_SOCIAL], CNPJ nº [EDITORA_CNPJ], com sede em [EDITORA_ENDERECO].

CLÁUSULA PRIMEIRA – DO OBJETO E TERRITÓRIOS
O CEDENTE cede à CESSIONÁRIA, em caráter exclusivo, todos os direitos patrimoniais das obras do Anexo I, compreendendo: (a) fonomecânico; (b) sincronização audiovisual; (c) execução pública; (d) distribuição digital; (e) reprodução gráfica; (f) dramático; (g) sub-edição internacional; e (h) adaptações derivativas.
I – Território Brasil: administração direta pela CESSIONÁRIA.
II – Território Exterior: administração via sub-editoras a serem contratadas pela CESSIONÁRIA.

CLÁUSULA SEGUNDA – DA PARTICIPAÇÃO — BRASIL
Brasil: 75% (setenta e cinco por cento) ao CEDENTE e 25% (vinte e cinco por cento) à CESSIONÁRIA sobre valores líquidos arrecadados.

CLÁUSULA TERCEIRA – DA PARTICIPAÇÃO — EXTERIOR
No exterior: os valores arrecadados pelas sub-editoras são recebidos líquidos pela CESSIONÁRIA no Brasil (após dedução da comissão da sub-editora estrangeira, limitada a 25% do bruto no exterior). Sobre o valor líquido recebido no Brasil: 50% ao CEDENTE e 50% à CESSIONÁRIA.

CLÁUSULA QUARTA – DA SUB-EDIÇÃO
A CESSIONÁRIA fica expressamente autorizada a contratar sub-editoras em qualquer território estrangeiro, observados os seguintes limites:
(a) Comissão máxima da sub-editora: 25% do valor bruto arrecadado no território;
(b) A CESSIONÁRIA apresentará ao CEDENTE, semestralmente, lista das sub-editoras contratadas e territórios cobertos;
(c) Os contratos de sub-edição não poderão exceder o prazo deste instrumento.

CLÁUSULA QUINTA – DA REGRA DE OURO
A CESSIONÁRIA jamais poderá reter, em território nacional, percentual igual ou superior ao do CEDENTE. A mínima garantida ao CEDENTE no Brasil é de 50,01%.

CLÁUSULA SEXTA – DA VIGÊNCIA
Prazo de [VIGENCIA_ANOS] ([VIGENCIA_ANOS_EXTENSO]) anos. Renovação automática por igual período, salvo notificação de qualquer das partes com antecedência mínima de 90 dias.

CLÁUSULA SÉTIMA – DA PRESTAÇÃO DE CONTAS
A CESSIONÁRIA prestará contas mensalmente para receitas domésticas e trimestralmente para receitas internacionais, discriminando por território, direito e período.

CLÁUSULA OITAVA – DA RETENÇÃO FISCAL
Pagamentos ao CEDENTE: IRRF aplicável se PF; isento se PJ sobre royalties autorais, conforme legislação vigente.

CLÁUSULA NONA – DA REVERSÃO POR INEXPLORAÇÃO
Se a CESSIONÁRIA deixar de explorar economicamente as obras cedidas por período superior a [REVERSAO_ANOS] anos consecutivos, os direitos revertem automaticamente ao CEDENTE.

CLÁUSULA DÉCIMA – DO FORO
Foro da Comarca de [FORO_CIDADE]/[FORO_ESTADO].`,
    clausulas_reversao: `CLÁUSULA DÉCIMA PRIMEIRA – DA REVERSÃO AMPLIADA
Além da reversão por inexploração, revertem ao CEDENTE os direitos sobre obras específicas caso a CESSIONÁRIA não realize ao menos 1 (uma) colocação comercial por obra a cada 24 meses de vigência.`,
  },
]

export function getModeloCessaoPorId(id: string): ModeloCessao | undefined {
  return MODELOS_CESSAO.find(m => m.id === id)
}

export function getModeloCessaoPorTipo(tipo: string): ModeloCessao | undefined {
  return MODELOS_CESSAO.find(m => m.tipo_cessao === tipo)
}
