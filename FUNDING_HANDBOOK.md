# A2S — Funding Handbook

*A 2-minute read. The whole company, no fluff.*

---

## The one-liner
**A2S is the AI design layer Indian builders embed at the point of sale** — so every homebuyer, before they sign, designs their future home: AI-staged room by room, Vastu-scored, with a priced, shoppable shopping list.

## The problem
Indian buyers choose a flat *before* they know how it will feel furnished, whether it's Vastu-compliant, or what making it livable actually costs. The builder has no answer either, so the gap stays open for months post-possession — buyers overspend on consultants, compromise, and regret. ₹4L–₹15L of furnishing spend per home goes un-guided.

## What makes it defensible — 3 moats
1. **Vastu-native AI design (product moat).** No global tool — Interior AI, Spacely, Collov — has Vastu. It's in 90%+ of Indian home decisions and culturally un-copyable by a foreign competitor. We score every room on a 100-point, 5-dimension engine and draw the fixes *on the buyer's photo*.
2. **Point-of-sale embed (distribution moat).** Every rival is B2C and competes on ad spend. A2S rides the builder's existing funnel — one iframe, zero integration. Our 7,200-strong buyer waitlist is the demand-side proof of pull.
3. **Closed commerce loop (revenue moat).** Competitors give you a JPEG and stop. Our render is a *structured, priced, swappable bill-of-materials* → cart → builder commission with attribution.

**The flywheel (the 2-year moat):** every buyer session generates proprietary signal — style × Vastu-vs-aesthetic tradeoff × price sensitivity, by city and builder. That trains a recommendation model no one can replicate.

## What's built (live MVP)
- **Instant Design** — one sentence → a full 4-room home in seconds, with a per-room drill-down (brand, why-recommended, Vastu note, swap-to-reprice, colour preview).
- **Build My Home** — multi-room journey; bring builder catalog (bulk discount) *or* connect Amazon/Pepperfry/Flipkart / upload your own furniture.
- **Vastu HUD** — compliance markers + directional arrows drawn on the actual room photo; tap "apply fix" → score climbs live; 5-dimension breakdown.
- **Showcase, shoppable rooms, 3D walkthrough, builder dashboard + ROI calculator + India demand heatmap, embeddable buyer flow.**
- Stack runs end-to-end on one server. Tiered AI pipeline (FLUX-1 → free fallbacks) means the product never hard-fails.

## Traction
- **7,200+ homebuyer waitlist** over 18 months of consumer-side operations.
- **38% (≈2,750) beta-ready** with completed style profiles.
- Concentrated in Mumbai, Bengaluru, Hyderabad, Pune, Chennai.

## Market & who we sell to
- **TAM:** India residential furnishing + interiors ≈ **$30B**, growing double-digit.
- **Buyer (seller):** mid-tier builders & developers (tier-2/3 first, where buyer-facing tech is a real differentiator); enterprise builders later.
- **End user:** the homebuyer, reached through the builder — zero CAC for us.

## Business model & unit economics
- **Builder SaaS license:** ₹15K/month per active project (Growth tier).
- **Transaction fee:** 12% commission on furniture purchased through the embed; builder keeps 75%, **A2S keeps 25%**.
- **Per converted buyer to A2S:** ₹6.5L avg spend × 12% × 25% ≈ **₹19.5K**.
- **Per 200-unit project (conservative 38% engage → 40% complete → 38% buy):** ≈ 11 conversions × ₹19.5K + 12 months SaaS ≈ **₹3.9L revenue/project**, near-zero marginal cost.
- We never touch inventory, logistics, or PM — vendors ship direct.

## What funding builds (12–18 months)
- **M1–3:** sign first 3 builder pilots; embed live on real project pages; real engagement data.
- **M4–6:** train a proprietary Vastu model on 10K+ floor plans — rule-engine → ML moat.
- **M7–9:** direct catalog API integration (HomeLane, Pepperfry, Asian Paints) — verified live stock + price.
- **M10–12:** seed round on pilot signal + data moat; team of 4; 25 builders.

## Cap table *(indicative, pre-deal)*
| Holder | % |
|---|---|
| Founder | 70% |
| Venture studio (HyKr) | 20% |
| ESOP pool | 10% |

*Illustrative for the studio's milestone-unlocked structure; finalised at term sheet.*

## How it's built
React 18 + Vite frontend · Spring Boot 3 + PostgreSQL backend · Python LLM service (Cloudflare Workers AI vision + OpenRouter reasoning + FLUX-1 image gen) · Caddy + Docker Compose on a single DigitalOcean droplet. Full architecture in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## The ask
Partner with us to convert 7,200 waiting buyers into builder pilots, and build the Vastu data moat before anyone else realises the category exists.

---
*Asha Jyothi Boddu · A2S — Aesthetics To Spaces*
