# Relatório Técnico — Fase A: Migração para Supabase
**Data:** 31/05/2026  
**Status:** Em execução — aguardando ação manual para ativar banco real

---

## 1. O que foi feito

### 1.1 Configuração Supabase
| Item | Status | Detalhes |
|------|--------|----------|
| `.env.local` atualizado | ✅ | URL + anon key + service role key reais |
| Projeto Supabase criado | ✅ | `tigubwxotanaznqqxogf.supabase.co` (sa-east-1) |
| NEXT_PUBLIC_APP_URL | ✅ | `https://sync-mood-saas.vercel.app` |

### 1.2 Migrations SQL (24+ tabelas + RLS)
Arquivo único pronto para executar:  
`supabase/MIGRATION_COMPLETA.sql` (62 KB)

| Arquivo | Conteúdo |
|---------|----------|
| `001_enums.sql` | ENUMs: tipo_pessoa, papel_titular_link, status_obra, role_usuario... |
| `002_tenants_usuarios.sql` | tenants, usuarios, perfis, permissoes |
| `003_editoras.sql` | editoras, editoras_configuracoes |
| `004_titulares.sql` | titulares, titulares_pf, titulares_pj, pseudonimos, contatos, dados_bancarios |
| `005_contratos.sql` | contratos, contrato_obras, modelos_juridicos, clausulas |
| `006_obras.sql` | obras, obra_links, obra_link_titulares, fonogramas, gravacoes |
| `007_recebimentos_importacoes.sql` | recebimentos, importacoes_log, recebimento_itens |
| `008_distribuicao.sql` | periodos_distribuicao, distribuicoes, cc_obras, cc_titulares, cc_movimentos, prestacao_contas |
| `009_autorizacoes_prestacao.sql` | autorizacoes, autorizacao_obras |
| `010_rls.sql` | Row Level Security em 33 tabelas + 3 funções PL/pgSQL |
| `011_seed_primeiro_tenant.sql` | Seed do tenant inicial + usuario master |

### 1.3 Código migrado
| Arquivo | Mudança |
|---------|---------|
| `app/master/titulares/page.tsx` | Substituído `useEffect + getStore` por `useSupabaseQuery` |
| `app/master/obras/page.tsx` | Substituído `useEffect + getStore` por `useSupabaseQuery` |
| `app/auth/login/page.tsx` | Adicionado `<Suspense>` ao redor de `<LoginForm>` (fix Next.js 16) |
| `middleware.ts` | Renomeado para `middleware.ts.bak` (conflito com `proxy.ts` no Next.js 16) |
| `.env.local` | Atualizado com credenciais reais do Supabase |
| `supabase/MIGRATION_COMPLETA.sql` | Arquivo único com todos os 11 arquivos de migration concatenados |

### 1.4 Hooks Supabase prontos
- `lib/hooks/use-supabase-query.ts` — Supabase → localStorage → mock fallback
- `lib/hooks/use-current-user.ts` — usuário logado via Supabase Auth
- `lib/supabase/client.ts` — browser client
- `lib/supabase/server.ts` — server client (SSR)

---

## 2. AÇÃO MANUAL NECESSÁRIA (1 vez, ~2 minutos)

Para ativar o banco real, o usuário deve:

1. Acessar: https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/editor
2. Abrir o arquivo: `C:\Users\Usuário\Desktop\sync-mood-saas\supabase\MIGRATION_COMPLETA.sql`
3. Copiar todo o conteúdo e colar no SQL Editor
4. Clicar em **Run**
5. Aguardar ~30s (sem erros = sucesso)

Após isso:
- Login real funcionará via Supabase Auth
- Dados importados (CWR, TXT backoffice) serão salvos no banco
- Multi-tenant estará ativo com RLS

---

## 3. Deploy atual
- **URL produção:** https://sync-mood-saas.vercel.app  
- **Build:** 119 páginas estáticas/dinâmicas, TypeScript: 0 erros
- **Modo atual:** DEMO_MODE=true (sem auth obrigatório)
- **Após migration SQL:** DEMO_MODE pode ser desligado em `proxy.ts` linha 15

---

## 4. Tabelas criadas pelo SQL

```
tenants               editoras              titulares
titulares_pf          titulares_pj          titulares_pseudonimos
titulares_contatos    titulares_dados_bancarios
obras                 obra_links            obra_link_titulares
fonogramas            gravacoes             contratos
contrato_obras        modelos_juridicos     clausulas
recebimentos          recebimento_itens     importacoes_log
periodos_distribuicao distribuicoes         distribuicao_itens
cc_obras              cc_titulares          cc_movimentos
prestacao_contas      autorizacoes          autorizacao_obras
usuarios              perfis                permissoes
```

---

## 5. Funções RLS (PL/pgSQL)

```sql
fn_meu_tenant_id()   -- retorna tenant_id do usuário logado
fn_meu_role()        -- retorna role do usuário (master/editora/autor/...)
fn_meu_titular_id()  -- retorna titular_id (para portal do autor)
```

---

## 6. Pendências pós-migration

| Prioridade | Item |
|-----------|------|
| 🔴 Alta | Executar MIGRATION_COMPLETA.sql no Supabase SQL Editor |
| 🔴 Alta | Desligar DEMO_MODE=false em `proxy.ts` após tabelas criadas |
| 🟡 Média | Atualizar `importar-cwr/page.tsx` para salvar em Supabase (além de localStorage) |
| 🟡 Média | Atualizar `distribuicao/nova/page.tsx` para salvar em Supabase |
| 🟡 Média | Criar tela de gestão de usuários/tenants usando tabelas reais |
| 🟢 Baixa | Migrar Contratos para `useSupabaseQuery` |
| 🟢 Baixa | Variáveis de ambiente no painel Vercel (já estão no .env.local local) |

---

## 7. Variáveis de ambiente para configurar no Vercel Dashboard

Acessar: https://vercel.com/nauilan-s-projects/sync-mood-saas/settings/environment-variables

| Variável | Valor |
|---------|-------|
| NEXT_PUBLIC_SUPABASE_URL | https://tigubwxotanaznqqxogf.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | sb_publishable_pnyCvafLzScuOZ_leugKNA_BoUohzjq |
| SUPABASE_SERVICE_ROLE_KEY | (usar service role key do Supabase dashboard) |
| NEXT_PUBLIC_APP_URL | https://sync-mood-saas.vercel.app |

---

## 8. Nota de segurança

O arquivo `.env.local` NÃO deve ser commitado no GitHub (já está no `.gitignore`).  
As variáveis de ambiente devem ser configuradas diretamente no painel Vercel.
