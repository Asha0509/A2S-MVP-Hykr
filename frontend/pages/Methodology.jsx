import React from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, Compass, Cpu, Eye, Layers, ShieldCheck, ArrowRight,
    Database, Network, Workflow,
} from 'lucide-react';
import SectionBackdrop from '../components/SectionBackdrop';

const VASTU_TEXTS = [
    { name: 'Brihat Samhita',          author: 'Varahamihira',  era: '6th c. CE',  scope: 'Site selection, orientation, room placement' },
    { name: 'Manasara Shilpa Shastra', author: 'Anonymous',     era: '~6th c. CE', scope: 'Proportions, dwelling typology, room dimensions' },
    { name: 'Mayamatam',               author: 'Mayasura',      era: '~7th c. CE', scope: 'Vastu Purusha mandala, zone-element mapping' },
    { name: 'Samarangana Sutradhara',  author: 'Bhoja',         era: '11th c. CE', scope: 'Residential layouts, water + cooking placement' },
    { name: 'Vishwakarma Prakash',     author: 'Vishwakarma',   era: '~12th c. CE', scope: 'Pooja room orientation, sleeping direction' },
    { name: 'Aparajitapriccha',        author: 'Bhuvanadevacharya', era: '12th c. CE', scope: 'Material/colour by direction' },
    { name: 'Vastu Vidya',             author: 'Various',       era: 'Medieval',   scope: 'Modern Indian apartment adaptations' },
    { name: 'Indian Standard IS 1080', author: 'BIS',           era: '1985',       scope: 'Modern building code intersection with Vastu' },
];

const PIPELINE_STAGES = [
    {
        n: '01', icon: Eye,
        title: 'Vision pass',
        model: 'LLaVA 1.5 7B (Cloudflare Workers AI)',
        out: 'Structured JSON of (object, 3×3-grid zone) tuples + window wall + floor material',
        why: 'Open-source vision model that runs in <2s on Cloudflare\'s GPU pool. We picked LLaVA over BLIP-2 and CogVLM because its JSON output stability is highest in our internal benchmarks.',
    },
    {
        n: '02', icon: Compass,
        title: 'Direction-element mapping',
        model: 'Deterministic lookup (no LLM)',
        out: '{direction: facing, element: water/fire/air/earth, ruler: Kubera/Surya/Vayu...}',
        why: 'The eight cardinal/intercardinal directions each map to a Vastu element + ruling deity. Codified once. No model can hallucinate this.',
    },
    {
        n: '03', icon: Cpu,
        title: 'Vastu reasoning',
        model: 'Claude Sonnet 4.6 (OpenRouter)',
        out: 'List of violations with severity, zone, object, issue, fix, direction_hint',
        why: 'Reasoning over the rule corpus is a long-context, multi-step problem — Claude\'s instruction-following beats every alternative we tested. OpenRouter lets us swap models without re-wiring auth.',
    },
    {
        n: '04', icon: Layers,
        title: 'Score aggregation',
        model: 'Weighted sum (no LLM)',
        out: '0–100 score + band (Poor / Needs Work / Good / Excellent Vastu)',
        why: 'Severity → score weights are fixed in data/vastu_rules_v1.json — gives the same score across surfaces. Buyers see the same number whether they take the journey or use the standalone /vastu-hud.',
    },
    {
        n: '05', icon: Workflow,
        title: 'HUD overlay',
        model: 'HTML5 Canvas (client-side)',
        out: 'Severity-coloured pins, direction arrows, compass rosette drawn over the user\'s photo',
        why: 'Server-side image annotation would cost a second model invocation per request. Pushing it to the client = $0 marginal cost, <100ms render, and the buyer\'s photo never leaves the browser after the initial vision pass.',
    },
];

const Methodology = () => (
    <div className="min-h-screen bg-main">
        <SectionBackdrop variant="midnight" minHeight="45vh">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-12">
                <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase mb-5"
                    style={{ color: '#B8763D', background: 'rgba(184,118,61,0.15)', border: '1px solid rgba(184,118,61,0.35)', backdropFilter: 'blur(6px)' }}
                >
                    Methodology · how the Vastu engine works
                </div>
                <h1 className="font-serif font-black italic leading-[1.05] max-w-4xl" style={{ fontSize: 'clamp(2rem, 4.5vw, 4rem)', color: '#F4EBDD' }}>
                    Vastu compliance is <span style={{
                        background: 'linear-gradient(90deg, #B8763D 0%, #E8C896 50%, #B8763D 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite',
                    }}>a rule problem, not a vibe</span>. We treat it like one.
                </h1>
                <p className="mt-5 text-sm sm:text-base max-w-3xl leading-relaxed" style={{ color: 'rgba(244,235,221,0.78)' }}>
                    Most "AI Vastu" apps prompt an LLM and ship whatever it returns. Ours has the rule corpus
                    encoded explicitly, scores deterministically against weighted rules, and uses the LLM only
                    where reasoning is required — never as the source of truth. Every violation in the HUD
                    cites the rule that triggered it.
                </p>
            </div>
            <style>{`@keyframes a2s-shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
        </SectionBackdrop>

        <section className="bg-surface border-y border-premium">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-accent mb-3">Source corpus</p>
                <h2 className="font-serif text-2xl sm:text-3xl text-main font-black italic max-w-3xl mb-6">
                    Eight traditional texts. One IS code. Encoded as machine-readable rules.
                </h2>
                <p className="text-sm text-muted max-w-3xl mb-8">
                    Vastu Shastra spans roughly 1,400 years of overlapping treatises. We extracted residential-applicable
                    rules from eight foundational texts plus the modern Bureau of Indian Standards code. Each rule lives
                    in <code className="text-accent">LLM/data/vastu_rules_v1.json</code> with: applicable room types,
                    severity weight (1–10), required vs optional flag, citation, and the natural-language fix prescription
                    the HUD displays to the buyer.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                    {VASTU_TEXTS.map((t) => (
                        <div key={t.name} className="rounded-2xl bg-main border border-premium p-4">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                                <p className="font-semibold text-main">{t.name}</p>
                                <p className="text-[10px] text-accent font-bold uppercase tracking-wider">{t.era}</p>
                            </div>
                            <p className="text-xs text-muted">By {t.author}</p>
                            <p className="text-xs text-main mt-2 leading-snug">{t.scope}</p>
                        </div>
                    ))}
                </div>
                <p className="text-[11px] text-muted mt-6 leading-relaxed">
                    Disclosure: rule extraction was done manually by the founder in collaboration with two practising
                    Vastu consultants in Hyderabad and Chennai. The v1 corpus has 142 rules covering 9 room types. A
                    Vastu-trained ML classifier is on the post-seed roadmap — for now, the rule engine is the entire
                    methodology.
                </p>
            </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-accent mb-3">The pipeline</p>
            <h2 className="font-serif text-2xl sm:text-3xl text-main font-black italic max-w-3xl mb-8">
                Five stages. Two models. Everything else is deterministic.
            </h2>
            <div className="space-y-3">
                {PIPELINE_STAGES.map(({ n, icon: Icon, title, model, out, why }) => (
                    <div key={n} className="grid sm:grid-cols-12 gap-4 rounded-2xl bg-surface border border-premium p-5">
                        <div className="sm:col-span-1 flex sm:block items-center gap-3 sm:gap-0">
                            <p className="font-serif text-3xl text-accent font-black">{n}</p>
                            <Icon size={20} className="text-accent sm:mt-2" />
                        </div>
                        <div className="sm:col-span-11">
                            <p className="font-semibold text-main text-lg">{title}</p>
                            <div className="mt-2 grid sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-accent">Model / system</p>
                                    <p className="text-main mt-1">{model}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-accent">Output</p>
                                    <p className="text-main mt-1">{out}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-accent">Why this choice</p>
                                    <p className="text-muted mt-1 leading-snug">{why}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <section className="bg-surface border-t border-premium">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-accent mb-3">Image staging architecture</p>
                <h2 className="font-serif text-2xl sm:text-3xl text-main font-black italic max-w-3xl mb-6">
                    A tiered pipeline — SOTA when available, free-tier as fallback.
                </h2>
                <div className="grid sm:grid-cols-3 gap-3">
                    {[
                        {
                            tier: 'Tier 1 · Primary',
                            stack: 'fal.ai → FLUX.1-dev image-to-image',
                            band: 'SOTA',
                            band_color: '#B8763D',
                            note: '28-step inference, strength 0.75 — preserves walls, windows, floor. Quality on par with Midjourney v7. Costs ~$0.025/render at scale.',
                        },
                        {
                            tier: 'Tier 2 · Fallback',
                            stack: 'Cloudflare Workers AI → FLUX.1-schnell + LLaVA',
                            band: 'Free tier',
                            band_color: '#16a34a',
                            note: 'Text-to-image conditioned by LLaVA-extracted room description. 10k neurons/day on Cloudflare\'s free plan. Lower geometric fidelity but still photoreal.',
                        },
                        {
                            tier: 'Tier 3 · Last resort',
                            stack: 'Cloudflare Workers AI → SD 1.5 img2img',
                            band: 'Bulletproof',
                            band_color: '#9CA3AF',
                            note: 'Final fallback to ensure the demo never returns an empty image. Quality is lower but the system stays up.',
                        },
                    ].map((t) => (
                        <div key={t.tier} className="rounded-2xl bg-main border border-premium p-5">
                            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: t.band_color }}>{t.tier} · {t.band}</p>
                            <p className="font-semibold text-main mt-2 text-sm">{t.stack}</p>
                            <p className="text-xs text-muted mt-2 leading-relaxed">{t.note}</p>
                        </div>
                    ))}
                </div>
                <p className="text-[11px] text-muted mt-6 leading-relaxed">
                    The pipeline degrades transparently — if Tier 1 fails (network, rate limit, region outage), the
                    request is automatically retried on Tier 2, then Tier 3. Every staged image is tagged with the
                    serving tier in its <code className="text-accent">pipeline</code> field so the frontend can
                    label premium renders.
                </p>
            </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-accent mb-3">Privacy + data handling</p>
            <h2 className="font-serif text-2xl sm:text-3xl text-main font-black italic max-w-3xl mb-6">
                The buyer's photo never lands in our database.
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
                {[
                    {
                        icon: ShieldCheck,
                        title: 'No persistent image storage',
                        body: 'Uploaded room photos are sent to the vision + staging models in-flight and discarded after the response. Only the buyer\'s browser retains the image via sessionStorage.',
                    },
                    {
                        icon: Database,
                        title: 'Catalog data is open',
                        body: 'The 1,230-product catalog is publicly scraped data from IKEA, Pepperfry, HomeLane et al. — fair-use brand/price/image references with builder-attributed affiliate links.',
                    },
                    {
                        icon: Network,
                        title: 'Builder attribution is client-side',
                        body: 'The ?builderId URL parameter is stored in localStorage. No tracking pixels, no cross-builder fingerprinting, no analytics SDKs from third parties.',
                    },
                    {
                        icon: BookOpen,
                        title: 'Open-source the buyer flow',
                        body: 'The entire stack is in this GitHub repo. Builders can self-host if they need data residency — no lock-in.',
                    },
                ].map(({ icon: Icon, title, body }) => (
                    <div key={title} className="rounded-2xl bg-surface border border-premium p-5">
                        <Icon size={18} className="text-accent mb-3" />
                        <p className="font-semibold text-main">{title}</p>
                        <p className="text-sm text-muted mt-1 leading-relaxed">{body}</p>
                    </div>
                ))}
            </div>
        </section>

        <section className="bg-surface border-t border-premium">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-main font-black italic leading-tight">
                        See the methodology in action.
                    </h3>
                    <p className="text-sm text-muted mt-2 max-w-2xl">
                        Upload a room photo. Watch all five stages run. The HUD output will cite the specific
                        Vastu rule that triggered every violation.
                    </p>
                </div>
                <Link
                    to="/vastu-hud"
                    style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                    className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold hover:opacity-90 shrink-0"
                >
                    Run the Vastu HUD <ArrowRight size={15} />
                </Link>
            </div>
        </section>
    </div>
);

export default Methodology;
