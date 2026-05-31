-- ============================================================
-- Migration 00105 — Módulo 6: Recebimentos
-- Sync Mood Gestão Inteligente
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Tabela: recebimentos_fontes (seed) ────────────────────────────────────────

create table if not exists recebimentos_fontes (
  codigo            text primary key,
  nome              text not null,
  tipo              text not null check (tipo in ('sociedade','dsp','cliente_direto','subeditora','outro')),
  ativo             boolean not null default true,
  configuracoes_json jsonb
);

insert into recebimentos_fontes (codigo, nome, tipo, ativo) values
  ('socinpro',      'SOCINPRO',                    'sociedade',      true),
  ('ubc',           'UBC',                          'sociedade',      true),
  ('abramus',       'ABRAMUS',                      'sociedade',      true),
  ('sicam',         'SICAM',                        'sociedade',      true),
  ('amar',          'AMAR',                         'sociedade',      true),
  ('ecad',          'ECAD',                         'sociedade',      true),
  ('backoffice_ms', 'BackOffice Music Services',    'dsp',            true),
  ('spotify',       'Spotify',                      'dsp',            true),
  ('youtube',       'YouTube Music',                'dsp',            true),
  ('deezer',        'Deezer',                       'dsp',            true),
  ('apple_music',   'Apple Music',                  'dsp',            true),
  ('amazon',        'Amazon Music',                 'dsp',            true),
  ('tiktok',        'TikTok',                       'dsp',            true),
  ('meta',          'Meta (Instagram/Facebook)',    'dsp',            true)
on conflict (codigo) do nothing;

-- ── Tabela principal: recebimentos ────────────────────────────────────────────

create table if not exists recebimentos (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,
  fonte           text not null check (fonte in (
                    'ecad_socinpro','backoffice_music_services','sync','internacional','acordo_direto')),
  categoria       text not null check (categoria in ('informativo','operacional')),
  periodo_inicio  date not null,
  periodo_fim     date not null,
  valor_bruto     numeric(15,2) not null default 0,
  valor_liquido   numeric(15,2) not null default 0,
  moeda           text not null default 'BRL',
  cotacao         numeric(10,6),
  valor_brl       numeric(15,2) not null default 0,
  status          text not null default 'importado'
                    check (status in (
                      'importado','pendente_matching','em_conciliacao',
                      'conciliado','divergente','distribuido','auditado')),
  data_importacao timestamptz not null default now(),
  editora_id      uuid,
  observacoes     text
);

-- ── Tabela: recebimentos_importacoes ─────────────────────────────────────────

create table if not exists recebimentos_importacoes (
  id               uuid primary key default gen_random_uuid(),
  recebimento_id   uuid not null references recebimentos(id) on delete cascade,
  arquivo_nome     text not null,
  arquivo_url      text,
  formato          text not null check (formato in ('pdf','xls','xlsx','csv','txt','xml')),
  total_linhas     integer not null default 0,
  total_processadas integer not null default 0,
  total_divergentes integer not null default 0,
  hash             text,
  importado_em     timestamptz not null default now(),
  importado_por    uuid references auth.users(id)
);

-- ── Tabela: recebimentos_divergencias ────────────────────────────────────────

create table if not exists recebimentos_divergencias (
  id                    uuid primary key default gen_random_uuid(),
  recebimento_id        uuid not null references recebimentos(id) on delete cascade,
  tipo                  text not null check (tipo in (
                          'obra_nao_encontrada','isrc_divergente','iswc_divergente',
                          'percentual_invalido','titular_ausente','obra_sem_contrato',
                          'obra_sem_link_valido','dsp_nao_identificada','outros')),
  descricao             text,
  dados_json            jsonb,
  status                text not null default 'aberta'
                          check (status in ('aberta','em_analise','resolvida','ignorada')),
  resolucao_observacao  text
);

-- ── Tabela: recebimentos_logs ─────────────────────────────────────────────────

create table if not exists recebimentos_logs (
  id             uuid primary key default gen_random_uuid(),
  recebimento_id uuid not null references recebimentos(id) on delete cascade,
  evento         text not null,
  mensagem       text,
  usuario        text,
  timestamp      timestamptz not null default now()
);

-- ── Tabela: recebimentos_ecad ─────────────────────────────────────────────────

create table if not exists recebimentos_ecad (
  id                uuid primary key default gen_random_uuid(),
  recebimento_id    uuid references recebimentos(id) on delete cascade,
  sociedade         text not null,
  periodo           text not null,
  obra_id           uuid,
  titulo_importado  text,
  autores_importados text,
  valor             numeric(15,2) not null default 0,
  categoria_execucao text,
  origem_execucao   text,
  tipo_execucao     text,
  status            text not null default 'importado'
                      check (status in ('importado','conciliado','divergente'))
);

-- ── Tabela: recebimentos_backoffice ──────────────────────────────────────────

create table if not exists recebimentos_backoffice (
  id                   uuid primary key default gen_random_uuid(),
  recebimento_id       uuid references recebimentos(id) on delete cascade,
  plataforma           text not null,
  periodo              text not null,
  obra_id              uuid,
  fonograma_id         uuid,
  isrc                 text,
  iswc                 text,
  quantidade_execucoes bigint not null default 0,
  valor_bruto          numeric(15,2) not null default 0,
  valor_liquido        numeric(15,2) not null default 0,
  moeda                text not null default 'USD',
  territorio           text,
  percentual_controlado numeric(5,2),
  status               text not null default 'importado'
                         check (status in ('importado','conciliado','divergente'))
);

-- ── Tabela: recebimentos_sync ─────────────────────────────────────────────────

create table if not exists recebimentos_sync (
  id               uuid primary key default gen_random_uuid(),
  recebimento_id   uuid references recebimentos(id) on delete cascade,
  autorizacao_id   uuid,
  obra_id          uuid not null,
  tipo_sync        text not null,
  licenciado       text,
  valor_bruto      numeric(15,2) not null default 0,
  valor_liquido    numeric(15,2) not null default 0,
  moeda            text not null default 'BRL',
  territorio       text not null default 'BR',
  data_recebimento date,
  status           text not null default 'importado'
                     check (status in ('importado','conciliado','divergente'))
);

-- ── Tabela: recebimentos_internacionais ──────────────────────────────────────

create table if not exists recebimentos_internacionais (
  id                  uuid primary key default gen_random_uuid(),
  recebimento_id      uuid references recebimentos(id) on delete cascade,
  origem              text not null,
  subeditora          text,
  territorio          text,
  moeda_original      text not null default 'USD',
  valor_original      numeric(15,2) not null default 0,
  cotacao             numeric(10,6),
  valor_convertido    numeric(15,2) not null default 0,
  data_cambio         date,
  obra_id             uuid,
  percentual_controlado numeric(5,2),
  status              text not null default 'importado'
                        check (status in ('importado','conciliado','divergente'))
);

-- ── Tabela: recebimentos_acordos_diretos ─────────────────────────────────────

create table if not exists recebimentos_acordos_diretos (
  id               uuid primary key default gen_random_uuid(),
  recebimento_id   uuid references recebimentos(id) on delete cascade,
  origem           text,
  parceiro         text not null,
  obra_id          uuid,
  tipo_receita     text,
  valor            numeric(15,2) not null default 0,
  moeda            text not null default 'BRL',
  territorio       text,
  data_recebimento date,
  status           text not null default 'importado'
                     check (status in ('importado','conciliado','divergente'))
);

-- ── Índices ───────────────────────────────────────────────────────────────────

create index if not exists idx_recebimentos_editora    on recebimentos(editora_id);
create index if not exists idx_recebimentos_status     on recebimentos(status);
create index if not exists idx_recebimentos_fonte      on recebimentos(fonte);
create index if not exists idx_recebimentos_categoria  on recebimentos(categoria);
create index if not exists idx_rec_diverg_recid        on recebimentos_divergencias(recebimento_id);
create index if not exists idx_rec_logs_recid          on recebimentos_logs(recebimento_id);
create index if not exists idx_rec_ecad_recid          on recebimentos_ecad(recebimento_id);
create index if not exists idx_rec_backoffice_recid    on recebimentos_backoffice(recebimento_id);
create index if not exists idx_rec_sync_recid          on recebimentos_sync(recebimento_id);
create index if not exists idx_rec_intl_recid          on recebimentos_internacionais(recebimento_id);
create index if not exists idx_rec_acordos_recid       on recebimentos_acordos_diretos(recebimento_id);

-- ── RLS multi-tenant ──────────────────────────────────────────────────────────

alter table recebimentos              enable row level security;
alter table recebimentos_importacoes  enable row level security;
alter table recebimentos_divergencias enable row level security;
alter table recebimentos_logs         enable row level security;
alter table recebimentos_ecad         enable row level security;
alter table recebimentos_backoffice   enable row level security;
alter table recebimentos_sync         enable row level security;
alter table recebimentos_internacionais enable row level security;
alter table recebimentos_acordos_diretos enable row level security;
alter table recebimentos_fontes       enable row level security;

create policy "recebimentos_select_auth" on recebimentos
  for select using (auth.role() = 'authenticated');
create policy "recebimentos_insert_auth" on recebimentos
  for insert with check (auth.role() = 'authenticated');
create policy "recebimentos_update_auth" on recebimentos
  for update using (auth.role() = 'authenticated');

create policy "recebimentos_importacoes_select" on recebimentos_importacoes
  for select using (auth.role() = 'authenticated');
create policy "recebimentos_importacoes_insert" on recebimentos_importacoes
  for insert with check (auth.role() = 'authenticated');

create policy "recebimentos_divergencias_select" on recebimentos_divergencias
  for select using (auth.role() = 'authenticated');
create policy "recebimentos_divergencias_insert" on recebimentos_divergencias
  for insert with check (auth.role() = 'authenticated');
create policy "recebimentos_divergencias_update" on recebimentos_divergencias
  for update using (auth.role() = 'authenticated');

create policy "recebimentos_logs_select" on recebimentos_logs
  for select using (auth.role() = 'authenticated');
create policy "recebimentos_logs_insert" on recebimentos_logs
  for insert with check (auth.role() = 'authenticated');

create policy "recebimentos_ecad_select" on recebimentos_ecad
  for select using (auth.role() = 'authenticated');
create policy "recebimentos_backoffice_select" on recebimentos_backoffice
  for select using (auth.role() = 'authenticated');
create policy "recebimentos_sync_select" on recebimentos_sync
  for select using (auth.role() = 'authenticated');
create policy "recebimentos_internacionais_select" on recebimentos_internacionais
  for select using (auth.role() = 'authenticated');
create policy "recebimentos_acordos_diretos_select" on recebimentos_acordos_diretos
  for select using (auth.role() = 'authenticated');
create policy "recebimentos_fontes_select" on recebimentos_fontes
  for select using (auth.role() = 'authenticated');
create policy "recebimentos_fontes_update" on recebimentos_fontes
  for update using (auth.role() = 'authenticated');
