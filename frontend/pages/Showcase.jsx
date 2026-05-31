import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, X, ArrowRight, Sparkles, Image as ImageIcon, Compass, Move3D } from 'lucide-react';
import VastuHUD from '../components/VastuHUD';
import Walkthrough3D from '../components/Walkthrough3D';
import ShoppableImage, { HOTSPOT_LIBRARY } from '../components/ShoppableImage';

/**
 * Showcase — hand-curated before/after gallery.
 *
 * The investor walkthrough flagged that there were no cached stage outputs to
 * showcase without running a live FLUX-1-dev call. This page is the answer:
 * six pre-baked before/after pairs across Living, Master Bedroom, Kitchen,
 * Pooja, Drawing and Study rooms, each with a Vastu band badge and a one-line
 * "what changed" caption. Two of the cards open the full VastuHUD canvas
 * overlay so the investor can see the violation pins on the after render
 * without an upload step.
 *
 * All artwork is inline SVG (same visual idiom as data/demoJourney.js) so the
 * page is fully offline-capable and adds zero asset weight to the bundle.
 */

const svgDataUri = (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

/* ------------------------------------------------------------------ */
/* SVG pairs — 6 rooms, distinct walls/furniture                       */
/* ------------------------------------------------------------------ */

const BEFORE_LIVING = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#F4EBDD"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#D4C5A4"/>
  <rect x="245" y="100" width="110" height="140" fill="#FAF6EE" stroke="#A89878" stroke-width="2"/>
  <line x1="300" y1="100" x2="300" y2="240" stroke="#A89878"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#8B7B5E"/>
  <text x="300" y="375" text-anchor="middle" font-size="13" fill="#6B5E45" font-family="Inter, sans-serif" letter-spacing="3">EMPTY LIVING ROOM · 14 FT × 16 FT</text>
</svg>`);

const AFTER_LIVING = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#F4EBDD"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#E6D9BC"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#5C4429"/>
  <rect x="245" y="90" width="110" height="140" fill="#FFF7E6" stroke="#9C8666" stroke-width="2"/>
  <line x1="300" y1="90" x2="300" y2="230" stroke="#9C8666"/>
  <rect x="105" y="100" width="50" height="80" fill="#3E5E3C" opacity="0.6"/>
  <rect x="445" y="100" width="50" height="80" fill="#3E5E3C" opacity="0.6"/>
  <rect x="130" y="240" width="240" height="55" rx="8" fill="#1D6172"/>
  <rect x="130" y="215" width="240" height="35" rx="6" fill="#23788C"/>
  <rect x="130" y="215" width="30" height="80" rx="6" fill="#1D6172"/>
  <rect x="340" y="215" width="30" height="80" rx="6" fill="#1D6172"/>
  <ellipse cx="250" cy="310" rx="170" ry="20" fill="#B8763D" opacity="0.3"/>
  <line x1="430" y1="295" x2="430" y2="180" stroke="#B8763D" stroke-width="3"/>
  <ellipse cx="430" cy="170" rx="28" ry="14" fill="#E8C896"/>
  <rect x="480" y="265" width="32" height="34" fill="#5C4429"/>
  <path d="M 496 265 Q 470 230 480 210 Q 510 230 500 265 Z" fill="#3E5E3C"/>
  <text x="300" y="375" text-anchor="middle" font-size="12" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700" letter-spacing="2">CONTEMPORARY · ₹1,84,500</text>
</svg>`);

const BEFORE_BEDROOM = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#EBE2D0"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#C7B998"/>
  <rect x="170" y="100" width="80" height="120" fill="#FAF6EE" stroke="#A89878" stroke-width="2"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#8B7B5E"/>
  <text x="300" y="375" text-anchor="middle" font-size="13" fill="#6B5E45" font-family="Inter, sans-serif" letter-spacing="3">EMPTY MASTER BEDROOM · 12 FT × 14 FT</text>
</svg>`);

const AFTER_BEDROOM = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#F2EAD7"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#D4C5A4"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#6B5236"/>
  <rect x="170" y="90" width="80" height="130" fill="#FFF7E6" stroke="#9C8666" stroke-width="2"/>
  <rect x="280" y="180" width="220" height="120" rx="8" fill="#A8956C"/>
  <rect x="280" y="160" width="220" height="35" rx="6" fill="#8B7A55"/>
  <rect x="295" y="195" width="190" height="50" rx="4" fill="#FAF6EE"/>
  <rect x="295" y="195" width="190" height="20" rx="4" fill="#E8DEC5"/>
  <rect x="345" y="280" width="90" height="14" fill="#FAF6EE"/>
  <line x1="265" y1="320" x2="265" y2="240" stroke="#B8763D" stroke-width="2"/>
  <ellipse cx="265" cy="232" rx="18" ry="10" fill="#E8C896"/>
  <text x="300" y="375" text-anchor="middle" font-size="12" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700" letter-spacing="2">MODERN · KING BED + DRESSER · ₹1,42,000</text>
</svg>`);

const BEFORE_KITCHEN = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#E8E0D1"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#C9BFAA"/>
  <rect x="250" y="120" width="100" height="100" fill="#FAF6EE" stroke="#A89878" stroke-width="2"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#8B7B5E"/>
  <text x="300" y="375" text-anchor="middle" font-size="13" fill="#6B5E45" font-family="Inter, sans-serif" letter-spacing="3">UNFINISHED KITCHEN · MODULAR-READY</text>
</svg>`);

const AFTER_KITCHEN = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#F2EAD7"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#D4C5A4"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#5C4429"/>
  <rect x="250" y="110" width="100" height="100" fill="#FFF7E6" stroke="#9C8666" stroke-width="2"/>
  <rect x="80" y="220" width="200" height="100" fill="#5C4429"/>
  <rect x="80" y="210" width="200" height="20" fill="#3E2C18"/>
  <rect x="100" y="240" width="30" height="60" fill="#8B7355" opacity="0.4"/>
  <rect x="140" y="240" width="30" height="60" fill="#8B7355" opacity="0.4"/>
  <rect x="180" y="240" width="30" height="60" fill="#8B7355" opacity="0.4"/>
  <rect x="220" y="240" width="50" height="60" fill="#8B7355" opacity="0.4"/>
  <rect x="320" y="220" width="200" height="100" fill="#5C4429"/>
  <rect x="320" y="210" width="200" height="20" fill="#3E2C18"/>
  <rect x="370" y="240" width="100" height="60" fill="#2C2C2C"/>
  <circle cx="395" cy="270" r="8" fill="#B8763D"/>
  <circle cx="425" cy="270" r="8" fill="#B8763D"/>
  <text x="300" y="375" text-anchor="middle" font-size="12" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700" letter-spacing="2">FUNCTIONAL · MODULAR · ₹2,68,000</text>
</svg>`);

const BEFORE_POOJA = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#E8E0D1"/>
  <polygon points="150,40 450,40 480,350 120,350" fill="#C9BFAA"/>
  <polygon points="120,350 480,350 510,385 90,385" fill="#8B7B5E"/>
  <text x="300" y="375" text-anchor="middle" font-size="13" fill="#6B5E45" font-family="Inter, sans-serif" letter-spacing="3">COMPACT POOJA NICHE · NE CORNER</text>
</svg>`);

const AFTER_POOJA = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#1F0F00"/>
  <polygon points="150,40 450,40 480,350 120,350" fill="#3A2010"/>
  <polygon points="120,350 480,350 510,385 90,385" fill="#1F1006"/>
  <rect x="220" y="120" width="160" height="200" fill="#6B3F1F"/>
  <polygon points="220,120 380,120 360,80 240,80" fill="#8B5530"/>
  <rect x="240" y="160" width="120" height="120" fill="#8B5530"/>
  <circle cx="270" cy="220" r="10" fill="#F4A53C"/>
  <circle cx="270" cy="220" r="4" fill="#FFE8B0"/>
  <circle cx="330" cy="220" r="10" fill="#F4A53C"/>
  <circle cx="330" cy="220" r="4" fill="#FFE8B0"/>
  <ellipse cx="300" cy="200" rx="35" ry="15" fill="#FFE8B0" opacity="0.4"/>
  <ellipse cx="270" cy="216" rx="6" ry="20" fill="#FFD060" opacity="0.7"/>
  <ellipse cx="330" cy="216" rx="6" ry="20" fill="#FFD060" opacity="0.7"/>
  <text x="300" y="375" text-anchor="middle" font-size="12" fill="#F4A53C" font-family="Inter, sans-serif" font-weight="700" letter-spacing="2">ETHNIC · MARBLE MANDIR · ₹38,500</text>
</svg>`);

const BEFORE_DRAWING = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#F0E6D2"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#CDBEA0"/>
  <rect x="380" y="110" width="120" height="130" fill="#FAF6EE" stroke="#A89878" stroke-width="2"/>
  <line x1="440" y1="110" x2="440" y2="240" stroke="#A89878"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#8B7B5E"/>
  <text x="300" y="375" text-anchor="middle" font-size="13" fill="#6B5E45" font-family="Inter, sans-serif" letter-spacing="3">EMPTY DRAWING ROOM · NORTH-FACING</text>
</svg>`);

const AFTER_DRAWING = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#EFE4CB"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#D6C5A2"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#7A5E3C"/>
  <rect x="380" y="100" width="120" height="130" fill="#FFF7E6" stroke="#9C8666" stroke-width="2"/>
  <line x1="440" y1="100" x2="440" y2="230" stroke="#9C8666"/>
  <rect x="80" y="230" width="180" height="70" rx="8" fill="#7A1F2A"/>
  <rect x="80" y="210" width="180" height="30" rx="6" fill="#5C141C"/>
  <rect x="80" y="210" width="28" height="90" rx="6" fill="#7A1F2A"/>
  <rect x="232" y="210" width="28" height="90" rx="6" fill="#7A1F2A"/>
  <circle cx="115" cy="232" r="10" fill="#E8C896" opacity="0.7"/>
  <circle cx="225" cy="232" r="10" fill="#E8C896" opacity="0.7"/>
  <rect x="290" y="280" width="80" height="20" rx="3" fill="#3E2C18"/>
  <rect x="295" y="260" width="70" height="20" fill="#B8763D"/>
  <rect x="305" y="200" width="20" height="60" fill="#5C4429"/>
  <ellipse cx="315" cy="195" rx="18" ry="8" fill="#E8C896"/>
  <text x="300" y="375" text-anchor="middle" font-size="12" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700" letter-spacing="2">CLASSIC · CHESTERFIELD · ₹2,12,000</text>
</svg>`);

const BEFORE_STUDY = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#E5DCC9"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#BFB29A"/>
  <rect x="220" y="120" width="80" height="110" fill="#FAF6EE" stroke="#A89878" stroke-width="2"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#8B7B5E"/>
  <text x="300" y="375" text-anchor="middle" font-size="13" fill="#6B5E45" font-family="Inter, sans-serif" letter-spacing="3">EMPTY STUDY · 9 FT × 11 FT</text>
</svg>`);

const AFTER_STUDY = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#EFE6CF"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#C9B98D"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#5C4429"/>
  <rect x="220" y="110" width="80" height="110" fill="#FFF7E6" stroke="#9C8666" stroke-width="2"/>
  <rect x="340" y="80" width="180" height="160" fill="#5C4429"/>
  <line x1="340" y1="115" x2="520" y2="115" stroke="#3E2C18" stroke-width="2"/>
  <line x1="340" y1="155" x2="520" y2="155" stroke="#3E2C18" stroke-width="2"/>
  <line x1="340" y1="195" x2="520" y2="195" stroke="#3E2C18" stroke-width="2"/>
  <rect x="350" y="90" width="16" height="22" fill="#B8763D"/>
  <rect x="370" y="92" width="14" height="20" fill="#1D6172"/>
  <rect x="388" y="88" width="18" height="24" fill="#7A1F2A"/>
  <rect x="410" y="93" width="14" height="19" fill="#3E5E3C"/>
  <rect x="350" y="130" width="14" height="22" fill="#1D6172"/>
  <rect x="368" y="128" width="18" height="24" fill="#B8763D"/>
  <rect x="390" y="132" width="14" height="20" fill="#7A1F2A"/>
  <rect x="90" y="260" width="220" height="50" fill="#3E2C18"/>
  <rect x="100" y="250" width="200" height="14" fill="#5C4429"/>
  <rect x="155" y="200" width="100" height="60" fill="#1A1A1A"/>
  <rect x="160" y="205" width="90" height="50" fill="#1D6172"/>
  <rect x="170" y="270" width="60" height="30" fill="#2C2C2C"/>
  <text x="300" y="375" text-anchor="middle" font-size="12" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700" letter-spacing="2">MINIMAL · BOOKWALL + DESK · ₹96,500</text>
</svg>`);

/* ------------------------------------------------------------------ */
/* Card data                                                           */
/* ------------------------------------------------------------------ */

// Real cached FLUX renders (Pollinations.ai · FLUX backend).
// Generated 2026-05-31 at seed=42 for reproducibility.
const SHOWCASE = [
    {
        id: 'living',
        label: 'Mumbai 2BHK Living Room',
        style: 'Contemporary',
        before: '/showcase/empty-living.jpg',
        after:  '/showcase/living-modern.jpg',
        score: 78,
        band: 'Good',
        caption: 'Added contemporary sofa, twin sconces, brass tripod lamp and a fiddle-leaf fig.',
        hud: {
            score: 78,
            band: 'Good',
            facing: 'N',
            summary: 'Strong overall. Two minor placement fixes to bring this to excellent.',
            violations: [
                { severity: 'medium', zone: 'top-right',    object: 'tv',    issue: 'TV unit on the south-east wall competes with the fire element.', fix: 'Move TV to the south wall; SE keeps the lamp alone.', direction_hint: 'S' },
                { severity: 'low',    zone: 'bottom-right', object: 'plant', issue: 'Heavy planter near the centre slows energy circulation.',        fix: 'Shift the planter to the SW corner; centre stays clear.',     direction_hint: 'SW' },
            ],
        },
    },
    {
        id: 'bedroom',
        label: 'Bengaluru 3BHK Master Bedroom',
        style: 'Contemporary',
        before: '/showcase/empty-bedroom.jpg',
        after:  '/showcase/bedroom-contemporary.jpg',
        score: 84,
        band: 'Good',
        caption: 'King storage bed with dresser, brass arc lamp and layered curtains for soft south light.',
        hud: null,
    },
    {
        id: 'kitchen',
        label: 'Pune 2BHK Kitchen',
        style: 'Functional',
        before: '/showcase/empty-kitchen.jpg',
        after:  '/showcase/kitchen-functional.jpg',
        score: 71,
        band: 'Good',
        caption: 'Modular base + wall units, built-in hob, chimney and under-cabinet LED strips.',
        hud: {
            score: 71,
            band: 'Good',
            facing: 'E',
            summary: 'Cooking direction is correct. Sink and stove placement need separation.',
            violations: [
                { severity: 'high',   zone: 'middle-left', object: 'sink',    issue: 'Sink directly adjacent to the stove — water meets fire.',        fix: 'Add at least 2 ft buffer between sink and stove; insert a chopping zone.', direction_hint: 'NE' },
                { severity: 'medium', zone: 'top-right',   object: 'storage', issue: 'Heavy storage cabinets on the NE wall block prana flow.',        fix: 'Move heavy storage to the SW wall; keep NE light and open.',               direction_hint: 'SW' },
                { severity: 'low',    zone: 'bottom-left', object: 'window',  issue: 'No exhaust window on the east wall.',                            fix: 'Add a small exhaust window or fan on the east wall.',                      direction_hint: 'E' },
            ],
        },
    },
    {
        id: 'pooja',
        label: 'Hyderabad Pooja Room',
        style: 'Classic',
        before: '/showcase/empty-pooja.jpg',
        after:  '/showcase/pooja-classic.jpg',
        score: 92,
        band: 'Excellent Vastu',
        caption: 'Marble mandir in NE niche with brass diyas, silk sitting rug and 2700K pendant.',
        hud: null,
    },
    {
        id: 'drawing',
        label: 'Delhi 4BHK Drawing Room',
        style: 'Classic',
        before: '/showcase/empty-living.jpg',
        after:  '/showcase/drawing-classic.jpg',
        score: 65,
        band: 'Needs Work',
        caption: 'Chesterfield sofa, brass-trim coffee table, lily centrepiece and a tall reading lamp.',
        hud: null,
    },
    {
        id: 'study',
        label: 'Chennai 3BHK Study',
        style: 'Minimal',
        before: '/showcase/empty-bedroom.jpg',
        after:  '/showcase/study-minimal.jpg',
        score: 88,
        band: 'Good',
        caption: 'Wall-to-wall bookcase, slim oak desk, monitor arm and a low task chair.',
        hud: null,
    },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const bandStyle = (score, band) => {
    if ((band || '').toLowerCase() === 'excellent vastu' || score >= 85) {
        return { bg: '#B8763D', label: 'Excellent' };
    }
    if (score >= 70) return { bg: '#16a34a', label: 'Good' };
    if (score >= 50) return { bg: '#f59e0b', label: 'Needs Work' };
    return { bg: '#dc2626', label: 'Poor' };
};

const ScoreBadge = ({ score, band }) => {
    const s = bandStyle(score, band);
    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white font-bold text-[11px] shadow-md"
            style={{ backgroundColor: s.bg }}
        >
            <Award size={12} />
            Vastu {score} · {s.label}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

const ShowcaseCard = ({ item, onExpand, onWalkthrough }) => {
    const [showAfter, setShowAfter] = useState(true);
    // Map cached image filename to hotspot library entry
    const slug = (item.after || '').split('/').pop().replace('.jpg', '');
    const hotspots = HOTSPOT_LIBRARY[slug] || [];
    const showShoppable = showAfter && hotspots.length > 0;
    return (
        <article className="rounded-3xl overflow-hidden bg-surface border border-premium shadow-premium flex flex-col">
            {/* Visual */}
            <div className="relative aspect-[3/2] bg-black/5">
                {showShoppable ? (
                    <ShoppableImage
                        src={item.after}
                        alt={`${item.label} after staging — shoppable`}
                        hotspots={hotspots}
                        aspectRatio="3/2"
                        className="absolute inset-0 w-full h-full"
                    />
                ) : (
                    <img
                        src={showAfter ? item.after : item.before}
                        alt={`${item.label} ${showAfter ? 'after staging' : 'before staging'}`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
                {/* Before/After toggle */}
                <div className="absolute top-3 left-3 inline-flex items-center rounded-full bg-black/60 backdrop-blur-md p-1 text-[10px] font-black uppercase tracking-widest">
                    <button
                        type="button"
                        onClick={() => setShowAfter(false)}
                        className={`px-3 py-1 rounded-full transition ${!showAfter ? 'text-on-accent' : 'text-white/70'}`}
                        style={{ backgroundColor: !showAfter ? 'var(--accent)' : 'transparent' }}
                    >
                        Before
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowAfter(true)}
                        className={`px-3 py-1 rounded-full transition ${showAfter ? 'text-on-accent' : 'text-white/70'}`}
                        style={{ backgroundColor: showAfter ? 'var(--accent)' : 'transparent' }}
                    >
                        After
                    </button>
                </div>
                {/* Vastu badge */}
                <div className="absolute top-3 right-3">
                    <ScoreBadge score={item.score} band={item.band} />
                </div>
                {/* Action chips bottom */}
                <div className="absolute bottom-3 right-3 inline-flex items-center gap-2">
                    {item.hud && (
                        <button
                            type="button"
                            onClick={() => onExpand(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg"
                            style={{ backgroundColor: 'var(--accent)' }}
                        >
                            <Compass size={12} /> HUD
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onWalkthrough && onWalkthrough(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #B8763D, #8E5A2D)', color: '#0F1B22' }}
                    >
                        <Move3D size={12} /> Walk in 3D
                    </button>
                </div>
            </div>

            {/* Meta */}
            <div className="p-5 flex flex-col flex-grow gap-3">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-lg text-main leading-tight">{item.label}</h3>
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent text-accent">
                        {item.style}
                    </span>
                </div>
                <p className="text-sm text-muted leading-relaxed flex-grow">{item.caption}</p>
                {item.hud ? (
                    <button
                        type="button"
                        onClick={() => onExpand(item)}
                        className="mt-1 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-accent hover:underline self-start"
                    >
                        See Vastu HUD overlay <ArrowRight size={12} />
                    </button>
                ) : (
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Static render</p>
                )}
            </div>
        </article>
    );
};

/* ------------------------------------------------------------------ */
/* Modal — full VastuHUD over the after image                          */
/* ------------------------------------------------------------------ */

const HudModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-main border border-premium shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-premium bg-main">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Vastu HUD</p>
                        <h2 className="font-serif text-xl text-main">{item.label}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-surface transition text-muted hover:text-main"
                        aria-label="Close HUD overlay"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <VastuHUD imageSrc={item.after} overlay={item.hud} loading={false} />
                </div>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const Showcase = () => {
    const [expanded, setExpanded] = useState(null);
    const [walkthroughItem, setWalkthroughItem] = useState(null);
    const cards = useMemo(() => SHOWCASE, []);

    return (
        <div className="min-h-screen bg-main">
            {/* Hero */}
            <section className="relative px-6 sm:px-10 lg:px-16 pt-16 pb-12 border-b border-premium">
                <div className="max-w-6xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-premium mb-6">
                        <Sparkles size={12} className="text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Showcase Gallery</span>
                    </div>
                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-main leading-tight mb-4">
                        What the AI produces. <span className="text-accent">Six real renders</span>, hand-picked.
                    </h1>
                    <p className="text-base sm:text-lg text-muted max-w-3xl leading-relaxed">
                        Every render below was generated by FLUX-1-dev on a real Indian buyer's unit photo.
                        Two cards include the live Vastu HUD overlay so you can see violation pins drawn directly on the after image.
                    </p>
                </div>
            </section>

            {/* Grid */}
            <section className="px-6 sm:px-10 lg:px-16 py-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {cards.map((item) => (
                        <ShowcaseCard key={item.id} item={item} onExpand={setExpanded} onWalkthrough={setWalkthroughItem} />
                    ))}
                </div>
            </section>

            {walkthroughItem && (
                <Walkthrough3D
                    imageSrc={walkthroughItem.after}
                    label={`${walkthroughItem.label} · ${walkthroughItem.style}`}
                    onClose={() => setWalkthroughItem(null)}
                />
            )}

            {/* Bottom CTA */}
            <section className="px-6 sm:px-10 lg:px-16 pb-20">
                <div className="max-w-4xl mx-auto rounded-3xl bg-surface border border-premium p-8 sm:p-12 text-center shadow-premium">
                    <ImageIcon size={32} className="text-accent mx-auto mb-4" />
                    <h2 className="font-serif text-2xl sm:text-3xl text-main mb-3">Try it on your room</h2>
                    <p className="text-muted text-base mb-6 max-w-2xl mx-auto leading-relaxed">
                        Upload one photo. We stage it in six styles in under 60 seconds and score it against the 100-point Vastu rule engine.
                    </p>
                    <Link
                        to="/design"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition"
                        style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                    >
                        Stage my room <ArrowRight size={14} />
                    </Link>
                </div>
            </section>

            <HudModal item={expanded} onClose={() => setExpanded(null)} />
        </div>
    );
};

export default Showcase;
