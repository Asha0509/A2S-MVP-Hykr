# A2S — Aesthetics To Spaces

**AI-native B2B SaaS for India's residential construction industry.**
Construction firms embed A2S into their handover flow.
Their buyers self-serve through an AI-powered design experience: empty-room photo → staged 3D renders → Vastu scoring → catalog cart → vendors ship direct.

A2S earns a SaaS license from the builder + a transaction fee on the buyer's cart. **No inventory, no logistics, no project-management headcount.**

> Submission for the HyKr Build Challenge — May 2026.

---

## Live demo

| | URL |
|---|---|
| Public app | _(filled in after Cloudflare Pages deploy)_ |
| Backend API | _(filled in after Cloud Run deploy)_ |
| LLM / AI service | _(filled in after Cloud Run deploy)_ |
| 2-min walkthrough video | _(filled in after recording)_ |

## Test credentials

| Persona | Email | Password |
|---|---|---|
| Builder  | `demo-builder@a2s.dev` | `hykr2026` |
| Buyer    | `demo-buyer@a2s.dev`   | `hykr2026` |
| Vendor   | `demo-vendor@a2s.dev`  | `hykr2026` |

---

## What's inside

```
.
├── backend/            Spring Boot 3 REST API + PostgreSQL via JPA
├── frontend/           React 18 + Vite + TailwindCSS + Three.js
├── LLM/                Python Flask service — Vastu scoring, AI chat, AI staging
├── Admin/              Streamlit ops console (internal)
├── docker-compose.yml  One-command local stack (Postgres + 4 services)
└── .env.example        Template for required secrets
```

## Local quickstart

```bash
git clone git@github.com:Asha0509/A2S-MVP-Hykr.git
cd A2S-MVP-Hykr
cp .env.example .env       # fill in OPENROUTER_API_KEY, GEMINI_API_KEY
docker compose up -d --build
# → http://localhost/
```

## Tech docs

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full system architecture, service responsibilities, data model, AI pipeline, and deployment topology.

---

Asha Jyothi Boddu · Ruchira Chowdary · aestheticstospaces.tech
