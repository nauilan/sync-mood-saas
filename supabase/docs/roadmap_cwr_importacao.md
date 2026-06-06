# Roadmap — Módulo de Importação CWR

> Documento de referência técnica e conceitual.
> Registra as regras definitivas aprovadas pela organização antes da implementação.

---

## 1. ID Interno — Chave Principal de Matching

O campo `codigo_interno` é o identificador único do Sync Mood **e também** o
identificador utilizado nos arquivos CWR históricos da Top Show Music.

**Não existe distinção entre:**
- ID Interno do sistema
- Identificador utilizado no CWR

São o mesmo código.

### Exemplos reais (CWRs históricos da Top Show Music)

| ID Interno | Entidade |
|---|---|
| JD01 | Luan Marcelo Gavlik (pseudônimo: João Dalzoto) |
| HR01 | Henrique Alves dos Reis (pseudônimo: Henrique Reis) |
| 2646326 | Top Show Music Ltda ME |
| 8961236 | P3 Editora Musical Ltda |

---

## 2. Regras Oficiais de Importação CWR

### 2.1 Escopo — Quem deve ser identificado

Durante a importação de um arquivo CWR, o sistema deve ler e confrontar
**todos** os titulares/participantes presentes no arquivo, incluindo:

- Autores / Compositores (Writer — WR)
- Versionistas / Adaptadores
- Editoras Originais (Publisher Original — E)
- Editoras Administradoras (Administrator — AM)
- Subeditoras (Sub-Publisher — SE)
- Demais titulares identificados no arquivo

### 2.2 Matching — Ordem de prioridade (5 passos)

O sistema deve nunca criar duplicidade. A busca de correspondência segue
esta ordem, do identificador mais confiável para o menos confiável:

```
Passo 1 → codigo_interno   (ID Interno: JD01, HR01, 2646326...)
Passo 2 → codigo_cae       (número CAE CISAC)
Passo 3 → codigo_ipi       (número IPI SOCINPRO)
Passo 4 → nome_completo    (nome exato)
Passo 5 → nome_artistico   (pseudônimo)
```

**Se encontrar qualquer combinação confiável em qualquer passo: VINCULAR.**
Não criar novo cadastro.

**Regras de decisão:**

| Resultado | Ação |
|---|---|
| Correspondência confiável encontrada | Vincular — nunca duplicar |
| Mesmo nome, IDs diferentes | Fila de revisão manual |
| Mesmo ID, nome diferente | Vincular pelo ID + alerta de revisão do nome |
| Nenhuma correspondência em nenhum passo | Criar pré-cadastro (`status = pre_cadastro`) |

**Se ID Interno estiver no CWR:** usar exatamente esse código — o importador
não gera ID Interno novo quando o arquivo já traz o identificador.

**Se não existir correspondência:**
- Criar pré-cadastro automático em `titulares`:
  - `codigo_interno` (do CWR, se presente)
  - `nome_completo` (do CWR)
  - `nome_artistico` / pseudônimo (se presente)
  - `codigo_cae` / `codigo_ipi` (se disponíveis)
  - `origem_importacao = 'cwr'`
  - `status = 'pre_cadastro'`
  - `importacao_id` (FK para o registro de importação)
- **Nunca criar cadastro definitivo automaticamente.**
- O pré-cadastro passa por validação humana antes de ficar ativo.

### 2.3 Editoras cadastradas com ID Real

Antes de importar qualquer CWR, as editoras administradas e a Organização
Gestora devem estar cadastradas usando exatamente os mesmos IDs Internos
presentes nos CWRs históricos:

| Editora | ID Interno esperado |
|---|---|
| Top Show Music Ltda ME | 2646326 |
| P3 Editora Musical Ltda | 8961236 |
| EDI Music | (confirmar no CWR) |
| LR Edições Musicais | (confirmar no CWR) |
| Lamu | (confirmar no CWR) |

**O importador não deve gerar ID Interno novo quando o arquivo CWR já
trouxer esse identificador.**

---

## 3. Sender ID Code — Separado do ID Interno

O `sender_code` identifica **quem enviou o arquivo CWR**, não quem é
titular da obra.

| Campo | Valor | Localização |
|---|---|---|
| Sender ID Code | `TSL` | `editoras.sender_code` (Organização Gestora) |
| ID Interno da Top Show | `2646326` | `editoras.codigo_interno` |

- O Sender ID Code **não substitui** o ID Interno da Top Show.
- Editoras administradas (EDI, LR, P3, Lamu) **não possuem** Sender Code.
- No cabeçalho HDR do arquivo CWR: usar `sender_code` da Top Show.
- Nos registros de obra: usar o ID Interno da editora correspondente.

---

## 4. Identificadores Estratégicos Oficiais

Todos os titulares e editoras devem possuir:

| Campo | Descrição |
|---|---|
| `codigo_interno` | ID Interno / Identificador no CWR |
| `codigo_cae` | Número CAE (CISAC) |
| `codigo_ipi` | Número IPI (SOCINPRO) |

A Organização Gestora adiciona:

| Campo | Descrição |
|---|---|
| `sender_code` | Sender ID Code CISAC (ex: TSL) |
| `sender_name` | Nome do remetente CWR |
| `sender_type` | Tipo (PB = Publisher) |

---

## 5. Tabelas Relevantes para a Importação

```sql
-- Pré-cadastro de titulares via CWR
titulares (
  codigo_interno,       -- chave principal de matching
  nome_completo,
  nome_artistico,
  codigo_cae,
  codigo_ipi,
  origem_importacao,    -- 'cwr'
  importacao_id,        -- FK para registro de importação
  status                -- 'pre_cadastro' | 'pendente_validacao' | 'ativo'
)

-- Editoras com ID Real
editoras (
  codigo_interno,       -- chave principal de matching
  codigo_cae,
  codigo_ipi,
  sender_code           -- apenas Organização Gestora
)
```

---

## 6. Fluxo do Importador CWR (Futuro)

```
Arquivo CWR recebido
  ↓
Parse do arquivo (HDR, NWR, SPU, SWR, PWR, etc.)
  ↓
Para cada participante identificado:
  ↓
  Procurar por codigo_interno no sistema
    ├── Encontrou → vincular (não duplicar)
    └── Não encontrou → criar pré-cadastro (status = pre_cadastro)
  ↓
Para cada obra (NWR):
  ↓
  Vincular participantes ao pré-registro da obra
  ↓
  Status da obra = pendente_validacao
  ↓
Fila de revisão manual:
  - Pré-cadastros de titulares
  - Obras importadas
  - Conflitos de nome/código
  ↓
Validação humana
  ↓
Cadastro definitivo + ativação nos fluxos:
  contratos, distribuição, prestação de contas, CWR
```

---

## 7. Status de Implementação

| Item | Status |
|---|---|
| `editoras.codigo_interno` — UNIQUE por tenant | ✅ Migration 034 |
| `titulares.codigo_interno` — campo + UNIQUE | ✅ Migration 034 |
| UI: label "ID Interno" em editoras e titulares | ✅ Migration 034 |
| Campo `origem_importacao` em titulares | ✅ Migration 029 |
| Campo `importacao_id` em titulares | ✅ Migration 029 |
| Campo `status` (pré-cadastro) em titulares | ✅ Migration 029 |
| Módulo de importação CWR (parser + matching) | 🔲 Pendente |
| Fila de revisão de pré-cadastros | 🔲 Pendente |
| Configurações CWR (`configuracoes_cwr`) | 🔲 Pendente |

---

*Documento aprovado. Última atualização: Migration 034.*
