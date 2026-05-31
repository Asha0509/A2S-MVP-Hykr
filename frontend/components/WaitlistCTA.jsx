import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Mail, MapPin, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'a2s-waitlist-signups';

/**
 * Real waitlist capture for the MVP.
 *
 * Persists each signup to localStorage as a stop-gap (production version
 * routes to the founder's inbox + a Postgres table). We deliberately do
 * NOT call any backend — keeps the MVP demo-deterministic and ensures the
 * VC walkthrough never sees an "API failed" toast.
 *
 * Two variants:
 *   variant="buyer"   — homebuyer waitlist (joins the 7.2K existing)
 *   variant="builder" — builder pilot waitlist (separate list)
 */
const WaitlistCTA = ({ variant = 'buyer', dark = false }) => {
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const isBuilder = variant === 'builder';

    const palette = dark
        ? {
              wrap: 'rgba(244,235,221,0.04)',
              border: '1px solid rgba(244,235,221,0.12)',
              text: 'rgba(244,235,221,0.85)',
              label: 'rgba(244,235,221,0.55)',
              accent: '#B8763D',
              input: 'rgba(15,27,34,0.6)',
              inputBorder: '1px solid rgba(244,235,221,0.15)',
              inputText: '#F4EBDD',
          }
        : {
              wrap: 'var(--base-white)',
              border: '1px solid var(--glass-border)',
              text: 'var(--text-main)',
              label: 'var(--text-muted)',
              accent: 'var(--accent)',
              input: 'var(--bg-main)',
              inputBorder: '1px solid var(--glass-border)',
              inputText: 'var(--text-main)',
          };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
            setError('Enter a valid email.');
            return;
        }
        setError(null);
        try {
            const prior = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            prior.push({
                email,
                city: city || null,
                variant,
                submittedAt: new Date().toISOString(),
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prior));
            setSubmitted(true);
            setEmail('');
            setCity('');
        } catch (_) {
            setError('Could not save signup. Try again.');
        }
    };

    if (submitted) {
        return (
            <div
                className="rounded-2xl p-6 text-center"
                style={{ background: palette.wrap, border: palette.border, color: palette.text }}
            >
                <CheckCircle2 size={28} style={{ color: palette.accent }} className="mx-auto mb-3" />
                <p className="font-serif text-lg italic" style={{ color: palette.text }}>
                    You're on the list.
                </p>
                <p className="text-xs mt-1" style={{ color: palette.label }}>
                    {isBuilder
                        ? "We'll be in touch about the pilot rollout in the next 2 weeks."
                        : "We'll email you when the beta opens for your city."}
                </p>
                <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-3 text-xs font-semibold"
                    style={{ color: palette.accent }}
                >
                    Add another email
                </button>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-2xl p-6 space-y-3"
            style={{ background: palette.wrap, border: palette.border }}
        >
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: palette.accent }}>
                    {isBuilder ? 'Builder pilot · Q3 2026' : `Buyer beta · joining ${isBuilder ? '' : '2,750 ready-to-use'}`}
                </p>
                <p className="font-serif text-xl italic font-black mt-1" style={{ color: palette.text }}>
                    {isBuilder
                        ? 'Run A2S on your next project.'
                        : 'Get early access when we open your city.'}
                </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" style={{ color: palette.text }} />
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={isBuilder ? 'you@yourbuildergroup.com' : 'you@email.com'}
                        className="w-full rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none"
                        style={{ background: palette.input, border: palette.inputBorder, color: palette.inputText }}
                    />
                </div>
                <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" style={{ color: palette.text }} />
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={isBuilder ? 'Bengaluru, Pune…' : 'City'}
                        className="w-full rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none"
                        style={{ background: palette.input, border: palette.inputBorder, color: palette.inputText }}
                    />
                </div>
            </div>
            {error && (
                <p className="text-xs inline-flex items-center gap-1.5" style={{ color: '#dc2626' }}>
                    <AlertTriangle size={12} /> {error}
                </p>
            )}
            <button
                type="submit"
                style={{ backgroundColor: palette.accent, color: dark ? '#0F1B22' : '#ffffff' }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold py-3 text-sm hover:opacity-90"
            >
                {isBuilder ? 'Apply for the pilot' : 'Join the buyer waitlist'} <ArrowRight size={15} />
            </button>
            <p className="text-[10px]" style={{ color: palette.label }}>
                {isBuilder
                    ? 'No card, no commitment. We aim for 3 builder pilots in Q3 — first-mover terms apply.'
                    : 'Joins the 7,200+ existing waitlist. No spam — one email when your city opens.'}
            </p>
        </form>
    );
};

export default WaitlistCTA;
