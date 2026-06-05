// Script local para executar a bridge sem HTTP
// Usage: node scripts/run-bridge-local.mjs <obra_id>
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Carregar .env.local
const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
const env = {}
for (const line of envLines) {
  const [k, ...vs] = line.split('=')
  if (k && vs.length) env[k.trim()] = vs.join('=').trim()
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY']
const obra_id      = process.argv[2]

if (!obra_id) {
  console.error('Usage: node scripts/run-bridge-local.mjs <obra_id>')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function runBridge() {
  console.log(`\n=== Bridge Analítico ===`)
  console.log(`Obra ID: ${obra_id}`)

  // 1. Buscar tenant_id da obra
  const { data: obra, error: obraErr } = await sb
    .from('obras')
    .select('id, titulo, tenant_id, editora_id')
    .eq('id', obra_id)
    .single()

  if (obraErr || !obra) {
    console.error('Obra não encontrada:', obraErr?.message)
    process.exit(1)
  }
  console.log(`Obra: "${obra.titulo}" | Tenant: ${obra.tenant_id}`)

  const tenant_id = obra.tenant_id

  // 2. Buscar links com titulares
  const { data: links, error: linksErr } = await sb
    .from('obras_links')
    .select(`
      id, numero_link, percentual_link, tipo_link, controlado, status,
      obras_links_titulares (
        id, nome, funcao_no_link, papel, editora_id,
        percentual_exec_publica, percentual_fonomecanico, percentual_sincronizacao,
        controlado, status_controle
      )
    `)
    .eq('obra_id', obra_id)
    .eq('tenant_id', tenant_id)
    .eq('status', 'ativo')

  if (linksErr) {
    console.error('Erro links:', linksErr.message)
    process.exit(1)
  }
  console.log(`Links encontrados: ${links?.length ?? 0}`)

  // 3. Coletar editora_ids para buscar negocios_editoriais
  const editoraIds = []
  for (const link of links ?? []) {
    for (const tit of link.obras_links_titulares ?? []) {
      if (tit.editora_id) editoraIds.push(tit.editora_id)
    }
  }
  console.log(`Editora IDs encontradas: ${editoraIds.length}`)

  // 4. Buscar negocios_editoriais
  let negocios = []
  if (editoraIds.length > 0) {
    const { data: neg } = await sb
      .from('negocios_editoriais')
      .select('*')
      .eq('tenant_id', tenant_id)
      .in('editora_administrada_id', editoraIds)
      .eq('status', 'ativo')
    negocios = neg ?? []
    console.log(`Negócios editoriais encontrados: ${negocios.length}`)
  }

  // 5. Calcular participações
  const participacoes = []
  const tipo_direito_id = '00000000-0000-0000-0000-000000000002'  // digital
  const territorio = 'BR'
  const versao = 1

  for (const link of links ?? []) {
    console.log(`\n--- Link #${link.numero_link} (${link.percentual_link}%) ---`)

    for (const tit of link.obras_links_titulares ?? []) {
      const pctCwr = Number(tit.percentual_fonomecanico ?? 0)
      const pctLink = Number(link.percentual_link ?? 100)
      const pctSobreObra = pctCwr * pctLink / 100

      if (tit.funcao_no_link === 'E' && tit.editora_id) {
        // Verificar negócio editorial
        const negocio = negocios.find(n => n.editora_administrada_id === tit.editora_id)
        if (negocio) {
          // Dividir entre administrada e administradora
          const pctAdm   = pctSobreObra * Number(negocio.percentual_administrada)   / 100
          const pctAdmR  = pctSobreObra * Number(negocio.percentual_administradora) / 100

          console.log(`  ${tit.nome} (E) CWR=${pctCwr}% → Adm=${pctAdm.toFixed(4)}% + AdmR=${pctAdmR.toFixed(4)}%`)
          console.log(`  Negócio: ${negocio.nome} (${negocio.percentual_administrada}/${negocio.percentual_administradora})`)

          participacoes.push({
            tenant_id, obra_id, obra_link_id: link.id,
            obra_link_origem_id: link.id,
            nome_participante: negocio.editora_administrada_nome ?? tit.nome,
            tipo_participante_codigo: 'editora_administrada',
            nivel_distribuicao: 2,
            percentual_sobre_obra: pctAdm,
            percentual_sobre_origem: Number(negocio.percentual_administrada),
            origem_participante_id: null,
            tipo_direito_id, territorio,
            negocio_editorial_id: negocio.id,
            status_calculo: 'calculado',
            versao_calculo: versao,
          })

          participacoes.push({
            tenant_id, obra_id, obra_link_id: link.id,
            obra_link_origem_id: link.id,
            nome_participante: negocio.editora_administradora_nome,
            tipo_participante_codigo: 'editora_administradora',
            nivel_distribuicao: 3,
            percentual_sobre_obra: pctAdmR,
            percentual_sobre_origem: Number(negocio.percentual_administradora),
            origem_participante_id: null,
            tipo_direito_id, territorio,
            negocio_editorial_id: negocio.id,
            status_calculo: 'calculado',
            versao_calculo: versao,
          })
        } else {
          console.log(`  ${tit.nome} (E) CWR=${pctCwr}% — sem negócio editorial → pendente`)
          participacoes.push({
            tenant_id, obra_id, obra_link_id: link.id,
            obra_link_origem_id: link.id,
            nome_participante: tit.nome,
            tipo_participante_codigo: 'editora_administrada',
            nivel_distribuicao: 2,
            percentual_sobre_obra: pctSobreObra,
            percentual_sobre_origem: 100,
            origem_participante_id: null,
            tipo_direito_id, territorio,
            status_calculo: 'pendente',
            pendencia: 'negocio_editorial_nao_encontrado',
            versao_calculo: versao,
          })
        }
      } else {
        // Autor, AM, outros
        const tipoParticipante = tit.funcao_no_link === 'CA' ? 'autor'
          : tit.funcao_no_link === 'AM' ? 'editora_administradora'
          : 'outro'
        console.log(`  ${tit.nome} (${tit.funcao_no_link}) → ${pctSobreObra.toFixed(4)}%`)
        participacoes.push({
          tenant_id, obra_id, obra_link_id: link.id,
          obra_link_origem_id: link.id,
          nome_participante: tit.nome,
          tipo_participante_codigo: tipoParticipante,
          nivel_distribuicao: tit.funcao_no_link === 'CA' ? 1 : 3,
          percentual_sobre_obra: pctSobreObra,
          percentual_sobre_origem: pctCwr,
          origem_participante_id: null,
          tipo_direito_id, territorio,
          status_calculo: 'calculado',
          versao_calculo: versao,
        })
      }
    }
  }

  // 6. Invalidar versões anteriores
  await sb.from('obras_analitico')
    .update({ invalidado_em: new Date().toISOString() })
    .eq('obra_id', obra_id)
    .eq('tenant_id', tenant_id)
    .is('invalidado_em', null)

  // 7. Inserir novas linhas
  const { data: inserted, error: insErr } = await sb
    .from('obras_analitico')
    .insert(participacoes)
    .select()

  if (insErr) {
    console.error('\nErro ao inserir obras_analitico:', insErr.message)
    console.error('Detalhes:', insErr.details)
    process.exit(1)
  }

  // 8. Resultado
  const total = participacoes.reduce((s, p) => s + p.percentual_sobre_obra, 0)
  console.log('\n=== RESULTADO obras_analitico ===')
  for (const p of participacoes) {
    const status = p.status_calculo === 'calculado' ? '✓' : '⚠'
    console.log(`  ${status} ${p.nome_participante.padEnd(30)} ${p.tipo_participante_codigo.padEnd(25)} ${p.percentual_sobre_obra.toFixed(4)}%`)
  }
  console.log(`  ${'─'.repeat(70)}`)
  console.log(`  ${'TOTAL'.padEnd(57)} ${total.toFixed(4)}%`)
  console.log(`\n  Linhas inseridas: ${inserted?.length ?? 0}`)
}

runBridge().catch(e => {
  console.error('Erro fatal:', e.message)
  process.exit(1)
})
