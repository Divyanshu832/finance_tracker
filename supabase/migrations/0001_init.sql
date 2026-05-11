-- Munim init schema. All money in paise (INR x 100) as bigint.

create extension if not exists pgcrypto;

create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  amount bigint not null check (amount > 0),
  source text not null,
  received_on date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default 'zinc',
  icon text not null default 'circle',
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount_inr bigint not null check (amount_inr > 0),
  native_currency text not null default 'INR',
  billing_day smallint not null check (billing_day between 1 and 31),
  category_id uuid references expense_categories(id) on delete set null,
  active boolean not null default true,
  last_charged_on date,
  icon text default 'repeat',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  amount bigint not null check (amount > 0),
  category_id uuid references expense_categories(id) on delete set null,
  description text not null default '',
  occurred_on date not null,
  subscription_id uuid references subscriptions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('emi','credit_card','loan','other')),
  amount bigint not null check (amount > 0),
  due_day smallint not null check (due_day between 1 and 31),
  start_on date not null,
  end_on date,
  autopay boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists bill_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  amount bigint not null check (amount > 0),
  paid_on date not null,
  cycle_month date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists ventures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  my_percentage numeric(5,2) not null check (my_percentage >= 0 and my_percentage <= 100),
  status text not null default 'active' check (status in ('active','closed')),
  started_on date not null,
  closed_on date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists venture_participants (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references ventures(id) on delete cascade,
  name text not null,
  percentage numeric(5,2) not null check (percentage >= 0 and percentage <= 100),
  created_at timestamptz not null default now()
);

create table if not exists lendings (
  id uuid primary key default gen_random_uuid(),
  counterparty text not null,
  direction text not null check (direction in ('lent','borrowed')),
  amount bigint not null check (amount > 0),
  occurred_on date not null,
  venture_id uuid references ventures(id) on delete set null,
  source text not null default 'manual' check (source in ('manual','venture_auto')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists lending_settlements (
  id uuid primary key default gen_random_uuid(),
  lending_id uuid not null references lendings(id) on delete cascade,
  amount bigint not null check (amount > 0),
  settled_on date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists venture_contributions (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references ventures(id) on delete cascade,
  contributor_kind text not null check (contributor_kind in ('me','participant')),
  participant_id uuid references venture_participants(id) on delete set null,
  amount bigint not null check (amount > 0),
  contributed_on date not null,
  linked_lending_id uuid references lendings(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint participant_required check (
    (contributor_kind = 'me' and participant_id is null) or
    (contributor_kind = 'participant' and participant_id is not null)
  )
);

create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('mf','stock','fd','rd','gold','crypto','other')),
  platform text,
  amount bigint not null check (amount > 0),
  invested_on date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_occurred_on on expenses(occurred_on desc);
create index if not exists idx_expenses_category on expenses(category_id);
create index if not exists idx_bill_payments_bill on bill_payments(bill_id);
create index if not exists idx_bill_payments_cycle on bill_payments(cycle_month);
create index if not exists idx_lendings_direction on lendings(direction);
create index if not exists idx_lendings_venture on lendings(venture_id);
create index if not exists idx_settlements_lending on lending_settlements(lending_id);
create index if not exists idx_contributions_venture on venture_contributions(venture_id);
create index if not exists idx_contributions_participant on venture_contributions(participant_id);
create index if not exists idx_investments_invested_on on investments(invested_on desc);
create index if not exists idx_incomes_received_on on incomes(received_on desc);
