# Socio Craftco

Static marketing website for Socio Craftco, deployed on Vercel.

## Stack

- Semantic HTML and inline site styles in `index.html`
- Vanilla JavaScript in `app.js`
- Static media and self-hosted Outfit fonts
- Vercel headers and caching rules in `vercel.json`

There is no build step, database, or server-side application. The store builder and WhatsApp agent are interactive product demonstrations. Project enquiries are handed off to WhatsApp.

## Run locally

From the repository root:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080`. A local server is preferred over opening `index.html` directly because it matches browser security and asset-loading behaviour more closely.

## Validate changes

```sh
node --check app.js
node --check preview.js
node tests/smoke.test.mjs
```

The smoke test protects critical form-safety, chat-state, CSP, SEO, and asset invariants. GitHub Actions runs the same checks for every pull request and push to `main`.

## Structure

- `index.html` — page markup, styles, SEO metadata, and inline SVG icons
- `app.js` — navigation, store demo, chat demo, view routing, and enquiry handoff
- `preview.js`, `preview.css` — personalised website/chatbot preview and sales unlock funnel
- `privacy.html`, `terms.html` — legal pages
- `brand/`, `work/`, `media/`, `fonts/` — static assets
- `vercel.json` — security headers and cache rules

## Deployment

Vercel can deploy the repository as a static site with no framework preset or build command. The production domain used by canonical metadata and the sitemap is `https://sociocraftco.in/`.
