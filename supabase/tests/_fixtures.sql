-- Throwaway users and helpers for the database tests. Everything here is rolled back.
-- Users: a1 admin · r1 reviewer (plants) · r2 reviewer (dictionary) · m1 new member (today)
--        m2 member (30 days old) · m3 member (30 days old) · b1 blocked · t1 flow-test account

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'dbtest-a1@chidigo.invalid', '{}', '{"full_name":"Asha Admin","avatar_url":"https://lh3.googleusercontent.com/a/x"}', now() - interval '60 days', now()),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'dbtest-r1@chidigo.invalid', '{}', '{"full_name":"Rama Plants"}', now() - interval '60 days', now()),
  ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'dbtest-r2@chidigo.invalid', '{}', '{"full_name":"Riziki Words"}', now() - interval '60 days', now()),
  ('00000000-0000-4000-8000-0000000000c1', 'authenticated', 'authenticated', 'dbtest-m1@chidigo.invalid', '{}', '{"full_name":"Mwanaisha New"}', now(), now()),
  ('00000000-0000-4000-8000-0000000000c2', 'authenticated', 'authenticated', 'dbtest-m2@chidigo.invalid', '{}', '{"full_name":"Mbaraka Old","picture":"https://evil.example/p.png"}', now() - interval '30 days', now()),
  ('00000000-0000-4000-8000-0000000000c3', 'authenticated', 'authenticated', 'dbtest-m3@chidigo.invalid', '{}', '{"full_name":"Mwanajuma Old"}', now() - interval '30 days', now()),
  ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', 'dbtest-b1@chidigo.invalid', '{}', '{"full_name":"Blocked Person"}', now() - interval '30 days', now()),
  ('00000000-0000-4000-8000-0000000000e1', 'authenticated', 'authenticated', 'dbtest-t1@chidigo.invalid', '{"test":true}', '{"full_name":"Flow Test"}', now() - interval '30 days', now());

update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000000a1';
update public.profiles set role = 'reviewer' where id in ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000b2');
insert into public.profile_review_scopes (user_id, scope) values
  ('00000000-0000-4000-8000-0000000000b1', 'plants'),
  ('00000000-0000-4000-8000-0000000000b2', 'dictionary');
update public.profiles set blocked_at = now() where id = '00000000-0000-4000-8000-0000000000d1';

-- Named ids shared between test files (postgres only).
create temp table t_ids (name text primary key, id uuid not null);

-- Submit through the real function; raise on any error code.
create function pg_temp.submit(uid uuid, typ text, scp text, ttype text, tid text, payload jsonb, extra jsonb default '{}')
returns uuid language plpgsql as $$
declare r jsonb;
begin
  r := public.submit_contribution(uid, jsonb_build_object(
    'type', typ, 'scope', scp, 'target_type', ttype, 'target_id', tid, 'payload', payload,
    'locale', 'en', 'region', 'kinondo_diani', 'confidence', 'native') || extra);
  if r ? 'error' then raise exception 'submit failed: %', r->>'error'; end if;
  return (r->>'id')::uuid;
end;
$$;

create function pg_temp.review(uid uuid, cid uuid, act text, args jsonb default '{}')
returns jsonb language sql as $$ select public.review_transition(uid, cid, act, args); $$;

-- Act as a signed-in user (or anon) for RLS checks; `reset role;` returns to postgres.
create function pg_temp.claims(uid uuid) returns text language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
