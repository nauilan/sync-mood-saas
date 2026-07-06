# HANDOFF — Sync Mood

Tarefas pendentes registradas para próximas sessões de desenvolvimento.

---

## 🔴 PRIORIDADE 1 — Distribuição de MEC/Sync + arredondamento de PR (dois bugs conectados)

**Escopo expandido após análise pós-revert. INICIAR PELA FASE DE DIAGNÓSTICO — não codificar antes de entender a inconsistência das duas obras.**

---

### Bug A — Distribuição incorreta de MEC/Sync (fono + sinc)

**Estado do código:** commit `e807513` aplicou o fix de concentrador (E quando não há AM, SR com lógica própria). **Mas a BASE da concentração está errada.** Requer correção antes de reintegrar.

**Regra de negócio confirmada pelo dono:**
> Nos direitos que a editora cobra (fono/MEC e Sync), os **autores controlados ficam ZERADOS** e o **concentrador do link** (AM se houver; senão E) recebe o **BRUTO do link** (CA.pr_pct + E.pr_pct + AM.pr_pct). Não os fracionados apenas do CA.

**Diagnóstico do erro de base (investigado em sessão 2026-07-05):**

O CWR já entrega os percentuais **pós-fracionamento** por participante (o ECAD fraciona antes de gerar o arquivo):
- MARCUS (CA): `pr_pct = 9.38`
- EDI MUSIC (E): `pr_pct = 1.04`
- TOP SHOW (AM): `pr_pct = 2.08`

O "bruto" de 12.50% não existe como campo — é a **soma implícita** de todos os pr_pct do link.

**Problema em `calcularMrAM`:** filtra apenas `controlled: true`. A AM tem `controlled: false` (linha 423 do route.ts: `e.controlled ? 'editora' : 'editora_administrada'` — AM é mapeada como `editora_administrada` com `controlled: false`). Portanto:

| Participante | `controlled` | `pr_pct` | entra em `calcularMrAM`? |
|---|---|---|---|
| MARCUS (CA) | true | 9.38 | ✅ |
| EDI MUSIC (E) | true | 1.04 | ✅ |
| TOP SHOW (AM) | **false** | 2.08 | ❌ excluída |

`totalControlledPr = 10.42` → concentrador recebe 10.42%, mas o correto é **12.50%**.

**Correção proposta (aguardando aprovação do dono — NÃO aplicar sem revisar os 3 cenários):**

Substituir `calcularMrAM` (que filtra por `controlled`) por soma bruta de TODOS os pr_pct do link:

```typescript
// SUBSTITUIR o bloco atual de mrAmPorLink:
const brutoPorLink = new Map<number, number>()
for (const ln of linkNums) {
  const linkPartics = partics.filter(p => (p.link_number ?? 1) === ln)
  // Bruto = CA + E + AM (todos os participantes do link, sem filtro de controlled)
  brutoPorLink.set(ln, linkPartics.reduce((sum, p) => sum + (p.pr_pct ?? 0), 0))
}

// No corpo do loop de partics, trocar totalControlledPr → brutoDoLink:
const brutoDoLink = brutoPorLink.get(p.link_number ?? 1) ?? 0
const ehConcentrador = p.papel === 'AM' || (!linkTemAM && p.papel === 'E')
const mr_final   = (ehConcentrador && brutoDoLink > 0) ? brutoDoLink : (p.mr_pct ?? 0)
const mr_gravado = deveZerarMR(p.papel) && !ehConcentrador ? 0 : mr_final
const sr_gravado = ehConcentrador
  ? (brutoDoLink > 0 ? brutoDoLink : (p.sr_pct ?? 0))
  : 0
```

**Não afeta:** execução pública (`p.pr_pct ?? 0` — linha inalterada) nem analítico (`obras_analitico` — arquivo separado).

**Validar mentalmente antes de aplicar:**
- AGORA AGUENTA (CA=9.38, E=3.12, sem AM): `brutoDoLink = 12.50`, E concentra 12.50% ✅
- AGORA ESQUECE (CA=9.38, E=1.04, AM=2.08): `brutoDoLink = 12.50`, AM concentra 12.50% ✅
- JAMIL (OWR, link exclusivo): `brutoDoLink = 22.5`, mas `ehConcentrador = false` → fono=0, sinc=0 ✅

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

## Pendente 5 — FEATURE: Aba "Obras pendentes de contrato" (CWR sem contrato vinculado)

**Contexto:**
Obras importadas via CWR entram sem documento de contrato (o CWR não traz contrato). Ficam com `origem_importacao = 'cwr'` e sem contrato vinculado. O operador precisa subir o contrato para completar o cadastro e ativar a obra no catálogo.

**Requisitos:**

1. **Tela/aba de pendências:** lista obras SEM contrato vinculado filtrando APENAS `origem_importacao = 'cwr'`. Obras cadastradas manualmente não entram (já sobem contrato no ato do cadastro).

2. **Upload de contrato:** operador sobe o arquivo → sistema:
   - Armazena no bucket de contratos (já existe)
   - Lê via IA (`POST /api/contratos/extrair`, modelo Haiku — já existe)
   - Identifica autor + obras cobertas pelo contrato

3. **Resolução em lote:** um contrato pode cobrir **várias obras do mesmo autor**. Ao vincular, resolver pendência de TODAS as obras daquele autor cobertas pelo contrato de uma vez. Cruzar: `autor extraído pelo IA` × `títulos das obras extraídas` × `obras pendentes daquele autor`.
   - Não pedir o mesmo contrato repetidamente para obras do mesmo autor.

4. **Ativação:** ao vincular contrato validado → obra muda de `pré_cadastro` → `ativo` (conecta com fluxo de validação AM existente).

**Reutilização de componentes existentes:**
- Extração IA de contrato: `/api/contratos/extrair` (Haiku) — já funciona
- Fluxo pré-cadastro → ativo: já existe (verificar se a aba de pendências de validação AM pode ser estendida ou se cria nova)
- Bucket de contratos: já existe

**Arquivos a tocar (estimativa):**
- Nova rota: `apps/web/app/api/obras/pendentes-contrato/route.ts` — lista obras CWR sem contrato
- Nova rota ou extensão: `apps/web/app/api/obras/vincular-contrato/route.ts` — recebe upload, extrai via IA, vincula a obras do autor
- Nova aba: `apps/web/app/master/obras/pendentes/page.tsx` (ou aba dentro da listagem existente)
- Adicionar item no menu (nav-config.ts) em Obras ou Contratos

**Não construir agora — registrado para sessão dedicada.**

---

---

## Pendente 6 — FEATURE: Intérpretes — busca automática de ISRC via Spotify Web API

**Pré-requisito:** tabela `fonograma_interpretes` populada (migration 071 + import de PER — feito em 2026-07-05).

**Objetivo:** preencher `fonogramas.isrc` (nullable) das obras autorizadas cuja gravação já saiu, usando a Spotify Web API (gratuita, OAuth client credentials).

**Fluxo:**
1. Selecionar fonogramas SEM `isrc` que tenham intérpretes em `fonograma_interpretes`
2. Para cada fonograma, buscar no Spotify por `artista + título da obra`
3. Se match único e exato → preencher `isrc` automaticamente + salvar `spotify_track_id`
4. Se múltiplos candidatos → retornar lista para confirmação humana (original vs ao vivo vs regravação)
5. Rate limit: processar em lotes com backoff exponencial
6. Fallback: MusicBrainz (API gratuita) quando Spotify não encontrar

**Campos novos necessários em fonogramas:**
- `spotify_track_id TEXT` — ID da faixa confirmada no Spotify (para re-verificação)
- `isrc_status TEXT` — `'manual'`, `'auto_spotify'`, `'auto_musicbrainz'`, `'pendente_confirmacao'`

**UI:** botão "Buscar ISRC" na aba Gravações, com modal de progresso e lista de candidatos para confirmação.

**NÃO construir agora — sessão dedicada após fonograma_interpretes populados e validados.**

---

## Pendente 7 — Exportação CWR: PER + REC são registros SEPARADOS no bloco

**Confirmado no arquivo real CW260021TSL_592:**
- Registro `PER` = intérprete da obra/gravação — contém o nome do artista, SEM ISRC.
- Registro `REC` = gravação — contém o ISRC, SEM nome de intérprete.
- No bloco NWR, o `PER` vem **antes** do `REC` (ordem real no arquivo).
- Para exportar corretamente: emitir N registros `PER` (um por intérprete em `obra_interpretes`) + N registros `REC` (um por fonograma em `fonogramas`), como entradas independentes no bloco — não concatenar intérprete dentro do REC nem ISRC dentro do PER.
- Fonte dos dados: `obra_interpretes.nome_artistico` → PER; `fonogramas.isrc` → REC.

**NÃO implementado ainda — registrar aqui para a sessão de exportação CWR.**

---

*Última atualização: 2026-07-06*
