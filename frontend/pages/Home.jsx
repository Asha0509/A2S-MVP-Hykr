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
