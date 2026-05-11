-- Auto-link venture contributions to lendings when someone over/underpays their share.

create or replace function fn_venture_contribution_autolink()
returns trigger
language plpgsql
as $$
declare
  v_total_invested bigint;
  v_my_pct numeric(5,2);
  v_their_pct numeric(5,2);
  v_their_total bigint;
  v_my_total bigint;
  v_target bigint;
  v_excess bigint;
  v_participant_name text;
  v_lending_id uuid;
begin
  -- After insert: recompute totals AFTER this row exists
  select coalesce(sum(amount), 0) into v_total_invested
    from venture_contributions where venture_id = new.venture_id;

  select my_percentage into v_my_pct from ventures where id = new.venture_id;

  if new.contributor_kind = 'participant' then
    -- Did this participant overpay their share so far?
    select percentage, name into v_their_pct, v_participant_name
      from venture_participants where id = new.participant_id;

    select coalesce(sum(amount), 0) into v_their_total
      from venture_contributions
      where venture_id = new.venture_id and participant_id = new.participant_id;

    v_target := floor(v_total_invested * v_their_pct / 100.0)::bigint;
    v_excess := v_their_total - v_target;

    if v_excess > 0 then
      -- They paid more than their share => you borrowed from them.
      insert into lendings (counterparty, direction, amount, occurred_on, venture_id, source, notes)
      values (v_participant_name, 'borrowed', v_excess, new.contributed_on, new.venture_id, 'venture_auto',
              'Auto: covered your share in venture')
      returning id into v_lending_id;

      update venture_contributions set linked_lending_id = v_lending_id where id = new.id;
    end if;

  elsif new.contributor_kind = 'me' then
    select coalesce(sum(amount), 0) into v_my_total
      from venture_contributions
      where venture_id = new.venture_id and contributor_kind = 'me';

    v_target := floor(v_total_invested * v_my_pct / 100.0)::bigint;
    v_excess := v_my_total - v_target;

    if v_excess > 0 then
      -- You paid more than your share => most-behind participant owes you.
      -- Pick the participant with biggest negative delta (target - actual).
      with parts as (
        select p.id, p.name, p.percentage,
               floor(v_total_invested * p.percentage / 100.0)::bigint as p_target,
               coalesce(
                 (select sum(amount) from venture_contributions vc
                  where vc.venture_id = new.venture_id and vc.participant_id = p.id),
                 0
               ) as p_actual
        from venture_participants p
        where p.venture_id = new.venture_id
      )
      select id, name into v_lending_id, v_participant_name
        from parts
        order by (p_target - p_actual) desc
        limit 1;

      if v_participant_name is not null then
        insert into lendings (counterparty, direction, amount, occurred_on, venture_id, source, notes)
        values (v_participant_name, 'lent', v_excess, new.contributed_on, new.venture_id, 'venture_auto',
                'Auto: you covered their share in venture')
        returning id into v_lending_id;

        update venture_contributions set linked_lending_id = v_lending_id where id = new.id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_venture_contribution_autolink on venture_contributions;
create trigger trg_venture_contribution_autolink
  after insert on venture_contributions
  for each row execute function fn_venture_contribution_autolink();
