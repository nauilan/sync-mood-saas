# Arquitetura — Sync Mood Gestão Inteligente

> Documento gerado em: 2026-05-30  
> Versão do código-base: `main` (último commit 7570719)  
> Deploy: https://sync-mood-saas.vercel.app

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Tecnologias Utilizadas](#2-tecnologias-utilizadas)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Estrutura de Dados (Mocks + Tipos)](#4-estrutura-de-dados)
5. [Entidades e Campos Principais](#5-entidades-e-campos-principais)
6. [Relacionamentos](#6-relacionamentos)
7. [Rotas (App Router) por Módulo](#7-rotas-por-módulo)
8. [Fluxos Críticos](#8-fluxos-críticos)
9. [Dependências (package.json)](#9-dependências)
10. [Store Client-Side (localStorage)](#10-store-client-side)
11. [Roadmap de Desenvolvimento](#11-roadmap)

---

## 1. Visão Geral

O **Sync Mood Gestão Inteligente** é um SaaS de gestão de direitos musicais (Music Publishing Administration). Seu propósito é cobrir o ciclo completo de vida de uma obra musical: da criação do cadastro de autor/titular ao pagamento de royalties calculados com precisão, passando pela geração/importação de arquivos CWR, recebimento e distribuição de valores de DSPs (Spotify, YouTube, iMusica etc.).

### 1.1 Fluxo Macro do Sistema

```
Cadastrar Titular (M1)
        │
        ▼
Assinar Contrato de Cessão / Administração (M2)
        │
        ▼
Cadastrar / Importar Obra via CWR (M3 + M5)
        │
        ▼
Emitir CWR para Sociedades / DSPs (M5 Exportações)
        │
        ▼
Emitir Autorizações de Uso (M4)
        │
        ▼
Receber Valores via BackOffice (DSP TXT B-55) (M6)
        │
        ▼
Conciliar Recebimentos (M7)
        │
        ▼
Criar Período de Distribuição (M8)
        │
        ├── Prévia de Distribuição (visão antecipada)
        │
        └── Encerrar → CC Obra → CC Titular (M9)
                │
                ▼
        Prestação de Contas / Recibos (M10)
                │
                ▼
        Financeiro / BI (M11 + M12–13)
```

### 1.2 Módulos

| Módulo | Nome | Finalidade Principal |
|--------|------|----------------------|
| M1 | Cadastros | Titulares PF/PJ, Editoras, Pseudônimos, Dados Bancários |
| M2 | Contratos | Cessão, Licenciamento, Administração Editorial, Modelos Jurídicos |
| M3 | Obras | Catálogo CWR, Links por Obra, Fonogramas, ISWC |
| M4 | Autorizações | Uso em sync, audiovisual, publicidade, TV; Orçamentos e Cobranças |
| M5 | Importações / Exportações | CWR (entrada/saída), DSPs TXT, Recebimentos, TV |
| M6 | Recebimentos | BackOffice (DSPs), Socinpro/ECAD, TV/Audiovisual, Divergências |
| M7 | Conciliação | Cruzamento de valores recebidos x catálogo |
| M8 | Distribuição | Períodos (mensal/trimestral), Prévia, Encerramento, Recoupment |
| M9 | Conta Corrente | CC Obra, CC Titular, Movimentos, Bloqueios |
| M10 | Prestação de Contas | Demonstrativos, Recibos, Contestações, Automação |
| M11 | Financeiro | Contas a Pagar/Receber, Fluxo de Caixa, Conciliação Bancária |
| M12–13 | Relatórios & BI | Relatórios por domínio, BI Estratégico, Auditoria |
| M14 | Configurações | Usuários, Perfis, Permissões, Parâmetros, Integrações |
| Portal | Portal do Autor | Visão do titular: obras, CC, demonstrativos, royalties futuros |

---

## 2. Tecnologias Utilizadas

### 2.1 Stack Principal

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.2.6 |
| UI | React | 19.2.4 |
| Tipos | TypeScript | ^5 |
| Estilo | Tailwind CSS | ^4 |
| Build | Turbopack (via Next.js) | — |
| Deploy | Vercel | Prod (CDN global) |
| Auth (planejado) | Supabase Auth | — |
| Banco (planejado) | Supabase / PostgreSQL | — |

### 2.2 Bibliotecas Principais

| Biblioteca | Versão | Uso |
|------------|--------|-----|
| `@supabase/supabase-js` | ^2.106.1 | Cliente Supabase (prep. para backend) |
| `@supabase/ssr` | ^0.10.3 | Supabase SSR (middleware auth) |
| `@tanstack/react-query` | ^5.100.11 | Cache / fetching server state |
| `zustand` | ^5.0.13 | Estado global client |
| `react-hook-form` | ^7.76.0 | Formulários |
| `zod` | ^4.4.3 | Validação de schemas |
| `recharts` | ^3.8.1 | Gráficos (BI, dashboards) |
| `lucide-react` | ^1.16.0 | Ícones |
| `date-fns` | ^4.2.1 | Manipulação de datas |
| `clsx` + `tailwind-merge` | — | Classes condicionais |
| `class-variance-authority` | ^0.7.1 | Variantes de componentes |

### 2.3 Persistência Atual (fase mock)

O sistema opera com **localStorage** como persistência client-side via `lib/store.ts`, alimentado por importações (CWR, TXT B-55). Os mocks (`lib/mock-*.ts`) são arrays tipados vazios ou com dados de demonstração — servem como fallback enquanto o Supabase não está configurado.

### 2.4 Parser de Arquivos

| Parser | Arquivo | Formato |
|--------|---------|---------|
| CWR 2.1 | `lib/cwr-parser.ts` | Posição fixa (NWR/SPU/SWR/OWR/PWR/ALT) |
| B-55 UBEM | `lib/parse-b55.ts` | Posição fixa com separador `|` |
| Gerador CWR | `lib/cwr-generator.ts` | Gera arquivo CWR para exportação |
| ONI (Obras Não Identificadas) | `lib/oni-matcher.ts` | Matching fuzzy de obras |

---

## 3. Estrutura de Pastas

```
sync-mood-saas/
├── apps/
│   └── web/                        ← Aplicação Next.js principal
│       ├── app/                    ← App Router (páginas e layouts)
│       │   ├── master/             ← Área administrativa (M1–M14)
│       │   │   ├── dashboard/
│       │   │   ├── titulares/      ← M1: listagem, [id], novo
│       │   │   ├── editoras/       ← M1: editoras administradas
│       │   │   ├── contratos/      ← M2: contratos, modelos, alertas
│       │   │   ├── obras/          ← M3: catálogo, nova, importar-cwr, [id]
│       │   │   ├── autorizacoes/   ← M4: autorizações, orçamentos, cobranças
│       │   │   ├── backoffice/     ← M5: importação/exportação CWR, DSPs, matching
│       │   │   ├── recebimentos/   ← M6: recebimentos, SOCINPRO, divergências
│       │   │   ├── tv/             ← M6-TV: execuções, cobranças audiovisual
│       │   │   ├── conciliacao/    ← M7: conciliação e divergências
│       │   │   ├── distribuicao/   ← M8: períodos, nova, prévia, encerramento
│       │   │   ├── cc-obra/        ← M9: CC por obra
│       │   │   ├── cc-titular/     ← M9: CC por titular
│       │   │   ├── prestacao-contas/ ← M10: prestações, contestações
│       │   │   ├── financeiro-m11/ ← M11: contas, fluxo de caixa
│       │   │   ├── relatorios/     ← M12-13: relatórios e BI
│       │   │   └── config/         ← M14: usuários, perfis, integrações
│       │   ├── portal/             ← Portal do Autor (visão titular)
│       │   ├── editora/            ← Portal da Editora Administrada
│       │   ├── titular/            ← Portal do Titular (autenticado)
│       │   ├── auth/               ← Login, callback, signout
│       │   ├── layout.tsx          ← Layout raiz
│       │   ├── page.tsx            ← Landing / redirect
│       │   └── globals.css
│       ├── components/
│       │   ├── layout/
│       │   │   ├── sidebar.tsx     ← Sidebar com MASTER_NAV
│       │   │   ├── nav-config.ts   ← Configuração completa dos menus
│       │   │   └── top-bar.tsx
│       │   └── ui/
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── kpi-card.tsx
│       │       ├── page-header.tsx
│       │       └── ...
│       ├── lib/                    ← Lógica de negócio, tipos, mocks, parsers
│       │   ├── types-*.ts          ← Todos os tipos TypeScript por domínio
│       │   ├── mock-*.ts           ← Dados mock (arrays vazios ou demo)
│       │   ├── cwr-parser.ts       ← Parser CWR 2.1 (client-side)
│       │   ├── cwr-generator.ts    ← Gerador de arquivo CWR
│       │   ├── cwr-to-obra.ts      ← Conversor CwrObra[] → Obra[]/TitularStore[]
│       │   ├── parse-b55.ts        ← Parser TXT B-55 UBEM
│       │   ├── store.ts            ← Persistência localStorage (upsert + leitura)
│       │   ├── logica-cc-obra.ts   ← Cálculo de movimentos CC Obra
│       │   ├── logica-cc-titular.ts← Cálculo de movimentos CC Titular
│       │   ├── modelos-cessao.ts   ← Templates de contratos de cessão
│       │   ├── modelos-juridicos-v2.ts ← Modelos jurídicos completos
│       │   ├── motor-reversao-direitos.ts ← Reversão de direitos
│       │   ├── oni-matcher.ts      ← Matching de obras não identificadas
│       │   ├── oni-csv-export.ts   ← Exportação CSV de lista ONI
│       │   ├── socinpro-ecad.ts    ← Integração ECAD/Socinpro
│       │   ├── codigos.ts          ← Geração de códigos únicos
│       │   ├── masks.ts            ← Máscaras de input (CPF, CNPJ, etc.)
│       │   ├── utils.ts            ← Utilitários gerais
│       │   ├── database.types.ts   ← Tipos gerados do Supabase (futuros)
│       │   └── supabase/
│       │       ├── client.ts       ← Supabase browser client
│       │       └── server.ts       ← Supabase server client (SSR)
│       ├── public/                 ← Assets estáticos
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
└── ARQUITETURA.md                  ← Este documento
```

---

## 4. Estrutura de Dados

### 4.1 Modelo Atual (Mocks + localStorage)

O sistema opera em modo **"mock + store"**:

1. **Mocks** (`lib/mock-*.ts`) — arrays TypeScript que retornam `[]` (dados zerados para produção) ou dados de demonstração.
2. **Store** (`lib/store.ts`) — camada de persistência via `localStorage` com chaves versionadas (`sm_*_v1`). Alimentada pelas importações de CWR e arquivos DSP TXT.
3. **Fusão** — cada tela de listagem lê primeiro o store no `useEffect` de mount e mescla com o mock (deduplicado pelo campo `codigo`).

### 4.2 Chaves do localStorage

| Chave | Tipo | Alimentado por |
|-------|------|----------------|
| `sm_obras_v1` | `Obra[]` | Importação CWR |
| `sm_titulares_v1` | `TitularStore[]` | Importação CWR |
| `sm_gravacoes_v1` | `GravacaoStore[]` | Importação CWR |
| `sm_contratos_v1` | `Contrato[]` | Formulários manuais |
| `sm_cc_obras_v1` | `ContaCorrenteObra[]` | Distribuição |
| `sm_cc_titulares_v1` | `ContaCorrenteTitular[]` | Distribuição |
| `sm_recebimentos_v1` | `Recebimento[]` | Importação DSP TXT |
| `sm_importacoes_v1` | `ImportacaoLog[]` | Auditoria automática de importações |

---

## 5. Entidades e Campos Principais

### 5.1 Titular (`types-cadastros.ts`)

```typescript
interface Titular {
  id: string
  codigo_titular: string       // editável (ex: "T0001")
  id_interno: string           // gerado automaticamente
  tipo_pessoa: 'PF' | 'PJ'
  editora_id: string           // editora administradora responsável
  ativo: boolean
  observacoes: string | null
  created_at: string
  updated_at: string
  // joins opcionais
  _pf?: TitularPessoaFisica
  _pj?: TitularPessoaJuridica
  _funcoes?: TitularFuncao[]   // CA, E, AM, etc.
  _pseudonimos?: TitularPseudonimo[]
  _enderecos?: TitularEndereco[]
  _contatos?: TitularContato[]
  _documentos?: TitularDocumento[]
  _dados_bancarios?: TitularDadosBancarios[]
}
```

**Sub-entidades do Titular:**

| Entidade | Campos-chave |
|----------|-------------|
| `TitularPessoaFisica` | nome_completo, cpf, rg, data_nasc, nome_artistico_principal, cae, ipi |
| `TitularPessoaJuridica` | razao_social, nome_fantasia, cnpj, cae, ipi, responsavel_legal |
| `TitularFuncao` | funcao (CA/E/AM/SE/V/I…), sigla, ativa |
| `TitularPseudonimo` | pseudonimo, principal, ativo, data_inicio, data_fim |
| `TitularEndereco` | cep, endereco, cidade, estado, pais, principal |
| `TitularContato` | tipo (telefone/whatsapp/email), valor, principal |
| `TitularDocumento` | tipo, numero, url_arquivo, validade |
| `TitularDadosBancarios` | banco, agencia, conta, tipo_conta, pix_chave, pix_tipo |

---

### 5.2 Obra (`types-obras.ts`)

```typescript
interface Obra {
  id: string
  tenant_id?: string
  codigo: string              // código interno (ex: "TSM0001")
  titulo: string
  titulo_original?: string
  iswc?: string               // T-xxx.xxx.xxx-x (recebido da sociedade)
  idioma: string
  genero?: string
  duracao?: number            // segundos
  ano_criacao?: number
  status: StatusObra          // pre_cadastro | validada | ativa | bloqueada | divergente
  editora_id?: string
  contrato_origem_id?: string
  _links?: ObraLink[]
  _fonogramas?: Fonograma[]
  _percentual_controlado?: number
}
```

---

### 5.3 ObraLink e ObraLinkTitular

```typescript
interface ObraLink {
  id: string
  obra_id: string
  ordem: number
  descricao?: string
  controlado: boolean              // TRUE = editora administra este link
  percentual_controlado: number    // % que a admin controla
  titulares?: ObraLinkTitular[]
}

interface ObraLinkTitular {
  id: string
  link_id: string
  titular_id?: string
  nome: string
  papel: PapelTitularLink          // autor | compositor | editora_original | administradora...
  percentual: number               // % neste link (soma de todos = 100%)
  percentual_exec_publica?: number  // PR (performing rights)
  percentual_fonomecanico?: number  // MR (mechanical rights)
  percentual_sincronizacao?: number // SR (sync rights)
  ipi?: string
  controlado: boolean
}
```

**Papéis possíveis (`PapelTitularLink`):**

| Papel | Descrição | É PJ? |
|-------|-----------|-------|
| `autor` | Autor da letra | Não |
| `compositor` | Compositor da música | Não |
| `versionista` | Versionista | Não |
| `adaptador` | Adaptador | Não |
| `editora_original` | Editora proprietária dos direitos | Sim |
| `administradora` | Editora que administra em nome de outra | Sim |
| `subeditora` | Subeditora (território específico) | Sim |
| `interprete_referencia` | Intérprete principal | Não |

---

### 5.4 Contrato (`types-contratos-v2.ts`)

Suporta **12 tipos de contrato**:

| Tipo | Descrição |
|------|-----------|
| `cessao_parcial` | Cede parte dos direitos patrimoniais |
| `cessao_total` | Compra de catálogo (transferência integral) |
| `licenciamento` | Cessão temporária por período |
| `administracao_editorial` | Editora opera mas não é proprietária |
| `coedicao` | Duas editoras dividem controle |
| `subedicao` | Editora representa outra em território específico |
| `cessao_internacional` | Separa BR e exterior |
| `cessionario_pj` | Autor transfere para PJ própria (sem IRPF) |
| `cessionario_pf` | Autor transfere para outra PF (com IRPF) |
| `licenciamento_licenciante_pj` | Licencia por prazo a PJ |
| `licenciamento_licenciante_pf` | Licencia por prazo a PF |
| `exclusividade_autor_editora` | Exclusividade no período contratual |

**Direitos cobertos:** 15 direitos (BR_a–h + EXT_a–g)

**Defaults de split:**
- Brasil: 75% titular / 25% editora
- Exterior: 50% titular / 50% editora

---

### 5.5 PeriodoDistribuicao (`types-periodo-distribuicao.ts`)

```typescript
interface PeriodoDistribuicao {
  id: string
  codigo: string           // "2026-05" ou "1Q26"
  tipo: 'mensal' | 'trimestral'
  label: string            // "Maio/2026" ou "1º Trimestre 2026"
  ano: number
  mes?: number             // apenas mensal
  trimestre?: 1|2|3|4      // apenas trimestral
  data_inicio: string      // YYYY-MM-DD
  data_fim: string
  status: 'aberto' | 'em_processamento' | 'encerrado' | 'cancelado'
  total_previsto: number
  total_processado: number
  fontes: string[]         // ex: ["Spotify", "YouTube"]
}
```

**Regra de exclusão mútua:** Um período mensal NÃO pode coexistir com um período trimestral que inclua o mesmo mês. Ex: se existe `1Q26` (Jan/Fev/Mar 2026), não pode criar `2026-01`, `2026-02` ou `2026-03` individualmente.

---

### 5.6 Distribuicao (`types-distribuicao.ts`)

```typescript
interface Distribuicao {
  id: string
  codigo: string
  periodo: string           // ref ao PeriodoDistribuicao.codigo
  valor_total: number
  total_titulares: number
  status: DistribuicaoStatus  // previa | calculando | aprovacao | aprovada | executada | estornada
  calculado_em: string
  aprovado_por?: string
  _itens?: DistribuicaoItem[]
}

interface DistribuicaoItem {
  id: string
  distribuicao_id: string
  obra_id?: string
  link_id?: string
  titular_destino_id?: string
  tipo_destino: DistribuicaoItemTipoDestino
  percentual_aplicado: number
  valor_bruto: number
  valor_liquido: number
  _retencoes?: DistribuicaoRetencao[]  // IRPF, ISS, comissão...
  _recoupment?: DistribuicaoRecoupment[]
}
```

---

### 5.7 ContaCorrenteObra (`types-cc.ts`)

```typescript
interface ContaCorrenteObra {
  id: string
  obra_id: string
  obra_codigo: string
  obra_titulo: string
  saldo_atual: number
  saldo_bloqueado: number
  saldo_distribuido: number
  saldo_pendente: number
  moeda: string
  status: 'ativa' | 'bloqueada'
  movimentos: MovimentoObra[]
  distribuicoes: DistribuicaoObra[]
  evolucao_12m: EvolucaoMensal[]
  bloqueios: BloqueioCC[]
}
```

**Tipos de movimento CC Obra:**
`entrada | distribuicao | recoupment | retencao | taxa_administrativa | estorno | ajuste | bloqueio | liberacao`

---

### 5.8 ContaCorrenteTitular (`types-cc.ts`)

```typescript
interface ContaCorrenteTitular {
  id: string
  titular_id: string
  titular_codigo: string
  titular_nome: string
  titular_tipo: 'PF' | 'PJ'
  saldo_atual: number
  saldo_bloqueado: number
  saldo_liberado: number
  saldo_pago: number
  moeda: string
  recoupment_ativo?: RecoupmentTitular
  movimentos: MovimentoTitular[]
  pagamentos_historicos: PagamentoHistorico[]
  cessao_info?: CessaoInfo
}
```

**Tipos de movimento CC Titular:**
`credito | debito | retencao | recoupment | pagamento | estorno | bloqueio | ajuste`

---

### 5.9 Recebimento (`types-recebimentos.ts`)

```typescript
interface Recebimento {
  fonte: FonteRecebimento    // ecad_socinpro | backoffice_music_services | sync | ...
  categoria: CategoriaRecebimento
  status: StatusRecebimento  // importado | pendente_matching | conciliado | distribuido...
  formato: FormatoImportacao // pdf | xls | xlsx | csv | txt | xml
}
```

---

### 5.10 ImportacaoLog (`lib/store.ts`)

```typescript
interface ImportacaoLog {
  id: string
  arquivo: string
  tipo: 'CWR' | 'DSP_TXT' | 'XLSX' | 'outro'
  data: string
  obras_importadas: number
  titulares_importados: number
  total_valor?: number
  status: 'sucesso' | 'parcial' | 'erro'
  detalhes?: string
}
```

---

### 5.11 Outras Entidades Relevantes

| Entidade | Arquivo | Campos-chave |
|----------|---------|-------------|
| `Fonograma` | `types-obras.ts` | isrc, titulo_fonograma, interprete, isrc, duracao, plataformas |
| `EditoraAdministrada` | `types-cadastros.ts` | codigo, razao_social, cnpj, _cwr_ip |
| `ModeloJuridico` | `modelos-juridicos-v2.ts` | tipo, template_html, campos_variaveis |
| `Autorizacao` | `types-autorizacoes.ts` | tipo_uso, obra_id, licenciante, data_vigencia, valor |
| `Orcamento` | `types-orcamentos.ts` | autorizacao_id, valor_proposto, status |
| `MovimentoTitular` | `types-cc.ts` | tipo, valor_bruto, valor_liquido, retencoes[] |
| `RetencaoTitular` | `types-cc.ts` | tipo (irpf/iss/comissao), percentual, valor |
| `RecoupmentTitular` | `types-cc.ts` | valor_adiantado, valor_recuperado, saldo_devedor |
| `BloqueioCC` | `types-cc.ts` | tipo (sem_contrato/sem_dados_bancarios...), gravidade |
| `PrestacaoContas` | `types-prestacao.ts` | periodo, titular_id, movimentos, status |
| `ConciliacaoBancaria` | `types-financeiro-m11.ts` | extrato, movimentos_sistema, divergencias |
| `PortalAutor` | `types-portal-autor.ts` | dashboard, informe_rendimentos, royalties_futuros |

---

## 6. Relacionamentos

```
EditoraAdministrada
  1 ──── N  Titular
  1 ──── N  Contrato

Titular
  1 ──── N  TitularFuncao
  1 ──── N  TitularPseudonimo
  1 ──── N  TitularDadosBancarios
  1 ──── N  Contrato (como parte contratada)
  1 ──── N  ObraLinkTitular (via link_id)
  1 ──── 1  ContaCorrenteTitular

Obra
  1 ──── N  ObraLink
  1 ──── N  Fonograma
  1 ──── 1  ContaCorrenteObra
  N ──── M  Titular (via ObraLink → ObraLinkTitular)

ObraLink
  1 ──── N  ObraLinkTitular
  1 ──── 1  Obra

Contrato
  N ──── M  Obra (via ContratoObra)
  N ──── 1  Titular
  1 ──── N  SplitDireito (15 direitos BR/EXT)

PeriodoDistribuicao
  1 ──── N  Distribuicao

Distribuicao
  1 ──── N  DistribuicaoItem
  1 ──── N  ContaCorrenteObra (movimentos)

DistribuicaoItem
  N ──── 1  Titular (tipo_destino)
  N ──── 1  Obra
  1 ──── N  DistribuicaoRetencao
  1 ──── N  DistribuicaoRecoupment

ContaCorrenteObra
  1 ──── N  MovimentoObra
  1 ──── N  DistribuicaoObra

ContaCorrenteTitular
  1 ──── N  MovimentoTitular
  1 ──── N  PagamentoHistorico
  0 ──── 1  RecoupmentTitular (se houver adiantamento)

Recebimento
  N ──── 1  Obra (via matching por song_code)
  N ──── 1  PeriodoDistribuicao

ImportacaoLog
  1 ──── N  Obra (importadas)
  1 ──── N  Titular (importados)
```

---

## 7. Rotas por Módulo

### Área Master (`/master/...`)

| Módulo | Rota | Tipo | Descrição |
|--------|------|------|-----------|
| Dashboard | `/master/dashboard` | Estático | KPIs gerais |
| **M1** | `/master/titulares` | Estático | Lista titulares |
| M1 | `/master/titulares/[id]` | Dinâmico | Detalhe titular |
| M1 | `/master/titulares/novo` | Estático | Formulário criação |
| M1 | `/master/editoras` | Estático | Lista editoras adm. |
| M1 | `/master/editoras/[id]` | Dinâmico | Detalhe editora |
| M1 | `/master/editora` | Estático | Editora master |
| **M2** | `/master/contratos` | Estático | Lista contratos |
| M2 | `/master/contratos/[id]` | Dinâmico | Detalhe contrato |
| M2 | `/master/contratos/[id]/aditivo` | Dinâmico | Aditivo |
| M2 | `/master/contratos/novo` | Estático | Tipo seleção |
| M2 | `/master/contratos/novo/cessao` | Estático | Wizard cessão |
| M2 | `/master/contratos/novo/obras` | Estático | Vincular obras |
| M2 | `/master/contratos/modelos` | Estático | Modelos jurídicos |
| M2 | `/master/contratos/alertas` | Estático | Alertas exclusividade |
| **M3** | `/master/obras` | Estático | Catálogo |
| M3 | `/master/obras/[id]` | Dinâmico | Detalhe obra |
| M3 | `/master/obras/nova` | Estático | Criar obra manual |
| M3 | `/master/obras/importar-cwr` | Estático | Import CWR |
| M3 | `/master/gravacoes` | Estático | Fonogramas |
| **M4** | `/master/autorizacoes` | Estático | Lista autorizações |
| M4 | `/master/autorizacoes/[id]` | Dinâmico | Detalhe |
| M4 | `/master/autorizacoes/nova` | Estático | Nova autorização |
| M4 | `/master/autorizacoes/orcamentos` | Estático | Orçamentos |
| M4 | `/master/autorizacoes/cobrancas` | Estático | Cobranças |
| M4 | `/master/autorizacoes/tipos-uso` | Estático | Tipos de uso |
| M4 | `/master/autorizacoes/precificacao` | Estático | Tabela de preços |
| **M5** | `/master/backoffice/importacao` | Estático | Importar DSPs TXT |
| M5 | `/master/backoffice/importacao-cwr` | Estático | Importar CWR catálogo |
| M5 | `/master/backoffice/exportacoes` | Estático | Lista exportações CWR |
| M5 | `/master/backoffice/exportacoes/nova` | Estático | Nova exportação |
| M5 | `/master/backoffice/exportacoes/[id]` | Dinâmico | Detalhe exportação |
| M5 | `/master/recebimentos/importar` | Estático | Importar recebimentos |
| M5 | `/master/tv/importacoes` | Estático | Importar TV |
| M5 | `/master/tv/importacoes/nova` | Estático | Nova importação TV |
| **M5 BackOffice** | `/master/backoffice` | Estático | Painel backoffice |
| M5 | `/master/backoffice/matching` | Estático | Matching de obras |
| M5 | `/master/backoffice/match-lista-oni` | Estático | Lista ONI |
| M5 | `/master/backoffice/match-lista-oni/[id]/revisar` | Dinâmico | Revisar ONI |
| M5 | `/master/backoffice/match-lista-oni/[id]/exportar` | Dinâmico | Exportar ONI |
| M5 | `/master/backoffice/relatorios` | Estático | Relatórios backoffice |
| **M6** | `/master/recebimentos` | Estático | Lista recebimentos |
| M6 | `/master/recebimentos/[id]` | Dinâmico | Detalhe |
| M6 | `/master/recebimentos/socinpro` | Estático | SOCINPRO / ECAD |
| M6 | `/master/recebimentos/divergencias` | Estático | Divergências |
| M6 | `/master/recebimentos/fontes` | Estático | Fontes cadastradas |
| M6 TV | `/master/tv/dashboard` | Estático | Dashboard TV |
| M6 TV | `/master/tv/execucoes` | Estático | Execuções |
| **M7** | `/master/conciliacao` | Estático | Conciliações |
| M7 | `/master/conciliacao/[id]` | Dinâmico | Detalhe |
| M7 | `/master/conciliacao/divergencias` | Estático | Divergências |
| **M8** | `/master/distribuicao` | Estático | Lista distribuições |
| M8 | `/master/distribuicao/periodos` | Estático | Períodos |
| M8 | `/master/distribuicao/nova` | Estático | Nova distribuição |
| M8 | `/master/distribuicao/previa` | Estático | Prévia |
| M8 | `/master/distribuicao/encerramento` | Estático | Encerrar período |
| M8 | `/master/distribuicao/recoupment` | Estático | Recoupment |
| M8 | `/master/distribuicao/[id]` | Dinâmico | Detalhe |
| **M9** | `/master/cc-obra` | Estático | CC Obras |
| M9 | `/master/cc-obra/[id]` | Dinâmico | CC Obra detalhe |
| M9 | `/master/cc-obra/dashboard` | Estático | Dashboard CC Obras |
| M9 | `/master/cc-titular` | Estático | CC Titulares |
| M9 | `/master/cc-titular/[id]` | Dinâmico | CC Titular detalhe |
| M9 | `/master/cc-titular/dashboard` | Estático | Dashboard CC Titular |
| **M10** | `/master/prestacao-contas` | Estático | Prestações |
| M10 | `/master/prestacao-contas/[id]` | Dinâmico | Detalhe |
| M10 | `/master/prestacao-contas/nova` | Estático | Nova |
| M10 | `/master/prestacao-contas/contestacoes` | Estático | Contestações |
| M10 | `/master/prestacao-contas/automacao` | Estático | Automação |
| **M11** | `/master/financeiro-m11` | Estático | Dashboard financeiro |
| M11 | `/master/financeiro-m11/contas-pagar` | Estático | A pagar |
| M11 | `/master/financeiro-m11/contas-receber` | Estático | A receber |
| M11 | `/master/financeiro-m11/fluxo-caixa` | Estático | Fluxo de caixa |
| M11 | `/master/financeiro-m11/conciliacao-bancaria` | Estático | Concil. bancária |
| M11 | `/master/financeiro-m11/contas-bancarias` | Estático | Contas bancárias |
| **M12-13** | `/master/relatorios` | Estático | Hub de relatórios |
| M12 | `/master/relatorios/bi-estrategico` | Estático | BI estratégico |
| M12 | `/master/relatorios/auditoria` | Estático | Auditoria |
| **M14** | `/master/config` | Estático | Config hub |
| M14 | `/master/config/usuarios` | Estático | Usuários |
| M14 | `/master/config/perfis` | Estático | Perfis de acesso |
| M14 | `/master/config/integracoes` | Estático | Integrações ext. |

### Portal do Autor (`/portal/...`)

| Rota | Descrição |
|------|-----------|
| `/portal/dashboard` | Resumo financeiro do autor |
| `/portal/obras` | Minhas obras |
| `/portal/obras/[id]` | Detalhe da obra |
| `/portal/demonstrativos` | Demonstrativos de pagamento |
| `/portal/demonstrativos/[id]` | Detalhe do demonstrativo |
| `/portal/recebimentos` | Histórico de recebimentos |
| `/portal/recibos` | Recibos emitidos |
| `/portal/royalties-futuros` | Prévia de royalties futuros |
| `/portal/informe-rendimentos` | Informe IR |
| `/portal/perfil` | Dados cadastrais |

### Auth

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/auth/login` | Estático | Tela de login |
| `/auth/callback` | Dinâmico | Callback OAuth Supabase |
| `/auth/signout` | Dinâmico | Logout |

---

## 8. Fluxos Críticos

### 8.1 Importação CWR — Parser (`lib/cwr-parser.ts`)

```
Arquivo .cwr/.txt subido na tela /master/backoffice/importacao-cwr
        │
        ▼
FileReader.readAsText() → texto UTF-8
        │
        ▼
parseCwr(text) — linha a linha
        │
   ┌────┴────────────┐
   │ Tipos de registro│
   │ identificados:   │
   │ HDR — cabeçalho  │
   │ NWR/REV — obra   │
   │ SPU — ed. submet.│
   │ SWR — autor repr.│
   │ OWR — autor sem  │
   │        editora   │
   │ PWR — link au→ed │
   │ ALT — tít. alt.  │
   │ GRH/GRT — grupo  │
   └────┬────────────┘
        │
        ▼
CwrObra[]  (com CwrTitular[] e pct_controlado calculado)
        │
        ▼
cwrToStore(obras) [lib/cwr-to-obra.ts]
   ├── toObraLinkTitular() — converte CwrPapel → PapelTitularLink
   ├── buildLinks() — agrupa titulares por cadeia editorial
   └── extractTitulares() — deduplica por IPI ou slug do nome
        │
        ▼
upsertStore(STORE_KEYS.obras, obrasConvertidas)
upsertStore(STORE_KEYS.titulares, titularesConvertidos)
upsertStore(STORE_KEYS.gravacoes, gravacoesConvertidas)
registrarImportacao({ tipo: 'CWR', obras_importadas, ... })
        │
        ▼
Tela exibe painel de resultado:
  ✓ N obras salvas (X controladas)
  ✓ N titulares salvos (Y ctrl / Z ref)
  ✓ N gravações
```

**Mapeamento de papéis CWR → PapelTitularLink:**

| CWR Role | Tipo Registro | PapelTitularLink |
|----------|---------------|-----------------|
| E, AQ | SPU | `editora_original` |
| AM | SPU | `administradora` |
| SE | SPU | `subeditora` |
| CA, C | SWR | `compositor` |
| A | SWR | `autor` |
| V | SWR | `versionista` |
| AD | SWR | `adaptador` |
| E, AQ | OPU | `editora_original` |
| outro | * | `outro` → mapeado para `autor` |

---

### 8.2 Importação DSP TXT (B-55 UBEM) — `lib/parse-b55.ts`

```
Arquivo .txt (ex: TOP_SHOW_MUSIC_LIMIT-SPOTIFY-DIST-2026-03-25-ST492347.txt)
        │
        ▼
parseB55Text(text, filename)
        │
        ▼
Para cada linha do arquivo:
   - Extrai `seq|` do início
   - Detecta Publisher (editora)
   - Detecta Source (DSP: Spotify, YouTube...)
   - Detecta StartDate / EndDate
   - Detecta StatementID (STxxxxxx)
   - Detecta SongCode (Publisher_SongCode)
   - Detecta SongTitle
   - Extrai ROYALTY_TO_BE_PAID_$ (regex: \d{12}\.\d{9})
        │
        ▼
B55ParseResult {
  filename, statement_id, publisher, source,
  rows: B55Row[],
  total_valor, periodo_inicio, periodo_fim
}
        │
        ▼
Anti-duplicação:
  Verifica sm_importacoes_v1 por statement_id
  SE já importado → REJEITA com aviso
  SE novo → continua
        │
        ▼
Para cada B55Row:
  Cruza song_code com Obra.codigo no catálogo
  SE encontrado → distribui royalty por obra:
    1. Lê ObraLink[] da obra (apenas links controlados)
    2. Soma percentuais de: autores controlados + editora(E) + administradora(AM)
    3. Proporcionaliza a 100% (apenas titulares controlados)
    4. Distribui o valor para cada titular proporcional ao seu %
        │
        ▼
Grava movimentos em sm_cc_obras_v1 e sm_cc_titulares_v1
Descrição do movimento inclui:
  Publisher | StartDate | EndDate | Song_Title | Source
```

---

### 8.3 Regra de Cálculo de Controle

A regra implementada no `distribuicao/nova/page.tsx` e na lógica de distribuição:

```
Para cada obra com valor recebido:

  1. Pegar todos os ObraLinks da obra
  2. Para cada link, identificar titulares CONTROLADOS:
     - É controlado SE: t.controlado === true
     - Autores sem editora no mesmo link = NÃO controlados (apenas ref.)
     - Autores COM editora no mesmo link = SIM controlados

  3. Participantes controlados de um link típico:
     ┌─────────────────────────────────────────┐
     │ AUTOR CA    37,5%   controlado = true   │
     │ EDITORA E   10,0%   controlado = true   │
     │ ADMIN  AM    2,5%   controlado = true   │
     │ ─────────────────────────────────────── │
     │ Total controlado = 50%                  │
     └─────────────────────────────────────────┘

  4. Normalização a 100%:
     pct_normalizado(AUTOR) = 37,5 / 50 * 100 = 75%
     pct_normalizado(E)     = 10   / 50 * 100 = 20%
     pct_normalizado(AM)    = 2,5  / 50 * 100 =  5%
                                             ────────
                                              100%

  5. Valor distribuído por titular:
     valor_titular = royalty_obra * (pct_normalizado / 100)

  6. Grava no CC Obra (entrada + distribuições)
     Grava no CC Titular (créditos por titular)
```

**Regra especial (MARCUS VINICIUS e casos duplos):**
Alguns titulares aparecem duas vezes no CWR — uma vez como controlado e uma como referência. O sistema leva em conta apenas as entradas com `controlado = true`.

---

### 8.4 Fluxo de Distribuição com Período

```
1. CRIAR PERÍODO (/master/distribuicao/periodos)
   ├── Tipo: mensal (mês específico) ou trimestral (1Q/2Q/3Q/4Q + ano)
   ├── Validação de exclusão mútua:
   │     mensal → verifica se existe trimestral com mesmo mês
   │     trimestral → verifica se existe mensal em qualquer dos 3 meses
   └── Status inicial: 'aberto'

2. ATRIBUIR RECEBIMENTOS AO PERÍODO
   └── Cada importação de DSP TXT pergunta: "Qual período distribuir?"

3. PRÉVIA (/master/distribuicao/previa)
   └── Mostra CC Obra e CC Titular provisionais (não gravados definitivamente)
       Útil para: antecipar valores, autorizar adiantamentos

4. NOVA DISTRIBUIÇÃO (/master/distribuicao/nova)
   ├── Seleciona período
   ├── Seleciona obras/fontes a incluir
   └── Calcula distribuição (status: 'previa' → 'calculando' → 'aprovacao')

5. ENCERRAMENTO (/master/distribuicao/encerramento)
   ├── Aprovação da distribuição (status: 'aprovada')
   ├── Processamento definitivo (status: 'executada')
   └── Grava:
       CC Obra: movimentos de distribuição definitivos
       CC Titular: créditos definitivos
       Período: status → 'encerrado'

6. PÓS-DISTRIBUIÇÃO
   ├── Recibos e demonstrativos gerados (M10)
   └── Disponíveis no Portal do Autor
```

---

### 8.5 Anti-Duplicação de Arquivos

```typescript
// lib/store.ts — registrarImportacao()
// Cada arquivo gera um log em sm_importacoes_v1

// Na tela de importação DSP:
const importacoes = getStore(STORE_KEYS.importacoes)
const jaImportado = importacoes.some(
  i => i.arquivo.includes(statementId)  // ex: "ST492347"
)
if (jaImportado) {
  mostrarAviso('Arquivo já importado anteriormente')
  return
}
```

A identificação de duplicata usa o `StatementID` (ex: `ST492347`) presente no nome do arquivo B-55.

---

## 9. Dependências

### 9.1 `package.json` — Dependências de Produção

```json
{
  "@hookform/resolvers": "^5.2.2",
  "@supabase/ssr": "^0.10.3",
  "@supabase/supabase-js": "^2.106.1",
  "@tanstack/react-query": "^5.100.11",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^4.2.1",
  "lucide-react": "^1.16.0",
  "next": "16.2.6",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "react-hook-form": "^7.76.0",
  "recharts": "^3.8.1",
  "tailwind-merge": "^3.6.0",
  "zod": "^4.4.3",
  "zustand": "^5.0.13"
}
```

### 9.2 Dependências de Desenvolvimento

```json
{
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20.19.41",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

### 9.3 Scripts

| Script | Comando | Uso |
|--------|---------|-----|
| `dev` | `next dev` | Desenvolvimento local (Turbopack) |
| `build` | `next build` | Build de produção (119 páginas) |
| `start` | `next start` | Servidor de produção local |

---

## 10. Store Client-Side

### 10.1 API do `lib/store.ts`

```typescript
// Leitura com fallback
getStore<T>(key: string, fallback?: T[]): T[]
getStoreObj<T>(key: string, fallback: T): T

// Escrita
setStore<T>(key: string, data: T[]): void
setStoreObj<T>(key: string, data: T): void

// Upsert (merge por chave de ID — não duplica)
upsertStore<T extends {id?:string; codigo?:string}>(
  key: string,
  incoming: T[],
  idField?: keyof T
): { inserted: number; updated: number }

// Limpeza
clearStore(key: string): void
clearAllStores(): void   // limpa TODAS as chaves sm_*_v1

// Auditoria
registrarImportacao(log: Omit<ImportacaoLog, 'id'|'data'>): void
```

### 10.2 Estratégia de Leitura nas Telas

Cada página de listagem segue o padrão:

```typescript
const [obrasStore, setObrasStore] = useState<Obra[]>([])

useEffect(() => {
  const stored = getStore(STORE_KEYS.obras)
  if (stored.length > 0) setObrasStore(stored)
}, [])

// Catálogo unificado: mocks vazios + store (deduplicado por codigo)
const catalogoCompleto = useMemo(() => {
  const map = new Map<string, Obra>()
  ;[...MOCK_OBRAS, ...obrasStore].forEach(o => map.set(o.codigo, o))
  return Array.from(map.values())
}, [obrasStore])
```

---

## 11. Roadmap

### Fase A — Migração Mocks → Supabase (próxima prioridade)

- [ ] Configurar projeto Supabase (URL + anon key no `.env.local`)
- [ ] Gerar migrations PostgreSQL a partir dos tipos TypeScript existentes
- [ ] Criar tabelas: `titulares`, `titulares_pf`, `titulares_pj`, `obras`, `obra_links`, `obra_link_titulares`, `fonogramas`, `contratos`, `periodos_distribuicao`, `distribuicoes`, `distribuicao_itens`, `cc_obras`, `cc_titulares`, `recebimentos`, `importacoes_log`
- [ ] Substituir `getStore` → `supabase.from('obras').select()`
- [ ] Substituir `upsertStore` → `supabase.from('obras').upsert()`
- [ ] Row Level Security (RLS) por `tenant_id` / `editora_id`

### Fase B — Autenticação Real

- [ ] Supabase Auth com email/senha
- [ ] OAuth Google (para portal do autor)
- [ ] Multi-tenant: `editora_id` em todas as tabelas
- [ ] Middleware Next.js verificando sessão em `/master/**`, `/portal/**`
- [ ] Perfis de acesso: master / administrada / autor / financeiro / jurídico

### Fase C — Parser CWR Robustez

- [ ] Mover parser CWR para API route Next.js (`/api/cwr/parse`) — evita limites de memória do browser para arquivos > 5MB
- [ ] Suporte a CWR 3.0
- [ ] Validação de checksums GRH/GRT e TRL
- [ ] Importação em lote (múltiplos arquivos de diferentes sociedades)
- [ ] Devolução CWR da Socinpro: parser de acknowledgement

### Fase D — Integração UBEM / Socinpro

- [ ] API UBEM BackOffice: autenticação + pull automático de statements
- [ ] Webhook de notificação de novo statement disponível
- [ ] Socinpro ECAD: importação do arquivo de distribuição (layout proprietário)
- [ ] Matching automático por ISWC + fuzzy por título
- [ ] Fila de processamento assíncrono (BullMQ ou Vercel Edge Queue)

### Fase E — App Mobile do Autor

- [ ] React Native (Expo) ou Flutter
- [ ] Portal do autor adaptado: dashboard, obras, CC, notificações
- [ ] Push notifications para novos créditos
- [ ] Download de recibos em PDF
- [ ] Login com biometria

### Fase F — BI / Relatórios Avançados

- [ ] Integração Recharts já implementada — ampliar com séries históricas reais
- [ ] Exportação Excel (xlsx) para relatórios financeiros
- [ ] Relatório de royalties futuros projetados por obra
- [ ] Comparativo de distribuições por período
- [ ] Benchmark de catálogo por gênero / editora / DSP
- [ ] Auditoria completa de trilha de mudanças

### Fase G — Multi-tenant White-Label

- [ ] Subdomínio por editora: `topshow.syncmood.com.br`
- [ ] Tema visual personalizável por editora (logo, cores)
- [ ] Planos SaaS: Basic (1 editora) / Pro (5 editoras) / Enterprise (ilimitado)
- [ ] Faturamento automático via Stripe
- [ ] Onboarding guiado (wizard de cadastro de editora)
- [ ] API pública para integrações externas (OAuth 2.0)

---

## Notas Técnicas Finais

### Convenções de Código

- **Componentes**: PascalCase, arquivo `.tsx`
- **Hooks / utils**: camelCase, arquivo `.ts`
- **Tipos**: `interface` para objetos de domínio, `type` para unions/enums
- **Mocks**: prefixo `MOCK_`, arrays exportados do arquivo `mock-*.ts`
- **Store keys**: prefixo `sm_`, sufixo `_v1` (versão para migração futura)

### Importante: `FuncaoLink` vs `PapelTitularLink`

```typescript
// LEGADO (CWR abreviações) — NÃO usar em lógica nova:
type FuncaoLink = 'CA' | 'E' | 'AM' | 'SE' | 'V' | ...

// ATUAL (usado em ObraLinkTitular.papel) — SEMPRE usar:
type PapelTitularLink = 'autor' | 'compositor' | 'editora_original' | 'administradora' | ...
```

O conversor `cwr-to-obra.ts` usa `toPapelLink(CwrPapel) → PapelTitularLink` para garantir a tradução correta entre os dois sistemas.

### Deploy

```bash
# Produção
vercel --prod

# Build local
cd apps/web && npm run build

# Typecheck
cd apps/web && npx tsc --noEmit
```

URL produção: **https://sync-mood-saas.vercel.app**

---

*Fim do documento — Sync Mood Gestão Inteligente*
