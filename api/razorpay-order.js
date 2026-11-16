// Vercel function: creates a Razorpay order for the pay page.
// Keys live only in Vercel environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET), never in the site code.
const crypto = require("crypto");
const text = (v, n) => String(v || "").trim().slice(0, n);
// Unique reference for every payment, e.g. SC-261116-A3F9C2 (date in India time + random part).
const reference = () => "SC-" + new Date(Date.now() + 330 * 60000).toISOString().slice(2, 10).replace(/-/g, "") + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const id = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) return res.status(503).json({ error: "Online payment is not set up yet." });

  const b = req.body || {};
  const paise = Math.round(Number(b.amount) * 100);
  if (!Number.isFinite(paise) || paise < 100 || paise > 50000000) return res.status(400).json({ error: "Amount must be between ₹1 and ₹5,00,000." });
  const invoice = text(b.invoice, 40) || reference(), name = text(b.name, 80);
  if (!name) return res.status(400).json({ error: "Please enter your name." });

  try {
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(id + ":" + secret).toString("base64"), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: paise, currency: "INR", receipt: invoice,
        notes: { invoice, name, purpose: text(b.purpose, 80), business: text(b.business, 80), email: text(b.email, 120), phone: text(b.phone, 20), address: text(b.address, 250) }
      })
    });
    const order = await r.json();
    if (!r.ok || !order.id) return res.status(502).json({ error: "Could not start the payment. Please try again." });
    res.status(200).json({ key: id, order_id: order.id, amount: order.amount, reference: invoice });
  } catch {
    res.status(502).json({ error: "Could not reach the payment service. Please try again." });
  }
};
