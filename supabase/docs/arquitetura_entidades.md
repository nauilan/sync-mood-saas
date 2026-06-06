# Arquitetura de Entidades — Sync Mood

> Regras estruturais obrigatórias aprovadas pela organização.
> Documento de referência para todas as migrations e decisões técnicas futuras.
> **Atualizado:** inclui especificações completas da revisão definitiva de arquitetura.

---

## Princípio Fundamental

**Não existe cadastro de "Editora Administradora".**

Também não existe tipo fixo de:
- Editora Original
- Editora Administradora
- Subeditora

Esses são **papéis dentro de uma obra**, não categorias cadastrais.

A mesma editora pode exercer papéis diferentes dependendo da obra:

```
Obra A: Top Show Music = E
Obra B: Top Show Music = AM
Obra C: Top Show Music = SE
Obra D: Top Show Music = E + AM (catálogo próprio administrado por ela mesma)
```

O papel é definido em `obras_participantes`, nunca no cadastro da editora.

---

## Regra 1 — ID Interno é único no sistema inteiro

O `codigo_interno` deve ser único **globalmente** dentro de um tenant,
independentemente de a entidade ser autor, editora, administradora ou
qualquer outro participante.

```
INVÁLIDO no mesmo tenant:
  HR01 → titular (autor)
  HR01 → editora

VÁLIDO:
  JD01    → Luan Marcelo Gavlik (João Dalzoto)
  HR01    → Henrique Alves dos Reis (Henrique Reis)
  2646326 → Top Show Music Ltda ME
  8961236 → P3 Editora Musical Ltda
```

### Auto-geração quando ausente

```
Se o ID vier do CWR    → usar o ID recebido
Se o usuário informar  → usar o ID informado
Se estiver vazio       → gerar automaticamente
```

Padrão de geração para titulares: `TIT000001`, `TIT000002`, ...

### ID Interno das Obras

Toda obra deve possuir ID Interno. A tabela `obras` já possui o campo
`codigo_obra` (ex: `TSM0001`) que serve este propósito.

```
Se o ID vier do CWR    → usar o ID recebido
Se o usuário informar  → usar o ID informado
Se estiver vazio       → gerar automaticamente (OBR000001, OBR000002...)
```

### Status atual

| Entidade | Campo | Índice | Situação |
|---|---|---|---|
| `editoras` | `codigo_interno` | `uq_editoras_codigo_interno` (tenant_id, codigo_interno) | ✅ OK |
| `titulares` | `codigo_interno` | `uq_titulares_codigo_interno` (tenant_id, codigo_interno) | ✅ OK |
| `obras` | `codigo_obra` | `UNIQUE (tenant_id, codigo_obra)` | ✅ OK — é o ID Interno da obra |

**Gap (Regra 1):** os índices de `editoras` e `titulares` são separados —
HR01 poderia existir nas duas tabelas ao mesmo tempo.
Isso será resolvido estruturalmente pela Regra 2 (titular como entidade mestre):
quando `codigo_interno` existir apenas em `titulares`, o problema desaparece.

---

## Regra 2 — O Titular é a Entidade Mestre

Todo participante do sistema deve nascer em `titulares`. Incluindo:

- Autores / Coautores / Adaptadores / Versionistas
- Editoras (qualquer tipo)
- Administradoras
- Subeditoras
- Pessoas Físicas e Pessoas Jurídicas
- Organização Gestora

### Estrutura correta

```
titulares  (entidade mestre — PF ou PJ)
  id
  codigo_interno  ← único por tenant, vive aqui
  nome_completo
  codigo_cae
  codigo_ipi
  ...

editoras  (extensão editorial de um titular PJ)
  id
  titular_id → titulares.id   ← FK obrigatória (ainda ausente)
  codigo_ecad
  sender_code  (somente Organização Gestora)
  ...
```

### Princípio

- **Toda editora é um titular.**
- **Nem todo titular é uma editora.**
- `codigo_interno` vive exclusivamente em `titulares`.

### Status atual

| Relação | Situação |
|---|---|
| `editoras.titular_id` | ❌ **Ausente** — gap crítico a ser criado na Migration 035 |
| `titulares.editora_id` | Existe (inverso), será depreciado após Migration 035 |
| `obras_participantes` | Tem `titular_id` E `editora_id` separados — será consolidado em `titular_id` na Migration 036 |

### Migration 035 — Parte A

```sql
ALTER TABLE editoras
  ADD COLUMN titular_id UUID REFERENCES titulares(id) ON DELETE RESTRICT;

CREATE INDEX idx_editoras_titular ON editoras(titular_id)
  WHERE titular_id IS NOT NULL;
```

Após criação do campo: vincular manualmente cada editora ao seu
titular correspondente (não automaticamente).

### Migration 036 — Consolidação (após 035 validada)

- `obras_participantes`: substituir `editora_id` por `titular_id` para todos os papéis
- Remover `editoras.codigo_interno` (passa a derivar de `editoras.titular.codigo_interno`)
- Garantir unicidade global via único índice em `titulares.codigo_interno`

---

## Regra 3 — Importação CWR nunca cria duplicidade

### Ordem de matching (5 passos, do mais ao menos confiável)

```
Passo 1 → codigo_interno   (ID Interno: JD01, HR01, 2646326...)
Passo 2 → codigo_cae       (número CAE CISAC)
Passo 3 → codigo_ipi       (número IPI SOCINPRO)
Passo 4 → nome_completo    (nome exato)
Passo 5 → nome_artistico   (pseudônimo)
```

**Se encontrar qualquer correspondência confiável: VINCULAR. Nunca duplicar.**

| Situação | Ação |
|---|---|
| Correspondência encontrada | Vincular — nunca duplicar |
| Mesmo nome, IDs diferentes | Fila de revisão manual |
| Mesmo ID, nome diferente | Vincular pelo ID + alerta de revisão de nome |
| Nenhuma correspondência | Criar pré-cadastro em `titulares` |

### Pré-cadastro automático via CWR

Quando nenhum participante for localizado:

```sql
-- Criar em titulares:
codigo_interno    ← do CWR (se presente)
nome_completo     ← do CWR
nome_artistico    ← do CWR (pseudônimo, se houver)
codigo_cae        ← do CWR (se presente)
codigo_ipi        ← do CWR (se presente)
origem_importacao = 'cwr'
status            = 'pre_cadastro'
importacao_id     ← FK para o registro de importação
```

Aplica para: autores, coautores, editoras, administradoras, subeditoras,
adaptadores, versionistas — qualquer participante do CWR.

**Nunca criar cadastro definitivo automaticamente.**

---

## Regra 4 — Toda participação deve ser histórica

A tabela `obras_participantes` deve registrar o período de validade de
cada participação. Uma obra pode trocar editora, administrador, subeditora
ou percentual ao longo do tempo.

```sql
-- Campos obrigatórios (ausentes na Migration 033):
data_inicio  DATE   -- início da participação (NULL = desde o cadastro)
data_fim     DATE   -- fim da participação (NULL = vigente)
```

**Regra operacional:**
- Nunca sobrescrever participação existente.
- Ao alterar: encerrar anterior (`data_fim = hoje`) e criar nova linha.

### Status atual

| Campo | `obras_participantes` | `obras_repasse` |
|---|---|---|
| `data_inicio` | ❌ Ausente | ✅ Presente |
| `data_fim` | ❌ Ausente | ✅ Presente |

**Gap:** será corrigido na Migration 035 — Parte B.

---

## Regra 5 — Sender ID Code pertence à Organização Gestora

| Propriedade | Valor | Localização |
|---|---|---|
| Sender ID Code da Top Show | `TSL` | `editoras.sender_code` (onde `tipo_editora = 'master'`) |

Toda exportação CWR administrada pela Top Show usa `Sender = TSL`,
independentemente de qual editora é titular da obra.

**Editoras administradas não possuem `sender_code`.** ✅ Implementado.

---

## Regra 6 — O CWR é gerado a partir dos cadastros

O CWR é consequência do cadastro correto — nunca preenchimento manual.

```
Titulares → Editoras → Contratos → Obras → Participantes → Exportação CWR
```

---

## Sobre `editoras.tipo_editora`

### Problema atual

O campo `tipo_editora IN ('master', 'administrada', 'externa')` contém
o valor `'administrada'` que viola o princípio fundamental: uma editora
não é "administrada" em seu cadastro — ela pode **atuar como AM** em
uma obra específica.

### Solução

| Valor atual | Novo significado | Ação |
|---|---|---|
| `'master'` | Organização Gestora (tem Sender Code) | Manter — marca quem é a gestora |
| `'administrada'` | ❌ Errado — papel, não tipo | Renomear para `'parceira'` ou remover |
| `'externa'` | Editora de fora do sistema | Manter — útil para matching/relat. |

**Decisão pendente:** manter `'administrada'` como `'parceira'` (editora com
relação contratual ativa com a gestora) OU simplesmente `'cadastrada'`.

O papel `AM` só aparece em `obras_participantes`, nunca no cadastro da editora.

---

## Quadro Geral de Status

| Regra | Descrição | Status | Migration |
|---|---|---|---|
| 1 | ID Interno único globalmente | ⚠️ Parcial — separado por tabela | Resolvido pela Regra 2 / Migr. 036 |
| 2 — Parte A | `editoras.titular_id` | ❌ Ausente | **Migration 035** |
| 2 — Parte B | `obras_participantes` → só `titular_id` | ❌ Aguardando 035 | **Migration 036** |
| 3 | Matching 5 passos CWR | 📄 Documentado | Módulo CWR (futuro) |
| 4 | `data_inicio`/`data_fim` em `obras_participantes` | ❌ Ausente | **Migration 035** |
| 5 | Sender ID Code na Gestora | ✅ Implementado | — |
| 6 | CWR como consequência | 📄 Documentado | — |
| — | `editoras.tipo_editora` — remover `'administrada'` | ⚠️ Pendente decisão | Migration 035 ou 036 |
| — | Auto-geração `codigo_interno` titulares | ⚠️ Parcial (código_titular ok) | Migration 035 |
| — | `obras.codigo_obra` = ID Interno da obra | ✅ Já existe | Documentar |

---

## Plano Migration 035

### Parte A — Titular como entidade mestre das editoras

```sql
ALTER TABLE editoras
  ADD COLUMN titular_id UUID REFERENCES titulares(id) ON DELETE RESTRICT;

CREATE INDEX idx_editoras_titular
  ON editoras(titular_id) WHERE titular_id IS NOT NULL;
```

Após criação: vinculação manual/validada de cada editora ao seu titular.

### Parte B — Histórico em obras_participantes

```sql
ALTER TABLE obras_participantes
  ADD COLUMN data_inicio DATE,
  ADD COLUMN data_fim    DATE;

UPDATE obras_participantes
  SET data_inicio = created_at::DATE
  WHERE data_inicio IS NULL;
```

### Parte C — Corrigir tipo_editora (pendente decisão)

```sql
-- Opção: renomear 'administrada' para 'parceira'
UPDATE editoras SET tipo_editora = 'parceira'
  WHERE tipo_editora = 'administrada';

ALTER TABLE editoras
  DROP CONSTRAINT IF EXISTS editoras_tipo_editora_check;

ALTER TABLE editoras
  ADD CONSTRAINT editoras_tipo_editora_check
  CHECK (tipo_editora IN ('master', 'parceira', 'externa'));
```

### O que fica para Migration 036

- `obras_participantes`: substituir `editora_id` por `titular_id` universal
- Remover `editoras.codigo_interno` (derivado do titular)
- Unicidade global garantida por único índice

---

*Documento atualizado. Regras vigentes a partir da especificação definitiva de arquitetura.*
