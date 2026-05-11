-- Emergency fund becomes a standalone tracker (target + saved), decoupled from investments.

insert into app_settings (key, value)
values ('emergency_fund_saved_paise', '0')
on conflict (key) do nothing;

drop index if exists idx_investments_emergency;

alter table investments drop column if exists counts_toward_emergency;
