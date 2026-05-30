# A2S — Architecture

_Last updated: 2026-05-30 · sprint state, will be finalised in Block 6._

## System at a glance

```
                    ┌────────────────────────┐
                    │   Cloudflare Pages     │
                    │   (React frontend)     │
                    └─────────┬──────────────┘
                              │ HTTPS
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────────┐    ┌──────────────────┐
│ GCP Cloud Run│     │  GCP Cloud Run   │    │  Google AI       │
│ Spring Boot  │◀───▶│  Python LLM      │───▶│  Studio          │
│   /api/*     │     │  /api/chat       │    │  (Gemini 2.5     │
└──────┬───────┘     │  /api/vastu      │    │   Flash Image)   │
       │             │  /api/stage      │    └──────────────────┘
       │             └────────┬─────────┘
       │                      │
       ▼                      │
┌──────────────┐              ▼
│  Neon        │     ┌──────────────────┐
│  Postgres    │     │ OpenRouter       │
│  (Singapore) │     │ (Claude Sonnet   │
└──────────────┘     │   4.6)           │
                     └──────────────────┘

         ┌──────────────────┐
         │ Cloudflare R2    │ ◀─ generated staged renders, user uploads
         └──────────────────┘
```

## Services

### Frontend — `frontend/`
- React 18 + Vite + TailwindCSS, brand-aligned to A2S 2026 palette (Holiday Velvet, Saucy Gold)
- Three.js scaffold for the future native 3D viewer
- Three personas surfaced via routing:
  - `/builder/*` — onboarding, project dashboard, embed-code generator, engagement analytics
  - `/buyer/*`   — style quiz, AI staging upload, Vastu score, AI consultant, cart
  - `/vendor/*`  — self-serve onboarding, catalog listing, order feed
- API layer in `services/api.js` proxies through nginx to the backend.

### Backend — `backend/`
- Spring Boot 3, Java 17, PostgreSQL via JPA / Hibernate
- 32 REST endpoints across:
  - `ProductController` — 2,265 SKU catalog, bulk `POST /api/products/import` with URL+canonical-name dedup
  - `DesignController` — gallery designs, room/style filters
  - `VastuScoreController` — Vastu rule evaluation pipeline
  - `ChatController` — bridges to the Python LLM service
  - `AuthController` + Spring Security with JWT + Google OAuth2
- `CachedProductsService` keeps a hot read-through cache, invalidated on bulk import.

### LLM / AI service — `LLM/`
- Python Flask, model-agnostic via OpenRouter abstraction
- `agent/core.py`         → conversational AI consultant (Claude Sonnet 4.6)
- `vastu_score.py`        → 50-parameter Vastu rule engine + Claude vision for direction inference
- `api.py`  `/api/chat`   → text consultant for buyers
- `api.py`  `/api/vastu`  → photo → score + recommendations
- `api.py`  `/api/stage`  → empty-room photo + style → Gemini 2.5 Flash Image edit
- 10 site scrapers (`scraper/*.py`) feed the catalog; production-tested for IKEA, Amazon, WoodenStreet

### Admin — `Admin/`
- Streamlit ops console for catalog inspection + builder/vendor lifecycle (internal only)

### Data layer
- **Neon Postgres** (`ap-southeast-1`, Singapore) — products, designs, users, builders, vendors, projects, vastu scores
- **Cloudflare R2** — user uploads + generated staged renders
- Local development: PostgreSQL 15 inside Docker Compose, identical schema

## Key tech decisions

| Decision | Why |
|---|---|
| OpenRouter as LLM gateway | Model-agnostic — Claude / GPT / Llama swap with one env var, no code change |
| Gemini 2.5 Flash Image for staging | Img-edit capability ("stage this empty room in X style") works in a single call, free tier covers the demo |
| Neon over Cloud SQL | Free tier sized correctly for 2,265 SKUs; Cloud SQL would burn the GCP $300 credit needlessly |
| Cloudflare Pages over GCP Hosting | Free static hosting with PR previews; React build needs no GCP-specific feature |
| Cloud Run for Spring Boot + Python | Scales to zero between demos; $300 free credit lasts months at evaluation traffic |
| Three.js as a scaffold, not Block 1 | Real CAD-to-3D engine is a 4–6 week build; for the MVP we substitute AI-staging which is a stronger AI-native demo anyway |
| 2,265 real SKUs over 28K mock | Smaller honest number > inflated claim; the import pipeline + dedup is the actual infrastructure story |

## AI pipeline detail

### Vastu Score
1. User uploads room photo
2. YOLO (ultralytics) detects furniture & openings on the image
3. Claude Sonnet 4.6 vision call infers cardinal direction from window/light evidence
4. Detected objects + direction + room type → `vastu_rules_v1.json` rule evaluator
5. Output: weighted score (0–100), per-element flags, plain-language recommendations

### AI Staging  *(Block 2 of this sprint)*
1. Buyer uploads empty post-handover flat photo
2. Style + budget chosen from quiz
3. Backend calls Gemini 2.5 Flash Image with `[image, edit prompt]`
4. Returns 1–3 staged renders; each pinned to catalog items (matched by category × style × budget)
5. Buyer drag-swaps items, accumulates cart, hands cart off to vendors via direct fulfilment

### AI Consultant
1. Natural-language prompt → Claude Sonnet 4.6 via OpenRouter
2. System prompt grounds the model in the current catalog + buyer style profile
3. Output: shortlist + budget breakdown + reasoning

## Deployment

| Layer | Production | Local |
|---|---|---|
| Frontend | Cloudflare Pages | `docker compose up frontend` |
| Backend  | GCP Cloud Run (Artifact Registry image)  | `docker compose up backend` |
| LLM      | GCP Cloud Run (Artifact Registry image)  | `docker compose up llm` |
| Postgres | Neon (Singapore)                         | Compose `postgres` service |
| Object storage | Cloudflare R2                      | Local filesystem fallback |

Secrets injected via Cloud Run env vars + Cloudflare Pages environment variables. **Nothing committed to the repo.**

## Security headers

Nginx (frontend container) sets:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=(self)`
- `Content-Security-Policy: default-src 'self'; …`
