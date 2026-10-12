do $$
begin
  assert not has_function_privilege('service_role', 'private.public_payload(text, jsonb)', 'execute'), 'grant not revoked';
end $$;
