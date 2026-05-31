import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Wand2, Layers, Compass, Image as ImageIcon, Building2, ArrowRight,
    IndianRupee, Award, LogOut, Home as HomeIcon, Sparkles,
} from 'lucide-react';
import SectionBackdrop from '../components/SectionBackdrop';
import { useStore } from '../store/useStore';

/**
 * "Your A2S" — account hub.
 *
 * Replaces the legacy consumer dashboard (saved designs / watchlist /
 * credits) with a B2B-aligned hub that reflects how the product actually
 * works today: account-less, localStorage-driven. Surfaces the buyer's
 * last designed home, their builder workspace (if any), and quick actions
 * into the four core surfaces. No backend dependency.
 */

const fmtL = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${Number(n || 0).toLocaleString('en-IN')}`);

const QUICK = [
    { to: '/instant',   icon: Wand2,     title: 'Instant Design',  body: 'One sentence → a full home in seconds.' },
    { to: '/design',    icon: Layers,    title: 'Build My Home',   body: 'Design room by room with a full bill-of-materials.' },
    { to: '/vastu-hud', icon: Compass,   title: 'Vastu HUD',       body: 'Compliance markers drawn on your room photo.' },
    { to: '/showcase',  icon: ImageIcon, title: 'Showcase',        body: 'Real renders, style compare, 3D walkthrough.' },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const user = useStore((s) => s.user);
    const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'there';

    const [journey, setJourney] = useState(null);
    const [builder, setBuilder] = useState(null);

    useEffect(() => {
        try {
            const j = sessionStorage.getItem('a2s-design-journey');
            if (j) setJourney(JSON.parse(j));
        } catch (_) {}
        try {
            const b = localStorage.getItem('a2s-builder-account');
            if (b) setBuilder(JSON.parse(b));
        } catch (_) {}
    }, []);

    const homeTotal = useMemo(() => {
        if (!journey?.rooms) return 0;
        return journey.rooms.reduce((s, r) => s + Number(r?.catalogBundle?.totalEstimate || 0), 0);
    }, [journey]);

    const handleLogout = () => {
        try { useStore.getState().logout(); } catch (_) {}
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-main">
            <SectionBackdrop variant="dark" minHeight="32vh">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-[10px] tracking-[0.3em] font-bold uppercase mb-2" style={{ color: '#B8763D' }}>Your A2S</p>
                        <h1 className="font-serif font-black italic leading-tight" style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', color: '#F4EBDD' }}>
                            Hello, <span style={{
                                background: 'linear-gradient(90deg,#B8763D,#E8C896,#B8763D)', WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite',
                            }}>{firstName}</span>.
                        </h1>
                        <p className="text-sm mt-2" style={{ color: 'rgba(244,235,221,0.7)' }}>
                            Pick up where you left off, or start a new room.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold"
                        style={{ background: 'rgba(244,235,221,0.08)', color: 'rgba(244,235,221,0.85)', border: '1px solid rgba(244,235,221,0.15)' }}
                    >
                        <LogOut size={14} /> Sign out
                    </button>
                </div>
                <style>{`@keyframes a2s-shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
            </SectionBackdrop>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-16 relative space-y-6" style={{ zIndex: 2 }}>
                {/* Continue cards */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Designed home */}
                    <div className="rounded-2xl bg-surface border border-premium p-5">
                        <div className="inline-flex items-center gap-2 mb-3">
                            <HomeIcon size={16} className="text-accent" />
                            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-accent">Your designed home</span>
                        </div>
                        {journey?.rooms?.length ? (
                            <>
                                <p className="font-serif text-2xl text-main font-black italic">
                                    {journey.rooms.length} rooms · {journey.style ? journey.style[0].toUpperCase() + journey.style.slice(1) : 'Designed'}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-sm text-muted">
                                    <span className="inline-flex items-center gap-1 text-accent font-semibold">
                                        <IndianRupee size={13} />{fmtL(homeTotal).replace('₹', '')}
                                    </span>
                                    <span>·</span>
                                    <span>EMI ~{fmtL(Math.round(homeTotal / 36))}/mo</span>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Link to="/design/summary" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90">
                                        View full summary <ArrowRight size={14} />
                                    </Link>
                                    <Link to="/design" className="inline-flex items-center gap-1.5 rounded-lg border border-accent text-accent px-4 py-2 text-sm font-semibold hover:bg-accent/5">
                                        Edit
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-muted">You haven't designed a home yet. It takes one sentence.</p>
                                <div className="flex gap-2 mt-4">
                                    <Link to="/instant" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90">
                                        <Wand2 size={14} /> Instant Design
                                    </Link>
                                    <Link to="/design" className="inline-flex items-center gap-1.5 rounded-lg border border-accent text-accent px-4 py-2 text-sm font-semibold hover:bg-accent/5">
                                        Build room by room
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Builder workspace */}
                    <div className="rounded-2xl bg-surface border border-premium p-5">
                        <div className="inline-flex items-center gap-2 mb-3">
                            <Building2 size={16} className="text-accent" />
                            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-accent">Builder workspace</span>
                        </div>
                        {builder?.companyName ? (
                            <>
                                <p className="font-serif text-2xl text-main font-black italic">{builder.companyName}</p>
                                <p className="text-sm text-muted mt-1">{builder.projectName} · ID <span className="font-mono">{builder.builderId}</span></p>
                                <Link to="/builder" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 mt-4">
                                    Open workspace <ArrowRight size={14} />
                                </Link>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-muted">Run A2S on your own project — embed it on your builder site in 30 seconds.</p>
                                <Link to="/builder" className="inline-flex items-center gap-1.5 rounded-lg border border-accent text-accent px-4 py-2 text-sm font-semibold hover:bg-accent/5 mt-4">
                                    <Building2 size={14} /> Create a builder workspace
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Quick actions */}
                <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-accent mb-3">Jump back in</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {QUICK.map(({ to, icon: Icon, title, body }) => (
                            <Link key={to} to={to} className="rounded-2xl bg-surface border border-premium p-4 hover:border-accent transition group">
                                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition">
                                    <Icon size={18} className="text-accent" />
                                </div>
                                <p className="font-semibold text-main">{title}</p>
                                <p className="text-xs text-muted mt-1 leading-snug">{body}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Vastu nudge */}
                {journey?.rooms?.length > 0 && (
                    <div className="rounded-2xl bg-accent/5 border border-accent/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <Award size={18} className="text-accent shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-main">Boost your home's Vastu score</p>
                                <p className="text-sm text-muted">Run any room through the Vastu HUD and apply the fixes to climb from Good to Excellent.</p>
                            </div>
                        </div>
                        <Link to="/vastu-hud" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 shrink-0">
                            <Compass size={14} /> Open Vastu HUD
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
