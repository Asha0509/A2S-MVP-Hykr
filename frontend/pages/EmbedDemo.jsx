import React, { useEffect, useState } from 'react';
import { MapPin, IndianRupee, Bed, Bath, Maximize2, ChevronRight, ExternalLink } from 'lucide-react';

/**
 * Fake builder landing page that demonstrates how A2S embeds into a third-
 * party site. Loads its own "builder account" from localStorage (set by
 * /builder) and renders an iframe pointing at the A2S buyer flow with the
 * builder's id pinned to the URL.
 *
 * This page is intentionally styled like a generic real-estate landing
 * page (Lodha/Prestige/Brigade vibe), NOT like A2S — the point is to show
 * that A2S can drop into any builder site without clashing.
 */

const STORAGE_KEY = 'a2s-builder-account';

const FALLBACK_BUILDER = {
    builderId: 'lodha-demo-greens',
    companyName: 'Lodha Group',
    projectName: 'Lodha Greens · Wing C',
};

const SPECS = [
    { icon: Bed,       label: '3 BHK + Study' },
    { icon: Bath,      label: '3 Bathrooms' },
    { icon: Maximize2, label: '1,640 sq.ft.' },
    { icon: MapPin,    label: 'Thane West, MMR' },
];

const EmbedDemo = () => {
    const [builder, setBuilder] = useState(FALLBACK_BUILDER);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const embedUrl = `${origin}/?builderId=${builder.builderId}#/`;

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.builderId) setBuilder(parsed);
            }
        } catch (_) { /* fallback already set */ }
    }, []);

    return (
        <div style={{ background: '#0F1B22', color: '#F4EBDD', minHeight: '100vh' }} className="font-sans">
            {/* Header — disguise as a builder marketing site */}
            <header style={{ background: '#0F1B22', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div style={{ width: 36, height: 36, background: '#B8763D', borderRadius: 6 }}
                             className="flex items-center justify-center font-black italic text-white">L</div>
                        <div>
                            <p className="text-lg font-black tracking-tight" style={{ color: '#F4EBDD' }}>{builder.companyName}</p>
                            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#B8763D' }}>Live Beautifully</p>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'rgba(244,235,221,0.7)' }}>
                        <span>Projects</span>
                        <span>About</span>
                        <span>Press</span>
                        <span>Careers</span>
                        <a
                            href="#design-your-home"
                            style={{ background: '#B8763D', color: '#0F1B22', borderRadius: 999, padding: '8px 16px', fontWeight: 700 }}
                        >
                            Design your home
                        </a>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section style={{ background: '#0F1B22' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <p style={{ color: '#B8763D' }} className="text-[11px] font-bold uppercase tracking-[0.35em] mb-4">
                            Now Selling · Possession Sept 2027
                        </p>
                        <h1 className="font-serif text-4xl md:text-6xl font-black leading-tight" style={{ color: '#F4EBDD' }}>
                            {builder.projectName}.
                            <br />
                            <span style={{ color: '#B8763D', fontStyle: 'italic' }}>Your forever address.</span>
                        </h1>
                        <p className="mt-5 text-base max-w-xl" style={{ color: 'rgba(244,235,221,0.7)' }}>
                            190 elegantly crafted 3 & 4 BHK residences, ten minutes from Thane station.
                            Eight acres of landscaped gardens, twin clubhouses, and a school inside the gates.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm" style={{ color: 'rgba(244,235,221,0.8)' }}>
                            {SPECS.map(({ icon: Icon, label }) => (
                                <span key={label} className="inline-flex items-center gap-1.5">
                                    <Icon size={15} style={{ color: '#B8763D' }} /> {label}
                                </span>
                            ))}
                        </div>
                        <div className="mt-8 flex items-baseline gap-3">
                            <IndianRupee size={20} style={{ color: '#B8763D' }} />
                            <span className="font-serif text-4xl font-black" style={{ color: '#F4EBDD' }}>2.34 Cr</span>
                            <span className="text-sm" style={{ color: 'rgba(244,235,221,0.55)' }}>onwards · all inclusive</span>
                        </div>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                            <a
                                href="#design-your-home"
                                style={{ background: '#B8763D', color: '#0F1B22', borderRadius: 12, padding: '14px 22px', fontWeight: 800 }}
                                className="inline-flex items-center justify-center gap-2"
                            >
                                Design your home with AI
                                <ChevronRight size={18} />
                            </a>
                            <a
                                href="#"
                                onClick={(e) => e.preventDefault()}
                                style={{ border: '1px solid rgba(244,235,221,0.25)', color: '#F4EBDD', borderRadius: 12, padding: '14px 22px', fontWeight: 600 }}
                                className="inline-flex items-center justify-center gap-2"
                            >
                                Schedule a site visit
                            </a>
                        </div>
                    </div>
                    <div className="relative">
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #1D6172 0%, #0F1B22 100%)',
                                borderRadius: 24,
                                aspectRatio: '4/3',
                                boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                            }}
                            className="relative overflow-hidden flex items-center justify-center"
                        >
                            <div style={{ color: 'rgba(244,235,221,0.4)' }} className="text-center">
                                <p className="text-[10px] uppercase tracking-[0.4em] mb-2">Render</p>
                                <p className="font-serif italic text-2xl">Aerial view · Lodha Greens · 8 acres</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* "Design your home" embed section — this is the A2S iframe */}
            <section id="design-your-home" style={{ background: '#F4EBDD' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex flex-col items-center text-center mb-10">
                        <p style={{ color: '#B8763D' }} className="text-[11px] font-bold uppercase tracking-[0.35em] mb-3">
                            Exclusive for {builder.companyName} buyers
                        </p>
                        <h2 className="font-serif text-3xl md:text-5xl font-black italic leading-tight" style={{ color: '#0F1B22' }}>
                            Walk into your home, before it's built.
                        </h2>
                        <p className="mt-4 max-w-2xl text-base" style={{ color: '#0F1B22', opacity: 0.7 }}>
                            Upload your floor plan or a room photo, pick a style, and watch AI stage your future home — fully furnished, with a complete shopping list of every item you see.
                        </p>
                        <p className="mt-3 text-xs" style={{ color: '#0F1B22', opacity: 0.5 }}>
                            Powered by A2S · Embedded for{' '}
                            <span style={{ color: '#1D6172', fontWeight: 700 }}>{builder.projectName}</span>
                        </p>
                    </div>

                    <div
                        style={{
                            borderRadius: 24,
                            overflow: 'hidden',
                            background: '#fff',
                            boxShadow: '0 30px 80px rgba(15,27,34,0.18)',
                            border: '1px solid rgba(0,0,0,0.06)',
                        }}
                    >
                        <iframe
                            title={`A2S embedded in ${builder.companyName}`}
                            src={embedUrl}
                            width="100%"
                            height={900}
                            style={{ border: 0, display: 'block' }}
                            loading="lazy"
                            allow="camera; clipboard-write"
                        />
                    </div>

                    <p className="text-center text-xs mt-6" style={{ color: '#0F1B22', opacity: 0.55 }}>
                        Embed URL:{' '}
                        <code style={{ background: '#fff', padding: '2px 8px', borderRadius: 4, color: '#1D6172' }}>
                            {embedUrl}
                        </code>{' '}
                        ·{' '}
                        <a
                            href="/#/builder"
                            style={{ color: '#1D6172', textDecoration: 'underline' }}
                            className="inline-flex items-center gap-1"
                        >
                            Get this for your project
                            <ExternalLink size={11} />
                        </a>
                    </p>
                </div>
            </section>

            <footer style={{ background: '#0F1B22', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs" style={{ color: 'rgba(244,235,221,0.4)' }}>
                    © {new Date().getFullYear()} {builder.companyName} · This is a demo of the A2S builder embed, not a real listing.
                </div>
            </footer>
        </div>
    );
};

export default EmbedDemo;
