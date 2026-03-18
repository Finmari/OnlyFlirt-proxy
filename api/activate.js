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
      subject: `JuicyFlirt ${tierName} – lisenssikoodisi ja asennusohjeet`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fafafa;">
          <h1 style="font-size: 24px; color: #09090b; margin-bottom: 8px;">Tervetuloa JuicyFlirtiin! 🎉</h1>
          <p style="color: #71717a; margin-bottom: 32px;">Kiitos tilauksestasi! Tässä on lisenssikoodisi ja ohjeet laajennuksen asentamiseen.</p>
          <div style="background: #18181b; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 32px;">
            <p style="color: #a1a1aa; font-size: 12px; margin-bottom: 8px; letter-spacing: 0.1em; text-transform: uppercase;">Tilaustasosi: ${tierName}</p>
            <p style="color: #a1a1aa; font-size: 12px; margin-bottom: 8px; letter-spacing: 0.1em; text-transform: uppercase;">Lisenssikoodisi</p>
            <p style="color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: 0.15em; margin: 0;">${licenseKey}</p>
            <p style="color: #71717a; font-size: 11px; margin-top: 8px;">Tallenna tämä koodi — tarvitset sitä asennuksessa</p>
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 32px; text-align: center;">
            <p style="color: #15803d; font-size: 14px; font-weight: 600; margin-bottom: 8px;">📥 Lataa JuicyFlirt-laajennus</p>
            <a href="https://finmarixxx.com/juicyflirt/download/juicyflirt.zip" style="background: #16a34a; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">Lataa juicyflirt.zip</a>
          </div>
          <h2 style="font-size: 18px; color: #09090b; margin-bottom: 16px;">📋 Asennusohjeet vaihe vaiheelta</h2>
          <div style="background: #fff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <p style="font-weight: 600; color: #09090b; margin-bottom: 4px;">Vaihe 1 — Lataa ja pura tiedosto</p>
            <ol style="color: #71717a; padding-left: 20px; line-height: 2; margin: 0;">
              <li>Klikkaa yllä olevaa <strong>Lataa juicyflirt.zip</strong> -nappia</li>
              <li>Avaa ladattu zip-tiedosto (tuplaklikkaus)</li>
              <li>Pura kansio esim. työpöydälle — älä poista kansiota asennuksen jälkeen!</li>
            </ol>
          </div>
          <div style="background: #fff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <p style="font-weight: 600; color: #09090b; margin-bottom: 4px;">Vaihe 2 — Avaa Chromen laajennussivu</p>
            <ol style="color: #71717a; padding-left: 20px; line-height: 2; margin: 0;">
              <li>Avaa <strong>Google Chrome</strong> tietokoneella</li>
              <li>Kirjoita osoitepalkkiin: <strong style="color: #09090b;">chrome://extensions/</strong> ja paina Enter</li>
              <li>Laita päälle <strong>"Kehittäjätila"</strong> (Developer mode) — löytyy oikeasta yläkulmasta</li>
            </ol>
          </div>
          <div style="background: #fff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <p style="font-weight: 600; color: #09090b; margin-bottom: 4px;">Vaihe 3 — Asenna laajennus</p>
            <ol style="color: #71717a; padding-left: 20px; line-height: 2; margin: 0;">
              <li>Klikkaa <strong>"Lataa pakkaamaton laajennus"</strong> (Load unpacked)</li>
              <li>Valitse purkamasi <strong>juicyflirt-extension</strong> -kansio</li>
              <li>Klikkaa <strong>Valitse kansio</strong></li>
              <li>JuicyFlirt ilmestyy laajennuslistaan ✓</li>
            </ol>
          </div>
          <div style="background: #fff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
            <p style="font-weight: 600; color: #09090b; margin-bottom: 4px;">Vaihe 4 — Syötä lisenssikoodisi</p>
            <ol style="color: #71717a; padding-left: 20px; line-height: 2; margin: 0;">
              <li>Mene <strong>OnlyFans.com</strong> -sivulle</li>
              <li>Näet vasemmassa reunassa <strong>JuicyFlirt-napin</strong> — klikkaa sitä</li>
              <li>Klikkaa <strong>⚙️ asetukset</strong> -nappia</li>
              <li>Syötä lisenssikoodisi kenttään: <strong style="color: #09090b;">${licenseKey}</strong></li>
              <li>Klikkaa <strong>Tallenna</strong> — olet valmis! 🎉</li>
            </ol>
          </div>
          <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
            <p style="color: #854d0e; font-size: 13px; margin: 0;"><strong>⚠️ Tärkeää:</strong> Laajennus toimii vain <strong>tietokoneella Chrome-selaimessa</strong>. Se ei toimi mobiililaitteilla tai muissa selaimissa.</p>
          </div>
          <p style="color: #a1a1aa; font-size: 13px; margin-top: 32px; border-top: 1px solid #e4e4e7; padding-top: 16px;">
            Kysyttävää? Ota yhteyttä: juicylifemari@gmail.com<br/>
            © 2026 JuicyLife Oy
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

  // Käsittele tilauksen päivitys — lähetä uusi lisenssi
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const priceId = subscription.items.data[0]?.price?.id;

    const tierMap = {
      [process.env.STRIPE_PRICE_STARTER]: "starter",
      [process.env.STRIPE_PRICE_PLUS]: "plus",
      [process.env.STRIPE_PRICE_PRO]: "pro"
    };
    const tier = tierMap[priceId] || "plus";

    const { data: existingLicense } = await supabase
      .from("licenses")
      .select("email")
      .eq("stripe_customer_id", customerId)
      .single();

    if (existingLicense?.email) {
      await supabase.from("licenses").delete().eq("stripe_customer_id", customerId);

      const licenseKey = generateLicenseKey();
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 1);

      await supabase.from("licenses").insert({
        license_key: licenseKey,
        email: existingLicense.email,
        tier: tier,
        messages_used: 0,
        messages_limit: TIER_MESSAGES[tier] || 2000,
        valid_until: validUntil.toISOString(),
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
      });

      try {
        await sendLicenseEmail(existingLicense.email, licenseKey, tier);
        console.log(`Upgraded license sent: ${licenseKey} to ${existingLicense.email} (${tier})`);
      } catch (emailErr) {
        console.error("Email error:", emailErr);
      }
    }

    return res.status(200).json({ received: true });
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const email = session.customer_details?.email;
  const customerId = session.customer;
  const tier = session.metadata?.tier || "starter";

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

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
