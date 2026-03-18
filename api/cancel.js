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

    const subscription = await stripe.subscriptions.update(license.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const periodEnd = new Date(subscription.current_period_end * 1000).toLocaleDateString("fi-FI");

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JuicyFlirt <mari@finmarixxx.com>",
        to: license.email,
        subject: "JuicyFlirt – tilauksesi on peruutettu",
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #fafafa;">
            <h1 style="font-size: 22px; color: #09090b; margin-bottom: 8px;">Tilauksesi on peruutettu</h1>
            <p style="color: #71717a; margin-bottom: 24px;">Olemme vastaanottaneet peruutuspyyntösi.</p>
            <div style="background: #fff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #09090b; margin-bottom: 8px;">Pääsy JuicyFlirtiin jatkuu <strong>${periodEnd}</strong> asti.</p>
              <p style="color: #71717a; font-size: 13px; margin: 0;">Tämän jälkeen lisenssiavaim
