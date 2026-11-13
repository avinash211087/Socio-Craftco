// Payment form. /api/razorpay-order creates the order with the secret key (server-side only), then Razorpay Checkout
// opens here. If payments are not set up on the server yet, the client is handed to WhatsApp instead.
(function () {
  const form = document.getElementById("payForm");
  const msg = document.getElementById("payMsg");
  const button = form.querySelector('button[type="submit"]');

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
    "Hi Socio Craftco, I'd like to pay invoice " + d.invoice + " (" + d.purpose + ") of ₹" + amount.toLocaleString("en-IN") +
    ". Name: " + d.name + ", email: " + d.email + ", phone: " + d.phone + ".");
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
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const d = Object.fromEntries(new FormData(form));
    const amount = Math.round(Number(d.amount) * 100) / 100;

    button.disabled = true;
    show("Opening secure checkout…");
    try {
      const order = await post("/api/razorpay-order", { ...d, amount });
      if (order.status === 503 || order.status === 404) {
        show("Online payment is being switched on. For now, please", { href: waLink(d, amount), text: "send us your payment details on WhatsApp", after: " and we'll share a secure payment link." });
        return;
      }
      if (!order.order_id) { show(order.error || "Could not start the payment. Please try again."); return; }
      await loadCheckout();

      const rzp = new window.Razorpay({
        key: order.key, order_id: order.order_id, amount: order.amount, currency: "INR",
        name: "Socio Craftco", description: (d.purpose + " · " + d.invoice).slice(0, 255),
        prefill: { name: d.name, email: d.email, contact: d.phone },
        theme: { color: "#0150FD" },
        handler: async (paid) => {
          show("Confirming your payment…");
          const check = await post("/api/razorpay-verify", paid).catch(() => ({}));
          if (check.ok) {
            show("Payment received. Thank you! Payment ID: " + paid.razorpay_payment_id + ". Razorpay will email your receipt.");
            form.reset();
          } else {
            show("We could not confirm this payment yet. If money left your account, email sociocraftco@gmail.com with Payment ID " + paid.razorpay_payment_id + ".");
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
