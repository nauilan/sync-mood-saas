// Script local para processar CC Obra v2 sem HTTP
// Usage: node scripts/processar-cc-obra.mjs <recebimento_id>
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
const env = {}
for (const line of envLines) {
  const [k, ...vs] = line.split('=')
  if (k && vs.length) env[k.trim()] = vs.join('=').trim()
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY']
const recebimento_id = process.argv[2]

if (!recebimento_id) {
  console.error('Usage: node scripts/processar-cc-obra.mjs <recebimento_id>')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function round2(n) { return Math.round(n * 100) / 100 }

function ajustarCentavos(valores, total) {
  const soma = valores.reduce((a, b) => a + b, 0)
  const diff = round2(total - soma)
  if (diff === 0 || valores.length === 0) return valores
  const idx = valores.indexOf(Math.max(...valores))
  const copia = [...valores]
  copia[idx] = round2(copia[idx] + diff)
  return copia
}

const FONTES_ECAD = ['ECAD', 'SOCINPRO', 'ABRAMUS', 'AMAR', 'ASSIM', 'SICAM', 'UBC']

async function processar() {
  console.log(`\n=== Processar CC Obra v2 ===`)
  console.log(`Recebimento ID: ${recebimento_id}`)

  // 1. Buscar recebimento
  const { data: rec, error: recErr } = await sb
    .from('recebimentos')
    .select('*')
    .eq('id', recebimento_id)
    .single()

  if (recErr || !rec) {
    console.error('Recebimento não encontrado:', recErr?.message)
    process.exit(1)
  }

  console.log(`Obra: ${rec.song_title} | Valor: R$ ${rec.valor_bruto} | Fonte: ${rec.fonte_pagadora_codigo}`)
  console.log(`Tipo Direito ID: ${rec.tipo_direito_id} | Território: ${rec.territorio}`)
  console.log(`Competência: ${rec.competencia_inicio} → ${rec.competencia_fim}`)
  console.log(`Status atual: ${rec.status}`)

  if (!rec.obra_id) {
    console.error('Recebimento sem obra vinculada!')
    process.exit(1)
  }

  // 2. Verificar ECAD
  if (FONTES_ECAD.includes(rec.fonte_pagadora_codigo?.toUpperCase())) {
    console.log('\n⚠ Fonte ECAD/sociedade — apenas registro informativo, não processa CC Obra.')
    process.exit(0)
  }

  // 3. Buscar linhas do analítico
  let query = sb
    .from('obras_analitico')
    .select('*')
    .eq('tenant_id', rec.tenant_id)
    .eq('obra_id', rec.obra_id)
    .is('invalidado_em', null)
    .order('nivel_distribuicao', { ascending: true })

  if (rec.tipo_direito_id) query = query.eq('tipo_direito_id', rec.tipo_direito_id)
  if (rec.territorio && rec.territorio !== 'MUNDIAL') {
    query = query.or(`territorio.eq.${rec.territorio},territorio.eq.MUNDIAL`)
  }

  const { data: linhas, error: linhasErr } = await query
  if (linhasErr) {
    console.error('Erro ao buscar analítico:', linhasErr.message)
    process.exit(1)
  }

  if (!linhas || linhas.length === 0) {
    console.error('Nenhuma linha de analítico encontrada. Execute a bridge primeiro.')
    process.exit(1)
  }

  console.log(`\nLinhas analítico encontradas: ${linhas.length}`)

  // 4. Separar calculadas × pendentes
  const calculadas = linhas.filter(l => l.status_calculo === 'calculado')
  const pendentes  = linhas.filter(l => l.status_calculo === 'pendente')

  const pctCalculado = calculadas.reduce((s, l) => s + Number(l.percentual_sobre_obra), 0)
  const pctPendente  = pendentes.reduce((s, l)  => s + Number(l.percentual_sobre_obra), 0)

  console.log(`  Calculadas: ${calculadas.length} (${pctCalculado.toFixed(4)}%) | Pendentes: ${pendentes.length} (${pctPendente.toFixed(4)}%)`)

  // 5. Calcular valores
  const valoresCalculados = calculadas.map(l => round2(rec.valor_bruto * Number(l.percentual_sobre_obra) / 100))
  const valorDistribuivel = round2(rec.valor_bruto * pctCalculado / 100)
  const valoresAjustados  = ajustarCentavos(valoresCalculados, valorDistribuivel)
  const versaoCalculo = linhas[0]?.versao_calculo ?? 1

  const movimentos = []
  let total_distribuido = 0
  let total_retido = 0

  // Movimentos distribuídos
  calculadas.forEach((l, idx) => {
    const valor = valoresAjustados[idx]
    movimentos.push({
      tenant_id:                  rec.tenant_id,
      obra_id:                    rec.obra_id,
      recebimento_id:             rec.id,
      analitico_linha_id:         l.id,
      titular_id:                 l.titular_id ?? null,
      editora_id:                 l.editora_id ?? null,
      nome_participante:          l.nome_participante,
      tipo_participante_codigo:   l.tipo_participante_codigo,
      percentual_sobre_obra:      Number(l.percentual_sobre_obra),
      valor_bruto_participante:   valor,
      valor_liquido_participante: valor,
      tipo_direito_id:            l.tipo_direito_id ?? rec.tipo_direito_id ?? null,
      territorio:                 l.territorio ?? rec.territorio ?? null,
      competencia_inicio:         rec.competencia_inicio,
      competencia_fim:            rec.competencia_fim,
      fonte_pagadora_codigo:      rec.fonte_pagadora_codigo,
      fonte_pagadora_tipo:        rec.fonte_pagadora_tipo ?? null,
      status_movimento:           'distribuido',
      pendencia:                  null,
      versao_calculo:             versaoCalculo,
      calculado_por:              'cc_obra_v2_script',
    })
    total_distribuido = round2(total_distribuido + valor)
  })

  // Movimentos retidos
  pendentes.forEach(l => {
    const valorRetido = round2(rec.valor_bruto * Number(l.percentual_sobre_obra) / 100)
    movimentos.push({
      tenant_id:                  rec.tenant_id,
      obra_id:                    rec.obra_id,
      recebimento_id:             rec.id,
      analitico_linha_id:         l.id,
      titular_id:                 l.titular_id ?? null,
      editora_id:                 l.editora_id ?? null,
      nome_participante:          l.nome_participante,
      tipo_participante_codigo:   l.tipo_participante_codigo,
      percentual_sobre_obra:      Number(l.percentual_sobre_obra),
      valor_bruto_participante:   valorRetido,
      valor_liquido_participante: 0,
      tipo_direito_id:            l.tipo_direito_id ?? rec.tipo_direito_id ?? null,
      territorio:                 l.territorio ?? rec.territorio ?? null,
      competencia_inicio:         rec.competencia_inicio,
      competencia_fim:            rec.competencia_fim,
      fonte_pagadora_codigo:      rec.fonte_pagadora_codigo,
      fonte_pagadora_tipo:        rec.fonte_pagadora_tipo ?? null,
      status_movimento:           'retido_pendencia',
      pendencia:                  l.pendencia ?? 'Regra editorial pendente',
      versao_calculo:             versaoCalculo,
      calculado_por:              'cc_obra_v2_script',
    })
    total_retido = round2(total_retido + valorRetido)
  })

  // 6. Gravar — deletar anteriores primeiro (idempotência)
  const { error: delErr } = await sb
    .from('cc_obras_movimentos')
    .delete()
    .eq('recebimento_id', rec.id)
    .eq('obra_id', rec.obra_id)

  if (delErr) {
    console.error('Erro ao limpar movimentos anteriores:', delErr.message)
    process.exit(1)
  }

  const { data: inserted, error: insErr } = await sb
    .from('cc_obras_movimentos')
    .insert(movimentos)
    .select()

  if (insErr) {
    console.error('Erro ao gravar cc_obras_movimentos:', insErr.message)
    console.error('Detalhes:', insErr.details)
    process.exit(1)
  }

  // 7. Atualizar status do recebimento
  const novoStatus = total_retido > 0 ? 'pendente_matching' : 'distribuido'
  await sb.from('recebimentos')
    .update({ status: novoStatus, updated_at: new Date().toISOString() })
    .eq('id', rec.id)

  // 8. Resultado
  console.log('\n=== RESULTADO CC Obra ===')
  for (const m of movimentos) {
    const icon = m.status_movimento === 'distribuido' ? '✓' : '⚠'
    console.log(`  ${icon} ${m.nome_participante.padEnd(30)} ${m.tipo_participante_codigo.padEnd(25)} ${m.percentual_sobre_obra.toFixed(4)}%  R$ ${m.valor_bruto_participante.toFixed(2)}`)
  }
  console.log(`  ${'─'.repeat(80)}`)
  console.log(`  Total Distribuído: R$ ${total_distribuido.toFixed(2)}`)
  console.log(`  Total Retido:      R$ ${total_retido.toFixed(2)}`)
  console.log(`  Total:             R$ ${round2(total_distribuido + total_retido).toFixed(2)}`)
  console.log(`  Status Recebimento: ${novoStatus}`)
  console.log(`\n  Movimentos gravados: ${inserted?.length ?? 0}`)

  // Verificação de soma
  const somaCheck = round2(total_distribuido + total_retido)
  if (somaCheck === rec.valor_bruto) {
    console.log(`\n  ✅ SOMA FECHADA: R$ ${somaCheck.toFixed(2)} = R$ ${rec.valor_bruto.toFixed(2)}`)
  } else {
    console.log(`\n  ⚠ DIVERGÊNCIA: soma ${somaCheck.toFixed(2)} ≠ bruto ${rec.valor_bruto.toFixed(2)}`)
  }
}

processar().catch(e => {
  console.error('Erro fatal:', e.message)
  process.exit(1)
})
