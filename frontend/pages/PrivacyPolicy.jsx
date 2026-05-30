import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-main pt-32 pb-20 px-4">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-accent hover:text-main transition-colors mb-12">
                    <ArrowLeft size={14} /> Back to Home
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="font-serif text-4xl font-black text-main italic">Privacy Policy</h1>
                        <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em] mt-2">Last updated: February 2026</p>
                    </div>
                </div>

                <div className="glass-premium p-10 md:p-16 rounded-[48px] border border-premium space-y-10 text-main/80 font-light leading-relaxed">
                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">1. Information We Collect</h2>
                        <p>When you join our waitlist or use Aesthetics To Spaces, we collect:</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li><strong>Contact Information:</strong> Name, email address, phone number (optional), city, and country</li>
                            <li><strong>Preference Data:</strong> Home type, budget range, design preferences, and room interests</li>
                            <li><strong>Usage Data:</strong> How you interact with our platform, referral activity</li>
                            <li><strong>Device Information:</strong> Browser type, IP address (for country detection)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">2. How We Use Your Information</h2>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li>To manage your waitlist position and notify you about launch updates</li>
                            <li>To personalize your experience and product recommendations</li>
                            <li>To process referrals and track queue positions</li>
                            <li>To improve our platform based on aggregated, anonymized usage patterns</li>
                            <li>To communicate important updates about A2S</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">3. Data Storage & Security</h2>
                        <p>Your data is securely stored in Microsoft Azure Cosmos DB with enterprise-grade encryption. We implement industry-standard security measures including HTTPS encryption, secure API endpoints, and access controls. We do not store payment information as we do not process transactions directly.</p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">4. Data Sharing</h2>
                        <p>We do not sell your personal data. We may share data only in these limited cases:</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li><strong>Service Providers:</strong> Cloud hosting (Microsoft Azure) for data storage</li>
                            <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
                            <li><strong>Business Transfer:</strong> In case of merger or acquisition (with prior notice)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">5. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li>Access the personal data we hold about you</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt out of marketing communications</li>
                            <li>Export your data in a portable format</li>
                        </ul>
                        <p className="mt-4 text-xs font-bold text-accent">To exercise these rights, email us at <a href="mailto:hello@mail.aestheticstospaces.tech" className="underline">hello@mail.aestheticstospaces.tech</a></p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">6. Data Retention</h2>
                        <p>We retain your waitlist data until you request deletion or until 2 years after our platform launch, whichever comes first. Active user data is retained as long as you maintain an account.</p>
                    </section>

                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-main mb-4">7. Contact Us</h2>
                        <p>For privacy-related questions or concerns, contact us at: <a href="mailto:hello@mail.aestheticstospaces.tech" className="font-bold text-accent">hello@mail.aestheticstospaces.tech</a></p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
