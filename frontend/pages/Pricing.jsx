import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Shield, ArrowRight } from 'lucide-react';

const TIERS = [
    {
        id: 'pilot',
        name: 'Pilot',
        price: 'Free',
        cadence: 'forever for the first 3 builders',
        tagline: 'For: validation partners. Closed when 3 slots fill.',
        bullets: [
            'All core features unlocked',
            '100 buyer journeys per month included',
            'Curated catalog (Pepperfry, HomeLane, Nilkamal, Godrej Interio)',
            'Vastu HUD + buyer engagement embed',
            'Email support (48-hour response)',
            'No contract, no credit card',
        ],
        cta: { label: 'Apply for pilot', to: '/about' },
        recommended: false,
    },
    {
        id: 'growth',
        name: 'Growth',
        price: '₹15,000',
        priceSuffix: '/month per project',
        cadence: '+ 8% commission on referred furniture purchases',
        tagline: 'For: mid-tier real estate developers with 1-5 active projects.',
        bullets: [
            'Unlimited buyer journeys',
            'Custom brand tier curation per project',
            'Builder dashboard with real conversion analytics',
            'Priority Vastu engine updates',
            'WhatsApp support (same-day response)',
            'Cancel anytime, no annual lock-in',
            'Commission only on attributed conversions',
        ],
        cta: { label: 'Start your project', to: '/builder' },
        recommended: true,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        priceSuffix: 'starts at ₹2L/month',
        cadence: '12-month minimum, volume pricing on commission',
        tagline: 'For: top-25 Indian builders by unit volume.',
        bullets: [
            'Multi-project workspaces with role-based access',
            'SOC2 + India data residency commitments',
            'Custom AI model fine-tuning on builder catalog',
            'Dedicated customer success manager',
            'SLA-backed uptime (99.9%)',
            'White-label option (your domain, your brand)',
            'Direct integration with builder CRM/ERP',
        ],
        cta: { label: 'Book a call', to: '/about' },
        recommended: false,
    },
];

const FAQS = [
    {
        q: 'Why commission-based instead of seat-based?',
        a: 'Because builder ROI scales with conversions, not headcount. A sales team that uses A2S 100 times a month should not pay the same as one that uses it 10 times. You pay when buyers actually engage with what we built.',
    },
    {
        q: 'How are conversions tracked?',
        a: 'The A2S embed pings our service on cart-add inside your buyer flow. We never see your CRM, never read your contracts, and never touch your bank reconciliation. Attribution is verifiable in the builder dashboard.',
    },
    {
        q: 'What if my buyers don\'t use the embed?',
        a: 'You only pay if they do. The embed is free to deploy on your project microsites. No buyer activity means zero commission and zero monthly minimum on the Pilot tier.',
    },
    {
        q: 'Can I cancel anytime?',
        a: 'Yes on Pilot and Growth — no contract, no cancellation fee, your data exports as JSON on request. Enterprise has a 12-month minimum because of the dedicated CSM, custom fine-tuning, and SLA infrastructure committed upfront.',
    },
];

const PILOT_GAPS = [
    'Real builder dashboard analytics (MVP ships with empty-state cards, populated as your buyers engage)',
    'Custom catalog API integrations (pilot uses our curated scraped catalog — your SKUs come in Growth tier)',
    'SOC2 certification (planned post-seed; we run on Azure with encrypted-at-rest storage today)',
    'White-label domains (your buyers see app.a2s.in during the pilot)',
];

const TierCard = ({ tier }) => {
    const isRecommended = tier.recommended;
    return (
        <div
            className={`relative rounded-3xl border p-8 flex flex-col h-full transition-all ${
                isRecommended
                    ? 'border-accent shadow-2xl bg-surface scale-[1.02]'
                    : 'border-premium bg-surface hover:border-accent/40'
            }`}
        >
            {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em]"
                        style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                    >
                        <Sparkles size={11} /> Recommended
                    </span>
                </div>
            )}

            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-3">
                    {tier.name}
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-serif text-5xl font-black text-main italic">
                        {tier.price}
                    </span>
                    {tier.priceSuffix && (
                        <span className="text-sm text-muted font-semibold">
                            {tier.priceSuffix}
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted mt-2 leading-relaxed">{tier.cadence}</p>
            </div>

            <div className="mt-5 mb-6">
                <p className="text-sm text-main font-semibold leading-relaxed italic">
                    {tier.tagline}
                </p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
                {tier.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Check size={12} className="text-accent" strokeWidth={3} />
                        </span>
                        <span className="text-sm text-main leading-relaxed">{bullet}</span>
                    </li>
                ))}
            </ul>

            <Link
                to={tier.cta.to}
                className={`group flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all focus-premium ${
                    isRecommended ? '' : 'border border-accent text-accent hover:bg-accent/10'
                }`}
                style={
                    isRecommended
                        ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                        : undefined
                }
            >
                {tier.cta.label}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
        </div>
    );
};

const Pricing = () => {
    return (
        <div className="min-h-screen bg-main">
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-[0.3em] uppercase mb-6">
                        Pricing
                    </div>

                    <h1 className="font-serif text-4xl sm:text-6xl text-main font-black italic leading-[1.05] max-w-4xl mx-auto">
                        Pricing that scales with <span className="text-accent">conversions</span>, not licences.
                    </h1>

                    <p className="mt-6 text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
                        Pilot is free for our first 3 builders. After that, you pay only when buyers actually engage.
                    </p>
                </div>
            </section>

            <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-6">
                    {TIERS.map((tier) => (
                        <TierCard key={tier.id} tier={tier} />
                    ))}
                </div>
            </section>

            <section className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="rounded-3xl border border-premium bg-surface p-8 sm:p-10">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Shield size={18} className="text-accent" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-2">
                                Honest disclosure
                            </p>
                            <h2 className="font-serif text-2xl sm:text-3xl text-main font-black italic leading-tight">
                                What's NOT included in the pilot
                            </h2>
                            <p className="text-sm text-muted mt-3 leading-relaxed">
                                We would rather you know upfront. The MVP ships with these gaps — we are filling them
                                during the pilot phase with input from our first 3 builders.
                            </p>
                        </div>
                    </div>

                    <ul className="mt-6 space-y-3 ml-14">
                        {PILOT_GAPS.map((gap) => (
                            <li key={gap} className="flex items-start gap-3">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                                <span className="text-sm text-main leading-relaxed">{gap}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="text-center mb-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-3">
                        Frequently asked
                    </p>
                    <h2 className="font-serif text-3xl sm:text-4xl text-main font-black italic leading-tight">
                        How the commission model works
                    </h2>
                </div>

                <div className="space-y-4">
                    {FAQS.map((faq) => (
                        <details
                            key={faq.q}
                            className="group rounded-2xl border border-premium bg-surface p-6 transition-all hover:border-accent/40"
                        >
                            <summary className="flex items-center justify-between cursor-pointer list-none">
                                <span className="text-base sm:text-lg font-semibold text-main pr-4">
                                    {faq.q}
                                </span>
                                <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 transition-transform group-open:rotate-45">
                                    <span className="text-accent text-lg leading-none">+</span>
                                </span>
                            </summary>
                            <p className="mt-4 text-sm text-muted leading-relaxed">{faq.a}</p>
                        </details>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-sm text-muted mb-5">
                        Have a question we did not answer here?
                    </p>
                    <Link
                        to="/about"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all focus-premium"
                        style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                    >
                        Talk to the founder
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Pricing;
