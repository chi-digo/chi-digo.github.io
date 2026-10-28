do $$ begin
  assert (select prosrc from pg_proc where proname = 'review_transition') not like '%unique_violation%', 'rollback kept the fixes';
end $$;
