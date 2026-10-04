-- Arise Plus (Lesson 9, verified payments). $4.99 CAD a month through Stripe.
-- One row per paying account. Written ONLY by the stripe-webhook Edge Function
-- (service role) after Stripe's signature is verified. Users can read their own
-- row but never write it, so nobody can make themselves Plus from the browser.
-- (profiles is user-editable, which is why the paid status does not live there.)
create table public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text not null,          -- Stripe's status: active, trialing, past_due, canceled, ...
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "read own subscription" on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);
-- No insert, update or delete policies: only the service role writes.

-- True when the account has a live Plus subscription.
create or replace function public.is_plus(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from subscriptions
    where user_id = uid
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
  );
$$;
revoke all on function public.is_plus(uuid) from public, anon, authenticated;
grant execute on function public.is_plus(uuid) to service_role;
