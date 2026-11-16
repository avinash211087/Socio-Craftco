// Vercel function: Razorpay calls this when an order is paid, even if the client closed the tab before the pay page confirmed.
// Set it up in Razorpay Dashboard → Settings → Webhooks: URL https://www.sociocraftco.in/api/razorpay-webhook, event "order.paid",
// and the same secret as the RAZORPAY_WEBHOOK_SECRET environment variable in Vercel.
// Each paid order is added to the lead Google Sheet with Source "Payment". The Razorpay dashboard stays the record of what was paid.
const crypto = require("crypto");

const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbw-wY5iioNYXIOOCgU5PfAAeR3B85IpfvZmnR2IMTKFH1iXVcnnGehy_m_eeoQDCXGo/exec"; // same as index.html lead-endpoint

// The signature covers the exact bytes Razorpay sent, so read the raw body instead of the parsed req.body.
const rawBody = (req) => new Promise((ok, fail) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => ok(Buffer.concat(chunks)));
  req.on("error", fail);
});

const validSignature = (body, sig, secret) => {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
};

const inr = (paise) => "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "Webhook secret not set" });

  const body = await rawBody(req);
  const sig = String(req.headers["x-razorpay-signature"] || "");
  if (!sig || !validSignature(body, sig, secret)) return res.status(400).json({ ok: false });

  let event;
  try { event = JSON.parse(body.toString("utf8")); } catch { return res.status(400).json({ ok: false }); }
  if (event.event !== "order.paid") return res.status(200).json({ ok: true, ignored: event.event });

  const payment = (event.payload && event.payload.payment && event.payload.payment.entity) || {};
  const order = (event.payload && event.payload.order && event.payload.order.entity) || {};
  const notes = order.notes || {};
  const row = {
    source: "Payment",
    name: notes.name || payment.email || "Unknown payer",
    business: notes.business || "",
    service: notes.purpose || "Payment",
    budget: inr(payment.amount || order.amount_paid || 0),
    timeline: "Paid",
    contact: notes.phone || payment.contact || notes.email || payment.email || "",
    message: [
      "Reference " + (notes.invoice || order.receipt || "-"),
      "Payment ID " + (payment.id || "-"),
      "Order ID " + (order.id || "-"),
      "Method " + (payment.method || "-"),
      notes.email || payment.email ? "Email " + (notes.email || payment.email) : "",
      notes.address ? "Address " + notes.address : ""
    ].filter(Boolean).join(" · ")
  };

  // Razorpay retries anything that is not 2xx, so a Sheet hiccup must not fail the webhook.
  try {
    await fetch(SHEET_ENDPOINT, { method: "POST", body: new URLSearchParams(row), redirect: "follow" });
  } catch {}
  res.status(200).json({ ok: true });
};
