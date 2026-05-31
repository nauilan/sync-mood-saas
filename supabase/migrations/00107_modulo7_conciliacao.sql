-- ============================================================
-- 00107_modulo7_conciliacao.sql — Modulo 7: Conciliacao
-- Sync Mood Gestao Inteligente
-- ============================================================

-- ── conciliacoes ──────────────────────────────────────────────────────────────
create table if not exists public.conciliacoes (
  id               uuid primary key default gen_random_uuid(),
  recebimento_id   text not null,   -- polymorphic: rec-XXX or tv-recv-XXX
  periodo          text not null,
  status           text not null default 'pendente' check (status in (
    'pendente','em_andamento','concluida','com_divergencia'
  )),
  iniciada_em      timestamptz,
  finalizada_em    timestamptz,
  total_itens      integer not null default 0,
  total_validados  integer not null default 0,
  total_divergentes integer not null default 0,
  editora_id       uuid references public.editoras(id) on delete cascade,
  created_at       timestamptz not null default now()
);

-- ── conciliacoes_itens ────────────────────────────────────────────────────────
create table if not exists public.conciliacoes_itens (
  id                   uuid primary key default gen_random_uuid(),
  conciliacao_id       uuid not null references public.conciliacoes(id) on delete cascade,
  obra_id              uuid references public.obras(id) on delete set null,
  titular_id           uuid references public.titulares(id) on delete set null,
  valor_bruto          numeric(14,2) not null,
  percentual_aplicado  numeric(5,2) not null,
  valor_calculado      numeric(14,2) not null,
  status               text not null default 'validado' check (status in ('validado','divergente','ajustado')),
  observacao           text,
  created_at           timestamptz not null default now()
);

-- ── conciliacoes_divergencias ─────────────────────────────────────────────────
create table if not exists public.conciliacoes_divergencias (
  id                    uuid primary key default gen_random_uuid(),
  conciliacao_item_id   uuid not null references public.conciliacoes_itens(id) on delete cascade,
  tipo                  text not null check (tipo in (
    'obra_nao_localizada','titular_nao_localizado','contrato_invalido',
    'percentual_invalido','territorio_invalido','direito_nao_cedido',
    'recebedor_incorreto'
  )),
  status                text not null default 'aberta' check (status in ('aberta','em_analise','resolvida','ignorada')),
  resolucao_observacao  text,
  created_at            timestamptz not null default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.conciliacoes            enable row level security;
alter table public.conciliacoes_itens      enable row level security;
alter table public.conciliacoes_divergencias enable row level security;

create policy "conciliacoes_all"             on public.conciliacoes            for all using (true);
create policy "conciliacoes_itens_all"       on public.conciliacoes_itens      for all using (true);
create policy "conciliacoes_divergencias_all" on public.conciliacoes_divergencias for all using (true);
