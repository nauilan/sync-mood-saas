-- ============================================================
-- 00109_modulo9_conta_corrente.sql
-- Módulo 9 — Conta Corrente (Obra + Titular)
-- Sync Mood Gestão Inteligente
-- ============================================================

-- ── CONTA CORRENTE DE OBRAS ──────────────────────────────────────────────────

create table if not exists contas_correntes_obras (
  id                        uuid primary key default gen_random_uuid(),
  obra_id                   text not null unique,
  saldo_atual               numeric(15,2) not null default 0,
  saldo_bloqueado           numeric(15,2) not null default 0,
  saldo_distribuido         numeric(15,2) not null default 0,
  saldo_pendente            numeric(15,2) not null default 0,
  moeda                     text not null default 'BRL',
  status                    text not null default 'ativa' check (status in ('ativa','bloqueada')),
  data_ultima_movimentacao  timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table if not exists contas_correntes_obras_movimentos (
  id                  uuid primary key default gen_random_uuid(),
  conta_obra_id       uuid not null references contas_correntes_obras(id) on delete cascade,
  tipo_movimento      text not null check (tipo_movimento in (
                        'entrada','distribuicao','recoupment','retencao',
                        'taxa_administrativa','estorno','ajuste','bloqueio','liberacao'
                      )),
  origem_recebimento  text check (origem_recebimento in (
                        'backoffice','sync','internacional','acordo_direto','tv','licenciamento'
                      )),
  recebimento_id      text,
  valor_bruto         numeric(15,2) not null default 0,
  valor_liquido       numeric(15,2) not null default 0,
  moeda               text not null default 'BRL',
  data_movimento      timestamptz not null default now(),
  descricao           text,
  usuario             text,
  status              text not null default 'confirmado',
  created_at          timestamptz not null default now()
);

create table if not exists contas_correntes_obras_distribuicoes (
  id                         uuid primary key default gen_random_uuid(),
  conta_obra_movimento_id    uuid not null references contas_correntes_obras_movimentos(id) on delete cascade,
  obra_link_id               text,
  titular_destino_id         text,
  percentual_aplicado        numeric(7,4) not null default 0,
  valor_destinado            numeric(15,2) not null default 0,
  tipo_destino               text not null check (tipo_destino in (
                               'autor','editora','administradora','cessionario_pf',
                               'cessionario_pj','investidor','herdeiro'
                             )),
  status                     text not null default 'pendente',
  created_at                 timestamptz not null default now()
);

-- ── CONTA CORRENTE DE TITULARES ──────────────────────────────────────────────

create table if not exists contas_correntes_titulares (
  id                        uuid primary key default gen_random_uuid(),
  titular_id                text not null unique,
  saldo_atual               numeric(15,2) not null default 0,
  saldo_bloqueado           numeric(15,2) not null default 0,
  saldo_liberado            numeric(15,2) not null default 0,
  saldo_pago                numeric(15,2) not null default 0,
  moeda                     text not null default 'BRL',
  status                    text not null default 'ativa' check (status in ('ativa','bloqueada')),
  data_ultima_movimentacao  timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table if not exists contas_correntes_titulares_movimentos (
  id                      uuid primary key default gen_random_uuid(),
  conta_titular_id        uuid not null references contas_correntes_titulares(id) on delete cascade,
  origem_obra_id          text,
  origem_recebimento_id   text,
  tipo_movimento          text not null check (tipo_movimento in (
                            'credito','debito','retencao','recoupment',
                            'pagamento','estorno','bloqueio','ajuste'
                          )),
  valor_bruto             numeric(15,2) not null default 0,
  valor_liquido           numeric(15,2) not null default 0,
  retencoes_total         numeric(15,2) not null default 0,
  moeda                   text not null default 'BRL',
  data_movimento          timestamptz not null default now(),
  descricao               text,
  status                  text not null default 'confirmado',
  created_at              timestamptz not null default now()
);

create table if not exists contas_correntes_titulares_retencoes (
  id              uuid primary key default gen_random_uuid(),
  movimento_id    uuid not null references contas_correntes_titulares_movimentos(id) on delete cascade,
  tipo_retencao   text not null check (tipo_retencao in (
                    'irpf','iss','comissao','taxa_administrativa',
                    'imposto_internacional','retencao_contratual'
                  )),
  percentual      numeric(7,4) not null default 0,
  valor           numeric(15,2) not null default 0,
  observacoes     text,
  created_at      timestamptz not null default now()
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────────

create index if not exists idx_cco_obra_id on contas_correntes_obras(obra_id);
create index if not exists idx_cco_mov_conta on contas_correntes_obras_movimentos(conta_obra_id);
create index if not exists idx_cco_mov_data on contas_correntes_obras_movimentos(data_movimento desc);
create index if not exists idx_cct_titular_id on contas_correntes_titulares(titular_id);
create index if not exists idx_cct_mov_conta on contas_correntes_titulares_movimentos(conta_titular_id);
create index if not exists idx_cct_mov_data on contas_correntes_titulares_movimentos(data_movimento desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table contas_correntes_obras enable row level security;
alter table contas_correntes_obras_movimentos enable row level security;
alter table contas_correntes_obras_distribuicoes enable row level security;
alter table contas_correntes_titulares enable row level security;
alter table contas_correntes_titulares_movimentos enable row level security;
alter table contas_correntes_titulares_retencoes enable row level security;

-- Master vê tudo no tenant
create policy "master_select_cco" on contas_correntes_obras
  for select using (true);
create policy "master_all_cco_mov" on contas_correntes_obras_movimentos
  for all using (true);
create policy "master_all_cco_dist" on contas_correntes_obras_distribuicoes
  for all using (true);
create policy "master_select_cct" on contas_correntes_titulares
  for select using (true);
create policy "master_all_cct_mov" on contas_correntes_titulares_movimentos
  for all using (true);
create policy "master_all_cct_ret" on contas_correntes_titulares_retencoes
  for all using (true);
