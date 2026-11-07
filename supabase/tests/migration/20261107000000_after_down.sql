do $$ begin
  assert not exists (select 1 from pg_views where viewname = 'public_ui_accepted'), 'view kept';
  assert not exists (select 1 from pg_proc where proname = 'notify_batch'), 'notify_batch kept';
end $$;
