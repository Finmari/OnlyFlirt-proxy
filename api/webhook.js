import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const tier = session.metadata?.tier ?? 'Starter';
    const licenseKey = session.metadata?.license_key;

    if (email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'OnlyFlirt <noreply@juicylife.fi>',
          to: email,
          subject: '🎉 Tervetuloa OnlyFlirtiin – tässä on lisenssisi!',
          html: `
            <h2>Hei! Tilauksesi on aktivoitu ✨</h2>
            <p>Tilaustasosi: <strong>${tier}</strong></p>
            ${licenseKey ? `<p>Lisenssiavaimesi: <strong>${licenseKey}</strong></p>` : ''}
            <p>Lataa laajennus ja syötä avain asetuksiin.</p>
            <p>Jos tulee kysyttävää, vastaamme osoitteessa support@juicylife.fi</p>
            <br>
            <p>– JuicyLife-tiimi 💜</p>
          `,
        }),
      });
    }
  }

  res.status(200).json({ received: true });
}
