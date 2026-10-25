do $$ begin
  assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), '''article''') = 0, 'rollback kept article';
end $$;
