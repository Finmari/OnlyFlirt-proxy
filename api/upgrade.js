import Stripe from 'stripe';
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TIER_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER,
  plus: process.env.STRIPE_PRICE_PLUS,
  pro: process.env.STRIPE_PRICE_PRO
};

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { license_key, new_tier } = req.body || {};

  if (!license_key || !new_tier) {
    return res.status(400).json({ error: "Missing license_key or new_tier" });
  }

  // Hae nykyinen lisenssi
  const { data: license, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", license_key)
    .single();

  if (error || !license) return res.status(403).json({ error: "Invalid license" });
  if (!license.stripe_subscription_id?.startsWith("sub_")) {
    return res.status(400).json({ error: "No active subscription found" });
  }

  // Hae Stripe-tilaus
  const subscription = await stripe.subscriptions.retrieve(license.stripe_subscription_id);
  const subscriptionItemId = subscription.items.data[0].id;
  const newPriceId = TIER_PRICES[new_tier];

  if (!newPriceId) return res.status(400).json({ error: "Invalid tier" });

  // Päivitä tilaus proratoinnilla
  await stripe.subscriptions.update(license.stripe_subscription_id, {
    items: [{ id: subscriptionItemId, price: newPriceId }],
    proration_behavior: "create_prorations",
  });

  return res.status(200).json({ success: true, message: "Subscription updated" });
}
