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
  const got = Buffer.from(sig), want = Buffer.from(expected); // compare bytes: "é" is 1 character but 2 bytes
  const ok = got.length === want.length && crypto.timingSafeEqual(got, want);
  res.status(ok ? 200 : 400).json({ ok });
};
