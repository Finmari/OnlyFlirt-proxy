export default async function handler(req, res) {
  try {
    const r = await fetch("https://api.x.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.GROK_API_KEY}`
      }
    });

    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "models error" });
  }
}
