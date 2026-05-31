-- ============================================================
-- 00108_modulo8_distribuicao.sql — Modulo 8: Distribuicao
-- Sync Mood Gestao Inteligente
-- ============================================================

-- ── distribuicoes ─────────────────────────────────────────────────────────────
create table if not exists public.distribuicoes (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null,
  conciliacao_id   uuid references public.conciliacoes(id) on delete set null,
  periodo          text not null,
  valor_total      numeric(14,2) not null default 0,
  total_titulares  integer not null default 0,
  status           text not null default 'calculando' check (status in (
    'calculando','aprovacao','aprovada','executada','estornada'
  )),
  calculado_em     timestamptz not null default now(),
  aprovado_por     uuid references public.titulares(id) on delete set null,
  aprovado_em      timestamptz,
  executado_em     timestamptz,
  editora_id       uuid references public.editoras(id) on delete cascade,
  created_at       timestamptz not null default now()
);

-- ── distribuicoes_itens ───────────────────────────────────────────────────────
create table if not exists public.distribuicoes_itens (
  id                   uuid primary key default gen_random_uuid(),
  distribuicao_id      uuid not null references public.distribuicoes(id) on delete cascade,
  obra_id              uuid references public.obras(id) on delete set null,
  link_id              text,   -- obra_links id (text FK to existing mock structure)
  titular_destino_id   uuid references public.titulares(id) on delete set null,
  tipo_destino         text not null check (tipo_destino in (
    'autor','editora','administradora','subeditora','cessionario_pf',
    'cessionario_pj','investidor','herdeiro','licenciado'
  )),
  percentual_aplicado  numeric(5,2) not null,
  valor_bruto          numeric(14,2) not null,
  valor_liquido        numeric(14,2) not null,
  created_at           timestamptz not null default now()
);

-- ── distribuicoes_retencoes ───────────────────────────────────────────────────
create table if not exists public.distribuicoes_retencoes (
  id                    uuid primary key default gen_random_uuid(),
  distribuicao_item_id  uuid not null references public.distribuicoes_itens(id) on delete cascade,
  tipo                  text not null check (tipo in (
    'irpf','iss','comissao','taxa_administrativa',
    'imposto_internacional','retencao_contratual'
  )),
  percentual            numeric(5,2) not null,
  valor                 numeric(14,2) not null,
  created_at            timestamptz not null default now()
);

-- ── distribuicoes_recoupment ──────────────────────────────────────────────────
create table if not exists public.distribuicoes_recoupment (
  id                     uuid primary key default gen_random_uuid(),
  distribuicao_item_id   uuid not null references public.distribuicoes_itens(id) on delete cascade,
  contrato_recoupment_id text not null,   -- ref to contrato with recoupment clause
  valor_abatido          numeric(14,2) not null,
  created_at             timestamptz not null default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.distribuicoes            enable row level security;
alter table public.distribuicoes_itens      enable row level security;
alter table public.distribuicoes_retencoes  enable row level security;
alter table public.distribuicoes_recoupment enable row level security;

create policy "distribuicoes_all"            on public.distribuicoes            for all using (true);
create policy "distribuicoes_itens_all"      on public.distribuicoes_itens      for all using (true);
create policy "distribuicoes_retencoes_all"  on public.distribuicoes_retencoes  for all using (true);
create policy "distribuicoes_recoupment_all" on public.distribuicoes_recoupment for all using (true);
