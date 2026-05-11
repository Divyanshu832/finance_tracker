-- Emergency fund: target stored as app setting, contribution flag on investments.

create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value)
values ('emergency_fund_target_paise', '0')
on conflict (key) do nothing;

alter table investments
  add column if not exists counts_toward_emergency boolean not null default false;

create index if not exists idx_investments_emergency
  on investments (counts_toward_emergency) where counts_toward_emergency;
