import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-main pt-32 pb-20 px-4">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-accent hover:text-main transition-colors mb-12">
                    <ArrowLeft size={14} /> Back to Home
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="font-serif text-4xl font-black text-main italic">Terms of Service</h1>
                        <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em] mt-2">Last updated: February 2026</p>
                    </div>
                </div>

                <div className="glass-premium p-10 md:p-16 rounded-[48px] border border-premium space-y-10 text-main/80 font-light leading-relaxed">
                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing or using Aesthetics To Spaces ("A2S", "we", "our", or "the platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">2. Description of Service</h2>
                        <p>Aesthetics To Spaces is an AI-powered home design discovery platform that provides:</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li>Room-specific furniture and decor catalogs</li>
                            <li>Cross-platform price comparison and intelligence</li>
                            <li>AI-powered design recommendations</li>
                            <li>Product discovery from multiple retailers</li>
                        </ul>
                        <p className="mt-4 text-xs font-bold text-accent italic">Important: A2S is a discovery and comparison platform. We do not sell furniture directly. All purchases are made through third-party retailers.</p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">3. Waitlist & Early Access</h2>
                        <p>By joining our waitlist, you understand that:</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li>Your position in the queue is determined by signup time and referral activity</li>
                            <li>Referral bonuses (2 spots per referral) are applied automatically</li>
                            <li>Early access is not guaranteed and depends on launch capacity</li>
                            <li>We may contact you via email for launch updates and beta testing opportunities</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">4. User Responsibilities</h2>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li>Provide accurate and complete information when signing up</li>
                            <li>Not use the platform for any unlawful purpose</li>
                            <li>Not attempt to manipulate waitlist positions through fraudulent means</li>
                            <li>Not scrape, copy, or redistribute our content without permission</li>
                            <li>Respect intellectual property rights of A2S and third-party retailers</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">5. Intellectual Property</h2>
                        <p>All content on A2S, including but not limited to text, graphics, logos, icons, images, and software, is the property of Aesthetics To Spaces or its content suppliers and is protected by Indian and international copyright laws. Product images and information belong to their respective retailers.</p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">6. Third-Party Links & Purchases</h2>
                        <p>A2S contains links to third-party retailer websites (Amazon, Pepperfry, Urban Ladder, IKEA, Flipkart, etc.). We are not responsible for the content, privacy practices, or transactions on these external sites. All purchases, returns, warranties, and customer service are handled directly by the respective retailers.</p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">7. Disclaimer of Warranties</h2>
                        <p>A2S is provided "as is" without warranties of any kind. We do not guarantee the accuracy of pricing information (which may change in real-time), product availability, or the quality of products sold by third-party retailers. AI recommendations are suggestions only and may not suit all preferences or spaces.</p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">8. Limitation of Liability</h2>
                        <p>To the maximum extent permitted by law, A2S shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform or purchases made through third-party retailers.</p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">9. Changes to Terms</h2>
                        <p>We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated revision date. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">10. Governing Law</h2>
                        <p>These terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka.</p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">11. Contact</h2>
                        <p>For questions about these terms, contact us at: <a href="mailto:hello@mail.aestheticstospaces.tech" className="font-bold text-accent text-accent">hello@mail.aestheticstospaces.tech</a></p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
