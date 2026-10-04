// manage-plus: sends a Plus subscriber to Stripe's own page to cancel or change their card.

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

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
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return json({ error: "payments_not_set_up" }, 503);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: "sign_in_required" }, 401);

  const { data: sub } = await admin.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!sub?.stripe_customer_id) return json({ error: "no_subscription" }, 404);

  const { returnTo } = await req.json().catch(() => ({ returnTo: "" }));
  const base = ALLOWED_RETURN.find((u) => typeof returnTo === "string" && returnTo.startsWith(u)) ?? ALLOWED_RETURN[0];
  try {
    const portal = await new Stripe(key).billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${base}/index.html` });
    return json({ url: portal.url });
  } catch (err) {
    console.log(JSON.stringify({ event: "portal_failed", message: String(err) }));
    return json({ error: "portal_unavailable" }, 502);
  }
});
