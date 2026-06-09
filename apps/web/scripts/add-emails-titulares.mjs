/**
 * Adiciona e-mails placeholder nos 4 titulares usados como assinantes.
 * Edite os e-mails abaixo antes de rodar.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const envContent = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, '')] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// Busca todos os titulares PF ativos
const { data: titulares, error } = await sb
  .from('titulares')
  .select('id, nome_completo, cpf_cnpj, contatos')
  .is('deleted_at', null)
  .order('nome_completo')

if (error) { console.error(error.message); process.exit(1) }

console.log('\n=== TITULARES ATUAIS ===\n')
for (const t of titulares) {
  const emails = Array.isArray(t.contatos)
    ? t.contatos.filter(c => c.tipo === 'email').map(c => c.valor)
    : []
  const status = emails.length > 0 ? `✓ ${emails[0]}` : '✗ sem e-mail'
  console.log(`${status.padEnd(45)} | ${(t.nome_completo ?? '').padEnd(40)} | ${t.id}`)
}
