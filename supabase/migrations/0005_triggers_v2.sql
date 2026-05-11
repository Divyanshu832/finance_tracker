-- Replace the venture auto-lending trigger with an idempotent "net delta"
-- version. After every contribution insert OR delete, the trigger recomputes
-- the final share-delta for every participant and keeps exactly one
-- venture_auto lending per (venture, participant) reflecting the current net.

create or replace function fn_venture_recompute_autolendings()
returns trigger
language plpgsql
as $$
declare
  v_venture_id uuid;
  v_total bigint;
  v_my_pct numeric(5,2);
  v_my_actual bigint;
  p record;
  p_actual bigint;
  p_target bigint;
  delta bigint;
  existing_id uuid;
  existing_settled bigint;
begin
  -- Resolve which venture this row belongs to (handles INSERT and DELETE).
  v_venture_id := coalesce(new.venture_id, old.venture_id);

  select coalesce(sum(amount), 0) into v_total
    from venture_contributions where venture_id = v_venture_id;

  select my_percentage into v_my_pct from ventures where id = v_venture_id;

  select coalesce(sum(amount), 0) into v_my_actual
    from venture_contributions where venture_id = v_venture_id and contributor_kind = 'me';

  -- For each participant, recompute target/actual/delta and reconcile lending.
  for p in (select id, name, percentage from venture_participants where venture_id = v_venture_id) loop
    select coalesce(sum(amount), 0) into p_actual
      from venture_contributions
      where venture_id = v_venture_id and participant_id = p.id;
    p_target := floor(v_total * p.percentage / 100.0)::bigint;
    delta    := p_actual - p_target;  -- >0 means they overpaid; I owe them.

    -- Find an existing venture_auto lending tied to this (venture, counterparty).
    select id into existing_id
      from lendings
      where venture_id = v_venture_id and counterparty = p.name and source = 'venture_auto'
      order by created_at asc
      limit 1;

    if delta > 0 then
      -- I owe them `delta` (they covered some of my share).
      if existing_id is null then
        insert into lendings(counterparty, direction, amount, occurred_on, venture_id, source, notes)
        values (p.name, 'borrowed', delta, current_date, v_venture_id, 'venture_auto',
                'Auto: covered your share in venture');
      else
        -- Subtract prior settlements so the outstanding remains accurate.
        select coalesce(sum(amount), 0) into existing_settled
          from lending_settlements where lending_id = existing_id;
        update lendings
          set direction = 'borrowed',
              amount    = greatest(delta + existing_settled, 1)
          where id = existing_id;
      end if;
    elsif delta < 0 then
      -- They owe me `-delta` (I covered some of their share).
      if existing_id is null then
        insert into lendings(counterparty, direction, amount, occurred_on, venture_id, source, notes)
        values (p.name, 'lent', -delta, current_date, v_venture_id, 'venture_auto',
                'Auto: you covered their share in venture');
      else
        select coalesce(sum(amount), 0) into existing_settled
          from lending_settlements where lending_id = existing_id;
        update lendings
          set direction = 'lent',
              amount    = greatest(-delta + existing_settled, 1)
          where id = existing_id;
      end if;
    else
      -- Even — drop the auto-lending (and any settlements with it) if present.
      if existing_id is not null then
        delete from lendings where id = existing_id;
      end if;
    end if;

    -- Maintain link from each contribution to this participant's auto-lending
    -- so the UI can show the "Auto-lending" pill on relevant rows.
    update venture_contributions
       set linked_lending_id = existing_id
     where venture_id = v_venture_id and participant_id = p.id;
  end loop;

  return null;
end;
$$;

drop trigger if exists trg_venture_contribution_autolink on venture_contributions;
drop trigger if exists trg_venture_recompute_autolendings on venture_contributions;

create trigger trg_venture_recompute_autolendings
  after insert or delete on venture_contributions
  for each row execute function fn_venture_recompute_autolendings();
