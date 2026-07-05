# HANDOFF — Sync Mood

Tarefas pendentes registradas para próximas sessões de desenvolvimento.

---

## Pendente 1 — Unificar fonte de dados dos dois espelhos de obra

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

**Bloqueadores antes de implementar:**
- Definir comportamento de OWR no exterior (zerar ou manter percentual_exec_publica?)
- Confirmar que `negocios_editoriais` está cadastrado com `percentuais_exterior` preenchido

**Pendente futuro (bloqueado por esta feature):**
- Exportação CWR 2WL (exterior): `cwr-generator.ts` (módulo protegido) precisaria de loop em `buildSPT`/`buildSWT` para território `2136` (Mundo excl. Brasil), lendo `pct_ext_*`. Só faz sentido após pct_ext_* populados.

---

*Última atualização: 2026-07-05*
