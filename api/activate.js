import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TIER_MESSAGES = { starter: 500, plus: 2000, pro: 999999999 };

function generateLicenseKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += "-";
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

async function sendLicenseEmail(email, licenseKey, tier) {
  const tierNames = { starter: "Starter", plus: "Plus", pro: "Pro" };
  const tierName = tierNames[tier] || tier;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "JuicyFlirt <mari@finmarixxx.com>",
      to: email,
      subject: `JuicyFlirt ${tierName} – lisenssikoodisi`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #fafafa; border-radius: 12px;">
          <h1 style="font-size: 24px; color: #09090b; margin-bottom: 8px;">Tervetuloa JuicyFlirtiin! 🎉</h1>
          <p style="color: #71717a; margin-bottom: 32px;">Kiitos tilauksestasi! Tässä on lisenssikoodisi ${tierName}-pakettiin.</p>

          <div style="background: #18181b; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 32px;">
            <p style="color: #a1a1aa; font-size: 12px; margin-bottom: 8px; letter-spacing: 0.1em; text-transform: uppercase;">Lisenssikoodisi</p>
            <p style="color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: 0.1em; margin: 0;">${licenseKey}</p>
          </div>

          <h2 style="font-size: 16px; color: #09090b; margin-bottom: 12px;">Näin otat laajennuksen käyttöön:</h2>
          <ol style="color: #71717a; padding-left: 20px; line-height: 2;">
            <li>Lataa JuicyFlirt-laajennus: <a href="https://finmarixxx.com/juicyflirt/download/juicyflirt.zip">finmarixxx.com/juicyflirt/download/juicyflirt.zip</a></li>
            <li>Pura zip-tiedosto kansioon</li>
            <li>Avaa Chrome ja mene osoitteeseen: chrome://extensions/</li>
            <li>Laita päälle "Kehittäjätila" oikeasta yläkulmasta</li>
            <li>Klikkaa "Lataa pakkaamaton laajennus" ja valitse purettu kansio</li>
            <li>Klikkaa laajennuksen ⚙️ asetukset-nappia</li>
            <li>Syötä lisenssikoodisi kenttään ja tallenna</li>
          </ol>

          <p style="color: #a1a1aa; font-size: 13px; margin-top: 32px; border-top: 1px solid #e4e4e7; padding-top: 16px;">
            Kysyttävää? juicylifemari@gmail.com<br/>
            © 2026 JuicyLife
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    throw new Error("Email sending failed: " + err);
  }
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ error: "Webhook error: " + err.message });
  }

  // Käsittele tilauksen peruutus — poista vanha lisenssi
  if (event.type === "customer.subscription.deleted") {
    const customerId = event.data.object.customer;
    if (customerId) {
      await supabase.from("licenses").delete().eq("stripe_customer_id", customerId);
      console.log(`License deleted for customer: ${customerId}`);
    }
    return res.status(200).json({ received: true });
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const email = session.customer_details?.email;
  const customerId = session.customer;
  const tier = session.metadata?.tier || "plus";

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  // Poista vanhat lisenssit samalle asiakkaalle
  if (customerId) {
    await supabase.from("licenses").delete().eq("stripe_customer_id", customerId);
  }

  const licenseKey = generateLicenseKey();
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 1);

  const { error: dbError } = await supabase.from("licenses").insert({
    license_key: licenseKey,
    email: email,
    tier: tier,
    messages_used: 0,
    messages_limit: TIER_MESSAGES[tier] || 2000,
    valid_until: validUntil.toISOString(),
    stripe_subscription_id: session.subscription || session.id,
    stripe_customer_id: customerId || null,
  });

  if (dbError) {
    console.error("Supabase error:", dbError);
    return res.status(500).json({ error: "Database error" });
  }

  try {
    await sendLicenseEmail(email, licenseKey, tier);
    console.log(`License sent: ${licenseKey} to ${email} (${tier})`);
  } catch (emailErr) {
    console.error("Email error:", emailErr);
  }

  return res.status(200).json({ success: true });
}
