-- Server-only Stripe settings. The setup-stripe function creates the webhook
-- through Stripe's API and stores its signing secret here, so no person ever
-- has to copy the secret by hand. No policies: only the service role can read it.
create table public.stripe_config (
  id                     int primary key default 1 check (id = 1),  -- exactly one row
  webhook_endpoint_id    text not null,
  webhook_signing_secret text not null,
  portal_configuration_id text,
  created_at             timestamptz not null default now()
);
alter table public.stripe_config enable row level security;
revoke all on public.stripe_config from anon, authenticated;
