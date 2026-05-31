# SECURITY_REPORT.md — Relatório de Segurança para Produção

**Data:** 2026-05-31  
**Projeto:** sync-mood-saas  
**Status:** Parcialmente seguro — ações manuais necessárias antes do deploy em produção

---

## Checklist — O que foi feito

### 1. Proteção de Rotas (Middleware)

| Item | Status |
|------|--------|
| `proxy.ts` reativado com proteção real (DEMO_MODE removido) | ✅ Concluído |
| Rotas protegidas: `/master`, `/editora`, `/titular`, `/portal`, `/backoffice`, `/admin` | ✅ Concluído |
| APIs protegidas: `/api/*` retorna 401 JSON sem sessão | ✅ Concluído |
| Exceção pública: `/api/auth/login` não exige sessão | ✅ Concluído |
| Redirect para `/auth/login` com `?redirectTo` preservado | ✅ Concluído |
| Redirect de login→dashboard para usuário já autenticado | ✅ Concluído |
| Proteção de role: `/master` bloqueado para não-masters | ✅ Concluído |
| Build local passou sem erros (120 páginas, TypeScript OK) | ✅ Concluído |
| `middleware.ts.bak` mantido como backup (não ativo) | ✅ Concluído |

### 2. Auditoria de Segredos

| Item | Status |
|------|--------|
| Varredura completa do histórico git com `git log --all -p` | ✅ Concluído |
| Relatório detalhado em `SECURITY_AUDIT.md` | ✅ Concluído |
| `.gitignore` verifica: `.env*`, `.vercel/`, `node_modules/` ignorados | ✅ Verificado |
| Nenhum arquivo `.env.local` commitado no histórico | ✅ Confirmado |
| 1 segredo real encontrado: anon key em `RELATORIO_FASE_A.md` (commit 21c0013) | ⚠️ Requer rotação |

### 3. Backup Automático

| Item | Status |
|------|--------|
| Script `scripts/backup-supabase.ps1` criado | ✅ Concluído |
| Guia `scripts/backup-supabase.md` criado (instalação, uso, Task Scheduler) | ✅ Concluído |
| Pasta `C:\Users\Usuário\Desktop\BACKUPS_SYNC_MOOD\` criada | ✅ Concluído |
| Retenção automática de 30 backups | ✅ Implementado |
| Compressão gzip nativa (sem dependências externas) | ✅ Implementado |

> **NOTA:** O teste manual do backup requer `pg_dump` instalado + connection string real do Supabase.  
> Instruções completas em `scripts/backup-supabase.md`.

---

## Ações Manuais Necessárias (faça ANTES do deploy)

### URGENTE — Rotacionar a Anon Key do Supabase

A chave `sb_publishable_pnyCvafLzScuOZ_leugKNA_BoUohzjq` foi exposta no commit `21c0013` (arquivo `RELATORIO_FASE_A.md`).

**Passo a passo:**

1. Acesse: https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/settings/api
2. Clique em **Rotate API Keys** → **Rotate anon key**
3. Confirme a rotação
4. Copie a nova anon key gerada
5. Atualize seu arquivo local `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_[NOVA_CHAVE_AQUI]
   ```
6. Atualize as variáveis de ambiente no Vercel:
   ```
   # No terminal (requer vercel CLI instalado):
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   # Cole a nova chave quando solicitado
   ```
   Ou via dashboard: https://vercel.com/dashboard → Project → Settings → Environment Variables

### Opcional mas recomendado — Limpar RELATORIO_FASE_A.md

```powershell
# Substitua o valor real por [REDACTED] no arquivo
(Get-Content RELATORIO_FASE_A.md) -replace 'sb_publishable_pnyCvafLzScuOZ_leugKNA_BoUohzjq', '[REDACTED]' | Set-Content RELATORIO_FASE_A.md
```

### Configurar Backup Automático

1. Instale `pg_dump` (ver `scripts/backup-supabase.md`)
2. Obtenha a connection string do Supabase Dashboard
3. Teste manualmente:
   ```powershell
   $env:SUPABASE_DB_URL = 'postgresql://postgres.tigubwxotanaznqqxogf:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'
   .\scripts\backup-supabase.ps1
   ```
4. Agende via Task Scheduler (diário às 03h) — instruções em `scripts/backup-supabase.md`

### Configurar Variáveis de Ambiente no Vercel

Confirme que estas variáveis estão configuradas no Vercel:

| Variável | Onde obter |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API (após rotação) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (NUNCA expor no client) |

```powershell
# Comandos para adicionar/atualizar variáveis no Vercel (requer vercel CLI):
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

### Verificar RLS (Row Level Security) no Supabase

Mesmo com a anon key sendo pública por design, é essencial que o RLS esteja ativo:

1. Acesse: https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/editor
2. Execute:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   ORDER BY tablename;
   ```
3. Confirme que `rowsecurity = true` para todas as tabelas sensíveis

### Instalar Proteção contra Futuros Commits de Segredos

```powershell
# Instalar git-secrets (requer git e winget)
winget install -e --id Amazon.GitSecrets
# Configurar no repo
cd C:\Users\Usuário\Desktop\sync-mood-saas
git secrets --install
git secrets --register-aws
```

---

## Comandos de Rotação — Referência Rápida

### Rotacionar Supabase Keys
```
1. https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/settings/api
   → Rotate anon key
   → Rotate service_role key (se desejado)
```

### Atualizar Vercel após rotação
```powershell
# Listar variáveis existentes
vercel env ls

# Remover variável antiga
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Adicionar nova
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Redesploiar
vercel --prod
```

---

## Arquivos Criados/Modificados nesta Sessão

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `apps/web/proxy.ts` | Modificado | Proteção real ativada (DEMO_MODE removido, /portal, /backoffice, /admin, /api protegidos) |
| `apps/web/middleware.ts.bak` | Mantido | Backup do middleware original (não ativo) |
| `SECURITY_AUDIT.md` | Criado | Relatório de auditoria de segredos no histórico git |
| `SECURITY_REPORT.md` | Criado | Este arquivo |
| `scripts/backup-supabase.ps1` | Criado | Script PowerShell de backup automático |
| `scripts/backup-supabase.md` | Criado | Guia de instalação, uso e agendamento |

---

*Gerado em 2026-05-31 | sync-mood-saas security hardening*
