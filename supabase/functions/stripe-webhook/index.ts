// stripe-webhook: Stripe calls this after a payment or subscription change.
// Every message is checked against Stripe's signature first; anything unsigned
// or tampered with is rejected. Only then is the subscriptions table updated,
// which is what switches Arise Plus on or off.

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function saveSubscription(s: Stripe.Subscription, fallbackUserId?: string | null) {
  const userId = s.metadata?.user_id || fallbackUserId;
  if (!userId) { console.log(JSON.stringify({ event: "no_user_id", subscription: s.id })); return; }
  // current_period_end moved onto the subscription items in newer Stripe API versions.
  const end = (s as any).current_period_end ?? s.items?.data?.[0]?.current_period_end ?? null;
  const { error } = await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: typeof s.customer === "string" ? s.customer : s.customer.id,
    stripe_subscription_id: s.id,
    status: s.status,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  console.log(JSON.stringify({ event: "subscription_saved", status: s.status }));
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("Stripe-Signature");
  if (!secret || !signature) return new Response("Not set up or not signed", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret, undefined, cryptoProvider);
  } catch {
    console.log(JSON.stringify({ event: "bad_signature" }));
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const s = await stripe.subscriptions.retrieve(session.subscription as string);
          await saveSubscription(s, session.client_reference_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await saveSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (err) {
    console.log(JSON.stringify({ event: "save_failed", type: event.type, message: String(err) }));
    return new Response("Save failed", { status: 500 }); // Stripe will retry
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
