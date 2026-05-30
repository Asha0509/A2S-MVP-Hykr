import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Sparkles, ChevronDown, Video, Eye,
    Image, MessageSquare, Box, Users, ScanLine, Camera,
    TrendingUp, Heart, Shield, Lightbulb, Search, Star,
    Compass, Check, Layers, Move, Play, Zap, ShoppingBag
} from 'lucide-react';

// ─── Scroll Animation Hook ──────────────────────────────────────────────────
const useInView = (options = {}) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setInView(true);
        }, { threshold: 0.12, ...options });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return [ref, inView];
};

// ─── Animated Demo Components ───────────────────────────────────────────────

const GalleryDemo = () => {
    const vendors = [
        { name: 'Urban Ladder', score: 94, type: 'Retail' },
        { name: 'Pepperfry', score: 91, type: 'Retail' },
        { name: 'WoodenStreet', score: 88, type: 'Local' },
        { name: 'Artisan Mohan', score: 96, type: 'Artisan' },
    ];
    return (
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: '#F9F8F6', border: '1px solid #EAEAEA' }}>
            {/* Search bar */}
            <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid #EAEAEA' }}>
                <Search size={16} style={{ color: '#BBB' }} />
                <div className="flex-1">
                    <div className="h-3 w-48 rounded-full animate-pulse" style={{ background: 'linear-gradient(90deg, #E5E5E5 0%, #1D6172 50%, #E5E5E5 100%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: '#1D6172', color: 'white' }}>Scanning</span>
            </div>
            {/* Vendor rows */}
            <div className="p-3 space-y-2">
                {vendors.map((v, i) => (
                    <div
                        key={v.name}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all"
                        style={{
                            background: 'white',
                            border: '1px solid #F0F0F0',
                            animation: `slideInRight 0.5s ease-out ${i * 0.15}s both`
                        }}
                    >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black" style={{ background: v.type === 'Artisan' ? '#1D6172' : v.type === 'Local' ? '#7C3AED' : '#0EA5E9', color: 'white' }}>
                            {v.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold" style={{ color: '#333' }}>{v.name}</p>
                            <p className="text-[9px]" style={{ color: '#999' }}>{v.type} Vendor</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star size={10} fill="#1D6172" stroke="#1D6172" />
                            <span className="text-xs font-bold" style={{ color: '#1D6172' }}>{v.score}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 text-center">
                <span className="text-[10px] font-bold" style={{ color: '#999' }}>Scanning 50+ verified vendors...</span>
            </div>
        </div>
    );
};

const VInsightDemo = () => {
    const [step, setStep] = useState(0);
    useEffect(() => {
        const timers = [
            setTimeout(() => setStep(1), 1200),
            setTimeout(() => setStep(2), 2800),
            setTimeout(() => setStep(3), 4200),
            setTimeout(() => setStep(4), 5400),
            setTimeout(() => setStep(5), 6800),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    const auditRules = [
        { rule: 'Pooja idol facing East', ok: true, cat: 'Object' },
        { rule: 'Mirror not opposite bed', ok: true, cat: 'Object' },
        { rule: 'Kitchen in SE zone', ok: true, cat: 'Room' },
        { rule: 'Plants in North sector', ok: false, cat: 'Object' },
        { rule: 'Water element in NE', ok: true, cat: 'Room' },
    ];

    const suggestions = [
        '🌿 Move indoor plants from North wall to East or NE corner for positive energy flow',
        '🪞 Consider adding a small mirror on the North wall to amplify prosperity energy',
    ];

    return (
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: '#F9F8F6', border: '1px solid #EAEAEA' }}>
            <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid #EAEAEA' }}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: step >= 2 ? '#10B981' : '#F59E0B', animation: step === 1 ? 'pulse 1s infinite' : 'none' }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#7C3AED' }}>
                        {step === 0 ? 'Upload Room Photo' : step === 1 ? 'Analyzing...' : step <= 4 ? 'Vastu Audit Complete' : 'Suggestions Ready'}
                    </span>
                </div>
                {step >= 2 && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: step >= 5 ? '#0EA5E9' : '#10B981', color: 'white' }}>{step >= 5 ? '💡 Tips' : 'Done'}</span>}
            </div>

            <div className="p-4" style={{ minHeight: '280px' }}>
                {/* Step 0: Upload zone */}
                {step === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 rounded-xl" style={{ border: '2px dashed #D4D4D4', background: '#FAFAFA', animation: 'fadeIn 0.4s ease-out' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(124,58,237,0.1)' }}>
                            <Camera size={20} style={{ color: '#7C3AED' }} />
                        </div>
                        <p className="text-xs font-bold" style={{ color: '#555' }}>Drop your room photo here</p>
                        <p className="text-[10px] mt-1" style={{ color: '#999' }}>or click to browse</p>
                        <div className="mt-3 flex gap-2">
                            <span className="px-2 py-1 rounded text-[9px] font-bold" style={{ background: '#F3F0FF', color: '#7C3AED' }}>🏠 Living Room</span>
                            <span className="px-2 py-1 rounded text-[9px] font-bold" style={{ background: '#F3F0FF', color: '#7C3AED' }}>Facing East</span>
                        </div>
                    </div>
                )}

                {/* Step 1: Scanning animation */}
                {step === 1 && (
                    <div className="flex flex-col items-center justify-center py-6" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 relative" style={{ border: '2px solid #7C3AED', background: 'rgba(124,58,237,0.05)' }}>
                            <Compass size={28} style={{ color: '#7C3AED', animation: 'spin 2s linear infinite' }} />
                            <div className="absolute inset-0 rounded-full" style={{ border: '2px solid transparent', borderTopColor: '#1D6172', animation: 'spin 1.5s linear infinite reverse' }} />
                        </div>
                        <p className="text-xs font-bold mb-2" style={{ color: '#7C3AED' }}>AI is analyzing your space...</p>
                        <div className="w-48 h-2 rounded-full overflow-hidden" style={{ background: '#EDE9FE' }}>
                            <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #7C3AED, #1D6172)', animation: 'shimmer 1.5s ease-in-out infinite', width: '70%' }} />
                        </div>
                        <div className="mt-3 space-y-1 text-center">
                            <p className="text-[10px]" style={{ color: '#999', animation: 'fadeIn 0.3s ease-out 0.3s both' }}>✓ Detecting room elements...</p>
                            <p className="text-[10px]" style={{ color: '#999', animation: 'fadeIn 0.3s ease-out 0.8s both' }}>✓ Mapping directions...</p>
                            <p className="text-[10px]" style={{ color: '#999', animation: 'fadeIn 0.3s ease-out 1.3s both' }}>⏳ Checking Vastu rules...</p>
                        </div>
                    </div>
                )}

                {/* Steps 2+: Results */}
                {step >= 2 && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        {/* Score */}
                        <div className="flex items-center justify-between mb-3 p-3 rounded-xl" style={{ background: 'white', border: '1px solid #E5E5E5' }}>
                            <div>
                                <span className="text-2xl font-black" style={{ color: '#10B981' }}>82</span>
                                <span className="text-sm font-bold" style={{ color: '#999' }}>/100</span>
                                <p className="text-[9px] font-bold" style={{ color: '#10B981' }}>Good Compliance</p>
                            </div>
                            <div className="flex gap-1">
                                {[85, 70, 95, 80, 78].map((h, i) => (
                                    <div key={i} className="w-3 rounded-sm" style={{ height: `${h / 3}px`, background: h > 80 ? '#10B981' : '#F59E0B', animation: `fadeIn 0.3s ease-out ${i * 0.1}s both` }} />
                                ))}
                            </div>
                        </div>

                        {/* Audit rules revealed one by one */}
                        <div className="space-y-1.5">
                            {auditRules.slice(0, step >= 3 ? 3 : 2).map((r, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'white', border: '1px solid #F0F0F0', animation: `slideInRight 0.4s ease-out ${i * 0.12}s both` }}>
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: r.ok ? '#10B981' : '#F59E0B', color: 'white' }}>
                                        <Check size={10} />
                                    </div>
                                    <span className="text-[11px] font-medium flex-1" style={{ color: '#555' }}>{r.rule}</span>
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: r.cat === 'Object' ? '#FEF3C7' : '#F3F0FF', color: r.cat === 'Object' ? '#92400E' : '#7C3AED' }}>{r.cat}</span>
                                </div>
                            ))}
                            {step >= 4 && auditRules.slice(3).map((r, i) => (
                                <div key={i + 3} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'white', border: '1px solid #F0F0F0', animation: `slideInRight 0.4s ease-out ${i * 0.12}s both` }}>
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: r.ok ? '#10B981' : '#F59E0B', color: 'white' }}>
                                        <Check size={10} />
                                    </div>
                                    <span className="text-[11px] font-medium flex-1" style={{ color: '#555' }}>{r.rule}</span>
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: r.cat === 'Object' ? '#FEF3C7' : '#F3F0FF', color: r.cat === 'Object' ? '#92400E' : '#7C3AED' }}>{r.cat}</span>
                                </div>
                            ))}
                        </div>

                        {/* Step 5: AI Suggestions */}
                        {step >= 5 && (
                            <div className="mt-3 p-3 rounded-xl" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', animation: 'slideInRight 0.5s ease-out' }}>
                                <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: '#16A34A' }}>
                                    💡 AI Suggestions
                                </p>
                                <div className="space-y-2">
                                    {suggestions.map((s, i) => (
                                        <p key={i} className="text-[11px] leading-relaxed" style={{ color: '#166534', animation: `fadeIn 0.4s ease-out ${i * 0.2}s both` }}>
                                            {s}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const AIConsultDemo = () => {
    const [step, setStep] = useState(0);
    useEffect(() => {
        const timers = [
            setTimeout(() => setStep(1), 1000),
            setTimeout(() => setStep(2), 2400),
            setTimeout(() => setStep(3), 3800),
            setTimeout(() => setStep(4), 5000),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);
    return (
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: '#F9F8F6', border: '1px solid #EAEAEA' }}>
            <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid #EAEAEA' }}>
                <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: '#0EA5E9' }} />
                    <span className="text-xs font-bold" style={{ color: '#333' }}>AI Design Consultant</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                    <span className="text-[9px]" style={{ color: '#999' }}>Online</span>
                </div>
            </div>
            <div className="p-4 space-y-3" style={{ minHeight: '280px' }}>
                {/* User message */}
                {step >= 0 && (
                    <div className="flex justify-end" style={{ animation: 'slideInRight 0.3s ease-out' }}>
                        <div className="px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%] text-xs" style={{ background: '#0EA5E9', color: 'white' }}>
                            Modern living room, ₹2L budget, Scandinavian style
                        </div>
                    </div>
                )}
                {/* Typing indicator */}
                {step === 1 && (
                    <div className="flex justify-start" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'white', border: '1px solid #E5E5E5' }}>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ background: '#CCC', animation: 'pulse 1s infinite 0s' }} />
                                <div className="w-2 h-2 rounded-full" style={{ background: '#CCC', animation: 'pulse 1s infinite 0.2s' }} />
                                <div className="w-2 h-2 rounded-full" style={{ background: '#CCC', animation: 'pulse 1s infinite 0.4s' }} />
                            </div>
                        </div>
                    </div>
                )}
                {/* AI response with product list */}
                {step >= 2 && (
                    <div className="flex justify-start" style={{ animation: 'slideInRight 0.3s ease-out' }}>
                        <div className="px-4 py-3 rounded-2xl rounded-bl-sm max-w-[90%]" style={{ background: 'white', border: '1px solid #E5E5E5' }}>
                            <p className="text-[11px] font-medium mb-3" style={{ color: '#333' }}>Here's your curated room plan 🎨</p>
                            <div className="space-y-2">
                                {[
                                    { item: 'L-shaped sofa', price: '₹45,000', vendor: 'WoodenStreet' },
                                    { item: 'Coffee table', price: '₹12,000', vendor: 'Urban Ladder' },
                                    { item: 'Floor lamp', price: '₹8,500', vendor: 'Pepperfry' },
                                    { item: 'Wall art set', price: '₹6,200', vendor: 'Artisan Mohan' },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg" style={{ background: '#F9FAFB', animation: `fadeIn 0.3s ease-out ${i * 0.15}s both` }}>
                                        <Check size={10} style={{ color: '#0EA5E9' }} />
                                        <span className="text-[11px] font-medium flex-1" style={{ color: '#555' }}>{p.item}</span>
                                        <span className="text-[10px] font-bold" style={{ color: '#0EA5E9' }}>{p.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {/* Budget summary */}
                {step >= 3 && (
                    <div className="flex justify-start" style={{ animation: 'slideInRight 0.3s ease-out' }}>
                        <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                            <p className="text-[11px] font-bold" style={{ color: '#0EA5E9' }}>💰 Total: ₹1,71,700 — ✓ Under ₹2L budget!</p>
                        </div>
                    </div>
                )}
                {/* Action buttons */}
                {step >= 4 && (
                    <div className="flex gap-2 mt-1" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: '#0EA5E9', color: 'white' }}>View Mood Board</button>
                        <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: 'white', border: '1px solid #E5E5E5', color: '#555' }}>Refine Style</button>
                        <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: 'white', border: '1px solid #E5E5E5', color: '#555' }}>Open in 3D</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ThreeDStudioDemo = () => (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: '#F9F8F6', border: '1px solid #EAEAEA' }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EAEAEA' }}>
            <span className="text-xs font-bold" style={{ color: '#333' }}>3D Room Editor</span>
            <div className="flex gap-1">
                <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'white', border: '1px solid #E5E5E5' }}><Move size={10} style={{ color: '#999' }} /></span>
                <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#10B981', border: 'none' }}><Layers size={10} style={{ color: 'white' }} /></span>
            </div>
        </div>
        <div className="relative p-6" style={{ minHeight: '220px', background: 'linear-gradient(180deg, #FAFAFA 0%, #F0F0F0 100%)' }}>
            {/* Room floor grid */}
            <div className="absolute inset-6 rounded-xl" style={{ border: '2px dashed #DDD', background: 'repeating-linear-gradient(0deg, transparent, transparent 24px, #F0F0F0 24px, #F0F0F0 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, #F0F0F0 24px, #F0F0F0 25px)' }} />
            {/* Floating furniture items */}
            <div className="absolute top-10 left-10 px-3 py-2 rounded-lg text-[10px] font-bold shadow-lg" style={{ background: 'white', border: '2px solid #10B981', color: '#333', animation: 'floatSlow 3s ease-in-out infinite' }}>
                🛋️ Sofa
            </div>
            <div className="absolute top-20 right-12 px-3 py-2 rounded-lg text-[10px] font-bold shadow-lg" style={{ background: 'white', border: '2px solid #1D6172', color: '#333', animation: 'floatSlow 3s ease-in-out 0.5s infinite' }}>
                🪑 Chair
            </div>
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-[10px] font-bold shadow-lg" style={{ background: 'white', border: '2px solid #0EA5E9', color: '#333', animation: 'floatSlow 3s ease-in-out 1s infinite' }}>
                🖼️ Wall Art
            </div>
            {/* Drag indicator */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Move size={10} style={{ color: '#10B981' }} />
                <span className="text-[9px] font-bold" style={{ color: '#10B981' }}>Drag to place</span>
            </div>
        </div>
    </div>
);

// ─── Data ────────────────────────────────────────────────────────────────────



const WHY_MATTERS = [
    { icon: Heart, title: "Well-Being", text: "Thoughtful spaces reduce stress and elevate everyday mood. Your home should heal, not drain." },
    { icon: TrendingUp, title: "Property Value", text: "A well-designed interior can increase property value by 5–15%. It's not a cost — it's an investment." },
    { icon: Lightbulb, title: "Productivity", text: "The right layout, light, and palette can sharpen focus and fuel creativity in your spaces." },
    { icon: Shield, title: "Cultural Harmony", text: "Indian homes carry generations of Vastu wisdom. Great design honours that heritage." }
];

const COMING_SOON_FEATURES = [
    { icon: Users, name: "Artisan Cloud", tagline: "Vetted Craftsmen Marketplace", description: "Compare retail furniture to custom artisan fabrication — on price, lead time, and quality — in real time. No global platform offers this." },
    { icon: ScanLine, name: "Video-to-3D", tagline: "Walk. Record. Rebuild.", description: "Record a room walkthrough and navigate a fully reconstructed 3D model. Validate furniture placement in your actual space." },
    { icon: Camera, name: "AR Live View", tagline: "See It In Your Room", description: "Point your phone at any wall or corner. See real catalog products placed in real space — live, accurate, and shareable." }
];

// ─── Hero Section (Interior Design Style) ────────────────────────────────────

const HeroSection = () => {
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const heroRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setMouse({ x, y });
    };

    return (
        <section 
            ref={heroRef} 
            onMouseMove={handleMouseMove}
            aria-label="Hero" 
            className="w-full bg-[#EDEDEB] relative overflow-hidden pt-20"
        >
            {/* ── Background Gradients ── */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/3 rounded-full blur-[100px] pointer-events-none" />

            {/* ── Main Content Container ── */}
            <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16 py-20">
                
                {/* ── Text Content ── */}
                <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-in-up">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Defining Luxury Spaces</span>
                    </div>
                    
                    <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-main leading-[0.9] italic mb-8 animate-fade-in-up stagger-1">
                        Aesthetics <br />
                        <span className="text-gradient-gold not-italic">to Spaces</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-muted font-light leading-relaxed max-w-xl mb-12 animate-fade-in-up stagger-2">
                        The world’s first AI platform that merges ancient Vastu wisdom with photorealistic 3D staging and localized smart sourcing.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start animate-fade-in-up stagger-3">
                        <Link to="/gallery" className="btn-premium btn-premium-gold px-12 py-5 group shadow-2xl shadow-accent/20">
                            <span>Explore Catalog</span>
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                        </Link>
                        <Link to="/waitlist" className="btn-premium btn-premium-outline px-12 py-5">
                            <Zap size={18} />
                            <span>Early Access Waitlist</span>
                        </Link>
                    </div>
                </div>

                {/* ── Visual 3D Component ── */}
                <div className="flex-1 w-full relative group animate-fade-in-up stagger-4">
                    <div 
                        className="relative rounded-[60px] overflow-hidden border border-premium shadow-premium transition-transform duration-700 ease-out preserve-3d"
                        style={{ 
                            transform: `perspective(1000px) rotateY(${mouse.x * 5}deg) rotateX(${-mouse.y * 5}deg)`,
                            boxShadow: `${-mouse.x * 20}px ${-mouse.y * 20}px 60px rgba(0,0,0,0.1)`
                        }}
                    >
                        {/* The Image */}
                        <img
                            src="/hero-premium.png"
                            alt="Luxury Interior"
                            className="w-full h-auto block"
                        />

                        {/* Blueprint Reveal Overlay */}
                        <div 
                            className="absolute inset-0 bg-accent/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle, rgba(29,97,114,0.2) 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }}
                        />

                        {/* The Scanline */}
                        <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-accent to-transparent shadow-[0_0_20px_rgba(29,97,114,0.8)] animate-scan-x pointer-events-none" />

                        {/* Interactive Markers */}
                        {[
                            { top: '30%', left: '20%', label: 'Smart Vastu Check', icon: <Compass size={12} /> },
                            { top: '45%', left: '70%', label: 'Artisan Furniture', icon: <ShoppingBag size={12} /> },
                            { top: '65%', left: '40%', label: '3D Planned', icon: <Box size={12} /> }
                        ].map((m, i) => (
                            <div 
                                key={i}
                                className="absolute z-20 transition-all duration-700 flex items-center group/marker"
                                style={{ 
                                    top: m.top, 
                                    left: m.left,
                                    transform: `translateZ(50px)`
                                }}
                            >
                                <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-accent shadow-xl border border-accent/20 group-hover/marker:scale-125 transition-transform duration-500">
                                    {m.icon || <Sparkles size={12} />}
                                </div>
                                <div className="ml-3 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/marker:opacity-100 -translate-x-4 group-hover/marker:translate-x-0 transition-all duration-500 pointer-events-none">
                                    {m.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Floating Cards around the image */}
                    <div className="absolute -top-10 -right-10 glass-premium p-6 rounded-[32px] border border-premium shadow-2xl animate-float-slow z-20 hidden md:block">
                        <div className="flex items-center gap-3 mb-2">
                            <Star size={14} fill="#1D6172" stroke="#1D6172" />
                            <span className="text-xs font-black text-main uppercase italic">Score: 94</span>
                        </div>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Vastu Compliant</p>
                    </div>

                    <div className="absolute -bottom-10 -left-10 glass-premium p-6 rounded-[32px] border border-premium shadow-2xl animate-float-slow-reverse z-20 hidden md:block">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-black text-main uppercase italic">Live Sourcing</span>
                        </div>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest">50+ Local Vendors</p>
                    </div>
                </div>
            </div>

            {/* ── Feature quicklinks below the hero image ── */}
            <div className="relative z-10 py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {[
                            { title: 'AI Design', desc: 'Tell your vision to our AI Consultant and get curated product plans, mood boards & budgets from 50+ vendors — instantly.', icon: Sparkles },
                            { title: 'Vastu Wisdom', desc: 'Upload a photo and VInsight audits objects & room zones against ancient Vastu Shastra rules — then suggests what to fix.', icon: Compass },
                            { title: 'Smart Sourcing', desc: 'Auto-scan verified retail, local & artisan vendors. Compare price, lead time, and quality — all in one place.', icon: Search },
                        ].map(({ title, desc, icon: Icon }) => (
                            <div key={title} className="text-center group cursor-pointer p-8 rounded-[40px] hover:bg-white/40 transition-all duration-700 hover:shadow-premium border border-transparent hover:border-premium">
                                <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-accent/5" style={{ background: 'rgba(29,97,114,0.1)', border: '1px solid rgba(29,97,114,0.15)' }}>
                                    <Icon size={24} style={{ color: '#1D6172' }} />
                                </div>
                                <h3 className="font-serif text-2xl font-black mb-3 italic" style={{ color: '#131A20' }}>{title}</h3>
                                <p className="text-sm leading-relaxed text-muted font-light">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// ─── Inline Keyframes ────────────────────────────────────────────────────────
const animationStyles = `
@keyframes slideInRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes floatSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
@keyframes scan-x { 0% { left: 0; } 100% { left: 100%; } }
@keyframes float-slow { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-15px) rotate(1deg); } }
@keyframes float-slow-reverse { 0%, 100% { transform: translateY(0) rotate(1deg); } 50% { transform: translateY(-12px) rotate(-1deg); } }
.preserve-3d { transform-style: preserve-3d; }
`;

// ─── Main Component ─────────────────────────────────────────────────────────

const Home = () => {
    const [whyRef, whyInView] = useInView();
    const [feat1Ref, feat1InView] = useInView();
    const [feat2Ref, feat2InView] = useInView();
    const [feat3Ref, feat3InView] = useInView();
    const [feat4Ref, feat4InView] = useInView();
    const [csRef, csInView] = useInView();
    const [ctaRef, ctaInView] = useInView();

    return (
        <main className="w-full bg-main min-h-screen transition-all duration-1000 relative overflow-hidden" role="main">
            <style>{animationStyles}</style>
            <div className="ambient-orb ambient-orb-1 opacity-60" />
            <div className="ambient-orb ambient-orb-2 opacity-60" />

            {/* ═══════════════════  HERO  ═══════════════════════════════════ */}
            <HeroSection />

            {/* ═══════════════  WHY INTERIOR DESIGN MATTERS  ═══════════════ */}
            <section ref={whyRef} className="py-24 md:py-32 bg-surface transition-all duration-1000" aria-labelledby="why-heading">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <header className="text-center max-w-3xl mx-auto mb-10">
                        <span className="section-tag animate-fade-in-up">The Problem We Solve</span>
                        <h2 id="why-heading" className="font-serif text-4xl md:text-6xl font-black text-main mb-6 leading-tight">
                            Your Home Deserves <span className="text-gradient-gold italic">Better</span>
                        </h2>
                        <p className="text-gray-500 font-light text-lg leading-relaxed">
                            You spend 90% of your life at home — but most of us design it through guesswork. 
                            Scrolling 12 apps, visiting 5 showrooms, and still ending up with a sofa that doesn't fit. 
                            Sound familiar? There's a better way.
                        </p>
                    </header>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
                        {WHY_MATTERS.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className={`group text-center p-8 rounded-[32px] bg-main border border-premium hover:border-accent transition-all duration-500 ${whyInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.12}s` }}>
                                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <Icon size={26} />
                                    </div>
                                    <h3 className="font-serif text-xl font-black text-main italic mb-3">{item.title}</h3>
                                    <p className="text-muted text-sm leading-relaxed">{item.text}</p>
                                </div>
                            );
                        })}
                    </div>
                    {/* Differentiator Banner */}
                    <div className={`mt-20 p-10 md:p-14 rounded-[40px] bg-main border border-premium relative overflow-hidden ${whyInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-30%,rgba(29,97,114,0.08),transparent)]" />
                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
                            <div className="flex-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-4 block">How We're Different</span>
                                <h3 className="font-serif text-3xl md:text-4xl font-black text-main italic mb-4 leading-tight">
                                    One Platform. <span className="text-gradient-gold">Zero Guesswork.</span>
                                </h3>
                                <p className="text-muted leading-relaxed text-base md:text-lg">
                                    A2S replaces scattered vendors, zero visualization, and guesswork with a single platform where you discover, visualize in 3D, validate with Vastu, and source from 50+ verified vendors. All before you spend a single rupee.
                                </p>
                            </div>
                            <div className="flex-shrink-0 grid grid-cols-3 gap-6 text-center">
                                {[['50+', 'Vendors'], ['7', 'AI Tools'], ['₹0', 'To Start']].map(([num, label]) => (
                                    <div key={label}>
                                        <p className="font-serif text-3xl md:text-4xl font-black text-accent">{num}</p>
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════  FEATURE 1: GALLERY  ════════════════════════ */}
            <section ref={feat1Ref} className="py-24 md:py-32 bg-main transition-all duration-1000">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`flex flex-col lg:flex-row items-center gap-16 ${feat1InView ? 'animate-fade-in-up' : 'opacity-0'}`}>
                        <div className="flex-1 order-2 lg:order-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-4 block">
                                <Image size={14} className="inline mr-2" />Smart Sourcing
                            </span>
                            <h3 className="font-serif text-3xl md:text-5xl font-black text-main italic mb-6 leading-tight">
                                Ever scrolled 12 apps for <span className="text-gradient-gold">one sofa?</span>
                            </h3>
                            <p className="text-muted text-base md:text-lg leading-relaxed mb-6">
                                We feel you. Our Gallery auto-scans 50+ verified vendors — retail chains, local stores, and independent artisans — and ranks them with confidence scores. You see bundled execution packages, real prices, and honest reviews. The 12-platform problem? Solved permanently.
                            </p>
                            <Link to="/gallery" className="btn-premium btn-premium-gold px-8 py-4 group text-sm">
                                <span>Browse Gallery</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="flex-1 order-1 lg:order-2 w-full max-w-md">
                            <GalleryDemo />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════  FEATURE 2: VINSIGHT  ═══════════════════════ */}
            <section ref={feat2Ref} className="py-24 md:py-32 bg-surface transition-all duration-1000">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`flex flex-col lg:flex-row items-center gap-16 ${feat2InView ? 'animate-fade-in-up' : 'opacity-0'}`}>
                        <div className="flex-1 w-full max-w-md">
                            {feat2InView && <VInsightDemo />}
                        </div>
                        <div className="flex-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 block" style={{ color: '#7C3AED' }}>
                                <Eye size={14} className="inline mr-2" />Living In Harmony With Nature
                            </span>
                            <h3 className="font-serif text-3xl md:text-5xl font-black text-main italic mb-6 leading-tight">
                                Vastu isn't superstition. <span className="text-gradient-gold">It's spatial science.</span>
                            </h3>
                            <p className="text-muted text-base md:text-lg leading-relaxed mb-4">
                                For thousands of years, Vastu Shastra has been about one thing: <strong>aligning your home with nature</strong>. The five elements — Earth, Water, Fire, Air, and Space — each govern a direction. When they're balanced, energy flows freely. When they're not, you feel it — in your sleep, your mood, your focus.
                            </p>
                            <p className="text-muted text-base md:text-lg leading-relaxed mb-6">
                                VInsight brings this ancient wisdom into the modern world. Upload a photo, describe where your idol faces, and our AI audits everything — from pooja placement to mirror positions, plant sectors, and water elements — checking objects <em>and</em> room zones against centuries of Vastu rules. Then it gives you <strong>actionable suggestions</strong> to fix what's off.
                            </p>
                            <Link to="/vastu-score" className="btn-premium btn-premium-outline px-8 py-4 group text-sm">
                                <Eye size={16} />
                                <span>Try Vastu Score</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════  FEATURE 3: AI CONSULTING  ══════════════════ */}
            <section ref={feat3Ref} className="py-24 md:py-32 bg-main transition-all duration-1000">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`flex flex-col lg:flex-row items-center gap-16 ${feat3InView ? 'animate-fade-in-up' : 'opacity-0'}`}>
                        <div className="flex-1 order-2 lg:order-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 block" style={{ color: '#0EA5E9' }}>
                                <MessageSquare size={14} className="inline mr-2" />Your Personal Architect
                            </span>
                            <h3 className="font-serif text-3xl md:text-5xl font-black text-main italic mb-6 leading-tight">
                                You know what you want. <span className="text-gradient-gold">Let AI find it for you.</span>
                            </h3>
                            <p className="text-muted text-base md:text-lg leading-relaxed mb-4">
                                You have the vision — a warm minimalist living room, earthy tones, under ₹2 lakhs. But then you open 12 websites, scroll through lakhs of products, and slowly start compromising. <em>"This sofa is close enough." "That lamp will do."</em> Before you know it, your dream room looks nothing like what you imagined.
                            </p>
                            <p className="text-muted text-base md:text-lg leading-relaxed mb-6">
                                <strong>No more compromising.</strong> Just tell our AI what you want and your budget. It scans our entire Gallery — 50+ verified vendors, thousands of real products — and builds you a curated shortlist with prices, vendors, a mood board, and a budget breakdown. Your vision, matched to real products, in seconds.
                            </p>
                            <Link to="/dashboard" className="btn-premium btn-premium-outline px-8 py-4 group text-sm">
                                <MessageSquare size={16} />
                                <span>Start a Conversation</span>
                            </Link>
                        </div>
                        <div className="flex-1 order-1 lg:order-2 w-full max-w-md">
                            {feat3InView && <AIConsultDemo />}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════  FEATURE 4: 3D STUDIO  ═════════════════════ */}
            <section ref={feat4Ref} className="py-24 md:py-32 bg-surface transition-all duration-1000">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`flex flex-col lg:flex-row items-center gap-16 ${feat4InView ? 'animate-fade-in-up' : 'opacity-0'}`}>
                        <div className="flex-1 w-full max-w-md">
                            <ThreeDStudioDemo />
                        </div>
                        <div className="flex-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 block" style={{ color: '#10B981' }}>
                                <Box size={14} className="inline mr-2" />Spatial Intelligence
                            </span>
                            <h3 className="font-serif text-3xl md:text-5xl font-black text-main italic mb-6 leading-tight">
                                What if you could walk through your new room <span className="text-gradient-gold">before buying anything?</span>
                            </h3>
                            <p className="text-muted text-base md:text-lg leading-relaxed mb-6">
                                Our 3D Studio lets you drag real furniture into a photorealistic room model. Resize, reposition, change colors — and see exactly how everything fits. No imagination required. No expensive mistakes.
                            </p>
                            <Link to="/3d-space" className="btn-premium btn-premium-outline px-8 py-4 group text-sm">
                                <Box size={16} />
                                <span>Open 3D Studio</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════  COMING SOON FEATURES  ═══════════════════════ */}
            <section ref={csRef} className="py-20 md:py-28 bg-main transition-all duration-1000" aria-labelledby="coming-soon-heading">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <header className="text-center max-w-2xl mx-auto mb-16">
                        <span className="section-tag">On The Horizon</span>
                        <h2 id="coming-soon-heading" className="font-serif text-4xl md:text-5xl font-black text-main mb-4 leading-tight">
                            What's Coming <span className="text-gradient-gold italic">Next?</span>
                        </h2>
                        <p className="text-gray-500 font-light text-lg">
                            Three features that no other platform in the world offers. We're building them right now.
                        </p>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {COMING_SOON_FEATURES.map((feat, index) => {
                            const Icon = feat.icon;
                            return (
                                <div key={feat.name} className={`group relative p-8 rounded-[32px] bg-surface border border-premium hover:border-accent/30 transition-all duration-500 ${csInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.15}s` }}>
                                    <div className="absolute top-6 right-6">
                                        <span className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[9px] font-black uppercase tracking-[0.3em] border border-accent/20">
                                            Coming Soon
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <Icon size={24} />
                                    </div>
                                    <h3 className="font-serif text-xl font-black text-main italic mb-2">{feat.name}</h3>
                                    <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-4">{feat.tagline}</p>
                                    <p className="text-muted text-sm leading-relaxed">{feat.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>


            {/* ═══════════════  CTA BANNER  ════════════════════════════════ */}
            <section ref={ctaRef} className="py-24 md:py-32 bg-main relative overflow-hidden transition-all duration-1000">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(29,97,114,0.1),transparent)]" />
                <div className={`max-w-4xl mx-auto px-6 text-center relative z-10 ${ctaInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
                    <span className="section-tag mb-6 inline-block">Your Space Is Waiting</span>
                    <h2 className="font-serif text-4xl md:text-6xl font-black text-main mb-6 leading-tight italic">
                        Ready to Stop Guessing <br />
                        <span className="text-gradient-gold not-italic">and Start Designing?</span>
                    </h2>
                    <p className="text-muted text-lg mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                        Join thousands of homeowners, designers, and architects building smarter, more beautiful spaces. It takes 30 seconds to get started — and ₹0 to begin.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link to="/gallery" className="btn-premium btn-premium-gold px-12 py-5 group shadow-2xl shadow-accent/20">
                            <span>Explore Gallery</span>
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                        </Link>
                        <Link to="/login" className="btn-premium btn-premium-outline px-12 py-5">
                            <Sparkles size={18} />
                            <span>Take the Style Quiz</span>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home;
