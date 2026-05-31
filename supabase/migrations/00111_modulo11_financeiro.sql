-- ============================================================
-- 00111_modulo11_financeiro.sql
-- Módulo 11 — Financeiro
-- Sync Mood Gestão Inteligente
-- ============================================================

create table if not exists financeiro_contas_bancarias (
  id              uuid primary key default gen_random_uuid(),
  banco           text not null,
  agencia         text,
  conta           text,
  tipo            text not null default 'corrente' check (tipo in ('corrente','poupanca','investimento')),
  titular_conta   text,
  saldo_atual     numeric(15,2) not null default 0,
  ativa           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists financeiro_pagamentos (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null unique,
  titular_id       text not null,
  prestacao_id     uuid references prestacoes_contas(id) on delete set null,
  valor            numeric(15,2) not null default 0,
  moeda            text not null default 'BRL',
  metodo           text not null check (metodo in ('pix','ted','boleto','internacional','dinheiro')),
  banco_origem     text,
  banco_destino    text,
  agencia_destino  text,
  conta_destino    text,
  pix_chave        text,
  data_programada  date,
  data_pagamento   timestamptz,
  status           text not null default 'programado' check (status in (
                     'programado','em_processamento','pago','falhou','cancelado'
                   )),
  comprovante_url  text,
  motivo_falha     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists financeiro_recebimentos (
  id                 uuid primary key default gen_random_uuid(),
  codigo             text not null unique,
  fonte_pagadora     text not null,
  recebimento_id     text,
  valor              numeric(15,2) not null default 0,
  moeda              text not null default 'BRL',
  metodo             text,
  banco_destino      text,
  data_prevista      date,
  data_recebimento   timestamptz,
  status             text not null default 'previsto' check (status in (
                       'previsto','recebido','inadimplente','cancelado'
                     )),
  observacoes        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists financeiro_fluxo_caixa (
  id                 uuid primary key default gen_random_uuid(),
  data               date not null,
  tipo               text not null check (tipo in ('entrada','saida')),
  categoria          text not null,
  descricao          text,
  valor              numeric(15,2) not null default 0,
  saldo_acumulado    numeric(15,2) not null default 0,
  conta_bancaria_id  text,
  created_at         timestamptz not null default now()
);

create table if not exists financeiro_conciliacao_bancaria (
  id                uuid primary key default gen_random_uuid(),
  conta_bancaria_id text not null,
  data_extrato      date not null,
  valor_extrato     numeric(15,2) not null default 0,
  transacao_id      text,
  status            text not null default 'pendente' check (status in (
                      'pendente','conciliado','divergente'
                    )),
  observacao        text,
  created_at        timestamptz not null default now()
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────────

create index if not exists idx_fin_pag_titular on financeiro_pagamentos(titular_id);
create index if not exists idx_fin_pag_status on financeiro_pagamentos(status);
create index if not exists idx_fin_rec_status on financeiro_recebimentos(status);
create index if not exists idx_fin_fluxo_data on financeiro_fluxo_caixa(data);
create index if not exists idx_fin_conc_conta on financeiro_conciliacao_bancaria(conta_bancaria_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table financeiro_contas_bancarias enable row level security;
alter table financeiro_pagamentos enable row level security;
alter table financeiro_recebimentos enable row level security;
alter table financeiro_fluxo_caixa enable row level security;
alter table financeiro_conciliacao_bancaria enable row level security;

create policy "master_all_fin_cb" on financeiro_contas_bancarias for all using (true);
create policy "master_all_fin_pag" on financeiro_pagamentos for all using (true);
create policy "master_all_fin_rec" on financeiro_recebimentos for all using (true);
create policy "master_all_fin_fc" on financeiro_fluxo_caixa for all using (true);
create policy "master_all_fin_conc" on financeiro_conciliacao_bancaria for all using (true);
