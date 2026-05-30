# A2S — Aesthetics To Spaces

**The AI infrastructure layer for India's residential construction industry.**

Builders embed A2S in their project landing pages. Their homebuyers then design every room of their unit — using AI room-staging, automated Vastu compliance, and a curated furniture catalog the builder pre-selects. A2S handles the experience; the builder owns the buyer and earns commissions on every conversion.

> Submission for the HyKr Build Challenge — May 2026.

---

## Live demo

| Surface | URL |
|---|---|
| Public app | <https://168-144-151-227.sslip.io> |
| Founder / About | <https://168-144-151-227.sslip.io/#/about> |
| Builder workspace | <https://168-144-151-227.sslip.io/#/builder> |
| Buyer journey (live FLUX-1-schnell) | <https://168-144-151-227.sslip.io/#/design> |
| Buyer journey (instant demo tour) | <https://168-144-151-227.sslip.io/#/design> → "Take the 1-click demo tour" |
| Vastu HUD (the visible USP) | <https://168-144-151-227.sslip.io/#/vastu-hud> |
| Embed preview (fictional builder) | <https://168-144-151-227.sslip.io/#/embed-demo> |
| 2-min walkthrough video | _added on submission_ |

The demo tour is the recommended path for first-time reviewers — it
pre-loads a 4-room sample 3 BHK in Contemporary style with realistic
Vastu HUD findings and a costed shopping list. Live mode uses
Cloudflare Workers AI (LLaVA + FLUX-1-schnell) for actual room
staging from any uploaded photo.

Hosted on a single DigitalOcean Droplet (Bangalore region, 4 GB / 2 vCPU) running the full Docker Compose stack behind Caddy with auto-issued Let's Encrypt TLS. No managed cloud services in the critical path — everything is reproducible from `docker compose up`.

## Test credentials

Builder and buyer flows are demoable **without signing in** (signup forms persist to `localStorage` only — no backend account creation needed for the MVP).

If you want a real authenticated buyer session for the dashboard/Vastu Score features, sign up via Google OAuth on the live URL or use:

| Persona | Path | How to use |
|---|---|---|
| Builder  | `/#/builder`     | Fill out the signup form (any name/email). Generates a workspace + embed snippet locally. |
| Buyer    | `/#/design`      | Multi-room journey. Designs Living + Bedroom + Kitchen + Pooja in one consistent style. |
| Buyer (legacy single shot) | `/#/stage` | One-room AI staging via Cloudflare Workers AI (SD 1.5 img2img). |

---

## The 3 personas in 2 minutes

### Builder — `/#/builder`
1. Signs up in 30 seconds (name, company, project, type, email).
2. Lands on a dashboard with KPI tiles, a copy-paste HTML embed snippet, and **Curated Catalog Tiers** — a 10-brand multi-select where the builder picks which vendors (IKEA, HomeLane, Pepperfry, WoodenStreet, etc.) get surfaced first in *their* buyers' renders.
3. Every buyer who designs their home through this embed is attributed back to the builder, and every product purchased through the embedded catalog generates a commission for the builder.

### Buyer — `/#/design`
A 3-step wizard:
1. **Pick rooms** — Living, Master Bedroom, Kitchen, Pooja Room (all on by default; reflects the rooms every Indian home buyer cares about).
2. **Pick one shared style** — Modern / Minimal / Contemporary / Classic / Ethnic / Functional.
3. **Stage each room sequentially.** For every room: upload a photo → AI img2img staging via Cloudflare Workers AI's `stable-diffusion-v1-5-img2img` → Vastu Compliance Scan against the room → catalog bundle filtered by the builder's preferred brands.

Ends at `/#/design/summary` with all rooms rendered side-by-side, **a colour-coded Vastu badge per room** (red/amber/green/gold), and a **total cost rollup with EMI** ("₹6.4L home as designed · EMI ₹17,700/mo for 36 months").

### Embed demo — `/#/embed-demo`
A fake "Lodha Greens · Wing C" builder marketing site. Renders A2S inside a real `<iframe>` — proves the embed mechanic actually works visually. The page reads the builder workspace from `localStorage`, so the demo customises to whatever company name the builder signed up with.

---

## What's inside

```
.
├── backend/                       Spring Boot 3 REST API + PostgreSQL via JPA
│   └── src/main/java/a2s/
│       ├── controller/            REST surface — products, builder, vastu, chat
│       ├── service/               CachedProductsService for sub-ms catalog reads
│       └── model/                 Product, ProductListItem, User, BuilderAccount
├── frontend/                      React 18 + Vite + TailwindCSS
│   └── pages/
│       ├── BuilderPortal.jsx      Signup → workspace dashboard → embed snippet
│       ├── EmbedDemo.jsx          Fake "Lodha Greens" marketing site, iframes A2S
│       ├── DesignJourney.jsx      3-step buyer wizard
│       ├── DesignSummary.jsx      All renders + Vastu badges + cost rollup
│       ├── StageRoom.jsx          Single-shot AI staging
│       ├── VastuScore.jsx         Standalone 100-point Vastu compliance audit
│       └── Gallery.jsx            Curated catalog browser
├── LLM/                           Python Flask AI service
│   ├── staging.py                 Cloudflare Workers AI img2img wrapper + LRU cache
│   ├── vastu_score.py             YOLO + LLM-based Vastu rule engine
│   └── agent/                     OpenRouter-backed conversational consultant
├── infra/                         DO Droplet deployment automation
│   ├── bootstrap.sh               One-shot Docker + Caddy + UFW install
│   ├── Caddyfile                  sslip.io reverse proxy + auto-LE
│   ├── docker-compose.prod.yml    Prod override (memory caps, JVM tuning)
│   └── deploy.sh                  pull → build → up → reload Caddy
├── docker-compose.yml             4-service local stack
└── ARCHITECTURE.md                Full system architecture + AI pipeline
```

---

## Local quickstart

```bash
git clone git@github.com:Asha0509/A2S-MVP-Hykr.git
cd A2S-MVP-Hykr
cp .env.example .env
# Fill these in .env (all free-tier, no credit card required):
#   OPENROUTER_API_KEY   — chat + consultant agent
#   CF_ACCOUNT_ID        — AI room staging (Workers AI free tier)
#   CF_API_TOKEN
#   JWT_SECRET           — any 64+ char random string
docker compose up -d --build
# → http://localhost:8000/
```

Stack boots in ~2 min on a 4 GB machine.

## Deploying your own copy

The `infra/` directory contains an idempotent one-command deploy for any Ubuntu 22.04 / 24.04 host (DigitalOcean Droplet, Hetzner Cloud, anywhere):

```bash
# On a fresh Droplet, as root:
curl -fsSL https://raw.githubusercontent.com/Asha0509/A2S-MVP-Hykr/main/infra/bootstrap.sh | bash
git clone https://github.com/Asha0509/A2S-MVP-Hykr /opt/a2s
cd /opt/a2s
cp .env.example .env  # fill in the four keys above
bash infra/deploy.sh
# → https://<your-droplet-ip-with-dashes>.sslip.io
```

Caddy auto-issues a Let's Encrypt cert against the sslip.io subdomain mapped to your Droplet IP. Zero DNS configuration required.

## Tech docs

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full system architecture, service responsibilities, data model, AI pipeline, and deployment topology.

---

Asha Jyothi Boddu · Ruchira Chowdary · aestheticstospaces.tech
