import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, MapPin, GitBranch, Cpu, Compass, Layers, Building2,
    Mail, Github, Linkedin,
} from 'lucide-react';
import SectionBackdrop from '../components/SectionBackdrop';

const Pillar = ({ icon: Icon, title, body }) => (
    <div className="rounded-2xl bg-surface border border-premium p-5">
        <Icon size={18} className="text-accent mb-3" />
        <p className="font-semibold text-main">{title}</p>
        <p className="text-sm text-muted mt-1 leading-relaxed">{body}</p>
    </div>
);

const About = () => {
    const [intent, setIntent] = useState('builder');
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', org: '', note: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...form, intent, submittedAt: new Date().toISOString() };
        const prior = JSON.parse(localStorage.getItem('a2s-pilot-inquiries') || '[]');
        prior.push(payload);
        localStorage.setItem('a2s-pilot-inquiries', JSON.stringify(prior));
        setSubmitted(true);
        setForm({ name: '', email: '', org: '', note: '' });
    };

    return (
        <div className="min-h-screen bg-main">
            <SectionBackdrop variant="dark" minHeight="55vh">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-14">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase mb-5"
                        style={{ color: '#B8763D', background: 'rgba(184,118,61,0.15)', border: '1px solid rgba(184,118,61,0.35)', backdropFilter: 'blur(6px)' }}
                    >
                        Founder · Asha Jyothi Boddu
                    </div>
                    <h1 className="font-serif font-black italic leading-[1.05] max-w-4xl" style={{ fontSize: 'clamp(2rem, 4.5vw, 4rem)', color: '#F4EBDD' }}>
                        I spent <span style={{
                            background: 'linear-gradient(90deg, #B8763D 0%, #E8C896 50%, #B8763D 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite',
                        }}>eighteen months</span> watching Indian homebuyers struggle with the same three things.
                    </h1>

                    <div className="mt-7 space-y-4 text-sm sm:text-base max-w-3xl leading-relaxed" style={{ color: 'rgba(244,235,221,0.78)' }}>
                        <p>
                            I started A2S in 2024 as a consumer-facing interior design service — visit the home, recommend a style,
                            source furniture, coordinate vendors. Operationally heavy. Margin-thin. I ran 30+ projects with friends
                            and family acting as the test users.
                        </p>
                        <p>
                            What I learned, repeatedly, in every single project: <span className="font-semibold" style={{ color: '#F4EBDD' }}>the buyer
                            had already chosen the flat before they knew how it would feel furnished, whether the layout was
                            Vastu-compliant, or what the total cost of making it livable actually was.</span> The builder had no
                            answer either. So the gap stayed open for months after possession — buyers spent on consultants, made
                            compromises, posted regrets on Reddit.
                        </p>
                        <p>
                            A2S is the answer to that gap: <span style={{ color: '#F4EBDD' }}>close it at the point of sale</span>. Builders
                            embed our buyer journey on their project landing page. Every buyer, before they sign, designs every room
                            of their unit — AI-staged, Vastu-scored, with a costed shopping list from brands the builder has deals
                            with. Builder converts more buyers. Buyer doesn't panic post-possession.
                        </p>
                        <p className="font-semibold" style={{ color: '#F4EBDD' }}>
                            That's the thesis. Eighteen months of operations told me to build it.
                        </p>
                    </div>
                </div>
                <style>{`@keyframes a2s-shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
            </SectionBackdrop>

            <section className="bg-surface border-y border-premium">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-accent mb-3">What's actually in the MVP</p>
                    <h2 className="font-serif text-xl sm:text-3xl text-main font-black italic max-w-3xl">
                        Honest scope. No vapor.
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7 sm:mt-8">
                        <Pillar icon={Building2} title="Builder portal" body="Account, embed snippet, curated brand tiers. Live and persistent in this build." />
                        <Pillar icon={Layers} title="3-step buyer journey" body="Pick rooms → pick style → stage each. State persists across refresh." />
                        <Pillar icon={Cpu} title="FLUX-schnell + LLaVA pipeline" body="Vision describes the room; FLUX-1-schnell generates magazine-grade renders. Free tier." />
                        <Pillar icon={Compass} title="Vastu HUD overlay" body="Compliance markers drawn on the buyer's actual photo. The visible USP. No other app does this." />
                    </div>
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-accent mb-3">Where this stops being an MVP</p>
                <h2 className="font-serif text-xl sm:text-3xl text-main font-black italic max-w-3xl mb-6">
                    What I'd build with your check.
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { milestone: 'Months 1–3', headline: 'First 3 builder pilots', detail: 'Mid-tier Bangalore + Pune builders. Embed live on real project landing pages. Real engagement data populating the dashboards I deliberately did NOT fake.' },
                        { milestone: 'Months 4–6', headline: 'Proprietary Vastu corpus', detail: 'Train a custom Vastu compliance model on 10k+ Indian floor plans. Goes from rule-engine to ML-grade. This is the data moat.' },
                        { milestone: 'Months 7–9', headline: 'Catalog supply graph',  detail: 'Direct API integration with HomeLane, Pepperfry, Asian Paints stock + price feeds. Replace scraped catalog with verified live availability.' },
                        { milestone: 'Months 10–12', headline: 'Seed round',           detail: '$1-2M raise on the back of pilot signals + proprietary Vastu data + verified catalog. Hire a 4-person team. Expand to 25 builders.' },
                    ].map((p) => (
                        <div key={p.milestone} className="rounded-2xl bg-surface border border-premium p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{p.milestone}</p>
                            <p className="font-semibold text-main text-lg mt-2">{p.headline}</p>
                            <p className="text-sm text-muted mt-2 leading-relaxed">{p.detail}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-surface border-t border-premium">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-accent mb-3">Get in touch</p>
                    <h2 className="font-serif text-2xl sm:text-3xl text-main font-black italic">
                        Reach out — pilot, press, partnership, or critique.
                    </h2>
                    <p className="text-sm text-muted mt-2">
                        I read every message myself. No CRM, no auto-reply, no "hi {'{'}name{'}'}".
                    </p>

                    {submitted ? (
                        <div className="mt-8 rounded-2xl border border-accent bg-accent/5 p-6 text-center">
                            <p className="font-semibold text-main">Thanks — message saved. I&apos;ll be in touch within 24 hours.</p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="mt-3 text-sm text-accent font-semibold hover:opacity-80"
                            >
                                Send another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-8 rounded-2xl bg-main border border-premium p-6 space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { id: 'builder',     label: 'I run a builder' },
                                    { id: 'investor',    label: 'I invest' },
                                    { id: 'partner',     label: 'Partnership' },
                                    { id: 'other',       label: 'Other' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setIntent(opt.id)}
                                        className={`rounded-lg text-xs font-semibold py-2 px-2 border transition ${
                                            intent === opt.id ? 'border-accent bg-accent/10 text-accent' : 'border-premium text-muted hover:text-main'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <input
                                    required
                                    placeholder="Your name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full rounded-lg border border-premium bg-surface px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                                <input
                                    required
                                    type="email"
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full rounded-lg border border-premium bg-surface px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                            <input
                                placeholder="Company / organisation (optional)"
                                value={form.org}
                                onChange={(e) => setForm({ ...form, org: e.target.value })}
                                className="w-full rounded-lg border border-premium bg-surface px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                            <textarea
                                placeholder="What's on your mind?"
                                rows={3}
                                value={form.note}
                                onChange={(e) => setForm({ ...form, note: e.target.value })}
                                className="w-full rounded-lg border border-premium bg-surface px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                            <button
                                type="submit"
                                style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold py-3 text-sm hover:opacity-90"
                            >
                                Send <ArrowRight size={15} />
                            </button>
                            <p className="text-[10px] text-muted text-center">
                                Stored locally only in the MVP. Production version routes to my inbox.
                            </p>
                        </form>
                    )}

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8 text-sm text-muted">
                        <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-accent" /> Hyderabad, India</span>
                        <span className="hidden sm:inline">·</span>
                        <a href="https://github.com/Asha0509/A2S-MVP-Hykr" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 hover:text-accent">
                            <Github size={14} /> GitHub
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
