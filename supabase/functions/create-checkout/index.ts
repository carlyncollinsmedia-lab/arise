// create-checkout: starts an Arise Plus purchase. The signed-in user is sent to
// Stripe's own checkout page (card details never touch Arise), then back to the site.
// Plus is only switched on later by stripe-webhook, after Stripe confirms payment.

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const PRICE_CENTS = 499; // Owner decision (Oct 3 2026): $4.99 a month
const CURRENCY = "cad";
// Only these sites may ask to come back after checkout.
const ALLOWED_RETURN = ["https://arise-morning.netlify.app", "http://localhost:8765"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return json({ error: "payments_not_set_up" }, 503);

  // Who is asking? Must be a signed-in user, not just the public key.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: "sign_in_required" }, 401);

  const { returnTo } = await req.json().catch(() => ({ returnTo: "" }));
  const base = ALLOWED_RETURN.find((u) => typeof returnTo === "string" && returnTo.startsWith(u)) ?? ALLOWED_RETURN[0];

  const stripe = new Stripe(key);
  // Reuse the Stripe customer if this account bought before.
  const { data: sub } = await admin.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: CURRENCY,
        unit_amount: PRICE_CENTS,
        recurring: { interval: "month" },
        product_data: { name: "Arise Plus", description: "Morning pep talks written for you by Claude." },
      },
    }],
    client_reference_id: user.id,
    ...(sub?.stripe_customer_id ? { customer: sub.stripe_customer_id } : { customer_email: user.email }),
    subscription_data: { metadata: { user_id: user.id } },
    metadata: { user_id: user.id },
    success_url: `${base}/index.html?plus=success`,
    cancel_url: `${base}/index.html?plus=cancelled`,
  });
  return json({ url: session.url });
});
