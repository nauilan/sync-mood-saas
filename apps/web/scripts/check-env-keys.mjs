// Inspeciona quais chaves existem no .env.local (sem expor valores)
import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env.local')
const env = {}
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '').split('\n')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
}

console.log('Keys in .env.local:')
for (const [k, v] of Object.entries(env)) {
  const preview = v ? v.slice(0, 10) + (v.length > 10 ? '...' : '') : '<empty>'
  console.log(`  ${k} = ${preview}`)
}
