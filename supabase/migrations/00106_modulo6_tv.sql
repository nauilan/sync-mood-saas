-- ============================================================
-- 00106_modulo6_tv.sql — Modulo 6 TV: Matching + Cobranca Audiovisual
-- Sync Mood Gestao Inteligente
-- ============================================================

-- ── tv_importacoes ────────────────────────────────────────────────────────────
create table if not exists public.tv_importacoes (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null,
  emissora         text not null,
  formato_arquivo  text not null check (formato_arquivo in ('xls','xlsx','csv','pdf','cue_sheet')),
  periodo_inicio   date not null,
  periodo_fim      date not null,
  total_linhas     integer not null default 0,
  total_matched    integer not null default 0,
  total_divergentes integer not null default 0,
  hash             text,
  importado_em     timestamptz not null default now(),
  editora_id       uuid references public.editoras(id) on delete cascade,
  created_at       timestamptz not null default now()
);

-- ── tv_execucoes ──────────────────────────────────────────────────────────────
create table if not exists public.tv_execucoes (
  id                  uuid primary key default gen_random_uuid(),
  importacao_id       uuid not null references public.tv_importacoes(id) on delete cascade,
  titulo_importado    text not null,
  interprete_importado text,
  autor_importado     text,
  programa            text not null,
  capitulo            text,
  data_exibicao       date not null,
  hora_exibicao       time,
  duracao_seg         integer not null default 0,
  tipo_uso            text not null check (tipo_uso in (
    'abertura','encerramento','tema','fundo','performance','trailer',
    'teaser','chamada','vinheta','publicidade','incidental'
  )),
  emissora            text not null,
  canal               text not null,
  plataforma          text,
  territorio          text not null default 'BR',
  created_at          timestamptz not null default now()
);

-- ── tv_matching ───────────────────────────────────────────────────────────────
create table if not exists public.tv_matching (
  id            uuid primary key default gen_random_uuid(),
  execucao_id   uuid not null references public.tv_execucoes(id) on delete cascade,
  obra_id       uuid references public.obras(id) on delete set null,
  score         numeric(5,2) not null default 0,
  criterio      text not null check (criterio in ('titulo_autor','titulo_interprete','iswc','manual')),
  status        text not null check (status in ('auto_match','sugerido','confirmado','divergente','sem_match')),
  created_at    timestamptz not null default now()
);

-- ── tv_divergencias ───────────────────────────────────────────────────────────
create table if not exists public.tv_divergencias (
  id            uuid primary key default gen_random_uuid(),
  execucao_id   uuid not null references public.tv_execucoes(id) on delete cascade,
  tipo          text not null check (tipo in (
    'obra_nao_encontrada','similaridade_baixa','multiplas_obras','autor_divergente',
    'titulo_diferente','editora_ausente','percentual_nao_identificado',
    'obra_sem_contrato','obra_sem_controle_valido','tipo_uso_indefinido'
  )),
  descricao     text,
  dados_json    jsonb,
  status        text not null default 'aberta' check (status in ('aberta','em_analise','resolvida','ignorada')),
  created_at    timestamptz not null default now()
);

-- ── tv_precificacao ───────────────────────────────────────────────────────────
create table if not exists public.tv_precificacao (
  id            uuid primary key default gen_random_uuid(),
  emissora      text not null,
  canal         text not null,
  plataforma    text,
  tipo_uso      text not null check (tipo_uso in (
    'abertura','encerramento','tema','fundo','performance','trailer',
    'teaser','chamada','vinheta','publicidade','incidental'
  )),
  ano           integer not null,
  territorio    text not null default 'BR',
  nacional      boolean not null default true,
  duracao_min   integer not null default 0,
  duracao_max   integer not null default 99999,
  valor_base    numeric(14,2) not null,
  moeda         text not null default 'BRL',
  created_at    timestamptz not null default now()
);

-- ── tv_autorizacoes ───────────────────────────────────────────────────────────
create table if not exists public.tv_autorizacoes (
  id                                    uuid primary key default gen_random_uuid(),
  codigo                                text not null,
  execucao_id                           uuid not null references public.tv_execucoes(id) on delete cascade,
  obra_id                               uuid references public.obras(id) on delete set null,
  percentual_controlado                 numeric(5,2) not null default 0,
  percentual_autorizado                 numeric(5,2) not null default 0,
  valor_calculado                       numeric(14,2) not null default 0,
  valor_negociado                       numeric(14,2),
  territorio                            text not null default 'BR',
  prazo_inicio                          date not null,
  prazo_fim                             date not null,
  clausula_percentual_controlado_text   text not null default 'A presente autorizacao cobre exclusivamente o percentual sob controle editorial da autorizante.',
  status                                text not null default 'calculada' check (status in ('calculada','faturada','paga','cancelada')),
  pdf_url                               text,
  created_at                            timestamptz not null default now()
);

-- ── tv_recebimentos ───────────────────────────────────────────────────────────
create table if not exists public.tv_recebimentos (
  id               uuid primary key default gen_random_uuid(),
  autorizacao_id   uuid not null references public.tv_autorizacoes(id) on delete cascade,
  valor_bruto      numeric(14,2) not null,
  valor_liquido    numeric(14,2) not null,
  moeda            text not null default 'BRL',
  data_recebimento date not null,
  status           text not null default 'pendente' check (status in ('pendente','recebido','conciliado','estornado')),
  created_at       timestamptz not null default now()
);

-- ── tv_distribuicoes ──────────────────────────────────────────────────────────
create table if not exists public.tv_distribuicoes (
  id              uuid primary key default gen_random_uuid(),
  recebimento_id  uuid not null references public.tv_recebimentos(id) on delete cascade,
  status          text not null default 'pendente' check (status in ('pendente','processando','concluida','erro')),
  processado_em   timestamptz,
  created_at      timestamptz not null default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.tv_importacoes   enable row level security;
alter table public.tv_execucoes     enable row level security;
alter table public.tv_matching      enable row level security;
alter table public.tv_divergencias  enable row level security;
alter table public.tv_precificacao  enable row level security;
alter table public.tv_autorizacoes  enable row level security;
alter table public.tv_recebimentos  enable row level security;
alter table public.tv_distribuicoes enable row level security;

-- Policies: master/admin full access (simplified for demo)
create policy "tv_importacoes_all" on public.tv_importacoes for all using (true);
create policy "tv_execucoes_all"   on public.tv_execucoes   for all using (true);
create policy "tv_matching_all"    on public.tv_matching    for all using (true);
create policy "tv_divergencias_all" on public.tv_divergencias for all using (true);
create policy "tv_precificacao_all" on public.tv_precificacao for all using (true);
create policy "tv_autorizacoes_all" on public.tv_autorizacoes for all using (true);
create policy "tv_recebimentos_all" on public.tv_recebimentos for all using (true);
create policy "tv_distribuicoes_all" on public.tv_distribuicoes for all using (true);
