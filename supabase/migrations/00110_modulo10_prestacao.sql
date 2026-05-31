-- ============================================================
-- 00110_modulo10_prestacao.sql
-- Módulo 10 — Prestação de Contas
-- Sync Mood Gestão Inteligente
-- ============================================================

create table if not exists prestacoes_contas (
  id                   uuid primary key default gen_random_uuid(),
  codigo               text not null unique,
  titular_id           text not null,
  periodo_inicio       date not null,
  periodo_fim          date not null,
  valor_bruto          numeric(15,2) not null default 0,
  retencoes_total      numeric(15,2) not null default 0,
  recoupment_aplicado  numeric(15,2) not null default 0,
  valor_liquido        numeric(15,2) not null default 0,
  status               text not null default 'gerada' check (status in (
                         'gerada','enviada','aprovada','contestada','paga'
                       )),
  data_geracao         timestamptz not null default now(),
  data_envio           timestamptz,
  canal_envio          text check (canal_envio in ('email','whatsapp','portal','multiplo')),
  data_aprovacao       timestamptz,
  pdf_url              text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists prestacoes_contas_itens (
  id                  uuid primary key default gen_random_uuid(),
  prestacao_id        uuid not null references prestacoes_contas(id) on delete cascade,
  obra_id             text not null,
  recebimento_id      text,
  valor_bruto         numeric(15,2) not null default 0,
  percentual_aplicado numeric(7,4) not null default 0,
  valor_liquido       numeric(15,2) not null default 0,
  descricao           text,
  created_at          timestamptz not null default now()
);

create table if not exists prestacoes_contas_envios (
  id            uuid primary key default gen_random_uuid(),
  prestacao_id  uuid not null references prestacoes_contas(id) on delete cascade,
  canal         text not null check (canal in ('email','whatsapp','portal')),
  destino       text not null,
  status        text not null default 'enfileirado' check (status in (
                  'enfileirado','enviado','entregue','visualizado','erro'
                )),
  tentativa     int not null default 1,
  log_json      jsonb,
  enviado_em    timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists prestacoes_contas_contestacoes (
  id            uuid primary key default gen_random_uuid(),
  prestacao_id  uuid not null references prestacoes_contas(id) on delete cascade,
  titular_id    text not null,
  motivo        text not null,
  status        text not null default 'aberta' check (status in (
                  'aberta','em_analise','procedente','improcedente','resolvida'
                )),
  descricao     text,
  resposta      text,
  criada_em     timestamptz not null default now(),
  resolvida_em  timestamptz,
  created_at    timestamptz not null default now()
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────────

create index if not exists idx_pc_titular on prestacoes_contas(titular_id);
create index if not exists idx_pc_status on prestacoes_contas(status);
create index if not exists idx_pc_itens_prestacao on prestacoes_contas_itens(prestacao_id);
create index if not exists idx_pc_envios_prestacao on prestacoes_contas_envios(prestacao_id);
create index if not exists idx_pc_cont_prestacao on prestacoes_contas_contestacoes(prestacao_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table prestacoes_contas enable row level security;
alter table prestacoes_contas_itens enable row level security;
alter table prestacoes_contas_envios enable row level security;
alter table prestacoes_contas_contestacoes enable row level security;

create policy "master_all_pc" on prestacoes_contas for all using (true);
create policy "master_all_pc_itens" on prestacoes_contas_itens for all using (true);
create policy "master_all_pc_envios" on prestacoes_contas_envios for all using (true);
create policy "master_all_pc_cont" on prestacoes_contas_contestacoes for all using (true);
