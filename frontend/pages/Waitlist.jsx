import React, { useState, useEffect } from 'react';
import { 
    Users, ScanLine, Camera, Sparkles, Box, ShoppingBag, 
    ArrowRight, Share2, Copy, Check, Zap, Info, Compass
} from 'lucide-react';
import { getWaitlistStatus, joinPhase2Waitlist } from '../services/api';
import { useStore } from '../store/useStore';

const Waitlist = () => {
    const user = useStore(state => state.user);
    const setWaitlist = useStore(state => state.setWaitlist);
    const [status, setStatus] = useState({ joined: false, rank: '...', inviteCode: '...' });
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const data = await getWaitlistStatus();
            setStatus(data);
            // Sync with global store
            setWaitlist(data.joined, data.rank);
        } catch (error) {
            console.error('Waitlist status error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        setJoining(true);
        try {
            await joinPhase2Waitlist();
            await fetchStatus();
        } catch (error) {
            console.error('Join waitlist error:', error);
        } finally {
            setJoining(false);
        }
    };

    const copyInvite = () => {
        navigator.clipboard.writeText(status.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const phase2Features = [
        { icon: <Users size={24} />, title: "Artisan Cloud", desc: "Compare retail furniture to custom artisan fabrication in real time." },
        { icon: <ScanLine size={24} />, title: "Video-to-3D", desc: "Record a room walkthrough and navigate a fully reconstructed 3D model." },
        { icon: <Camera size={24} />, title: "AR Pro Live View", desc: "See real catalog products placed in your actual space — live and accurate." },
        { icon: <ShoppingBag size={24} />, title: "Smart Sourcing Engine", desc: "Auto-scan 50+ verified vendors for price, lead time, and quality." },
        { icon: <Box size={24} />, title: "3D Real-time Staging", desc: "Drag and drop real furniture into photorealistic spatial models." },
        { icon: <Sparkles size={24} />, title: "AI Architectural Advisory", desc: "Deep design consultations merging Vastu wisdom with modern physics." }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-main flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-main pt-32 pb-20 px-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/3 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-start">
                
                {/* Left: Info & Features */}
                <div className="animate-fade-in-up">
                    <span className="section-tag mb-6 inline-block">Phase 2 Early Access</span>
                    <h1 className="font-serif text-5xl md:text-7xl font-black text-main leading-tight italic mb-8">
                        The Future of <br />
                        <span className="text-gradient-gold not-italic">Interior Intelligence</span>
                    </h1>
                    <p className="text-lg text-muted font-light leading-relaxed mb-12 max-w-xl">
                        A2S Phase 2 marks the arrival of our most powerful tools. From video scanning to artisan marketplaces, we're building the first complete spatial ecosystem.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-6">
                        {phase2Features.map((feat, i) => (
                            <div key={i} className="p-6 rounded-[32px] bg-surface border border-premium hover:border-accent/30 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                                    {feat.icon}
                                </div>
                                <h3 className="font-serif text-lg font-black text-main italic mb-2">{feat.title}</h3>
                                <p className="text-[10px] text-muted leading-relaxed uppercase tracking-wider">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Waitlist Card */}
                <div className="sticky top-32 animate-fade-in-up stagger-1">
                    <div className="glass-premium p-10 rounded-[48px] border border-premium shadow-premium relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 h-full w-1/2 bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
                        
                        {!status.joined ? (
                            <div className="space-y-4">
                                <div className="p-7 rounded-[30px] bg-white border border-premium shadow-sm">
                                    <p className="text-[10px] text-accent uppercase tracking-[0.35em] font-black mb-2">Your Position</p>
                                    <p className="font-serif text-6xl font-black text-main italic leading-none">{status.rank}</p>
                                    <p className="text-sm text-muted mt-3">You are currently placed in the active queue for Phase 2 access.</p>
                                </div>

                                <div className="p-7 rounded-[30px] bg-main text-white border border-main shadow-lg">
                                    <p className="text-[10px] uppercase tracking-[0.35em] font-black mb-3 flex items-center gap-2 text-accent">
                                        <Share2 size={12} />
                                        Referral Code
                                    </p>
                                    <div className="flex gap-3 items-center">
                                        <div className="flex-1 px-5 py-4 rounded-2xl bg-white/10 border border-white/15 font-mono text-base tracking-[0.24em] truncate">
                                            {status.inviteCode}
                                        </div>
                                        <button
                                            onClick={copyInvite}
                                            className="w-14 h-14 rounded-2xl border border-white/15 flex items-center justify-center bg-white text-main hover:bg-accent hover:text-white transition-all"
                                            aria-label="Copy referral code"
                                        >
                                            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                    <p className="text-sm text-white/75 mt-3">Share this code if you want referral credit to be applied to your account.</p>
                                </div>

                                <button
                                    onClick={handleJoin}
                                    disabled={joining || status.joined}
                                    className="w-full px-6 py-4 rounded-2xl bg-accent text-main font-black uppercase tracking-[0.2em] shadow-lg disabled:opacity-60"
                                >
                                    {joining ? 'Joining...' : 'Join Waitlist'}
                                </button>

                                <div className="p-6 rounded-[24px] bg-accent/5 border border-accent/20 flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                                        <Info size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-main uppercase tracking-wider mb-1">Credit System Reminder</p>
                                        <p className="text-[10px] text-muted leading-relaxed">
                                            Referral credits can be used to renew your <span className="text-main font-bold">AI Consultant</span> sessions.
                                            Note: <span className="text-main font-bold">Vastu Audit</span> limits are fixed and cannot be increased via referrals.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-7 rounded-[30px] bg-white border border-premium shadow-sm text-center">
                                    <p className="text-[10px] text-accent uppercase tracking-[0.35em] font-black mb-2">Joined</p>
                                    <p className="font-serif text-4xl font-black text-main italic leading-tight">You’re in the waitlist</p>
                                    <p className="text-sm text-muted mt-3">Your position is updated automatically as new seats open.</p>
                                </div>

                                <div className="p-6 rounded-[24px] bg-accent/5 border border-accent/20 flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                                        <Info size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-main uppercase tracking-wider mb-1">Referral Code</p>
                                        <p className="text-sm text-main font-mono tracking-[0.2em]">{status.inviteCode}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-8 text-muted/30">
                        <Users size={24} />
                        <Compass size={24} />
                        <Box size={24} />
                        <Camera size={24} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Waitlist;
