import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Eye, Layers, Sparkles, Cpu, Compass } from 'lucide-react';

// ---------- 3D tilt-on-mousemove wrapper ----------
const Tilt = ({ children, max = 8, className = '', style = {} }) => {
    const ref = useRef(null);
    const [t, setT] = useState({ x: 0, y: 0 });

    const onMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        setT({ x: -py * max * 2, y: px * max * 2 });
    };
    const onLeave = () => setT({ x: 0, y: 0 });

    return (
        <div
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            className={className}
            style={{
                transform: `perspective(1000px) rotateX(${t.x}deg) rotateY(${t.y}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
                willChange: 'transform',
                ...style,
            }}
        >
            {children}
        </div>
    );
};

// ---------- Animated AI Pipeline visualisation ----------
const Pipeline = () => {
    const [phase, setPhase] = useState(0); // 0 upload, 1 vision, 2 prompt, 3 render
    useEffect(() => {
        const id = setInterval(() => setPhase((p) => (p + 1) % 4), 2400);
        return () => clearInterval(id);
    }, []);

    const stages = [
        { icon: Eye,      label: 'BUYER UPLOAD',  hint: 'Empty room photo' },
        { icon: Cpu,      label: 'LLAVA VISION',  hint: 'Walls · floor · windows extracted' },
        { icon: Sparkles, label: 'FLUX PROMPT',   hint: 'Conditioned by style + Vastu' },
        { icon: Compass,  label: 'RENDER + HUD',  hint: 'Photoreal + compliance markers' },
    ];

    return (
        <div className="relative">
            <div className="grid grid-cols-4 gap-2">
                {stages.map((s, i) => {
                    const Icon = s.icon;
                    const active = phase === i;
                    const done = i < phase;
                    return (
                        <div key={s.label} className="flex flex-col items-center text-center relative">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500"
                                style={{
                                    backgroundColor: active
                                        ? 'var(--accent)'
                                        : done
                                            ? 'rgba(29,97,114,0.4)'
                                            : 'rgba(244,235,221,0.08)',
                                    transform: active ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                                    boxShadow: active ? '0 8px 24px rgba(29,97,114,0.45)' : 'none',
                                }}
                            >
                                <Icon size={20} color={active || done ? '#FFF7E6' : 'rgba(244,235,221,0.4)'} />
                            </div>
                            <p
                                className="mt-2 text-[9px] font-bold tracking-[0.18em]"
                                style={{ color: active ? '#F4EBDD' : 'rgba(244,235,221,0.4)' }}
                            >
                                {s.label}
                            </p>
                            <p
                                className="text-[10px] mt-0.5 leading-snug px-1"
                                style={{
                                    color: active ? 'rgba(244,235,221,0.9)' : 'rgba(244,235,221,0.3)',
                                    minHeight: 28,
                                }}
                            >
                                {s.hint}
                            </p>
                            {i < stages.length - 1 && (
                                <div
                                    className="absolute top-6 right-0 translate-x-1/2 h-px w-4 sm:w-8"
                                    style={{
                                        background: i < phase ? 'var(--accent)' : 'rgba(244,235,221,0.18)',
                                        boxShadow: i < phase ? '0 0 12px rgba(29,97,114,0.7)' : 'none',
                                        transition: 'all 500ms',
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ---------- Cinematic hero ----------
const CinematicHero = () => {
    const [scrollY, setScrollY] = useState(0);
    const wrapRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const parY = Math.min(scrollY * 0.4, 120);
    const parOpacity = Math.max(1 - scrollY / 600, 0.0);

    return (
        <section
            ref={wrapRef}
            className="relative overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #0F1B22 0%, #142733 55%, #1D6172 100%)',
                color: '#F4EBDD',
                minHeight: '92vh',
            }}
        >
            {/* parallax gradient orbs */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `translate3d(0, ${parY * 0.6}px, 0)`, opacity: parOpacity }}
            >
                <div
                    className="absolute"
                    style={{
                        top: '-10%', right: '-5%', width: 700, height: 700,
                        background: 'radial-gradient(closest-side, rgba(184,118,61,0.35), transparent 70%)',
                        filter: 'blur(20px)',
                    }}
                />
                <div
                    className="absolute"
                    style={{
                        bottom: '-15%', left: '-10%', width: 800, height: 800,
                        background: 'radial-gradient(closest-side, rgba(29,97,114,0.55), transparent 70%)',
                        filter: 'blur(30px)',
                    }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(244,235,221,0.06) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        maskImage: 'radial-gradient(closest-side at 50% 30%, #000 30%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(closest-side at 50% 30%, #000 30%, transparent 80%)',
                    }}
                />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-36 pb-16 grid lg:grid-cols-12 gap-10 items-center">
                {/* Copy + CTAs */}
                <div className="lg:col-span-7" style={{ transform: `translate3d(0, ${parY * -0.15}px, 0)` }}>
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase mb-6"
                        style={{
                            color: '#B8763D',
                            background: 'rgba(184,118,61,0.12)',
                            border: '1px solid rgba(184,118,61,0.35)',
                            backdropFilter: 'blur(6px)',
                        }}
                    >
                        <Sparkles size={12} /> AI infrastructure · For Indian builders
                    </div>

                    <h1
                        className="font-serif font-black italic leading-[1.02]"
                        style={{
                            fontSize: 'clamp(2.25rem, 5.5vw, 5.5rem)',
                            color: '#F4EBDD',
                            textShadow: '0 6px 40px rgba(0,0,0,0.4)',
                        }}
                    >
                        Every flat you sell <br />
                        ships with an{' '}
                        <span
                            style={{
                                background: 'linear-gradient(90deg, #B8763D 0%, #E8C896 50%, #B8763D 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundSize: '200% 100%',
                                animation: 'a2s-shimmer 6s linear infinite',
                            }}
                        >
                            AI interior designer
                        </span>.
                    </h1>

                    <p className="mt-6 text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: 'rgba(244,235,221,0.78)' }}>
                        Builders embed A2S on their project landing page. Their buyers design every room — AI-staged in seconds, Vastu-scored on the photo, with a complete shopping list from the brands the builder already has deals with. A2S handles the experience. The builder earns the commission.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            to="/builder"
                            style={{
                                background: 'linear-gradient(135deg, #B8763D 0%, #8E5A2D 100%)',
                                color: '#0F1B22',
                                boxShadow: '0 10px 32px rgba(184,118,61,0.4)',
                            }}
                            className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold hover:opacity-90"
                        >
                            <Building2 size={16} /> Builder workspace
                            <ArrowRight size={15} />
                        </Link>
                        <Link
                            to="/design"
                            className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold"
                            style={{
                                border: '1px solid rgba(244,235,221,0.25)',
                                color: '#F4EBDD',
                                backdropFilter: 'blur(8px)',
                                background: 'rgba(244,235,221,0.04)',
                            }}
                        >
                            <Layers size={16} /> Try the buyer journey
                        </Link>
                        <Link
                            to="/embed-demo"
                            className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold"
                            style={{ color: 'rgba(244,235,221,0.7)' }}
                        >
                            <Eye size={16} /> See the embed in action <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Animated pipeline strip */}
                    <div
                        className="mt-12 p-5 rounded-2xl"
                        style={{
                            background: 'rgba(15,27,34,0.5)',
                            border: '1px solid rgba(244,235,221,0.10)',
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <p className="text-[10px] tracking-[0.3em] uppercase font-bold mb-4" style={{ color: 'rgba(184,118,61,0.85)' }}>
                            The 4-stage AI pipeline · runs in ~8s per room
                        </p>
                        <Pipeline />
                    </div>
                </div>

                {/* 3D-tilted preview card */}
                <div className="lg:col-span-5">
                    <Tilt max={6} className="relative">
                        <div
                            className="relative rounded-3xl overflow-hidden"
                            style={{
                                aspectRatio: '4/5',
                                background: 'rgba(244,235,221,0.04)',
                                border: '1px solid rgba(244,235,221,0.15)',
                                boxShadow: '0 30px 100px rgba(0,0,0,0.55)',
                            }}
                        >
                            <img
                                src="/showcase/living-modern.jpg"
                                alt="AI-staged contemporary living room"
                                className="w-full h-full object-cover"
                                style={{ transform: 'scale(1.02)' }}
                            />
                            {/* Vastu HUD overlay on the hero image — purely decorative */}
                            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(15,27,34,0.7) 100%)' }} />

                            {/* Compass top-right */}
                            <div
                                className="absolute top-4 right-4 w-20 h-20 rounded-full flex flex-col items-center justify-center"
                                style={{
                                    background: 'rgba(15,27,34,0.85)',
                                    border: '1.5px solid #B8763D',
                                    color: '#B8763D',
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                <span className="text-[9px] font-bold">N</span>
                                <div className="w-px h-6 mt-0.5" style={{ background: '#B8763D' }} />
                                <span className="text-[8px] font-bold mt-1 tracking-widest" style={{ color: '#F4EBDD' }}>FACES N</span>
                            </div>

                            {/* Severity pins */}
                            <div
                                className="absolute"
                                style={{ top: '38%', left: '22%' }}
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
                                    style={{
                                        background: '#dc2626',
                                        border: '2px solid #7f1d1d',
                                        boxShadow: '0 0 0 12px rgba(220,38,38,0.18), 0 0 28px rgba(220,38,38,0.6)',
                                        animation: 'a2s-pulse 2.6s ease-in-out infinite',
                                    }}
                                >
                                    1
                                </div>
                            </div>

                            <div
                                className="absolute"
                                style={{ top: '52%', right: '28%' }}
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
                                    style={{
                                        background: '#f59e0b',
                                        border: '2px solid #92400e',
                                        boxShadow: '0 0 0 10px rgba(245,158,11,0.18), 0 0 24px rgba(245,158,11,0.5)',
                                        animation: 'a2s-pulse 2.6s ease-in-out infinite',
                                        animationDelay: '0.6s',
                                    }}
                                >
                                    2
                                </div>
                            </div>

                            {/* Score badge bottom */}
                            <div
                                className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-4 py-3 rounded-xl"
                                style={{
                                    background: 'rgba(15,27,34,0.85)',
                                    border: '1px solid rgba(184,118,61,0.4)',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div>
                                    <p className="text-[9px] tracking-[0.25em] uppercase font-bold" style={{ color: 'rgba(244,235,221,0.6)' }}>Vastu Score</p>
                                    <p className="font-serif italic font-black text-2xl" style={{ color: '#F4EBDD' }}>78 · Good</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] tracking-[0.25em] uppercase font-bold" style={{ color: 'rgba(244,235,221,0.6)' }}>Catalog</p>
                                    <p className="font-serif italic font-black text-2xl" style={{ color: '#B8763D' }}>₹1.84L</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating chip behind card */}
                        <div
                            className="absolute -bottom-4 -left-4 px-3 py-1.5 rounded-full text-[10px] tracking-[0.2em] font-bold"
                            style={{
                                background: 'rgba(244,235,221,0.06)',
                                border: '1px solid rgba(244,235,221,0.12)',
                                color: 'rgba(244,235,221,0.7)',
                                backdropFilter: 'blur(6px)',
                                transform: 'translateZ(40px)',
                            }}
                        >
                            FLUX-1 · LIVING ROOM · CONTEMPORARY
                        </div>
                    </Tilt>
                </div>
            </div>

            {/* Inline keyframes — global isn't loaded for these specific anims */}
            <style>{`
                @keyframes a2s-shimmer {
                    0%   { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                @keyframes a2s-pulse {
                    0%, 100% { transform: scale(1); }
                    50%      { transform: scale(1.08); }
                }
            `}</style>
        </section>
    );
};

export default CinematicHero;
