# Ambiente de Homologação (Staging) — Sync Mood

## Por que staging é obrigatório

Sem ambiente separado, toda migration testada vai direto para o banco de produção.
Um erro em uma migration pode derrubar dados reais de clientes.

---

## Estrutura de ambientes

```
desenvolvimento  →  Supabase local (supabase start)  +  Next.js localhost:3000
staging          →  Projeto Supabase "sync-mood-staging"  +  Vercel Preview
produção         →  Projeto Supabase "sync-mood-prod"     +  Vercel Production
```

---

## Passo a Passo: criar o projeto de staging

### 1. Criar projeto no Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em "New project"
3. Nome: `sync-mood-staging`
4. Senha: gere uma forte e salve no seu gerenciador de senhas
5. Região: South America (São Paulo) — mesma da produção

### 2. Aplicar todas as migrations no staging

No SQL Editor do projeto de staging, execute em ordem:

```
001_enums.sql
002_tenants_usuarios.sql
003_editoras.sql
004_titulares.sql
005_contratos.sql
006_obras.sql
007_recebimentos_importacoes.sql
008_distribuicao.sql
009_autorizacoes_prestacao.sql
010_rls.sql
011_seed_primeiro_tenant.sql
012_rastreabilidade_cwr_backoffice.sql
013_territorios_direitos_collect.sql
014_campos_legado_controle_editorial.sql
015_negocios_editoriais.sql
016_analitico_direitos_flexiveis.sql
017_rls_016.sql
```

### 3. Variáveis de ambiente — criar arquivo .env.staging

```env
# Staging — NÃO commitar este arquivo
NEXT_PUBLIC_SUPABASE_URL=https://<staging-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
NEXT_PUBLIC_APP_URL=https://staging.sync-mood.com.br
NODE_ENV=production
```

> As chaves ficam em:
> Supabase Dashboard → Project Settings → API → Project API keys

### 4. Configurar Vercel Preview com staging

No Vercel:
1. Settings → Environment Variables
2. Adicionar as variáveis acima com **Environment = Preview**
3. As variáveis de produção devem ter **Environment = Production**

Assim cada PR do GitHub faz deploy automático em staging com as chaves certas.

---

## Fluxo de trabalho obrigatório

```
1. Desenvolvimento local
        ↓
2. Commit + Push → PR no GitHub
        ↓
3. Deploy automático em Staging (Vercel Preview)
        ↓
4. Testar migration em staging manualmente
        ↓
5. Validar funcionalidades
        ↓
6. Merge para main → Deploy em Produção
```

**REGRA:** Nenhuma migration vai para produção sem ter sido testada em staging primeiro.

---

## Antes de cada migration em produção

```bash
# 1. Backup manual
pg_dump "postgresql://postgres:<senha>@db.<prod-ref>.supabase.co:5432/postgres" \
  --no-owner --no-acl | gzip > backup-pre-migration-$(date +%Y%m%d).sql.gz

# 2. Testar em staging
# 3. Confirmar que staging está OK
# 4. Aplicar em produção
```

---

## Dados de teste para staging

Após criar o staging, popule com dados de teste executando o seed:
```sql
-- supabase/migrations/011_seed_primeiro_tenant.sql
-- Cria o tenant "Top Show Music" com usuário master de teste
```

Não use dados reais de clientes no staging.
