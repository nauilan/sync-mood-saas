# Regras Editoriais Homologadas — Sync Mood

**Versão:** 1.0  
**Homologado em:** 19/06/2026  
**Commit de referência:** `6f806d8`  
**Status:** CONGELADO — alterações somente com aprovação explícita do responsável editorial

---

## 1. Visões do Sistema

O Sync Mood opera com **duas visões distintas e independentes** para cada obra:

### 1.1 SINTÉTICO

| Atributo | Valor |
|---|---|
| Finalidade | Controle editorial externo |
| Usado em | CWR · SWI · BackOffice · Sociedades de gestão · Integrações |
| Pergunta respondida | "Quem controla quanto da obra?" |
| Altera banco | Sim (gravado em `obras_links_titulares`) |

O Sintético **não representa divisão financeira**. Representa controle.

### 1.2 ANALÍTICO

| Atributo | Valor |
|---|---|
| Finalidade | Divisão econômica interna |
| Usado em | Conta Corrente · Distribuição · Prestação de Contas · Financeiro |
| Pergunta respondida | "Como o dinheiro será dividido?" |
| Altera banco | Não (calculado dinamicamente no front-end) |

O Analítico **não representa controle**. Representa distribuição econômica.

> **PROIBIDO:** O Analítico nunca pode reproduzir o Sintético. São cálculos distintos com finalidades distintas.

---

## 2. Regra de Links (Chain Editorial CWR)

### Definição

Cada **link** representa uma **chain editorial completa do CWR**:

```
SWR (autor)
  └── SWT (tipo de relação)
       └── PWR (relação escritor-editora)
            └── SPU (editora original - E)
                 └── SPT (percentuais)
                      └── AM (editora administradora)
```

### Regras de Separação

| Regra | Descrição |
|---|---|
| Link por chain | Cada chain editorial do CWR gera um link separado |
| Controlado isolado | Autores controlados ficam no link da sua editora original e administradora |
| Não-controlado isolado | Autores não-controlados ficam em **links separados** |
| OWR proibido em link controlado | OWR nunca pode estar no mesmo link que uma AM controlada |
| OWR sem MR | OWR nunca entra no cálculo da administradora |
| Múltiplas chains | Se CWR tem 2 chains → 2 links. 3 chains → 3 links. |

### Implementação (código)

```typescript
// packages/web/app/api/cwr/[id]/integrar/route.ts
// OWR sempre vai para link >= 2 quando há autores controlados
let owrNextLink = hasControlledAuthors ? Math.max(nextLinkNum, 2) : nextLinkNum
```

---

## 3. Regras do SINTÉTICO

### 3.1 MR (Fonomecânico / Digital) por Função

| Função | MR permitido? | Regra |
|---|---|---|
| CA (compositor-autor) | **Não** | MR = 0 sempre |
| C (compositor) | **Não** | MR = 0 sempre |
| SWR (songwriter) | **Não** | MR = 0 sempre |
| OWR (other writer) | **Não** | MR = 0 sempre |
| E (editora original) | **Não** | MR = 0 sempre |
| SE (sub-editora) | **Não** | MR = 0 sempre |
| SA (sub-administradora) | **Não** | MR = 0 sempre |
| **AM (administradora)** | **Sim** | MR = soma PR controlados do link |

### 3.2 Cálculo do MR da AM (por link)

```
AM.MR = Σ percentual_exec_publica dos participantes controlados do mesmo link
```

**Nunca:**
- pela obra inteira
- somando links não-controlados
- absorvendo OWR

**Exemplos validados:**

| Obra | Link | Controlados PR | AM MR |
|---|---|---|---|
| A CASA | 1 | Roberto 37,5 + Lojas Mil 7,5 + Top Show 5 = 50 | 50% |
| RICO PRA CARALHO | 1 | Autor 37,5 + P3 6,25 + Top Show 6,25 = 50 | 50% |
| RICO PRA CARALHO | 2 | Autor 37,5 + P3 6,25 + Top Show 6,25 = 50 | 50% |
| 100% COUNTRY | 1 | Henrique 75 + EDI 20 + Top Show 5 = 100 | 100% |

### 3.3 Validação defensiva (código)

```typescript
// packages/web/lib/backoffice-rules.ts
// Autores nunca podem ter MR, independente de valor recebido
if (isAutor(funcao)) percentual_fonomecanico = 0
```

---

## 4. Regras do ANALÍTICO

### 4.1 Fórmula de Cálculo

O Analítico reconstrói a **relação econômica** de cada link em 4 passos:

#### Passo 1 — Denominator do link

```
totalPR_link = Σ percentual_exec_publica de TODOS os participantes do link
               (autor + editora original + administradora)
```

#### Passo 2 — Percentual econômico de cada participante

```
% econômico = (PR do participante / totalPR_link) × 100
```

#### Passo 3 — Identificar a parte editorial

```
% editorial = (PR editora original + PR administradora) / totalPR_link × 100
```

#### Passo 4 — Aplicar regra do Negócio entre Editoras

Buscar em **Menu → Negócio entre Editoras** o split entre E e AM, e fracionar:

```
% editora original = % editorial × (percentual_administrada / 100)
% administradora  = % editorial × (percentual_administradora / 100)
```

**Se não houver negócio cadastrado:** cada participante recebe diretamente `PR / totalPR_link × 100`.

### 4.2 Regra REGRA4 — Não-controlado exibe "—"

Participantes com `status_controle = 'nao_controlado'` **não exibem percentual analítico** (exibem traço). Não entram no cálculo econômico do link controlado.

### 4.3 Exemplos validados

**A CASA — Link 1 (totalPR = 50):**

| Participante | PR | % Analítico |
|---|---|---|
| Roberto Sampaio (CA) | 37,5 | 75% |
| Lojas Mil (E) | 7,5 | 15% |
| Top Show (AM) | 5,0 | 10% |
| José Lazaro (nao_controlado) | 50,0 | — |

**RICO PRA CARALHO — cada link (totalPR = 50):**

| Participante | PR | % Analítico |
|---|---|---|
| Autor (CA) | 37,5 | 75% |
| P3 Editora (E) | 6,25 | 12,5% |
| Top Show (AM) | 6,25 | 12,5% |

### 4.4 Derivação implícita do negócio Autor × Editora

O sistema **infere** o percentual do acordo Autor × Editora Original a partir do CWR, sem necessidade de cadastro separado:

```
% autor no negócio = PR autor / (PR autor + PR editora + PR AM) × 100

Exemplo:
  PR autor = 37,5 | PR editorias = 12,5 | totalPR = 50
  % autor = 37,5 / 50 × 100 = 75%  →  negócio foi 75/25
```

---

## 5. Casos de Referência Homologados

| Obra | ID | Links | Estrutura | Validado |
|---|---|---|---|---|
| A CASA | `008b0b79` | 2 | L1 controlado (Roberto+Lojas Mil+Top Show) / L2 OWR (José Lazaro) | 19/06/2026 |
| RICO PRA CARALHO | `025d99e1` | 2 | L1 controlado (Autor1+P3+Top Show) / L2 controlado (Autor2+P3+Top Show) | 19/06/2026 |
| 100% COUNTRY | `f31c6fbe` | 1 | L1 100% controlado (Henrique+EDI+Top Show AM=100) | 19/06/2026 |
| FALOU RODEIO | `970b2d10` | 5 | L1+L2 controlados / L3+L4+L5 OWR separados | 19/06/2026 |

---

## 6. Mapa de Campos no Banco

| Campo | Tabela | Significado |
|---|---|---|
| `percentual_exec_publica` | `obras_links_titulares` | PR (execução pública) — Sintético |
| `percentual_fonomecanico` | `obras_links_titulares` | MR (fonomecânico/digital) — Sintético |
| `percentual_sincronizacao` | `obras_links_titulares` | SR (sincronização) — Sintético |
| `funcao_no_link` | `obras_links_titulares` | CA / C / E / SE / SA / AM / OWR / SWR |
| `status_controle` | `obras_links_titulares` | `controlado` / `nao_controlado` / `contrato_pendente` |
| `numero_link` | `obras_links` | Número do link (1, 2, 3...) |
| `percentual_administrada` | `negocios_editoriais` | Split E no negócio entre editoras |
| `percentual_administradora` | `negocios_editoriais` | Split AM no negócio entre editoras |

---

## 7. Módulos que Devem Respeitar Estas Regras

| Módulo | Status |
|---|---|
| Importação CWR (`integrar`, `confirmar`, `popular-links`) | Implementado e validado |
| Aba Titulares — Sintético | Implementado e validado |
| Aba Titulares — Analítico | Implementado e validado |
| Checklist SWI (BackOffice) | Implementado |
| Exportação SWI | Pendente (próxima sprint) |
| Exportação ISRC | Pendente (próxima sprint) |
| Autorizações | Pendente |
| Conta Corrente / Distribuição | Pendente |
| Recebimentos / Financeiro | Pendente |

---

## 8. Governança

### Regra de alteração

> **Nenhuma alteração nestas regras pode ser feita sem:**
> 1. Aprovação explícita do responsável editorial
> 2. Registro da justificativa neste arquivo
> 3. Atualização dos casos de referência da Seção 5
> 4. Validação SQL pós-reintegração (scripts em `C:\Temp\validate-catalogo.js`)
> 5. Commit documentando a mudança

### O que NÃO pode mudar sem aprovação

- MR em autores (CA/C/SWR)
- MR em editoras originais (E/SE/SA)
- OWR em link controlado
- Denominador do Analítico (sempre totalPR_link, nunca só autores)
- AM.MR por link (nunca pela obra inteira)

---

## 9. Auditoria Pós-Homologação (19/06/2026)

| Validação | Resultado |
|---|---|
| Obras auditadas | 766 |
| `obras_links` | 2.631 |
| `obras_links_titulares` | 3.391 |
| Nao-AM com MR > 0 | **0** |
| OWR com MR > 0 | **0** |
| OWR com status controlado | **0** |
| Links misturados (AM + nao_controlado) | **0** |
| AM sem MR (quando deveria ter) | **0** |
