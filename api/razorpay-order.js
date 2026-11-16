// Vercel function: creates a Razorpay order for the pay page.
// Keys live only in Vercel environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET), never in the site code.
const crypto = require("crypto");
const text = (v, n) => String(v || "").trim().slice(0, n);
const mobile = (v) => String(v || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""); // "+91 98765-43210" -> "9876543210"
// Unique reference for every payment, e.g. SC-261116-A3F9C2 (date in India time + random part).
const reference = () => "SC-" + new Date(Date.now() + 330 * 60000).toISOString().slice(2, 10).replace(/-/g, "") + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();

// shortcut: the Origin check stops other websites and simple scripts, not a determined attacker who fakes the header;
// orders cost nothing and charge no one. Add a rate limiter if junk orders ever show up in the dashboard.
const SITE = /^https:\/\/(www\.)?sociocraftco\.in$/;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!SITE.test((req.headers && req.headers.origin) || "")) return res.status(403).json({ error: "Please pay from sociocraftco.in." });
  const id = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) return res.status(503).json({ error: "Online payment is not set up yet." });

  const b = req.body || {};
  const paise = Math.round(Number(b.amount) * 100);
  if (!Number.isFinite(paise) || paise < 100 || paise > 50000000) return res.status(400).json({ error: "Amount must be between ₹1 and ₹5,00,000." });
  // Every field is required (same rules as pay.js). Razorpay notes allow 256 characters, so the address is capped at 250.
  const invoice = text(b.invoice, 40) || reference(), name = text(b.name, 80), email = text(b.email, 120), phone = mobile(b.phone);
  const street = text(b.address, 140), city = text(b.city, 50), state = text(b.state, 40), pin = text(b.pincode, 10);
  const problem =
    name.length < 2 ? "Please enter your full name." :
    !/^[6-9]\d{9}$/.test(phone) ? "Please enter a valid 10-digit mobile number." :
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "Please enter a valid email address." :
    street.length < 5 || city.length < 2 || !state || !/^[1-9]\d{5}$/.test(pin) ? "Please enter your full billing address with a 6-digit PIN code." : "";
  if (problem) return res.status(400).json({ error: problem });

  try {
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(id + ":" + secret).toString("base64"), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: paise, currency: "INR", receipt: invoice,
        notes: { invoice, name, purpose: text(b.purpose, 80) || "Payment", email, phone: "+91" + phone, address: `${street}, ${city}, ${state} ${pin}` }
      })
    });
    const order = await r.json();
    if (!r.ok || !order.id) return res.status(502).json({ error: "Could not start the payment. Please try again." });
    res.status(200).json({ key: id, order_id: order.id, amount: order.amount, reference: invoice });
  } catch {
    res.status(502).json({ error: "Could not reach the payment service. Please try again." });
  }
};
