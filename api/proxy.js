export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  // ===== CORS (TÄMÄ ON SE KRIITTINEN KORJAUS) =====
  res.setHeader("Access-Control-Allow-Origin", "https://onlyfans.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    // Authorization tulee frontendistä (EI envistä)
    const auth = req.headers.authorization || "";
    const apiKey = auth.replace(/^Bearer\s+/i, "");

    if (!apiKey) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const r = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
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
