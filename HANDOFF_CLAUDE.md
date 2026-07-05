# HANDOFF — Sync Mood

Tarefas pendentes registradas para próximas sessões de desenvolvimento.

---

## 🔴 PRIORIDADE 1 — Distribuição de MEC/Sync + arredondamento de PR (dois bugs conectados)

**Escopo expandido após análise pós-revert. INICIAR PELA FASE DE DIAGNÓSTICO — não codificar antes de entender a inconsistência das duas obras.**

---

### Bug A — Distribuição incorreta de MEC/Sync (fono + sinc)

**Estado atual confirmado — obra AGORA AGUENTA (pós-revert):**
- `percentual_fonomecanico`: TODOS zerados, inclusive a editora — **ERRADO**
- `percentual_sincronizacao`: autores controlados têm valor (9.37 / 12.50 / 25) — **ERRADO**, deveriam estar zerados

**Regra de negócio confirmada pelo dono:**
> Nos direitos que a editora cobra (fono/MEC e Sync), os **autores controlados ficam ZERADOS** e a **editora administradora (AM) concentra o percentual total de controle** (soma do percentual de autor + editora original do link). Se não houver AM, concentra na Editora Original (E). Isso alimenta o CWR.

**Inconsistência crítica a investigar (FASE 1 — diagnóstico):**
- AGORA ESQUECE → MEC/Sync **correto** (Top Show/AM com 50% fono/sync, autores zerados)
- AGORA AGUENTA → MEC/Sync **errado** (fono tudo zero, sinc nos autores)
- Hipótese: estrutura CWR difere entre as duas obras (AM explícita no link de uma, ausente na outra), ou `deveZerarMR` / `calcularMrAM` só dispara sob certas condições

**Diagnóstico necessário ANTES de qualquer fix:**
1. Comparar snapshot CWR das duas obras — como SPU/PWR diferem entre AGORA ESQUECE (certa) e AGORA AGUENTA (errada)
2. No `/integrar`, rastrear onde `percentual_fonomecanico` e `percentual_sincronizacao` são calculados e por que concentra numa obra e não na outra
3. Verificar se `deveZerarMR(papel)` retorna `true` para papéis CA/C/etc. nas duas obras

---

### Bug B — Arredondamento de PR (execução pública)

**Contexto:** commit `6bd8009` revertido (`2cd666a`) — fix de PR estava conceitualmente correto, mas normalizou `mr_pct`/`sr_pct` individualmente e distribuiu resíduo ao SR, violando regras BackOffice.

**Bug alvo (ainda existe):**
- `percentual_exec_publica` (PR) fecha 99.99% em vez de 100% em ~2598 obras
- Causa: `normalizarPercentual` arredonda decimal 5 para BAIXO (9.375 → 9.37); regra correta é CIMA (favorece autor)
- Resíduo de 0.01% não distribuído ao Editor Original (E)

**Regra de negócio confirmada:**
- Decimal ≤ 4 → arredonda para baixo | Decimal ≥ 6 → arredonda para cima
- Decimal = 5 → **CIMA** (favorece autor)
- Resíduo de PR (100 − soma) → **E** do link; fallback: CA; fallback: primeiro controlado

**REGRAS CRÍTICAS — não repetir a regressão do 6bd8009:**
1. Normalizar **SÓ `pr_pct`** — **NÃO tocar em `mr_pct` nem `sr_pct`**
2. Distribuir resíduo **só no PR**, **só ao E** — **NÃO aplicar ao SR nem MR**
3. Recalcular `mrAmPorLink` via `calcularMrAM` **após** normalizar `pr_pct`, **antes** de distribuir resíduo
4. MEC e Sync seguem regra própria do BackOffice — **NÃO TOCAR**

---

### Arquivos a tocar (ambos os bugs)

- `apps/web/lib/percentual.ts` — `thirdDigit >= 6` → `thirdDigit >= 5` + JSDoc (Bug B)
- `apps/web/app/api/cwr/[id]/integrar/route.ts` — corrigir MEC/Sync (Bug A) + normalizar `pr_pct` + resíduo PR ao E (Bug B)
- `apps/web/lib/backoffice-rules.ts` — verificar `deveZerarMR` e `calcularMrAM` (diagnóstico Bug A)

### Validação obrigatória após fix

| Obra | PR total | Fono (AM) | Sinc (AM) | Autores fono | Autores sinc |
|---|---|---|---|---|---|
| AGORA AGUENTA | 100.00% | concentrado na AM | concentrado na AM | 0% | 0% |
| AGORA ESQUECE | 100.00% | igual ao atual (já correto) | igual ao atual | 0% | 0% |
| ELA NAO PARA (T-932925165-2) | 100.00% | inalterado vs legado | inalterado | 0% | 0% |
| LEMBRANCA NOSSA (T-335753310-5) | 100.00% | inalterado vs legado | inalterado | 0% | 0% |

**Query de medição antes/depois (PR ≠ 100%):**
```sql
SELECT COUNT(*) AS obras_com_residuo_pr
FROM (
  SELECT ol.obra_id
  FROM obras_links ol
  JOIN obras_links_titulares olt ON olt.obra_link_id = ol.id
  WHERE ol.tenant_id = '<tenant>' AND ol.status = 'ativo'
  GROUP BY ol.obra_id
  HAVING ABS(SUM(olt.percentual_exec_publica) - 100) > 0.005
) sub;
-- Valor atual esperado: ~2598 obras afetadas
```

---

## Pendente 2 — Unificar fonte de dados dos dois espelhos de obra

**Contexto:**
Existem dois espelhos de obra convivendo:
- **Espelho A (Drawer):** `apps/web/app/master/obras/page.tsx` — drawer lateral que abre ao clicar em uma obra no catálogo. Chama `/api/obras/${id}/links` separadamente.
- **Espelho B (Página cheia):** `apps/web/app/master/obras/[id]/page.tsx` — página completa acessada pelo ícone ExternalLink. Chama `/api/obras/${id}?include=links` (rota unificada).

**Problema:** os dois espelhos buscam dados de rotas diferentes e renderizam tabelas de titulares diferentes. Qualquer campo novo adicionado numa rota precisa ser adicionado na outra manualmente, gerando divergência.

**Tarefa:**
1. Criar componente compartilhado `<TabelaIntegrantes links={links} />` usado por ambos os espelhos
2. Fazer o Espelho A chamar `/api/obras/${id}?include=links` em vez de `/api/obras/${id}/links` (estrutura do response: links estão em `d.data.links` no formato unificado vs `d.data` no formato legado)
3. Evoluir a rota unificada para `/api/obras/${id}?include=links,fonogramas,interpretes` para eliminar as chamadas paralelas extras

**Arquivos a tocar:**
- `apps/web/app/master/obras/page.tsx` (Espelho A — drawer, ~linha 134 para a chamada de API, ~linha 835 para a tabela)
- `apps/web/app/master/obras/[id]/page.tsx` (Espelho B — já usa a rota unificada)
- `apps/web/app/api/obras/[id]/route.ts` (adicionar suporte a `?include=fonogramas,interpretes`)
- Novo componente: `apps/web/components/obras/tabela-integrantes.tsx`

**Benefício:** campo adicionado uma vez → aparece nos dois espelhos automaticamente.

---

## Pendente 2 — Pseudônimos via CWR (registro NPN)

**Contexto:** O CWR 2.1 transmite pseudônimos via registro `NPN` (Writer's Other Last Name). O parser atual (`cwr-parser.ts`) não processa esse registro. As colunas `titulares.nome_artistico` (TEXT) e `titulares.pseudonimos` (JSONB array) existem no banco mas ficam vazias após importação CWR.

**Tarefa:** implementar parsing do registro `NPN` no `cwr-parser.ts` (módulo congelado — requer autorização expressa antes de qualquer alteração).

---

## Pendente 3 — Duração dos 493 fonogramas existentes (UPDATE manual)

**Contexto:** O fix de `duracao_segundos` (commit `d69d6a8`) passou a gravar a duração de fonogramas novos. Os 493 fonogramas existentes (criados antes do fix) têm `duracao_segundos = NULL`. O `/integrar` em modo bulk pula fonogramas existentes (dedup por ISRC), então não os atualiza.

**Tarefa:** rodar UPDATE no Supabase SQL Editor para preencher a duração dos fonogramas existentes a partir dos dados brutos do CWR, ou reintegrar em modo unitário passando os `obra_ids` das obras com fonograma.

---

## Pendente 4 — Percentuais de Exterior (pct_ext_*) via negócio editorial

**Contexto:**
A tabela `obras_links_titulares` tem 7 colunas `pct_ext_*` (migration 059), todas `DEFAULT 0`. O CWR só traz percentuais do Brasil (SPT `0076`) — o exterior NÃO vem no CWR. Os valores de exterior devem ser derivados do `negocios_editoriais` de cada editora.

**Arquitetura dos dois conjuntos de campos:**
- **Agrupados** (`percentual_exec_publica`, `percentual_fonomecanico`, `percentual_sincronizacao`): populados pelo `/integrar`, usados pelo CWR generator e pelo espelho. FUNCIONAM.
- **Granulares Brasil** (`pct_repr_grafica` … `pct_autorizacoes_onus`, 8 campos): DEFAULT 0, nenhum código escreve. O espelho usa fallback para os agrupados — visualmente correto. Campos provisionados para o futuro, NÃO são gap atual.
- **Granulares Exterior** (`pct_ext_*`, 7 campos): DEFAULT 0, nenhum código escreve. Espelho exibe `—`. GAP REAL — precisam ser preenchidos via negócio editorial.

**Regra de negócio confirmada:**
- Para direitos diferentes de execução pública, o autor fica com 0% e a AM absorve o percentual total do link (CA + E). Zeros nos autores são CORRETOS por design.
- Percentual de exterior de cada participante:
  - `E.pct_ext_{direito}` = `E.percentual_exec_publica × negocio.percentuais_exterior[direito].administrada / 100`
  - `AM.pct_ext_{direito}` = `E.percentual_exec_publica × negocio.percentuais_exterior[direito].administradora / 100`
  - `CA.pct_ext_{direito}` = `CA.percentual_exec_publica` (mantém sua cota no exterior)
  - OWR: **definir** — manter `percentual_exec_publica` ou zerar? (decisão de negócio pendente)

**Estrutura de `negocios_editoriais.percentuais_exterior`:**
```json
{
  "repr_grafica":        { "administrada": 60, "administradora": 40 },
  "repr_fonomecanica":   { "administrada": 60, "administradora": 40 },
  ...
}
```
As chaves mapeiam diretamente para os sufixos `pct_ext_{chave}`.

**Tarefa:**
1. Nova rota `POST /api/obras/aplicar-exterior` — percorre obras do tenant, calcula `pct_ext_*` a partir do negócio editorial, faz UPDATE idempotente em `obras_links_titulares`
2. Botão "Calcular exterior" na listagem de obras com modal de confirmação e progresso
3. Sem migration (colunas existem)

**Arquivos a tocar:**
- Novo: `apps/web/app/api/obras/aplicar-exterior/route.ts`
- `apps/web/app/master/obras/page.tsx` (adicionar botão)

**Pré-requisitos obrigatórios (resolver antes de iniciar a implementação):**

- [ ] **PR-1 — Regra OWR no exterior:** decidir se `pct_ext_*` de autores não controlados (OWR) deve ser igual a `percentual_exec_publica` (mantém cota no exterior) ou `0` (exterior fica 100% editorial). Impacta diretamente o cálculo na rota `aplicar-exterior`.
- [ ] **PR-2 — Verificar `percentuais_exterior` no banco:** confirmar no Supabase SQL Editor se ao menos um `negocio_editorial` ativo tem `percentuais_exterior` não-nulo (JSONB com as chaves `repr_grafica`, `repr_fonomecanica`, etc.). Se estiver vazio, a feature não tem de onde calcular e o cadastro de negócios precisa ser feito primeiro.
  ```sql
  SELECT id, nome, percentuais_exterior
  FROM negocios_editoriais
  WHERE status = 'ativo' AND percentuais_exterior IS NOT NULL
  LIMIT 5;
  ```

**Pendente futuro (bloqueado por esta feature):**
- Exportação CWR 2WL (exterior): `cwr-generator.ts` (módulo protegido) precisaria de loop em `buildSPT`/`buildSWT` para território `2136` (Mundo excl. Brasil), lendo `pct_ext_*`. Só faz sentido após pct_ext_* populados.

---

*Última atualização: 2026-07-05*
