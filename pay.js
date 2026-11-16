// Payment form. /api/razorpay-order creates the order (and a reference number) with the secret key, server-side only;
// then Razorpay Checkout opens here. If payments are not set up on the server, the client is handed to WhatsApp instead.
// A link like pay.html?amount=15000&for=Advance&invoice=INV-7 opens with those filled in.
(function () {
  const form = document.getElementById("payForm");
  const msg = document.getElementById("payMsg");
  const button = form.querySelector('button[type="submit"]');
  const amountInput = form.elements.amount;
  form.removeAttribute("inert"); // locked in the HTML until this script runs (see pay.html)
  const SAVED = ["name", "phone", "email"]; // not the address: on a shared computer the next person would see it

  const rupees = (v) => Number(String(v).replace(/[,₹\s]/g, ""));
  const inr = (n) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const okAmount = (n) => Number.isFinite(n) && n >= 1 && n <= 500000;
  const label = () => {
    const n = rupees(amountInput.value);
    button.textContent = okAmount(n) ? "Pay " + inr(n) : "Pay securely";
  };

  // Prefill: link parameters first, then details saved on this device from an earlier payment.
  const q = new URLSearchParams(location.search);
  if (q.get("amount")) amountInput.value = q.get("amount");
  if (q.get("invoice")) form.elements.invoice.value = q.get("invoice").slice(0, 40);
  const forRadio = q.get("for") && [...form.elements.purpose].find((r) => r.value.toLowerCase() === q.get("for").toLowerCase());
  if (forRadio) forRadio.checked = true;
  try {
    const saved = JSON.parse(localStorage.getItem("sc-payer") || "{}");
    SAVED.forEach((k) => { if (saved[k] && !form.elements[k].value) form.elements[k].value = saved[k]; });
  } catch {}
  label();
  amountInput.addEventListener("input", () => { amountInput.setCustomValidity(""); label(); });

  const show = (text, link) => {
    msg.textContent = text;
    if (link) {
      const a = document.createElement("a");
      a.href = link.href; a.target = "_blank"; a.rel = "noopener"; a.textContent = link.text;
      msg.append(" ", a, link.after || "");
    }
    msg.hidden = false;
  };
  const waLink = (d, amount) => "https://wa.me/919119687579?text=" + encodeURIComponent(
    "Hi Socio Craftco, I'd like to pay " + inr(amount) + " (" + d.purpose + (d.invoice ? ", invoice " + d.invoice : "") +
    "). Name: " + d.name + ", email: " + d.email + ", phone: " + d.phone + ", address: " + d.address + ".");
  const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then((r) => r.json().then((j) => ({ status: r.status, ...j })));
  const loadCheckout = () => window.Razorpay ? Promise.resolve() : new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = ok; s.onerror = fail;
    document.head.append(s);
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const amount = Math.round(rupees(amountInput.value) * 100) / 100;
    amountInput.setCustomValidity(okAmount(amount) ? "" : "Enter an amount between ₹1 and ₹5,00,000.");
    if (!form.reportValidity()) return;
    const d = Object.fromEntries(new FormData(form));
    try { localStorage.setItem("sc-payer", JSON.stringify(Object.fromEntries(SAVED.map((k) => [k, d[k]])))); } catch {}

    button.disabled = true;
    show("Opening secure checkout…");
    try {
      const order = await post("/api/razorpay-order", { ...d, amount });
      if (order.status === 503) {
        show("Online payment is being switched on. For now, please", { href: waLink(d, amount), text: "send us your payment details on WhatsApp", after: " and we'll share a secure payment link." });
        return;
      }
      if (!order.order_id) { show(order.error || "Could not start the payment. Please try again."); return; }
      await loadCheckout();

      const rzp = new window.Razorpay({
        key: order.key, order_id: order.order_id, amount: order.amount, currency: "INR",
        name: "Socio Craftco", image: "https://www.sociocraftco.in/brand/logo-square.jpg",
        description: (d.purpose + " · " + order.reference).slice(0, 255),
        prefill: { name: d.name, email: d.email, contact: d.phone },
        theme: { color: "#0150FD" },
        handler: async (paid) => {
          show("Confirming your payment…");
          const check = await post("/api/razorpay-verify", paid).catch(() => ({}));
          if (check.ok) {
            show("Payment of " + inr(amount) + " received. Thank you! Reference: " + order.reference + ". Razorpay will email your receipt.");
            amountInput.value = ""; label();
          } else {
            show("We could not confirm this payment yet. If money left your account, email sociocraftco@gmail.com with reference " + order.reference + " and Payment ID " + paid.razorpay_payment_id + ".");
          }
        },
        modal: { ondismiss: () => { if (msg.textContent === "Opening secure checkout…") show("Payment cancelled. Nothing was charged."); } }
      });
      rzp.on("payment.failed", (r) => show("Payment failed: " + ((r.error && r.error.description) || "please try again") + ". You can try again; if money was debited, your bank returns it."));
      rzp.open();
    } catch {
      show("Could not reach the payment service. Please check your connection and try again.");
    } finally {
      button.disabled = false;
    }
  });
})();
