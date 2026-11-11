"use strict";

(() => {
  const WA_NUMBER = document.querySelector('meta[name="wa-number"]').content;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TYPES = {
    clinic: {
      label: "Clinic & healthcare",
      badge: "Trusted local care",
      headline: "Care that puts you first.",
      summary: "Simple appointments, clear information and a team that is ready when you need support.",
      services: ["Consultations", "Preventive care", "Follow-up support"],
      greeting: "Hi! I can explain our services, help with timings or start an appointment request.",
      proof: "Trusted by families across the local community"
    },
    restaurant: {
      label: "Restaurant & café",
      badge: "Fresh every day",
      headline: "Good food deserves a good table.",
      summary: "Explore the menu, check timings and reserve your visit in a few simple steps.",
      services: ["Signature dishes", "Table reservations", "Private events"],
      greeting: "Welcome! I can help with the menu, timings, dietary questions or a table request.",
      proof: "Fresh ingredients, warm service and memorable meals"
    },
    retail: {
      label: "Retail & online store",
      badge: "Made for modern shopping",
      headline: "Products your customers will remember.",
      summary: "A fast, focused shopping experience that makes discovery and buying feel effortless.",
      services: ["New arrivals", "Curated collections", "Delivery support"],
      greeting: "Hi! Tell me what you are looking for and I will help you find the right option.",
      proof: "Secure ordering and responsive customer support"
    },
    coaching: {
      label: "Coaching & education",
      badge: "Learn with direction",
      headline: "A clearer path to better results.",
      summary: "Discover programmes, understand the learning process and request a counselling session.",
      services: ["Expert-led classes", "Progress tracking", "Personal guidance"],
      greeting: "Hi! I can explain courses, batches, eligibility or help arrange a counselling call.",
      proof: "Structured learning with measurable progress"
    },
    realestate: {
      label: "Real estate",
      badge: "Property decisions made clearer",
      headline: "Find a place that fits your future.",
      summary: "Explore suitable properties, compare priorities and request a guided site visit.",
      services: ["Verified listings", "Site visits", "Buying guidance"],
      greeting: "Hello! Share your preferred property type and location, and I will guide you.",
      proof: "Local insight from enquiry to handover"
    },
    services: {
      label: "Professional services",
      badge: "Clarity before commitment",
      headline: "Expert work, explained simply.",
      summary: "Understand the service, see the process and start a focused conversation with the team.",
      services: ["Consultation", "Custom solutions", "Ongoing support"],
      greeting: "Hi! I can explain the services, process, timelines or collect details for the team.",
      proof: "Clear scope, accountable delivery and dependable support"
    }
  };

  const GOALS = {
    leads: {
      label: "Generate qualified enquiries",
      cta: "Request a consultation",
      assistant: "I can answer initial questions and collect the details your team needs."
    },
    bookings: {
      label: "Increase bookings",
      cta: "Request a booking",
      assistant: "I can guide visitors toward the right service and start a booking request."
    },
    sales: {
      label: "Sell products or services",
      cta: "Explore what we offer",
      assistant: "I can recommend suitable options and help visitors take the next step."
    },
    support: {
      label: "Automate customer support",
      cta: "Ask our assistant",
      assistant: "I can handle common questions and pass complex requests to the team."
    }
  };

  const DEFAULT = {
    name: "Your Business",
    type: "services",
    goal: "leads",
    style: "minimal",
    color: "#0150FD",
    services: []
  };

  const state = {
    config: { ...DEFAULT },
    generated: false,
    unlocked: false,
    lead: null
  };

  const els = {
    form: $("#previewBuilder"),
    name: $("#pName"),
    type: $("#pType"),
    goal: $("#pGoal"),
    services: $("#pServices"),
    empty: $("#previewEmpty"),
    experience: $("#previewExperience"),
    shell: $("#pPreviewShell"),
    website: $("#pWebsite"),
    chat: $("#pChat"),
    gate: $("#pGate"),
    unlocked: $("#pUnlocked"),
    unlockDialog: $("#pUnlockDialog"),
    leadForm: $("#pLeadForm"),
    shareUrl: $("#pShareUrl"),
    copy: $("#pCopy"),
    quote: $("#pQuote"),
    status: $("#pStatus")
  };

  if (!els.form) return;

  const clean = (value, max = 80) => String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const validColor = (value) => /^#[0-9A-F]{6}$/i.test(value) ? value.toUpperCase() : DEFAULT.color;
  const slug = (value) => clean(value, 40).toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 28) || "yourbusiness";
  const parseServices = (value) => clean(value, 180).split(",").map((item) => clean(item, 32)).filter(Boolean).slice(0, 3);

  function sanitise(input) {
    const type = Object.prototype.hasOwnProperty.call(TYPES, input.type) ? input.type : DEFAULT.type;
    const goal = Object.prototype.hasOwnProperty.call(GOALS, input.goal) ? input.goal : DEFAULT.goal;
    const style = ["minimal", "bold", "premium"].includes(input.style) ? input.style : DEFAULT.style;
    return {
      name: clean(input.name, 40) || DEFAULT.name,
      type,
      goal,
      style,
      color: validColor(input.color),
      services: Array.isArray(input.services)
        ? input.services.map((item) => clean(item, 32)).filter(Boolean).slice(0, 3)
        : []
    };
  }

  function readConfig() {
    const selectedStyle = $("#pStyle [aria-checked='true']");
    const selectedColor = $("#pColor [aria-checked='true']");
    return sanitise({
      name: els.name.value,
      type: els.type.value,
      goal: els.goal.value,
      style: selectedStyle ? selectedStyle.dataset.value : DEFAULT.style,
      color: selectedColor ? selectedColor.dataset.color : DEFAULT.color,
      services: parseServices(els.services.value)
    });
  }

  function applyConfig(config) {
    els.name.value = config.name;
    els.type.value = config.type;
    els.goal.value = config.goal;
    els.services.value = config.services.join(", ");

    $$("#pStyle [role='radio']").forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.value === config.style));
      button.tabIndex = button.dataset.value === config.style ? 0 : -1;
    });
    $$("#pColor [role='radio']").forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.color.toUpperCase() === config.color));
      button.tabIndex = button.dataset.color.toUpperCase() === config.color ? 0 : -1;
    });
  }


  function sceneMarkup(config) {
    const type = TYPES[config.type];
    const services = config.services.length ? config.services : type.services;
    const scenes = {
      clinic: [
        '<div class="p-scene p-scene-clinic">',
        '<div class="p-scene-label"><i></i><span>Appointments open today</span></div>',
        '<div class="p-appointment-card"><small>Next available</small><strong>4:30 PM</strong><span>General consultation</span></div>',
        '<div class="p-calendar-row"><b>Mon</b><b>Tue</b><b class="active">Wed</b><b>Thu</b><b>Fri</b></div>',
        '</div>'
      ].join(""),
      restaurant: [
        '<div class="p-scene p-scene-restaurant">',
        '<div class="p-plate"><span>Chef’s<br>choice</span></div>',
        '<div class="p-menu-ticket"><small>Tonight’s table</small><strong>Seasonal menu</strong><span>Reserve in under a minute</span></div>',
        '</div>'
      ].join(""),
      retail: [
        '<div class="p-scene p-scene-retail">',
        '<div class="p-product product-one"><span>New</span></div>',
        '<div class="p-product product-two"></div>',
        '<div class="p-product product-three"></div>',
        '<div class="p-retail-caption"><small>Curated for you</small><strong>' + escapeHtml(services[0]) + '</strong></div>',
        '</div>'
      ].join(""),
      coaching: [
        '<div class="p-scene p-scene-coaching">',
        '<div class="p-course-head"><span>Learning path</span><b>72%</b></div>',
        '<div class="p-progress"><i></i></div>',
        '<div class="p-lesson active"><b>01</b><span>Core concepts</span><i>Done</i></div>',
        '<div class="p-lesson"><b>02</b><span>Guided practice</span><i>Next</i></div>',
        '<div class="p-lesson"><b>03</b><span>Progress review</span><i>Later</i></div>',
        '</div>'
      ].join(""),
      realestate: [
        '<div class="p-scene p-scene-realestate">',
        '<div class="p-property-sky"></div><div class="p-property-home"><i></i><i></i><i></i></div>',
        '<div class="p-property-meta"><small>Featured property</small><strong>Space for the next chapter</strong><span>Verified listing · Site visit available</span></div>',
        '</div>'
      ].join(""),
      services: [
        '<div class="p-scene p-scene-services">',
        '<div class="p-brief-top"><span>Project brief</span><i>In review</i></div>',
        '<strong>' + escapeHtml(config.name) + '</strong>',
        '<div class="p-brief-line wide"></div><div class="p-brief-line"></div>',
        '<div class="p-brief-steps"><span class="done">Discover</span><span class="active">Design</span><span>Deliver</span></div>',
        '</div>'
      ].join("")
    };
    return scenes[config.type] || scenes.services;
  }

  function websiteMarkup(config) {
    const type = TYPES[config.type];
    const goal = GOALS[config.goal];
    const services = config.services.length ? config.services : type.services;
    const pages = state.unlocked
      ? ["Home", "Services", "About", "Contact"]
      : ["Home", "Services"];

    return [
      '<div class="p-site" data-style="' + escapeHtml(config.style) + '" data-industry="' + escapeHtml(config.type) + '" style="--preview-brand:' + escapeHtml(config.color) + '">',
      '  <header class="p-site-head">',
      '    <div class="p-site-logo"><span>' + escapeHtml(config.name.charAt(0).toUpperCase()) + '</span>' + escapeHtml(config.name) + '</div>',
      '    <nav aria-label="Preview pages">' + pages.map((page) => '<button type="button">' + page + '</button>').join("") + '</nav>',
      '    <button class="p-site-cta" type="button">' + escapeHtml(goal.cta) + '</button>',
      '  </header>',
      '  <main>',
      '    <section class="p-site-hero">',
      '      <div><p class="p-site-badge">' + escapeHtml(type.badge) + '</p>',
      '      <h3>' + escapeHtml(type.headline) + '</h3>',
      '      <p>' + escapeHtml(type.summary) + '</p>',
      '      <button class="p-site-cta" type="button">' + escapeHtml(goal.cta) + '</button></div>',
      '      <div class="p-site-scene" aria-hidden="true">' + sceneMarkup(config) + '</div>',
      '    </section>',
      '    <section class="p-site-services">',
      '      <div class="p-site-section-head"><small>WHAT WE DO</small><h4>Built around what your customers need.</h4></div>',
      '      <div class="p-service-grid">' + services.map((service, index) =>
        '<article><b>0' + (index + 1) + '</b><h5>' + escapeHtml(service) + '</h5><p>Clear information, a simple next step and support when it matters.</p></article>'
      ).join("") + '</div>',
      '    </section>',
      state.unlocked
        ? '    <section class="p-site-proof"><p>“' + escapeHtml(type.proof) + '.”</p><span>Customer experience preview</span></section>'
        : '    <section class="p-site-locked"><span>Full About, proof and Contact sections unlocked</span></section>',
      '  </main>',
      '  <footer><span>' + escapeHtml(config.name) + '</span><span>Preview by Socio Craftco</span></footer>',
      '</div>'
    ].join("");
  }

  function assistantMarkup(config) {
    const type = TYPES[config.type];
    const goal = GOALS[config.goal];
    const services = config.services.length ? config.services : type.services;
    const questions = state.unlocked
      ? ["What do you offer?", "How can I get started?", "Talk to your team"]
      : ["What do you offer?", "How can you help?"];

    return [
      '<div class="p-chat-head"><span>' + escapeHtml(config.name.charAt(0).toUpperCase()) + '</span>',
      '<div><strong>' + escapeHtml(config.name) + '</strong><small>AI assistant preview · online</small></div></div>',
      '<div class="p-chat-body" id="pChatBody">',
      '<div class="p-chat-note">Preview conversation — no message is being sent</div>',
      '<div class="p-message bot">' + escapeHtml(type.greeting) + '</div>',
      '<div class="p-message bot">' + escapeHtml(goal.assistant) + '</div>',
      '</div>',
      '<div class="p-chat-actions">' + questions.map((question) =>
        '<button type="button" data-question="' + escapeHtml(question) + '">' + escapeHtml(question) + '</button>'
      ).join("") + '</div>',
      '<form class="p-chat-input" id="pChatComposer"><input type="text" maxlength="120" autocomplete="off" aria-label="Test a question" placeholder="Ask a question…"><button type="submit" aria-label="Send simulated message">➤</button></form>',
      '<script type="application/json" data-preview-services>' + JSON.stringify(services).replace(/</g, "\\u003c") + '</script>'
    ].join("");
  }

  function render(config, options = {}) {
    state.config = sanitise(config);
    state.generated = true;
    if (options.unlocked !== undefined) state.unlocked = Boolean(options.unlocked);

    els.website.innerHTML = websiteMarkup(state.config);
    els.chat.innerHTML = assistantMarkup(state.config);
    $(".p-browser-url").textContent = slug(state.config.name) + ".in";
    els.shell.style.setProperty("--preview-brand", state.config.color);
    els.shell.dataset.style = state.config.style;
    els.empty.hidden = true;
    els.experience.hidden = false;
    els.gate.hidden = state.unlocked;
    els.unlocked.hidden = !state.unlocked;
    els.status.textContent = state.unlocked
      ? "Full personalised preview"
      : "Basic preview ready — unlock the complete experience";

    if (state.unlocked) {
      els.shareUrl.value = shareUrl(state.config);
    }

    if (options.scroll !== false) {
      els.experience.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }

  function encodeConfig(config) {
    const bytes = new TextEncoder().encode(JSON.stringify(sanitise(config)));
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeConfig(value) {
    try {
      const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      return sanitise(JSON.parse(new TextDecoder().decode(bytes)));
    } catch {
      return null;
    }
  }

  function shareUrl(config) {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("pv", encodeConfig(config));
    url.searchParams.set("shared", "1");
    url.hash = "demos";
    return url.toString();
  }

  function quoteMessage(lead = state.lead) {
    const config = state.config;
    const type = TYPES[config.type];
    const goal = GOALS[config.goal];
    const services = config.services.length ? config.services.join(", ") : type.services.join(", ");
    return [
      "Hi Socio Craftco, I created a personalised preview and want an exact quotation.",
      "",
      "Preview: " + shareUrl(config),
      "Business: " + config.name,
      "Industry: " + type.label,
      "Primary goal: " + goal.label,
      "Style: " + config.style,
      "Brand colour: " + config.color,
      "Services: " + services,
      lead ? "Name: " + lead.name : null,
      lead ? "WhatsApp: " + lead.phone : null,
      lead ? "Timeline: " + lead.timeline : null,
      "",
      "Please review this configuration and contact me with the next steps."
    ].filter(Boolean).join("\n");
  }

  function openWhatsApp(message) {
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message), "_blank", "noopener");
  }

  function setRadio(group, button, dataKey) {
    const buttons = $$("[role='radio']", group);
    buttons.forEach((item) => {
      const active = item === button;
      item.setAttribute("aria-checked", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    if (state.generated) render(readConfig(), { unlocked: state.unlocked, scroll: false });
  }

  function bindRadioGroup(group, dataKey) {
    const buttons = $$("[role='radio']", group);
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => setRadio(group, button, dataKey));
      button.addEventListener("keydown", (event) => {
        const direction = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!direction) return;
        event.preventDefault();
        const next = buttons[(index + direction + buttons.length) % buttons.length];
        setRadio(group, next, dataKey);
        next.focus();
      });
    });
  }

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!els.form.reportValidity()) return;
    state.unlocked = false;
    render(readConfig());
  });

  ["input", "change"].forEach((eventName) => {
    els.form.addEventListener(eventName, (event) => {
      if (!state.generated || event.target.type === "submit") return;
      render(readConfig(), { unlocked: state.unlocked, scroll: false });
    });
  });

  bindRadioGroup($("#pStyle"), "style");
  bindRadioGroup($("#pColor"), "color");

  $("#pUnlockOpen").addEventListener("click", () => {
    if (typeof els.unlockDialog.showModal === "function") els.unlockDialog.showModal();
    else els.unlockDialog.setAttribute("open", "");
  });

  $("#pUnlockClose").addEventListener("click", () => els.unlockDialog.close());

  els.leadForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!els.leadForm.reportValidity()) return;
    const data = new FormData(els.leadForm);
    state.lead = {
      name: clean(data.get("name"), 50),
      phone: clean(data.get("phone"), 20),
      timeline: clean(data.get("timeline"), 40)
    };
    state.unlocked = true;
    render(state.config, { unlocked: true, scroll: false });
    els.unlockDialog.close();
    const c = state.config;
    window.saveLead({
      source: "preview", name: state.lead.name, contact: state.lead.phone, timeline: state.lead.timeline,
      business: c.name, service: "Website + AI assistant (preview)",
      message: [TYPES[c.type].label, GOALS[c.goal].label, c.style, c.services.join(", ")].filter(Boolean).join(" | ")
    });
    openWhatsApp(quoteMessage());
  });

  $("#pView").addEventListener("click", (event) => {
    const button = event.target.closest("[data-size]");
    if (!button) return;
    if (button.dataset.size === "mobile" && !state.unlocked) {
      $("#pUnlockOpen").click();
      return;
    }
    $$("#pView [role='radio']").forEach((item) => {
      item.setAttribute("aria-checked", String(item === button));
      item.tabIndex = item === button ? 0 : -1;
    });
    els.shell.dataset.size = button.dataset.size;
  });


  function appendChatMessage(question, response) {
    const body = $("#pChatBody");
    if (!body) return;
    body.insertAdjacentHTML("beforeend",
      '<div class="p-message user">' + escapeHtml(question) + '</div>' +
      '<div class="p-message bot">' + escapeHtml(response) + '</div>'
    );
    body.scrollTop = body.scrollHeight;
  }

  function assistantReply(question) {
    const query = clean(question, 120).toLowerCase();
    const type = TYPES[state.config.type];
    const goal = GOALS[state.config.goal];
    const services = state.config.services.length ? state.config.services : type.services;

    if (/price|cost|charge|fee|quote/.test(query)) {
      return "Pricing depends on what you need. I can collect a few details so the team can prepare an exact quotation.";
    }
    if (/time|hour|open|close|available/.test(query)) {
      return "I can help check availability and pass your preferred time to the team.";
    }
    if (/book|appointment|reserve|visit|call/.test(query)) {
      return "Tell me your preferred day and contact details, and I can start the request for the team.";
    }
    if (/human|person|team|agent|contact/.test(query)) {
      return "I can collect your name and WhatsApp number so the right person can continue the conversation.";
    }
    if (/service|offer|product|course|property|menu/.test(query)) {
      return "We can help with " + services.join(", ") + ". Which option would you like to explore?";
    }
    if (/hello|hi|hey/.test(query)) {
      return type.greeting;
    }
    return goal.assistant + " Ask about services, availability, bookings or speaking with the team.";
  }

  els.chat.addEventListener("click", (event) => {
    const button = event.target.closest("[data-question]");
    if (!button) return;
    const body = $("#pChatBody");
    const servicesData = $("[data-preview-services]", els.chat);
    const services = servicesData ? JSON.parse(servicesData.textContent) : [];
    const question = button.dataset.question;
    const type = TYPES[state.config.type];
    const responses = {
      "What do you offer?": "We can help with " + services.join(", ") + ". Which one would you like to know more about?",
      "How can you help?": GOALS[state.config.goal].assistant,
      "How can I get started?": "Tell me what you need and I will collect the right details for the " + state.config.name + " team.",
      "Talk to your team": "Of course. I can collect your name and contact number so the team can continue the conversation."
    };
    appendChatMessage(question, responses[question] || type.greeting);
    button.disabled = true;
  });


  els.chat.addEventListener("submit", (event) => {
    const composer = event.target.closest("#pChatComposer");
    if (!composer) return;
    event.preventDefault();
    const input = $("input", composer);
    const question = clean(input.value, 120);
    if (!question) return;
    appendChatMessage(question, assistantReply(question));
    input.value = "";
    input.focus();
  });

  els.copy.addEventListener("click", async () => {
    const value = els.shareUrl.value;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      els.shareUrl.select();
      document.execCommand("copy");
    }
    const original = els.copy.textContent;
    els.copy.textContent = "Copied";
    setTimeout(() => { els.copy.textContent = original; }, 1800);
  });

  els.quote.addEventListener("click", () => openWhatsApp(quoteMessage()));

  const params = new URLSearchParams(window.location.search);
  const shared = params.get("shared") === "1";
  const incoming = params.get("pv") ? decodeConfig(params.get("pv")) : null;
  if (incoming) {
    applyConfig(incoming);
    state.unlocked = shared;
    render(incoming, { unlocked: shared, scroll: false });
    const previewTab = $("#tab-preview");
    if (previewTab) previewTab.click();
  }
})();
