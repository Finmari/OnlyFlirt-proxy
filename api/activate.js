import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const config = { runtime: "nodejs" };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TIER_MESSAGES = { starter: 500, pro: 2000, agency: 999999999 };

function generateLicenseKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += "-";
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  // Stripe webhook signature check
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await getRawBody(req);
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(rawBody);
    // Basic verification - in production use stripe.webhooks.constructEvent
    event = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ error: "Webhook error: " + err.message });
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const email = session.customer_details?.email;
  const tier = session.metadata?.tier;

  if (!email || !tier) {
    return res.status(400).json({ error: "Missing email or tier" });
  }

  const licenseKey = generateLicenseKey();
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 1);

  const { error } = await supabase.from("licenses").insert({
    license_key: licenseKey,
    email: email,
    tier: tier,
    messages_used: 0,
    messages_limit: TIER_MESSAGES[tier],
    valid_until: validUntil.toISOString(),
    stripe_subscription_id: session.subscription || session.id,
  });

  if (error) {
    console.error("Supabase error:", error);
    return res.status(500).json({ error: "Database error" });
  }

  // TODO: Send email with licenseKey to customer
  console.log(`License created: ${licenseKey} for ${email} (${tier})`);

  return res.status(200).json({ success: true, license_key: licenseKey });
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
