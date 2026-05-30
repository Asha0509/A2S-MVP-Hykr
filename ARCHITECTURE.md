# A2S — Architecture

_Snapshot: HyKr submission build, May 2026._

## System at a glance

```
                            ┌────────────────────────────┐
                            │  Caddy (host)              │
                            │  HTTPS, auto-LE,           │
                            │  HSTS / CSP / XFO          │
                            └─────────┬──────────────────┘
                                      │ reverse_proxy 127.0.0.1:8000
                                      ▼
                          ┌──────────────────────────┐
                          │   nginx (a2s-frontend)   │
                          │   Serves built React SPA │
                          │   Proxies /api/* + /oauth│
                          └────┬────────────────┬────┘
                               │                │
                /api/stage     │                │  /api/*  /oauth2/*
                               ▼                ▼
                  ┌────────────────────┐  ┌────────────────────────┐
                  │  a2s-llm (Flask)   │  │  a2s-backend           │
                  │  Cloudflare        │  │  Spring Boot 3 + JPA   │
                  │  Workers AI        │  │  REST + Spring Security│
                  │  SD 1.5 img2img    │  │  + OAuth2 + JWT        │
                  │  YOLO Vastu engine │  │                        │
                  │  OpenRouter agent  │  │                        │
                  └─────────┬──────────┘  └──────────┬─────────────┘
                            │                        │
                            ▼                        ▼
              ┌────────────────────────┐    ┌────────────────────┐
              │  Cloudflare            │    │  a2s-postgres      │
              │  Workers AI            │    │  Postgres 15       │
              │  (free tier, 10k       │    │  (volume-backed,   │
              │   neurons/day)         │    │   1,230 products)  │
              └────────────────────────┘    └────────────────────┘
```

Everything runs on a **single DigitalOcean Droplet** (Ubuntu 24.04, 4 GB RAM, 2 vCPU, Bangalore). The 4 services boot from one `docker compose up`. Caddy on the host owns 80/443 and reverse-proxies to the frontend container on `127.0.0.1:8000`. nginx inside the frontend container then routes:

- `/` and `/static/*` → built React SPA
- `/api/stage` → `a2s-llm:5001` (Cloudflare Workers AI proxy)
- `/api/*` → `a2s-backend:8080` (Spring Boot)
- `/oauth2/*` and `/login/oauth2/*` → `a2s-backend:8080`

No external load balancer, no managed services in the critical path. The entire production stack is reproducible with `git clone && cp .env.example .env && bash infra/deploy.sh`.

---

## Services

### Frontend — `frontend/` (port 80, bound to 127.0.0.1:8000 in prod)

- React 18 + Vite + TailwindCSS with a hand-rolled CSS-variable design system in `index.css` — Holiday Velvet (`#1D6172`) + Saucy Gold (`#B8763D`) + Space Grotesk display + Inter body.
- Routing via `HashRouter` (works under Caddy without extra rewrites).
- State: Zustand store in `store/useStore.js` for auth/profile + browser `localStorage`/`sessionStorage` for the MVP's account-less builder/buyer journeys.
- The buyer journey persists progress to `sessionStorage` so a refresh recovers without losing the staged renders mid-flow.
- API client in `services/api.js` — axios instance with bearer-token interceptor + per-route timeouts (180 s for staging, 30 s for everything else).

Pages that matter for the HyKr USP:

| Page | Route | Purpose |
|---|---|---|
| `BuilderPortal.jsx` | `/builder` | Signup → workspace with KPI tiles, embed snippet, **Curated Catalog Tiers** brand multi-select |
| `EmbedDemo.jsx` | `/embed-demo` | Fake builder marketing site with A2S iframed inside — proves the embed mechanic |
| `DesignJourney.jsx` | `/design` | 3-step buyer wizard (pick rooms → pick style → stage each) |
| `DesignSummary.jsx` | `/design/summary` | All staged rooms + Vastu badges + cost rollup + EMI |
| `StageRoom.jsx` | `/stage` | Single-room AI staging (legacy entry point, still wired) |
| `VastuScore.jsx` | `/vastu-score` | Standalone 100-point Vastu compliance scanner |
| `Gallery.jsx` | `/gallery` | Curated catalog browser with style + room filters |

### Backend — `backend/` (Spring Boot 3, port 8080 on docker network only)

- Java 17, Maven, PostgreSQL via JPA / Hibernate.
- `JAVA_TOOL_OPTIONS: -Xms256m -Xmx768m -XX:+UseSerialGC -XX:MaxRAMPercentage=70` in prod so the JVM lives comfortably inside a 1 GB container limit.
- Spring Security + Spring OAuth2 client (Google) + JWT, with the redirect URI auto-derived from the `Host` header so the same image works on `localhost`, the sslip.io domain, or any future hostname.
- **`CachedProductsService`** keeps the full catalog (1,230 products) in memory as a `List<ProductListItem>`. Every catalog read serves out of the cache; only writes/imports invalidate it. Sub-millisecond responses for the buyer-journey hot path.

REST endpoints (~32 total) grouped by surface:

- **Products** — `/api/products`, `/api/products/{id}`, `/api/products/category/{c}`, `/api/products/{id}/insights`, **`/api/products/sample-bundle`** (room/style/brand-filtered catalog bundle for the journey)
- **Builder + buyer attribution** — handled client-side via `localStorage` for the MVP. Schema-ready for a proper `builder_account` table when promoted out of demo.
- **Vastu** — `/api/vastu/analyse` (multipart upload, 1–3 images), `/api/vastu/status` (rate-limit headroom), `/api/vastu/catalog-click` (non-blocking analytics).
- **Chat** — `/api/chat`, `/api/chat/consultant`, `/api/chat/vastu` — all proxy to the Python LLM service.
- **Auth** — `/api/users/register`, `/api/users/login`, OAuth2 callback paths.

### LLM service — `LLM/` (Python Flask, port 5001 on docker network only)

The "AI" surface. Three feature modules, one Flask app.

#### `staging.py` — AI room staging
- Backend: **Cloudflare Workers AI**, model `@cf/runwayml/stable-diffusion-v1-5-img2img`.
- Pre-resizes the uploaded photo to ≤ 768 px on the larger side, snapped to multiples of 8 (SD 1.5 hard requirement). Keeps payloads small, inference < 10 s.
- 6 hand-tuned descriptive prompts (modern / minimal / contemporary / classic / ethnic / functional) + a shared negative prompt that suppresses common failure modes (deformed geometry, watermarks, missing walls).
- `strength = 0.65` preserves room composition while restyling furniture; tunable via `STAGING_STRENGTH` env var.
- Thread-safe in-memory LRU cache (50 entries) keyed by `SHA-256(image, style, room, hint)` — same upload + same style returns instantly, no neuron burn.
- 429 handling: parses `retryDelay` from Cloudflare's error body and surfaces it as a `Retry-After` header + JSON field so the frontend can show a live countdown.
- **Why Cloudflare Workers AI:** the free tier gives 10,000 neurons/day with no credit card. Gemini 2.5 Flash Image (the original choice) required prepaid billing on brand-new keys, killing the demo. Cloudflare's `img2img` model preserves room geometry, which is mandatory for the "stage MY room" pitch.

#### `vastu_score.py` — Vastu compliance engine
- YOLO-based object detection on uploaded room photos to identify furniture, doors, windows, mandirs.
- Rules engine encoded in `data/vastu_rules_v1.json` — categories (decor, elements, entry, furniture, light), each with a list of room-typed rules that contribute to a 0–100 score.
- Vendor-neutral LLM call via OpenRouter for the explanation layer ("why your bed orientation is hurting your score, how to fix it").
- Used in two places: as a standalone `/api/vastu/analyse` for the dedicated Vastu Score page, and inline during the multi-room journey to attach a compliance badge to every staged room.

#### `agent/core.py` + `agent/prompts.py` — Conversational consultant
- OpenRouter (`anthropic/claude-sonnet-4.6` by default) for the AI Stylist widget.
- Catalog-grounded responses: the agent has access to the product catalog and ranks matches before responding ("here are 3 sofas in your style and budget").

### Postgres — `a2s-postgres` (Postgres 15-alpine, volume-backed)

- Single database, `a2s_db`. Schema lives in JPA entities under `backend/src/main/java/a2s/model/`.
- 1,230 real products seeded from scrapers (`LLM/scraper/run_crawler.py`) across IKEA, Amazon, Flipkart, Pepperfry, HomeLane, WoodenStreet, UrbanLadder, Nilkamal, Godrej Interio, MiradorHome.
- Volume mounted at `/var/lib/postgresql/data` so a container rebuild doesn't drop the catalog.
- 384 MB memory cap in prod — comfortable headroom; the working set is much smaller because the backend caches reads in-process.

---

## The AI room-staging pipeline (the demo's "wow" path)

```
Buyer uploads photo
        │
        ▼
[ Frontend ] DesignJourney.jsx
        │   FormData { image, style, roomType, hint }
        │
        ├──────▶ POST /api/stage (multipart)
        │                  │
        │                  ▼
        │           [ nginx ] longest-prefix /api/stage → a2s-llm:5001
        │                  │
        │                  ▼
        │           [ LLM ] staging.py
        │             1. SHA-256 cache lookup
        │             2. Pillow resize → ≤ 768 px, mod-8 dims
        │             3. Build SD prompt from style + room + hint
        │             4. POST to Cloudflare Workers AI
        │                  │
        │                  ▼
        │           [ Cloudflare ]  SD 1.5 img2img
        │           strength 0.65, 20 steps, guidance 7.5
        │                  │
        │                  ▼ binary PNG (or base64 JSON envelope)
        │           [ LLM ] decode → base64 → cache → return
        │
        │   { image_base64, style, room_type, prompt, cached }
        ▼
[ Frontend ] DesignJourney.jsx
        │
        ├──────▶ POST /api/vastu/analyse (same photo, parallel)
        │                  │ score + category_scores
        │                  ▼
        │           Vastu badge per room
        │
        ├──────▶ GET /api/products/sample-bundle?roomType=...&style=...&brands=...
        │                  │ items[] + totalEstimate
        │                  ▼
        │           Catalog tier card
        │
        ▼
   sessionStorage  ←  full room result {before, after, vastu, bundle}
        │
        ▼
[ Frontend ] DesignSummary.jsx — cost rollup + EMI + builder CTA
```

Per-room latency on a warm-cache run: SD inference ~6–10 s + Vastu ~5 s (parallel) + bundle ~50 ms. For the demo, a 4-room journey is ~45–60 s of buyer time.

---

## Data model (relevant slice)

- `Product` — id, name, brand, category, roomType, aestheticStyle, price, currency, image, source, affiliateLink, vendor, color, material, dimensions, rating
- `ProductListItem` — record projection of `Product` used by `CachedProductsService` (avoids hydrating the full entity for list endpoints)
- `User` — id, email, name, googleId, consultantCredits, vastuCredits, styleDNA, savedDesigns, watchlist
- `VastuScan` — id, userId, roomType, score, categoryScores, autoDirection, createdAt

For the HyKr MVP, the **builder account** and **buyer-to-builder attribution** are client-side only (browser `localStorage`). Promoting to a proper `builder_account` table + foreign key on `User` is a 1-day migration when the product graduates from demo.

---

## Deployment topology

### Production (HyKr demo)

- 1 × DigitalOcean Droplet, Ubuntu 24.04, 4 GB / 2 vCPU, Bangalore.
- Caddy v2 on the host (UFW: 22, 80, 443 only).
- Docker Compose with `docker-compose.yml` + `infra/docker-compose.prod.yml` override:
  - `postgres` — 384 MB cap
  - `backend` — 1024 MB cap, serial GC, `-Xmx 768m`
  - `llm` — 768 MB cap (Pillow + YOLO weights)
  - `frontend` — 128 MB cap (static nginx)
  - `admin` — gated behind `--profile admin`, off by default in prod to free RAM
- TLS via Caddy's automatic Let's Encrypt issuance against `<dashed-droplet-ip>.sslip.io` — no DNS records required.

### Local dev

```bash
docker compose up -d --build
# → http://localhost:8000/   (frontend)
# → http://localhost:8080/   (backend, exposed for debugging only)
# → http://localhost:5001/   (LLM)
# → http://localhost:5432/   (postgres)
```

---

## Tradeoffs and explicit cuts for the HyKr deadline

What's working but compressed for the MVP:

- **Builder/buyer accounts** are localStorage-only. Real persistence is a `builder_account` table + JWT scoping — straightforward when needed, deliberately skipped for demo so the journey is dead-simple to walk through.
- **AI staging quality** uses SD 1.5 img2img (Cloudflare free tier), not SDXL + ControlNet. Quality is good for "empty room → furnished room" but not pixel-perfect on geometry. Production upgrade path: Replicate's FLUX or hosted SDXL + depth-ControlNet, both pay-per-call.
- **Drag-and-drop furniture placement** (the original A2S USP from the consumer pivot) is intentionally not in this submission. AI staging is a different, more demo-friendly USP at MVP scale. Drag-and-drop returns in Phase 2.

What's genuinely future-work, not just compressed:

- **Real-time builder analytics** — KPI tiles on the builder dashboard currently show sample numbers. Real wiring is a metrics event stream + a `Builder` → `BuilderEvent` table.
- **Vendor self-serve onboarding** — the original 3-persona pitch had a "vendor" surface that's currently a stub on the embed-demo page. Production requires KYC + catalog ingest + commission ledger.
- **Native 3D walkthrough** — Three.js scaffolding is in `frontend/pages/ThreeDSpace/` but the demo path uses AI staging instead. Three.js path is wired but not shown in the HyKr submission.
