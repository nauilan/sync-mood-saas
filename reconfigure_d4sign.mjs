/**
 * Reconfigura as credenciais D4Sign no Vercel
 * 
 * Uso:
 *   set D4TOKEN=live_SEU_TOKEN && set D4CRYPT=live_crypt_SUA_CHAVE && node reconfigure_d4sign.mjs
 * 
 * Ou com sandbox:
 *   set D4TOKEN=... && set D4CRYPT=... && set D4BASE=https://sandbox.d4sign.com.br/api/v1 && node reconfigure_d4sign.mjs
 */
import { execSync, spawnSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'

const tokenAPI = process.env.D4TOKEN?.trim()
const cryptKey  = process.env.D4CRYPT?.trim()
const baseUrl   = process.env.D4BASE?.trim() || ''

if (!tokenAPI || !cryptKey) {
  console.error('Uso:')
  console.error('  set D4TOKEN=live_SEU_TOKEN && set D4CRYPT=live_crypt_SUA_CHAVE && node reconfigure_d4sign.mjs')
  process.exit(1)
}

// ── 1. Testar credenciais contra D4Sign ──────────────────────────────────────
const testBase = baseUrl || 'https://secure.d4sign.com.br/api/v1'
console.log(`\n1. Testando credenciais em ${testBase} ...`)

let safeUUID = ''
try {
  const r = await fetch(`${testBase}/safes?tokenAPI=${tokenAPI}&cryptKey=${cryptKey}`)
  console.log('   HTTP:', r.status)
  const data = await r.json()
  if (!r.ok) {
    const msg = data?.message || JSON.stringify(data)
    console.error(`   ✗ D4Sign rejeitou credenciais: ${msg}`)
    console.error('\n   Verifique:')
    console.error('   - O tokenAPI e cryptKey estão corretos?')
    console.error('   - Sua conta D4Sign tem acesso à API habilitado?')
    if (!baseUrl) {
      console.error('   - Você está usando sandbox? Se sim, rode com:')
      console.error('     set D4BASE=https://sandbox.d4sign.com.br/api/v1 && ...')
    }
    process.exit(1)
  }
  const safes = Array.isArray(data) ? data : (data.data || [])
  console.log(`   ✓ OK! ${safes.length} cofre(s) encontrado(s):`)
  for (const s of safes.slice(0, 10)) {
    const isMark = s.uuid === 'fa6c664d-4f8a-4280-be47-818b3a7367b4' ? ' ← ATUAL' : ''
    console.log(`     [${s.uuid}] ${s.name || s.safeName}${isMark}`)
  }
  // Usa o primeiro que contenha "CESSAO" ou "CONTRATO" ou o que já estava configurado
  const cessao = safes.find(s => 
    (s.name || s.safeName || '').toUpperCase().includes('CESS') ||
    (s.name || s.safeName || '').toUpperCase().includes('CONTRAT')
  ) || safes[0]
  safeUUID = cessao?.uuid || 'fa6c664d-4f8a-4280-be47-818b3a7367b4'
  console.log(`\n   Cofre selecionado: [${safeUUID}] ${cessao?.name || cessao?.safeName || ''}`)
} catch (e) {
  console.error('   ✗ Erro de rede:', e.message)
  process.exit(1)
}

// ── 2. Armazenar no Vercel ───────────────────────────────────────────────────
console.log('\n2. Armazenando no Vercel ...')

const vars = [
  ['D4SIGN_TOKEN_API', tokenAPI],
  ['D4SIGN_CRYPT_KEY',  cryptKey],
  ['D4SIGN_SAFE_UUID',  safeUUID],
  ...( baseUrl ? [['D4SIGN_BASE_URL', baseUrl]] : [] ),
]

for (const [key, value] of vars) {
  const tmp = `_d4sign_${key}.tmp`
  writeFileSync(tmp, value, 'utf8')
  try {
    const r = spawnSync(`type ${tmp} | vercel env add ${key} production --force`, {
      shell: true, encoding: 'utf8', timeout: 15000,
      cwd: 'C:\\Users\\Usuário\\Desktop\\sync-mood-saas'
    })
    const out = (r.stdout || '') + (r.stderr || '')
    if (r.status === 0) {
      console.log(`   ✓ ${key} atualizado`)
    } else {
      console.error(`   ✗ ${key}:`, out.slice(0, 200))
    }
  } finally {
    try { unlinkSync(tmp) } catch {}
  }
}

// ── 3. Redeploy ──────────────────────────────────────────────────────────────
console.log('\n3. Fazendo redeploy ...')
const deploy = spawnSync('vercel --prod --yes', {
  shell: true, encoding: 'utf8', timeout: 180000,
  cwd: 'C:\\Users\\Usuário\\Desktop\\sync-mood-saas'
})
const deployOut = (deploy.stdout || '') + (deploy.stderr || '')
if (deploy.status === 0) {
  console.log('   ✓ Deploy concluído')
  const match = deployOut.match(/(https:\/\/sync-mood-saas[^\s]+)/)
  if (match) console.log('   URL:', match[1])
} else {
  console.error('   Deploy falhou. Verifique manualmente.')
}

console.log('\n✓ Configuração D4Sign concluída!')
console.log('Agora testa em: https://sync-mood-saas.vercel.app/master/contratos')
