import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Layers, Award, Building2, Eye,
    IndianRupee, Wand2, Tag,
} from 'lucide-react';

const Stat = ({ value, label, sub }) => (
    <div>
        <p className="font-serif text-4xl sm:text-5xl font-black text-main leading-none">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mt-2">{label}</p>
        {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
);

const Pillar = ({ icon: Icon, title, body }) => (
    <div className="rounded-2xl bg-surface border border-premium p-5">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
            <Icon size={18} className="text-accent" />
        </div>
        <p className="font-semibold text-main">{title}</p>
        <p className="text-sm text-muted mt-1 leading-relaxed">{body}</p>
    </div>
);

// Illustrative visual for the buyer-journey frames. SVG, no stock photos.
const FrameVisual = ({ kind }) => {
    if (kind === 'upload') {
        return (
            <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <linearGradient id="upWall" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E8E0D1" />
                        <stop offset="100%" stopColor="#C9BFAA" />
                    </linearGradient>
                </defs>
                <rect width="400" height="240" fill="#F4EBDD" />
                <polygon points="60,30 340,30 360,210 40,210" fill="url(#upWall)" />
                <rect x="170" y="70" width="60" height="80" fill="#FAF6EE" stroke="#A89878" />
                <polygon points="40,210 360,210 380,235 20,235" fill="#8B7B5E" />
                <text x="200" y="220" textAnchor="middle" fontSize="11" fill="#6B5E45" fontFamily="Inter, sans-serif" letterSpacing="2">EMPTY · UNFURNISHED</text>
            </svg>
        );
    }
    if (kind === 'stage') {
        return (
            <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <linearGradient id="stWall" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F2EAD7" />
                        <stop offset="100%" stopColor="#D4C5A4" />
                    </linearGradient>
                    <linearGradient id="stFloor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7A5E3C" />
                        <stop offset="100%" stopColor="#5C4429" />
                    </linearGradient>
                </defs>
                <rect width="400" height="240" fill="#F4EBDD" />
                <polygon points="60,30 340,30 360,210 40,210" fill="url(#stWall)" />
                <polygon points="40,210 360,210 380,235 20,235" fill="url(#stFloor)" />
                <rect x="170" y="60" width="60" height="80" fill="#FFF7E6" stroke="#9C8666" />
                <line x1="200" y1="60" x2="200" y2="140" stroke="#9C8666" />
                {/* Sofa */}
                <rect x="100" y="155" width="120" height="35" rx="6" fill="#3E5E5C" />
                <rect x="100" y="135" width="120" height="25" rx="4" fill="#4A6E6C" />
                <rect x="100" y="135" width="20" height="55" rx="4" fill="#3E5E5C" />
                <rect x="200" y="135" width="20" height="55" rx="4" fill="#3E5E5C" />
                {/* Lamp */}
                <line x1="265" y1="190" x2="265" y2="120" stroke="#B8763D" strokeWidth="2" />
                <ellipse cx="265" cy="115" rx="18" ry="10" fill="#E8C896" />
                <circle cx="265" cy="115" r="6" fill="#FFF1D6" opacity="0.7" />
                {/* Rug */}
                <ellipse cx="180" cy="200" rx="105" ry="14" fill="#B8763D" opacity="0.25" />
                {/* Plant */}
                <rect x="305" y="170" width="20" height="22" fill="#5C4429" />
                <path d="M 315 170 Q 295 145 305 130 Q 320 145 315 170 Z" fill="#3E5E3C" />
                <path d="M 315 170 Q 335 150 325 130 Q 310 150 315 170 Z" fill="#4A6E4A" />
                <text x="200" y="225" textAnchor="middle" fontSize="11" fill="#1D6172" fontFamily="Inter, sans-serif" fontWeight="700" letterSpacing="2">CONTEMPORARY · STAGED</text>
            </svg>
        );
    }
    // vastu
    return (
        <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
                <linearGradient id="vWall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F2EAD7" />
                    <stop offset="100%" stopColor="#D4C5A4" />
                </linearGradient>
            </defs>
            <rect width="400" height="240" fill="#0F1B22" />
            <g opacity="0.6">
                <polygon points="60,30 340,30 360,210 40,210" fill="url(#vWall)" />
                <polygon points="40,210 360,210 380,235 20,235" fill="#7A5E3C" />
                <rect x="100" y="135" width="120" height="55" rx="4" fill="#4A6E6C" />
                <rect x="170" y="60" width="60" height="80" fill="#FFF7E6" stroke="#9C8666" />
            </g>
            <rect width="400" height="240" fill="rgba(0,0,0,0.25)" />
            {/* Violation pin 1 - red */}
            <circle cx="160" cy="160" r="22" fill="rgba(220,38,38,0.5)" />
            <circle cx="160" cy="160" r="14" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
            <text x="160" y="165" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="700" fontFamily="Inter, sans-serif">1</text>
            {/* arrow from pin 1 */}
            <line x1="160" y1="160" x2="210" y2="160" stroke="#dc2626" strokeWidth="3" />
            <polygon points="210,160 200,155 200,165" fill="#dc2626" />
            <text x="220" y="163" fontSize="10" fill="#fff" fontWeight="700" fontFamily="Inter, sans-serif">E</text>
            {/* Violation pin 2 - amber */}
            <circle cx="285" cy="100" r="22" fill="rgba(245,158,11,0.5)" />
            <circle cx="285" cy="100" r="14" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
            <text x="285" y="105" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="700" fontFamily="Inter, sans-serif">2</text>
            {/* Compass top-right */}
            <circle cx="350" cy="50" r="22" fill="rgba(15,27,34,0.85)" stroke="#B8763D" strokeWidth="2" />
            <text x="350" y="38" textAnchor="middle" fontSize="9" fill="#B8763D" fontWeight="700" fontFamily="Inter, sans-serif">N</text>
            <line x1="350" y1="50" x2="350" y2="34" stroke="#B8763D" strokeWidth="3" />
            <circle cx="350" cy="34" r="3" fill="#B8763D" />
            <text x="200" y="225" textAnchor="middle" fontSize="11" fill="#B8763D" fontWeight="700" fontFamily="Inter, sans-serif" letterSpacing="2">VASTU HUD · 2 VIOLATIONS</text>
        </svg>
    );
};

const FrameCard = ({ stepLabel, title, description, visualKind }) => (
    <div className="rounded-2xl bg-surface border border-premium overflow-hidden flex flex-col">
        <div className="aspect-[5/3] bg-main relative">
            <FrameVisual kind={visualKind} />
        </div>
        <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">{stepLabel}</p>
            <p className="font-semibold text-main mt-2 text-lg">{title}</p>
            <p className="text-sm text-muted mt-2 leading-relaxed">{description}</p>
        </div>
    </div>
);

const Home = () => {
    return (
        <div className="min-h-screen bg-main">
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px]" />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-[0.3em] uppercase mb-6">
                        AI infrastructure · For Indian builders
                    </div>

                    <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-black text-main leading-[1.05] italic max-w-4xl">
                        Every flat you sell <br className="hidden sm:block" />
                        ships with an <span className="text-accent">AI interior designer</span>.
                    </h1>

                    <p className="mt-6 text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
                        Builders embed A2S on their project landing page. Their buyers design every room of their future home —
                        AI-staged, Vastu-scored, with a complete shopping list from the brands the builder already has deals with.
                        A2S handles the experience. The builder earns the commission.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Link
                            to="/builder"
                            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold hover:opacity-90"
                        >
                            <Building2 size={16} /> Builder workspace
                            <ArrowRight size={15} />
                        </Link>
                        <Link
                            to="/embed-demo"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent px-6 py-3.5 text-sm font-semibold text-accent hover:bg-accent/5"
                        >
                            <Eye size={16} /> See it embedded
                        </Link>
                        <Link
                            to="/design"
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold text-muted hover:text-main"
                        >
                            <Layers size={16} /> Try the buyer journey
                        </Link>
                    </div>

                    <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
                        <Stat value="9"      label="Vendor brands" sub="IKEA · HomeLane · Pepperfry +6" />
                        <Stat value="6"      label="Design styles" sub="Modern → Ethnic" />
                        <Stat value="4"      label="Rooms in flow" sub="Living · Bedroom · Kitchen · Pooja" />
                        <Stat value="100"    label="Vastu points"  sub="Auto-scored, on the photo" />
                    </div>
                </div>
            </section>

            {/* Visible product proof — the buyer flow narrated as 3 frames */}
            <section className="border-y border-premium" style={{ background: 'linear-gradient(180deg, var(--bg-main) 0%, var(--base-parchment) 100%)' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-accent mb-3">The buyer journey, narrated</p>
                    <h2 className="font-serif text-3xl sm:text-4xl text-main font-black italic max-w-3xl leading-tight">
                        From empty unit to designed home — in five minutes.
                    </h2>

                    <div className="grid lg:grid-cols-3 gap-4 mt-10">
                        <FrameCard
                            stepLabel="01 · Buyer uploads"
                            title="Their actual room photo"
                            description="Empty flat, half-furnished apartment, raw shell — doesn't matter. The buyer just drops in what they have."
                            visualKind="upload"
                        />
                        <FrameCard
                            stepLabel="02 · A2S analyses + stages"
                            title="FLUX-1 generates the magazine cover"
                            description="LLaVA describes the room. FLUX-1-schnell stages it in the buyer's chosen style. Magazine-grade photoreal output in ~8 seconds."
                            visualKind="stage"
                        />
                        <FrameCard
                            stepLabel="03 · Vastu HUD overlay"
                            title="Compliance, drawn on the room"
                            description="Compass + violation pins + directional arrows pinned on the photo itself. Severity-coded. No other tool does this in India."
                            visualKind="vastu"
                        />
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl bg-surface border border-premium p-5">
                        <div className="flex-1">
                            <p className="font-semibold text-main">Then a summary screen rolls it all up.</p>
                            <p className="text-sm text-muted mt-1">
                                Every room rendered side-by-side, Vastu badges per room, total home cost in lakhs, EMI calculated.
                                Buyer walks away with a complete shopping list — every item a real SKU from the builder&apos;s curated brand tiers.
                            </p>
                        </div>
                        <Link
                            to="/design"
                            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold hover:opacity-90 shrink-0"
                        >
                            Try the buyer journey <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* The pitch */}
            <section className="bg-surface border-y border-premium">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-accent mb-3">What no builder's 3D agency does</p>
                    <h2 className="font-serif text-3xl sm:text-4xl text-main font-black italic max-w-3xl leading-tight">
                        Builders model <span className="text-accent">one demo flat</span>.
                        A2S models <span className="text-accent">every buyer's home</span> — to their style, their Vastu, their budget.
                    </h2>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
                        <Pillar
                            icon={Wand2}
                            title="Per-buyer AI staging"
                            body="Empty room photo to magazine-cover render in seconds. Walls and windows preserved — only the furniture changes."
                        />
                        <Pillar
                            icon={Award}
                            title="Vastu, baked in"
                            body="Every room auto-scored against a 100-point Vastu rule engine — red/amber/green badges with the fixes spelled out."
                        />
                        <Pillar
                            icon={Tag}
                            title="Builder-curated catalog"
                            body="Builders pick which brands they have deals with. Their buyers only see those brands in the shopping list."
                        />
                        <Pillar
                            icon={IndianRupee}
                            title="Costed by the lakh, EMI-ready"
                            body="Every render rolls up to a single number: 'Your home as designed — ₹6.4L, EMI ₹17,700/mo.' No more guessing."
                        />
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-accent mb-3">How A2S fits in</p>
                <h2 className="font-serif text-3xl sm:text-4xl text-main font-black italic max-w-3xl leading-tight">
                    Three steps. Zero infrastructure on the builder's side.
                </h2>

                <div className="grid lg:grid-cols-3 gap-4 mt-10">
                    {[
                        {
                            n: '01',
                            title: 'Builder signs up',
                            body: 'Creates a workspace in 30 seconds. Picks the brands they have negotiated bulk pricing with. Copies an iframe snippet.',
                            cta: { to: '/builder', label: 'Open builder workspace' },
                        },
                        {
                            n: '02',
                            title: 'Embeds on their site',
                            body: 'Drops the snippet into their project landing page. A2S renders inside their domain. No DNS, no SSO, no integration.',
                            cta: { to: '/embed-demo', label: 'See the embed in action' },
                        },
                        {
                            n: '03',
                            title: 'Buyer designs their home',
                            body: 'Picks rooms, picks a style, uploads photos. Walks away with an AI-staged home, a Vastu compliance report, and a costed shopping list.',
                            cta: { to: '/design', label: 'Try the buyer journey' },
                        },
                    ].map((step) => (
                        <div key={step.n} className="rounded-2xl bg-surface border border-premium p-6 flex flex-col">
                            <p className="font-serif text-2xl font-black text-accent">{step.n}</p>
                            <p className="font-semibold text-main mt-3 text-lg">{step.title}</p>
                            <p className="text-sm text-muted mt-2 leading-relaxed flex-1">{step.body}</p>
                            <Link
                                to={step.cta.to}
                                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:opacity-80"
                            >
                                {step.cta.label} <ArrowRight size={14} />
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Closing CTA strip */}
            <section className="bg-surface border-t border-premium">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                        <h3 className="font-serif text-2xl sm:text-3xl text-main font-black italic leading-tight">
                            One embed. <span className="text-accent">Every buyer designs their own home.</span>
                        </h3>
                        <p className="text-sm text-muted mt-2 max-w-2xl">
                            Built in India for the Indian housing market. The full stack — buyer journey, Vastu HUD, AI staging, builder dashboard — runs from a single open-source repo.
                        </p>
                    </div>
                    <Link
                        to="/builder"
                        style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold hover:opacity-90 shrink-0"
                    >
                        Start a builder workspace <ArrowRight size={15} />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
