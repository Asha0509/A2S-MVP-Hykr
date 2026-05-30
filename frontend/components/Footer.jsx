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
                            AI infrastructure for India's residential construction industry. Builders embed our buyer journey; their homebuyers walk away with a fully designed, Vastu-compliant home.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Product</h4>
                        <ul className="space-y-4 text-sm text-main/70 font-medium">
                            <li><Link to="/builder" className="hover:text-accent transition-all duration-300">Builder Workspace</Link></li>
                            <li><Link to="/design" className="hover:text-accent transition-all duration-300">Buyer Journey</Link></li>
                            <li><Link to="/vastu-hud" className="hover:text-accent transition-all duration-300">Vastu HUD</Link></li>
                            <li><Link to="/embed-demo" className="hover:text-accent transition-all duration-300">See the embed</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Company</h4>
                        <ul className="space-y-4 text-sm text-main/70 font-medium">
                            <li><Link to="/about" className="hover:text-accent transition-all duration-300">About the founder</Link></li>
                            <li><a href="https://github.com/Asha0509/A2S-MVP-Hykr" target="_blank" rel="noopener" className="hover:text-accent transition-all duration-300">Open source on GitHub</a></li>
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
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">Talk to the founder</p>
                            <Link
                                to="/about"
                                className="block rounded-[20px] border border-white/10 hover:border-accent/40 bg-surface px-5 py-4 text-xs font-semibold text-main hover:text-accent transition-all duration-500"
                            >
                                Builder pilots, press, partnerships
                                <span className="text-accent ml-1">→</span>
                            </Link>
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
