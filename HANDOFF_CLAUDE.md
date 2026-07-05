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

*Última atualização: 2026-07-05*
