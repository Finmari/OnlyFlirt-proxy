import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://onlyfans.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const auth = req.headers.authorization || "";
    const licenseKey = auth.replace(/^Bearer\s+/i, "").trim();

    if (!licenseKey) {
      return res.status(401).json({ error: "Missing license key" });
    }

    // Validate license
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", licenseKey)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "Invalid license key" });
    }

    const now = new Date();
    if (new Date(data.valid_until) < now) {
      return res.status(403).json({ error: "License expired" });
    }

    if (data.tier !== "agency" && data.messages_used >= data.messages_limit) {
      return res.status(429).json({ error: "Message limit reached for this month" });
    }

    // Increment message count
    await supabase
      .from("licenses")
      .update({ messages_used: data.messages_used + 1 })
      .eq("license_key", licenseKey);

    // Forward to Grok with server-side API key
    const r = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const text = await r.text();
    res.status(r.status);
    try {
      return res.json(JSON.parse(text));
    } catch {
      return res.send(text);
    }
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
