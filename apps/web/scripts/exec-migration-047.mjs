/**
 * Tenta executar a migration 047 via Supabase Management API.
 * Requer SUPABASE_ACCESS_TOKEN no .env.local ou como variável de ambiente.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const envContent = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, '')] })
)

const SUPABASE_URL  = env.NEXT_PUBLIC_SUPABASE_URL  // https://<ref>.supabase.co
const SERVICE_KEY   = env.SUPABASE_SERVICE_ROLE_KEY
const PROJECT_REF   = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')

// SQL da migration 047
const sql = `
ALTER TABLE titulares ADD COLUMN IF NOT EXISTS contatos       JSONB   DEFAULT '[]'::jsonb;
ALTER TABLE titulares ADD COLUMN IF NOT EXISTS endereco       JSONB;
ALTER TABLE titulares ADD COLUMN IF NOT EXISTS dados_bancarios JSONB;
ALTER TABLE titulares ADD COLUMN IF NOT EXISTS funcoes        TEXT[]  DEFAULT '{}';
ALTER TABLE titulares ADD COLUMN IF NOT EXISTS estado_civil   TEXT;
ALTER TABLE titulares ADD COLUMN IF NOT EXISTS sociedade_autoral TEXT;
ALTER TABLE titulares ADD COLUMN IF NOT EXISTS pseudonimos    JSONB   DEFAULT '[]'::jsonb;
ALTER TABLE titulares ADD COLUMN IF NOT EXISTS documentos     JSONB   DEFAULT '[]'::jsonb;
ALTER TABLE titulares ADD COLUMN IF NOT EXISTS codigo_interno TEXT;
CREATE INDEX IF NOT EXISTS idx_titulares_dados_bancarios ON titulares USING GIN (dados_bancarios) WHERE dados_bancarios IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_titulares_contatos ON titulares USING GIN (contatos) WHERE contatos IS NOT NULL;
`

console.log(`\nProject ref: ${PROJECT_REF}`)
console.log('Tentando via Supabase Management API...\n')

// Tenta Management API (requer PAT)
const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_KEY}`,   // Tenta com service_role (normalmente não funciona)
  },
  body: JSON.stringify({ query: sql }),
}).catch(() => null)

if (mgmtRes?.ok) {
  const result = await mgmtRes.json()
  console.log('✅ Migration 047 executada via Management API!')
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
}

// Tenta RPC direto (requer função exec_sql no banco)
const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({ sql }),
}).catch(() => null)

if (rpcRes?.ok) {
  console.log('✅ Migration 047 executada via RPC exec_sql!')
  process.exit(0)
}

// Nenhuma abordagem automática funcionou — gera SQL para execução manual
const mgmtStatus = mgmtRes?.status ?? 'sem resposta'
const rpcStatus  = rpcRes?.status  ?? 'sem resposta'

console.log(`⚠  Não foi possível executar automaticamente.`)
console.log(`   Management API: ${mgmtStatus}`)
console.log(`   RPC exec_sql:   ${rpcStatus}\n`)
console.log('┌─────────────────────────────────────────────────────────────────┐')
console.log('│  EXECUTE O SQL ABAIXO NO SUPABASE SQL EDITOR                    │')
console.log(`│  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new  │`)
console.log('└─────────────────────────────────────────────────────────────────┘\n')
console.log(sql)
