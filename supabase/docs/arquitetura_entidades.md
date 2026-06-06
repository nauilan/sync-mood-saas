# Arquitetura de Entidades — Sync Mood

> Regras estruturais obrigatórias aprovadas pela organização.
> Documento de referência para todas as migrations e decisões técnicas futuras.

---

## Regra 1 — ID Interno é único no sistema inteiro

O `codigo_interno` deve ser único **globalmente** dentro de um tenant,
independentemente de a entidade ser um autor, uma editora, uma administradora
ou qualquer outro participante.

```
INVÁLIDO no mesmo tenant:
  HR01 → titular (autor)
  HR01 → editora

VÁLIDO:
  JD01   → Luan Marcelo Gavlik (João Dalzoto)
  HR01   → Henrique Alves dos Reis (Henrique Reis)
  2646326 → Top Show Music Ltda ME
  8961236 → P3 Editora Musical Ltda
```

**Consequência direta:** o `codigo_interno` deve viver em uma única tabela
(a de titulares), não duplicado entre `titulares` e `editoras` com índices
separados. Isso é resolvido automaticamente pela Regra 2.

### Status atual

| Índice | Posição | Problema |
|---|---|---|
| `uq_editoras_codigo_interno` | tabela `editoras` | HR01 poderia existir em editoras E titulares |
| `uq_titulares_codigo_interno` | tabela `titulares` | idem |

**Gap:** os índices são independentes — a unicidade global não está garantida.
A Regra 2 resolve este problema estruturalmente.

---

## Regra 2 — O Titular é a Entidade Mestre

Toda entidade participante do sistema nasce na tabela `titulares`.
A tabela `editoras` é uma **extensão especializada** de um titular.

```
Estrutura correta:

titulares  (entidade mestre — PF ou PJ)
  id
  codigo_interno  ← único por tenant aqui
  nome_completo
  codigo_cae
  codigo_ipi
  ...

editoras  (extensão editorial de um titular PJ)
  id
  titular_id → titulares.id   ← FK obrigatória
  tipo_editora
  codigo_ecad
  sender_code   (somente Organização Gestora)
  ...
```

### Princípio

- **Toda editora é um titular.**
- **Nem todo titular é uma editora.**
- O campo `codigo_interno` existe uma única vez: em `titulares`.
- Elimina duplicidade de cadastro (Top Show como editora E como titular).

### O que simplifica

| Módulo | Benefício |
|---|---|
| CWR import / export | matching por um único campo `codigo_interno` em uma única tabela |
| Conta corrente | CC sempre ligado a um `titular_id` |
| Distribuição | `titular_id` como beneficiário universal |
| Repasses | sem ambiguidade se o repasse vai para "titular" ou "editora" |
| `obras_participantes` | apenas `titular_id` no futuro (editora é titular também) |

### Status atual

| Tabela | Situação |
|---|---|
| `titulares` | tabela independente — sem vínculo com `editoras` |
| `editoras` | tabela independente — sem `titular_id` |
| `obras_participantes` | tem `titular_id` E `editora_id` como FKs separadas |

**Gap crítico:** `editoras` não tem `titular_id`. Esta é a maior pendência
arquitetural do sistema. Todas as features de CWR, distribuição e conta
corrente precisam desta relação estar definida antes de serem construídas.

### Migration planejada (Migration 035)

```sql
-- 1. Adicionar titular_id em editoras
ALTER TABLE editoras
  ADD COLUMN titular_id UUID REFERENCES titulares(id) ON DELETE RESTRICT;

-- 2. Criar índice
CREATE UNIQUE INDEX uq_editoras_titular ON editoras(tenant_id, titular_id)
  WHERE titular_id IS NOT NULL;

-- 3. Para editoras já existentes: vincular ao titular correspondente
--    (operação manual guiada ou script de migração de dados)

-- 4. Após migração de dados: tornar NOT NULL
-- ALTER TABLE editoras ALTER COLUMN titular_id SET NOT NULL;

-- 5. Fase final: codigo_interno migra para titulares, sai de editoras
--    (migration posterior, após vinculação completa dos dados)
```

> **Importante:** a migração dos dados existentes deve ser feita manualmente
> ou com validação humana — não automaticamente — para garantir que cada
> editora seja vinculada ao titular correto.

---

## Regra 3 — Importação CWR nunca cria duplicidade

A identificação de titulares/editoras no CWR deve seguir esta ordem de
prioridade (do mais confiável para o menos):

```
Passo 1 → codigo_interno   (ID Interno: JD01, HR01, 2646326...)
Passo 2 → codigo_cae       (número CAE CISAC)
Passo 3 → codigo_ipi       (número IPI SOCINPRO)
Passo 4 → nome_completo    (nome exato)
Passo 5 → nome_artistico   (pseudônimo)
```

**Regras de decisão:**

| Resultado da busca | Ação |
|---|---|
| Combinação confiável encontrada | Vincular — nunca criar novo |
| Mesmo nome com IDs diferentes | Fila de revisão manual |
| Mesmo ID com nome diferente | Vincular pelo ID + alerta de revisão do nome |
| Nenhuma correspondência | Criar pré-cadastro (status = `pre_cadastro`) |

O importador **não inventa** ID Interno. Se o CWR trouxer o código, usa.
Se não trouxer, o pré-cadastro fica sem `codigo_interno` até validação humana.

---

## Regra 4 — Toda participação deve ser histórica

A tabela `obras_participantes` deve registrar o período de validade de
cada participação em uma obra, pois ao longo do tempo uma obra pode ter:
- troca de editora
- troca de administrador
- troca de subeditora
- alteração de percentual

```sql
-- Campos obrigatórios (ainda ausentes na Migration 033):
data_inicio  DATE  -- início da participação
data_fim     DATE  -- fim da participação (NULL = vigente)
```

**Regra operacional:**
- Nunca sobrescrever uma participação existente.
- Ao alterar: encerrar a participação anterior (`data_fim = hoje`)
  e criar nova linha com os novos dados e `data_inicio = hoje`.

### Status atual

| Campo | `obras_participantes` | `obras_repasse` |
|---|---|---|
| `data_inicio` | ❌ ausente | ✅ presente |
| `data_fim` | ❌ ausente | ✅ presente |

**Gap:** `obras_participantes` não possui `data_inicio` nem `data_fim`.

### Migration planejada (Migration 035 ou 036)

```sql
ALTER TABLE obras_participantes
  ADD COLUMN data_inicio DATE,
  ADD COLUMN data_fim    DATE;

-- Registros existentes: marcar início como data da criação
UPDATE obras_participantes
SET data_inicio = created_at::DATE
WHERE data_inicio IS NULL;
```

---

## Regra 5 — Sender ID Code pertence à Organização Gestora

O `sender_code` identifica quem **enviou** o arquivo CWR.
Não pertence à obra, ao titular nem às editoras administradas.

| Organização | Sender ID Code | Localização no banco |
|---|---|---|
| Top Show Music | `TSL` | `editoras.sender_code` (tipo_editora = master) |

**Em toda exportação CWR administrada pela Top Show:**
- Cabeçalho HDR: `sender_code = TSL`, `sender_name = TOP SHOW MUSIC`
- Mesmo quando a obra pertence a EDI Music, LR, P3 ou Lamu

**As editoras administradas não possuem `sender_code`.** ✅ Já implementado.

---

## Regra 6 — O CWR é gerado a partir dos cadastros

O CWR é uma **consequência** do cadastro correto — nunca uma área de
preenchimento manual.

```
Fluxo correto:

Titulares
  ↓
Editoras (extensão do titular)
  ↓
Contratos + Negócios Editoriais
  ↓
Obras + Participantes + Repasse
  ↓
Exportação CWR (automática)
```

A UI nunca deve ter campos "CWR manual" — o arquivo é montado a partir
das tabelas existentes no momento da exportação.

---

## Quadro Geral de Status

| Regra | Descrição | Status | Gap / Migration |
|---|---|---|---|
| 1 | ID Interno único globalmente | ❌ Incompleto | Resolvido pela Regra 2 |
| 2 | Titular como entidade mestre | ❌ Pendente | **Migration 035** — `editoras.titular_id` |
| 3 | Matching 5 passos no CWR | 📄 Documentado | Implementação no módulo CWR (futuro) |
| 4 | Participações históricas | ❌ Pendente | **Migration 035/036** — `data_inicio`/`data_fim` em `obras_participantes` |
| 5 | Sender ID Code na Gestora | ✅ Implementado | — |
| 6 | CWR como consequência | 📄 Documentado | Fluxo já registrado no roadmap |

---

## Prioridade das Próximas Migrations

### Migration 035 — Prioritária (bloqueia CWR, CC e distribuição)

**Parte A — Titular como mestre das editoras:**
```
editoras.titular_id → titulares.id
```
- Adicionar FK opcional agora, NOT NULL após migração de dados
- Vincular manualmente Top Show, EDI, LR, P3, Lamu aos seus titulares
- Garantir que `codigo_interno` em editoras e titulares não conflite

**Parte B — Histórico em obras_participantes:**
```
obras_participantes.data_inicio DATE
obras_participantes.data_fim    DATE
```
- Simples e não-destrutiva

### Migration 036 — Consolidação (após 035 validada)

**Fase final da unificação:**
- Mover `codigo_interno` de `editoras` para existir **exclusivamente** em `titulares`
- Remover `editoras.codigo_interno` (substituído por `editoras.titular.codigo_interno`)
- Garantir unicidade global via único índice em `titulares.codigo_interno`
- Atualizar `obras_participantes` para usar apenas `titular_id` (editora é titular)

> Esta migration é de alto impacto e requer validação humana completa
> dos dados antes de ser executada.

---

*Documento aprovado. Regras vigentes a partir da Migration 034.*
