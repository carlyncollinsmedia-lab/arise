-- Per-person cost control for Arise Plus: the morning pep talk plus one rewrite a day.
-- Counts only (no mood, no note). Written only by generate-affirmation (service role).
create table public.ai_user_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default (now() at time zone 'utc')::date,
  calls   integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_user_daily enable row level security;

create or replace function public.claim_user_ai_call(uid uuid, per_day integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare used integer;
begin
  insert into ai_user_daily (user_id, day, calls)
  values (uid, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set calls = ai_user_daily.calls + 1
  returning calls into used;
  return used <= per_day;
end;
$$;
revoke all on function public.claim_user_ai_call(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_user_ai_call(uuid, integer) to service_role;
