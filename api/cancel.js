import Stripe from 'stripe';
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { license_key } = req.body || {};
    if (!license_key) return res.status(400).json({ error: "Missing license_key" });

    const { data: license, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .single();

    if (error || !license) return res.status(403).json({ error: "Invalid license" });
    if (!license.stripe_subscription_id?.startsWith("sub_")) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    await stripe.subscriptions.update(license.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Cancel error:", err);
    return res.status(500).json({ error: err.message || "Cancel failed" });
  }
}
