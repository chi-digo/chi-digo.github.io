-- The API reads public_contributions with the service role (similar-name check, review), and a view's
-- callers need execute on the functions it uses.
grant execute on function private.mask_pii(text), private.public_payload(text, jsonb) to service_role;
