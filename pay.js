// Payment form. /api/razorpay-order checks every field again and creates the order (and a reference number) with the
// secret key, server-side only; then Razorpay Checkout opens here. If payments are not set up on the server, the client
// is handed to WhatsApp instead. A link like pay.html?amount=15000&for=Advance&invoice=INV-7 opens with those filled in.
(function () {
  const form = document.getElementById("payForm");
  const msg = document.getElementById("payMsg");
  const summary = document.getElementById("paySummary");
  const button = document.querySelector('button[form="payForm"]');
  const amountInput = form.elements.amount;
  form.removeAttribute("inert"); // form and button are locked in the HTML until this script runs (see pay.html)
  button.disabled = false;
  const SAVED = ["name", "phone", "email"]; // not the address: on a shared computer the next person would see it

  const rupees = (v) => Number(String(v).replace(/[,₹\s]/g, ""));
  const inr = (n) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const okAmount = (n) => Number.isFinite(n) && n >= 1 && n <= 500000;
  const mobile = (v) => String(v).replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""); // "+91 98765-43210" -> "9876543210"

  // Same rules as api/razorpay-order.js; every field is required.
  const RULES = {
    amount: [(v) => okAmount(rupees(v)), "Enter an amount between ₹1 and ₹5,00,000."],
    name: [(v) => v.trim().length >= 2, "Enter your full name."],
    phone: [(v) => /^[6-9]\d{9}$/.test(mobile(v)), "Enter a valid 10-digit mobile number."],
    email: [(v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), "Enter a valid email address."],
    address: [(v) => v.trim().length >= 5, "Enter your house or flat number and street."],
    city: [(v) => v.trim().length >= 2, "Enter your city."],
    state: [(v) => v !== "", "Choose your state."],
    pincode: [(v) => /^[1-9]\d{5}$/.test(v.trim()), "Enter a valid 6-digit PIN code."]
  };
  const setError = (name, text) => {
    const input = form.elements[name];
    let err = document.getElementById("err-" + name);
    if (!err) {
      err = Object.assign(document.createElement("small"), { className: "pay-err", id: "err-" + name });
      input.closest(".pay-field").append(err);
      input.setAttribute("aria-describedby", err.id);
    }
    err.textContent = text;
    err.hidden = !text;
    input.setAttribute("aria-invalid", String(!!text));
  };
  const invalidFields = () => Object.keys(RULES).filter((name) => {
    const [ok, text] = RULES[name];
    const bad = !ok(form.elements[name].value);
    setError(name, bad ? text : "");
    return bad;
  });

  // Guided filling: Enter / "Next" moves on, a chosen state or a complete PIN moves on by itself,
  // each field is checked when you leave it, and a finished step shows a green tick.
  const ORDER = ["amount", "name", "phone", "email", "address", "city", "state", "pincode"];
  // Move on once this many digits are typed. Not the phone: "+91 98765 43210" reaches 10 digits at "+91 98765 432".
  const AUTO_NEXT = { pincode: 6 };
  const valid = (name) => RULES[name][0](form.elements[name].value);
  const next = (name) => { const after = ORDER[ORDER.indexOf(name) + 1]; (after ? form.elements[after] : button).focus(); };
  const steps = [...form.querySelectorAll(".pay-sec")];
  const markSteps = () => steps.forEach((sec) =>
    sec.classList.toggle("is-done", [...sec.querySelectorAll("[name]")].filter((el) => RULES[el.name]).every((el) => valid(el.name))));
  const shake = (el) => { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const setBusy = (text) => {
    button.disabled = !!text;
    button.classList.toggle("is-busy", !!text);
    if (text) button.textContent = text; else update();
  };

  const update = () => {
    const n = rupees(amountInput.value);
    document.getElementById("sumAmount").textContent = okAmount(n) ? inr(n) : "₹0";
    document.getElementById("sumFor").textContent = form.elements.purpose.value;
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
    SAVED.forEach((k) => { if (saved[k] && !form.elements[k].value) form.elements[k].value = k === "phone" ? mobile(saved[k]) : saved[k]; });
  } catch {}
  update();
  markSteps();
  form.addEventListener("input", (e) => {
    const { name, value } = e.target;
    if (RULES[name]) {
      if (e.target.getAttribute("aria-invalid") === "true" && valid(name)) setError(name, "");
      if (msg.dataset.fields && !form.querySelector('[aria-invalid="true"]')) msg.hidden = true;
      if (AUTO_NEXT[name] && (e.inputType || "").startsWith("insert") && value.replace(/\D/g, "").length >= AUTO_NEXT[name] && valid(name)) next(name);
    }
    markSteps();
    update();
  });
  form.addEventListener("change", (e) => {
    if (e.target.name === "state" && valid("state")) { setError("state", ""); next("state"); }
    markSteps();
    update();
  });
  form.addEventListener("focusout", (e) => {
    const { name, value } = e.target;
    if (RULES[name] && value.trim()) setError(name, valid(name) ? "" : RULES[name][1]); // empty fields are only flagged on Pay
  });
  form.addEventListener("keydown", (e) => {
    const el = e.target;
    if (e.key !== "Enter" || !RULES[el.name] || el.tagName === "SELECT") return;
    e.preventDefault();
    if (!valid(el.name)) { setError(el.name, RULES[el.name][1]); shake(el); return; }
    if (el.name === "pincode") form.requestSubmit(); else next(el.name);
  });
  form.addEventListener("animationend", (e) => e.target.classList.remove("shake"));
  // On a computer, start in the first field still to fill (on phones this would pop the keyboard up uninvited).
  if (matchMedia("(pointer: fine)").matches) { const first = ORDER.find((n) => !valid(n)); if (first) form.elements[first].focus({ preventScroll: true }); }

  const show = (text, link) => {
    delete msg.dataset.fields; // only the "fill in" note hides itself as fields are fixed
    msg.textContent = text;
    if (link) {
      const a = document.createElement("a");
      a.href = link.href; a.target = "_blank"; a.rel = "noopener"; a.textContent = link.text;
      msg.append(" ", a, link.after || "");
    }
    msg.hidden = false;
  };

  // Success screen: swaps in for the form and summary; showing it again replays the tick animation (see packages.css).
  const done = document.getElementById("payDone");
  const showDone = (info) => {
    for (const k in info) document.getElementById("payDone" + k[0].toUpperCase() + k.slice(1)).textContent = info[k];
    const swap = () => {
      form.classList.remove("is-leaving"); summary.classList.remove("is-leaving");
      form.hidden = true; summary.hidden = true; done.hidden = false;
      document.getElementById("payDoneTitle").focus({ preventScroll: true });
      done.scrollIntoView({ block: "start" }); // taller than a phone screen, so show the tick first
    };
    if (reduced) return swap();
    form.classList.add("is-leaving"); summary.classList.add("is-leaving"); // fade out, then the tick draws in
    setTimeout(swap, 260);
  };
  document.getElementById("payAgain").addEventListener("click", () => {
    done.hidden = true; form.hidden = false; summary.hidden = false; msg.hidden = true;
    amountInput.value = ""; update(); markSteps(); amountInput.focus();
  });

  const fullAddress = (d) => d.address + ", " + d.city + ", " + d.state + " " + d.pincode;
  const waLink = (d, amount) => "https://wa.me/919119687579?text=" + encodeURIComponent(
    "Hi Socio Craftco, I'd like to pay " + inr(amount) + " (" + d.purpose + (d.invoice ? ", invoice " + d.invoice : "") +
    "). Name: " + d.name + ", email: " + d.email + ", phone: " + d.phone + ", address: " + fullAddress(d) + ".");
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
    if (button.disabled) return; // already opening checkout or confirming: no second order
    const bad = invalidFields();
    if (bad.length) {
      show("Please fill in the " + (bad.length === 1 ? "highlighted field" : bad.length + " highlighted fields") + " to continue.");
      msg.dataset.fields = "1";
      bad.forEach((name) => shake(form.elements[name]));
      form.elements[bad[0]].focus();
      return;
    }
    const amount = Math.round(rupees(amountInput.value) * 100) / 100;
    const d = Object.fromEntries(new FormData(form));
    for (const k in d) d[k] = d[k].trim();
    d.phone = mobile(d.phone);
    try { localStorage.setItem("sc-payer", JSON.stringify(Object.fromEntries(SAVED.map((k) => [k, d[k]])))); } catch {}
    d.phone = "+91" + d.phone;

    msg.hidden = true;
    setBusy("Opening secure checkout…");
    let pending = false; // true while the Razorpay window is open and nothing has happened yet
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
          pending = false;
          setBusy("Confirming your payment…");
          const check = await post("/api/razorpay-verify", paid).catch(() => ({}));
          setBusy(null);
          if (check.ok) {
            showDone({ amount: inr(amount), for: d.purpose, ref: order.reference, id: paid.razorpay_payment_id, email: d.email });
          } else {
            show("We could not confirm this payment yet. If money left your account, email sociocraftco@gmail.com with reference " + order.reference + " and Payment ID " + paid.razorpay_payment_id + ".");
          }
        },
        modal: { ondismiss: () => { if (pending) show("Payment cancelled. Nothing was charged."); pending = false; } }
      });
      rzp.on("payment.failed", (r) => (pending = false, show("Payment failed: " + ((r.error && r.error.description) || "please try again") + ". You can try again; if money was debited, your bank returns it.")));
      pending = true;
      rzp.open();
    } catch {
      show("Could not reach the payment service. Please check your connection and try again.");
    } finally {
      setBusy(null);
    }
  });
})();
