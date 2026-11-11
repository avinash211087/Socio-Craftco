// Payment form. Until a Razorpay key is set in <meta name="razorpay-key">, it validates
// the details and hands the client over to WhatsApp instead of opening checkout.
(function () {
  const form = document.getElementById("payForm");
  const msg = document.getElementById("payMsg");
  const key = document.querySelector('meta[name="razorpay-key"]').content.trim();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const d = Object.fromEntries(new FormData(form));
    const amount = Math.round(Number(d.amount) * 100) / 100;

    if (!key) {
      const text = "Hi Socio Craftco, I'd like to pay invoice " + d.invoice + " (" + d.purpose + ") of ₹" +
        amount.toLocaleString("en-IN") + ". Name: " + d.name + ", email: " + d.email + ", phone: " + d.phone + ".";
      const link = "https://wa.me/919119687579?text=" + encodeURIComponent(text);
      const a = document.createElement("a");
      a.href = link; a.target = "_blank"; a.rel = "noopener"; a.textContent = "send us your payment details on WhatsApp";
      msg.textContent = "Online payment is being switched on. For now, please ";
      msg.appendChild(a);
      msg.append(" and we'll share a secure payment link.");
      msg.hidden = false;
      return;
    }
    // shortcut: Razorpay checkout needs a server-created order (key secret stays server-side); wire it here when the API keys are added.
    msg.textContent = "Online payment will open here once setup is complete.";
    msg.hidden = false;
  });
})();
