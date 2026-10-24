do $$ begin
  assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), '''glossary''') > 0, 'glossary not claimable';
end $$;
