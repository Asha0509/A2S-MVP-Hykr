import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Send, CheckCircle2 } from 'lucide-react';
import { subscribeToDesignTips } from '../services/api';

const socialLinks = [
    { Icon: Instagram, url: 'https://www.instagram.com/aestheticstospaces', label: 'Follow us on Instagram' },
    { Icon: Twitter,   url: 'https://x.com/A2S_India',   label: 'Follow us on Twitter/X' },
    { Icon: Linkedin,  url: 'https://www.linkedin.com/company/aesthetics-to-spaces/',  label: 'Connect on LinkedIn' },
];

const Footer = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const res = await subscribeToDesignTips(email);
            setStatus('success');
            setMessage(res.message);
            setEmail('');
        } catch (err) {
            setStatus('error');
            setMessage(err);
        }
    };

    return (
        <footer className="bg-main text-main pt-16 pb-10 mt-24 border-t border-premium transition-all duration-1000" role="contentinfo" aria-label="Site footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
                            <h3 className="font-serif text-2xl font-black text-white italic tracking-tighter">A2S</h3>
                        </div>
                        <p className="text-muted text-sm leading-relaxed font-light">
                            Democratizing bespoke interior design for every Indian home. High-fidelity visualization meets artisan sourcing.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Explore</h4>
                        <ul className="space-y-4 text-sm text-main/70 font-medium">
                            <li><Link to="/gallery" className="hover:text-accent transition-all duration-300">Explore Gallery</Link></li>
                            <li><Link to="/vastu-score" className="hover:text-accent transition-all duration-300">Vastu Score</Link></li>
                            <li><Link to="/onboarding" className="hover:text-accent transition-all duration-300">Find Your Style</Link></li>
                            <li><Link to="/waitlist" className="hover:text-accent transition-all duration-300">Phase 2 Waitlist</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Company</h4>
                        <ul className="space-y-4 text-sm text-main/70 font-medium">
                            <li><Link to="/dashboard" className="hover:text-accent transition-all duration-300">Dashboard</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-accent transition-all duration-300">Privacy Policy</Link></li>
                            <li><Link to="/terms-of-service" className="hover:text-accent transition-all duration-300">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Follow Us</h4>
                        <div className="flex gap-4 mb-10">
                            {socialLinks.map(({ Icon, url, label }, i) => (
                                <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-muted hover:text-accent hover:bg-accent/10 border border-white/5 transition-all duration-500 hover:-translate-y-1"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                        
                        <div className="mt-8">
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">Design Tips</p>
                            <form onSubmit={handleSubscribe} className="relative group">
                                <div className="flex rounded-[20px] overflow-hidden border border-white/10 group-hover:border-accent/40 bg-surface focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-500">
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email" 
                                        className="bg-transparent text-main text-xs px-5 py-4 w-full focus:outline-none placeholder:text-white/20 font-medium" 
                                        required
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={status === 'loading'}
                                        className="bg-accent text-on-accent px-6 py-4 text-xs font-black uppercase tracking-widest hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {status === 'loading' ? '...' : 'Go'}
                                    </button>
                                </div>
                                {status === 'success' && (
                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-400 animate-fade-in uppercase tracking-widest">
                                        <CheckCircle2 size={14} /> {message}
                                    </div>
                                )}
                                {status === 'error' && (
                                    <div className="mt-4 text-[10px] font-bold text-rose-500 animate-fade-in uppercase tracking-widest">
                                        {message}
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 mt-20 pt-10 text-center">
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">
                        &copy; 2026 A2S Design Technologies. Crafted with architectural precision in India.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
