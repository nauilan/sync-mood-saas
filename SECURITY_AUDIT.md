# SECURITY_AUDIT.md — Auditoria de Segredos no Repositório

**Data:** 2026-05-31  
**Projeto:** sync-mood-saas  
**Executado por:** Varredura automatizada com `git log --all -p` + `Select-String`

---

## Sumário Executivo

| Criticidade | Qtd | Status |
|-------------|-----|--------|
| ALTA — segredo real commitado | 1 | Requer rotação imediata |
| MEDIA — placeholder commitado | 1 | Sem risco real |
| INFO — referência indireta | 2 | Sem risco |

---

## Segredos Encontrados

### [ALTA] NEXT_PUBLIC_SUPABASE_ANON_KEY exposta em RELATORIO_FASE_A.md

| Campo | Valor |
|-------|-------|
| **Arquivo** | `RELATORIO_FASE_A.md` |
| **Commit** | `21c0013` (feat: Fase A - migracao Supabase) |
| **Branch** | main |
| **Tipo** | Supabase Publishable (anon) key |
| **Valor exposto** | `sb_publishable_pnyCvafLzScuOZ_leugKNA_BoUohzjq` |
| **Ainda no HEAD?** | Sim — o arquivo RELATORIO_FASE_A.md ainda existe no HEAD |
| **Risco** | Moderado: esta é a chave pública (anon) do Supabase, projetada para uso no cliente. Porém, com ela + RLS mal configurado, é possível acessar dados sem autenticação. |
| **Recomendação** | Rotacionar a anon key no Supabase Dashboard. Remover o valor real do RELATORIO_FASE_A.md e substituir por `[REDACTED]`. |

**Trecho do commit:**
```
+| NEXT_PUBLIC_SUPABASE_ANON_KEY | sb_publishable_pnyCvafLzScuOZ_leugKNA_BoUohzjq |
```

---

### [MEDIA] SUPABASE_SERVICE_ROLE_KEY — placeholder (sem valor real)

| Campo | Valor |
|-------|-------|
| **Arquivo** | `RELATORIO_FASE_A.md` |
| **Commit** | `21c0013` |
| **Tipo** | Placeholder — sem valor real |
| **Valor exposto** | `(usar service role key do Supabase dashboard)` |
| **Risco** | Nenhum — é apenas um texto instrucional |
| **Recomendação** | Nenhuma ação urgente. Confirmar que a service role key NUNCA foi commitada. |

---

### [INFO] URL do projeto Supabase exposta em documentação

| Campo | Valor |
|-------|-------|
| **Arquivo** | `RELATORIO_FASE_A.md` |
| **Commit** | `21c0013` |
| **Valor** | `https://tigubwxotanaznqqxogf.supabase.co` |
| **Risco** | Baixo — a URL do projeto é semi-pública; o acesso real depende de chaves |
| **Recomendação** | Manter informado. Não é segredo crítico. |

---

### [INFO] Referências a `service_role` em migrations SQL

| Campo | Valor |
|-------|-------|
| **Arquivo** | Migrations SQL em `supabase/migrations/` |
| **Tipo** | Role name do PostgreSQL, não uma chave de API |
| **Risco** | Nenhum — é apenas o nome de um role padrão do Supabase |

---

## Verificação do .gitignore

### Raiz do repositório (`/.gitignore`)

| Padrão | Status |
|--------|--------|
| `.env.local` | ✅ Ignorado |
| `.env*.local` | ✅ Ignorado |
| `.vercel/` | ✅ Ignorado |
| `node_modules/` | ✅ Ignorado |

### apps/web (`apps/web/.gitignore`)

| Padrão | Status |
|--------|--------|
| `.env*` | ✅ Ignorado (cobre `.env.local` e todas as variantes) |
| `.vercel` | ✅ Ignorado |
| `node_modules` | ✅ Ignorado |
| `*.tsbuildinfo` | ✅ Ignorado |

**Conclusão:** O `.gitignore` está corretamente configurado. Nenhum arquivo `.env.local` foi encontrado no histórico git.

---

## Verificação de .env.local no histórico git

```
git log --all --oneline --diff-filter=A -- "*.env*" "**/.env*" ".env.local" "apps/**/.env*"
```
**Resultado:** Nenhum arquivo `.env*` foi commitado em momento algum. ✅

---

## Ações Recomendadas (em ordem de prioridade)

1. **[URGENTE]** Rotacionar a `NEXT_PUBLIC_SUPABASE_ANON_KEY` no Supabase Dashboard
   - URL: https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/settings/api
   - Após rotacionar: atualizar `.env.local` e as variáveis no Vercel
2. **[RECOMENDADO]** Remover/substituir o valor da chave em `RELATORIO_FASE_A.md` por `[REDACTED]`
3. **[OPCIONAL]** Considerar `git filter-repo` para reescrever o histórico e remover o commit `21c0013` (porém, como o repo pode ter mirrors/deploys, avaliar custo/benefício)
4. **[PREVENTIVO]** Instalar o hook pré-commit [git-secrets](https://github.com/awslabs/git-secrets) ou [truffleHog](https://github.com/trufflesecurity/trufflehog) para prevenir futuros commits de segredos

---

*Gerado automaticamente em 2026-05-31*
