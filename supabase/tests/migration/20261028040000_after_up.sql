do $$ begin
  assert (select prosrc from pg_proc where proname = 'review_transition') like '%headword:%for update%has_dependants%', 'revert lock missing';
end $$;
