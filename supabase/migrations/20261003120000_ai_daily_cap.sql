-- Cost control for the public web app (Lesson 9).
-- Counts Claude calls per day; once the daily cap is reached the
-- generate-affirmation function serves a reviewed fallback instead.
create table if not exists public.ai_daily_usage (
  day   date primary key default (now() at time zone 'utc')::date,
  calls integer not null default 0
);
alter table public.ai_daily_usage enable row level security;
-- No policies: only the service role (inside the Edge Function) touches it.

create or replace function public.claim_ai_call(daily_cap integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare used integer;
begin
  insert into ai_daily_usage (day, calls)
  values ((now() at time zone 'utc')::date, 1)
  on conflict (day) do update set calls = ai_daily_usage.calls + 1
  returning calls into used;
  return used <= daily_cap;
end;
$$;
revoke all on function public.claim_ai_call(integer) from public, anon, authenticated;
grant execute on function public.claim_ai_call(integer) to service_role;
