// setup-stripe: one-time setup, run once after STRIPE_SECRET_KEY is saved.
// 1. Creates the Stripe webhook that points at stripe-webhook (4 subscription events)
//    and stores its signing secret in stripe_config (server-only), so nobody copies it.
// 2. Turns on Stripe's customer portal (cancel / change card) for manage-plus.
// Safe to call again: if setup already happened it changes nothing.

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return json({ error: "payments_not_set_up" }, 503);
  if (!key.startsWith("sk_test_")) return json({ error: "test_keys_only_for_now" }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: existing } = await admin.from("stripe_config").select("webhook_endpoint_id").maybeSingle();
  if (existing) return json({ status: "already_set_up", webhook: existing.webhook_endpoint_id });

  const stripe = new Stripe(key);
  try {
    const endpoint = await stripe.webhookEndpoints.create({
      url: `${url}/functions/v1/stripe-webhook`,
      enabled_events: EVENTS,
      description: "Arise Plus: subscription changes -> Supabase",
    });
    let portalId: string | null = null;
    try {
      const portal = await stripe.billingPortal.configurations.create({
        business_profile: { headline: "Arise Plus" },
        features: {
          subscription_cancel: { enabled: true, mode: "at_period_end" },
          payment_method_update: { enabled: true },
          invoice_history: { enabled: true },
        },
        default_return_url: "https://arise-morning.netlify.app/index.html",
      });
      portalId = portal.id;
    } catch (err) {
      console.log(JSON.stringify({ event: "portal_setup_failed", message: String(err) }));
    }
    const { error } = await admin.from("stripe_config").insert({
      id: 1,
      webhook_endpoint_id: endpoint.id,
      webhook_signing_secret: endpoint.secret!,
      portal_configuration_id: portalId,
    });
    if (error) throw error;
    return json({ status: "set_up", webhook: endpoint.id, events: EVENTS.length, portal: !!portalId });
  } catch (err) {
    const msg = err instanceof Stripe.errors.StripeAuthenticationError ? "stripe_key_rejected" : String(err);
    console.log(JSON.stringify({ event: "setup_failed", message: msg }));
    return json({ error: msg }, 502);
  }
});
