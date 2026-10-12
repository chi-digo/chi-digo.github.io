-- Append-only log, last-admin guard, avatar host, erasure, test cleanup.
set local role service_role;
do $$
begin
  begin
    update public.contribution_events set action = 'tampered';
    assert false, 'service role updated the log';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.contribution_events;
    assert false, 'service role deleted from the log';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

do $$
declare
  m2 uuid := '00000000-0000-4000-8000-0000000000c2';
  m3 uuid := '00000000-0000-4000-8000-0000000000c3';
  r jsonb;
begin
  begin
    update public.profiles set role = 'member' where role = 'admin';
    assert false, 'removed every admin';
  exception when raise_exception then null;
  end;
  begin
    update public.profiles set avatar_url = 'https://evil.example/x.png' where id = m2;
    assert false, 'non-Google avatar accepted';
  exception when check_violation then null;
  end;

  -- Erasure keeps content, removes the person.
  r := public.erase_contributor(m3);
  assert not exists (select 1 from public.contributions where user_id = m3), 'contributions still linked';
  assert exists (select 1 from public.contributions where id = (select id from t_ids where name = 'accepted_live')), 'accepted content lost';
  assert not exists (select 1 from public.contribution_events where actor_id = m3), 'events still name the person';

  -- Test data cleanup.
  r := public.cleanup_test_data();
  assert not exists (select 1 from public.contributions where is_test), 'test rows left';
end $$;
