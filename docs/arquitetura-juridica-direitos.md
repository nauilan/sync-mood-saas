# Arquitetura Jurídica de Direitos — Sync Mood
**Status:** OFICIAL — aprovada e vigente a partir da Migration 039  
**Referência:** contratos de cessão, administração, coedição e subedição

---

## Hierarquia Central do Sistema

```
DIREITO JURÍDICO
      ↓
NEGÓCIO EDITORIAL
      ↓
OBRA
      ↓
TITULAR
      ↓
RECEITA
```

O sistema não é baseado em receitas.  
O sistema não é baseado em plataformas.  
O sistema não é baseado em DSPs.  
**O sistema é baseado em direitos jurídicos contratuais.**

---

## REGRA 1 — Nomenclatura Oficial

A nomenclatura oficial do sistema é a nomenclatura do contrato. Sempre. Sem exceções.

Se houver divergência entre nome de mercado, nome operacional ou nome de plataforma
e nomenclatura contratual: **prevalece a nomenclatura contratual.**

- `codigo` = identificador técnico curto (ex: `comunicacao_publico`)
- `nome_curto` = label de interface (ex: Comunicação ao Público)
- `nome_juridico` = verdade oficial — texto exato do contrato

---

## REGRA 2 — Os 8 Direitos Jurídicos Canônicos

Nenhum módulo pode criar direitos paralelos.  
Nenhum enum pode criar nomenclatura diferente.  
Nenhuma tela pode utilizar nomenclatura incompatível.

| Código | Nome Jurídico (texto exato do contrato) |
|---|---|
| `repr_grafica` | DIREITOS DE REPRODUÇÃO GRÁFICA (EDIÇÃO) |
| `repr_fonomecanica` | DIREITOS DE REPRODUÇÃO FONOMECÂNICOS (VENDA E LOCAÇÃO DE GRAVAÇÕES SONORAS) |
| `inclusao_audiovisual` | DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES AUDIOVISUAIS |
| `inclusao_publicitaria` | DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES PUBLICITÁRIAS, GRÁFICAS, SONORAS OU AUDIOVISUAIS |
| `distribuicao_meios` | DIREITOS DE DISTRIBUIÇÃO MEDIANTE MEIOS ÓTICOS, CABO, SATÉLITES, REDES DE INFORMAÇÃO E DE COMPUTADORES, QUE PERMITAM AO USUÁRIO A SELEÇÃO DA OBRA OU QUE IMPORTE EM PAGAMENTO PELO USUÁRIO |
| `inclusao_base_dados` | DIREITOS DE INCLUSÃO EM BASE DE DADOS OU QUALQUER FORMA DE ARMAZENAMENTO |
| `comunicacao_publico` | DIREITOS DE COMUNICAÇÃO AO PÚBLICO |
| `autorizacoes_onus` | AUTORIZAÇÕES COM ÔNUS |

---

## REGRA 3 — Origens de Receita São Apenas Classificações Operacionais

Spotify não é direito. ECAD não é direito. SOCINPRO não é direito.  
Netflix não é direito. Globo não é direito. BackOffice não é direito.  
São apenas **origens de receita**.

Toda origem obrigatoriamente aponta para um direito jurídico (`tipo_direito_id`).

Exemplos:
- Spotify → `distribuicao_meios` *(mapeamento_provisorio=TRUE — pode ser repr_fonomecanica dependendo do contrato)*
- ECAD → `comunicacao_publico`
- SOCINPRO → `comunicacao_publico`
- Netflix → `inclusao_audiovisual`
- Campanha publicitária → `inclusao_publicitaria`
- CD/Vinil → `repr_fonomecanica`

---

## REGRA 4 — Nenhuma Operação Sem Direito Jurídico Identificado

Isso vale para: recebimentos, cobranças, licenças, sincronizações, autorizações,
contratos, distribuições, conta corrente, relatórios, BI, BackOffice, CWR.

Toda movimentação financeira deve possuir:
- `origem_receita_id` — de onde veio o dinheiro
- `tipo_direito_id` — qual direito jurídico representa

---

## REGRA 5 — Motor de Autorização Central

A função `validar_direito_administrado()` é oficialmente o **Motor de Autorização** do Sync Mood.  
Toda regra futura deve passar por ela.

```sql
validar_direito_administrado(
  p_editora_original_id,
  p_administradora_id,
  p_direito_codigo,   -- código jurídico canônico
  p_territorio,       -- 'brasil' | 'exterior'
  p_data_referencia,  -- DEFAULT CURRENT_DATE
  p_tenant_id,        -- obrigatório via service_role
  p_obra_id           -- opcional — validação por obra específica
)
```

Retorno: `{ permitido, motivo, pct_editora_original, pct_administradora, negocio_editorial_id, territorio, direito_codigo, obra_coberta }`

Módulos obrigados: BackOffice, Recebimentos, Distribuição, Contratos, Licenciamento,
Sync, Audiovisual, Publicidade, Conta Corrente, Relatórios, BI, CWR.

---

## REGRA 6 — Editoras São Papéis, Não Tipos

Editora Administradora e Editora Original são papéis dentro do negócio editorial.  
Não criar tipos especiais de editora. Não criar lógica separada para administradora.

Qualquer editora pode ser:
- `E` = Editora Original
- `AM` = Administradora
- `SE` = Subeditora

...dependendo do negócio editorial. O papel é definido em `obras_participantes` e `negocios_editoriais`.

---

## REGRA 7 — ID Interno É o Identificador Principal

Mesmo ID utilizado em: cadastros, CWRs, importação, exportação, matching.  
**Nunca gerar novo ID Interno quando já existir um no CWR.**

Prioridade de matching CWR: ID Interno → CAE/IPI → Nome → Pseudônimo.

---

## REGRA 8 — Gate de Validação Obrigatório

Nenhum dado real deve ser inserido antes de:
- Migration 039 validada
- Migration 040 validada
- Migration 041 validada (incluindo desativação dos 11 códigos legado)
- Migration 042 validada
- Build limpo no Vercel

Após validação completa, esta arquitetura passa a ser a **arquitetura oficial do Sync Mood**.

---

## Mapa de Adoção do Motor de Autorização

| Módulo | Usa `validar_direito_administrado()` | Sprint |
|---|:---:|---|
| Negócios Editoriais | Pendente | Pós-042 |
| Recebimentos / BackOffice | Pendente | Pós-042 |
| Distribuição | Pendente | Pós-042 |
| Contratos | Pendente | Pós-042 |
| Licenciamento / Autorizações | Pendente | Pós-042 |
| Sincronização (Sync) | Nascerá com suporte | Novo módulo |
| Audiovisual | Nascerá com suporte | Novo módulo |
| Publicidade | Nascerá com suporte | Novo módulo |
| CWR Export/Import | Pendente (parcial) | Pós-042 |
| Conta Corrente | Pendente | Pós-042 |
| Relatórios | Pendente | Pós-042 |
| BI / Analítico | Pendente | Pós-042 |
