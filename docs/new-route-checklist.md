# Regras de Desenvolvimento — Novas Rotas

**Regra principal:** toda rota nova que acesse dados sensíveis precisa provar que respeita o tenant antes de ir para produção.

---

## Checklist obrigatório para toda nova rota de API

### 1. Autenticação e tenant

```typescript
// OBRIGATÓRIO em qualquer rota que acesse dados sensíveis
const auth = await tryRequireAuthUser(request)
if (auth instanceof NextResponse) return auth
const { usuario, sb } = auth
// usuario.tenant_id está validado via JWT — nunca aceite do body/query
```

### 2. Filtro de tenant em TODAS as queries

```typescript
// OBRIGATÓRIO em todo SELECT, UPDATE, DELETE
.eq('tenant_id', usuario.tenant_id)

// NUNCA faça isso:
.eq('id', obraId)              // sem tenant — qualquer tenant acessa
.select('*')                   // sem filtro — vaza tudo

// SEMPRE faça isso:
.eq('id', obraId).eq('tenant_id', usuario.tenant_id)
```

### 3. Validar ownership de recursos referenciados

Sempre que receber um ID no body (ex: `obra_id`, `titular_id`, `contrato_id`), verificar que ele pertence ao tenant do usuário:

```typescript
const { data: obra } = await sb
  .from('obras')
  .select('id')
  .eq('id', obra_id)
  .eq('tenant_id', usuario.tenant_id)
  .single()
if (!obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
```

### 4. Nunca aceitar tenant_id do body/query

```typescript
// ERRADO — tenant_id vem do cliente:
const { tenant_id } = await request.json()

// CORRETO — tenant_id vem do JWT via requireAuthUser:
const { usuario } = auth
const tenant_id = usuario.tenant_id
```

### 5. Audit log para operações críticas

```typescript
await logAudit({
  tenant_id:      usuario.tenant_id,
  usuario_id:     usuario.id,
  acao:           'nome_da_acao',
  modulo:         'nome_do_modulo',
  tabela_afetada: 'nome_da_tabela',
  registro_id:    id_do_registro,
  dados_novos:    { /* campos alterados */ },
  ip:             request.headers.get('x-forwarded-for') ?? null,
})
```

---

## Checklist de segurança antes do PR

- [ ] Rota usa `requireAuthUser` ou `tryRequireAuthUser`
- [ ] Todas as queries têm `.eq('tenant_id', usuario.tenant_id)`
- [ ] Todos os IDs recebidos do body/query são validados quanto ao ownership
- [ ] Nenhuma rota aceita `tenant_id` do frontend
- [ ] `logAudit` chamado para operações de escrita críticas
- [ ] Rota nova coberta por um teste (unitário ou de isolamento)

---

## Rotas admin (service_role key no header)

Rotas que exigem `x-admin-secret` (não JWT) são de uso exclusivo interno:

| Rota | Propósito |
|------|-----------|
| `POST /api/admin/reintegrar-catalogo` | Re-integra todo o catálogo (uso único) |
| `POST /api/admin/reconstruir-links` | Reconstrói links de obras |

Nunca adicionar autenticação via JWT nessas rotas — elas são intencionalmente protegidas por segredo de serviço e não devem ser expostas ao frontend.

---

## Pipeline de CI/CD

```
push para main
  ↓
typecheck (tsc --noEmit)
  ↓
unit tests (vitest, excl. isolation)
  ↓
isolation tests (multi-tenant: obras, titulares, autorizações, storage, CWR, admin)
  ↓
deploy para Vercel
```

**Se qualquer etapa falhar, o deploy não acontece.**

---

## Rotas de alto risco — requerem teste de isolamento explícito

Qualquer alteração nas rotas abaixo exige rodar `npm run test:isolation` localmente antes do PR:

- `api/autorizacoes` — criação e listagem
- `api/autorizacoes/[id]/confirmar-pagamento`
- `api/obras` — criação, atualização, deleção
- `api/obras/[id]/contrato-manual` — upload e listagem
- `api/cwr/[id]/integrar` — integração ao catálogo
- `api/cwr/[id]/reverter` — rollback
- `api/cwr/[id]/popular-links` — operação em massa
- `api/obras/migrar-editoras-cwr` — migração em massa
- `api/contratos` — contratos formais
- `api/recebimentos` — valores recebidos
- `api/exportacoes` — relatórios

---

## Como rodar os testes de isolamento

```bash
# Passo 1: subir o servidor local
cd apps/web
npm run dev

# Passo 2: em outro terminal, rodar os testes
cd apps/web
set ISOLATION_TEST_API_URL=http://localhost:3000
npm run test:isolation
```

Em CI/CD, esse passo é automático no workflow `deploy.yml`.
