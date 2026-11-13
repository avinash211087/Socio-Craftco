// Vercel function: checks the signature Razorpay returns after a payment, so the page only says "paid" for a real payment.
// The Razorpay dashboard stays the record of what was paid.
const crypto = require("crypto");

module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const b = req.body || {};
  const order = String(b.razorpay_order_id || ""), payment = String(b.razorpay_payment_id || ""), sig = String(b.razorpay_signature || "");
  if (!secret || !order || !payment || !sig) return res.status(400).json({ ok: false });

  const expected = crypto.createHmac("sha256", secret).update(order + "|" + payment).digest("hex");
  const ok = sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  res.status(ok ? 200 : 400).json({ ok });
};
