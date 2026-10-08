"use strict";
(() => {
  const WA_NUMBER = "919119687579";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const waUrl = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  const openWa = (msg) => window.open(waUrl(msg), "_blank", "noopener");
  const inr = (n) => "₹" + n.toLocaleString("en-IN");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  $$(".js-wa").forEach((a) => {
    a.href = waUrl(a.dataset.message || "Hi Socio Craftco");
    a.target = "_blank";
    a.rel = "noopener";
  });
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Navigation ---------- */
  const nav = $("#siteNav");
  const menuBtn = $("#menuBtn");
  const setMenu = (open) => {
    nav.dataset.open = String(open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  menuBtn.addEventListener("click", () => setMenu(nav.dataset.open !== "true"));
  $$(".nav-links a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("click", (e) => { if (nav.dataset.open === "true" && !nav.contains(e.target)) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.dataset.open === "true") { setMenu(false); menuBtn.focus(); } });
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Shared: radio groups (click + arrow keys) ---------- */
  const radio = (group, onChange) => {
    const items = $$("[role=radio]", group);
    const choose = (btn, focus) => {
      items.forEach((b) => {
        const on = b === btn;
        b.setAttribute("aria-checked", String(on));
        b.tabIndex = on ? 0 : -1;
      });
      if (focus) btn.focus();
      onChange(btn);
    };
    items.forEach((btn, i) => {
      btn.tabIndex = btn.getAttribute("aria-checked") === "true" ? 0 : -1;
      btn.addEventListener("click", () => choose(btn, false));
      btn.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        choose(items[(i + step + items.length) % items.length], true);
      });
    });
  };

  /* ---------- Store builder ---------- */
  const CATALOG = {
    fashion: {
      icon: "p-shirt", head: "New season, made by hand.", sub: "Handloom and block-print pieces, made in small batches.", cta: "Shop the collection",
      chips: ["All", "Kurtas", "Sarees", "Co-ords", "Dupattas", "Jackets"],
      items: [["Indigo Block-Print Kurta", 1499, "New"], ["Linen Co-ord Set", 2299], ["Handloom Cotton Saree", 3199, "Bestseller"], ["Embroidered Dupatta", 899], ["Everyday Denim Jacket", 2499], ["Chikankari Top", 1199]]
    },
    bakery: {
      icon: "p-cake", head: "Baked fresh every morning.", sub: "Cakes, breads and mithai, delivered the same day.", cta: "Order for today",
      chips: ["All", "Cakes", "Breads", "Cookies", "Mithai", "Gift boxes"],
      items: [["Belgian Chocolate Cake", 899, "Bestseller"], ["Almond Biscotti, 250g", 349], ["Sourdough Loaf", 220, "Fresh"], ["Red Velvet Cupcakes, 6", 540], ["Kaju Katli, 500g", 650], ["Blueberry Cheesecake", 1099]]
    },
    electronics: {
      icon: "p-audio", head: "Gadgets that keep up with you.", sub: "Genuine products, GST invoice and 1-year warranty.", cta: "Shop gadgets",
      chips: ["All", "Audio", "Wearables", "Chargers", "Accessories"],
      items: [["Wireless Earbuds Pro", 2999, "New"], ["20,000mAh Power Bank", 1799], ["Smart Fitness Band", 2499, "Bestseller"], ["Bluetooth Speaker", 1999], ["65W Fast Charger", 1299], ["Mechanical Keyboard", 3499]]
    },
    beauty: {
      icon: "p-bottle", head: "Skincare rooted in Ayurveda.", sub: "Clean ingredients, dermatologically tested.", cta: "Find your routine",
      chips: ["All", "Face", "Hair", "Body", "Combos"],
      items: [["Vitamin C Face Serum", 699, "Bestseller"], ["Kumkumadi Night Oil", 899], ["Aloe Gel Moisturiser", 399], ["SPF 50 Sunscreen", 549, "New"], ["Rose Water Toner", 299], ["Ubtan Face Pack", 449]]
    },
    crafts: {
      icon: "p-vase", head: "Crafted by artisans across India.", sub: "Every piece is handmade and signed by its maker.", cta: "Explore the craft",
      chips: ["All", "Pottery", "Wall art", "Brass", "Baskets"],
      items: [["Blue Pottery Vase", 1250, "Handmade"], ["Madhubani Wall Art", 2800], ["Brass Diya Set", 950, "Bestseller"], ["Jute Storage Basket", 699], ["Terracotta Planter", 549], ["Carved Wooden Box", 1150]]
    },
    home: {
      icon: "p-lamp", head: "Make your home feel like you.", sub: "Decor and essentials, designed in India.", cta: "Shop the edit",
      chips: ["All", "Lighting", "Textiles", "Dining", "Decor"],
      items: [["Linen Cushion Covers, 2", 899], ["Rattan Pendant Lamp", 2499, "Bestseller"], ["Ceramic Dinner Set", 3299], ["Cotton Dhurrie Rug", 1999, "New"], ["Wooden Wall Clock", 1199], ["Scented Soy Candle", 599]]
    }
  };

  const st = { name: "Kaari Studio", cat: "fashion", color: "#0150FD", style: "minimal", offer: "Free delivery on orders above ₹999", cod: true, cart: {} };
  const store = $("#store");
  const device = $("#device");

  const slug = (s) => (s.toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourstore") + ".in";
  const inkFor = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return l > 0.62 ? "#15171C" : "#FFFFFF";
  };
  // Reads the offer banner: "free delivery above ₹999" -> 999, "free delivery on all orders" -> 0, otherwise null.
  const freeAbove = () => {
    const text = st.offer.replace(/,/g, "");
    if (!/free\s+(delivery|shipping)/i.test(text)) return null;
    const m = text.match(/(?:₹|rs\.?|inr)\s?(\d+)/i);
    return m ? Number(m[1]) : 0;
  };
  const productIcon = () => CATALOG[st.cat].icon;

  function renderBrand() {
    const name = st.name.trim() || "Your Store";
    $("#storeName").textContent = name;
    $("#storeInitial").textContent = name.charAt(0).toUpperCase();
    $("#storeUrl").textContent = slug(name);
    $("#storeCopy").textContent = "© " + name;
    store.style.setProperty("--brand", st.color);
    store.style.setProperty("--brand-ink", inkFor(st.color));
    store.dataset.style = st.style;
    const offer = $("#storeOffer");
    offer.textContent = st.offer;
    offer.hidden = !st.offer.trim();
    $("#trustPay").textContent = st.cod ? "UPI, cards and COD" : "UPI and cards";
    $("#codBadge").hidden = !st.cod;
  }

  function renderCatalog() {
    const c = CATALOG[st.cat];
    $("#heroHead").textContent = c.head;
    $("#heroSub").textContent = c.sub;
    $(".store-hero .store-btn").textContent = c.cta;
    $("#heroIcon").setAttribute("href", "#" + c.icon);
    $("#storeChips").innerHTML = c.chips.map((x) => `<span>${x}</span>`).join("");
    $("#productCount").textContent = c.items.length + " products";
    const tints = [14, 22, 10, 26, 18, 12];
    $("#storeGrid").innerHTML = c.items.map(([name, price, tag], i) => `
      <div class="product" style="--i:${i}">
        <div class="product-img" style="--tint:${tints[i]}%">
          ${tag ? `<span class="product-tag">${tag}</span>` : ""}
          <svg aria-hidden="true"><use href="#${c.icon}"/></svg>
        </div>
        <div class="product-name">${name}</div>
        <div class="product-row"><span class="product-price">${inr(price)}</span>
          <button type="button" class="product-add" data-i="${i}">Add</button></div>
      </div>`).join("");
    st.cart = {};
    renderCart();
  }

  function cartLines() {
    const items = CATALOG[st.cat].items;
    return Object.entries(st.cart).filter(([, q]) => q > 0).map(([i, q]) => ({ i: +i, q, name: items[i][0], price: items[i][1] }));
  }

  function renderCart(bump) {
    const lines = cartLines();
    const count = lines.reduce((a, l) => a + l.q, 0);
    const sub = lines.reduce((a, l) => a + l.q * l.price, 0);
    const limit = freeAbove();
    const ship = sub === 0 ? 0 : (limit !== null && sub >= limit ? 0 : 79);
    const badge = $("#cartCount");
    badge.textContent = count;
    badge.classList.toggle("has", count > 0);
    if (bump && !reduced) { badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump"); }
    $("#cartItems").innerHTML = lines.length ? lines.map((l) => `
      <div class="cart-item">
        <div class="thumb"><svg aria-hidden="true"><use href="#${productIcon()}"/></svg></div>
        <div><div>${l.name}</div>
          <div class="qty"><button type="button" data-q="-1" data-i="${l.i}" aria-label="Remove one">−</button><span>${l.q}</span><button type="button" data-q="1" data-i="${l.i}" aria-label="Add one">+</button></div></div>
        <b>${inr(l.q * l.price)}</b>
      </div>`).join("") : `<p class="cart-empty">Your cart is empty. Add a product to see the checkout.</p>`;
    $("#cartSub").textContent = inr(sub);
    $("#cartShip").textContent = ship ? inr(ship) : "Free";
    $("#cartTotal").textContent = inr(sub + ship);
    $$(".product-add").forEach((b) => {
      const added = (st.cart[b.dataset.i] || 0) > 0;
      b.classList.toggle("added", added);
      b.textContent = added ? "Added ✓" : "Add";
    });
  }

  let toastTimer;
  function storeToast(msg) {
    const t = $("#storeToast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  const drawer = $("#cartDrawer");
  const scrim = $("#cartScrim");
  const setCart = (open) => {
    drawer.classList.toggle("open", open);
    scrim.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    drawer.inert = !open;
    if (open) $("#cartClose").focus();
  };

  $("#cartBtn").addEventListener("click", () => setCart(true));
  $("#cartClose").addEventListener("click", () => setCart(false));
  scrim.addEventListener("click", () => setCart(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) { setCart(false); $("#cartBtn").focus(); }
  });

  $("#storeGrid").addEventListener("click", (e) => {
    const b = e.target.closest(".product-add");
    if (!b) return;
    st.cart[b.dataset.i] = (st.cart[b.dataset.i] || 0) + 1;
    renderCart(true);
    storeToast(CATALOG[st.cat].items[b.dataset.i][0] + " added to cart");
  });

  $("#cartItems").addEventListener("click", (e) => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    st.cart[b.dataset.i] = Math.max(0, (st.cart[b.dataset.i] || 0) + Number(b.dataset.q));
    renderCart();
  });

  $("#checkoutBtn").addEventListener("click", () => {
    if (!cartLines().length) { storeToast("Add a product first"); return; }
    setCart(false);
    st.cart = {};
    renderCart();
    storeToast("Order placed! In your real store this opens UPI or card checkout.");
  });

  $(".store-hero .store-btn").addEventListener("click", () => {
    const screen = $("#screen");
    screen.scrollTo({ top: $("#products").offsetTop - 70, behavior: reduced ? "auto" : "smooth" });
  });

  $("#sName").addEventListener("input", (e) => { st.name = e.target.value; renderBrand(); });
  $("#sOffer").addEventListener("input", (e) => { st.offer = e.target.value; renderBrand(); renderCart(); });
  $("#sCod").addEventListener("change", (e) => { st.cod = e.target.checked; renderBrand(); });
  $("#sCat").addEventListener("change", (e) => { st.cat = e.target.value; renderCatalog(); });
  radio($("#sColor"), (b) => { st.color = b.dataset.c; renderBrand(); });
  radio($("#sStyle"), (b) => { st.style = b.dataset.v; renderBrand(); });
  radio($("#sView"), (b) => { device.dataset.size = b.dataset.v; setCart(false); });

  $("#sendStore").addEventListener("click", () => {
    const catLabel = $("#sCat").selectedOptions[0].textContent;
    openWa([
      "Hi Socio Craftco, I built a store preview on your website and I'd like a quote.",
      `Store name: ${st.name || "-"}`,
      `Category: ${catLabel}`,
      `Style: ${st.style}`,
      `Brand colour: ${st.color}`,
      `Offer: ${st.offer || "-"}`,
      `Cash on delivery: ${st.cod ? "Yes" : "No"}`
    ].join("\n"));
  });

  renderBrand();
  renderCatalog();

  /* ---------- WhatsApp AI agent ---------- */
  const BIZ = {
    clinic: {
      name: "Smile Dental Care", what: "Appointment", book: "Book appointment",
      greet: "Hi! 👋 Welcome to {name}. I'm the clinic's assistant. How can I help you today?",
      services: ["Check-up", "Teeth cleaning", "Tooth pain"],
      askService: "Sure. What is the appointment for?",
      prices: "Here are our usual charges:\n• Consultation: ₹300\n• Teeth cleaning: ₹1,200\n• Fillings: from ₹1,500\n• Root canal: from ₹4,500\n\nThe doctor confirms the final cost after a check-up.",
      place: "📍 Sector 18, Noida (opposite City Centre Mall)\n🕙 Mon–Sat, 10 AM – 8 PM\nSunday: emergencies only",
      slots: ["11:00 AM", "4:30 PM", "6:15 PM"]
    },
    restaurant: {
      name: "The Spice Route", what: "Table", book: "Reserve a table",
      greet: "Namaste! 🙏 Welcome to {name}. Want to reserve a table, see the menu or check our timings?",
      services: ["2 people", "4 people", "6+ people"],
      askService: "Lovely. How many guests?",
      prices: "Our menu highlights:\n• Starters: ₹220 – ₹380\n• Mains: ₹280 – ₹460\n• Veg / non-veg thali: ₹349 / ₹449\n\nKids under 6 eat free on Tuesdays 🎉",
      place: "📍 Hauz Khas Village, New Delhi\n🕛 Daily, 12 noon – 11:30 PM\nValet parking available",
      slots: ["1:30 PM", "8:00 PM", "9:30 PM"]
    },
    salon: {
      name: "Glow Studio", what: "Service", book: "Book a slot",
      greet: "Hi! ✨ Welcome to {name}. I can book your slot, share prices or send our location.",
      services: ["Haircut & styling", "Facial", "Bridal consultation"],
      askService: "Great choice! What would you like to book?",
      prices: "Popular services:\n• Haircut & styling: ₹600\n• Hair spa: ₹1,200\n• Classic facial: ₹1,400\n• Bridal packages: from ₹18,000",
      place: "📍 Rajouri Garden Main Market, New Delhi\n🕙 Tue–Sun, 10 AM – 8 PM (closed Monday)",
      slots: ["12:00 PM", "3:00 PM", "6:30 PM"]
    },
    realestate: {
      name: "Urban Nest Realty", what: "Site visit", book: "Book a site visit",
      greet: "Hello! 🏡 Thanks for contacting {name}. Looking to buy, or want to visit a project?",
      services: ["2 BHK", "3 BHK", "Plots"],
      askService: "Which type of property are you looking for?",
      prices: "Current projects in Gurugram, Sector 79:\n• 2 BHK: from ₹68 lakh\n• 3 BHK: from ₹95 lakh\n• Plots: from ₹1.1 crore\n\nHome loan support from leading banks.",
      place: "📍 Sales office: Golf Course Extension Road, Gurugram\n🕙 Daily, 10 AM – 7 PM\nFree pick-up for site visits",
      slots: ["11:00 AM", "2:00 PM", "5:00 PM"]
    },
    coaching: {
      name: "Apex Classes", what: "Demo class", book: "Book a free demo class",
      greet: "Hi! 📚 Welcome to {name}. I can book a free demo class, share fees or batch timings.",
      services: ["JEE Foundation", "NEET", "Class 10 Boards"],
      askService: "Which course is the demo class for?",
      prices: "Fees for the current session:\n• JEE Foundation: ₹4,500/month\n• NEET: ₹5,000/month\n• Class 10 Boards: ₹3,000/month\n\nSibling discount: 10%",
      place: "📍 Laxmi Nagar, Delhi (near Metro Gate 2)\n🕓 Batches: 7 AM, 4 PM and 6 PM, Mon–Sat",
      slots: ["Today 4 PM", "Tomorrow 7 AM", "Tomorrow 6 PM"]
    }
  };

  const agent = (() => {
    const body = $("#waBody");
    const statusEl = $("#waStatus");
    let type = "clinic";
    let bizName = BIZ.clinic.name;
    let step = "menu";
    let booking = {};
    let timers = [];
    let started = false;

    const now = () => new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    const fill = (s) => s.replace(/\{name\}/g, bizName);
    const ticks = `<svg class="ticks" viewBox="0 0 16 11" aria-label="Read"><path d="M11.1 1.2 5 7.6 2.4 5 1.3 6.1 5 9.8l7.2-7.5zM14.7 1.2 8.6 7.6l-.8-.8-1.1 1.1 1.9 1.9 7.2-7.5z" fill="currentColor"/></svg>`;
    const later = (fn, ms) => {
      const t = setTimeout(() => { timers = timers.filter((x) => x !== t); fn(); }, reduced ? 0 : ms);
      timers.push(t);
    };
    const scroll = () => { body.scrollTop = body.scrollHeight; };

    function bubble(text, side) {
      const el = document.createElement("div");
      el.className = "msg " + side;
      el.innerHTML = esc(text) + `<span class="meta">${now()}${side === "out" ? ticks : ""}</span>`;
      body.appendChild(el);
      scroll();
    }

    function buttons(list) {
      const wrap = document.createElement("div");
      wrap.className = "wa-buttons";
      list.forEach(([label, action]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.addEventListener("click", () => {
          $$("button", wrap).forEach((x) => (x.disabled = true));
          userSays(label, action);
        });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
      scroll();
    }

    function botSays(text, btns, delay = 900) {
      const typing = document.createElement("div");
      typing.className = "typing";
      typing.innerHTML = "<i></i><i></i><i></i>";
      later(() => { statusEl.textContent = "typing…"; body.appendChild(typing); scroll(); }, 250);
      later(() => {
        typing.remove();
        statusEl.textContent = "online";
        bubble(fill(text), "in");
        if (btns) buttons(btns);
      }, 250 + delay);
    }

    const B = () => BIZ[type];
    const menuButtons = () => [[B().book, "book"], ["Prices", "prices"], ["Location & timings", "place"]];

    function act(action, text) {
      const biz = B();
      if (action === "book") {
        step = "service";
        botSays(biz.askService, biz.services.map((s) => [s, "svc:" + s]));
      } else if (action.startsWith("svc:")) {
        booking.what = action.slice(4);
        step = "slot";
        botSays(`Perfect. These ${type === "coaching" ? "batches" : "slots"} are free:`, biz.slots.map((s) => [type === "coaching" ? s : "Tomorrow, " + s, "slot:" + (type === "coaching" ? s : "Tomorrow, " + s)]));
      } else if (action.startsWith("slot:")) {
        booking.when = action.slice(5);
        step = "name";
        botSays("Great! May I have your name for the booking? Just type it below 👇", [["Use a sample name", "name:Rahul Verma"]]);
      } else if (action.startsWith("name:")) {
        booking.name = action.slice(5).trim().replace(/\b\w/g, (c) => c.toUpperCase());
        step = "done";
        botSays(`Thanks ${booking.name.split(" ")[0]}! ✅ Your ${biz.what.toLowerCase()} is confirmed:\n\n${booking.what}\n${booking.when}\n\nWe'll send you a reminder 2 hours before. Anything else?`, [["Location & timings", "place"], ["That's all, thanks", "bye"]], 1300);
        later(showLead, 1700);
      } else if (action === "prices") {
        botSays(biz.prices, [[biz.book, "book"], ["Talk to a person", "human"]]);
      } else if (action === "place") {
        botSays(biz.place, [[biz.book, "book"], ["Prices", "prices"]]);
      } else if (action === "human") {
        botSays("No problem. I've let the team know and someone will reply here shortly. 🙂", null);
      } else if (action === "askname") {
        botSays("Sorry, I didn't catch that. Please type just your name, like Priya Sharma.", [["Use a sample name", "name:Rahul Verma"]]);
      } else if (action === "bye") {
        botSays(`You're welcome! Have a great day. 😊 — ${bizName}`, null);
      } else {
        botSays("I can help you book, share prices or send our location and timings. What would you like?", menuButtons());
      }
    }

    const GREETING = /^(hi+|hello|hey|namaste)\b/;
    const INTENTS = [
      ["prices", /\b(prices?|cost|fees?|rates?|charges?|kitna|kitne|menu)\b/],
      ["place", /\b(where|location|address|timings?|time|open|kahan|kab)\b/],
      ["book", /\b(book|booking|appointment|slot|table|visit|demo|reserve)\b/],
      ["human", /\b(human|person|call|talk|baat)\b/],
      ["bye", /\b(thanks?|thank you|bye|dhanyavad)\b/]
    ];
    // A name is 1-4 words of letters with no question words, e.g. "Priya Sharma".
    const NOT_A_NAME = /\b(what|where|when|why|how|who|which|is|are|can|do|does|please|tell|kya|hai|kaise|need|want)\b/;
    const looksLikeName = (text) => /^[\p{L}][\p{L} .'-]{1,39}$/u.test(text) && text.split(/\s+/).length <= 4 && !NOT_A_NAME.test(text.toLowerCase());

    function intent(text) {
      const t = text.toLowerCase().trim();
      if (GREETING.test(t)) return "hello";
      const hit = INTENTS.find(([, re]) => re.test(t));
      if (hit) return hit[0];
      if (step === "name" && looksLikeName(text.trim())) return "name:" + text.trim();
      return step === "name" ? "askname" : "fallback";
    }

    function userSays(text, action) {
      bubble(text, "out");
      const a = action || intent(text);
      if (a === "hello") botSays(B().greet, menuButtons());
      else act(a, text);
    }

    function showLead() {
      $("#leadHint").textContent = `Sent the moment the booking is confirmed, so ${bizName} can call back or prepare.`;
      $("#lName").textContent = booking.name;
      $("#lWhatLabel").textContent = B().what;
      $("#lWhat").textContent = booking.what;
      $("#lWhen").textContent = booking.when;
      $("#leadCard").hidden = false;
    }

    function reset() {
      timers.forEach(clearTimeout);
      timers = [];
      step = "menu";
      booking = {};
      body.innerHTML = `<div class="wa-day">Today</div><div class="wa-sys">🔒 Messages are end-to-end encrypted. This is a demo chat.</div>`;
      $("#leadCard").hidden = true;
      $("#leadHint").textContent = "Finish a booking in the chat. The lead your team receives appears here.";
      $("#waName").textContent = bizName;
      $("#waAvatar").textContent = bizName.charAt(0).toUpperCase();
      statusEl.textContent = "online";
      later(() => bubble("Hi, I found you on Instagram", "out"), 300);
      later(() => botSays(B().greet, menuButtons(), 1100), 600);
    }

    $("#waForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#waText");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      $$(".wa-buttons button", body).forEach((b) => (b.disabled = true));
      userSays(text);
    });

    $("#aType").addEventListener("change", (e) => {
      type = e.target.value;
      bizName = BIZ[type].name;
      $("#aName").value = bizName;
      reset();
    });

    let nameTimer;
    $("#aName").addEventListener("input", (e) => {
      bizName = e.target.value.trim() || BIZ[type].name;
      $("#waName").textContent = bizName;
      $("#waAvatar").textContent = bizName.charAt(0).toUpperCase();
      clearTimeout(nameTimer);
      nameTimer = setTimeout(reset, 700);
    });

    $("#aRestart").addEventListener("click", reset);

    $("#sendAgent").addEventListener("click", () => {
      openWa([
        "Hi Socio Craftco, I tried the WhatsApp AI agent demo on your website and want one for my business.",
        `Business type: ${$("#aType").selectedOptions[0].textContent}`,
        `Business name: ${bizName}`
      ].join("\n"));
    });

    return {
      start() { if (!started) { started = true; reset(); } }
    };
  })();

  /* ---------- Demo tabs ---------- */
  const tabs = $$(".demo-tab");
  const selectDemo = (name, focus) => {
    tabs.forEach((t) => {
      const on = t.id === "tab-" + name;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
      if (on && focus) t.focus();
    });
    if (name === "agent") agent.start();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectDemo(t.id.replace("tab-", ""), false));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      selectDemo(next.id.replace("tab-", ""), true);
    });
  });
  $$("[data-demo]").forEach((a) => a.addEventListener("click", () => selectDemo(a.dataset.demo, false)));

  /* ---------- Views: show one section at a time ---------- */
  const VIEWS = {
    home: "Socio Craftco | Websites, Apps & AI Agents for Growing Businesses",
    services: "Services | Socio Craftco",
    demos: "Live demos | Socio Craftco",
    work: "Our work | Socio Craftco",
    process: "Process | Socio Craftco",
    faq: "FAQ | Socio Craftco",
    contact: "Start a project | Socio Craftco"
  };
  const viewEls = $$("[data-view]");
  let currentView = null;

  const isView = (id) => Object.prototype.hasOwnProperty.call(VIEWS, id);

  function viewFor(hash) {
    let id;
    try { id = decodeURIComponent(hash.replace(/^#/, "")); } catch { return null; }
    if (!id || id === "top") return { view: "home" };
    if (isView(id)) return { view: id };
    const target = document.getElementById(id);
    const holder = target && target.closest("[data-view]");
    if (holder) return { view: holder.dataset.view, target };
    return null;
  }

  function showView(hash, animate) {
    // Unknown or broken links keep the current section, or open home on first load.
    const found = viewFor(hash) || (currentView ? null : { view: "home" });
    if (!found) return;
    const changed = found.view !== currentView;
    if (changed) {
      viewEls.forEach((el) => {
        const on = el.dataset.view === found.view;
        el.hidden = !on;
        el.classList.remove("view-enter");
        if (on && animate && !reduced) { void el.offsetWidth; el.classList.add("view-enter"); }
      });
      currentView = found.view;
      document.title = VIEWS[found.view];
      $$(".nav-links a").forEach((a) => {
        if (a.getAttribute("href") === "#" + found.view) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
      if (found.view === "demos" && !$("#panel-agent").hidden) agent.start();
    }
    if (found.target && found.target.dataset.view === undefined) {
      found.target.scrollIntoView({ block: "start" });
    } else if (changed || !found.target) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    if (changed && animate) {
      const heading = found.view === "home" ? $("#heroTitle") : $(`#${found.view} h2`);
      if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
    }
  }

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("hashchange", () => showView(location.hash, true));
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    const hash = a.getAttribute("href");
    if (hash === "#main") return;
    if (hash === location.hash || (hash === "#top" && !location.hash)) {
      e.preventDefault();
      showView(hash, false);
      window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
    }
  });

  /* ---------- Contact form ---------- */
  $("#leadForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.reportValidity()) return;
    const d = Object.fromEntries(new FormData(f).entries());
    openWa([
      "New project enquiry for Socio Craftco",
      `Name: ${d.name}`,
      `Business: ${d.business || "-"}`,
      `Wants: ${d.service}`,
      `Budget: ${d.budget || "Not shared"}`,
      `Timeline: ${d.timeline || "Flexible"}`,
      `Contact: ${d.contact}`,
      `Details: ${d.message || "-"}`
    ].join("\n"));
  });

  // Start loading the Work screenshots as soon as someone shows intent to open Work,
  // so the section opens without a decode stutter.
  let workWarmed = false;
  const warmWork = () => {
    if (workWarmed) return;
    workWarmed = true;
    $$("#work img").forEach((img) => {
      img.loading = "eager";
      if (img.decode) img.decode().catch(() => {});
    });
  };
  $$('a[href="#work"]').forEach((a) => ["pointerenter", "touchstart", "focus"].forEach((ev) => a.addEventListener(ev, warmWork, { passive: true, once: true })));

  showView(location.hash, false);
  if (currentView === "work") warmWork();
})();
