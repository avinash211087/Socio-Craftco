// Vercel function: Razorpay calls this when an order is paid, even if the client closed the tab before the pay page confirmed.
// Set it up in Razorpay Dashboard → Settings → Webhooks: URL https://www.sociocraftco.in/api/razorpay-webhook, event "order.paid",
// and the same secret as the RAZORPAY_WEBHOOK_SECRET environment variable in Vercel.
// Each paid order is added to the "Payments" tab of the lead Google Sheet. SHEET_PAYMENT_KEY must match the Sheet script's
// PAYMENT_KEY, so nobody else can add fake payments. The Razorpay dashboard stays the record of what was paid.
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
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET, key = process.env.SHEET_PAYMENT_KEY;
  if (!secret || !key) return res.status(503).json({ error: "Webhook not set up" });

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
    key,
    payment: payment.id || "",
    name: notes.name || payment.email || "Unknown payer",
    service: notes.purpose || "Payment",
    budget: inr(payment.amount || order.amount_paid || 0),
    // Razorpay checked these at checkout; the typed phone in the notes may be too short for the Sheet.
    contact: payment.contact || payment.email || notes.phone || notes.email || "",
    message: [
      "Reference " + (notes.invoice || order.receipt || "-"),
      "Payment ID " + (payment.id || "-"),
      "Order ID " + (order.id || "-"),
      "Method " + (payment.method || "-"),
      notes.email || payment.email ? "Email " + (notes.email || payment.email) : "",
      notes.address ? "Address " + notes.address : ""
    ].filter(Boolean).join(" · ")
  };

  // Anything but "ok" fails the webhook, so Razorpay retries it (for up to 24 hours). The Sheet skips Payment IDs it already has.
  try {
    const r = await fetch(SHEET_ENDPOINT, { method: "POST", body: new URLSearchParams(row), redirect: "follow" });
    const reply = (await r.text()).trim();
    if (reply === "ok") return res.status(200).json({ ok: true });
    return res.status(502).json({ ok: false, sheet: reply.slice(0, 40) });
  } catch {
    return res.status(502).json({ ok: false });
  }
};
