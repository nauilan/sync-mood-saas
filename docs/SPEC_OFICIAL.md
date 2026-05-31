# SPEC OFICIAL — Sync Mood Gestão Inteligente
# Sistema de Gestão Editorial Musical Multi-Tenant

> Documento canonico. Toda implementacao deve seguir fielmente este spec.
> Origem: definicao do usuario em 2026-05-21.

## PREMISSA ESTRUTURAL

Sistema **WEB + APP** com arquitetura **multi-tenant/hub**:
- Editora administradora (ex: Top Show Music) opera por cima das editoras administradas (Edi Music, LR, P3, Lamu)
- Cada editora administrada tem identidade, contratos e acesso proprios
- Portal/App para autores (transparencia total)
- Operacao centralizada pela administradora, contratos descentralizados

## REGRA-MAE DO SISTEMA (FILOSOFIA)

```
TITULAR -> CONTRATO -> OBRA -> DIREITO -> RECEBIMENTO -> DISTRIBUICAO
```

O sistema NAO pensa primeiro em autor/obra/editora — pensa primeiro em **TITULAR**.

---

## MODULO 1 — CADASTROS

Tudo nasce como **TITULAR**. Depois o sistema define a funcao.

### Tipos com sigla
**Pessoa Fisica:**
- autor/compositor — CA
- versionista — V
- adaptador — AD
- cessionario PF
- herdeiro — CI
- interprete — I

**Pessoa Juridica:**
- editora ORIGINAL — E
- editora ADMINISTRADORA — AM
- SUBEDITORA — SE
- cessionario PJ
- gravadora
- produtora fonografica
- emissora de TV
- plataforma digital
- produtora audiovisual
- cliente
- agencia

### Tabelas principais
`titulares`, `titulares_pessoa_fisica`, `titulares_pessoa_juridica`, `titulares_funcoes`, `titulares_pseudonimos`, `editoras`, `cessionarios`, `gravadoras`, `emissoras_tv`, `clientes`, `documentos_titulares`, `contatos_titulares`, `dados_bancarios_titulares`

### IDs
Todo titular: `id_interno` + `codigo_titular` (codigo externo EDITAVEL para migracao de sistemas legados).

### Pseudonimos
- multiplos permitidos
- 1 principal ativo
- historico

### Controle de duplicidade
Validar antes de criar: CPF/CNPJ, nome, pseudonimo, telefone, email, CAE, IPI.

### Campos PF
Nome completo, CPF, RG, data nascimento, nacionalidade, estado civil, profissao, nome artistico/pseudonimo principal, outros pseudonimos, sociedade autoral, codigo CAE, codigo IPI, observacoes.

### Campos PJ
Razao social, nome fantasia, CNPJ, IE, IM, responsavel legal, sociedade autoral, CAE, IPI, site, observacoes.

### Endereco
CEP, endereco, numero, complemento, bairro, cidade, estado, pais.

### Contatos
Multiplos: telefone, WhatsApp, e-mail.

---

## MODULO 2 — CONTRATOS

Foco principal: **CONTRATOS DE CESSAO DE OBRAS**. O contrato e **OBRA-CENTRICO**, nao apenas titular-centrico.

### Fluxo
1. titular ja cadastrado
2. escolha do modelo
3. inclusao de uma ou mais obras
4. links editoriais
5. percentuais
6. letras
7. assinatura digital (via sistema)
8. validacao
9. liberacao do cadastro oficial da obra

### Origem
- pelo sistema (assinatura digital integrada)
- manual (upload PDF, contrato manuscrito, cartorio, legado)

### Tipos principais

**1. CESSAO (parcial)** — titular cede PARTE dos direitos patrimoniais.

Direitos BR — padrao 75% AUTORES / 25% EDITORA:
- a) Reproducao grafica (Edicao)
- b) Reproducao fonomecanica
- c) Inclusao/adaptacao audiovisual
- d) Inclusao/adaptacao publicitaria
- e) Distribuicao por meios oticos/cabo/satelite/redes
- f) Inclusao em base de dados
- g) Comunicacao ao publico
- h) Autorizacoes com onus

Direitos EXTERIOR — padrao 50/50 (sobre liquido recebido no BR via subeditor):
- a-g iguais aos do BR (sem item h)

> Percentuais SAO PADRAO mas FLEXIBILIZAVEIS.

**2. CESSAO TOTAL** — transfere integralmente. Compra de catalogo. Paga a CESSIONARIOS.

**3. LICENCIAMENTO** — transfere parcial OU integral POR PERIODO. Paga aos LICENCIADOS.

> Autor continua criador, aparece no CWR/cadastro/historico, mas DEIXA DE SER RECEBEDOR FINANCEIRO (em cessao total/licenciamento integral).

**4. ADMINISTRACAO EDITORIAL** — administradora opera/exporta/cobra/licencia, NAO e proprietaria. Link permite editora original + administradora simultaneamente. Administracao != propriedade.

**5. COEDICAO** — duas editoras dividem controle. Obra aceita multiplas editoras com percentuais e territorios diferentes. Coedicao != administracao.

**6. SUBEDICAO** — editora representa outra em territorio especifico. Controlar territorio, moeda, prazo, comissao, idioma, recebimentos internacionais.

**7. CESSAO INTERNACIONAL** — separar BR e EXTERIOR. Pode coexistir editora BR + subeditora exterior + administradora digital na mesma obra.

**8. CESSIONARIO PJ** — autor transfere recebimentos para PJ propria. Autor continua criador no CWR/sociedade. RECEBEDOR muda. **NAO INCIDE IRPF**.

**9. CESSIONARIO PF** — autor transfere recebimentos para outra PF. RECEBEDOR muda. **INCIDE IRPF**.

### CONTRATO DE EXCLUSIVIDADE AUTORAL
Autor so cadastra obras pela editora pelo periodo do contrato. Sistema deve:
- bloquear vinculo com outra editora ou alertar conflito
- alertar com antecedencia o termino/renovacao

### Tabelas
`contratos`, `contratos_partes`, `contratos_direitos`, `contratos_obras`, `contratos_obras_links`, `contratos_obras_links_titulares`, `contratos_assinaturas`, `contratos_recoupment`, `contratos_aditivos`, `contratos_historico`

### Assinatura digital
Preparar integracao: D4SIGN, DocuSign, ICP Brasil.

---

## MODULO 3 — OBRAS E CATALOGO

Entrada da obra: via contrato validado OU cadastro manual (contrato externo/manual).

### CONCEITO MAIS IMPORTANTE: LINKS DA OBRA
Obra nao e lista de autores. E composta por **LINKS DE PARTICIPACAO E CONTROLE**.

#### Exemplo — Obra "Amo Noite e Dia"
- Link 1: Nauilan/CA + Top Show Music/E
- Link 2: Giovani/CA + Edi Music/E + Top Show Music administradora/AM
- Link 3: Marcelo/CA (NAO ADMINISTRADO)
- Link 4: Joao Pedro/CA (NAO ADMINISTRADO)

Links 1-2: controle editorial. Links 3-4: autores diretos sem administracao.

### Regras
- percentual total = 100%
- autores podem existir sem administracao editorial
- link pode ter editora original + administradora
- obra pode ter multiplas editoras
- obra pode ter multiplos contratos
- futuros autores podem editar — sistema sempre abre cadastro da obra para diluir percentual

### ISWC
NAO nasce no cadastro. Preenchido apos retorno da sociedade. Integracao futura: SOCINPRO API + CWR.

### Tabelas
`obras`, `obras_links`, `obras_links_titulares`, `obras_contratos`, `obras_letras`, `obras_titulos`, `fonogramas`, `obras_exportacoes`, `obras_divergencias`

---

## MODULO 4 — AUTORIZACOES

CONTRATO cria controle editorial. AUTORIZACAO libera USO ESPECIFICO.

**REGRA-MAE: Editora so autoriza o percentual que controla.**

### Tipos principais
1. **Inclusao em fonograma** — com/sem exclusividade. Pode combinar com videofonograma.
2. **Inclusao em videofonograma** — com/sem exclusividade. Pode combinar com fonograma.
3. **Sincronizacao** — novela, serie, filme, documentario, programa TV, streaming, VOD, trailer, reality, vinheta. Tipos de uso: abertura, encerramento, tema, fundo, performance, trailer, teaser, chamada, vinheta.
4. **Publicidade** — campanha de marca, propaganda TV, internet ads, branded content. Costuma ter valor maior, prazo restrito, marca/anunciante, agencia, possibilidade de exclusividade.
5. **Incidental** — uso secundario/casual, NAO significa "sem autorizacao".

### Status
rascunho, em_analise, em_negociacao, aprovado, emitido, enviado, assinado, faturado, pago, vencido, cancelado, bloqueado.

### Tipos de negocio
1. RECEBIDO PELA EDITORA
2. SEM ONUS
3. RECEBIDO PELO AUTOR X
4. etc

### Tabelas
`autorizacoes`, `autorizacoes_obras`, `autorizacoes_links`, `autorizacoes_tipos`, `autorizacoes_precificacao`, `autorizacoes_documentos`

### Fluxo
solicitacao -> tipo -> obra -> sistema identifica links controlados -> calcula percentual controlado -> condicoes -> valor -> minuta -> aprovacao interna -> PDF -> assinatura -> cobranca -> recebimento -> distribuicao.

---

## MODULO 5 — EXPORTACAO (BACKOFFICE)

Menu chamado **"BACKOFFICE"**.

### Destinos
- SOCINPRO
- BackOffice MUSIC SERVICES
- parceiros internacionais

### Finalidades
- Sociedade: obras/autores/editoras/percentuais para cobranca e distribuicao corretas
- BackOffice: matching DSP, identificacao, recebimentos digitais

### Trabalha-se com **CWR**.

### Tabelas
`exportacoes`, `exportacoes_obras`, `exportacoes_logs`, `exportacoes_retorno`

---

## MODULO 6 — RECEBIMENTOS

### Fontes
1. **ECAD/SOCINPRO** — IMPORTAR DEMONSTRATIVOS apenas para CONTROLE/BI (ECAD ja paga titulares separadamente). NAO redistribuir.
2. **BackOffice MUSIC SERVICES** — pagamento DSPs via UBEM. **DISTRIBUICAO INTERNA**.
3. **Sync** — sincronizacao, publicidade, audiovisual, fonograma, videofonograma, incidental.
4. **Internacional** — subeditoras, sociedades estrangeiras, DSP internacional.
5. **Acordos diretos** — fora do ECAD/BackOffice/internacional tradicional.
6. **TV / Sincronizacao audiovisual** — modulo proprio: matching + cobranca + auditoria.

### REGRA DE OURO
- ECAD/SOCINPRO = informativo (BI/auditoria)
- BackOffice/Sync/Internacional/Acordos diretos = receita operacional COM distribuicao interna

### Conciliacao obrigatoria antes de distribuir
Validar: obra, links, percentuais, contratos, territorios, direitos, recebedor correto.

### Modulo TV (especifico, ALTO VALOR)
Plataforma operacional de auditoria + licensing + cobranca + sincronizacao.

**Fluxo TV:**
1. importacao planilhas (XLS/XLSX/CSV/PDF/cue sheets — formatos diferentes por emissora)
2. normalizacao
3. matching automatico (titulo+autor OU titulo+interprete; similaridade minima multipla)
4. identificacao tipo de uso (abertura/encerramento/tema/fundo/performance/incidental/teaser/chamada/trailer/publicidade)
5. calculo automatico (tabela: emissora/canal/plataforma/tipo_uso/ano/territorio/duracao/quantidade)
6. identificacao controle editorial (links controlados)
7. geracao autorizacao com clausula: "cobre exclusivamente o percentual sob controle editorial"
8. cobranca (boleto/PIX/invoice)
9. recebimento -> baixa -> distribuicao

**Tabelas TV:** `tv_importacoes`, `tv_execucoes`, `tv_matching`, `tv_divergencias`, `tv_precificacao`, `tv_autorizacoes`, `tv_recebimentos`, `tv_distribuicoes`

### Tabelas gerais
`recebimentos`, `recebimentos_importacoes`, `recebimentos_divergencias`, `recebimentos_fontes`, `recebimentos_logs`, `recebimentos_ecad`, `recebimentos_backoffice`, `recebimentos_sync`, `recebimentos_internacionais`, `recebimentos_acordos_diretos`

---

## MODULO 7 — CONCILIACAO
Validar recebimentos: localizar obra, titulares, contratos, percentuais; tratar divergencias.
Tabelas: `conciliacoes`, `conciliacoes_itens`, `conciliacoes_divergencias`.

---

## MODULO 8 — DISTRIBUICAO
Fluxo: **OBRA -> LINKS -> TITULARES -> CESSIONARIOS -> CONTA CORRENTE**.
Aplicar percentuais, retencoes, recoupment, taxas administrativas; respeitar cessoes PJ.
Tabelas: `distribuicoes`, `distribuicoes_itens`, `distribuicoes_retencoes`, `distribuicoes_recoupment`.

---

## MODULO 9 — CONTA CORRENTE (OBRA + TITULAR)

### REGRA DE OURO
**O DINHEIRO PERTENCE PRIMEIRO A OBRA. Depois a obra distribui aos titulares.**

### Fluxo
```
RECEBIMENTO -> CC OBRA -> regras contratuais -> links -> titulares/cessionarios -> CC TITULAR -> financeiro -> pagamento
```

### CC OBRA recebe (entradas operacionais)
BackOffice/DSP, sync, publicidade, fonograma, videofonograma, internacional, acordos diretos, audiovisual, licenciamento.

### CC OBRA NAO recebe distribuicao do ECAD
ECAD/SOCINPRO -> CC TITULAR da editora administradora (Top Show) e CC TITULAR de cada administrada (Edi Music importa o proprio demonstrativo). Apenas BI/auditoria/historico.

### CC TITULAR
Carteira financeira do titular. Recebe **DA OBRA**, nao do recebimento.

### Cessao PJ — IRPF NAO incide. Cessao PF — IRPF INCIDE.

### Recoupment antes de liberar saldo
Sistema verifica adiantamento aberto, abate, restante vai para CC titular.

### Bloqueios
sem contrato, sem link valido, sem percentual, titular bloqueado, sem dados bancarios, pagamento duplicado, cessao vencida.

### Tabelas
`contas_correntes_obras`, `contas_correntes_obras_movimentos`, `contas_correntes_obras_distribuicoes`, `contas_correntes_titulares`, `contas_correntes_titulares_movimentos`, `contas_correntes_titulares_retencoes`

---

## MODULO 10 — PRESTACAO DE CONTAS

- Geracao de recibos (envio AUTOMATICO via email/whatsapp)
- Geracao de relatorios (envio AUTOMATICO via email/whatsapp)
- Aprovacao, contestacao, historico

Tabelas: `prestacoes_contas`, `prestacoes_contas_itens`, `prestacoes_contas_envios`, `prestacoes_contas_contestacoes`.

---

## MODULO 11 — FINANCEIRO

Contas a pagar/receber, programacao, PIX/TED, conciliacao bancaria, fluxo de caixa, financeiro de grandes empresas.
Tabelas: `financeiro_pagamentos`, `financeiro_recebimentos`, `financeiro_fluxo_caixa`, `financeiro_conciliacao_bancaria`.

---

## MODULO 12 — BI E RELATORIOS (visao estrategica)

Indicadores: receitas por obra/titular/editora/fonte, contratos vencendo, obras/autores mais rentaveis, divergencias, sync, internacional, inadimplencia.

---

## MODULO 13 — RELATORIOS E BI (operacional+gerencial+estrategico)

### Categorias
1. Obras (cadastradas, ativas, pendentes, sem ISWC, sem contrato, divergentes)
2. Obras gravadas (fonogramas, ISRCs, gravadoras, sem autorizacao)
3. Titulares (autores, editoras, cessionarios, sem dados bancarios, sem CPF/CNPJ, sem CAE/IPI)
4. Contratos (ativos, pendentes, vencidos, a vencer, com adiantamento, com recoupment)
5. Autorizacoes (emitidas, pendentes, por obra/cliente/emissora/tipo)
6. Recebimentos (BackOffice/DSP, sync, internacional, acordos, ECAD informativo)
7. CC Obra (saldo, entradas, distribuidos, recoupment)
8. CC Titular (saldo, creditos, debitos, retencoes, disponivel, bloqueado, futuro)
9. Financeiros (a pagar, a receber, fluxo, programados, impostos, inadimplencia)
10. Royalties futuros (apurados, conciliados, previsao trimestre)
11. BI estrategico (mais rentaveis, DSPs, clientes, emissoras, crescimento)
12. Auditoria (alteracoes cadastro/bancario/contratual/percentual; export/import; usuarios)

### Filtros obrigatorios
periodo, obra, titular, editora, fonte, sociedade, status, tipo_direito, territorio, moeda, usuario.

### Exportacao
PDF, Excel, CSV.

---

## MODULO 14 — CONFIGURACOES

Usuarios, permissoes, perfis, logs, modelos contrato, modelos autorizacao, parametros financeiros, tipos de direitos, integracoes externas, APIs, auditoria.

---

## CAMADA MULTI-EDITORAS / EDITORAS ADMINISTRADAS

### Conceito
Editora administradora (Top Show Music) administra outras editoras no mesmo sistema:
- Edi Music, LR Edicoes Musicais, P3 Editora Musical, Editora Lamu, futuras

### Cada administrada tem
- proprio cadastro, propria logo, proprios modelos de contrato, gera contratos em seu nome, cadastra seus autores, ve suas obras/relatorios/receitas/demonstrativos

### Administradora tem CONTROLE MASTER
- valida contratos, valida obras, consolida catalogo, exporta para sociedades/BackOffice, importa recebimentos, concilia, distribui, gera prestacao de contas, controla financeiro/BI geral

### Fluxo administrada
1. administrada cadastra autor (titular, civil, pseudonimo, contatos, documentos, banco)
2. administrada gera contrato (sua razao social, sua logo, seu modelo, seus percentuais)
3. autor assina (digital)
4. administradora valida (titular, contrato, obras, percentuais, links, direitos, territorio, assinatura)
5. sistema gera obra/links — administrada como editora original, administradora como AM

> Obra so entra no catalogo operacional da administradora apos validacao do contrato assinado.

---

## PORTAL / APP DO AUTOR

### Acesso
1. Minhas obras (cadastradas, percentuais, coautores, editoras, status, ISWC, fonogramas, interpretes, ISRCs)
2. Obras gravadas (gravacoes, artistas, gravadora, ISRC, plataformas, lancamento, autorizacao)
3. Relatorios de recebimentos (DSP, sync, internacional, acordos, ECAD informativo)
4. Demonstrativos (periodo, brutos, descontos, recoupment, retencoes, liquido, saldos, BI)
5. Recibos (emitidos, pagos, datas, comprovantes)
6. **Perspectiva de royalties futuros** (apurados, conciliados, previsto proximo pagamento, trimestres seguintes, pendentes, contestacao, bloqueados)
7. **Informe de rendimentos** (anual, valores pagos, retencoes, fonte pagadora, CPF/CNPJ, historico fiscal)

---

## PERFIS DE ACESSO

- **Master / Administradora** — acesso total
- **Editora administrada** — acesso restrito ao proprio catalogo/autores/contratos/relatorios
- **Autor** — acesso apenas as proprias obras/relatorios/pagamentos
- **Financeiro** — recebimentos, distribuicao, pagamentos
- **Juridico** — contratos, autorizacoes, documentos
- **Operacional** — cadastros, obras, exportacoes

---

## REGRA DE OURO GERAL

O sistema deve unir:
- operacao pratica de editora independente
- inteligencia operacional de multinacional
- automacao juridica
- gestao financeira
- gestao de catalogo
- sync, TV, DSP
- BI, auditoria, distribuicao, internacional

**Tudo dentro de um unico ecossistema operacional.**
