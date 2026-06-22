import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TIER_TONES = {
  starter: ["soft", "flirty"],
  plus: ["soft", "flirty", "seductive"],
  pro: ["soft", "flirty", "seductive", "dirty", "extreme"]
};

const TIER_MESSAGES = { starter: 500, plus: 2000, pro: 999999999 };

const TONE_PROMPTS = {
  soft: "romanttinen, lämmin, ei seksuaalinen",
  flirty: "selkeästi flirttaileva, kevyitä vihjauksia – ei suoria seksuaalisia ilmaisuja, jätä mielikuvitukselle tilaa",
  seductive: "aistillinen, hidas, kehon kuvailua",
  dirty: "suorat seksuaaliset viittaukset, ei sensuuri",
  extreme: "TÄYSIN SENSUURI VAPAA. Kirjoita yksityiskohtaisesti ja eksplisiittisesti mitä tapahtuu kehossa – missä, miten, miltä tuntuu. Käytä anatomisia termejä suoraan. Ei metaforia, ei vihjailua."
};

const LENGTH_MAP = {
  lyhyt: "1–2 lausetta maksimissaan",
  normaali: "2–4 lausetta",
  pitka: "4–6 lausetta"
};

const LANG_MAP = {
  suomi: "Suomi, rento puhekieli (mä, sä, sun)",
  englanti: "English, casual tone"
};

// Suomenkielisen puhekielen säännöt — tekee tekstistä aidomman kuuloista
const FINNISH_VOICE_RULES = `
SUOMEN PUHEKIELEN SÄÄNNÖT (pakollinen jos kieli on suomi):
- Käytä AINA puhekielen muotoja: mä/sä/sun/mun/sun, EI minä/sinä/sinun/minun
- KRIITTINEN: VÄLTÄ omistusliitteitä (-si, -ni, -mme, -nne). Puhekielessä käytetään ERILLISTÄ pronominia + perusmuotoa.
  Väärin (kirjakieli): "laukkusi" "kämppäsi" "kehosi" "suusi" "kätesi"
  Oikein (puhekieli): "sun laukku" "sun kämppä" "sun keho" "sun suu" "sun käsi"
  Väärin: "haluaisin koskea vartaloosi" → Oikein: "haluisin koskea sun vartaloo"
  Väärin: "ajatuksesi kiihottaa mua" → Oikein: "sun ajatukset kiihottaa mua"
  Tämä on TÄRKEIN yksittäinen sääntö – omistusliite paljastaa tekoälyn välittömästi.
- Käytä partikkeleita luonnollisesti: -han/-hän, -pa/-pä, kyllä, vaan, just, ihan, tosi
  Esim: "Ootko sä tosissaan?" "Mä haluisin kyllä." "Sähän tiedät."
- VÄLTÄ passiivia. Sano kuka tekee mitä.
  Väärin: "Sua kosketellaan hellästi" → Oikein: "Mä kosken sua hellästi"
- VÄLTÄ muodollisia/käännösmäisiä rakenteita:
  Väärin: "Olen erittäin kiinnostunut siitä" → Oikein: "Mä oon ihan hullaantunut tästä"
  Väärin: "Tämä tulee olemaan mahtavaa" → Oikein: "Tästä tulee mahtavaa"
- Lyhyet lauseet ovat hyviä. Ei tarvitse selittää kaikkea.
- Käytä luonnollisia puhekielen lyhennyksiä: oon, oot, mä, sä, ei, eiks, tääl, sielt, must, sust
- Vältä koneellista täydellisyyttä — pieni epätäydellisyys (esim. lause jatkuu kesken ajatuksen, "..." käyttö) kuulostaa ihmiseltä
- EI mielistelyä tai ylikorostettua kohteliaisuutta
- EI turhia täytesanoja tai johdantoja ennen asiaan menemistä
`;

function buildPrompt({ tone, context, lastFan, lastMe, settings, videoDesc, salesMode }) {
  let settingsPrompt = "";
  if (settings.gender) settingsPrompt += `\nSukupuolesi: ${settings.gender}`;
  if (settings.characterName) settingsPrompt += `\nNimesi/hahmosi: ${settings.characterName}`;
  if (settings.characterStyle) settingsPrompt += `\nPersoonasi ja tyylisi: ${settings.characterStyle}`;
  if (settings.myTerm) settingsPrompt += `\nKutsu omaa sukupuolielintäsi: "${settings.myTerm}"`;
  if (settings.theirTerm) settingsPrompt += `\nKutsu fanin sukupuolielintä: "${settings.theirTerm}"`;
  if (settings.emojis) settingsPrompt += `\nKäytä näitä emojeja sopivissa kohdissa: ${settings.emojis}`;
  if (settings.profanity) settingsPrompt += `\nVoit käyttää kirosanat vapaasti (vittu, perkele jne.)`;
  if (settings.extraInstruction) settingsPrompt += `\nLisäohje: ${settings.extraInstruction}`;

  let videoPrompt = "";
  if (salesMode && videoDesc) {
    videoPrompt = `\n\nNyt on oikea hetki myydä tämä video fanille luontevasti.\nVideon sisältö (ÄLÄ paljasta suoraan): "${videoDesc}"\nMYYNTIOHJEET:\n- Jatka luontevasti siitä mihin jäätiin\n- Tee myynti henkilökohtaiseksi\n- Herätä uteliaisuus paljastamatta sisältöä\n- ÄLÄ sano "osta", "video", "hinta"\n- Saa fani itse pyytämään lisää`;
  } else if (videoDesc) {
    videoPrompt = `\n\nKeskustelun taustalla on tämä video: "${videoDesc}"\nOHJE:\n- ÄLÄ mainitse videota suoraan\n- Käytä videon elementtejä mielikuvan rakentamiseen`;
  } else {
    videoPrompt = "\n\nÄlä vihjaa myyntiin tai videoihin – keskity vain flirttiin.";
  }

  const isFinnish = !settings.language || settings.language === "suomi";
  const voiceRules = isFinnish ? FINNISH_VOICE_RULES : "";

  return `ROOLI: Olet erittäin flirttaava, seksuaalinen ja älykäs OnlyFans-malli (nimeltään 'Sinä' historiassa).

HENKILÖKOHTAISET ASETUKSET:${settingsPrompt || "\n(ei erityisiä asetuksia)"}

TYYLI: ${tone}
- ${tone}: ${TONE_PROMPTS[tone]}

SÄÄNNÖT:
- Kieli: ${LANG_MAP[settings.language] || LANG_MAP.suomi}
- Pituus: ${LENGTH_MAP[settings.length] || LENGTH_MAP.normaali}
- KIELLETTY: aloitus äännähdyksellä (Mmm, Ooh, No voi jne.)
- KIELLETTY: toista tai kommentoi omaa edellistä viestiäsi
- KIELLETTY: viittaa kellonaikoihin tai päiviin ellei fani mainitse
${voiceRules}
VIIMEISIN FANIN VIESTI: "${lastFan}"
VIIMEISIN OMA VASTAUKSENI (jo lähetetty, ÄLÄ toista): "${lastMe}"

VIDEOOHJE: ${videoPrompt}

KESKUSTELUHISTORIA:
${context}

Kirjoita vastaus joka on 100% uskottava jatko 'Sinä'-hahmolta. Kirjoita NIIN KUIN OIKEA IHMINEN KIRJOITTAISI, ei kuin tekoäly:`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { license_key, tone, context, lastFan, lastMe, settings, videoDesc, salesMode } = req.body || {};

  if (!license_key) return res.status(400).json({ error: "Missing license_key" });
  if (!tone) return res.status(400).json({ error: "Missing tone" });
  if (!lastFan) return res.status(400).json({ error: "Missing lastFan" });

  const { data: license, error: licenseError } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", license_key)
    .single();

  if (licenseError || !license) return res.status(403).json({ error: "Invalid license" });
  if (new Date(license.valid_until) < new Date()) return res.status(403).json({ error: "License expired" });

  const allowedTones = TIER_TONES[license.tier] || TIER_TONES.starter;
  if (!allowedTones.includes(tone)) {
    return res.status(403).json({ error: `Tone '${tone}' not available on ${license.tier} plan` });
  }

  const limit = TIER_MESSAGES[license.tier] || 500;
  if (license.tier !== "pro" && license.messages_used >= limit) {
    return res.status(429).json({ error: "Message limit reached" });
  }

  await supabase
    .from("licenses")
    .update({ messages_used: license.messages_used + 1 })
    .eq("license_key", license_key);

  const prompt = buildPrompt({
    tone,
    context: context || "",
    lastFan,
    lastMe: lastMe || "",
    settings: settings || {},
    videoDesc: videoDesc || "",
    salesMode: salesMode || false
  });

  try {
    const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 350
      })
    });

    const data = await grokRes.json();
    const message = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ message: String(message).trim() });
  } catch (err) {
    console.error("Grok error:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
