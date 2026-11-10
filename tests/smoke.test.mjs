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
  [app.includes('$$(".wa-buttons button", body)'), "chat must invalidate all previous quick replies"],
  [app.includes('step === "service"') && app.includes('step === "slot"'), "chat must understand typed service and slot replies"],
  [html.includes('id="panel-preview"'), "personalised preview panel must remain available"],
  [html.includes('id="pUnlockDialog"'), "preview must include the lead unlock step"],
  [preview.includes("shareUrl(state.config)"), "preview must generate a shareable configuration link"],
  [preview.includes("function sceneMarkup(config)") && preview.includes("p-scene-realestate"), "preview must render distinct industry scenes"],
  [preview.includes('id="pChatComposer"') && preview.includes("assistantReply(question)"), "preview assistant must accept typed test questions"],
  [preview.includes('url.searchParams.set("pv", encodeConfig(config))') && !preview.includes('searchParams.set("phone"'), "share links must exclude contact details"],
  [!preview.includes("₹") && !previewCss.includes("₹"), "personalised preview must not expose estimated pricing"],
  [html.includes('<link rel="canonical" href="https://sociocraftco.in/">'), "canonical URL must stay present"],
  [robots.includes("https://sociocraftco.in/sitemap.xml"), "robots.txt must advertise the sitemap"],
  [sitemap.includes("https://sociocraftco.in/"), "sitemap must include the production homepage"]
];

for (const [ok, message] of checks) assert.ok(ok, message);

const config = JSON.parse(vercel);
const globalRule = config.headers.find((rule) => rule.source === "/(.*)");
assert.ok(globalRule, "global Vercel headers are required");
const names = new Set(globalRule.headers.map((header) => header.key.toLowerCase()));
for (const required of ["content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy"]) {
  assert.ok(names.has(required), `missing security header: ${required}`);
}

const localAssets = [...html.matchAll(/(?:^|\s)(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1].split(/[?#]/)[0].replace(/^\//, ""))
  .filter((value) => value && !/^(?:https?:|mailto:|tel:|#)/.test(value));

for (const asset of new Set(localAssets)) await access(asset);

console.log(`Smoke checks passed (${checks.length} behavioural checks, ${new Set(localAssets).size} local assets).`);
