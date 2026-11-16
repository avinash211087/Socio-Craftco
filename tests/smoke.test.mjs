import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const [html, app, preview, previewCss, vercel, robots, sitemap] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("app.js", "utf8"),
  readFile("preview.js", "utf8"),
  readFile("preview.css", "utf8"),
  readFile("vercel.json", "utf8"),
  readFile("robots.txt", "utf8"),
  readFile("sitemap.xml", "utf8")
]);

const checks = [
  [html.includes('id="leadForm" inert'), "lead form must be inert before JavaScript loads"],
  [html.includes('id="leadSubmit" type="submit" disabled'), "lead submit must start disabled"],
  [app.includes('leadForm.removeAttribute("inert")'), "JavaScript must activate the lead form"],
  [app.includes('$("#leadSubmit").disabled = false'), "JavaScript must enable lead submission"],
  [app.includes('if (!text || pending) return;'), "chat must reject input while a reply is pending"],
  [app.includes('$$(".wa-buttons button", body)') && !/[^$]\$\(".wa-buttons button"/.test(app), "chat must invalidate all previous quick replies"],
  [app.includes('step === "service"') && app.includes('step === "slot"'), "chat must understand typed service and slot replies"],
  [html.includes('id="panel-preview"'), "personalised preview panel must remain available"],
  [html.includes('id="pUnlockDialog"'), "preview must include the lead unlock step"],
  [preview.includes("shareUrl(state.config)"), "preview must generate a shareable configuration link"],
  [preview.includes("function sceneMarkup(config)") && preview.includes("p-scene-realestate"), "preview must render distinct industry scenes"],
  [preview.includes('id="pChatComposer"') && preview.includes("assistantReply(question)"), "preview assistant must accept typed test questions"],
  [preview.includes('url.searchParams.set("pv", encodeConfig(config))') && !preview.includes('searchParams.set("phone"'), "share links must exclude contact details"],
  [!preview.includes("₹") && !previewCss.includes("₹"), "personalised preview must not expose estimated pricing"],
  [html.includes('<link rel="canonical" href="https://www.sociocraftco.in/">'), "canonical URL must stay present"],
  [/<meta name="wa-number" content="\d{10,15}">/.test(html) && !/const WA_NUMBER = "/.test(app + preview), "WhatsApp number must live only in the wa-number meta"],
  [html.includes('id="leadFallbackLink"'), "enquiry form must offer a direct WhatsApp link"],
  [html.includes('<meta name="lead-endpoint"') && app.includes("saveLead({") && preview.includes("window.saveLead({"), "both enquiry forms must save leads when an endpoint is set"],
  [vercel.includes("https://script.google.com"), "CSP must allow posting leads to Google Apps Script"],
    [robots.includes("https://www.sociocraftco.in/sitemap.xml"), "robots.txt must advertise the sitemap"],
  [sitemap.includes("https://www.sociocraftco.in/"), "sitemap must include the production homepage"],
  [vercel.includes("script-src 'self' 'sha256-WZRJfWvsnNCPcxzZwvyhovnZGqhZaC+8gPGPRbx6wTk=' https://*.razorpay.com"), "CSP must allow Razorpay Checkout"]
];

for (const [ok, message] of checks) assert.ok(ok, message);

const config = JSON.parse(vercel);
const globalRule = config.headers.find((rule) => rule.source === "/(.*)");
assert.ok(globalRule, "global Vercel headers are required");
const names = new Set(globalRule.headers.map((header) => header.key.toLowerCase()));
for (const required of ["content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy"]) {
  assert.ok(names.has(required), `missing security header: ${required}`);
}

// Razorpay review needs these pages, linked from every page footer.
const PAGES = ["packages.html", "pay.html", "contact.html", "refund.html", "delivery.html", "terms.html", "privacy.html"];
const pages = await Promise.all(PAGES.map((p) => readFile(p, "utf8")));
pages.forEach((page, i) => {
  for (const link of ["refund.html", "delivery.html", "contact.html", "terms.html", "privacy.html"])
    assert.ok(page.includes(`href="${link}"`), `${PAGES[i]} must link ${link}`);
});
const payJsSrc = await readFile("pay.js", "utf8");
assert.ok(pages[1].includes('id="payForm" novalidate inert') && payJsSrc.includes('form.removeAttribute("inert")'), "pay form must stay locked until pay.js loads");
assert.ok(payJsSrc.includes("/api/razorpay-order") && payJsSrc.includes("/api/razorpay-verify"), "pay page must create orders and verify payments on the server");
assert.ok(!/rzp_(live|test)_|key_secret|RAZORPAY_KEY_SECRET/i.test(pages[1] + payJsSrc), "no Razorpay keys in the pay page code");
// showDone fills id="payDone<Key>" for each key; a missing one would leave a paid client stuck on "Confirming…".
const doneKeys = [...payJsSrc.match(/showDone\(\{([^}]*)\}\)/)[1].matchAll(/(\w+):/g)].map((m) => m[1]);
assert.ok(doneKeys.length >= 5, "success screen details must be found in pay.js");
for (const k of ["", "Title", ...doneKeys.map((k) => k[0].toUpperCase() + k.slice(1))])
  assert.ok(pages[1].includes(`id="payDone${k}"`), `pay.html is missing id="payDone${k}" for the success screen`);

const localAssets = [html, ...pages].flatMap((doc) => [...doc.matchAll(/(?:^|\s)(?:src|href)="([^"]+)"/g)])
  .map((match) => match[1].split(/[?#]/)[0].replace(/^\//, ""))
  .filter((value) => value && !/^(?:https?:|mailto:|tel:|#|_vercel\/)/.test(value));

for (const asset of new Set(localAssets)) await access(asset);

// Chat assistant: on every page, saves to the same Sheet, and answers common questions.
const chatJs = await readFile("chat.js", "utf8");
[html, ...pages].forEach((page, i) => {
  assert.ok(page.includes('src="chat.js"') && page.includes('href="chat.css"'), `${i ? PAGES[i - 1] : "index.html"} must load the chat`);
});
const endpoint = html.match(/name="lead-endpoint" content="([^"]*)"/)[1]; // empty = WhatsApp only
assert.ok(chatJs.includes(`const LEAD_ENDPOINT = "${endpoint}"`), "chat must save leads to the same endpoint as the site");
const sandbox = {};
(await import("node:vm")).runInNewContext(chatJs, sandbox);
const { match, detect, TOPICS, UI } = sandbox.socioChat;
for (const [q, want] of [["how much for a website?", "website"], ["website kitna ka hai", "website"], ["what is your pricing", "prices"],
  ["can you make an android app", "app"], ["do you do instagram marketing", "social"], ["how long will it take", "timeline"],
  ["how do I cancel and get a refund", "refund"], ["hi", "hello"], ["I need a chatbot for my business", "agent"], ["asdfgh", null],
  ["app banwane mein kitne din lagenge", "timeline"], ["paise wapas milenge kya", "refund"], ["aapka contact kaise karu", "contact"],
  ["वेबसाइट कितने की बनेगी?", "website"], ["refund kaise hoga", "refund"], ["Can you integrate Razorpay with my site?", "website"],
  ["I want to restore my old site", "website"], ["रिफंड कैसे मिलेगा", "refund"], ["आप क्या बनाते हैं", "services"], ["नमस्ते", "hello"]])
  assert.equal(match(q), want, `chat: "${q}"`);
for (const [q, want] of [["वेबसाइट चाहिए", "hi"], ["mujhe website chahiye", "hn"], ["kitna lagega", "hn"],
  ["how much does a website cost", "en"], ["is it a mere 10k for a website", "en"], ["website", null]])
  assert.equal(detect(q), want, `chat language: "${q}"`);
for (const lang of ["en", "hn", "hi"]) {
  for (const topic of TOPICS) assert.ok(topic.a[lang] && (!topic.l || topic.l[lang]), `chat ${topic.id} needs a ${lang} answer and label`);
  for (const key in UI) assert.ok(UI[key][lang], `chat text ${key} needs ${lang}`);
}
assert.ok(!/9119|91196/.test(JSON.stringify({ TOPICS, UI })), "chat must not show the phone number");

// WhatsApp number: every copy must match the wa-number meta in index.html.
const waNumber = html.match(/name="wa-number" content="(\d+)"/)[1];
const payJs = await readFile("pay.js", "utf8");
for (const [file, text] of [["chat.js", chatJs], ["pay.js", payJs], ...PAGES.map((p, i) => [p, pages[i]])]) {
  for (const [, n] of text.matchAll(/wa\.me\/(\d+)/g)) assert.equal(n, waNumber, `${file} has a different WhatsApp number`);
}
assert.ok(chatJs.includes(`const WA_NUMBER = "${waNumber}"`), "chat.js WA_NUMBER must match index.html");

// Main form and Sheet script share the chat's contact rule.
assert.ok(app.includes("contactOk"), "main form must check the contact field");
const gs = await readFile("tools/lead-sheet.gs", "utf8");
const gsBox = {};
(await import("node:vm")).runInNewContext(gs + "\nthis.validContact = validContact;", gsBox);
for (const [v, ok] of [["hello", false], ["98765 43210", true], ["a@b.co", true], ["1234", false], ["", false]])
  assert.equal(gsBox.validContact(v), ok, `lead-sheet.gs contact check: "${v}"`);

// Razorpay functions: keys come only from env vars; amounts are checked; signatures are verified.
{
  const { createRequire } = await import("node:module");
  const req = createRequire(import.meta.url);
  const makeOrder = req("../api/razorpay-order.js"), verify = req("../api/razorpay-verify.js");
  const call = async (fn, body, method = "POST", origin = "https://www.sociocraftco.in") => {
    const out = {};
    const res = { status(c) { out.status = c; return res; }, json(j) { out.body = j; return res; } };
    await fn({ method, body, headers: { origin } }, res);
    return out;
  };
  delete process.env.RAZORPAY_KEY_ID; delete process.env.RAZORPAY_KEY_SECRET;
  assert.equal((await call(makeOrder, { amount: 100, name: "A", invoice: "X" })).status, 503, "no keys: payments switched off");
  process.env.RAZORPAY_KEY_ID = "rzp_test_id"; process.env.RAZORPAY_KEY_SECRET = "s3cret";
  const realFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (url, o) => { sent = { url, o }; return { ok: true, json: async () => ({ id: "order_1", amount: JSON.parse(o.body).amount }) }; };
  for (const bad of [0, 0.5, -10, 500001, "abc"]) assert.equal((await call(makeOrder, { amount: bad, name: "A", invoice: "X" })).status, 400, `amount ${bad} rejected`);
  assert.equal((await call(makeOrder, { amount: 100, invoice: "X" })).status, 400, "name required");
  const r1 = await call(makeOrder, { amount: 100, name: "A" }), r2 = await call(makeOrder, { amount: 100, name: "A" });
  assert.match(r1.body.reference, /^SC-\d{6}-[0-9A-F]{6}$/, "reference made automatically");
  assert.notEqual(r1.body.reference, r2.body.reference, "every payment gets its own reference");
  assert.equal((await call(makeOrder, { amount: 100, name: "A", invoice: "INV-7" })).body.reference, "INV-7", "a given invoice number is kept");
  assert.equal((await call(makeOrder, {}, "GET")).status, 405, "GET rejected");
  assert.equal((await call(makeOrder, { amount: 100, name: "A" }, "POST", "https://evil.example")).status, 403, "orders from other sites rejected");
  assert.equal((await call(makeOrder, { amount: 100, name: "A" }, "POST", "")).status, 403, "orders without an origin rejected");
  assert.equal((await call(makeOrder, { amount: 100, name: "A" }, "POST", "https://sociocraftco.in")).status, 200, "non-www address accepted");
  const ok = await call(makeOrder, { amount: 1499.5, name: "A", invoice: "SC-1", address: "12 MG Road, Delhi 110001" });
  assert.deepEqual([ok.status, ok.body.order_id, ok.body.amount, ok.body.key], [200, "order_1", 149950, "rzp_test_id"], "order created in paise");
  assert.ok(!JSON.stringify(ok.body).includes("s3cret"), "secret never sent to the browser");
  assert.equal(sent.url, "https://api.razorpay.com/v1/orders");
  assert.equal(JSON.parse(sent.o.body).notes.address, "12 MG Road, Delhi 110001", "billing address goes to Razorpay with the payment");
  globalThis.fetch = realFetch;
  const { createHmac } = await import("node:crypto");
  const sig = createHmac("sha256", "s3cret").update("order_1|pay_1").digest("hex");
  assert.equal((await call(verify, { razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: sig })).body.ok, true, "good signature accepted");
  assert.equal((await call(verify, { razorpay_order_id: "order_1", razorpay_payment_id: "pay_2", razorpay_signature: sig })).body.ok, false, "wrong payment rejected");
  assert.equal((await call(verify, { razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "x" })).body.ok, false, "bad signature rejected");
}

// Payment webhook: only signed Razorpay calls reach the Sheet, with the key; a Sheet refusal makes Razorpay retry.
{
  const { createRequire } = await import("node:module");
  const { createHmac } = await import("node:crypto");
  const { Readable } = await import("node:stream");
  const webhook = createRequire(import.meta.url)("../api/razorpay-webhook.js");
  process.env.RAZORPAY_WEBHOOK_SECRET = "whsec"; process.env.SHEET_PAYMENT_KEY = "sheetkey";
  const event = (name) => JSON.stringify({ event: name, payload: {
    payment: { entity: { id: "pay_9", amount: 1500000, method: "upi", contact: "+919876543210", email: "a@b.co" } },
    order: { entity: { id: "order_9", notes: { name: "Asha", phone: "+91 98765", purpose: "Advance", invoice: "SC-9" } } } } });
  const hook = async (body, sig = createHmac("sha256", "whsec").update(body).digest("hex")) => {
    const out = {};
    const req = Object.assign(Readable.from([Buffer.from(body)]), { method: "POST", headers: { "x-razorpay-signature": sig } });
    const res = { status(c) { out.status = c; return res; }, json(j) { out.body = j; return res; } };
    await webhook(req, res);
    return out;
  };
  const realFetch = globalThis.fetch;
  let rows = [], sheetReply = "ok";
  globalThis.fetch = async (url, o) => { rows.push(Object.fromEntries(o.body)); return { text: async () => sheetReply }; };
  assert.equal((await hook(event("order.paid"), "bad")).status, 400, "webhook: bad signature rejected");
  assert.equal(rows.length, 0, "webhook: nothing saved for a bad signature");
  assert.equal((await hook(event("payment.failed"))).status, 200, "webhook: other events ignored");
  assert.equal(rows.length, 0, "webhook: nothing saved for other events");
  assert.equal((await hook(event("order.paid"))).status, 200, "webhook: paid order saved");
  assert.deepEqual([rows[0].source, rows[0].key, rows[0].payment, rows[0].budget, rows[0].contact],
    ["Payment", "sheetkey", "pay_9", "₹15,000", "+919876543210"], "webhook: row carries the key and Razorpay's checked phone");
  sheetReply = "busy";
  assert.equal((await hook(event("order.paid"))).status, 502, "webhook: Sheet refusal fails so Razorpay retries");
  globalThis.fetch = realFetch;

  // Sheet script: payments need the key, go to their own tab, and are saved once per Payment ID.
  const tabs = {};
  const tab = (name) => ({ rows: [], getLastRow() { return this.rows.length; }, appendRow(r) { this.rows.push(r); },
    createTextFinder(t) { return { findNext: () => this.rows.some((r) => r.some((c) => String(c).includes(t))) }; } });
  const box = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => "sheetkey" }) },
    ContentService: { createTextOutput: (t) => t },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => tabs[n], insertSheet: (n) => (tabs[n] = tab(n)), getSheets: () => [tabs.Leads] }) }
  };
  tabs.Leads = tab("Leads");
  (await import("node:vm")).runInNewContext(gs, box);
  const paid = { source: "Payment", payment: "pay_9", name: "Asha", service: "Advance", budget: "₹15,000", contact: "+919876543210", message: "Payment ID pay_9" };
  assert.equal(box.doPost({ parameter: { ...paid, key: "guess" } }), "forbidden", "sheet: payment without the key refused");
  assert.equal(box.doPost({ parameter: { ...paid, key: "sheetkey" } }), "ok", "sheet: signed payment saved");
  assert.equal(box.doPost({ parameter: { ...paid, key: "sheetkey" } }), "ok", "sheet: repeat delivery accepted");
  assert.equal(tabs.Payments.rows.length, 2, "sheet: header plus one row, no duplicate");
  assert.equal(tabs.Leads.rows.length, 0, "sheet: payments stay out of the Leads tab");
}

console.log(`Smoke checks passed (${checks.length} behavioural checks, ${new Set(localAssets).size} local assets).`);
