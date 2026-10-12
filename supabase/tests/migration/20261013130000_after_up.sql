do $$
begin
  assert has_function_privilege('service_role', 'private.public_payload(text, jsonb)', 'execute'), 'service role cannot run public_payload';
end $$;
