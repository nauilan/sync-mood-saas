/**
 * Atualiza contatos JSONB dos 4 titulares usados como assinantes.
 * E-mail provisório para validação do fluxo D4Sign.
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

const EMAIL_PROVISORIO = 'contato@topshowmusic.com.br'

const ALVO = [
  { id: 'dae373c3-9582-4b29-9d94-f73c8663144e', nome: 'NAUILAN VICENTINI ZULAI RAMOS' },
  { id: '74895145-8c6c-47c9-a40c-df8a9521603e', nome: 'THAINAH DOS SANTOS DOMICIANO' },
  { id: 'beaf3628-f7b3-48c0-a2b6-335264e0bc3d', nome: 'EDIONE MARQUES DOS SANTOS' },
  { id: '2b9eec10-36ba-4ef4-ad02-358c3794016c', nome: 'ENIO AUGUSTO ZULAI RAMOS' },
]

const CONTATOS = [{ tipo: 'email', valor: EMAIL_PROVISORIO, principal: true }]

console.log('\n=== ATUALIZANDO E-MAILS PROVISÓRIOS ===\n')

for (const t of ALVO) {
  const { error } = await sb
    .from('titulares')
    .update({ contatos: CONTATOS })
    .eq('id', t.id)

  if (error) {
    console.error(`✗ ERRO ${t.nome}: ${error.message}`)
  } else {
    console.log(`✓ OK  ${t.nome}`)
  }
}

// Verificação final
console.log('\n=== VERIFICAÇÃO FINAL ===\n')
const { data: titulares, error: errList } = await sb
  .from('titulares')
  .select('id, nome_completo, cpf_cnpj, contatos')
  .is('deleted_at', null)
  .order('nome_completo')

if (errList) { console.error(errList.message); process.exit(1) }

for (const t of titulares) {
  const emails = Array.isArray(t.contatos)
    ? t.contatos.filter(c => c.tipo === 'email').map(c => c.valor)
    : []
  const status = emails.length > 0 ? `✓ ${emails[0]}` : '✗ sem e-mail'
  console.log(`${status.padEnd(45)} | ${(t.nome_completo ?? '').padEnd(40)} | ${t.id}`)
}
