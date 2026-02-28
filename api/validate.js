import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TIER_LIMITS = {
  starter: { messages: 500, atm_sets: 0, tones: ["soft", "flirty", "seductive"] },
  pro: { messages: 2000, atm_sets: 10, tones: ["soft","cute","gfe","tease","flirty","seductive","dirty","kinky","extreme"] },
  agency: { messages: Infinity, atm_sets: Infinity, tones: ["soft","cute","gfe","tease","flirty","seductive","dirty","kinky","extreme"] },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://onlyfans.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { license_key } = req.body || {};
  if (!license_key) return res.status(400).json({ error: "Missing license_key" });

  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", license_key)
    .single();

  if (error || !data) return res.status(404).json({ error: "Invalid license" });

  const now = new Date();
  if (new Date(data.valid_until) < now) {
    return res.status(403).json({ error: "License expired" });
  }

  const limits = TIER_LIMITS[data.tier];
  if (data.tier !== "agency" && data.messages_used >= limits.messages) {
    return res.status(429).json({ error: "Message limit reached" });
  }

  return res.status(200).json({
    valid: true,
    tier: data.tier,
    messages_used: data.messages_used,
    messages_limit: limits.messages,
    atm_sets: limits.atm_sets,
    tones: limits.tones,
    valid_until: data.valid_until,
  });
}
