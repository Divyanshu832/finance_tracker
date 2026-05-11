-- Running cash balance view.
create or replace view v_balance as
select
    (select coalesce(sum(amount), 0) from incomes)
  - (select coalesce(sum(amount), 0) from expenses)
  - (select coalesce(sum(amount), 0) from bill_payments)
  - (select coalesce(sum(amount), 0) from venture_contributions where contributor_kind = 'me')
  - (select coalesce(sum(l.amount), 0)
       from lendings l where l.direction = 'lent' and l.source = 'manual')
  + (select coalesce(sum(s.amount), 0)
       from lending_settlements s
       join lendings l on l.id = s.lending_id
       where l.direction = 'lent')
  + (select coalesce(sum(l.amount), 0)
       from lendings l where l.direction = 'borrowed' and l.source = 'manual')
  - (select coalesce(sum(s.amount), 0)
       from lending_settlements s
       join lendings l on l.id = s.lending_id
       where l.direction = 'borrowed')
  - (select coalesce(sum(amount), 0) from investments)
  as balance_paise;

-- Note: auto-created venture lendings (source='venture_auto') are intentionally
-- excluded from the cash balance — the cash already moved when the contribution
-- was recorded. They show up only as receivables/payables.
