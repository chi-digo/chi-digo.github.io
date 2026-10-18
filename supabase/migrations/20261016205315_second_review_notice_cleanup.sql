-- When an item leaves "awaiting second review" (confirmed, sent back or self-confirmed), the other
-- reviewers' notices about it are settled: mark them read.
create or replace function private.settle_second_review_notices()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.notifications set read_at = now()
  where contribution_id = new.id and kind = 'second_review' and read_at is null;
  return null;
end;
$$;

revoke execute on function private.settle_second_review_notices() from public, anon, authenticated;

create trigger settle_second_review_notices
  after update of live_status on public.contributions
  for each row
  when (old.live_status = 'awaiting_second' and new.live_status is distinct from 'awaiting_second')
  execute function private.settle_second_review_notices();
