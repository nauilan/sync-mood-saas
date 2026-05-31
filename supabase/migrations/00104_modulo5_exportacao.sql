-- ============================================================
-- Migration 00104 — Módulo 5: Exportação / BackOffice
-- Sync Mood Gestão Inteligente
-- ============================================================

-- Extensão uuid (já deve existir, mas garantir)
create extension if not exists "pgcrypto";

-- ── Tabela principal: exportacoes ─────────────────────────────────────────────

create table if not exists exportacoes (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,
  destino         text not null check (destino in ('socinpro','backoffice_music_services','parceiro_internacional')),
  formato         text not null check (formato in ('cwr_v22','cwr_v30','xml','csv','xlsx')),
  periodo_inicio  date not null,
  periodo_fim     date not null,
  total_obras     integer not null default 0,
  total_titulares integer not null default 0,
  status          text not null default 'preparando'
                    check (status in ('preparando','gerando','enviado','processado','com_retorno','erro')),
  arquivo_url     text,
  hash            text,
  criado_por      uuid references auth.users(id),
  editora_id      uuid,
  criado_em       timestamptz not null default now(),
  enviado_em      timestamptz,
  processado_em   timestamptz
);

-- ── Tabela: exportacoes_obras ─────────────────────────────────────────────────

create table if not exists exportacoes_obras (
  exportacao_id           uuid not null references exportacoes(id) on delete cascade,
  obra_id                 uuid not null,
  status_obra             text not null default 'incluida'
                            check (status_obra in ('incluida','aceita','rejeitada','divergente')),
  codigo_externo_retornado text,
  iswc_retornado          text,
  primary key (exportacao_id, obra_id)
);

-- ── Tabela: exportacoes_logs ──────────────────────────────────────────────────

create table if not exists exportacoes_logs (
  id            uuid primary key default gen_random_uuid(),
  exportacao_id uuid not null references exportacoes(id) on delete cascade,
  evento        text not null,
  mensagem      text,
  dados_json    jsonb,
  timestamp     timestamptz not null default now()
);

-- ── Tabela: exportacoes_retorno ───────────────────────────────────────────────

create table if not exists exportacoes_retorno (
  id                  uuid primary key default gen_random_uuid(),
  exportacao_id       uuid not null references exportacoes(id) on delete cascade,
  arquivo_retorno_url text,
  total_aceitas       integer not null default 0,
  total_rejeitadas    integer not null default 0,
  total_divergencias  integer not null default 0,
  processado_em       timestamptz not null default now()
);

-- ── Índices ───────────────────────────────────────────────────────────────────

create index if not exists idx_exportacoes_editora  on exportacoes(editora_id);
create index if not exists idx_exportacoes_status   on exportacoes(status);
create index if not exists idx_exportacoes_destino  on exportacoes(destino);
create index if not exists idx_exp_logs_expid       on exportacoes_logs(exportacao_id);
create index if not exists idx_exp_obras_expid      on exportacoes_obras(exportacao_id);

-- ── RLS multi-tenant ──────────────────────────────────────────────────────────

alter table exportacoes          enable row level security;
alter table exportacoes_obras    enable row level security;
alter table exportacoes_logs     enable row level security;
alter table exportacoes_retorno  enable row level security;

-- Políticas básicas (ajustar para perfil real quando auth estiver configurado)
create policy "exportacoes_select_auth" on exportacoes
  for select using (auth.role() = 'authenticated');

create policy "exportacoes_insert_auth" on exportacoes
  for insert with check (auth.role() = 'authenticated');

create policy "exportacoes_update_auth" on exportacoes
  for update using (auth.role() = 'authenticated');

create policy "exportacoes_obras_select_auth" on exportacoes_obras
  for select using (auth.role() = 'authenticated');

create policy "exportacoes_obras_insert_auth" on exportacoes_obras
  for insert with check (auth.role() = 'authenticated');

create policy "exportacoes_logs_select_auth" on exportacoes_logs
  for select using (auth.role() = 'authenticated');

create policy "exportacoes_logs_insert_auth" on exportacoes_logs
  for insert with check (auth.role() = 'authenticated');

create policy "exportacoes_retorno_select_auth" on exportacoes_retorno
  for select using (auth.role() = 'authenticated');

create policy "exportacoes_retorno_insert_auth" on exportacoes_retorno
  for insert with check (auth.role() = 'authenticated');
