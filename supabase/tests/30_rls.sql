-- Clients only read: own rows via my_contributions; reviewers within scope; no client writes anywhere.
select pg_temp.claims('00000000-0000-4000-8000-0000000000c3');
set local role authenticated;
do $$
declare n int;
begin
  select count(*) into n from public.contributions;
  assert n = 0, 'member reads contributions table directly: ' || n;
  -- m3 owns exactly 6 rows at this point (one accepted, five submitted in 20_public_view).
  select count(*) into n from public.my_contributions;
  assert n = 6, 'my_contributions should hold exactly the caller''s 6 rows, got ' || n;
  assert not exists (select 1 from pg_attribute where attrelid = 'public.my_contributions'::regclass and not attisdropped
                     and attname in ('reviewer_id', 'second_reviewer_id', 'claimed_by', 'user_id')), 'reviewer ids exposed';
  -- Own-row policies on the other tables: m3 has none of these yet, and must not see anyone else's.
  select count(*) into n from public.notifications;
  assert n = 0, 'member sees others'' notifications';
  select count(*) into n from public.contribution_reports;
  assert n = 0, 'member sees reports';
  select count(*) into n from public.reviewer_applications;
  assert n = 0, 'member sees applications';
  select count(*) into n from public.profile_review_scopes;
  assert n = 0, 'member sees reviewer scopes';
  assert exists (select 1 from public.app_settings where key = 'publishing_paused'), 'settings unreadable';
  begin
    perform updated_by from public.app_settings;
    assert false, 'member reads who changed settings';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.contribution_credits;
    assert false, 'member reads the credits view directly';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.contributions (user_id, type, scope, payload, locale) values (auth.uid(), 'general_feedback', 'feedback', '{"text":"x"}', 'en');
    assert false, 'member inserted directly';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.my_contributions set status = 'accepted';
    assert false, 'member updated through my_contributions';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    assert false, 'member changed own role';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set avatar_url = 'https://lh3.googleusercontent.com/fake' where id = auth.uid();
    assert false, 'member changed own avatar';
  exception when insufficient_privilege then null;
  end;
  update public.profiles set display_name = 'Juma' where id = auth.uid();
  assert found, 'member cannot update display name';
  begin
    perform public.submit_contribution(auth.uid(), '{}');
    assert false, 'member called submit_contribution directly';
  exception when insufficient_privilege then null;
  end;
  select count(*) into n from public.contribution_events;
  assert n = 0, 'member reads the audit log';
  begin
    insert into public.contribution_agreements (contribution_id, user_id) values (gen_random_uuid(), auth.uid());
    assert false, 'member inserted an agreement directly';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Reviewers see only their scopes.
select pg_temp.claims('00000000-0000-4000-8000-0000000000b2');
set local role authenticated;
do $$
begin
  assert not exists (select 1 from public.contributions where scope = 'plants'), 'dictionary reviewer sees plants';
  assert exists (select 1 from public.contributions where scope = 'dictionary'), 'dictionary reviewer sees nothing in scope';
end $$;
reset role;

select pg_temp.claims('00000000-0000-4000-8000-0000000000b1');
set local role authenticated;
do $$
begin
  assert exists (select 1 from public.contributions where scope = 'plants'), 'plants reviewer sees nothing';
  assert not exists (select 1 from public.contributions where scope in ('dictionary', 'feedback')), 'plants reviewer sees other scopes';
end $$;
reset role;

-- Anonymous visitors read nothing private.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
declare n int;
begin
  select count(*) into n from public.contributions;
  assert n = 0, 'anon reads contributions';
  begin
    select count(*) into n from public.my_contributions;
    assert false, 'anon reads my_contributions';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.contribution_credits;
    assert false, 'anon reads the credits view directly';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.fold_claim('wrong-token');
    assert false, 'fold_claim accepted a bad token';
  exception when raise_exception then null;
  end;
end $$;
reset role;

-- Admins read the audit log and every scope.
select pg_temp.claims('00000000-0000-4000-8000-0000000000a1');
set local role authenticated;
do $$
begin
  assert exists (select 1 from public.contribution_events), 'admin cannot read the log';
  assert exists (select 1 from public.contributions where scope = 'feedback'), 'admin cannot read feedback';
  assert exists (select 1 from public.profile_review_scopes), 'admin cannot read scopes';
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

-- The API reads the public view with the service role.
set local role service_role;
do $$
begin
  perform count(*) from public.public_contributions;
end $$;
reset role;
