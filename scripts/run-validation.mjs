// Script de validação das migrations 026/027/028
// Usa o pg-meta endpoint do Supabase com service role key
// Execute: node scripts/run-validation.mjs

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lê as variáveis do .env.local
function loadEnv() {
  const envPath = join(__dirname, '../apps/web/.env.local');
  const content = readFileSync(envPath, 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) vars[k.trim()] = v.join('=').trim();
  }
  return vars;
}

async function execSQL(url, serviceKey, sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: '/pg-meta/v1/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Cada check individual
const CHECKS = [
  {
    id: '1.1',
    label: 'ENUM role_usuario tem super_admin',
    sql: `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='role_usuario' ORDER BY enumsortorder`
  },
  {
    id: '1.3',
    label: 'Tabela usuarios_editoras existe',
    sql: `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='usuarios_editoras'`
  },
  {
    id: '1.5',
    label: 'RLS ativo em usuarios_editoras',
    sql: `SELECT relrowsecurity FROM pg_class WHERE relname='usuarios_editoras' AND relnamespace='public'::regnamespace`
  },
  {
    id: '1.6',
    label: 'Policies de usuarios_editoras',
    sql: `SELECT policyname, cmd FROM pg_policies WHERE schemaname='public' AND tablename='usuarios_editoras' ORDER BY policyname`
  },
  {
    id: '1.7',
    label: 'Índices de usuarios_editoras',
    sql: `SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='usuarios_editoras' ORDER BY indexname`
  },
  {
    id: '1.8',
    label: 'Vínculos migrados (usuarios_editoras)',
    sql: `SELECT COUNT(*) AS total FROM usuarios_editoras`
  },
  {
    id: '1.9',
    label: 'Função fn_minhas_editoras_ids existe',
    sql: `SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname='fn_minhas_editoras_ids' AND n.nspname='public'`
  },
  {
    id: '1.10',
    label: 'fn_minhas_editoras_ids é SECURITY DEFINER',
    sql: `SELECT p.prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname='fn_minhas_editoras_ids' AND n.nspname='public' LIMIT 1`
  },
  {
    id: '2.1',
    label: 'contratos_write: editora_administrada REMOVIDA',
    sql: `SELECT policyname, LEFT(qual,200) AS qual FROM pg_policies WHERE schemaname='public' AND tablename='contratos' AND policyname='contratos_write'`
  },
  {
    id: '2.2',
    label: 'obras_write: editora_administrada REMOVIDA',
    sql: `SELECT policyname, LEFT(qual,200) AS qual FROM pg_policies WHERE schemaname='public' AND tablename='obras' AND policyname='obras_write'`
  },
  {
    id: '2.3',
    label: 'editoras_write usa fn_minhas_editoras_ids',
    sql: `SELECT policyname, LEFT(qual,200) AS qual FROM pg_policies WHERE schemaname='public' AND tablename='editoras' AND policyname='editoras_write'`
  },
  {
    id: '2.4',
    label: 'usuarios_insert tem super_admin',
    sql: `SELECT policyname, LEFT(qual,200) AS qual, LEFT(with_check,200) AS wc FROM pg_policies WHERE schemaname='public' AND tablename='usuarios' AND policyname='usuarios_insert'`
  },
  {
    id: '2.5',
    label: 'usuarios_update tem super_admin',
    sql: `SELECT policyname, LEFT(qual,200) AS qual FROM pg_policies WHERE schemaname='public' AND tablename='usuarios' AND policyname='usuarios_update'`
  },
  {
    id: '3.1',
    label: 'ENUMs novos existem (status_sol_contrato, status_sol_obra, acao_workflow)',
    sql: `SELECT typname FROM pg_type WHERE typname IN ('status_sol_contrato','status_sol_obra','acao_workflow') AND typtype='e' ORDER BY typname`
  },
  {
    id: '3.3',
    label: "status_sol_contrato tem 'devolvido'",
    sql: `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='status_sol_contrato' ORDER BY enumsortorder`
  },
  {
    id: '3.5',
    label: "status_sol_obra tem 'devolvida'",
    sql: `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='status_sol_obra' ORDER BY enumsortorder`
  },
  {
    id: '4.1',
    label: 'Tabelas novas da migration 028',
    sql: `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('solicitacoes_contratos','solicitacoes_contratos_titulares','solicitacoes_contratos_direitos','solicitacoes_contratos_territorios','solicitacoes_assinaturas','solicitacoes_obras','solicitacoes_obras_titulares','solicitacoes_obras_direitos','solicitacoes_obras_territorios','workflow_aprovacoes','solicitacoes_historico') ORDER BY table_name`
  },
  {
    id: '4.3',
    label: 'Campos url_documento + nome_documento em solicitacoes_contratos',
    sql: `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='solicitacoes_contratos' AND column_name IN ('url_documento','nome_documento') ORDER BY column_name`
  },
  {
    id: '5.1',
    label: 'RLS ativo em todas as novas tabelas',
    sql: `SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('usuarios_editoras','solicitacoes_contratos','solicitacoes_contratos_titulares','solicitacoes_contratos_direitos','solicitacoes_contratos_territorios','solicitacoes_assinaturas','solicitacoes_obras','solicitacoes_obras_titulares','solicitacoes_obras_direitos','solicitacoes_obras_territorios','workflow_aprovacoes','solicitacoes_historico') ORDER BY c.relname`
  },
  {
    id: '5.3',
    label: 'Contagem de policies por nova tabela',
    sql: `SELECT tablename, COUNT(*) AS total_policies FROM pg_policies WHERE schemaname='public' AND tablename IN ('usuarios_editoras','solicitacoes_contratos','solicitacoes_contratos_titulares','solicitacoes_contratos_direitos','solicitacoes_contratos_territorios','solicitacoes_assinaturas','solicitacoes_obras','solicitacoes_obras_titulares','solicitacoes_obras_direitos','solicitacoes_obras_territorios','workflow_aprovacoes','solicitacoes_historico') GROUP BY tablename ORDER BY tablename`
  },
  {
    id: '6.1',
    label: 'contratos.solicitacao_id existe',
    sql: `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='contratos' AND column_name='solicitacao_id'`
  },
  {
    id: '6.2',
    label: 'obras.solicitacao_id existe',
    sql: `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='obras' AND column_name='solicitacao_id'`
  },
  {
    id: '7',
    label: 'Índices principais (025 esperados)',
    sql: `SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname IN ('idx_sol_cont_tenant','idx_sol_cont_editora','idx_sol_cont_status','idx_sol_obra_tenant','idx_sol_obra_editora','idx_sol_obra_status','idx_workflow_tenant','idx_hist_tenant','idx_contratos_solicitacao','idx_obras_solicitacao','idx_usuarios_editoras_usuario','idx_usuarios_editoras_editora','idx_usuarios_editoras_tenant') ORDER BY indexname`
  },
  {
    id: '8.1',
    label: 'solicitacoes_historico SEM policies UPDATE/DELETE',
    sql: `SELECT policyname, cmd FROM pg_policies WHERE schemaname='public' AND tablename='solicitacoes_historico' ORDER BY cmd`
  },
  {
    id: '9.1',
    label: 'solicitacoes_contratos: editora_administrada pode INSERT',
    sql: `SELECT policyname, cmd, LEFT(with_check,150) AS wc FROM pg_policies WHERE schemaname='public' AND tablename='solicitacoes_contratos' ORDER BY policyname`
  },
];

const EXPECTED = {
  '1.1':  (r) => r.some(x => x.enumlabel === 'super_admin') ? '✅' : '❌',
  '1.3':  (r) => r.length > 0 ? '✅' : '❌',
  '1.5':  (r) => r[0]?.relrowsecurity === true ? '✅' : '❌',
  '1.6':  (r) => r.length >= 2 ? '✅' : '❌',
  '1.7':  (r) => r.length >= 3 ? '✅' : '❌',
  '1.8':  (r) => `ℹ️  ${r[0]?.total} vínculos migrados`,
  '1.9':  (r) => r.length > 0 ? '✅' : '❌',
  '1.10': (r) => r[0]?.prosecdef === true ? '✅' : '❌',
  '2.1':  (r) => {
    if (!r[0]) return '❌ policy não encontrada';
    return r[0].qual?.includes('editora_administrada') ? '❌ editora_administrada ainda presente' : '✅';
  },
  '2.2':  (r) => {
    if (!r[0]) return '❌ policy não encontrada';
    return r[0].qual?.includes('editora_administrada') ? '❌ editora_administrada ainda presente' : '✅';
  },
  '2.3':  (r) => r[0]?.qual?.includes('fn_minhas_editoras_ids') ? '✅' : '❌',
  '2.4':  (r) => (r[0]?.qual?.includes('super_admin') || r[0]?.wc?.includes('super_admin')) ? '✅' : '❌',
  '2.5':  (r) => r[0]?.qual?.includes('super_admin') ? '✅' : '❌',
  '3.1':  (r) => r.length === 3 ? '✅' : `❌ encontrados: ${r.map(x=>x.typname).join(', ')||'nenhum'}`,
  '3.3':  (r) => r.some(x => x.enumlabel === 'devolvido') ? '✅' : '❌',
  '3.5':  (r) => r.some(x => x.enumlabel === 'devolvida') ? '✅' : '❌',
  '4.1':  (r) => {
    const expected = ['solicitacoes_contratos','solicitacoes_contratos_titulares','solicitacoes_contratos_direitos','solicitacoes_contratos_territorios','solicitacoes_assinaturas','solicitacoes_obras','solicitacoes_obras_titulares','solicitacoes_obras_direitos','solicitacoes_obras_territorios','workflow_aprovacoes','solicitacoes_historico'];
    const found = r.map(x => x.table_name);
    const missing = expected.filter(t => !found.includes(t));
    return missing.length === 0 ? `✅ (${found.length}/11)` : `❌ FALTAM: ${missing.join(', ')}`;
  },
  '4.3':  (r) => r.length === 2 ? '✅' : `❌ faltam campos: ${['url_documento','nome_documento'].filter(c => !r.find(x=>x.column_name===c)).join(', ')}`,
  '5.1':  (r) => {
    const disabled = r.filter(x => !x.relrowsecurity).map(x => x.relname);
    return disabled.length === 0 ? '✅ (todas ativas)' : `❌ RLS desativado em: ${disabled.join(', ')}`;
  },
  '5.3':  (r) => {
    const low = r.filter(x => parseInt(x.total_policies) < 2).map(x => x.tablename);
    return low.length === 0 ? `✅ (${r.length} tabelas OK)` : `⚠️ poucas policies em: ${low.join(', ')}`;
  },
  '6.1':  (r) => r.length > 0 ? '✅' : '❌',
  '6.2':  (r) => r.length > 0 ? '✅' : '❌',
  '7':    (r) => `ℹ️  ${r.length}/13 índices encontrados` + (r.length < 13 ? ` — faltam: ${['idx_sol_cont_tenant','idx_sol_cont_editora','idx_sol_cont_status','idx_sol_obra_tenant','idx_sol_obra_editora','idx_sol_obra_status','idx_workflow_tenant','idx_hist_tenant','idx_contratos_solicitacao','idx_obras_solicitacao','idx_usuarios_editoras_usuario','idx_usuarios_editoras_editora','idx_usuarios_editoras_tenant'].filter(i=>!r.find(x=>x.indexname===i)).join(', ')}` : ''),
  '8.1':  (r) => {
    const bad = r.filter(x => ['UPDATE','DELETE'].includes(x.cmd?.toUpperCase()));
    return bad.length === 0 ? '✅ imutável (sem UPDATE/DELETE)' : `❌ policies indevidas: ${bad.map(x=>x.policyname+':'+x.cmd).join(', ')}`;
  },
  '9.1':  (r) => r.some(x => x.wc?.includes('editora_administrada')) ? '✅ editora_administrada pode inserir' : '❌',
};

async function runValidation(phase, env) {
  const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = env;

  console.log('\n' + '='.repeat(70));
  console.log(`  VALIDAÇÃO ${phase}`);
  console.log('='.repeat(70));

  let ok = 0, fail = 0, warn = 0;

  for (const check of CHECKS) {
    const result = await execSQL(url, key, check.sql);

    if (result.status !== 200) {
      console.log(`\n[${check.id}] ${check.label}`);
      if (result.status === 404 || result.body.includes('Not Found')) {
        console.log(`  ⚠️  pg-meta endpoint não disponível (HTTP ${result.status})`);
        warn++;
      } else {
        console.log(`  ❌ Erro HTTP ${result.status}: ${result.body.substring(0, 200)}`);
        fail++;
      }
      continue;
    }

    let rows;
    try {
      rows = JSON.parse(result.body);
    } catch {
      console.log(`\n[${check.id}] ${check.label}`);
      console.log(`  ❌ JSON inválido: ${result.body.substring(0, 200)}`);
      fail++;
      continue;
    }

    const verdict = EXPECTED[check.id]?.(rows) ?? `ℹ️  ${rows.length} rows`;
    const icon = verdict.startsWith('✅') ? '✅' : verdict.startsWith('❌') ? '❌' : verdict.startsWith('⚠️') ? '⚠️' : 'ℹ️';

    console.log(`\n[${check.id}] ${check.label}`);
    console.log(`  ${verdict}`);

    // Mostrar dados detalhados para checks informativos
    if (rows.length > 0 && rows.length <= 15 && (check.id.includes('.') && ['1.1','1.6','1.7','2.1','2.2','2.3','2.4','2.5','3.3','3.5','4.1','5.3','8.1','9.1'].includes(check.id))) {
      for (const row of rows) {
        console.log(`    → ${JSON.stringify(row)}`);
      }
    }

    if (icon === '✅') ok++;
    else if (icon === '❌') fail++;
    else warn++;
  }

  console.log('\n' + '-'.repeat(70));
  console.log(`  RESULTADO: ✅ ${ok} OK  |  ❌ ${fail} FALHAS  |  ⚠️/ℹ️ ${warn} avisos`);
  console.log('-'.repeat(70));

  return fail;
}

// Executa o script
(async () => {
  let env;
  try {
    env = loadEnv();
  } catch (e) {
    console.error('Erro ao ler .env.local:', e.message);
    process.exit(1);
  }

  // Testa conexão com o endpoint pg-meta
  console.log('Testando conexão com pg-meta...');
  const test = await execSQL(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, 'SELECT 1 AS ok');
  if (test.status !== 200) {
    console.error(`❌ pg-meta não respondeu (HTTP ${test.status}).`);
    console.error('Resposta:', test.body.substring(0, 500));
    console.error('\nSolução alternativa: execute o arquivo supabase/validacao_026_027_028.sql');
    console.error('diretamente no Supabase SQL Editor em:');
    console.error('https://supabase.com/dashboard/project/tigubwxotanaznqqxogf/sql/new');
    process.exit(1);
  }
  console.log('✅ Conexão pg-meta OK\n');

  const fails = await runValidation('PRÉ-APPLY (antes de qualquer migration)', env);
  if (fails > 0) {
    console.log('\n⚠️  Resultado esperado pré-apply: vários ❌ são NORMAIS antes de aplicar as migrations.');
    console.log('    Isso confirma que o script detecta corretamente o que ainda falta.');
  }
})();
