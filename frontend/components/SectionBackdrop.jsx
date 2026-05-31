import React from 'react';

/**
 * Reusable cinematic backdrop for hero sections. Three flavours:
 *   variant="dark"   — full dark teal gradient (matches CinematicHero on /)
 *   variant="warm"   — parchment cream + soft gold orbs (matches /pricing, /about)
 *   variant="midnight" — black to teal, no orbs (matches /vastu-hud, /methodology)
 *
 * Adds the dot-grid radial-mask pattern + two blurred orbs. Children render on
 * top with `position: relative; z-index: 1`. Use inside a parent that sets
 * `overflow: hidden`.
 */
const SectionBackdrop = ({ variant = 'dark', children, className = '', minHeight = '60vh' }) => {
    const palettes = {
        dark: {
            background: 'linear-gradient(180deg, #0F1B22 0%, #142733 55%, #1D6172 100%)',
            color: '#F4EBDD',
            orb1: 'radial-gradient(closest-side, rgba(184,118,61,0.30), transparent 70%)',
            orb2: 'radial-gradient(closest-side, rgba(29,97,114,0.50), transparent 70%)',
            dotColor: 'rgba(244,235,221,0.06)',
        },
        warm: {
            background: 'linear-gradient(180deg, var(--bg-main) 0%, var(--base-parchment) 100%)',
            color: 'var(--text-main)',
            orb1: 'radial-gradient(closest-side, rgba(184,118,61,0.18), transparent 70%)',
            orb2: 'radial-gradient(closest-side, rgba(29,97,114,0.16), transparent 70%)',
            dotColor: 'rgba(29,97,114,0.05)',
        },
        midnight: {
            background: 'linear-gradient(180deg, #0A1116 0%, #0F1B22 70%, #142733 100%)',
            color: '#F4EBDD',
            orb1: 'radial-gradient(closest-side, rgba(184,118,61,0.22), transparent 70%)',
            orb2: 'radial-gradient(closest-side, rgba(29,97,114,0.45), transparent 70%)',
            dotColor: 'rgba(244,235,221,0.05)',
        },
    };
    const p = palettes[variant] || palettes.dark;
    return (
        <section
            className={`relative overflow-hidden ${className}`}
            style={{ background: p.background, color: p.color, minHeight }}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute"
                    style={{ top: '-12%', right: '-8%', width: 650, height: 650, background: p.orb1, filter: 'blur(20px)' }}
                />
                <div
                    className="absolute"
                    style={{ bottom: '-15%', left: '-10%', width: 750, height: 750, background: p.orb2, filter: 'blur(28px)' }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(${p.dotColor} 1px, transparent 1px)`,
                        backgroundSize: '24px 24px',
                        maskImage: 'radial-gradient(closest-side at 50% 30%, #000 30%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(closest-side at 50% 30%, #000 30%, transparent 80%)',
                    }}
                />
            </div>
            <div className="relative" style={{ zIndex: 1 }}>{children}</div>
        </section>
    );
};

export default SectionBackdrop;
